import { MainLayout } from '@/components/layout/MainLayout';
import { IntelligenceSourceManager } from '@/components/intelligence/IntelligenceSourceManager';
import { IntelligenceItemList } from '@/components/intelligence/IntelligenceItemList';
import { ManualIntelligenceForm } from '@/components/intelligence/ManualIntelligenceForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lightbulb, Rss, FileText } from 'lucide-react';

export default function Intelligence() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-primary" />
            Market Intelligence
          </h1>
          <p className="text-muted-foreground mt-1">
            Aggregate and manage market intelligence from RSS feeds, documents, and manual entries.
          </p>
        </div>

        <Tabs defaultValue="feed" className="space-y-4">
          <TabsList>
            <TabsTrigger value="feed" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Intelligence Feed
            </TabsTrigger>
            <TabsTrigger value="sources" className="flex items-center gap-2">
              <Rss className="h-4 w-4" />
              Sources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-4">
            <ManualIntelligenceForm />
            <IntelligenceItemList />
          </TabsContent>

          <TabsContent value="sources">
            <IntelligenceSourceManager />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
