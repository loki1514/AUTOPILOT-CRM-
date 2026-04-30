import type { BdRep } from '@/types';

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function RepAvatar({ rep, size = 24 }: { rep?: BdRep | null; size?: number }) {
  if (!rep) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground text-[10px]"
        style={{ width: size, height: size }}
        title="Unassigned"
      >
        ?
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-semibold"
      style={{ width: size, height: size }}
      title={rep.member_name}
    >
      {initials(rep.member_name)}
    </span>
  );
}