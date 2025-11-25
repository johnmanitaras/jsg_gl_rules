import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader, Zap } from 'lucide-react';
import { GraphQLResponse } from '../../../utils/graphql';

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

interface GraphQLTestResultsProps {
  loading: boolean;
  error: string | null;
  graphqlResponse: GraphQLResponse<{ inventory_holding_units: InventoryHoldingUnit[] }> | null;
}

export function GraphQLTestResults({ loading, error, graphqlResponse }: GraphQLTestResultsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="space-y-4"
    >
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Zap className="h-5 w-5" style={{ color: 'var(--color-primary-600, #3B82F6)' }} />
        GraphQL API Test (Hasura)
        {loading && <Loader className="h-5 w-5 animate-spin text-[var(--color-primary-600)]" />}
        {!loading && !error && <CheckCircle className="h-5 w-5" style={{ color: 'var(--color-success-600, #10B981)' }} />}
        {error && <XCircle className="h-5 w-5 text-[var(--color-error-500)]" />}
      </h2>

      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-background, #f9fafb)' }}>
        <h3 className="font-medium mb-2">Status</h3>
        {loading && (
          <div className="text-[var(--color-primary-600)]">Loading GraphQL data...</div>
        )}
        {error && (
          <div className="text-[var(--color-error-500)]">
            <strong>Error:</strong> {error}
          </div>
        )}
        {!loading && !error && graphqlResponse && (
          <div style={{ color: 'var(--color-success-600, #10B981)' }}>
            Successfully fetched {graphqlResponse.data.inventory_holding_units?.length || 0} inventory holding units
          </div>
        )}
        {!loading && !error && !graphqlResponse && (
          <div style={{ color: 'var(--color-warning-400, #F59E0B)' }}>
            No GraphQL response received
          </div>
        )}
      </div>

      {/* Always show debug information section */}
      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-background, #f9fafb)' }}>
        <h3 className="font-medium mb-2">Debug Information</h3>
        <div className="space-y-2 text-sm">
          <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
          <div><strong>Has Error:</strong> {error ? 'Yes' : 'No'}</div>
          <div><strong>Has Response:</strong> {graphqlResponse ? 'Yes' : 'No'}</div>
          {error && (
            <div className="mt-2">
              <strong>Error Details:</strong>
              <pre className="bg-white p-2 rounded text-xs overflow-x-auto mt-1">
                {error}
              </pre>
            </div>
          )}
        </div>
      </div>

      {graphqlResponse && (
        <>
          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-background, #f9fafb)' }}>
            <h3 className="font-medium mb-2">Sample Data (First 3 items)</h3>
            <div className="space-y-2">
              {graphqlResponse.data.inventory_holding_units?.slice(0, 3).map((unit) => (
                <div key={unit.id} className="bg-white p-3 rounded">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>Name:</strong> {unit.name}</div>
                    <div><strong>ID:</strong> {unit.id}</div>
                    <div><strong>Business ID:</strong> {unit.business_id}</div>
                    <div><strong>Priority:</strong> {unit.priority}</div>
                    {unit.room && (
                      <>
                        <div><strong>Room Name:</strong> {unit.room.name}</div>
                        <div><strong>Room ID:</strong> {unit.room.id}</div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-background, #f9fafb)' }}>
            <h3 className="font-medium mb-2">Debug Information</h3>
            <div className="space-y-2 text-sm font-mono">
              <div><strong>Endpoint:</strong> {graphqlResponse.debug.url}</div>
              <div><strong>Query:</strong></div>
              <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
                {graphqlResponse.debug.query}
              </pre>
              {graphqlResponse.debug.variables && (
                <>
                  <div><strong>Variables:</strong></div>
                  <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
                    {JSON.stringify(graphqlResponse.debug.variables, null, 2)}
                  </pre>
                </>
              )}
            </div>
          </div>

          <details className="rounded-lg" style={{ backgroundColor: 'var(--color-background, #f9fafb)' }}>
            <summary className="p-4 cursor-pointer font-medium">
              View Full GraphQL Response
            </summary>
            <div className="px-4 pb-4">
              <pre className="bg-white p-4 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(graphqlResponse, null, 2)}
              </pre>
            </div>
          </details>
        </>
      )}
    </motion.div>
  );
}