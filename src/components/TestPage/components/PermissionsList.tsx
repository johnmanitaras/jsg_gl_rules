import { Shield } from 'lucide-react';

interface PermissionsListProps {
  permissions: string[];
}

export function PermissionsList({ permissions }: PermissionsListProps) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5 text-[var(--color-primary-600)]" />
        Permissions
      </h2>
      <div className="flex flex-wrap gap-2">
        {permissions.length > 0 ? (
          permissions.map((permission) => (
            <span
              key={permission}
              className="px-3 py-1 rounded-full text-sm font-medium bg-[var(--color-primary-50,#eff6ff)] text-[var(--color-primary-700,#1d4ed8)]"
            >
              {permission}
            </span>
          ))
        ) : (
          <p className="text-[var(--color-text-secondary)]">No permissions assigned</p>
        )}
      </div>
    </section>
  );
}