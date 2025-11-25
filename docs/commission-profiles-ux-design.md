# Commission Profiles Management - UX Design Specification

**Version:** 1.0
**Date:** November 23, 2025
**Application:** jsg_commissions (JetSetGo Child App)
**Designer:** UX Concept Designer

---

## Executive Summary

This document specifies the complete user experience design for the Commission Profiles management interface. Commission profiles define how travel agent commissions are calculated based on what's being sold. The primary UX challenge is making the complex "waterfall" priority system (resource → product sub-type → product type → default) feel intuitive and manageable for transport operators.

**Key Design Principles:**
1. **Visual Priority Communication** - Use color, icons, and layout to make rule priority instantly clear
2. **Error Prevention** - Design makes it difficult to create invalid configurations
3. **Progressive Disclosure** - Show complexity only when needed
4. **Confidence Building** - Operators should feel certain their rules are correct

---

## Table of Contents

1. [User Context & Goals](#user-context--goals)
2. [Information Architecture](#information-architecture)
3. [Component Specifications](#component-specifications)
4. [Interaction Flows](#interaction-flows)
5. [Visual Design System](#visual-design-system)
6. [States & Variations](#states--variations)
7. [Responsive Design](#responsive-design)
8. [Accessibility Requirements](#accessibility-requirements)
9. [Technical Implementation Notes](#technical-implementation-notes)

---

## User Context & Goals

### Primary Users
**Transport/Tourism Operators** managing commission structures for travel agent partners.

**User Characteristics:**
- May manage 5-50 agent partners
- Need to set different rates for different products/resources
- May adjust rates seasonally or by performance
- Working in busy operational environments
- May not be technically sophisticated

### User Goals
1. **Create** named commission profiles for different agent tiers
2. **Define** commission rules with appropriate priority
3. **Understand** which rule will apply in different scenarios
4. **Assign** profiles to client accounts
5. **Maintain** profiles over time as business needs change

### Success Criteria
- User can create a complete commission profile in under 5 minutes
- User understands rule priority without reading documentation
- Zero invalid profile configurations created
- User feels confident rules are correctly configured

---

## Information Architecture

### Application Structure

```
Commission Profiles App
│
├── Profile List View (Landing Page)
│   ├── Header with Create Profile button
│   ├── Search/Filter controls
│   └── Profile Cards/Table
│       ├── Profile name
│       ├── Rule count summary
│       └── Edit/Delete actions
│
└── Profile Editor (Modal or Page)
    ├── Profile Header
    │   ├── Profile name field
    │   └── Save/Cancel actions
    │
    ├── Rules Section (Main Complexity)
    │   ├── Rule Builder Interface
    │   │   ├── Add Rule button
    │   │   └── Rule Type selector
    │   │
    │   └── Active Rules List
    │       ├── Priority-sorted rules
    │       ├── Visual priority indicators
    │       └── Edit/Delete per rule
    │
    └── Validation Feedback
        ├── Default rule requirement
        └── Target ID validation
```

### Navigation Hierarchy
1. **Level 1:** Profile List (landing page)
2. **Level 2:** Profile Editor (create/edit mode)
3. **Level 3:** Rule configuration (inline within editor)

---

## Component Specifications

### 1. Profile List View

#### Page Structure
```
┌─────────────────────────────────────────────────────────┐
│ Commission Profiles                              [+ New] │ ← Header
│ Manage commission rates for your agent partners         │ ← Subtitle
├─────────────────────────────────────────────────────────┤
│ [Search profiles...]                    [Filter ▾]      │ ← Controls
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Standard Travel Agent              [Edit] [Delete]  │ │ ← Profile Card
│ │ 4 rules • Last updated 2 days ago                   │ │
│ │ 🔥 1  ⭐ 1  📋 1  🔄 1                               │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ VIP Partner Commission             [Edit] [Delete]  │ │
│ │ 6 rules • Last updated 5 days ago                   │ │
│ │ 🔥 2  ⭐ 2  📋 1  🔄 1                               │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### Component: ProfileCard

**Layout:**
- Standard card component (`.card` class)
- Padding: `var(--spacing-card-padding)` (24px)
- Border: `var(--border-width-default)` solid `var(--color-border)`
- Border-radius: `var(--radius-card)` (8px)
- Hover state: Subtle shadow increase using `var(--shadow-hover-card)`

**Content Structure:**
1. **Header Row:**
   - Profile name (left) - `var(--text-lg)` (18px), `var(--font-weight-semibold)` (600)
   - Action buttons (right) - Edit (`.btn-secondary`), Delete (`.btn-secondary`)

2. **Metadata Row:**
   - Rule count - `var(--text-sm)` (14px), `var(--color-text-secondary)`
   - Last updated - `var(--text-sm)`, `var(--color-text-secondary)`
   - Separator: `•` character between items

3. **Rule Summary Row:**
   - Priority badge counts with icons
   - Spacing: `var(--spacing-2)` (8px) between badges
   - Align left

**Priority Badges (Visual Indicators):**
```css
.priority-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1); /* 4px */
  padding: var(--spacing-1) var(--spacing-2); /* 4px 8px */
  border-radius: var(--radius-badge); /* 4px */
  font-size: var(--text-xs); /* 12px */
  font-weight: var(--font-weight-medium); /* 500 */
}

.priority-badge--resource {
  background-color: var(--badge-error-bg); /* Light red/orange */
  color: var(--badge-error-text); /* Dark red/orange */
}

.priority-badge--product-sub-type {
  background-color: var(--badge-warning-bg); /* Light yellow */
  color: var(--badge-warning-text); /* Dark yellow */
}

.priority-badge--product-type {
  background-color: var(--badge-info-bg); /* Light blue */
  color: var(--badge-info-text); /* Dark blue */
}

.priority-badge--default {
  background-color: var(--badge-neutral-bg); /* Light gray */
  color: var(--badge-neutral-text); /* Dark gray */
}
```

**Badge Content:**
- Icon (from Lucide React) + count
- 🔥 = `<Flame />` (Resource - highest priority)
- ⭐ = `<Star />` (Product Sub-Type - high priority)
- 📋 = `<FileText />` (Product Type - medium priority)
- 🔄 = `<RefreshCw />` (Default - fallback)

**Empty State:**
```
┌─────────────────────────────────────────────────────────┐
│              📋 No commission profiles yet               │
│                                                          │
│  Commission profiles define how agent commissions       │
│  are calculated. Create your first profile to get       │
│  started.                                               │
│                                                          │
│                   [+ Create Profile]                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Empty State Specs:**
- Centered content in card
- Icon: `<FileText />` size `var(--icon-size-xl)` (48px)
- Icon color: `var(--color-text-tertiary)`
- Heading: `var(--text-xl)` (20px), `var(--font-weight-semibold)`
- Description: `var(--text-base)` (16px), `var(--color-text-secondary)`
- Max-width: 480px
- Button: `.btn-primary`

---

### 2. Profile Editor

The profile editor should be implemented as a **modal dialog** for embedded mode consistency and focus.

#### Modal Structure
```
┌─────────────────────────────────────────────────────────┐
│ Create Commission Profile                          [×]   │ ← Modal Header
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Profile Name                                             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Standard Travel Agent                               │ │ ← Input
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ Commission Rules                          [+ Add Rule]  │ ← Section Header
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ⚠️ Each profile must have exactly one default rule  │ │ ← Alert
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🔥 Resource Rule                     [Edit] [Delete]│ │ ← Rule Item
│ │ Ferry Vessel "Ocean Explorer"                       │ │
│ │ 15% commission                                      │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🔄 Default Rule                             [Edit]  │ │
│ │ Applies when no other rules match                   │ │
│ │ 5% commission                                       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                              [Cancel]  [Save Profile]   │ ← Footer
└─────────────────────────────────────────────────────────┘
```

#### Modal Specs

**Dimensions:**
- Width: 720px (desktop), 95vw (mobile)
- Max-height: 90vh with scroll
- Padding: `var(--spacing-6)` (24px)

**Header:**
- Title: `var(--text-2xl)` (24px), `var(--font-weight-bold)`
- Close button: Icon only, top-right, size 24px
- Border-bottom: `var(--border-width-default)` solid `var(--color-divider)`
- Padding-bottom: `var(--spacing-4)` (16px)

**Body:**
- Padding-top: `var(--spacing-6)` (24px)
- Scroll container if content exceeds max-height

**Footer:**
- Border-top: `var(--border-width-default)` solid `var(--color-divider)`
- Padding-top: `var(--spacing-4)` (16px)
- Buttons: `.btn-secondary` (Cancel), `.btn-primary` (Save)
- Justify: flex-end with `var(--spacing-3)` (12px) gap

**Profile Name Field:**
- Label: `var(--text-sm)` (14px), `var(--font-weight-medium)`
- Input: `.input` class
- Height: `var(--height-input)` (40px)
- Required field with validation
- Show error state if empty on submit

---

### 3. Rule Builder Interface

This is the **most critical UX component**. It needs to make the priority system intuitive.

#### Add Rule Flow

**Step 1: Rule Type Selection**
```
┌─────────────────────────────────────────────────────────┐
│ + Add Rule                                               │
│                                                          │
│ Select the type of rule to add:                         │
│                                                          │
│ ┌───────────────────────────────────────────────┐       │
│ │ 🔥 Resource Rule                              │       │ ← Option Card
│ │ Highest Priority                              │       │
│ │ Set commission for a specific vessel, bus,    │       │
│ │ or venue                                      │       │
│ └───────────────────────────────────────────────┘       │
│                                                          │
│ ┌───────────────────────────────────────────────┐       │
│ │ ⭐ Product Sub-Type Rule                      │       │
│ │ High Priority                                 │       │
│ │ Set commission for a category like "Dinner    │       │
│ │ Cruise" or "Day Ferry"                        │       │
│ └───────────────────────────────────────────────┘       │
│                                                          │
│ ┌───────────────────────────────────────────────┐       │
│ │ 📋 Product Type Rule                          │       │
│ │ Medium Priority                               │       │
│ │ Set commission for broad types like "Ferry"   │       │
│ │ or "Tour"                                     │       │
│ └───────────────────────────────────────────────┘       │
│                                                          │
│ ┌───────────────────────────────────────────────┐       │
│ │ 🔄 Default Rule                               │       │
│ │ Fallback (Required)                           │       │
│ │ Applies when no other rules match             │       │
│ │ ✓ Already added                               │       │ ← Disabled state
│ └───────────────────────────────────────────────┘       │
│                                                          │
│                                    [Cancel]              │
└─────────────────────────────────────────────────────────┘
```

**Option Card Specs:**
- Border: `var(--border-width-default)` solid `var(--color-border)`
- Border-radius: `var(--radius-card)` (8px)
- Padding: `var(--spacing-4)` (16px)
- Hover: Border color changes to `var(--color-primary-600)`, cursor pointer
- Selected: Border `2px` solid `var(--color-primary-600)`, background `var(--color-primary-50)`
- Disabled: Opacity 0.5, cursor not-allowed, show checkmark

**Typography:**
- Card title: `var(--text-base)` (16px), `var(--font-weight-semibold)`
- Priority label: `var(--text-xs)` (12px), `var(--font-weight-medium)`, `var(--color-text-tertiary)`
- Description: `var(--text-sm)` (14px), `var(--color-text-secondary)`

**Step 2: Rule Configuration**

After selecting rule type, expand inline configuration:

```
┌─────────────────────────────────────────────────────────┐
│ Configure Resource Rule                                  │
│                                                          │
│ Select Resource *                                        │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Ferry Vessel "Ocean Explorer"              ▾        │ │ ← Dropdown
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ Commission Rate *                                        │
│ ┌───────────────┐                                       │
│ │ 15            │ %                                     │ ← Number input
│ └───────────────┘                                       │
│                                                          │
│ Rule Preview                                             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ When selling on Ferry Vessel "Ocean Explorer",      │ │
│ │ commission will be 15%                               │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│                                [Cancel]  [Add Rule]     │
└─────────────────────────────────────────────────────────┘
```

**Configuration Field Specs:**

**Target Selector (Dropdown):**
- Component: `.select` class
- Height: `var(--height-input)` (40px)
- Border: `var(--border-width-default)` solid `var(--input-borderColor)`
- Border-radius: `var(--radius-input)` (8px)
- Options grouped by type where appropriate
- Searchable for long lists (>10 items)
- Show icon for resource type (Ferry, Bus, Venue)

**Commission Rate Input:**
- Type: number
- Width: 120px
- Height: `var(--height-input)` (40px)
- Min: 0, Max: 100, Step: 0.01
- Suffix: "%" (displayed after input, not editable)
- Validation: Required, must be positive number

**Rule Preview Box:**
- Background: `var(--color-surface-secondary)` (light gray)
- Border: `var(--border-width-default)` solid `var(--color-border)`
- Border-radius: `var(--radius-card)` (8px)
- Padding: `var(--spacing-4)` (16px)
- Font-style: italic
- Color: `var(--color-text-secondary)`
- Purpose: Help users understand what they're creating

---

### 4. Active Rules List

Display all rules in the profile, sorted by priority.

#### Rule Item Component

```
┌─────────────────────────────────────────────────────────┐
│ 🔥 Resource Rule                          [Edit] [Delete]│ ← Header
│ Ferry Vessel "Ocean Explorer"                            │ ← Target name
│ 15% commission                                           │ ← Rate
├─────────────────────────────────────────────────────────┤
│ Priority: Highest (1/4) - Overrides all other rules     │ ← Priority info
└─────────────────────────────────────────────────────────┘
```

**Rule Item Specs:**

**Container:**
- Border: `var(--border-width-default)` solid `var(--color-border)`
- Border-left: `4px` solid [priority color]
- Border-radius: `var(--radius-card)` (8px)
- Padding: `var(--spacing-4)` (16px)
- Margin-bottom: `var(--spacing-3)` (12px)
- Background: `var(--color-surface-primary)` (white)

**Priority Border Colors:**
- Resource: `var(--color-error-500)` (red/orange)
- Product Sub-Type: `var(--color-warning-500)` (yellow)
- Product Type: `var(--color-info-500)` (blue)
- Default: `var(--color-neutral-400)` (gray)

**Header Row:**
- Icon + Rule type label (left)
- Action buttons (right): Edit (`.btn-secondary` size sm), Delete (`.btn-secondary` size sm)
- Font: `var(--text-base)` (16px), `var(--font-weight-semibold)`

**Content:**
- Target name: `var(--text-base)` (16px), `var(--color-text)`
- Commission rate: `var(--text-sm)` (14px), `var(--color-text-secondary)`

**Priority Footer:**
- Background: `var(--color-surface-tertiary)` (very light gray)
- Padding: `var(--spacing-2)` (8px) `var(--spacing-4)` (16px)
- Font: `var(--text-xs)` (12px), `var(--color-text-tertiary)`
- Border-top: `var(--border-width-default)` solid `var(--color-divider)`
- Margin: `-var(--spacing-4)` (to extend to container edges)
- Margin-top: `var(--spacing-3)` (12px)

**Priority Text Variations:**
- Resource: "Priority: Highest (1/4) - Overrides all other rules"
- Product Sub-Type: "Priority: High (2/4) - Overrides product type and default"
- Product Type: "Priority: Medium (3/4) - Overrides default only"
- Default: "Priority: Fallback (4/4) - Used when no other rules match"

**Rule Sorting:**
Rules MUST be displayed in priority order:
1. All Resource rules (sorted by resource name)
2. All Product Sub-Type rules (sorted by sub-type name)
3. All Product Type rules (sorted by type name)
4. Default rule (always last)

---

### 5. Validation & Feedback Components

#### Alert Component - Default Rule Requirement

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ Each profile must have exactly one default rule      │
│                                                          │
│ The default rule is used when a booking doesn't match   │
│ any specific resource, sub-type, or type rule.          │
└─────────────────────────────────────────────────────────┘
```

**Alert Specs:**
- Background: `var(--alert-warning-bg)` (light amber)
- Border: `var(--border-width-default)` solid `var(--alert-warning-border)`
- Border-radius: `var(--radius-card)` (8px)
- Padding: `var(--spacing-4)` (16px)
- Icon: `<AlertTriangle />` size 20px, color `var(--alert-warning-icon)`
- Text: `var(--text-sm)` (14px), `var(--color-text)`

**Alert Variations:**

**Warning (No Default Rule):**
```
⚠️ This profile doesn't have a default rule yet. Add one before saving.
```

**Error (Multiple Default Rules):**
```
❌ Only one default rule is allowed. Please remove the duplicate before saving.
```
- Background: `var(--alert-error-bg)`
- Border: `var(--alert-error-border)`
- Icon color: `var(--alert-error-icon)`

**Success (Valid Configuration):**
```
✓ This profile is properly configured with all required rules.
```
- Background: `var(--alert-success-bg)`
- Border: `var(--alert-success-border)`
- Icon: `<CheckCircle />`, color `var(--alert-success-icon)`

#### Inline Validation

**Profile Name Field:**
- Show error border: `2px` solid `var(--color-error-500)`
- Error message below field: `var(--text-xs)` (12px), `var(--color-error-500)`
- Message: "Profile name is required"

**Commission Rate Field:**
- Invalid if empty or negative
- Error message: "Rate must be between 0 and 100"
- Show error border and message

---

## Interaction Flows

### Flow 1: Create New Commission Profile

**Step-by-Step User Journey:**

1. **User clicks "+ New Profile" button** (Profile List View)
   - Animation: Modal slides in from center with fade (300ms)
   - Focus: Profile name input field

2. **User enters profile name**
   - Real-time validation: Name cannot be empty
   - If name exists: Show warning "A profile with this name already exists"

3. **User clicks "+ Add Rule" button**
   - Animation: Rule type selector expands below button (200ms)
   - Show 4 option cards (Resource, Sub-Type, Type, Default)

4. **User selects rule type** (e.g., "Resource")
   - Animation: Selected card highlights with primary border
   - Transition: Other cards fade out, configuration form slides in (250ms)

5. **User configures rule**
   - Selects target from dropdown
   - Enters commission rate
   - Preview text updates in real-time

6. **User clicks "Add Rule"**
   - Validation: Check target selected and rate valid
   - Animation: Configuration form collapses (200ms)
   - New rule appears in sorted list with slide-in animation (250ms)
   - Scroll to new rule if not visible

7. **User repeats steps 3-6** for additional rules
   - Note: Default option becomes disabled after default rule added

8. **User clicks "Save Profile"**
   - Validation: Check profile name and at least one default rule exists
   - If valid:
     - Show loading spinner on button
     - API call to create profile
     - On success: Modal closes with fade (250ms), toast notification appears
     - List view refreshes with new profile at top
   - If invalid:
     - Show error alert(s) at top of modal
     - Scroll to first error
     - Focus first invalid field

**Success State:**
```
Toast Notification:
✓ Commission profile "Standard Travel Agent" created successfully
```

**Error States:**
- Network error: "Unable to save profile. Please check your connection and try again."
- Validation error: Alert component shows specific issue
- Server error: "An error occurred while saving. Please try again."

---

### Flow 2: Edit Existing Profile

**Step-by-Step User Journey:**

1. **User clicks "Edit" button** on profile card
   - Animation: Modal slides in (300ms)
   - Loading state: Show skeleton while fetching full profile details
   - When loaded: Populate name and render all rules

2. **User modifies profile name**
   - Real-time validation active
   - Unsaved changes indicator appears

3. **User edits a rule** (clicks "Edit" on rule item)
   - Animation: Rule item expands in-place to show configuration form
   - Current values pre-populated
   - Other rules remain visible (push down)

4. **User updates rule configuration**
   - Preview updates in real-time
   - Can cancel to revert changes

5. **User clicks "Update Rule"** (or "Cancel")
   - If Update: Rule item collapses with updated values
   - If Cancel: Rule item collapses showing original values
   - Animation: 200ms smooth collapse

6. **User deletes a rule** (clicks "Delete" on rule item)
   - **Critical**: If deleting default rule, show confirmation modal:
   ```
   ┌─────────────────────────────────────────────┐
   │ Delete Default Rule?                        │
   │                                             │
   │ Removing the default rule will make this   │
   │ profile invalid. You must add a new        │
   │ default rule before saving.                │
   │                                             │
   │              [Cancel] [Delete Rule]         │
   └─────────────────────────────────────────────┘
   ```
   - If confirmed: Rule item fades out and slides up (250ms)
   - Alert appears: "⚠️ This profile doesn't have a default rule yet"

7. **User clicks "Save Profile"**
   - Same validation as create flow
   - API call to update profile
   - On success: Modal closes, list view updates, toast notification

**Unsaved Changes Handling:**
- If user clicks Cancel or X with unsaved changes:
  ```
  ┌─────────────────────────────────────────────┐
  │ Discard Changes?                            │
  │                                             │
  │ You have unsaved changes. Are you sure you │
  │ want to discard them?                      │
  │                                             │
  │         [Keep Editing] [Discard]           │
  └─────────────────────────────────────────────┘
  ```

---

### Flow 3: Delete Profile

**Step-by-Step User Journey:**

1. **User clicks "Delete" button** on profile card
   - Confirmation modal appears immediately:
   ```
   ┌─────────────────────────────────────────────┐
   │ Delete Commission Profile?                  │
   │                                             │
   │ "Standard Travel Agent"                    │
   │                                             │
   │ This action cannot be undone. Clients      │
   │ assigned to this profile will no longer    │
   │ have commission rates defined.             │
   │                                             │
   │ Tip: You can create a new profile before  │
   │ deleting to reassign clients.              │
   │                                             │
   │              [Cancel] [Delete Profile]      │
   └─────────────────────────────────────────────┘
   ```
   - Delete button styled as danger (`.btn-danger`)

2. **User confirms deletion**
   - Loading spinner on button
   - API call (soft delete: set deleted=TRUE)
   - On success:
     - Modal closes
     - Profile card fades out (300ms) and collapses
     - Toast: "✓ Profile deleted successfully"

**Error Handling:**
- If profile is assigned to clients:
  ```
  ❌ Cannot delete this profile

  This profile is currently assigned to 5 clients. Please reassign
  them to a different profile before deleting.

  [View Assigned Clients]  [Cancel]
  ```

---

### Flow 4: Understanding Rule Priority (Scenario Modeling)

**Challenge:** Users need to understand which rule will apply in different scenarios.

**Solution:** Rule Scenario Visualizer (Optional Advanced Feature)

```
┌─────────────────────────────────────────────────────────┐
│ How Rules Work                                    [Help] │
│                                                          │
│ Rules are checked in priority order until a match       │
│ is found:                                                │
│                                                          │
│ ┌────────────────────────────────────────────┐          │
│ │ 1. 🔥 Check specific resource               │          │
│ │    "Does this sale use a resource with     │          │
│ │    a specific rule?"                       │          │
│ └────────────────────────────────────────────┘          │
│              ↓ No match? Check next...                  │
│ ┌────────────────────────────────────────────┐          │
│ │ 2. ⭐ Check product sub-type                │          │
│ │    "Does this product have a sub-type      │          │
│ │    rule?"                                  │          │
│ └────────────────────────────────────────────┘          │
│              ↓ No match? Check next...                  │
│ ┌────────────────────────────────────────────┐          │
│ │ 3. 📋 Check product type                    │          │
│ │    "Does this product type have a rule?"   │          │
│ └────────────────────────────────────────────┘          │
│              ↓ No match? Use fallback                   │
│ ┌────────────────────────────────────────────┐          │
│ │ 4. 🔄 Use default rule                      │          │
│ │    "Apply the default commission rate"     │          │
│ └────────────────────────────────────────────┘          │
│                                                          │
│ Example Scenario:                                        │
│ Sale: Ferry ride on "Ocean Explorer" (Dinner Cruise)    │
│                                                          │
│ ✓ Match found: Resource rule for "Ocean Explorer" (15%) │
│ ⊘ Skipped: Product sub-type "Dinner Cruise" rule (20%)  │
│ ⊘ Skipped: Product type "Ferry" rule (10%)              │
│ ⊘ Not needed: Default rule (5%)                          │
│                                                          │
│ Commission applied: 15%                                  │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**
- Accessible via help icon (?) next to "Commission Rules" header
- Opens in modal or expandable panel
- Uses animated arrows/highlighting to show flow
- Example scenario updates based on actual rules in profile

---

## Visual Design System

### Color Palette (Priority-Based)

**Priority Level Colors:**
```css
/* Resource (Highest Priority) */
--commission-priority-1-bg: var(--badge-error-bg);
--commission-priority-1-text: var(--badge-error-text);
--commission-priority-1-border: var(--color-error-500);
--commission-priority-1-icon: var(--color-error-600);

/* Product Sub-Type (High Priority) */
--commission-priority-2-bg: var(--badge-warning-bg);
--commission-priority-2-text: var(--badge-warning-text);
--commission-priority-2-border: var(--color-warning-500);
--commission-priority-2-icon: var(--color-warning-600);

/* Product Type (Medium Priority) */
--commission-priority-3-bg: var(--badge-info-bg);
--commission-priority-3-text: var(--badge-info-text);
--commission-priority-3-border: var(--color-info-500);
--commission-priority-3-icon: var(--color-info-600);

/* Default (Fallback) */
--commission-priority-4-bg: var(--badge-neutral-bg);
--commission-priority-4-text: var(--badge-neutral-text);
--commission-priority-4-border: var(--color-neutral-400);
--commission-priority-4-icon: var(--color-neutral-500);
```

### Typography Scale

**Headings:**
- Page title: `var(--text-2xl)` (24px), `var(--font-weight-bold)` (700)
- Section header: `var(--text-lg)` (18px), `var(--font-weight-semibold)` (600)
- Card title: `var(--text-base)` (16px), `var(--font-weight-semibold)` (600)

**Body Text:**
- Primary: `var(--text-base)` (16px), `var(--font-weight-normal)` (400)
- Secondary: `var(--text-sm)` (14px), `var(--font-weight-normal)` (400)
- Caption: `var(--text-xs)` (12px), `var(--font-weight-normal)` (400)

**Interactive:**
- Button text: `var(--text-sm)` (14px), `var(--font-weight-medium)` (500)
- Link text: `var(--text-base)` (16px), `var(--font-weight-medium)` (500)

### Spacing System

**Component Spacing:**
```css
--commission-card-gap: var(--spacing-4); /* 16px between profile cards */
--commission-rule-gap: var(--spacing-3); /* 12px between rules */
--commission-section-gap: var(--spacing-6); /* 24px between sections */
--commission-field-gap: var(--spacing-4); /* 16px between form fields */
```

**Container Padding:**
```css
--commission-modal-padding: var(--spacing-6); /* 24px */
--commission-card-padding: var(--spacing-card-padding); /* 24px */
--commission-rule-padding: var(--spacing-4); /* 16px */
```

### Icon Usage

**Lucide React Icons:**
- Flame: Resource rules (highest priority)
- Star: Product sub-type rules (high priority)
- FileText: Product type rules (medium priority)
- RefreshCw: Default rules (fallback)
- Plus: Add actions
- Edit2: Edit actions
- Trash2: Delete actions
- X: Close/cancel actions
- AlertTriangle: Warnings
- CheckCircle: Success states
- Info: Help/information
- ChevronDown: Dropdown indicators

**Icon Sizes:**
```css
--commission-icon-sm: 16px;  /* Inline with text */
--commission-icon-md: 20px;  /* Buttons, badges */
--commission-icon-lg: 24px;  /* Headers */
--commission-icon-xl: 48px;  /* Empty states */
```

### Animation Standards

**Transitions:**
```css
--commission-transition-fast: 150ms ease-out;    /* Hover, focus */
--commission-transition-medium: 250ms ease-out;  /* Expand/collapse */
--commission-transition-slow: 300ms ease-out;    /* Modal, page */
```

**Framer Motion Variants:**

**Modal Enter/Exit:**
```typescript
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 }
};

const modalTransition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1] // Custom easing
};
```

**Rule Item Add/Remove:**
```typescript
const ruleItemVariants = {
  hidden: { opacity: 0, height: 0, marginBottom: 0 },
  visible: {
    opacity: 1,
    height: 'auto',
    marginBottom: 'var(--spacing-3)',
    transition: { duration: 0.25 }
  },
  exit: {
    opacity: 0,
    height: 0,
    marginBottom: 0,
    transition: { duration: 0.2 }
  }
};
```

**Expand/Collapse (Edit Mode):**
```typescript
const expandVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.2, ease: 'easeOut' }
  }
};
```

---

## States & Variations

### Loading States

**Profile List Loading (Initial Page Load):**
```
┌─────────────────────────────────────────────────────────┐
│ Commission Profiles                              [+ New] │
│ Manage commission rates for your agent partners         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ████████████████              ████   ████           │ │ ← Skeleton card
│ │ ████████  ████                                      │ │
│ │ ████  ████  ████  ████                              │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ████████████████              ████   ████           │ │
│ │ ████████  ████                                      │ │
│ │ ████  ████  ████  ████                              │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Skeleton Specs:**
- Background: `var(--color-skeleton-base)` (light gray)
- Animation: Shimmer effect using gradient
- Border-radius: `var(--radius-sm)` (4px) for text blocks
- Heights: Match actual content (title: 24px, metadata: 20px, badges: 24px)

**Profile Editor Loading (Opening Existing Profile):**
```
┌─────────────────────────────────────────────────────────┐
│ Edit Commission Profile                            [×]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Profile Name                                             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ████████████████████                                │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ Commission Rules                          [+ Add Rule]  │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ████████████████              ████   ████           │ │
│ │ ████████████████████████                            │ │
│ │ ████████                                            │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Button Loading State:**
```css
.btn-primary:disabled {
  background-color: var(--button-primary-bg-disabled);
  cursor: not-allowed;
  opacity: 0.7;
}

.btn-primary .spinner {
  animation: spin 0.6s linear infinite;
  margin-right: var(--spacing-2);
}
```

### Empty States

**No Profiles Yet:**
- Centered card with icon, message, and CTA
- See Component Specifications section above

**No Rules in Profile (Invalid State):**
```
┌─────────────────────────────────────────────────────────┐
│ Commission Rules                          [+ Add Rule]  │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │             📋 No rules added yet                    │ │
│ │                                                      │ │
│ │ Click "+ Add Rule" to create your first commission │ │
│ │ rule. Remember: You must add a default rule.       │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Search Returns No Results:**
```
┌─────────────────────────────────────────────────────────┐
│ [Search: "xyz"...]                         [Filter ▾]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│              🔍 No profiles found                        │
│                                                          │
│          No commission profiles match "xyz"             │
│                                                          │
│                  [Clear Search]                          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Error States

**API Error (Failed to Load Profiles):**
```
┌─────────────────────────────────────────────────────────┐
│ Commission Profiles                              [+ New] │
│ Manage commission rates for your agent partners         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ❌ Unable to load commission profiles                │ │
│ │                                                      │ │
│ │ There was an error loading your commission          │ │
│ │ profiles. Please check your connection and try      │ │
│ │ again.                                               │ │
│ │                                                      │ │
│ │                    [Retry]                           │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Validation Error (Save Failed):**
```
┌─────────────────────────────────────────────────────────┐
│ Create Commission Profile                          [×]   │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ❌ Cannot save profile                               │ │
│ │                                                      │ │
│ │ • Profile name is required                          │ │
│ │ • A default rule is required                        │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ [Profile content below...]                               │
└─────────────────────────────────────────────────────────┘
```

**Network Error Toast:**
```
┌─────────────────────────────────────────┐
│ ❌ Connection error                     │
│ Unable to save changes. Please check    │
│ your internet connection.               │
│                                    [×]  │
└─────────────────────────────────────────┘
```
- Position: Top-right corner
- Auto-dismiss: 5 seconds
- Manual dismiss: X button

### Disabled States

**Add Default Rule (When One Exists):**
```
┌───────────────────────────────────────────┐
│ 🔄 Default Rule                           │
│ Fallback (Required)                       │
│ Applies when no other rules match         │
│ ✓ Already added                           │ ← Disabled indicator
└───────────────────────────────────────────┘
```
- Opacity: 0.5
- Cursor: not-allowed
- Border: Dashed instead of solid

**Delete Button (Default Rule):**
- Show warning icon on hover
- Tooltip: "Deleting the default rule will make this profile invalid"

**Save Button (Invalid State):**
```html
<button class="btn-primary" disabled>
  Save Profile
</button>
```
- Background: `var(--button-primary-bg-disabled)`
- Cursor: not-allowed
- Tooltip: Lists validation issues

---

## Responsive Design

### Breakpoints

```css
/* Mobile First Approach */
--breakpoint-sm: 640px;   /* Small tablets */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Laptops */
--breakpoint-xl: 1280px;  /* Desktops */
```

### Layout Adaptations

#### Mobile (< 640px)

**Profile List:**
- Single column layout
- Cards stack vertically with full width
- Search bar full width
- Filter button below search
- Priority badges wrap to multiple lines if needed
- Action buttons stack vertically in cards

**Profile Editor:**
- Modal width: 95vw
- Single column form layout
- Rule configuration fields stack vertically
- Commission rate input full width
- Action buttons stack (Cancel on top, Save below)

#### Tablet (640px - 1024px)

**Profile List:**
- Single column or 2-column grid (depends on container width)
- Search and filter in same row
- Priority badges in single row
- Action buttons side-by-side

**Profile Editor:**
- Modal width: 600px
- Form layout remains single column
- Fields at comfortable width
- Action buttons side-by-side

#### Desktop (> 1024px)

**Profile List:**
- 2-column or 3-column grid for cards
- All controls in single row
- Full badge visibility

**Profile Editor:**
- Modal width: 720px
- Optimal form field widths
- Can show rule preview side-by-side with config (optional)

### Mobile-Specific Patterns

**Touch Targets:**
- Minimum size: 44x44px (iOS guideline)
- Buttons: `var(--height-button)` (52px) maintains good touch target
- Increased spacing between interactive elements: `var(--spacing-3)` (12px) minimum

**Scrolling:**
- Modal body scrolls independently
- Sticky header/footer in modal
- Pull-to-refresh on profile list (optional)

**Gestures:**
- Swipe to delete profile (optional advanced feature)
- Long-press for quick actions menu (optional)

**Simplified Views:**
- Hide priority footer text on mobile (show only on tap/expand)
- Collapsible rule details on mobile
- Bottom sheet instead of modal on very small screens (< 400px)

---

## Accessibility Requirements

### Keyboard Navigation

**Focus Order:**
1. Profile List: Search → Filter → Create button → Profile cards → Edit/Delete buttons
2. Profile Editor: Name field → Add Rule button → Rules → Save/Cancel buttons

**Keyboard Shortcuts:**
- `Tab`: Move forward through focusable elements
- `Shift+Tab`: Move backward
- `Enter`: Activate buttons/links
- `Space`: Activate buttons, toggle checkboxes
- `Escape`: Close modal/dialog

**Focus Indicators:**
```css
*:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

### Screen Reader Support

**ARIA Labels:**

```html
<!-- Profile Card -->
<div role="article" aria-labelledby="profile-1-name">
  <h3 id="profile-1-name">Standard Travel Agent</h3>
  <p aria-label="4 rules configured">4 rules</p>
  <button aria-label="Edit Standard Travel Agent profile">Edit</button>
  <button aria-label="Delete Standard Travel Agent profile">Delete</button>
</div>

<!-- Priority Badge -->
<span
  class="priority-badge priority-badge--resource"
  role="status"
  aria-label="1 resource rule, highest priority">
  <Flame aria-hidden="true" />
  <span>1</span>
</span>

<!-- Rule Item -->
<div
  role="article"
  aria-labelledby="rule-5-type"
  aria-describedby="rule-5-details">
  <h4 id="rule-5-type">Resource Rule</h4>
  <p id="rule-5-details">
    Ferry Vessel Ocean Explorer, 15% commission, Highest priority
  </p>
</div>

<!-- Modal -->
<div
  role="dialog"
  aria-labelledby="modal-title"
  aria-modal="true">
  <h2 id="modal-title">Create Commission Profile</h2>
  <!-- Content -->
</div>

<!-- Form Fields -->
<label for="profile-name">
  Profile Name <span aria-label="required">*</span>
</label>
<input
  id="profile-name"
  type="text"
  required
  aria-required="true"
  aria-invalid="false"
  aria-describedby="name-error">
<span id="name-error" role="alert"></span>
```

**Live Regions:**

```html
<!-- Validation Messages -->
<div role="alert" aria-live="assertive" aria-atomic="true">
  Profile name is required
</div>

<!-- Success Messages -->
<div role="status" aria-live="polite" aria-atomic="true">
  Profile saved successfully
</div>

<!-- Loading States -->
<div role="status" aria-live="polite" aria-busy="true">
  Loading commission profiles...
</div>
```

### Color Contrast

**WCAG AA Compliance (4.5:1 for text, 3:1 for UI components):**

All text must meet contrast requirements:
- Primary text on white: `var(--color-text)` (#111827) = 16.1:1 ✓
- Secondary text on white: `var(--color-text-secondary)` (#6B7280) = 7.6:1 ✓
- Badge text: All badge colors tested for AA compliance
- Button text: White on `var(--color-primary-600)` = 4.6:1 ✓

**Do Not Rely on Color Alone:**
- Priority uses icon + color + text
- Validation uses icon + color + message
- Status uses icon + color + label

### Motion & Animation

**Respect Reduced Motion:**

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Framer Motion Implementation:**

```typescript
import { useReducedMotion } from 'framer-motion';

function ProfileEditor() {
  const shouldReduceMotion = useReducedMotion();

  const variants = shouldReduceMotion
    ? { hidden: {}, visible: {}, exit: {} } // No animation
    : modalVariants; // Full animation

  return (
    <motion.div variants={variants} />
  );
}
```

---

## Technical Implementation Notes

### Data Requirements

**Profile List API Response:**
```typescript
interface CommissionProfile {
  id: number;
  name: string;
  deleted: boolean;
  created_at: string;
  updated_at: string;
  rule_summary: {
    resource_count: number;
    product_sub_type_count: number;
    product_type_count: number;
    has_default: boolean;
  };
}
```

**Profile Details API Response:**
```typescript
interface CommissionProfileDetailed extends CommissionProfile {
  commission_rules: CommissionRule[];
}

interface CommissionRule {
  id: number;
  commission_profile_id: number;
  rule_type: 'resource' | 'product_sub_type' | 'product_type' | 'default';
  target_id: number | null;
  commission_rate: number; // Percentage (0-100)
  deleted: boolean;
  created_at: string;
  updated_at: string;

  // Joined data for display
  target_name?: string; // Name of resource/type
  target_details?: {
    type?: string; // For resources: 'Ferry', 'Bus', 'Venue'
    icon?: string; // Icon name for resource type
  };
}
```

**Lookup Data (For Dropdowns):**
```typescript
interface Resource {
  id: number;
  name: string;
  type: 'Ferry' | 'Bus' | 'Venue' | 'Other';
  deleted: boolean;
}

interface ProductType {
  id: number;
  name: string;
  deleted: boolean;
}

interface ProductSubType {
  id: number;
  product_type_id: number;
  name: string;
  deleted: boolean;
}
```

### API Endpoints

**REST API (Recommended):**

```
GET    /api/commission-profiles              # List all profiles
GET    /api/commission-profiles/:id          # Get profile details
POST   /api/commission-profiles              # Create profile
PUT    /api/commission-profiles/:id          # Update profile
DELETE /api/commission-profiles/:id          # Soft delete profile

GET    /api/commission-profiles/:id/rules    # Get rules for profile
POST   /api/commission-profiles/:id/rules    # Add rule to profile
PUT    /api/commission-rules/:id             # Update rule
DELETE /api/commission-rules/:id             # Soft delete rule

GET    /api/resources                        # Get resources for dropdown
GET    /api/product-types                    # Get product types
GET    /api/product-sub-types                # Get sub-types
```

**GraphQL (Alternative):**

See `commission_profiles_frontend_guide.md` for GraphQL query examples.

### State Management

**Recommended Approach: React Query**

```typescript
// Queries
const { data: profiles, isLoading } = useQuery(
  ['commission-profiles'],
  fetchProfiles
);

const { data: profile } = useQuery(
  ['commission-profile', profileId],
  () => fetchProfile(profileId),
  { enabled: !!profileId }
);

// Mutations
const createProfileMutation = useMutation(createProfile, {
  onSuccess: () => {
    queryClient.invalidateQueries(['commission-profiles']);
    toast.success('Profile created successfully');
    closeModal();
  },
  onError: (error) => {
    toast.error('Failed to create profile');
  }
});
```

### Form Validation

**Client-Side Validation Rules:**

```typescript
interface ProfileFormData {
  name: string;
  rules: RuleFormData[];
}

interface RuleFormData {
  rule_type: string;
  target_id: number | null;
  commission_rate: number;
}

const validateProfile = (data: ProfileFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Profile name required
  if (!data.name || data.name.trim() === '') {
    errors.name = 'Profile name is required';
  }

  // Must have at least one rule
  if (data.rules.length === 0) {
    errors.rules = 'At least one rule is required';
  }

  // Must have exactly one default rule
  const defaultRules = data.rules.filter(r => r.rule_type === 'default');
  if (defaultRules.length === 0) {
    errors.defaultRule = 'A default rule is required';
  } else if (defaultRules.length > 1) {
    errors.defaultRule = 'Only one default rule is allowed';
  }

  // Validate each rule
  data.rules.forEach((rule, index) => {
    // Non-default rules must have target_id
    if (rule.rule_type !== 'default' && !rule.target_id) {
      errors[`rule_${index}_target`] = 'Target is required';
    }

    // Default rules must NOT have target_id
    if (rule.rule_type === 'default' && rule.target_id !== null) {
      errors[`rule_${index}_target`] = 'Default rule cannot have a target';
    }

    // Commission rate must be valid
    if (rule.commission_rate < 0 || rule.commission_rate > 100) {
      errors[`rule_${index}_rate`] = 'Rate must be between 0 and 100';
    }
  });

  return errors;
};
```

### CSS Variables (App-Specific)

```css
/* Commission Profiles App Variables */
:root {
  /* Priority Colors (Extend system variables) */
  --commission-priority-1-bg: var(--badge-error-bg);
  --commission-priority-1-text: var(--badge-error-text);
  --commission-priority-1-border: var(--color-error-500);

  --commission-priority-2-bg: var(--badge-warning-bg);
  --commission-priority-2-text: var(--badge-warning-text);
  --commission-priority-2-border: var(--color-warning-500);

  --commission-priority-3-bg: var(--badge-info-bg);
  --commission-priority-3-text: var(--badge-info-text);
  --commission-priority-3-border: var(--color-info-500);

  --commission-priority-4-bg: var(--badge-neutral-bg);
  --commission-priority-4-text: var(--badge-neutral-text);
  --commission-priority-4-border: var(--color-neutral-400);

  /* Component-Specific Spacing */
  --commission-card-gap: var(--spacing-4);
  --commission-rule-gap: var(--spacing-3);
  --commission-section-gap: var(--spacing-6);

  /* Rule Item Left Border Width */
  --commission-rule-border-width: 4px;
}
```

### Component File Structure

```
src/
├── components/
│   ├── commissions/
│   │   ├── ProfileList.tsx           # Main list view
│   │   ├── ProfileCard.tsx           # Profile card component
│   │   ├── ProfileEditor.tsx         # Modal editor
│   │   ├── RuleBuilder.tsx           # Add/edit rule interface
│   │   ├── RuleTypeSelector.tsx     # Rule type option cards
│   │   ├── RuleConfigForm.tsx       # Rule configuration form
│   │   ├── RuleItem.tsx             # Active rule display
│   │   ├── RuleList.tsx             # Sorted list of rules
│   │   ├── PriorityBadge.tsx        # Priority indicator badge
│   │   ├── RulePriorityInfo.tsx     # Help/explanation component
│   │   └── ValidationAlert.tsx      # Validation feedback
│   └── common/
│       ├── Modal.tsx                 # Reusable modal
│       ├── ConfirmDialog.tsx        # Confirmation dialogs
│       └── Toast.tsx                # Toast notifications
├── hooks/
│   ├── useCommissionProfiles.ts     # Profile data hooks
│   ├── useCommissionRules.ts        # Rule data hooks
│   └── useLookupData.ts            # Resource/type data
├── pages/
│   └── CommissionsApp.tsx           # Main app component
└── styles/
    └── commissions.css               # App-specific styles
```

---

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading:**
   - Profile editor modal loaded on-demand
   - Rule configuration form code-split

2. **Data Caching:**
   - Cache lookup data (resources, types) - update rarely
   - Stale-while-revalidate for profile list
   - Optimistic updates for rule changes

3. **Virtualization:**
   - If profile list exceeds 50 items, use virtual scrolling
   - If rule list exceeds 20 items in editor, virtualize

4. **Debouncing:**
   - Search input debounced (300ms)
   - Real-time preview debounced (200ms)

5. **Memoization:**
   - Memoize rule sorting function
   - Memoize validation logic
   - Memoize priority calculations

---

## Testing Requirements

### Visual Regression Tests

1. Profile list - empty state
2. Profile list - with 3 profiles
3. Profile card - all variations
4. Profile editor - create mode
5. Profile editor - edit mode with rules
6. Rule builder - all steps
7. Rule item - all priority types
8. Validation alerts - all types
9. Responsive layouts - mobile, tablet, desktop

### Interaction Tests

1. Create profile flow (happy path)
2. Edit profile flow
3. Delete profile flow (with confirmation)
4. Add rule flow (all types)
5. Edit rule flow
6. Delete rule flow (default vs. non-default)
7. Form validation (all error cases)
8. Search and filter

### Accessibility Tests

1. Keyboard navigation complete flow
2. Screen reader announcements
3. Focus management in modals
4. Color contrast validation
5. Reduced motion preference

---

## Future Enhancements (Out of Scope for V1)

1. **Bulk Operations:** Select multiple profiles for deletion
2. **Profile Duplication:** Clone existing profile as template
3. **Rule Templates:** Save common rule sets for reuse
4. **Commission Calculator:** Preview commission for hypothetical sale
5. **Usage Analytics:** Show which rules are matched most often
6. **Historical Tracking:** View profile change history
7. **Import/Export:** CSV import/export of profiles and rules
8. **Advanced Filtering:** Filter profiles by rule types, date created
9. **Drag-and-Drop:** Manually reorder rules (override auto-sort)
10. **Client Assignment:** Directly assign profiles to clients from this interface

---

## Appendix: Glossary

**Commission Profile:** A named collection of rules that determine commission rates for a client.

**Commission Rule:** A single rule within a profile that defines a commission rate for a specific condition.

**Rule Type:** The category of rule - resource, product_sub_type, product_type, or default.

**Target:** The specific entity a rule applies to (e.g., a particular ferry vessel).

**Priority:** The order in which rules are evaluated (resource highest, default lowest).

**Soft Delete:** Marking records as deleted (deleted=TRUE) rather than removing from database.

**Default Rule:** The fallback rule that applies when no other rules match a sale.

**PAT (People and Things):** JetSetGo's classification system for bookable entities.

**IHU (Inventory Holding Unit):** A container for inventory capacity (seats, berths, etc.).

---

## Document Control

**Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-23 | UX Concept Designer | Initial comprehensive specification |

**Review Status:**
- [ ] UX Design Review
- [ ] Transport/Tourism UX Feedback
- [ ] Technical Feasibility Review
- [ ] Accessibility Review
- [ ] Design System Compliance Check

**Approval Required From:**
- [ ] Product Owner
- [ ] Lead Developer
- [ ] UX Lead

---

**End of Specification Document**

This document provides complete specifications for implementing the Commission Profiles management interface. Frontend developers should implement exactly as specified, using the JetSetGo CSS Variables system and following the child app integration standards.

For questions or clarifications, refer to:
- `STYLE_GUIDE.md` - Visual design standards
- `DESIGN_SYSTEM_USAGE_RULES.md` - CSS implementation rules
- `child_app_integration_standards.md` - Integration requirements
- `commission_profiles_frontend_guide.md` - Database and API details
