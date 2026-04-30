import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface VerifyDomainRequest {
  domainId: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Invalid user token");
    }

    // Parse request body
    const { domainId }: VerifyDomainRequest = await req.json();

    if (!domainId) {
      throw new Error("Domain ID is required");
    }

    // Get domain from database
    const { data: domain, error: domainError } = await supabase
      .from("sending_domains")
      .select("*")
      .eq("id", domainId)
      .eq("user_id", user.id)
      .single();

    if (domainError || !domain) {
      throw new Error("Domain not found");
    }

    if (!domain.resend_domain_id) {
      throw new Error("Domain not registered with Resend");
    }

    // Get Resend API key
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("Resend API key not configured");
    }

    // Verify domain with Resend
    const verifyResponse = await fetch(
      `https://api.resend.com/domains/${domain.resend_domain_id}/verify`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
        },
      }
    );

    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json();
      console.error("Resend verify error:", errorData);
      throw new Error(errorData.message || "Failed to verify domain");
    }

    // Get updated domain status from Resend
    const statusResponse = await fetch(
      `https://api.resend.com/domains/${domain.resend_domain_id}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
        },
      }
    );

    if (!statusResponse.ok) {
      const statusErrorData = await statusResponse.json().catch(() => ({}));
      console.error("Resend status fetch error:", {
        status: statusResponse.status,
        statusText: statusResponse.statusText,
        error: statusErrorData,
        domainId: domain.resend_domain_id,
      });
      throw new Error(statusErrorData.message || `Failed to get domain status (${statusResponse.status})`);
    }

    const statusData = await statusResponse.json();
    console.log("Resend domain status:", JSON.stringify(statusData, null, 2));

    // Determine verification status
    let newStatus: "pending" | "verified" | "failed" = "pending";
    
    if (statusData.status === "verified") {
      newStatus = "verified";
    } else if (statusData.status === "failed" || statusData.status === "not_started") {
      newStatus = "failed";
    }

    // Transform DNS records to include per-record status
    const dnsRecords = (statusData.records || []).map((record: any) => ({
      type: record.type || 'TXT',
      name: record.name || '',
      value: record.value || '',
      priority: record.priority,
      status: record.status || 'pending',
      record: record.record || null,
    }));

    // Count verified vs pending records for better feedback
    const verifiedRecords = dnsRecords.filter((r: any) => r.status === 'verified').length;
    const totalRecords = dnsRecords.length;

    // Update domain in database
    const updateData: any = {
      status: newStatus,
      dns_records: dnsRecords,
    };

    if (newStatus === "verified") {
      updateData.verified_at = new Date().toISOString();
    }

    const { data: updatedDomain, error: updateError } = await supabase
      .from("sending_domains")
      .update(updateData)
      .eq("id", domainId)
      .select()
      .single();

    if (updateError) {
      console.error("Database update error:", updateError);
      throw new Error("Failed to update domain status");
    }

    const message = newStatus === "verified"
      ? "Domain verified successfully! You can now send emails from this domain."
      : newStatus === "failed"
      ? `Domain verification failed. ${verifiedRecords}/${totalRecords} records verified. Please check your DNS records and try again.`
      : `Verification in progress. ${verifiedRecords}/${totalRecords} records verified. DNS records may take up to 72 hours to propagate.`;

    return new Response(
      JSON.stringify({
        success: true,
        domain: updatedDomain,
        status: newStatus,
        message,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in verify-sending-domain:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
