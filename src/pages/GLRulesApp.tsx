/**
 * GLRulesApp Page
 *
 * Main page for GL Rules management with two tabs:
 * - Manage Accounts: CRUD for GL account definitions
 * - Manage Rules: Timeline view with Revenue and Commission lanes
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Calculator, Plus, Search, AlertCircle } from 'lucide-react';
import { Timeline } from '@jetsetgo/shared-components';
import type { TimelineVersion, TimelineGap, TimelineLane } from '@jetsetgo/shared-components';

import { useAccounts } from '../hooks/useAccounts';
import { useGLRuleSets } from '../hooks/useGLRuleSets';
import { Account, GLRuleSet, GLRuleSetType, getRuleSetTypeFromLaneId, RULE_SET_TYPE_NAMES } from '../types/gl-rules';
import { AccountsTable } from '../components/gl-rules/AccountsTable';
import { AccountFormModal } from '../components/gl-rules/AccountFormModal';
import { AddRuleSetModal } from '../components/gl-rules/AddRuleSetModal';

type TabId = 'accounts' | 'rules';

export function GLRulesApp() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>(
    (searchParams.get('tab') as TabId) || 'accounts'
  );

  // Accounts state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [accountsSearchTerm, setAccountsSearchTerm] = useState('');
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>();

  // Rule sets state
  const [ruleSets, setRuleSets] = useState<GLRuleSet[]>([]);
  const [ruleSetsLoading, setRuleSetsLoading] = useState(true);
  const [ruleSetsError, setRuleSetsError] = useState<string | null>(null);
  const [ruleSetModalOpen, setRuleSetModalOpen] = useState(false);
  const [editingRuleSet, setEditingRuleSet] = useState<GLRuleSet | undefined>();
  const [selectedGap, setSelectedGap] = useState<TimelineGap | undefined>();
  const [selectedLaneId, setSelectedLaneId] = useState<number | null>(null);

  // Hooks
  const {
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    checkExternalIdExists,
  } = useAccounts();

  const {
    fetchAllRuleSets,
    fetchRuleSetsByType,
    createRuleSet,
    updateRuleSet,
    deleteRuleSet,
  } = useGLRuleSets();

  // Update URL when tab changes
  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  // Load accounts
  useEffect(() => {
    let isMounted = true;

    const loadAccounts = async () => {
      try {
        setAccountsLoading(true);
        setAccountsError(null);
        const data = await fetchAccounts();
        if (isMounted) {
          setAccounts(data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading accounts:', err);
          setAccountsError(
            err instanceof Error ? err.message : 'Failed to load accounts'
          );
        }
      } finally {
        if (isMounted) {
          setAccountsLoading(false);
        }
      }
    };

    loadAccounts();

    return () => {
      isMounted = false;
    };
  }, [fetchAccounts]);

  // Load rule sets
  useEffect(() => {
    let isMounted = true;

    const loadRuleSets = async () => {
      try {
        setRuleSetsLoading(true);
        setRuleSetsError(null);
        const data = await fetchAllRuleSets();
        if (isMounted) {
          setRuleSets(data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading rule sets:', err);
          setRuleSetsError(
            err instanceof Error ? err.message : 'Failed to load rule sets'
          );
        }
      } finally {
        if (isMounted) {
          setRuleSetsLoading(false);
        }
      }
    };

    loadRuleSets();

    return () => {
      isMounted = false;
    };
  }, [fetchAllRuleSets]);

  // Account handlers
  const handleCreateAccount = () => {
    setEditingAccount(undefined);
    setAccountModalOpen(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setAccountModalOpen(true);
  };

  const handleSaveAccount = async (data: { name: string; external_id: string }) => {
    if (editingAccount) {
      const updated = await updateAccount(editingAccount.id, data);
      setAccounts((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a))
      );
    } else {
      const created = await createAccount(data);
      setAccounts((prev) => [...prev, created]);
    }
  };

  const handleDeleteAccount = async (account: Account) => {
    await deleteAccount(account.id);
    setAccounts((prev) => prev.filter((a) => a.id !== account.id));
  };

  // Rule set handlers
  const handleAddRuleSet = (gap: TimelineGap, laneId: number | null) => {
    setEditingRuleSet(undefined);
    setSelectedGap(gap);
    setSelectedLaneId(laneId);
    setRuleSetModalOpen(true);
  };

  const handleEditRuleSet = (ruleSet: GLRuleSet) => {
    setEditingRuleSet(ruleSet);
    setSelectedGap(undefined);
    setSelectedLaneId(null);
    setRuleSetModalOpen(true);
  };

  const handleDeleteRuleSet = async (ruleSet: GLRuleSet) => {
    await deleteRuleSet(ruleSet.id);
    setRuleSets((prev) => prev.filter((rs) => rs.id !== ruleSet.id));
  };

  const handleRuleSetModalSaved = async () => {
    // Reload rule sets after saving
    const data = await fetchAllRuleSets();
    setRuleSets(data);
  };

  // Convert rule sets to timeline versions
  const timelineVersions: TimelineVersion[] = ruleSets.map((rs) => ({
    id: rs.id,
    name: rs.name,
    start_date: rs.start_date,
    end_date: rs.end_date,
    created_at: rs.created_at,
    updated_at: rs.updated_at,
    lane_id: rs.type === 'revenue' ? 0 : 1,
  }));

  // Timeline lanes
  const lanes: TimelineLane[] = [
    { id: 0, name: 'Revenue Rules' },
    { id: 1, name: 'Commission Rules' },
  ];

  // Get rule set link path for navigation
  const getRuleSetLinkPath = (version: TimelineVersion) => {
    return `/gl-rules/rule-set/${version.id}`;
  };

  // Scroll to today helper
  const scrollToToday = () => {
    const currentMonthEl = document.getElementById('current-month');
    if (currentMonthEl) {
      currentMonthEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Tab configuration
  const tabs = [
    {
      id: 'accounts' as TabId,
      label: 'Manage Accounts',
      icon: BookOpen,
      description: 'Define GL account codes for revenue and commission allocation',
    },
    {
      id: 'rules' as TabId,
      label: 'Manage Rules',
      icon: Calculator,
      description: 'Configure time-based GL allocation rules for revenue and commission',
    },
  ];

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Page Header */}
      <div
        style={{
          backgroundColor: 'var(--color-surface-primary)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="container py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1
              style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text)',
              }}
            >
              GL Rules
            </h1>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
                marginTop: 'var(--spacing-2)',
              }}
            >
              Manage General Ledger allocation rules for revenue and commission
            </p>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div className="container">
          <div style={{ borderBottom: '1px solid var(--color-border)' }}>
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      group inline-flex items-center gap-2 py-4 px-1 border-b-2
                      font-medium text-sm transition-colors duration-200 ease-in-out
                    `}
                    style={{
                      borderColor:
                        activeTab === tab.id
                          ? 'var(--color-primary-500)'
                          : 'transparent',
                      color:
                        activeTab === tab.id
                          ? 'var(--color-primary-600)'
                          : 'var(--color-text-secondary)',
                    }}
                  >
                    <Icon
                      size={20}
                      style={{
                        color:
                          activeTab === tab.id
                            ? 'var(--color-primary-600)'
                            : 'var(--color-text-secondary)',
                      }}
                    />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Description */}
          {activeTabData && (
            <div className="py-4">
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {activeTabData.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1"
      >
        {/* Accounts Tab */}
        {activeTab === 'accounts' && (
          <div className="container py-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Action Bar */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2"
                    style={{ color: 'var(--color-text-muted)' }}
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search accounts..."
                    value={accountsSearchTerm}
                    onChange={(e) => setAccountsSearchTerm(e.target.value)}
                    className="input pl-10"
                    style={{ height: 'var(--height-button)' }}
                  />
                </div>
                <button
                  onClick={handleCreateAccount}
                  className="btn-primary flex items-center gap-2"
                  style={{ height: 'var(--height-button)' }}
                >
                  <Plus size={16} />
                  New Account
                </button>
              </div>

              {/* Error State */}
              {accountsError && (
                <div
                  className="card mb-6"
                  style={{
                    backgroundColor: 'var(--color-error-50)',
                    borderColor: 'var(--color-error-200)',
                  }}
                >
                  <div className="p-4 flex items-center gap-3">
                    <AlertCircle
                      size={20}
                      style={{ color: 'var(--color-error-500)' }}
                    />
                    <p style={{ color: 'var(--color-error-700)' }}>
                      {accountsError}
                    </p>
                  </div>
                </div>
              )}

              {/* Accounts Table */}
              <AccountsTable
                accounts={accounts}
                searchTerm={accountsSearchTerm}
                onEdit={handleEditAccount}
                onDelete={handleDeleteAccount}
                isLoading={accountsLoading}
              />
            </motion.div>
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="container py-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col"
            >
              {/* Today Button */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={scrollToToday}
                  className="btn-secondary flex items-center gap-2"
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary-600)',
                    }}
                  />
                  <span>Today</span>
                </button>
              </div>

              {/* Error State */}
              {ruleSetsError && (
                <div
                  className="card mb-6"
                  style={{
                    backgroundColor: 'var(--color-error-50)',
                    borderColor: 'var(--color-error-200)',
                  }}
                >
                  <div className="p-4 flex items-center gap-3">
                    <AlertCircle
                      size={20}
                      style={{ color: 'var(--color-error-500)' }}
                    />
                    <p style={{ color: 'var(--color-error-700)' }}>
                      {ruleSetsError}
                    </p>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {ruleSetsLoading ? (
                <div className="card">
                  <div className="p-8 text-center">
                    <div
                      className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"
                      style={{ color: 'var(--color-primary-600)' }}
                    />
                    <p
                      className="mt-4"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      Loading rule sets...
                    </p>
                  </div>
                </div>
              ) : (
                /* Timeline */
                <div className="card flex-grow">
                  <Timeline
                    versions={timelineVersions}
                    lanes={lanes}
                    onAddVersion={handleAddRuleSet}
                    onEditVersion={(v) => {
                      const ruleSet = ruleSets.find((rs) => rs.id === v.id);
                      if (ruleSet) handleEditRuleSet(ruleSet);
                    }}
                    onDeleteVersion={async (v) => {
                      const ruleSet = ruleSets.find((rs) => rs.id === v.id);
                      if (ruleSet) await handleDeleteRuleSet(ruleSet);
                    }}
                    getVersionLinkPath={getRuleSetLinkPath}
                  />
                </div>
              )}
            </motion.div>
          </div>
        )}
      </motion.div>

      {/* Account Form Modal */}
      <AccountFormModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        onSave={handleSaveAccount}
        account={editingAccount}
        checkExternalIdExists={checkExternalIdExists}
      />

      {/* Rule Set Form Modal */}
      <AddRuleSetModal
        isOpen={ruleSetModalOpen}
        onClose={() => setRuleSetModalOpen(false)}
        onSaved={handleRuleSetModalSaved}
        ruleSet={editingRuleSet}
        gap={selectedGap}
        laneId={selectedLaneId}
        existingRuleSets={ruleSets}
      />
    </div>
  );
}
