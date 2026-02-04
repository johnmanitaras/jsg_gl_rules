/**
 * InvoiceBatchDetail Page
 *
 * Displays details for a specific invoice batch including:
 * - Batch header info (ID, issue date, run by, export status)
 * - Summary cards (invoice count, line items, total)
 * - Export panel with format selector and download buttons
 * - Invoice list table with expandable rows showing line items
 * - Pagination for large batches
 *
 * See docs/accounting-entries-ui-specification.md Section 5.5
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Receipt,
  FileText,
  DollarSign,
  Download,
  RefreshCw,
  Calendar,
  User,
  FileCheck,
  Clock,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Loader2,
  Building2,
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useExport } from '../hooks/useExport';
import { Toast } from '../components/common/Toast';
import {
  InvoiceBatchDetail as InvoiceBatchDetailType,
  Invoice,
  InvoiceLineItem,
  ExportFormat,
  EXPORT_FORMATS,
  EXPORT_FORMAT_NAMES,
} from '../types/gl-rules';

// Pagination constants
const INVOICES_PER_PAGE = 10;

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
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

/**
 * Format a datetime string for display
 */
function formatDateTime(dateString: string | null): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateString;
  }
}

/**
 * Invoice Row Component - Expandable row showing invoice with line items
 */
interface InvoiceRowProps {
  invoice: Invoice;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function InvoiceRow({ invoice, index, isExpanded, onToggle }: InvoiceRowProps) {
  return (
    <>
      {/* Main invoice row */}
      <motion.tr
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: index * 0.03 }}
        style={{
          borderBottom: isExpanded
            ? 'none'
            : '1px solid var(--color-border)',
          cursor: 'pointer',
        }}
        className="hover:bg-neutral-50 transition-colors"
        onClick={onToggle}
      >
        {/* Expand/Collapse Toggle */}
        <td className="px-4 py-4" style={{ width: '40px' }}>
          <button
            className="p-1 rounded hover:bg-neutral-100 transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            {isExpanded ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>
        </td>

        {/* Client Name */}
        <td
          className="px-4 py-4"
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-text)',
          }}
        >
          <div className="flex items-center gap-2">
            <Building2
              size={16}
              style={{ color: 'var(--color-text-muted)' }}
            />
            {invoice.client_name}
          </div>
        </td>

        {/* External ID */}
        <td
          className="px-4 py-4"
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {invoice.client_external_id || '-'}
        </td>

        {/* Booking Refs */}
        <td
          className="px-4 py-4"
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <span
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: 'var(--color-neutral-100)',
              color: 'var(--color-neutral-700)',
            }}
          >
            {invoice.line_items.length} item
            {invoice.line_items.length !== 1 ? 's' : ''}
          </span>
        </td>

        {/* Sale Date */}
        <td
          className="px-4 py-4"
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {formatDate(invoice.sale_date)}
        </td>

        {/* Total */}
        <td
          className="px-4 py-4 text-right"
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text)',
          }}
        >
          {formatCurrency(invoice.total_gross)}
        </td>
      </motion.tr>

      {/* Expanded Line Items */}
      <AnimatePresence>
        {isExpanded && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <td
              colSpan={6}
              style={{
                padding: 0,
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <div
                style={{
                  backgroundColor: 'var(--color-neutral-50)',
                  padding: 'var(--spacing-4)',
                  paddingLeft: 'var(--spacing-12)',
                }}
              >
                <table className="w-full">
                  <thead>
                    <tr>
                      <th
                        className="text-left px-3 py-2"
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--color-text-muted)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Type
                      </th>
                      <th
                        className="text-left px-3 py-2"
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--color-text-muted)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Description
                      </th>
                      <th
                        className="text-right px-3 py-2"
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--color-text-muted)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Qty
                      </th>
                      <th
                        className="text-right px-3 py-2"
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--color-text-muted)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Net
                      </th>
                      <th
                        className="text-right px-3 py-2"
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--color-text-muted)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Tax
                      </th>
                      <th
                        className="text-right px-3 py-2"
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--color-text-muted)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.line_items.map((item, idx) => (
                      <LineItemRow key={idx} item={item} index={idx} />
                    ))}
                  </tbody>
                </table>
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Line Item Row Component
 */
