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
export type GLRuleSetType = 'revenue' | 'commission';

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
  type: GLRuleSetType; // 'revenue' or 'commission'
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
};

/**
 * Lane IDs for timeline component
 */
export const LANE_IDS: Record<GLRuleSetType, number> = {
  revenue: 0,
  commission: 1,
};

/**
 * Get rule set type from lane ID
 */
export function getRuleSetTypeFromLaneId(laneId: number | null): GLRuleSetType {
  return laneId === 1 ? 'commission' : 'revenue';
}

/**
 * Get lane ID from rule set type
 */
export function getLaneIdFromRuleSetType(type: GLRuleSetType): number {
  return type === 'commission' ? 1 : 0;
}
