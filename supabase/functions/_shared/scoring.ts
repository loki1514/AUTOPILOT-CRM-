// Shared scoring + persona logic for the enrichment pipeline.
// Used by research-perplexity, enrich-apollo, and enrich-lead-pipeline.

export const P1_TITLES = [
  "head of administration", "facilities manager", "workplace manager",
  "corporate services", "real estate manager", "head of facilities",
  "head of workplace", "head of real estate", "admin head", "head of admin",
];
export const P2_TITLES = [
  "head of operations", "procurement manager", "people operations",
  "hrbp", "office manager", "operations manager", "director of operations",
  "vp operations", "vice president operations",
];
export const P3_TITLES = [
  "coo", "ceo", "co-founder", "cofounder", "founder",
  "chief of staff", "chief executive officer", "city head",
  "country head", "india head",
];

export function personaRank(title?: string | null): 1 | 2 | 3 | 99 {
  if (!title) return 99;
  const t = title.toLowerCase();
  if (P1_TITLES.some((p) => t.includes(p))) return 1;
  if (P2_TITLES.some((p) => t.includes(p))) return 2;
  if (P3_TITLES.some((p) => t.includes(p))) return 3;
  return 99;
}

// ---- Signal scoring ----------------------------------------------------

export type VerificationStatus =
  | "verified" | "partially_verified" | "unverified" | "conflicting";

export interface SignalLike {
  signal_type?: string | null;
  type?: string | null;
  verification_status?: VerificationStatus | null;
  source_url?: string | null;
  published_date?: string | null;
  event_date?: string | null;
  why_it_matters?: string | null;
  claim?: string | null;
}

function daysSince(iso?: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 86400000));
}

function recencyMultiplier(days: number | null): number {
  if (days === null) return 0.8;
  if (days <= 7) return 1.3;
  if (days <= 30) return 1.0;
  if (days <= 90) return 0.8;
  return 0.5;
}

export function computeSignalScore(s: SignalLike): number {
  if (!s.source_url) return 0;
  const v = s.verification_status || "unverified";
  if (v === "unverified") return 0;
  const verified = v === "verified";
  const partial = v === "partially_verified";
  const t = (s.signal_type || s.type || "").toLowerCase();
  const why = (s.why_it_matters || s.claim || "").toLowerCase();

  let base = 0;
  if (t.includes("funding")) base = verified ? 30 : partial ? 15 : 0;
  else if (t.includes("office_expansion") || t.includes("office expansion"))
    base = verified ? 30 : partial ? 18 : 0;
  else if (t.includes("lease")) base = verified ? 25 : partial ? 12 : 0;
  else if (t.includes("relocation")) base = verified ? 20 : partial ? 10 : 0;
  else if (t.includes("hiring")) {
    const isWorkplace = /workplace|facilit|admin|office|real\s?estate/.test(why);
    base = isWorkplace ? (verified ? 25 : 15) : (verified ? 10 : 5);
  } else if (t.includes("leadership")) base = verified ? 10 : 5;
  else base = verified ? 8 : 4;

  const days = daysSince(s.published_date || s.event_date);
  return Math.round(base * recencyMultiplier(days));
}

// ---- Lead-level aggregate scores ---------------------------------------

export interface ContactLike {
  priority_rank?: number | null;
  linkedin_url?: string | null;
  email?: string | null;
  email_status?: string | null;
  phone?: string | null;
}

export function computeIntentScore(signals: SignalLike[]): number {
  const verifiedCount = signals.filter(
    (s) => s.source_url && (s.verification_status === "verified" || s.verification_status === "partially_verified"),
  ).length;
  const raw = signals.reduce((acc, s) => acc + computeSignalScore(s), 0);
  // Hard cap: fewer than 2 verified signals → max 40
  const capped = verifiedCount < 2 ? Math.min(raw, 40) : raw;
  return Math.max(0, Math.min(100, capped));
}

const SOURCE_WEIGHTS: Record<string, number> = {
  company_filing: 1.0,
  tier1_news: 0.9,
  company_website: 0.8,
  job_page: 0.75,
  linkedin_post: 0.6,
  secondary_news: 0.5,
  directory: 0.4,
};

