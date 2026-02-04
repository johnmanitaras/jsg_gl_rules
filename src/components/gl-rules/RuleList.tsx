/**
 * RuleList Component
 *
 * Displays all GL rules in a rule set, sorted by priority
 * Features:
 * - Priority sorting (resource → sub-type → type → default)
 * - Within each type, alphabetical by target name
 * - Fetches lookup data to display target names
 * - Shows GL account assignment for each rule
 * - Framer Motion animations for add/remove
 * - Empty state when no rules
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText } from 'lucide-react';
import { RuleFormData, Account, RULE_PRIORITY } from '../../types/gl-rules';
import { RuleItem } from './RuleItem';
import { useLookupData } from '../../hooks/useLookupData';

interface RuleListProps {
  rules: RuleFormData[];
  accounts: Account[];
  onEditRule: (index: number) => void;
  onDeleteRule: (index: number) => void;
  canEdit?: boolean;
}

interface RuleWithName extends RuleFormData {
  targetName: string;
  accountName?: string;
  accountExternalId?: string;
  index: number; // Original index in the rules array
}

/**
 * Sort rules by priority, then alphabetically by target name
 * Priority order: resource (1) → product_sub_type (2) → product_type (3) → default (4)
 */
function sortRules(rulesWithNames: RuleWithName[]): RuleWithName[] {
  return [...rulesWithNames].sort((a, b) => {
    // First, sort by priority
    const priorityA = RULE_PRIORITY[a.rule_type];
    const priorityB = RULE_PRIORITY[b.rule_type];

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Within same priority, sort alphabetically by target name
    return a.targetName.localeCompare(b.targetName);
  });
}

export function RuleList({
  rules,
  accounts,
  onEditRule,
  onDeleteRule,
  canEdit = true,
}: RuleListProps) {
  const {
    fetchResources,
    fetchProductTypes,
    fetchProductSubTypes,
  } = useLookupData();

  const [isLoadingLookupData, setIsLoadingLookupData] = useState(true);
  const [lookupData, setLookupData] = useState<{
    resources: Map<number, string>;
    productTypes: Map<number, string>;
    productSubTypes: Map<number, string>;
  }>({
    resources: new Map(),
    productTypes: new Map(),
    productSubTypes: new Map(),
  });

  // Create accounts lookup map
  const accountsMap = new Map<number, Account>(
    accounts.map((a) => [a.id, a])
  );

  // Fetch all lookup data once
  useEffect(() => {
    const loadLookupData = async () => {
      setIsLoadingLookupData(true);
      try {
        const [resources, productTypes, productSubTypes] = await Promise.all([
          fetchResources(),
          fetchProductTypes(),
          fetchProductSubTypes(),
        ]);

        setLookupData({
          resources: new Map(resources.map((r) => [r.id, r.name])),
          productTypes: new Map(productTypes.map((pt) => [pt.id, pt.name])),
          productSubTypes: new Map(productSubTypes.map((pst) => [pst.id, pst.name])),
        });
      } catch (error) {
        console.error('Failed to load lookup data:', error);
      } finally {
        setIsLoadingLookupData(false);
      }
    };

    loadLookupData();
  }, [fetchResources, fetchProductTypes, fetchProductSubTypes]);

  // Get target name for a rule
  const getTargetName = (rule: RuleFormData): string => {
    if (rule.rule_type === 'default') {
      return 'Default';
    }

    if (rule.target_id === null) {
      return 'Unknown';
    }

    switch (rule.rule_type) {
      case 'resource':
        return lookupData.resources.get(rule.target_id) || `Resource #${rule.target_id}`;
      case 'product_type':
        return lookupData.productTypes.get(rule.target_id) || `Type #${rule.target_id}`;
      case 'product_sub_type':
        return lookupData.productSubTypes.get(rule.target_id) || `Sub-Type #${rule.target_id}`;
      default:
        return 'Unknown';
    }
  };

  // Get account info for a rule
  const getAccountInfo = (
    accountId: number
  ): { name?: string; externalId?: string } => {
    const account = accountsMap.get(accountId);
    if (account) {
      return {
        name: account.name,
        externalId: account.external_id,
      };
    }
    return {};
  };

  // Add target names, account info, and sort
  const rulesWithNames: RuleWithName[] = rules.map((rule, index) => {
    const accountInfo = getAccountInfo(rule.account_id);
    return {
      ...rule,
      targetName: getTargetName(rule),
      accountName: accountInfo.name,
      accountExternalId: accountInfo.externalId,
      index,
    };
  });

  const sortedRules = sortRules(rulesWithNames);

  // Loading state
  if (isLoadingLookupData) {
    return (
      <div
        style={{
          padding: 'var(--spacing-4)',
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--text-sm)',
        }}
      >
        Loading rules...
      </div>
    );
  }

  // Empty state
  if (rules.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--spacing-6)',
          backgroundColor: 'var(--color-surface-secondary)',
          border: `var(--border-width-default) solid var(--color-border)`,
          borderRadius: 'var(--radius-card)',
          textAlign: 'center',
        }}
      >
        <FileText
          size={48}
          style={{
            color: 'var(--color-text-tertiary)',
            marginBottom: 'var(--spacing-3)',
          }}
          aria-hidden="true"
        />
        <div
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--spacing-2)',
          }}
        >
          No rules added yet
        </div>
        <div
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
            maxWidth: '400px',
            lineHeight: '1.5',
          }}
        >
          Click "Add Rule" to create your first GL allocation rule. Remember: You must add a
          default rule.
        </div>
      </div>
    );
  }

  // Framer Motion variants for rule items
  const ruleItemVariants = {
    hidden: {
      opacity: 0,
      height: 0,
      marginBottom: 0,
    },
    visible: {
      opacity: 1,
      height: 'auto',
      marginBottom: 'var(--spacing-3)',
      transition: { duration: 0.25, ease: 'easeOut' },
    },
    exit: {
      opacity: 0,
      height: 0,
      marginBottom: 0,
      transition: { duration: 0.2, ease: 'easeIn' },
    },
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AnimatePresence initial={false}>
        {sortedRules.map((ruleWithName) => (
          <motion.div
            key={ruleWithName.index}
            variants={ruleItemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
          >
            <RuleItem
              rule={ruleWithName}
              targetName={ruleWithName.targetName}
              accountName={ruleWithName.accountName}
              accountExternalId={ruleWithName.accountExternalId}
              onEdit={() => onEditRule(ruleWithName.index)}
              onDelete={() => onDeleteRule(ruleWithName.index)}
              canEdit={canEdit}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
