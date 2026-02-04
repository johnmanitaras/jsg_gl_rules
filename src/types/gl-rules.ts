/**
 * GL Rules Types
 *
 * These types represent the GL rules structure for allocating
 * revenue and commission expenses to GL accounts.
 *
 * See docs/gl-rules-evaluation-logic.md for business logic details.
 */

/**
 * Rule type defines the priority level for GL account selection
 * Priority order (highest to lowest):
 * 1. resource - Specific resource (vessel, bus, venue)
 * 2. product_sub_type - Product sub-type (e.g., "Dinner Cruise")
 * 3. product_type - Product type (e.g., "Ferry")
 * 4. default - Fallback when no other rules match
 */
export type RuleType = 'resource' | 'product_sub_type' | 'product_type' | 'default';

/**
 * GL Rule Set type - determines which timeline lane and allocation type
 */
export type GLRuleSetType = 'revenue' | 'commission' | 'cancellation_fee';

/**
 * GL Account - Represents a GL account code
 */
export interface Account {
  id: number;
  name: string;
  external_id: string;  // The actual GL account code in accounting system
  deleted: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * GL Rule Set - Time-based container for GL rules
 */
export interface GLRuleSet {
  id: number;
  name: string;
  start_date: string;  // YYYY-MM-DD
  end_date: string;    // YYYY-MM-DD
  type: GLRuleSetType; // 'revenue', 'commission', or 'cancellation_fee'
  deleted: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * GL Rule - Individual rule within a rule set
 */
export interface GLRule {
  id: number;
  gl_rule_set_id: number;
  rule_type: RuleType;
  target_id: number | null; // NULL for default rules, required for all others
  account_id: number;       // Which GL account to allocate to
  deleted: boolean;
  created_at: string;
  updated_at: string;

