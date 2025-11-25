# JetSetGo Child Apps — Style Guide

This style guide defines the visual and layout standards for all child apps embedded inside the JetSetGo wrapper. It aligns with the current project setup in `tailwind.config.js` and `src/index.css`.

Use this guide for any new screens to ensure a consistent look-and-feel across apps.

---

## 1) Layout and Content Area

- **Page background (outside content area)**
  - Color: `#F9FAFB` (light grey)
  - Token: `--color-background` in `src/index.css`
  - Purpose: Provides a neutral canvas consistent with the wrapper.

- **Content area width**
  - Max width: `1280px` (Tailwind `max-w-7xl`)
  - This is the standard width for all main content when embedded in the wrapper.

- **Content area horizontal padding**
  - Padding: `24px` on left and right (Tailwind `px-6`)

- **Vertical spacing**
  - Page padding: `24px` top/bottom (Tailwind `py-6`)
  - May increase to `32px` on `md+` (Tailwind `md:py-8`) where content is dense.

- **Cards as surfaces**
  - Default surface for content sections.
  - Use `.card`, `.card-header`, `.card-body` from `src/index.css`.

- **Standard page scaffold**
  ```tsx
  <div className="container py-6 md:py-8">
    <h1 className="text-2xl font-bold">Page Title</h1>
    <p className="text-sm text-gray-600 mt-2">Page description or subtitle</p>
    
    <div className="flex items-center justify-between mt-6">
      <div className="flex gap-2">
        <button className="btn-secondary">Secondary</button>
        <button className="btn-primary">Primary action</button>
      </div>
    </div>

    <div className="mt-4 grid gap-3 md:grid-cols-[1fr,auto,auto]">
      {/* search, filters, status */}
    </div>

    <div className="card mt-6">
      <div className="card-header">Section title</div>
      <div className="card-body">Content</div>
    </div>
  </div>
  ```

Notes:
- `.container` is defined as `mx-auto px-6 max-w-7xl` in `src/index.css` and should be used for all pages.
- The wrapper may provide global header/side-nav; your page starts inside the content area as above.

---

## 2) Color System

- **Brand primary (JetSetGo)**
  - Value: `#3B82F6` (authoritative primary)
  - Tailwind: set `theme.colors.primary.500 = #3B82F6`
  - CSS var: `--color-primary = #3B82F6`

- **Approved palette (tokens)**
  - Background (outside content): `#F9FAFB` → `--color-background`
  - Surface (cards/panels): `#FFFFFF`
  - Border: `#E5E7EB` → `--color-border`
  - Divider: `#F3F4F6` → `--color-divider`
  - Text primary: `#111827` → `--color-text`
  - Text secondary: `#6B7280` → `--color-textSecondary`
  - Selection (IHU selected background): Slate 800 `#1E293B`
  - Selection (IHU selected border/alt levels): Slate 700 `#334155`, Slate 600 `#475569`
  - Success: Emerald 500 `#10B981` → `--color-success`
  - Warning: Amber 500 `#F59E0B` → `--color-warning`
  - Error: Red 500 `#EF4444` → `--color-error`
  - Info / Focus ring: Blue 500 `#3B82F6` → `--color-info` and focus vars

- **Usage rules**
  - Use `primary-600/700` for action fills and links. Reserve `primary-500` (`#3B82F6`) for brand accents and focus rings.
  - Avoid white text on `primary-500` for small text; prefer `primary-600` (`#2563EB`) for white-on-blue text to meet WCAG AA.
  - The page background (outside content area) must always be the light grey `#F9FAFB`.
  - Content surfaces are white with subtle borders `#E5E7EB` (use `.card`).
  - Status mapping: success/warning/error/info must use the approved semantic tokens above.
  - Table/list hover states: light neutral `#F3F4F6`.

- **Implementation notes**
  - This section is normative for design. Implementation changes are a separate task.
  - When implementing, align `tailwind.config.js` primary palette and expose `primary-{50..900}`. Map: `primary.500 = #3B82F6` (brand), `primary.600 = #1D4ED8` (Royal Blue - action default), `primary.700 = #1E3A8A` (Royal Blue Dark - hover/active).
  - Align `src/index.css` CSS variables to these values (primary, semantics, selection greys) and remove inline hex in components over time.
  - Keep IHU selection using Slate 800 background with Slate 700/600 for nested levels as per `src/components/manifest/IHUSidebar.tsx`.

### IHU Sidebar selection colors

- **Selected row (level 0)**: background `#1E293B` (slate-800), text `#FFFFFF`, border `#334155` (slate-700)
- **Selected row (level 1)**: background `#334155` (slate-700)
- **Selected row (level 2+)**: background `#475569` (slate-600)
- **Unselected rows**: neutral slate/gray scale with hover lightening (slate-50/100/200)
- Rationale: neutral, high-contrast selection that does not conflict with brand primary usage for actions.

