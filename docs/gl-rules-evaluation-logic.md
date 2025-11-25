# GL Rules Evaluation Logic

## Overview

GL (General Ledger) rules determine which GL accounts revenue and commission expenses are allocated to when processing bookings. The system uses a priority-based matching algorithm that runs independently for revenue and commission allocation.

## Database Schema

### Money Table
The money table contains financial records associated with bookings:
- `amount` - Revenue amount to be allocated
- `commission` - Commission expense amount to be allocated
- Associated with: `resource_id`, `product_type_id`, `product_sub_type_id`
- Linked to a reservation with a `travel_date`

### GL Rule Sets Table (`{tenant}_gl_rule_sets`)
Time-based containers for GL rules:
- `id` - Primary key
- `name` - Descriptive name (e.g., "Q1 2024 Revenue Rules")
- `start_date` - When this rule set becomes active
- `end_date` - When this rule set expires
- `type` - Either 'revenue' or 'commission'
- `deleted` - Soft delete flag
- `created_at`, `updated_at` - Timestamps

### GL Rules Table (`{tenant}_gl_rules`)
Individual allocation rules within a rule set:
- `id` - Primary key
- `gl_rule_set_id` - Foreign key to rule set
- `rule_type` - One of: 'resource', 'product_sub_type', 'product_type', 'default'
- `target_id` - ID of the specific resource/product type/sub-type (NULL for default rules)
- `account_id` - Which GL account to allocate to
- `deleted` - Soft delete flag
- `created_at`, `updated_at` - Timestamps

### Accounts Table (`{tenant}_accounts`)
GL account definitions:
- `id` - Primary key
- `name` - Descriptive name (e.g., "Ferry Revenue")
- `external_id` - GL account code in the accounting system (e.g., "4010")
- `deleted` - Soft delete flag
- `created_at`, `updated_at` - Timestamps

## Evaluation Logic

When a money record needs GL allocation, the system performs **two independent evaluations**:

### 1. Revenue Allocation (for `amount` field)

**Step 1: Find Active Revenue Rule Set**
- Query all revenue rule sets (`type = 'revenue'`) where `start_date <= travel_date AND end_date >= travel_date`
- This identifies which revenue rule set is active for the booking's travel date

**Step 2: Apply Priority-Based Matching**
Within the active revenue rule set, evaluate rules in priority order:

1. **Resource-Specific Rule** (Highest Priority)
   - Check if a rule exists where `rule_type = 'resource' AND target_id = money.resource_id`
   - If found → allocate `amount` to this rule's `account_id`

2. **Product Sub-Type Rule**
   - Check if a rule exists where `rule_type = 'product_sub_type' AND target_id = money.product_sub_type_id`
   - If found → allocate `amount` to this rule's `account_id`

3. **Product Type Rule**
   - Check if a rule exists where `rule_type = 'product_type' AND target_id = money.product_type_id`
   - If found → allocate `amount` to this rule's `account_id`

4. **Default Rule** (Fallback)
   - Check if a rule exists where `rule_type = 'default'`
   - Allocate `amount` to this rule's `account_id`

**Result**: The `amount` is allocated to the GL account specified by the first matching rule in the priority hierarchy.

### 2. Commission Allocation (for `commission` field)

**Step 1: Find Active Commission Rule Set**
- Query all commission rule sets (`type = 'commission'`) where `start_date <= travel_date AND end_date >= travel_date`
- This identifies which commission rule set is active for the booking's travel date

**Step 2: Apply Priority-Based Matching**
Within the active commission rule set, evaluate rules in priority order:

1. **Resource-Specific Rule** (Highest Priority)
   - Check if a rule exists where `rule_type = 'resource' AND target_id = money.resource_id`
   - If found → allocate `commission` to this rule's `account_id`

2. **Product Sub-Type Rule**
   - Check if a rule exists where `rule_type = 'product_sub_type' AND target_id = money.product_sub_type_id`
   - If found → allocate `commission` to this rule's `account_id`

3. **Product Type Rule**
   - Check if a rule exists where `rule_type = 'product_type' AND target_id = money.product_type_id`
   - If found → allocate `commission` to this rule's `account_id`

4. **Default Rule** (Fallback)
   - Check if a rule exists where `rule_type = 'default'`
   - Allocate `commission` to this rule's `account_id`

**Result**: The `commission` is allocated to the GL account specified by the first matching rule in the priority hierarchy.

## Key Principles

1. **Independence**: Revenue and commission allocations are completely independent. They use different rule sets and can result in different GL accounts.

2. **Time-Based Activation**: Rule sets are active based on the reservation's travel date, not the booking date or current date.

3. **Priority Hierarchy**: Rules are always evaluated in the same order (resource → product sub-type → product type → default). The first match wins.

4. **Fallback Safety**: Every rule set should have a default rule to ensure there's always a GL account to allocate to, even if no specific rules match.

5. **Separate Timelines**: Revenue rule sets and commission rule sets have independent timelines. They can have different date ranges and don't need to align.

## Example Scenario

**Booking Details:**
- Travel date: March 15, 2024
- Resource: Premium Ferry (id: 5)
- Product type: Ferry (id: 1)
- Product sub-type: Passenger Service (id: 3)
- Amount: $1000
- Commission: $100

**Active Revenue Rule Set (Q1 2024 Revenue):**
- Default rule → Account 4000 (General Revenue)
- Product type "Ferry" → Account 4010 (Ferry Revenue)
- Resource "Premium Ferry" → Account 4020 (Premium Revenue)

**Active Commission Rule Set (Q1 2024 Commissions):**
- Default rule → Account 5100 (General Commission Expense)
- Product type "Ferry" → Account 5110 (Ferry Commission Expense)

**Evaluation Results:**
1. **Revenue ($1000)**: Matches resource-specific rule → Allocated to Account 4020 (Premium Revenue)
2. **Commission ($100)**: Matches product type rule → Allocated to Account 5110 (Ferry Commission Expense)

The booking's revenue and commission are allocated to different GL accounts based on the priority-based matching within their respective rule sets.
