/**
 * GL Rules GraphQL Hooks
 *
 * Provides data fetching and mutation hooks for GL rules.
 * Rules are tied to gl_rule_set_id and specify which account_id to use.
 * Uses GraphQL via Hasura with multi-tenant architecture.
 * Tenant is specified via X-Hasura-Tenant-Id header (handled by useGraphQL).
 */

import { useCallback } from 'react';
import { useGraphQL } from './useGraphQL';
import { GLRule, RuleType, RuleFormData } from '../types/gl-rules';

// Static table names using reference schema (tenant specified via header)
const RULES_TABLE = 'jsg_reference_schema_gl_rules';
const ACCOUNTS_TABLE = 'jsg_reference_schema_accounts';

export function useGLRules() {
  const { query, mutate } = useGraphQL();

  /**
   * Fetch all rules for a specific rule set
   */
  const fetchRulesByRuleSet = useCallback(
    async (ruleSetId: number): Promise<GLRule[]> => {
      const q = `
        query GetGLRules($ruleSetId: Int!) {
          gl_rules: ${RULES_TABLE}(
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
            account: accounts(where: { deleted: { _eq: false } }) {
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
            gl_rules: ${RULES_TABLE}(
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
    [query]
  );

  /**
   * Create a new rule for a rule set
   */
  const createRule = async (
    ruleSetId: number,
    data: RuleFormData
  ): Promise<GLRule> => {
    const m = `
      mutation CreateGLRule($rule: jsg_reference_schema_gl_rules_insert_input!) {
        insert_jsg_reference_schema_gl_rules_one(object: $rule) {
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

    const response = await mutate<{
      insert_jsg_reference_schema_gl_rules_one: {
        id: number;
        gl_rule_set_id: number;
        rule_type: string;
        target_id: number | null;
        account_id: number;
        deleted: boolean;
        created_at: string;
        updated_at: string;
      };
    }>(m, { rule: ruleInput });

    const result = response.data.insert_jsg_reference_schema_gl_rules_one;

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
      mutation UpdateGLRule($id: Int!, $updates: jsg_reference_schema_gl_rules_set_input!) {
        update_jsg_reference_schema_gl_rules_by_pk(
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

    const response = await mutate<{
      update_jsg_reference_schema_gl_rules_by_pk: {
        id: number;
        gl_rule_set_id: number;
        rule_type: string;
        target_id: number | null;
        account_id: number;
        deleted: boolean;
        created_at: string;
        updated_at: string;
      };
    }>(m, { id: ruleId, updates: data });

    const result = response.data.update_jsg_reference_schema_gl_rules_by_pk;

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
        update_jsg_reference_schema_gl_rules_by_pk(
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
          gl_rules: ${RULES_TABLE}(
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
    [query]
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
      mutation BulkCreateGLRules($rules: [jsg_reference_schema_gl_rules_insert_input!]!) {
        insert_jsg_reference_schema_gl_rules(objects: $rules) {
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

    const response = await mutate<{
      insert_jsg_reference_schema_gl_rules: {
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
      };
    }>(m, { rules: ruleObjects });

    return response.data.insert_jsg_reference_schema_gl_rules.returning.map((r) => ({
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
