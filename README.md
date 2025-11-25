# Commission Profiles Management App

A JetSetGo child application for managing commission profiles and rules.

## Overview

The Commission Profiles Management app allows transport and tourism operators to create, edit, and manage commission profiles that define how commissions are calculated for clients. Features include:

- **Profile Management**: Create, edit, and delete commission profiles
- **Priority System**: Assign priorities to profiles for conflict resolution
- **Rule Builder**: Visual interface for creating commission rules with conditions
- **Product-Level Overrides**: Override profile rules for specific products
- **Beautiful UX**: Smooth animations, intuitive interactions, and responsive design

## Features

### Profile Management
- List all commission profiles with priority indicators
- Create new profiles with name, description, and priority
- Edit existing profiles
- Delete profiles with confirmation
- Visual priority badges (High, Medium, Low)

### Commission Rules
- Add multiple rules per profile
- Set commission percentages or fixed amounts
- Define conditions (products, dates, thresholds)
- Drag-and-drop rule reordering
- Visual rule validation

### Product Overrides
- Override profile rules for specific products
- Quick toggle to enable/disable overrides
- Manage override rules with same flexibility as profile rules

## Dual Mode Support

This app works in **two modes**:

### 1. Standalone Mode (Development)
Run independently with local Firebase authentication.

```bash
npm run dev
```

Access at: `http://localhost:5173`

**Features**:
- Full authentication via Firebase
- Uses DEFAULT_TENANT from `.env` file
- Complete routing with React Router
- Login page for development testing

### 2. Embedded Mode (Production)
Integrated into the JetSetGo wrapper application.

**Integration**:
- Receives `token`, `dbName`, and `onTokenExpired` props from parent
- No login UI (uses parent authentication)
- Seamless tenant switching
- Proper token refresh handling

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
```

## Environment Variables

Create a `.env` file with:

```env
# API Endpoints
VITE_API_URL=https://6q9d6sl2jh.execute-api.ap-southeast-2.amazonaws.com/api
VITE_HASURA_GRAPHQL_ENDPOINT=https://graphql.jetsetgo.world/v1/graphql

# Default tenant for standalone mode
VITE_DEFAULT_TENANT=tta

# Firebase Configuration (for standalone mode)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Development

### Running Standalone

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Testing

```bash
# Run visual regression tests
npm run test:visual

# Update test snapshots
npm run test:visual:update

# Open Playwright UI
npm run test:visual:ui
```

## Embedded Mode Integration

### Props Interface

When embedded in the JetSetGo wrapper, the app accepts these props:

```typescript
interface CommissionsAppProps {
  // Required in embedded mode
  token?: string;              // Firebase auth token
  dbName?: string;             // Tenant name (e.g., 'tta')
  onTokenExpired?: () => void; // Callback for token refresh
  mode?: 'standalone' | 'embedded'; // Operating mode

  // Internal prop for GraphQL queries
  embeddedAuthToken?: string;  // Same as token, passed to hooks
}
```

### Wrapper Integration

Add to `jsg_wrapper/package.json`:
```json
{
  "dependencies": {
    "jsg_commissions": "file:../jsg_commissions"
  }
}
```

Register in `jsg_wrapper/src/lib/components.ts`:
```typescript
import 'jsg_commissions/dist/style.css';

export const CommissionsApp = lazy(() =>
  import('jsg_commissions').then((module) => ({
    default: module.CommissionsApp,
  }))
);
```

Add to `jsg_wrapper/src/config/pages.ts`:
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

### How It Works

1. **Initialization**: `embedded.jsx` detects iframe mode
2. **Component Exposure**: `window.CommissionsApp` made available
3. **Wrapper Calls**: Parent renders with props
4. **Auth Handling**: Token passed to all API calls
5. **Tenant Switching**: GraphQL queries use `{dbName}_` prefix

## Architecture

### Entry Points

- **`src/main.tsx`**: Standalone mode entry (with routing)
- **`src/embedded.jsx`**: Embedded mode entry (wrapper integration)

### Key Components

```
src/
├── components/
│   ├── commissions/
│   │   ├── ProfileList.tsx      # Main list view
│   │   ├── ProfileCard.tsx      # Individual profile card
│   │   ├── ProfileEditor.tsx    # Create/edit modal
│   │   ├── RuleBuilder.tsx      # Rule creation interface
│   │   ├── RuleList.tsx         # Drag-drop rule list
│   │   └── PriorityBadge.tsx    # Priority indicator
│   └── common/
│       ├── Modal.tsx            # Reusable modal
│       ├── ConfirmDialog.tsx    # Confirmation dialogs
│       └── Toast.tsx            # Notifications
├── hooks/
│   ├── useCommissionProfiles.ts # Profile CRUD operations
│   ├── useGraphQL.ts            # GraphQL queries (tenant-aware)
│   └── useAuth.ts               # Auth context hook
├── contexts/
│   └── AuthContext.tsx          # Auth state management
├── pages/
│   └── CommissionsApp.tsx       # Main app component
└── styles/
    ├── commissions.css          # App-specific styles
    └── variables-fallback.css   # CSS variables fallback
```

