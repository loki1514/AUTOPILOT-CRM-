import { MainLayout } from '@/components/layout/MainLayout';
import { OutboxTable } from '@/components/campaigns/OutboxTable';
import { useOutbox } from '@/hooks/useOutbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Inbox } from 'lucide-react';

export default function Outbox() {
  const { data: entries, isLoading, error } = useOutbox();

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Inbox className="h-6 w-6" />
            Outbox
          </h1>
          <p className="text-muted-foreground">
            Internal message center - verify and track all sent emails
          </p>
        </div>

        {/* Error state */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">
                Failed to load outbox: {error.message}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Main content */}
        <Card>
          <CardHeader>
            <CardTitle>Sent Emails</CardTitle>
            <CardDescription>
              All outgoing emails with delivery status and tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OutboxTable entries={entries || []} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
