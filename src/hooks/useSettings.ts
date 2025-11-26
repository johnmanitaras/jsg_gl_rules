/**
 * Settings GraphQL Hooks
 *
 * Provides data fetching and mutation hooks for application settings.
 * Uses GraphQL via Hasura with tenant-aware table naming.
 */

import { useCallback } from 'react';
import { useGraphQL } from './useGraphQL';
import { useAuth } from './useAuth';
import { DEFAULT_TENANT } from '../lib/config';

export interface Setting {
  id: number;
  setting_name: string;
  setting_value: string | null;
}

export function useSettings() {
  const { query, mutate } = useGraphQL();
  const { tenant } = useAuth();
  const tenantName = tenant?.name || DEFAULT_TENANT;

  // Table name with tenant prefix
  const settingsTable = `${tenantName}_settings`;

  /**
   * Fetch a setting by name
   */
  const fetchSettingByName = useCallback(
    async (settingName: string): Promise<Setting | null> => {
      const q = `
        query GetSettingByName($settingName: String!) {
          settings: ${settingsTable}(
            where: { setting_name: { _eq: $settingName } }
            limit: 1
          ) {
            id
            setting_name
            setting_value
          }
        }
      `;

      const response = await query<{ settings: Setting[] }>(q, { settingName });
      return response.data.settings[0] || null;
    },
    [query, settingsTable]
  );

  /**
   * Update a setting value by name
   * If the setting doesn't exist, it will be created
   */
  const updateSettingByName = useCallback(
    async (settingName: string, settingValue: string | null): Promise<Setting> => {
      // First check if the setting exists
      const existing = await fetchSettingByName(settingName);

      if (existing) {
        // Update existing setting
        const m = `
          mutation UpdateSetting($id: Int!, $settingValue: String) {
            update_${settingsTable}_by_pk(
              pk_columns: { id: $id }
              _set: { setting_value: $settingValue }
            ) {
              id
              setting_name
              setting_value
            }
          }
        `;

        const response = await mutate<Record<string, Setting>>(m, {
          id: existing.id,
          settingValue,
        });

        const updateKey = `update_${settingsTable}_by_pk`;
        return response.data[updateKey];
      } else {
        // Create new setting
        const m = `
          mutation CreateSetting($setting: ${settingsTable}_insert_input!) {
            insert_${settingsTable}_one(object: $setting) {
              id
              setting_name
              setting_value
            }
          }
        `;

        const response = await mutate<Record<string, Setting>>(m, {
          setting: {
            setting_name: settingName,
            setting_value: settingValue,
          },
        });

        const insertKey = `insert_${settingsTable}_one`;
        return response.data[insertKey];
      }
    },
    [mutate, settingsTable, fetchSettingByName]
  );

  /**
   * Get the payment surcharge account setting
   */
  const getPaymentSurchargeAccount = useCallback(async (): Promise<number | null> => {
    const setting = await fetchSettingByName('payment_surcharge_account');
    if (setting?.setting_value) {
      const parsed = parseInt(setting.setting_value, 10);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }, [fetchSettingByName]);

  /**
   * Set the payment surcharge account setting
   */
  const setPaymentSurchargeAccount = useCallback(
    async (accountId: number | null): Promise<void> => {
      await updateSettingByName(
        'payment_surcharge_account',
        accountId !== null ? String(accountId) : null
      );
    },
    [updateSettingByName]
  );

  return {
    fetchSettingByName,
    updateSettingByName,
    getPaymentSurchargeAccount,
    setPaymentSurchargeAccount,
  };
}
