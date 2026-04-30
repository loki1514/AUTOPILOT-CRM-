# OfficeFlow Test Plan
## Changes Implemented + Expected Behavior

---

## P0 — Security Fixes

### 1. `generate-payslip-email` — Auth Required
**Test:** POST without `Authorization` header  
**Expected:** HTTP 401 `{ error: "Authorization required" }`

**Test:** POST with invalid JWT  
**Expected:** HTTP 401 `{ error: "Unauthorized" }`

**Test:** POST with valid JWT + required fields  
**Expected:** HTTP 200 `{ subject: "Your Salary Slip – Jan 2026", body: "..." }`

---

### 2. `scrape-company` — URL Validation
**Test:** `lead_id = "not-a-uuid"`  
**Expected:** HTTP 400 `{ error: "lead_id must be a valid UUID" }`

**Test:** `company_url = "ftp://evil.com"`  
**Expected:** HTTP 400 `{ error: "company_url must use http or https protocol" }`

**Test:** `company_url = "http://localhost:8080/internal"`  
**Expected:** HTTP 400 `{ error: "company_url cannot point to internal or localhost addresses" }`

**Test:** `company_url = "http://192.168.1.1/admin"`  
**Expected:** HTTP 400 (private IP blocked)

**Test:** `company_url = "https://example.com/about"`  
**Expected:** Proceeds to ScrapingBee API call

---

### 3. Enrichment Functions — UUID Validation
**Test:** Call `research-perplexity`, `enrich-apollo`, or `enrich-lead-pipeline` with `lead_id = "12345"`  
**Expected:** All three return HTTP 400 `{ error: "lead_id must be a valid UUID" }`

**Test:** Call with valid UUID `550e8400-e29b-41d4-a716-446655440000`  
**Expected:** Proceeds normally (subject to auth/rate limits)

---

### 4. Rate Limiting — 5 Enrichments / Minute / User
**Test:** Call `enrich-lead-pipeline` 5 times in 10 seconds  
**Expected:** All 5 return HTTP 200

**Test:** Call a 6th time within the same minute  
**Expected:** HTTP 429 `{ error: "Rate limit exceeded. Try again in a minute." }`

**Test:** Wait 60 seconds, call again  
**Expected:** HTTP 200 (counter reset)

---

### 5. `ModuleRoute` — Loading State
**Test:** Navigate to `/payroll` while `module_settings` is still fetching  
**Expected:** Shows spinner. Does NOT render `<Payroll />` until loading completes.

**Test:** `module_settings` returns `enabled_modules` without `"payroll"`  
**Expected:** Redirects to `/` immediately

---

### 6. Module Toggle — Admin Gate
**Test:** Logged in as `rep` clicks "Disable Payroll" toggle in Settings  
**Expected:** Toast error: "Only admins can toggle modules". UI state does not change.

**Test:** Logged in as `admin` clicks "Disable Payroll" toggle  
**Expected:** Toast success: "Module settings updated". Payroll disappears from sidebar.

---

## P1 — Core Pipeline Fixes

### 7. Pipeline Invoke Timeout
**Test:** Perplexity function takes >45s to respond  
**Expected:** Pipeline returns `{ ok: false, data: { error: "research-perplexity timed out after 45000ms" } }`. Apollo is still invoked.

**Test:** All functions complete within 45s  
**Expected:** Full pipeline response with V/I/C scores in `summary`

---

### 8. Perplexity JSON Parsing — Safe Extraction
**Test:** Perplexity returns text: `"Here is the result:\n{\"key\": \"value\"}\nThanks!"`  
**Expected:** Parses `{ key: "value" }` correctly

**Test:** Perplexity returns nested braces: `"Analysis: {\"signals\": [{\"type\": \"funding\"}]}"`  
**Expected:** Extracts outermost JSON object with balanced braces

**Test:** Perplexity returns plain text with no JSON  
**Expected:** Returns `{}` (empty object). Job logged as failed gracefully.

---

## P2 — UI Features

### 9. Auth Page — Role Selection
**Test:** Open `/auth`  
**Expected:** Two cards visible: "Admin" (shield/emerald) and "Sales Rep" (user/blue)

**Test:** Click "Admin" card  
**Expected:** Login form appears with green "Admin access" badge. Back button returns to role selection.

**Test:** Click "Sales Rep" card → enter credentials → login  
**Expected:** Redirects to Dashboard. Sidebar shows assigned leads only.

---

### 10. useLeads — Role-Based Filtering
**Test:** Admin opens `/leads`  
**Expected:** Table shows all leads across all reps

**Test:** Rep opens `/leads`  
**Expected:** Table shows ONLY leads where `assigned_to = rep.user_id`

**Test:** Rep navigates to `/leads/:id` for an unassigned lead  
**Expected:** 404 or redirect (RLS blocks access)

---

### 11. Dashboard — Source Rings
**Test:** Dashboard loads with leads from today  
**Expected:** 3 animated rings visible:
- Daily Briefs (teal): count of `source='daily_brief'` leads created today
- Meta (purple): count of `source='meta'` leads created today
- LinkedIn (blue): count of `source='linkedin'` leads created today