interface LineItemRowProps {
  item: InvoiceLineItem;
  index: number;
}

function LineItemRow({ item, index }: LineItemRowProps) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15, delay: index * 0.02 }}
      style={{
        borderTop:
          index > 0 ? '1px solid var(--color-border-light)' : 'none',
      }}
    >
      <td
        className="px-3 py-2"
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-xs"
          style={{
            backgroundColor: 'var(--color-primary-50)',
            color: 'var(--color-primary-700)',
          }}
        >
          {item.type || 'payment'}
        </span>
      </td>
      <td
        className="px-3 py-2"
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text)',
          maxWidth: '300px',
        }}
      >
        <div className="truncate" title={item.description}>
          {item.description}
        </div>
        {item.booking_reference && (
          <div
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
            }}
          >
            Ref: {item.booking_reference}
          </div>
        )}
      </td>
      <td
        className="px-3 py-2 text-right"
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-secondary)',
        }}
      >
        {item.quantity}
      </td>
      <td
        className="px-3 py-2 text-right"
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-secondary)',
        }}
      >
        {formatCurrency(item.net)}
      </td>
      <td
        className="px-3 py-2 text-right"
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-secondary)',
        }}
      >
        {formatCurrency(item.tax)}
      </td>
      <td
        className="px-3 py-2 text-right"
        style={{
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-weight-medium)',
          color: 'var(--color-text)',
        }}
      >
        {formatCurrency(item.total)}
      </td>
    </motion.tr>
  );
}

/**
 * Export Panel Component
 */
interface ExportPanelProps {
  isExported: boolean;
  onExport: (format: ExportFormat) => Promise<void>;
  onRedownload: (format: ExportFormat) => Promise<void>;
  exporting: boolean;
  exportingFormat: ExportFormat | null;
}

function ExportPanel({
  isExported,
  onExport,
  onRedownload,
  exporting,
  exportingFormat,
}: ExportPanelProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');

  const handleExport = async () => {
    await onExport(selectedFormat);
  };

  return (
    <div className="card" style={{ padding: 'var(--spacing-4)' }}>
      <h3
        style={{
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-text)',
          marginBottom: 'var(--spacing-4)',
        }}
      >
        Export Options
      </h3>

      {!isExported ? (
        /* First-time export */
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label
              className="block mb-2"
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Export Format
            </label>
            <div className="flex gap-2">
              {EXPORT_FORMATS.map((format) => (
                <button
                  key={format}
                  onClick={() => setSelectedFormat(format)}
                  className="px-4 py-2 rounded-lg transition-colors"
                  style={{
                    backgroundColor:
                      selectedFormat === format
                        ? 'var(--color-primary-600)'
                        : 'var(--color-surface-secondary)',
                    color:
                      selectedFormat === format
                        ? 'white'
                        : 'var(--color-text)',
                    border: `1px solid ${
                      selectedFormat === format
                        ? 'var(--color-primary-600)'
                        : 'var(--color-border)'
                    }`,
                    fontWeight: 'var(--font-weight-medium)',
                    fontSize: 'var(--text-sm)',
                  }}
                >
                  {EXPORT_FORMAT_NAMES[format]}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn-primary flex items-center gap-2"
            style={{ height: 'var(--height-button)' }}
          >
            {exporting && exportingFormat === selectedFormat ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} />
                Export {EXPORT_FORMAT_NAMES[selectedFormat]}
              </>
            )}
          </button>
        </div>
      ) : (
        /* Already exported - show re-download options */
        <div>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--spacing-4)',
            }}
          >
            This batch has been exported. You can re-download in any format:
          </p>
          <div className="flex flex-wrap gap-2">
            {EXPORT_FORMATS.map((format) => (
              <button
                key={format}
                onClick={() => onRedownload(format)}
                disabled={exporting}
                className="btn-secondary flex items-center gap-2"
                style={{
                  height: 'var(--height-button)',
                  minWidth: '120px',
                }}
              >
                {exporting && exportingFormat === format ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    {EXPORT_FORMAT_NAMES[format]}
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Note about export marking */}
      {!isExported && (
        <p
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            marginTop: 'var(--spacing-3)',
          }}
        >
          Note: First export will mark this batch as exported.
        </p>
      )}
    </div>
  );
}