### Data Flow

1. **Profile List**: Queries `{tenant}_commission_profiles` via GraphQL
2. **Create/Edit**: Mutations to database with validation
3. **Delete**: Confirmation + mutation with error handling
4. **Rules**: Stored as JSONB in profile records
5. **Auth**: Token passed through all API calls

### Authentication Flow

**Standalone Mode**:
```
User → Login → Firebase Auth → Token → GraphQL queries
```

**Embedded Mode**:
```
Wrapper → Props → AuthContext → GraphQL queries
          (token, dbName)
```

## API Integration

### GraphQL (Primary)

All profile data uses GraphQL with tenant-aware table names:

```typescript
const { query, mutate } = useGraphQL();
const { tenant } = useAuth();
const table = `${tenant?.name || DEFAULT_TENANT}_commission_profiles`;

// Query profiles
const result = await query(`
  query GetProfiles {
    profiles: ${table}(order_by: { priority: desc }) {
      id
      name
      description
      priority
      rules
    }
  }
`, {}, undefined, embeddedAuthToken);

// Create profile
await mutate(`
  mutation CreateProfile($object: ${table}_insert_input!) {
    insert_${table}_one(object: $object) {
      id
    }
  }
`, { object: profileData }, undefined, embeddedAuthToken);
```

**Key Points**:
- Always use tenant prefix for table names
- Pass `embeddedAuthToken` in embedded mode
- Use table aliases for consistent field names
- Handle errors gracefully

### REST API (Future)

REST API integration available via `useApi` hook for future features.

## CSS & Styling

### Design System Compliance

Uses JetSetGo CSS Variables for consistency:

```css
/* Colors */
--color-primary-600
--color-text-primary
--color-border
--color-background

/* Spacing */
--spacing-sm, --spacing-md, --spacing-lg

/* Components */
--height-button
--radius-button
--spacing-button-padding-x
```

### App-Specific Variables

Custom variables are namespaced:

```css
--jsg-commissions-profile-card-border
--jsg-commissions-priority-badge-high
--jsg-commissions-modal-width
```

### Responsive Design

- Mobile-first approach
- Container queries for components
- Flexible grid layouts
- Touch-friendly interactions

## Permissions

The app respects permission-based access control:

```typescript
// Required permissions
view:commissions     // View profiles
manage:commissions   // Create/edit/delete profiles
```

Use `PermissionGuard` for route protection:

```tsx
<PermissionGuard permission="manage:commissions">
  <ProfileEditor />
</PermissionGuard>
```

## Testing Checklist

### Standalone Mode
- [ ] App starts with `npm run dev`
- [ ] Login page appears
- [ ] Firebase authentication works
- [ ] Profile list loads
- [ ] Create profile modal opens
- [ ] Rules can be added/removed
- [ ] Profile saves successfully
- [ ] Delete confirmation works
- [ ] Toast notifications appear
- [ ] No console errors
- [ ] No infinite API loops

### Embedded Mode
- [ ] Component exports correctly
- [ ] Props received from wrapper
- [ ] Auth token passed to queries
- [ ] Tenant prefix applied to tables
- [ ] No login UI shown
- [ ] Token refresh callback works
- [ ] CSS variables applied correctly
- [ ] Animations work smoothly

### Build
- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] Lint passes
- [ ] Bundle size reasonable
- [ ] Assets included in dist

## Troubleshooting

### Common Issues

**"No authentication token available"**
- Check `.env` file has correct Firebase config
- Verify token is being passed in embedded mode
- Check AuthContext is properly initialized

**"Table does not exist"**
- Verify tenant prefix is correct
- Check GraphQL endpoint in `.env`
- Ensure database migration ran

**"Infinite loop detected"**
- Check useEffect dependencies
- Verify GraphQL queries aren't in render cycle
- Add proper memoization

**Styles not applying**
- Verify CSS import in `embedded.jsx`
- Check CSS variables fallback file
- Clear browser cache

## Development Tips

### Adding New Features

1. Create component in `src/components/commissions/`
2. Add styles to `src/styles/commissions.css`
3. Use CSS variables for all styling
4. Add hook if API interaction needed
5. Update types in `src/types/`
6. Test in both standalone and embedded modes

### Working with GraphQL

Always use the pattern:
```typescript
const table = `${tenant?.name || DEFAULT_TENANT}_commission_profiles`;
const result = await query(`
  query {
    profiles: ${table} { /* fields */ }
  }
`, {}, undefined, embeddedAuthToken);
```

### Debugging

Enable debug logging:
```typescript
// In useGraphQL.ts
console.log('GraphQL Query:', { table, query, variables });
```

## Production Deployment

1. Build the app: `npm run build`
2. Verify dist output
3. Update wrapper dependency
4. Test in wrapper environment
5. Verify token passing
6. Check tenant switching
7. Monitor console for errors

## Support

For issues or questions:
- Check CLAUDE.md for detailed guidance
- Review child_app_integration_standards.md
- Consult STYLE_GUIDE.md for design standards

## License

Proprietary - JetSetGo Platform
