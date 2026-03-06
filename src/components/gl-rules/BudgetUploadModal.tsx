/**
 * BudgetUploadModal Component
 *
 * CSV upload modal for budget data.
 * Parses CSV, matches rows to accounts by external_id,
 * shows preview with match stats, and supports merge/replace modes.
 */

import { useState, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Account } from '../../types/gl-rules';
import {
  BudgetUpsertData,
  BudgetCSVRow,
  CSVImportMode,
  CSV_MONTH_MAP,
  MONTH_NAMES,
} from '../../types/budget-types';

interface BudgetUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: BudgetUpsertData[], mode: CSVImportMode) => Promise<void>;
  accounts: Account[];
  year: number;
  userId: string | null;
}

interface ParsedResult {
  fileName: string;
  totalRows: number;
  matchedRows: number;
  unmatchedIds: string[];
  data: BudgetUpsertData[];
  preview: Array<{
    accountName: string;
    externalId: string;
    matched: boolean;
    months: (number | null)[];
  }>;
}

export function BudgetUploadModal({
  isOpen,
  onClose,
  onImport,
  accounts,
  year,
  userId,
}: BudgetUploadModalProps) {
  const [parsed, setParsed] = useState<ParsedResult | null>(null);
  const [mode, setMode] = useState<CSVImportMode>('merge');
  const [importing, setImporting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setParsed(null);
    setMode('merge');
    setImporting(false);
    setParseError(null);
    setDragOver(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const processFile = (file: File) => {
    setParseError(null);
    setParsed(null);

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setParseError('Please select a CSV file.');
      return;
    }

    Papa.parse<BudgetCSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setParseError(
            `CSV parse error: ${results.errors[0].message} (row ${results.errors[0].row})`
          );
          return;
        }

        if (results.data.length === 0) {
          setParseError('CSV file is empty or has no data rows.');
          return;
        }

        // Build account lookup by external_id
        const accountMap = new Map(accounts.map((a) => [a.external_id, a]));

        // Detect month columns from headers
        const headers = results.meta.fields || [];
        const monthColumns: { header: string; monthIdx: number }[] = [];

        for (const header of headers) {
          const normalized = header.trim().toLowerCase();
          if (normalized in CSV_MONTH_MAP) {
            monthColumns.push({ header, monthIdx: CSV_MONTH_MAP[normalized] });
          }
        }

        if (monthColumns.length === 0) {
          setParseError(
            'No month columns found. Expected headers like: jan, feb, mar, ... or january, february, march, ...'
          );
          return;
        }

        const upsertData: BudgetUpsertData[] = [];
        const preview: ParsedResult['preview'] = [];
        const unmatchedIds: string[] = [];
        let matchedRows = 0;

        for (const row of results.data) {
          // Find the external ID column (try common names)
          const extId =
            row.account_external_id ||
            row['account_external_id'] ||
            row['external_id'] ||
            row['ext_id'] ||
            row['account_id'] ||
            '';

          const name =
            row.account_name ||
            row['account_name'] ||
            row['name'] ||
            '';

          const trimmedExtId = extId.toString().trim();
          const account = accountMap.get(trimmedExtId);
          const matched = !!account;

          if (matched) matchedRows++;
          else if (trimmedExtId) unmatchedIds.push(trimmedExtId);

          // Parse month values
          const months: (number | null)[] = Array(12).fill(null);
          for (const { header, monthIdx } of monthColumns) {
            const val = row[header];
            if (val !== undefined && val !== null && val.toString().trim() !== '') {
              const cleaned = val.toString().replace(/[^0-9.-]/g, '');
              const num = parseFloat(cleaned);
              if (!isNaN(num)) {
                months[monthIdx] = Math.round(num * 100) / 100;
              }
            }
          }

          preview.push({
            accountName: matched ? account!.name : (name || trimmedExtId),
            externalId: trimmedExtId,
            matched,
            months,
          });

          // Only create upsert data for matched accounts with values
          if (matched) {
            for (let m = 0; m < 12; m++) {
              if (months[m] !== null) {
                upsertData.push({
                  account_id: account!.id,
                  year,
                  month: m + 1,
                  amount: months[m]!,
                  notes: null,
                  created_by: userId,
                  updated_by: userId,
                });
              }
            }
          }
        }

        setParsed({
          fileName: file.name,
          totalRows: results.data.length,
          matchedRows,
          unmatchedIds: [...new Set(unmatchedIds)],
          data: upsertData,
          preview,
        });
      },
      error: (err) => {
        setParseError(`Failed to read file: ${err.message}`);
      },
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleImport = async () => {
    if (!parsed) return;
    try {
      setImporting(true);
      await onImport(parsed.data, mode);
      reset();
    } catch {
      // Error handled by parent
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Upload Budget CSV - ${year}`}
      maxWidth="800px"
      footer={
        parsed ? (
          <>
            <button
              className="btn-secondary"
              onClick={handleClose}
              disabled={importing}
            >
              Cancel
            </button>
            <button
              className="btn-primary flex items-center gap-2"
              onClick={handleImport}
              disabled={importing || parsed.matchedRows === 0}
            >
              {importing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              {importing ? 'Importing...' : `Import ${parsed.data.length} values`}
            </button>
          </>
        ) : undefined
      }
    >
      {!parsed ? (
        /* File Selection */
        <div>
          {/* Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--color-primary-500)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-card)',
              padding: 'var(--spacing-8)',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: dragOver
                ? 'var(--color-primary-50)'
                : 'var(--color-surface-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            <Upload
              size={40}
              style={{
                color: dragOver
                  ? 'var(--color-primary-500)'
                  : 'var(--color-text-muted)',
                margin: '0 auto',
              }}
            />
            <p
              className="mt-3"
              style={{
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text)',
              }}
            >
              Drop a CSV file here or click to browse
            </p>
            <p
              className="mt-1"
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Expected columns: account_external_id, jan, feb, ..., dec
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {/* Parse Error */}
          {parseError && (
            <div
              className="mt-4 p-3 rounded-lg flex items-start gap-2"
              style={{
                backgroundColor: 'var(--color-error-50)',
                border: '1px solid var(--color-error-200)',
              }}
            >
              <XCircle
                size={16}
                style={{ color: 'var(--color-error-500)', marginTop: '2px', flexShrink: 0 }}
              />
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-error-700)' }}>
                {parseError}
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Preview */
        <div>
          {/* File info */}
          <div
            className="flex items-center gap-3 p-3 rounded-lg mb-4"
            style={{
              backgroundColor: 'var(--color-surface-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <FileText size={20} style={{ color: 'var(--color-primary-500)' }} />
            <div className="flex-1">
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-text)',
                }}
              >
                {parsed.fileName}
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                {parsed.totalRows} rows found
              </p>
            </div>
          </div>

          {/* Match Stats */}
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} style={{ color: 'var(--color-success-500)' }} />
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                {parsed.matchedRows} matched
              </span>
            </div>
            {parsed.unmatchedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} style={{ color: 'var(--color-warning-500)' }} />
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                  {parsed.unmatchedIds.length} unmatched
                </span>
              </div>
            )}
          </div>

          {/* Unmatched warnings */}
          {parsed.unmatchedIds.length > 0 && (
            <div
              className="p-3 rounded-lg mb-4"
              style={{
                backgroundColor: 'var(--color-warning-50)',
                border: '1px solid var(--color-warning-200)',
              }}
            >
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-warning-700)',
                  marginBottom: 'var(--spacing-1)',
                }}
              >
                Unmatched account IDs (will be skipped):
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-warning-600)' }}>
                {parsed.unmatchedIds.join(', ')}
              </p>
            </div>
          )}

          {/* Preview Table */}
          <div
            className="overflow-x-auto mb-4 rounded-lg"
            style={{
              border: '1px solid var(--color-border)',
              maxHeight: '300px',
            }}
          >
            <table className="w-full" style={{ fontSize: 'var(--text-xs)' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                  <th
                    style={{
                      padding: 'var(--spacing-2) var(--spacing-3)',
                      textAlign: 'left',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-text-secondary)',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'var(--color-surface-secondary)',
                    }}
                  >
                    Account
                  </th>
                  <th
                    style={{
                      padding: 'var(--spacing-2) var(--spacing-3)',
                      textAlign: 'center',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-text-secondary)',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'var(--color-surface-secondary)',
                      width: '60px',
                    }}
                  >
                    Status
                  </th>
                  {MONTH_NAMES.map((m) => (
                    <th
                      key={m}
                      style={{
                        padding: 'var(--spacing-2) var(--spacing-3)',
                        textAlign: 'right',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--color-text-secondary)',
                        position: 'sticky',
                        top: 0,
                        backgroundColor: 'var(--color-surface-secondary)',
                      }}
                    >
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsed.preview.map((row, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      opacity: row.matched ? 1 : 0.5,
                    }}
                  >
                    <td
                      style={{
                        padding: 'var(--spacing-2) var(--spacing-3)',
                        color: 'var(--color-text)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {row.accountName}{' '}
                      <span
                        style={{
                          color: 'var(--color-text-muted)',
                          fontFamily: 'monospace',
                        }}
                      >
                        ({row.externalId})
                      </span>
                    </td>
                    <td style={{ padding: 'var(--spacing-2)', textAlign: 'center' }}>
                      {row.matched ? (
                        <CheckCircle
                          size={14}
                          style={{ color: 'var(--color-success-500)' }}
                        />
                      ) : (
                        <XCircle
                          size={14}
                          style={{ color: 'var(--color-error-400)' }}
                        />
                      )}
                    </td>
                    {row.months.map((val, m) => (
                      <td
                        key={m}
                        style={{
                          padding: 'var(--spacing-2) var(--spacing-3)',
                          textAlign: 'right',
                          color:
                            val !== null
                              ? 'var(--color-text)'
                              : 'var(--color-text-muted)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {val !== null ? val.toLocaleString() : '\u2014'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Import Mode */}
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: 'var(--color-surface-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <p
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text)',
                marginBottom: 'var(--spacing-3)',
              }}
            >
              Import Mode
            </p>
            <div className="flex gap-4">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value="merge"
                  checked={mode === 'merge'}
                  onChange={() => setMode('merge')}
                  style={{ marginTop: '4px' }}
                />
                <div>
                  <p
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-text)',
                    }}
                  >
                    Merge
                  </p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    Update only the values in the CSV, keep other existing values
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={mode === 'replace'}
                  onChange={() => setMode('replace')}
                  style={{ marginTop: '4px' }}
                />
                <div>
                  <p
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-text)',
                    }}
                  >
                    Replace
                  </p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    Delete all existing {year} budgets and replace with CSV data
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Change file link */}
          <div className="mt-3 text-center">
            <button
              onClick={() => {
                setParsed(null);
                setParseError(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-primary-600)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Choose a different file
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
