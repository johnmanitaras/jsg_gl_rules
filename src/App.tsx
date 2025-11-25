import { BrowserRouter, MemoryRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { Login } from './components/Login';
import { GLRulesApp } from './pages/GLRulesApp';
import { GLRuleSetEditor } from './pages/GLRuleSetEditor';
import { useAuth } from './hooks/useAuth';
import { initializeStandaloneFallbacks, debugCSSVariables } from './utils/cssVariables';

const queryClient = new QueryClient();

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

/**
 * RouterSync Component
 * Handles synchronization between parent wrapper URL and internal routing
 *
 * In embedded mode (MemoryRouter):
 * - Listens to location changes and notifies parent via onNavigate
 * - Parent controls browser URL, we control internal MemoryRouter state
 *
 * In standalone mode (BrowserRouter):
 * - Router directly controls browser URL, no sync needed
 */
interface RouterSyncProps {
  initialRoute?: string;
  onNavigate?: (route: string) => void;
  isEmbedded: boolean;
}

function RouterSync({ initialRoute, onNavigate, isEmbedded }: RouterSyncProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasInitialized, setHasInitialized] = useState(false);

  // Only sync routes in embedded mode
  if (!isEmbedded) {
    return null;
  }

  // Navigate to initial route when it changes from parent
  useEffect(() => {
    if (initialRoute && location.pathname !== initialRoute) {
      console.log('[RouterSync] Parent route changed to:', initialRoute);
      navigate(initialRoute, { replace: true });
    }
  }, [initialRoute, navigate, location.pathname]);

  // Mark as initialized after first render
  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
    }
  }, [hasInitialized]);

  // Notify parent of internal route changes
  useEffect(() => {
    if (onNavigate && hasInitialized) {
      console.log('[RouterSync] Internal route changed to:', location.pathname);
      onNavigate(location.pathname);
    }
  }, [location.pathname, onNavigate, hasInitialized]);

  return null;
}

interface AppProps {
  // New prop names (per claude_for_child_developers.md)
  authToken?: string;
  tenantName?: string;
  // Old prop names (for backward compatibility with wrapper)
  token?: string;
  dbName?: string;
  onTokenExpired?: () => void;
  // Routing props
  initialRoute?: string;
  onNavigate?: (route: string) => void;
  subRoute?: string;
  basePath?: string;
  currentPath?: string;
  onNavigateToApp?: (path: string) => void;
}

function App({
  authToken,
  tenantName,
  token,
  dbName,
  onTokenExpired,
  initialRoute,
  onNavigate,
  subRoute,
}: AppProps = {}) {
  // Support both old and new prop names for backward compatibility
  const effectiveToken = authToken || token;
  const effectiveTenant = tenantName || dbName;

  // Initialize CSS variable fallbacks and debug info
  useEffect(() => {
    initializeStandaloneFallbacks();
    debugCSSVariables();
  }, []);

  // Detect embedded mode - when parent provides auth props
  const isEmbedded = !!(effectiveToken && effectiveTenant && onTokenExpired);

  // Use initialRoute or subRoute (for compatibility)
  const effectiveInitialRoute = initialRoute || subRoute || '/gl-rules';

  // Choose router based on mode:
  // - Embedded: MemoryRouter (parent controls browser URL)
  // - Standalone: BrowserRouter (we control browser URL)
  const RouterComponent = isEmbedded ? MemoryRouter : BrowserRouter;

  // Router props
  const routerProps = isEmbedded
    ? { initialEntries: [effectiveInitialRoute] }
    : {};

  return (
    <div className="jsg-gl-rules">
      <QueryClientProvider client={queryClient}>
        <AuthProvider
          authToken={effectiveToken}
          tenantName={effectiveTenant}
          token={effectiveToken}
          dbName={effectiveTenant}
          onTokenExpired={onTokenExpired}
        >
          <RouterComponent {...routerProps}>
            {isEmbedded && (
              <RouterSync
                initialRoute={effectiveInitialRoute}
                onNavigate={onNavigate}
                isEmbedded={isEmbedded}
              />
            )}
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={<Navigate to="/gl-rules" replace />}
              />
              <Route
                path="/gl-rules"
                element={
                  <PrivateRoute>
                    <GLRulesApp />
                  </PrivateRoute>
                }
              />
              <Route
                path="/gl-rules/rule-set/:ruleSetId"
                element={
                  <PrivateRoute>
                    <GLRuleSetEditor />
                  </PrivateRoute>
                }
              />
            </Routes>
          </RouterComponent>
        </AuthProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
