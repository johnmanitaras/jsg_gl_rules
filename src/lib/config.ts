import { indexedDBLocalPersistence } from 'firebase/auth';

export const COOKIE_NAME = '__session';
export const AUTH_PERSISTENCE = indexedDBLocalPersistence;

export const API_URL = import.meta.env.VITE_API_URL as string;

// GraphQL Configuration
export const GRAPHQL_ENDPOINT = import.meta.env.VITE_HASURA_GRAPHQL_ENDPOINT as string;
export const GRAPHQL_ADMIN_SECRET = import.meta.env.VITE_HASURA_GRAPHQL_ADMIN_SECRET || '4KOcBV1uzaKyCS2fbVIYwXYzhzITVULCC8f7rRMXZ4KyUKwwaHQ2kR93RW82x4gw';

// Default tenant for development/testing when no Firebase claim is available
export const DEFAULT_TENANT = import.meta.env.VITE_DEFAULT_TENANT || 'tta';

if (!API_URL || !GRAPHQL_ENDPOINT) {
  throw new Error(
    '[Config] VITE_API_URL and VITE_HASURA_GRAPHQL_ENDPOINT must be defined. ' +
    'Did you run the build script with a valid cluster?'
  );
}