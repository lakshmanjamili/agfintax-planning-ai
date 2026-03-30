"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingDown,
  BarChart3,
  Sparkles,
  ArrowRight,
  Layers,
  Target,
  CheckCircle2,
  ChevronRight,
  PiggyBank,
  Shield,
} from "lucide-react";
import {
  getPlan,
  getEntityType,
  getEntityInfo,
  type SavedPlan,
  type EntityType,
} from "@/lib/tax/plan-store";

/* ─── Tax bracket estimator (simplified federal 2024) ─── */
function estimateEffectiveTaxRate(income: number, filingStatus: string): number {
  // Simplified 2024 federal brackets
  const brackets =
    filingStatus === "mfj"
      ? [
          { limit: 23200, rate: 0.10 },
          { limit: 94300, rate: 0.12 },
          { limit: 201050, rate: 0.22 },
          { limit: 383900, rate: 0.24 },
          { limit: 487450, rate: 0.32 },
          { limit: 731200, rate: 0.35 },
          { limit: Infinity, rate: 0.37 },
        ]
      : [
          { limit: 11600, rate: 0.10 },
          { limit: 47150, rate: 0.12 },
          { limit: 100525, rate: 0.22 },
          { limit: 191950, rate: 0.24 },
          { limit: 243725, rate: 0.32 },
          { limit: 609350, rate: 0.35 },
          { limit: Infinity, rate: 0.37 },
        ];

  let tax = 0;
  let prev = 0;
  for (const b of brackets) {
    if (income <= prev) break;
    const taxable = Math.min(income, b.limit) - prev;
    tax += taxable * b.rate;
    prev = b.limit;
  }
  return income > 0 ? tax / income : 0;
}

function parseIncome(incomeStr: string): number {
  const cleaned = incomeStr.replace(/[^0-9KkMm.]/g, "").toUpperCase();
  if (cleaned.includes("M")) return parseFloat(cleaned) * 1_000_000 || 500000;
  if (cleaned.includes("K")) return parseFloat(cleaned) * 1_000 || 100000;
  const n = parseInt(cleaned);
  return n > 0 ? n : 100000;
}

