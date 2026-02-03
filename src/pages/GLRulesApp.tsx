/**
 * GLRulesApp Page
 *
 * Main page for GL Rules management with three tabs:
 * - Manage Accounts: CRUD for GL account definitions
 * - Manage Rules: Timeline view with Revenue, Commission, and Cancellation Fee lanes
 * - Surcharge Rules: Configure payment surcharge GL account
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Calculator, CreditCard, Plus, Search, AlertCircle, History, X } from 'lucide-react';
import { Timeline, AuditHistory } from '@jetsetgo/shared-components';
import type { TimelineVersion, TimelineGap, TimelineLane } from '@jetsetgo/shared-components';
import { useAuth } from '../hooks/useAuth';

import { usePermissions } from '../contexts/PermissionsContext';
import { useAccounts } from '../hooks/useAccounts';
import { useGLRuleSets } from '../hooks/useGLRuleSets';
import { useSettings } from '../hooks/useSettings';
import { Account, GLRuleSet, GLRuleSetType, getRuleSetTypeFromLaneId, RULE_SET_TYPE_NAMES, LANE_IDS } from '../types/gl-rules';
import { AccountsTable } from '../components/gl-rules/AccountsTable';
import { AccountFormModal } from '../components/gl-rules/AccountFormModal';
import { AddRuleSetModal } from '../components/gl-rules/AddRuleSetModal';
import { SurchargeSettings } from '../components/gl-rules/SurchargeSettings';

type TabId = 'accounts' | 'rules' | 'surcharge';

export function GLRulesApp() {
  const { canEdit, inputProps } = usePermissions();
  const { token, tenant } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>(
    (searchParams.get('tab') as TabId) || 'accounts'
  );

  // Audit history modal state
  const [showAuditHistory, setShowAuditHistory] = useState(false);

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

  // Surcharge settings state
  const [surchargeAccountId, setSurchargeAccountId] = useState<number | null>(null);
  const [surchargeLoading, setSurchargeLoading] = useState(true);
  const [surchargeError, setSurchargeError] = useState<string | null>(null);

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

  const {
    getPaymentSurchargeAccount,
    setPaymentSurchargeAccount,
  } = useSettings();

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

  // Load surcharge account setting
  useEffect(() => {
    let isMounted = true;

    const loadSurchargeSetting = async () => {
      try {
        setSurchargeLoading(true);
        setSurchargeError(null);
        const accountId = await getPaymentSurchargeAccount();
        if (isMounted) {
          setSurchargeAccountId(accountId);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading surcharge setting:', err);
          setSurchargeError(
            err instanceof Error ? err.message : 'Failed to load surcharge setting'
          );
        }
      } finally {
        if (isMounted) {
          setSurchargeLoading(false);
        }
      }
    };

    loadSurchargeSetting();

    return () => {
      isMounted = false;
    };
  }, [getPaymentSurchargeAccount]);

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

  // Surcharge handlers
  const handleSaveSurchargeAccount = async (accountId: number | null) => {
    await setPaymentSurchargeAccount(accountId);
    setSurchargeAccountId(accountId);
  };

  // Convert rule sets to timeline versions
  const timelineVersions: TimelineVersion[] = ruleSets.map((rs) => ({
    id: rs.id,
    name: rs.name,
    start_date: rs.start_date,
    end_date: rs.end_date,
    created_at: rs.created_at,
    updated_at: rs.updated_at,
    lane_id: LANE_IDS[rs.type],
  }));

  // Timeline lanes
  const lanes: TimelineLane[] = [
    { id: 0, name: 'Revenue Rules' },
    { id: 1, name: 'Commission Rules' },
    { id: 2, name: 'Cancellation Fee Rules' },
  ];

  // Handle version click for programmatic navigation
  const handleVersionClick = (version: TimelineVersion) => {
    navigate(`/rule-set/${version.id}`);
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
    {
      id: 'surcharge' as TabId,
      label: 'Surcharge Rules',
      icon: CreditCard,
      description: 'Configure the GL account for payment surcharge allocation',
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
            <div className="flex items-start justify-between">
              <div>
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
              </div>
              <button
                onClick={() => setShowAuditHistory(true)}
                className="p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-600)] hover:bg-[var(--color-gray-100)] rounded-md transition-colors"
                title="View change history"
              >
                <History className="w-5 h-5" />
              </button>
            </div>
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
                {canEdit && (
                  <button
                    onClick={handleCreateAccount}
                    className="btn-primary flex items-center gap-2"
                    style={{ height: 'var(--height-button)' }}
                  >
                    <Plus size={16} />
                    New Account
                  </button>
                )}
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
                canEdit={canEdit}
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
                    onVersionClick={handleVersionClick}
                  />
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Surcharge Tab */}
        {activeTab === 'surcharge' && (
          <div className="container py-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <SurchargeSettings
                accounts={accounts}
                accountsLoading={accountsLoading}
                currentAccountId={surchargeAccountId}
                onSave={handleSaveSurchargeAccount}
                isLoading={surchargeLoading}
                error={surchargeError}
                canEdit={canEdit}
              />
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

      {/* Audit History Modal */}
      <AnimatePresence>
        {showAuditHistory && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowAuditHistory(false)}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-5xl bg-white rounded-xl shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
                  <h3 className="text-lg font-semibold text-[var(--color-text)]">
                    GL Rules History
                  </h3>
                  <button
                    onClick={() => setShowAuditHistory(false)}
                    className="p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-gray-100)] rounded-md transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[calc(80vh-80px)] overflow-y-auto">
                  {token && tenant?.name ? (
                    <AuditHistory
                      appContext="gl-rules"
                      token={token}
                      tenantId={tenant.name}
                    />
                  ) : (
                    <div className="text-center py-8 text-[var(--color-text-secondary)]">
                      Authentication required to view history
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
