/**
 * AccountFormModal Component
 *
 * Modal form for creating and editing GL accounts.
 * Validates name and external_id fields.
 */

import { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { usePermissions } from '../../contexts/PermissionsContext';
import { Account, AccountFormData } from '../../types/gl-rules';

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AccountFormData) => Promise<void>;
  account?: Account; // If provided, we're editing; otherwise creating
  checkExternalIdExists?: (externalId: string, excludeId?: number) => Promise<boolean>;
}

export function AccountFormModal({
  isOpen,
  onClose,
  onSave,
  account,
  checkExternalIdExists,
}: AccountFormModalProps) {
  const { canEdit, inputProps } = usePermissions();
  const [name, setName] = useState('');
  const [externalId, setExternalId] = useState('');
  const [errors, setErrors] = useState<{ name?: string; external_id?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!account;

  // Reset form when modal opens/closes or account changes
  useEffect(() => {
    if (isOpen) {
      if (account) {
        setName(account.name);
        setExternalId(account.external_id);
      } else {
        setName('');
        setExternalId('');
      }
      setErrors({});
    }
  }, [isOpen, account]);

  const validate = async (): Promise<boolean> => {
    const newErrors: { name?: string; external_id?: string } = {};

    // Validate name
    if (!name.trim()) {
      newErrors.name = 'Account name is required';
    }

    // Validate external_id
    if (!externalId.trim()) {
      newErrors.external_id = 'External ID is required';
    } else if (checkExternalIdExists) {
      // Check for duplicate external_id
      const exists = await checkExternalIdExists(
        externalId.trim(),
        isEditing ? account?.id : undefined
      );
      if (exists) {
        newErrors.external_id = 'This external ID is already in use';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = await validate();
    if (!isValid) return;

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        external_id: externalId.trim(),
      });
      onClose();
    } catch (error) {
      console.error('Error saving account:', error);
      setErrors({
        name: error instanceof Error ? error.message : 'Failed to save account',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const footer = (
    <>
      <button
        type="button"
        className="btn-secondary"
        onClick={onClose}
        disabled={isSaving}
      >
        Cancel
      </button>
      {canEdit && (
        <button
          type="submit"
          form="account-form"
          className="btn-primary"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Account'}
        </button>
      )}
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Account' : 'Create Account'}
      footer={footer}
      maxWidth="480px"
    >
      <form id="account-form" onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Account Name */}
          <div>
            <label
              htmlFor="account-name"
              style={{
                display: 'block',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text)',
                marginBottom: 'var(--spacing-2)',
              }}
            >
              Account Name <span style={{ color: 'var(--color-error-500)' }}>*</span>
            </label>
            <input
              id="account-name"
              type="text"
              className="input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              placeholder="e.g., Ferry Revenue"
              style={{
                width: '100%',
                borderColor: errors.name ? 'var(--color-error-500)' : undefined,
              }}
              {...inputProps}
            />
            {errors.name && (
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-error-500)',
                  marginTop: 'var(--spacing-1)',
                }}
              >
                {errors.name}
              </p>
            )}
          </div>

          {/* External ID */}
          <div>
            <label
              htmlFor="external-id"
              style={{
                display: 'block',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text)',
                marginBottom: 'var(--spacing-2)',
              }}
            >
              External ID <span style={{ color: 'var(--color-error-500)' }}>*</span>
            </label>
            <input
              id="external-id"
              type="text"
              className="input"
              value={externalId}
              onChange={(e) => {
                setExternalId(e.target.value);
                if (errors.external_id) setErrors({ ...errors, external_id: undefined });
              }}
              placeholder="e.g., 4010"
              style={{
                width: '100%',
                borderColor: errors.external_id ? 'var(--color-error-500)' : undefined,
              }}
              {...inputProps}
            />
            <p
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-muted)',
                marginTop: 'var(--spacing-1)',
              }}
            >
              The GL account code in your accounting system
            </p>
            {errors.external_id && (
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-error-500)',
                  marginTop: 'var(--spacing-1)',
                }}
              >
                {errors.external_id}
              </p>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
