import { Linkedin, Facebook, Search, Globe, Users, Hand, Sparkles, Briefcase } from 'lucide-react';
import type { LeadSource } from '@/types';

const map: Record<string, { Icon: typeof Linkedin; varName: string; label: string }> = {
  linkedin: { Icon: Linkedin, varName: '--crm-source-linkedin', label: 'LinkedIn' },
  meta: { Icon: Facebook, varName: '--crm-source-meta', label: 'Meta' },
  apollo: { Icon: Search, varName: '--crm-source-apollo', label: 'Apollo' },
  perplexity: { Icon: Sparkles, varName: '--crm-source-perplexity', label: 'OpenRouter' },
  website: { Icon: Globe, varName: '--crm-source-website', label: 'Website' },
  referral: { Icon: Users, varName: '--crm-source-referral', label: 'Referral' },
  manual: { Icon: Hand, varName: '--crm-source-manual', label: 'Manual' },
  brief: { Icon: Briefcase, varName: '--crm-source-brief', label: 'Brief' },
};

export function SourceIcon({ source, size = 14 }: { source?: LeadSource | string; size?: number }) {
  const cfg = map[source ?? 'manual'] ?? map.manual;
  const { Icon, varName, label } = cfg;
  return (
    <span
      className="inline-flex h-5 w-5 items-center justify-center rounded"
      style={{
        backgroundColor: `hsl(var(${varName}) / 0.15)`,
        color: `hsl(var(${varName}))`,
      }}
      title={label}
    >
      <Icon size={size} />
    </span>
  );
}