/**
 * Loading Skeleton Component
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div
        className="card"
        style={{ padding: 'var(--spacing-6)' }}
      >
        <div className="animate-pulse">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="h-6 w-32 rounded"
              style={{ backgroundColor: 'var(--color-neutral-200)' }}
            />
            <div
              className="h-4 w-24 rounded"
              style={{ backgroundColor: 'var(--color-neutral-200)' }}
            />
          </div>
          <div className="flex gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-2">
                <div
                  className="h-4 w-16 rounded"
                  style={{ backgroundColor: 'var(--color-neutral-200)' }}
                />
                <div
                  className="h-4 w-24 rounded"
                  style={{ backgroundColor: 'var(--color-neutral-200)' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

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
                className="h-4 w-1/2 rounded mb-2"
                style={{ backgroundColor: 'var(--color-neutral-200)' }}
              />
              <div
                className="h-8 w-1/3 rounded"
                style={{ backgroundColor: 'var(--color-neutral-200)' }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Export Panel Skeleton */}
      <div
        className="card"
        style={{ padding: 'var(--spacing-4)' }}
      >
        <div className="animate-pulse">
          <div
            className="h-5 w-32 rounded mb-4"
            style={{ backgroundColor: 'var(--color-neutral-200)' }}
          />
          <div className="flex gap-4">
            <div
              className="h-10 w-20 rounded"
              style={{ backgroundColor: 'var(--color-neutral-200)' }}
            />
            <div
              className="h-10 w-20 rounded"
              style={{ backgroundColor: 'var(--color-neutral-200)' }}
            />
            <div
              className="h-10 w-20 rounded"
              style={{ backgroundColor: 'var(--color-neutral-200)' }}
            />
          </div>
        </div>
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

/**
 * Main InvoiceBatchDetail Component
 */
