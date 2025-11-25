# Wrapper Integration Guide - Commission Profiles App

This guide provides step-by-step instructions for integrating the Commission Profiles app into the JetSetGo wrapper application.

## Prerequisites

- JetSetGo wrapper app is set up and running
- Commission Profiles app built successfully (`npm run build`)
- Database tables created for commission profiles
- Hasura permissions configured

## Integration Steps

### Step 1: Add Package Dependency

In `jsg_wrapper/package.json`, add the commission profiles app:

```json
{
  "dependencies": {
    "jsg_commissions": "file:../jsg_commissions",
    // ... other dependencies
  }
}
```

Then install:
```bash
cd jsg_wrapper
npm install
```

### Step 2: Register Component

In `jsg_wrapper/src/lib/components.ts`, import and export the component:

```typescript
import { lazy } from 'react';

// Import CSS for commission profiles
import 'jsg_commissions/dist/style.css';

// Lazy load the component
export const CommissionsApp = lazy(() =>
  import('jsg_commissions').then((module) => ({
    default: module.CommissionsApp,
  }))
);
```

**Note**: The CSS import must come before the component export to ensure styles are loaded.

### Step 3: Add Page Configuration

In `jsg_wrapper/src/config/pages.ts`, add the page configuration:

```typescript
import { PageConfig } from '../types';

export const getPages = (tenantName: string): PageConfig[] => [
  // ... existing pages

  {
    id: 'commissions',
    name: 'Commission Profiles',
    component: 'CommissionsApp',
    permissions: ['view:commissions'],
    tenant: tenantName,
    urlPath: '/commissions', // Optional: enables deep linking
  },

  // ... other pages
];
```

### Step 4: Add Navigation Entry

In `jsg_wrapper/src/data/navigation.json`, add navigation item:

```json
{
  "sections": [
    {
      "title": "Configuration",
      "items": [
        {
          "id": "commissions",
          "label": "Commission Profiles",
          "icon": "Percent",
          "path": "/commissions",
          "permission": "view:commissions"
        }
      ]
    }
  ]
}
```

