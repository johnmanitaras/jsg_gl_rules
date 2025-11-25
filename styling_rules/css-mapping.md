# CSS Variables Mapping Reference for JetSetGo Template

**Generated**: 2025-01-25  
**Project**: JetSetGo Child App Template  
**Purpose**: Complete variable mapping for CSS Variables Migration project

## Overview

This document provides a comprehensive mapping from the current 88 CSS variables in the JetSetGo Template to the standardized JetSetGo CSS Variables System in the wrapper application. The wrapper provides 200+ design tokens that ensure consistency across all child applications.

**Mapping Strategy**:
- ✅ **Direct Match**: Current variable maps directly to a wrapper variable
- 🔄 **Semantic Match**: Current variable maps to a semantically equivalent wrapper variable  
- ⚠️ **Partial Match**: Close match but may require minor adjustments
- ❌ **No Match**: No equivalent in wrapper - needs custom app variable
- 🆕 **New Required**: Hardcoded values that need new variables

---

## 1. Color Variables Mapping

### 1.1 Primary Brand Colors

| Current Variable | Current Value | Wrapper Variable | Wrapper Value | Match Type | Notes |
|------------------|---------------|------------------|---------------|------------|-------|
| `--color-primary` | `#2563eb` | `--color-primary-600` | `#2563eb` | ✅ Direct | Perfect match - same blue color |
| `--color-hover` | `#1d4ed8` | `--color-primary-700` | `#1d4ed8` | ✅ Direct | Perfect match for hover state |
| `--color-active` | `#1e40af` | `--color-primary-800` | `#1e40af` | ✅ Direct | Perfect match for active state |
| `--color-info` | `#3b82f6` | `--color-info-500` | `#3b82f6` | ✅ Direct | Perfect match |

### 1.2 Semantic Status Colors

| Current Variable | Current Value | Wrapper Variable | Wrapper Value | Match Type | Notes |
|------------------|---------------|------------------|---------------|------------|-------|
| `--color-success` | `#16a34a` | `--color-success-600` | `#059669` | 🔄 Semantic | Different shade but same semantic meaning |
| `--color-warning` | `#facc15` | `--color-warning-400` | `#fbbf24` | 🔄 Semantic | Close yellow, slight difference in saturation |
| `--color-error` | `#dc2626` | `--color-error-600` | `#dc2626` | ✅ Direct | Perfect match |

### 1.3 Neutral & Text Colors  

| Current Variable | Current Value | Wrapper Variable | Wrapper Value | Match Type | Notes |
|------------------|---------------|------------------|---------------|------------|-------|
| `--color-background` | `#f9fafb` | `--color-background` | `#f9fafb` | ✅ Direct | Perfect match |
| `--color-text` | `#111827` | `--color-text` | `#111827` | ✅ Direct | Perfect match |
| `--color-textSecondary` | `#6b7280` | `--color-text-secondary` | `#6b7280` | ✅ Direct | Perfect match, rename needed |
| `--color-border` | `#e5e7eb` | `--color-border` | `#e5e7eb` | ✅ Direct | Perfect match |
| `--color-divider` | `#f3f4f6` | `--color-border-secondary` | `#f3f4f6` | 🔄 Semantic | Divider → border-secondary |
| `--color-disabled` | `#9ca3af` | `--color-text-tertiary` | `#9ca3af` | 🔄 Semantic | Disabled → tertiary text |

### 1.4 Input-Specific Colors

| Current Variable | Current Value | Wrapper Variable | Wrapper Value | Match Type | Notes |
|------------------|---------------|------------------|---------------|------------|-------|
| `--input-borderColor` | `#d3d3d6` | `--input-borderColor` | `#d1d5db` | ⚠️ Partial | Slight difference, wrapper value preferred |
| `--input-background` | `#ffffff` | `--input-background` | `#ffffff` | ✅ Direct | Perfect match |
| `--input-placeholderColor` | `#9ca3af` | `--input-placeholderColor` | `#9ca3af` | ✅ Direct | Perfect match |
| `--input-disabledBackground` | `#f3f4f6` | `--input-disabledBackground` | `#f3f4f6` | ✅ Direct | Perfect match |
| `--input-disabledColor` | `#6b7280` | `--input-disabledColor` | `#6b7280` | ✅ Direct | Perfect match |

