
# Fix what's broken — evidence-backed signals, contact slate, readiness gate

You uploaded a 1287-line master plan. Most of it is a full UI redesign + a wishlist. I'm not going to ship all of it in one pass. This plan covers **only the items that fix something currently broken or weak**, drops Hunter.io entirely (your call), and defers the cosmetic redesign to a separate pass.

## What's already correct (no changes needed)

I checked the code first. These items from your master plan are **already done** in the current codebase, so I will not touch them:

- ✅ Perplexity endpoint + model — already on `https://api.perplexity.ai/chat/completions` with `sonar-pro` (your previous "replace OpenRouter with direct Perplexity" pass landed).
- ✅ Perplexity prompt asks for `decision_maker_name`, `_title`, `_linkedin_url`, `_confidence`.
- ✅ `leads.dm_name / dm_title / dm_linkedin_url / dm_confidence` columns exist.
- ✅ Apollo accepts a `hint`, runs `linkedin_match → name_search → title_search` cascade, returns `path` + `reason: "no_match"`, and the toast already shows both providers + credits + path.
- ✅ Pipeline runs Perplexity first, then Apollo with the hint, returns structured per-provider summary.

So the master-plan items B1, B2, B4 and the basic Apollo cascade are **shipped**. What's still broken or missing is the *quality* layer: signals are still inferred without evidence, "one contact found" still counts as success, and there is no readiness gate.

## What's still broken — and what we'll fix

### 1. Perplexity invents signals with no source URL (master plan B5)

The current prompt asks for arrays of strings (`recent_news`, `office_expansion_signals`, `lease_signals`) with no source URL, no date, no verification status. These get written straight into `intent_signals` and contribute to score. That's how reps end up calling on hallucinated lease-expiry dates.

**Fix:** rewrite the Perplexity user prompt to demand the evidence-backed object schema from your master plan:

```text
{
  "type": "funding | hiring | office_expansion | lease | relocation | leadership_change",
  "claim": "...",
  "city": "...",
  "event_date": "YYYY-MM-DD or null",
  "source_url": "REQUIRED — omit signal if missing",
  "source_type": "company_filing | tier1_news | secondary_news | linkedin_post | job_page | directory | company_website",
  "source_title": "...",
  "published_date": "YYYY-MM-DD or null",
  "confidence": 0-100,
  "verification_status": "verified | partially_verified | unverified",
  "why_it_matters": "..."
}
```

Plus a `disqualified_claims` array for things the model considered but rejected. The system message gets the hard rules: never invent dates, never include a signal with no `source_url`, India calibration (LinkedIn post from a verified senior leader = `partially_verified`).

The edge function then **drops any signal where `source_url` is empty** before writing to `intent_signals`, and writes the rejected ones to a new `lead.disqualified_claims jsonb` field for the UI to surface ("here's what we *didn't* trust").

### 2. `intent_signals` table can't store the evidence

Right now the table has `signal_type, signal_value, source_api, score_contribution`. No URL, no date, no verification status, no claim text separate from the source. We'll add the columns the new schema needs:

```sql
alter table public.intent_signals
  add column if not exists claim text,
  add column if not exists source_url text,
  add column if not exists source_type text,
  add column if not exists source_title text,
  add column if not exists event_date date,
  add column if not exists published_date date,
  add column if not exists confidence integer,
  add column if not exists verification_status text,    -- 'verified' | 'partially_verified' | 'unverified' | 'conflicting'
  add column if not exists why_it_matters text;

alter table public.leads
  add column if not exists disqualified_claims jsonb default '[]'::jsonb,
  add column if not exists verification_score integer default 0,
  add column if not exists contactability_score integer default 0,
  add column if not exists outreach_readiness integer default 0;
```

Existing rows stay valid (all new columns nullable / defaulted).

### 3. Score recency + verification rules (master plan §05)

Move score-contribution math out of "+5 for any news" into a real function. New edge helper inside `research-perplexity` and `enrich-apollo` (or a small shared module) that computes `score_contribution` per signal using your master-plan table:

- funding verified +30 / partially +15
- hiring workplace/facilities role +25 / general +10
- office_expansion verified +30 / partially +18
- lease verified +25, relocation +20, leadership_change +10
- recency multiplier ×1.3 / ×1.0 / ×0.8 / ×0.5 by 7d / 30d / 90d / older
- if fewer than 2 verified signals → cap `intent_score` at 40

### 4. Apollo "one contact = success" (master plan §04)

Today Apollo's three-path cascade stops the moment any person row is upserted, even if it's a CEO with no email. We change the success condition to a **slate gate**:

- Loop continues (run another path) until either:
  - **SUCCESS:** ≥3 contacts AND ≥1 P1 persona AND ≥2 with a LinkedIn URL → `enrichment_status = 'outreach_ready'`
  - **PARTIAL:** 1–2 contacts OR no P1 → `enrichment_status = 'contacts_insufficient'`
  - **HOLD:** zero contacts after all paths → `enrichment_status = 'needs_manual_research'` (already in use)

