import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader, Database } from 'lucide-react';
import { ApiResponse } from '../../../types/api';
import { sanitizeHeaders } from '../../../utils/api';

interface ApiTestResultsProps {
  loading: boolean;
  error: string | null;
  apiResponse: ApiResponse | null;
}

export function ApiTestResults({ loading, error, apiResponse }: ApiTestResultsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Database className="h-5 w-5 text-[var(--color-primary-600)]" />
        REST API Test (JetSetGo)
        {loading && <Loader className="h-5 w-5 animate-spin text-[var(--color-primary-600)]" />}
        {!loading && !error && <CheckCircle className="h-5 w-5" style={{ color: 'var(--color-success-600, #10B981)' }} />}
        {error && <XCircle className="h-5 w-5 text-[var(--color-error-500)]" />}
      </h2>

      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-background, #f9fafb)' }}>
        <h3 className="font-medium mb-2">Status</h3>
        {loading && (
          <div className="text-[var(--color-primary-600)]">Loading REST API data...</div>
        )}
        {error && (
          <div className="text-[var(--color-error-500)]">{error}</div>
        )}
        {!loading && !error && apiResponse && (
          <div style={{ color: 'var(--color-success-600, #10B981)' }}>
            Successfully fetched data from /dynamic-data?association_type=resources
          </div>
        )}
      </div>

      {apiResponse && (
        <>
          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-background, #f9fafb)' }}>
            <h3 className="font-medium mb-2">Sample Response Data</h3>
            <div className="bg-white p-3 rounded">
              <pre className="text-sm overflow-x-auto max-h-40">
                {JSON.stringify(apiResponse.data, null, 2)}
              </pre>
            </div>
          </div>

          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-background, #f9fafb)' }}>
            <h3 className="font-medium mb-2">Request Details</h3>
            <div className="space-y-2 text-sm">
              <div><strong>URL:</strong> {apiResponse.debug.url}</div>
              <div><strong>Headers:</strong></div>
              <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
                {JSON.stringify(sanitizeHeaders(apiResponse.debug.headers), null, 2)}
              </pre>
            </div>
          </div>

          <details className="rounded-lg" style={{ backgroundColor: 'var(--color-background, #f9fafb)' }}>
            <summary className="p-4 cursor-pointer font-medium">
              View Full REST Response
            </summary>
            <div className="px-4 pb-4">
              <pre className="bg-white p-4 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </div>
          </details>
        </>
      )}
    </motion.div>
  );
}