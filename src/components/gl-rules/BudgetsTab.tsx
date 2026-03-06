/**
 * BudgetsTab Component
 *
 * Spreadsheet-style grid for viewing/editing monthly budget amounts per GL account.
 * Supports:
 * - Year selector with budget grid
 * - Inline cell editing with Tab/Enter/Escape navigation
 * - Notes per cell with popover
 * - Dirty tracking with explicit Save
 * - CSV upload and download template
 * - Copy from prior year
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Upload,
  Download,
  Copy,
  Save,
  AlertCircle,
  MessageSquare,
  ChevronDown,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import { Account } from '../../types/gl-rules';
import {
  BudgetRow,
  BudgetCell,
  BudgetUpsertData,
  Budget,
  MONTH_NAMES,
  CSVImportMode,
} from '../../types/budget-types';
import { useBudgets } from '../../hooks/useBudgets';
import { usePermissions } from '../../contexts/PermissionsContext';
import { useAuth } from '../../hooks/useAuth';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { BudgetUploadModal } from './BudgetUploadModal';

interface BudgetsTabProps {
  accounts: Account[];
  accountsLoading: boolean;
}

/** Format number as currency-like display */
function formatAmount(value: number | null): string {
  if (value === null || value === undefined) return '';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Parse a string input to a number, returning null for empty/invalid */
function parseAmount(value: string): number | null {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  if (cleaned === '' || cleaned === '-') return null;
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : Math.round(num * 100) / 100;
}

/** Build empty grid rows from accounts */
function buildEmptyRows(accounts: Account[]): BudgetRow[] {
  return accounts.map((account) => ({
    account,
    cells: Array.from({ length: 12 }, (_, i) => ({
      accountId: account.id,
      month: i + 1,
      amount: null,
      notes: null,
      existingId: null,
    })),
    total: 0,
  }));
}

/** Calculate row total from cells */
function calcRowTotal(cells: BudgetCell[]): number {
  return cells.reduce((sum, cell) => sum + (cell.amount ?? 0), 0);
}

/** Deep-clone rows for comparison */
function cloneRows(rows: BudgetRow[]): BudgetRow[] {
  return rows.map((row) => ({
    ...row,
    cells: row.cells.map((cell) => ({ ...cell })),
  }));
}

/** Compare two sets of rows for dirty check */
function rowsAreDirty(current: BudgetRow[], original: BudgetRow[]): boolean {
  if (current.length !== original.length) return true;
  for (let r = 0; r < current.length; r++) {
    for (let c = 0; c < 12; c++) {
      const curr = current[r].cells[c];
      const orig = original[r].cells[c];
      if (curr.amount !== orig.amount || curr.notes !== orig.notes) {
        return true;
      }
    }
  }
  return false;
}

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

export function BudgetsTab({ accounts, accountsLoading }: BudgetsTabProps) {
  const { canEdit } = usePermissions();
  const { userId } = useAuth();
  const { fetchBudgets, upsertBudgets, deleteBudgetsForYear, copyFromYear } = useBudgets();

  // State
  const [year, setYear] = useState(currentYear);
  const [rows, setRows] = useState<BudgetRow[]>([]);
  const [originalRows, setOriginalRows] = useState<BudgetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Notes popover
  const [notesCell, setNotesCell] = useState<{ row: number; col: number } | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCopyConfirm, setShowCopyConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [pendingYear, setPendingYear] = useState<number | null>(null);
  const [copyLoading, setCopyLoading] = useState(false);

  // Derived
  const isDirty = useMemo(() => rowsAreDirty(rows, originalRows), [rows, originalRows]);

  // Populate grid from budgets data
  const populateGrid = useCallback((budgets: Budget[], accts: Account[]) => {
    const newRows = buildEmptyRows(accts);
    const accountIndexMap = new Map(accts.map((a, i) => [a.id, i]));

    for (const budget of budgets) {
      const rowIdx = accountIndexMap.get(budget.account_id);
      if (rowIdx === undefined) continue;
      const cellIdx = budget.month - 1;
      if (cellIdx < 0 || cellIdx > 11) continue;

      newRows[rowIdx].cells[cellIdx] = {
        accountId: budget.account_id,
        month: budget.month,
        amount: budget.amount,
        notes: budget.notes,
        existingId: budget.id,
      };
    }

    // Calculate totals
    for (const row of newRows) {
      row.total = calcRowTotal(row.cells);
    }

    setRows(newRows);
    setOriginalRows(cloneRows(newRows));
  }, []);

  // Load budgets when year or accounts change
  useEffect(() => {
    if (accountsLoading || accounts.length === 0) {
      setRows(buildEmptyRows(accounts));
      setOriginalRows(buildEmptyRows(accounts));
      setLoading(accountsLoading);
      return;
    }

    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const budgets = await fetchBudgets(year);
        if (isMounted) {
          populateGrid(budgets, accounts);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading budgets:', err);
          setError(err instanceof Error ? err.message : 'Failed to load budgets');
          setRows(buildEmptyRows(accounts));
          setOriginalRows(buildEmptyRows(accounts));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [year, accounts, accountsLoading, fetchBudgets, populateGrid]);

  // Beforeunload warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Focus edit input when entering edit mode
  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCell]);

  // Focus notes textarea when opening
  useEffect(() => {
    if (notesCell && notesTextareaRef.current) {
      notesTextareaRef.current.focus();
    }
  }, [notesCell]);

  // Year change handler with dirty check
  const handleYearChange = (newYear: number) => {
    if (newYear === year) return;
    if (isDirty) {
      setPendingYear(newYear);
      setShowDiscardConfirm(true);
    } else {
      setYear(newYear);
    }
  };

  const confirmDiscard = () => {
    if (pendingYear !== null) {
      setYear(pendingYear);
      setPendingYear(null);
    }
    setShowDiscardConfirm(false);
  };

  // Cell editing
  const startEditing = (rowIdx: number, colIdx: number) => {
    if (!canEdit) return;
    const cell = rows[rowIdx].cells[colIdx];
    setEditingCell({ row: rowIdx, col: colIdx });
    setEditValue(cell.amount !== null ? cell.amount.toString() : '');
  };

  const commitEdit = () => {
    if (!editingCell) return;
    const { row, col } = editingCell;
    const newAmount = parseAmount(editValue);

    setRows((prev) => {
      const updated = [...prev];
      const updatedRow = { ...updated[row], cells: [...updated[row].cells] };
      updatedRow.cells[col] = { ...updatedRow.cells[col], amount: newAmount };
      updatedRow.total = calcRowTotal(updatedRow.cells);
      updated[row] = updatedRow;
      return updated;
    });

    setEditingCell(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      commitEdit();

      // Navigate to next cell
      if (editingCell) {
        const { row, col } = editingCell;
        let nextRow = row;
        let nextCol = col + 1;
        if (e.shiftKey && e.key === 'Tab') {
          nextCol = col - 1;
          if (nextCol < 0) {
            nextCol = 11;
            nextRow = row - 1;
          }
        } else if (e.key === 'Tab') {
          if (nextCol > 11) {
            nextCol = 0;
            nextRow = row + 1;
          }
        }

        if (nextRow >= 0 && nextRow < rows.length) {
          setTimeout(() => startEditing(nextRow, nextCol), 0);
        }
      }
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  // Notes handling
  const openNotes = (rowIdx: number, colIdx: number) => {
    const cell = rows[rowIdx].cells[colIdx];
    setNotesCell({ row: rowIdx, col: colIdx });
    setNotesValue(cell.notes ?? '');
  };

  const saveNotes = () => {
    if (!notesCell) return;
    const { row, col } = notesCell;
    setRows((prev) => {
      const updated = [...prev];
      const updatedRow = { ...updated[row], cells: [...updated[row].cells] };
      updatedRow.cells[col] = {
        ...updatedRow.cells[col],
        notes: notesValue.trim() || null,
      };
      updated[row] = updatedRow;
      return updated;
    });
    setNotesCell(null);
    setNotesValue('');
  };

  // Save handler
  const handleSave = async () => {
    if (!isDirty || saving) return;

    try {
      setSaving(true);
      setError(null);

      // Collect all cells that have values
      const upsertData: BudgetUpsertData[] = [];
      for (const row of rows) {
        for (const cell of row.cells) {
          if (cell.amount !== null) {
            upsertData.push({
              account_id: cell.accountId,
              year,
              month: cell.month,
              amount: cell.amount,
              notes: cell.notes,
              updated_by: userId || null,
              created_by: userId || null,
            });
          }
        }
      }

      if (upsertData.length > 0) {
        await upsertBudgets(upsertData);
      }

      // Reload to get fresh data with IDs
      const budgets = await fetchBudgets(year);
      populateGrid(budgets, accounts);
    } catch (err) {
      console.error('Error saving budgets:', err);
      setError(err instanceof Error ? err.message : 'Failed to save budgets');
    } finally {
      setSaving(false);
    }
  };

  // Copy from prior year
  const handleCopyFromPriorYear = async () => {
    try {
      setCopyLoading(true);
      setError(null);
      await copyFromYear(year - 1, year, userId || null);
      const budgets = await fetchBudgets(year);
      populateGrid(budgets, accounts);
      setShowCopyConfirm(false);
    } catch (err) {
      console.error('Error copying budgets:', err);
      setError(err instanceof Error ? err.message : 'Failed to copy budgets');
    } finally {
      setCopyLoading(false);
    }
  };

  // CSV template download
  const handleDownloadTemplate = () => {
    const headers = ['account_external_id', 'account_name', ...MONTH_NAMES.map((m) => m.toLowerCase())];
    const csvRows = [headers.join(',')];

    for (const account of accounts) {
      const row = [
        account.external_id,
        `"${account.name.replace(/"/g, '""')}"`,
        ...Array(12).fill(''),
      ];
      csvRows.push(row.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget_template_${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // CSV import handler
  const handleCSVImport = async (data: BudgetUpsertData[], mode: CSVImportMode) => {
    try {
      setSaving(true);
      setError(null);

      if (mode === 'replace') {
        await deleteBudgetsForYear(year);
      }

      if (data.length > 0) {
        await upsertBudgets(data);
      }

      // Reload
      const budgets = await fetchBudgets(year);
      populateGrid(budgets, accounts);
      setShowUploadModal(false);
    } catch (err) {
      console.error('Error importing CSV:', err);
      setError(err instanceof Error ? err.message : 'Failed to import CSV');
    } finally {
      setSaving(false);
    }
  };

  // Column totals
  const columnTotals = useMemo(() => {
    const totals = Array(12).fill(0);
    for (const row of rows) {
      for (let i = 0; i < 12; i++) {
        totals[i] += row.cells[i].amount ?? 0;
      }
    }
    return totals;
  }, [rows]);

  const grandTotal = useMemo(
    () => columnTotals.reduce((sum: number, v: number) => sum + v, 0),
    [columnTotals]
  );

  // Has any data?
  const hasData = rows.some((r) => r.cells.some((c) => c.amount !== null));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Action Bar */}
      <div
        className="flex items-center gap-3 mb-6 flex-wrap"
        style={{ minHeight: 'var(--height-button)' }}
      >
        {/* Year Selector */}
        <div className="relative">
          <select
            value={year}
            onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
            className="input pr-8 appearance-none"
            style={{
              height: 'var(--height-button)',
              width: '140px',
              paddingRight: '2.5rem',
            }}
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--color-text-muted)' }}
          />
        </div>

        {canEdit && (
          <>
            {/* Upload CSV */}
            <button
              className="btn-secondary flex items-center gap-2"
              style={{ height: 'var(--height-button)' }}
              onClick={() => setShowUploadModal(true)}
            >
              <Upload size={16} />
              Upload CSV
            </button>

            {/* Download Template */}
            <button
              className="btn-secondary flex items-center gap-2"
              style={{ height: 'var(--height-button)' }}
              onClick={handleDownloadTemplate}
            >
              <Download size={16} />
              Download Template
            </button>

            {/* Copy Prior Year */}
            <button
              className="btn-secondary flex items-center gap-2"
              style={{ height: 'var(--height-button)' }}
              onClick={() => setShowCopyConfirm(true)}
            >
              <Copy size={16} />
              Copy {year - 1}
            </button>
          </>
        )}

        <div className="flex-1" />

        {/* Save Button */}
        {canEdit && (
          <button
            className="btn-primary flex items-center gap-2"
            style={{ height: 'var(--height-button)' }}
            disabled={!isDirty || saving}
            onClick={handleSave}
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          className="card mb-6"
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

      {/* Loading */}
      {loading ? (
        <div className="card">
          <div className="p-8 text-center">
            <div
              className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"
              style={{ color: 'var(--color-primary-600)' }}
            />
            <p className="mt-4" style={{ color: 'var(--color-text-secondary)' }}>
              Loading budgets...
            </p>
          </div>
        </div>
      ) : accounts.length === 0 ? (
        /* No accounts state */
        <div className="card">
          <div className="p-12 text-center">
            <FileSpreadsheet
              size={48}
              style={{ color: 'var(--color-text-muted)', margin: '0 auto' }}
            />
            <h3
              className="mt-4"
              style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text)',
              }}
            >
              No GL Accounts Found
            </h3>
            <p
              className="mt-2"
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Create GL accounts in the Manage Accounts tab first, then come back to set budgets.
            </p>
          </div>
        </div>
      ) : !hasData && !isDirty ? (
        /* Empty state - no budgets for this year */
        <div className="card">
          <div className="p-12 text-center">
            <Calendar
              size={48}
              style={{ color: 'var(--color-text-muted)', margin: '0 auto' }}
            />
            <h3
              className="mt-4"
              style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text)',
              }}
            >
              No Budgets for {year}
            </h3>
            <p
              className="mt-2 mb-6"
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Get started by clicking cells in the grid below, uploading a CSV, or copying from the prior year.
            </p>
            {canEdit && (
              <div className="flex items-center justify-center gap-3">
                <button
                  className="btn-secondary flex items-center gap-2"
                  onClick={() => setShowUploadModal(true)}
                >
                  <Upload size={16} />
                  Upload CSV
                </button>
                <button
                  className="btn-secondary flex items-center gap-2"
                  onClick={() => setShowCopyConfirm(true)}
                >
                  <Copy size={16} />
                  Copy from {year - 1}
                </button>
              </div>
            )}
          </div>

          {/* Still show the grid even with empty state */}
          <div className="px-6 pb-6 overflow-x-auto">
            {renderGrid()}
          </div>
        </div>
      ) : (
        /* Budget Grid */
        <div className="card">
          <div className="overflow-x-auto">
            {renderGrid()}
          </div>
        </div>
      )}

      {/* Dirty indicator */}
      {isDirty && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-lg flex items-center gap-2"
          style={{
            backgroundColor: 'var(--color-warning-50)',
            border: '1px solid var(--color-warning-200)',
          }}
        >
          <AlertCircle size={16} style={{ color: 'var(--color-warning-600)' }} />
          <span
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-warning-700)',
            }}
          >
            You have unsaved changes. Click "Save Changes" to persist your edits.
          </span>
        </motion.div>
      )}

      {/* Notes Popover */}
      {notesCell && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={saveNotes}
          />
          <div
            className="fixed z-50 p-4 rounded-lg shadow-lg"
            style={{
              backgroundColor: 'var(--color-surface-primary)',
              border: '1px solid var(--color-border)',
              width: '280px',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <label
              className="block mb-2"
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text)',
              }}
            >
              Notes for {accounts[notesCell.row]?.name} - {MONTH_NAMES[notesCell.col]}
            </label>
            <textarea
              ref={notesTextareaRef}
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              className="input w-full"
              rows={3}
              placeholder="Add notes..."
              disabled={!canEdit}
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                className="btn-secondary"
                style={{ height: '36px', fontSize: 'var(--text-sm)' }}
                onClick={() => {
                  setNotesCell(null);
                  setNotesValue('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{ height: '36px', fontSize: 'var(--text-sm)' }}
                onClick={saveNotes}
                disabled={!canEdit}
              >
                Save Note
              </button>
            </div>
          </div>
        </>
      )}

      {/* Upload Modal */}
      <BudgetUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onImport={handleCSVImport}
        accounts={accounts}
        year={year}
        userId={userId || null}
      />

      {/* Copy Confirm Dialog */}
      <ConfirmDialog
        isOpen={showCopyConfirm}
        onClose={() => setShowCopyConfirm(false)}
        onConfirm={handleCopyFromPriorYear}
        title={`Copy Budgets from ${year - 1}`}
        message={`This will copy all budget entries from ${year - 1} to ${year}.\n\nAny existing budgets for ${year} will be replaced.\n\nAre you sure?`}
        confirmLabel="Copy Budgets"
        isLoading={copyLoading}
      />

      {/* Discard Changes Confirm */}
      <ConfirmDialog
        isOpen={showDiscardConfirm}
        onClose={() => {
          setShowDiscardConfirm(false);
          setPendingYear(null);
        }}
        onConfirm={confirmDiscard}
        title="Unsaved Changes"
        message="You have unsaved budget changes. Switching years will discard them.\n\nAre you sure you want to continue?"
        confirmLabel="Discard Changes"
        confirmDanger
      />
    </motion.div>
  );

  function renderGrid() {
    return (
      <table
        style={{
          borderCollapse: 'separate',
          borderSpacing: 0,
          fontSize: 'var(--text-sm)',
          width: '100%',
          tableLayout: 'fixed',
        }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: 'var(--color-surface-secondary)',
            }}
          >
            <th
              style={{
                backgroundColor: 'var(--color-surface-secondary)',
                padding: 'var(--spacing-3) var(--spacing-4)',
                textAlign: 'left',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-secondary)',
                borderBottom: '2px solid var(--color-border)',
                width: '15%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Account
            </th>
            <th
              style={{
                backgroundColor: 'var(--color-surface-secondary)',
                padding: 'var(--spacing-3) var(--spacing-4)',
                textAlign: 'left',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-secondary)',
                borderBottom: '2px solid var(--color-border)',
                width: '7%',
              }}
            >
              Ext ID
            </th>
            {MONTH_NAMES.map((month) => (
              <th
                key={month}
                style={{
                  padding: 'var(--spacing-3) var(--spacing-2)',
                  textAlign: 'right',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-secondary)',
                  borderBottom: '2px solid var(--color-border)',
                }}
              >
                {month}
              </th>
            ))}
            <th
              style={{
                padding: 'var(--spacing-3) var(--spacing-2)',
                textAlign: 'right',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text)',
                borderBottom: '2px solid var(--color-border)',
                width: '8%',
              }}
            >
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={row.account.id}
              style={{
                borderBottom: '1px solid var(--color-border)',
              }}
              className="hover:bg-[var(--color-surface-secondary)] transition-colors"
            >
              {/* Account Name */}
              <td
                style={{
                  backgroundColor: 'var(--color-surface-primary)',
                  padding: 'var(--spacing-2) var(--spacing-4)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-text)',
                  borderBottom: '1px solid var(--color-border)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={row.account.name}
              >
                {row.account.name}
              </td>
              {/* External ID */}
              <td
                style={{
                  backgroundColor: 'var(--color-surface-primary)',
                  padding: 'var(--spacing-2) var(--spacing-4)',
                  color: 'var(--color-text-secondary)',
                  fontFamily: 'monospace',
                  fontSize: 'var(--text-xs)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                {row.account.external_id}
              </td>
              {/* Month cells */}
              {row.cells.map((cell, colIdx) => {
                const isEditing =
                  editingCell?.row === rowIdx && editingCell?.col === colIdx;
                const hasNotes = !!cell.notes;
                const isChanged =
                  originalRows[rowIdx] &&
                  (cell.amount !== originalRows[rowIdx].cells[colIdx].amount ||
                    cell.notes !== originalRows[rowIdx].cells[colIdx].notes);

                return (
                  <td
                    key={colIdx}
                    style={{
                      padding: '0',
                      borderBottom: '1px solid var(--color-border)',
                      position: 'relative',
                      backgroundColor: isChanged
                        ? 'var(--color-warning-50)'
                        : undefined,
                    }}
                  >
                    {isEditing ? (
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={handleCellKeyDown}
                        style={{
                          width: '100%',
                          height: '100%',
                          padding: 'var(--spacing-2) var(--spacing-2)',
                          textAlign: 'right',
                          border: '2px solid var(--color-primary-500)',
                          outline: 'none',
                          backgroundColor: 'var(--color-surface-primary)',
                          fontSize: 'var(--text-sm)',
                          fontFamily: 'inherit',
                        }}
                      />
                    ) : (
                      <div
                        onClick={() => startEditing(rowIdx, colIdx)}
                        style={{
                          padding: 'var(--spacing-2) var(--spacing-2)',
                          textAlign: 'right',
                          cursor: canEdit ? 'pointer' : 'default',
                          minHeight: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '2px',
                          color: cell.amount !== null
                            ? 'var(--color-text)'
                            : 'var(--color-text-muted)',
                        }}
                      >
                        {hasNotes && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openNotes(rowIdx, colIdx);
                            }}
                            title={cell.notes ?? ''}
                            style={{
                              padding: '2px',
                              borderRadius: '3px',
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              color: 'var(--color-primary-500)',
                              flexShrink: 0,
                            }}
                          >
                            <MessageSquare size={12} />
                          </button>
                        )}
                        <span>
                          {cell.amount !== null ? formatAmount(cell.amount) : '\u2014'}
                        </span>
                      </div>
                    )}
                  </td>
                );
              })}
              {/* Row total */}
              <td
                style={{
                  padding: 'var(--spacing-2) var(--spacing-2)',
                  textAlign: 'right',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text)',
                  borderBottom: '1px solid var(--color-border)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatAmount(row.total)}
              </td>
            </tr>
          ))}
        </tbody>
        {/* Footer with column totals */}
        <tfoot>
          <tr
            style={{
              backgroundColor: 'var(--color-surface-secondary)',
            }}
          >
            <td
              colSpan={2}
              style={{
                backgroundColor: 'var(--color-surface-secondary)',
                padding: 'var(--spacing-3) var(--spacing-4)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text)',
                borderTop: '2px solid var(--color-border)',
              }}
            >
              TOTALS
            </td>
            {columnTotals.map((total: number, idx: number) => (
              <td
                key={idx}
                style={{
                  padding: 'var(--spacing-3) var(--spacing-2)',
                  textAlign: 'right',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text)',
                  borderTop: '2px solid var(--color-border)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatAmount(total)}
              </td>
            ))}
            <td
              style={{
                padding: 'var(--spacing-3) var(--spacing-2)',
                textAlign: 'right',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-primary-600)',
                borderTop: '2px solid var(--color-border)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatAmount(grandTotal)}
            </td>
          </tr>
        </tfoot>
      </table>
    );
  }
}