**Icon Options**: Use any [Lucide icon name](https://lucide.dev/icons/) (e.g., "Percent", "DollarSign", "Calculator")

### Step 5: Database Setup

Create the commission profiles table for each tenant:

```sql
-- Replace {tenant} with actual tenant name (e.g., tta)
CREATE TABLE {tenant}_commission_profiles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 5,
  rules JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for priority ordering
CREATE INDEX idx_{tenant}_commission_profiles_priority
  ON {tenant}_commission_profiles(priority DESC);

-- Trigger for auto-updating updated_at
CREATE TRIGGER set_timestamp_{tenant}_commission_profiles
BEFORE UPDATE ON {tenant}_commission_profiles
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
```

**Automation**: For multi-tenant setups, create a migration script to apply this to all tenants.

### Step 6: Configure Hasura Permissions

In Hasura console, set up permissions for `{tenant}_commission_profiles`:

#### Select Permission (view:commissions)
```json
{
  "filter": {},
  "columns": ["id", "name", "description", "priority", "rules", "created_at", "updated_at"],
  "allow_aggregations": true
}
```

#### Insert Permission (manage:commissions)
```json
{
  "filter": {},
  "columns": ["name", "description", "priority", "rules"],
  "set": {
    "created_at": "now()",
    "updated_at": "now()"
  }
}
```

#### Update Permission (manage:commissions)
```json
{
  "filter": {},
  "columns": ["name", "description", "priority", "rules"],
  "set": {
    "updated_at": "now()"
  }
}
```

#### Delete Permission (manage:commissions)
```json
{
  "filter": {}
}
```

### Step 7: Add User Permissions

Grant permissions to appropriate user groups:

```sql
-- For administrators
INSERT INTO user_group_permissions (group_id, permission)
VALUES
  ((SELECT id FROM user_groups WHERE name = 'admin'), 'view:commissions'),
  ((SELECT id FROM user_groups WHERE name = 'admin'), 'manage:commissions');

-- For managers (view only)
INSERT INTO user_group_permissions (group_id, permission)
VALUES
  ((SELECT id FROM user_groups WHERE name = 'manager'), 'view:commissions');
```

Adjust group names based on your setup.

### Step 8: Test Integration

1. **Rebuild Wrapper**:
   ```bash
   cd jsg_wrapper
   npm run build
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Verify Navigation**:
   - Login to wrapper app
   - Check navigation menu shows "Commission Profiles"
   - Click on the navigation item
   - Verify app loads without errors

4. **Test Functionality**:
   - Create a new profile
   - Edit existing profile
   - Delete a profile
   - Verify data persists
   - Check no console errors

5. **Test Permissions**:
   - Login with user without permissions
   - Verify navigation item hidden or access denied
   - Login with different permission levels
   - Verify read-only vs full access

### Step 9: Verify Props Flow

The wrapper should pass these props to the Commission Profiles app:

```typescript
<CommissionsApp
  token={firebaseAuthToken}
  dbName={currentTenant}
  onTokenExpired={() => handleTokenRefresh()}
  mode="embedded"
/>
```

Verify in browser console:
```javascript
// Should see this log when app loads
"Commission Profiles: Rendering with wrapper props {
  hasToken: true,
  dbName: 'tta',
  mode: 'embedded'
}"
```

### Step 10: Production Deployment

1. **Build for Production**:
   ```bash
   cd jsg_commissions
   npm run build

   cd ../jsg_wrapper
   npm run build
   ```

2. **Deploy Assets**:
   - Upload wrapper build to hosting
   - Ensure all CSS/JS bundles included
   - Verify CDN caching configured

3. **Smoke Test Production**:
   - Test in production environment
   - Verify multi-tenant functionality
   - Check performance metrics
   - Monitor error logs

## Troubleshooting

### Component Not Appearing

**Symptom**: Navigation item visible but clicking does nothing

**Solutions**:
1. Check browser console for import errors
2. Verify `jsg_commissions` package installed in wrapper
3. Ensure component registered in `components.ts`
4. Check page config has correct component name

### Styles Not Applied

**Symptom**: App renders but looks unstyled

**Solutions**:
1. Verify CSS import in `components.ts`
2. Check CSS file exists in `jsg_commissions/dist/`
3. Clear browser cache
4. Check for CSS variable conflicts
5. Verify wrapper provides base CSS variables

### Authentication Errors

**Symptom**: "No authentication token available" in console

**Solutions**:
1. Verify wrapper passes `token` prop
2. Check token is valid (not expired)
3. Ensure `AuthProvider` receives token
4. Check `embeddedAuthToken` passed to hooks

### Database Errors

**Symptom**: "Table does not exist" in GraphQL errors

**Solutions**:
1. Verify table created for current tenant
2. Check table name matches pattern: `{tenant}_commission_profiles`
3. Ensure Hasura tracking enabled for table
4. Verify GraphQL endpoint in wrapper config

### Permission Errors

**Symptom**: Access denied or components not visible

**Solutions**:
1. Check user has required permissions
2. Verify Hasura permissions configured
3. Check Firebase custom claims include permissions
4. Ensure permission checks in wrapper match app requirements

## URL Routing (Optional)

If the page config includes `urlPath: '/commissions'`, the app supports deep linking:

### Enable Sub-Routes

Update page config to accept navigation callbacks:

```typescript
{
  id: 'commissions',
  name: 'Commission Profiles',
  component: 'CommissionsApp',
  permissions: ['view:commissions'],
  tenant: tenantName,
  urlPath: '/commissions',
  // Optional: Support sub-routes
  initialRoute: window.location.pathname.replace('/commissions', ''),
  onNavigate: (route) => {
    window.history.pushState({}, '', `/commissions${route}`);
  }
}
```

### Deep Link Examples

```
/commissions              → Main list view
/commissions/create       → Create new profile
/commissions/edit/123     → Edit profile ID 123
```

**Implementation**: Requires adding router support to `CommissionsApp.tsx` (future enhancement).

## Cross-App Navigation (Future)

The app can navigate to other child apps using the `onNavigateToApp` callback:

```typescript
// In wrapper integration
<CommissionsApp
  token={token}
  dbName={dbName}
  onTokenExpired={handleTokenRefresh}
  onNavigateToApp={(path) => {
    // Navigate to different child app
    navigate(path);
  }}
