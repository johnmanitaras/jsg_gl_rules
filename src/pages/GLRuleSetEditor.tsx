/**
 * GL Rule Set Editor Page
 *
 * Rules editor for a specific GL rule set.
 * Displays:
 * - Rule set header with name, type, and date range
 * - Rules list with priority-based sorting
 * - Add/Edit/Delete rule functionality
 * - Validation to ensure one default rule exists
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Calculator, Calendar, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePermissions } from '../contexts/PermissionsContext';
import { useGLRuleSets } from '../hooks/useGLRuleSets';
import { useGLRules } from '../hooks/useGLRules';
import { useAccounts } from '../hooks/useAccounts';
import {
  GLRuleSet,
  GLRule,
  RuleFormData,
  RuleType,
  Account,
  RULE_SET_TYPE_NAMES,
} from '../types/gl-rules';
import { RuleList } from '../components/gl-rules/RuleList';
import { RuleBuilder } from '../components/gl-rules/RuleBuilder';
import { RuleConfigForm } from '../components/gl-rules/RuleConfigForm';

export function GLRuleSetEditor() {
  const { canEdit } = usePermissions();
  const { ruleSetId } = useParams<{ ruleSetId: string }>();
  const navigate = useNavigate();

  // Hooks
  const { fetchRuleSet } = useGLRuleSets();
  const {
    fetchRulesByRuleSet,
    createRule,
    updateRule,
    deleteRule,
  } = useGLRules();
  const { fetchAccounts } = useAccounts();

  // State
  const [ruleSet, setRuleSet] = useState<GLRuleSet | null>(null);
  const [rules, setRules] = useState<(GLRule & { id?: number })[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Edit state
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);

  // Load rule set, rules, and accounts data
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!ruleSetId) {
        setError('Rule Set ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch rule set details
        const ruleSetData = await fetchRuleSet(parseInt(ruleSetId, 10));
        if (isMounted) {
          setRuleSet(ruleSetData);
        }

        // Fetch accounts for dropdown
        const accountsData = await fetchAccounts();
        if (isMounted) {
          setAccounts(accountsData);
        }

        // Fetch rules for this rule set
        try {
          const rulesData = await fetchRulesByRuleSet(parseInt(ruleSetId, 10));
          if (isMounted) {
            setRules(rulesData);
          }
        } catch (rulesError) {
          console.warn('Could not fetch rules (table may not exist yet):', rulesError);
          if (isMounted) {
            setRules([]);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading data:', err);
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load rule set'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [ruleSetId, fetchRuleSet, fetchRulesByRuleSet, fetchAccounts]);

  // Handle adding a new rule
  const handleAddRule = useCallback(
    async (rule: RuleFormData) => {
      if (!ruleSetId) return;

      try {
        setIsSaving(true);
        const newRule = await createRule(parseInt(ruleSetId, 10), rule);

        // Add to local state with the new ID
        setRules((prev) => [...prev, newRule]);
      } catch (err) {
        console.error('Error adding rule:', err);
        setError(err instanceof Error ? err.message : 'Failed to add rule');
      } finally {
        setIsSaving(false);
      }
    },
    [ruleSetId, createRule]
  );

  // Handle editing a rule
  const handleEditRule = useCallback((index: number) => {
    setEditingRuleIndex(index);
  }, []);

  // Handle saving edited rule
  const handleSaveEditedRule = useCallback(
    async (updatedRule: RuleFormData) => {
      if (editingRuleIndex === null) return;

      const existingRule = rules[editingRuleIndex];
      const ruleId = existingRule.id;

      if (!ruleId) {
        // New rule that hasn't been saved yet
        setRules((prev) => {
          const newRules = [...prev];
          newRules[editingRuleIndex] = {
            ...newRules[editingRuleIndex],
            ...updatedRule,
          };
          return newRules;
        });
        setEditingRuleIndex(null);
        return;
      }

      try {
        setIsSaving(true);
        const updated = await updateRule(ruleId, {
          rule_type: updatedRule.rule_type,
          target_id: updatedRule.target_id,
          account_id: updatedRule.account_id,
        });

        setRules((prev) => {
          const newRules = [...prev];
          newRules[editingRuleIndex] = updated;
          return newRules;
        });

        setEditingRuleIndex(null);
      } catch (err) {
        console.error('Error updating rule:', err);
        setError(err instanceof Error ? err.message : 'Failed to update rule');
      } finally {
        setIsSaving(false);
      }
    },
    [editingRuleIndex, rules, updateRule]
  );

  // Handle deleting a rule
  const handleDeleteRule = useCallback(
    async (index: number) => {
      const ruleToDelete = rules[index];
      const ruleId = ruleToDelete.id;

      if (!ruleId) {
        // Rule hasn't been saved yet, just remove from local state
        setRules((prev) => prev.filter((_, i) => i !== index));
        return;
      }

      try {
        setIsSaving(true);
        await deleteRule(ruleId);
        setRules((prev) => prev.filter((_, i) => i !== index));
      } catch (err) {
        console.error('Error deleting rule:', err);
        setError(err instanceof Error ? err.message : 'Failed to delete rule');
      } finally {
        setIsSaving(false);
      }
    },
    [rules, deleteRule]
  );

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditingRuleIndex(null);
  }, []);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Check if rule set is active (includes today)
  const isRuleSetActive = () => {
    if (!ruleSet) return false;
    const today = new Date();
    const startDate = new Date(ruleSet.start_date);
    const endDate = new Date(ruleSet.end_date);
    return today >= startDate && today <= endDate;
  };

  // Check if rule set has a default rule
  const hasDefaultRule = rules.some((r) => r.rule_type === 'default');

  // Convert rules for RuleList display
  const rulesForDisplay: RuleFormData[] = rules.map((r) => ({
    rule_type: r.rule_type as RuleType,
    target_id: r.target_id,
    account_id: r.account_id,
  }));

  // Loading State
  if (loading) {
    return (
      <div
        className="min-h-screen"
        style={{
          backgroundColor: 'var(--color-background)',
          padding: 'var(--spacing-6)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-3)',
            marginBottom: 'var(--spacing-6)',
          }}
        >
          <button
            onClick={() => navigate('/?tab=rules')}
            className="btn-secondary"
            style={{
              width: '40px',
              height: '40px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div
              style={{
                height: '32px',
                width: '200px',
                backgroundColor: 'var(--color-neutral-200)',
                borderRadius: 'var(--radius-sm)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          </div>
        </div>
        <div
          className="card"
          style={{ padding: 'var(--spacing-8)', textAlign: 'center' }}
        >
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Loading GL rules...
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div
        className="min-h-screen"
        style={{
          backgroundColor: 'var(--color-background)',
          padding: 'var(--spacing-6)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-3)',
            marginBottom: 'var(--spacing-6)',
          }}
        >
          <button
            onClick={() => navigate('/?tab=rules')}
            className="btn-secondary"
            style={{
              width: '40px',
              height: '40px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text)',
              margin: 0,
            }}
          >
            GL Rules
          </h1>
        </div>

        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: 'var(--spacing-8)',
          }}
        >
          <AlertCircle
            size={48}
            style={{
              color: 'var(--color-error-500)',
              margin: '0 auto var(--spacing-4)',
            }}
          />
          <h2
            style={{
              fontSize: 'var(--text-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text)',
              marginBottom: 'var(--spacing-2)',
            }}
          >
            Unable to load rules
          </h2>
          <p
            style={{
              fontSize: 'var(--text-base)',
              color: 'var(--color-text-secondary)',
              maxWidth: '480px',
              margin: '0 auto var(--spacing-4)',
            }}
          >
            {error}
          </p>
          <button
            className="btn-primary"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Success State
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {/* Sticky Header */}
      <div
        className="sticky top-0 z-20"
        style={{
          backgroundColor: 'var(--color-background)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ padding: 'var(--spacing-6)' }}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--spacing-4)',
              }}
            >
              <button
                onClick={() => navigate('/?tab=rules')}
                className="btn-secondary"
                style={{
                  width: '40px',
                  height: '40px',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                aria-label="Back to rule sets"
              >
                <ArrowLeft size={20} />
              </button>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--spacing-3)',
                }}
              >
                <Calculator
                  size={32}
                  style={{
                    color: 'var(--color-primary-600)',
                    marginTop: '2px',
                  }}
                />
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-2)',
                      marginBottom: 'var(--spacing-1)',
                    }}
                  >
                    <h1
                      style={{
                        fontSize: 'var(--text-2xl)',
                        fontWeight: 'var(--font-weight-bold)',
                        color: 'var(--color-text)',
                        margin: 0,
                      }}
                    >
                      {ruleSet?.name}
                    </h1>
                    {/* Type Badge */}
                    {ruleSet && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-1)',
                          padding: 'var(--spacing-1) var(--spacing-2)',
                          backgroundColor:
                            ruleSet.type === 'revenue'
                              ? 'var(--color-success-50)'
                              : 'var(--color-warning-50)',
                          color:
                            ruleSet.type === 'revenue'
                              ? 'var(--color-success-700)'
                              : 'var(--color-warning-700)',
                          borderRadius: 'var(--radius-badge)',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 'var(--font-weight-medium)',
                        }}
                      >
                        {RULE_SET_TYPE_NAMES[ruleSet.type]}
                      </span>
                    )}
                    {isRuleSetActive() && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-1)',
                          padding: 'var(--spacing-1) var(--spacing-2)',
                          backgroundColor: 'var(--badge-success-bg)',
                          color: 'var(--badge-success-text)',
                          borderRadius: 'var(--radius-badge)',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 'var(--font-weight-medium)',
                        }}
                      >
                        <CheckCircle size={12} />
                        Active
                      </span>
                    )}
                  </div>
                  {ruleSet && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-2)',
                        color: 'var(--color-text-secondary)',
                        fontSize: 'var(--text-sm)',
                      }}
                    >
                      <Calendar size={16} />
                      <span>
                        {formatDate(ruleSet.start_date)} - {formatDate(ruleSet.end_date)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status indicator */}
            {isSaving && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-2)',
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid var(--color-primary-300)',
                    borderTopColor: 'var(--color-primary-600)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                Saving...
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className="flex-grow"
        style={{ padding: '0 var(--spacing-6) var(--spacing-6)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="card" style={{ padding: 'var(--spacing-6)' }}>
            {/* Section Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--spacing-4)',
              }}
            >
              <h2
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text)',
                  margin: 0,
                }}
              >
                GL Allocation Rules
              </h2>
              <span
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {rules.length} {rules.length === 1 ? 'rule' : 'rules'}
              </span>
            </div>

            {/* Validation Status */}
            <AnimatePresence mode="wait">
              {hasDefaultRule ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  role="status"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-3)',
                    padding: 'var(--spacing-3) var(--spacing-4)',
                    backgroundColor: 'var(--alert-success-bg)',
                    border:
                      'var(--border-width-default) solid var(--alert-success-border)',
                    borderRadius: 'var(--radius-card)',
                    marginBottom: 'var(--spacing-4)',
                  }}
                >
                  <CheckCircle
                    size={20}
                    style={{
                      color: 'var(--alert-success-icon)',
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  />
                  <span
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    This rule set is properly configured with a default fallback rule.
                  </span>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* Rules List or Edit Form */}
            {editingRuleIndex !== null ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: 'var(--spacing-4)',
                  backgroundColor: 'var(--color-surface-secondary)',
                  border: 'var(--border-width-default) solid var(--color-border)',
                  borderRadius: 'var(--radius-card)',
                  marginBottom: 'var(--spacing-4)',
                }}
              >
                <h3
                  style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text)',
                    marginBottom: 'var(--spacing-4)',
                  }}
                >
                  Edit Rule
                </h3>
                <RuleConfigForm
                  ruleType={rules[editingRuleIndex].rule_type as RuleType}
                  initialData={{
                    rule_type: rules[editingRuleIndex].rule_type as RuleType,
                    target_id: rules[editingRuleIndex].target_id,
                    account_id: rules[editingRuleIndex].account_id,
                  }}
                  accounts={accounts}
                  onSave={handleSaveEditedRule}
                  onCancel={handleCancelEdit}
                  isSaving={isSaving}
                />
              </motion.div>
            ) : (
              <>
                {/* Rules List */}
                <div style={{ marginBottom: 'var(--spacing-4)' }}>
                  <RuleList
                    rules={rulesForDisplay}
                    accounts={accounts}
                    onEditRule={handleEditRule}
                    onDeleteRule={handleDeleteRule}
                    canEdit={canEdit}
                  />
                </div>

                {/* Add Rule Builder */}
                {canEdit && (
                  <RuleBuilder
                    rules={rulesForDisplay}
                    accounts={accounts}
                    onAddRule={handleAddRule}
                    isSaving={isSaving}
                  />
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
