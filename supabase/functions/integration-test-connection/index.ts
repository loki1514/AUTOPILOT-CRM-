const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { provider } = await req.json();
    const start = Date.now();
    let ok = false, message = "", credits: number | null = null;

    if (provider === "apollo") {
      const key = Deno.env.get("APOLLO_API_KEY");
      if (!key) { message = "APOLLO_API_KEY not set"; }
      else {
        const r = await fetch("https://api.apollo.io/api/v1/auth/health", {
          headers: { "X-Api-Key": key },
        });
        ok = r.ok; message = ok ? "Connected" : `HTTP ${r.status}`;
      }
    } else if (provider === "perplexity" || provider === "openrouter") {
      const key = Deno.env.get("OPENROUTER_API_KEY");
      if (!key) { message = "OPENROUTER_API_KEY not set"; }
      else {
        const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
            "HTTP-Referer": "https://officeflow.app",
            "X-Title": "OfficeFlow",
          },
          body: JSON.stringify({ model: "perplexity/sonar", messages: [{ role: "user", content: "ping" }], max_tokens: 5 }),
        });
        const body = await r.text();
        ok = r.ok; message = ok ? "Connected" : `HTTP ${r.status}: ${body.slice(0, 120)}`;
      }
    } else if (provider === "scrapingbee") {
      const key = Deno.env.get("SCRAPINGBEE_API_KEY");
      if (!key) { message = "SCRAPINGBEE_API_KEY not set"; }
      else {
        const r = await fetch(`https://app.scrapingbee.com/api/v1/usage?api_key=${key}`);
        const data = await r.json().catch(() => ({}));
        ok = r.ok;
        credits = data.max_api_credit ? (data.max_api_credit - (data.used_api_credit || 0)) : null;
        message = ok ? "Connected" : `HTTP ${r.status}`;
      }
    } else if (provider === "meta" || provider === "linkedin") {
      message = "Webhook receiver not yet configured (Phase 3)";
    } else {
      message = "Unknown provider";
    }

    return new Response(JSON.stringify({ provider, ok, message, latency_ms: Date.now() - start, credits }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
    });
  }
});