/>
```

**Use Case**: Navigate to client details from commission profile.

## Performance Monitoring

### Key Metrics to Track

1. **Initial Load Time**: Time to first interaction
   - Target: < 2s
   - Monitor: Performance API

2. **GraphQL Query Time**: Database query performance
   - Target: < 500ms
   - Monitor: Network tab

3. **Modal Animation**: Smooth 60fps animations
   - Target: No frame drops
   - Monitor: Performance profiler

4. **Memory Usage**: No memory leaks
   - Target: Stable over time
   - Monitor: Memory profiler

### Monitoring Setup

```typescript
// Add to wrapper App.tsx
useEffect(() => {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name.includes('commissions')) {
        console.log('Commission App Performance:', entry);
      }
    }
  });
  observer.observe({ entryTypes: ['navigation', 'resource'] });
}, []);
```

## Multi-Tenant Considerations

### Tenant Switching

When user switches tenant in wrapper:

1. Wrapper updates `dbName` prop
2. AuthContext updates tenant
3. GraphQL queries use new tenant prefix
4. Profile list refreshes with new tenant data

**Verify**: No stale data shown after tenant switch

### Tenant Isolation

Ensure data isolation between tenants:

1. GraphQL queries always use tenant prefix
2. No cross-tenant data leakage
3. Permissions scoped to tenant
4. Token includes tenant claim

## Security Checklist

- [ ] Authentication required for all operations
- [ ] Permissions checked server-side (Hasura)
- [ ] Input validation on all forms
- [ ] XSS prevention (React auto-escaping)
- [ ] CSRF protection (token-based auth)
- [ ] SQL injection prevented (GraphQL parameterization)
- [ ] Sensitive data not logged
- [ ] HTTPS enforced in production

## Support & Maintenance

### Common Tasks

**Update Commission App**:
```bash
cd jsg_commissions
# Make changes
npm run build

cd ../jsg_wrapper
npm update jsg_commissions
npm run build
```

**Add New Field to Profiles**:
1. Add column to database
2. Update TypeScript types
3. Update GraphQL queries
4. Update form components
5. Test and deploy

**Debug Integration Issues**:
1. Check browser console
2. Review network tab (GraphQL requests)
3. Verify props in React DevTools
4. Check Hasura logs
5. Review database records

### Contact

For issues or questions:
- Review `CLAUDE.md` for development guidance
- Check `README.md` for setup instructions
- Review `INTEGRATION_TEST_REPORT.md` for test results
- Consult JetSetGo platform documentation

## Appendix: Complete Integration Example

Here's a complete example of all files that need changes:

### jsg_wrapper/package.json
```json
{
  "dependencies": {
    "jsg_commissions": "file:../jsg_commissions"
  }
}
```

### jsg_wrapper/src/lib/components.ts
```typescript
import 'jsg_commissions/dist/style.css';

export const CommissionsApp = lazy(() =>
  import('jsg_commissions').then((module) => ({
    default: module.CommissionsApp,
  }))
);
```

### jsg_wrapper/src/config/pages.ts
```typescript
{
  id: 'commissions',
  name: 'Commission Profiles',
  component: 'CommissionsApp',
  permissions: ['view:commissions'],
  tenant: tenantName,
  urlPath: '/commissions'
}
```

### jsg_wrapper/src/data/navigation.json
```json
{
  "id": "commissions",
  "label": "Commission Profiles",
  "icon": "Percent",
  "path": "/commissions",
  "permission": "view:commissions"
}
```

That's it! Follow these steps and the Commission Profiles app will be fully integrated into your JetSetGo wrapper.

---

**Integration Status**: Ready for Production
**Last Updated**: 2025-11-23
**Version**: 1.0.0
