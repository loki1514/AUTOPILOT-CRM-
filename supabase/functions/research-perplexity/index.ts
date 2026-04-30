import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { computeSignalScore, recomputeLeadScores, type VerificationStatus } from "../_shared/scoring.ts";
import { checkEnrichmentRateLimit } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

function safeJsonExtract(text: string): any {
  // Try to find the outermost JSON object by balancing braces
  let start = -1;
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (text[i] === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        const candidate = text.slice(start, i + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          // continue searching
        }
      }
    }
  }
  // Fallback: try the whole text
  try {
    return JSON.parse(text);
  } catch {
    // Last resort: find first { and last }
    const fallbackStart = text.indexOf("{");
    const fallbackEnd = text.lastIndexOf("}");
    if (fallbackStart !== -1 && fallbackEnd > fallbackStart) {
      try {
        return JSON.parse(text.slice(fallbackStart, fallbackEnd + 1));
      } catch {
        // ignore
      }
    }
  }
  return {};
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
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");

    const rateLimit = checkEnrichmentRateLimit(user.id);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded. Try again in a minute." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429,
      });
    }

    const { lead_id } = await req.json();
    if (!lead_id) throw new Error("lead_id required");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lead_id)) throw new Error("lead_id must be a valid UUID");

    const { data: lead } = await supabase.from("leads").select("*").eq("id", lead_id).eq("user_id", user.id).single();
    if (!lead) throw new Error("Lead not found");

    const startedAt = Date.now();
    let jobStatus = "success", jobError: string | null = null;
    let parsed: any = {};
    let dmFound = false;

    try {
      const cityForSearch = lead.city || lead.location || "India";
      const systemPrompt = `You are a B2B sales intelligence researcher specialising in managed office space demand signals for Indian companies. You return ONLY valid JSON. Never invent data. Never infer without evidence. If you cannot find a source URL for a claim, do NOT include it in "signals" — put it in "disqualified_claims" with the reason. India calibration: a LinkedIn post from a verifiable senior leader (COO, Founder, Head of Ops) counts as partially_verified evidence; a job posting for Workplace/Facilities Manager in the target city is a high-confidence hiring signal. Sources older than 120 days: downgrade confidence by 30 and mark verification_status as partially_verified at best. If fewer than 2 verified signals exist, set intent_score to at most 40.`;

      const userPrompt = `Research the company "${lead.company}" located in ${cityForSearch}, India (domain: ${lead.company_domain || lead.website || "unknown"}).

Return ONLY this exact JSON structure with no preamble or markdown:
{
  "summary": "2 sentence factual company overview",
  "headcount_estimate": number or null,
  "signals": [
    {
      "type": "funding | hiring | office_expansion | lease | relocation | leadership_change",
      "claim": "specific factual claim in one sentence",
      "city": "${cityForSearch} or other city or null",
      "event_date": "YYYY-MM-DD or null",
      "source_url": "FULL https URL — REQUIRED. Omit the entire signal if you cannot provide a real URL.",
      "source_type": "company_filing | tier1_news | secondary_news | linkedin_post | job_page | directory | company_website",
      "source_title": "publication or page name",
      "published_date": "YYYY-MM-DD or null",
      "confidence": 0-100,
      "verification_status": "verified | partially_verified | unverified",
      "why_it_matters": "one sentence on managed-office relevance"
    }
  ],
  "disqualified_claims": [
    { "claim": "claim you considered but rejected", "reason": "no source | outdated | conflicting | too speculative" }
  ],
  "decision_maker_name": "full name of the most senior office/workplace decision-maker in ${cityForSearch}, or null",
  "decision_maker_title": "their exact current title, or null",
  "decision_maker_linkedin_url": "full https LinkedIn profile URL if verifiable from public sources, or null",
  "decision_maker_confidence": "high | medium | low",
  "intent_score": 0-100,
  "intent_reasoning": "reasoning citing only verified signals above"
}

RULES:
- Never invent lease end dates, office move dates, or funding amounts.
- Never infer office need from headcount alone without supporting evidence.
- Decision-maker title priority: Head of Administration, Facilities Manager, Workplace Manager, Real Estate Manager, Head of Operations, COO, CEO, Founder. Prefer someone based in ${cityForSearch}.
- For decision_maker_linkedin_url: only provide if you can find the actual LinkedIn profile URL. Do not guess or fabricate.`;

      console.log("[openrouter] calling perplexity/sonar-pro via OpenRouter for", lead.company, cityForSearch);
      const pplxRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://officeflow.app",
          "X-Title": "OfficeFlow",
        },
        body: JSON.stringify({
          model: "perplexity/sonar-pro",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.1,
        }),
      });
      const data = await pplxRes.json();
      if (!pplxRes.ok) throw new Error(`OpenRouter ${pplxRes.status}: ${JSON.stringify(data).slice(0, 200)}`);
      const content = data.choices?.[0]?.message?.content || "{}";
      parsed = safeJsonExtract(content);
      dmFound = !!(parsed.decision_maker_name || parsed.decision_maker_linkedin_url);
      console.log("[openrouter] dm_found", {
        name: parsed.decision_maker_name,
        hasUrl: !!parsed.decision_maker_linkedin_url,
        confidence: parsed.decision_maker_confidence,
      });

      // ── Evidence-backed signal write ────────────────────────────────
      // Only signals with a real source_url survive; the rest become disqualified_claims.
      const rawSignals: any[] = Array.isArray(parsed.signals) ? parsed.signals : [];
      const disqualified: any[] = Array.isArray(parsed.disqualified_claims) ? parsed.disqualified_claims : [];
      const validSignals = rawSignals.filter(
        (s) => typeof s?.source_url === "string" && /^https?:\/\//i.test(s.source_url),
      );
      const droppedNoUrl = rawSignals.length - validSignals.length;
      if (droppedNoUrl > 0) {
        for (const s of rawSignals) {
          if (!s?.source_url || !/^https?:\/\//i.test(s.source_url)) {
            disqualified.push({ claim: s?.claim || JSON.stringify(s).slice(0, 200), reason: "no source url" });
          }
        }
      }
      console.log("[openrouter] signals", { kept: validSignals.length, dropped: droppedNoUrl, disqualified: disqualified.length });

      if (validSignals.length) {
        const rows = validSignals.map((s: any) => {
          const verification = (s.verification_status || "unverified") as VerificationStatus;
          return {
            lead_id,
            signal_type: s.type || "other",
            signal_value: s.claim || s.source_title || "",
            source_api: "perplexity",
            claim: s.claim || null,
            source_url: s.source_url,
            source_type: s.source_type || null,
            source_title: s.source_title || null,
            event_date: s.event_date || null,
            published_date: s.published_date || null,
            confidence: typeof s.confidence === "number" ? s.confidence : null,
            verification_status: verification,
            why_it_matters: s.why_it_matters || null,
            score_contribution: computeSignalScore({ ...s, signal_type: s.type }),
          };
        });
        await supabase.from("intent_signals").insert(rows);
      }

      const leadUpdate: any = {
        perplexity_summary: parsed.summary || null,
        last_enriched_provider: "perplexity",
        enriched_at: new Date().toISOString(),
        disqualified_claims: disqualified,
      };
      if (parsed.decision_maker_name) leadUpdate.dm_name = parsed.decision_maker_name;
      if (parsed.decision_maker_title) leadUpdate.dm_title = parsed.decision_maker_title;
      if (parsed.decision_maker_linkedin_url) leadUpdate.dm_linkedin_url = parsed.decision_maker_linkedin_url;
      if (parsed.decision_maker_confidence) leadUpdate.dm_confidence = parsed.decision_maker_confidence;
      await supabase.from("leads").update(leadUpdate).eq("id", lead_id);

      // Recompute V/I/C/readiness now that signals have changed.
      await recomputeLeadScores(supabase, lead_id);
    } catch (err: any) {
      jobStatus = "failed"; jobError = err.message;
      console.error("[openrouter] failed:", err.message);
    }

    await supabase.from("enrichment_jobs").insert({
      user_id: user.id, lead_id, provider: "perplexity",
      status: jobStatus, request: { lead_id }, response: parsed, error: jobError,
      latency_ms: Date.now() - startedAt, completed_at: new Date().toISOString(),
    });

    await supabase.rpc("bump_integration_status", {
      _user_id: user.id, _provider: "perplexity",
      _success: jobStatus === "success", _error: jobError,
      _credits_remaining: null, _leads_ingested: 0,
    });

    return new Response(JSON.stringify({
      success: jobStatus === "success",
      research: parsed,
      dm: {
        name: parsed.decision_maker_name || null,
        title: parsed.decision_maker_title || null,
        linkedin_url: parsed.decision_maker_linkedin_url || null,
        confidence: parsed.decision_maker_confidence || null,
        found: dmFound,
      },
      error: jobError,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
    });
  }
});