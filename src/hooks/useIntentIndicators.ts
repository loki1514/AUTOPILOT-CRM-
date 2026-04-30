import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface IntentIndicator {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string;
  weight: number;
  is_active: boolean;
  color: string;
  icon: string;
  detection_keywords: string[] | null;
  signals_detected: number;
  signals_converted: number;
  created_at: string;
  updated_at: string;
}

export function useIntentIndicators() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["intent-indicators"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("intent_indicators")
        .select("*")
        .order("weight", { ascending: false });
      if (error) throw error;
      return (data || []) as IntentIndicator[];
    },
  });

  const seedDefaults = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.rpc("seed_default_indicators", { _user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["intent-indicators"] });
      toast({ title: "Default indicators added" });
    },
  });

  const create = useMutation({
    mutationFn: async (input: Partial<IntentIndicator>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("intent_indicators").insert({
        user_id: user.id,
        name: input.name || "New indicator",
        description: input.description || null,
        category: input.category || "general",
        weight: input.weight ?? 10,
        color: input.color || "#3B82F6",
        icon: input.icon || "sparkles",
        is_active: input.is_active ?? true,
        detection_keywords: input.detection_keywords || [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["intent-indicators"] });
      toast({ title: "Indicator created" });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...rest }: Partial<IntentIndicator> & { id: string }) => {
      const { error } = await supabase
        .from("intent_indicators")
        .update(rest as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["intent-indicators"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("intent_indicators").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["intent-indicators"] });
      toast({ title: "Indicator removed" });
    },
  });

  return {
    indicators: query.data || [],
    isLoading: query.isLoading,
    seedDefaults,
    create,
    update,
    remove,
  };
}