# CSS Variables Compliance Guide for JetSetGo Child Applications

**Version**: 2.0  
**Date**: January 2025  
**Project**: JetSetGo Template Application  
**Purpose**: Comprehensive styling guidelines, CSS variables usage standards, development workflow, and testing procedures

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [CSS Variables System Overview](#2-css-variables-system-overview)
3. [Styling Guidelines](#3-styling-guidelines)
4. [CSS Variables Usage](#4-css-variables-usage)
5. [Component Patterns](#5-component-patterns)
6. [Responsive Design Guidelines](#6-responsive-design-guidelines)
7. [Dark Mode & Accessibility](#7-dark-mode--accessibility)
8. [Performance Considerations](#8-performance-considerations)
9. [Migration Standards](#9-migration-standards)
10. [Testing & Validation](#10-testing--validation)
11. [Development Workflow](#11-development-workflow)
12. [Custom CSS Variables Documentation](#12-custom-css-variables-documentation)
13. [Common Pitfalls](#13-common-pitfalls)
14. [Future Guidelines](#14-future-guidelines)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. Introduction

This guide establishes comprehensive styling standards for JetSetGo child applications using the CSS Variables system. It ensures consistency, maintainability, and seamless integration with the wrapper application while supporting both embedded and standalone modes.

### 1.1 Design Philosophy

- **Consistency First**: Use standardized design tokens across all applications
- **Flexible Integration**: Support both embedded and standalone deployment modes  
- **Progressive Enhancement**: Graceful fallbacks when wrapper variables are unavailable
- **Developer Experience**: Clear patterns and predictable behavior
- **Performance Focused**: Efficient CSS delivery and minimal runtime overhead

### 1.2 Key Benefits

- ✅ **Unified Design Language**: Consistent UI across all JetSetGo applications
- ✅ **Flexible Deployment**: Works in embedded and standalone modes
- ✅ **Easy Maintenance**: Centralized styling updates via wrapper variables
- ✅ **Type Safety**: TypeScript integration for CSS variables
- ✅ **Future-Proof**: Ready for design system evolution

---

## 2. CSS Variables System Overview

### 2.1 Variable Hierarchy

The CSS variables system uses a three-tier approach:

#### 2.1.1 Wrapper Variables (Primary)
Provided by the parent wrapper application for embedded mode:

```css
/* Color System */
--color-primary-600: #2563eb;
--color-background: #f9fafb;  
--color-text: #111827;
--color-text-secondary: #6b7280;

/* Typography System */
--font-family-base: 'Inter', sans-serif;
--text-base: 1rem;
--leading-normal: 1.5;

/* Spacing System */
--spacing-4: 1rem;
--spacing-6: 1.5rem;
--spacing-8: 2rem;

/* Component System */
--radius-md: 0.375rem;
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
```

#### 2.1.2 App-Specific Variables (Secondary)
Namespaced variables for app-specific customizations:

```css
/* Status Colors */
--jetsetgo-template-status-processing: #9333ea;
--jetsetgo-template-status-queued: #ca8a04;

/* Component Sizing */
--jetsetgo-template-button-min-width: 64px;
--jetsetgo-template-toast-min-width: 320px;

/* Animation Timing */
--jetsetgo-template-animation-delay-short: 0.1s;
--jetsetgo-template-animation-delay-medium: 0.3s;
```

#### 2.1.3 Fallback Variables (Tertiary)
Hard-coded fallbacks for standalone mode:

```css
/* Usage Pattern */
color: var(--color-primary-600, #2563eb);
font-family: var(--font-family-base, 'Inter', sans-serif);
```

### 2.2 Variable Naming Conventions

#### 2.2.1 Wrapper Variables
Follow the established wrapper naming conventions:
- **Colors**: `--color-{semantic}-{scale}` (e.g., `--color-primary-600`)
- **Spacing**: `--spacing-{scale}` (e.g., `--spacing-4`)
- **Typography**: `--text-{size}`, `--font-{property}` (e.g., `--text-sm`)
- **Components**: `--{component}-{property}` (e.g., `--button-height`)

#### 2.2.2 App-Specific Variables
Use the `--jetsetgo-template-*` namespace:
- **Status**: `--jetsetgo-template-status-{name}`
- **Components**: `--jetsetgo-template-{component}-{property}`
- **Animations**: `--jetsetgo-template-animation-{type}`
- **Layout**: `--jetsetgo-template-layout-{property}`

#### 2.2.3 Component-Scoped Variables
For component-specific overrides:
```css
.jetsetgo-toast {
  --toast-z-index: 9999;
  --toast-animation-duration: var(--animation-duration, 150ms);
}
```

---

## 3. Styling Guidelines

### 3.1 Primary Styling Methods

#### 3.1.1 CSS Variables (Preferred)
Use CSS variables for all themeable properties:

```css
.button-primary {
  background-color: var(--color-primary-600);
  color: var(--color-white);
  border-radius: var(--radius-md);
  padding: var(--spacing-2) var(--spacing-4);
  font-family: var(--font-family-base);
}
```

#### 3.1.2 Tailwind Utilities (Complementary)
Use Tailwind for layout and non-themeable properties:

```html
<div class="flex items-center justify-between w-full max-w-md">
  <button class="btn-primary">Submit</button>
</div>
```

#### 3.1.3 Component Classes (Structured)
Create reusable component classes:

```css
.card {
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
```

### 3.2 Styling Priority Order

1. **CSS Variables** - For all design token values
2. **Component Classes** - For reusable component patterns
3. **Tailwind Utilities** - For layout and positioning
4. **Custom CSS** - Only when necessary, with CSS variables

### 3.3 Anti-Patterns to Avoid

❌ **Hardcoded Colors**:
```css
/* DON'T */
.error-message {
  color: #dc2626;
  background-color: #fef2f2;
}
```

✅ **Use Variables**:
```css
/* DO */
.error-message {
  color: var(--color-error-600);
  background-color: var(--color-error-50);
}
```

❌ **Inline Styles for Themeable Properties**:
```jsx
// DON'T
<div style={{ backgroundColor: '#f9fafb', padding: '16px' }}>
```

✅ **Use Classes or CSS Variables**:
```jsx
// DO
<div className="bg-[var(--color-background)] p-[var(--spacing-4)]">
```

---

## 4. CSS Variables Usage

### 4.1 Runtime Variable Detection

Use the provided utilities for checking variable availability:

```typescript
import { 
  isCSSVariableAvailable, 
  areWrapperVariablesAvailable,
  isEmbeddedMode 
} from '../utils/cssVariables';

// Check if specific variable is available
const hasPrimary = isCSSVariableAvailable('--color-primary-600');

// Check embedding status
const isEmbedded = isEmbeddedMode();

// Initialize fallbacks if needed
if (!isEmbedded) {
  initializeStandaloneFallbacks();
}
```

### 4.2 Fallback Patterns

#### 4.2.1 Direct Fallbacks
Provide immediate fallback values:

```css
.button {
  background-color: var(--color-primary-600, #2563eb);
  color: var(--color-white, #ffffff);
  border-radius: var(--radius-md, 0.375rem);
}
```

#### 4.2.2 Cascading Fallbacks
Chain multiple fallbacks:

```css
.text-primary {
  color: var(--color-primary-600, var(--color-primary, #2563eb));
}
```

#### 4.2.3 Component-Scoped Fallbacks
Provide component-specific defaults:

```css
.jetsetgo-toast {
  --toast-bg: var(--color-background, #ffffff);
  --toast-border: var(--color-border, #e5e7eb);
  --toast-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
  
  background-color: var(--toast-bg);
  border: 1px solid var(--toast-border);
  box-shadow: var(--toast-shadow);
}
```

### 4.3 Dynamic Variable Usage

#### 4.3.1 React Component Integration
```tsx
import { getCSSVariableValue, cssVar } from '../utils/cssVariables';

function ThemedButton({ variant = 'primary' }: { variant?: string }) {
  const buttonStyle = {
    backgroundColor: getCSSVariableValue(`--color-${variant}-600`, '#2563eb'),
    borderRadius: getCSSVariableValue('--radius-md', '0.375rem'),
  };

  return <button style={buttonStyle}>Click me</button>;
}
```

#### 4.3.2 Conditional Variable Application
```tsx
import { useWrapperVariableStatus } from '../utils/cssVariables';

function AdaptiveComponent() {
  const { isEmbedded, hasWrapperVars } = useWrapperVariableStatus();
  
  const className = `
    ${hasWrapperVars ? 'embedded-styling' : 'standalone-styling'}
    ${isEmbedded ? 'wrapper-integration' : 'standalone-mode'}
  `.trim();

  return <div className={className}>Adaptive content</div>;
}
```

---

## 5. Component Patterns

### 5.1 Button Patterns

#### 5.1.1 Primary Button
```css
.btn-primary {
  background-color: var(--color-primary-600);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-md);
  padding: var(--spacing-2) var(--spacing-4);
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-medium);
  font-size: var(--text-sm);
  min-width: var(--jetsetgo-template-button-min-width);
  height: var(--height-button, 2.5rem);
  transition: var(--transition-fast, all 150ms ease);
  cursor: pointer;
}

.btn-primary:hover {
  background-color: var(--color-primary-700);
}

.btn-primary:focus {
  outline: var(--focus-ringWidth, 2px) solid var(--focus-borderColor);
  outline-offset: var(--focus-ringOffset, 2px);
}

.btn-primary:disabled {
  background-color: var(--color-gray-300);
  color: var(--color-gray-500);
  cursor: not-allowed;
}
```

#### 5.1.2 Secondary Button
```css
.btn-secondary {
  background-color: transparent;
  color: var(--color-primary-600);
  border: 1px solid var(--color-primary-600);
  border-radius: var(--radius-md);
  padding: var(--spacing-2) var(--spacing-4);
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-medium);
  font-size: var(--text-sm);
  min-width: var(--jetsetgo-template-button-min-width);
  height: var(--height-button, 2.5rem);
  transition: var(--transition-fast, all 150ms ease);
  cursor: pointer;
}

.btn-secondary:hover {
  background-color: var(--color-primary-50);
  border-color: var(--color-primary-700);
}
```

### 5.2 Form Patterns

#### 5.2.1 Input Fields
```css
.input {
  width: 100%;
  height: var(--height-input, 2.5rem);
  padding: var(--spacing-2) var(--spacing-3);
  background-color: var(--input-background, #ffffff);
  border: var(--input-borderWidth, 1px) solid var(--input-borderColor, #d1d5db);
  border-radius: var(--radius-input, var(--radius-md, 0.375rem));
  font-family: var(--font-family-base);
  font-size: var(--text-sm);
  color: var(--color-text);
  transition: var(--transition-fast, all 150ms ease);
}

.input::placeholder {
  color: var(--input-placeholderColor, #9ca3af);
}

.input:focus {
  border-color: var(--focus-borderColor);
  outline: var(--focus-ringWidth, 2px) solid var(--focus-borderColor);
  outline-offset: var(--focus-ringOffset, 2px);
}

.input:disabled {
  background-color: var(--input-disabledBackground, #f3f4f6);
  color: var(--input-disabledColor, #6b7280);
  cursor: not-allowed;
}
```

### 5.3 Card Patterns

#### 5.3.1 Basic Card
```css
.card {
  background-color: var(--color-background, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: var(--radius-lg, 0.5rem);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.card-header {
  padding: var(--jetsetgo-template-card-padding, 1.5rem);
  border-bottom: 1px solid var(--color-border-secondary, #f3f4f6);
  background-color: var(--color-gray-50, #f9fafb);
}

.card-body {
  padding: var(--jetsetgo-template-card-padding, 1.5rem);
}

.card-footer {
  padding: var(--jetsetgo-template-card-padding, 1.5rem);
  border-top: 1px solid var(--color-border-secondary, #f3f4f6);
  background-color: var(--color-gray-50, #f9fafb);
}
```

### 5.4 Status Patterns

#### 5.4.1 Badge Components
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-full, 9999px);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-family-base);
}

.badge-success {
  background-color: var(--color-success-100, #dcfce7);
  color: var(--color-success-800, #166534);
}

.badge-warning {
  background-color: var(--color-warning-100, #fef3c7);
  color: var(--color-warning-800, #92400e);
}

.badge-error {
  background-color: var(--color-error-100, #fee2e2);
  color: var(--color-error-800, #991b1b);
}

.badge-processing {
  background-color: color-mix(in srgb, var(--jetsetgo-template-status-processing) 10%, transparent);
  color: var(--jetsetgo-template-status-processing);
}
```

### 5.5 Layout Patterns

#### 5.5.1 Container
```css
.container {
  width: 100%;
  max-width: var(--container-7xl, 80rem);
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--spacing-6, 1.5rem);
  padding-right: var(--spacing-6, 1.5rem);
}

/* Responsive containers */
.container-sm { max-width: var(--container-sm, 24rem); }
.container-md { max-width: var(--container-md, 28rem); }
.container-lg { max-width: var(--container-lg, 32rem); }
.container-xl { max-width: var(--container-xl, 36rem); }
```

---

## 6. Responsive Design Guidelines

### 6.1 Breakpoint Variables

Use wrapper-provided breakpoint variables when available:

```css
/* Responsive spacing */
.responsive-padding {
  padding: var(--spacing-4);
}

@media (min-width: 768px) {
  .responsive-padding {
    padding: var(--spacing-6);
  }
}

@media (min-width: 1024px) {
  .responsive-padding {
    padding: var(--spacing-8);
  }
}
```

### 6.2 Mobile-First Approach

Design for mobile first, then enhance for larger screens:

```css
.responsive-card {
  width: 100%;
  margin: var(--spacing-4);
}

/* Tablet */
@media (min-width: 768px) {
  .responsive-card {
    width: 50%;
    margin: var(--spacing-6);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .responsive-card {
    width: 33.333%;
    margin: var(--spacing-8);
  }
}
```

### 6.3 Container Queries (Future)

Prepare for container query support:

```css
.adaptive-component {
  --component-padding: var(--spacing-4);
}

/* When container queries are supported */
@container (min-width: 400px) {
  .adaptive-component {
    --component-padding: var(--spacing-6);
  }
}
```

---

## 7. Dark Mode & Accessibility

### 7.1 Dark Mode Support

Prepare components for future dark mode implementation:

```css
.dark-mode-ready {
  background-color: var(--color-background);
  color: var(--color-text);
  border-color: var(--color-border);
}

/* Future dark mode variables */
@media (prefers-color-scheme: dark) {
  :root {
    --jetsetgo-template-status-processing: #a855f7; /* Lighter for dark mode */
    --jetsetgo-template-dev-border: 2px dashed #f87171;
  }
}
```

### 7.2 High Contrast Support

Support high contrast preferences:

```css
@media (prefers-contrast: high) {
  :root {
    --jetsetgo-template-focus-shadow-opacity: 1;
    --jetsetgo-template-status-processing: #7c3aed;
  }
  
  .button {
    border-width: 2px;
  }
  
  .card {
    border-width: 2px;
  }
}
```

### 7.3 Reduced Motion

Respect motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --jetsetgo-template-animation-delay-short: 0ms;
    --jetsetgo-template-animation-delay-medium: 0ms;
    --jetsetgo-template-animation-delay-long: 0ms;
  }
  
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 7.4 Focus Indicators

Ensure visible focus indicators:

```css
.focusable:focus {
  outline: var(--focus-ringWidth, 2px) solid var(--focus-borderColor);
  outline-offset: var(--focus-ringOffset, 2px);
}

.focusable:focus:not(:focus-visible) {
  outline: none;
}

.focusable:focus-visible {
  outline: var(--focus-ringWidth, 2px) solid var(--focus-borderColor);
  outline-offset: var(--focus-ringOffset, 2px);
}
```

---

## 8. Performance Considerations

### 8.1 CSS Variable Performance

#### 8.1.1 Minimize Custom Properties
- Use inheritance effectively
- Avoid excessive nesting of custom properties
- Group related variables together

#### 8.1.2 Efficient Fallbacks
```css
/* Efficient - single fallback */
color: var(--color-primary-600, #2563eb);

/* Avoid - excessive fallback chain */
color: var(--color-primary-600, var(--color-primary, var(--blue-600, #2563eb)));
```

### 8.2 Runtime Performance

#### 8.2.1 Avoid Frequent CSS Variable Changes
```typescript
// Avoid frequent updates
const updateTheme = (colors: ThemeColors) => {
  Object.entries(colors).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--${key}`, value);
  });
};

// Better - batch updates
const updateTheme = (colors: ThemeColors) => {
  const root = document.documentElement;
  const cssText = Object.entries(colors)
    .map(([key, value]) => `--${key}: ${value}`)
    .join(';');
  
  root.style.cssText += cssText;
};
```

### 8.3 Build Optimization

#### 8.3.1 CSS Purging
Ensure CSS variables are not purged by PostCSS/PurgeCSS:

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    // Preserve CSS variable classes
    { pattern: /^jetsetgo-/ },
    { pattern: /^css-var-/ },
  ],
};
```

---

## 9. Migration Standards

### 9.1 Migration Phases

#### Phase 1: Variable Inventory
1. Document all hardcoded values
2. Map to wrapper equivalents
3. Identify custom variables needed

#### Phase 2: Variable Implementation
1. Add wrapper variable references
2. Create app-specific variables
3. Update component classes

#### Phase 3: Component Migration
1. Replace hardcoded values
2. Test visual regression
3. Validate accessibility

#### Phase 4: Cleanup
1. Remove unused CSS
2. Optimize variable usage
3. Update documentation

### 9.2 Migration Checklist

For each component:
- [ ] Replace hardcoded colors with CSS variables
- [ ] Replace hardcoded spacing with spacing variables
- [ ] Replace hardcoded typography with typography variables
- [ ] Add proper fallbacks for standalone mode
- [ ] Test in both embedded and standalone modes
- [ ] Verify accessibility (focus, contrast, motion)
- [ ] Update component documentation

### 9.3 Quality Gates

Before considering migration complete:
- [ ] All hardcoded values replaced
- [ ] Visual regression tests pass
- [ ] Performance benchmarks met
- [ ] Accessibility requirements met
- [ ] Cross-browser testing complete
- [ ] Documentation updated

---

## 10. Testing & Validation

### 10.1 Visual Regression Testing

Use Playwright for comprehensive testing:

```typescript
// Example test structure
test('Component renders consistently', async ({ page }) => {
  await page.goto('/component-page');
  
  // Test desktop
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page).toHaveScreenshot('component-desktop.png');
  
  // Test tablet
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(page).toHaveScreenshot('component-tablet.png');
  
  // Test mobile
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page).toHaveScreenshot('component-mobile.png');
});
```

### 10.2 CSS Variable Validation

Test CSS variable availability:

```typescript
test('CSS variables are available', async ({ page }) => {
  await page.goto('/');
  
  const hasWrapperVars = await page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement);
    return styles.getPropertyValue('--color-primary-600').trim() !== '';
  });
  
  console.log('Wrapper variables available:', hasWrapperVars);
});
```

### 10.3 Performance Testing

Monitor performance impact:

```typescript
test('Performance is maintained', async ({ page }) => {
  await page.goto('/');
  
  const performanceMetrics = await page.evaluate(() => {
    const perfData = performance.getEntriesByType('navigation')[0];
    return {
      loadTime: perfData.loadEventEnd - perfData.navigationStart,
      domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
    };
  });
  
  expect(performanceMetrics.loadTime).toBeLessThan(3000); // 3s threshold
});
```

---

---

## 13. Common Pitfalls

### 11.1 Variable Scoping Issues

❌ **Wrong Scope**:
```css
/* Variables defined in component scope won't cascade properly */
.my-component {
  --color-primary: #blue;
}

.my-component .child {
  color: var(--color-primary); /* May not work in some browsers */
}
```

✅ **Correct Scope**:
```css
:root {
  --color-primary: #blue;
}

.my-component .child {
  color: var(--color-primary);
}
```

### 11.2 Fallback Errors

❌ **Invalid Fallback**:
```css
/* Fallback must be valid CSS value */
padding: var(--spacing-invalid, var(--spacing-4));
```

✅ **Valid Fallback**:
```css
padding: var(--spacing-invalid, 1rem);
```

### 11.3 Performance Anti-Patterns

❌ **Frequent DOM Updates**:
```javascript
// Triggers repaint on every change
elements.forEach(el => {
  el.style.setProperty('--color', randomColor());
});
```

✅ **Batch Updates**:
```javascript
// Update root once, affects all elements
document.documentElement.style.setProperty('--theme-color', newColor);
```

### 11.4 Accessibility Oversights

❌ **Insufficient Contrast**:
```css
.text-subtle {
  color: var(--color-gray-400); /* May not meet WCAG contrast ratios */
}
```

✅ **Accessible Contrast**:
```css
.text-subtle {
  color: var(--color-gray-600); /* Meets WCAG AA contrast requirements */
}
```

---

---

## 14. Future Guidelines

### 12.1 Design System Evolution

Prepare for future design system updates:

1. **Version Management**: Track wrapper design system versions
2. **Backward Compatibility**: Maintain fallbacks for deprecated variables
3. **Migration Paths**: Plan for variable name changes
4. **Feature Flags**: Support gradual rollout of new design tokens

### 12.2 Technology Adoption

Stay ready for emerging technologies:

1. **CSS Container Queries**: Implement when browser support is sufficient
2. **CSS Cascade Layers**: Use for better style organization
3. **CSS Color Functions**: Adopt for dynamic color manipulation
4. **View Transitions API**: Integrate for smooth page transitions

### 12.3 Performance Optimization

Continue optimizing as the system matures:

1. **Critical CSS**: Inline critical CSS variables
2. **Lazy Loading**: Load theme variations on demand
3. **Tree Shaking**: Remove unused CSS variables
4. **Compression**: Optimize CSS variable declarations

---

## 13. Troubleshooting Common CSS Variable Issues

### 13.1 Variable Not Found

**Problem**: CSS variable shows default value instead of expected value

```css
/* Variable appears to use fallback instead of wrapper value */
color: var(--color-primary-600, #2563eb); /* Always shows #2563eb */
```

**Diagnosis Steps**:
```typescript
// Check if variable is available
import { isCSSVariableAvailable } from '../utils/cssVariables';

const hasPrimary = isCSSVariableAvailable('--color-primary-600');
console.log('Primary color available:', hasPrimary);

// Check computed value
const computedValue = getComputedStyle(document.documentElement)
  .getPropertyValue('--color-primary-600');
console.log('Primary color value:', computedValue);
```

**Common Causes & Solutions**:

1. **Variable Not Set in DOM**
   ```typescript
   // Solution: Check if running in embedded mode
   const isEmbedded = isEmbeddedMode();
   if (!isEmbedded) {
     // Expected behavior in standalone mode
     console.log('Using fallback values in standalone mode');
   }
   ```

2. **Typo in Variable Name**
   ```css
   /* Wrong */
   color: var(--color-primary-500, #3b82f6);
   
   /* Correct */
   color: var(--color-primary-600, #2563eb);
   ```

3. **Variable Scoping Issue**
   ```css
   /* Wrong - Variable defined in wrong scope */
   .component {
     --color-primary: blue;
   }
   .other-component {
     color: var(--color-primary); /* May not work */
   }
   
   /* Correct - Use root scope for global variables */
   :root {
     --color-primary: blue;
   }
   ```

### 13.2 Fallback Values Not Working

**Problem**: CSS variable fallback doesn't render correctly

```css
/* Fallback doesn't work as expected */
padding: var(--spacing-4, 1rem); /* Shows no padding */
```

**Common Causes & Solutions**:

1. **Invalid Fallback Value**
   ```css
   /* Wrong - Invalid fallback */
   color: var(--color-primary, invalid-value);
   
   /* Correct - Valid CSS value */
   color: var(--color-primary, #2563eb);
   ```

2. **Circular Reference**
   ```css
   /* Wrong - Circular reference */
   :root {
     --color-a: var(--color-b);
     --color-b: var(--color-a);
   }
   
   /* Correct - Linear dependency */
   :root {
     --color-base: #2563eb;
     --color-primary: var(--color-base);
   }
   ```

3. **Nested Variable in Fallback**
   ```css
   /* Problematic - May not work in all browsers */
   color: var(--color-primary, var(--color-fallback, #2563eb));
   
   /* Better - Use single fallback */
   color: var(--color-primary, #2563eb);
   ```

### 13.3 Performance Issues

**Problem**: Page renders slowly or CSS updates cause lag

**Diagnosis**:
```typescript
// Measure CSS variable performance
const measureCSSPerformance = () => {
  const start = performance.now();
  
  // Simulate variable updates
  document.documentElement.style.setProperty('--test-var', '#ff0000');
  
  const end = performance.now();
  console.log(`CSS update took ${end - start}ms`);
};
```

**Common Causes & Solutions**:

1. **Excessive Variable Updates**
   ```typescript
   // Wrong - Multiple individual updates
   const updateTheme = (colors: any) => {
     Object.entries(colors).forEach(([key, value]) => {
       document.documentElement.style.setProperty(`--${key}`, value);
     });
   };
   
   // Better - Batch updates
   const updateTheme = (colors: any) => {
     const cssText = Object.entries(colors)
       .map(([key, value]) => `--${key}: ${value}`)
       .join('; ');
     document.documentElement.style.cssText += `; ${cssText}`;
   };
   ```

2. **Deep Variable Nesting**
   ```css
   /* Avoid excessive nesting */
   :root {
     --base: #000;
     --level-1: var(--base);
     --level-2: var(--level-1);
     --level-3: var(--level-2); /* Too deep */
   }
   
   /* Better - Flatter structure */
   :root {
     --base: #000;
     --variant-1: #333;
     --variant-2: #666;
   }
   ```

### 13.4 Browser Compatibility Issues

**Problem**: CSS variables don't work in older browsers

**Detection**:
```typescript
// Check for CSS variables support
const supportsCSSVariables = () => {
  return window.CSS && CSS.supports && CSS.supports('color', 'var(--test)');
};

if (!supportsCSSVariables()) {
  console.warn('CSS variables not supported in this browser');
}
```

**Solutions**:

1. **Provide Static Fallbacks**
   ```css
   .button {
     /* Static fallback for old browsers */
     background-color: #2563eb;
     /* CSS variable for modern browsers */
     background-color: var(--color-primary-600, #2563eb);
   }
   ```

2. **Use PostCSS Plugin**
   ```javascript
   // postcss.config.js
   module.exports = {
     plugins: [
       require('postcss-custom-properties')({
         preserve: true,
         fallback: true
       })
     ]
   };
   ```

### 13.5 TypeScript Integration Issues

**Problem**: TypeScript errors when using CSS variables

```typescript
// Error: Property '--color-primary' does not exist on type CSSStyleDeclaration
element.style.setProperty('--color-primary', '#2563eb');
```

**Solutions**:

1. **Use Proper TypeScript Methods**
   ```typescript
   // Correct - Use setProperty method
   element.style.setProperty('--color-primary', '#2563eb');
   
   // Or use utility function
   import { setCSSVariable } from '../utils/cssVariables';
   setCSSVariable('--color-primary', '#2563eb');
   ```

2. **Type Definition Extension**
   ```typescript
   // types/css.d.ts
   declare module 'react' {
     interface CSSProperties {
       [key: `--${string}`]: string | number;
     }
   }
   ```

### 13.6 Development vs Production Issues

**Problem**: CSS variables work in development but fail in production

**Common Causes**:

1. **CSS Purging**
   ```javascript
   // tailwind.config.js - Ensure variables aren't purged
   module.exports = {
     content: ['./src/**/*.{js,ts,jsx,tsx}'],
     safelist: [
       { pattern: /^--jetsetgo-template-/ },
       { pattern: /^css-var-/ },
     ],
   };
   ```

2. **Build Process Issues**
   ```javascript
   // vite.config.ts - Ensure CSS is processed correctly
   export default defineConfig({
     css: {
       postcss: './postcss.config.js',
     },
   });
   ```

### 13.7 Embedded Mode Issues

**Problem**: Variables work in standalone but fail in embedded mode

**Diagnosis**:
```typescript
// Check embedding status and variable availability
import { isEmbeddedMode, areWrapperVariablesAvailable } from '../utils/cssVariables';

const debugEmbeddedMode = () => {
  const isEmbedded = isEmbeddedMode();
  const hasWrapperVars = areWrapperVariablesAvailable();
  
  console.log('Embedded mode:', isEmbedded);
  console.log('Wrapper variables available:', hasWrapperVars);
  
  if (isEmbedded && !hasWrapperVars) {
    console.warn('Embedded mode detected but wrapper variables missing');
  }
};
```

**Solutions**:

1. **Verify Parent Communication**
   ```typescript
   // Check if parent is providing variables
   const checkParentVariables = () => {
     const root = document.documentElement;
     const primaryColor = getComputedStyle(root).getPropertyValue('--color-primary-600');
     
     if (!primaryColor.trim()) {
       console.warn('Parent wrapper not providing CSS variables');
     }
   };
   ```

2. **Initialize Fallbacks Properly**
   ```typescript
   // Ensure fallbacks are initialized when embedded
   import { initializeStandaloneFallbacks } from '../utils/cssVariables';
   
   useEffect(() => {
     const isEmbedded = isEmbeddedMode();
     const hasWrapperVars = areWrapperVariablesAvailable();
     
     if (isEmbedded && !hasWrapperVars) {
       // Parent hasn't provided variables yet, use fallbacks temporarily
       initializeStandaloneFallbacks();
     }
   }, []);
   ```

### 13.8 Animation and Transition Issues

**Problem**: Animations don't respect user preferences

```css
/* Animation continues despite user preferences */
.element {
  transition: all 0.3s ease;
  animation-delay: var(--jetsetgo-template-animation-delay-medium);
}
```

**Solution**: Ensure proper media query implementation
```css
/* Correct - Respect reduced motion preference */
.element {
  transition: all var(--transition-fast, 150ms ease);
  animation-delay: var(--jetsetgo-template-animation-delay-medium);
}

@media (prefers-reduced-motion: reduce) {
  .element {
    transition: none !important;
    animation: none !important;
  }
}
```

### 13.9 Color Mixing Issues

**Problem**: `color-mix()` function not working as expected

```css
/* May not work in all browsers */
background-color: color-mix(in srgb, var(--color-primary-600) 10%, transparent);
```

**Solutions**:

1. **Check Browser Support**
   ```typescript
   const supportsColorMix = CSS.supports('color', 'color-mix(in srgb, red 50%, blue)');
   console.log('Color-mix support:', supportsColorMix);
   ```

2. **Provide Fallbacks**
   ```css
   .badge {
     /* Fallback for unsupported browsers */
     background-color: rgba(37, 99, 235, 0.1);
     /* Modern color-mix for supported browsers */
     background-color: color-mix(in srgb, var(--color-primary-600) 10%, transparent);
   }
   ```

### 13.10 Debugging Tools

**Browser DevTools Tips**:

1. **Inspect CSS Variables**
   - Open DevTools → Elements tab
   - Select `:root` element
   - View all custom properties in Computed styles

2. **Track Variable Changes**
   ```typescript
   // Monitor variable changes
   const observer = new MutationObserver((mutations) => {
     mutations.forEach((mutation) => {
       if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
         console.log('CSS variables changed');
       }
     });
   });
   
   observer.observe(document.documentElement, {
     attributes: true,
     attributeFilter: ['style']
   });
   ```

3. **CSS Variable Inspector Utility**
   ```typescript
   // Development utility to inspect all variables
   const inspectCSSVariables = () => {
     const root = document.documentElement;
     const computedStyle = getComputedStyle(root);
     
     const variables = Array.from(document.styleSheets)
       .flatMap(styleSheet => Array.from(styleSheet.cssRules || []))
       .filter(rule => rule.type === CSSRule.STYLE_RULE)
       .flatMap(rule => Array.from(rule.style))
       .filter(property => property.startsWith('--'))
       .map(property => ({
         property,
         value: computedStyle.getPropertyValue(property)
       }));
     
     console.table(variables);
   };
   ```

### 13.11 Emergency Rollback

**If CSS Variables cause critical issues**:

1. **Quick Disable**
   ```typescript
   // Temporarily disable CSS variables system
   document.documentElement.classList.add('css-variables-disabled');
   ```
   
   ```css
   /* Fallback styles when disabled */
   .css-variables-disabled .button {
     background-color: #2563eb !important;
     color: white !important;
   }
   ```

2. **Use Rollback Plan**
   - Follow procedures in `ROLLBACK_PLAN.md`
   - Restore from Git commit before migration
   - Contact development team for support

---

## Conclusion

This CSS Compliance Guide provides the foundation for maintaining consistent, performant, and accessible styling across JetSetGo child applications. By following these guidelines, developers can create applications that integrate seamlessly with the wrapper system while maintaining flexibility for standalone deployment.

### Key Takeaways

1. **Always use CSS variables** for design tokens
2. **Provide appropriate fallbacks** for standalone mode
3. **Follow naming conventions** consistently
4. **Test thoroughly** in both embedded and standalone modes
5. **Consider accessibility** in all styling decisions
6. **Optimize for performance** without sacrificing maintainability

### Resources

- [CSS Variables Mapping Reference](./css-mapping.md)
- [Component Migration Examples](#5-component-patterns)
- [Testing Procedures](#10-testing--validation)
- [Performance Guidelines](#8-performance-considerations)

---

---

## 11. Development Workflow

### 11.1 New Developer Onboarding

**If you're new to this project**, follow these steps to get up to speed with the CSS Variables system:

#### 1. Understand the Architecture (5 minutes)
```
JetSetGo Wrapper Variables → App-Specific Variables → Fallback Values
       (embedded mode)        (--jetsetgo-template-*)      (standalone)
```

#### 2. Key Files to Know
- `src/index.css` - Main CSS variables and component classes
- `src/styles/custom-variables.css` - App-specific variables
- `src/utils/cssVariables.ts` - Runtime variable utilities
- `docs/css-compliance-guide.md` - Complete styling guidelines

#### 3. Essential Commands
```bash
# Start development with CSS variable debugging
npm run dev

# Check code quality
npm run lint

# Test visual regressions (if Playwright configured)
npm run test:visual
```

### 11.2 Variable Hierarchy in Development

Always use this hierarchy when implementing styles:

#### Level 1: Wrapper Variables (Preferred)
Use wrapper variables when available:
```css
.component {
  background-color: var(--color-primary-600, #2563eb);
  padding: var(--spacing-4, 1rem);
}
```

#### Level 2: App-Specific Variables (When Needed)
Create custom variables for app-specific needs:
```css
.status-badge {
  color: var(--jetsetgo-template-status-processing, #9333ea);
}
```

#### Level 3: Direct Fallback Values (Last Resort)
Provide explicit fallbacks for critical properties:
```css
.critical-component {
  color: var(--color-text, #111827); /* Always provide fallback */
}
```

### 11.3 Development Best Practices

#### DO ✅

1. **Always Provide Fallbacks**
```css
/* ✅ Good */
color: var(--color-primary-600, #2563eb);
background-color: var(--color-background, #ffffff);
```

2. **Use Semantic Variable Names**
```css
/* ✅ Good - semantic meaning */
.error-message {
  color: var(--color-error-600, #dc2626);
}
```

3. **Group Related Styles**
```css
/* ✅ Good - grouped by category */
.component {
  /* Layout */
  display: flex;
  padding: var(--spacing-4, 1rem);
  
  /* Typography */
  font-family: var(--font-family-base, 'Inter', sans-serif);
  color: var(--color-text, #111827);
  
  /* Appearance */
  background-color: var(--color-background, #ffffff);
  border-radius: var(--radius-md, 0.375rem);
}
```

#### DON'T ❌

1. **Don't Skip Fallbacks**
```css
/* ❌ Bad - no fallback */
color: var(--color-primary-600);

/* ✅ Good - with fallback */
color: var(--color-primary-600, #2563eb);
```

2. **Don't Use Wrong Namespaces**
```css
/* ❌ Bad - wrong namespace */
--app-custom-color: #ff0000;
--custom-spacing: 2rem;

/* ✅ Good - correct namespace */
--jetsetgo-template-custom-color: #ff0000;
--jetsetgo-template-custom-spacing: 2rem;
```

3. **Don't Hardcode Values**
```css
/* ❌ Bad - hardcoded */
.component {
  padding: 16px;
  background-color: #f3f4f6;
}

/* ✅ Good - variables */
.component {
  padding: var(--spacing-4, 1rem);
  background-color: var(--color-gray-100, #f3f4f6);
}
```

### 11.4 Code Review Guidelines

#### CSS Variable Usage Checklist
- [ ] All CSS variables have appropriate fallbacks
- [ ] Custom variables use `--jetsetgo-template-*` namespace
- [ ] No hardcoded color/spacing values introduced
- [ ] Semantic variable names used (not color-specific)
- [ ] Changes work in both embedded and standalone modes

#### Component Review Checklist
- [ ] Component classes used instead of inline variable styles
- [ ] Proper TypeScript interfaces for props
- [ ] Accessibility considerations maintained
- [ ] Responsive design preserved
- [ ] No breaking changes to existing APIs

---

## 12. Custom CSS Variables Documentation

### 12.1 Template Philosophy

The JetSetGo Template application is designed as a **clean foundation** for building child applications. As a template, it **does not introduce custom CSS variables**. Instead, it exclusively uses the wrapper's standard CSS variables with appropriate fallbacks for standalone development mode.

### 12.2 Key Principle

**The template should be neutral and unopinionated**, allowing child applications built from it to introduce their own design decisions and custom variables as needed.

### 12.3 No Custom Variables Approach

The template intentionally avoids introducing app-specific CSS variables. This ensures:

1. **Clean Starting Point**: Child apps start without unnecessary constraints
2. **No Naming Conflicts**: No pre-existing custom variables to work around
3. **Full Flexibility**: Child apps can define their own visual identity
4. **Wrapper Compliance**: Template fully complies with wrapper standards

### 12.4 Standard Variables Only

The template uses only:
- **Wrapper Variables**: Standard design tokens from the parent wrapper
- **Fallback Values**: Hard-coded fallbacks for standalone development

### 12.5 Guidelines for Child Apps

When building a child app from this template:

#### Creating Custom Variables

Use your app's namespace pattern:

```css
/* Example for a "bookings" app */
:root {
  --bookings-status-pending: #f59e0b;
  --bookings-status-confirmed: #10b981;
  --bookings-card-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

#### Extending Wrapper Variables

Compose new variables from wrapper tokens:

```css
/* Example custom component */
.bookings-card {
  --card-padding: var(--spacing-6, 1.5rem);
  --card-border: 2px solid var(--color-primary-200, #bfdbfe);
}
```

#### Component-Specific Styling

Keep custom styling scoped to components:

```css
/* Scoped to component */
.bookings-calendar {
  --calendar-cell-size: 2.5rem;
  --calendar-gap: var(--spacing-1, 0.25rem);
}
```

### 12.6 Component-Scoped Variables in Template

The template includes minimal component-scoped variables that simply reference wrapper variables:

#### Toast Component

```css
.jetsetgo-toast {
  --toast-z-index: 9999; /* Z-index is not a design token */
  --toast-animation-duration: var(--duration-fast, 150ms);
  --toast-border-radius: var(--radius-lg, 0.5rem);
}
```

#### Embedded Mode

```css
.jetsetgo-embedded {
  --embedded-padding: var(--spacing-3, 0.75rem);
  --embedded-border: 1px solid var(--color-border, #e5e7eb);
  --embedded-radius: var(--radius-md, 0.375rem);
  --embedded-bg: var(--color-gray-50, #f9fafb);
}
```

These are organizational variables, not custom design tokens.

---

## 15. Troubleshooting

### 15.1 Common Issues and Quick Fixes

#### Issue 1: Variable Not Working
**Symptoms**: Element shows fallback styling instead of expected wrapper styling

**Quick Fix**:
```javascript
// Check in browser console
import { debugCSSVariables } from './src/utils/cssVariables';
debugCSSVariables();
```

**Solutions**:
1. Check variable name spelling
2. Verify embedded mode detection
3. Confirm variable exists in wrapper

#### Issue 2: Colors Look Different in Embedded Mode
**Symptoms**: Different colors when app is embedded vs standalone

**Quick Fix**:
```css
/* Ensure proper fallback values */
.element {
  background-color: var(--color-primary-600, #2563eb); /* Match wrapper exactly */
}
```

#### Issue 3: Custom Variables Not Loading
**Symptoms**: Custom `--jetsetgo-template-*` variables show fallbacks

**Quick Fix**:
```css
/* Check CSS load order in src/index.css */
@import './styles/custom-variables.css'; /* Must be first */

:root {
  /* Variables must be in :root scope */
  --jetsetgo-template-custom: value;
}
```

#### Issue 4: Performance Slow with Variables
**Symptoms**: Rendering performance degraded

**Quick Fix**:
```css
/* Avoid excessive nesting */
/* ❌ Bad */
color: var(--primary, var(--brand, var(--blue, #2563eb)));

/* ✅ Good */
color: var(--color-primary-600, #2563eb);
```

### 15.2 Debugging Tools

#### Browser DevTools
```javascript
// Check computed styles
const element = document.querySelector('.my-component');
const styles = getComputedStyle(element);
console.log(styles.getPropertyValue('--color-primary-600'));

// List all CSS variables
Array.from(styles).filter(prop => prop.startsWith('--'));
```

#### Runtime Utilities
```javascript
import { 
  isCSSVariableAvailable,
  getCSSVariableValue,
  isEmbeddedMode 
} from './src/utils/cssVariables';

// Check environment
console.log('Embedded mode:', isEmbeddedMode());

// Test specific variable
console.log('Variable available:', isCSSVariableAvailable('--color-primary-600'));
console.log('Variable value:', getCSSVariableValue('--color-primary-600', 'not found'));
```

### 15.3 Getting Help

#### When You Need Assistance

1. **Quick Questions**
   - Check this compliance guide first
   - Search existing documentation
   - Use browser DevTools for debugging

2. **Implementation Help**
   - Review pattern examples in `styling_rules/css-pattern-examples.md`
   - Look at similar existing components
   - Check compliance guide for standards

3. **Complex Issues**
   - Create detailed issue description with:
     - What you're trying to achieve
     - Current behavior vs expected behavior
     - Code samples
     - Browser/environment details
     - Screenshots if visual issue

---

**Document Version**: 2.0  
**Last Updated**: January 2025  
**Next Review**: April 2025