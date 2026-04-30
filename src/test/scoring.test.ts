import { describe, it, expect } from "vitest";
import {
  computeSignalScore,
  computeIntentScore,
  computeVerificationScore,
  computeContactabilityScore,
  computeReadiness,
  evaluateSlate,
  personaRank,
  type SignalLike,
  type ContactLike,
} from "../../supabase/functions/_shared/scoring";

describe("personaRank", () => {
  it("returns 1 for P1 titles", () => {
    expect(personaRank("Head of Administration")).toBe(1);
    expect(personaRank("Facilities Manager")).toBe(1);
    expect(personaRank("Workplace Manager")).toBe(1);
  });

  it("returns 2 for P2 titles", () => {
    expect(personaRank("Head of Operations")).toBe(2);
    expect(personaRank("Operations Manager")).toBe(2);
  });

  it("returns 3 for P3 titles", () => {
    expect(personaRank("CEO")).toBe(3);
    expect(personaRank("Founder")).toBe(3);
  });

  it("returns 99 for unknown titles", () => {
    expect(personaRank("Software Engineer")).toBe(99);
    expect(personaRank(null)).toBe(99);
  });
});

describe("computeSignalScore", () => {
  it("returns 0 for signals without source_url", () => {
    const s: SignalLike = { signal_type: "funding", verification_status: "verified" };
    expect(computeSignalScore(s)).toBe(0);
  });

  it("returns 0 for unverified signals", () => {
    const s: SignalLike = {
      signal_type: "funding",
      verification_status: "unverified",
      source_url: "https://example.com",
    };
    expect(computeSignalScore(s)).toBe(0);
  });

  it("computes verified funding score correctly", () => {
    const s: SignalLike = {
      signal_type: "funding",
      verification_status: "verified",
      source_url: "https://example.com",
      published_date: new Date().toISOString(),
    };
    // Base 30 * recency 1.3 = 39
    expect(computeSignalScore(s)).toBe(39);
  });

  it("computes partially verified funding score correctly", () => {
    const s: SignalLike = {
      signal_type: "funding",
      verification_status: "partially_verified",
      source_url: "https://example.com",
      published_date: new Date().toISOString(),
    };
    // Base 15 * recency 1.3 = 19.5 -> 20
    expect(computeSignalScore(s)).toBe(20);
  });

  it("applies recency multiplier correctly", () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 100);
    const s: SignalLike = {
      signal_type: "funding",
      verification_status: "verified",
      source_url: "https://example.com",
      published_date: oldDate.toISOString(),
    };
    // Base 30 * recency 0.5 = 15
    expect(computeSignalScore(s)).toBe(15);
  });

  it("gives higher score for workplace hiring", () => {
    const s: SignalLike = {
      signal_type: "hiring",
      verification_status: "verified",
      source_url: "https://example.com",
      why_it_matters: "Hiring workplace manager",
      published_date: new Date().toISOString(),
    };
    // Base 25 * recency 1.3 = 32.5 -> 33
    expect(computeSignalScore(s)).toBe(33);
  });
});

describe("computeIntentScore", () => {
  it("caps at 40 when fewer than 2 verified signals", () => {
    const signals: SignalLike[] = [
      {
        signal_type: "funding",
        verification_status: "verified",
        source_url: "https://example.com",
        published_date: new Date().toISOString(),
      },
    ];
    // One signal: base 39, but capped at 40
    expect(computeIntentScore(signals)).toBeLessThanOrEqual(40);
  });

  it("does not cap when 2+ verified signals", () => {
    const signals: SignalLike[] = [
      {
        signal_type: "funding",
        verification_status: "verified",
        source_url: "https://a.com",
        published_date: new Date().toISOString(),
      },
      {
        signal_type: "office_expansion",
        verification_status: "verified",
        source_url: "https://b.com",
        published_date: new Date().toISOString(),
      },
    ];
    // 39 + 39 = 78
    expect(computeIntentScore(signals)).toBe(78);
  });

  it("returns 0 for empty signals", () => {
    expect(computeIntentScore([])).toBe(0);
  });
});

