/**
 * Pipeline Overview — `/`
 * Purpose: command-deck dashboard. Atmospheric Glass aesthetic.
 * Used by: App router as the landing page after auth.
 * Sections:
 *   - PageHeader (HELLO + org + date)
 *   - 4 KPI tiles (Pipeline $, Activities, Account Health, Revenue MTD)
 *   - TriStat (Prospecting / Negotiation / Closed-Won)
 *   - HalfCircleGauge (Quota Attainment)
 *   - SparkCard (Daily Revenue + WoW velocity)
 *   - ScheduleCard (Upcoming Meetings & Follow-ups)
 */
import { format } from "date-fns";
import { motion, type Variants } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/atmosphere/PageHeader";
import { DashboardTile } from "@/components/dashboard/DashboardTile";
import { TriStatCard } from "@/components/dashboard/TriStatCard";
import { HalfCircleGauge } from "@/components/dashboard/HalfCircleGauge";
import { SparkCard } from "@/components/dashboard/SparkCard";
import { ScheduleCard } from "@/components/dashboard/ScheduleCard";
import { usePipelineOverview, formatINRCompact } from "@/hooks/usePipelineOverview";
import { useAuth } from "@/hooks/useAuth";

const EASE = [0.22, 1, 0.36, 1] as const;
const stagger: Variants = {
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export default function Index() {
  const data = usePipelineOverview();
  const { user } = useAuth();

  const firstName =
    (user?.user_metadata as Record<string, string> | undefined)?.first_name ||
    user?.email?.split("@")[0] ||
    "Operator";

  return (
    <MainLayout>
      <PageHeader
        eyebrow={`${format(new Date(), "EEE · d MMM yyyy")}`}
        title={`Hello ${capitalize(firstName)}`}
        subtitle="Your pipeline at a glance — built for the next move."
      />

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        {/* KPI tiles */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardTile
            variant="pipeline"
            label="Pipeline"
            value={formatINRCompact(data.pipelineValue)}
            spark={data.pipelineSpark}
          />
          <DashboardTile
            variant="activities"
            label="Activities · today"
            value={data.activitiesToday}
            spark={data.activitiesSpark}
          />
          <DashboardTile
            variant="health"
            label="Account health"
            value={`${data.accountHealth}%`}
            spark={data.healthSpark}
          />
          <DashboardTile
            variant="revenue"
            label="Revenue · MTD"
            value={formatINRCompact(data.revenueMTD)}
            spark={data.revenueSpark}
          />
        </motion.div>

        {/* TriStat + Quota gauge */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TriStatCard
              title="Deals by stage"
              stats={[
                { label: "Prospecting",  value: data.triStats.prospecting, dot: "oklch(0.72 0.15 235)" },
                { label: "Negotiation",  value: data.triStats.negotiation, dot: "oklch(0.78 0.18 65)" },
                { label: "Closed-Won",   value: data.triStats.won,         dot: "oklch(0.78 0.20 145)" },
              ]}
            />
          </div>
          <HalfCircleGauge
            title="Quota attainment"
            value={data.quotaValue}
            target={data.quotaTarget}
            unit={`Target ${formatINRCompact(data.quotaTarget)}`}
          />
        </motion.div>

        {/* Spark + Schedule */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SparkCard
            title="Daily revenue · last 7d"
            value={data.dailyRevenueValue}
            data={data.dailyRevenueData}
            delta={data.dailyRevenueDelta}
          />
          <ScheduleCard title="Upcoming meetings & follow-ups" items={data.schedule} />
        </motion.div>
      </motion.div>
    </MainLayout>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
