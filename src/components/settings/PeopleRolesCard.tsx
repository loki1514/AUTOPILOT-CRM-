/**
 * PeopleRolesCard
 * Master-admin-only panel for assigning roles to teammates.
 * Lists every user with a row in user_roles and lets master admin promote/demote.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole, type AppRole } from "@/hooks/useUserRole";
import { GlassCard } from "@/components/atmosphere/GlassCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ShieldCheck, UserCog, User } from "lucide-react";

type Row = {
  user_id: string;
  role: AppRole;
  email: string | null;
};

const ROLE_META: Record<AppRole, { label: string; icon: typeof ShieldCheck }> = {
  master_admin: { label: "Master Admin", icon: ShieldCheck },
  admin: { label: "Admin", icon: UserCog },
  rep: { label: "Sales Rep", icon: User },
};

export function PeopleRolesCard() {
  const { isMasterAdmin, loading } = useUserRole();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("user_id, role");
    if (!roleRows) return;
    // Fetch emails via RPC-less approach: read from leads.user_id-distinct + auth via edge? Simpler: rely on roleRows + show partial id if email unavailable.
    // We try profiles-style fallback through bd_team_members for email mapping if exists.
    const userIds = Array.from(new Set(roleRows.map((r) => r.user_id)));
    const { data: members } = await supabase
      .from("bd_team_members")
      .select("user_id, member_email")
      .in("user_id", userIds);
    const emailMap = new Map<string, string>();
    members?.forEach((m) => emailMap.set(m.user_id, m.member_email));
    // Hard-code master admin email if present
    setRows(
      roleRows.map((r) => ({
        user_id: r.user_id,
        role: r.role as AppRole,
        email: emailMap.get(r.user_id) ?? null,
      })),
    );
  };

  useEffect(() => {
    if (isMasterAdmin) load();
  }, [isMasterAdmin]);

  if (loading || !isMasterAdmin) return null;

  const changeRole = async (userId: string, newRole: AppRole) => {
    setBusy(userId);
    // Replace existing role rows for this user with the new role
    const { error: delErr } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);
    if (delErr) {
      toast.error(delErr.message);
      setBusy(null);
      return;
    }
    const { error: insErr } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: newRole });
    if (insErr) {
      toast.error(insErr.message);
    } else {
      toast.success("Role updated");
      await load();
    }
    setBusy(null);
  };

  return (
    <GlassCard variant="strong" className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-foreground/70" />
        <h2 className="text-display text-[15px]">People &amp; Roles</h2>
      </div>
      <p className="mb-4 text-[12px] text-foreground/55">
        Master admin only. Reps can create/edit leads but cannot delete or assign.
        Admins can do everything plus delete &amp; assign leads.
      </p>
      <div className="space-y-2">
        {rows.length === 0 && (
          <p className="text-[12px] text-foreground/45">No teammates yet.</p>
        )}
        {rows.map((r) => {
          const Meta = ROLE_META[r.role];
          const Icon = Meta.icon;
          return (
            <div
              key={r.user_id}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className="h-4 w-4 text-foreground/55 shrink-0" />
                <div className="min-w-0">
                  <div className="truncate text-[13px] text-foreground/85">
                    {r.email ?? r.user_id.slice(0, 8) + "…"}
                  </div>
                  <div className="text-[10px] text-foreground/45">{Meta.label}</div>
                </div>
              </div>
              <Select
                value={r.role}
                onValueChange={(v) => changeRole(r.user_id, v as AppRole)}
                disabled={busy === r.user_id}
              >
                <SelectTrigger className="w-[160px] glass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="master_admin">Master Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="rep">Sales Rep</SelectItem>
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}