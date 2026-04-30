import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyPulseView } from "@/components/intelligence/DailyPulseView";
import { AutomationRuleManager } from "@/components/intelligence/AutomationRuleManager";
import { Sparkles, Clock, History } from "lucide-react";
import { DailyBriefDashboard } from "@/components/intelligence/DailyBriefDashboard";

export default function IntelligenceBriefs() {
  const [activeTab, setActiveTab] = useState("today");

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" />
            Daily Pulse
          </h1>
          <p className="text-muted-foreground">
            Auto-generated city intelligence — qualified leads, market signals, and BD scripts. The engine that powers your pipeline.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="today" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Today's Brief
            </TabsTrigger>
            <TabsTrigger value="archive" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Archive
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Automation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-6">
            <DailyPulseView />
          </TabsContent>

          <TabsContent value="archive" className="mt-6">
            <DailyBriefDashboard />
          </TabsContent>

          <TabsContent value="automation" className="mt-6">
            <AutomationRuleManager />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
