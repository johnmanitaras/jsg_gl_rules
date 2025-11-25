# JetSetGo Child App Integration Standards

Audience: Developers building child apps to be embedded in the JetSetGo parent wrapper.

Integration model: React component import (standard). iFrame is non-standard and only allowed with a dedicated wrapper (see Appendix B).

## ⚠️ **CRITICAL INTEGRATION REQUIREMENTS**

**If your app uses React Router, you MUST:**
1. Use `MemoryRouter` when embedded, `BrowserRouter` when standalone
2. Implement proper initialization tracking to prevent infinite loops
3. Test both embedded and standalone modes before submission

**For Authentication, you MUST:**
1. Store tokens in auth context (never as function parameters)
2. Use tokens from props provided by parent wrapper
3. Call `onTokenExpired()` on 401/403 responses
4. Never implement your own Firebase auth in embedded mode

**Failure to follow these standards will cause infinite loops, auth errors, and break the parent app.**

---

## 1) Packaging & Distribution

- __Publishable package__: Distribute as an npm package (private or workspace local) importable by the parent.
- __Name__: Use a stable package name, e.g., `jsg_<feature>`.
- __Exports__:
  - Default export is not required; export a named React component, e.g., `export { MyFeature }`.
  - Export accompanying TypeScript types for props.
- __Build output__:
  - Provide ESM build.
  - Bundle styles and ship a single CSS entry (see CSS).
- __Peer dependencies__: `react`, `react-dom` (compatible with parent versions).
- __Versioning__: Semantic versioning; document breaking changes in `CHANGELOG.md`.

---

## 2) Component Contract (Required)

Your main export MUST be a React component that supports embedded mode and accepts these props:

```ts
export interface ChildAppProps {
  // Required auth/tenant props
  token: string;              // Firebase ID token (Bearer)
  dbName: string;             // Tenant identifier
  onTokenExpired: () => void; // Call to request a fresh token

  // Optional routing props (if your component supports URL routing)
  initialRoute?: string;                 // e.g., '/inventory'
  onNavigate?: (route: string) => void;  // Notify parent of internal navigation
  
  // Additional routing props provided by wrapper
  subRoute?: string;          // Same as initialRoute (for compatibility)
  basePath?: string;          // The base URL path for this component
  currentPath?: string;       // Full current URL path with query and hash

  // Additional component-specific props
  [key: string]: unknown;
}
```

Implementation guidance:
- __Token handling__: Do not refresh tokens yourself. When you detect `401/403` due to token expiry, call `onTokenExpired()` and await a new token via props (the parent refreshes tokens automatically and re-renders your component).
- __Tenant__: Use `dbName` for tenant-scoped API calls.
- __Routing__ (optional):
  - Read `initialRoute` on mount and navigate your internal router.
  - Call `onNavigate(newRoute)` when internal route changes.

---

## 3) CSS & Assets

- __CSS entry__: Ship a single CSS file, e.g., `dist/index.css` or `dist/style.css`.
- __Classname stability__: Avoid global resets; scope styles to your component root where possible.
- __Assets__: Bundle or reference via relative paths within your package.

Parent will import your CSS in `src/lib/components.ts`:
```ts
import 'jsg_my-feature/dist/index.css';
export { MyFeature } from 'jsg_my-feature';
```

---

## 4) URL Routing Support (Optional but Recommended)

### **⚠️ CRITICAL: Router Configuration**

Your component **MUST NOT** use `BrowserRouter` when embedded, as this conflicts with the parent's URL management and causes infinite routing loops.

**✅ CORRECT Implementation Pattern:**

```tsx
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';

export function MyChildApp({ token, dbName, onTokenExpired, initialRoute, onNavigate, ...props }) {
  // Detect embedded mode (when parent provides routing props)
  const isEmbedded = !!(token && dbName && onTokenExpired);
  
  // Use MemoryRouter for embedded mode, BrowserRouter for standalone
  const RouterComponent = isEmbedded ? MemoryRouter : BrowserRouter;
  
  // For embedded mode, set initial route in MemoryRouter
  const routerProps = isEmbedded 
    ? { initialEntries: [initialRoute || '/default-route'] }
    : {};

  return (
    <RouterComponent {...routerProps}>
      <AppRouter 
        initialRoute={initialRoute}
        onNavigate={onNavigate}
        isEmbedded={isEmbedded}
      />
    </RouterComponent>
  );
}
```

### **Navigation Communication Pattern**

