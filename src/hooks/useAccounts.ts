/**
 * Accounts GraphQL Hooks
 *
 * Provides data fetching and mutation hooks for GL accounts.
 * Uses GraphQL via Hasura with tenant-aware table naming.
 */

import { useCallback } from 'react';
import { useGraphQL } from './useGraphQL';
import { useAuth } from './useAuth';
import { DEFAULT_TENANT } from '../lib/config';
import { Account, AccountFormData } from '../types/gl-rules';

export function useAccounts() {
  const { query, mutate } = useGraphQL();
  const { tenant } = useAuth();
  const tenantName = tenant?.name || DEFAULT_TENANT;

  // Table name with tenant prefix
  const accountsTable = `${tenantName}_accounts`;

  /**
   * Fetch all active accounts
   */
  const fetchAccounts = useCallback(async (): Promise<Account[]> => {
    const q = `
      query GetAccounts {
        accounts: ${accountsTable}(
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
  }, [query, accountsTable]);

  /**
   * Fetch a single account by ID
   */
  const fetchAccount = useCallback(async (accountId: number): Promise<Account> => {
    const q = `
      query GetAccount($id: Int!) {
        account: ${accountsTable}_by_pk(id: $id) {
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
  }, [query, accountsTable]);

  /**
   * Create a new account
   */
  const createAccount = async (data: AccountFormData): Promise<Account> => {
    const m = `
      mutation CreateAccount($account: ${accountsTable}_insert_input!) {
        insert_${accountsTable}_one(object: $account) {
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

    const response = await mutate<Record<string, Account>>(m, { account: accountInput });

    const insertKey = `insert_${accountsTable}_one`;
    return response.data[insertKey];
  };

  /**
   * Update an existing account
   */
  const updateAccount = async (
    accountId: number,
    data: Partial<AccountFormData>
  ): Promise<Account> => {
    const m = `
      mutation UpdateAccount($id: Int!, $updates: ${accountsTable}_set_input!) {
        update_${accountsTable}_by_pk(
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

    const response = await mutate<Record<string, Account>>(m, {
      id: accountId,
      updates: data,
    });

    const updateKey = `update_${accountsTable}_by_pk`;
    return response.data[updateKey];
  };

  /**
   * Soft delete an account
   */
  const deleteAccount = async (accountId: number): Promise<boolean> => {
    const m = `
      mutation DeleteAccount($id: Int!) {
        update_${accountsTable}_by_pk(
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
          accounts: ${accountsTable}(
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
    [query, accountsTable]
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