### 1.5 Focus Colors

| Current Variable | Current Value | Wrapper Variable | Wrapper Value | Match Type | Notes |
|------------------|---------------|------------------|---------------|------------|-------|
| `--focus-borderColor` | `#3b82f6` | `--focus-borderColor` | `#3b82f6` | ✅ Direct | Perfect match |
| `--focus-shadowColor` | `#3b82f6` | `--focus-shadowColor` | `#3b82f6` | ✅ Direct | Perfect match |

### 1.6 Hardcoded Colors Needing Variables

| Hardcoded Value | Location | Suggested Wrapper Variable | Match Type | Notes |
|-----------------|----------|----------------------------|------------|-------|
| `text-red-500` | Toast.tsx | `--color-error-500` | 🆕 New | `#ef4444` |
| `text-gray-700` | Toast.tsx | `--color-gray-700` | 🆕 New | `#374151` |
| `text-gray-400` | Toast.tsx | `--color-gray-400` | 🆕 New | `#9ca3af` |
| `bg-red-50` | AccessDenied.tsx | `--color-error-50` | 🆕 New | `#fef2f2` |
| `bg-gray-50` | Multiple | `--color-gray-50` | 🆕 New | `#f9fafb` |
| `text-blue-700` | PermissionsList.tsx | `--color-primary-700` | 🆕 New | `#1d4ed8` |
| `bg-blue-50` | PermissionsList.tsx | `--color-primary-50` | 🆕 New | `#eff6ff` |
| `text-purple-600` | GraphQLTestResults.tsx | `--jetsetgo-template-status-processing` | ❌ No Match | Need custom variable |
| `text-green-600` | Multiple | `--color-success-600` | 🆕 New | `#059669` |
| `text-yellow-600` | GraphQLTestResults.tsx | `--color-warning-600` | 🆕 New | `#d97706` |

---

## 2. Typography Variables Mapping

### 2.1 Font Family Variables

| Current Variable | Current Value | Wrapper Variable | Wrapper Value | Match Type | Notes |
|------------------|---------------|------------------|---------------|------------|-------|
| `--typography-fontFamily` | `'Inter', -apple-system, ...` | `--font-family-base` | `'Inter', -apple-system, ...` | ✅ Direct | Identical font stack |
| `--typography-headingFontFamily` | `'Inter', -apple-system, ...` | `--font-family-heading` | `'Inter', -apple-system, ...` | ✅ Direct | Identical font stack |

### 2.2 Font Weight Variables

| Current Variable | Current Value | Wrapper Variable | Wrapper Value | Match Type | Notes |
|------------------|---------------|------------------|---------------|------------|-------|
| `--typography-fontWeightLight` | `300` | `--font-weight-light` | `300` | ✅ Direct | Perfect match |
| `--typography-fontWeightRegular` | `400` | `--font-weight-normal` | `400` | 🔄 Semantic | Regular → normal |
| `--typography-fontWeightMedium` | `500` | `--font-weight-medium` | `500` | ✅ Direct | Perfect match |
| `--typography-fontWeightBold` | `700` | `--font-weight-bold` | `700` | ✅ Direct | Perfect match |

### 2.3 Font Size Variables

| Current Variable | Current Value | Wrapper Variable | Wrapper Value | Match Type | Notes |
|------------------|---------------|------------------|---------------|------------|-------|
| `--typography-baseSize` | `16px` | `--text-base` | `1rem` | 🔄 Semantic | px → rem, same computed value |
| `--input-fontSize` | `0.875rem` | `--text-sm` | `0.875rem` | ✅ Direct | Perfect match |
| `--button-fontSize` | `0.875rem` | `--text-sm` | `0.875rem` | ✅ Direct | Perfect match |

