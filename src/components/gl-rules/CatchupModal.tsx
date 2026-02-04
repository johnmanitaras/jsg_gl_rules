/**
 * CatchupModal Component
 *
 * Modal for manually triggering GL batch catchup processing.
 * Allows users to specify a date range for re-processing batch runs.
 *
 * Features:
 * - Date range inputs with smart defaults (7 days ago to yesterday)
 * - Validation: end_date >= start_date, max 31 days, no future dates
 * - Warning about re-processing existing dates
 * - Loading state during processing
 * - Success summary display with results
 */

import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, AlertCircle, AlertTriangle, Play, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGLBatchRuns } from '../../hooks/useGLBatchRuns';
import type { BatchCatchupResponse, BatchType } from '../../types/gl-rules';

interface CatchupModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Type of batch to process */
  batchType: BatchType;
  /** Callback when catchup completes successfully */
  onSuccess: () => void;
}

/**
 * Format a date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get the default start date (7 days ago)
 */
function getDefaultStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return formatDate(date);
}

/**
 * Get the default end date (yesterday)
 */
function getDefaultEndDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return formatDate(date);
}

/**
 * Get today's date as YYYY-MM-DD for max date validation
 */
function getTodayDate(): string {
  return formatDate(new Date());
}

/**
 * Calculate the difference in days between two dates
 */
function daysDifference(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
}