  // Joined data for display (populated by queries with joins)
  target_name?: string;     // Name of resource/product type/sub-type
  account_name?: string;    // Name of the GL account
  account_external_id?: string; // GL account code
  target_details?: {
    type?: string;          // For resources: 'Ferry', 'Bus', 'Venue'
    icon?: string;          // Icon name for resource type
    product_type_id?: number; // For product sub-types
  };
}

/**
 * Detailed rule set with all rules (for editor)
 */
export interface GLRuleSetDetailed extends GLRuleSet {
  gl_rules: GLRule[];
}

/**
 * Form data for creating/editing rules
 */
export interface RuleFormData {
  rule_type: RuleType;
  target_id: number | null;
  account_id: number;
}

/**
 * Form data for creating/editing rule sets
 */
export interface RuleSetFormData {
  name: string;
  start_date: string;
  end_date: string;
  type: GLRuleSetType;
}

/**
 * Form data for creating/editing accounts
 */
export interface AccountFormData {
  name: string;
  external_id: string;
}

/**
 * Lookup data types for dropdowns
 */

export interface Resource {
  id: number;
  name: string;
  type: string; // 'Ferry', 'Bus', 'Venue', etc.
  deleted: boolean;
}

export interface ProductType {
  id: number;
  name: string;
  deleted: boolean;
}

export interface ProductSubType {
  id: number;
  product_type_id: number;
  name: string;
  deleted: boolean;
  // Joined data
  product_type_name?: string;
}

/**
 * Validation errors
 */
export interface ValidationErrors {
  [key: string]: string;
}

/**
 * Priority level mapping (for display)
 */
export const RULE_PRIORITY: Record<RuleType, number> = {
  resource: 1,
  product_sub_type: 2,
  product_type: 3,
  default: 4,
};

/**
 * Priority labels for display
 */
export const PRIORITY_LABELS: Record<RuleType, string> = {
  resource: 'Highest (1/4) - Overrides all other rules',
  product_sub_type: 'High (2/4) - Overrides product type and default',
  product_type: 'Medium (3/4) - Overrides default only',
  default: 'Fallback (4/4) - Used when no other rules match',
};

/**
 * Rule type display names
 */
export const RULE_TYPE_NAMES: Record<RuleType, string> = {
  resource: 'Resource Rule',
  product_sub_type: 'Product Sub-Type Rule',
  product_type: 'Product Type Rule',
  default: 'Default Rule',
};

/**
 * GL Rule Set type display names
 */
export const RULE_SET_TYPE_NAMES: Record<GLRuleSetType, string> = {
  revenue: 'Revenue',
  commission: 'Commission',
  cancellation_fee: 'Cancellation Fee',
};

/**
 * Lane IDs for timeline component
 */
export const LANE_IDS: Record<GLRuleSetType, number> = {
  revenue: 0,
  commission: 1,
  cancellation_fee: 2,
};

/**
 * Get rule set type from lane ID
 */
export function getRuleSetTypeFromLaneId(laneId: number | null): GLRuleSetType {
  if (laneId === 1) return 'commission';
  if (laneId === 2) return 'cancellation_fee';
  return 'revenue';
}

/**
 * Get lane ID from rule set type
 */
export function getLaneIdFromRuleSetType(type: GLRuleSetType): number {
  return LANE_IDS[type];
}

// ============================================================================
// Accounting Entries Types
// ============================================================================

/**
 * Status of an accounting entry
 * - pending: Entry created but not yet recognized (recognised_at IS NULL)
 * - recognized: Entry has been recognized (recognised_at IS NOT NULL, amount > 0)
 * - reversal: Entry is a reversal (recognised_at IS NOT NULL, amount < 0)
 */
export type AccountingEntryStatus = 'pending' | 'recognized' | 'reversal';

/**
 * Accounting entry statuses for filtering
 */
export const ACCOUNTING_ENTRY_STATUSES: readonly AccountingEntryStatus[] = [
  'pending',
  'recognized',
  'reversal',
] as const;

/**
 * Available export formats for invoice batches
 */
export type ExportFormat = 'myob' | 'xero' | 'csv';

/**
 * Export formats array for dropdowns and iteration
 */
export const EXPORT_FORMATS: readonly ExportFormat[] = ['myob', 'xero', 'csv'] as const;

/**
 * Export format display names
 */
export const EXPORT_FORMAT_NAMES: Record<ExportFormat, string> = {
  myob: 'MYOB',
  xero: 'Xero',
  csv: 'CSV',
};

/**
 * A single line within an accounting entry (for display purposes)
 * Represents the debit/credit breakdown for a GL account
 */
export interface AccountingEntryLine {
  /** GL account code/name */
  account: string;
  /** Debit amount (positive) */
  debit: number;
  /** Credit amount (positive) */
  credit: number;
  /** Line description */
  description: string;
}

/**
 * Accounting entry - represents a GL allocation for a money record
 * Generated by the GL rules evaluation system during batch processing
 */
export interface AccountingEntry {
  /** Unique identifier */
  id: number;
  /** Associated money record ID (via association_id where association_type='money') */
  money_id: number | null;
  /** Computed status based on recognised_at and amount */
  status: AccountingEntryStatus;
  /** Sale/transaction date (from associated money record) */
  sale_date: string | null;
  /** Entry lines showing debit/credit breakdown (computed for display) */
  entry_lines: AccountingEntryLine[];
  /** Entry amount (positive for revenue, negative for reversals) */
  amount: number;
  /** GL account ID */
  account_id: number;
  /** GL account name (joined) */
  account_name?: string;
  /** GL account external ID/code (joined) */
  account_external_id?: string;
  /** When the entry was recognized (NULL = pending) */
  recognised_at: string | null;
  /** Local timezone version of recognised_at */
  recognised_at_local: string | null;
  /** Association type (typically 'money') */
  association_type: string | null;
  /** Association ID (money record ID) */
  association_id: number | null;
  /** Soft delete flag */
  deleted: boolean;
  /** When the entry was created */
  created_at: string;
  /** When the entry was last updated */
  updated_at: string;
  /** Booking reference (joined via money -> reservation -> booking) */
  booking_ref?: string;
  /** Travel date (joined via reservation -> service) */
  travel_date?: string;
}

// ============================================================================
// GL Batch Runs Types
// ============================================================================

/**
 * GL Batch Run - represents a completed batch processing job
 * Note: The actual tables (sales_batch_runs, payment_batch_runs) only store
 * basic metadata. Detailed processing stats are in sales_batch_job_initiations.notes
 */
export interface GLBatchRun {
  /** Unique identifier */
  id: number;
  /** Start date of the batch period */
  start_date: string;
  /** End date of the batch period */
  end_date: string;
  /** When the batch job ran */
  created_at: string;
  /** When the record was last updated */
  updated_at: string;
  /** Computed status - always 'completed' since records only exist for successful runs */
  status?: 'completed';
}

/**
 * Pagination information for API responses
 */
export interface PaginationInfo {
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  page_size: number;
  /** Total number of items across all pages */
  total_items: number;
  /** Total number of pages */
  total_pages: number;
}

/**
 * Response from GL batch runs list endpoints
 */
export interface GLBatchRunsResponse {
  /** Array of batch run records */
  data: GLBatchRun[];
  /** Pagination metadata */
  pagination: PaginationInfo;
}

/**
 * Request body for batch catchup operations
 */
export interface BatchCatchupRequest {
  /** Start date for catchup period (YYYY-MM-DD) */
  start_date: string;
  /** End date for catchup period (YYYY-MM-DD) */
  end_date: string;
}

/**
 * Summary of a batch catchup operation
 */
export interface BatchCatchupSummary {
  /** Start date that was processed */
  start_date: string;
  /** End date that was processed */
  end_date: string;
  /** Number of money records processed */
  money_records_processed: number;
  /** Number of accounting entries created */
  entries_created: number;
  /** Number of entries synced */
  entries_synced: number;
  /** Number of entries reversed */
  entries_reversed: number;
  /** Number of entries recognized */
  entries_recognized: number;
  /** Array of money IDs that failed processing */
  failed_money_ids: number[];
}

/**
 * Response from batch catchup operations
 */
export interface BatchCatchupResponse {
  /** Whether the operation succeeded */
  success: boolean;
  /** ID of the created batch run */
  batch_run_id: number;
  /** Human-readable message */
  message: string;
  /** Detailed summary of what was processed */
  summary: BatchCatchupSummary;
}

/**
 * Batch type for retry operations
 */
export type BatchType = 'sales' | 'payments';

/**
 * Request body for batch retry operations
 */
export interface BatchRetryRequest {
  /** Array of money record IDs to retry */
  money_ids: number[];
  /** Type of batch processing to perform */
  batch_type: BatchType;
}

/**
 * Results of a batch retry operation
 */
export interface BatchRetryResults {
  /** Number of records attempted */
  attempted: number;
  /** Number of records that succeeded */
  succeeded: number;
  /** Number of records that failed */
  failed: number;
  /** Array of money IDs that failed */
  failed_money_ids: number[];
  /** Error messages keyed by money ID */
  errors: Record<string, string>;
}

/**
 * Response from batch retry operations
 */
export interface BatchRetryResponse {
  /** Whether the operation succeeded overall */
  success: boolean;
  /** Human-readable message */
  message: string;
  /** Detailed results of the retry operation */
  results: BatchRetryResults;
}

// ============================================================================
// Invoice Batches Types
// ============================================================================

/**
 * Invoice batch - groups invoices created in a single batch run
 */
export interface InvoiceBatch {
  /** Unique identifier */
  id: number;
  /** Date invoices were issued */
  issue_date: string;
  /** How the batch was initiated: 'manual' or 'sched' */
  run_by: string | null;
  /** When the batch was exported (null if not exported) */
  exported_at: string | null;
  /** User ID who exported the batch */
  exported_by: number | null;
  /** When the batch was created */
  created_at: string;
  /** When the batch was last updated */
  updated_at: string;
  /** Number of invoices in batch (computed from joined data) */
  invoice_count?: number;
  /** Total amount of all invoices (computed from joined data) */
  total_amount?: number;
}

/**
 * Response from invoice batches list endpoint
 */
export interface InvoiceBatchesResponse {
  /** Array of invoice batch records */
  data: InvoiceBatch[];
  /** Pagination metadata */
  pagination: PaginationInfo;
}

/**
 * Line item on an invoice
 */
export interface InvoiceLineItem {
  /** Type of line item (e.g., 'payment', 'booking') */
  type: string;
  /** Description of the item */
  description: string;
  /** Quantity (typically 1 for payments) */
  quantity: number;
  /** Net amount before tax */
  net: number;
  /** Tax amount */
  tax: number;
  /** Total amount (net + tax) */
  total: number;
  /** Payment ID if applicable */
  payment_id?: number;
  /** Booking reference */
  booking_reference?: string;
  /** Booking description */
  booking_description?: string;
}

/**
 * Invoice - individual invoice for a client within a batch
 */
export interface Invoice {
  /** Unique identifier */
  id?: number;
  /** Booking reference (may be used as invoice reference) */
  booking_ref: string;
  /** Client name */
  client_name: string;
  /** Client external ID for accounting system */
  client_external_id: string | null;
  /** Client internal ID */
  client_id?: number;
  /** Sale/invoice date */
  sale_date: string;
  /** Issue date */
  issue_date?: string;
  /** Due date for payment */
  due_date?: string;
  /** Total gross amount */
  total_gross: number;
  /** Line items on the invoice */
  line_items: InvoiceLineItem[];
  /** Invoice batch ID */
  invoice_batch_id?: number;
}

/**
 * Invoice batch detail - batch with all its invoices
 */
export interface InvoiceBatchDetail extends InvoiceBatch {
  /** Invoices in this batch */
  invoices: Invoice[];
}

// ============================================================================
// Invoice Batch Preview Types
// ============================================================================

/**
 * Client skipped in invoice preview (e.g., not their invoice day)
 */
export interface SkippedClient {
  /** Client ID */
  client_id: number;
  /** Client name */
  client_name: string;
  /** Reason for skipping */
  reason: string;
}

/**
 * Preview of an invoice batch before creation
 */
export interface InvoiceBatchPreview {
  /** Number of invoices that would be created */
  invoice_count: number;
  /** Total number of line items */
  line_item_count: number;
  /** Total amount of all invoices */
  total_amount: number;
  /** Invoices that would be created */
  invoices: Invoice[];
  /** Clients that were skipped */
  skipped_clients: SkippedClient[];
}

/**
 * Request to execute/create an invoice batch
 */
export interface InvoiceBatchExecuteRequest {
  /** Issue date for the invoices */
  issue_date: string;
  /** Include clients not due on this date */
  include_not_due?: boolean;
}

/**
 * Response from invoice batch execution
 */
export interface InvoiceBatchExecuteResponse {
  /** Whether the operation succeeded */
  success: boolean;
  /** ID of the created batch */
  batch_id: number;
  /** Human-readable message */
  message: string;
  /** Number of invoices created */
  invoice_count: number;
  /** Total amount of created invoices */
  total_amount: number;
}
