/**
 * Lookup Data GraphQL Hooks
 *
 * Provides hooks for fetching lookup/reference data for dropdowns
 * (Resources, Product Types, Product Sub-Types)
 * Uses GraphQL via Hasura with multi-tenant architecture.
 * Tenant is specified via X-Hasura-Tenant-Id header (handled by useGraphQL).
 */

import { useCallback } from 'react';
import { useGraphQL } from './useGraphQL';
import { Resource, ProductType, ProductSubType } from '../types/gl-rules';

// Static table names using reference schema (tenant specified via header)
const RESOURCES_TABLE = 'jsg_reference_schema_resources';
const PRODUCT_TYPES_TABLE = 'jsg_reference_schema_product_types';
const PRODUCT_SUB_TYPES_TABLE = 'jsg_reference_schema_product_sub_types';

export function useLookupData() {
  const { query } = useGraphQL();

  /**
   * Fetch all active resources for dropdown selection
   */
  const fetchResources = useCallback(async (): Promise<Resource[]> => {
    const q = `
      query GetResources {
        resources: ${RESOURCES_TABLE}(
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
  }, [query]);

  /**
   * Fetch all active product types for dropdown selection
   */
  const fetchProductTypes = useCallback(async (): Promise<ProductType[]> => {
    const q = `
      query GetProductTypes {
        product_types: ${PRODUCT_TYPES_TABLE}(
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
  }, [query]);

  /**
   * Fetch all active product sub-types with parent type info
   */
  const fetchProductSubTypes = useCallback(async (): Promise<ProductSubType[]> => {
    const q = `
      query GetProductSubTypes {
        product_sub_types: ${PRODUCT_SUB_TYPES_TABLE}(
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
  }, [query]);

  /**
   * Fetch product sub-types for a specific product type
   */
  const fetchProductSubTypesByType = useCallback(async (
    productTypeId: number
  ): Promise<ProductSubType[]> => {
    const q = `
      query GetProductSubTypesByType($productTypeId: Int!) {
        product_sub_types: ${PRODUCT_SUB_TYPES_TABLE}(
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
  }, [query]);

  return {
    fetchResources,
    fetchProductTypes,
    fetchProductSubTypes,
    fetchProductSubTypesByType,
  };
}
