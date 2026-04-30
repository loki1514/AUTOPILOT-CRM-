import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface BriefSignal {
  type: string;
  claim: string | null;
  source_url: string | null;
  source_title: string | null;
  published_date: string | null;
  confidence: number | null;
  verification_status: string | null;
  why_it_matters: string | null;
}

export interface BriefStructuredData {
  verification_score: number;
  intent_score: number;
  contactability_score: number;
  outreach_readiness: number;
  p1_count: number;
  p2_count: number;
  contact_count: number;
  linkedin_count: number;
  email_count: number;
  phone_count: number;
  enrichment_status: string | null;
  signals: BriefSignal[];
}

export interface ExpiringLeaseItem {
  company_name: string;
  location: string;
  seats: string;
  lease_end: string;
  remarks: string;
  why_qualifies: string;
  talking_points: string[];
  intent_score: number;
  _lead_id?: string;
  _structured?: BriefStructuredData;
}

export interface FundedStartupItem {
  startup_name: string;
  funding: string;
  city: string;
  team_size: string;
  use_case: string;
  why_qualifies: string;
  talking_points: string[];
  intent_score: number;
  _lead_id?: string;
  _structured?: BriefStructuredData;
}

export interface CompetitorAlertItem {
  entity: string;
  movement: string;
  impact?: string;
}

export interface MarketWatchItem {
  micro_market: string;
  summary: string;
}

export interface BdTips {
  linkedin_strategy?: string;
  script_of_the_day?: string;
}

export interface CityActionableItem {
  rep_name: string;
  rep_id: string | null;
  follow_ups: string[];
}

export interface HighIntentItem {
  company_name: string;
  subtitle: string;
  intent_score: number;
  remarks: string;
  why_qualifies: string;
  talking_points: string[];
  _lead_id?: string;
  _structured?: BriefStructuredData;
}

export interface DailyBrief {
  id: string;
  user_id: string;
  city: string;
  brief_date: string;
  headline: string;
  top_signals: Array<{ signal: string; type: string; priority: string }>;
  micro_market_watch: MarketWatchItem[];
  competitor_movement: Array<{ entity: string; movement: string }>;
  suggested_actions: Array<{ action: string; urgency: string }>;
  expiring_leases: ExpiringLeaseItem[];
  funded_startups: FundedStartupItem[];
  high_intent?: HighIntentItem[];
  competitor_alerts: CompetitorAlertItem[];
  bd_tips: BdTips;
  city_actionables: CityActionableItem[];
  lead_references?: Record<string, string[]>;
  enriched_at: string | null;
  generated_by: string;
  created_lead_ids: string[];
  published_at: string | null;
  status: string;
  campaign_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useDailyBriefs(city?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const briefsQuery = useQuery({
    queryKey: ["daily-briefs", city],
    queryFn: async () => {
      let query = supabase
        .from("daily_briefs")
        .select("*")
        .order("brief_date", { ascending: false })
        .limit(30);

      if (city) {
        query = query.eq("city", city);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data as unknown) as DailyBrief[];
    },
  });

  const generateBrief = useMutation({
    mutationFn: async ({ city, date }: { city: string; date?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("generate-daily-brief", {
        body: { city, user_id: user.id, date },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to generate brief");
      }

      // Check for error in the response data (edge function returns errors in data.error)
      if (response.data?.error) {
        if (response.data.error.includes("No intelligence items")) {
          throw new Error(`No intelligence items found for ${city}. Please add some intelligence items first before generating a brief.`);
        }
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-briefs"] });
      toast({
        title: "Brief Generated",
        description: "Daily brief has been generated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateBrief = useMutation({
    mutationFn: async (brief: Partial<DailyBrief> & { id: string }) => {
      const { data, error } = await supabase
        .from("daily_briefs")
        .update({
          headline: brief.headline,
          top_signals: brief.top_signals as never,
          micro_market_watch: brief.micro_market_watch as never,
          competitor_movement: brief.competitor_movement as never,
          suggested_actions: brief.suggested_actions as never,
          status: brief.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", brief.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-briefs"] });
      toast({
        title: "Brief Updated",
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

  const approveBrief = useMutation({
    mutationFn: async (briefId: string) => {
      const { data, error } = await supabase
        .from("daily_briefs")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", briefId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-briefs"] });
      toast({
        title: "Brief Approved",
        description: "Ready to send to BD team",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteBrief = useMutation({
    mutationFn: async (briefId: string) => {
      const { error } = await supabase
        .from("daily_briefs")
        .delete()
        .eq("id", briefId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-briefs"] });
      toast({
        title: "Brief Deleted",
        description: "Daily brief has been removed",
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

  return {
    briefs: briefsQuery.data || [],
    isLoading: briefsQuery.isLoading,
    error: briefsQuery.error,
    generateBrief,
    updateBrief,
    approveBrief,
    deleteBrief,
  };
}
