/**
 * AddRuleSetModal Component
 *
 * Modal for creating or editing GL rule sets.
 * Includes date validation to prevent overlapping rule sets within the same type.
 * Uses smart date pre-filling based on existing rule sets and selected gap.
 * Allows copying rules from an existing rule set of the same type.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, AlertCircle, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TimelineGap } from '@jetsetgo/shared-components';
import { useGLRuleSets } from '../../hooks/useGLRuleSets';
import { useGLRules } from '../../hooks/useGLRules';
import {
  GLRuleSet,
  GLRuleSetType,
  RuleSetFormData,
  getRuleSetTypeFromLaneId,
  RULE_SET_TYPE_NAMES,
} from '../../types/gl-rules';
import { calculateDefaultDates } from '../../utils/dateCalculations';

interface AddRuleSetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  ruleSet?: GLRuleSet; // If editing existing rule set
  gap?: TimelineGap; // Gap from Timeline component (has start/end as Date objects)
  laneId?: number | null; // Lane ID determines type (0 = revenue, 1 = commission)
  existingRuleSets?: GLRuleSet[]; // All existing rule sets for smart date defaults
}

export function AddRuleSetModal({
  isOpen,
  onClose,
  onSaved,
  ruleSet,
  gap,
  laneId,
  existingRuleSets = [],
}: AddRuleSetModalProps) {
  const { createRuleSet, updateRuleSet, checkOverlap } = useGLRuleSets();
  const { fetchRulesByRuleSet, bulkCreateRules } = useGLRules();

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState<GLRuleSetType>('revenue');
  const [copyFromRuleSetId, setCopyFromRuleSetId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine the type based on laneId or existing ruleSet
  const determinedType = useMemo(() => {
    if (ruleSet) {
      return ruleSet.type;
    }
    if (laneId !== undefined && laneId !== null) {
      return getRuleSetTypeFromLaneId(laneId);
    }
    return 'revenue';
  }, [ruleSet, laneId]);

  // Filter existing rule sets to only show those of the same type for copying
  const copyableRuleSets = useMemo(() => {
    return existingRuleSets.filter((rs) => rs.type === determinedType);
  }, [existingRuleSets, determinedType]);

  // Filter existing rule sets of the same type for overlap calculation
  const sameTypeRuleSets = useMemo(() => {
    return existingRuleSets.filter((rs) => rs.type === determinedType);
  }, [existingRuleSets, determinedType]);

  // Calculate smart default dates based on gap and existing rule sets of the same type
  const defaultDates = useMemo(() => {
    if (ruleSet) {
      // If editing, don't calculate defaults - we'll use the rule set's dates
      return null;
    }
    // Convert gap to the format expected by calculateDefaultDates
    const gapForCalc = gap ? { start: gap.start, end: gap.end } : null;
    // Convert GLRuleSet[] to the format expected by calculateDefaultDates
    const versionsForCalc = sameTypeRuleSets.map((rs) => ({
      id: rs.id,
      name: rs.name,
      start_date: rs.start_date,
      end_date: rs.end_date,
    }));
    return calculateDefaultDates(gapForCalc, versionsForCalc);
  }, [gap, sameTypeRuleSets, ruleSet]);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (ruleSet) {
        // Editing existing rule set
        setName(ruleSet.name);
        setStartDate(ruleSet.start_date);
        setEndDate(ruleSet.end_date);
        setType(ruleSet.type);
      } else {
        // Creating new rule set
        setName('');
        setType(determinedType);
        if (defaultDates) {
          setStartDate(defaultDates.startDate);
          setEndDate(defaultDates.endDate);
        } else {
          setStartDate('');
          setEndDate('');
        }
        setCopyFromRuleSetId(null);
      }
      setError(null);
    }
  }, [isOpen, ruleSet, determinedType, defaultDates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Rule set name is required');
      return;
    }

    if (!startDate || !endDate) {
      setError('Start date and end date are required');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setError('End date must be after start date');
      return;
    }

    // Check for overlapping rule sets within the same type
    try {
      setLoading(true);

      const hasOverlap = await checkOverlap(
        type,
        startDate,
        endDate,
        ruleSet?.id // Exclude current rule set if editing
      );

      if (hasOverlap) {
        setError(
          `This date range overlaps with an existing ${RULE_SET_TYPE_NAMES[type].toLowerCase()} rule set. Please choose different dates.`
        );
        setLoading(false);
        return;
      }

      const data: RuleSetFormData = {
        name: name.trim(),
        start_date: startDate,
        end_date: endDate,
        type,
      };

      if (ruleSet) {
        // Update existing rule set (type cannot be changed)
        await updateRuleSet(ruleSet.id, {
          name: data.name,
          start_date: data.start_date,
          end_date: data.end_date,
        });
      } else {
        // Create new rule set
        const newRuleSet = await createRuleSet(data);

        // Copy rules from source rule set if selected
        if (copyFromRuleSetId && newRuleSet?.id) {
          const sourceRules = await fetchRulesByRuleSet(copyFromRuleSetId);
          if (sourceRules.length > 0) {
            await bulkCreateRules(
              newRuleSet.id,
              sourceRules.map((r) => ({
                rule_type: r.rule_type,
                target_id: r.target_id,
                account_id: r.account_id,
              }))
            );
          }
        }
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error('Error saving rule set:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save rule set. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
            }}
          />

          {/* Modal */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1001,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--spacing-4)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              style={{
                width: '100%',
                maxWidth: '500px',
                maxHeight: '90vh',
                overflow: 'auto',
                backgroundColor: 'var(--color-surface-primary, #ffffff)',
                borderRadius: 'var(--radius-card, 0.75rem)',
                border:
                  'var(--border-width-default, 1px) solid var(--color-border, #e5e7eb)',
                boxShadow:
                  'var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05))',
                padding: 'var(--spacing-6, 1.5rem)',
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--spacing-4)',
                }}
              >
                <h2
                  style={{
                    fontSize: 'var(--text-xl)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-primary)',
                    margin: 0,
                  }}
                >
                  {ruleSet ? 'Edit Rule Set' : `Add ${RULE_SET_TYPE_NAMES[determinedType]} Rule Set`}
                </h2>
                <button
                  onClick={onClose}
                  className="btn-secondary"
                  style={{
                    width: '32px',
                    height: '32px',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Type Badge */}
              <div
                style={{
                  marginBottom: 'var(--spacing-4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-2)',
                  padding: 'var(--spacing-2) var(--spacing-3)',
                  backgroundColor:
                    determinedType === 'revenue'
                      ? 'var(--color-success-50)'
                      : 'var(--color-warning-50)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor:
                      determinedType === 'revenue'
                        ? 'var(--color-success-500)'
                        : 'var(--color-warning-500)',
                  }}
                />
                <span
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color:
                      determinedType === 'revenue'
                        ? 'var(--color-success-700)'
                        : 'var(--color-warning-700)',
                  }}
                >
                  {RULE_SET_TYPE_NAMES[determinedType]} Rules
                </span>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-2)',
                    padding: 'var(--spacing-3)',
                    backgroundColor: 'var(--color-error-50)',
                    border: '1px solid var(--color-error-200)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--spacing-4)',
                  }}
                >
                  <AlertCircle
                    size={20}
                    style={{ color: 'var(--color-error-600)' }}
                  />
                  <p
                    style={{
                      margin: 0,
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-error-700)',
                    }}
                  >
                    {error}
                  </p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit}>
                {/* Rule Set Name */}
                <div style={{ marginBottom: 'var(--spacing-4)' }}>
                  <label
                    htmlFor="ruleset-name"
                    style={{
                      display: 'block',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-text-primary)',
                      marginBottom: 'var(--spacing-1-5)',
                    }}
                  >
                    Rule Set Name
                  </label>
                  <input
                    id="ruleset-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Q1 2024 Revenue Rules"
                    className="input"
                    autoFocus
                    disabled={loading}
                  />
                </div>

                {/* Start Date */}
                <div style={{ marginBottom: 'var(--spacing-4)' }}>
                  <label
                    htmlFor="start-date"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-1-5)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-text-primary)',
                      marginBottom: 'var(--spacing-1-5)',
                    }}
                  >
                    <Calendar size={16} />
                    <span>Start Date</span>
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input"
                    disabled={loading}
                  />
                </div>

                {/* End Date */}
                <div style={{ marginBottom: 'var(--spacing-4)' }}>
                  <label
                    htmlFor="end-date"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-1-5)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-text-primary)',
                      marginBottom: 'var(--spacing-1-5)',
                    }}
                  >
                    <Calendar size={16} />
                    <span>End Date</span>
                  </label>
                  <input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input"
                    disabled={loading}
                  />
                </div>

                {/* Copy Rules From (only for new rule sets, same type only) */}
                {!ruleSet && copyableRuleSets.length > 0 && (
                  <div style={{ marginBottom: 'var(--spacing-6)' }}>
                    <label
                      htmlFor="copy-from-ruleset"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-1-5)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-text-primary)',
                        marginBottom: 'var(--spacing-1-5)',
                      }}
                    >
                      <Copy size={16} />
                      <span>Copy Rules From</span>
                    </label>
                    <select
                      id="copy-from-ruleset"
                      value={copyFromRuleSetId ?? ''}
                      onChange={(e) =>
                        setCopyFromRuleSetId(
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      className="input"
                      disabled={loading}
                    >
                      <option value="">Don't copy rules (start empty)</option>
                      {copyableRuleSets.map((rs) => (
                        <option key={rs.id} value={rs.id}>
                          {rs.name} ({rs.start_date} to {rs.end_date})
                        </option>
                      ))}
                    </select>
                    <p
                      style={{
                        marginTop: 'var(--spacing-1-5)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      Optionally copy GL rules from an existing {RULE_SET_TYPE_NAMES[determinedType].toLowerCase()} rule set
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    gap: 'var(--spacing-3)',
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-secondary"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                    aria-busy={loading}
                  >
                    {loading
                      ? 'Saving...'
                      : ruleSet
                      ? 'Update Rule Set'
                      : 'Create Rule Set'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
