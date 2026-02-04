/**
 * Invoice Batches REST API Hook
 *
 * Provides data fetching for invoice batches using REST API.
 * Supports pagination and filtering by status and client.
 */

import { useCallback, useState } from 'react';
import { useApi } from './useApi';
import { InvoiceBatch, InvoiceBatchesResponse, PaginationInfo } from '../types/gl-rules';

export interface InvoiceBatchFilters {
  /** Filter by export status: 'exported', 'pending', or null for all */
  status: 'exported' | 'pending' | null;
  /** Filter by client ID (for deep-link from jsg_clients) */
  clientId: number | null;
  /** Start date filter (issue_date >= startDate) */
  startDate: string | null;
  /** End date filter (issue_date <= endDate) */
  endDate: string | null;
}

export interface UseInvoiceBatchesReturn {
  /** Array of invoice batches */
  batches: InvoiceBatch[];
  /** Loading state */
  loading: boolean;
  /** Error message if request failed */
  error: string | null;
  /** Pagination metadata */
  pagination: PaginationInfo | null;
  /** Current filter values */
  filters: InvoiceBatchFilters;
  /** Update filters (triggers refetch) */
  setFilters: (filters: Partial<InvoiceBatchFilters>) => void;
  /** Current page number */
  page: number;
  /** Set current page */
  setPage: (page: number) => void;
  /** Page size */
  pageSize: number;
  /** Fetch invoice batches with current filters and pagination */
  fetchBatches: () => Promise<void>;
  /** Manually refetch data */
  refetch: () => Promise<void>;
}

const DEFAULT_PAGE_SIZE = 20;

const DEFAULT_FILTERS: InvoiceBatchFilters = {
  status: null,
  clientId: null,
  startDate: null,
  endDate: null,
};

export function useInvoiceBatches(initialClientFilter?: number | null): UseInvoiceBatchesReturn {
  const { fetchWithAuth } = useApi();

  // State
  const [batches, setBatches] = useState<InvoiceBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFiltersState] = useState<InvoiceBatchFilters>({
    ...DEFAULT_FILTERS,
    clientId: initialClientFilter ?? null,
  });

  /**
   * Build query string from filters and pagination
   */
  const buildQueryString = useCallback((currentPage: number, currentFilters: InvoiceBatchFilters): string => {
    const params = new URLSearchParams();

    // Pagination
    params.set('page', currentPage.toString());
    params.set('page_size', DEFAULT_PAGE_SIZE.toString());

    // Status filter
    if (currentFilters.status) {
      params.set('status', currentFilters.status);
    }

    // Client filter (for invoice history deep-link)
    if (currentFilters.clientId) {
      params.set('client_id', currentFilters.clientId.toString());
    }

    // Date range filters
    if (currentFilters.startDate) {
      params.set('start_date', currentFilters.startDate);
    }
    if (currentFilters.endDate) {
      params.set('end_date', currentFilters.endDate);
    }

    return params.toString();
  }, []);

  /**
   * Fetch invoice batches from REST API
   */
  const fetchBatches = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const queryString = buildQueryString(page, filters);
      const response = await fetchWithAuth(`/invoice-batches?${queryString}`);
      const data = response.data as InvoiceBatchesResponse;

      setBatches(data.data);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching invoice batches:', err);
      const errorMessage = err instanceof Error
        ? err.message
        : 'Failed to fetch invoice batches';
      setError(errorMessage);
      setBatches([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, buildQueryString, page, filters]);

  /**
   * Update filters and reset to page 1
   */
  const setFilters = useCallback((newFilters: Partial<InvoiceBatchFilters>) => {
    setFiltersState((prev) => ({
      ...prev,
      ...newFilters,
    }));
    // Reset to first page when filters change
    setPage(1);
  }, []);

  /**
   * Refetch current page with current filters
   */
  const refetch = useCallback(async () => {
    await fetchBatches();
  }, [fetchBatches]);

  return {
    batches,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    page,
    setPage,
    pageSize: DEFAULT_PAGE_SIZE,
    fetchBatches,
    refetch,
  };
}
