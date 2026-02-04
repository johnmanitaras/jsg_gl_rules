/**
 * CreateInvoiceBatchModal Component
 *
 * Modal for previewing and creating invoice batches.
 * Includes date cutoff picker, preview functionality, and batch creation.
 *
 * Flow:
 * 1. User selects cutoff date (defaults to yesterday)
 * 2. User clicks "Preview" to fetch preview data
 * 3. Preview shows: payment count, client count, total amount, invoice list
 * 4. User clicks "Create Batch" to execute
 * 5. Success: onSuccess callback with new batch ID
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Calendar, AlertCircle, Eye, Receipt, Users, DollarSign, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApi } from '../../hooks/useApi';
import type {
  InvoiceBatchPreview,
  InvoiceBatchExecuteRequest,
  InvoiceBatchExecuteResponse,
  Invoice,
} from '../../types/gl-rules';

interface CreateInvoiceBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (batchId: number) => void;
}

/**
 * Format a number as currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
}

/**
 * Get yesterday's date in YYYY-MM-DD format
 */
function getYesterday(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Single invoice preview row with expandable line items
 */
function InvoicePreviewRow({ invoice }: { invoice: Invoice }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-2)',
          padding: 'var(--spacing-3) var(--spacing-4)',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
        className="hover:bg-neutral-50 transition-colors"
      >
        {expanded ? (
          <ChevronDown size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
        ) : (
          <ChevronRight size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
        )}
        <span
          style={{
            flex: 1,
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-text)',
          }}
        >
          {invoice.client_name}
        </span>
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            marginRight: 'var(--spacing-4)',
          }}
        >
          {invoice.line_items.length} item{invoice.line_items.length !== 1 ? 's' : ''}
        </span>
        <span
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text)',
            minWidth: '100px',
            textAlign: 'right',
          }}
        >
          {formatCurrency(invoice.total_gross)}
        </span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                paddingLeft: 'calc(var(--spacing-4) + 24px)',
                paddingRight: 'var(--spacing-4)',
                paddingBottom: 'var(--spacing-3)',
              }}
            >
              {invoice.line_items.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    padding: 'var(--spacing-2) 0',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <span style={{ flex: 1 }}>
                    {item.booking_reference && (
                      <span style={{ fontWeight: 'var(--font-weight-medium)', marginRight: 'var(--spacing-2)' }}>
                        {item.booking_reference}
                      </span>
                    )}
                    {item.description}
                  </span>
                  <span style={{ minWidth: '80px', textAlign: 'right' }}>
                    {formatCurrency(item.total)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CreateInvoiceBatchModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateInvoiceBatchModalProps) {
  const { fetchWithAuth } = useApi();

  // Form state
  const [cutoffDate, setCutoffDate] = useState(getYesterday());
  const [includeNotDue, setIncludeNotDue] = useState(false);

  // Preview state
  const [preview, setPreview] = useState<InvoiceBatchPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Create state
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCutoffDate(getYesterday());
      setIncludeNotDue(false);
      setPreview(null);
      setPreviewLoading(false);
      setPreviewError(null);
      setCreating(false);
      setCreateError(null);
    }
  }, [isOpen]);

  // Calculate unique client count from preview
  const clientCount = useMemo(() => {
    if (!preview) return 0;
    const uniqueClients = new Set(preview.invoices.map((inv) => inv.client_id || inv.client_name));
    return uniqueClients.size;
  }, [preview]);

  /**
   * Fetch preview data from API
   */
  const handlePreview = useCallback(async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    setPreview(null);

    try {
      // Build query params
      const params = new URLSearchParams();
      params.set('issue_date', cutoffDate);
      if (includeNotDue) {
        params.set('include_not_due', 'true');
      }

      const response = await fetchWithAuth(`/invoice-batch-preview?${params.toString()}`);
      const data = response.data as InvoiceBatchPreview;

      setPreview(data);
    } catch (err) {
      console.error('Error fetching invoice batch preview:', err);
      setPreviewError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch preview. Please try again.'
      );
    } finally {
      setPreviewLoading(false);
    }
  }, [fetchWithAuth, cutoffDate, includeNotDue]);

  /**
   * Create the invoice batch
   */
  const handleCreate = useCallback(async () => {
    if (!preview || preview.invoice_count === 0) return;

    setCreating(true);
    setCreateError(null);

    try {
      const requestBody: InvoiceBatchExecuteRequest = {
        issue_date: cutoffDate,
        include_not_due: includeNotDue,
      };

      const response = await fetchWithAuth('/invoice-batch-execute', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const data = response.data as InvoiceBatchExecuteResponse;

      if (data.success && data.batch_id) {
        onSuccess(data.batch_id);
        onClose();
      } else {
        setCreateError(data.message || 'Failed to create batch');
      }
    } catch (err) {
      console.error('Error creating invoice batch:', err);
      setCreateError(
        err instanceof Error
          ? err.message
          : 'Failed to create batch. Please try again.'
      );
    } finally {
      setCreating(false);
    }
  }, [fetchWithAuth, cutoffDate, includeNotDue, preview, onSuccess, onClose]);

  // Check if we have no unbatched payments
  const hasNoPayments = preview && preview.invoice_count === 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
            }}
          />

          {/* Modal */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1001,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--spacing-4)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              style={{
                width: '100%',
                maxWidth: '600px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--color-surface-primary, #ffffff)',
                borderRadius: 'var(--radius-card, 0.75rem)',
                border: 'var(--border-width-default, 1px) solid var(--color-border, #e5e7eb)',
                boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05))',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--spacing-4) var(--spacing-6)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <h2
                  style={{
                    fontSize: 'var(--text-xl)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-primary)',
                    margin: 0,
                  }}
                >
                  Create Invoice Batch
                </h2>
                <button
                  onClick={onClose}
                  className="btn-secondary"
                  style={{
                    width: '32px',
                    height: '32px',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body - Scrollable */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: 'var(--spacing-6)',
                }}
              >
                {/* Date Input Section */}
                <div style={{ marginBottom: 'var(--spacing-6)' }}>
                  <div style={{ marginBottom: 'var(--spacing-4)' }}>
                    <label
                      htmlFor="cutoff-date"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-1-5)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-text-primary)',
                        marginBottom: 'var(--spacing-1-5)',
                      }}
                    >
                      <Calendar size={16} />
                      <span>Include payments up to</span>
                    </label>
                    <input
                      id="cutoff-date"
                      type="date"
                      value={cutoffDate}
                      onChange={(e) => setCutoffDate(e.target.value)}
                      className="input"
                      disabled={previewLoading || creating}
                    />
                    <p
                      style={{
                        marginTop: 'var(--spacing-1-5)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      Payments received on or before this date will be included
                    </p>
                  </div>

                  {/* Include not due checkbox */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-2)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={includeNotDue}
                      onChange={(e) => setIncludeNotDue(e.target.checked)}
                      disabled={previewLoading || creating}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: 'var(--color-primary-600)',
                      }}
                    />
                    <span
                      style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-text)',
                      }}
                    >
                      Include clients not due today
                    </span>
                  </label>

                  {/* Preview Button */}
                  <button
                    onClick={handlePreview}
                    disabled={previewLoading || creating || !cutoffDate}
                    className="btn-secondary"
                    style={{
                      marginTop: 'var(--spacing-4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-2)',
                    }}
                  >
                    {previewLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Loading Preview...
                      </>
                    ) : (
                      <>
                        <Eye size={16} />
                        Preview
                      </>
                    )}
                  </button>
                </div>

                {/* Error Messages */}
                {(previewError || createError) && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-2)',
                      padding: 'var(--spacing-3)',
                      backgroundColor: 'var(--color-error-50)',
                      border: '1px solid var(--color-error-200)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: 'var(--spacing-4)',
                    }}
                  >
                    <AlertCircle size={20} style={{ color: 'var(--color-error-600)', flexShrink: 0 }} />
                    <p
                      style={{
                        margin: 0,
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-error-700)',
                      }}
                    >
                      {previewError || createError}
                    </p>
                  </div>
                )}

                {/* No Payments Warning */}
                {hasNoPayments && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-2)',
                      padding: 'var(--spacing-3)',
                      backgroundColor: 'var(--color-warning-50)',
                      border: '1px solid var(--color-warning-200)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: 'var(--spacing-4)',
                    }}
                  >
                    <AlertCircle size={20} style={{ color: 'var(--color-warning-600)', flexShrink: 0 }} />
                    <p
                      style={{
                        margin: 0,
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-warning-700)',
                      }}
                    >
                      No unbatched payments found for the selected date
                    </p>
                  </div>
                )}

                {/* Preview Section */}
                {preview && !hasNoPayments && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Summary Cards */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 'var(--spacing-3)',
                        marginBottom: 'var(--spacing-4)',
                      }}
                    >
                      {/* Payment Count */}
                      <div
                        style={{
                          padding: 'var(--spacing-3)',
                          backgroundColor: 'var(--color-neutral-50)',
                          borderRadius: 'var(--radius-md)',
                          textAlign: 'center',
                        }}
                      >
                        <Receipt size={20} style={{ color: 'var(--color-neutral-500)', margin: '0 auto' }} />
                        <p
                          style={{
                            marginTop: 'var(--spacing-1)',
                            fontSize: 'var(--text-xl)',
                            fontWeight: 'var(--font-weight-bold)',
                            color: 'var(--color-text)',
                          }}
                        >
                          {preview.line_item_count}
                        </p>
                        <p
                          style={{
                            fontSize: 'var(--text-xs)',
                            color: 'var(--color-text-secondary)',
                          }}
                        >
                          Payments
                        </p>
                      </div>

                      {/* Client Count */}
                      <div
                        style={{
                          padding: 'var(--spacing-3)',
                          backgroundColor: 'var(--color-primary-50)',
                          borderRadius: 'var(--radius-md)',
                          textAlign: 'center',
                        }}
                      >
                        <Users size={20} style={{ color: 'var(--color-primary-500)', margin: '0 auto' }} />
                        <p
                          style={{
                            marginTop: 'var(--spacing-1)',
                            fontSize: 'var(--text-xl)',
                            fontWeight: 'var(--font-weight-bold)',
                            color: 'var(--color-text)',
                          }}
                        >
                          {clientCount}
                        </p>
                        <p
                          style={{
                            fontSize: 'var(--text-xs)',
                            color: 'var(--color-text-secondary)',
                          }}
                        >
                          Clients
                        </p>
                      </div>

                      {/* Total Amount */}
                      <div
                        style={{
                          padding: 'var(--spacing-3)',
                          backgroundColor: 'var(--color-success-50)',
                          borderRadius: 'var(--radius-md)',
                          textAlign: 'center',
                        }}
                      >
                        <DollarSign size={20} style={{ color: 'var(--color-success-500)', margin: '0 auto' }} />
                        <p
                          style={{
                            marginTop: 'var(--spacing-1)',
                            fontSize: 'var(--text-lg)',
                            fontWeight: 'var(--font-weight-bold)',
                            color: 'var(--color-text)',
                          }}
                        >
                          {formatCurrency(preview.total_amount)}
                        </p>
                        <p
                          style={{
                            fontSize: 'var(--text-xs)',
                            color: 'var(--color-text-secondary)',
                          }}
                        >
                          Total
                        </p>
                      </div>
                    </div>

                    {/* Invoices List */}
                    <div
                      style={{
                        marginBottom: 'var(--spacing-4)',
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--color-text)',
                          marginBottom: 'var(--spacing-2)',
                        }}
                      >
                        Invoices to Create ({preview.invoice_count})
                      </h3>
                      <div
                        style={{
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden',
                          maxHeight: '300px',
                          overflowY: 'auto',
                        }}
                      >
                        {preview.invoices.map((invoice, index) => (
                          <InvoicePreviewRow key={invoice.client_id || index} invoice={invoice} />
                        ))}
                      </div>
                    </div>

                    {/* Skipped Clients */}
                    {preview.skipped_clients && preview.skipped_clients.length > 0 && (
                      <div
                        style={{
                          padding: 'var(--spacing-3)',
                          backgroundColor: 'var(--color-neutral-50)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <p
                          style={{
                            fontSize: 'var(--text-sm)',
                            fontWeight: 'var(--font-weight-medium)',
                            color: 'var(--color-text-secondary)',
                            marginBottom: 'var(--spacing-2)',
                          }}
                        >
                          Skipped ({preview.skipped_clients.length} clients):
                        </p>
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: 'var(--spacing-4)',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--color-text-muted)',
                          }}
                        >
                          {preview.skipped_clients.slice(0, 5).map((client) => (
                            <li key={client.client_id}>
                              {client.client_name} - {client.reason}
                            </li>
                          ))}
                          {preview.skipped_clients.length > 5 && (
                            <li>...and {preview.skipped_clients.length - 5} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--spacing-3)',
                  justifyContent: 'flex-end',
                  padding: 'var(--spacing-4) var(--spacing-6)',
                  borderTop: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface-secondary)',
                }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  className="btn-primary"
                  disabled={creating || !preview || hasNoPayments}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-2)',
                  }}
                >
                  {creating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Batch'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
