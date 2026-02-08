/**
 * InvoiceBatchesTab Component
 *
 * Displays invoice batches for on-account clients.
 * Supports filtering by status, date range, and client.
 * Provides navigation to batch detail view.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt,
  FileCheck,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertCircle,
  X,
  Calendar,
  Filter,
  CheckCircle,
} from 'lucide-react';
import { DatePicker } from '@jetsetgo/shared-components';
import { useInvoiceBatches } from '../../hooks/useInvoiceBatches';
import { useBatchExportStatus } from '../../hooks/useBatchExportStatus';
import { InvoiceBatch, getExportStatus } from '../../types/gl-rules';
import { CreateInvoiceBatchModal } from './CreateInvoiceBatchModal';
import { StatusActionDropdown } from './StatusActionDropdown';
import { Toast } from '../common/Toast';

interface InvoiceBatchesTabProps {
  /** Client ID filter (from URL deep-link) */
  clientFilter?: number | null;
}

/**
 * Format a date string for display
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}


export function InvoiceBatchesTab({ clientFilter }: InvoiceBatchesTabProps) {
  const navigate = useNavigate();
  const {
    batches,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    page,
    setPage,
    fetchBatches,
    refetch,
  } = useInvoiceBatches(clientFilter);

  // Local date filter state (using Date objects for DatePicker)
  const [localStartDate, setLocalStartDate] = useState<Date | null>(null);
  const [localEndDate, setLocalEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const startDateButtonRef = useRef<HTMLButtonElement>(null);
  const endDateButtonRef = useRef<HTMLButtonElement>(null);

  // Create batch modal state
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    visible: boolean;
  }>({ message: '', type: 'info', visible: false });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, visible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  // Track if initial fetch has been done
  const [isInitialized, setIsInitialized] = useState(false);

  // Initial fetch on mount
  useEffect(() => {
    if (!isInitialized) {
      fetchBatches().then(() => setIsInitialized(true));
    }
  }, [isInitialized]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch when page changes (after initialization)
  useEffect(() => {
    if (isInitialized) {
      fetchBatches();
    }
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update filters when clientFilter prop changes
  useEffect(() => {
    if (clientFilter !== filters.clientId) {
      setFilters({ clientId: clientFilter ?? null });
      if (isInitialized) {
        fetchBatches();
      }
    }
  }, [clientFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate summary stats
  const totalBatches = pagination?.total_items ?? 0;
  const postedCount = batches.filter((b) => b.posted_at).length;
  const exportedCount = batches.filter((b) => b.exported_at !== null && !b.posted_at).length;
  const pendingCount = batches.filter((b) => b.exported_at === null).length;

  // Batch export status management
  const { markAsExported, markAsPosted, resetToPending, resetToExported, error: statusError } = useBatchExportStatus();

  const handleStatusAction = async (batchId: number, action: string): Promise<boolean> => {
    let ok = false;
    switch (action) {
      case 'mark-exported':
        ok = await markAsExported(batchId, 'invoice_batches');
        break;
      case 'mark-posted':
        ok = await markAsPosted(batchId, 'invoice_batches');
        break;
      case 'reset-pending':
        ok = await resetToPending(batchId, 'invoice_batches');
        break;
      case 'reset-exported':
        ok = await resetToExported(batchId, 'invoice_batches');
        break;
    }
    if (ok) {
      const messages: Record<string, string> = {
        'mark-exported': 'Batch marked as exported',
        'mark-posted': 'Batch marked as posted',
        'reset-pending': 'Batch status reset to pending',
        'reset-exported': 'Batch status reset to exported',
      };
      showToast(messages[action] || 'Status updated', action.startsWith('reset') ? 'info' : 'success');
    }
    return ok;
  };

  // Handle status filter change
  const handleStatusChange = (status: 'exported' | 'pending' | null) => {
    setFilters({ status });
  };

  // Convert Date to YYYY-MM-DD string for API
  const dateToString = (date: Date | null): string | null => {
    if (!date) return null;
    return date.toISOString().split('T')[0];
  };

  // Handle date filter apply
  const handleApplyDateFilter = () => {
    setFilters({
      startDate: dateToString(localStartDate),
      endDate: dateToString(localEndDate),
    });
    if (isInitialized) {
      fetchBatches();
    }
  };

  // Handle clear date filter
  const handleClearDateFilter = () => {
    setLocalStartDate(null);
    setLocalEndDate(null);
    setFilters({
      startDate: null,
      endDate: null,
    });
    if (isInitialized) {
      fetchBatches();
    }
  };

  // Handle clear client filter
  const handleClearClientFilter = () => {
    setFilters({ clientId: null });
    // Update URL to remove client param
    window.history.replaceState(null, '', '?tab=invoices');
  };

  // Handle create batch click
  const handleCreateBatch = () => {
    setShowCreateModal(true);
  };

  // Handle batch creation success
  const handleBatchCreated = useCallback((batchId: number) => {
    showToast(`Invoice batch #${batchId} created successfully`, 'success');
    refetch(); // Refresh the list
    // Navigate to the new batch detail
    navigate(`/batch/${batchId}`);
  }, [showToast, refetch, navigate]);

  // Handle view batch
  const handleViewBatch = (batch: InvoiceBatch) => {
    navigate(`/batch/${batch.id}`);
  };

  // Pagination handlers
  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination && page < pagination.total_pages) {
      setPage(page + 1);
    }
  };

  // Render loading skeleton
  if (loading && batches.length === 0) {
    return (
      <div className="space-y-6">
        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="card"
              style={{ padding: 'var(--spacing-4)' }}
            >
              <div className="animate-pulse">
                <div
                  className="h-4 rounded"
                  style={{
                    backgroundColor: 'var(--color-neutral-200)',
                    width: '60%',
                  }}
                />
                <div
                  className="h-8 rounded mt-2"
                  style={{
                    backgroundColor: 'var(--color-neutral-200)',
                    width: '40%',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="card overflow-hidden">
          <div className="animate-pulse">
            <div
              className="h-12"
              style={{ backgroundColor: 'var(--color-neutral-100)' }}
            />
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 border-b border-gray-200"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Client Filter Banner */}
      {clientFilter && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex items-center justify-between"
          style={{
            padding: 'var(--spacing-4)',
            backgroundColor: 'var(--color-primary-50)',
            borderColor: 'var(--color-primary-200)',
          }}
        >
          <div className="flex items-center gap-3">
            <Filter
              size={20}
              style={{ color: 'var(--color-primary-600)' }}
            />
            <span style={{ color: 'var(--color-primary-800)' }}>
              Showing invoices for client ID: <strong>{clientFilter}</strong>
            </span>
          </div>
          <button
            onClick={handleClearClientFilter}
            className="p-1 rounded-md hover:bg-primary-100 transition-colors"
            style={{ color: 'var(--color-primary-600)' }}
            title="Clear client filter"
          >
            <X size={18} />
          </button>
        </motion.div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Batches */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
          style={{ padding: 'var(--spacing-4)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: 'var(--color-neutral-100)' }}
            >
              <Receipt
                size={24}
                style={{ color: 'var(--color-neutral-600)' }}
              />
            </div>
            <div>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Total Batches
              </p>
              <p
                style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text)',
                }}
              >
                {totalBatches}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Pending */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
          style={{ padding: 'var(--spacing-4)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: 'var(--color-neutral-100)' }}
            >
              <Clock
                size={24}
                style={{ color: 'var(--color-neutral-500)' }}
              />
            </div>
            <div>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Pending
              </p>
              <p
                style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-neutral-600)',
                }}
              >
                {pendingCount}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Exported */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
          style={{ padding: 'var(--spacing-4)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: 'var(--color-primary-50)' }}
            >
              <FileCheck
                size={24}
                style={{ color: 'var(--color-primary-600)' }}
              />
            </div>
            <div>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Exported
              </p>
              <p
                style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-primary-600)',
                }}
              >
                {exportedCount}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Posted */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
          style={{ padding: 'var(--spacing-4)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: 'var(--color-success-50)' }}
            >
              <CheckCircle
                size={24}
                style={{ color: 'var(--color-success-600)' }}
              />
            </div>
            <div>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Posted
              </p>
              <p
                style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-success-600)',
                }}
              >
                {postedCount}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filter Row */}
      <div className="card" style={{ padding: 'var(--spacing-4)' }}>
        <div className="flex flex-wrap items-end gap-4">
          {/* Date Range Filter */}
          <div className="flex items-end gap-2">
            <div>
              <label
                className="block mb-1"
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Start Date
              </label>
              <button
                ref={startDateButtonRef}
                onClick={() => setShowStartPicker(true)}
                className="input flex items-center gap-2 text-left"
                style={{
                  height: 'var(--height-button)',
                  minWidth: '160px',
                }}
              >
                <Calendar size={16} style={{ color: 'var(--color-text-muted)' }} />
                <span style={{ color: localStartDate ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                  {localStartDate ? localStartDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select date'}
                </span>
              </button>
              <AnimatePresence>
                {showStartPicker && (
                  <DatePicker
                    selectedDate={localStartDate || new Date()}
                    maxDate={localEndDate || undefined}
                    onSelect={(date) => {
                      setLocalStartDate(date);
                      setShowStartPicker(false);
                    }}
                    onClose={() => setShowStartPicker(false)}
                    anchorEl={startDateButtonRef.current}
                  />
                )}
              </AnimatePresence>
            </div>
            <div>
              <label
                className="block mb-1"
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                End Date
              </label>
              <button
                ref={endDateButtonRef}
                onClick={() => setShowEndPicker(true)}
                className="input flex items-center gap-2 text-left"
                style={{
                  height: 'var(--height-button)',
                  minWidth: '160px',
                }}
              >
                <Calendar size={16} style={{ color: 'var(--color-text-muted)' }} />
                <span style={{ color: localEndDate ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                  {localEndDate ? localEndDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select date'}
                </span>
              </button>
              <AnimatePresence>
                {showEndPicker && (
                  <DatePicker
                    selectedDate={localEndDate || new Date()}
                    minDate={localStartDate || undefined}
                    onSelect={(date) => {
                      setLocalEndDate(date);
                      setShowEndPicker(false);
                    }}
                    onClose={() => setShowEndPicker(false)}
                    anchorEl={endDateButtonRef.current}
                  />
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={handleApplyDateFilter}
              className="btn-secondary"
              style={{ height: 'var(--height-button)' }}
            >
              Apply
            </button>
            {(filters.startDate || filters.endDate) && (
              <button
                onClick={handleClearDateFilter}
                className="btn-ghost"
                style={{ height: 'var(--height-button)' }}
                title="Clear date filter"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div>
            <label
              className="block mb-1"
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Export Status
            </label>
            <select
              value={filters.status ?? ''}
              onChange={(e) =>
                handleStatusChange(
                  e.target.value === ''
                    ? null
                    : (e.target.value as 'exported' | 'pending')
                )
              }
              className="input"
              style={{
                height: 'var(--height-button)',
                minWidth: '160px',
              }}
            >
              <option value="">All</option>
              <option value="exported">Exported</option>
              <option value="pending">Not Exported</option>
            </select>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Create Batch Button */}
          <button
            onClick={handleCreateBatch}
            className="btn-primary flex items-center gap-2"
            style={{ height: 'var(--height-button)' }}
          >
            <Plus size={16} />
            Create Batch
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div
          className="card"
          style={{
            padding: 'var(--spacing-4)',
            backgroundColor: 'var(--color-error-50)',
            borderColor: 'var(--color-error-200)',
          }}
        >
          <div className="flex items-center gap-3">
            <AlertCircle
              size={20}
              style={{ color: 'var(--color-error-500)' }}
            />
            <p style={{ color: 'var(--color-error-700)' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Data Table */}
      {!error && batches.length === 0 ? (
        /* Empty State */
        <div className="card">
          <div
            className="py-12 text-center"
            style={{ padding: 'var(--spacing-8)' }}
          >
            <Receipt
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
              No invoice batches found
            </h3>
            <p
              className="mt-2"
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {filters.status || filters.startDate || filters.endDate || filters.clientId
                ? 'Try adjusting your filters'
                : 'Create your first invoice batch to get started'}
            </p>
          </div>
        </div>
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
                  Issue Date
                </th>
                <th
                  className="text-left px-6 py-4"
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Run By
                </th>
                <th
                  className="text-left px-6 py-4"
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Export Status
                </th>
                <th
                  className="text-right px-6 py-4"
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-secondary)',
                    width: '100px',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch, index) => (
                <motion.tr
                  key={batch.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                  }}
                  className="hover:bg-neutral-50 transition-colors"
                >
                  <td
                    className="px-6 py-4"
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-text)',
                    }}
                  >
                    #{batch.id}
                  </td>
                  <td
                    className="px-6 py-4"
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {formatDate(batch.issue_date)}
                  </td>
                  <td
                    className="px-6 py-4"
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    <span
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor:
                          batch.run_by === 'manual'
                            ? 'var(--color-primary-50)'
                            : 'var(--color-neutral-100)',
                        color:
                          batch.run_by === 'manual'
                            ? 'var(--color-primary-700)'
                            : 'var(--color-neutral-700)',
                      }}
                    >
                      {batch.run_by ?? 'unknown'}
                    </span>
                  </td>
                  <td
                    className="px-6 py-4"
                    style={{
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    {(() => {
                      const status = getExportStatus(batch.exported_at, batch.posted_at);
                      const badgeConfig = {
                        pending: {
                          bg: 'var(--color-neutral-100)',
                          color: 'var(--color-neutral-600)',
                          icon: <Clock size={12} style={{ color: 'var(--color-neutral-500)' }} />,
                          label: 'Pending',
                        },
                        exported: {
                          bg: 'var(--color-primary-50)',
                          color: 'var(--color-primary-700)',
                          icon: <FileCheck size={12} style={{ color: 'var(--color-primary-500)' }} />,
                          label: 'Exported',
                        },
                        posted: {
                          bg: 'var(--color-success-50)',
                          color: 'var(--color-success-700)',
                          icon: <CheckCircle size={12} style={{ color: 'var(--color-success-500)' }} />,
                          label: 'Posted',
                        },
                      }[status];
                      return (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: badgeConfig.bg, color: badgeConfig.color }}
                        >
                          {badgeConfig.icon}
                          {badgeConfig.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => handleViewBatch(batch)}
                        className="btn-ghost flex items-center gap-1 px-3 py-1"
                        style={{
                          fontSize: 'var(--text-sm)',
                          color: 'var(--color-primary-600)',
                        }}
                      >
                        <Eye size={16} />
                        View
                      </button>
                      <StatusActionDropdown
                        status={getExportStatus(batch.exported_at, batch.posted_at)}
                        onAction={(action) => handleStatusAction(batch.id, action)}
                        onStatusChanged={refetch}
                      />
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{
                borderTop: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-neutral-50)',
              }}
            >
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Showing {(page - 1) * pagination.page_size + 1} -{' '}
                {Math.min(page * pagination.page_size, pagination.total_items)} of{' '}
                {pagination.total_items} batches
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={page <= 1}
                  className="btn-ghost p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous page"
                >
                  <ChevronLeft size={20} />
                </button>
                <span
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-secondary)',
                    minWidth: '80px',
                    textAlign: 'center',
                  }}
                >
                  Page {page} of {pagination.total_pages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={page >= pagination.total_pages}
                  className="btn-ghost p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next page"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status error */}
      {statusError && (
        <div
          className="card"
          style={{
            padding: 'var(--spacing-4)',
            backgroundColor: 'var(--color-error-50)',
            borderColor: 'var(--color-error-200)',
          }}
        >
          <div className="flex items-center gap-3">
            <AlertCircle size={20} style={{ color: 'var(--color-error-500)' }} />
            <p style={{ color: 'var(--color-error-700)' }}>{statusError}</p>
          </div>
        </div>
      )}

      {/* Create Batch Modal */}
      <CreateInvoiceBatchModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleBatchCreated}
      />

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={hideToast}
      />
    </div>
  );
}
