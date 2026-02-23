import { useRef, useEffect } from 'react';
import { useAuth } from './useAuth';
import { API_URL } from '../lib/config';
import { ApiResponse } from '../types/api';

interface FetchOptions extends RequestInit {
  baseUrl?: string;
}

interface DebugInfo {
  url: string;
  headers: Record<string, string>;
  error?: unknown;
}

// Helper to wait for token to change (with timeout)
async function waitForNewToken(
  currentToken: string | undefined,
  getToken: () => string | undefined,
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

export function useApi() {
  const { tenant, userId, getToken, onTokenExpired, isEmbedded, token: contextToken } = useAuth();

  // Keep a ref to the latest token so waitForNewToken can poll it
  const tokenRef = useRef(contextToken);
  useEffect(() => {
    tokenRef.current = contextToken;
  }, [contextToken]);

  const fetchWithAuth = async (endpoint: string, options: FetchOptions = {}, isRetry: boolean = false): Promise<ApiResponse> => {
    if (!tenant) {
      throw new Error('No tenant information available');
    }

    // Get token from context (works for both embedded and standalone)
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    // Store the token used for this request (for retry logic)
    const usedToken = token;

    const headers = new Headers(options.headers || {});
    headers.set('X-DB-Name', tenant.name);
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');

    if (userId) {
      headers.set('user-id', userId);
    }

    const url = options.baseUrl ?
      `${options.baseUrl}${endpoint}` :
      `${API_URL}${endpoint}`;

    const debugInfo: DebugInfo = {
      url,
      // Convert headers to plain object, excluding sensitive data
      headers: Object.fromEntries(
        Array.from(headers.entries()).filter(([key]) => key.toLowerCase() !== 'authorization')
      )
    };

    try {
      const response = await fetch(url, {
        method: 'GET',
        ...options,
        headers,
      });

      if (!response.ok) {
        // Handle auth errors with retry logic
        if (response.status === 401 || response.status === 403) {
          console.log('[useApi] Auth error:', response.status, { endpoint, isEmbedded, isRetry });

          if (isEmbedded && onTokenExpired && !isRetry) {
            console.log('[useApi] Calling onTokenExpired and waiting for new token...');
            onTokenExpired();

            const newToken = await waitForNewToken(
              usedToken,
              () => tokenRef.current || undefined,
              10000
            );

            if (newToken && newToken !== usedToken) {
              console.log('[useApi] New token received, retrying request once...');
              return fetchWithAuth(endpoint, options, true);
            } else {
              console.log('[useApi] Token did not change or timeout reached, failing request');
            }
          } else if (isRetry) {
            console.log('[useApi] Auth error on retry - not retrying again');
          }
        }

        const error = `API call failed: ${response.status} ${response.statusText}`;
        debugInfo.error = error;
        throw new Error(error);
      }

      return {
        data: await response.json(),
        debug: debugInfo
      };
    } catch (error) {
      debugInfo.error = error;
      throw { error, debug: debugInfo };
    }
  };

  return { fetchWithAuth };
}
