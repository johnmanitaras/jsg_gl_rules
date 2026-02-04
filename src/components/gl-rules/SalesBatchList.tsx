/**
 * SalesBatchList Component
 *
 * Displays a list of sales batch runs with filtering and pagination.
 * Shows batch run history from the GL batch processing system.
 *
 * Features:
 * - Date range filter
 * - Paginated data table
 * - Loading skeleton animation
 * - Empty state handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  RefreshCw,
  AlertCircle,
  DollarSign,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { DatePicker } from '@jetsetgo/shared-components';
import { useGLBatchRuns, GLBatchRunsFilters } from '../../hooks/useGLBatchRuns';
import { GLBatchRun, PaginationInfo } from '../../types/gl-rules';

interface SalesBatchListProps {
  /** Callback when Run Catchup is triggered */
  onRunCatchup?: () => void;
}

/**
 * Format date for display
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format datetime for display
 */
function formatDateTime(dateString: string | null): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format date for input field
 */
function formatDateForInput(dateString: string | null): string {
  if (!dateString) return '';
  return dateString.split('T')[0];
}

/**
 * Loading skeleton for the table
 */
function TableSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="animate-pulse">
        {/* Header */}
        <div
          className="px-6 py-4"
          style={{
            backgroundColor: 'var(--color-neutral-50)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div className="flex gap-8">
            {[80, 120, 120, 140].map((width, i) => (
              <div
                key={i}
                className="h-4 rounded"
                style={{
                  backgroundColor: 'var(--color-neutral-200)',
                  width: `${width}px`,
                }}
              />
            ))}
          </div>
        </div>
        {/* Rows */}
        {[1, 2, 3, 4, 5].map((row) => (
          <div
            key={row}
            className="px-6 py-4 flex gap-8"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            {[60, 100, 100, 120].map((width, col) => (
              <motion.div
                key={col}
                className="h-4 rounded"
                style={{
                  backgroundColor: 'var(--color-neutral-100)',
                  width: `${width}px`,
                }}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  delay: col * 0.1,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="card">
      <div className="p-12 text-center">
        <DollarSign
          size={48}
          style={{ color: 'var(--color-neutral-400)', margin: '0 auto' }}
        />
        <h3
          className="mt-4"
          style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text)',
          }}
        >
          {hasFilters ? 'No batch runs found' : 'No sales batch runs yet'}
        </h3>
        <p
          className="mt-2 max-w-md mx-auto"
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {hasFilters
            ? 'Try adjusting your date filters to see more results'
            : 'Sales batch runs will appear here after overnight processing jobs complete'}
        </p>
      </div>
    </div>
  );
}

/**
 * Pagination component
 */
function Pagination({
  pagination,
  onPageChange,
  itemLabel = 'runs',
}: {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}) {
  const { page, page_size, total_items, total_pages } = pagination;
  const startItem = total_items === 0 ? 0 : (page - 1) * page_size + 1;
  const endItem = Math.min(page * page_size, total_items);

  const canGoPrevious = page > 1;
  const canGoNext = page < total_pages;

  if (total_items === 0) return null;

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-4 px-4 py-3"
      style={{
        borderTop: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-neutral-50)',
      }}
    >
      <p
        className="text-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Showing{' '}
        <span style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text)' }}>
          {startItem}-{endItem}
        </span>{' '}
        of{' '}
        <span style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text)' }}>
          {total_items}
        </span>{' '}
        {itemLabel}
      </p>

      {total_pages > 1 && (
        <div className="flex items-center gap-1">
          <PaginationButton
            onClick={() => onPageChange(1)}
            disabled={!canGoPrevious}
            ariaLabel="Go to first page"
          >
            <ChevronsLeft size={16} />
          </PaginationButton>
          <PaginationButton
            onClick={() => onPageChange(page - 1)}
            disabled={!canGoPrevious}
            ariaLabel="Go to previous page"
          >
            <ChevronLeft size={16} />
          </PaginationButton>

          <div
            className="flex items-center gap-2 px-3"
            style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}
          >
            <span>Page</span>
            <span
              style={{
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text)',
              }}
            >
              {page}
            </span>
            <span>of</span>
            <span style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text)' }}>
              {total_pages}
            </span>
          </div>

          <PaginationButton
            onClick={() => onPageChange(page + 1)}
            disabled={!canGoNext}
            ariaLabel="Go to next page"
          >
            <ChevronRight size={16} />
          </PaginationButton>
          <PaginationButton
            onClick={() => onPageChange(total_pages)}
            disabled={!canGoNext}
            ariaLabel="Go to last page"
          >
            <ChevronsRight size={16} />
          </PaginationButton>
        </div>
      )}
    </div>
  );
}

/**
 * Pagination button component
 */
