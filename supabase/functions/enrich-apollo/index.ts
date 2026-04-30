import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { personaRank, evaluateSlate, recomputeLeadScores } from "../_shared/scoring.ts";
import { checkEnrichmentRateLimit } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APOLLO_API_KEY = Deno.env.get("APOLLO_API_KEY");

function rankSeniority(person: any): { rank: number; seniority: string } {
  const seniorityWeights: Record<string, number> = {
    owner: 100, founder: 100, c_suite: 90, partner: 85,
    vp: 70, head: 65, director: 55, manager: 30, entry: 10,
  };
  const sen = (person.seniority || "").toLowerCase();
  let base = seniorityWeights[sen] ?? 20;
  const title = (person.title || "").toLowerCase();
  if (/admin|operations|workplace|real\s?estate|facilit|office|people|hr/i.test(title)) base += 20;
  const depts = (person.departments || []).join(" ").toLowerCase();
  if (/operations|admin|people|hr/.test(depts)) base += 10;
  return { rank: base, seniority: sen || "other" };
}

const TARGET_OPS_TITLES = [
  "VP Operations", "Vice President Operations",
  "Director of Operations", "Director Operations",
  "Operations Manager", "Head of Operations",
  "Head of Facilities", "Facilities Manager",
  "Real Estate Manager", "Head of Real Estate",
  "Workplace Experience", "Head of Workplace",
  "Admin Head", "Head of Admin",
];
const TARGET_LEADERSHIP_TITLES = [
  "Founder", "Co-Founder", "Cofounder",
  "CEO", "Chief Executive Officer",
  "City Head", "Country Head", "India Head",
];
const NEGATIVE_TITLES = [
  "Engineer", "Engineering", "Software", "Developer", "Technical",
  "CTO", "Architect", "Marketing", "Growth", "Brand",
  "Product", "Designer", "Data Scientist",
];

// Map any Indian metro / micro-market the user might enter to the canonical
// city key used in CITY_REGION_MAP.
const CITY_ALIASES: Record<string, string> = {
  // Bangalore
  "bangalore": "bangalore", "bengaluru": "bangalore",
  "koramangala": "bangalore", "indiranagar": "bangalore", "whitefield": "bangalore",
  "hsr layout": "bangalore", "hsr": "bangalore", "marathahalli": "bangalore",
  "electronic city": "bangalore", "jp nagar": "bangalore", "btm": "bangalore",
  "mg road": "bangalore", "outer ring road": "bangalore", "orr": "bangalore",
  // Mumbai
  "mumbai": "mumbai", "bombay": "mumbai", "navi mumbai": "mumbai", "thane": "mumbai",
  "bkc": "mumbai", "bandra": "mumbai", "andheri": "mumbai", "powai": "mumbai",
  "lower parel": "mumbai", "worli": "mumbai", "goregaon": "mumbai",
  // Pune
  "pune": "pune", "hinjewadi": "pune", "kharadi": "pune", "viman nagar": "pune",
  "baner": "pune", "magarpatta": "pune",
  // Delhi NCR
  "delhi": "delhi_ncr", "new delhi": "delhi_ncr", "ncr": "delhi_ncr",
  "gurgaon": "delhi_ncr", "gurugram": "delhi_ncr", "noida": "delhi_ncr",
  "greater noida": "delhi_ncr", "faridabad": "delhi_ncr", "ghaziabad": "delhi_ncr",
  "cyber city": "delhi_ncr", "cyber hub": "delhi_ncr", "udyog vihar": "delhi_ncr",
  "connaught place": "delhi_ncr", "saket": "delhi_ncr", "nehru place": "delhi_ncr",
  // Hyderabad
  "hyderabad": "hyderabad", "secunderabad": "hyderabad",
  "hitec city": "hyderabad", "hitech city": "hyderabad", "gachibowli": "hyderabad",
  "madhapur": "hyderabad", "kondapur": "hyderabad", "banjara hills": "hyderabad",
  // Chennai
  "chennai": "chennai", "madras": "chennai", "omr": "chennai",
  "guindy": "chennai", "tidel park": "chennai", "perungudi": "chennai",
  // Kolkata
  "kolkata": "kolkata", "calcutta": "kolkata", "salt lake": "kolkata", "rajarhat": "kolkata",
  // Ahmedabad
  "ahmedabad": "ahmedabad", "gandhinagar": "ahmedabad", "gift city": "ahmedabad",
  // Kochi
  "kochi": "kochi", "cochin": "kochi", "ernakulam": "kochi", "infopark": "kochi",
  // Jaipur
  "jaipur": "jaipur",
  // Chandigarh
  "chandigarh": "chandigarh", "mohali": "chandigarh", "panchkula": "chandigarh",
};

