import React, { createContext, useEffect, useState } from 'react';
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
  onTokenExpired: undefined,
  getToken: async () => null,
});


interface AuthProviderProps {
  children: React.ReactNode;
  // New prop names (per claude_for_child_developers.md)
  authToken?: string;
  tenantName?: string;
  // Old prop names (for backward compatibility with wrapper)
  token?: string;
  dbName?: string;
  onTokenExpired?: () => void;
}

export function AuthProvider({ children, authToken, tenantName, token, dbName, onTokenExpired }: AuthProviderProps) {
  // Support both old and new prop names for backward compatibility
  const effectiveToken = authToken || token;
  const effectiveTenant = tenantName || dbName;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isEmbedded, setIsEmbedded] = useState<boolean>(false);

  // getToken helper function
  const getToken = async (): Promise<string | null> => {
    if (isEmbedded) {
      return effectiveToken || null;
    } else {
      return await auth.currentUser?.getIdToken() || null;
    }
  };

  // Check if we're in embedded mode (props provided by parent)
  useEffect(() => {
    if (effectiveToken && effectiveTenant) {
      console.log('Running in embedded mode with provided auth token and tenant name');
      setIsEmbedded(true);

      // Create a minimal tenant object with the provided tenant name
      setTenant({ id: 'embedded', name: effectiveTenant });

      // We don't have a full user object in embedded mode, but we can set a placeholder
      // The actual token will be used in API calls
      setUser({} as User);

      // Set minimal user info
      setUserId('embedded-user');

      // In embedded mode, we don't have groups and permissions from Firebase
      // These would typically come from the parent application if needed
      setGroups([]);
      setPermissions([]);

      setLoading(false);
    }
  }, [effectiveToken, effectiveTenant]);

  // Only run Firebase auth if not in embedded mode
  useEffect(() => {
    // Skip Firebase auth if we're in embedded mode
    if (isEmbedded) return;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const idTokenResult = await user.getIdTokenResult();
        const tenantClaim = idTokenResult.claims.tenant as TenantInfo;
        const user_id = idTokenResult.claims.user_id as string;
        const groupsClaim = idTokenResult.claims.groups as GroupInfo[] || [];
        const permissionsClaim = idTokenResult.claims.permissions as string[] || [];

        // Use tenant from claims, or fallback to default tenant for development/testing
        setTenant(tenantClaim || { id: DEFAULT_TENANT, name: DEFAULT_TENANT });
        setUserId(user_id || null);
        setGroups(groupsClaim);
        setPermissions(permissionsClaim);
      } else {
        setTenant(null);
        setUserId(null);
        setGroups([]);
        setPermissions([]);
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
  }, [isEmbedded]);

  const value = {
    user,
    loading,
    tenant,
    userId,
    groups,
    permissions,
    isEmbedded,
    token: authToken || null,
    onTokenExpired,
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}