import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, ExternalLink, Mail, Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { OutboxEntry, OutboxStatus } from '@/types/email';

interface OutboxTableProps {
  entries: OutboxEntry[];
  isLoading: boolean;
}

const statusColors: Record<OutboxStatus, string> = {
  queued: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  opened: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  clicked: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  bounced: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  complained: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
};

function StatusBadge({ status }: { status: OutboxStatus }) {
  return (
    <Badge variant="outline" className={statusColors[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function StatusTimeline({ entry }: { entry: OutboxEntry }) {
  const timeline = entry.status_timeline || [];
  
  if (timeline.length === 0) {
    return <span className="text-muted-foreground text-xs">No events</span>;
  }

  return (
    <div className="space-y-1">
      {timeline.map((event, index) => (
        <div key={index} className="flex items-center gap-2 text-xs">
          <StatusBadge status={event.status} />
          <span className="text-muted-foreground">
            {format(new Date(event.timestamp), 'MMM d, HH:mm:ss')}
          </span>
        </div>
      ))}
    </div>
  );
}

export function OutboxTable({ entries, isLoading }: OutboxTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewEntry, setPreviewEntry] = useState<OutboxEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      !searchQuery ||
      entry.to_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.from_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading outbox entries...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by recipient, subject..."
            className="pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="queued">Queued</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="opened">Opened</SelectItem>
            <SelectItem value="clicked">Clicked</SelectItem>
            <SelectItem value="bounced">Bounced</SelectItem>
            <SelectItem value="complained">Complained</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredEntries.length} of {entries.length} emails
      </p>

      {/* Table */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No emails found matching your filters.</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <Collapsible key={entry.id} asChild>
                  <>
                    <TableRow className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              setExpandedId(expandedId === entry.id ? null : entry.id)
                            }
                          >
                            {expandedId === entry.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{entry.from_name}</p>
                          <p className="text-xs text-muted-foreground">{entry.from_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p>{entry.to_email}</p>
                          {entry.cc_emails && entry.cc_emails.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              CC: {entry.cc_emails.join(', ')}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {entry.subject}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={entry.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {entry.sent_at
                          ? format(new Date(entry.sent_at), 'MMM d, HH:mm')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewEntry(entry)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedId === entry.id && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/30">
                          <div className="p-4 space-y-4">
                            {/* Reply-To */}
                            {entry.reply_to && (
                              <div>
                                <span className="text-sm font-medium">Reply-To:</span>{' '}
                                <span className="text-sm">{entry.reply_to}</span>
                              </div>
                            )}

                            {/* BCC */}
                            {entry.bcc_emails && entry.bcc_emails.length > 0 && (
                              <div>
                                <span className="text-sm font-medium">BCC:</span>{' '}
                                <span className="text-sm">{entry.bcc_emails.join(', ')}</span>
                              </div>
                            )}

                            {/* Status Timeline */}
                            <div>
                              <span className="text-sm font-medium mb-2 block">
                                Delivery Timeline:
                              </span>
                              <StatusTimeline entry={entry} />
                            </div>

                            {/* Campaign Link */}
                            <div>
                              <Link
                                to={`/campaigns/${entry.campaign_id}`}
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                              >
                                View Campaign
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                </Collapsible>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* HTML Preview Dialog */}
      <Dialog open={!!previewEntry} onOpenChange={() => setPreviewEntry(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{previewEntry?.subject}</DialogTitle>
            <DialogDescription>
              Sent to {previewEntry?.to_email}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            {previewEntry?.html_snapshot ? (
              <div
                className="border rounded p-4 bg-white text-black"
                dangerouslySetInnerHTML={{ __html: previewEntry.html_snapshot }}
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No HTML content available
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