### 2.4 Line Height Variables

| Current Variable | Current Value | Wrapper Variable | Wrapper Value | Match Type | Notes |
|------------------|---------------|------------------|---------------|------------|-------|
| `--typography-lineHeight` | `1.5` | `--leading-normal` | `1.5` | ✅ Direct | Perfect match |

---

## 3. Spacing Variables Mapping

### 3.1 Base Spacing Scale

| Current Variable | Current Value | Wrapper Variable | Wrapper Value | Match Type | Notes |
|------------------|---------------|------------------|---------------|------------|-------|
| `--spacing-base` | `4px` | `--spacing-1` | `0.25rem` (4px) | ✅ Direct | Perfect match |
| `--spacing-xs` | `8px` | `--spacing-2` | `0.5rem` (8px) | ✅ Direct | Perfect match |
| `--spacing-sm` | `12px` | `--spacing-3` | `0.75rem` (12px) | ✅ Direct | Perfect match |
| `--spacing-md` | `16px` | `--spacing-4` | `1rem` (16px) | ✅ Direct | Perfect match |
| `--spacing-lg` | `24px` | `--spacing-6` | `1.5rem` (24px) | ✅ Direct | Perfect match |
| `--spacing-xl` | `32px` | `--spacing-8` | `2rem` (32px) | ✅ Direct | Perfect match |

### 3.2 Component-Specific Spacing

| Current Variable | Current Value | Wrapper Variable | Wrapper Value | Match Type | Notes |
|------------------|---------------|------------------|---------------|------------|-------|
| `--input-padding` | `0.5rem 1rem` | `--spacing-input-padding-y` + `--spacing-input-padding-x` | `0.5rem` + `0.75rem` | ⚠️ Partial | Y matches, X differs (12px vs 16px) |
| `--button-padding` | `0.5rem 1rem` | `--spacing-button-padding-y` + `--spacing-button-padding-x` | `0.75rem` + `1.5rem` | ⚠️ Partial | Both values differ |

### 3.3 Hardcoded Spacing Values

| Hardcoded Value | Location | Suggested Wrapper Variable | Match Type | Notes |
|-----------------|----------|----------------------------|------------|-------|
| `min-w-[320px]` | Toast.tsx | `--container-xs` | 🔄 Semantic | `20rem` (320px) available |
| `w-96` | Login.tsx | `--spacing-96` | ✅ Direct | `24rem` (384px) |
| `max-w-md` | AccessDenied.tsx | `--container-md` | ✅ Direct | `28rem` (448px) |

---

## 4. Border & Shadow Variables Mapping

### 4.1 Border Radius Variables

| Current Variable | Current Value | Wrapper Variable | Wrapper Value | Match Type | Notes |
|------------------|---------------|------------------|---------------|------------|-------|
| `--radius-none` | `0` | `--radius-none` | `0` | ✅ Direct | Perfect match |
| `--radius-sm` | `0.25rem` | `--radius-sm` | `0.25rem` | ✅ Direct | Perfect match |
| `--radius-md` | `0.375rem` | `--radius-md` | `0.375rem` | ✅ Direct | Perfect match |
| `--radius-lg` | `0.5rem` | `--radius-lg` | `0.5rem` | ✅ Direct | Perfect match |
| `--radius-full` | `9999px` | `--radius-full` | `9999px` | ✅ Direct | Perfect match |

### 4.2 Component-Specific Radius

| Current Variable | Current Value | Wrapper Variable | Wrapper Value | Match Type | Notes |
|------------------|---------------|------------------|---------------|------------|-------|
| `--input-borderRadius` | `0.375rem` | `--radius-input` | `0.5rem` | ⚠️ Partial | Wrapper uses 8px vs current 6px |
| `--button-borderRadius` | `0.375rem` | `--radius-button` | `0.5rem` | ⚠️ Partial | Wrapper uses 8px vs current 6px |

### 4.3 Shadow Variables

