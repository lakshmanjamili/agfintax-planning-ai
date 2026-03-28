"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Shield,
} from "lucide-react";
import { TAX_STRATEGIES, type TaxStrategy } from "@/lib/tax/strategies";

/* ── Dark-themed category badge colors ── */
const categoryColors: Record<TaxStrategy["category"], { bg: string; text: string }> = {
  business: { bg: "bg-[#4CD6FB]/10", text: "text-[#4CD6FB]" },
  individual: { bg: "bg-[#FFB596]/10", text: "text-[#FFB596]" },
  investment: { bg: "bg-[#BFC2FF]/10", text: "text-[#BFC2FF]" },
  estate: { bg: "bg-[#FFB4AB]/10", text: "text-[#FFB4AB]" },
  international: { bg: "bg-[#4CD6FB]/10", text: "text-[#4CD6FB]" },
};

const riskDotColor: Record<TaxStrategy["riskLevel"], string> = {
  low: "bg-emerald-400",
  medium: "bg-amber-400",
  high: "bg-[#FFB4AB]",
};

function parseSavingsMax(savings: string): number {
  const match = savings.match(/[\d,]+/g);
  if (!match) return 0;
  const numbers = match.map((n) => parseInt(n.replace(/,/g, ""), 10));
  return Math.max(...numbers);
}

export default function StrategiesPage() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredStrategies = TAX_STRATEGIES.filter((s) => {
    if (categoryFilter !== "all" && s.category !== categoryFilter) return false;
    if (riskFilter !== "all" && s.riskLevel !== riskFilter) return false;
    if (
      searchQuery &&
      !s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !s.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const totalMaxSavings = TAX_STRATEGIES.reduce(
    (sum, s) => sum + parseSavingsMax(s.potentialSavings),
    0
  );

  return (
    <div className="space-y-8 p-6">
      {/* ── Editorial Header ── */}
      <div>
        <p className="text-xs font-medium text-[#4CD6FB] uppercase tracking-[0.2em] mb-2">
          OPTIMIZATION ENGINE
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight text-[#E4E1E9]">
          Tax Strategy Architecture
        </h1>
        <p className="text-[#C7C5D3] mt-2 text-sm">
          Proven strategies to legally minimize your tax liability.
        </p>
      </div>

      {/* ── Summary Bar ── */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-3 flex-wrap">
          <Shield className="w-5 h-5 text-[#FFB596]" />
          <span className="text-base font-bold text-[#E4E1E9]">
            {TAX_STRATEGIES.length} Strategies Available
          </span>
          <span className="text-[#464651]">|</span>
          <div className="flex items-center gap-1 text-[#FFB596] font-bold">
            <DollarSign className="w-5 h-5" />
            <span>
              {totalMaxSavings >= 250000
                ? "250K+"
                : `${(totalMaxSavings / 1000).toFixed(0)}K`}{" "}
              Total Potential Savings
            </span>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="glass-card rounded-2xl p-5">
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
            <option value="business">Business</option>
            <option value="individual">Individual</option>
            <option value="investment">Investment</option>
            <option value="estate">Estate</option>
            <option value="international">International</option>
          </select>

          {/* Risk Select */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-[#0E0E13] text-[#E4E1E9] border-none rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#4CD6FB] appearance-none cursor-pointer"
          >
            <option value="all">All Risk</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C7C5D3]" />
            <input
              placeholder="Search strategies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0E0E13] text-[#E4E1E9] border-none rounded-lg pl-9 pr-4 py-2 text-sm placeholder:text-[#464651] focus:outline-none focus:ring-1 focus:ring-[#4CD6FB]"
            />
          </div>
        </div>
      </div>

      {/* ── Strategy Cards Grid ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filteredStrategies.map((strategy, index) => {
            const isExpanded = expandedId === strategy.id;
            const catStyle = categoryColors[strategy.category];
            return (
              <motion.div
                key={strategy.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={isExpanded ? "sm:col-span-2 lg:col-span-3" : ""}
              >
                <div className="glass-card p-8 rounded-2xl h-full hover:bg-[#2A292F]/60 transition-colors">
                  {/* Category badge + risk dot */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span
                      className={`${catStyle.bg} ${catStyle.text} text-xs font-medium px-2.5 py-1 rounded-full capitalize`}
                    >
                      {strategy.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${riskDotColor[strategy.riskLevel]}`}
                      />
                      <span className="text-xs text-[#C7C5D3] capitalize">
                        {strategy.riskLevel}
                      </span>
                    </div>
                  </div>

                  {/* Strategy name */}
                  <h3 className="text-lg font-bold text-[#E4E1E9] leading-tight mb-2">
                    {strategy.name}
                  </h3>

                  {/* Description */}
                  <p
                    className={`text-sm text-[#C7C5D3] mb-4 ${
                      isExpanded ? "" : "line-clamp-3"
                    }`}
                  >
                    {strategy.description}
                  </p>

                  {/* Potential savings */}
                  <div className="flex items-center gap-1 text-[#FFB596] font-bold mb-3">
                    <DollarSign className="w-4 h-4" />
                    <span>{strategy.potentialSavings}</span>
                  </div>

                  {/* IRC reference badge */}
                  <span className="inline-block text-xs font-medium text-[#C7C5D3] bg-[#35343A] px-2.5 py-1 rounded-full mb-3">
                    {strategy.ircReference}
                  </span>

                  {/* Applicable To Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {strategy.applicableTo.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs text-[#C7C5D3] bg-[#2A292F] px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Expanded: Implementation Steps */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 mt-4 border-t border-[#35343A]/50">
                          <h4 className="text-sm font-bold text-[#E4E1E9] mb-3">
                            Implementation Steps
                          </h4>
                          <ol className="space-y-2">
                            {strategy.steps.map((step, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#FFB596] text-[#131318] text-xs flex items-center justify-center font-bold mt-0.5">
                                  {i + 1}
                                </span>
                                <span className="text-[#C7C5D3]">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Expand / collapse button */}
                  <button
                    className="w-full mt-4 py-2 rounded-lg text-sm font-medium text-[#FFB596] hover:bg-[#FFB596]/10 transition-colors flex items-center justify-center gap-1"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : strategy.id)
                    }
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
          })}
        </AnimatePresence>
      </div>

      {filteredStrategies.length === 0 && (
        <div className="glass-card rounded-2xl py-16 text-center">
          <Search className="w-12 h-12 mx-auto mb-3 text-[#464651]" />
          <p className="text-lg font-bold text-[#E4E1E9]">No strategies found</p>
          <p className="text-sm text-[#C7C5D3]">
            Try adjusting your filters or search query
          </p>
        </div>
      )}
    </div>
  );
}
