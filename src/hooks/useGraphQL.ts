import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { graphqlClient, GraphQLRequest, GraphQLResponse } from '../utils/graphql';

export function useGraphQL() {
  const { getToken, onTokenExpired } = useAuth();

  const executeQuery = useCallback(async <T = unknown>(
    request: GraphQLRequest
  ): Promise<GraphQLResponse<T>> => {
    // Get token from context (works for both embedded and standalone)
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    // Set the token in the GraphQL client
    graphqlClient.setAuthToken(token);

    try {
      // Execute the request
      return await graphqlClient.request<T>(request);
    } catch (error) {
      // Check for auth errors and call onTokenExpired if available
      if (error && typeof error === 'object' && 'errors' in error) {
        const errors = (error as { errors?: Array<{ extensions?: { code?: string } }> }).errors;
        if (errors?.some(e =>
          e.extensions?.code === 'invalid-jwt' ||
          e.extensions?.code === 'access-denied'
        )) {
          onTokenExpired?.();
        }
      }
      throw error;
    }
  }, [getToken, onTokenExpired]);

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