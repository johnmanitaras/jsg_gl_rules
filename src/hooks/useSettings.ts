/**
 * Settings GraphQL Hooks
 *
 * Provides data fetching and mutation hooks for application settings.
 * Uses GraphQL via Hasura with multi-tenant architecture.
 * Tenant is specified via X-Hasura-Tenant-Id header (handled by useGraphQL).
 */

import { useCallback } from 'react';
import { useGraphQL } from './useGraphQL';

export interface Setting {
  id: number;
  setting_name: string;
  setting_value: string | null;
}

// Static table name using reference schema (tenant specified via header)
const SETTINGS_TABLE = 'jsg_reference_schema_settings';

export function useSettings() {
  const { query, mutate } = useGraphQL();

  /**
   * Fetch a setting by name
   */
  const fetchSettingByName = useCallback(
    async (settingName: string): Promise<Setting | null> => {
      const q = `
        query GetSettingByName($settingName: String!) {
          settings: ${SETTINGS_TABLE}(
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
    [query]
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
            update_jsg_reference_schema_settings_by_pk(
              pk_columns: { id: $id }
              _set: { setting_value: $settingValue }
            ) {
              id
              setting_name
              setting_value
            }
          }
        `;

        const response = await mutate<{ update_jsg_reference_schema_settings_by_pk: Setting }>(m, {
          id: existing.id,
          settingValue,
        });

        return response.data.update_jsg_reference_schema_settings_by_pk;
      } else {
        // Create new setting
        const m = `
          mutation CreateSetting($setting: jsg_reference_schema_settings_insert_input!) {
            insert_jsg_reference_schema_settings_one(object: $setting) {
              id
              setting_name
              setting_value
            }
          }
        `;

        const response = await mutate<{ insert_jsg_reference_schema_settings_one: Setting }>(m, {
          setting: {
            setting_name: settingName,
            setting_value: settingValue,
          },
        });

        return response.data.insert_jsg_reference_schema_settings_one;
      }
    },
    [mutate, fetchSettingByName]
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
