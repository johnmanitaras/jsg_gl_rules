/**
 * StatusActionDropdown Component
 *
 * A persistent custom dropdown for managing batch export status.
 * Always visible regardless of current status — shows available transitions.
 * Uses a portal so the menu is never clipped by overflow:hidden containers.
 *
 * Status flow: Pending → Exported → Posted
 * All transitions available:
 *   Pending:  Mark as Exported, Mark as Posted
 *   Exported: Mark as Posted, Reset to Pending
 *   Posted:   Reset to Exported, Reset to Pending
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  FileCheck,
  Upload,
  RotateCcw,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { ExportStatus } from '../../types/gl-rules';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface StatusAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  danger?: boolean;
  confirmTitle: string;
  confirmMessage: string;
  confirmLabel: string;
}

function getActionsForStatus(status: ExportStatus): StatusAction[] {
  switch (status) {
    case 'pending':
      return [
        {
          key: 'mark-exported',
          label: 'Mark as Exported',
          icon: <FileCheck size={14} />,
          color: 'var(--color-primary-600)',
          confirmTitle: 'Mark as Exported',
          confirmMessage: 'This will mark the batch as exported without downloading the journal file. Use this if you have already downloaded or processed the export externally.',
          confirmLabel: 'Mark as Exported',
        },
        {
          key: 'mark-posted',
          label: 'Mark as Posted',
          icon: <Upload size={14} />,
          color: 'var(--color-success-600)',
          confirmTitle: 'Mark as Posted',
          confirmMessage: 'This will mark the batch as posted to your accounting system, skipping the exported step. Use this if the entries were posted directly.',
          confirmLabel: 'Mark as Posted',
        },
      ];
    case 'exported':
      return [
        {
          key: 'mark-posted',
          label: 'Mark as Posted',
          icon: <Upload size={14} />,
          color: 'var(--color-success-600)',
          confirmTitle: 'Mark as Posted',
          confirmMessage: 'This will mark the batch as posted to your accounting system. This confirms the journal entries have been imported into your accounting software.',
          confirmLabel: 'Mark as Posted',
        },
        {
          key: 'reset-pending',
          label: 'Reset to Pending',
          icon: <RotateCcw size={14} />,
          color: 'var(--color-error-600)',
          danger: true,
          confirmTitle: 'Reset to Pending',
          confirmMessage: 'This will clear the export and posted status. The batch will appear as if it was never exported.\n\nThis does not delete any entries — it only resets the tracking status.',
          confirmLabel: 'Reset to Pending',
        },
      ];
    case 'posted':
      return [
        {
          key: 'reset-exported',
          label: 'Reset to Exported',
          icon: <FileCheck size={14} />,
          color: 'var(--color-text)',
          confirmTitle: 'Reset to Exported',
          confirmMessage: 'This will remove the "Posted" status but keep the export record. The batch will show as exported but not yet posted.',
          confirmLabel: 'Reset to Exported',
        },
        {
          key: 'reset-pending',
          label: 'Reset to Pending',
          icon: <RotateCcw size={14} />,
          color: 'var(--color-error-600)',
          danger: true,
          confirmTitle: 'Reset to Pending',
          confirmMessage: 'This will clear the export and posted status. The batch will appear as if it was never exported.\n\nThis does not delete any entries — it only resets the tracking status.',
          confirmLabel: 'Reset to Pending',
        },
      ];
  }
}

const statusConfig = {
  pending: {
    bg: 'var(--color-neutral-100)',
    color: 'var(--color-neutral-600)',
    icon: <Clock size={12} />,
    label: 'Pending',
  },
  exported: {
    bg: 'var(--color-primary-50)',
    color: 'var(--color-primary-700)',
    icon: <FileCheck size={12} />,
    label: 'Exported',
  },
  posted: {
    bg: 'var(--color-success-50)',
    color: 'var(--color-success-700)',
    icon: <CheckCircle size={12} />,
    label: 'Posted',
  },
};

interface StatusActionDropdownProps {
  status: ExportStatus;
  disabled?: boolean;
  onAction: (action: string) => Promise<boolean>;
  /** Called after a successful action */
  onStatusChanged?: () => void;
}

export function StatusActionDropdown({
  status,
  disabled = false,
  onAction,
  onStatusChanged,
}: StatusActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<StatusAction | null>(null);
  const [loading, setLoading] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const config = statusConfig[status];
  const actions = getActionsForStatus(status);

  // Position the portal menu relative to the button
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 4,
      left: rect.left,
    });
  }, []);

  // Update position when opening and on scroll/resize
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleClose = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        menuRef.current && !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    document.addEventListener('mousedown', handleClose);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('mousedown', handleClose);
    };
  }, [isOpen, updatePosition]);

  const handleSelect = (action: StatusAction) => {
    setIsOpen(false);
    setConfirmAction(action);
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setLoading(true);
    const ok = await onAction(confirmAction.key);
    setLoading(false);
    setConfirmAction(null);
    if (ok) onStatusChanged?.();
  };

  return (
    <>
      <div className="inline-block">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all disabled:opacity-50"
          style={{
            backgroundColor: config.bg,
            color: config.color,
            border: '1px solid transparent',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => {
            if (!disabled) e.currentTarget.style.borderColor = config.color;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          {config.icon}
          {config.label}
          <ChevronDown size={12} style={{ marginLeft: '2px', opacity: 0.7 }} />
        </button>
      </div>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          className="rounded-lg shadow-lg py-1"
          style={{
            position: 'fixed',
            top: menuPos.top,
            left: menuPos.left,
            zIndex: 9999,
            backgroundColor: 'var(--color-surface-primary)',
            border: '1px solid var(--color-border)',
            minWidth: '200px',
          }}
        >
          {actions.map((action) => (
            <button
              key={action.key}
              onClick={() => handleSelect(action)}
              className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 hover:bg-neutral-50 transition-colors"
              style={{ color: action.color }}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>,
        document.body
      )}

      {confirmAction && (
        <ConfirmDialog
          isOpen
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirm}
          title={confirmAction.confirmTitle}
          message={confirmAction.confirmMessage}
          confirmLabel={confirmAction.confirmLabel}
          confirmDanger={confirmAction.danger}
          isLoading={loading}
        />
      )}
    </>
  );
}
