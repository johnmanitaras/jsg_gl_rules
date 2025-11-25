# CLAUDE.md - JetSetGo GL Rules Management App

This file provides guidance to Claude Code when working with the jsg_gl_rules child app.

## Overview

**jsg_gl_rules** is a child application for managing General Ledger (GL) allocation rules in the JetSetGo platform. GL rules determine which GL accounts revenue and commission expenses are allocated to when bookings are processed.

### Business Context

Transport and tourism operators need to allocate revenue and commission expenses to the correct GL accounts for their accounting systems. GL rules provide a sophisticated, priority-based system for determining which account to use based on the booking characteristics:
- Revenue allocation (which GL account receives the revenue)
- Commission expense allocation (which GL account is charged for agent commissions)
- Priority-based matching (specific resource > product sub-type > product type > default)
- Time-based versioning (different rules for different periods)

This allows operators to have precise control over their chart of accounts without manual intervention.

## Application Architecture

### Two-Tab Navigation Structure

```
Tab 1: Manage Accounts          Tab 2: Manage Rules
┌─────────────────────┐         ┌─────────────────────┐
│ GL Accounts         │         │ Timeline View       │
│                     │         │                     │
│ ┌─────────────────┐ │         │ Revenue  Commission │
│ │ Name  Ext ID    │ │         │ ═══════  ═══════    │
│ │ Revenue 4000    │ │   +     │ [Set 1]  [Set 1]    │
│ │ Commissions 5100│ │ click   │ [Set 2]  [Set 2]    │
│ └─────────────────┘ │  rule   │                     │
│                     │  set    │ [+ Add]  [+ Add]    │
│ [+ Add Account]     │    ↓    │                     │
└─────────────────────┘         └─────────────────────┘
                                         ↓
                                  Rules Editor
                                ┌─────────────────────┐
                                │ "Q1 2024 Revenue"   │
                                │ Active ✓            │
                                │                     │
                                │ Rules:              │
                                │ • Default: 4000     │
                                │ • Ferry: 4010       │
                                │ • Premium: 4020     │
                                │                     │
                                │ [+ Add Rule]        │
                                └─────────────────────┘
```

### Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` or `/gl-rules` | `GLRulesApp` | Main page with tabs |
| `/gl-rules?tab=accounts` | `GLRulesApp` (Accounts tab) | Manage GL accounts |
| `/gl-rules?tab=rules` | `GLRulesApp` (Rules tab) | Timeline view with two lanes |
| `/gl-rules/rule-set/:ruleSetId` | `GLRuleSetEditor` | Rules editor for a specific rule set |

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Key Concepts

### GL Accounts

Accounts are the GL account codes that revenue and commissions can be allocated to. Each account has:
- **Name**: Descriptive name (e.g., "Ferry Revenue")
- **External ID**: The actual GL account code in the accounting system (e.g., "4010")

**Database Table:** `{tenant}_accounts`
```typescript
interface Account {
  id: number;
  name: string;
  external_id: string;
  deleted: boolean;
  created_at: string;
  updated_at: string;
}
```

### GL Rule Sets

Rule sets are time-based containers for GL rules. Unlike commissions which have profiles, GL rules use a simpler structure where rule sets are the top level. Each rule set has:
- **Type**: Either 'revenue' or 'commission' (determines which timeline lane it appears in)
- **Date range**: When this rule set is active
- **Name**: Descriptive name for the period (e.g., "Q1 2024 Revenue Rules")

**Database Table:** `{tenant}_gl_rule_sets`
```typescript
interface GLRuleSet {
  id: number;
  name: string;
  start_date: string;  // YYYY-MM-DD
  end_date: string;    // YYYY-MM-DD
  type: 'revenue' | 'commission';
  deleted: boolean;
  created_at: string;
  updated_at: string;
}
```

### GL Rules

Rules define which GL account to use based on booking characteristics. Each rule has a type that determines its priority (same hierarchy as commission rules):

| Priority | Rule Type | Description |
|----------|-----------|-------------|
| 1 (Highest) | `resource` | Specific resource (vessel, bus, venue) |
| 2 | `product_sub_type` | Product sub-type (e.g., "Dinner Cruise") |
| 3 | `product_type` | Product type (e.g., "Ferry") |
| 4 (Fallback) | `default` | Used when no other rules match |