const CITY_REGION_MAP: Record<string, { display: string; locations: string[] }> = {
  bangalore:  { display: "Bangalore", locations: ["Bengaluru, India", "Bangalore, India", "Karnataka, India"] },
  mumbai:     { display: "Mumbai",    locations: ["Mumbai, India", "Navi Mumbai, India", "Thane, India", "Maharashtra, India"] },
  pune:       { display: "Pune",      locations: ["Pune, India", "Maharashtra, India"] },
  delhi_ncr:  { display: "Delhi NCR", locations: ["New Delhi, India", "Delhi, India", "Gurugram, India", "Gurgaon, India", "Noida, India", "Greater Noida, India", "Faridabad, India", "Ghaziabad, India", "Haryana, India", "Uttar Pradesh, India"] },
  hyderabad:  { display: "Hyderabad", locations: ["Hyderabad, India", "Secunderabad, India", "Telangana, India"] },
  chennai:    { display: "Chennai",   locations: ["Chennai, India", "Tamil Nadu, India"] },
  kolkata:    { display: "Kolkata",   locations: ["Kolkata, India", "West Bengal, India"] },
  ahmedabad:  { display: "Ahmedabad", locations: ["Ahmedabad, India", "Gandhinagar, India", "Gujarat, India"] },
  kochi:      { display: "Kochi",     locations: ["Kochi, India", "Ernakulam, India", "Kerala, India"] },
  jaipur:     { display: "Jaipur",    locations: ["Jaipur, India", "Rajasthan, India"] },
  chandigarh: { display: "Chandigarh",locations: ["Chandigarh, India", "Mohali, India", "Panchkula, India", "Punjab, India", "Haryana, India"] },
};

function resolveCityKey(raw?: string | null): string | null {
  if (!raw) return null;
  const norm = raw.trim().toLowerCase();
  if (!norm) return null;
  if (CITY_ALIASES[norm]) return CITY_ALIASES[norm];
  // Try matching any alias as a substring (handles "Koramangala, Bangalore" etc.)
  for (const alias of Object.keys(CITY_ALIASES)) {
    if (norm.includes(alias)) return CITY_ALIASES[alias];
  }
  return null;
}

function resolveRegion(lead: any): { display: string; locations: string[] } {
  const key =
    resolveCityKey(lead?.city) ||
    resolveCityKey(lead?.location);
  if (key && CITY_REGION_MAP[key]) return CITY_REGION_MAP[key];
  // Unknown city → don't false-lock to any metro. Use a city-agnostic India filter.
  const display = (lead?.city || lead?.location || "India").toString().trim() || "India";
  return { display, locations: ["India"] };
}

function buildLocationFilters(lead: any): string[] {
  return resolveRegion(lead).locations;
}

