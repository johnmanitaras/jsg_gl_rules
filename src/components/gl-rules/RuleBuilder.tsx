/**
 * RuleBuilder Component
 *
 * Orchestrates the add GL rule workflow
 * Features:
 * - Three states: Initial (+ Add Rule button), Type Selection, Configuration
 * - Workflow: Click button → Select type → Configure rule → Add
 * - Warning alert if no default rule exists
 * - Cancel at any step returns to initial state
 */

import { useState, useCallback } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { RuleType, RuleFormData, Account } from '../../types/gl-rules';
import { RuleTypeSelector } from './RuleTypeSelector';
import { RuleConfigForm } from './RuleConfigForm';

interface RuleBuilderProps {
  rules: RuleFormData[]; // Existing rules
  accounts: Account[]; // Available GL accounts
  onAddRule: (rule: RuleFormData) => void;
  isSaving?: boolean; // True when API call is in progress
}

type WorkflowState = 'initial' | 'type-selection' | 'configuration';

export function RuleBuilder({
  rules,
  accounts,
  onAddRule,
  isSaving = false,
}: RuleBuilderProps) {
  const [workflowState, setWorkflowState] = useState<WorkflowState>('initial');
  const [selectedRuleType, setSelectedRuleType] = useState<RuleType | null>(
    null
  );

  // Check if default rule exists
  const hasDefaultRule = rules.some((rule) => rule.rule_type === 'default');

  // Handle workflow transitions
  const handleAddRuleClick = useCallback(() => {
    setWorkflowState('type-selection');
  }, []);

  const handleTypeSelected = useCallback((ruleType: RuleType) => {
    setSelectedRuleType(ruleType);
    setWorkflowState('configuration');
  }, []);

  const handleRuleSaved = useCallback(
    (rule: RuleFormData) => {
      onAddRule(rule);
      // Reset to initial state
      setWorkflowState('initial');
      setSelectedRuleType(null);
    },
    [onAddRule]
  );

  const handleCancel = useCallback(() => {
    // Reset to initial state
    setWorkflowState('initial');
    setSelectedRuleType(null);
  }, []);

  return (
    <div>
      {/* Warning Alert - Show if no default rule */}
      {!hasDefaultRule && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--spacing-3)',
            padding: 'var(--spacing-4)',
            backgroundColor: 'var(--alert-warning-bg)',
            border: `var(--border-width-default) solid var(--alert-warning-border)`,
            borderRadius: 'var(--radius-card)',
            marginBottom: 'var(--spacing-4)',
          }}
        >
          <AlertTriangle
            size={20}
            style={{ color: 'var(--alert-warning-icon)', flexShrink: 0 }}
            aria-hidden="true"
          />
          <div>
            <div
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--spacing-1)',
              }}
            >
              Each rule set must have exactly one default rule
            </div>
            <div
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
                lineHeight: '1.5',
              }}
            >
              The default rule is used when a booking doesn't match any specific
              resource, sub-type, or type rule.
            </div>
          </div>
        </div>
      )}

      {/* Initial State - Add Rule Button */}
      {workflowState === 'initial' && (
        <button
          className="btn-secondary"
          onClick={handleAddRuleClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-2)',
          }}
          aria-label="Add new GL allocation rule"
        >
          <Plus size={20} aria-hidden="true" />
          Add Rule
        </button>
      )}

      {/* Type Selection State */}
      {workflowState === 'type-selection' && (
        <div
          style={{
            padding: 'var(--spacing-4)',
            backgroundColor: 'var(--color-surface-secondary)',
            border: `var(--border-width-default) solid var(--color-border)`,
            borderRadius: 'var(--radius-card)',
          }}
        >
          <RuleTypeSelector
            onSelectType={handleTypeSelected}
            hasDefaultRule={hasDefaultRule}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: 'var(--spacing-4)',
            }}
          >
            <button
              className="btn-secondary"
              onClick={handleCancel}
              style={{ minWidth: '100px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Configuration State */}
      {workflowState === 'configuration' && selectedRuleType && (
        <div
          style={{
            padding: 'var(--spacing-4)',
            backgroundColor: 'var(--color-surface-secondary)',
            border: `var(--border-width-default) solid var(--color-border)`,
            borderRadius: 'var(--radius-card)',
          }}
        >
          <RuleConfigForm
            ruleType={selectedRuleType}
            accounts={accounts}
            onSave={handleRuleSaved}
            onCancel={handleCancel}
            isSaving={isSaving}
          />
        </div>
      )}
    </div>
  );
}
