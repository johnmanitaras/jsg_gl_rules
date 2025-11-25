# Commission Profiles & Rules - Frontend Developer Guide

## Overview

Commission profiles define how commissions are calculated for clients. Each profile contains a set of rules that specify commission rates based on what's being sold (resources, product types, or product sub-types).

## Database Structure

### 1. `commission_profiles`
The main profile container assigned to clients.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `name` | VARCHAR(100) | Profile name (unique) |
| `deleted` | BOOLEAN | Soft delete flag (default: FALSE) |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### 2. `commission_rules`
Individual rules within a profile that define commission rates.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `commission_profile_id` | INTEGER | Foreign key to `commission_profiles` |
| `rule_type` | VARCHAR(50) | Type of rule (see below) |
| `target_id` | INTEGER | ID of the target entity (NULL for 'default') |
| `deleted` | BOOLEAN | Soft delete flag (default: FALSE) |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### 3. `product_sub_types`
Product sub-types (child of `product_types`).

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `product_type_id` | INTEGER | Foreign key to `product_types` |
| `name` | VARCHAR(100) | Sub-type name |
| `deleted` | BOOLEAN | Soft delete flag (default: FALSE) |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

## Rule Types & Priority

Rules are matched against money records in this priority order (highest to lowest):

| Priority | Rule Type | `target_id` References | Description |
|----------|-----------|------------------------|-------------|
| 1 (Highest) | `resource` | `resources.id` | Commission for a specific resource (vessel, bus, venue) |
| 2 | `product_sub_type` | `product_sub_types.id` | Commission for a product sub-type (e.g., "Day Ferry", "Dinner Cruise") |
| 3 | `product_type` | `product_types.id` | Commission for a product type (e.g., "Ferry", "Tour") |
| 4 (Lowest) | `default` | `NULL` | Default commission when no other rules match |

## Business Rules

### ✅ Validation Rules
1. **One Default Rule**: Each profile can have only ONE non-deleted `default` rule
2. **Target ID Requirement**:
   - `default` rules MUST have `target_id = NULL`
   - All other rule types MUST have a valid `target_id`
3. **Soft Deletes**: Never hard delete - set `deleted = TRUE` instead

### 🔍 Rule Matching Logic
When calculating commission for a money record:
1. Look up the money record's `resource_id`
2. Each resource has a `product_type_id` and `product_sub_type_id`
3. Check rules in priority order:
   - Does a `resource` rule exist for this specific resource?
   - If not, does a `product_sub_type` rule exist?
   - If not, does a `product_type` rule exist?
   - If not, use the `default` rule
4. Use the **first matching** (non-deleted) rule found

## Example Profile Structure

```json
{
  "profile": {
    "id": 1,
    "name": "Standard Travel Agent Commission",
    "deleted": false
  },
  "rules": [
    {
      "id": 1,
      "rule_type": "resource",
      "target_id": 42,  // Specific ferry vessel
      "commission_rate": 15.0
    },
    {
      "id": 2,
      "rule_type": "product_sub_type",
      "target_id": 3,  // "Dinner Cruise" sub-type
      "commission_rate": 20.0
    },
    {
      "id": 3,
      "rule_type": "product_type",
      "target_id": 1,  // "Ferry" type
      "commission_rate": 10.0
    },
    {
      "id": 4,
      "rule_type": "default",
      "target_id": null,
      "commission_rate": 5.0
    }
  ]
}
```

## Common UI Operations

### Creating a Profile
```sql
-- 1. Create the profile
INSERT INTO tta.commission_profiles (name)
VALUES ('VIP Agent Commission')
RETURNING id;

-- 2. Add rules
INSERT INTO tta.commission_rules
  (commission_profile_id, rule_type, target_id)
VALUES
  (1, 'default', NULL),
  (1, 'product_type', 2),
  (1, 'resource', 15);
```

### Listing Active Profiles
```sql
SELECT * FROM tta.commission_profiles
WHERE deleted = FALSE
ORDER BY name;
```

### Getting Profile with Rules
```sql
SELECT
  cp.id as profile_id,
  cp.name as profile_name,
  cr.id as rule_id,
  cr.rule_type,
  cr.target_id,
  CASE
    WHEN cr.rule_type = 'resource' THEN r.name
    WHEN cr.rule_type = 'product_sub_type' THEN pst.name
    WHEN cr.rule_type = 'product_type' THEN pt.name
    ELSE 'Default'
  END as target_name
FROM tta.commission_profiles cp
LEFT JOIN tta.commission_rules cr ON cp.id = cr.commission_profile_id
LEFT JOIN tta.resources r ON cr.rule_type = 'resource' AND cr.target_id = r.id
LEFT JOIN tta.product_sub_types pst ON cr.rule_type = 'product_sub_type' AND cr.target_id = pst.id
LEFT JOIN tta.product_types pt ON cr.rule_type = 'product_type' AND cr.target_id = pt.id
WHERE cp.deleted = FALSE AND (cr.deleted = FALSE OR cr.id IS NULL)
ORDER BY cp.name,
  CASE cr.rule_type
    WHEN 'resource' THEN 1
    WHEN 'product_sub_type' THEN 2
    WHEN 'product_type' THEN 3
    WHEN 'default' THEN 4
  END;
```

### Soft Deleting a Rule
```sql
UPDATE tta.commission_rules
SET deleted = TRUE
WHERE id = 123;
```

### Checking if Default Exists
Before creating a new default rule, check if one already exists:
```sql
SELECT COUNT(*) FROM tta.commission_rules
WHERE commission_profile_id = 1
  AND rule_type = 'default'
  AND deleted = FALSE;
```

## UI Recommendations

### Profile Management Screen
- **List View**: Show all non-deleted profiles
- **Create/Edit**:
  - Profile name field
  - Rules builder with dropdown for rule type
  - Cascading dropdown for target (based on rule type)
  - Visual indicator of priority (1-4 stars/badges)
- **Validation**:
  - Prevent multiple default rules
  - Require target_id for non-default rules
  - Show warning when deleting rules

### Rule Builder Component
```
Rule Type: [Dropdown: Resource / Product Sub-Type / Product Type / Default]
Target:    [Conditional Dropdown based on type above] (disabled for Default)
Rate:      [Numeric input with % symbol]

[Priority Badge] 🔥 High / ⭐ Medium / 📋 Low / 🔄 Default
```

### Priority Visual Indicators
- 🔥 **Resource** - Highest priority (red/orange)
- ⭐ **Product Sub-Type** - High priority (yellow)
- 📋 **Product Type** - Medium priority (blue)
- 🔄 **Default** - Fallback (gray)

## GraphQL Queries (if using Hasura)

### Get Profiles with Rules
```graphql
query GetCommissionProfiles {
  commission_profiles(where: {deleted: {_eq: false}}) {
    id
    name
    commission_rules(where: {deleted: {_eq: false}}, order_by: [{
      rule_type: asc
    }]) {
      id
      rule_type
      target_id
    }
  }
}
```

### Create Profile with Rules
```graphql
mutation CreateCommissionProfile($name: String!, $rules: [commission_rules_insert_input!]!) {
  insert_commission_profiles_one(object: {
    name: $name
    commission_rules: {
      data: $rules
    }
  }) {
    id
    name
  }
}
```

## Notes for Developers

- **Always filter by `deleted = FALSE`** in queries unless you specifically need historical data
- **Rule priority is enforced by application logic**, not database constraints
- The unique constraint on default rules only applies to non-deleted records
- Commission rate/percentage values are stored elsewhere (likely in a related table or JSON field) - these tables only define the matching rules
- When displaying rules, order them by priority for better UX
