import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BriefRequest {
  city: string;
  user_id: string;
  date?: string;
}

interface EnrichedLead {
  id: string;
  company: string;
  full_name: string | null;
  job_title: string | null;
  city: string | null;
  location: string | null;
  headcount: number;
  website: string | null;
  company_domain: string | null;
  outreach_readiness: number;
  verification_score: number;
  intent_score: number;
  contactability_score: number;
  enrichment_status: string | null;
  enriched_at: string | null;
  perplexity_summary: string | null;
  dm_name: string | null;
  dm_title: string | null;
  dm_linkedin_url: string | null;
  signals: Array<{
    signal_type: string;
    claim: string | null;
    source_url: string | null;
    source_title: string | null;
    published_date: string | null;
    confidence: number | null;
    verification_status: string | null;
    why_it_matters: string | null;
    score_contribution: number;
  }>;
  contacts: Array<{
    full_name: string;
    title: string | null;
    priority_rank: number;
    linkedin_url: string | null;
    email: string | null;
    phone: string | null;
  }>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { city, user_id, date }: BriefRequest = await req.json();
    if (!city || !user_id) {
      return new Response(JSON.stringify({ error: "city and user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const briefDate = date || new Date().toISOString().slice(0, 10);
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // ── 1. Fetch enriched leads for this user + city ────────────────────
    // Threshold: outreach_readiness >= 30 OR intent_score >= 30
    // Only leads that have been enriched (have signals or contacts or scores)
    const { data: leadsRaw, error: leadsErr } = await supabase
      .from("leads")
      .select("id, company, full_name, job_title, city, location, headcount, website, company_domain, outreach_readiness, verification_score, intent_score, contactability_score, enrichment_status, enriched_at, perplexity_summary, dm_name, dm_title, dm_linkedin_url")
      .eq("user_id", user_id)
      .eq("city", city)
      .or("outreach_readiness.gte.30,intent_score.gte.30")
      .order("outreach_readiness", { ascending: false })
      .limit(50);

    if (leadsErr) throw leadsErr;

    const leadIds = (leadsRaw || []).map((l) => l.id);

    if (leadIds.length === 0) {
      return new Response(
        JSON.stringify({ error: `No enriched leads found for ${city}. Add leads and run Enrich first.` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 2. Batch fetch signals and contacts ─────────────────────────────
    const [{ data: signalsRaw }, { data: contactsRaw }] = await Promise.all([
      supabase
        .from("intent_signals")
        .select("lead_id, signal_type, claim, source_url, source_title, published_date, confidence, verification_status, why_it_matters, score_contribution")
        .in("lead_id", leadIds)
        .or("verification_status.eq.verified,verification_status.eq.partially_verified")
        .order("score_contribution", { ascending: false }),
      supabase
        .from("lead_contacts")
        .select("lead_id, full_name, title, priority_rank, linkedin_url, email, phone")
        .in("lead_id", leadIds)
        .order("priority_rank", { ascending: true }),
    ]);

    // ── 3. Assemble enriched leads ──────────────────────────────────────
    const signalsByLead: Record<string, typeof signalsRaw> = {};
    for (const s of (signalsRaw || [])) {
      if (!signalsByLead[s.lead_id]) signalsByLead[s.lead_id] = [];
      signalsByLead[s.lead_id].push(s);
    }

    const contactsByLead: Record<string, typeof contactsRaw> = {};
    for (const c of (contactsRaw || [])) {
      if (!contactsByLead[c.lead_id]) contactsByLead[c.lead_id] = [];
      contactsByLead[c.lead_id].push(c);
    }

    const enrichedLeads: EnrichedLead[] = (leadsRaw || []).map((l) => ({
      ...l,
      signals: signalsByLead[l.id] || [],
      contacts: (contactsByLead[l.id] || []).slice(0, 4),
    }));

    // ── 4. Categorize into brief sections ───────────────────────────────
    const expiringLeases: EnrichedLead[] = [];
    const fundedStartups: EnrichedLead[] = [];
    const highIntent: EnrichedLead[] = [];
    const leadReferences: Record<string, string[]> = {
      expiring_leases: [],
      funded_startups: [],
      high_intent: [],
    };

    for (const lead of enrichedLeads) {
      const hasLease = lead.signals.some((s) => s.signal_type === "lease" || s.claim?.toLowerCase().includes("lease"));
      const hasFunding = lead.signals.some((s) => s.signal_type === "funding_round" || s.signal_type === "funding");

      if (hasLease) {
        expiringLeases.push(lead);
        leadReferences.expiring_leases.push(lead.id);
      } else if (hasFunding) {
        fundedStartups.push(lead);
        leadReferences.funded_startups.push(lead.id);
      } else if (lead.outreach_readiness >= 40) {
        highIntent.push(lead);
        leadReferences.high_intent.push(lead.id);
      }
    }

    // ── 5. Build micro-market watch from signal locations ───────────────
    const microMarketMap = new Map<string, string[]>();
    for (const lead of enrichedLeads) {
      const market = lead.location || lead.city || city;
      for (const s of lead.signals) {
        if (s.why_it_matters) {
          const existing = microMarketMap.get(market) || [];
          existing.push(s.why_it_matters);
          microMarketMap.set(market, existing);
        }
      }
    }
    const microMarketWatch = Array.from(microMarketMap.entries())
      .map(([micro_market, summaries]) => ({
        micro_market,
        summary: summaries.slice(0, 2).join(" "),
      }))
      .slice(0, 4);

    // ── 6. Build competitor alerts from signal claims ───────────────────
    const competitors = ["Awfis", "Smartworks", "WeWork", "Table Space", "IndiQube", "91springboard", "BHIVE"];
    const competitorAlerts: Array<{ entity: string; movement: string; impact: string }> = [];
    for (const lead of enrichedLeads) {
      for (const s of lead.signals) {
        const claim = s.claim || "";
        for (const comp of competitors) {
          if (claim.toLowerCase().includes(comp.toLowerCase())) {
            competitorAlerts.push({
              entity: comp,
              movement: claim.slice(0, 120),
              impact: s.why_it_matters || "Market activity detected",
            });
          }
        }
      }
    }

    // ── 7. Build BD tips from top signals ───────────────────────────────
    const allSignals = enrichedLeads.flatMap((l) => l.signals.map((s) => ({ ...s, company: l.company })));
    const topSignals = allSignals
      .filter((s) => s.verification_status === "verified")
      .sort((a, b) => (b.score_contribution || 0) - (a.score_contribution || 0))
      .slice(0, 3);

    const bdTips = {
      linkedin_strategy: topSignals.length > 0
        ? `Target ${topSignals[0].company}: ${topSignals[0].why_it_matters || "High intent signal detected"}. Reach out via ${topSignals[0].source_title || "LinkedIn"}.`
        : `Monitor LinkedIn for workplace/facilities role postings in ${city}.`,
      script_of_the_day: topSignals.length > 0
        ? `Hi [Name], saw ${topSignals[0].company} ${topSignals[0].claim?.slice(0, 80) || "has expansion plans"}. We're placing teams like yours in ${city} — worth a 10-min chat?`
        : `Hi [Name], we're helping growing teams in ${city} find managed office space. Any plans to expand your footprint this quarter?`,
    };

    // ── 8. Build headline from top lead ─────────────────────────────────
    const topLead = enrichedLeads[0];
    const topSignal = topLead?.signals[0];
    const headline = topSignal
      ? `${topLead.company}: ${topSignal.claim?.slice(0, 80) || "high intent opportunity"} — ${city} market`
      : `${enrichedLeads.length} high-intent opportunities in ${city}`;

    // ── 9. Helper: map lead to brief item shape ─────────────────────────
    function buildStructuredData(lead: EnrichedLead) {
      const p1Count = lead.contacts.filter((c) => c.priority_rank <= 2).length;
      const p2Count = lead.contacts.filter((c) => c.priority_rank > 2 && c.priority_rank <= 5).length;
      const linkedinCount = lead.contacts.filter((c) => c.linkedin_url).length;
      const emailCount = lead.contacts.filter((c) => c.email).length;
      const phoneCount = lead.contacts.filter((c) => c.phone).length;
      return {
        verification_score: lead.verification_score,
        intent_score: lead.intent_score,
        contactability_score: lead.contactability_score,
        outreach_readiness: lead.outreach_readiness,
        p1_count: p1Count,
        p2_count: p2Count,
        contact_count: lead.contacts.length,
        linkedin_count: linkedinCount,
        email_count: emailCount,
        phone_count: phoneCount,
        enrichment_status: lead.enrichment_status,
        signals: lead.signals.slice(0, 2).map((s) => ({
          type: s.signal_type,
          claim: s.claim,
          source_url: s.source_url,
          source_title: s.source_title,
          published_date: s.published_date,
          confidence: s.confidence,
          verification_status: s.verification_status,
          why_it_matters: s.why_it_matters,
        })),
      };
    }

    function leadToLeaseItem(lead: EnrichedLead) {
      const leaseSignal = lead.signals.find((s) => s.signal_type === "lease" || s.claim?.toLowerCase().includes("lease"));
      const struct = buildStructuredData(lead);
      return {
        company_name: lead.company,
        location: lead.location || lead.city || city,
        seats: String(lead.headcount || "—"),
        lease_end: leaseSignal?.event_date || leaseSignal?.published_date || "Q3 2025",
        remarks: lead.perplexity_summary || `${lead.signals.length} verified signal${lead.signals.length !== 1 ? "s" : ""}`,
        why_qualifies: leaseSignal?.why_it_matters || `${lead.company} showing office space demand signals in ${city}.`,
        talking_points: [
          `Outreach readiness: ${lead.outreach_readiness}/100 (V${lead.verification_score} · I${lead.intent_score} · C${lead.contactability_score})`,
          struct.p1_count > 0 ? `${struct.p1_count} P1 contact${struct.p1_count !== 1 ? "s" : ""} identified via Apollo` : "Decision maker research in progress",
          leaseSignal?.claim ? `Signal: ${leaseSignal.claim.slice(0, 100)}` : "Multiple intent indicators detected",
          `Source: ${leaseSignal?.source_title || "Perplexity research"}${leaseSignal?.published_date ? ` · ${leaseSignal.published_date}` : ""}`,
        ],
        intent_score: lead.outreach_readiness,
        _lead_id: lead.id,
        _structured: struct,
      };
    }

    function leadToFundedItem(lead: EnrichedLead) {
      const fundSignal = lead.signals.find((s) => s.signal_type === "funding_round" || s.signal_type === "funding");
      const struct = buildStructuredData(lead);
      return {
        startup_name: lead.company,
        funding: fundSignal?.claim?.match(/₹?[$€£]?[\d,]+\s*(Cr|M|B|million|billion)?/i)?.[0] || "Recently funded",
        city: lead.city || city,
        team_size: String(lead.headcount || "—"),
        use_case: fundSignal?.why_it_matters || `${lead.company} expanding team in ${city}.`,
        why_qualifies: `${lead.company} has funding signal with ${fundSignal?.verification_status || "verified"} status. ${lead.outreach_readiness >= 70 ? "Outreach-ready slate." : "Enrichment in progress."}`,
        talking_points: [
          `Outreach readiness: ${lead.outreach_readiness}/100`,
          struct.p1_count > 0 ? `${struct.p1_count} P1 decision maker${struct.p1_count !== 1 ? "s" : ""} enriched` : "Contact slate building",
          fundSignal?.claim ? `Funding signal: ${fundSignal.claim.slice(0, 100)}` : "Growth indicators detected",
          `Source: ${fundSignal?.source_title || "verified research"}`,
        ],
        intent_score: lead.outreach_readiness,
        _lead_id: lead.id,
        _structured: struct,
      };
    }

    function leadToHighIntentItem(lead: EnrichedLead) {
      const topSig = lead.signals[0];
      const struct = buildStructuredData(lead);
      return {
        company_name: lead.company,
        subtitle: `${lead.city || city} · ${lead.headcount || "—"} people · ${lead.signals.length} signal${lead.signals.length !== 1 ? "s" : ""}`,
        intent_score: lead.outreach_readiness,
        remarks: lead.perplexity_summary || `${lead.job_title ? `${lead.job_title} at ` : ""}${lead.company}`,
        why_qualifies: topSig?.why_it_matters || `${lead.company} showing strong intent signals in ${city}.`,
        talking_points: [
          `Readiness ${lead.outreach_readiness} · V${lead.verification_score} · I${lead.intent_score} · C${lead.contactability_score}`,
          struct.p1_count > 0 ? `${struct.p1_count} P1 contact${struct.p1_count !== 1 ? "s" : ""} · ${struct.linkedin_count} LinkedIn` : "Enrich for contacts",
          topSig?.claim ? `${topSig.claim.slice(0, 100)}` : "High intent activity",
          `Status: ${lead.enrichment_status?.replace(/_/g, " ") || "enriched"}`,
        ],
        _lead_id: lead.id,
        _structured: struct,
      };
    }

    // ── 10. Persist brief ───────────────────────────────────────────────
    const { data: brief, error: briefErr } = await supabase
      .from("daily_briefs")
      .upsert({
        user_id,
        city,
        brief_date: briefDate,
        headline,
        expiring_leases: expiringLeases.map(leadToLeaseItem),
        funded_startups: fundedStartups.map(leadToFundedItem),
        micro_market_watch: microMarketWatch,
        competitor_alerts: competitorAlerts.slice(0, 4),
        bd_tips: bdTips,
        city_actionables: [],
        top_signals: topSignals.map((s) => ({
          signal: s.claim || "",
          type: s.signal_type || "strategic",
          priority: s.verification_status === "verified" ? "high" : "medium",
        })),
        suggested_actions: [],
        competitor_movement: [],
        lead_references: leadReferences,
        enriched_at: new Date().toISOString(),
        generated_by: "enrichment_pipeline",
        status: "draft",
      }, { onConflict: "user_id,city,brief_date" })
      .select()
      .single();

    if (briefErr) throw briefErr;

    return new Response(
      JSON.stringify({
        success: true,
        brief_id: brief.id,
        stats: {
          total_leads: enrichedLeads.length,
          expiring_leases: expiringLeases.length,
          funded_startups: fundedStartups.length,
          high_intent: highIntent.length,
          verified_signals: allSignals.filter((s) => s.verification_status === "verified").length,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-daily-brief error", e);
    const msg =
      e instanceof Error
        ? e.message
        : (e && typeof e === "object" && "message" in e)
          ? String((e as any).message)
          : JSON.stringify(e);
    return new Response(
      JSON.stringify({ error: msg || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