**Database Table:** `{tenant}_gl_rules`
```typescript
interface GLRule {
  id: number;
  gl_rule_set_id: number;
  rule_type: 'resource' | 'product_sub_type' | 'product_type' | 'default';
  target_id: number | null;  // NULL for default rules
  account_id: number;  // Which GL account to use
  deleted: boolean;
  created_at: string;
  updated_at: string;
}
```

## Shared Timeline Component

The app uses the `@jetsetgo/shared-components` Timeline component for the rule set management view. This component **SUPPORTS MULTIPLE LANES** and will be configured with two lanes:

1. **Revenue Lane** - Shows revenue rule sets
2. **Commission Lane** - Shows commission rule sets

### Timeline Integration with Multiple Lanes

```typescript
import { Timeline } from '@jetsetgo/shared-components';
import type { TimelineVersion, TimelineGap, TimelineLane } from '@jetsetgo/shared-components';

// Create two lanes for revenue and commission
const lanes: TimelineLane[] = [
  { id: 0, name: 'Revenue Rules' },
  { id: 1, name: 'Commission Rules' }
];

// Convert rule sets to timeline versions, assigning lane based on type
const timelineVersions: TimelineVersion[] = ruleSets.map((rs) => ({
  id: rs.id,
  name: rs.name,
  start_date: rs.start_date,
  end_date: rs.end_date,
  created_at: rs.created_at,
  updated_at: rs.updated_at,
  lane_id: rs.type === 'revenue' ? 0 : 1, // Lane 0 for revenue, 1 for commission
}));

<Timeline
  versions={timelineVersions}
  lanes={lanes}
  onAddVersion={(gap, laneId) => handleAddRuleSet(gap, laneId)}
  onEditVersion={(v) => handleEditRuleSet(v)}
  onDeleteVersion={(v) => handleDeleteRuleSet(v)}
  getVersionLinkPath={(v) => `/gl-rules/rule-set/${v.id}`}
/>
```

The Timeline component:
- Renders each lane as a column
- Supports horizontal scrolling if there are more than 3 lanes
- Handles gap detection independently per lane
- Provides add buttons for gaps within each lane
- Passes `laneId` to the `onAddVersion` callback so we know if user is adding revenue or commission

## GraphQL Data Layer

All data operations use GraphQL via Hasura with tenant-aware table naming.

### Hooks

| Hook | Purpose |
|------|---------|
| `useAccounts` | CRUD for GL accounts |
| `useGLRuleSets` | CRUD for rule sets, overlap checking per type/lane |
| `useGLRules` | CRUD for rules, bulk operations |
| `useLookupData` | Fetch resources, product types, sub-types for rule targets |

### Key Operations

**Copy Rules Between Rule Sets:**
```typescript
const { fetchRulesByRuleSet, bulkCreateRules } = useGLRules();

// Fetch source rules
const sourceRules = await fetchRulesByRuleSet(sourceRuleSetId);

// Bulk create on new rule set
await bulkCreateRules(newRuleSetId, sourceRules.map(r => ({
  rule_type: r.rule_type,
  target_id: r.target_id,
  account_id: r.account_id,
})));
```

**Check Rule Set Overlap (within same type/lane):**
```typescript
const { checkOverlap } = useGLRuleSets();

// Only check overlap within the same type (revenue or commission)
const hasOverlap = await checkOverlap(
  ruleSetType,  // 'revenue' or 'commission'
  startDate,
  endDate,
  excludeRuleSetId  // Exclude current rule set when editing
);
```

## Project Structure

