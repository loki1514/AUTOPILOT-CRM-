import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Plus, Trash2, TrendingUp, Target } from "lucide-react";
import {
  useIntentIndicators,
  type IntentIndicator,
} from "@/hooks/useIntentIndicators";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function IntentIndicators() {
  const { indicators, isLoading, seedDefaults, create, update, remove } =
    useIntentIndicators();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<IntentIndicator>>({
    name: "",
    description: "",
    category: "general",
    weight: 15,
  });

  const totalWeight = indicators
    .filter((i) => i.is_active)
    .reduce((sum, i) => sum + i.weight, 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Target className="h-7 w-7 text-primary" />
              Intent Indicators
            </h1>
            <p className="text-muted-foreground">
              Tune which signals matter and how much they contribute to a lead's
              intent score.
            </p>
          </div>
          <div className="flex gap-2">
            {indicators.length === 0 && (
              <Button
                variant="outline"
                onClick={() => seedDefaults.mutate()}
                disabled={seedDefaults.isPending}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Seed defaults
              </Button>
            )}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New indicator
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create indicator</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Name</Label>
                    <Input
                      value={draft.name || ""}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, name: e.target.value }))
                      }
                      placeholder="e.g. CXO change"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea
                      value={draft.description || ""}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, description: e.target.value }))
                      }
                      placeholder="When does this signal trigger?"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Weight: {draft.weight}</Label>
                    <Slider
                      value={[draft.weight || 15]}
                      max={50}
                      min={1}
                      step={1}
                      onValueChange={(v) =>
                        setDraft((d) => ({ ...d, weight: v[0] }))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      await create.mutateAsync(draft);
                      setOpen(false);
                      setDraft({ name: "", description: "", category: "general", weight: 15 });
                    }}
                    disabled={!draft.name}
                  >
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground uppercase">Active indicators</div>
              <div className="text-2xl font-bold mt-1">
                {indicators.filter((i) => i.is_active).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground uppercase">Total active weight</div>
              <div className="text-2xl font-bold mt-1">{totalWeight}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground uppercase">Avg conv. rate</div>
              <div className="text-2xl font-bold mt-1">
                {indicators.length > 0
                  ? `${Math.round(
                      (indicators.reduce(
                        (s, i) =>
                          s +
                          (i.signals_detected
                            ? (i.signals_converted / i.signals_detected) * 100
                            : 0),
                        0,
                      ) /
                        indicators.length) *
                        10,
                    ) / 10}%`
                  : "—"}
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              Loading…
            </CardContent>
          </Card>
        ) : indicators.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center space-y-3">
              <Target className="h-10 w-10 mx-auto text-muted-foreground" />
              <div className="font-semibold">No indicators yet</div>
              <p className="text-sm text-muted-foreground">
                Seed our recommended defaults or create your own.
              </p>
              <Button onClick={() => seedDefaults.mutate()}>
                <Sparkles className="h-4 w-4 mr-2" />
                Seed defaults
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {indicators.map((ind) => (
              <IndicatorRow
                key={ind.id}
                indicator={ind}
                onUpdate={(patch) => update.mutate({ id: ind.id, ...patch })}
                onDelete={() => remove.mutate(ind.id)}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function IndicatorRow({
  indicator,
  onUpdate,
  onDelete,
}: {
  indicator: IntentIndicator;
  onUpdate: (patch: Partial<IntentIndicator>) => void;
  onDelete: () => void;
}) {
  const conv = indicator.signals_detected
    ? Math.round(
        (indicator.signals_converted / indicator.signals_detected) * 100,
      )
    : null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4 flex-wrap">
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${indicator.color}20`, color: indicator.color }}
          >
            <Sparkles className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{indicator.name}</span>
              <Badge variant="outline" className="text-xs">
                {indicator.category}
              </Badge>
            </div>
            {indicator.description && (
              <div className="text-sm text-muted-foreground mt-0.5">
                {indicator.description}
              </div>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {indicator.signals_detected} detected
              </span>
              {conv !== null && (
                <span>
                  {indicator.signals_converted} converted ({conv}%)
                </span>
              )}
            </div>
          </div>

          <div className="w-48 space-y-1">
            <div className="text-xs text-muted-foreground flex justify-between">
              <span>Weight</span>
              <span className="font-semibold text-foreground">+{indicator.weight}</span>
            </div>
            <Slider
              value={[indicator.weight]}
              max={50}
              min={1}
              step={1}
              onValueChange={(v) => onUpdate({ weight: v[0] })}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={indicator.is_active}
              onCheckedChange={(v) => onUpdate({ is_active: v })}
            />
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}