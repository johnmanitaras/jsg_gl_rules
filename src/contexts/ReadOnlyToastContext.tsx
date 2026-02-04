import { createContext, useContext, ReactNode } from 'react';
import { useReadOnlyToast } from '../hooks/useReadOnlyToast';

const ReadOnlyToastContext = createContext<(() => void) | null>(null);

export function ReadOnlyToastProvider({ children }: { children: ReactNode }) {
  const { showToast, ToastComponent } = useReadOnlyToast();

  return (
    <ReadOnlyToastContext.Provider value={showToast}>
      <ToastComponent />
      {children}
    </ReadOnlyToastContext.Provider>
  );
}

export function useShowReadOnlyToast(): () => void {
  const showToast = useContext(ReadOnlyToastContext);
  if (!showToast) {
    throw new Error('useShowReadOnlyToast must be used within ReadOnlyToastProvider');
  }
  return showToast;
}