```tsx
function AppRouter({ initialRoute, onNavigate, isEmbedded }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasInitialized, setHasInitialized] = useState(false);

  // Handle initial route from parent (only once)
  useEffect(() => {
    if (initialRoute && initialRoute !== location.pathname && !hasInitialized) {
      navigate(initialRoute, { replace: true });
      setHasInitialized(true);
    }
  }, [initialRoute, navigate, location.pathname, hasInitialized]);

  // Notify parent of route changes (only in embedded mode, after initialization)
  useEffect(() => {
    if (onNavigate && isEmbedded && hasInitialized) {
      onNavigate(location.pathname);
    }
  }, [location.pathname, onNavigate, isEmbedded, hasInitialized]);

  return (
    <Routes>
      {/* Your routes here */}
    </Routes>
  );
}
```

### **Why This Matters**

- **Embedded Mode**: Parent wrapper manages browser URL (`/my-app/sub-route`)
- **Child Responsibility**: Manage internal routing via `MemoryRouter`  
- **Communication**: Use `onNavigate` to inform parent of internal route changes
- **Initialization**: Prevent infinite loops with proper initialization tracking

### **❌ Common Mistakes That Cause Issues**

```tsx
// DON'T: Always using BrowserRouter
<BrowserRouter>  {/* ❌ Conflicts with parent URL management */}

// DON'T: Calling onNavigate immediately without initialization check
useEffect(() => {
  onNavigate(location.pathname); // ❌ Causes infinite loop
}, [location.pathname]);

// DON'T: Ignoring embedded vs standalone mode
const MyApp = ({ initialRoute, onNavigate }) => {
  // ❌ No distinction between embedded/standalone modes
}
```

### **Supported Route Documentation**

If you support deep links:
- Handle `initialRoute` and `onNavigate` as defined above.
- Use internal routing with React Router and keep routes stable.
- Document supported sub-routes (e.g., `/inventory`, `/calendar`).
- Test both embedded and standalone modes thoroughly.

---

## 5) Navigation & Page Registration Metadata (Required)

Provide the following to be added by the parent:
- __pageId__: Stable string ID, kebab-case (e.g., `my-feature`).
- __label__: Human-readable name (e.g., `My Feature`).
- __icon__: Name from `lucide-react` (e.g., `Settings`, `Wrench`, `Sliders`).
- __urlPath__ (optional to enable URL routing): Public path segment (e.g., `/my-feature`).
- __default props__ (if any): Key/value for your component.

Example parent registration (`src/config/pages.ts`):
```ts
import { MyFeature } from '../lib/components';

export const pages = {
  'my-feature': {
    id: 'my-feature',
    component: MyFeature,
    urlPath: '/my-feature',
    props: { mode: 'embedded' }
  }
};
```

Example nav item (`src/data/navigation.json`):
```json
{
  "id": "my-feature",
  "label": "My Feature",
  "icon": "Wrench",
  "pageId": "my-feature",
  "type": "page"
}
```

---

## 6) Authentication & Security

### **⚠️ CRITICAL: How the Wrapper Handles Authentication**

The parent wrapper automatically manages Firebase authentication and passes tokens to child apps. **You do NOT need to implement Firebase auth yourself.**

**What the Wrapper Provides:**
- `token: string` - Current Firebase ID token (refreshed automatically)
- `dbName: string` - Tenant identifier for multi-tenant API calls
- `onTokenExpired: () => void` - Callback to request token refresh

### **✅ CORRECT Token Handling Pattern**

Your child app should store the token in your auth context and use it for all API calls:

```tsx
// In your AuthContext
interface AuthContextType {
  token: string | null;
  tenant: string | null;
  isEmbedded: boolean;
  onTokenExpired?: () => void;
}

export function AuthProvider({ children, token, dbName, onTokenExpired }) {
  const [authState, setAuthState] = useState({
    token: token || null,
    tenant: dbName || null,
    isEmbedded: !!(token && dbName && onTokenExpired),
    onTokenExpired
  });

  // Update token when parent provides new one
  useEffect(() => {
    if (token && dbName) {
      setAuthState(prev => ({
        ...prev,
        token,
        tenant: dbName,
        isEmbedded: true
      }));
    }
  }, [token, dbName]);

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}
```

### **API Integration Pattern**

