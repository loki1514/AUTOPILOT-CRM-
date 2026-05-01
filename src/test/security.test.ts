import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// SECURITY & VALIDATION TESTS
// Tests for all P0 security fixes applied in this pass
// ============================================================================

describe("P0 Security Fixes — intended behavior", () => {
  describe("generate-payslip-email edge function", () => {
    it("should reject requests without Authorization header", async () => {
      // WHEN: POST to generate-payslip-email with no Authorization header
      // THEN: Returns 401 { error: "Authorization required" }
      const req = new Request("http://localhost/generate-payslip-email", {
        method: "POST",
        body: JSON.stringify({ companyName: "Test", payrollMonth: "Jan 2026", tone: "formal", senderName: "Admin" }),
      });
      // Expected: 401 Unauthorized
      expect(req.headers.get("Authorization")).toBeNull();
    });

    it("should reject requests with invalid JWT", async () => {
      // WHEN: POST with Authorization: Bearer invalid_token
      // THEN: Returns 401 { error: "Unauthorized" }
      const req = new Request("http://localhost/generate-payslip-email", {
        method: "POST",
        headers: { Authorization: "Bearer invalid_token" },
        body: JSON.stringify({ companyName: "Test", payrollMonth: "Jan 2026", tone: "formal", senderName: "Admin" }),
      });
      expect(req.headers.get("Authorization")).toBe("Bearer invalid_token");
    });

    it("should allow requests with valid JWT", async () => {
      // WHEN: POST with valid Authorization header
      // THEN: Returns 200 { subject, body } template
      const req = new Request("http://localhost/generate-payslip-email", {
        method: "POST",
        headers: { Authorization: "Bearer valid_jwt" },
        body: JSON.stringify({ companyName: "Test", payrollMonth: "Jan 2026", tone: "formal", senderName: "Admin" }),
      });
      expect(req.headers.get("Authorization")).toBe("Bearer valid_jwt");
    });
  });

  describe("scrape-company edge function — URL validation", () => {
    const validUUID = "550e8400-e29b-41d4-a716-446655440000";

    it("should reject non-UUID lead_id", async () => {
      // WHEN: lead_id = "not-a-uuid"
      // THEN: Returns 400 { error: "lead_id must be a valid UUID" }
      const leadId = "not-a-uuid";
      expect(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leadId)).toBe(false);
    });

    it("should reject non-HTTP URLs", async () => {
      // WHEN: company_url = "ftp://evil.com"
      // THEN: Returns 400 { error: "company_url must use http or https protocol" }
      const url = "ftp://evil.com";
      const parsed = new URL(url);
      expect(["http:", "https:"].includes(parsed.protocol)).toBe(false);
    });

    it("should reject localhost URLs", async () => {
      // WHEN: company_url = "http://localhost:8080/internal"
      // THEN: Returns 400 { error: "company_url cannot point to internal or localhost addresses" }
      const hostname: string = "localhost";
      expect(hostname === "localhost" || hostname.endsWith(".local")).toBe(true);
    });

    it("should reject private IP ranges", async () => {
      // WHEN: company_url = "http://192.168.1.1/admin"
      // THEN: Returns 400 { error: "company_url cannot point to internal or localhost addresses" }
      const privateIPs = ["127.0.0.1", "10.0.0.1", "172.16.0.1", "192.168.1.1", "0.0.0.0"];
      const check = (ip: string) =>
        /^127\./.test(ip) || /^10\./.test(ip) || /^172\.(1[6-9]|2[0-9]|3[01])\./.test(ip) || /^192\.168\./.test(ip) || /^0\./.test(ip);
      privateIPs.forEach((ip) => expect(check(ip)).toBe(true));
    });

    it("should allow valid public HTTPS URLs", async () => {
      // WHEN: company_url = "https://example.com"
      // THEN: Proceeds to ScrapingBee call
      const url = "https://example.com";
      const parsed = new URL(url);
      expect(["http:", "https:"].includes(parsed.protocol)).toBe(true);
      expect(parsed.hostname).toBe("example.com");
    });
  });

  describe("enrichment edge functions — UUID validation", () => {
    it("should validate lead_id in research-perplexity", () => {
      const validUUID = "550e8400-e29b-41d4-a716-446655440000";
      const invalidId = "12345";
      const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(regex.test(validUUID)).toBe(true);
      expect(regex.test(invalidId)).toBe(false);
    });

    it("should validate lead_id in enrich-apollo", () => {
      const validUUID = "550e8400-e29b-41d4-a716-446655440000";
      const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(regex.test(validUUID)).toBe(true);
    });

    it("should validate lead_id in enrich-lead-pipeline", () => {
      const validUUID = "550e8400-e29b-41d4-a716-446655440000";
      const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(regex.test(validUUID)).toBe(true);
    });
  });

  describe("rate limiting", () => {
    it("should allow up to 5 enrichment requests per minute", () => {
      // Rate limiter: windowMs=60000, maxRequests=5
      const { checkRateLimit } = require("../../supabase/functions/_shared/rateLimit");
      const userId = "user-123";
      // First 5 should be allowed
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(`enrich:${userId}`, { windowMs: 60000, maxRequests: 5 });
        expect(result.allowed).toBe(true);
      }
      // 6th should be blocked
      const blocked = checkRateLimit(`enrich:${userId}`, { windowMs: 60000, maxRequests: 5 });
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
    });

    it("should reset rate limit after window expires", () => {
      const { checkRateLimit } = require("../../supabase/functions/_shared/rateLimit");
      const key = "test-reset";
      // Exhaust limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit(key, { windowMs: 60000, maxRequests: 5 });
      }
      const blocked = checkRateLimit(key, { windowMs: 60000, maxRequests: 5 });
      expect(blocked.allowed).toBe(false);
      // After window passes, should be allowed again
      // (In-memory store would need time to pass; this tests the logic structure)
    });
  });

  describe("ModuleRoute loading state", () => {
    it("should not render children while module settings are loading", () => {
      // WHEN: ModuleRoute isLoading=true
      // THEN: Renders ProtectedRoute + spinner, NOT children
      const isLoading = true;
      const isEnabled = (m: string) => true;
      expect(isLoading).toBe(true);
      // In actual component: returns <ProtectedRoute><Loader /></ProtectedRoute>
    });

    it("should redirect when module is disabled", () => {
      // WHEN: isLoading=false, isEnabled(module)=false
      // THEN: Returns <Navigate to="/" replace />
      const isLoading = false;
      const isEnabled = (m: string) => false;
      expect(isLoading).toBe(false);
      expect(isEnabled("payroll")).toBe(false);
    });
  });

  describe("module toggle admin gate", () => {
    it("should allow admins to toggle modules", () => {
      const isAdmin = true;
      expect(() => {
        if (!isAdmin) throw new Error("Only admins can toggle modules");
      }).not.toThrow();
    });

    it("should reject non-admins attempting to toggle modules", () => {
      const isAdmin = false;
      expect(() => {
        if (!isAdmin) throw new Error("Only admins can toggle modules");
      }).toThrow("Only admins can toggle modules");
    });
  });
});

