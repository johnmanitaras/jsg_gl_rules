# JetSetGo Design System Usage Rules

Authoritative rules for how child apps style UI within the JetSetGo platform. This document complements `STYLE_GUIDE.md` and formalizes: a comprehensive global CSS, Tailwind preset usage, and the escape-hatch method for app-specific needs.

---

## 0) Scope and Goals
- __Single source of truth__: Shared global CSS + Tailwind preset from the wrapper (or shared package) define tokens, base, and components.
- __Consistency first__: Default to shared classes/utilities. The escape hatch is allowed but scoped and temporary.
- __No collisions__: Prevent cross-app overrides via cascade layers, Tailwind prefixing, and banning per-app globals.

---

## 1) Foundations
- __Style guide__: See `STYLE_GUIDE.md` for tokens, color usage (brand primary-500 for accents/focus; actions at primary-600/700), layout, tables, motion, and accessibility.
- __Styleguide demo__: Use `styleguide-demo/` as the visual baseline when adding/updating components.

---

## 2) Global CSS Strategy (Comprehensive)
Loaded once by the wrapper and imported by standalone child apps.

- __Cascade layers (order)__
  - `@layer tokens;` CSS variables for colors, spacing, radius, shadows, typography.
  - `@layer base;` Resets, base typography, base element adjustments.
  - `@layer components;` Component classes: `.btn-*`, `.card*`, `.input`, `.select`, tables, skeletons, alerts.
  - `@layer utilities;` Any custom utilities not provided by Tailwind.
  - `@layer overrides;` Reserved for wrapper-only rare fixes.

- __Tailwind preset__
  - All apps configure Tailwind with: `presets: [require('@jsg/design-system/tailwind.preset.cjs')]` (or equivalent path).
  - Tailwind __prefix__: `prefix: 'jsg-'` to avoid utility class collisions.

- __Tokens and color rules__ (must match `STYLE_GUIDE.md`)
  - Brand `primary-500 = #3B82F6` reserved for accents/focus (not default fills for small text on white).
  - Actions/links use `primary-600/700`.
  - Use semantic tokens for success/warning/error/info. Avoid raw hex for brand/semantics.

---

## 3) Standard Component Classes
Always prefer these before the escape hatch.

- __Buttons__: `.btn-primary`, `.btn-secondary` (+ sizes, disabled, loading, focus states).
- __Forms__: `.input`, `.select` (+ error/help text patterns).
- __Surfaces__: `.card`, `.card-header`, `.card-body`.
- __Tables__: Header/body styles, dividers, hover per guide.
- __Feedback__: Skeletons, spinners, alerts, toasts.

Use prefixed utilities alongside components, e.g. `className="btn-primary jsg-w-full jsg-mt-4"`.

---

## 4) Escape Hatch (Standard For Now)
Allowed, but must be scoped and minimal.

- __Scope it__ using CSS Modules or a unique root attribute:
  - CSS Modules: `Component.module.css` (all classes are local).
  - Attribute scope: wrap app root with `<div data-app="jsg-yourapp">` and write selectors like `[data-app="jsg-yourapp"] .filter-panel { … }`.

- __Naming__ (escape hatch classes):
  - Kebab-case: `.filter-panel`, `.resource-row`, `.drawer-footer`.
  - Prepend an app-unique scope (via attribute, not a global prefix class).

- __Do not__ redefine global primitives (no `.btn-*`, `.card`, `.input`, `.select`, or element resets) inside child apps.

- __Review cadence__: Escape-hatch styles should be revisited and, when broadly useful, upstreamed into the global components.

---

## 5) Legacy Alias (Migration Aid Only)
A tiny curated alias sheet may map high-usage legacy classes to new APIs to speed migration. No new entries without approval.

- Examples:
  - `.primaryButton { @apply jsg-bg-primary-600 jsg-text-white; }`
  - `.tableHeader { @apply jsg-text-xs jsg-text-gray-500; }`

Plan to remove these aliases as code migrates to system classes/utilities.

---

## 6) Forbidden in Child Apps
- Global resets or element-wide rules (`*`, `body`, `button` etc.).
- Defining/overriding shared component classes (`.btn-*`, `.card*`, `.input`, `.select`).
- Unscoped global selectors.
- Raw brand/semantic hex values (use tokens or `jsg-` utilities).

---

## 7) How to Request Additions/Changes
- Open a PR against the shared design system (tokens, component classes, docs, demo updates).
- Include: purpose, variants/states, accessibility notes, and visual examples updated in `styleguide-demo/`.
- Add usage notes to `STYLE_GUIDE.md` if it changes best practices.

---

## 8) Enforcement & Quality Gates
- __Stylelint__: ban raw brand/semantic hex; forbid unscoped globals; require token/utility usage.
- __ESLint/custom__: disallow global selectors in child apps; flag forbidden class names.
- __CI__: visual regression using the styleguide demo; lint checks block merges.

---

## 9) Migration Checklist
1. Replace local `.btn/.card/.input/.select` with shared equivalents.
2. Switch action/link colors to `primary-600/700`; reserve `primary-500` for accents/focus.
3. Remove per-app global CSS; move app-specific needs to escape hatch (scoped styles).
4. Use `jsg-` prefixed utilities and shared component classes.
5. If necessary, use legacy alias temporarily; plan removal.

---

## 10) Examples

Buttons and utilities:
```tsx
<button className="btn-primary jsg-w-full jsg-mt-4">Save</button>
<button className="btn-secondary jsg-ml-2">Cancel</button>
```

Scoped CSS Module (escape hatch):
```css
/* ResourceFilter.module.css */
.container { margin-top: 1rem; }
.row { display: grid; grid-template-columns: 1fr auto; gap: 0.5rem; }
```
```tsx
import s from './ResourceFilter.module.css';

<div className={`card ${s.container}`}>
  <div className={s.row}>…</div>
</div>
```

Attribute-scoped escape hatch:
```tsx
<div data-app="jsg-resources">
  <div className="card">
    <div className="card-body">
      <div className="filter-panel">…</div>
    </div>
  </div>
</div>
```
```css
/* Scoped somewhere in the app */
[data-app="jsg-resources"] .filter-panel { display: grid; gap: 8px; }
```

---

## 11) Governance
- Changes to tokens or core components require design review and accessibility validation.
- Version the shared CSS/preset. Child apps should update incrementally and run the demo-based regression tests.

---

## 12) References
- `STYLE_GUIDE.md`
- `styleguide-demo/`
- Tailwind config preset (`tailwind.preset.cjs`)
- `@layer` strategy and `prefix: 'jsg-'` configuration
