/**
 * GLBatchRunsTab Component
 *
 * Container component for GL batch run monitoring with sub-tab navigation.
 * Sub-tabs: "Sales Batches" | "Payment Batches"
 *
 * This component provides the navigation structure and integrates
 * the SalesBatchList and PaymentBatchList components.
 * Includes CatchupModal for manual batch triggering.
 */

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, CreditCard, Play } from 'lucide-react';
import { SalesBatchList } from './SalesBatchList';
import { PaymentBatchList } from './PaymentBatchList';
import { CatchupModal } from './CatchupModal';
import type { BatchType } from '../../types/gl-rules';

type SubTabId = 'sales' | 'payments';

interface GLBatchRunsTabProps {
  /** Optional callback when catchup is triggered */
  onRunCatchup?: (batchType: SubTabId) => void;
}

export function GLBatchRunsTab({ onRunCatchup }: GLBatchRunsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>('sales');
  const [isCatchupModalOpen, setIsCatchupModalOpen] = useState(false);
  const [catchupBatchType, setCatchupBatchType] = useState<BatchType>('sales');
  // Track a refresh key to trigger list refresh after catchup
  const [refreshKey, setRefreshKey] = useState(0);

  const subTabs = [
    {
      id: 'sales' as SubTabId,
      label: 'Sales Batches',
      icon: DollarSign,
    },
    {
      id: 'payments' as SubTabId,
      label: 'Payment Batches',
      icon: CreditCard,
    },
  ];

  const handleRunCatchup = useCallback(() => {
    // Set the batch type based on active sub-tab
    setCatchupBatchType(activeSubTab);
    setIsCatchupModalOpen(true);

    // Also call the parent callback if provided
    if (onRunCatchup) {
      onRunCatchup(activeSubTab);
    }
  }, [activeSubTab, onRunCatchup]);

  const handleCatchupSuccess = useCallback(() => {
    // Increment refresh key to trigger list refresh
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleCloseCatchupModal = useCallback(() => {
    setIsCatchupModalOpen(false);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with Run Catchup button */}
      <div className="flex items-center justify-between">
        {/* Sub-tab Navigation - Pill Style */}
        <div
          className="inline-flex p-1 rounded-lg"
          style={{
            backgroundColor: 'var(--color-gray-100, #f3f4f6)',
          }}
        >
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className="relative inline-flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200"
                style={{
                  fontSize: 'var(--text-sm, 0.875rem)',
                  fontWeight: isActive
                    ? 'var(--font-weight-medium, 500)'
                    : 'var(--font-weight-normal, 400)',
                  color: isActive
                    ? 'var(--color-primary-700, #1d4ed8)'
                    : 'var(--color-text-secondary, #6b7280)',
                  backgroundColor: isActive
                    ? 'var(--color-surface-primary, #ffffff)'
                    : 'transparent',
                  boxShadow: isActive
                    ? 'var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))'
                    : 'none',
                }}
              >
                <Icon
                  size={16}
                  style={{
                    color: isActive
                      ? 'var(--color-primary-600, #2563eb)'
                      : 'var(--color-text-tertiary, #9ca3af)',
                  }}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Run Catchup Button */}
        <button
          className="btn-secondary flex items-center gap-2"
          onClick={handleRunCatchup}
        >
          <Play size={16} />
          <span>Run Catchup</span>
        </button>
      </div>

      {/* Sub-tab Content */}
      <motion.div
        key={`${activeSubTab}-${refreshKey}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeSubTab === 'sales' && (
          <SalesBatchList onRunCatchup={handleRunCatchup} />
        )}

        {activeSubTab === 'payments' && (
          <PaymentBatchList onRunCatchup={handleRunCatchup} />
        )}
      </motion.div>

      {/* Catchup Modal */}
      <CatchupModal
        isOpen={isCatchupModalOpen}
        onClose={handleCloseCatchupModal}
        batchType={catchupBatchType}
        onSuccess={handleCatchupSuccess}
      />
    </div>
  );
}
