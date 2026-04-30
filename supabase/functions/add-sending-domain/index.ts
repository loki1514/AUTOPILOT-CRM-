import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AddDomainRequest {
  domain: string;
  fromEmail: string;
  fromName: string;
}

// Map Resend status to our internal status
function mapResendStatus(resendStatus: string): "pending" | "verified" | "failed" {
  if (resendStatus === "verified") return "verified";
  if (resendStatus === "failed" || resendStatus === "not_started") return "failed";
  return "pending";
}

// Validates that the domain is a subdomain (not a root domain)
function isValidSubdomain(domain: string): boolean {
  // Remove any protocol prefix if accidentally included
  const cleanDomain = domain.replace(/^https?:\/\//, "").toLowerCase().trim();
  
  // Split by dots
  const parts = cleanDomain.split(".");
  
  // Must have at least 3 parts for a subdomain (e.g., mail.example.com)
  // mail.example.com = 3 parts ✓
  // example.com = 2 parts ✗
  // mail.sub.example.com = 4 parts ✓
  if (parts.length < 3) {
    return false;
  }
  
  // Validate each part is not empty and contains valid characters
  for (const part of parts) {
    if (!part || !/^[a-z0-9-]+$/.test(part)) {
      return false;
    }
  }
  
  return true;
}

// Validates email matches the domain
function isValidEmailForDomain(email: string, domain: string): boolean {
  const emailDomain = email.split("@")[1]?.toLowerCase();
  return emailDomain === domain.toLowerCase();
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
    const { domain, fromEmail, fromName }: AddDomainRequest = await req.json();

    // Validate required fields
    if (!domain || !fromEmail) {
      throw new Error("Domain and fromEmail are required");
    }

    const cleanDomain = domain.replace(/^https?:\/\//, "").toLowerCase().trim();

    // CRITICAL: Validate subdomain requirement
    if (!isValidSubdomain(cleanDomain)) {
      throw new Error(
        "Invalid domain. You must use a subdomain for sending emails (e.g., mail.example.com, notify.company.com). Root domains like example.com are not allowed to protect your inbox deliverability."
      );
    }

    // Validate email matches domain
    if (!isValidEmailForDomain(fromEmail, cleanDomain)) {
      throw new Error(`The from email must use the ${cleanDomain} domain`);
    }

    // Check if domain already exists for this user
    const { data: existingDomain } = await supabase
      .from("sending_domains")
      .select("id")
      .eq("user_id", user.id)
      .eq("domain", cleanDomain)
      .single();

    if (existingDomain) {
      throw new Error("This domain is already registered");
    }

    // Get Resend API key
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("Resend API key not configured");
    }

    // Try to register domain with Resend
    let resendData: any;
    let dnsRecords: any[] = [];

    const resendResponse = await fetch("https://api.resend.com/domains", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: cleanDomain }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json();
      
      // If domain already exists in Resend, fetch it instead
      if (errorData.message?.includes("registered already") || errorData.statusCode === 403) {
        console.log("Domain already exists in Resend, fetching existing domain...");
        
        // List all domains and find the matching one
        const listResponse = await fetch("https://api.resend.com/domains", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
          },
        });

        if (!listResponse.ok) {
          throw new Error("Failed to fetch existing domains from Resend");
        }

        const listData = await listResponse.json();
        const existingDomain = listData.data?.find((d: any) => d.name === cleanDomain);

        if (!existingDomain) {
          throw new Error("Domain registered but could not be found. Please contact support.");
        }

        // Fetch full domain details including DNS records
        const detailResponse = await fetch(`https://api.resend.com/domains/${existingDomain.id}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
          },
        });

        if (!detailResponse.ok) {
          throw new Error("Failed to fetch domain details from Resend");
        }

        resendData = await detailResponse.json();
        dnsRecords = resendData.records || [];
        console.log("Retrieved existing domain from Resend:", resendData);
      } else {
        console.error("Resend API error:", errorData);
        throw new Error(errorData.message || "Failed to register domain with Resend");
      }
    } else {
      resendData = await resendResponse.json();
      dnsRecords = resendData.records || [];
      console.log("Resend domain created:", resendData);
    }

    // Save domain to database with actual status from Resend
    const mappedStatus = mapResendStatus(resendData.status || "pending");
    
    const insertData: Record<string, unknown> = {
      user_id: user.id,
      domain: cleanDomain,
      from_email: fromEmail.toLowerCase(),
      from_name: fromName || "",
      status: mappedStatus,
      resend_domain_id: resendData.id,
      dns_records: dnsRecords,
    };

    // If already verified, set the verified_at timestamp
    if (mappedStatus === "verified") {
      insertData.verified_at = new Date().toISOString();
    }

    const { data: savedDomain, error: saveError } = await supabase
      .from("sending_domains")
      .insert(insertData)
      .select()
      .single();

    if (saveError) {
      console.error("Database save error:", saveError);
      throw new Error("Failed to save domain");
    }

    const message = mappedStatus === "verified"
      ? "Domain already verified and ready to use!"
      : "Domain registered. Please configure the DNS records shown below, then verify.";

    return new Response(
      JSON.stringify({
        success: true,
        domain: savedDomain,
        dnsRecords: dnsRecords,
        message,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in add-sending-domain:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
