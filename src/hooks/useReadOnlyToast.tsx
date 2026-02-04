import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Lock } from 'lucide-react';

function ReadOnlyToast({ visible, onHide }: { visible: boolean; onHide: () => void }) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onHide, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onHide]);

  if (!visible) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#374151',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 9999,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }}
    >
      <Lock style={{ width: '16px', height: '16px', flexShrink: 0 }} />
      <span>View only - You don't have permission to edit</span>
    </div>,
    document.body
  );
}

export function useReadOnlyToast() {
  const [visible, setVisible] = useState(false);

  const showToast = useCallback(() => setVisible(true), []);
  const hideToast = useCallback(() => setVisible(false), []);

  const ToastComponent = useCallback(
    () => <ReadOnlyToast visible={visible} onHide={hideToast} />,
    [visible, hideToast]
  );

  return { showToast, ToastComponent };
}
