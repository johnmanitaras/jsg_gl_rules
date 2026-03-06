/**
 * Budget Types
 *
 * Type definitions for the Budgets feature.
 * Budgets allow operators to set monthly budget targets per GL account.
 */

import { Account } from './gl-rules';

/**
 * Budget record from the database
 */
export interface Budget {
  id: number;
  account_id: number;
  year: number;
  month: number; // 1-12
  amount: number;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Budget with joined account data
 */
export interface BudgetWithAccount extends Budget {
  account: Account;
}

/**
 * State for a single cell in the budget grid
 */
export interface BudgetCell {
  accountId: number;
  month: number; // 1-12
  amount: number | null;
  notes: string | null;
  existingId: number | null; // DB record ID, null if new
}

/**
 * A single row in the budget grid (one per account)
 */
export interface BudgetRow {
  account: Account;
  cells: BudgetCell[]; // 12 cells, index 0 = Jan, index 11 = Dec
  total: number;
}

/**
 * Payload for upserting budgets
 */
export interface BudgetUpsertData {
  account_id: number;
  year: number;
  month: number;
  amount: number;
  notes?: string | null;
  updated_by?: string | null;
  created_by?: string | null;
}

/**
 * Shape of a parsed CSV row
 */
export interface BudgetCSVRow {
  account_external_id: string;
  account_name?: string;
  jan?: string;
  feb?: string;
  mar?: string;
  apr?: string;
  may?: string;
  jun?: string;
  jul?: string;
  aug?: string;
  sep?: string;
  oct?: string;
  nov?: string;
  dec?: string;
  [key: string]: string | undefined;
}

/**
 * CSV import mode
 */
export type CSVImportMode = 'merge' | 'replace';

/**
 * Month name constants
 */
export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

/**
 * CSV header mapping: lowercase header -> month index (0-based)
 */
export const CSV_MONTH_MAP: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};
