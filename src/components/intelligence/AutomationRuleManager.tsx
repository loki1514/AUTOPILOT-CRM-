import { useState } from "react";
import { useAutomationRules, AutomationRule } from "@/hooks/useAutomationRules";
import { useSenderProfiles } from "@/hooks/useSenderProfiles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogTrigger,
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
  Clock,
  Plus,
  Play,
  Pause,
  Trash2,
  AlertTriangle,
  Zap,
  Calendar,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";

const CITIES = ["Bangalore", "Mumbai", "Delhi/Noida", "Indore"];
const RULE_TYPES = [
  { value: "daily_brief", label: "Daily BD Brief" },
  { value: "weekly_newsletter", label: "Weekly Newsletter" },
];

interface RuleFormProps {
  rule?: AutomationRule;
  onClose: () => void;
}

function RuleForm({ rule, onClose }: RuleFormProps) {
  const { createRule, updateRule } = useAutomationRules();
  const { profiles } = useSenderProfiles();
  const [name, setName] = useState(rule?.name || "");
  const [ruleType, setRuleType] = useState(rule?.rule_type || "daily_brief");
  const [cities, setCities] = useState<string[]>(rule?.cities || []);
  const [senderProfileId, setSenderProfileId] = useState<string | null>(
    rule?.sender_profile_id || null
  );
  const [scheduleTime, setScheduleTime] = useState(rule?.schedule_time || "07:00");
  const [autoApprove, setAutoApprove] = useState(rule?.auto_approve || false);

  const handleCityToggle = (city: string) => {
    setCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  const handleSubmit = () => {
    const data = {
      name,
      rule_type: ruleType,
      cities,
      sender_profile_id: senderProfileId,
      schedule_time: scheduleTime,
      auto_approve: autoApprove,
      is_active: rule?.is_active ?? true,
    };

    if (rule) {
      updateRule.mutate({ id: rule.id, ...data }, { onSuccess: onClose });
    } else {
      createRule.mutate(data, { onSuccess: onClose });
    }
  };

  const isValid = name && ruleType && cities.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <Label>Rule Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Daily Bangalore Brief"
          className="mt-1"
        />
      </div>

      <div>
        <Label>Automation Type</Label>
        <Select value={ruleType} onValueChange={setRuleType}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RULE_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-2 block">Cities</Label>
        <div className="flex flex-wrap gap-3">
          {CITIES.map((city) => (
            <div key={city} className="flex items-center gap-2">
              <Checkbox
                id={`city-${city}`}
                checked={cities.includes(city)}
                onCheckedChange={() => handleCityToggle(city)}
              />
              <label
                htmlFor={`city-${city}`}
                className="text-sm cursor-pointer"
              >
                {city}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Sender Profile (Optional)</Label>
        <Select
          value={senderProfileId || "none"}
          onValueChange={(v) => setSenderProfileId(v === "none" ? null : v)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select sender profile" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No sender profile</SelectItem>
            {profiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                {profile.name} ({profile.from_email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Schedule Time</Label>
        <Input
          type="time"
          value={scheduleTime}
          onChange={(e) => setScheduleTime(e.target.value)}
          className="mt-1 w-40"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Runs Monday-Friday at this time
        </p>
      </div>

      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div>
          <p className="font-medium flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Auto-Approve
          </p>
          <p className="text-sm text-muted-foreground">
            Skip manual approval for internal emails
          </p>
        </div>
        <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
      </div>

      {autoApprove && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Auto-approval is only for internal BD emails. External recipients
            still require manual approval.
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!isValid}>
          {rule ? "Update Rule" : "Create Rule"}
        </Button>
      </div>
    </div>
  );
}

export function AutomationRuleManager() {
  const { rules, isLoading, toggleRule, deleteRule } = useAutomationRules();
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

  const getRuleTypeLabel = (type: string) => {
    return RULE_TYPES.find((t) => t.value === type)?.label || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automation Rules</h2>
          <p className="text-muted-foreground">
            Configure scheduled brief generation and delivery
          </p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Automation Rule</DialogTitle>
            </DialogHeader>
            <RuleForm onClose={() => setShowForm(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading rules...
        </div>
      ) : rules.length === 0 ? (
        <Card className="p-12 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No Automation Rules</h3>
          <p className="text-muted-foreground mb-4">
            Create a rule to automatically generate and send daily briefs
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Rule
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{rule.name}</h3>
                    <Badge variant={rule.is_active ? "default" : "secondary"}>
                      {rule.is_active ? "Active" : "Paused"}
                    </Badge>
                    {rule.auto_approve && (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                        <Zap className="h-3 w-3 mr-1" />
                        Auto-Approve
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {getRuleTypeLabel(rule.rule_type)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {rule.schedule_time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {rule.cities.join(", ")}
                    </span>
                    {rule.last_run_at && (
                      <span>
                        Last run: {format(new Date(rule.last_run_at), "MMM d, HH:mm")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      toggleRule.mutate({ id: rule.id, is_active: !rule.is_active })
                    }
                  >
                    {rule.is_active ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingRule(rule)}
                  >
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Rule?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this automation rule.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteRule.mutate(rule.id)}
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

      <Dialog open={!!editingRule} onOpenChange={() => setEditingRule(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Automation Rule</DialogTitle>
          </DialogHeader>
          {editingRule && (
            <RuleForm rule={editingRule} onClose={() => setEditingRule(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