export function InvoiceBatchDetail() {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { fetchWithAuth } = useApi();
  const {
    exporting,
    error: exportError,
    exportingFormat,
    exportBatch,
    redownload,
  } = useExport();

  // State
  const [batch, setBatch] = useState<InvoiceBatchDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedInvoices, setExpandedInvoices] = useState<Set<number>>(
    new Set()
  );
  const [page, setPage] = useState(1);

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    visible: boolean;
  }>({ message: '', type: 'info', visible: false });

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      setToast({ message, type, visible: true });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  /**
   * Navigate back to invoice batches tab
   */
  const handleBack = () => {
    navigate('/?tab=invoices');
  };

  /**
   * Fetch batch details
   */
  const fetchBatchDetails = useCallback(async () => {
    if (!batchId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth(`/invoice-batch/${batchId}`);
      const data = response.data as InvoiceBatchDetailType;
      setBatch(data);
    } catch (err) {
      console.error('Error fetching batch details:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch batch details';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [batchId, fetchWithAuth]);

  // Fetch on mount
  useEffect(() => {
    fetchBatchDetails();
  }, [fetchBatchDetails]);

  /**
   * Handle export
   */
  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (!batchId) return;

      const success = await exportBatch(parseInt(batchId), format);
      if (success) {
        showToast(
          `Batch exported as ${EXPORT_FORMAT_NAMES[format]}`,
          'success'
        );
        // Refresh batch to update export status
        fetchBatchDetails();
      } else if (exportError) {
        showToast(exportError, 'error');
      }
    },
    [batchId, exportBatch, exportError, showToast, fetchBatchDetails]
  );

  /**
   * Handle re-download
   */
  const handleRedownload = useCallback(
    async (format: ExportFormat) => {
      if (!batchId) return;

      const success = await redownload(parseInt(batchId), format);
      if (success) {
        showToast(
          `Downloaded ${EXPORT_FORMAT_NAMES[format]} file`,
          'success'
        );
      } else if (exportError) {
        showToast(exportError, 'error');
      }
    },
    [batchId, redownload, exportError, showToast]
  );

  /**
   * Toggle invoice expansion
   */
  const toggleInvoice = (invoiceIndex: number) => {
    setExpandedInvoices((prev) => {
      const next = new Set(prev);
      if (next.has(invoiceIndex)) {
        next.delete(invoiceIndex);
      } else {
        next.add(invoiceIndex);
      }
      return next;
    });
  };

  // Calculate pagination
  const invoices = batch?.invoices || [];
  const totalPages = Math.ceil(invoices.length / INVOICES_PER_PAGE);
  const paginatedInvoices = invoices.slice(
    (page - 1) * INVOICES_PER_PAGE,
    page * INVOICES_PER_PAGE
  );

  // Calculate summary stats
  const invoiceCount = invoices.length;
  const lineItemCount = invoices.reduce(
    (sum, inv) => sum + inv.line_items.length,
    0
  );
  const totalAmount = invoices.reduce(
    (sum, inv) => sum + inv.total_gross,
    0
  );

  // Render loading state
  if (loading) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        {/* Page Header */}
        <div
          style={{
            backgroundColor: 'var(--color-surface-primary)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div className="container py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 rounded-md hover:bg-[var(--color-gray-100)] transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1
                  style={{
                    fontSize: 'var(--text-2xl)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--color-text)',
                  }}
                >
                  Invoice Batch #{batchId}
                </h1>
                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-secondary)',
                    marginTop: 'var(--spacing-2)',
                  }}
                >
                  Loading batch details...
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container py-6">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  // Render error state
  if (error || !batch) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        {/* Page Header */}
        <div
          style={{
            backgroundColor: 'var(--color-surface-primary)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div className="container py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 rounded-md hover:bg-[var(--color-gray-100)] transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1
                  style={{
                    fontSize: 'var(--text-2xl)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--color-text)',
                  }}
                >
                  Invoice Batch #{batchId}
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Error Content */}
        <div className="container py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="card"
              style={{
                padding: 'var(--spacing-8)',
                textAlign: 'center',
              }}
            >
              <AlertCircle
                size={48}
                style={{
                  color: 'var(--color-error-500)',
                  margin: '0 auto',
                }}
              />
              <h3
                className="mt-4"
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text)',
                }}
              >
                {error || 'Batch not found'}
              </h3>
              <p
                className="mt-2"
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Unable to load invoice batch #{batchId}
              </p>
              <button
                onClick={handleBack}
                className="btn-primary mt-6"
                style={{ display: 'inline-flex' }}
              >
                Return to Invoice Batches
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const isExported = batch.exported_at !== null;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {/* Page Header */}
      <div
        style={{
          backgroundColor: 'var(--color-surface-primary)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="container py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={handleBack}
                className="p-2 rounded-md hover:bg-[var(--color-gray-100)] transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-4">
                <h1
                  style={{
                    fontSize: 'var(--text-2xl)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--color-text)',
                  }}
                >
                  Invoice Batch #{batch.id}
                </h1>
                {isExported ? (
                  <span
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: 'var(--color-success-50)',
                      color: 'var(--color-success-700)',
                    }}
                  >
                    <FileCheck size={14} />
                    Exported
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: 'var(--color-warning-50)',
                      color: 'var(--color-warning-700)',
                    }}
                  >
                    <Clock size={14} />
                    Pending Export
                  </span>
                )}
              </div>
            </div>

            {/* Batch Metadata */}
            <div className="flex flex-wrap gap-6 ml-12">
              <div className="flex items-center gap-2">
                <Calendar
                  size={16}
                  style={{ color: 'var(--color-text-muted)' }}
                />
                <span
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Issue Date:
                </span>
                <span
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-text)',
                  }}
                >
                  {formatDate(batch.issue_date)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <User
                  size={16}
                  style={{ color: 'var(--color-text-muted)' }}
                />
                <span
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Run By:
                </span>
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
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
              </div>

              {isExported && (
                <div className="flex items-center gap-2">
                  <FileCheck
                    size={16}
                    style={{ color: 'var(--color-success-600)' }}
                  />
                  <span
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    Exported:
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-success-600)',
                    }}
                  >
                    {formatDateTime(batch.exported_at)}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Invoice Count */}
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
                style={{ backgroundColor: 'var(--color-primary-50)' }}
              >
                <Receipt
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
                  Invoices
                </p>
                <p
                  style={{
                    fontSize: 'var(--text-2xl)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--color-text)',
                  }}
                >
                  {invoiceCount}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Line Items Count */}
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
                <FileText
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
                  Line Items
                </p>
                <p
                  style={{
                    fontSize: 'var(--text-2xl)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--color-text)',
                  }}
                >
                  {lineItemCount}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Total Amount */}
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
                style={{ backgroundColor: 'var(--color-success-50)' }}
              >
                <DollarSign
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
                  Total Amount
                </p>
                <p
                  style={{
                    fontSize: 'var(--text-2xl)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--color-success-600)',
                  }}
                >
                  {formatCurrency(totalAmount)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Export Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ExportPanel
            isExported={isExported}
            onExport={handleExport}
            onRedownload={handleRedownload}
            exporting={exporting}
            exportingFormat={exportingFormat}
          />
        </motion.div>

        {/* Invoice List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="card overflow-hidden">
            <div
              className="px-6 py-4"
              style={{
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface-primary)',
              }}
            >
              <h3
                style={{
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text)',
                }}
              >
                Invoices in Batch
              </h3>
            </div>

            {invoices.length === 0 ? (
              /* Empty State */
              <div
                className="py-12 text-center"
                style={{ padding: 'var(--spacing-8)' }}
              >
                <Receipt
                  size={48}
                  style={{
                    color: 'var(--color-neutral-400)',
                    margin: '0 auto',
                  }}
                />
                <h3
                  className="mt-4"
                  style={{
                    fontSize: 'var(--text-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text)',
                  }}
                >
                  No invoices in this batch
                </h3>
                <p
                  className="mt-2"
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  This batch appears to be empty
                </p>
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead>
                    <tr
                      style={{
                        backgroundColor: 'var(--color-neutral-50)',
                        borderBottom: '1px solid var(--color-border)',
                      }}
                    >
                      <th
                        className="text-left px-4 py-4"
                        style={{ width: '40px' }}
                      />
                      <th
                        className="text-left px-4 py-4"
                        style={{
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        Client
                      </th>
                      <th
                        className="text-left px-4 py-4"
                        style={{
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        External ID
                      </th>
                      <th
                        className="text-left px-4 py-4"
                        style={{
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        Items
                      </th>
                      <th
                        className="text-left px-4 py-4"
                        style={{
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        Sale Date
                      </th>
                      <th
                        className="text-right px-4 py-4"
                        style={{
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedInvoices.map((invoice, index) => {
                      const globalIndex =
                        (page - 1) * INVOICES_PER_PAGE + index;
                      return (
                        <InvoiceRow
                          key={invoice.id ?? globalIndex}
                          invoice={invoice}
                          index={index}
                          isExpanded={expandedInvoices.has(globalIndex)}
                          onToggle={() => toggleInvoice(globalIndex)}
                        />
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
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
                      Showing {(page - 1) * INVOICES_PER_PAGE + 1} -{' '}
                      {Math.min(page * INVOICES_PER_PAGE, invoices.length)} of{' '}
                      {invoices.length} invoices
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                        Page {page} of {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={page >= totalPages}
                        className="btn-ghost p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Next page"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>

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