| Current Variable | Current Value | Wrapper Variable | Wrapper Value | Match Type | Notes |
|------------------|---------------|------------------|---------------|------------|-------|
| `--shadow-none` | `none` | `--shadow-none` | `none` | ✅ Direct | Perfect match |
| `--shadow-sm` | `0 1px 2px 0 rgba(0, 0, 0, 0.05)` | `--shadow-sm` | `0 1px 2px 0 rgba(0, 0, 0, 0.05)` | ✅ Direct | Perfect match |
| `--shadow-md` | `0 4px 6px -1px rgba(0, 0, 0, 0.1)` | `--shadow-md` | `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)` | ⚠️ Partial | Wrapper has additional layer |
| `--shadow-lg` | `0 10px 15px -3px rgba(0, 0, 0, 0.1)` | `--shadow-lg` | `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)` | ⚠️ Partial | Wrapper has additional layer |
| `--shadow-xl` | `0 20px 25px -5px rgba(0, 0, 0, 0.1)` | `--shadow-xl` | `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)` | ⚠️ Partial | Wrapper has additional layer |

---

## 5. Component Height & Sizing Variables

### 5.1 Input & Button Heights

| Current Variable | Current Value | Wrapper Variable | Wrapper Value | Match Type | Notes |
|------------------|---------------|------------------|---------------|------------|-------|
| `--input-height` | `2.5rem` (40px) | `--height-input` | `2.5rem` (40px) | ✅ Direct | Perfect match |
| `--button-height` | `2.5rem` (40px) | `--height-button` | `3.25rem` (52px) | ❌ No Match | Wrapper buttons are larger |

### 5.2 Other Component Sizing

| Current Variable | Current Value | Wrapper Variable | Wrapper Value | Match Type | Notes |
|------------------|---------------|------------------|---------------|------------|-------|
| `--button-minWidth` | `64px` | N/A | N/A | ❌ No Match | Need custom variable |

---

## 6. Animation & Timing Variables

### 6.1 Animation Variables

| Current Variable | Current Value | Wrapper Variable | Wrapper Value | Match Type | Notes |
|------------------|---------------|------------------|---------------|------------|-------|
| `--animation-duration` | `150ms` | `--duration-fast` | `150ms` | ✅ Direct | Perfect match |
| `--animation-timing` | `ease` | `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | 🔄 Semantic | Different but improved easing |
| `--button-transition` | `all 150ms ease` | `--transition-fast` | `all 150ms cubic-bezier(0, 0, 0.2, 1)` | 🔄 Semantic | Same duration, better easing |

---

## 7. Focus State Variables

### 7.1 Focus Ring Configuration

| Current Variable | Current Value | Wrapper Variable | Wrapper Value | Match Type | Notes |
|------------------|---------------|------------------|---------------|------------|-------|
| `--focus-enabled` | `true` | N/A | N/A | ❌ No Match | Boolean not needed |
| `--focus-borderWidth` | `2px` | `--focus-ringWidth` | `2px` | ✅ Direct | Perfect match |
| `--focus-shadowEnabled` | `true` | N/A | N/A | ❌ No Match | Boolean not needed |
| `--focus-shadowOpacity` | `0.25` | `--focus-ringOpacity` | `0.5` | ⚠️ Partial | Wrapper uses higher opacity |
| `--focus-shadowSize` | `4px` | `--focus-ringOffset` | `2px` | ❌ No Match | Different implementation approach |
| `--focus-outlineWidth` | `2px` | `--focus-ringWidth` | `2px` | ✅ Direct | Duplicate, can use wrapper |
| `--focus-outlineOffset` | `2px` | `--focus-ringOffset` | `2px` | ✅ Direct | Perfect match |

---

## 8. App-Specific Custom Variables Needed

Based on the analysis, the following custom variables should be created following the `--jetsetgo-template-*` namespace:

### 8.1 Status Colors

```css
/* Custom status colors not in wrapper system */
--jetsetgo-template-status-processing: #9333ea;  /* Purple for GraphQL processing */
--jetsetgo-template-status-queued: #ca8a04;      /* Yellow-600 for queued states */
```

### 8.2 Component Sizing

```css
/* Button minimum width (not in wrapper) */
--jetsetgo-template-button-min-width: 64px;

