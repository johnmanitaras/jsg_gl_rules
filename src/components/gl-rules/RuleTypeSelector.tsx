/**
 * RuleTypeSelector Component
 *
 * Displays 4 option cards for selecting rule type when adding a new GL rule
 * Features:
 * - Visual cards for each rule type (Resource, Product Sub-Type, Product Type, Default)
 * - Icons and priority labels for each option
 * - Disabled state for default rule if already exists
 * - Hover and click interactions
 */

import React from 'react';
import { Flame, Star, FileText, RefreshCw, Check } from 'lucide-react';
import { RuleType } from '../../types/gl-rules';

interface RuleTypeSelectorProps {
  onSelectType: (ruleType: RuleType) => void;
  hasDefaultRule: boolean; // Disable default option if true
}

interface RuleTypeOption {
  type: RuleType;
  icon: React.ReactNode;
  name: string;
  priorityLabel: string;
  description: string;
}

export function RuleTypeSelector({
  onSelectType,
  hasDefaultRule,
}: RuleTypeSelectorProps) {
  const options: RuleTypeOption[] = [
    {
      type: 'resource',
      icon: <Flame size={20} aria-hidden="true" />,
      name: 'Resource Rule',
      priorityLabel: 'Highest Priority',
      description:
        'Set GL account for a specific vessel, bus, or venue',
    },
    {
      type: 'product_sub_type',
      icon: <Star size={20} aria-hidden="true" />,
      name: 'Product Sub-Type Rule',
      priorityLabel: 'High Priority',
      description:
        'Set GL account for a category like "Dinner Cruise" or "Day Ferry"',
    },
    {
      type: 'product_type',
      icon: <FileText size={20} aria-hidden="true" />,
      name: 'Product Type Rule',
      priorityLabel: 'Medium Priority',
      description:
        'Set GL account for broad types like "Ferry" or "Tour"',
    },
    {
      type: 'default',
      icon: <RefreshCw size={20} aria-hidden="true" />,
      name: 'Default Rule',
      priorityLabel: 'Fallback (Required)',
      description: 'Applies when no other rules match',
    },
  ];

  const handleSelectType = (type: RuleType) => {
    // Don't allow selecting default if it already exists
    if (type === 'default' && hasDefaultRule) {
      return;
    }
    onSelectType(type);
  };

  return (
    <div>
      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--spacing-4)',
        }}
      >
        Select the type of rule to add:
      </p>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-3)',
        }}
      >
        {options.map((option) => {
          const isDisabled = option.type === 'default' && hasDefaultRule;

          return (
            <button
              key={option.type}
              onClick={() => handleSelectType(option.type)}
              disabled={isDisabled}
              aria-label={`${option.name} - ${option.priorityLabel}. ${option.description}${
                isDisabled ? ' (Already added)' : ''
              }`}
              style={{
                width: '100%',
                padding: 'var(--spacing-4)',
                border: `var(--border-width-default) solid var(--color-border)`,
                borderRadius: 'var(--radius-card)',
                backgroundColor: 'var(--color-surface-primary)',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.5 : 1,
                textAlign: 'left',
                transition: 'all 150ms ease-out',
              }}
              onMouseEnter={(e) => {
                if (!isDisabled) {
                  e.currentTarget.style.borderColor =
                    'var(--color-primary-600)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDisabled) {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--spacing-3)',
                }}
              >
                <div
                  style={{
                    color: 'var(--color-primary-600)',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  {option.icon}
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 'var(--spacing-1)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--text-base)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {option.name}
                    </span>

                    {isDisabled && (
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-1)',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--color-success-600)',
                        }}
                      >
                        <Check size={14} aria-hidden="true" />
                        Already added
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-text-tertiary)',
                      marginBottom: 'var(--spacing-2)',
                    }}
                  >
                    {option.priorityLabel}
                  </div>

                  <div
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-text-secondary)',
                      lineHeight: '1.5',
                    }}
                  >
                    {option.description}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
