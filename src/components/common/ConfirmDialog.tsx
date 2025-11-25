/**
 * ConfirmDialog Component
 *
 * Small confirmation dialog for destructive actions
 * Uses Modal component internally
 * Supports danger variant for delete actions
 */

import React from 'react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmDanger?: boolean; // Red button for destructive actions
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmDanger = false,
  isLoading = false,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="480px"
      footer={
        <>
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={isLoading}
            style={{
              minWidth: '100px',
            }}
          >
            {cancelLabel}
          </button>
          <button
            className={confirmDanger ? 'btn-danger' : 'btn-primary'}
            onClick={handleConfirm}
            disabled={isLoading}
            style={{
              minWidth: '120px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--spacing-2)',
            }}
          >
            {isLoading && (
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid currentColor',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }}
              />
            )}
            {confirmLabel}
          </button>
        </>
      }
    >
      <div
        style={{
          fontSize: 'var(--text-base)',
          color: 'var(--color-text-secondary)',
          lineHeight: '1.6',
          whiteSpace: 'pre-line',
        }}
      >
        {message}
      </div>
    </Modal>
  );
}
