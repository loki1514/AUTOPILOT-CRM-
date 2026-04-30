import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RetryJobsRequest {
  runId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { runId }: RetryJobsRequest = await req.json();

    if (!runId) {
      return new Response(
        JSON.stringify({ error: "runId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify run exists and belongs to user
    const { data: run, error: runError } = await supabase
      .from("payslip_runs")
      .select("id, user_id")
      .eq("id", runId)
      .single();

    if (runError || !run) {
      return new Response(
        JSON.stringify({ error: "Run not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get failed jobs that can be retried
    const { data: failedJobs, error: jobsError } = await supabase
      .from("payslip_jobs")
      .select("id, retry_count, max_retries")
      .eq("run_id", runId)
      .eq("status", "failed");

    if (jobsError) {
      throw new Error(`Failed to fetch jobs: ${jobsError.message}`);
    }

    // Filter jobs that haven't exceeded max retries
    const retryableJobs = failedJobs?.filter(j => j.retry_count < j.max_retries) || [];

    if (retryableJobs.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          resetCount: 0,
          message: "No jobs available for retry"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Resetting ${retryableJobs.length} failed jobs for retry`);

    // Reset jobs to pending
    const { error: updateError } = await supabase
      .from("payslip_jobs")
      .update({ 
        status: 'pending',
        error_code: null,
        error_message: null
      })
      .in("id", retryableJobs.map(j => j.id));

    if (updateError) {
      throw new Error(`Failed to reset jobs: ${updateError.message}`);
    }

    // Update run status back to sending
    await supabase
      .from("payslip_runs")
      .update({ 
        status: 'sending',
        failed_count: (run as any).failed_count - retryableJobs.length
      })
      .eq("id", runId);

    // Audit log for each retried job
    const auditLogs = retryableJobs.map(j => ({
      entity_type: 'job',
      entity_id: j.id,
      action: 'retried',
      performed_by: user.id,
      metadata: { retry_count: j.retry_count + 1 }
    }));

    await supabase
      .from("payslip_audit_logs")
      .insert(auditLogs);

    return new Response(
      JSON.stringify({ 
        success: true,
        resetCount: retryableJobs.length
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in retry-failed-payslip-jobs:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
