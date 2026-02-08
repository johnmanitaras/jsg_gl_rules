/**
 * Batch Export Status Hook
 *
 * Provides GraphQL mutations for managing the three-state export workflow:
 *   Pending → Exported → Posted
 *
 * Operations:
 * - markAsPosted: Sets posted_at and posted_by (batch confirmed in accounting system)
 * - resetToPending: Clears all export tracking fields (re-process from scratch)
 * - resetToExported: Clears posted_at/posted_by only (un-marks "posted")
 *
 * These use Hasura GraphQL mutations (simple column updates, no REST endpoint needed).
 */

import { useCallback, useState } from 'react';
import { useGraphQL } from './useGraphQL';
import { useAuth } from './useAuth';
import { BatchType } from '../types/gl-rules';

type BatchTable = 'sales_batch_runs' | 'payment_batch_runs' | 'invoice_batches';

function getTableName(batchType: BatchType): BatchTable {
  return batchType === 'sales' ? 'sales_batch_runs' : 'payment_batch_runs';
}

export function useBatchExportStatus() {
  const { mutate } = useGraphQL();
  const { userId } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Mark a batch as posted (confirmed in accounting system)
   */
  const markAsPosted = useCallback(
    async (id: number, table: BatchTable): Promise<boolean> => {
      setUpdating(true);
      setError(null);

      const mutation = `
        mutation MarkBatchPosted($id: Int!, $posted_at: timestamp!, $posted_by: String!) {
          update_jsg_reference_schema_${table}_by_pk(
            pk_columns: { id: $id }
            _set: { posted_at: $posted_at, posted_by: $posted_by }
          ) {
            id
            posted_at
            posted_by
          }
        }
      `;

      try {
        const result = await mutate(mutation, {
          id,
          posted_at: new Date().toISOString(),
          posted_by: userId || 'unknown',
        });

        if (result.errors) {
          const msg = result.errors[0]?.message || 'Failed to mark as posted';
          setError(msg);
          return false;
        }

        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to mark as posted';
        setError(msg);
        return false;
      } finally {
        setUpdating(false);
      }
    },
    [mutate, userId]
  );

  /**
   * Reset a batch to pending (clear all export tracking)
   */
  const resetToPending = useCallback(
    async (id: number, table: BatchTable): Promise<boolean> => {
      setUpdating(true);
      setError(null);

      const setFields = table === 'invoice_batches'
        ? '{ exported_at: null, exported_by: null, posted_at: null, posted_by: null }'
        : '{ exported_at: null, exported_by: null, posted_at: null, posted_by: null }';

      const mutation = `
        mutation ResetBatchToPending($id: Int!) {
          update_jsg_reference_schema_${table}_by_pk(
            pk_columns: { id: $id }
            _set: ${setFields}
          ) {
            id
          }
        }
      `;

      try {
        const result = await mutate(mutation, { id });

        if (result.errors) {
          const msg = result.errors[0]?.message || 'Failed to reset status';
          setError(msg);
          return false;
        }

        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to reset status';
        setError(msg);
        return false;
      } finally {
        setUpdating(false);
      }
    },
    [mutate]
  );

  /**
   * Reset a batch to exported (clear posted fields only)
   */
  const resetToExported = useCallback(
    async (id: number, table: BatchTable): Promise<boolean> => {
      setUpdating(true);
      setError(null);

      const mutation = `
        mutation ResetBatchToExported($id: Int!) {
          update_jsg_reference_schema_${table}_by_pk(
            pk_columns: { id: $id }
            _set: { posted_at: null, posted_by: null }
          ) {
            id
          }
        }
      `;

      try {
        const result = await mutate(mutation, { id });

        if (result.errors) {
          const msg = result.errors[0]?.message || 'Failed to reset status';
          setError(msg);
          return false;
        }

        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to reset status';
        setError(msg);
        return false;
      } finally {
        setUpdating(false);
      }
    },
    [mutate]
  );

  /**
   * Mark a batch as exported (manually set exported status without downloading)
   */
  const markAsExported = useCallback(
    async (id: number, table: BatchTable): Promise<boolean> => {
      setUpdating(true);
      setError(null);

      const mutation = `
        mutation MarkBatchExported($id: Int!, $exported_at: timestamp!, $exported_by: String!) {
          update_jsg_reference_schema_${table}_by_pk(
            pk_columns: { id: $id }
            _set: { exported_at: $exported_at, exported_by: $exported_by }
          ) {
            id
            exported_at
            exported_by
          }
        }
      `;

      try {
        const result = await mutate(mutation, {
          id,
          exported_at: new Date().toISOString(),
          exported_by: userId || 'unknown',
        });

        if (result.errors) {
          const msg = result.errors[0]?.message || 'Failed to mark as exported';
          setError(msg);
          return false;
        }

        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to mark as exported';
        setError(msg);
        return false;
      } finally {
        setUpdating(false);
      }
    },
    [mutate, userId]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    markAsExported,
    markAsPosted,
    resetToPending,
    resetToExported,
    updating,
    error,
    clearError,
    getTableName,
  };
}