---

## 3) Typography

- **Font family**: Inter, with system fallbacks.
- **Base**: 16px, line-height 1.5 (already set in `src/index.css`).
- **Page Headings**
  - **Primary Page Title**
    - Font Size: 24px
    - Line Height: 30px
    - Font Weight: 700 (bold)
    - Color: Primary text color (#111827)
    - Tailwind Classes: `text-2xl font-bold`
  - **Page Description/Subtitle**
    - Font Size: 14px
    - Line Height: 21px
    - Font Weight: 400 (normal)
    - Color: Secondary text color (#6B7280)
    - Tailwind Classes: `text-sm`
    - Spacing: 8px margin-top below primary title (`mt-2`)
  - **Usage**
    - Use primary title for main page headings
    - Use subtitle for descriptive text that explains the page purpose
    - Maintain 8px vertical spacing between title and subtitle

- **Content Hierarchy**
  - H2: 20/28, `font-semibold`
  - H3: 18/28, `font-medium`
  - Body: 14–16/24, `font-normal`
  - Muted/help text: 12–13/18, `text-gray-500`

Ensure Inter is loaded in `index.html` (e.g., Google Fonts) and `font-display: swap` is used.

---

## 4) Spacing, Radius, Elevation

- **Spacing scale** (4px base): 8, 12, 16, 24, 32.
- **Section spacing**: `24px` between major blocks.
- **Radius**: 8px for inputs, buttons, and cards (maps to `--radius-lg`).
- **Shadows**: `shadow-sm` for cards; `shadow-md` for popovers/drawers.

---

## 5) Forms and Buttons

- **Inputs**
  - Height: `40px` (`2.5rem`), radius: `8px`, border: `#D1D5DB`.
  - Focus: 2px ring using brand color (configured in `src/index.css`).
  - Use classes: `.input`, `.select`.

- **Buttons**
  - Default sizes: sm (44), md (52 default), lg (60).
  - Use `.btn-primary` and `.btn-secondary` from `src/index.css`.
  - Primary buttons use action colors; Secondary are bordered with white background.
  - Primary states:
    - Default: bg `#1D4ED8` (Royal Blue), text `#FFFFFF`
    - Hover: bg `#1E3A8A` (Royal Blue Dark)
    - Active: bg `#1E3A8A`
    - Disabled: bg `#93C5FD`, text `#FFFFFF` at ~70% opacity, `cursor-not-allowed`
    - Focus: 2px ring `#3B82F6` + 2px offset
  - Secondary hover: bg `#F9FAFB`

- **Search Bars**
 - When a search bar appears near the top of the screen, especially if it appears alongside one or more buttons, it should follow the standard md (52) button height to match the buttons

- **Links**
  - Default: `text-primary-600` (`#1D4ED8`); hover/active: `primary-700` (`#1E3A8A`).
  - Avoid using `primary-500` (`#3B82F6`) for small text on white due to contrast; reserve 500 for brand accents and focus rings.

---

## Table Visual Style

Visual standards for all data tables, derived from `src/components/ResourceTable.tsx`.

### Borders
- Outer border: none (no border on `<table>` or container).
- Row separators: 1px horizontal dividers using `divide-y divide-gray-200` on `<tbody>`.
- Column separators: none (no vertical borders between cells).

### Header Styling (`<thead> / <th>`)
- Background: `bg-gray-50`.
- Text: `text-xs` (≈12px), `font-medium`, `text-gray-500`, `uppercase`, `tracking-wider`.
- Alignment: `text-left` for all headers.
- Padding: `px-6 py-3`.
- Hover state for sortable headers: `hover:bg-gray-100`.
- Font family: `typography.headingFontFamily` (inline style on `<th>`).

### Body Styling (`<tbody> / <td> / <tr>`)
- Background: `bg-white`.
- Row hover (interactive rows): `hover:bg-gray-50` with `transition-colors`.
- Text: `text-sm` (≈14px) by default.
- Padding: `px-6 py-4`.
- Whitespace: `whitespace-nowrap` for compact rows; apply truncation (`truncate max-w-md`) on long-text columns as needed.
- Font family: `typography.fontFamily` applied at `<table>` level.

### Colors
- Table chrome uses Tailwind grays: `gray-50`, `gray-100`, `gray-200`, `gray-500`.
- Do not apply theme brand colors to table chrome; reserve brand colors for data elements inside cells (e.g., badges).

### Sizing
- Table width: `w-full`.
- Approx header row height: ~40px from `py-3`.
- Approx body row height: ~44–48px from `py-4` and default line-height.

### Class Checklist
- `<table>`: `w-full` + `style={{ fontFamily: typography.fontFamily }}`.
- `<thead>`: `bg-gray-50`.
- `<th>`: `px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider` (+ `hover:bg-gray-100` if clickable) + `style={{ fontFamily: typography.headingFontFamily }}`.
- `<tbody>`: `bg-white divide-y divide-gray-200`.
- `<tr>`: `hover:bg-gray-50 cursor-pointer transition-colors` when rows are interactive.
- `<td>`: `px-6 py-4 whitespace-nowrap` (add `truncate max-w-md` where appropriate).

---

## 7) Loading States and Motion

### Loading Patterns

- **Skeleton Loading (Preferred for Page/Section Loading)**
  - Use skeleton screens when entire pages, sections, or data tables are loading
  - Provides visual structure that matches the final content layout
  - Reduces perceived loading time and layout shift
  - Creates a more polished, professional user experience
  - Implementation: Use gray placeholder blocks that mimic the shape of content (cards, text lines, buttons)

- **Spinners (Limited Use Cases)**
  - Reserve for small, localized loading (individual buttons, small components)
  - Use the brand primary color (`#3B82F6`) for spinner elements
  - Should include appropriate ARIA labels and loading text for screen readers
  - Example: "Save" button shows spinner while saving a form

- **Loading Guidelines**
  - **Page-level loading:** Always use skeleton screens
  - **Section/card loading:** Prefer skeleton screens
  - **Button/form actions:** Use spinners with disabled state
  - **Data fetching in tables:** Use skeleton rows matching table structure
  - **Image loading:** Use placeholder with subtle animation

### Motion

- **Motion**
  - Micro-interactions: 150–250ms; page transitions: 300–400ms.
  - Honor `prefers-reduced-motion`.
  - Skeleton animations should be subtle (gentle shimmer effect)

### Accessibility

- **Accessibility**
  - Contrast: 4.5:1 for text.
  - Keyboard operability for all controls; visible focus rings.
  - ARIA labels for icon-only buttons.
  - Loading states must include `aria-live` regions and descriptive text for screen readers.

---

## 8) Embedding Considerations

- Avoid global resets; rely on the base tokens in `src/index.css`.
- If needed, wrap screens in a root class (e.g., `.jsg-child-app`) to scope overrides when embedded.
- Allow the wrapper to control page scroll; your content should fit within the content area described above.

---

## 9) Source of Truth and Consistency

- Keep `--color-primary` and Tailwind `theme.colors.primary.500` in sync.
- Use the shared utility classes defined in `src/index.css` wherever possible to avoid ad‑hoc styling.
- If a new variant is needed (e.g., danger/ghost button), add it to `src/index.css` once and re‑use across child apps.

---

## 10) Approved Color Tokens (Reference)

Use these values across all child apps to ensure a consistent design language. This appendix documents the approved palette only and does not alter code.

- **Primary (brand)**: `#3B82F6`
  - Usage: brand accents and focus rings; use `primary-600/700` for action fills and link text
  - Tailwind (when implemented): `bg-primary-600 hover:bg-primary-700`, `text-primary-600 hover:text-primary-700`, `focus:ring-primary-500`
  - Token (when implemented): `--color-primary`

- **Background (page outside content)**: `#F9FAFB`
  - Token: `--color-background`

- **Surfaces (cards/panels)**: `#FFFFFF`

- **Borders**: `#E5E7EB` → `--color-border`

- **Dividers**: `#F3F4F6` → `--color-divider`

- **Text primary**: `#111827` → `--color-text`

- **Text secondary**: `#6B7280` → `--color-textSecondary`

- **Success**: `#10B981` (emerald-500)
  - Tokens: `--color-success`
  - Badges/soft fills: mix 15% on white for subtle backgrounds

- **Warning**: `#F59E0B` (amber-500)
  - Token: `--color-warning`

- **Error**: `#EF4444` (red-500)
  - Token: `--color-error`

- **Info / Focus**: `#3B82F6` (blue-500)
  - Tokens: `--color-info`, focus border/shadow colors

- **IHU selection (neutral slate scale)**
  - Level 0 selected: `#1E293B` (slate-800)
  - Level 1 selected: `#334155` (slate-700)
  - Level 2+ selected: `#475569` (slate-600)
  - Unselected/hover neutrals: slate/gray 50–200

### Notes

- Prefer `primary-600/700` for actions and link text; reserve the brand blue `#3B82F6` for accents and focus.
- For consistency, prefer Tailwind utilities mapped to tokens (e.g., `primary-*`) over raw `blue-*` once implemented.
- Maintain contrast ratios of 4.5:1 for text-elements and 3:1 for large text and UI components.
