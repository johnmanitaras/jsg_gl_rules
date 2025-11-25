/**
 * AccountsTable Component
 *
 * Displays a table of GL accounts with CRUD operations.
 * Used in the "Manage Accounts" tab.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2, AlertCircle } from 'lucide-react';
import { Account } from '../../types/gl-rules';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface AccountsTableProps {
  accounts: Account[];
  searchTerm: string;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => Promise<void>;
  isLoading?: boolean;
}

export function AccountsTable({
  accounts,
  searchTerm,
  onEdit,
  onDelete,
  isLoading = false,
}: AccountsTableProps) {
  const [deleteConfirmAccount, setDeleteConfirmAccount] = useState<Account | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter accounts based on search term
  const filteredAccounts = accounts.filter(
    (account) =>
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.external_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (account: Account) => {
    setDeleteConfirmAccount(account);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmAccount) return;

    setIsDeleting(true);
    try {
      await onDelete(deleteConfirmAccount);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmAccount(null);
    }
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="p-8 text-center">
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"
            style={{ color: 'var(--color-primary-600)' }}
          />
          <p className="mt-4" style={{ color: 'var(--color-text-secondary)' }}>
            Loading accounts...
          </p>
        </div>
      </div>
    );
  }

  if (filteredAccounts.length === 0) {
    return (
      <div className="card">
        <div className="p-8 text-center">
          <AlertCircle
            size={48}
            style={{ color: 'var(--color-neutral-400)', margin: '0 auto' }}
          />
          <h3
            className="mt-4"
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text)',
            }}
          >
            {searchTerm ? 'No accounts found' : 'No accounts yet'}
          </h3>
          <p
            className="mt-2"
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {searchTerm
              ? 'Try adjusting your search term'
              : 'Create your first GL account to get started'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--color-neutral-50)',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <th
                className="text-left px-6 py-4"
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Account Name
              </th>
              <th
                className="text-left px-6 py-4"
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                External ID
              </th>
              <th
                className="text-right px-6 py-4"
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-secondary)',
                  width: '120px',
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map((account, index) => (
              <motion.tr
                key={account.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                style={{
                  borderBottom: '1px solid var(--color-border)',
                }}
                className="hover:bg-neutral-50 transition-colors"
              >
                <td
                  className="px-6 py-4"
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-text)',
                  }}
                >
                  {account.name}
                </td>
                <td
                  className="px-6 py-4"
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <code
                    style={{
                      backgroundColor: 'var(--color-neutral-100)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {account.external_id}
                  </code>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(account)}
                      className="p-2 rounded-md hover:bg-neutral-100 transition-colors"
                      style={{ color: 'var(--color-text-secondary)' }}
                      title="Edit account"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(account)}
                      className="p-2 rounded-md hover:bg-red-50 transition-colors"
                      style={{ color: 'var(--color-error-500)' }}
                      title="Delete account"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirmAccount}
        onClose={() => setDeleteConfirmAccount(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Account"
        message={`Are you sure you want to delete "${deleteConfirmAccount?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive
        isLoading={isDeleting}
      />
    </>
  );
}
