import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { authChannel } from '../lib/broadcast';
import { DEFAULT_TENANT } from '../lib/config';
import { TenantInfo, GroupInfo } from '../types/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  tenant: TenantInfo | null;
  userId: string | null;
  groups: GroupInfo[];
  permissions: string[];
  isEmbedded: boolean;
  token: string | null;
  dbName: string | null;
  onTokenExpired?: () => void;
  getToken: () => Promise<string | null>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  tenant: null,
  userId: null,
  groups: [],
  permissions: [],
  isEmbedded: false,
  token: null,
  dbName: null,
  onTokenExpired: undefined,
  getToken: async () => null,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
  token?: string;
  dbName?: string;
  onTokenExpired?: () => void;
}

export function AuthProvider({ children, token: propToken, dbName: propDbName, onTokenExpired }: AuthProviderProps) {
  // Determine embedded mode synchronously from props
  const embedded = !!(propToken && propDbName);

  // Initialize state with prop values if in embedded mode
  const [user, setUser] = useState<User | null>(embedded ? ({} as User) : null);
  const [loading, setLoading] = useState(!embedded); // No loading if embedded - we have everything
  const [token, setToken] = useState<string | null>(embedded ? propToken || null : null);
  const [dbName, setDbName] = useState<string | null>(embedded ? propDbName || null : null);
  const [tenant, setTenant] = useState<TenantInfo | null>(
    embedded ? { id: 'embedded', name: propDbName! } : null
  );
  const [userId, setUserId] = useState<string | null>(embedded ? 'embedded-user' : null);
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isEmbedded] = useState<boolean>(embedded);

  // getToken helper function
  const getToken = React.useCallback(async (): Promise<string | null> => {
    if (embedded) {
      return token;
    } else {
      return await auth.currentUser?.getIdToken() || null;
    }
  }, [embedded, token]);

  // Handle embedded mode updates when token/tenant change
  useEffect(() => {
    if (embedded && propToken && propDbName) {
      console.log('Running in embedded mode with tenant name:', propDbName);
      setToken(propToken);
      setDbName(propDbName);
      // IMPORTANT: Always use tenant from dbName prop in embedded mode, NOT from token claims
      setTenant({ id: 'embedded', name: propDbName });
      setUser({} as User);
      setUserId('embedded-user');
    }
  }, [propToken, propDbName, embedded]);

  // Only run Firebase auth if not in embedded mode
  useEffect(() => {
    // Skip Firebase auth if we're in embedded mode
    if (embedded) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const idTokenResult = await user.getIdTokenResult();
        const tenantClaim = idTokenResult.claims.tenant as TenantInfo;
        const user_id = idTokenResult.claims.user_id as string;
        const groupsClaim = idTokenResult.claims.groups as GroupInfo[] || [];
        const permissionsClaim = idTokenResult.claims.permissions as string[] || [];

        // Use tenant from claims, or fallback to default tenant for development/testing
        const tenantInfo = tenantClaim || { id: DEFAULT_TENANT, name: DEFAULT_TENANT };
        setTenant(tenantInfo);
        setUserId(user_id || null);
        setGroups(groupsClaim);
        setPermissions(permissionsClaim);

        // Get token and store it
        const firebaseToken = await user.getIdToken();
        setToken(firebaseToken);
        setDbName(tenantInfo.name);
      } else {
        setTenant(null);
        setUserId(null);
        setGroups([]);
        setPermissions([]);
        setToken(null);
        setDbName(null);
      }
      setUser(user);
      setLoading(false);
    });

    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data.type === 'AUTH_STATE_CHANGED') {
        setUser(event.data.user);
        setTenant(event.data.tenant || null);
        setUserId(event.data.userId || null);
        setGroups(event.data.groups || []);
        setPermissions(event.data.permissions || []);
      }
    };

    authChannel.addEventListener('message', handleAuthMessage);

    return () => {
      unsubscribe();
      authChannel.removeEventListener('message', handleAuthMessage);
    };
  }, [embedded]);

  const value = {
    user,
    loading,
    tenant,
    userId,
    groups,
    permissions,
    isEmbedded,
    token,
    dbName,
    onTokenExpired,
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