export function computeVerificationScore(signals: SignalLike[]): number {
  if (!signals.length) return 0;
  let score = 0;
  let conflicting = 0;
  for (const s of signals) {
    if (!s.source_url) continue;
    if (s.verification_status === "conflicting") { conflicting++; continue; }
    const w = SOURCE_WEIGHTS[(s as any).source_type] ?? 0.5;
    const days = daysSince(s.published_date || s.event_date);
    const recency = recencyMultiplier(days);
    if (s.verification_status === "verified") score += 22 * w * recency;
    else if (s.verification_status === "partially_verified") score += 12 * w * recency;
  }
  score -= conflicting * 8;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function computeContactabilityScore(contacts: ContactLike[]): number {
  if (!contacts.length) return 0;
  const hasP1 = contacts.some((c) => c.priority_rank === 1);
  const withLinkedIn = contacts.filter((c) => !!c.linkedin_url).length;
  const withEmail = contacts.filter(
    (c) => !!c.email && (c.email_status === "verified" || c.email_status === "guessed" || !c.email_status),
  ).length;
  const withPhone = contacts.filter((c) => !!c.phone).length;
  let score =
    Math.min(contacts.length, 5) * 8 +     // up to 40 for 5 contacts
    withLinkedIn * 6 +                     // up to ~30
    withEmail * 8 +                        // up to ~40
    withPhone * 4;                         // up to ~20
  if (hasP1) score = Math.round(score * 1.5);
  return Math.max(0, Math.min(100, score));
}

export function computeReadiness(v: number, i: number, c: number): number {
  return Math.round(v * 0.4 + i * 0.3 + c * 0.3);
}

export interface SlateResult {
  status: "outreach_ready" | "contacts_insufficient" | "needs_manual_research";
  hasP1: boolean;
  withLinkedIn: number;
  total: number;
}

export function evaluateSlate(contacts: ContactLike[]): SlateResult {
  const total = contacts.length;
  if (total === 0) return { status: "needs_manual_research", hasP1: false, withLinkedIn: 0, total: 0 };
  const hasP1 = contacts.some((c) => c.priority_rank === 1);
  const withLinkedIn = contacts.filter((c) => !!c.linkedin_url).length;
  if (total >= 3 && hasP1 && withLinkedIn >= 2) {
    return { status: "outreach_ready", hasP1, withLinkedIn, total };
  }
  return { status: "contacts_insufficient", hasP1, withLinkedIn, total };
}

// ---- One-shot recompute -----------------------------------------------

export async function recomputeLeadScores(supabase: any, leadId: string) {
  const [{ data: signals }, { data: contacts }, { data: lead }] = await Promise.all([
    supabase.from("intent_signals").select(
      "signal_type, source_url, source_type, verification_status, published_date, event_date, why_it_matters, claim",
    ).eq("lead_id", leadId),
    supabase.from("lead_contacts").select(
      "priority_rank, linkedin_url, email, email_status, phone",
    ).eq("lead_id", leadId),
    supabase.from("leads").select("enrichment_status").eq("id", leadId).single(),
  ]);

  const sigs = (signals as SignalLike[]) || [];
  const cons = (contacts as ContactLike[]) || [];

  const intent = computeIntentScore(sigs);
  const verification = computeVerificationScore(sigs);
  const contactability = computeContactabilityScore(cons);
  const readiness = computeReadiness(verification, intent, contactability);

  // Status precedence: zero contacts → manual; else gate on V+C; else readiness band.
  let status: string;
  if (cons.length === 0) status = "needs_manual_research";
  else if (verification >= 70 && contactability >= 60) status = "outreach_ready";
  else if (verification >= 40) status = "manual_review";
  else status = "archived";

  // Don't downgrade an explicit needs_manual_research set by Apollo's no_match path.
  if (lead?.enrichment_status === "needs_manual_research" && cons.length === 0) {
    status = "needs_manual_research";
  }

  await supabase.from("leads").update({
    intent_score: intent,
    verification_score: verification,
    contactability_score: contactability,
    outreach_readiness: readiness,
    enrichment_status: status,
  }).eq("id", leadId);

  return { intent, verification, contactability, readiness, status };
}