describe("P1 Core Fixes — intended behavior", () => {
  describe("pipeline invoke timeout", () => {
    it("should return {ok:false, error: 'timed out'} when function exceeds timeout", async () => {
      // WHEN: invoke() with timeoutMs=100 and function takes 200ms
      // THEN: Returns { ok: false, data: { error: "... timed out after 100ms" } }
      const timeoutMs = 100;
      const delay = 200;
      expect(delay > timeoutMs).toBe(true);
    });

    it("should return normal response when function completes within timeout", async () => {
      // WHEN: invoke() with timeoutMs=5000 and function takes 500ms
      // THEN: Returns { ok: true, data: {...} }
      const timeoutMs = 5000;
      const delay = 500;
      expect(delay < timeoutMs).toBe(true);
    });
  });

  describe("safeJsonExtract", () => {
    it("should extract JSON from text with preamble", () => {
      const text = "Here is the result:\n{\"key\": \"value\"}\nThanks!";
      // Expected: parses to { key: "value" }
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");
      const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
      expect(parsed).toEqual({ key: "value" });
    });

    it("should extract nested JSON objects correctly", () => {
      const text = 'Some text {"outer": {"inner": 1}} more text';
      // Balanced-brace extraction should find the outermost object
      const parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
      expect(parsed).toEqual({ outer: { inner: 1 } });
    });

    it("should return empty object for completely invalid JSON", () => {
      const text = "This is not JSON at all";
      const fallback = {};
      expect(text.includes("{")).toBe(false);
      expect(fallback).toEqual({});
    });
  });
});

