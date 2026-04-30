import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REPS = [
  { name: "Aarav Mehta", email: "aarav@example.com", city: "Mumbai", focus: ["Mumbai", "Pune"] },
  { name: "Priya Sharma", email: "priya@example.com", city: "Bangalore", focus: ["Bangalore"] },
  { name: "Rohan Iyer", email: "rohan@example.com", city: "Delhi", focus: ["Delhi", "Gurgaon", "Noida"] },
  { name: "Sara Khan", email: "sara@example.com", city: "Pune", focus: ["Pune", "Mumbai"] },
];

const STATUSES = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];
const SOURCES = ["linkedin", "meta", "apollo", "perplexity", "website", "referral", "manual"];
const SIZES = ["1-5 desks", "6-15 desks", "16-30 desks", "30+ desks"];
const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"];
const CITIES = ["Mumbai", "Bangalore", "Delhi", "Pune", "Gurgaon", "Hyderabad"];

// Real, well-known Indian companies → Apollo enrichment will return real contacts.
// We also pre-seed two decision makers per lead so the People view is never empty.
const COMPANIES: Array<{
  company: string;
  domain: string;
  city: string;
  primary: { name: string; title: string; email: string; linkedin: string };
  secondary: { name: string; title: string; linkedin: string };
}> = [
  { company: "Razorpay", domain: "razorpay.com", city: "Bangalore",
    primary: { name: "Harshil Mathur", title: "CEO & Co-founder", email: "harshil@razorpay.com", linkedin: "https://linkedin.com/in/harshilmathur" },
    secondary: { name: "Shashank Kumar", title: "MD & Co-founder", linkedin: "https://linkedin.com/in/shashank-kumar-razorpay" } },
  { company: "Zerodha", domain: "zerodha.com", city: "Bangalore",
    primary: { name: "Nithin Kamath", title: "Founder & CEO", email: "nithin@zerodha.com", linkedin: "https://linkedin.com/in/nithinkamath" },
    secondary: { name: "Kailash Nadh", title: "CTO", linkedin: "https://linkedin.com/in/knadh" } },
  { company: "CRED", domain: "cred.club", city: "Bangalore",
    primary: { name: "Kunal Shah", title: "Founder & CEO", email: "kunal@cred.club", linkedin: "https://linkedin.com/in/kunalshah1" },
    secondary: { name: "Rohan Khara", title: "Head of Product", linkedin: "https://linkedin.com/in/rohankhara" } },
  { company: "Freshworks", domain: "freshworks.com", city: "Chennai",
    primary: { name: "Girish Mathrubootham", title: "Founder & Executive Chairman", email: "girish@freshworks.com", linkedin: "https://linkedin.com/in/girishmathrubootham" },
    secondary: { name: "Dennis Woodside", title: "CEO", linkedin: "https://linkedin.com/in/denniswoodside" } },
  { company: "Zomato", domain: "zomato.com", city: "Gurgaon",
    primary: { name: "Deepinder Goyal", title: "Founder & CEO", email: "deepinder@zomato.com", linkedin: "https://linkedin.com/in/deepigoyal" },
    secondary: { name: "Akshant Goyal", title: "CFO", linkedin: "https://linkedin.com/in/akshant-goyal" } },
  { company: "Swiggy", domain: "swiggy.com", city: "Bangalore",
    primary: { name: "Sriharsha Majety", title: "CEO & Co-founder", email: "sriharsha@swiggy.in", linkedin: "https://linkedin.com/in/sriharsha-majety" },
    secondary: { name: "Phani Kishan", title: "Co-founder", linkedin: "https://linkedin.com/in/phanikishan" } },
  { company: "Meesho", domain: "meesho.com", city: "Bangalore",
    primary: { name: "Vidit Aatrey", title: "Founder & CEO", email: "vidit@meesho.com", linkedin: "https://linkedin.com/in/viditaatrey" },
    secondary: { name: "Sanjeev Barnwal", title: "Co-founder & CTO", linkedin: "https://linkedin.com/in/sanjeevbarnwal" } },
  { company: "Postman", domain: "postman.com", city: "Bangalore",
    primary: { name: "Abhinav Asthana", title: "Founder & CEO", email: "abhinav@postman.com", linkedin: "https://linkedin.com/in/abhinavasthana" },
    secondary: { name: "Ankit Sobti", title: "Co-founder & CTO", linkedin: "https://linkedin.com/in/ankitsobti" } },
  { company: "Groww", domain: "groww.in", city: "Bangalore",
    primary: { name: "Lalit Keshre", title: "Co-founder & CEO", email: "lalit@groww.in", linkedin: "https://linkedin.com/in/lalitkeshre" },
    secondary: { name: "Harsh Jain", title: "Co-founder", linkedin: "https://linkedin.com/in/harshjainn" } },
  { company: "Urban Company", domain: "urbancompany.com", city: "Gurgaon",
    primary: { name: "Abhiraj Singh Bhal", title: "Co-founder & CEO", email: "abhiraj@urbancompany.com", linkedin: "https://linkedin.com/in/abhirajbhal" },
    secondary: { name: "Varun Khaitan", title: "Co-founder", linkedin: "https://linkedin.com/in/varunkhaitan" } },
  { company: "PhonePe", domain: "phonepe.com", city: "Bangalore",
    primary: { name: "Sameer Nigam", title: "Founder & CEO", email: "sameer@phonepe.com", linkedin: "https://linkedin.com/in/sameernigam" },
    secondary: { name: "Rahul Chari", title: "Co-founder & CTO", linkedin: "https://linkedin.com/in/rahulchari" } },
  { company: "BrowserStack", domain: "browserstack.com", city: "Mumbai",
    primary: { name: "Ritesh Arora", title: "Co-founder & CEO", email: "ritesh@browserstack.com", linkedin: "https://linkedin.com/in/riteshpa" },
    secondary: { name: "Nakul Aggarwal", title: "Co-founder & CTO", linkedin: "https://linkedin.com/in/nakul-aggarwal" } },
];

