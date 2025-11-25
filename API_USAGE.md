# API Usage Guide

## Overview

This application provides two API clients for different data sources:

1. **REST API Client** - For the main JetSetGo API using the `useApi` hook
2. **GraphQL API Client** - For Hasura GraphQL API using the `useGraphQL` hook

Both clients handle authentication, custom headers, and error handling consistently.

## Key Features

### REST API Features
- Automatic tenant header management
- API key handling
- User ID header inclusion
- Consistent error handling
- Debug information for development
- Type-safe responses

### GraphQL API Features
- Firebase token authentication
- GraphQL query/mutation support
- Type-safe responses
- Debug information for development
- Error handling with GraphQL-specific error parsing

---

## REST API Usage

### 1. Import the useApi Hook

```typescript
import { useApi } from '../hooks/useApi';
```

### 2. Use the Hook in Your Component

```typescript
function YourComponent() {
  const { fetchWithAuth } = useApi();

  const fetchData = async () => {
    try {
      const response = await fetchWithAuth('/your-endpoint');
      // Handle the response
    } catch (error) {
      // Handle any errors
    }
  };
}
```

### 3. Making Different Types of Requests

```typescript
// GET Request (default)
const getData = await fetchWithAuth('/endpoint');

// POST Request
const postData = await fetchWithAuth('/endpoint', {
  method: 'POST',
  body: JSON.stringify(payload)
});

// PUT Request
const putData = await fetchWithAuth('/endpoint', {
  method: 'PUT',
  body: JSON.stringify(payload)
});

// DELETE Request
const deleteData = await fetchWithAuth('/endpoint', {
  method: 'DELETE'
});
```

## Response Format

All API responses follow this structure:

```typescript
interface ApiResponse {
  data: any;  // The actual API response data
  debug: {
    url: string;  // The full URL that was called
    headers: Record<string, string>;  // Headers sent (sensitive data redacted)
  };
}
```

## ⚠️ Important Guidelines

1. **DO NOT** create your own fetch calls or axios instances. Always use the `useApi` hook.

2. **DO NOT** manually set these headers:
   - `X-DB-Name`
   - `x-api-key`
   - `user-id`
   These are automatically handled by the API client.

3. **DO NOT** store the API key in your components. It's managed centrally.

4. **ALWAYS** handle errors appropriately in your components.

## Error Handling

The API client includes built-in error handling. Errors will include both the error message and debug information:

```typescript
try {
  const response = await fetchWithAuth('/endpoint');
  // Handle success
} catch (error) {
  console.error('API Error:', error.message);
  console.debug('Debug Info:', error.debug);
}
```

## Example Usage

### Basic Data Fetching

```typescript
function UserProfile() {
  const { fetchWithAuth } = useApi();
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetchWithAuth('/user/profile');
        setUserData(response.data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchUserData();
  }, [fetchWithAuth]);

  // Render component...
}
```

### With React Query

```typescript
import { useQuery } from '@tanstack/react-query';

function UserDashboard() {
  const { fetchWithAuth } = useApi();

  const { data, error, isLoading } = useQuery({
    queryKey: ['userData'],
    queryFn: () => fetchWithAuth('/user/dashboard')
  });

  // Render component...
}
```

### Posting Data

```typescript
function CreatePost() {
  const { fetchWithAuth } = useApi();

  const handleSubmit = async (postData) => {
    try {
      const response = await fetchWithAuth('/posts', {
        method: 'POST',
        body: JSON.stringify(postData)
      });
      // Handle successful post creation
    } catch (error) {
      // Handle error
    }
  };

  // Render component...
}
```

## Best Practices

1. **Use React Query**: For complex data fetching and caching, combine the API client with React Query.

2. **Error Boundaries**: Implement error boundaries to catch and handle API errors gracefully.

3. **Loading States**: Always handle loading states to provide good UX.

4. **Type Safety**: Use TypeScript interfaces for your request and response data.

5. **Environment Variables**: Don't hardcode API URLs. Use the provided configuration.

## Common Pitfalls to Avoid

1. ❌ Don't create new instances of fetch or axios
2. ❌ Don't manually handle authentication headers
3. ❌ Don't store API keys in components
4. ❌ Don't ignore error handling
5. ❌ Don't make API calls outside of the provided hook

---

## GraphQL API Usage

### 1. Import the useGraphQL Hook

```typescript
import { useGraphQL } from '../hooks/useGraphQL';
```

### 2. Use the Hook in Your Component

```typescript
function YourComponent() {
  const { query, mutate } = useGraphQL();

  const fetchInventoryData = async () => {
    try {
      const response = await query(`
        query GetInventoryHoldingUnits {
          tta_inventory_holding_units {
            id
            name
            business_id
            company_id
            room {
              id
              name
            }
          }
        }
      `);
      // Handle the response
    } catch (error) {
      // Handle any errors
    }
  };
}
```

### 3. Making Different Types of GraphQL Requests

