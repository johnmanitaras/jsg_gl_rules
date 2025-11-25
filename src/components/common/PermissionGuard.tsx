import { ReactNode } from 'react';
import { usePermissions } from '../../utils/permissions';
import { AccessDenied } from './AccessDenied';

interface PermissionGuardProps {
  permission: string;
  children: ReactNode;
}

export function PermissionGuard({ permission, children }: PermissionGuardProps) {
  const { can } = usePermissions();
  
  if (!can(permission)) {
    return <AccessDenied />;
  }
  
  return <>{children}</>;
}