const SIGNALS = [
  ["funding_round", "Series B $24M", "perplexity", 25],
  ["headcount_growth", "+18% in 90 days", "apollo", 15],
  ["job_posting", "Hiring Office Manager in Mumbai", "scrapingbee", 18],
  ["news_mention", "Featured in Economic Times", "perplexity", 8],
  ["linkedin_activity", "Founder posted about expansion", "linkedin", 12],
];

const ACTIVITIES = [
  ["call", "Intro call — interested in 20-seat setup"],
  ["email", "Sent pricing deck"],
  ["meeting", "Site visit scheduled"],
  ["note", "Budget tight; might revisit Q2"],
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Seed reps
    const repRows = REPS.map((r) => ({
      user_id: user.id,
      member_name: r.name,
      member_email: r.email,
      city: r.city,
      role: "bd",
      is_active: true,
      max_leads: 25,
      city_focus: r.focus,
    }));
    const { data: insertedReps, error: repErr } = await supabase
      .from("bd_team_members")
      .insert(repRows)
      .select();
    if (repErr) throw repErr;

    const repIds = (insertedReps ?? []).map((r: any) => r.id);

    // Seed 12 leads using real companies (Apollo-matchable)
    const leadRows = COMPANIES.map((c, i) => {
      const status = STATUSES[i % STATUSES.length];
      const intent = rand(35, 95);
      return {
        user_id: user.id,
        client_name: c.primary.name,
        full_name: c.primary.name,
        company: c.company,
        company_domain: c.domain,
        website: `https://${c.domain}`,
        email: c.primary.email,
        phone: `+91 9${rand(100000000, 999999999)}`,
        job_title: c.primary.title,
        linkedin_url: c.primary.linkedin,
        company_size: pick(COMPANY_SIZES),
        headcount: rand(50, 500),
        city: c.city,
        location: c.city,
        office_size_needed: pick(SIZES),
        budget_monthly: rand(150000, 1500000),
        intent_score: intent,
        source: pick(SOURCES),
        crm_status: status,
        stage: "lead",
        assigned_to: pick(repIds),
      };
    });

    const { data: insertedLeads, error: leadErr } = await supabase
      .from("leads")
      .insert(leadRows)
      .select();
    if (leadErr) throw leadErr;

    const leadIds = (insertedLeads ?? []).map((l: any) => l.id);

    // Pre-seed lead_contacts (decision makers) so the People view shows real names
    // even before Apollo enrichment runs. Enrichment will overlay/enhance these.
    const contactRows: any[] = [];
    (insertedLeads ?? []).forEach((lead: any, i: number) => {
      const c = COMPANIES[i];
      if (!c) return;
      contactRows.push({
        lead_id: lead.id,
        full_name: c.primary.name,
        title: c.primary.title,
        seniority: "c_suite",
        priority_rank: 1,
        linkedin_url: c.primary.linkedin,
        email: c.primary.email,
        email_status: "verified",
        phone: `+91 9${rand(100000000, 999999999)}`,
        city: c.city,
        country: "India",
        departments: ["executive"],
      });
      contactRows.push({
        lead_id: lead.id,
        full_name: c.secondary.name,
        title: c.secondary.title,
        seniority: c.secondary.title.toLowerCase().includes("cto") ? "c_suite" : "founder",
        priority_rank: 2,
        linkedin_url: c.secondary.linkedin,
        phone: `+91 9${rand(100000000, 999999999)}`,
        city: c.city,
        country: "India",
        departments: ["engineering"],
      });
    });
    if (contactRows.length) await supabase.from("lead_contacts").insert(contactRows);

    // Activities
    const activityRows: any[] = [];
    leadIds.forEach((id: string) => {
      const n = rand(1, 3);
      for (let i = 0; i < n; i++) {
        const [type, content] = pick(ACTIVITIES);
        activityRows.push({ lead_id: id, type, content, rep_id: pick(repIds) });
      }
    });
    if (activityRows.length) await supabase.from("activities").insert(activityRows);

    // Signals
    const signalRows: any[] = [];
    leadIds.slice(0, 8).forEach((id: string) => {
      const n = rand(1, 3);
      for (let i = 0; i < n; i++) {
        const [type, val, src, score] = pick(SIGNALS);
        signalRows.push({
          lead_id: id,
          signal_type: type,
          signal_value: val,
          source_api: src,
          score_contribution: score,
        });
      }
    });
    if (signalRows.length) await supabase.from("intent_signals").insert(signalRows);

    return new Response(
      JSON.stringify({ reps: repIds.length, leads: leadIds.length, contacts: contactRows.length, activities: activityRows.length, signals: signalRows.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("seed-crm-demo error:", e);
    return new Response(JSON.stringify({ error: e.message ?? "Failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});