function readApolloCredits(res: Response): number | null {
  // Apollo returns various credit-related headers; prefer dedicated credits ones.
  const candidates = [
    "x-credits-remaining",
    "x-rate-limit-remaining",
    "x-24-hour-credits-remaining",
    "x-rate-limit-minute-remaining",
  ];
  for (const h of candidates) {
    const v = res.headers.get(h);
    if (v && !Number.isNaN(parseInt(v))) return parseInt(v);
  }
  return null;
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
    if (!APOLLO_API_KEY) throw new Error("APOLLO_API_KEY not configured");

    const rateLimit = checkEnrichmentRateLimit(user.id);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded. Try again in a minute." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429,
      });
    }

    const { lead_id, hint } = await req.json();
    if (!lead_id) throw new Error("lead_id required");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lead_id)) throw new Error("lead_id must be a valid UUID");
    const dmHint = (hint && typeof hint === "object") ? hint : {};
    const hintLinkedIn: string | null = dmHint.linkedin_url || null;
    const hintName: string | null = dmHint.name || null;
    const hintTitle: string | null = dmHint.title || null;
    console.log("[apollo] start", { lead_id, hintLinkedIn: !!hintLinkedIn, hintName });

    const { data: lead, error: leadErr } = await supabase
      .from("leads").select("*").eq("id", lead_id).eq("user_id", user.id).single();
    if (leadErr || !lead) throw new Error("Lead not found");

    const startedAt = Date.now();
    let jobStatus = "success";
    let jobError: string | null = null;
    let upserts = 0;
    let creditsRemaining: number | null = null;
    let creditsBefore: number | null = null;
    let creditsUsed: number | null = null;
    let reason: string | null = null;
    let path: string = "title_search";
    let response: any = {};

    try {
      // Step 0: if Perplexity gave us a LinkedIn URL, hydrate that person directly
      let hintPerson: any = null;
      if (hintLinkedIn) {
        const r = await fetch("https://api.apollo.io/api/v1/people/match", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Api-Key": APOLLO_API_KEY },
          body: JSON.stringify({
            linkedin_url: hintLinkedIn,
            organization_name: lead.company || undefined,
            reveal_personal_emails: true,
          }),
        });
        const after = readApolloCredits(r);
        if (after !== null) { if (creditsBefore === null) creditsBefore = after; creditsRemaining = after; }
        const d = await r.json();
        hintPerson = d?.person || null;
        if (hintPerson) {
          path = "linkedin_match";
          console.log("[apollo] linkedin_match hit:", hintPerson.name);
        } else {
          console.log("[apollo] linkedin_match miss for", hintLinkedIn);
        }
      }

      // Step 1: people/match for the primary contact (only useful with an email)
      let matchResp: any = null;
      if (lead.email) {
        const matchRes = await fetch("https://api.apollo.io/api/v1/people/match", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Api-Key": APOLLO_API_KEY },
          body: JSON.stringify({
            email: lead.email,
            organization_name: lead.company || undefined,
            reveal_personal_emails: true,
          }),
        });
        matchResp = await matchRes.json();
        const after = readApolloCredits(matchRes);
        if (after !== null) {
          if (creditsBefore === null) creditsBefore = after;
          creditsRemaining = after;
        }
      }

      let orgId: string | null = matchResp?.person?.organization_id || matchResp?.person?.organization?.id || null;
      let org: any = matchResp?.person?.organization || null;

      // Step 1b: resolve organization by name/domain if we don't have one yet
      // Clean common suffixes/version markers added by demo seeders ("HealthKart 2.0", "Acme - Bangalore", etc.)
      const rawCompany = (lead.company || "").trim();
      const cleanCompany = rawCompany
        .replace(/\s+\d+(\.\d+)?\s*$/, "") // trailing "2.0", "3", etc.
        .replace(/\s+[-–—]\s+.+$/, "")     // " - Bangalore"
        .replace(/\s+\(.+\)\s*$/, "")      // " (Demo)"
        .trim();
      let orgSearchTried: string[] = [];
      if (!orgId && (lead.company_domain || lead.website || cleanCompany)) {
        const domain = lead.company_domain
          || (lead.website ? lead.website.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] : null);

        async function searchOrg(body: Record<string, any>) {
          orgSearchTried.push(JSON.stringify(body));
          const r = await fetch("https://api.apollo.io/api/v1/mixed_companies/search", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Api-Key": APOLLO_API_KEY },
            body: JSON.stringify({ ...body, page: 1, per_page: 5 }),
          });
          const after = readApolloCredits(r);
          if (after !== null) {
            if (creditsBefore === null) creditsBefore = after;
            creditsRemaining = after;
          }
          const d = await r.json();
          return d?.organizations?.[0] || d?.accounts?.[0] || null;
        }

        let firstOrg: any = null;
        if (domain) firstOrg = await searchOrg({ organization_domains: [domain] });
        if (!firstOrg && cleanCompany) firstOrg = await searchOrg({ q_organization_name: cleanCompany });
        // Last resort: first word of company (handles "HealthKart 2.0" → "HealthKart")
        if (!firstOrg && cleanCompany.includes(" ")) {
          firstOrg = await searchOrg({ q_organization_name: cleanCompany.split(" ")[0] });
        }
        if (firstOrg) {
          orgId = firstOrg.id;
          org = firstOrg;
        }
      }

      // Update lead from match
      const leadUpdates: any = { enriched_at: new Date().toISOString(), last_enriched_provider: "apollo" };
      const primaryPerson = matchResp?.person || hintPerson;
      if (primaryPerson?.phone_numbers?.[0]?.sanitized_number) leadUpdates.phone = primaryPerson.phone_numbers[0].sanitized_number;
      if (primaryPerson?.linkedin_url) leadUpdates.linkedin_url = primaryPerson.linkedin_url;
      if (primaryPerson?.title) leadUpdates.job_title = primaryPerson.title;
      if (org?.estimated_num_employees) leadUpdates.company_size = String(org.estimated_num_employees);
      if (org?.primary_domain) leadUpdates.company_domain = org.primary_domain;
      if (org?.website_url) leadUpdates.website = org.website_url;
      if (orgId) leadUpdates.apollo_org_id = orgId;
      await supabase.from("leads").update(leadUpdates).eq("id", lead_id);

      // Step 2: geo+persona-locked people search (two passes)
      const region = resolveRegion(lead);
      const personLocations = region.locations;
      let passACount = 0;
      let passBCount = 0;
      let nameSearchCount = 0;
      let people: any[] = [];
      if (orgId) {
        async function peopleSearch(body: Record<string, any>) {
          const r = await fetch("https://api.apollo.io/api/v1/mixed_people/search", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Api-Key": APOLLO_API_KEY },
            body: JSON.stringify(body),
          });
          const after = readApolloCredits(r);
          if (after !== null) {
            if (creditsBefore === null) creditsBefore = after;
            creditsRemaining = after;
          }
          const d = await r.json();
          return d?.people || [];
        }
        // Pass N — name-based search if Perplexity gave us a name (no URL)
        if (!hintPerson && hintName) {
          const passN = await peopleSearch({
            organization_ids: [orgId],
            q_keywords: hintName,
            person_locations: personLocations,
            page: 1,
            per_page: 10,
          });
          nameSearchCount = passN.length;
          if (passN.length > 0) {
            path = "name_search";
            console.log("[apollo] name_search hit:", passN.length, "for", hintName);
          }
          people.push(...passN);
        }
        // Pass A — Ops / Facilities / Real Estate / Workplace
        const passA = await peopleSearch({
          organization_ids: [orgId],
          person_titles: TARGET_OPS_TITLES,
          person_not_titles: NEGATIVE_TITLES,
          person_locations: personLocations,
          page: 1,
          per_page: 25,
        });
        passACount = passA.length;
        // Pass B — Leadership / Founders / City heads
        const passB = await peopleSearch({
          organization_ids: [orgId],
          person_titles: TARGET_LEADERSHIP_TITLES,
          person_not_titles: NEGATIVE_TITLES,
          person_locations: personLocations,
          page: 1,
          per_page: 10,
        });
        passBCount = passB.length;
        people = [...people, ...passA, ...passB];
      }

      // Include the matched person only if it actually has identity data
      const mp = matchResp?.person || hintPerson;
      if (mp && (mp.linkedin_url || mp.name || mp.first_name)) {
        people.unshift(mp);
      }

      // Rank and dedupe
      const ranked = people
        .map((p: any) => ({ p, ...rankSeniority(p) }))
        .sort((a, b) => b.rank - a.rank);
      const seen = new Set<string>();
      const top: any[] = [];
      for (const item of ranked) {
        const key = item.p.linkedin_url || item.p.id;
        if (!key || seen.has(key)) continue;
        seen.add(key);
        top.push(item);
        if (top.length >= 5) break;
      }

      for (let i = 0; i < top.length; i++) {
        const { p, seniority } = top[i];
        const fullName = p.name || `${p.first_name || ""} ${p.last_name || ""}`.trim();
        if (!fullName && !p.linkedin_url && !p.email) continue; // skip empty stubs
        // Skip if a contact with this linkedin_url already exists for this lead
        if (p.linkedin_url) {
          const { data: existing } = await supabase
            .from("lead_contacts")
            .select("id")
            .eq("lead_id", lead_id)
            .eq("linkedin_url", p.linkedin_url)
            .maybeSingle();
          if (existing) continue;
        }
        const pr = personaRank(p.title);
        const { error: insErr } = await supabase.from("lead_contacts").insert({
          lead_id,
          full_name: fullName || "(unknown)",
          title: p.title,
          seniority,
          priority_rank: pr,
          linkedin_url: p.linkedin_url,
          email: p.email,
          email_status: p.email_status,
          phone: p.phone_numbers?.[0]?.sanitized_number,
          photo_url: p.photo_url,
          city: p.city, state: p.state, country: p.country,
          departments: p.departments || [],
          apollo_person_id: p.id,
          enriched_at: new Date().toISOString(),
        });
        if (insErr) console.error("[apollo] insert contact error:", insErr.message);
        else upserts++;
      }

      // Slate gate — evaluate the *full* contact set (existing + just inserted).
      const { data: allContacts } = await supabase
        .from("lead_contacts")
        .select("priority_rank, linkedin_url, email, email_status, phone")
        .eq("lead_id", lead_id);
      const slate = evaluateSlate(allContacts || []);
      console.log("[apollo] slate", slate);

      if (upserts === 0 && (allContacts?.length ?? 0) === 0) {
        reason = orgId ? "no_local_match" : "no_org_resolved";
        path = "no_match";
        const note = orgId
          ? (hintName
              ? `No Apollo match for "${hintName}" in ${region.display} — flagged for manual research.`
              : `No ${region.display}-based Ops / Facilities / Leadership profile found in Apollo.`)
          : `Apollo could not resolve "${lead.company}" to a company. Add a website or domain and retry.`;
        await supabase
          .from("leads")
          .update({ enrichment_status: "needs_manual_research", enrichment_note: note })
          .eq("id", lead_id);
      } else {
        // Slate-gate-driven status. recomputeLeadScores will refine V/I/C below.
        const note =
          slate.status === "outreach_ready"
            ? null
            : `Slate ${slate.total} contacts · P1 ${slate.hasP1 ? "yes" : "no"} · LinkedIn ${slate.withLinkedIn}`;
        await supabase
          .from("leads")
          .update({ enrichment_status: slate.status, enrichment_note: note })
          .eq("id", lead_id);
      }

      // Funding/headcount intent signals
      if (org?.estimated_num_employees) {
        await supabase.from("intent_signals").insert({
          lead_id, signal_type: "headcount_growth",
          signal_value: `Apollo: ${org.estimated_num_employees} employees`,
          source_api: "apollo", score_contribution: 10,
        });
      }

      // Compute credits used. Apollo headers report "remaining" — if we never
      // got a header, fall back to a conservative 1 per paid endpoint we hit.
      if (creditsBefore !== null && creditsRemaining !== null) {
        creditsUsed = Math.max(0, creditsBefore - creditsRemaining);
      }

      response = {
        match: matchResp,
        hint: { linkedin_url: hintLinkedIn, name: hintName, title: hintTitle, hit: !!hintPerson },
        path,
        org_resolved: org ? { id: orgId, name: org.name, primary_domain: org.primary_domain } : null,
        org_search_tried: orgSearchTried,
        cleaned_company_name: cleanCompany,
        contacts_upserted: upserts,
        slate,
        leadership: top.length,
        pass_a_count: passACount,
        pass_b_count: passBCount,
        name_search_count: nameSearchCount,
        reason,
        credits_used: creditsUsed,
        credits_remaining: creditsRemaining,
      };
      console.log("[apollo] done", { path, upserts, credits_used: creditsUsed });

      // Recompute V/I/C/readiness now that contacts have changed.
      await recomputeLeadScores(supabase, lead_id);
    } catch (err: any) {
      jobStatus = "failed";
      jobError = err.message;
      console.error("[apollo] failed:", err.message);
    }

    await supabase.from("enrichment_jobs").insert({
      user_id: user.id, lead_id, provider: "apollo",
      status: jobStatus, request: { lead_id }, response, error: jobError,
      latency_ms: Date.now() - startedAt, completed_at: new Date().toISOString(),
    });

    await supabase.rpc("bump_integration_status", {
      _user_id: user.id, _provider: "apollo",
      _success: jobStatus === "success", _error: jobError,
      _credits_remaining: creditsRemaining, _leads_ingested: upserts,
    });

    return new Response(JSON.stringify({ success: jobStatus === "success", ...response, error: jobError }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: jobStatus === "success" ? 200 : 500,
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
    });
  }
});