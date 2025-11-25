/**
 * GL Rules GraphQL Hooks
 *
 * Provides data fetching and mutation hooks for GL rules.
 * Rules are tied to gl_rule_set_id and specify which account_id to use.
 * Uses GraphQL via Hasura with tenant-aware table naming.
 */

import { useCallback } from 'react';
import { useGraphQL } from './useGraphQL';
import { useAuth } from './useAuth';
import { DEFAULT_TENANT } from '../lib/config';
import { GLRule, RuleType, RuleFormData } from '../types/gl-rules';

export function useGLRules() {
  const { query, mutate } = useGraphQL();
  const { tenant } = useAuth();
  const tenantName = tenant?.name || DEFAULT_TENANT;

  // Table name with tenant prefix
  const rulesTable = `${tenantName}_gl_rules`;
  const accountsTable = `${tenantName}_accounts`;

  /**
   * Fetch all rules for a specific rule set
   */
  const fetchRulesByRuleSet = useCallback(
    async (ruleSetId: number): Promise<GLRule[]> => {
      const q = `
        query GetGLRules($ruleSetId: Int!) {
          gl_rules: ${rulesTable}(
            where: {
              gl_rule_set_id: { _eq: $ruleSetId }
              deleted: { _eq: false }
            }
            order_by: [{ rule_type: asc }]
          ) {
            id
            gl_rule_set_id
            rule_type
            target_id
            account_id
            deleted
            created_at
            updated_at
            account: ${accountsTable.replace(tenantName + '_', '')}(where: { deleted: { _eq: false } }) {
              id
              name
              external_id
            }
          }
        }
      `;

      // Try query with join first, fall back to simple query if relationship doesn't exist
      try {
        const response = await query<{
          gl_rules: Array<{
            id: number;
            gl_rule_set_id: number;
            rule_type: string;
            target_id: number | null;
            account_id: number;
            deleted: boolean;
            created_at: string;
            updated_at: string;
            account?: { id: number; name: string; external_id: string };
          }>;
        }>(q, { ruleSetId });

        return response.data.gl_rules.map((r) => ({
          id: r.id,
          gl_rule_set_id: r.gl_rule_set_id,
          rule_type: r.rule_type as RuleType,
          target_id: r.target_id,
          account_id: r.account_id,
          deleted: r.deleted,
          created_at: r.created_at,
          updated_at: r.updated_at,
          account_name: r.account?.name,
          account_external_id: r.account?.external_id,
        }));
      } catch {
        // Fallback without relationship join
        const simpleQ = `
          query GetGLRulesSimple($ruleSetId: Int!) {
            gl_rules: ${rulesTable}(
              where: {
                gl_rule_set_id: { _eq: $ruleSetId }
                deleted: { _eq: false }
              }
              order_by: [{ rule_type: asc }]
            ) {
              id
              gl_rule_set_id
              rule_type
              target_id
              account_id
              deleted
              created_at
              updated_at
            }
          }
        `;

        const response = await query<{
          gl_rules: Array<{
            id: number;
            gl_rule_set_id: number;
            rule_type: string;
            target_id: number | null;
            account_id: number;
            deleted: boolean;
            created_at: string;
            updated_at: string;
          }>;
        }>(simpleQ, { ruleSetId });

        return response.data.gl_rules.map((r) => ({
          id: r.id,
          gl_rule_set_id: r.gl_rule_set_id,
          rule_type: r.rule_type as RuleType,
          target_id: r.target_id,
          account_id: r.account_id,
          deleted: r.deleted,
          created_at: r.created_at,
          updated_at: r.updated_at,
        }));
      }
    },
    [query, rulesTable, accountsTable, tenantName]
  );

  /**
   * Create a new rule for a rule set
   */
  const createRule = async (
    ruleSetId: number,
    data: RuleFormData
  ): Promise<GLRule> => {
    const m = `
      mutation CreateGLRule($rule: ${rulesTable}_insert_input!) {
        insert_${rulesTable}_one(object: $rule) {
          id
          gl_rule_set_id
          rule_type
          target_id
          account_id
          deleted
          created_at
          updated_at
        }
      }
    `;

    const ruleInput = {
      gl_rule_set_id: ruleSetId,
      rule_type: data.rule_type,
      target_id: data.target_id,
      account_id: data.account_id,
    };

    const response = await mutate<
      Record<
        string,
        {
          id: number;
          gl_rule_set_id: number;
          rule_type: string;
          target_id: number | null;
          account_id: number;
          deleted: boolean;
          created_at: string;
          updated_at: string;
        }
      >
    >(m, { rule: ruleInput });

    const insertKey = `insert_${rulesTable}_one`;
    const result = response.data[insertKey];

    return {
      id: result.id,
      gl_rule_set_id: result.gl_rule_set_id,
      rule_type: result.rule_type as RuleType,
      target_id: result.target_id,
      account_id: result.account_id,
      deleted: result.deleted,
      created_at: result.created_at,
      updated_at: result.updated_at,
    };
  };

  /**
   * Update an existing rule
   */
  const updateRule = async (
    ruleId: number,
    data: Partial<RuleFormData>
  ): Promise<GLRule> => {
    const m = `
      mutation UpdateGLRule($id: Int!, $updates: ${rulesTable}_set_input!) {
        update_${rulesTable}_by_pk(
          pk_columns: { id: $id }
          _set: $updates
        ) {
          id
          gl_rule_set_id
          rule_type
          target_id
          account_id
          deleted
          created_at
          updated_at
        }
      }
    `;

    const response = await mutate<
      Record<
        string,
        {
          id: number;
          gl_rule_set_id: number;
          rule_type: string;
          target_id: number | null;
          account_id: number;
          deleted: boolean;
          created_at: string;
          updated_at: string;
        }
      >
    >(m, { id: ruleId, updates: data });

    const updateKey = `update_${rulesTable}_by_pk`;
    const result = response.data[updateKey];

    return {
      id: result.id,
      gl_rule_set_id: result.gl_rule_set_id,
      rule_type: result.rule_type as RuleType,
      target_id: result.target_id,
      account_id: result.account_id,
      deleted: result.deleted,
      created_at: result.created_at,
      updated_at: result.updated_at,
    };
  };

  /**
   * Soft delete a rule
   */
  const deleteRule = async (ruleId: number): Promise<boolean> => {
    const m = `
      mutation DeleteGLRule($id: Int!) {
        update_${rulesTable}_by_pk(
          pk_columns: { id: $id }
          _set: { deleted: true }
        ) {
          id
        }
      }
    `;

    await mutate(m, { id: ruleId });
    return true;
  };

  /**
   * Check if a default rule exists for a rule set
   */
  const hasDefaultRule = useCallback(
    async (ruleSetId: number): Promise<boolean> => {
      const q = `
        query CheckDefaultRule($ruleSetId: Int!) {
          gl_rules: ${rulesTable}(
            where: {
              gl_rule_set_id: { _eq: $ruleSetId }
              rule_type: { _eq: "default" }
              deleted: { _eq: false }
            }
          ) {
            id
          }
        }
      `;

      const response = await query<{ gl_rules: { id: number }[] }>(q, { ruleSetId });
      return response.data.gl_rules.length > 0;
    },
    [query, rulesTable]
  );

  /**
   * Copy rules from one rule set to another
   */
  const copyRulesFromRuleSet = async (
    sourceRuleSetId: number,
    targetRuleSetId: number
  ): Promise<GLRule[]> => {
    // First fetch rules from source rule set
    const sourceRules = await fetchRulesByRuleSet(sourceRuleSetId);

    // Create new rules for target rule set
    const createdRules: GLRule[] = [];
    for (const rule of sourceRules) {
      const newRule = await createRule(targetRuleSetId, {
        rule_type: rule.rule_type,
        target_id: rule.target_id,
        account_id: rule.account_id,
      });
      createdRules.push(newRule);
    }

    return createdRules;
  };

  /**
   * Bulk create rules for a rule set
   */
  const bulkCreateRules = async (
    ruleSetId: number,
    rules: RuleFormData[]
  ): Promise<GLRule[]> => {
    const ruleObjects = rules.map((rule) => ({
      gl_rule_set_id: ruleSetId,
      rule_type: rule.rule_type,
      target_id: rule.target_id,
      account_id: rule.account_id,
    }));

    const m = `
      mutation BulkCreateGLRules($rules: [${rulesTable}_insert_input!]!) {
        insert_${rulesTable}(objects: $rules) {
          returning {
            id
            gl_rule_set_id
            rule_type
            target_id
            account_id
            deleted
            created_at
            updated_at
          }
        }
      }
    `;

    const response = await mutate<
      Record<
        string,
        {
          returning: Array<{
            id: number;
            gl_rule_set_id: number;
            rule_type: string;
            target_id: number | null;
            account_id: number;
            deleted: boolean;
            created_at: string;
            updated_at: string;
          }>;
        }
      >
    >(m, { rules: ruleObjects });

    const insertKey = `insert_${rulesTable}`;
    return response.data[insertKey].returning.map((r) => ({
      id: r.id,
      gl_rule_set_id: r.gl_rule_set_id,
      rule_type: r.rule_type as RuleType,
      target_id: r.target_id,
      account_id: r.account_id,
      deleted: r.deleted,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  };

  return {
    fetchRulesByRuleSet,
    createRule,
    updateRule,
    deleteRule,
    hasDefaultRule,
    copyRulesFromRuleSet,
    bulkCreateRules,
  };
}