function PaginationButton({
  onClick,
  disabled,
  ariaLabel,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="flex items-center justify-center w-9 h-9 rounded-md transition-colors"
      style={{
        backgroundColor: disabled ? 'transparent' : 'var(--color-surface-primary)',
        border: '1px solid var(--color-border)',
        color: disabled ? 'var(--color-text-disabled)' : 'var(--color-text-secondary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

/**
 * Status badge component - always shows completed since batch runs
 * only create records when they complete successfully
 */
function StatusBadge() {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: 'var(--color-success-50)',
        color: 'var(--color-success-700)',
      }}
    >
      <CheckCircle size={12} style={{ color: 'var(--color-success-500)' }} />
      Completed
    </span>
  );
}

/**
 * Batch run row component
 */
function BatchRunRow({ run, index }: { run: GLBatchRun; index: number }) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      className="hover:bg-neutral-50 transition-colors"
      style={{ borderBottom: '1px solid var(--color-border)' }}
    >
      <td
        className="px-6 py-4"
        style={{
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-primary-600)',
        }}
      >
        #{run.id}
      </td>
      <td
        className="px-6 py-4"
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text)',
        }}
      >
        <span style={{ color: 'var(--color-text-secondary)' }}>
          {formatDate(run.start_date)}
        </span>
        <span style={{ color: 'var(--color-text-muted)', margin: '0 8px' }}>to</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>
          {formatDate(run.end_date)}
        </span>
      </td>
      <td
        className="px-6 py-4"
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-secondary)',
        }}
      >
        {formatDateTime(run.created_at)}
      </td>
      <td className="px-6 py-4">
        <StatusBadge />
      </td>
    </motion.tr>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SalesBatchList({ onRunCatchup }: SalesBatchListProps) {
  const {
    batchRuns,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    resetFilters,
    fetchBatchRuns,
    goToPage,
  } = useGLBatchRuns('sales');

  const [isInitialized, setIsInitialized] = useState(false);

  // Date picker state
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const startDateButtonRef = useRef<HTMLButtonElement>(null);
  const endDateButtonRef = useRef<HTMLButtonElement>(null);

  // Initial data load - only run once on mount
  useEffect(() => {
    if (!isInitialized) {
      fetchBatchRuns(filters, 1, 20).then(() => {
        setIsInitialized(true);
      }).catch(() => {
        setIsInitialized(true);
      });
    }
  }, [isInitialized]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle filter changes
  const handleFilterChange = useCallback(
    (key: keyof GLBatchRunsFilters, value: string | null) => {
      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);
      fetchBatchRuns(newFilters, 1, pagination.page_size);
    },
    [filters, setFilters, fetchBatchRuns, pagination.page_size]
  );

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchBatchRuns(filters, pagination.page, pagination.page_size);
  }, [fetchBatchRuns, filters, pagination.page, pagination.page_size]);

  // Check if filters are active
  const hasActiveFilters = filters.startDate !== null || filters.endDate !== null;

  return (
    <div className="space-y-4">
      {/* Filters Row */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar size={16} style={{ color: 'var(--color-text-muted)' }} />
            <span
              className="text-sm"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Filter by date range:
            </span>
            <button
              ref={startDateButtonRef}
              onClick={() => setShowStartPicker(true)}
              className="input py-1.5 px-3 text-sm flex items-center gap-2"
              style={{ width: '150px' }}
            >
              <span style={{ color: filters.startDate ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                {filters.startDate ? new Date(filters.startDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : 'Start'}
              </span>
            </button>
            <AnimatePresence>
              {showStartPicker && (
                <DatePicker
                  selectedDate={filters.startDate ? new Date(filters.startDate) : new Date()}
                  maxDate={filters.endDate ? new Date(filters.endDate) : undefined}
                  onSelect={(date) => {
                    handleFilterChange('startDate', date.toISOString().split('T')[0]);
                    setShowStartPicker(false);
                  }}
                  onClose={() => setShowStartPicker(false)}
                  anchorEl={startDateButtonRef.current}
                />
              )}
            </AnimatePresence>
            <span style={{ color: 'var(--color-text-muted)' }}>to</span>
            <button
              ref={endDateButtonRef}
              onClick={() => setShowEndPicker(true)}
              className="input py-1.5 px-3 text-sm flex items-center gap-2"
              style={{ width: '150px' }}
            >
              <span style={{ color: filters.endDate ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                {filters.endDate ? new Date(filters.endDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : 'End'}
              </span>
            </button>
            <AnimatePresence>
              {showEndPicker && (
                <DatePicker
                  selectedDate={filters.endDate ? new Date(filters.endDate) : new Date()}
                  minDate={filters.startDate ? new Date(filters.startDate) : undefined}
                  onSelect={(date) => {
                    handleFilterChange('endDate', date.toISOString().split('T')[0]);
                    setShowEndPicker(false);
                  }}
                  onClose={() => setShowEndPicker(false)}
                  anchorEl={endDateButtonRef.current}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                resetFilters();
                fetchBatchRuns({ startDate: null, endDate: null }, 1, pagination.page_size);
              }}
              className="text-sm px-3 py-1.5 rounded-md hover:bg-neutral-100 transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Reset Filters
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 rounded-md hover:bg-neutral-100 transition-colors disabled:opacity-50"
            style={{ color: 'var(--color-text-secondary)' }}
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div
          className="card"
          style={{
            backgroundColor: 'var(--color-error-50)',
            borderColor: 'var(--color-error-200)',
          }}
        >
          <div className="p-4 flex items-center gap-3">
            <AlertCircle size={20} style={{ color: 'var(--color-error-500)' }} />
            <p style={{ color: 'var(--color-error-700)' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Data Table */}
      {loading && !isInitialized ? (
        <TableSkeleton />
      ) : batchRuns.length === 0 ? (
        <EmptyState hasFilters={hasActiveFilters} />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr
                style={{
                  backgroundColor: 'var(--color-neutral-50)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <th
                  className="text-left px-6 py-4"
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-secondary)',
                    width: '100px',
                  }}
                >
                  Batch ID
                </th>
                <th
                  className="text-left px-6 py-4"
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Date Range
                </th>
                <th
                  className="text-left px-6 py-4"
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Run At
                </th>
                <th
                  className="text-left px-6 py-4"
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-secondary)',
                    width: '120px',
                  }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {batchRuns.map((run, index) => (
                <BatchRunRow key={run.id} run={run} index={index} />
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <Pagination
            pagination={pagination}
            onPageChange={goToPage}
            itemLabel="batch runs"
          />
        </div>
      )}
    </div>
  );
}
