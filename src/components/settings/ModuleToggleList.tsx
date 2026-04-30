import { GlassCard } from "@/components/atmosphere/GlassCard";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import {
  ALL_MODULE_KEYS,
  MODULE_META,
  useModuleSettings,
  type ModuleKey,
} from "@/hooks/useModuleSettings";

const GROUPS: { id: "main" | "tools" | "system"; label: string }[] = [
  { id: "main", label: "Main modules" },
  { id: "tools", label: "Tools" },
  { id: "system", label: "System" },
];

export function ModuleToggleList() {
  const { isLoading, isEnabled, toggle, setEnabled } = useModuleSettings();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="eyebrow mb-1">Workspace · Modules</div>
          <p className="text-[13px] text-foreground/60 max-w-xl">
            Turn modules on or off for the entire workspace. Disabled modules disappear from the
            sidebar for everyone and their pages redirect to the home dashboard.
          </p>
        </div>
        {setEnabled.isPending && (
          <span className="inline-flex items-center gap-2 text-[12px] text-foreground/55">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Saving…
          </span>
        )}
      </div>

      {GROUPS.map((g) => {
        const items = ALL_MODULE_KEYS.filter((k) => MODULE_META[k].group === g.id);
        return (
          <GlassCard key={g.id} variant="strong" hover={false} className="p-6">
            <div className="eyebrow mb-4">{g.label}</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((k: ModuleKey) => {
                const meta = MODULE_META[k];
                const on = isEnabled(k);
                const isSettings = k === "settings";
                return (
                  <div
                    key={k}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="min-w-0">
                      <Label htmlFor={`mod-${k}`} className="text-[14px] font-semibold text-foreground">
                        {meta.label}
                      </Label>
                      <p className="mt-1 text-[12px] leading-relaxed text-foreground/55">
                        {meta.description}
                      </p>
                    </div>
                    <Switch
                      id={`mod-${k}`}
                      checked={on}
                      disabled={isLoading || isSettings}
                      onCheckedChange={(next) => toggle(k, next)}
                    />
                  </div>
                );
              })}
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}