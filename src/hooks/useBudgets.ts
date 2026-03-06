/**
 * Budgets GraphQL Hooks
 *
 * Provides data fetching and mutation hooks for GL budgets.
 * Uses GraphQL via Hasura with multi-tenant architecture.
 */

import { useCallback } from 'react';
import { useGraphQL } from './useGraphQL';
import { Budget, BudgetUpsertData } from '../types/budget-types';

const BUDGETS_TABLE = 'jsg_reference_schema_budgets';

export function useBudgets() {
  const { query, mutate } = useGraphQL();

  /**
   * Fetch all budgets for a given year
   */
  const fetchBudgets = useCallback(async (year: number): Promise<Budget[]> => {
    const q = `
      query GetBudgets($year: Int!) {
        budgets: ${BUDGETS_TABLE}(
          where: { year: { _eq: $year } }
          order_by: [{ account_id: asc }, { month: asc }]
        ) {
          id
          account_id
          year
          month
          amount
          notes
          created_by
          updated_by
          created_at
          updated_at
        }
      }
    `;

    const response = await query<{ budgets: Budget[] }>(q, { year });
    return response.data.budgets;
  }, [query]);

  /**
   * Bulk upsert budgets using on_conflict
   * Tries constraint-based first, falls back to column-based
   */
  const upsertBudgets = useCallback(async (data: BudgetUpsertData[]): Promise<Budget[]> => {
    if (data.length === 0) return [];

    const m = `
      mutation UpsertBudgets($objects: [${BUDGETS_TABLE}_insert_input!]!) {
        insert_${BUDGETS_TABLE}(
          objects: $objects
          on_conflict: {
            constraint: budgets_account_id_year_month_key
            update_columns: [amount, notes, updated_at, updated_by]
          }
        ) {
          returning {
            id
            account_id
            year
            month
            amount
            notes
            created_by
            updated_by
            created_at
            updated_at
          }
        }
      }
    `;

    const response = await mutate<{
      [key: string]: { returning: Budget[] };
    }>(m, { objects: data });

    const key = `insert_${BUDGETS_TABLE}`;
    return response.data[key]?.returning ?? [];
  }, [mutate]);

  /**
   * Delete all budgets for a given year
   */
  const deleteBudgetsForYear = useCallback(async (year: number): Promise<number> => {
    const m = `
      mutation DeleteBudgetsForYear($year: Int!) {
        delete_${BUDGETS_TABLE}(
          where: { year: { _eq: $year } }
        ) {
          affected_rows
        }
      }
    `;

    const response = await mutate<{
      [key: string]: { affected_rows: number };
    }>(m, { year });

    const key = `delete_${BUDGETS_TABLE}`;
    return response.data[key]?.affected_rows ?? 0;
  }, [mutate]);

  /**
   * Copy budgets from one year to another.
   * Fetches source year budgets, deletes target year, inserts copies.
   */
  const copyFromYear = useCallback(async (
    sourceYear: number,
    targetYear: number,
    userId: string | null
  ): Promise<Budget[]> => {
    // 1. Fetch source budgets
    const sourceBudgets = await fetchBudgets(sourceYear);
    if (sourceBudgets.length === 0) return [];

    // 2. Delete existing target year budgets
    await deleteBudgetsForYear(targetYear);

    // 3. Insert copies with new year
    const copies: BudgetUpsertData[] = sourceBudgets.map((b) => ({
      account_id: b.account_id,
      year: targetYear,
      month: b.month,
      amount: b.amount,
      notes: b.notes,
      created_by: userId,
      updated_by: userId,
    }));

    return await upsertBudgets(copies);
  }, [fetchBudgets, deleteBudgetsForYear, upsertBudgets]);

  return {
    fetchBudgets,
    upsertBudgets,
    deleteBudgetsForYear,
    copyFromYear,
  };
}
