import { useAuth } from '../hooks/useAuth';

export const hasPermission = (permission: string, userPermissions: string[]): boolean => {
  return userPermissions.includes(permission);
};

export function usePermissions() {
  const { permissions } = useAuth();
  
  return {
    can: (permission: string) => hasPermission(permission, permissions),
    hasAny: (requiredPermissions: string[]) => 
      requiredPermissions.some(permission => hasPermission(permission, permissions)),
    hasAll: (requiredPermissions: string[]) => 
      requiredPermissions.every(permission => hasPermission(permission, permissions))
  };
}