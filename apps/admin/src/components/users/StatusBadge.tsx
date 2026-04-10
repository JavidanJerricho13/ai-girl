interface StatusBadgeProps {
  type: 'role' | 'status';
  value: string;
}

const ROLE_STYLES: Record<string, string> = {
  ADMIN: 'bg-indigo-900/40 text-indigo-400 border-indigo-700/30',
  MODERATOR: 'bg-amber-900/40 text-amber-400 border-amber-700/30',
  USER: 'bg-zinc-800 text-zinc-400 border-zinc-700/30',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/30',
  banned: 'bg-red-900/40 text-red-400 border-red-700/30',
};

export function StatusBadge({ type, value }: StatusBadgeProps) {
  const styles =
    type === 'role'
      ? ROLE_STYLES[value] ?? ROLE_STYLES.USER
      : value === 'active'
        ? STATUS_STYLES.active
        : STATUS_STYLES.banned;

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold border ${styles}`}
    >
      {value}
    </span>
  );
}
