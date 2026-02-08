/**
 * GL Batch Entries REST API Hook
 *
 * Fetches accounting entries belonging to a specific batch run,
 * with booking references already resolved by the API.
 *
 * Endpoints:
 * - GET /gl-batch-run-entries-sales/{batchId} - Entries for a sales batch
 * - GET /gl-batch-run-entries-payments/{batchId} - Entries for a payment batch
 */

import { useCallback, useState } from 'react';
import { useApi } from './useApi';
import {
  BatchEntry,
  BatchEntriesResponse,
  BatchType,
  PaginationInfo,
} from '../types/gl-rules';

export function useGLBatchEntries() {
  const { fetchWithAuth } = useApi();

  const [entries, setEntries] = useState<BatchEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<BatchEntriesResponse['summary'] | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    page_size: 50,
    total_items: 0,
    total_pages: 0,
  });

  /**
   * Fetch entries for a specific batch run
   */
  const fetchBatchEntries = useCallback(
    async (
      batchId: number,
      batchType: BatchType,
      page: number = 1,
      pageSize: number = 50
    ): Promise<BatchEntry[]> => {
      setLoading(true);
      setError(null);

      const endpointBase = batchType === 'sales'
        ? '/gl-batch-run-entries-sales'
        : '/gl-batch-run-entries-payments';

      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('page_size', pageSize.toString());

      const endpoint = `${endpointBase}/${batchId}?${params.toString()}`;

      try {
        const response = await fetchWithAuth(endpoint);
        const data = response.data as BatchEntriesResponse;

        setEntries(data.data);
        setSummary(data.summary);
        setPagination(data.pagination);

        return data.data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to fetch batch entries';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth]
  );

  return {
    entries,
    loading,
    error,
    summary,
    pagination,
    fetchBatchEntries,
  };
}
