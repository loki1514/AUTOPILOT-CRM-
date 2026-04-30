import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ProcessJobRequest {
  runId: string;
}

// Get access token from service account
async function getAccessToken(serviceAccountJson: string): Promise<string> {
  const serviceAccount = JSON.parse(serviceAccountJson);
  
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/drive.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const claimsB64 = btoa(JSON.stringify(claims)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const signatureInput = `${headerB64}.${claimsB64}`;

  const pemContents = serviceAccount.private_key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(signatureInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${signatureInput}.${signatureB64}`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
  }

  return tokenData.access_token;
}

// Download file from Google Drive
async function downloadFile(fileId: string, accessToken: string): Promise<ArrayBuffer> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }

  return response.arrayBuffer();
}

// Personalize email template
function personalizeEmail(template: string, employeeName: string): string {
  return template.replace(/\{\{employee_name\}\}/g, employeeName);
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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // User auth client
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Service role client for atomic operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { runId }: ProcessJobRequest = await req.json();

    if (!runId) {
      return new Response(
        JSON.stringify({ error: "runId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch run details
    const { data: run, error: runError } = await supabaseUser
      .from("payslip_runs")
      .select("*")
      .eq("id", runId)
      .single();

    if (runError || !run) {
      return new Response(
        JSON.stringify({ error: "Run not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update run status to sending if not already
    if (run.status === 'validated') {
      await supabaseUser
        .from("payslip_runs")
        .update({ status: 'sending', locked_at: new Date().toISOString() })
        .eq("id", runId);
    }

    // Claim ONE pending job atomically using service role
    // We use a raw SQL query for FOR UPDATE SKIP LOCKED
    const { data: pendingJobs, error: jobError } = await supabaseAdmin
      .from("payslip_jobs")
      .select("*, payslip_employees!inner(employee_name, employee_email)")
      .eq("run_id", runId)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1);

    if (jobError) {
      throw new Error(`Failed to fetch pending jobs: ${jobError.message}`);
    }

    if (!pendingJobs || pendingJobs.length === 0) {
      // No more pending jobs - check if run is complete
      const { data: stats } = await supabaseAdmin
        .from("payslip_jobs")
        .select("status")
        .eq("run_id", runId);

      const sentCount = stats?.filter(j => j.status === 'sent').length || 0;
      const failedCount = stats?.filter(j => j.status === 'failed').length || 0;
      const totalCount = stats?.length || 0;

      let finalStatus = 'completed';
      if (failedCount > 0 && sentCount > 0) finalStatus = 'partial';
      if (failedCount === totalCount) finalStatus = 'failed';

      await supabaseUser
        .from("payslip_runs")
        .update({ 
          status: finalStatus,
          sent_count: sentCount,
          failed_count: failedCount
        })
        .eq("id", runId);

      return new Response(
        JSON.stringify({ 
          processed: false, 
          reason: 'no_pending_jobs',
          runStatus: finalStatus
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const job = pendingJobs[0];
    const employee = job.payslip_employees;

    console.log(`Processing job ${job.id} for employee ${employee.employee_name}`);

    // Mark job as processing
    await supabaseAdmin
      .from("payslip_jobs")
      .update({ status: 'processing' })
      .eq("id", job.id);

    try {
      // Get Google Drive access token
      const serviceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
      if (!serviceAccountJson) {
        throw new Error("Google service account not configured");
      }

      const accessToken = await getAccessToken(serviceAccountJson);

      // Download the PDF file
      console.log(`Downloading file ${job.drive_file_id}`);
      const pdfBuffer = await downloadFile(job.drive_file_id, accessToken);
      const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

      // Get Resend API key
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        throw new Error("Resend API key not configured");
      }

      const resend = new Resend(resendApiKey);

      // Personalize email
      const subject = personalizeEmail(run.email_subject_template || "Your Salary Slip", employee.employee_name);
      const body = personalizeEmail(run.email_body_template || "Please find your salary slip attached.", employee.employee_name);

      // Send email
      console.log(`Sending email to ${employee.employee_email}`);
      const emailResponse = await resend.emails.send({
        from: `${run.sender_name} <${run.sender_email}>`,
        to: [employee.employee_email],
        subject,
        text: body,
        attachments: [{
          filename: `${employee.employee_name.replace(/\s+/g, '_')}_Payslip_${run.payroll_month}.pdf`,
          content: pdfBase64,
        }],
      });

      const resendEmailId = (emailResponse as any).data?.id || (emailResponse as any).id || 'unknown';
      console.log(`Email sent successfully: ${resendEmailId}`);

      // Update job as sent
      await supabaseAdmin
        .from("payslip_jobs")
        .update({ 
          status: 'sent',
          resend_email_id: resendEmailId,
          sent_at: new Date().toISOString()
        })
        .eq("id", job.id);

      // Update run counts directly
      await supabaseAdmin
        .from("payslip_runs")
        .update({ sent_count: run.sent_count + 1 })
        .eq("id", runId);

      // Audit log
      await supabaseAdmin
        .from("payslip_audit_logs")
        .insert({
          entity_type: 'job',
          entity_id: job.id,
          action: 'sent',
          performed_by: user.id,
          metadata: { resend_email_id: resendEmailId }
        });

      return new Response(
        JSON.stringify({ 
          processed: true, 
          jobId: job.id,
          status: 'sent',
          employeeName: employee.employee_name
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (sendError: unknown) {
      const errorMessage = sendError instanceof Error ? sendError.message : "Unknown error";
      console.error(`Failed to send email for job ${job.id}:`, errorMessage);

      // Determine if transient or permanent error
      const isTransient = errorMessage.includes("timeout") || 
                         errorMessage.includes("5") || 
                         errorMessage.includes("rate limit");

      if (isTransient && job.retry_count < job.max_retries) {
        // Transient error - retry later
        await supabaseAdmin
          .from("payslip_jobs")
          .update({ 
            status: 'pending',
            retry_count: job.retry_count + 1,
            error_message: errorMessage
          })
          .eq("id", job.id);
      } else {
        // Permanent error
        await supabaseAdmin
          .from("payslip_jobs")
          .update({ 
            status: 'failed',
            error_code: 'SEND_FAILED',
            error_message: errorMessage
          })
          .eq("id", job.id);

        // Update failed count
        await supabaseAdmin
          .from("payslip_runs")
          .update({ failed_count: run.failed_count + 1 })
          .eq("id", runId);
      }

      // Audit log
      await supabaseAdmin
        .from("payslip_audit_logs")
        .insert({
          entity_type: 'job',
          entity_id: job.id,
          action: 'failed',
          performed_by: user.id,
          metadata: { error: errorMessage }
        });

      return new Response(
        JSON.stringify({ 
          processed: true, 
          jobId: job.id,
          status: 'failed',
          error: errorMessage
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: unknown) {
    console.error("Error in process-single-payslip-job:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
