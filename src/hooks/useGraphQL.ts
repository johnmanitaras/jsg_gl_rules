import { useCallback, useRef, useEffect } from 'react';
import { useAuth } from './useAuth';
import { graphqlClient, GraphQLRequest, GraphQLResponse } from '../utils/graphql';
import { DEFAULT_TENANT } from '../lib/config';

// Helper to wait for token to change (with timeout)
async function waitForNewToken(
  currentToken: string | null,
  getToken: () => string | null,
  timeoutMs: number = 10000
): Promise<string | null> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const newToken = getToken();
    if (newToken && newToken !== currentToken) {
      return newToken;
    }
    // Wait 100ms before checking again
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return null; // Timeout - token didn't change
}

export function useGraphQL() {
  const { getToken, onTokenExpired, tenant, isEmbedded, token: contextToken } = useAuth();

  // Keep a ref to the latest token so waitForNewToken can poll it
  const tokenRef = useRef(contextToken);
  useEffect(() => {
    tokenRef.current = contextToken;
  }, [contextToken]);

  const executeQuery = useCallback(async <T = unknown>(
    request: GraphQLRequest,
    isRetry: boolean = false
  ): Promise<GraphQLResponse<T>> => {
    // Get token from context (works for both embedded and standalone)
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    // Store the token used for this request (for retry logic)
    const usedToken = token;

    // Set the token in the GraphQL client
    graphqlClient.setAuthToken(token);

    // Set tenant ID for multi-tenant architecture
    const tenantId = tenant?.name || DEFAULT_TENANT;
    graphqlClient.setTenantId(tenantId);

    try {
      // Execute the request
      return await graphqlClient.request<T>(request);
    } catch (error: any) {
      // Check for auth errors
      const isAuthError =
        (error && typeof error === 'object' && 'errors' in error &&
          (error as { errors?: Array<{ extensions?: { code?: string } }> }).errors?.some((e: any) =>
            e.extensions?.code === 'invalid-jwt' ||
            e.extensions?.code === 'access-denied'
          )) ||
        error?.response?.status === 401 ||
        error?.response?.status === 403 ||
        error?.response?.errors?.[0]?.message?.includes('JWT') ||
        error?.response?.errors?.[0]?.message?.includes('token expired') ||
        error?.response?.errors?.[0]?.message?.includes('invalid-jwt') ||
        error?.response?.errors?.[0]?.message?.includes('Could not verify JWT');

      if (isAuthError) {
        console.log('[useGraphQL] Auth error detected:', { isEmbedded, isRetry });

        if (isEmbedded && onTokenExpired && !isRetry) {
          console.log('[useGraphQL] Calling onTokenExpired and waiting for new token...');
          onTokenExpired();

          const newToken = await waitForNewToken(
            usedToken,
            () => tokenRef.current,
            10000
          );

          if (newToken && newToken !== usedToken) {
            console.log('[useGraphQL] New token received, retrying request once...');
            return executeQuery<T>(request, true);
          } else {
            console.log('[useGraphQL] Token did not change or timeout reached, failing request');
          }
        } else if (isRetry) {
          console.log('[useGraphQL] Auth error on retry - not retrying again');
        }
      }
      throw error;
    }
  }, [getToken, onTokenExpired, tenant, isEmbedded]);

  const query = useCallback(async <T = unknown>(
    query: string,
    variables?: Record<string, unknown>,
    operationName?: string
  ): Promise<GraphQLResponse<T>> => {
    return executeQuery<T>({ query, variables, operationName });
  }, [executeQuery]);

  const mutate = useCallback(async <T = unknown>(
    mutation: string,
    variables?: Record<string, unknown>,
    operationName?: string
  ): Promise<GraphQLResponse<T>> => {
    return executeQuery<T>({ query: mutation, variables, operationName });
  }, [executeQuery]);

  return {
    executeQuery,
    query,
    mutate,
  };
}