/* Toast component width */
--jetsetgo-template-toast-min-width: 320px;
```

### 8.3 Legacy Focus Implementation  

```css
/* Focus shadow implementation (if keeping current approach) */
--jetsetgo-template-focus-shadow-size: 4px;
--jetsetgo-template-focus-shadow-opacity: 0.25;
```

---

## 9. Migration Recommendations

### 9.1 High Priority Changes

1. **Update Primary Colors**: Replace `--color-primary` with `--color-primary-600`
2. **Rename Text Variables**: Change `--color-textSecondary` to `--color-text-secondary`
3. **Update Button Heights**: Adopt wrapper's 52px button height for consistency
4. **Replace Hardcoded Colors**: Convert all hardcoded gray/status colors to variables

### 9.2 Medium Priority Changes

1. **Border Radius**: Adopt wrapper's 8px standard radius (currently 6px)
2. **Button Padding**: Update to wrapper's standard padding values
3. **Focus Ring**: Consider adopting wrapper's higher opacity (0.5 vs 0.25)
4. **Shadows**: Upgrade to wrapper's multi-layer shadow system

### 9.3 Low Priority Changes

1. **Animation Easing**: Upgrade from `ease` to `cubic-bezier(0, 0, 0.2, 1)`
2. **Success Color**: Consider switching to wrapper's emerald green
3. **Warning Color**: Minor adjustment to match wrapper's amber

### 9.4 Breaking Changes

⚠️ **Component Size Changes**:
- Button height will increase from 40px to 52px
- Border radius will increase from 6px to 8px
- Button padding will change for better proportions

⚠️ **Color Changes**:  
- Success green will shift from lime to emerald
- Warning yellow will shift slightly in saturation
- Focus ring opacity will increase (more visible)

---

## 10. Implementation Plan

### Phase 1: Direct Replacements (Zero Risk)
- Update variables that have perfect matches
- Rename variables to match wrapper conventions  
- Add missing color scale variables from wrapper

### Phase 2: Semantic Mappings (Low Risk)
- Replace similar but not identical variables
- Update animation easing functions
- Adopt wrapper typography tokens

### Phase 3: Size & Layout Updates (Medium Risk)
- Update button and input sizing
- Adopt wrapper border radius standards
- Update component padding values

### Phase 4: Visual Refinements (High Risk)
- Update shadow system to multi-layer
- Adjust focus ring implementation
- Fine-tune color variations

### Phase 5: Custom Variables (No Risk)
- Add app-specific custom variables
- Clean up unused variables
- Document final implementation

---

## 11. Variable Count Summary

| Category | Current Variables | Wrapper Equivalents | Direct Matches | Semantic Matches | No Matches | Custom Needed |
|----------|------------------|-------------------|----------------|------------------|------------|---------------|
| Colors | 19 | 180+ | 8 | 5 | 2 | 4 |
| Typography | 8 | 35+ | 4 | 3 | 0 | 1 |
| Spacing | 6 | 50+ | 6 | 0 | 0 | 0 |
| Borders | 5 | 15+ | 5 | 0 | 0 | 0 |
| Shadows | 5 | 15+ | 2 | 0 | 3 | 0 |
| Component | 25 | 40+ | 12 | 6 | 5 | 2 |
| Focus | 8 | 8 | 4 | 0 | 3 | 1 |
| Animation | 2 | 15+ | 1 | 1 | 0 | 0 |

**Totals**: 88 current variables → 42 direct matches, 15 semantic matches, 13 no matches, 8 custom needed

---

**End of CSS Variables Mapping Reference**

*This document provides the complete roadmap for migrating from the current CSS variable system to the standardized JetSetGo CSS Variables System. Update this document as implementation progresses.*