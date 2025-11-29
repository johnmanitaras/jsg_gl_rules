/**
 * Accounts GraphQL Hooks
 *
 * Provides data fetching and mutation hooks for GL accounts.
 * Uses GraphQL via Hasura with multi-tenant architecture.
 * Tenant is specified via X-Hasura-Tenant-Id header (handled by useGraphQL).
 */

import { useCallback } from 'react';
import { useGraphQL } from './useGraphQL';
import { Account, AccountFormData } from '../types/gl-rules';

// Static table name using reference schema (tenant specified via header)
const ACCOUNTS_TABLE = 'jsg_reference_schema_accounts';

export function useAccounts() {
  const { query, mutate } = useGraphQL();

  /**
   * Fetch all active accounts
   */
  const fetchAccounts = useCallback(async (): Promise<Account[]> => {
    const q = `
      query GetAccounts {
        accounts: ${ACCOUNTS_TABLE}(
          where: { deleted: { _eq: false } }
          order_by: { name: asc }
        ) {
          id
          name
          external_id
          deleted
          created_at
          updated_at
        }
      }
    `;

    const response = await query<{ accounts: Account[] }>(q);
    return response.data.accounts;
  }, [query]);

  /**
   * Fetch a single account by ID
   */
  const fetchAccount = useCallback(async (accountId: number): Promise<Account> => {
    const q = `
      query GetAccount($id: Int!) {
        account: jsg_reference_schema_accounts_by_pk(id: $id) {
          id
          name
          external_id
          deleted
          created_at
          updated_at
        }
      }
    `;

    const response = await query<{ account: Account }>(q, { id: accountId });

    if (!response.data.account) {
      throw new Error(`Account with ID ${accountId} not found`);
    }

    return response.data.account;
  }, [query]);

  /**
   * Create a new account
   */
  const createAccount = async (data: AccountFormData): Promise<Account> => {
    const m = `
      mutation CreateAccount($account: jsg_reference_schema_accounts_insert_input!) {
        insert_jsg_reference_schema_accounts_one(object: $account) {
          id
          name
          external_id
          deleted
          created_at
          updated_at
        }
      }
    `;

    const accountInput = {
      name: data.name,
      external_id: data.external_id,
    };

    const response = await mutate<{ insert_jsg_reference_schema_accounts_one: Account }>(m, { account: accountInput });

    return response.data.insert_jsg_reference_schema_accounts_one;
  };

  /**
   * Update an existing account
   */
  const updateAccount = async (
    accountId: number,
    data: Partial<AccountFormData>
  ): Promise<Account> => {
    const m = `
      mutation UpdateAccount($id: Int!, $updates: jsg_reference_schema_accounts_set_input!) {
        update_jsg_reference_schema_accounts_by_pk(
          pk_columns: { id: $id }
          _set: $updates
        ) {
          id
          name
          external_id
          deleted
          created_at
          updated_at
        }
      }
    `;

    const response = await mutate<{ update_jsg_reference_schema_accounts_by_pk: Account }>(m, {
      id: accountId,
      updates: data,
    });

    return response.data.update_jsg_reference_schema_accounts_by_pk;
  };

  /**
   * Soft delete an account
   */
  const deleteAccount = async (accountId: number): Promise<boolean> => {
    const m = `
      mutation DeleteAccount($id: Int!) {
        update_jsg_reference_schema_accounts_by_pk(
          pk_columns: { id: $id }
          _set: { deleted: true }
        ) {
          id
        }
      }
    `;

    await mutate(m, { id: accountId });
    return true;
  };

  /**
   * Check if an external_id is already in use
   */
  const checkExternalIdExists = useCallback(
    async (externalId: string, excludeAccountId?: number): Promise<boolean> => {
      const whereClause = excludeAccountId
        ? `{
            external_id: { _eq: $externalId }
            deleted: { _eq: false }
            id: { _neq: $excludeAccountId }
          }`
        : `{
            external_id: { _eq: $externalId }
            deleted: { _eq: false }
          }`;

      const q = `
        query CheckExternalId($externalId: String!${excludeAccountId ? ', $excludeAccountId: Int!' : ''}) {
          accounts: ${ACCOUNTS_TABLE}(
            where: ${whereClause}
          ) {
            id
          }
        }
      `;

      const variables = excludeAccountId
        ? { externalId, excludeAccountId }
        : { externalId };

      const response = await query<{ accounts: { id: number }[] }>(q, variables);
      return response.data.accounts.length > 0;
    },
    [query]
  );

  return {
    fetchAccounts,
    fetchAccount,
    createAccount,
    updateAccount,
    deleteAccount,
    checkExternalIdExists,
  };
}
