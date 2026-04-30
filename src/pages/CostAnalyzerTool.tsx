import React, { useState } from "react";
import { Calculator, Building, TrendingUp, Info, ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer } from "recharts";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function CostAnalyzerTool() {
  // Shared state
  const [carpetArea, setCarpetArea] = useState(18000);
  const [activeTab, setActiveTab] = useState<"capex" | "commercial">("capex");
  
  // CAPEX Calculator State
  const [finishingType, setFinishingType] = useState<string>("");
  const [lockInMonths, setLockInMonths] = useState(36);
  const [capexCalculated, setCapexCalculated] = useState(false);
  const [capexResults, setCapexResults] = useState<{
    lumpSum: number;
    monthlyCAPEX: number;
    totalCAPEX: number;
    yearlyBreakdown: { year: number; months: number; amount: number; interest: string }[];
    finishingName: string;
    rate: number;
  } | null>(null);
  
  // Commercial Calculator State
  const [seats, setSeats] = useState(600);
  const [efficiency, setEfficiency] = useState(83);
  const [rentRate, setRentRate] = useState(75);
  const [camRate, setCamRate] = useState(11);
  const [capex, setCapex] = useState(250000);
  const [parking, setParking] = useState(50000);
  const [cafeteria, setCafeteria] = useState(50000);
  const [opexRate, setOpexRate] = useState(60);
  const [markup, setMarkup] = useState(20);
  const [buaMode, setBuaMode] = useState<"markup" | "efficiency" | "direct">("markup");
  const [buaMarkup, setBuaMarkup] = useState(30);
  const [directBUA, setDirectBUA] = useState(0);
  const [commercialCalculated, setCommercialCalculated] = useState(false);

  const finishingRates = {
    bareShell: { name: "Bare Shell", rate: 2700 },
    warmShell: { name: "Warm Shell", rate: 2100 },
    furnished: { name: "Furnished", rate: 500 }
  };

  // Calculate CAPEX
  const calculateCapex = () => {
    if (!carpetArea || !finishingType) {
      return;
    }
    const rate = finishingRates[finishingType as keyof typeof finishingRates].rate;
    const lumpSum = carpetArea * rate;
    const monthlyCAPEX = lumpSum / lockInMonths;
    const totalYears = Math.ceil(lockInMonths / 12);
    
    const yearlyBreakdown: { year: number; months: number; amount: number; interest: string }[] = [];
    let totalCAPEX = 0;
    let remainingMonths = lockInMonths;
    
    for (let year = 1; year <= totalYears; year++) {
      const monthsInYear = Math.min(12, remainingMonths);
      const yearAmount = year === 1 
        ? monthlyCAPEX * monthsInYear
        : monthlyCAPEX * monthsInYear * Math.pow(1.16, year - 1);
      
      yearlyBreakdown.push({
        year,
        months: monthsInYear,
        amount: yearAmount,
        interest: year > 1 ? '16% compounded' : 'No interest'
      });
      
      totalCAPEX += yearAmount;
      remainingMonths -= monthsInYear;
    }
    
    setCapexResults({
      lumpSum,
      monthlyCAPEX,
      totalCAPEX,
      yearlyBreakdown,
      finishingName: finishingRates[finishingType as keyof typeof finishingRates].name,
      rate
    });
    setCapexCalculated(true);
    setCapex(Math.round(monthlyCAPEX));
  };

  // Commercial calculations
  const round0 = (n: number) => Math.round(Number.isFinite(n) ? n : 0);
  const fmtINR = (n: number) => `₹${round0(n).toLocaleString('en-IN')}`;
  
  let computedBUA = 0;
  if (buaMode === 'markup') {
    computedBUA = carpetArea * (1 + buaMarkup / 100);
  } else if (buaMode === 'efficiency') {
    computedBUA = carpetArea * 100 / efficiency;
  } else {
    computedBUA = directBUA;
  }
  
  const bua = round0(computedBUA);
  const rent = round0(rentRate * bua);
  const cam = round0(camRate * bua);
  const opex = round0(opexRate * bua);
  const totalBase = rent + cam + opex + capex + parking + cafeteria;
  const factor = 1 + (markup / 100);
  const totalWithMarkup = round0(totalBase * factor);
  const perSeat = round0(totalWithMarkup / Math.max(1, seats));
  
  const pieData = [
    { name: "Rent", value: round0((rent * factor) / Math.max(1, seats)) },
    { name: "CAM", value: round0((cam * factor) / Math.max(1, seats)) },
    { name: "Opex", value: round0((opex * factor) / Math.max(1, seats)) },
    { name: "Capex", value: round0((capex * factor) / Math.max(1, seats)) },
    { name: "Parking", value: round0((parking * factor) / Math.max(1, seats)) },
    { name: "Cafeteria", value: round0((cafeteria * factor) / Math.max(1, seats)) }
  ];
  
  const COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "#8b5cf6", "#06b6d4"];

  return (
    <MainLayout>
      <div className="mx-auto max-w-[90rem] space-y-6 px-1">
        {/* Header */}
        <header className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Calculator className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-foreground">
              Cost Analyzer
            </h1>
            <p className="mt-0.5 text-[0.9375rem] text-muted-foreground">
              Complete workspace cost analysis tool
            </p>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex gap-2 rounded-xl bg-muted/50 p-1.5">
          <button
            onClick={() => setActiveTab("capex")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg py-3 px-4 text-[0.875rem] font-semibold transition-all duration-200",
              activeTab === "capex"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Building className="h-5 w-5" />
            CAPEX Calculator
          </button>
          <button
            onClick={() => setActiveTab("commercial")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg py-3 px-4 text-[0.875rem] font-semibold transition-all duration-200",
              activeTab === "commercial"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Calculator className="h-5 w-5" />
            Commercial Rent
          </button>
        </div>

        {/* Common Parameters */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Common Parameters</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-[0.8125rem]">Carpet Area (sq.ft)</Label>
              <Input
                type="number"
                value={carpetArea}
                onChange={(e) => setCarpetArea(+e.target.value)}
                className="mt-2 h-11 rounded-lg"
              />
            </div>
            {capexCalculated && capexResults && (
              <div className="rounded-xl bg-success/10 p-4 border border-success/20">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Monthly CAPEX (auto-filled)</p>
                <p className="mt-1 text-2xl font-bold text-success">{fmtINR(capexResults.monthlyCAPEX)}</p>
              </div>
            )}
          </div>
        </section>

        {/* CAPEX Calculator Tab */}
        {activeTab === "capex" && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Select Finishing Type</h3>
              <div className="grid gap-4 md:grid-cols-3">
                {Object.entries(finishingRates).map(([key, value]) => (
                  <div
                    key={key}
                    onClick={() => setFinishingType(key)}
                    className={cn(
                      "cursor-pointer rounded-xl border-2 p-4 transition-all duration-200",
                      finishingType === key
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{value.name}</span>
                      <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-sm font-bold text-primary">
                        ₹{value.rate}/sq.ft
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <Label className="text-[0.8125rem]">Lock-in Period (months)</Label>
              <Input
                type="number"
                value={lockInMonths}
                onChange={(e) => setLockInMonths(+e.target.value)}
                className="mt-2 h-11 rounded-lg"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Interest: 16% per annum after Year 1
              </p>
            </section>

            <Button
              onClick={calculateCapex}
              size="lg"
              className="w-full gap-2 rounded-xl py-6 text-base font-semibold"
              disabled={!finishingType}
            >
              <Calculator className="h-5 w-5" />
              Calculate CAPEX
            </Button>

            {capexCalculated && capexResults && (
              <div className="space-y-6 animate-fade-in">
                <div className="rounded-2xl bg-primary p-6 text-primary-foreground shadow-lg">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm opacity-80">Initial Lump Sum</p>
                      <p className="mt-1 text-3xl font-bold">{fmtINR(capexResults.lumpSum)}</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-80">Monthly CAPEX</p>
                      <p className="mt-1 text-3xl font-bold">{fmtINR(capexResults.monthlyCAPEX)}</p>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-primary-foreground/20 pt-4">
                    <p className="text-sm opacity-80">Total CAPEX (with interest)</p>
                    <p className="mt-1 text-4xl font-bold">{fmtINR(capexResults.totalCAPEX)}</p>
                  </div>
                </div>

                <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <h3 className="mb-4 text-lg font-semibold text-foreground">Yearly Breakdown</h3>
                  <div className="space-y-2">
                    {capexResults.yearlyBreakdown.map((item) => (
                      <div key={item.year} className="flex items-center justify-between rounded-xl bg-muted/50 p-4 transition-colors hover:bg-muted">
                        <div>
                          <p className="font-semibold text-foreground">Year {item.year}</p>
                          <p className="text-sm text-muted-foreground">{item.months} months | {item.interest}</p>
                        </div>
                        <p className="text-xl font-bold text-primary">{fmtINR(item.amount)}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <Info className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">Ready to calculate commercial rent?</p>
                    <button
                      onClick={() => setActiveTab("commercial")}
                      className="mt-1 flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      Go to Commercial Calculator <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Commercial Calculator Tab */}
        {activeTab === "commercial" && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Workspace Configuration</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label className="text-[0.8125rem]">Seats</Label>
                  <Input
                    type="number"
                    value={seats}
                    onChange={(e) => setSeats(+e.target.value)}
                    className="mt-2 h-11 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-[0.8125rem]">Rent Rate (per sq.ft)</Label>
                  <Input
                    type="number"
                    value={rentRate}
                    onChange={(e) => setRentRate(+e.target.value)}
                    className="mt-2 h-11 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-[0.8125rem]">CAM Rate (per sq.ft)</Label>
                  <Input
                    type="number"
                    value={camRate}
                    onChange={(e) => setCamRate(+e.target.value)}
                    className="mt-2 h-11 rounded-lg"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Monthly Costs</h3>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label className="text-[0.8125rem]">CAPEX (monthly)</Label>
                  <Input
                    type="number"
                    value={capex}
                    onChange={(e) => setCapex(+e.target.value)}
                    className="mt-2 h-11 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-[0.8125rem]">Parking</Label>
                  <Input
                    type="number"
                    value={parking}
                    onChange={(e) => setParking(+e.target.value)}
                    className="mt-2 h-11 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-[0.8125rem]">Cafeteria</Label>
                  <Input
                    type="number"
                    value={cafeteria}
                    onChange={(e) => setCafeteria(+e.target.value)}
                    className="mt-2 h-11 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-[0.8125rem]">Opex Rate (per sq.ft)</Label>
                  <Input
                    type="number"
                    value={opexRate}
                    onChange={(e) => setOpexRate(+e.target.value)}
                    className="mt-2 h-11 rounded-lg"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h3 className="mb-4 text-lg font-semibold text-foreground">BUA Calculation Mode</h3>
              <div className="space-y-3">
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200",
                    buaMode === 'markup' ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  )}
                  onClick={() => setBuaMode('markup')}
                >
                  <input
                    type="radio"
                    checked={buaMode === 'markup'}
                    onChange={() => setBuaMode('markup')}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="flex-1 font-medium text-foreground">Markup over Carpet (%)</span>
                  <Input
                    type="number"
                    value={buaMarkup}
                    onChange={(e) => setBuaMarkup(+e.target.value)}
                    className="h-9 w-20 rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                  />
                </label>
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200",
                    buaMode === 'efficiency' ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  )}
                  onClick={() => setBuaMode('efficiency')}
                >
                  <input
                    type="radio"
                    checked={buaMode === 'efficiency'}
                    onChange={() => setBuaMode('efficiency')}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="flex-1 font-medium text-foreground">Efficiency (%)</span>
                  <Input
                    type="number"
                    value={efficiency}
                    onChange={(e) => setEfficiency(+e.target.value)}
                    className="h-9 w-20 rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                  />
                </label>
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200",
                    buaMode === 'direct' ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  )}
                  onClick={() => setBuaMode('direct')}
                >
                  <input
                    type="radio"
                    checked={buaMode === 'direct'}
                    onChange={() => setBuaMode('direct')}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="flex-1 font-medium text-foreground">Direct BUA (sq.ft)</span>
                  <Input
                    type="number"
                    value={directBUA}
                    onChange={(e) => setDirectBUA(+e.target.value)}
                    className="h-9 w-24 rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                  />
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <Label className="text-[0.8125rem]">Overall Markup: {markup}%</Label>
              <input
                type="range"
                value={markup}
                onChange={(e) => setMarkup(+e.target.value)}
                min="0"
                max="50"
                className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
              </div>
            </section>

            <Button
              onClick={() => setCommercialCalculated(true)}
              size="lg"
              className="w-full gap-2 rounded-xl py-6 text-base font-semibold"
            >
              <Calculator className="h-5 w-5" />
              Calculate Commercial Rent
            </Button>

            {commercialCalculated && (
              <div className="space-y-6 animate-fade-in">
                <div className="rounded-2xl bg-primary p-6 text-primary-foreground shadow-lg">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm opacity-80">Carpet Area</p>
                      <p className="mt-1 text-2xl font-bold">{round0(carpetArea).toLocaleString('en-IN')} sq.ft</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-80">BUA</p>
                      <p className="mt-1 text-2xl font-bold">{bua.toLocaleString('en-IN')} sq.ft</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm opacity-80">Total (with {markup}% markup)</p>
                      <p className="mt-1 text-3xl font-bold">{fmtINR(totalWithMarkup)}</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-80">Per Seat Cost</p>
                      <p className="mt-1 text-3xl font-bold">{fmtINR(perSeat)}</p>
                    </div>
                  </div>
                </div>

                <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <h3 className="mb-4 text-lg font-semibold text-foreground">Per Seat Cost Breakdown</h3>
                  {(() => {
                    const sortedPieData = [...pieData].sort((a, b) => b.value - a.value);
                    const totalPerSeat = pieData.reduce((sum, item) => sum + item.value, 0);
                    const sortedColors = sortedPieData.map((item) => {
                      const originalIndex = pieData.findIndex((p) => p.name === item.name);
                      return COLORS[originalIndex];
                    });
                    
                    return (
                      <div className="flex flex-col gap-6 lg:flex-row">
                        <div className="relative flex-1">
                          <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                              <Pie
                                data={sortedPieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={115}
                                dataKey="value"
                                paddingAngle={2}
                                strokeWidth={2}
                                stroke="hsl(var(--background))"
                              >
                                {sortedPieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={sortedColors[index]} />
                                ))}
                              </Pie>
                              <ReTooltip 
                                content={({ active, payload }) => {
                                  if (!active || !payload?.length) return null;
                                  const item = payload[0];
                                  const percentage = ((item.value as number) / totalPerSeat * 100).toFixed(1);
                                  return (
                                    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
                                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                                      <p className="text-lg font-bold text-foreground">{fmtINR(item.value as number)}</p>
                                      <p className="text-xs text-muted-foreground">{percentage}% of total</p>
                                    </div>
                                  );
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          {/* Center Label */}
                          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-foreground">{fmtINR(perSeat)}</span>
                            <span className="text-sm text-muted-foreground">Per Seat</span>
                          </div>
                        </div>
                        <div className="flex-1 space-y-2">
                          {sortedPieData.map((item, index) => {
                            const percentage = ((item.value / totalPerSeat) * 100).toFixed(1);
                            return (
                              <div 
                                key={item.name} 
                                className="flex items-center justify-between rounded-xl bg-muted/50 p-3 transition-colors hover:bg-muted"
                              >
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="h-3 w-3 rounded-full" 
                                    style={{ backgroundColor: sortedColors[index] }} 
                                  />
                                  <span className="font-medium text-foreground">{item.name}</span>
                                  <span className="text-xs text-muted-foreground">({percentage}%)</span>
                                </div>
                                <span className="font-bold tabular-nums text-foreground">{fmtINR(item.value)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </section>

                <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <h3 className="mb-4 text-lg font-semibold text-foreground">Monthly Breakdown (before markup)</h3>
                  <div className="space-y-2">
                    {[
                      { name: "Rent", value: rent },
                      { name: "CAM", value: cam },
                      { name: "Opex", value: opex },
                      { name: "Capex", value: capex },
                      { name: "Parking", value: parking },
                      { name: "Cafeteria", value: cafeteria },
                    ].map((item) => (
                      <div key={item.name} className="flex justify-between rounded-xl bg-muted/50 p-3">
                        <span className="text-muted-foreground">{item.name}</span>
                        <span className="font-bold text-foreground">{fmtINR(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
