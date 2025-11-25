import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';

export function AccessDenied() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="card text-center p-8">
          <div className="flex justify-center mb-6">
            <div className="rounded-full p-3 bg-[var(--color-error-50,#fef2f2)]">
              <ShieldAlert className="h-12 w-12" style={{ color: 'var(--color-error-500, #EF4444)' }} />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text, #111827)' }}>Access Denied</h1>
          <p className="mb-6" style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
            You don't have permission to access this page. Please contact your administrator for assistance.
          </p>
          <button
            onClick={() => window.history.back()}
            className="btn-secondary w-full"
          >
            Go Back
          </button>
        </div>
      </motion.div>
    </div>
  );
}