export function CatchupModal({
  isOpen,
  onClose,
  batchType,
  onSuccess,
}: CatchupModalProps) {
  const { runCatchup, catchupLoading } = useGLBatchRuns(batchType);

  // Form state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BatchCatchupResponse | null>(null);

  // Batch type display name
  const batchTypeName = batchType === 'sales' ? 'Sales' : 'Payments';

  // Calculate days in range for display
  const daysInRange = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return daysDifference(startDate, endDate);
  }, [startDate, endDate]);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStartDate(getDefaultStartDate());
      setEndDate(getDefaultEndDate());
      setError(null);
      setResult(null);
    }
  }, [isOpen]);

  /**
   * Validate the form inputs
   */
  const validateForm = (): string | null => {
    if (!startDate) {
      return 'Start date is required';
    }
    if (!endDate) {
      return 'End date is required';
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // End date must be >= start date
    if (end < start) {
      return 'End date must be on or after start date';
    }

    // Date range cannot exceed 31 days
    const days = daysDifference(startDate, endDate);
    if (days > 31) {
      return `Date range cannot exceed 31 days (currently ${days} days)`;
    }

    // End date cannot be in the future
    if (end >= today) {
      return 'End date cannot be today or in the future';
    }

    return null;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    // Validate
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const response = await runCatchup({
        start_date: startDate,
        end_date: endDate,
      });

      setResult(response);
    } catch (err) {
      console.error('Catchup error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to run catchup. Please try again.'
      );
    }
  };

  /**
   * Handle closing after success
   */
  const handleSuccessClose = () => {
    onSuccess();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={result ? handleSuccessClose : onClose}
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
                maxWidth: '500px',
                maxHeight: '90vh',
                overflow: 'auto',
                backgroundColor: 'var(--color-surface-primary, #ffffff)',
                borderRadius: 'var(--radius-card, 0.75rem)',
                border:
                  'var(--border-width-default, 1px) solid var(--color-border, #e5e7eb)',
                boxShadow:
                  'var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05))',
                padding: 'var(--spacing-6, 1.5rem)',
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--spacing-4)',
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
                  Run {batchTypeName} Batch Catchup
                </h2>
                <button
                  onClick={result ? handleSuccessClose : onClose}
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

              {/* Success Result */}
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Success Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-3)',
                      padding: 'var(--spacing-4)',
                      backgroundColor: 'var(--color-success-50)',
                      border: '1px solid var(--color-success-200)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: 'var(--spacing-4)',
                    }}
                  >
                    <CheckCircle
                      size={24}
                      style={{ color: 'var(--color-success-600)' }}
                    />
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 'var(--text-base)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--color-success-700)',
                        }}
                      >
                        Catchup Completed Successfully
                      </p>
                      <p
                        style={{
                          margin: 0,
                          marginTop: 'var(--spacing-1)',
                          fontSize: 'var(--text-sm)',
                          color: 'var(--color-success-600)',
                        }}
                      >
                        {result.message}
                      </p>
                    </div>
                  </div>

                  {/* Results Summary */}
                  <div
                    style={{
                      backgroundColor: 'var(--color-gray-50)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--spacing-4)',
                      marginBottom: 'var(--spacing-6)',
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        marginBottom: 'var(--spacing-3)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--color-text-primary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Processing Summary
                    </h3>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 'var(--spacing-3)',
                      }}
                    >
                      <div
                        style={{
                          padding: 'var(--spacing-3)',
                          backgroundColor: 'var(--color-surface-primary)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: 'var(--text-xs)',
                            color: 'var(--color-text-secondary)',
                            textTransform: 'uppercase',
                          }}
                        >
                          Date Range
                        </p>
                        <p
                          style={{
                            margin: 0,
                            marginTop: 'var(--spacing-1)',
                            fontSize: 'var(--text-sm)',
                            fontWeight: 'var(--font-weight-medium)',
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          {result.summary.start_date} to {result.summary.end_date}
                        </p>
                      </div>

                      <div
                        style={{
                          padding: 'var(--spacing-3)',
                          backgroundColor: 'var(--color-surface-primary)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: 'var(--text-xs)',
                            color: 'var(--color-text-secondary)',
                            textTransform: 'uppercase',
                          }}
                        >
                          Records Processed
                        </p>
                        <p
                          style={{
                            margin: 0,
                            marginTop: 'var(--spacing-1)',
                            fontSize: 'var(--text-lg)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--color-primary-600)',
                          }}
                        >
                          {result.summary.money_records_processed}
                        </p>
                      </div>

                      <div
                        style={{
                          padding: 'var(--spacing-3)',
                          backgroundColor: 'var(--color-surface-primary)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: 'var(--text-xs)',
                            color: 'var(--color-text-secondary)',
                            textTransform: 'uppercase',
                          }}
                        >
                          Entries Created
                        </p>
                        <p
                          style={{
                            margin: 0,
                            marginTop: 'var(--spacing-1)',
                            fontSize: 'var(--text-lg)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--color-success-600)',
                          }}
                        >
                          {result.summary.entries_created}
                        </p>
                      </div>

                      <div
                        style={{
                          padding: 'var(--spacing-3)',
                          backgroundColor: 'var(--color-surface-primary)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: 'var(--text-xs)',
                            color: 'var(--color-text-secondary)',
                            textTransform: 'uppercase',
                          }}
                        >
                          Entries Recognized
                        </p>
                        <p
                          style={{
                            margin: 0,
                            marginTop: 'var(--spacing-1)',
                            fontSize: 'var(--text-lg)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--color-success-600)',
                          }}
                        >
                          {result.summary.entries_recognized}
                        </p>
                      </div>
                    </div>

                    {/* Show reversals if any */}
                    {result.summary.entries_reversed > 0 && (
                      <div
                        style={{
                          marginTop: 'var(--spacing-3)',
                          padding: 'var(--spacing-3)',
                          backgroundColor: 'var(--color-warning-50)',
                          border: '1px solid var(--color-warning-200)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: 'var(--text-sm)',
                            color: 'var(--color-warning-700)',
                          }}
                        >
                          {result.summary.entries_reversed} entries were reversed due to GL rule changes
                        </p>
                      </div>
                    )}

                    {/* Show failed records if any */}
                    {result.summary.failed_money_ids.length > 0 && (
                      <div
                        style={{
                          marginTop: 'var(--spacing-3)',
                          padding: 'var(--spacing-3)',
                          backgroundColor: 'var(--color-error-50)',
                          border: '1px solid var(--color-error-200)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: 'var(--text-sm)',
                            fontWeight: 'var(--font-weight-medium)',
                            color: 'var(--color-error-700)',
                          }}
                        >
                          {result.summary.failed_money_ids.length} record(s) failed to process
                        </p>
                        <p
                          style={{
                            margin: 0,
                            marginTop: 'var(--spacing-1)',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--color-error-600)',
                          }}
                        >
                          Money IDs: {result.summary.failed_money_ids.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Close Button */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleSuccessClose}
                      className="btn-primary"
                    >
                      Done
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Form (shown when no result yet) */}
              {!result && (
                <>
                  {/* Warning Message */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 'var(--spacing-3)',
                      padding: 'var(--spacing-3)',
                      backgroundColor: 'var(--color-warning-50)',
                      border: '1px solid var(--color-warning-200)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: 'var(--spacing-4)',
                    }}
                  >
                    <AlertTriangle
                      size={20}
                      style={{
                        color: 'var(--color-warning-600)',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    />
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--color-warning-800)',
                        }}
                      >
                        Re-processing Warning
                      </p>
                      <p
                        style={{
                          margin: 0,
                          marginTop: 'var(--spacing-1)',
                          fontSize: 'var(--text-sm)',
                          color: 'var(--color-warning-700)',
                        }}
                      >
                        Running catchup will re-process all {batchTypeName.toLowerCase()} records in the selected date range.
                        Existing accounting entries may be updated or reversed if GL rules have changed.
                      </p>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
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
                      <AlertCircle
                        size={20}
                        style={{ color: 'var(--color-error-600)' }}
                      />
                      <p
                        style={{
                          margin: 0,
                          fontSize: 'var(--text-sm)',
                          color: 'var(--color-error-700)',
                        }}
                      >
                        {error}
                      </p>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit}>
                    {/* Start Date */}
                    <div style={{ marginBottom: 'var(--spacing-4)' }}>
                      <label
                        htmlFor="catchup-start-date"
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
                        <span>Start Date</span>
                      </label>
                      <input
                        id="catchup-start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        max={getTodayDate()}
                        className="input"
                        disabled={catchupLoading}
                      />
                    </div>

                    {/* End Date */}
                    <div style={{ marginBottom: 'var(--spacing-4)' }}>
                      <label
                        htmlFor="catchup-end-date"
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
                        <span>End Date</span>
                      </label>
                      <input
                        id="catchup-end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        max={getTodayDate()}
                        className="input"
                        disabled={catchupLoading}
                      />
                    </div>

                    {/* Date Range Info */}
                    {startDate && endDate && daysInRange > 0 && (
                      <div
                        style={{
                          padding: 'var(--spacing-3)',
                          backgroundColor: 'var(--color-gray-50)',
                          borderRadius: 'var(--radius-md)',
                          marginBottom: 'var(--spacing-6)',
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: 'var(--text-sm)',
                            color: 'var(--color-text-secondary)',
                          }}
                        >
                          Processing{' '}
                          <span
                            style={{
                              fontWeight: 'var(--font-weight-semibold)',
                              color: daysInRange > 31 ? 'var(--color-error-600)' : 'var(--color-text-primary)',
                            }}
                          >
                            {daysInRange} day{daysInRange !== 1 ? 's' : ''}
                          </span>
                          {daysInRange > 31 && (
                            <span style={{ color: 'var(--color-error-600)' }}>
                              {' '}(exceeds 31 day limit)
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div
                      style={{
                        display: 'flex',
                        gap: 'var(--spacing-3)',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <button
                        type="button"
                        onClick={onClose}
                        className="btn-secondary"
                        disabled={catchupLoading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={catchupLoading}
                        aria-busy={catchupLoading}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-2)',
                        }}
                      >
                        {catchupLoading ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: 'linear',
                              }}
                              style={{
                                width: '16px',
                                height: '16px',
                                border: '2px solid currentColor',
                                borderTopColor: 'transparent',
                                borderRadius: '50%',
                              }}
                            />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <Play size={16} />
                            <span>Run Catchup</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
