import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  type?: 'success' | 'error' | 'info';
  duration?: number; // milliseconds, default 5000
}

export function Toast({
  message,
  isVisible,
  onClose,
  type = 'info',
  duration = 5000
}: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, duration]);

  // Get icon and colors based on type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--color-success-600)' }} aria-hidden="true" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--color-error-500)' }} aria-hidden="true" />;
      default:
        return <AlertCircle className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--color-primary-600)' }} aria-hidden="true" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'var(--color-success-200)';
      case 'error':
        return 'var(--color-error-200)';
      default:
        return 'var(--color-border)';
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'var(--alert-success-bg)';
      case 'error':
        return 'var(--alert-error-bg)';
      default:
        return 'var(--color-surface-primary)';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
          }}
          style={{
            position: 'fixed',
            bottom: 'var(--spacing-4)',
            right: 'var(--spacing-4)',
            zIndex: 2000,
          }}
          role="alert"
          aria-live="polite"
          aria-atomic="true"
        >
          <div
            style={{
              backgroundColor: getBackgroundColor(),
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-modal)',
              border: `var(--border-width-default) solid ${getBorderColor()}`,
              padding: 'var(--spacing-4)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-3)',
              minWidth: '320px',
              maxWidth: '480px',
            }}
          >
            {getIcon()}
            <p
              style={{
                flex: 1,
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-primary)',
                margin: 0,
                lineHeight: '1.5',
              }}
            >
              {message}
            </p>
            <button
              onClick={onClose}
              aria-label="Close notification"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease, color 0.15s ease',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-surface-secondary)';
                e.currentTarget.style.color = 'var(--color-text)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }}
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}