```tsx
// In your API hooks
export function useApi() {
  const { token, tenant, isEmbedded, onTokenExpired } = useAuth();

  const fetchWithAuth = async (endpoint: string, options = {}) => {
    // Use token from context (provided by parent wrapper)
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('X-DB-Name', tenant); // Multi-tenant support
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    // Handle token expiry
    if (response.status === 401 || response.status === 403) {
      if (isEmbedded && onTokenExpired) {
        onTokenExpired(); // Let parent refresh token
        return; // Parent will re-render with new token
      }
      throw new Error('Authentication failed');
    }

    return response.json();
  };

  return { fetchWithAuth };
}
```

### **❌ Common Auth Mistakes That Cause Issues**

```tsx
// DON'T: Implement your own Firebase auth in embedded mode
useEffect(() => {
  onAuthStateChanged(auth, (user) => { /* ❌ Conflicts with parent */ });
}, []);

// DON'T: Store tokens in localStorage
localStorage.setItem('token', token); // ❌ Security risk

// DON'T: Expect tokens as function parameters
const { data } = await api.get('/data', { token }); // ❌ Wrong pattern

// DON'T: Ignore token expiry handling
if (response.status === 401) {
  // ❌ Not calling onTokenExpired()
  throw new Error('Auth failed');
}
```

### **Token Lifecycle Management**

1. **Token Provision**: Parent passes fresh token via props
2. **Token Storage**: Store in your auth context (never localStorage)
3. **Token Usage**: Include in all API calls as `Authorization: Bearer <token>`
4. **Token Expiry**: Call `onTokenExpired()` on 401/403, await new token
5. **Token Refresh**: Parent automatically refreshes every 50 minutes

### **Security Requirements**

- **No Local Storage**: Never persist tokens to localStorage/sessionStorage
- **Bearer Token Format**: Always use `Authorization: Bearer <token>` header
- **Multi-Tenant Headers**: Include `X-DB-Name: <dbName>` for tenant isolation
- **Expiry Handling**: Always call `onTokenExpired()` on auth failures
- **Context-Based Access**: Get tokens from auth context, not function parameters

---

## 7) Error Handling & Logging

- __Surface meaningful user errors__: E.g., toasts or error panels.
- __Retry rules__: Retries should be bounded and respectful of `onTokenExpired` flow.
- __Console noise__: Avoid excessive console logs; use `warn`/`error` sparingly.

---

## 8) Performance & UX

- __Code-split__ heavy routes/screens.
- __Skeletons/placeholders__ while loading.
- __Accessibility__: Use semantic HTML, keyboard navigation, ARIA where appropriate.

---

## 9) Documentation Required in Your Package

Include the following files in your package root:
- __README.md__
  - Overview and purpose
  - Install instructions
  - Usage snippet (import + component usage)
  - Props table (including `token`, `dbName`, `onTokenExpired`, `initialRoute`, `onNavigate`, `subRoute`, `basePath`, `currentPath` if routing supported)
  - List of supported sub-routes (if routing is supported)
- __CHANGELOG.md__: Summarize changes per version.
- __SECURITY.md__ (or section in README): Data handled and security considerations.
- __MIGRATION.md__ (if introducing breaking changes): Steps for parent upgrade.
- __TYPES__.d.ts or inline `.d.ts`: Public types for props.

---

## 10) Example Minimal Component

```tsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter, MemoryRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';

export interface ChildAppProps {
  token: string;
  dbName: string;
  onTokenExpired: () => void;
  initialRoute?: string;
  onNavigate?: (route: string) => void;
  subRoute?: string;
  basePath?: string;
  currentPath?: string;
}

// Internal router component
function AppRouter({ initialRoute, onNavigate, isEmbedded }: { 
  initialRoute?: string; 
  onNavigate?: (route: string) => void; 
  isEmbedded: boolean 
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasInitialized, setHasInitialized] = useState(false);

  // Handle initial route from parent (only once)
  useEffect(() => {
    if (initialRoute && initialRoute !== location.pathname && !hasInitialized) {
      navigate(initialRoute, { replace: true });
      setHasInitialized(true);
    }
  }, [initialRoute, navigate, location.pathname, hasInitialized]);

  // Notify parent of route changes (only in embedded mode, after initialization)
  useEffect(() => {
    if (onNavigate && isEmbedded && hasInitialized) {
      onNavigate(location.pathname);
    }
  }, [location.pathname, onNavigate, isEmbedded, hasInitialized]);

  return (
    <Routes>
      <Route path="/" element={<div>Home Page</div>} />
      <Route path="/settings" element={<div>Settings Page</div>} />
      {/* Add your routes here */}
    </Routes>
  );
}

export function MyFeature({ 
  token, 
  dbName, 
  onTokenExpired, 
  initialRoute, 
  onNavigate, 
  subRoute,
  ...props 
}: ChildAppProps) {
  // Detect embedded mode
  const isEmbedded = !!(token && dbName && onTokenExpired);
  
  // Choose router type based on mode
  const RouterComponent = isEmbedded ? MemoryRouter : BrowserRouter;
  
  // For embedded mode, set initial route in MemoryRouter
  const routerProps = isEmbedded 
    ? { initialEntries: [initialRoute || subRoute || '/'] }
    : {};

  return (
    {/* AuthProvider should be implemented as shown in section 6 */}
    <AuthProvider 
      token={token} 
      dbName={dbName} 
      onTokenExpired={onTokenExpired}
    >
      <RouterComponent {...routerProps}>
        <AppRouter 
          initialRoute={initialRoute || subRoute}
          onNavigate={onNavigate}
          isEmbedded={isEmbedded}
        />
      </RouterComponent>
    </AuthProvider>
  );
}
```

