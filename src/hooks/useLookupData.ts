/**
 * Lookup Data GraphQL Hooks
 *
 * Provides hooks for fetching lookup/reference data for dropdowns
 * (Resources, Product Types, Product Sub-Types)
 */

import { useCallback } from 'react';
import { useGraphQL } from './useGraphQL';
import { useAuth } from './useAuth';
import { DEFAULT_TENANT } from '../lib/config';
import { Resource, ProductType, ProductSubType } from '../types/gl-rules';

export function useLookupData() {
  const { query } = useGraphQL();
  const { tenant } = useAuth();
  const tenantName = tenant?.name || DEFAULT_TENANT;

  /**
   * Fetch all active resources for dropdown selection
   */
  const fetchResources = useCallback(async (): Promise<Resource[]> => {
    const resourcesTable = `${tenantName}_resources`;

    const q = `
      query GetResources {
        resources: ${resourcesTable}(
          where: { active: { _eq: true } }
          order_by: { name: asc }
        ) {
          id
          name
          active
        }
      }
    `;

    const response = await query<{ resources: Array<{ id: number; name: string; active: boolean }> }>(
      q,
      undefined,
      undefined
    );

    // Transform to match Resource interface (add type field for compatibility)
    return response.data.resources.map(r => ({
      id: r.id,
      name: r.name,
      type: 'Resource', // Generic type since not in schema
      deleted: !r.active, // Map active to deleted for interface compatibility
    }));
  }, [query, tenantName]);

  /**
   * Fetch all active product types for dropdown selection
   */
  const fetchProductTypes = useCallback(async (): Promise<ProductType[]> => {
    const productTypesTable = `${tenantName}_product_types`;

    const q = `
      query GetProductTypes {
        product_types: ${productTypesTable}(
          order_by: { name: asc }
        ) {
          id
          name
          icon_class
        }
      }
    `;

    const response = await query<{ product_types: Array<{ id: number; name: string; icon_class?: string }> }>(
      q,
      undefined,
      undefined
    );

    // Transform to match ProductType interface
    return response.data.product_types.map(pt => ({
      id: pt.id,
      name: pt.name,
      deleted: false, // No deleted field in schema, assume all active
    }));
  }, [query, tenantName]);

  /**
   * Fetch all active product sub-types with parent type info
   */
  const fetchProductSubTypes = useCallback(async (): Promise<ProductSubType[]> => {
    const productSubTypesTable = `${tenantName}_product_sub_types`;

    const q = `
      query GetProductSubTypes {
        product_sub_types: ${productSubTypesTable}(
          order_by: { name: asc }
        ) {
          id
          product_type_id
          name
          created_at
          updated_at
          deleted
        }
      }
    `;

    const response = await query<{ product_sub_types: Array<{
      id: number;
      product_type_id: number;
      name: string;
      deleted: boolean;
      created_at: string;
      updated_at: string;
    }> }>(
      q,
      undefined,
      undefined
    );

    // Filter out deleted and transform to match interface
    return response.data.product_sub_types
      .filter(st => !st.deleted)
      .map((subType) => ({
        id: subType.id,
        product_type_id: subType.product_type_id,
        name: subType.name,
        deleted: subType.deleted,
        product_type_name: undefined, // No join available, would need separate query
      }));
  }, [query, tenantName]);

  /**
   * Fetch product sub-types for a specific product type
   */
  const fetchProductSubTypesByType = useCallback(async (
    productTypeId: number
  ): Promise<ProductSubType[]> => {
    const productSubTypesTable = `${tenantName}_product_sub_types`;

    const q = `
      query GetProductSubTypesByType($productTypeId: Int!) {
        product_sub_types: ${productSubTypesTable}(
          where: {
            product_type_id: { _eq: $productTypeId }
          }
          order_by: { name: asc }
        ) {
          id
          product_type_id
          name
          deleted
        }
      }
    `;

    const response = await query<{ product_sub_types: Array<{
      id: number;
      product_type_id: number;
      name: string;
      deleted: boolean;
    }> }>(
      q,
      { productTypeId },
      undefined
    );

    // Filter out deleted
    return response.data.product_sub_types
      .filter(st => !st.deleted)
      .map(st => ({
        id: st.id,
        product_type_id: st.product_type_id,
        name: st.name,
        deleted: st.deleted,
        product_type_name: undefined,
      }));
  }, [query, tenantName]);

  return {
    fetchResources,
    fetchProductTypes,
    fetchProductSubTypes,
    fetchProductSubTypesByType,
  };
}
