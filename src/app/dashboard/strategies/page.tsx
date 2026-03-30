"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Shield,
  Clock,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import {
  MASTER_STRATEGIES,
  STRATEGY_CATEGORIES,
  getStrategiesByEntity,
  type MasterStrategy,
  type StrategyCategory as StrategyCategoryType,
} from "@/lib/tax/smart-plan-strategies";
import {
  getPlan,
  getEntityType,
  getEntityInfo,
  ENTITY_TYPES,
  type EntityType,
  type SavedPlan,
} from "@/lib/tax/plan-store";

/* ── Category badge colors keyed by category id ── */
const categoryColorMap: Record<string, { bg: string; text: string }> = {
  retirement: { bg: "bg-[#4f46e5]/15", text: "text-[#818cf8]" },
  compensation: { bg: "bg-[#0891b2]/15", text: "text-[#22d3ee]" },
  deductions: { bg: "bg-[#16a34a]/15", text: "text-[#4ade80]" },
  family: { bg: "bg-[#d946ef]/15", text: "text-[#e879f9]" },
  real_estate: { bg: "bg-[#ea580c]/15", text: "text-[#fb923c]" },
  depreciation: { bg: "bg-[#ca8a04]/15", text: "text-[#facc15]" },
  credits: { bg: "bg-[#dc2626]/15", text: "text-[#f87171]" },
  medical: { bg: "bg-[#e11d48]/15", text: "text-[#fb7185]" },
  education: { bg: "bg-[#7c3aed]/15", text: "text-[#a78bfa]" },
  entity: { bg: "bg-[#0d9488]/15", text: "text-[#2dd4bf]" },
  charity: { bg: "bg-[#be185d]/15", text: "text-[#f472b6]" },
  business_ops: { bg: "bg-[#475569]/15", text: "text-[#94a3b8]" },
};

const riskConfig: Record<string, { dot: string; label: string }> = {
  low: { dot: "bg-emerald-400", label: "Low Risk" },
  medium: { dot: "bg-amber-400", label: "Medium Risk" },
  high: { dot: "bg-[#FFB4AB]", label: "High Risk" },
};

const entityTabs: { id: EntityType | "all"; label: string; color: string; form: string }[] = [
  { id: "all", label: "All", color: "#DC5700", form: "" },
  { id: "individual", label: "Individual", color: "#4CD6FB", form: "1040" },
  { id: "s_corp", label: "S-Corp", color: "#DC5700", form: "1120-S" },
  { id: "c_corp", label: "C-Corp", color: "#8B5CF6", form: "1120" },
  { id: "partnership", label: "Partnership", color: "#10B981", form: "1065" },
  { id: "sole_prop", label: "Sole Prop", color: "#F59E0B", form: "Sched C" },
];

