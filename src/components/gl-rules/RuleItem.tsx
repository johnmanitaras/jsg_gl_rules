/**
 * RuleItem Component
 *
 * Displays a single GL rule with:
 * - Priority-based left border color
 * - Rule type icon and label
 * - Target name (resource/type/sub-type)
 * - GL Account assignment
 * - Priority explanation footer
 * - Edit and Delete action buttons
 */

import { Flame, Star, FileText, RefreshCw, Edit2, Trash2 } from 'lucide-react';
import { RuleType, Account, RULE_TYPE_NAMES, PRIORITY_LABELS } from '../../types/gl-rules';

interface RuleItemProps {
  rule: {
    rule_type: RuleType;
    target_id: number | null;
    account_id: number;
  };
  targetName: string; // Pre-fetched name for display
  accountName?: string; // GL account name
  accountExternalId?: string; // GL account external code
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean; // For loading states
}

// Map rule type to icon component
const RULE_ICONS: Record<RuleType, React.ComponentType<{ size?: number }>> = {
  resource: Flame,
  product_sub_type: Star,
  product_type: FileText,
  default: RefreshCw,
};

export function RuleItem({
  rule,
  targetName,
  accountName,
  accountExternalId,
  onEdit,
  onDelete,
  disabled = false,
}: RuleItemProps) {
  const Icon = RULE_ICONS[rule.rule_type];
  const isDefaultRule = rule.rule_type === 'default';

  // Priority border color based on rule type
  const getBorderColor = (): string => {
    switch (rule.rule_type) {
      case 'resource':
        return 'var(--color-error-500)'; // Red/orange
      case 'product_sub_type':
        return 'var(--color-warning-500)'; // Yellow
      case 'product_type':
        return 'var(--color-info-500)'; // Blue
      case 'default':
        return 'var(--color-neutral-400, #9ca3af)'; // Gray
    }
  };

  // Target description based on rule type
  const getTargetDescription = (): string => {
    switch (rule.rule_type) {
      case 'resource':
        return targetName;
      case 'product_sub_type':
        return `Product Sub-Type: ${targetName}`;
      case 'product_type':
        return `Product Type: ${targetName}`;
      case 'default':
        return 'Applies when no other rules match';
    }
  };

  // Format account display
  const getAccountDisplay = (): string => {
    if (accountName && accountExternalId) {
      return `${accountName} (${accountExternalId})`;
    }
    if (accountName) {
      return accountName;
    }
    if (accountExternalId) {
      return accountExternalId;
    }
    return `Account #${rule.account_id}`;
  };

  return (
    <div
      style={{
        border: `var(--border-width-default) solid var(--color-border)`,
        borderLeft: `4px solid ${getBorderColor()}`,
        borderRadius: 'var(--radius-card)',
        backgroundColor: 'var(--color-surface-primary)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--spacing-4)',
          paddingBottom: 'var(--spacing-2)',
        }}
      >
        {/* Rule type label with icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-2)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text-primary)',
          }}
        >
          <Icon
            size={20}
            style={{ color: getBorderColor() }}
            aria-hidden="true"
          />
          {RULE_TYPE_NAMES[rule.rule_type]}
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-2)',
          }}
        >
          <button
            className="btn-secondary"
            onClick={onEdit}
            disabled={disabled}
            aria-label={`Edit ${RULE_TYPE_NAMES[rule.rule_type]}`}
            style={{
              padding: 'var(--spacing-1) var(--spacing-2)',
              fontSize: 'var(--text-sm)',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-1)',
            }}
          >
            <Edit2 size={14} aria-hidden="true" />
            Edit
          </button>
          <button
            className="btn-secondary"
            onClick={onDelete}
            disabled={disabled || isDefaultRule}
            aria-label={
              isDefaultRule
                ? 'Cannot delete default rule'
                : `Delete ${RULE_TYPE_NAMES[rule.rule_type]}`
            }
            title={
              isDefaultRule
                ? 'Default rule cannot be deleted'
                : undefined
            }
            style={{
              padding: 'var(--spacing-1) var(--spacing-2)',
              fontSize: 'var(--text-sm)',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-1)',
              opacity: isDefaultRule ? 0.5 : 1,
              cursor: isDefaultRule ? 'not-allowed' : undefined,
            }}
          >
            <Trash2 size={14} aria-hidden="true" />
            Delete
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          padding: '0 var(--spacing-4)',
          paddingBottom: 'var(--spacing-3)',
        }}
      >
        {/* Target name */}
        <div
          style={{
            fontSize: 'var(--text-base)',
            color: 'var(--color-text)',
            marginBottom: 'var(--spacing-1)',
          }}
        >
          {getTargetDescription()}
        </div>

        {/* GL Account assignment */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-2)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <span>Allocate to:</span>
          <code
            style={{
              backgroundColor: 'var(--color-neutral-100)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'monospace',
              color: 'var(--color-primary-700)',
            }}
          >
            {getAccountDisplay()}
          </code>
        </div>
      </div>

      {/* Priority footer */}
      <div
        style={{
          padding: 'var(--spacing-2) var(--spacing-4)',
          backgroundColor: 'var(--color-surface-tertiary)',
          borderTop: `var(--border-width-default) solid var(--color-divider)`,
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-tertiary)',
          lineHeight: '1.5',
        }}
      >
        Priority: {PRIORITY_LABELS[rule.rule_type]}
      </div>
    </div>
  );
}
