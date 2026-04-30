import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface GenerateEmailRequest {
  companyName: string;
  payrollMonth: string;
  tone: 'formal' | 'friendly';
  senderName: string;
  customFooter?: string;
}

interface EmailTemplate {
  subject: string;
  body: string;
}

// Generate email template based on tone
function generateEmailTemplate(
  companyName: string,
  payrollMonth: string,
  tone: 'formal' | 'friendly',
  senderName: string,
  customFooter?: string
): EmailTemplate {
  const subject = `Your Salary Slip – ${payrollMonth}`;

  let body: string;

  if (tone === 'formal') {
    body = `Dear {{employee_name}},

Please find attached your salary slip for ${payrollMonth}.

If you have any questions regarding this payslip, please do not hesitate to reach out to the HR department.

Best regards,
${senderName}
${companyName}`;
  } else {
    body = `Hi {{employee_name}},

Your salary slip for ${payrollMonth} is attached to this email.

If you have any questions, feel free to reach out to the HR team – we're happy to help!

Cheers,
${senderName}
${companyName}`;
  }

  if (customFooter) {
    body += `\n\n${customFooter}`;
  }

  return { subject, body };
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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { 
      companyName, 
      payrollMonth, 
      tone, 
      senderName,
      customFooter 
    }: GenerateEmailRequest = await req.json();

    if (!companyName || !payrollMonth || !tone || !senderName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: companyName, payrollMonth, tone, senderName" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating ${tone} email template for ${payrollMonth}`);

    const template = generateEmailTemplate(
      companyName,
      payrollMonth,
      tone,
      senderName,
      customFooter
    );

    return new Response(
      JSON.stringify(template),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in generate-payslip-email:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
