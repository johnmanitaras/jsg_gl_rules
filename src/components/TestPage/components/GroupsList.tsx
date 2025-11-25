import { Users2 } from 'lucide-react';
import { GroupInfo } from '../../../types/auth';

interface GroupsListProps {
  groups: GroupInfo[];
}

export function GroupsList({ groups }: GroupsListProps) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Users2 className="h-5 w-5 text-[var(--color-primary-600)]" />
        Groups
      </h2>
      <div className="space-y-4">
        {groups.length > 0 ? (
          <div className="grid gap-3">
            {groups.map((group) => (
              <div
                key={group.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white border border-[var(--color-border,#e5e7eb)]"
              >
                <span className="font-medium">{group.name}</span>
                <span className="text-sm" style={{ color: 'var(--color-text-secondary, #6b7280)' }}>{group.id}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[var(--color-text-secondary)]">No groups assigned</p>
        )}
      </div>
    </section>
  );
}