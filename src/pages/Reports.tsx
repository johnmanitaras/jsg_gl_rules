import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Users } from 'lucide-react';
import { PermissionGuard } from '../components/common/PermissionGuard';
import { usePermissions } from '../utils/permissions';
import { Toast } from '../components/common/Toast';

export function Reports() {
  const { can } = usePermissions();
  const [showToast, setShowToast] = useState(false);

  const handleManageUsers = () => {
    if (!can('manage:users')) {
      setShowToast(true);
      return;
    }
    alert('Success!');
  };

  return (
    <PermissionGuard permission="view:reports">
      <div className="min-h-screen bg-[var(--color-background)] p-8">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="card">
              <div className="card-header">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-[var(--color-primary-600)]" />
                  <h1 className="text-2xl font-bold">Reports Dashboard</h1>
                </div>
              </div>
              
              <div className="card-body">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {/* Sample Report Card */}
                  <div className="card" style={{ backgroundColor: 'var(--color-background, #f9fafb)' }}>
                    <div className="card-body">
                      <h3 className="font-semibold mb-2">Monthly Activity Report</h3>
                      <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
                        View detailed activity statistics for the current month.
                      </p>
                      <button
                        onClick={handleManageUsers}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Users className="h-4 w-4" />
                        Manage Users
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <Toast
        message="You don't have permission to manage users. Please contact your administrator for assistance."
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </PermissionGuard>
  );
}