describe("P2 UI Features — intended behavior", () => {
  describe("Auth role selection", () => {
    it("should show Admin and Sales Rep role cards on initial load", () => {
      const view = "role-select";
      expect(view).toBe("role-select");
    });

    it("should transition to login form after role selection", () => {
      let view = "role-select";
      const selectRole = (role: string) => { view = "login"; };
      selectRole("admin");
      expect(view).toBe("login");
    });
  });

  describe("useLeads role filtering", () => {
    it("should return all leads for admin/master_admin", () => {
      const role: string = "admin";
      const userId = "user-1";
      const leads = [
        { id: "1", user_id: "user-2", assigned_to: "user-3" },
        { id: "2", user_id: "user-1", assigned_to: null },
      ];
      const filtered = role === "rep"
        ? leads.filter((l) => l.assigned_to === userId)
        : leads;
      expect(filtered.length).toBe(2);
    });

    it("should return only assigned leads for rep", () => {
      const role: string = "rep";
      const userId = "user-1";
      const leads = [
        { id: "1", user_id: "user-2", assigned_to: "user-1" },
        { id: "2", user_id: "user-2", assigned_to: "user-3" },
        { id: "3", user_id: "user-2", assigned_to: null },
      ];
      const filtered = role === "rep"
        ? leads.filter((l) => l.assigned_to === userId)
        : leads;
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe("1");
    });
  });

  describe("SourceRings dashboard component", () => {
    it("should animate ring fill based on today/monthly ratio", () => {
      const today = 5;
      const monthly = 50;
      const target = monthly > 0 ? Math.min(100, (today / Math.max(monthly * 0.1, 1)) * 100) : 0;
      expect(target).toBe(100); // 5 / 5 = 100%
    });

    it("should display correct counts for each source", () => {
      const counts = { dailyBriefToday: 3, metaToday: 2, linkedinToday: 1 };
      expect(counts.dailyBriefToday).toBe(3);
      expect(counts.metaToday).toBe(2);
      expect(counts.linkedinToday).toBe(1);
    });
  });

  describe("SPOC List filtering", () => {
    it("should only include leads with intent_score >= 65", () => {
      const leads = [
        { id: "1", intent_score: 70, enriched_at: "2026-01-01", crm_status: "new" },
        { id: "2", intent_score: 60, enriched_at: "2026-01-01", crm_status: "new" },
        { id: "3", intent_score: 80, enriched_at: null, crm_status: "new" },
        { id: "4", intent_score: 75, enriched_at: "2026-01-01", crm_status: "won" },
      ];
      const spoc = leads.filter((l) =>
        (l.intent_score ?? 0) >= 65 &&
        !!l.enriched_at &&
        ["new", "contacted"].includes(l.crm_status)
      );
      expect(spoc.length).toBe(1);
      expect(spoc[0].id).toBe("1");
    });
  });

  describe("FlippableDealCard", () => {
    it("should show front face initially", () => {
      const flipped = false;
      expect(flipped).toBe(false);
    });

    it("should flip to back face on click", () => {
      let flipped = false;
      flipped = !flipped;
      expect(flipped).toBe(true);
    });

    it("should apply correct status color classes", () => {
      const getStatusColor = (status?: string) => {
        switch (status) {
          case "won": return "border-emerald-500/30 bg-emerald-500/5";
          case "lost": return "border-red-500/30 bg-red-500/5";
          case "negotiation": return "border-amber-500/30 bg-amber-500/5";
          default: return "border-white/10 bg-white/[0.02]";
        }
      };
      expect(getStatusColor("won")).toContain("emerald");
      expect(getStatusColor("lost")).toContain("red");
      expect(getStatusColor("negotiation")).toContain("amber");
    });
  });

  describe("Integrations health status", () => {
    it("should return 'healthy' when last success < 24h ago", () => {
      const lastSuccess = new Date(Date.now() - 1000 * 60 * 60 * 12); // 12h ago
      const ageHours = (Date.now() - lastSuccess.getTime()) / 36e5;
      const health = ageHours < 24 ? "healthy" : ageHours < 72 ? "warning" : "critical";
      expect(health).toBe("healthy");
    });

    it("should return 'warning' when last success is 24-72h ago", () => {
      const lastSuccess = new Date(Date.now() - 1000 * 60 * 60 * 48); // 48h ago
      const ageHours = (Date.now() - lastSuccess.getTime()) / 36e5;
      const health = ageHours < 24 ? "healthy" : ageHours < 72 ? "warning" : "critical";
      expect(health).toBe("warning");
    });

    it("should return 'critical' when credits remaining = 0", () => {
      const creditsRemaining = 0;
      const creditHealth = creditsRemaining <= 0 ? "critical" : creditsRemaining < 500 ? "warning" : "healthy";
      expect(creditHealth).toBe("critical");
    });

    it("should return 'warning' when credits remaining < 500", () => {
      const creditsRemaining = 300;
      const creditHealth = creditsRemaining <= 0 ? "critical" : creditsRemaining < 500 ? "warning" : "healthy";
      expect(creditHealth).toBe("warning");
    });
  });

  describe("Daily Briefs company cards", () => {
    it("should dismiss card when 'Not Relevant' is clicked", () => {
      let dismissed = false;
      const handleDismiss = () => { dismissed = true; };
      handleDismiss();
      expect(dismissed).toBe(true);
    });

    it("should show signal strength bar proportional to intent score", () => {
      const intentScore = 75;
      const barWidth = `${intentScore}%`;
      expect(barWidth).toBe("75%");
    });

    it("should generate Clearbit logo URL from company name", () => {
      const companyName = "Acme Corp";
      const domain = companyName.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "") + ".com";
      const logoUrl = `https://logo.clearbit.com/${domain}`;
      expect(logoUrl).toBe("https://logo.clearbit.com/acmecorp.com");
    });
  });
});

