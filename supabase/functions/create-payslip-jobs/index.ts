import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface JobMapping {
  employeeId: string;
  driveFileId: string;
  driveFileName: string;
  confidence: number;
}

interface CreateJobsRequest {
  runId: string;
  mappings: JobMapping[];
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

    const { runId, mappings }: CreateJobsRequest = await req.json();

    if (!runId || !mappings || !Array.isArray(mappings) || mappings.length === 0) {
      return new Response(
        JSON.stringify({ error: "runId and mappings array are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify run exists and belongs to user
    const { data: run, error: runError } = await supabase
      .from("payslip_runs")
      .select("id, status, user_id")
      .eq("id", runId)
      .single();

    if (runError || !run) {
      return new Response(
        JSON.stringify({ error: "Run not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (run.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if jobs already exist for this run
    const { count: existingCount } = await supabase
      .from("payslip_jobs")
      .select("id", { count: "exact", head: true })
      .eq("run_id", runId);

    if (existingCount && existingCount > 0) {
      return new Response(
        JSON.stringify({ error: "Jobs already exist for this run" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Creating ${mappings.length} jobs for run ${runId}`);

    // Insert all jobs
    const jobRecords = mappings.map(m => ({
      run_id: runId,
      employee_id: m.employeeId,
      drive_file_id: m.driveFileId,
      drive_file_name: m.driveFileName,
      match_confidence: m.confidence,
      status: 'pending',
      retry_count: 0,
      max_retries: 3
    }));

    const { error: insertError } = await supabase
      .from("payslip_jobs")
      .insert(jobRecords);

    if (insertError) {
      throw new Error(`Failed to create jobs: ${insertError.message}`);
    }

    // Update run status and total jobs count
    const { error: updateError } = await supabase
      .from("payslip_runs")
      .update({ 
        status: 'validated',
        total_jobs: mappings.length
      })
      .eq("id", runId);

    if (updateError) {
      throw new Error(`Failed to update run: ${updateError.message}`);
    }

    // Create audit log entry
    await supabase
      .from("payslip_audit_logs")
      .insert({
        entity_type: 'run',
        entity_id: runId,
        action: 'jobs_created',
        performed_by: user.id,
        metadata: { job_count: mappings.length }
      });

    console.log(`Successfully created ${mappings.length} jobs`);

    return new Response(
      JSON.stringify({ 
        success: true,
        runId,
        jobCount: mappings.length
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in create-payslip-jobs:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
