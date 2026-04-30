import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AutomationRule {
  id: string;
  user_id: string;
  name: string;
  rule_type: string;
  cities: string[];
  sender_profile_id: string | null;
  schedule_time: string;
  auto_approve: boolean;
  is_active: boolean;
  last_run_at: string | null;
  created_at: string;
}

export function useAutomationRules() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const rulesQuery = useQuery({
    queryKey: ["automation-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_rules")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AutomationRule[];
    },
  });

  const createRule = useMutation({
    mutationFn: async (rule: Omit<AutomationRule, "id" | "user_id" | "created_at" | "last_run_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("automation_rules")
        .insert({
          ...rule,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast({
        title: "Rule Created",
        description: "Automation rule has been created",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRule = useMutation({
    mutationFn: async (rule: Partial<AutomationRule> & { id: string }) => {
      const { data, error } = await supabase
        .from("automation_rules")
        .update(rule)
        .eq("id", rule.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast({
        title: "Rule Updated",
        description: "Changes saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (ruleId: string) => {
      const { error } = await supabase
        .from("automation_rules")
        .delete()
        .eq("id", ruleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast({
        title: "Rule Deleted",
        description: "Automation rule has been removed",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from("automation_rules")
        .update({ is_active })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast({
        title: data.is_active ? "Rule Activated" : "Rule Paused",
        description: data.is_active
          ? "Automation will run on schedule"
          : "Automation has been paused",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Toggle Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    rules: rulesQuery.data || [],
    isLoading: rulesQuery.isLoading,
    error: rulesQuery.error,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
  };
}
