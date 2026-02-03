import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { Login } from './components/Login';
import { GLRulesApp } from './pages/GLRulesApp';
import { GLRuleSetEditor } from './pages/GLRuleSetEditor';
import { useAuth } from './hooks/useAuth';
import { initializeStandaloneFallbacks, debugCSSVariables } from './utils/cssVariables';
import { ReadOnlyToastProvider } from './contexts/ReadOnlyToastContext';
import { PermissionsProvider, Permissions } from './contexts/PermissionsContext';

const queryClient = new QueryClient();

/**
 * RouterSync Component
 * Syncs child app routing with parent wrapper URL
 *
 * Per child-app-integration-standards.md:
 * - Uses BrowserRouter (parent manages actual browser URL)
 * - Navigates to initialRoute on mount (once)
 * - Notifies parent of route changes via onNavigate
 */
interface RouterSyncProps {
  initialRoute?: string;
  onNavigate?: (route: string) => void;
}

function RouterSync({ initialRoute, onNavigate }: RouterSyncProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const hasInitialized = useRef(false);

  // Navigate to initial route when component mounts (once only)
  useEffect(() => {
    if (initialRoute && !hasInitialized.current) {
      hasInitialized.current = true;
      if (location.pathname !== initialRoute) {
        console.log('[RouterSync] Initial navigation to:', initialRoute);
        navigate(initialRoute, { replace: true });
      }
    }
  }, [initialRoute, navigate, location.pathname]);

  // Notify parent of route changes (after initialization)
  useEffect(() => {
    if (onNavigate && hasInitialized.current) {
      console.log('[RouterSync] Notifying parent of route:', location.pathname + location.search);
      onNavigate(location.pathname + location.search);
    }
  }, [location.pathname, location.search, onNavigate]);

  return null;
}

/**
 * PrivateRoute wrapper - redirects to login if not authenticated
 */
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // In embedded mode, user is always authenticated via token prop
  // In standalone mode, check Firebase auth
  return user ? <>{children}</> : <Login />;
}

interface AppProps {
  // Required auth/tenant props (from parent wrapper)
  token?: string;
  dbName?: string;
  onTokenExpired?: () => void;
  // Alternative prop names for compatibility
  authToken?: string;
  tenantName?: string;
  // Routing props
  initialRoute?: string;
  onNavigate?: (route: string) => void;
  subRoute?: string;
  basePath?: string;
  currentPath?: string;
  onNavigateToApp?: (path: string) => void;
  // Permissions prop from wrapper
  permissions?: Permissions;
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
  basePath,
  permissions,
}: AppProps = {}) {
  // Support both prop name conventions
  const effectiveToken = authToken || token;
  const effectiveTenant = tenantName || dbName;

  // Initialize CSS variable fallbacks for standalone mode
  useEffect(() => {
    initializeStandaloneFallbacks();
    debugCSSVariables();
  }, []);

  // Use initialRoute or subRoute (for compatibility)
  const effectiveInitialRoute = initialRoute || subRoute;

  // Determine if we're in embedded mode (parent provides auth props)
  const isEmbedded = !!(effectiveToken && effectiveTenant && onTokenExpired);

  // Use basePath as BrowserRouter basename in embedded mode
  // This allows routes like /rule-set/:id to work when browser URL is /gl-rules/rule-set/:id
  const routerBasename = isEmbedded && basePath ? basePath : undefined;

  return (
    <div className="jsg-gl-rules">
      <QueryClientProvider client={queryClient}>
        <ReadOnlyToastProvider>
          <PermissionsProvider permissions={permissions}>
            <AuthProvider
              authToken={effectiveToken}
              tenantName={effectiveTenant}
              token={effectiveToken}
              dbName={effectiveTenant}
              onTokenExpired={onTokenExpired}
            >
              <BrowserRouter basename={routerBasename}>
                <RouterSync
                  initialRoute={effectiveInitialRoute}
                  onNavigate={onNavigate}
                />
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/"
                    element={
                      <PrivateRoute>
                        <GLRulesApp />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/rule-set/:ruleSetId"
                    element={
                      <PrivateRoute>
                        <GLRuleSetEditor />
                      </PrivateRoute>
                    }
                  />
                </Routes>
              </BrowserRouter>
            </AuthProvider>
          </PermissionsProvider>
        </ReadOnlyToastProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