describe("computeVerificationScore", () => {
  it("returns 0 for no signals", () => {
    expect(computeVerificationScore([])).toBe(0);
  });

  it("returns higher score for verified tier1_news", () => {
    const signals: SignalLike[] = [
      {
        signal_type: "funding",
        verification_status: "verified",
        source_url: "https://example.com",
        source_type: "tier1_news",
        published_date: new Date().toISOString(),
      },
    ];
    const score = computeVerificationScore(signals);
    expect(score).toBeGreaterThan(0);
  });

  it("penalizes conflicting signals", () => {
    const signals: SignalLike[] = [
      {
        signal_type: "funding",
        verification_status: "verified",
        source_url: "https://example.com",
        published_date: new Date().toISOString(),
      },
      {
        signal_type: "funding",
        verification_status: "conflicting",
        source_url: "https://other.com",
        published_date: new Date().toISOString(),
      },
    ];
    const withConflict = computeVerificationScore(signals);
    const withoutConflict = computeVerificationScore([signals[0]]);
    expect(withConflict).toBeLessThan(withoutConflict);
  });
});

describe("computeContactabilityScore", () => {
  it("returns 0 for no contacts", () => {
    expect(computeContactabilityScore([])).toBe(0);
  });

  it("returns higher score with P1 present", () => {
    const withP1: ContactLike[] = [
      { priority_rank: 1, linkedin_url: "https://linkedin.com" },
    ];
    const withoutP1: ContactLike[] = [
      { priority_rank: 99, linkedin_url: "https://linkedin.com" },
    ];
    expect(computeContactabilityScore(withP1)).toBeGreaterThan(computeContactabilityScore(withoutP1));
  });

  it("caps at 100", () => {
    const contacts: ContactLike[] = Array.from({ length: 20 }, () => ({
      priority_rank: 1,
      linkedin_url: "https://linkedin.com",
      email: "test@example.com",
      email_status: "verified",
      phone: "+1234567890",
    }));
    expect(computeContactabilityScore(contacts)).toBe(100);
  });
});

describe("computeReadiness", () => {
  it("computes weighted average correctly", () => {
    // V=70, I=60, C=50 -> 70*0.4 + 60*0.3 + 50*0.3 = 28 + 18 + 15 = 61
    expect(computeReadiness(70, 60, 50)).toBe(61);
  });

  it("returns 0 for all zeros", () => {
    expect(computeReadiness(0, 0, 0)).toBe(0);
  });
});

describe("evaluateSlate", () => {
  it("returns needs_manual_research for empty contacts", () => {
    const result = evaluateSlate([]);
    expect(result.status).toBe("needs_manual_research");
    expect(result.total).toBe(0);
  });

  it("returns outreach_ready with sufficient contacts", () => {
    const contacts: ContactLike[] = [
      { priority_rank: 1, linkedin_url: "https://a.com" },
      { priority_rank: 2, linkedin_url: "https://b.com" },
      { priority_rank: 3, linkedin_url: "https://c.com" },
    ];
    const result = evaluateSlate(contacts);
    expect(result.status).toBe("outreach_ready");
    expect(result.hasP1).toBe(true);
    expect(result.withLinkedIn).toBe(3);
  });

  it("returns contacts_insufficient without P1", () => {
    const contacts: ContactLike[] = [
      { priority_rank: 3, linkedin_url: "https://a.com" },
      { priority_rank: 3, linkedin_url: "https://b.com" },
      { priority_rank: 3, linkedin_url: "https://c.com" },
    ];
    const result = evaluateSlate(contacts);
    expect(result.status).toBe("contacts_insufficient");
  });

  it("returns contacts_insufficient with only 2 contacts", () => {
    const contacts: ContactLike[] = [
      { priority_rank: 1, linkedin_url: "https://a.com" },
      { priority_rank: 2, linkedin_url: "https://b.com" },
    ];
    const result = evaluateSlate(contacts);
    expect(result.status).toBe("contacts_insufficient");
  });

  it("returns contacts_insufficient with fewer than 2 LinkedIn URLs", () => {
    const contacts: ContactLike[] = [
      { priority_rank: 1, linkedin_url: "https://a.com" },
      { priority_rank: 2 },
      { priority_rank: 3 },
    ];
    const result = evaluateSlate(contacts);
    expect(result.status).toBe("contacts_insufficient");
  });
});
