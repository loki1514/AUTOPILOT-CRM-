import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "master_admin" | "admin" | "rep";

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (cancelled) return;
      const roles = (data ?? []).map((r) => r.role as AppRole);
      const best: AppRole = roles.includes("master_admin")
        ? "master_admin"
        : roles.includes("admin")
        ? "admin"
        : "rep";
      setRole(best);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const isMasterAdmin = role === "master_admin";
  const isAdmin = role === "admin" || isMasterAdmin;
  return {
    role,
    loading,
    isMasterAdmin,
    isAdmin,
    canAssign: isAdmin,
    canDelete: isAdmin,
    canManageRoles: isMasterAdmin,
  };
}