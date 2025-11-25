/**
 * GL Rule Sets GraphQL Hooks
 *
 * Provides data fetching and mutation hooks for GL rule sets.
 * Rule sets are time-based containers with a type (revenue or commission).
 * Uses GraphQL via Hasura with tenant-aware table naming.
 */

import { useCallback } from 'react';
import { useGraphQL } from './useGraphQL';
import { useAuth } from './useAuth';
import { DEFAULT_TENANT } from '../lib/config';
import { GLRuleSet, GLRuleSetType, RuleSetFormData } from '../types/gl-rules';

export function useGLRuleSets() {
  const { query, mutate } = useGraphQL();
  const { tenant } = useAuth();
  const tenantName = tenant?.name || DEFAULT_TENANT;

  // Table name with tenant prefix
  const ruleSetsTable = `${tenantName}_gl_rule_sets`;

  /**
   * Fetch all active rule sets (both revenue and commission)
   */
  const fetchAllRuleSets = useCallback(async (): Promise<GLRuleSet[]> => {
    const q = `
      query GetAllGLRuleSets {
        gl_rule_sets: ${ruleSetsTable}(
          where: { deleted: { _eq: false } }
          order_by: { start_date: asc }
        ) {
          id
          name
          start_date
          end_date
          type
          deleted
          created_at
          updated_at
        }
      }
    `;

    const response = await query<{ gl_rule_sets: GLRuleSet[] }>(q);
    return response.data.gl_rule_sets;
  }, [query, ruleSetsTable]);

  /**
   * Fetch rule sets by type (revenue or commission)
   */
  const fetchRuleSetsByType = useCallback(
    async (type: GLRuleSetType): Promise<GLRuleSet[]> => {
      const q = `
        query GetGLRuleSetsByType($type: String!) {
          gl_rule_sets: ${ruleSetsTable}(
            where: {
              type: { _eq: $type }
              deleted: { _eq: false }
            }
            order_by: { start_date: asc }
          ) {
            id
            name
            start_date
            end_date
            type
            deleted
            created_at
            updated_at
          }
        }
      `;

      const response = await query<{ gl_rule_sets: GLRuleSet[] }>(q, { type });
      return response.data.gl_rule_sets;
    },
    [query, ruleSetsTable]
  );

  /**
   * Fetch a single rule set by ID
   */
  const fetchRuleSet = useCallback(
    async (ruleSetId: number): Promise<GLRuleSet> => {
      const q = `
        query GetGLRuleSet($id: Int!) {
          gl_rule_set: ${ruleSetsTable}_by_pk(id: $id) {
            id
            name
            start_date
            end_date
            type
            deleted
            created_at
            updated_at
          }
        }
      `;

      const response = await query<{ gl_rule_set: GLRuleSet }>(q, { id: ruleSetId });

      if (!response.data.gl_rule_set) {
        throw new Error(`GL Rule Set with ID ${ruleSetId} not found`);
      }

      return response.data.gl_rule_set;
    },
    [query, ruleSetsTable]
  );

  /**
   * Create a new rule set
   */
  const createRuleSet = async (data: RuleSetFormData): Promise<GLRuleSet> => {
    const m = `
      mutation CreateGLRuleSet($ruleSet: ${ruleSetsTable}_insert_input!) {
        insert_${ruleSetsTable}_one(object: $ruleSet) {
          id
          name
          start_date
          end_date
          type
          deleted
          created_at
          updated_at
        }
      }
    `;

    const ruleSetInput = {
      name: data.name,
      start_date: data.start_date,
      end_date: data.end_date,
      type: data.type,
    };

    const response = await mutate<Record<string, GLRuleSet>>(m, { ruleSet: ruleSetInput });

    const insertKey = `insert_${ruleSetsTable}_one`;
    return response.data[insertKey];
  };

  /**
   * Update an existing rule set
   */
  const updateRuleSet = async (
    ruleSetId: number,
    data: Partial<RuleSetFormData>
  ): Promise<GLRuleSet> => {
    const m = `
      mutation UpdateGLRuleSet($id: Int!, $updates: ${ruleSetsTable}_set_input!) {
        update_${ruleSetsTable}_by_pk(
          pk_columns: { id: $id }
          _set: $updates
        ) {
          id
          name
          start_date
          end_date
          type
          deleted
          created_at
          updated_at
        }
      }
    `;

    const response = await mutate<Record<string, GLRuleSet>>(m, {
      id: ruleSetId,
      updates: data,
    });

    const updateKey = `update_${ruleSetsTable}_by_pk`;
    return response.data[updateKey];
  };

  /**
   * Soft delete a rule set
   */
  const deleteRuleSet = async (ruleSetId: number): Promise<boolean> => {
    const m = `
      mutation DeleteGLRuleSet($id: Int!) {
        update_${ruleSetsTable}_by_pk(
          pk_columns: { id: $id }
          _set: { deleted: true }
        ) {
          id
        }
      }
    `;

    await mutate(m, { id: ruleSetId });
    return true;
  };

  /**
   * Check for overlapping rule sets within the same type
   * Revenue rule sets can overlap with commission rule sets, but not with other revenue rule sets
   */
  const checkOverlap = useCallback(
    async (
      type: GLRuleSetType,
      startDate: string,
      endDate: string,
      excludeRuleSetId?: number
    ): Promise<boolean> => {
      const whereClause = excludeRuleSetId
        ? `{
            type: { _eq: $type }
            deleted: { _eq: false }
            id: { _neq: $excludeRuleSetId }
            _or: [
              { start_date: { _lte: $endDate }, end_date: { _gte: $startDate } }
            ]
          }`
        : `{
            type: { _eq: $type }
            deleted: { _eq: false }
            _or: [
              { start_date: { _lte: $endDate }, end_date: { _gte: $startDate } }
            ]
          }`;

      const q = `
        query CheckRuleSetOverlap($type: String!, $startDate: date!, $endDate: date!${
          excludeRuleSetId ? ', $excludeRuleSetId: Int!' : ''
        }) {
          gl_rule_sets: ${ruleSetsTable}(
            where: ${whereClause}
          ) {
            id
          }
        }
      `;

      const variables = excludeRuleSetId
        ? { type, startDate, endDate, excludeRuleSetId }
        : { type, startDate, endDate };

      const response = await query<{ gl_rule_sets: { id: number }[] }>(q, variables);
      return response.data.gl_rule_sets.length > 0;
    },
    [query, ruleSetsTable]
  );

  return {
    fetchAllRuleSets,
    fetchRuleSetsByType,
    fetchRuleSet,
    createRuleSet,
    updateRuleSet,
    deleteRuleSet,
    checkOverlap,
  };
}