function formatSavings(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function getCategoryLabel(categoryId: string): string {
  return STRATEGY_CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId;
}

/* ── Strategy Card Component ── */
function StrategyCard({
  strategy,
  isExpanded,
  onToggle,
  planSavings,
  index,
}: {
  strategy: MasterStrategy;
  isExpanded: boolean;
  onToggle: () => void;
  planSavings?: number;
  index: number;
}) {
  const catStyle = categoryColorMap[strategy.category] ?? {
    bg: "bg-[#475569]/15",
    text: "text-[#94a3b8]",
  };
  const risk = riskConfig[strategy.riskLevel] ?? riskConfig.low;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
      className={isExpanded ? "sm:col-span-2 lg:col-span-3" : ""}
    >
      <div
        className={`glass-card p-6 rounded-2xl h-full transition-colors ${
          planSavings !== undefined
            ? "hover:bg-[#2A292F]/60 ring-1 ring-[#DC5700]/30"
            : "hover:bg-[#2A292F]/60"
        }`}
      >
        {/* Plan badge */}
        {planSavings !== undefined && (
          <div className="flex items-center gap-1.5 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#DC5700]" />
            <span className="text-xs font-semibold text-[#DC5700]">
              In Your Plan — {formatSavings(planSavings)} estimated savings
            </span>
          </div>
        )}

        {/* Category badge + risk */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span
            className={`${catStyle.bg} ${catStyle.text} text-xs font-medium px-2.5 py-1 rounded-full`}
          >
            {getCategoryLabel(strategy.category)}
          </span>
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${risk.dot}`} />
            <span className="text-xs text-[#C7C5D3]">{risk.label}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-[#E4E1E9] leading-tight mb-2">
          {strategy.title}
        </h3>

        {/* Description */}
        <p
          className={`text-sm text-[#C7C5D3] mb-4 ${
            isExpanded ? "" : "line-clamp-3"
          }`}
        >
          {strategy.description}
        </p>

        {/* Savings range */}
        <div className="flex items-center gap-1 text-[#FFB596] font-bold mb-3">
          <DollarSign className="w-4 h-4" />
          <span>
            {formatSavings(strategy.typicalSavingsRange.min)} &mdash;{" "}
            {formatSavings(strategy.typicalSavingsRange.max)} typical savings
          </span>
        </div>

        {/* Meta row: IRC + Time to implement */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#C7C5D3] bg-[#35343A] px-2.5 py-1 rounded-full">
            <BookOpen className="w-3 h-3" />
            {strategy.ircReference}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#C7C5D3] bg-[#35343A] px-2.5 py-1 rounded-full">
            <Clock className="w-3 h-3" />
            {strategy.timeToImplement}
          </span>
        </div>

        {/* Applicable To badges — entity-colored */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {strategy.applicableTo.map((tag) => {
            const eInfo = ENTITY_TYPES.find((e) => e.id === tag);
            const color = eInfo?.color || "#64748b";
            return (
              <span
                key={tag}
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${color}15`,
                  color: color,
                  border: `1px solid ${color}25`,
                }}
              >
                {eInfo?.label ?? tag}
              </span>
            );
          })}
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-[#35343A]/50 space-y-5">
                {/* Eligibility Criteria */}
                {strategy.eligibilityCriteria.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-[#E4E1E9] mb-2">
                      Eligibility Criteria
                    </h4>
                    <ul className="space-y-1.5">
                      {strategy.eligibilityCriteria.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-[#C7C5D3]"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Implementation Steps */}
                {strategy.implementationSteps.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-[#E4E1E9] mb-2">
                      Implementation Steps
                    </h4>
                    <ol className="space-y-2">
                      {strategy.implementationSteps.map((step, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm"
                        >
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#FFB596] text-[#131318] text-xs flex items-center justify-center font-bold mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-[#C7C5D3]">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Tax Filing */}
                {strategy.taxFiling && (
                  <div>
                    <h4 className="text-sm font-bold text-[#E4E1E9] mb-1">
                      Tax Filing
                    </h4>
                    <p className="text-sm text-[#C7C5D3]">
                      {strategy.taxFiling}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expand / collapse */}
        <button
          className="w-full mt-4 py-2 rounded-lg text-sm font-medium text-[#FFB596] hover:bg-[#FFB596]/10 transition-colors flex items-center justify-center gap-1"
          onClick={onToggle}
        >
          {isExpanded ? (
            <>
              Show Less <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Learn More <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   Main Page
   ══════════════════════════════════════════════════════════════════════════════ */

export default function StrategiesPage() {
  const [plan, setPlan] = useState<SavedPlan | null>(null);
  const [entityFilter, setEntityFilter] = useState<EntityType | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setPlan(getPlan());
    const savedEntity = getEntityType();
    if (savedEntity) setEntityFilter(savedEntity);
  }, []);

  /* ── Plan strategy IDs with savings ── */
  const planStrategyMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!plan) return map;
    // Match plan strategies to MASTER_STRATEGIES by title
    for (const ps of plan.strategies) {
      const match = MASTER_STRATEGIES.find(
        (ms) =>
          ms.title.toLowerCase() === ps.title.toLowerCase() ||
          ms.id === ps.title.toLowerCase().replace(/\s+/g, "_")
      );
      if (match) {
        map.set(match.id, ps.estimatedSavings);
      }
    }
    return map;
  }, [plan]);

  /* ── Plan strategies (from MASTER_STRATEGIES that are in the plan) ── */
  const planStrategies = useMemo(() => {
    return MASTER_STRATEGIES.filter((s) => planStrategyMap.has(s.id));
  }, [planStrategyMap]);

  /* ── Filtered library strategies ── */
  const filteredStrategies = useMemo(() => {
    return MASTER_STRATEGIES.filter((s) => {
      if (entityFilter !== "all" && !s.applicableTo.includes(entityFilter))
        return false;
      if (categoryFilter !== "all" && s.category !== categoryFilter)
        return false;
      if (riskFilter !== "all" && s.riskLevel !== riskFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const entityLabels = s.applicableTo.map((t) => {
          const eInfo = ENTITY_TYPES.find((e) => e.id === t);
          return eInfo?.label.toLowerCase() || t;
        }).join(" ");
        const categoryLabel = getCategoryLabel(s.category).toLowerCase();
        if (
          !s.title.toLowerCase().includes(q) &&
          !s.description.toLowerCase().includes(q) &&
          !s.ircReference.toLowerCase().includes(q) &&
          !categoryLabel.includes(q) &&
          !entityLabels.includes(q)
        )
          return false;
      }
      return true;
    }).sort((a, b) => b.typicalSavingsRange.max - a.typicalSavingsRange.max);
  }, [entityFilter, categoryFilter, riskFilter, searchQuery]);

  /* ── Totals ── */
  const totalMaxSavings = MASTER_STRATEGIES.reduce(
    (sum, s) => sum + s.typicalSavingsRange.max,
    0
  );

  /* ── Category options for the current entity filter ── */
  const activeCategoryIds = useMemo(() => {
    const ids = new Set<string>();
    const pool =
      entityFilter === "all"
        ? MASTER_STRATEGIES
        : MASTER_STRATEGIES.filter((s) => s.applicableTo.includes(entityFilter));
    for (const s of pool) ids.add(s.category);
    return ids;
  }, [entityFilter]);

  return (
    <div className="space-y-8 p-6">
      {/* ── Header ── */}
      <div>
        <p className="text-xs font-medium text-[#4CD6FB] uppercase tracking-[0.2em] mb-2">
          OPTIMIZATION ENGINE
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight text-[#E4E1E9]">
          Tax Strategy Architecture
        </h1>
        <p className="text-[#C7C5D3] mt-2 text-sm">
          {MASTER_STRATEGIES.length} proven strategies to legally minimize your
          tax liability.
        </p>
      </div>

      {/* ── Summary Bar ── */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-3 flex-wrap">
          <Shield className="w-5 h-5 text-[#FFB596]" />
          <span className="text-base font-bold text-[#E4E1E9]">
            {MASTER_STRATEGIES.length} Strategies Available
          </span>
          <span className="text-[#464651]">|</span>
          <div className="flex items-center gap-1 text-[#FFB596] font-bold">
            <DollarSign className="w-5 h-5" />
            <span>{formatSavings(totalMaxSavings)}+ Total Potential Savings</span>
          </div>
          {plan && (
            <>
              <span className="text-[#464651]">|</span>
              <div className="flex items-center gap-1 text-[#DC5700] font-bold">
                <Sparkles className="w-4 h-4" />
                <span>
                  {plan.strategies.length} in Your Plan &middot;{" "}
                  {formatSavings(plan.totalSavings)} projected
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
         Section 1: Your Plan Strategies
         ════════════════════════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-2xl font-bold text-[#E4E1E9] mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#DC5700]" />
          Your Plan Strategies
        </h2>

        {plan && planStrategies.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {planStrategies.map((strategy, index) => (
              <StrategyCard
                key={strategy.id}
                strategy={strategy}
                isExpanded={expandedId === strategy.id}
                onToggle={() =>
                  setExpandedId(
                    expandedId === strategy.id ? null : strategy.id
                  )
                }
                planSavings={planStrategyMap.get(strategy.id)}
                index={index}
              />
            ))}
          </div>
        ) : plan && planStrategies.length === 0 ? (
          /* Plan exists but no matching master strategies (show plan titles) */
          <div className="glass-card rounded-2xl p-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {plan.strategies.map((ps, i) => (
                <div
                  key={i}
                  className="bg-[rgba(31,31,37,0.6)] rounded-xl p-4"
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#DC5700]" />
                    <span className="text-xs font-semibold text-[#DC5700]">
                      {formatSavings(ps.estimatedSavings)} estimated
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#E4E1E9] mb-1">
                    {ps.title}
                  </h4>
                  <p className="text-xs text-[#C7C5D3] line-clamp-2">
                    {ps.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* No plan at all — CTA */
          <div className="glass-card rounded-2xl p-8 text-center">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-[#DC5700]" />
            <p className="text-lg font-bold text-[#E4E1E9] mb-2">
              No Smart Plan Yet
            </p>
            <p className="text-sm text-[#C7C5D3] mb-5 max-w-md mx-auto">
              Create a personalized Smart Plan to get tailored strategies with
              estimated savings based on your entity type and financial profile.
            </p>
            <Link
              href="/dashboard/smart-plan"
              className="inline-flex items-center gap-2 bg-[#DC5700] hover:bg-[#DC5700]/90 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Create Your Smart Plan
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
         Section 2: Full Strategy Library
         ════════════════════════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-2xl font-bold text-[#E4E1E9] mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#4CD6FB]" />
          Full Strategy Library
        </h2>

        {/* ── Entity Type Tabs ── */}
        <div className="flex flex-wrap gap-2 mb-4">
          {entityTabs.map((tab) => {
            const isActive = entityFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setEntityFilter(tab.id);
                  setCategoryFilter("all");
                }}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={isActive ? {
                  backgroundColor: tab.color,
                  color: "#fff",
                  boxShadow: `0 4px 12px ${tab.color}30`,
                } : {
                  backgroundColor: "#1B1B20",
                  color: "#C7C5D3",
                }}
              >
                {tab.label}
                {tab.form && <span className="ml-1.5 text-[10px] opacity-70">({tab.form})</span>}
              </button>
            );
          })}
        </div>

        {/* ── Filter Bar ── */}
        <div className="glass-card rounded-2xl p-5 mb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-[#C7C5D3]">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            {/* Category Select */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#0E0E13] text-[#E4E1E9] border-none rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#4CD6FB] appearance-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {STRATEGY_CATEGORIES.filter((c) => activeCategoryIds.has(c.id)).map(
                (c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                )
              )}
            </select>

            {/* Risk Select */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-[#0E0E13] text-[#E4E1E9] border-none rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#4CD6FB] appearance-none cursor-pointer"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>

            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C7C5D3]" />
              <input
                placeholder="Search strategies, IRC sections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0E0E13] text-[#E4E1E9] border-none rounded-lg pl-9 pr-4 py-2 text-sm placeholder:text-[#464651] focus:outline-none focus:ring-1 focus:ring-[#4CD6FB]"
              />
            </div>
          </div>
        </div>

        {/* ── Results count ── */}
        <p className="text-xs text-[#C7C5D3] mb-4">
          Showing {filteredStrategies.length} of {MASTER_STRATEGIES.length}{" "}
          strategies
          {entityFilter !== "all" && (() => {
            const tab = entityTabs.find((t) => t.id === entityFilter);
            return (
              <span>
                {" "}for{" "}
                <span className="font-semibold" style={{ color: tab?.color }}>
                  {tab?.label} {tab?.form && `(${tab.form})`}
                </span>
              </span>
            );
          })()}
          {categoryFilter !== "all" && (
            <span> in <span className="font-medium text-[#FFB596]">{getCategoryLabel(categoryFilter)}</span></span>
          )}
          {searchQuery && (
            <span> matching &quot;<span className="font-medium text-[#4CD6FB]">{searchQuery}</span>&quot;</span>
          )}
        </p>

        {/* ── Strategy Cards Grid ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredStrategies.map((strategy, index) => (
              <StrategyCard
                key={strategy.id}
                strategy={strategy}
                isExpanded={expandedId === strategy.id}
                onToggle={() =>
                  setExpandedId(
                    expandedId === strategy.id ? null : strategy.id
                  )
                }
                planSavings={
                  planStrategyMap.has(strategy.id)
                    ? planStrategyMap.get(strategy.id)
                    : undefined
                }
                index={index}
              />
            ))}
          </AnimatePresence>
        </div>

        {filteredStrategies.length === 0 && (
          <div className="glass-card rounded-2xl py-16 text-center">
            <Search className="w-12 h-12 mx-auto mb-3 text-[#464651]" />
            <p className="text-lg font-bold text-[#E4E1E9]">
              No strategies found
            </p>
            <p className="text-sm text-[#C7C5D3]">
              Try adjusting your filters or search query
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
