/**
 * GL Batch Runs REST API Hook
 *
 * Provides data fetching for GL batch runs (sales and payment batches).
 * Uses REST API for batch run history and catchup operations.
 *
 * Endpoints:
 * - GET /gl-batch-runs-sales - List sales batch runs
 * - GET /gl-batch-runs-payments - List payment batch runs
 * - POST /gl-batch-runs-sales-catchup - Trigger sales batch catchup
 * - POST /gl-batch-runs-payments-catchup - Trigger payment batch catchup
 */

import { useCallback, useState } from 'react';
import { useApi } from './useApi';
import {
  GLBatchRun,
  GLBatchRunsResponse,
  PaginationInfo,
  BatchCatchupRequest,
  BatchCatchupResponse,
  BatchType,
} from '../types/gl-rules';

/**
 * Filter state for batch runs
 */
export interface GLBatchRunsFilters {
  /** Start date filter (YYYY-MM-DD) */
  startDate: string | null;
  /** End date filter (YYYY-MM-DD) */
  endDate: string | null;
}

/**
 * Default filters - no date restriction
 */
function getDefaultFilters(): GLBatchRunsFilters {
  return {
    startDate: null,
    endDate: null,
  };
}

/**
 * Default pagination state
 */
function getDefaultPagination(): PaginationInfo {
  return {
    page: 1,
    page_size: 20,
    total_items: 0,
    total_pages: 0,
  };
}

/**
 * Hook for managing GL batch runs data
 */
export function useGLBatchRuns(batchType: BatchType) {
  const { fetchWithAuth } = useApi();

  // State
  const [batchRuns, setBatchRuns] = useState<GLBatchRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<GLBatchRunsFilters>(getDefaultFilters);
  const [pagination, setPagination] = useState<PaginationInfo>(getDefaultPagination);
  const [catchupLoading, setCatchupLoading] = useState(false);

  /**
   * Build query string from filters and pagination
   */
  const buildQueryString = useCallback(
    (currentFilters: GLBatchRunsFilters, page: number, pageSize: number): string => {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('page_size', pageSize.toString());

      if (currentFilters.startDate) {
        params.set('start_date', currentFilters.startDate);
      }
      if (currentFilters.endDate) {
        params.set('end_date', currentFilters.endDate);
      }

      return params.toString();
    },
    []
  );

  /**
   * Get the endpoint based on batch type
   */
  const getEndpoint = useCallback(() => {
    return batchType === 'sales' ? '/gl-batch-runs-sales' : '/gl-batch-runs-payments';
  }, [batchType]);

  /**
   * Get the catchup endpoint based on batch type
   */
  const getCatchupEndpoint = useCallback(() => {
    return batchType === 'sales'
      ? '/gl-batch-runs-sales-catchup'
      : '/gl-batch-runs-payments-catchup';
  }, [batchType]);

  /**
   * Fetch batch runs with filters and pagination
   */
  const fetchBatchRuns = useCallback(
    async (
      currentFilters: GLBatchRunsFilters = filters,
      page: number = 1,
      pageSize: number = 20
    ): Promise<GLBatchRun[]> => {
      setLoading(true);
      setError(null);

      const queryString = buildQueryString(currentFilters, page, pageSize);
      const endpoint = `${getEndpoint()}?${queryString}`;

      try {
        const response = await fetchWithAuth(endpoint);
        const data = response.data as GLBatchRunsResponse;

        // Transform the data - add status field (always 'completed' since records only exist for successful runs)
        const transformedRuns: GLBatchRun[] = data.data.map((run) => ({
          ...run,
          status: 'completed' as const,
        }));

        setBatchRuns(transformedRuns);
        setPagination(data.pagination);

        return transformedRuns;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : `Failed to fetch ${batchType} batch runs`;
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth, buildQueryString, getEndpoint, filters, batchType]
  );

  /**
   * Run catchup batch processing
   */
  const runCatchup = useCallback(
    async (request: BatchCatchupRequest): Promise<BatchCatchupResponse> => {
      setCatchupLoading(true);
      setError(null);

      const endpoint = getCatchupEndpoint();

      try {
        const response = await fetchWithAuth(endpoint, {
          method: 'POST',
          body: JSON.stringify(request),
        });

        const data = response.data as BatchCatchupResponse;

        // Refresh the batch runs list after successful catchup
        await fetchBatchRuns(filters, 1, pagination.page_size);

        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : `Failed to run ${batchType} batch catchup`;
        setError(message);
        throw err;
      } finally {
        setCatchupLoading(false);
      }
    },
    [fetchWithAuth, getCatchupEndpoint, fetchBatchRuns, filters, pagination.page_size, batchType]
  );

  /**
   * Update filters
   */
  const setFilters = useCallback((newFilters: Partial<GLBatchRunsFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Reset filters to defaults
   */
  const resetFilters = useCallback(() => {
    setFiltersState(getDefaultFilters());
  }, []);

  /**
   * Refetch with current filters
   */
  const refetch = useCallback(async () => {
    await fetchBatchRuns(filters, pagination.page, pagination.page_size);
  }, [fetchBatchRuns, filters, pagination.page, pagination.page_size]);

  /**
   * Go to a specific page
   */
  const goToPage = useCallback(
    async (page: number) => {
      await fetchBatchRuns(filters, page, pagination.page_size);
    },
    [fetchBatchRuns, filters, pagination.page_size]
  );

  /**
   * Change page size
   */
  const setPageSize = useCallback(
    async (pageSize: number) => {
      await fetchBatchRuns(filters, 1, pageSize);
    },
    [fetchBatchRuns, filters]
  );

  return {
    // Data
    batchRuns,

    // State
    loading,
    error,
    catchupLoading,

    // Pagination
    pagination,
    goToPage,
    setPageSize,

    // Filters
    filters,
    setFilters,
    resetFilters,

    // Actions
    fetchBatchRuns,
    runCatchup,
    refetch,
  };
}
