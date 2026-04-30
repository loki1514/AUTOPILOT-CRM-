import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCampaigns } from '@/hooks/useCampaigns';
import { CampaignStatusBadge } from './CampaignStatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Loader2, MoreHorizontal, Plus, Search, Trash2, Edit, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import type { CampaignStatus } from '@/types/email';

interface CampaignListProps {
  onCreateNew: () => void;
}

export function CampaignList({ onCreateNew }: CampaignListProps) {
  const { campaigns, isLoading, deleteCampaign } = useCampaigns();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(search.toLowerCase()) ||
      (campaign.purpose?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    try {
      await deleteCampaign.mutateAsync(id);
      toast.success('Campaign deleted successfully');
    } catch (error) {
      toast.error('Failed to delete campaign');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Email Campaigns</CardTitle>
          <CardDescription>Create and manage your email campaigns</CardDescription>
        </div>
        <Button onClick={onCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CampaignStatus | 'all')}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="sending">Sending</option>
            <option value="sent">Sent</option>
            <option value="paused">Paused</option>
          </select>
        </div>

        {/* Table */}
        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {campaigns.length === 0 ? (
              <>
                <p className="mb-4">No campaigns yet. Create your first one!</p>
                <Button onClick={onCreateNew} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Campaign
                </Button>
              </>
            ) : (
              <p>No campaigns match your filters.</p>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div>
                      <Link 
                        to={`/campaigns/${campaign.id}`}
                        className="font-medium hover:underline"
                      >
                        {campaign.name}
                      </Link>
                      {campaign.purpose && (
                        <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                          {campaign.purpose}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <CampaignStatusBadge status={campaign.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDistanceToNow(new Date(campaign.updated_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/campaigns/${campaign.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/campaigns/${campaign.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(campaign.id, campaign.name)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
