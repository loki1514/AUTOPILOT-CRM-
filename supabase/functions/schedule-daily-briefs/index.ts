import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all active automation rules for daily briefs
    const { data: rules, error: rulesError } = await supabase
      .from("automation_rules")
      .select("*")
      .eq("rule_type", "daily_brief")
      .eq("is_active", true);

    if (rulesError) {
      console.error("Error fetching automation rules:", rulesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch automation rules" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!rules || rules.length === 0) {
      console.log("No active daily brief automation rules found");
      return new Response(
        JSON.stringify({ message: "No active rules to process", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: Array<{
      rule_id: string;
      user_id: string;
      city: string;
      status: string;
      brief_id?: string;
      error?: string;
    }> = [];

    // Process each rule
    for (const rule of rules) {
      const { user_id, cities, auto_approve } = rule;

      // Generate brief for each city in the rule
      for (const city of cities) {
        try {
          // Call generate-daily-brief function
          const response = await fetch(
            `${SUPABASE_URL}/functions/v1/generate-daily-brief`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                city,
                user_id,
                date: new Date().toISOString().split("T")[0],
              }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            results.push({
              rule_id: rule.id,
              user_id,
              city,
              status: "failed",
              error: errorData.error || `HTTP ${response.status}`,
            });
            continue;
          }

          const data = await response.json();
          const briefId = data.brief?.id;

          // Auto-approve if configured
          if (auto_approve && briefId) {
            const { error: approveError } = await supabase
              .from("daily_briefs")
              .update({
                status: "approved",
                updated_at: new Date().toISOString(),
              })
              .eq("id", briefId);

            if (approveError) {
              console.error("Auto-approve failed:", approveError);
            }
          }

          results.push({
            rule_id: rule.id,
            user_id,
            city,
            status: auto_approve ? "approved" : "generated",
            brief_id: briefId,
          });
        } catch (error) {
          console.error(`Error generating brief for ${city}:`, error);
          results.push({
            rule_id: rule.id,
            user_id,
            city,
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      // Update last_run_at for the rule
      await supabase
        .from("automation_rules")
        .update({ last_run_at: new Date().toISOString() })
        .eq("id", rule.id);
    }

    const summary = {
      processed: results.length,
      successful: results.filter((r) => r.status !== "failed").length,
      failed: results.filter((r) => r.status === "failed").length,
      results,
    };

    console.log("Schedule daily briefs completed:", summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("schedule-daily-briefs error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