P1/P2/P3 persona buckets defined as a const map in `enrich-apollo/index.ts`:

```ts
const P1 = ["head of administration","facilities manager","workplace manager","corporate services","real estate manager"];
const P2 = ["head of operations","procurement manager","people operations","hrbp","office manager"];
const P3 = ["coo","ceo","co-founder","chief of staff"];
```

Each upserted contact gets a `priority_rank` (1/2/3) — `lead_contacts.priority_rank` already exists, currently defaults to 99.

**Hunter.io is intentionally not in this plan** per your instruction. The `noMatch()` branch stays; we just don't add a Hunter call.

### 5. Three-score model + readiness gate (master plan §06)

After both Perplexity and Apollo run, the pipeline computes:

- **V** verification_score = function of (# verified signals, source-type weighting, recency, conflicting-signals penalty)
- **I** intent_score = sum of `score_contribution` (capped at 40 if <2 verified)
- **C** contactability_score = function of (contact count, P1 presence ×1.5, verified email, LinkedIn, phone)
- **outreach_readiness** = round(V·0.4 + I·0.3 + C·0.3)

Gate logic written to `enrichment_status`:

- V ≥ 70 AND C ≥ 60 → `outreach_ready`
- V 40–69 → `manual_review`
- V < 40 → `archived`
- 0 contacts → `needs_manual_research` (overrides above)

All four scores stored on `leads`, computed in a new helper `recompute_lead_scores(lead_id)` invoked at the end of `enrich-lead-pipeline`.

### 6. Surface the new state in the UI (minimum viable)

Not the full redesign from §07 of your master plan — just the parts that expose the new data so reps can see *why* a lead is or isn't ready:

- **`LeadsTable`** — add a Status column showing one of `outreach_ready` (green) · `manual_review` (amber) · `contacts_insufficient` (amber) · `needs_manual_research` (red) · `archived` (grey). Filter chip for each.
- **`LeadDetailSheet`** — new "Signals" tab showing each `intent_signals` row as a card: `claim`, clickable `source_url`, `published_date`, verification badge (verified/partial/unverified colour), `why_it_matters`. Plus a "Disqualified" sub-section reading `leads.disqualified_claims`.
- **`LeadDetailSheet`** header — three small score bars (V / I / C) + readiness number.
- **`EnrichLeadButton` toast** — already detailed; just append the gate result, e.g. `"… → outreach_ready (V78 I62 C71)"`.

Glass morphism, KPI rings, flippable Deals cards, BD Reps workload, etc. from your master plan §07 are **deferred** — call them out in a follow-up if you want.

## Out of scope (deliberately)

- Hunter.io fallback — excluded per your instruction.
- Full UI redesign (glass morphism, login role split, Dashboard ring infographic, Deals flip cards). Big surface, no functional break — separate pass.
- Daily Briefs "Enrich & Assign" rework — current flow works, this is feature work not a fix.
- BD Reps workload view, Settings role management redesign.
- Auto-assignment by city + load balancing — needs its own design pass.

## Files that will change

- `supabase/functions/research-perplexity/index.ts` — new evidence-backed prompt, drop signals without `source_url`, write structured rows to `intent_signals`, write rejects to `leads.disqualified_claims`, call `recompute_lead_scores`.
- `supabase/functions/enrich-apollo/index.ts` — persona ranking, slate-gate loop continuation across paths, set `priority_rank`, set `enrichment_status` based on slate result, call `recompute_lead_scores`.
- `supabase/functions/enrich-lead-pipeline/index.ts` — include V/I/C/readiness in the returned `summary`.
- `supabase/functions/_shared/scoring.ts` (new) — `computeSignalScore`, `computeVerification`, `computeContactability`, `computeReadiness`, `recomputeLeadScores(supabase, leadId)`.
- `src/components/crm/EnrichLeadButton.tsx` — extend toast with V/I/C + readiness label.
- `src/components/leads/LeadsTable.tsx` — status column + filter chips for the new statuses.
- `src/components/crm/LeadDetailSheet.tsx` — Signals tab with evidence cards + disqualified section + score bars.
- `supabase/migrations/<new>.sql` — columns above.

## Test plan

1. Pick 3 known Mumbai/Bengaluru companies. Run Enrich Now. Check edge logs:
   - Every signal in `intent_signals` has a non-empty `source_url`.
   - At least one signal lands in `leads.disqualified_claims` (the model should reject *something*).
   - `verification_score`, `contactability_score`, `outreach_readiness` populated.
2. Pick a small/obscure company. Confirm `enrichment_status = 'needs_manual_research'` and it appears under that filter chip in Leads.
3. Pick a well-known company (e.g. a recently funded startup). Confirm slate ≥3, ≥1 P1, status `outreach_ready`, V/I/C all visible in the toast and Lead detail.
4. Verify no `intent_signals` row was written without a `source_url` (SQL spot check).