```
src/
├── App.tsx                          # Main app with routing and RouterSync
├── main.tsx                         # Standalone entry point
├── embedded.jsx                     # Embedded mode entry point
├── pages/
│   ├── GLRulesApp.tsx               # Main page with tabs (Accounts + Rules timeline)
│   └── GLRuleSetEditor.tsx          # Rules editor for a specific rule set
├── components/
│   ├── gl-rules/
│   │   ├── AccountsTable.tsx        # Manage accounts (CRUD table)
│   │   ├── AccountFormModal.tsx     # Create/edit account
│   │   ├── AddRuleSetModal.tsx      # Create/edit rule set with copy option
│   │   ├── RuleList.tsx             # Display rules with priority badges
│   │   ├── RuleBuilder.tsx          # Add new rule interface
│   │   ├── RuleConfigForm.tsx       # Rule type/target/account form
│   │   ├── RuleTypeSelector.tsx     # Rule type dropdown
│   │   └── PriorityBadge.tsx        # Visual priority indicator
│   └── common/
│       ├── ConfirmDialog.tsx        # Confirmation modal
│       ├── Modal.tsx                # Base modal component
│       ├── SearchableDropdown.tsx   # Dropdown with search
│       └── Toast.tsx                # Toast notifications
├── hooks/
│   ├── useAccounts.ts               # Account CRUD operations
│   ├── useGLRuleSets.ts             # Rule set CRUD + overlap check
│   ├── useGLRules.ts                # Rule CRUD + bulk operations
│   ├── useLookupData.ts             # Resources, product types lookup
│   ├── useGraphQL.ts                # GraphQL client wrapper
│   └── useAuth.ts                   # Authentication state
├── types/
│   └── gl-rules.ts                  # TypeScript interfaces and constants
├── contexts/
│   └── AuthContext.tsx              # Auth provider for both modes
└── utils/
    ├── dateCalculations.ts          # Smart date defaults for rule sets
    └── cssVariables.ts              # CSS variable utilities
```

## Child App Integration

This app follows the standard JetSetGo child app integration pattern per `child-app-integration-standards.md`.

### Props Interface

```typescript
interface AppProps {
  authToken?: string;           // Firebase auth token
  tenantName?: string;          // Tenant identifier
  onTokenExpired?: () => void;  // Token refresh callback
  initialRoute?: string;        // Initial sub-route
  onNavigate?: (route: string) => void;  // URL sync callback
  onNavigateToApp?: (path: string) => void;  // Cross-app navigation
  subRoute?: string;            // Alias for initialRoute
  basePath?: string;            // Base URL path
  currentPath?: string;         // Full current URL path
}
```

### CSS Namespacing

The app uses `.jsg-gl-rules` namespace via PostCSS to prevent style conflicts when embedded in the wrapper. The root App component wraps all content in this class.

### Routing

Uses BrowserRouter with RouterSync component for URL synchronization with the parent wrapper. Tab state is managed via URL query parameters.

## Tab Implementation

The app uses a consistent tab pattern matching `jsg_tracks`:
- Header with tab navigation
- Border-bottom styling for active tab
- Smooth transitions between tab content
- Tab state preserved in URL query parameters

Reference: `C:\Users\mail\Desktop\jetsetgo\app\jsg_tracks\src\pages\InventoryManagement.tsx`

## Key Features

### Smart Date Pre-filling
When adding a rule set, dates are automatically calculated based on:
- Existing rule set gaps in the timeline (per lane/type)
- Month boundary alignment
- Prevention of overlapping rule sets within the same type

Implementation in `src/utils/dateCalculations.ts`.

### Copy Rules from Existing Rule Set
When creating a new rule set, users can optionally copy all rules from an existing rule set:
1. Select source rule set from dropdown in AddRuleSetModal
2. New rule set is created first (returns new ID)
3. Rules are fetched from source using `fetchRulesByRuleSet`
4. Rules are bulk-inserted to new rule set using `bulkCreateRules`

### Rule Priority System
Rules are evaluated in priority order. The first matching rule determines which GL account to use:
1. Resource-specific rule (if product uses that resource)
2. Product sub-type rule (if product has that sub-type)
3. Product type rule (if product is that type)
4. Default rule (fallback)

Priority constants and labels defined in `src/types/gl-rules.ts`.

### Validation
- Rule set date ranges cannot overlap within the same type (revenue or commission)
- Each rule set should have a default rule (success message shown when present)
- End date must be after start date
- Rule set name is required
- Account external_id is required

## API Tables

All tables use tenant-aware naming: `{tenant_name}_table_name`

| Table | Description |
|-------|-------------|
| `accounts` | GL account definitions |
| `gl_rule_sets` | Time-based rule set containers with type |
| `gl_rules` | Individual GL allocation rules |
| `resources` | Lookup for resource rules |
| `product_types` | Lookup for product type rules |
| `product_sub_types` | Lookup for product sub-type rules |

## Testing

The app supports both standalone and embedded mode testing:

**Standalone Mode:**
```bash
npm run dev
# Navigate to http://localhost:5173
# Login with Firebase credentials
```

**Embedded Mode:**
- Build the app: `npm run build`
- Install in wrapper: `cd ../jsg_wrapper && npm install`
- Run wrapper: `npm run dev`
- Navigate via sidebar to GL Rules