**Test:** Ring animation completes  
**Expected:** Center number animates from 0 to actual count over 1.2s

---

### 12. Dashboard — Top Intent Cards
**Test:** Dashboard has enriched leads with scores 85, 72, 60, 45  
**Expected:** Horizontal scroll shows cards sorted by score desc. 85 is first (green), 72 is second (green), 60 is third (amber), 45 is fourth (red).

**Test:** Click "View" on a Top Intent card  
**Expected:** Navigates to `/leads/:id`

---

### 13. Leads Page — SPOC List Tab
**Test:** Click "SPOC List" tab  
**Expected:** Table shows only leads with:
- `intent_score >= 65`
- `enriched_at IS NOT NULL`
- `crm_status IN ('new', 'contacted')`

**Test:** Click "Export CSV"  
**Expected:** Downloads `spoc-list-YYYY-MM-DD.csv` with columns: Name, Title, Company, Email, Phone, LinkedIn, Key Signal, Intent Score, Rep

---

### 14. Pipeline — Deals View (Flippable Cards)
**Test:** On `/pipeline`, click "Deals" toggle  
**Expected:** Grid of cards replaces Kanban columns

**Test:** Click a deal card  
**Expected:** Card flips (rotateY 180deg, 0.5s animation). Front hides, back shows contact details.

**Test:** Click flipped card again  
**Expected:** Card flips back to front

**Test:** Click "Log Call" on back of card  
**Expected:** Opens Lead Detail sheet with "call" activity type pre-selected

---

### 15. Integrations — Credit Cards
**Test:** Open `/integrations`  
**Expected:** 5 glass cards visible: Apollo, Perplexity, ScrapingBee, Meta, LinkedIn

**Test:** Apollo has `credits_remaining = 300`  
**Expected:** Shows "Low" amber badge. Status dot is yellow.

**Test:** Apollo has `credits_remaining = 0`  
**Expected:** Status dot is red. Card shows critical state.

**Test:** Apollo last success was 2 hours ago  
**Expected:** Status dot is green.

**Test:** Apollo last success was 48 hours ago  
**Expected:** Status dot is amber.

**Test:** Click "Test" button on Apollo card  
**Expected:** Button shows "Testing…" then toast success with latency.

---

### 16. Daily Briefs — Enhanced Cards
**Test:** Open `/intelligence/briefs`, view Today's Brief  
**Expected:** Company cards show Clearbit logo, signal strength bar, intent badge

**Test:** Click "Add to Leads" on a brief card  
**Expected:** Lead created with `source='daily_brief'`. No Apollo credits consumed.

**Test:** Click "Enrich & Assign" on a brief card  
**Expected:** Lead created + Apollo enrichment triggered. Toast shows success.

**Test:** Click "X" (Not Relevant) on a brief card  
**Expected:** Card disappears from view. Toast: "[Company] marked as not relevant"

---

## P3 — Database + Scoring

### 17. RLS — Leads Table
**Test:** Authenticated user queries `leads` table via Supabase client  
**Expected:** Returns only rows where `user_id = auth.uid()` OR `assigned_to = auth.uid()` OR user is admin

**Test:** Non-admin tries to DELETE a lead they don't own  
**Expected:** 0 rows affected (policy blocks)

**Test:** Admin DELETEs any lead  
**Expected:** Row deleted successfully

---

### 18. RLS — Module Settings
**Test:** Any authenticated user reads `module_settings`  
**Expected:** Returns row with `enabled_modules` array

**Test:** Rep tries to UPDATE `module_settings`  
**Expected:** Error: "new row violates row-level security policy"

**Test:** Admin UPDATEs `module_settings`  
**Expected:** Update succeeds

---

### 19. Scoring Algorithm
**Test:** Run `bun test src/test/scoring.test.ts`  
**Expected:** 26 tests pass, 0 fail

**Test:** Signal with `verification_status = 'verified'`, `signal_type = 'funding'`, published today  
**Expected:** `computeSignalScore` returns 39 (30 * 1.3 recency)

**Test:** 1 verified signal only  
**Expected:** `computeIntentScore` caps at 40

**Test:** 2 verified signals  
**Expected:** `computeIntentScore` sums normally (no cap)

**Test:** Slate has 3 contacts, 1 P1, 2 LinkedIn URLs  
**Expected:** `evaluateSlate` returns `{ status: 'outreach_ready', hasP1: true, withLinkedIn: 3, total: 3 }`

**Test:** Slate has 3 contacts, 0 P1  
**Expected:** `evaluateSlate` returns `{ status: 'contacts_insufficient', hasP1: false }`

---

## Quick Run Commands

```bash
# All scoring + security tests
bun test src/test/scoring.test.ts src/test/security.test.ts

# Type check
bunx tsc --noEmit

# Single file
bun test src/test/scoring.test.ts
```
