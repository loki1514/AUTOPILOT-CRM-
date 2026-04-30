import { useState } from "react";
import { format } from "date-fns";
import { useDailyBriefs, DailyBrief } from "@/hooks/useDailyBriefs";
import { useBriefToCampaign } from "@/hooks/useBriefToCampaign";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sparkles,
  Calendar,
  MapPin,
  Target,
  TrendingUp,
  Users,
  CheckCircle,
  Edit,
  Trash2,
  Eye,
  Send,
  Mail,
} from "lucide-react";

const CITIES = ["Bangalore", "Mumbai", "Delhi/Noida", "Indore"];

interface DailyBriefEditorProps {
  brief: DailyBrief;
  onClose: () => void;
}

function DailyBriefEditor({ brief, onClose }: DailyBriefEditorProps) {
  const { updateBrief, approveBrief } = useDailyBriefs();
  const [headline, setHeadline] = useState(brief.headline);
  const [topSignals, setTopSignals] = useState(brief.top_signals);
  const [suggestedActions, setSuggestedActions] = useState(brief.suggested_actions);

  const handleSave = () => {
    updateBrief.mutate({
      id: brief.id,
      headline,
      top_signals: topSignals,
      suggested_actions: suggestedActions,
    });
  };

  const handleApprove = () => {
    approveBrief.mutate(brief.id, {
      onSuccess: onClose,
    });
  };

  const updateSignal = (index: number, field: string, value: string) => {
    const updated = [...topSignals];
    updated[index] = { ...updated[index], [field]: value };
    setTopSignals(updated);
  };

  const updateAction = (index: number, field: string, value: string) => {
    const updated = [...suggestedActions];
    updated[index] = { ...updated[index], [field]: value };
    setSuggestedActions(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium text-muted-foreground">Headline</label>
        <Input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Today's BD Intelligence..."
          className="mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">
          Top Signals ({topSignals.length})
        </label>
        <div className="space-y-3">
          {topSignals.map((signal, index) => (
            <Card key={index} className="p-3">
              <Textarea
                value={signal.signal}
                onChange={(e) => updateSignal(index, "signal", e.target.value)}
                placeholder="Signal description..."
                className="mb-2"
                rows={2}
              />
              <div className="flex gap-2">
                <Select
                  value={signal.type}
                  onValueChange={(value) => updateSignal(index, "type", value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lease_expiry">Lease Expiry</SelectItem>
                    <SelectItem value="funded_company">Funded Company</SelectItem>
                    <SelectItem value="competitor">Competitor</SelectItem>
                    <SelectItem value="pricing">Pricing</SelectItem>
                    <SelectItem value="strategic">Strategic</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={signal.priority}
                  onValueChange={(value) => updateSignal(index, "priority", value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">
          Suggested Actions ({suggestedActions.length})
        </label>
        <div className="space-y-3">
          {suggestedActions.map((action, index) => (
            <Card key={index} className="p-3">
              <Textarea
                value={action.action}
                onChange={(e) => updateAction(index, "action", e.target.value)}
                placeholder="Action to take..."
                className="mb-2"
                rows={2}
              />
              <Select
                value={action.urgency}
                onValueChange={(value) => updateAction(index, "urgency", value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="monitor">Monitor</SelectItem>
                </SelectContent>
              </Select>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={updateBrief.isPending}>
          Save Changes
        </Button>
        {brief.status === "draft" && (
          <Button
            onClick={handleApprove}
            disabled={approveBrief.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
        )}
      </div>
    </div>
  );
}

interface DailyBriefPreviewProps {
  brief: DailyBrief;
}

function DailyBriefPreview({ brief }: DailyBriefPreviewProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "lease_expiry":
        return <Calendar className="h-4 w-4" />;
      case "funded_company":
        return <TrendingUp className="h-4 w-4" />;
      case "competitor":
        return <Users className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 p-4 bg-muted/30 rounded-lg">
      <div className="text-center border-b pb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          Daily BD Intelligence
        </p>
        <h2 className="text-xl font-bold">{brief.headline}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {brief.city} • {format(new Date(brief.brief_date), "MMMM d, yyyy")}
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3 flex items-center gap-2">
          <Target className="h-4 w-4" />
          Top Signals
        </h3>
        <div className="space-y-3">
          {brief.top_signals.map((signal, index) => (
            <div key={index} className="flex gap-3 items-start">
              <div className="mt-1 text-muted-foreground">
                {getTypeIcon(signal.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm">{signal.signal}</p>
                <Badge className={`mt-1 ${getPriorityColor(signal.priority)}`} variant="secondary">
                  {signal.priority} priority
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {brief.micro_market_watch && brief.micro_market_watch.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Micro-Market Watch
          </h3>
          <div className="grid gap-2">
            {brief.micro_market_watch.map((item, index) => (
              <div key={index} className="bg-background p-3 rounded border">
                <p className="font-medium text-sm">{item.micro_market}</p>
                <p className="text-sm text-muted-foreground">{item.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {brief.competitor_movement && brief.competitor_movement.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Competitor Movement
          </h3>
          <div className="space-y-2">
            {brief.competitor_movement.map((item, index) => (
              <div key={index} className="bg-background p-3 rounded border">
                <p className="font-medium text-sm">{item.entity}</p>
                <p className="text-sm text-muted-foreground">{item.movement}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          What to Do Today
        </h3>
        <div className="space-y-2">
          {brief.suggested_actions.map((action, index) => (
            <div key={index} className="flex gap-3 items-start bg-background p-3 rounded border">
              <Badge
                variant={action.urgency === "today" ? "destructive" : "secondary"}
                className="shrink-0"
              >
                {action.urgency === "today"
                  ? "Today"
                  : action.urgency === "this_week"
                  ? "This Week"
                  : "Monitor"}
              </Badge>
              <p className="text-sm">{action.action}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground border-t pt-4">
        Internal Use Only • BD Accelerate
      </div>
    </div>
  );
}

export function DailyBriefDashboard() {
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedBrief, setSelectedBrief] = useState<DailyBrief | null>(null);
  const [previewBrief, setPreviewBrief] = useState<DailyBrief | null>(null);
  const { briefs, isLoading, generateBrief, deleteBrief } = useDailyBriefs(
    selectedCity || undefined
  );
  const { createCampaignFromBrief, isCreating } = useBriefToCampaign();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Approved</Badge>;
      case "sent":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Sent</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  const handleGenerate = (city: string) => {
    generateBrief.mutate({ city });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Daily Briefs</h2>
          <p className="text-muted-foreground">
            AI-generated intelligence summaries for BD teams
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedCity || "all"} onValueChange={(v) => setSelectedCity(v === "all" ? "" : v)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {CITIES.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {CITIES.map((city) => (
          <Card key={city} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{city}</span>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => handleGenerate(city)}
              disabled={generateBrief.isPending}
              className="w-full"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Today's Brief
            </Button>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading briefs...
        </div>
      ) : briefs.length === 0 ? (
        <Card className="p-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No Briefs Yet</h3>
          <p className="text-muted-foreground mb-4">
            Generate your first daily brief by clicking the button above
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {briefs.map((brief) => (
            <Card key={brief.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{brief.city}</Badge>
                    {getStatusBadge(brief.status)}
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(brief.brief_date), "MMM d, yyyy")}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg">{brief.headline}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {brief.top_signals.length} signals •{" "}
                    {brief.suggested_actions.length} actions
                  </p>
                </div>
                <div className="flex gap-2">
                  {brief.status === "approved" && !brief.campaign_id && (
                    <Button
                      size="sm"
                      onClick={() => createCampaignFromBrief.mutate(brief)}
                      disabled={isCreating}
                      className="bg-primary"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send to BD Team
                    </Button>
                  )}
                  {brief.campaign_id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.location.href = `/campaigns/${brief.campaign_id}`}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      View Campaign
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPreviewBrief(brief)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedBrief(brief)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Brief?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this daily brief.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteBrief.mutate(brief.id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedBrief} onOpenChange={() => setSelectedBrief(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Daily Brief</DialogTitle>
          </DialogHeader>
          {selectedBrief && (
            <DailyBriefEditor
              brief={selectedBrief}
              onClose={() => setSelectedBrief(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewBrief} onOpenChange={() => setPreviewBrief(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Brief Preview</DialogTitle>
          </DialogHeader>
          {previewBrief && <DailyBriefPreview brief={previewBrief} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