function formatCurrency(amount: number): string {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k`;
  }
  return `$${amount.toLocaleString()}`;
}

function formatCurrencyFull(amount: number): string {
  return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

/* ─── Category grouping helper ─── */
interface CategoryGroup {
  category: string;
  totalSavings: number;
  strategies: SavedPlan["strategies"];
}

function groupByCategory(strategies: SavedPlan["strategies"]): CategoryGroup[] {
  const map = new Map<string, CategoryGroup>();
  for (const s of strategies) {
    const cat = s.category || "General";
    if (!map.has(cat)) {
      map.set(cat, { category: cat, totalSavings: 0, strategies: [] });
    }
    const g = map.get(cat)!;
    g.totalSavings += s.estimatedSavings;
    g.strategies.push(s);
  }
  return Array.from(map.values()).sort((a, b) => b.totalSavings - a.totalSavings);
}

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function SavingsPage() {
  const [{ plan, entityType }] = useState(() => {
    if (typeof window === "undefined") {
      return { plan: null as SavedPlan | null, entityType: null as EntityType | null };
    }
    const savedPlan = getPlan();
    const savedEntity = getEntityType();
    return {
      plan: savedPlan,
      entityType: savedEntity || savedPlan?.entityType || null,
    };
  });

  const entityInfo = entityType ? getEntityInfo(entityType) : null;

  // Derived data from plan
  const categoryGroups = useMemo(() => (plan ? groupByCategory(plan.strategies) : []), [plan]);
  const maxCategorySavings = useMemo(
    () => Math.max(...categoryGroups.map((g) => g.totalSavings), 1),
    [categoryGroups]
  );
  const uniqueCategories = categoryGroups.length;

  // Tax rate impact calculation
  const taxImpact = useMemo(() => {
    if (!plan) return null;
    const income = parseIncome(plan.profile.income);
    const filingStatus = plan.profile.filingStatus || "single";
    const currentRate = estimateEffectiveTaxRate(income, filingStatus);
    const reducedRate = estimateEffectiveTaxRate(income - plan.totalSavings, filingStatus);
    const currentTax = income * currentRate;
    const reducedTax = (income - plan.totalSavings) * reducedRate;
    return {
      income,
      currentRate,
      reducedRate,
      currentTax,
      reducedTax,
      taxSaved: currentTax - reducedTax,
      rateReduction: currentRate - reducedRate,
    };
  }, [plan]);

  // Top 3 strategies by savings for action items
  const topStrategies = useMemo(() => {
    if (!plan) return [];
    return [...plan.strategies].sort((a, b) => b.estimatedSavings - a.estimatedSavings).slice(0, 3);
  }, [plan]);

  /* ─── No Plan CTA ─── */
  if (!plan) {
    return (
      <div className="min-h-screen bg-[#0E0E12] flex items-center justify-center px-6">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 rounded-2xl bg-[#DC5700]/10 flex items-center justify-center mx-auto mb-8">
            <PiggyBank className="w-10 h-10 text-[#DC5700]" />
          </div>
          <h1 className="text-3xl font-bold text-[#E4E1E9] mb-4 tracking-tight">
            No Savings Data Yet
          </h1>
          <p className="text-[#908F9C] text-lg mb-8 leading-relaxed">
            Generate your Smart Plan first to see savings analysis.
            We&apos;ll break down every strategy, category, and dollar of potential savings.
          </p>
          <Link
            href="/dashboard/smart-plan"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#DC5700] text-white font-semibold hover:bg-[#DC5700]/90 transition-colors"
          >
            <Sparkles className="w-5 h-5" />
            Generate Your Smart Plan
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  /* ─── Main Savings Dashboard ─── */
  const savingsRate = taxImpact && taxImpact.income > 0
    ? Math.round((plan.totalSavings / taxImpact.income) * 100)
    : 0;

  const planDate = new Date(plan.createdAt);
  const formattedDate = planDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#0E0E12] text-[#E4E1E9]">
      {/* ─── Header ─── */}
      <header className="px-6 md:px-8 pt-12 pb-10 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Your Tax Savings Analysis
              </h1>
              {entityInfo && (
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: `${entityInfo.color}15`,
                    color: entityInfo.color,
                    border: `1px solid ${entityInfo.color}30`,
                  }}
                >
                  {entityInfo.label} &middot; {entityInfo.formNumber}
                </span>
              )}
            </div>
            <p className="text-[#908F9C] text-sm">
              Based on your Smart Plan generated {formattedDate} &middot;{" "}
              {plan.strategies.length} strategies identified
            </p>
          </div>
          <Link
            href="/dashboard/smart-plan"
            className="text-sm text-[#FFB596] hover:text-[#DC5700] transition-colors flex items-center gap-1 shrink-0"
          >
            Update Plan <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <div className="px-6 md:px-8 max-w-7xl mx-auto space-y-8 pb-16">
        {/* ═══ Summary Cards ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Savings */}
          <div className="rounded-2xl p-6 bg-[#1B1B20] border border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-[#FFB596]" />
              <p className="text-[10px] font-bold tracking-[0.2em] text-[#908F9C] uppercase">
                Total Estimated Savings
              </p>
            </div>
            <span className="text-3xl md:text-4xl font-bold tracking-tight block mb-2">
              {formatCurrencyFull(plan.totalSavings)}
            </span>
            <p className="text-xs text-[#908F9C]">
              Across {plan.strategies.length} strategies
            </p>
          </div>

          {/* Strategy Count */}
          <div className="rounded-2xl p-6 bg-[#1B1B20] border border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-[#FFB596]" />
              <p className="text-[10px] font-bold tracking-[0.2em] text-[#908F9C] uppercase">
                Strategies Identified
              </p>
            </div>
            <span className="text-3xl md:text-4xl font-bold tracking-tight block mb-2">
              {plan.strategies.length}
            </span>
            <p className="text-xs text-[#908F9C]">
              In {uniqueCategories} {uniqueCategories === 1 ? "category" : "categories"}
            </p>
          </div>

          {/* Savings Rate */}
          <div className="rounded-2xl p-6 bg-[#1B1B20] border border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-[#FFB596]" />
              <p className="text-[10px] font-bold tracking-[0.2em] text-[#908F9C] uppercase">
                Savings Rate
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-3xl md:text-4xl font-bold tracking-tight">{savingsRate}%</span>
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                <circle
                  cx="24" cy="24" r="20" fill="none"
                  stroke="#FFB596" strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={`${(savingsRate / 100) * 2 * Math.PI * 20} ${2 * Math.PI * 20}`}
                />
              </svg>
            </div>
            <p className="text-xs text-[#908F9C] mt-1">Of gross income</p>
          </div>

          {/* Tax Rate Impact */}
          <div className="rounded-2xl p-6 bg-[#1B1B20] border border-white/5 border-l-4 border-l-[#FFB596]">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-[#FFB596]" />
              <p className="text-[10px] font-bold tracking-[0.2em] text-[#908F9C] uppercase">
                Rate Reduction
              </p>
            </div>
            {taxImpact && (
              <>
                <span className="text-3xl md:text-4xl font-bold tracking-tight text-[#FFB596] block mb-2">
                  {(taxImpact.rateReduction * 100).toFixed(1)}%
                </span>
                <p className="text-xs text-[#908F9C]">
                  {(taxImpact.currentRate * 100).toFixed(1)}% &rarr; {(taxImpact.reducedRate * 100).toFixed(1)}% effective
                </p>
              </>
            )}
          </div>
        </div>

        {/* ═══ Main Grid ═══ */}
        <div className="grid grid-cols-12 gap-6">
          {/* ─── Left: Strategies + Category Breakdown ─── */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Tax Rate Impact Detail */}
            {taxImpact && (
              <div className="rounded-2xl p-6 md:p-8 bg-[#1B1B20] border border-white/5">
                <h2 className="text-lg font-bold tracking-tight mb-6 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#FFB596]" />
                  Tax Rate Impact
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs text-[#908F9C] uppercase tracking-wider mb-1">
                      Gross Income
                    </p>
                    <p className="text-2xl font-bold">{formatCurrencyFull(taxImpact.income)}</p>
                    <p className="text-xs text-[#908F9C] mt-1">
                      {plan.profile.filingStatus === "mfj" ? "Married Filing Jointly" :
                       plan.profile.filingStatus === "hoh" ? "Head of Household" :
                       plan.profile.filingStatus === "single" ? "Single" :
                       plan.profile.filingStatus}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#908F9C] uppercase tracking-wider mb-1">
                      Est. Tax Before
                    </p>
                    <p className="text-2xl font-bold text-[#FFB4AB]">
                      {formatCurrencyFull(Math.round(taxImpact.currentTax))}
                    </p>
                    <p className="text-xs text-[#908F9C] mt-1">
                      {(taxImpact.currentRate * 100).toFixed(1)}% effective rate
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#908F9C] uppercase tracking-wider mb-1">
                      Est. Tax After
                    </p>
                    <p className="text-2xl font-bold text-green-400">
                      {formatCurrencyFull(Math.round(taxImpact.reducedTax))}
                    </p>
                    <p className="text-xs text-[#908F9C] mt-1">
                      {(taxImpact.reducedRate * 100).toFixed(1)}% effective rate
                    </p>
                  </div>
                </div>
                {/* Visual bar */}
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-xs text-[#908F9C]">
                    <span>Before planning</span>
                    <span>{formatCurrencyFull(Math.round(taxImpact.currentTax))}</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-[#FFB4AB]/60"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-[#908F9C]">
                    <span>After planning</span>
                    <span>{formatCurrencyFull(Math.round(taxImpact.reducedTax))}</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-green-400/60"
                      style={{
                        width: taxImpact.currentTax > 0
                          ? `${(taxImpact.reducedTax / taxImpact.currentTax) * 100}%`
                          : "0%",
                      }}
                    />
                  </div>
                  <p className="text-xs text-[#FFB596] font-semibold mt-1">
                    Estimated savings of {formatCurrencyFull(Math.round(taxImpact.taxSaved))} in federal tax
                  </p>
                </div>
              </div>
            )}

            {/* Savings by Category */}
            <div className="rounded-2xl p-6 md:p-8 bg-[#1B1B20] border border-white/5">
              <h2 className="text-lg font-bold tracking-tight mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#FFB596]" />
                Savings by Category
              </h2>
              <div className="space-y-4">
                {categoryGroups.map((group) => {
                  const pct = Math.round((group.totalSavings / maxCategorySavings) * 100);
                  return (
                    <div key={group.category}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm text-[#C7C5D3]">
                          {group.category}
                          <span className="text-[#908F9C] ml-2 text-xs">
                            ({group.strategies.length} {group.strategies.length === 1 ? "strategy" : "strategies"})
                          </span>
                        </span>
                        <span className="text-sm font-semibold text-[#E4E1E9]">
                          {formatCurrency(group.totalSavings)}
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: "linear-gradient(90deg, #DC5700, #FFB596)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strategy Breakdown */}
            <div className="rounded-2xl p-6 md:p-8 bg-[#1B1B20] border border-white/5">
              <h2 className="text-lg font-bold tracking-tight mb-6 flex items-center gap-2">
                <Target className="w-5 h-5 text-[#FFB596]" />
                Strategy Breakdown
              </h2>
              <div className="space-y-4">
                {plan.strategies.map((strategy, idx) => {
                  const rangePct =
                    strategy.savingsMax > 0
                      ? ((strategy.estimatedSavings - strategy.savingsMin) /
                          (strategy.savingsMax - strategy.savingsMin || 1)) *
                        100
                      : 50;

                  return (
                    <div
                      key={idx}
                      className="rounded-xl p-5 bg-[#0E0E12] border border-white/5 hover:border-[#DC5700]/20 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-bold text-[#E4E1E9]">
                              {strategy.title}
                            </h3>
                            <span className="text-[9px] font-bold tracking-[0.1em] text-[#FFB596] bg-[#FFB596]/10 px-2 py-0.5 rounded uppercase">
                              {strategy.category}
                            </span>
                          </div>
                          <p className="text-xs text-[#908F9C] leading-relaxed">
                            {strategy.description}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xl font-bold text-[#FFB596]">
                            {formatCurrencyFull(strategy.estimatedSavings)}
                          </span>
                          <p className="text-[10px] text-[#908F9C]">estimated savings</p>
                        </div>
                      </div>

                      {/* Savings range bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] text-[#908F9C] mb-1">
                          <span>{formatCurrencyFull(strategy.savingsMin)}</span>
                          <span>{formatCurrencyFull(strategy.savingsMax)}</span>
                        </div>
                        <div className="relative w-full h-2 rounded-full bg-white/5">
                          <div
                            className="absolute h-full rounded-full bg-[#DC5700]/30"
                            style={{ width: "100%" }}
                          />
                          <div
                            className="absolute h-full rounded-full bg-[#DC5700]"
                            style={{ width: `${Math.min(100, Math.max(5, rangePct))}%` }}
                          />
                          {/* Estimated marker */}
                          <div
                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#FFB596] border-2 border-[#0E0E12]"
                            style={{
                              left: `${Math.min(97, Math.max(3, rangePct))}%`,
                              transform: "translate(-50%, -50%)",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ─── Right: Next Steps ─── */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Next Steps */}
            <div className="rounded-2xl p-6 md:p-8 bg-[#1B1B20] border border-white/5">
              <h3 className="text-lg font-bold tracking-tight mb-6 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#FFB596]" />
                Next Steps
              </h3>
              <p className="text-xs text-[#908F9C] mb-5">
                Top {topStrategies.length} strategies to implement first, ranked by potential savings.
              </p>

              <div className="space-y-5">
                {topStrategies.map((strategy, idx) => {
                  const priorityConfig =
                    idx === 0
                      ? { label: "HIGH PRIORITY", textColor: "text-[#FFB4AB]", bgColor: "bg-[#93000A]/30" }
                      : idx === 1
                      ? { label: "MEDIUM PRIORITY", textColor: "text-[#FFB596]", bgColor: "bg-[#FFB596]/10" }
                      : { label: "IMPLEMENT NEXT", textColor: "text-[#4CD6FB]", bgColor: "bg-[#4CD6FB]/10" };

                  return (
                    <div key={idx}>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-[9px] font-bold tracking-[0.15em] ${priorityConfig.textColor} ${priorityConfig.bgColor} px-2 py-0.5 rounded`}
                        >
                          {priorityConfig.label}
                        </span>
                        <span className="text-xs font-semibold text-[#E4E1E9] ml-auto">
                          {formatCurrencyFull(strategy.estimatedSavings)} Est.
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#E4E1E9] mb-1">
                        {strategy.title}
                      </h4>
                      <p className="text-xs text-[#908F9C] leading-relaxed">
                        {strategy.description}
                      </p>
                      {idx < topStrategies.length - 1 && (
                        <div className="border-b border-white/5 mt-5" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Plan Summary Card */}
            <div className="rounded-2xl p-6 bg-[#0E0E12] border border-[#FFB596]/10">
              <p className="text-[9px] font-bold tracking-[0.2em] text-[#FFB596] uppercase mb-3">
                Plan Summary
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#908F9C]">Filing Status</span>
                  <span className="text-[#E4E1E9] font-medium">
                    {plan.profile.filingStatus === "mfj"
                      ? "MFJ"
                      : plan.profile.filingStatus === "hoh"
                      ? "HOH"
                      : plan.profile.filingStatus === "single"
                      ? "Single"
                      : plan.profile.filingStatus}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#908F9C]">Income</span>
                  <span className="text-[#E4E1E9] font-medium">{plan.profile.income}</span>
                </div>
                {plan.profile.occupation && (
                  <div className="flex justify-between">
                    <span className="text-[#908F9C]">Occupation</span>
                    <span className="text-[#E4E1E9] font-medium">{plan.profile.occupation}</span>
                  </div>
                )}
                {plan.profile.state && (
                  <div className="flex justify-between">
                    <span className="text-[#908F9C]">State</span>
                    <span className="text-[#E4E1E9] font-medium">{plan.profile.state}</span>
                  </div>
                )}
                {plan.profile.dependents && (
                  <div className="flex justify-between">
                    <span className="text-[#908F9C]">Dependents</span>
                    <span className="text-[#E4E1E9] font-medium">{plan.profile.dependents}</span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-white/5">
                <div className="flex justify-between text-sm">
                  <span className="text-[#908F9C]">Total Savings</span>
                  <span className="text-[#FFB596] font-bold">
                    {formatCurrencyFull(plan.totalSavings)}
                  </span>
                </div>
              </div>

              <Link
                href="/dashboard/smart-plan"
                className="mt-5 w-full py-3 rounded-xl text-sm font-bold bg-[#FFB596]/10 text-[#FFB596] hover:bg-[#FFB596]/20 transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Regenerate Plan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
