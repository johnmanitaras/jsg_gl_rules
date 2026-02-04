import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useShowReadOnlyToast } from './ReadOnlyToastContext';

export interface Permissions {
  canRead: boolean;
  canWrite: boolean;
}

interface PermissionsContextValue {
  canEdit: boolean;
  showReadOnlyToast: () => void;
  inputProps: {
    disabled?: boolean;
    onFocus?: () => void;
    onClick?: () => void;
    className?: string;
  };
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

interface PermissionsProviderProps {
  children: ReactNode;
  permissions?: Permissions;
}

export function PermissionsProvider({ children, permissions }: PermissionsProviderProps) {
  const showReadOnlyToast = useShowReadOnlyToast();
  const canEdit = permissions?.canWrite ?? true;

  const value = useMemo<PermissionsContextValue>(
    () => ({
      canEdit,
      showReadOnlyToast,
      inputProps: !canEdit
        ? {
            disabled: true,
            onFocus: showReadOnlyToast,
            onClick: showReadOnlyToast,
            className: 'input-readonly',
          }
        : {},
    }),
    [canEdit, showReadOnlyToast]
  );

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    // Fallback for standalone mode - full access
    return {
      canEdit: true,
      showReadOnlyToast: () => {},
      inputProps: {},
    };
  }
  return context;
}
