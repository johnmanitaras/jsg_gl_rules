import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { useGraphQL } from '../../hooks/useGraphQL';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserInfo } from './components/UserInfo';
import { GroupsList } from './components/GroupsList';
import { PermissionsList } from './components/PermissionsList';
import { ApiTestResults } from './components/ApiTestResults';
import { GraphQLTestResults } from './components/GraphQLTestResults';
import { ApiResponse } from '../../types/api';
import { GraphQLResponse } from '../../utils/graphql';

// Static table name using reference schema (tenant specified via X-Hasura-Tenant-Id header)
const INVENTORY_HOLDING_UNITS_TABLE = 'jsg_reference_schema_inventory_holding_units';

interface InventoryHoldingUnit {
  id: string;
  name: string;
  business_id: string;
  company_id: string;
  inventory_holding_set_id: string;
  parent: string | null;
  priority: number;
  room_id: string | null;
  created_at: string;
  updated_at: string;
  room: {
    id: string;
    name: string;
  } | null;
}

export function TestPage() {
  const { user, tenant, userId, groups, permissions } = useAuth();
  const { fetchWithAuth } = useApi();
  const { query: graphqlQuery } = useGraphQL();

  // REST API state
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [restLoading, setRestLoading] = useState(true);
  const [restError, setRestError] = useState<string | null>(null);

  // GraphQL API state
  const [graphqlResponse, setGraphqlResponse] = useState<
    GraphQLResponse<{ inventory_holding_units: InventoryHoldingUnit[] }>
  | null>(null);
  const [graphqlLoading, setGraphqlLoading] = useState(true);
  const [graphqlError, setGraphqlError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch REST API data
    const fetchRestData = async () => {
      try {
        const response = await fetchWithAuth('/dynamic-data?association_type=resources');
        setApiResponse(response);
        setRestError(null);
      } catch (err: unknown) {
        setRestError((err as Error).message || 'Failed to fetch REST data');
      } finally {
        setRestLoading(false);
      }
    };

    // Fetch GraphQL API data
    const fetchGraphQLData = async () => {
      try {
        const query = `query GetInventoryHoldingUnits {
  inventory_holding_units: ${INVENTORY_HOLDING_UNITS_TABLE} {
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
}`;

        const response = await graphqlQuery<{ inventory_holding_units: InventoryHoldingUnit[] }>(query);

        setGraphqlResponse(response);
        setGraphqlError(null);
      } catch (err: unknown) {
        setGraphqlError((err as Error).message || 'Failed to fetch GraphQL data');
      } finally {
        setGraphqlLoading(false);
      }
    };

    fetchRestData();
    fetchGraphQLData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount - tenant is handled via X-Hasura-Tenant-Id header

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-8">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <h1 className="text-2xl font-bold">JetSetGo Template - API Testing</h1>
              <button
                onClick={handleSignOut}
                className="btn-secondary text-[var(--color-error-500)] flex items-center gap-2 transition-colors duration-150 hover:bg-[var(--color-error-50,#fef2f2)] hover:border-[var(--color-error-200,#fecaca)]"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>

            <div className="card-body space-y-8">
              <UserInfo user={user} tenant={tenant} userId={userId} />
              <GroupsList groups={groups} />
              <PermissionsList permissions={permissions} />
              
              {/* API Testing Section */}
              <div className="border-t pt-8" style={{ borderColor: 'var(--color-border, #e5e7eb)' }}>
                <h2 className="text-2xl font-bold mb-6 text-center">API Integration Tests</h2>
                <div className="space-y-8">
                  <ApiTestResults
                    loading={restLoading}
                    error={restError}
                    apiResponse={apiResponse}
                  />
                  <GraphQLTestResults
                    loading={graphqlLoading}
                    error={graphqlError}
                    graphqlResponse={graphqlResponse}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}