```typescript
// Query with variables
const getUnitById = async (unitId: string) => {
  const response = await query(`
    query GetUnitById($id: String!) {
      tta_inventory_holding_units(where: {id: {_eq: $id}}) {
        id
        name
        business_id
      }
    }
  `, { id: unitId });
};

// Mutation
const createUnit = async (unitData: any) => {
  const response = await mutate(`
    mutation CreateUnit($data: tta_inventory_holding_units_insert_input!) {
      insert_tta_inventory_holding_units_one(object: $data) {
        id
        name
        business_id
      }
    }
  `, { data: unitData });
};

// Query with operation name
const getUnitsWithName = async (variables: any) => {
  const response = await query(`
    query GetUnitsWithName($limit: Int) {
      tta_inventory_holding_units(limit: $limit) {
        id
        name
      }
    }
  `, variables, 'GetUnitsWithName');
};
```

## GraphQL Response Format

All GraphQL responses follow this structure:

```typescript
interface GraphQLResponse<T> {
  data: T;  // The actual GraphQL response data
  debug: {
    url: string;  // The GraphQL endpoint
    headers: Record<string, string>;  // Headers sent (sensitive data redacted)
    query: string;  // The GraphQL query that was executed
    variables?: Record<string, any>;  // Variables passed to the query
  };
}
```

## GraphQL Error Handling

The GraphQL client includes built-in error handling for GraphQL-specific errors:

```typescript
try {
  const response = await query(`
    query GetData {
      tta_inventory_holding_units {
        id
        name
      }
    }
  `);
  // Handle success
} catch (error) {
  console.error('GraphQL Error:', error.message);
  console.debug('Debug Info:', error.debug);
}
```

## Example GraphQL Usage

### Basic Data Fetching

```typescript
function InventoryList() {
  const { query } = useGraphQL();
  const [inventoryData, setInventoryData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        const response = await query(`query GetInventoryHoldingUnits {
  tta_inventory_holding_units {
    name
    business_id
    company_id
    id
    inventory_holding_set_id
    parent
    priority
    room_id
    created_at
    updated_at
    room {
      id
      name
    }
  }
}`);
        setInventoryData(response.data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchInventoryData();
  }, [query]);

  // Render component...
}
```

### With React Query

```typescript
import { useQuery } from '@tanstack/react-query';

function InventoryDashboard() {
  const { query } = useGraphQL();

  const { data, error, isLoading } = useQuery({
    queryKey: ['inventoryUnits'],
    queryFn: () => query(`query GetInventoryHoldingUnits {
  tta_inventory_holding_units {
    name
    business_id
    company_id
    id
    inventory_holding_set_id
    parent
    priority
    room_id
    created_at
    updated_at
    room {
      id
      name
    }
  }
}`)
  });

  // Render component...
}
```

### Creating/Updating Data

```typescript
function CreateInventoryUnit() {
  const { mutate } = useGraphQL();

  const handleSubmit = async (unitData) => {
    try {
      const response = await mutate(`
        mutation CreateInventoryUnit($data: tta_inventory_holding_units_insert_input!) {
          insert_tta_inventory_holding_units_one(object: $data) {
            id
            name
            business_id
            created_at
          }
        }
      `, { data: unitData });
      // Handle successful creation
    } catch (error) {
      // Handle error
    }
  };

  // Render component...
}
```

## ⚠️ Important Guidelines

### For REST API:
1. **DO NOT** create your own fetch calls or axios instances. Always use the `useApi` hook.
2. **DO NOT** manually set tenant headers (`X-DB-Name`, `x-api-key`, `user-id`).

### For GraphQL API:
1. **DO NOT** create your own GraphQL clients. Always use the `useGraphQL` hook.
2. **DO NOT** manually handle Firebase token authentication for GraphQL calls.
3. **ALWAYS** use proper GraphQL syntax in your queries and mutations.
4. **DO NOT** store sensitive credentials in components.

### General Guidelines:
1. **ALWAYS** handle errors appropriately in your components.
2. **USE** TypeScript interfaces for your request and response data.
3. **IMPLEMENT** proper loading states for good UX.

## Configuration

### Environment Variables

For GraphQL API configuration, set these environment variables:

```env
VITE_HASURA_GRAPHQL_ENDPOINT=https://graphql.jetsetgo.world/v1/graphql
VITE_HASURA_GRAPHQL_ADMIN_SECRET=your-admin-secret-here
```

**Note**: The GraphQL API uses Firebase Bearer token authentication. Admin secrets are not required for client applications and should only be used for server-side operations.

If not provided, the system will fall back to default values configured in `src/lib/config.ts`.

## Common Pitfalls to Avoid

1. ❌ Don't create new instances of fetch, axios, or GraphQL clients
2. ❌ Don't manually handle authentication headers for either API
3. ❌ Don't store API keys or secrets in components
4. ❌ Don't ignore error handling
5. ❌ Don't make API calls outside of the provided hooks
6. ❌ Don't mix REST and GraphQL patterns (use the appropriate hook for each API)

## Need Help?

If you need to add new API functionality or have questions about either API client, please consult the team lead or refer to the API documentation.