import { User } from 'firebase/auth';
import { TenantInfo } from '../../../types/auth';

interface UserInfoProps {
  user: User | null;
  tenant: TenantInfo | null;
  userId: string | null;
}

export function UserInfo({ user, tenant, userId }: UserInfoProps) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Firebase Claims Data</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-[var(--color-text-secondary)]">Email</label>
          <p className="font-medium">{user?.email}</p>
        </div>
        <div>
          <label className="text-sm text-[var(--color-text-secondary)]">User ID</label>
          <p className="font-medium">{userId}</p>
        </div>
        <div>
          <label className="text-sm text-[var(--color-text-secondary)]">Tenant ID</label>
          <p className="font-medium">{tenant?.id}</p>
        </div>
        <div>
          <label className="text-sm text-[var(--color-text-secondary)]">Tenant Name</label>
          <p className="font-medium">{tenant?.name}</p>
        </div>
      </div>
    </section>
  );
}