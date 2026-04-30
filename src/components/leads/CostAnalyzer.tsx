import { useState, useMemo, useEffect } from 'react';
import { Save, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CostAnalysis, SpaceCalculation } from '@/types';

interface CostAnalyzerProps {
  analysis?: CostAnalysis | null;
  spaceCalc?: SpaceCalculation | null;
  leadId: string;
  onSave: (data: Omit<CostAnalysis, 'created_at' | 'updated_at'>) => void;
  isLoading?: boolean;
}

export function CostAnalyzer({
  analysis,
  spaceCalc,
  leadId,
  onSave,
  isLoading,
}: CostAnalyzerProps) {
  const [rentPerSqft, setRentPerSqft] = useState(analysis?.rent_per_sqft ?? 80);
  const [opexPerSqft, setOpexPerSqft] = useState(analysis?.opex_per_sqft ?? 20);
  const [fitoutPerSqft, setFitoutPerSqft] = useState(analysis?.fitout_per_sqft ?? 1500);

  useEffect(() => {
    if (analysis) {
      setRentPerSqft(analysis.rent_per_sqft);
      setOpexPerSqft(analysis.opex_per_sqft);
      setFitoutPerSqft(analysis.fitout_per_sqft);
    }
  }, [analysis]);

  const calculations = useMemo(() => {
    if (!spaceCalc) return null;

    const totalArea = spaceCalc.total_carpet_area;
    const totalSeats = spaceCalc.total_seats;

    if (totalSeats === 0) return null;

    const monthlyRent = totalArea * rentPerSqft;
    const monthlyOpex = totalArea * opexPerSqft;
    const totalMonthlyCost = monthlyRent + monthlyOpex;
    const costPerSeat = totalMonthlyCost / totalSeats;
    const totalFitoutCost = totalArea * fitoutPerSqft;

    return {
      totalArea,
      totalSeats,
      monthlyRent,
      monthlyOpex,
      totalMonthlyCost,
      costPerSeat,
      totalFitoutCost,
    };
  }, [spaceCalc, rentPerSqft, opexPerSqft, fitoutPerSqft]);

  const handleSave = () => {
    if (!calculations) return;

    onSave({
      id: analysis?.id,
      lead_id: leadId,
      rent_per_sqft: rentPerSqft,
      opex_per_sqft: opexPerSqft,
      fitout_per_sqft: fitoutPerSqft,
      cost_per_seat: calculations.costPerSeat,
      total_monthly_cost: calculations.totalMonthlyCost,
      total_fitout_cost: calculations.totalFitoutCost,
    });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);

  if (!spaceCalc || spaceCalc.total_seats === 0) {
    return (
      <div className="rounded-lg border bg-muted/50 p-6 text-center">
        <p className="text-muted-foreground">
          Complete the Space Calculator first to enable cost analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="rent">Rent (₹/sqft/month)</Label>
          <Input
            id="rent"
            type="number"
            value={rentPerSqft}
            onChange={(e) => setRentPerSqft(Number(e.target.value))}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="opex">OPEX (₹/sqft/month)</Label>
          <Input
            id="opex"
            type="number"
            value={opexPerSqft}
            onChange={(e) => setOpexPerSqft(Number(e.target.value))}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="fitout">Fit-out (₹/sqft)</Label>
          <Input
            id="fitout"
            type="number"
            value={fitoutPerSqft}
            onChange={(e) => setFitoutPerSqft(Number(e.target.value))}
            className="mt-1"
          />
        </div>
      </div>

      {calculations && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm font-medium text-muted-foreground">Monthly Rent</p>
            <p className="mt-1 text-xl font-semibold">{formatCurrency(calculations.monthlyRent)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm font-medium text-muted-foreground">Monthly OPEX</p>
            <p className="mt-1 text-xl font-semibold">{formatCurrency(calculations.monthlyOpex)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm font-medium text-muted-foreground">Cost per Seat</p>
            <p className="mt-1 text-xl font-semibold">{formatCurrency(calculations.costPerSeat)}</p>
            <p className="text-xs text-muted-foreground">per month</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm font-medium text-muted-foreground">Total Fit-out</p>
            <p className="mt-1 text-xl font-semibold">{formatCurrency(calculations.totalFitoutCost)}</p>
            <p className="text-xs text-muted-foreground">one-time</p>
          </div>
        </div>
      )}

      {calculations && (
        <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Monthly Cost</p>
              <p className="mt-1 text-3xl font-semibold flex items-center gap-1">
                <IndianRupee className="h-6 w-6" />
                {calculations.totalMonthlyCost.toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-muted-foreground">
                {calculations.totalArea.toLocaleString()} sqft • {calculations.totalSeats} seats
              </p>
            </div>
            <Button onClick={handleSave} disabled={isLoading} className="gap-2">
              <Save className="h-4 w-4" />
              {isLoading ? 'Saving...' : 'Save Analysis'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