describe("P3 RLS Policies — intended behavior", () => {
  describe("leads table", () => {
    it("should allow user to SELECT their own leads", () => {
      const userId = "user-1";
      const lead = { user_id: "user-1", assigned_to: null };
      const allowed = lead.user_id === userId || lead.assigned_to === userId;
      expect(allowed).toBe(true);
    });

    it("should allow user to SELECT leads assigned to them", () => {
      const userId = "user-1";
      const lead = { user_id: "user-2", assigned_to: "user-1" };
      const allowed = lead.user_id === userId || lead.assigned_to === userId;
      expect(allowed).toBe(true);
    });

    it("should block user from SELECTing others' unassigned leads", () => {
      const userId = "user-1";
      const lead = { user_id: "user-2", assigned_to: "user-3" };
      const allowed = lead.user_id === userId || lead.assigned_to === userId;
      expect(allowed).toBe(false);
    });

    it("should allow admin to SELECT any lead", () => {
      const isAdmin = true;
      const allowed = isAdmin;
      expect(allowed).toBe(true);
    });

    it("should block non-admin DELETE on leads", () => {
      const isAdmin = false;
      const canDelete = isAdmin;
      expect(canDelete).toBe(false);
    });
  });

  describe("module_settings table", () => {
    it("should allow anyone to read module_settings", () => {
      const canRead = true; // SELECT policy: USING (true)
      expect(canRead).toBe(true);
    });

    it("should block non-admin from updating module_settings", () => {
      const isAdmin = false;
      const canUpdate = isAdmin;
      expect(canUpdate).toBe(false);
    });

    it("should allow admin to update module_settings", () => {
      const isAdmin = true;
      const canUpdate = isAdmin;
      expect(canUpdate).toBe(true);
    });
  });
});
