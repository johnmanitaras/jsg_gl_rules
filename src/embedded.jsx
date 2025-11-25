/**
 * Embedded Mode Entry Point
 *
 * This file handles integration with the JetSetGo wrapper app.
 * It receives authentication and tenant information from the parent
 * and renders the GLRulesApp in embedded mode.
 */

import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Check if we're running in an iframe (embedded mode)
export function isRunningInIframe() {
  try {
    return window.self !== window.top;
  } catch (e) {
    // If we can't access window.top due to same-origin policy,
    // we're definitely in an iframe
    return true;
  }
}

/**
 * Main entry point for both standalone and embedded modes
 */
export function initializeApp() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  // Check if we're in embedded mode
  const isEmbedded = isRunningInIframe();

  // Create the React root
  const root = createRoot(rootElement);

  if (isEmbedded) {
    // In embedded mode, render with wrapper integration
    console.log('GL Rules: Initializing in embedded mode');
    root.render(<EmbeddedApp />);
  } else {
    // In standalone mode, render the full App with routing
    console.log('GL Rules: Initializing in standalone mode');
    root.render(<App />);
  }
}

/**
 * Embedded App Component
 * Receives props from the wrapper and passes them to App
 *
 * Supports both naming conventions for backward compatibility:
 * - New: authToken/tenantName (per claude_for_child_developers.md)
 * - Old: token/dbName (current wrapper implementation)
 */
function EmbeddedApp() {
  // Expose the component to the parent window
  if (typeof window !== 'undefined') {
    window.GLRulesApp = function GLRulesAppWrapper({
      // New prop names (per guidelines)
      authToken,
      tenantName,
      // Old prop names (for backward compatibility with wrapper)
      token,
      dbName,
      onTokenExpired,
      mode,
      // Routing props
      initialRoute,
      onNavigate,
      subRoute,
      basePath,
      currentPath,
      onNavigateToApp,
    }) {
      // Support both naming conventions
      const effectiveToken = authToken || token;
      const effectiveTenant = tenantName || dbName;

      console.log('GL Rules: Rendering with wrapper props', {
        hasToken: !!effectiveToken,
        tenant: effectiveTenant,
        mode,
        initialRoute,
        subRoute,
      });

      return (
        <App
          authToken={effectiveToken}
          tenantName={effectiveTenant}
          token={effectiveToken}
          dbName={effectiveTenant}
          onTokenExpired={onTokenExpired}
          initialRoute={initialRoute}
          onNavigate={onNavigate}
          subRoute={subRoute}
          basePath={basePath}
          currentPath={currentPath}
          onNavigateToApp={onNavigateToApp}
        />
      );
    };
  }

  // Show loading state until wrapper calls the component
  return (
    <div
      className="jsg-gl-rules"
      style={{
        padding: 'var(--spacing-lg, 20px)',
        fontFamily:
          'var(--font-family-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
      }}
    >
      <p style={{ color: 'var(--color-text-secondary, #6b7280)' }}>
        Loading GL Rules...
      </p>
    </div>
  );
}
