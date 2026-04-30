import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { DailyBrief } from "@/hooks/useDailyBriefs";

const PRIMARY = "#0F172A";
const ACCENT = "#10B981";
const ACCENT_2 = "#F59E0B";
const ACCENT_3 = "#3B82F6";

export function exportBriefToPdf(brief: DailyBrief) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 40;

  // Header bar
  doc.setFillColor(PRIMARY);
  doc.rect(0, 0, pageWidth, 70, "F");
  doc.setTextColor("#ffffff");
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("OFFICEFLOW | DAILY PULSE", 40, 32);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${new Date(brief.brief_date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}  ·  ${brief.city}`,
    40,
    52,
  );

  y = 100;
  doc.setTextColor(PRIMARY);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(brief.headline || "", 40, y, { maxWidth: pageWidth - 80 });
  y += 24;

  // 1. Expiring Leases
  if (brief.expiring_leases?.length) {
    drawSectionHeader(doc, y, "1. Leases Expiring (Next 60 Days) — High P1", ACCENT);
    y += 18;
    autoTable(doc, {
      startY: y,
      head: [["Company", "Location", "Seats", "Lease End", "Why qualifies"]],
      body: brief.expiring_leases.map((l) => [
        l.company_name,
        l.location,
        l.seats,
        l.lease_end,
        l.why_qualifies,
      ]),
      styles: { fontSize: 8, cellPadding: 5 },
      headStyles: { fillColor: ACCENT, textColor: "#ffffff" },
      margin: { left: 40, right: 40 },
    });
    // @ts-expect-error - lastAutoTable is added by plugin
    y = doc.lastAutoTable.finalY + 18;
  }

  // 2. Funded startups
  if (brief.funded_startups?.length) {
    if (y > 700) { doc.addPage(); y = 40; }
    drawSectionHeader(doc, y, "2. Startups That Raised Funds (Last 24h)", ACCENT_2);
    y += 18;
    autoTable(doc, {
      startY: y,
      head: [["Startup", "Funding", "Team", "Use case", "Why qualifies"]],
      body: brief.funded_startups.map((s) => [
        s.startup_name,
        s.funding,
        s.team_size,
        s.use_case,
        s.why_qualifies,
      ]),
      styles: { fontSize: 8, cellPadding: 5 },
      headStyles: { fillColor: ACCENT_2, textColor: "#ffffff" },
      margin: { left: 40, right: 40 },
    });
    // @ts-expect-error
    y = doc.lastAutoTable.finalY + 18;
  }

  // 3. Market watch
  if (brief.micro_market_watch?.length) {
    if (y > 720) { doc.addPage(); y = 40; }
    drawSectionHeader(doc, y, "3. City-Specific Market Watch", ACCENT_3);
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    brief.micro_market_watch.forEach((m) => {
      if (y > 760) { doc.addPage(); y = 40; }
      doc.setFont("helvetica", "bold");
      doc.text(`• ${m.micro_market}`, 50, y);
      y += 12;
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(m.summary, pageWidth - 100);
      doc.text(lines, 60, y);
      y += lines.length * 11 + 6;
    });
    y += 6;
  }

  // 4. Competitor alerts
  if (brief.competitor_alerts?.length) {
    if (y > 720) { doc.addPage(); y = 40; }
    drawSectionHeader(doc, y, "4. Insider Info / Competitor Alerts", "#EF4444");
    y += 18;
    doc.setFontSize(9);
    brief.competitor_alerts.forEach((c) => {
      if (y > 760) { doc.addPage(); y = 40; }
      doc.setFont("helvetica", "bold");
      doc.text(`• ${c.entity}:`, 50, y);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(`${c.movement}${c.impact ? `  →  ${c.impact}` : ""}`, pageWidth - 130);
      doc.text(lines, 50 + doc.getTextWidth(`• ${c.entity}: `), y);
      y += Math.max(14, lines.length * 11);
    });
    y += 8;
  }

  // 5. BD Tips
  if (brief.bd_tips && (brief.bd_tips.linkedin_strategy || brief.bd_tips.script_of_the_day)) {
    if (y > 700) { doc.addPage(); y = 40; }
    drawSectionHeader(doc, y, "5. BD Tips of the Day", "#8B5CF6");
    y += 18;
    doc.setFontSize(9);
    if (brief.bd_tips.linkedin_strategy) {
      doc.setFont("helvetica", "bold");
      doc.text("LinkedIn Strategy:", 50, y);
      y += 12;
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(brief.bd_tips.linkedin_strategy, pageWidth - 100);
      doc.text(lines, 50, y);
      y += lines.length * 11 + 8;
    }
    if (brief.bd_tips.script_of_the_day) {
      doc.setFont("helvetica", "bold");
      doc.text("Script of the Day:", 50, y);
      y += 12;
      doc.setFont("helvetica", "italic");
      const lines = doc.splitTextToSize(`"${brief.bd_tips.script_of_the_day}"`, pageWidth - 100);
      doc.text(lines, 50, y);
      y += lines.length * 11 + 6;
    }
  }

  // City actionables
  if (brief.city_actionables?.length) {
    if (y > 700) { doc.addPage(); y = 40; }
    drawSectionHeader(doc, y, "Actionables — City Leads", PRIMARY);
    y += 18;
    autoTable(doc, {
      startY: y,
      head: [["BD Rep", "Key Follow-ups Today"]],
      body: brief.city_actionables.map((a) => [a.rep_name, (a.follow_ups || []).join(", ")]),
      styles: { fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: PRIMARY, textColor: "#ffffff" },
      margin: { left: 40, right: 40 },
    });
  }

  doc.save(`OfficeFlow-DailyPulse-${brief.city}-${brief.brief_date}.pdf`);
}

function drawSectionHeader(doc: jsPDF, y: number, label: string, color: string) {
  doc.setFillColor(color);
  doc.rect(40, y - 12, 6, 14, "F");
  doc.setTextColor(PRIMARY);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(label, 52, y);
}