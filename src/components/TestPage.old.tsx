import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { LogOut, Shield, Users2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ApiResponse {
  data: unknown;
  debug: {
    url: string;
    headers: Record<string, string>;
  };
}

export function TestPage() {
  const { user, tenant, userId, groups, permissions } = useAuth();
  const { fetchWithAuth } = useApi();
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchWithAuth('/tracks_limits');
        setApiResponse(response);
        setError(null);
      } catch (err: unknown) {
        setError((err as Error).message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchWithAuth]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-8">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <h1 className="text-2xl font-bold">Authentication Test Page</h1>
              <button
                onClick={handleSignOut}
                className="btn-secondary text-[var(--color-error-500)] hover:bg-red-50 hover:border-red-200 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>

            <div className="card-body space-y-8">
              <section>
                <h2 className="text-xl font-semibold mb-4">Firebase Claims Data</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-[var(--color-textSecondary)]">Email</label>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-[var(--color-textSecondary)]">User ID</label>
                    <p className="font-medium">{userId}</p>
                  </div>
                  <div>
                    <label className="text-sm text-[var(--color-textSecondary)]">Tenant ID</label>
                    <p className="font-medium">{tenant?.id}</p>
                  </div>
                  <div>
                    <label className="text-sm text-[var(--color-textSecondary)]">Tenant Name</label>
                    <p className="font-medium">{tenant?.name}</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Users2 className="h-5 w-5 text-[var(--color-primary-600)]" />
                  Groups
                </h2>
                <div className="space-y-4">
                  {groups.length > 0 ? (
                    <div className="grid gap-3">
                      {groups.map((group) => (
                        <div
                          key={group.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                        >
                          <span className="font-medium">{group.name}</span>
                          <span className="text-sm text-gray-500">{group.id}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[var(--color-textSecondary)]">No groups assigned</p>
                  )}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[var(--color-primary-600)]" />
                  Permissions
                </h2>
                <div className="flex flex-wrap gap-2">
                  {permissions.length > 0 ? (
                    permissions.map((permission) => (
                      <span
                        key={permission}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {permission}
                      </span>
                    ))
                  ) : (
                    <p className="text-[var(--color-textSecondary)]">No permissions assigned</p>
                  )}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">API Test Results</h2>
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary-600)]"></div>
                  </div>
                ) : error ? (
                  <div className="badge badge-error">{error}</div>
                ) : (
                  <div className="space-y-4">
                    <div className="card bg-gray-50">
                      <div className="card-header">
                        <h3 className="font-semibold">Request Details</h3>
                      </div>
                      <div className="card-body">
                        <div className="space-y-2">
                          <p><span className="font-medium">URL:</span> {apiResponse?.debug.url}</p>
                          <div>
                            <p className="font-medium mb-2">Headers:</p>
                            <pre className="bg-white p-4 rounded-lg text-sm overflow-x-auto">
                              {JSON.stringify(apiResponse?.debug.headers, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="card bg-gray-50">
                      <div className="card-header">
                        <h3 className="font-semibold">Response Data</h3>
                      </div>
                      <div className="card-body">
                        <pre className="bg-white p-4 rounded-lg text-sm overflow-x-auto">
                          {JSON.stringify(apiResponse?.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}