---

## 11) Non-Standard Integrations (Discouraged): iFrame

If you cannot meet the component contract and must use an iFrame, you must provide an iFrame integration guide that:
- Uses `postMessage` with the following contract:
  - Child → Parent: `IFRAME_READY`
  - Parent → Child: `AUTH_DATA` { `authToken`, `tenantName` }
- Documents exact `targetOrigin` and example code.
- Documents deep-linking via iFrame URL.

Note: The parent will implement a dedicated iFrame wrapper that maps its `AuthContext` to your contract. This path is approved only as a temporary bridge while you build a proper component package.

---

## 12) Testing Requirements

### **Mandatory Testing for Routing-Enabled Apps**

Before submission, you **MUST** test both modes to prevent integration issues:

**✅ Standalone Mode Testing:**
```bash
# In your child app directory
npm run dev
# Verify: Routes work, URLs update in browser, back/forward buttons work
```

**✅ Embedded Mode Testing:**
```bash
# In wrapper directory after local installation
npm run dev
# Navigate to your app via sidebar
# Verify: No infinite loops, no browser URL conflicts, navigation works
```

**🔍 Routing Test Checklist:**
- [ ] **Standalone**: All internal routes work with browser URL updates
- [ ] **Standalone**: Browser back/forward buttons work correctly  
- [ ] **Embedded**: No infinite routing loops in console
- [ ] **Embedded**: Internal navigation updates parent URL properly
- [ ] **Embedded**: Deep links work (e.g., `/my-app/sub-route`)
- [ ] **Embedded**: No console errors about router conflicts
- [ ] **Both modes**: Component loads and renders correctly

### **Common Integration Issues to Check:**

1. **Infinite Loop Detection**: Watch browser console for repeating route messages
2. **URL Conflicts**: Ensure browser URL behaves correctly in both modes
3. **Memory Leaks**: Check that router components properly clean up
4. **Deep Linking**: Test direct URL access to sub-routes in embedded mode

---

## 13) Submission Checklist

- [ ] Package builds and can be imported by the parent
- [ ] Main component exports and TypeScript types
- [ ] Accepts required props (`token`, `dbName`, `onTokenExpired`)
- [ ] **AUTHENTICATION**: Stores token in auth context (not function parameters)
- [ ] **AUTHENTICATION**: Uses `Authorization: Bearer <token>` header for API calls
- [ ] **AUTHENTICATION**: Calls `onTokenExpired()` on 401/403 responses
- [ ] **AUTHENTICATION**: Never stores tokens in localStorage/sessionStorage
- [ ] **ROUTING**: Uses `MemoryRouter` for embedded mode, `BrowserRouter` for standalone
- [ ] **ROUTING**: Implements proper initialization tracking to prevent loops
- [ ] **ROUTING**: Tested both embedded and standalone modes successfully
- [ ] Optional routing implemented and documented (`initialRoute`, `onNavigate`, with optional `subRoute`, `basePath`, `currentPath`)
- [ ] CSS entry present and applied
- [ ] README with usage, props, and routing
- [ ] Versioned release with CHANGELOG
- [ ] Navigation metadata provided (pageId, label, icon, urlPath)

---

## 14) Contact & Support

- Provide a maintainer contact and escalation path in your README.
- Establish an SLA for critical fixes if your component is tenant-critical.
