/**
 * RuleConfigForm Component
 *
 * Configuration form for adding/editing GL allocation rules
 * Features:
 * - Searchable target selector dropdown (conditional based on rule type)
 * - GL account selector dropdown
 * - Real-time rule preview in natural language
 * - Loading states for dropdown data with skeleton placeholders
 * - Form validation
 */

import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { RuleType, RuleFormData, Account } from '../../types/gl-rules';
import { useLookupData } from '../../hooks/useLookupData';
import {
  SearchableDropdown,
  DropdownOption,
} from '../common/SearchableDropdown';

interface RuleConfigFormProps {
  ruleType: RuleType;
  accounts: Account[];
  onSave: (rule: RuleFormData) => void;
  onCancel: () => void;
  initialData?: RuleFormData; // For edit mode
  isSaving?: boolean; // True when save API call is in progress
}

export function RuleConfigForm({
  ruleType,
  accounts,
  onSave,
  onCancel,
  initialData,
  isSaving = false,
}: RuleConfigFormProps) {
  const { fetchResources, fetchProductTypes, fetchProductSubTypes } =
    useLookupData();

  // Form state
  const [targetId, setTargetId] = useState<number | null>(
    initialData?.target_id || null
  );
  const [accountId, setAccountId] = useState<number | null>(
    initialData?.account_id || null
  );
  const [errors, setErrors] = useState<{ target?: string; account?: string }>({});

  // Lookup data state
  const [resources, setResources] = useState<
    Array<{ id: number; name: string; type: string }>
  >([]);
  const [productTypes, setProductTypes] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [productSubTypes, setProductSubTypes] = useState<
    Array<{ id: number; name: string; product_type_name?: string }>
  >([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load appropriate lookup data based on rule type
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (ruleType === 'default') {
        return; // No lookup data needed for default rules
      }

      setIsLoadingData(true);
      setErrors({}); // Clear previous errors

      try {
        if (ruleType === 'resource') {
          const data = await fetchResources();
          if (isMounted) {
            setResources(data);
            if (data.length === 0) {
              setErrors({
                target: 'No resources available. Please create resources first.',
              });
            }
          }
        } else if (ruleType === 'product_type') {
          const data = await fetchProductTypes();
          if (isMounted) {
            setProductTypes(data);
            if (data.length === 0) {
              setErrors({
                target:
                  'No product types available. Please create product types first.',
              });
            }
          }
        } else if (ruleType === 'product_sub_type') {
          const data = await fetchProductSubTypes();
          if (isMounted) {
            setProductSubTypes(data);
            if (data.length === 0) {
              setErrors({
                target:
                  'No product sub-types available. Please create product sub-types first.',
              });
            }
          }
        }
      } catch (error) {
        console.error('Failed to load lookup data:', error);
        if (isMounted) {
          let errorMessage = 'Failed to load options. Please try again.';
          if (error instanceof Error) {
            if (
              error.message.includes('network') ||
              error.message.includes('fetch')
            ) {
              errorMessage = 'Network error. Please check your connection.';
            } else if (
              error.message.includes('permission') ||
              error.message.includes('auth')
            ) {
              errorMessage = 'Permission denied. Please refresh the page.';
            }
          }
          setErrors({ target: errorMessage });
        }
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [ruleType, fetchResources, fetchProductTypes, fetchProductSubTypes]);

  // Convert target data to dropdown options format
  const targetDropdownOptions: DropdownOption[] = useMemo(() => {
    if (ruleType === 'resource') {
      return resources.map((r) => ({
        id: r.id,
        label: r.name,
        subtitle: r.type,
        group: r.type,
      }));
    } else if (ruleType === 'product_type') {
      return productTypes.map((t) => ({
        id: t.id,
        label: t.name,
      }));
    } else if (ruleType === 'product_sub_type') {
      return productSubTypes.map((st) => ({
        id: st.id,
        label: st.name,
        subtitle: st.product_type_name,
        group: st.product_type_name,
      }));
    }
    return [];
  }, [ruleType, resources, productTypes, productSubTypes]);

  // Convert accounts to dropdown options format
  const accountDropdownOptions: DropdownOption[] = useMemo(() => {
    return accounts.map((a) => ({
      id: a.id,
      label: a.name,
      subtitle: a.external_id,
    }));
  }, [accounts]);

  // Get target name for preview
  const getTargetName = (): string => {
    if (!targetId) return '';

    if (ruleType === 'resource') {
      const resource = resources.find((r) => r.id === targetId);
      return resource ? `${resource.type} "${resource.name}"` : '';
    } else if (ruleType === 'product_type') {
      const type = productTypes.find((t) => t.id === targetId);
      return type ? type.name : '';
    } else if (ruleType === 'product_sub_type') {
      const subType = productSubTypes.find((st) => st.id === targetId);
      return subType ? subType.name : '';
    }

    return '';
  };

  // Get account name for preview
  const getAccountName = (): string => {
    if (!accountId) return '';
    const account = accounts.find((a) => a.id === accountId);
    if (account) {
      return `${account.name} (${account.external_id})`;
    }
    return '';
  };

  // Generate preview text
  const getPreviewText = (): string => {
    const accountName = getAccountName();

    if (ruleType === 'resource' && targetId && accountId) {
      return `When selling on ${getTargetName()}, allocate to ${accountName}`;
    } else if (ruleType === 'product_sub_type' && targetId && accountId) {
      return `When selling ${getTargetName()} products, allocate to ${accountName}`;
    } else if (ruleType === 'product_type' && targetId && accountId) {
      return `When selling ${getTargetName()} products, allocate to ${accountName}`;
    } else if (ruleType === 'default' && accountId) {
      return `For all other sales, allocate to ${accountName}`;
    }

    return 'Please complete the form to see preview';
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: { target?: string; account?: string } = {};

    // Target validation (required for non-default rules)
    if (ruleType !== 'default' && !targetId) {
      newErrors.target = 'Please select a target';
    }

    // Account validation (always required)
    if (!accountId) {
      newErrors.account = 'Please select a GL account';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = () => {
    if (!validate()) {
      return;
    }

    const ruleData: RuleFormData = {
      rule_type: ruleType,
      target_id: ruleType === 'default' ? null : targetId,
      account_id: accountId!,
    };

    onSave(ruleData);
  };

  // Get rule type display name
  const getRuleTypeName = (): string => {
    const names: Record<RuleType, string> = {
      resource: 'Resource Rule',
      product_sub_type: 'Product Sub-Type Rule',
      product_type: 'Product Type Rule',
      default: 'Default Rule',
    };
    return names[ruleType];
  };

  // Get dropdown label based on rule type
  const getDropdownLabel = (): string => {
    if (ruleType === 'resource') return 'Select Resource';
    if (ruleType === 'product_type') return 'Select Product Type';
    if (ruleType === 'product_sub_type') return 'Select Product Sub-Type';
    return 'Select Target';
  };

  // Get dropdown placeholder based on rule type
  const getDropdownPlaceholder = (): string => {
    if (ruleType === 'resource') return 'Search for a resource...';
    if (ruleType === 'product_type') return 'Search for a product type...';
    if (ruleType === 'product_sub_type')
      return 'Search for a product sub-type...';
    return 'Search...';
  };

  // Handle dropdown value change
  const handleTargetChange = (value: number | string | null) => {
    setTargetId(value as number | null);
    // Clear error on change
    if (errors.target) {
      setErrors({ ...errors, target: undefined });
    }
  };

  const handleAccountChange = (value: number | string | null) => {
    setAccountId(value as number | null);
    // Clear error on change
    if (errors.account) {
      setErrors({ ...errors, account: undefined });
    }
  };

  return (
    <div>
      <h4
        style={{
          fontSize: 'var(--text-lg)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--spacing-4)',
        }}
      >
        Configure {getRuleTypeName()}
      </h4>

      {/* Target Selector (hidden for default rules) */}
      {ruleType !== 'default' && (
        <div style={{ marginBottom: 'var(--spacing-4)' }}>
          {/* Loading skeleton for dropdown */}
          {isLoadingData ? (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-text)',
                  marginBottom: 'var(--spacing-2)',
                }}
              >
                {getDropdownLabel()}{' '}
                <span
                  style={{ color: 'var(--color-error-500)' }}
                  aria-label="required"
                >
                  *
                </span>
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-3)',
                  padding: 'var(--spacing-4)',
                  backgroundColor: 'var(--color-surface-secondary)',
                  border: 'var(--border-width-default) solid var(--color-border)',
                  borderRadius: 'var(--radius-card)',
                }}
              >
                <Loader2
                  size={20}
                  style={{
                    color: 'var(--color-primary-600)',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-text)',
                      marginBottom: 'var(--spacing-1)',
                    }}
                  >
                    Loading available options...
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    Fetching {ruleType === 'resource' ? 'resources' : 'product types'} from the database
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <SearchableDropdown
              id="target-selector"
              label={getDropdownLabel()}
              options={targetDropdownOptions}
              value={targetId}
              onChange={handleTargetChange}
              placeholder={getDropdownPlaceholder()}
              isLoading={isLoadingData}
              error={errors.target}
              required
              aria-describedby={errors.target ? 'target-error' : undefined}
            />
          )}
        </div>
      )}

      {/* GL Account Selector */}
      <div style={{ marginBottom: 'var(--spacing-4)' }}>
        {accounts.length === 0 ? (
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text)',
                marginBottom: 'var(--spacing-2)',
              }}
            >
              GL Account{' '}
              <span
                style={{ color: 'var(--color-error-500)' }}
                aria-label="required"
              >
                *
              </span>
            </label>
            <div
              style={{
                padding: 'var(--spacing-3)',
                backgroundColor: 'var(--color-warning-50)',
                border: '1px solid var(--color-warning-200)',
                borderRadius: 'var(--radius-card)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-warning-700)',
              }}
            >
              No GL accounts available. Please create accounts in the "Manage Accounts" tab first.
            </div>
          </div>
        ) : (
          <SearchableDropdown
            id="account-selector"
            label="GL Account"
            options={accountDropdownOptions}
            value={accountId}
            onChange={handleAccountChange}
            placeholder="Search for an account..."
            error={errors.account}
            required
            aria-describedby={errors.account ? 'account-error' : undefined}
          />
        )}
      </div>

      {/* Rule Preview */}
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <label
          style={{
            display: 'block',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-text)',
            marginBottom: 'var(--spacing-2)',
          }}
        >
          Rule Preview
        </label>

        <div
          style={{
            padding: 'var(--spacing-4)',
            backgroundColor: 'var(--color-surface-secondary)',
            border: `var(--border-width-default) solid var(--color-border)`,
            borderRadius: 'var(--radius-card)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
            fontStyle: 'italic',
            lineHeight: '1.5',
          }}
        >
          {getPreviewText()}
        </div>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 'var(--spacing-3)',
        }}
      >
        <button
          className="btn-secondary"
          onClick={onCancel}
          disabled={isSaving}
          style={{ minWidth: '100px' }}
        >
          Cancel
        </button>
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={isLoadingData || isSaving || accounts.length === 0}
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
                aria-hidden="true"
              />
              <span>{initialData ? 'Updating...' : 'Adding...'}</span>
            </>
          ) : (
            initialData ? 'Update Rule' : 'Add Rule'
          )}
        </button>
      </div>

      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
