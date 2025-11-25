# Commission Profiles App - Quick Start Guide

Get up and running with the Commission Profiles Management app in under 5 minutes.

## For Developers (Standalone Testing)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your Firebase and API credentials
```

### 3. Run Development Server
```bash
npm run dev
```

Visit: `http://localhost:5173`

### 4. Login with Test Credentials
Use your Firebase test account credentials.

### 5. Create Your First Profile
1. Click "Create Profile" button
2. Enter name: "Test Commission"
3. Set priority: High
4. Click "Save"

Done! You're ready to develop.

## For Integration (Wrapper)

### 1. Add Package
```bash
cd jsg_wrapper
npm install --save file:../jsg_commissions
```

### 2. Register Component
In `jsg_wrapper/src/lib/components.ts`:
```typescript
import 'jsg_commissions/dist/style.css';

export const CommissionsApp = lazy(() =>
  import('jsg_commissions').then((module) => ({
    default: module.CommissionsApp,
  }))
);
```

### 3. Add Page Config
In `jsg_wrapper/src/config/pages.ts`:
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

### 4. Add Navigation
In `jsg_wrapper/src/data/navigation.json`:
```json
{
  "id": "commissions",
  "label": "Commission Profiles",
  "icon": "Percent",
  "path": "/commissions",
  "permission": "view:commissions"
}
```

### 5. Create Database Table
```sql
CREATE TABLE {tenant}_commission_profiles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 5,
  rules JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6. Test Integration
```bash
cd jsg_wrapper
npm run dev
```

Navigate to Commission Profiles in the sidebar.

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint            # Check code quality

# Testing
npm run test:visual     # Run Playwright tests
npm run test:visual:ui  # Open Playwright UI
```

## Need Help?

- **Setup Issues**: See [README.md](./README.md)
- **Integration**: See [WRAPPER_INTEGRATION_GUIDE.md](./WRAPPER_INTEGRATION_GUIDE.md)
- **Testing**: See [INTEGRATION_TEST_REPORT.md](./INTEGRATION_TEST_REPORT.md)
- **Development**: See [CLAUDE.md](./CLAUDE.md)

## Key Features

- Create/edit/delete commission profiles
- Visual priority system (High/Medium/Low)
- Rule builder with drag-and-drop
- Product-level overrides
- Beautiful animations and UX
- Fully responsive design

## Architecture

```
Entry Points
├── main.tsx        → Standalone mode (with routing)
└── embedded.jsx    → Embedded mode (wrapper integration)

Main Components
├── CommissionsApp  → Root component
├── ProfileList     → List view with cards
├── ProfileEditor   → Create/edit modal
├── RuleBuilder     → Rule creation interface
└── RuleList        → Drag-drop rule management
```

## Props (Embedded Mode)

```typescript
<CommissionsApp
  token={firebaseToken}
  dbName={tenantName}
  onTokenExpired={() => refreshToken()}
  mode="embedded"
/>
```

## GraphQL Table Pattern

```typescript
const table = `${tenant}_commission_profiles`;

query {
  profiles: ${table} {
    id, name, description, priority, rules
  }
}
```

## Troubleshooting

**App won't start?**
- Check `.env` file exists
- Verify Firebase credentials
- Run `npm install`

**Build fails?**
- Clear `node_modules` and reinstall
- Check Node version (>= 18)
- Update dependencies

**Styles missing?**
- Ensure CSS import in wrapper
- Clear browser cache
- Check CSS variables loaded

**Auth errors?**
- Verify token is valid
- Check Firebase configuration
- Ensure tenant name correct

## Quick Links

- [Complete Documentation](./README.md)
- [Integration Guide](./WRAPPER_INTEGRATION_GUIDE.md)
- [Test Report](./INTEGRATION_TEST_REPORT.md)
- [Task Completion](./TASK_8_COMPLETION_REPORT.md)

---

**Ready to build amazing commission management experiences!**
