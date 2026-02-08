/**
 * PaymentBatchList Component
 *
 * Displays a list of payment batch runs with filtering, pagination, and expandable rows.
 * Shows batch run history from the GL payment surcharge batch processing system.
 *
 * Features:
 * - Date range filter
 * - Paginated data table with entry_count and net_amount columns
 * - Expandable rows showing batch entries with booking references
 * - Journal export from expanded rows
 * - Loading skeleton animation
 * - Empty state handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  RefreshCw,
  AlertCircle,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Download,
  RotateCcw,
} from 'lucide-react';
import { DatePicker } from '@jetsetgo/shared-components';
import { useGLBatchRuns, GLBatchRunsFilters } from '../../hooks/useGLBatchRuns';
import { useGLBatchEntries } from '../../hooks/useGLBatchEntries';
import { useJournalExport } from '../../hooks/useJournalExport';
import { useBatchExportStatus } from '../../hooks/useBatchExportStatus';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { StatusActionDropdown } from './StatusActionDropdown';
import {
  GLBatchRun,
  PaginationInfo,
  BatchEntry,
  ExportFormat,
  EXPORT_FORMATS,
  EXPORT_FORMAT_NAMES,
  getExportStatus,
} from '../../types/gl-rules';

interface PaymentBatchListProps {
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
 * Format currency amount
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Loading skeleton for the table
 */
function TableSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="animate-pulse">
        <div
          className="px-6 py-4"
          style={{
            backgroundColor: 'var(--color-neutral-50)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div className="flex gap-8">
            {[40, 80, 120, 120, 80, 80, 100].map((width, i) => (
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
        {[1, 2, 3, 4, 5].map((row) => (
          <div
            key={row}
            className="px-6 py-4 flex gap-8"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            {[30, 60, 100, 100, 60, 60, 80].map((width, col) => (
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
        <CreditCard
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
          {hasFilters ? 'No batch runs found' : 'No payment batch runs yet'}
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
            : 'Payment surcharge batch runs will appear here after overnight processing jobs complete'}
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
 * Expanded batch entries sub-table with export and status management
 */
function BatchEntriesPanel({
  run,
  onStatusChanged,
}: {
  run: GLBatchRun;
  onStatusChanged?: () => void;
}) {
  const batchId = run.id;
  const exportStatus = getExportStatus(run.exported_at, run.posted_at);
  const ENTRIES_PAGE_SIZE = 15;

  const { entries, loading, error, summary, pagination: entriesPagination, fetchBatchEntries } = useGLBatchEntries();
  const { exporting, error: exportError, exportJournal } = useJournalExport();
  const { markAsExported, markAsPosted, resetToPending, resetToExported, error: statusError, getTableName, clearError } = useBatchExportStatus();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [hasFetched, setHasFetched] = useState(false);
  const [entriesPage, setEntriesPage] = useState(1);

  // Re-export confirmation
  const [showReexportConfirm, setShowReexportConfirm] = useState(false);

  useEffect(() => {
    if (!hasFetched) {
      fetchBatchEntries(batchId, 'payments', 1, ENTRIES_PAGE_SIZE).then(() => {
        setHasFetched(true);
      }).catch(() => {
        setHasFetched(true);
      });
    }
  }, [hasFetched]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEntriesPageChange = (page: number) => {
    setEntriesPage(page);
    fetchBatchEntries(batchId, 'payments', page, ENTRIES_PAGE_SIZE);
  };

  const handleExport = async () => {
    if (exportStatus !== 'pending') {
      setShowReexportConfirm(true);
      return;
    }
    const ok = await exportJournal(batchId, 'payments', selectedFormat);
    if (ok) onStatusChanged?.();
  };

  const handleConfirmExport = async () => {
    setShowReexportConfirm(false);
    const ok = await exportJournal(batchId, 'payments', selectedFormat);
    if (ok) onStatusChanged?.();
  };

  const handleStatusAction = async (action: string): Promise<boolean> => {
    const table = getTableName('payments');
    switch (action) {
      case 'mark-exported':
        return markAsExported(batchId, table);
      case 'mark-posted':
        return markAsPosted(batchId, table);
      case 'reset-pending':
        return resetToPending(batchId, table);
      case 'reset-exported':
        return resetToExported(batchId, table);
      default:
        return false;
    }
  };

  useEffect(() => {
    return () => clearError();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && !hasFetched) {
    return (
      <div className="px-8 py-6 flex items-center justify-center gap-2">
        <div
          className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
          style={{ color: 'var(--color-primary-600)' }}
        />
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Loading entries...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-8 py-4 flex items-center gap-2">
        <AlertCircle size={16} style={{ color: 'var(--color-error-500)' }} />
        <span className="text-sm" style={{ color: 'var(--color-error-600)' }}>{error}</span>
      </div>
    );
  }

  return (
    <div className="px-8 py-4 space-y-4">
      {/* Summary row */}
      {summary && (
        <div className="flex items-center gap-6 text-sm">
          <span style={{ color: 'var(--color-text-secondary)' }}>
            {summary.total_entries} entries
          </span>
          <span style={{ color: 'var(--color-success-600)' }}>
            Debit: {formatCurrency(summary.total_debit)}
          </span>
          <span style={{ color: 'var(--color-error-600)' }}>
            Credit: {formatCurrency(summary.total_credit)}
          </span>
          <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text)' }}>
            Net: {formatCurrency(summary.net_amount)}
          </span>
        </div>
      )}

      {/* Entries sub-table */}
      {entries.length > 0 ? (
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-neutral-100)' }}>
                <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Account</th>
                <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Booking Ref</th>
                <th className="text-right px-3 py-2 text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Amount</th>
                <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: 'var(--color-text-secondary)', width: '80px' }}>Type</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry: BatchEntry) => (
                <tr
                  key={entry.id}
                  style={{ borderTop: '1px solid var(--color-border)' }}
                  className="hover:bg-white transition-colors"
                >
                  <td className="px-3 py-2 text-sm" style={{ color: 'var(--color-text)' }}>
                    {entry.account_name}
                    <span className="ml-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      ({entry.account_external_id})
                    </span>
                  </td>
                  <td className="px-3 py-2 text-sm" style={{ color: entry.booking_reference ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                    {entry.booking_reference || '—'}
                  </td>
                  <td className="px-3 py-2 text-sm text-right font-mono" style={{
                    color: entry.amount >= 0 ? 'var(--color-success-600)' : 'var(--color-error-600)',
                  }}>
                    {formatCurrency(entry.amount)}
                  </td>
                  <td className="px-3 py-2">
                    {entry.is_reversal && (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: 'var(--color-warning-50)',
                          color: 'var(--color-warning-700)',
                        }}
                      >
                        <RotateCcw size={10} />
                        Reversal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Entries pagination */}
          {entriesPagination.total_pages > 1 && (
            <div
              className="flex items-center justify-between px-3 py-2"
              style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-neutral-50)' }}
            >
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {entriesPagination.total_items} entries
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEntriesPageChange(entriesPage - 1)}
                  disabled={entriesPage <= 1 || loading}
                  className="p-1 rounded hover:bg-neutral-100 transition-colors disabled:opacity-40"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs px-2" style={{ color: 'var(--color-text-secondary)' }}>
                  {entriesPage} / {entriesPagination.total_pages}
                </span>
                <button
                  onClick={() => handleEntriesPageChange(entriesPage + 1)}
                  disabled={entriesPage >= entriesPagination.total_pages || loading}
                  className="p-1 rounded hover:bg-neutral-100 transition-colors disabled:opacity-40"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm py-2" style={{ color: 'var(--color-text-muted)' }}>
          No entries in this batch
        </p>
      )}

      {/* Export / Status errors */}
      {(exportError || statusError) && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md" style={{ backgroundColor: 'var(--color-error-50)' }}>
          <AlertCircle size={14} style={{ color: 'var(--color-error-500)' }} />
          <span className="text-xs" style={{ color: 'var(--color-error-700)' }}>{exportError || statusError}</span>
        </div>
      )}

      {/* Export bar + Status dropdown */}
      <div className="flex items-center gap-3 pt-2 flex-wrap" style={{ borderTop: '1px solid var(--color-border)' }}>
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Export Journal:
        </span>
        <select
          value={selectedFormat}
          onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
          className="input py-1 px-2 text-sm"
          style={{ minWidth: '100px' }}
        >
          {EXPORT_FORMATS.map((fmt) => (
            <option key={fmt} value={fmt}>
              {EXPORT_FORMAT_NAMES[fmt]}
            </option>
          ))}
        </select>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
          style={{
            backgroundColor: 'var(--color-primary-600)',
            color: 'white',
          }}
        >
          <Download size={14} />
          {exporting ? 'Exporting...' : 'Download'}
        </button>

        <div className="flex-1" />

        {/* Status dropdown */}
        <StatusActionDropdown
          status={exportStatus}
          onAction={handleStatusAction}
          onStatusChanged={onStatusChanged}
        />
      </div>

      {/* Re-export confirmation */}
      {showReexportConfirm && (
        <ConfirmDialog
          isOpen
          onClose={() => setShowReexportConfirm(false)}
          onConfirm={handleConfirmExport}
          title="Re-export Journal"
          message={`This batch was already exported${run.exported_at ? ` on ${formatDateTime(run.exported_at)}` : ''}. Downloading again will not change the export timestamp.\n\nContinue with download?`}
          confirmLabel="Download"
        />
      )}
    </div>
  );
}

/**
 * Batch run row component with expandable entries
 */
function BatchRunRow({ run, index, onStatusChanged }: { run: GLBatchRun; index: number; onStatusChanged?: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const exportStatus = getExportStatus(run.exported_at, run.posted_at);
  const { markAsExported, markAsPosted, resetToPending, resetToExported, getTableName } = useBatchExportStatus();

  const handleStatusAction = async (action: string): Promise<boolean> => {
    const table = getTableName('payments');
    switch (action) {
      case 'mark-exported':
        return markAsExported(run.id, table);
      case 'mark-posted':
        return markAsPosted(run.id, table);
      case 'reset-pending':
        return resetToPending(run.id, table);
      case 'reset-exported':
        return resetToExported(run.id, table);
      default:
        return false;
    }
  };

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: index * 0.02 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer hover:bg-neutral-50 transition-colors"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <td className="px-3 py-4">
          <button
            className="p-1 rounded hover:bg-neutral-100 transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </td>
        <td
          className="px-4 py-4"
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-primary-600)',
          }}
        >
          #{run.id}
        </td>
        <td
          className="px-4 py-4"
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
          className="px-4 py-4"
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {formatDateTime(run.created_at)}
        </td>
        <td
          className="px-4 py-4 text-right"
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text)',
          }}
        >
          {run.entry_count != null ? run.entry_count : '—'}
        </td>
        <td
          className="px-4 py-4 text-right font-mono"
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-weight-medium)',
            color: run.net_amount != null && run.net_amount >= 0 ? 'var(--color-success-600)' : 'var(--color-error-600)',
          }}
        >
          {run.net_amount != null ? formatCurrency(run.net_amount) : '—'}
        </td>
        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
          <StatusActionDropdown
            status={exportStatus}
            onAction={handleStatusAction}
            onStatusChanged={onStatusChanged}
          />
        </td>
      </motion.tr>

      {/* Expanded entries panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <td
              colSpan={7}
              style={{
                backgroundColor: 'var(--color-neutral-50)',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <BatchEntriesPanel run={run} onStatusChanged={onStatusChanged} />
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PaymentBatchList({ onRunCatchup }: PaymentBatchListProps) {
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
  } = useGLBatchRuns('payments');

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
                <th className="w-10 px-3 py-4" />
                <th
                  className="text-left px-4 py-4"
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-secondary)',
                    width: '90px',
                  }}
                >
                  Batch #
                </th>
                <th
                  className="text-left px-4 py-4"
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Date Range
                </th>
                <th
                  className="text-left px-4 py-4"
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Run At
                </th>
                <th
                  className="text-right px-4 py-4"
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-secondary)',
                    width: '80px',
                  }}
                >
                  Entries
                </th>
                <th
                  className="text-right px-4 py-4"
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-secondary)',
                    width: '120px',
                  }}
                >
                  Net Amount
                </th>
                <th
                  className="text-left px-4 py-4"
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-secondary)',
                    width: '110px',
                  }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {batchRuns.map((run, index) => (
                <BatchRunRow key={run.id} run={run} index={index} onStatusChanged={handleRefresh} />
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
