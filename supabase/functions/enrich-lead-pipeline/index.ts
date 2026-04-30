import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { checkEnrichmentRateLimit } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function invoke(name: string, body: any, authHeader: string, timeoutMs = 45000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok && (data?.success !== false), data };
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      return { ok: false, data: { error: `${name} timed out after ${timeoutMs}ms` } };
    }
    return { ok: false, data: { error: err.message } };
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

    const rateLimit = checkEnrichmentRateLimit(user.id);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded. Try again in a minute." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429,
      });
    }

    const { lead_id, provider } = await req.json();
    if (!lead_id) throw new Error("lead_id required");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lead_id)) throw new Error("lead_id must be a valid UUID");

    const runPerplexity = !provider || provider === "perplexity";
    const runApollo = !provider || provider === "apollo";

    const results: Record<string, any> = {};

    // 1) Perplexity first — research the company AND hunt the decision-maker
    if (runPerplexity) {
      const pplx = await invoke("research-perplexity", { lead_id }, authHeader);
      results.perplexity = pplx;
      const dm = pplx.data?.dm || {};
      console.log("[pipeline] perplexity ok=", pplx.ok, "dm_found=", !!dm?.found, "name=", dm?.name);

      // 2) Apollo second — pass the DM hint so it can hydrate by LinkedIn URL or name
      if (runApollo) {
        const apolloHint = (dm?.linkedin_url || dm?.name)
          ? { linkedin_url: dm.linkedin_url || null, name: dm.name || null, title: dm.title || null }
          : undefined;
        results.apollo = await invoke("enrich-apollo", { lead_id, hint: apolloHint }, authHeader);
        console.log("[pipeline] apollo ok=", results.apollo.ok, "path=", results.apollo.data?.path, "upserts=", results.apollo.data?.contacts_upserted);
      }
    } else if (runApollo) {
      // Apollo-only run (no Perplexity hint)
      results.apollo = await invoke("enrich-apollo", { lead_id }, authHeader);
      console.log("[pipeline] apollo-only ok=", results.apollo.ok, "path=", results.apollo.data?.path, "upserts=", results.apollo.data?.contacts_upserted);
    }

    // ScrapingBee — only if we have a website
    if (!provider || provider === "apollo") {
      const { data: lead } = await supabase.from("leads").select("website,company_domain").eq("id", lead_id).single();
      const url = lead?.website || (lead?.company_domain ? `https://${lead.company_domain}` : null);
      if (url) {
        results.scrapingbee = await invoke("scrape-company", { lead_id, company_url: url }, authHeader);
      } else {
        results.scrapingbee = { ok: false, data: { skipped: true, reason: "no website" } };
      }
    }

    const apolloUpserts = Number(results.apollo?.data?.contacts_upserted ?? 0);
    const apolloPath = results.apollo?.data?.path ?? "title_search";
    const pplx = results.perplexity;
    const dm = pplx?.data?.dm || {};

    // Read the freshly-recomputed scores written by enrich-apollo.
    const { data: leadAfter } = await supabase
      .from("leads")
      .select("verification_score, contactability_score, intent_score, outreach_readiness, enrichment_status")
      .eq("id", lead_id)
      .single();

    const summary = {
      perplexity: pplx ? {
        ok: pplx.ok,
        error: pplx.data?.error || null,
        dm_found: !!dm?.found,
        dm_name: dm?.name || null,
        dm_linkedin_url: dm?.linkedin_url || null,
        dm_confidence: dm?.confidence || null,
      } : { ok: false, skipped: true },
      apollo: results.apollo ? {
        ok: results.apollo.ok,
        error: results.apollo.data?.error || null,
        contacts_upserted: apolloUpserts,
        credits_used: results.apollo.data?.credits_used ?? null,
        credits_remaining: results.apollo.data?.credits_remaining ?? null,
        path: apolloPath,
        reason: results.apollo.data?.reason || null,
        slate: results.apollo.data?.slate || null,
      } : { ok: false, skipped: true },
      scores: leadAfter
        ? {
            verification: leadAfter.verification_score,
            intent: leadAfter.intent_score,
            contactability: leadAfter.contactability_score,
            readiness: leadAfter.outreach_readiness,
          }
        : null,
      status: leadAfter?.enrichment_status || null,
      needs_manual_research: leadAfter?.enrichment_status === "needs_manual_research",
    };

    return new Response(JSON.stringify({ success: true, results, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
    });
  }
});