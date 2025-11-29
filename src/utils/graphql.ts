import { GRAPHQL_ENDPOINT } from '../lib/config';

export interface GraphQLResponse<T = unknown> {
  data: T;
  debug: {
    url: string;
    headers: Record<string, string>;
    query: string;
    variables?: Record<string, unknown>;
  };
}

export interface GraphQLError {
  message: string;
  extensions?: {
    path?: string;
    code?: string;
  };
}

export interface GraphQLRequest {
  query: string;
  variables?: Record<string, unknown>;
  operationName?: string;
}

/**
 * GraphQL client utility for making requests to Hasura
 *
 * Uses the multi-tenant architecture with X-Hasura-Tenant-Id header
 * instead of tenant-prefixed table names.
 */
export class GraphQLClient {
  private endpoint: string;
  private token: string | null;
  private tenantId: string | null;

  constructor(endpoint: string = GRAPHQL_ENDPOINT, token: string | null = null) {
    this.endpoint = endpoint;
    this.token = token;
    this.tenantId = null;
  }

  /**
   * Set the Firebase auth token for authenticated requests
   */
  setAuthToken(token: string | null) {
    this.token = token;
  }

  /**
   * Set the tenant ID for multi-tenant requests
   * This is sent via the X-Hasura-Tenant-Id header
   */
  setTenantId(tenantId: string | null) {
    this.tenantId = tenantId;
  }

  /**
   * Make a GraphQL request
   */
  async request<T = unknown>(
    request: GraphQLRequest
  ): Promise<GraphQLResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Firebase token as Bearer token for authentication
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Add tenant ID header for multi-tenant architecture
    if (this.tenantId) {
      headers['X-Hasura-Tenant-Id'] = this.tenantId;
    }

    const requestBody = {
      query: request.query,
      variables: request.variables,
      operationName: request.operationName,
    };

    const debugHeaders = { ...headers };
    if (debugHeaders.Authorization) {
      debugHeaders.Authorization = `Bearer ${this.token?.substring(0, 10)}...`;
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${responseText}`);
      }

      const result = await response.json();

      // Check for GraphQL errors
      if (result.errors && result.errors.length > 0) {
        const error = result.errors[0] as GraphQLError;
        throw new Error(`GraphQL Error: ${error.message}`);
      }

      return {
        data: result.data,
        debug: {
          url: this.endpoint,
          headers: debugHeaders,
          query: request.query,
          variables: request.variables,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown GraphQL error';
      const enhancedError = new Error(errorMessage);
      (enhancedError as Error & { debug?: unknown }).debug = {
        url: this.endpoint,
        headers: debugHeaders,
        query: request.query,
        variables: request.variables,
        originalError: error,
      };
      throw enhancedError;
    }
  }

  /**
   * Convenience method for queries
   */
  async query<T = unknown>(
    query: string,
    variables?: Record<string, unknown>,
    operationName?: string
  ): Promise<GraphQLResponse<T>> {
    return this.request<T>({ query, variables, operationName });
  }

  /**
   * Convenience method for mutations
   */
  async mutate<T = unknown>(
    mutation: string,
    variables?: Record<string, unknown>,
    operationName?: string
  ): Promise<GraphQLResponse<T>> {
    return this.request<T>({ query: mutation, variables, operationName });
  }
}

// Default client instance
export const graphqlClient = new GraphQLClient();