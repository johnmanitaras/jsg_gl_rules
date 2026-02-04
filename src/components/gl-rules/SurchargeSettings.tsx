/**
 * SurchargeSettings Component
 *
 * Allows users to configure the payment surcharge GL account.
 * This account is used for allocating payment surcharge amounts.
 */

import { useState, useEffect } from 'react';
import { CreditCard, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Account } from '../../types/gl-rules';
import { SearchableDropdown, DropdownOption } from '../common/SearchableDropdown';

interface SurchargeSettingsProps {
  accounts: Account[];
  accountsLoading: boolean;
  currentAccountId: number | null;
  onSave: (accountId: number | null) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  canEdit?: boolean;
}

export function SurchargeSettings({
  accounts,
  accountsLoading,
  currentAccountId,
  onSave,
  isLoading,
  error,
  canEdit = true,
}: SurchargeSettingsProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(currentAccountId);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Update local state when prop changes
  useEffect(() => {
    setSelectedAccountId(currentAccountId);
  }, [currentAccountId]);

  // Convert accounts to dropdown options
  const accountOptions: DropdownOption[] = accounts.map((account) => ({
    id: account.id,
    label: account.name,
    subtitle: account.external_id,
  }));

  // Check if value has changed
  const hasChanges = selectedAccountId !== currentAccountId;

  // Handle save
  const handleSave = async () => {
    if (!hasChanges) return;

    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      await onSave(selectedAccountId);

      setSaveSuccess(true);
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving surcharge account:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to save setting');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle clear
  const handleClear = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      await onSave(null);
      setSelectedAccountId(null);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error clearing surcharge account:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to clear setting');
    } finally {
      setIsSaving(false);
    }
  };

  // Get current account name for display
  const currentAccount = accounts.find((a) => a.id === currentAccountId);

  return (
    <div className="card" style={{ padding: 'var(--spacing-6)' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--spacing-4)',
          marginBottom: 'var(--spacing-6)',
        }}
      >
        <div
          style={{
            padding: 'var(--spacing-3)',
            backgroundColor: 'var(--color-primary-50)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <CreditCard
            size={24}
            style={{ color: 'var(--color-primary-600)' }}
          />
        </div>
        <div>
          <h2
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text)',
              marginBottom: 'var(--spacing-1)',
            }}
          >
            Payment Surcharge Account
          </h2>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
              lineHeight: '1.5',
            }}
          >
            Select the GL account where payment surcharge amounts should be allocated.
            This applies to all payment surcharges processed in the system.
          </p>
        </div>
      </div>

      {/* Error from parent */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-3)',
            padding: 'var(--spacing-3) var(--spacing-4)',
            backgroundColor: 'var(--color-error-50)',
            border: '1px solid var(--color-error-200)',
            borderRadius: 'var(--radius-card)',
            marginBottom: 'var(--spacing-4)',
          }}
        >
          <AlertCircle size={20} style={{ color: 'var(--color-error-500)' }} />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-error-700)' }}>
            {error}
          </span>
        </div>
      )}

      {/* Save Error */}
      {saveError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-3)',
            padding: 'var(--spacing-3) var(--spacing-4)',
            backgroundColor: 'var(--color-error-50)',
            border: '1px solid var(--color-error-200)',
            borderRadius: 'var(--radius-card)',
            marginBottom: 'var(--spacing-4)',
          }}
        >
          <AlertCircle size={20} style={{ color: 'var(--color-error-500)' }} />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-error-700)' }}>
            {saveError}
          </span>
        </div>
      )}

      {/* Success Message */}
      {saveSuccess && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-3)',
            padding: 'var(--spacing-3) var(--spacing-4)',
            backgroundColor: 'var(--color-success-50)',
            border: '1px solid var(--color-success-200)',
            borderRadius: 'var(--radius-card)',
            marginBottom: 'var(--spacing-4)',
          }}
        >
          <Check size={20} style={{ color: 'var(--color-success-500)' }} />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-success-700)' }}>
            Payment surcharge account saved successfully
          </span>
        </div>
      )}

      {/* Current Value Display */}
      {currentAccount && !isLoading && (
        <div
          style={{
            padding: 'var(--spacing-4)',
            backgroundColor: 'var(--color-surface-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-card)',
            marginBottom: 'var(--spacing-4)',
          }}
        >
          <div
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 'var(--spacing-2)',
            }}
          >
            Currently Configured
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-2)',
            }}
          >
            <span
              style={{
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text)',
              }}
            >
              {currentAccount.name}
            </span>
            <span
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              ({currentAccount.external_id})
            </span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {(isLoading || accountsLoading) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--spacing-3)',
            padding: 'var(--spacing-8)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <Loader2
            size={24}
            style={{ animation: 'spin 1s linear infinite' }}
          />
          <span>Loading...</span>
        </div>
      )}

      {/* Account Selector */}
      {!isLoading && !accountsLoading && (
        <>
          <div style={{ marginBottom: 'var(--spacing-4)' }}>
            <SearchableDropdown
              id="surcharge-account"
              label="Select GL Account"
              options={accountOptions}
              value={selectedAccountId}
              onChange={(value) => setSelectedAccountId(value as number | null)}
              placeholder="Search for an account..."
              disabled={!canEdit}
            />
          </div>

          {/* No accounts warning */}
          {accounts.length === 0 && (
            <div
              style={{
                padding: 'var(--spacing-4)',
                backgroundColor: 'var(--color-warning-50)',
                border: '1px solid var(--color-warning-200)',
                borderRadius: 'var(--radius-card)',
                marginBottom: 'var(--spacing-4)',
              }}
            >
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-warning-700)',
                }}
              >
                No GL accounts available. Please create accounts in the "Manage Accounts" tab first.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {canEdit && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 'var(--spacing-3)',
                paddingTop: 'var(--spacing-4)',
                borderTop: '1px solid var(--color-border)',
              }}
            >
              {currentAccountId !== null && (
                <button
                  className="btn-secondary"
                  onClick={handleClear}
                  disabled={isSaving}
                  style={{ minWidth: '100px' }}
                >
                  Clear
                </button>
              )}
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={!hasChanges || isSaving || accounts.length === 0}
                style={{
                  minWidth: '120px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--spacing-2)',
                }}
              >
                {isSaving ? (
                  <>
                    <Loader2
                      size={16}
                      style={{ animation: 'spin 1s linear infinite' }}
                    />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
