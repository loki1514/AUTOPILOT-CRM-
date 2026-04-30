import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SCRAPINGBEE_API_KEY = Deno.env.get("SCRAPINGBEE_API_KEY");

function isValidUUID(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function validateScrapeUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("company_url must be a valid URL");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("company_url must use http or https protocol");
  }
  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".corp") ||
    /^127\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^172\.(1[6-9]|2[0-9]|3[01])\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^0\./.test(hostname) ||
    /^169\.254\./.test(hostname)
  ) {
    throw new Error("company_url cannot point to internal or localhost addresses");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthenticated");
    if (!SCRAPINGBEE_API_KEY) throw new Error("SCRAPINGBEE_API_KEY not configured");

    const { lead_id, company_url } = await req.json();
    if (!lead_id || !company_url) throw new Error("lead_id and company_url required");

    if (!isValidUUID(lead_id)) throw new Error("lead_id must be a valid UUID");
    validateScrapeUrl(company_url);

    const startedAt = Date.now();
    let jobStatus = "success", jobError: string | null = null;
    let extracted: any = {};
    let creditsRemaining: number | null = null;
    let signalsInserted = 0;

    try {
      const extractRules = JSON.stringify({
        title: "title",
        meta_description: { selector: "meta[name='description']", output: "@content" },
        all_text: { selector: "body", output: "text" },
      });
      const url = new URL("https://app.scrapingbee.com/api/v1/");
      url.searchParams.set("api_key", SCRAPINGBEE_API_KEY);
      url.searchParams.set("url", company_url);
      url.searchParams.set("render_js", "false");
      url.searchParams.set("extract_rules", extractRules);

      const sbRes = await fetch(url.toString());
      const remaining = sbRes.headers.get("Spb-cost") ? null : sbRes.headers.get("X-Remaining-Credits");
      if (remaining) creditsRemaining = parseInt(remaining);
      const sbData = await sbRes.json();
      if (!sbRes.ok) throw new Error(`ScrapingBee ${sbRes.status}: ${JSON.stringify(sbData).slice(0, 200)}`);
      extracted = sbData;

      const text = (sbData.all_text || "").toLowerCase();
      const signals: { type: string; value: string; score: number }[] = [];
      if (/we'?re hiring|join our team|open positions|careers/.test(text)) {
        signals.push({ type: "job_posting", value: "Active hiring on company site", score: 10 });
      }
      if (/series [a-d]|funding|raised \$/.test(text)) {
        signals.push({ type: "funding_round", value: "Funding mention on site", score: 20 });
      }
      if (/new office|expanding|relocat|moving to/.test(text)) {
        signals.push({ type: "news_mention", value: "Office expansion mention", score: 15 });
      }

      if (signals.length) {
        await supabase.from("intent_signals").insert(signals.map(s => ({
          lead_id, signal_type: s.type, signal_value: s.value,
          source_api: "scrapingbee", score_contribution: s.score,
        })));
        signalsInserted = signals.length;
      }
    } catch (err: any) {
      jobStatus = "failed"; jobError = err.message;
    }

    await supabase.from("enrichment_jobs").insert({
      user_id: user.id, lead_id, provider: "scrapingbee",
      status: jobStatus, request: { lead_id, company_url },
      response: { signals_inserted: signalsInserted, title: extracted.title },
      error: jobError, latency_ms: Date.now() - startedAt, completed_at: new Date().toISOString(),
    });

    await supabase.rpc("bump_integration_status", {
      _user_id: user.id, _provider: "scrapingbee",
      _success: jobStatus === "success", _error: jobError,
      _credits_remaining: creditsRemaining, _leads_ingested: 0,
    });

    return new Response(JSON.stringify({ success: jobStatus === "success", signals_inserted: signalsInserted, error: jobError }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: jobStatus === "success" ? 200 : 500,
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
    });
  }
});
