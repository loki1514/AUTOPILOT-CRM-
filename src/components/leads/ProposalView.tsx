import { format } from 'date-fns';
import { FileText, Download, Share2, Building, MapPin, Users, Calendar, IndianRupee, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StageBadge } from '@/components/ui/stage-badge';
import type { Lead, Requirement, SpaceCalculation, CostAnalysis } from '@/types';

interface ProposalViewProps {
  lead: Lead;
  requirement?: Requirement | null;
  spaceCalc?: SpaceCalculation | null;
  costAnalysis?: CostAnalysis | null;
}

export function ProposalView({ lead, requirement, spaceCalc, costAnalysis }: ProposalViewProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);

  const isComplete = requirement && spaceCalc && costAnalysis;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Proposal Summary</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {!isComplete && (
        <div className="rounded-lg border border-warning bg-warning/10 p-4">
          <p className="text-sm text-warning-foreground">
            Complete all sections (Requirements, Space Calculator, Cost Analyzer) to generate a full proposal.
          </p>
        </div>
      )}

      <div className="rounded-xl border bg-card shadow-card overflow-hidden">
        {/* Header */}
        <div className="bg-primary/5 border-b p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{lead.company}</h2>
              <p className="text-muted-foreground mt-1">Prepared for: {lead.client_name}</p>
            </div>
            <StageBadge stage={lead.stage} />
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Generated on {format(new Date(), 'dd MMM yyyy')}
          </p>
        </div>

        {/* Client Info */}
        <div className="p-6 border-b">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Building className="h-4 w-4 text-primary" />
            Client Information
          </h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Contact</p>
              <p className="font-medium">{lead.client_name}</p>
            </div>
            {lead.email && (
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{lead.email}</p>
              </div>
            )}
            {lead.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{lead.phone}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Headcount</p>
              <p className="font-medium">{lead.headcount} people</p>
            </div>
          </div>
        </div>

        {/* Requirements */}
        {requirement && (
          <div className="p-6 border-b">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Requirements
            </h4>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">City</p>
                <p className="font-medium">{requirement.city}</p>
              </div>
              {requirement.micro_market && (
                <div>
                  <p className="text-sm text-muted-foreground">Micro-market</p>
                  <p className="font-medium">{requirement.micro_market}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Target Seats</p>
                <p className="font-medium">{requirement.target_seats}</p>
              </div>
              {requirement.preferred_move_in && (
                <div>
                  <p className="text-sm text-muted-foreground">Move-in Date</p>
                  <p className="font-medium">
                    {format(new Date(requirement.preferred_move_in), 'dd MMM yyyy')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Space Summary */}
        {spaceCalc && (
          <div className="p-6 border-b">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Grid3X3 className="h-4 w-4 text-primary" />
              Space Summary
            </h4>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">Total Carpet Area</p>
                <p className="text-xl font-semibold">{spaceCalc.total_carpet_area.toLocaleString()} sqft</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">Total Seats</p>
                <p className="text-xl font-semibold">{spaceCalc.total_seats}</p>
              </div>
            </div>
            <div className="space-y-2">
              {spaceCalc.modules.map((module, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span>{module.name}</span>
                  <span className="text-muted-foreground">
                    {module.quantity}x • {module.area_sqft} sqft
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cost Summary */}
        {costAnalysis && (
          <div className="p-6">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-primary" />
              Cost Summary
            </h4>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-primary/5 border-2 border-primary p-4">
                <p className="text-sm text-muted-foreground">Monthly Cost</p>
                <p className="text-2xl font-semibold">
                  {formatCurrency(costAnalysis.total_monthly_cost ?? 0)}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">Cost per Seat</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(costAnalysis.cost_per_seat ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">per month</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">Fit-out Cost</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(costAnalysis.total_fitout_cost ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">one-time</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">Rate Assumptions</p>
                <p className="text-sm">Rent: ₹{costAnalysis.rent_per_sqft}/sqft</p>
                <p className="text-sm">OPEX: ₹{costAnalysis.opex_per_sqft}/sqft</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
