/**
 * CSS Variables Utility Functions
 * 
 * Provides runtime checks for CSS variable availability and fallback handling
 * for embedded mode integration with the JetSetGo wrapper application.
 */

/**
 * Check if a CSS variable is available and has a value
 */
export function isCSSVariableAvailable(variable: string): boolean {
  if (typeof window === 'undefined' || typeof getComputedStyle === 'undefined') {
    return false;
  }
  
  try {
    const styles = getComputedStyle(document.documentElement);
    const value = styles.getPropertyValue(variable).trim();
    return value !== '' && value !== 'initial' && value !== 'inherit';
  } catch (error) {
    console.warn(`Error checking CSS variable ${variable}:`, error);
    return false;
  }
}

/**
 * Get the computed value of a CSS variable with fallback
 */
export function getCSSVariableValue(variable: string, fallback?: string): string {
  if (typeof window === 'undefined' || typeof getComputedStyle === 'undefined') {
    return fallback || '';
  }
  
  try {
    const styles = getComputedStyle(document.documentElement);
    const value = styles.getPropertyValue(variable).trim();
    
    if (value && value !== 'initial' && value !== 'inherit') {
      return value;
    }
  } catch (error) {
    console.warn(`Error getting CSS variable ${variable}:`, error);
  }
  
  return fallback || '';
}

/**
 * Check if wrapper CSS variables are available (indicates embedded mode)
 */
export function areWrapperVariablesAvailable(): boolean {
  // Check for key wrapper variables that should be present in embedded mode
  const keyWrapperVariables = [
    '--color-primary-600',
    '--color-background',
    '--font-family-base',
    '--spacing-4',
  ];
  
  return keyWrapperVariables.some(variable => isCSSVariableAvailable(variable));
}

/**
 * Detect if the app is running in embedded mode
 * This combines iframe detection with wrapper variable availability
 */
export function isEmbeddedMode(): boolean {
  // Check if we're in an iframe
  let inIframe = false;
  try {
    inIframe = window.self !== window.top;
  } catch {
    // If we can't access window.top, we're definitely in an iframe
    inIframe = true;
  }
  
  // Also check if wrapper variables are available
  const hasWrapperVars = areWrapperVariablesAvailable();
  
  return inIframe || hasWrapperVars;
}

/**
 * Initialize CSS variable fallbacks for standalone mode
 */
export function initializeStandaloneFallbacks(): void {
  if (isEmbeddedMode()) {
    console.log('Embedded mode detected - using wrapper variables');
    return;
  }
  
  console.log('Standalone mode detected - initializing fallbacks');
  
  // Add a class to indicate standalone mode for CSS targeting
  document.documentElement.classList.add('jetsetgo-standalone');
  
  // Log which wrapper variables are missing (for debugging)
  const missingVars: string[] = [];
  const wrapperVars = [
    '--color-primary-600',
    '--color-background', 
    '--font-family-base',
    '--spacing-4',
    '--radius-md',
    '--shadow-sm',
  ];
  
  wrapperVars.forEach(variable => {
    if (!isCSSVariableAvailable(variable)) {
      missingVars.push(variable);
    }
  });
  
  if (missingVars.length > 0) {
    console.log('Missing wrapper variables (using fallbacks):', missingVars);
  }
}

/**
 * Utility to create CSS variable references with fallbacks
 */
export function cssVar(variable: string, fallback?: string): string {
  if (fallback) {
    return `var(${variable}, ${fallback})`;
  }
  return `var(${variable})`;
}

/**
 * Create dynamic CSS variables object for React inline styles
 */
export function createCSSVariables(variables: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  
  Object.entries(variables).forEach(([key, value]) => {
    // Convert camelCase to kebab-case for CSS custom properties
    const cssKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    result[cssKey] = value;
  });
  
  return result;
}

/**
 * Hook for checking wrapper variable availability in React components
 */
export function useWrapperVariableStatus(): {
  isEmbedded: boolean;
  hasWrapperVars: boolean;
  isReady: boolean;
} {
  const isEmbedded = isEmbeddedMode();
  const hasWrapperVars = areWrapperVariablesAvailable();
  const isReady = !isEmbedded || hasWrapperVars;
  
  return {
    isEmbedded,
    hasWrapperVars,
    isReady,
  };
}

/**
 * Development helper to log CSS variable status
 */
export function debugCSSVariables(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  const status = {
    isEmbedded: isEmbeddedMode(),
    hasWrapperVars: areWrapperVariablesAvailable(),
    availableVars: [] as string[],
    missingVars: [] as string[],
  };
  
  // Check common variables
  const commonVars = [
    '--color-primary-600',
    '--color-background',
    '--color-text',
    '--font-family-base',
    '--spacing-4',
    '--radius-md',
    '--shadow-sm',
  ];
  
  commonVars.forEach(variable => {
    if (isCSSVariableAvailable(variable)) {
      status.availableVars.push(variable);
    } else {
      status.missingVars.push(variable);
    }
  });
  
  console.group('CSS Variables Status');
  console.log('Environment:', status.isEmbedded ? 'Embedded' : 'Standalone');
  console.log('Wrapper variables available:', status.hasWrapperVars);
  console.log('Available variables:', status.availableVars);
  console.log('Missing variables:', status.missingVars);
  console.groupEnd();
}