"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { getApplicableStrategies, STRATEGY_CATEGORIES, MASTER_STRATEGIES, type MasterStrategy, type StrategyCategory } from "@/lib/tax/smart-plan-strategies";
import { TAX_INTENTS, detectCoveredIntents, getUncoveredIntents, hasEnoughInfo, buildCoverageMap, buildConversationPrompt, buildVoiceAnalysisPrompt } from "@/lib/tax/smart-plan-engine";
import {
  createSession as createQualSession,
  initializeWithProfile as initQualWithProfile,
  getNextQuestion,
  processAnswer as processQualAnswer,
  resolveUnresolved,
  getSessionSummary,
  parseProfileAnswers,
  PROFILE_QUESTIONS,
  type PlanSession as QualSession,
} from "@/lib/tax/qualification-engine-v2";
import { buildQualificationPrompt, buildProfilePrompt } from "@/lib/ai/tax-system-prompt";
import { strategyDatabase, getStrategiesForEntity, type StrategyQualification } from "@/lib/tax/strategy-database";
import { calculateAllSavings, getMarginalRate } from "@/lib/tax/savings-calculator";
import { getInterviewSections } from "@/lib/tax/qualification-engine";
import VoiceInterview from "@/components/voice/voice-interview";
import { savePlan, getPlan, type SavedPlan, type PlanHistoryEntry, type EntityType, type ClientProfile, type StrategySlot, ENTITY_TYPES, getEntityType, saveEntityType, getEntityInfo, getClientProfile, profileToSmartPlanInput, analyzeProfileForEntity, getPlanHistory, getPlanCount, canCreatePlan, getRemainingPlans, loadPlanFromHistory, FREE_PLAN_LIMIT } from "@/lib/tax/plan-store";
import { getVideosForStrategy } from "@/lib/content/video-data";
import { getPostsForStrategy } from "@/lib/content/blog-data";
import Link from "next/link";
import {
  Brain,
  Lock,
  Send,
  Mic,
  MicOff,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  Target,
  FileText,
  ArrowRight,
  TrendingUp,
  Download,
  Phone,
  X,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  User,
  Building2,
  Landmark,
  LayoutDashboard,
  Users,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  Zap,
  PiggyBank,
  Receipt,
  Heart,
  HeartPulse,
  GraduationCap,
  Banknote,
  BadgeDollarSign,
  TrendingDown,
  MapPin,
  ClipboardCheck,
  Video,
  Newspaper,
  Info,
  Upload,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface StrategyTile {
  category: string;
  count: number;
  qualified: number;
  color: string;
  icon: string;
  strategies: string[];
}

interface StrategyInfoContext {
  strategyTitle: string;
  strategyDescription: string;
  category: string;
  ircReference: string;
  savingsRange: { min: number; max: number };
  questionHelpText: string;
  questionIndex: number;
  totalQuestions: number;
  strategyIndex: number;
  totalStrategies: number;
}

interface ChatMessage {
  role: "bot" | "user";
  text: string;
  buttons?: string[];
  showSkip?: boolean;
  /** Structured strategy overview tiles — shown before text */
  tiles?: StrategyTile[];
  /** Auto-qualified strategy names */
  autoQualified?: string[];
  /** Strategy + question context for (i) info buttons */
  strategyInfo?: StrategyInfoContext;
}

interface Strategy {
  title: string;
  category: string;
  description: string;
  estimatedSavings: number;
  savingsMin: number;
  savingsMax: number;
  implementationSteps: string[];
  ircReference?: string;
  applicability?: string;
  id?: string;
}

interface PlanResult {
  strategies: Strategy[];
  totalEstimatedSavings: number;
  profile: {
    occupation: string;
    filingStatus: string;
    income: string;
    dependents: string;
    state: string;
    rawIncome?: number;
    marginalRate?: number;
    filingStatusRaw?: string;
  };
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const categoryColors: Record<string, { bg: string; text: string }> = {
  Deductions: { bg: "bg-blue-500/10", text: "text-blue-400" },
  Credits: { bg: "bg-green-500/10", text: "text-green-400" },
  Retirement: { bg: "bg-purple-500/10", text: "text-purple-400" },
  Medical: { bg: "bg-cyan-500/10", text: "text-cyan-400" },
  Assets: { bg: "bg-[#DC5700]/10", text: "text-[#FFB596]" },
  Charity: { bg: "bg-pink-500/10", text: "text-pink-400" },
  Business: { bg: "bg-amber-500/10", text: "text-amber-400" },
  "Business Ops": { bg: "bg-amber-500/10", text: "text-amber-400" },
  Entity: { bg: "bg-indigo-500/10", text: "text-indigo-400" },
  "Entity Structure": { bg: "bg-indigo-500/10", text: "text-indigo-400" },
  International: { bg: "bg-teal-500/10", text: "text-teal-400" },
  Compensation: { bg: "bg-sky-500/10", text: "text-sky-400" },
  Family: { bg: "bg-violet-500/10", text: "text-violet-400" },
  "Real Estate": { bg: "bg-orange-500/10", text: "text-orange-400" },
  Depreciation: { bg: "bg-yellow-500/10", text: "text-yellow-400" },
  Education: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
};

/* questions are now AI-driven, not hardcoded */

/* ------------------------------------------------------------------ */
/*  Contribution-based strategy config                                 */
/* ------------------------------------------------------------------ */

interface ContributionConfig {
  ids: string[];
  titlePatterns: string[];
  getMax: (p: { rawIncome: number; filingStatus: string; dependents: string }) => number;
  label: string;
}

const CONTRIBUTION_STRATEGIES: ContributionConfig[] = [
  {
    ids: ['traditional-401k', 'roth-401k'],
    titlePatterns: ['Traditional 401(k)', 'Roth 401(k)'],
    getMax: () => 31_000, // 2025 max with catch-up
    label: '401(k) Contribution',
  },
  {
    ids: ['solo-401k'],
    titlePatterns: ['Solo 401(k)'],
    getMax: (p) => Math.min(70_000, 31_000 + Math.round(p.rawIncome * 0.25)),
    label: 'Solo 401(k) Contribution',
  },
  {
    ids: ['simple-401k', 'simple-ira'],
    titlePatterns: ['SIMPLE 401(k)', 'SIMPLE IRA'],
    getMax: () => 20_000,
    label: 'SIMPLE Plan Contribution',
  },
  {
    ids: ['health-savings-account'],
    titlePatterns: ['Health Savings Account', 'HSA'],
    getMax: (p) => p.filingStatus === 'married_jointly' || p.filingStatus === 'Married Filing Jointly' ? 8_750 : 4_350,
    label: 'HSA Contribution',
  },
  {
    ids: ['donor-advised-fund'],
    titlePatterns: ['Donor-Advised Fund', 'DAF'],
    getMax: (p) => Math.round(p.rawIncome * 0.60),
    label: 'DAF Contribution',
  },
  {
    ids: ['private-foundation'],
    titlePatterns: ['Private Foundation'],
    getMax: (p) => Math.round(p.rawIncome * 0.30),
    label: 'Foundation Contribution',
  },
  {
    ids: ['charitable-contribution-optimization'],
    titlePatterns: ['Charitable Contribution'],
    getMax: (p) => Math.round(p.rawIncome * 0.60),
    label: 'Charitable Contribution',
  },
  {
    ids: ['roth-conversion'],
    titlePatterns: ['Roth Conversion'],
    getMax: (p) => Math.round(p.rawIncome * 0.50),
    label: 'Roth Conversion Amount',
  },
  {
    ids: ['coverdell-esa'],
    titlePatterns: ['Coverdell ESA'],
    getMax: (p) => 2_000 * (parseInt(p.dependents) || 1),
    label: 'ESA Contribution',
  },
  {
    ids: ['deferred-compensation-individual'],
    titlePatterns: ['Deferred Compensation'],
    getMax: (p) => Math.round(p.rawIncome * 0.50),
    label: 'Deferred Amount',
  },
  {
    ids: ['self-employed-health-insurance'],
    titlePatterns: ['Self-Employed Health Insurance'],
    getMax: () => 30_000,
    label: 'Health Insurance Premium',
  },
  {
    ids: ['qualified-opportunity-zone'],
    titlePatterns: ['Qualified Opportunity Zone', 'QOZ'],
    getMax: (p) => Math.round(p.rawIncome * 0.30),
    label: 'QOZ Investment',
  },
];

function getContributionConfig(
  strategy: { id?: string; title: string },
  profile: { rawIncome?: number; filingStatus?: string; filingStatusRaw?: string; dependents?: string }
): { isContribution: true; max: number; label: string } | { isContribution: false } {
  for (const config of CONTRIBUTION_STRATEGIES) {
    const matchById = strategy.id && config.ids.includes(strategy.id);
    const matchByTitle = config.titlePatterns.some(p => strategy.title.includes(p));
    if (matchById || matchByTitle) {
      const max = config.getMax({
        rawIncome: profile.rawIncome || 150_000,
        filingStatus: profile.filingStatusRaw || profile.filingStatus || 'single',
        dependents: profile.dependents || '0',
      });
      return { isContribution: true, max, label: config.label };
    }
  }
  return { isContribution: false };
}

/* ------------------------------------------------------------------ */
/*  Custom range slider CSS (injected once)                            */
/* ------------------------------------------------------------------ */

const sliderCSS = `
  input[type="range"].smart-plan-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: #35343A;
    outline: none;
    cursor: pointer;
  }
  input[type="range"].smart-plan-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #DC5700;
    border: 2px solid #FFB596;
    cursor: pointer;
    box-shadow: 0 0 8px rgba(220, 87, 0, 0.4);
    transition: box-shadow 0.2s;
  }
  input[type="range"].smart-plan-slider::-webkit-slider-thumb:hover {
    box-shadow: 0 0 14px rgba(220, 87, 0, 0.7);
  }
  input[type="range"].smart-plan-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #DC5700;
    border: 2px solid #FFB596;
    cursor: pointer;
    box-shadow: 0 0 8px rgba(220, 87, 0, 0.4);
  }
  input[type="range"].smart-plan-slider::-moz-range-track {
    height: 6px;
    border-radius: 3px;
    background: #35343A;
  }
  @keyframes pulse-recording {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  .recording-pulse {
    animation: pulse-recording 1s ease-in-out infinite;
  }
  @keyframes fade-in-up {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in-up {
    animation: fade-in-up 0.4s ease-out forwards;
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .shimmer-text {
    background: linear-gradient(90deg, #FFB596 0%, #4CD6FB 50%, #FFB596 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 3s linear infinite;
  }
`;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function parseIncomeToNumber(s: string): number {
  const clean = s.replace(/[^0-9KkMm.]/g, "").toUpperCase();
  if (clean.includes("M")) return parseFloat(clean) * 1_000_000 || 500000;
  if (clean.includes("K")) return parseFloat(clean) * 1_000 || 100000;
  const num = parseInt(clean);
  if (num > 0) return num;
  // Fallback from range labels
  if (s.includes("Under")) return 50000;
  if (s.includes("75K-150K")) return 112500;
  if (s.includes("150K-300K")) return 225000;
  if (s.includes("300K-500K")) return 400000;
  if (s.includes("500K-1M")) return 750000;
  if (s.includes("1M+")) return 1500000;
  return 100000;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

// Entity type icon component with color support
function EntityIcon({ icon, color, className = "w-6 h-6" }: { icon: string; color: string; className?: string }) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    User, Building2, Landmark, Users, Briefcase,
  };
  const IconComp = icons[icon] || User;
  return (
    <span style={{ color }}>
      <IconComp className={className} />
    </span>
  );
}

// Category icon mapper
function CategoryIcon({ iconName, className = "w-4 h-4" }: { iconName: string; className?: string }) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    PiggyBank, Banknote, Receipt, Users, Building2, TrendingDown,
    BadgeDollarSign, HeartPulse, GraduationCap, Landmark, Heart, Briefcase,
  };
  const IconComp = icons[iconName] || Zap;
  return <IconComp className={className} />;
}

// Slot icon mapper for profile strategy slots
function SlotIcon({ iconName, className = "w-4 h-4" }: { iconName: string; className?: string }) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    DollarSign, FileText, ClipboardCheck, MapPin, Users, PiggyBank,
    Building2, TrendingUp, Heart, HeartPulse, Briefcase, Banknote,
  };
  const IconComp = icons[iconName] || DollarSign;
  return <IconComp className={className} />;
}

// Strategy Sidebar Component
function StrategySidebar({
  entityType,
  isOpen,
  onToggle,
  expandedId,
  onExpandToggle,
  categoryFilter,
  onCategoryFilter,
  qualSession,
}: {
  entityType: string;
  isOpen: boolean;
  onToggle: () => void;
  expandedId: string | null;
  onExpandToggle: (id: string) => void;
  categoryFilter: string | null;
  onCategoryFilter: (id: string | null) => void;
  qualSession?: { candidates: { id: string; title: string; category: string; typicalSavingsRange: { min: number; max: number }; riskLevel?: string; ircReference?: string; description?: string }[]; qualifiedIds: string[]; disqualifiedIds: string[]; profileComplete: boolean };
}) {
  // V2 category → master category mapping
  const V2_CATEGORY_MAP: Record<string, string> = {
    'Retirement Planning': 'retirement',
    'Credits': 'credits',
    'Charity': 'charity',
    'Advanced': 'deductions',
    'Investable Gains': 'real_estate',
    'Compensation': 'compensation',
    'Medical': 'medical',
    'Education': 'education',
    'Entity': 'entity',
    'Real Estate': 'real_estate',
    'Deductions': 'deductions',
  };

  // Use V2 candidates if available (profile-filtered), else fall back to full master list
  const hasV2Candidates = qualSession?.profileComplete && qualSession.candidates.length > 0;
  const grouped = hasV2Candidates ? (() => {
    // Group V2 candidates by category
    const cats = new Map<string, typeof qualSession.candidates>();
    for (const s of qualSession.candidates) {
      const catKey = V2_CATEGORY_MAP[s.category] || s.category.toLowerCase().replace(/\s+/g, '_');
      const list = cats.get(catKey) || [];
      list.push(s);
      cats.set(catKey, list);
    }
    return Array.from(cats.entries()).map(([catId, strats]) => {
      const masterCat = STRATEGY_CATEGORIES.find(c => c.id === catId);
      return {
        category: masterCat || { id: catId, label: strats[0]?.category || catId, icon: 'Zap', color: '#ff6600' },
        strategies: strats.map(s => ({
          id: s.id,
          title: s.title,
          category: V2_CATEGORY_MAP[s.category] || s.category.toLowerCase().replace(/\s+/g, '_'),
          description: s.description || '',
          ircReference: s.ircReference || '',
          typicalSavingsRange: s.typicalSavingsRange,
          riskLevel: (s.riskLevel || 'low') as 'low' | 'medium' | 'high',
          applicableTo: [entityType],
          eligibilityCriteria: [] as string[],
          timeToImplement: '',
        })),
      };
    });
  })() : (() => {
    // Fallback: use V2 database grouped by category
    const v2Strategies = getStrategiesForEntity(entityType as import("@/lib/tax/strategy-database").EntityType);
    const cats = new Map<string, typeof v2Strategies>();
    for (const s of v2Strategies) {
      const catKey = V2_CATEGORY_MAP[s.category] || s.category.toLowerCase().replace(/\s+/g, '_');
      const list = cats.get(catKey) || [];
      list.push(s);
      cats.set(catKey, list);
    }
    return Array.from(cats.entries()).map(([catId, strats]) => {
      const masterCat = STRATEGY_CATEGORIES.find(c => c.id === catId);
      return {
        category: masterCat || { id: catId, label: strats[0]?.category || catId, icon: 'Zap', color: '#ff6600' },
        strategies: strats.map(s => ({
          id: s.id,
          title: s.title,
          category: V2_CATEGORY_MAP[s.category] || s.category.toLowerCase().replace(/\s+/g, '_'),
          description: s.description || '',
          ircReference: s.ircReference || '',
          typicalSavingsRange: s.typicalSavingsRange,
          riskLevel: (s.riskLevel || 'low') as 'low' | 'medium' | 'high',
          applicableTo: [entityType],
          eligibilityCriteria: [] as string[],
          timeToImplement: '',
        })),
      };
    });
  })();
  const entityInfo = getEntityInfo(entityType as EntityType);
  const totalStrategies = grouped.reduce((sum, g) => sum + g.strategies.length, 0);

  const filteredGroups = categoryFilter
    ? grouped.filter((g) => g.category.id === categoryFilter)
    : grouped;

  if (!isOpen) {
    return (
      <div className="hidden lg:flex flex-col items-center w-12 bg-[rgba(31,31,37,0.6)] border-r border-white/5 py-4 gap-3">
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-white/5 text-[#C7C5D3] hover:text-[#FFB596] transition"
          title="Show strategies"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
        <div className="w-6 h-px bg-white/10" />
        <span className="text-[10px] font-bold text-[#C7C5D3] [writing-mode:vertical-lr] rotate-180 tracking-widest uppercase">
          {totalStrategies} Strategies
        </span>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex flex-col w-80 xl:w-[340px] bg-[rgba(31,31,37,0.4)] border-r border-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[rgba(31,31,37,0.6)]">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${entityInfo.color}15` }}
          >
            <Zap className="w-3.5 h-3.5" style={{ color: entityInfo.color }} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#E4E1E9] truncate">Tax Strategies</p>
            <p className="text-[10px] text-[#C7C5D3]">
              {totalStrategies} for {entityInfo.label}
            </p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-white/5 text-[#C7C5D3] hover:text-[#FFB596] transition shrink-0"
          title="Hide sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-1.5 px-3 py-2.5 border-b border-white/5">
        <button
          onClick={() => onCategoryFilter(null)}
          className={`px-2 py-1 rounded-md text-[10px] font-medium transition ${
            !categoryFilter
              ? "bg-white/10 text-[#E4E1E9]"
              : "text-[#C7C5D3] hover:bg-white/5"
          }`}
        >
          All
        </button>
        {grouped.map((g) => (
          <button
            key={g.category.id}
            onClick={() => onCategoryFilter(categoryFilter === g.category.id ? null : g.category.id)}
            className={`px-2 py-1 rounded-md text-[10px] font-medium transition flex items-center gap-1 ${
              categoryFilter === g.category.id
                ? "text-[#E4E1E9]"
                : "text-[#C7C5D3] hover:bg-white/5"
            }`}
            style={categoryFilter === g.category.id ? { backgroundColor: `${g.category.color}20` } : undefined}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: g.category.color }}
            />
            {g.category.label}
            <span className="text-[#C7C5D3]/50">({g.strategies.length})</span>
          </button>
        ))}
      </div>

      {/* Strategy list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {filteredGroups.map((group) => (
          <div key={group.category.id} className="mb-3">
            {/* Category header */}
            <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
              <CategoryIcon iconName={group.category.icon} className="w-3.5 h-3.5" />
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: group.category.color }}
              >
                {group.category.label}
              </span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            {/* Strategies in category */}
            {group.strategies.map((strategy) => {
              const isExpanded = expandedId === strategy.id;
              return (
                <button
                  key={strategy.id}
                  onClick={() => onExpandToggle(strategy.id)}
                  className={`w-full text-left rounded-xl px-3 py-2.5 transition-all duration-200 group ${
                    isExpanded
                      ? "bg-white/5 border border-white/10"
                      : "hover:bg-white/[0.03] border border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold leading-tight ${isExpanded ? "text-[#E4E1E9]" : "text-[#C7C5D3] group-hover:text-[#E4E1E9]"} transition`}>
                        {strategy.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-medium text-green-400">
                          {formatCurrency(strategy.typicalSavingsRange.min)}–{formatCurrency(strategy.typicalSavingsRange.max)}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                          strategy.riskLevel === "low" ? "bg-green-500/10 text-green-400"
                          : strategy.riskLevel === "medium" ? "bg-yellow-500/10 text-yellow-400"
                          : "bg-red-500/10 text-red-400"
                        }`}>
                          {strategy.riskLevel}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className={`w-3 h-3 text-[#C7C5D3] shrink-0 mt-1 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>

                  {isExpanded && (
                    <div className="mt-2.5 space-y-2 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                      <p className="text-[11px] text-[#C7C5D3] leading-relaxed">
                        {strategy.description.length > 200 ? strategy.description.slice(0, 200) + "..." : strategy.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1B1B20] text-[#C7C5D3]">
                          {strategy.ircReference}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1B1B20] text-[#C7C5D3]">
                          {strategy.timeToImplement}
                        </span>
                      </div>
                      {strategy.eligibilityCriteria.length > 0 && (
                        <div className="text-[10px] text-[#C7C5D3]/70">
                          <p className="font-semibold text-[#C7C5D3] mb-0.5">Eligibility:</p>
                          <ul className="space-y-0.5 ml-2">
                            {strategy.eligibilityCriteria.slice(0, 3).map((c, ci) => (
                              <li key={ci} className="flex items-start gap-1">
                                <span className="text-green-400 mt-0.5">•</span> {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-2.5 border-t border-white/5 bg-[rgba(31,31,37,0.6)]">
        <p className="text-[9px] text-[#C7C5D3]/50 text-center">
          Strategies based on Corvee Tax Planning methodology
        </p>
      </div>
    </div>
  );
}

export default function SmartPlanPage() {
  // Phase: "entity-select" | "welcome" | "chat" | "voice" | "voice-interview" | "loading" | "results"
  const [phase, setPhase] = useState<"entity-select" | "welcome" | "chat" | "voice" | "voice-interview" | "loading" | "results">("entity-select");

  // Entity type selection
  const [selectedEntity, setSelectedEntity] = useState<EntityType | null>(null);

  // AI conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [coveredIntents, setCoveredIntents] = useState<string[]>([]);
  const [allUserText, setAllUserText] = useState("");  // accumulated user answers
  const [voiceTranscript, setVoiceTranscript] = useState("");

  // Results state
  const [result, setResult] = useState<PlanResult | null>(null);
  const [sliderValues, setSliderValues] = useState<Record<number, number>>({});
  const [contributionValues, setContributionValues] = useState<Record<number, number>>({});
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});

  // Plan history & limits
  const [planHistory, setPlanHistory] = useState<PlanHistoryEntry[]>([]);
  const [showPlanHistory, setShowPlanHistory] = useState(false);

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [recordingDuration, setRecordingDuration] = useState(0);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Strategy sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [expandedSidebarStrategy, setExpandedSidebarStrategy] = useState<string | null>(null);
  const [sidebarCategoryFilter, setSidebarCategoryFilter] = useState<string | null>(null);

  // ---- Qualification Engine V2 state ----
  const [qualSession, setQualSession] = useState<QualSession>(createQualSession());
  const [profileAnswers, setProfileAnswers] = useState<Record<string, string>>({});
  const [profileQIdx, setProfileQIdx] = useState(0);
  const [qualificationActive, setQualificationActive] = useState(false);
  const [overviewShown, setOverviewShown] = useState(false);
  const [questionsStarted, setQuestionsStarted] = useState(false);
  // Refs for use in callbacks (avoids stale closure issues)
  const overviewShownRef = useRef(false);
  const questionsStartedRef = useRef(false);

  // Track if we have a saved client profile
  const [hasProfile, setHasProfile] = useState(false);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [profileSummary, setProfileSummary] = useState("");
  const [profileAnalysis, setProfileAnalysis] = useState<ReturnType<typeof analyzeProfileForEntity> | null>(null);
  const [llmSummary, setLlmSummary] = useState("");
  const [isLoadingLlmSummary, setIsLoadingLlmSummary] = useState(false);

  // Build a text summary string from a client profile
  const buildProfileText = useCallback((cp: ClientProfile): string => {
    const parts: string[] = [];
    if (cp.occupation) parts.push(`I'm a ${cp.occupation}`);
    if (cp.filingStatus) {
      const fsLabel = cp.filingStatus === "mfj" ? "married filing jointly"
        : cp.filingStatus === "mfs" ? "married filing separately"
        : cp.filingStatus === "hoh" ? "head of household"
        : cp.filingStatus;
      parts.push(`filing ${fsLabel}`);
    }
    if (cp.annualIncome) parts.push(`making ${cp.annualIncome} per year`);
    if (cp.dependents > 0) parts.push(`with ${cp.dependents} dependent${cp.dependents > 1 ? "s" : ""}`);
    if (cp.state) parts.push(`living in ${cp.state}`);
    if (cp.incomeSources.length > 0) parts.push(`income from ${cp.incomeSources.join(", ")}`);
    if (cp.hasRealEstate) parts.push("I have real estate/rental properties");
    if (cp.hasBusinessIncome) parts.push("I have business income");
    if (cp.hasMortgage) parts.push("I have a mortgage");
    if (cp.hasRetirementAccounts) parts.push(`retirement accounts: ${cp.retirementAccountTypes.join(", ") || "yes"}`);
    if (cp.hasInvestments) parts.push("I have investments/stocks");
    if (cp.hasCharitableGiving) parts.push("I make charitable donations");
    if (cp.hasInternational) parts.push("I have international income");
    if (cp.businessName) parts.push(`business: ${cp.businessName}`);
    if (cp.businessIncome) parts.push(`business income: ${cp.businessIncome}`);
    if (cp.comprehensiveSummary) {
      parts.push(`Document intelligence: ${cp.comprehensiveSummary}`);
    }
    if (cp.ocrSummary && cp.ocrSummary !== cp.comprehensiveSummary) {
      parts.push(`Prior return summary: ${cp.ocrSummary}`);
    }
    if ((cp.uploadedDocuments || []).length > 0) {
      const docDetails = cp.uploadedDocuments.map(d =>
        `${d.documentType.toUpperCase()} (${d.fileName}): ${d.summary || "processed"}${d.keyFindings?.length ? " — " + d.keyFindings.slice(0, 3).join("; ") : ""}`
      ).join("\n");
      parts.push(`${cp.uploadedDocuments.length} documents analyzed:\n${docDetails}`);
    }
    return parts.join(". ") + ".";
  }, []);

  // LLM-powered profile summary (debounced to prevent UI shaking)
  const fetchLlmSummary = useCallback(async (cp: ClientProfile, entity: EntityType) => {
    setIsLoadingLlmSummary(true);
    try {
      const entityLabel = getEntityInfo(entity).label;
      const profileText = buildProfileText(cp);
      const analysis = analyzeProfileForEntity(cp, entity);
      const greenSlots = analysis.slots.filter((s) => s.status === "green").map((s) => s.label);
      const redSlots = analysis.slots.filter((s) => s.status === "red").map((s) => s.label);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are a tax planning expert for AG FinTax (Anil Grandhi's firm). Summarize a client's tax profile in 2-3 concise sentences. Be specific with numbers. Mention what's strong and what's missing for ${entityLabel} (Form ${getEntityInfo(entity).formNumber}) planning. No markdown, just plain text. Never mention AI or LLM — speak as AG FinTax's expert team.`,
            },
            {
              role: "user",
              content: `Client profile for ${entityLabel} tax planning:\n${profileText}\n\nCovered areas: ${greenSlots.join(", ") || "none"}\nMissing areas: ${redSlots.join(", ") || "none"}\n\nSummarize this profile in 2-3 sentences. Be specific and mention dollar amounts.`,
            },
          ],
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let text = "";
      let lastUpdate = 0;
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
          // Debounce: only update UI every 150ms to prevent shaking
          const now = Date.now();
          if (now - lastUpdate > 150) {
            setLlmSummary(text.trim());
            lastUpdate = now;
          }
        }
        // Final update with complete text
        setLlmSummary(text.trim());
      }
    } catch {
      // Fallback to static summary
      setLlmSummary("");
    } finally {
      setIsLoadingLlmSummary(false);
    }
  }, [buildProfileText]);

  // Load saved entity type + client profile on mount
  useEffect(() => {
    const saved = getEntityType();
    if (saved) {
      setSelectedEntity(saved);
    }

    // Load plan history
    setPlanHistory(getPlanHistory());

    // Check for a previously saved plan — restore it directly
    const existingPlan = getPlan();
    if (existingPlan) {
      setResult({
        strategies: existingPlan.strategies.map((s) => {
          // Use saved steps, or fall back to MASTER_STRATEGIES
          const steps = s.implementationSteps?.length
            ? s.implementationSteps
            : (MASTER_STRATEGIES.find((ms) => ms.title === s.title)?.implementationSteps ?? []);
          return {
            title: s.title,
            category: s.category,
            description: s.description,
            estimatedSavings: s.estimatedSavings,
            savingsMin: s.savingsMin,
            savingsMax: s.savingsMax,
            implementationSteps: steps,
          };
        }),
        totalEstimatedSavings: existingPlan.totalSavings,
        profile: existingPlan.profile,
      });
      if (existingPlan.entityType) {
        setSelectedEntity(existingPlan.entityType);
      }
      // Initialize slider values from saved data
      const sv: Record<number, number> = {};
      const cvInit: Record<number, number> = {};
      existingPlan.strategies.forEach((s, i) => {
        sv[i] = s.estimatedSavings;
        const cc = getContributionConfig(s as Strategy, existingPlan.profile);
        if (cc.isContribution && s.estimatedSavings > 0) {
          const rate = (existingPlan.profile as PlanResult['profile']).marginalRate || 24;
          cvInit[i] = Math.min(Math.round(s.estimatedSavings / (rate / 100)), cc.max);
        }
      });
      setSliderValues(sv);
      setContributionValues(cvInit);
      setPhase("results");
    } else if (saved) {
      setPhase("welcome");
    }

    // Check for saved client profile — any data counts
    const cp = getClientProfile();
    if (cp) {
      setClientProfile(cp);
      const hasAnyData = !!(cp.occupation || cp.annualIncome || cp.filingStatus || cp.state || cp.incomeSources.length > 0 || cp.hasRealEstate || cp.hasRetirementAccounts);
      if (hasAnyData) {
        setHasProfile(true);
        setProfileSummary(buildProfileText(cp));
      }
      // Compute analysis for entity
      const entityForAnalysis = existingPlan?.entityType || saved;
      if (entityForAnalysis) {
        const analysis = analyzeProfileForEntity(cp, entityForAnalysis);
        setProfileAnalysis(analysis);
        // Fetch LLM summary if profile has meaningful data
        if (hasAnyData) {
          fetchLlmSummary(cp, entityForAnalysis);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle entity selection
  const handleEntitySelect = (entityType: EntityType) => {
    setSelectedEntity(entityType);
    saveEntityType(entityType);
    // Recompute profile analysis for this entity
    if (clientProfile) {
      const analysis = analyzeProfileForEntity(clientProfile, entityType);
      setProfileAnalysis(analysis);
      setLlmSummary(""); // reset for new entity
      if (hasProfile) fetchLlmSummary(clientProfile, entityType);
    }
    setPhase("welcome");
  };

  // Change entity type (go back to selector)
  const changeEntityType = () => {
    setPhase("entity-select");
  };

  /* ---- voice helpers (must be defined before AI functions that use them) ---- */
  const stopVoiceInput = useCallback(() => {
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
    setIsRecording(false);
  }, []);

  // Category color map for tiles
  const CATEGORY_COLORS: Record<string, { color: string; icon: string }> = {
    'Retirement Planning': { color: '#A78BFA', icon: 'PiggyBank' },
    Retirement: { color: '#A78BFA', icon: 'PiggyBank' },
    Compensation: { color: '#38BDF8', icon: 'Banknote' },
    Charity: { color: '#F472B6', icon: 'Heart' },
    Credits: { color: '#34D399', icon: 'BadgeDollarSign' },
    Deductions: { color: '#60A5FA', icon: 'Receipt' },
    Education: { color: '#34D399', icon: 'GraduationCap' },
    'Investable Gains': { color: '#FBBF24', icon: 'TrendingUp' },
    Assets: { color: '#FB923C', icon: 'TrendingUp' },
    Advanced: { color: '#C084FC', icon: 'Zap' },
    Medical: { color: '#22D3EE', icon: 'HeartPulse' },
    Business: { color: '#F59E0B', icon: 'Building2' },
    'Real Estate': { color: '#FB923C', icon: 'Building2' },
    Entity: { color: '#818CF8', icon: 'Landmark' },
  };

  // Build overview prompt for LLM — explains candidates and asks to proceed
  const buildOverviewPrompt = useCallback((session: ReturnType<typeof createQualSession>, tiles: StrategyTile[], autoQualified: string[]) => {
    const profile = session.profile;
    const profileDesc = profile
      ? `${profile.occupation || 'Professional'}, ${profile.filingStatus}, ~$${profile.annualIncome.toLocaleString()} income, ${profile.dependents} dependents, age ~${profile.age}, ${profile.state}`
      : 'Profile not yet complete';

    const candidateList = session.candidates.map(s => {
      const status = session.qualifiedIds.includes(s.id) ? '✅ QUALIFIED' :
        session.disqualifiedIds.includes(s.id) ? '❌ Not applicable' : '🔍 Needs verification';
      return `- ${s.title} (${s.category}) — ${s.ircReference} — Savings: $${s.typicalSavingsRange.min.toLocaleString()}–$${s.typicalSavingsRange.max.toLocaleString()} — ${status}`;
    }).join('\n');

    const remaining = session.candidates.length - session.qualifiedIds.length - session.disqualifiedIds.length;

    return `You are a senior CPA at AG FinTax presenting a tax strategy overview. Be direct, professional, and concise. NO emojis. NO exclamation marks. NO filler words like "excellent", "exciting", "great news". Write like a professional tax advisor, not a chatbot.

CLIENT: ${profileDesc}

STRATEGIES EVALUATED (${session.candidates.length} candidates):
${candidateList}

ALREADY QUALIFIED (${autoQualified.length}): ${autoQualified.join(', ') || 'None yet'}
NEED VERIFICATION: ${remaining} strategies

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

**Strategy Overview**

I've reviewed your profile against ${session.candidates.length} tax strategies. Here's where you stand:

**Already Qualified** (list each with 1-line explanation using their specific numbers)

**Needs Verification** (list each strategy name with savings range and a 1-line explanation of what it is and why it might apply)

**Next Steps**
I need to ask ${Math.min(remaining, 8)} quick questions to confirm the remaining strategies. Each question determines whether a specific strategy applies to your situation.

Shall we proceed?

STRICT RULES:
- NO emojis anywhere
- NO markdown headers with # — use **bold** only
- Each strategy: name, savings range, and ONE sentence about what it does for THIS client
- Use their exact numbers ($${profile?.annualIncome?.toLocaleString() || 'N/A'} income, ${profile?.dependents || 0} dependents, ${profile?.filingStatus || 'unknown'} filing)
- Sound like a CPA in a meeting, not a chatbot
- Keep total response under 300 words
- Do NOT add "Remember to consult..." disclaimers

[SUGGESTIONS]
Yes, let's proceed with the questions
Tell me more about a specific strategy
Skip to building my plan
[/SUGGESTIONS]`;
  }, []);

  // Start guided chat — show strategy category tiles, then LLM explains overview
  useEffect(() => {
    if (phase === "chat" && messages.length === 0) {
      const session = autoInitQualSession();

      // Build structured category tiles
      const categoriesMap = new Map<string, { count: number; qualified: number; strategies: string[] }>();
      for (const s of session.candidates) {
        const cat = s.category;
        const existing = categoriesMap.get(cat) || { count: 0, qualified: 0, strategies: [] };
        existing.count++;
        if (session.qualifiedIds.includes(s.id)) existing.qualified++;
        existing.strategies.push(s.title);
        categoriesMap.set(cat, existing);
      }

      const tiles: StrategyTile[] = Array.from(categoriesMap.entries()).map(([cat, info]) => ({
        category: cat,
        count: info.count,
        qualified: info.qualified,
        color: CATEGORY_COLORS[cat]?.color || '#C7C5D3',
        icon: CATEGORY_COLORS[cat]?.icon || 'Zap',
        strategies: info.strategies,
      }));

      const autoQualified = session.candidates
        .filter(s => session.qualifiedIds.includes(s.id))
        .map(s => s.title);

      // Show tiles immediately, then LLM generates personalized overview
      const placeholderText = `Analyzing your profile against ${session.candidates.length} strategies...`;

      if (hasProfile && profileSummary) {
        const detected = detectCoveredIntents(profileSummary);
        setCoveredIntents(detected);
        setAllUserText(profileSummary);

        const entityLabel = selectedEntity ? getEntityInfo(selectedEntity).label : "Individual";
        const redSlots = profileAnalysis?.slots.filter((s) => s.status === "red").map((s) => s.label) || [];
        const missingNote = redSlots.length > 0 ? `\n\nI still need help with: ${redSlots.join(", ")}.` : "";
        const profileMessage = `Here's my tax profile for ${entityLabel} planning:\n\n${profileSummary}${missingNote}`;

        setMessages([
          { role: "user", text: profileMessage },
          { role: "bot", text: placeholderText, tiles, autoQualified },
        ]);

        // LLM generates personalized overview
        const overviewPrompt = buildOverviewPrompt(session, tiles, autoQualified);
        setIsAiThinking(true);
        callAI(overviewPrompt, profileMessage).then(() => {
          setIsAiThinking(false);
          setOverviewShown(true);
          overviewShownRef.current = true;
        });
      } else {
        setMessages([
          { role: "bot", text: placeholderText, tiles, autoQualified },
        ]);
        const overviewPrompt = buildOverviewPrompt(session, tiles, autoQualified);
        setIsAiThinking(true);
        callAI(overviewPrompt, "").then(() => {
          setIsAiThinking(false);
          setOverviewShown(true);
          overviewShownRef.current = true;
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Start chat mode
  const startChatMode = () => { setPhase("chat"); };
  // Start voice mode
  const startVoiceMode = () => { setPhase("voice"); setVoiceTranscript(""); };
  // Start structured voice interview mode
  const startVoiceInterview = () => { setPhase("voice-interview"); };

  // Get entity-aware interview sections for the structured voice flow
  const interviewSections = React.useMemo(() => {
    const entityMap: Record<string, string | undefined> = {
      individual: "individual", s_corp: "s_corp", c_corp: "c_corp", partnership: "partnership", sole_prop: "sole_prop",
    };
    const entity = selectedEntity ? entityMap[selectedEntity] : undefined;
    const cp = clientProfile || getClientProfile();
    const hasRE = cp?.hasRealEstate;
    const hasKids = cp ? cp.dependents > 0 : undefined;
    const inc = cp?.annualIncome ? parseInt(cp.annualIncome.replace(/[^0-9]/g, "")) : undefined;
    return getInterviewSections(entity, inc, hasRE, hasKids);
  }, [selectedEntity, clientProfile]);

  // Handle voice interview completion → initialize V2 qualification engine with voice data
  const handleVoiceInterviewComplete = useCallback((answers: Record<string, string>, _qualifiedStrategies: string[]) => {
    // Map V1 voice interview answers to V2 profile
    const entityRaw = (answers['p_entity_type'] || '').toLowerCase();
    const entityMap: Record<string, "individual" | "sole_prop" | "s_corp" | "c_corp" | "partnership"> = {
      "i'm a w-2 employee (no business)": "individual",
      "sole proprietorship or single-member llc": "sole_prop",
      "llc with s-corp election": "s_corp",
      "s-corporation": "s_corp",
      "c-corporation": "c_corp",
      "partnership": "partnership",
    };
    const mappedEntity = entityMap[entityRaw] || selectedEntity || "individual";

    const filingRaw = (answers['p_filing_status'] || '').toLowerCase();
    const filingMap: Record<string, "single" | "married_jointly" | "married_separately" | "head_of_household"> = {
      "single": "single",
      "married filing jointly": "married_jointly",
      "married filing separately": "married_separately",
      "head of household": "head_of_household",
    };
    const filing = filingMap[filingRaw] || "single";

    // Parse income from voice answer
    const incomeRaw = answers['p_income'] || '';
    const incomeMap: Record<string, number> = {
      "under $75,000": 60000, "$75,000 to $150,000": 112000,
      "$150,000 to $300,000": 225000, "$300,000 to $500,000": 400000,
      "$500,000 to $1 million": 750000, "over $1 million": 1200000,
    };
    const incomeNum = incomeMap[incomeRaw] || parseIncomeToNumber(incomeRaw) || 100000;

    // Parse dependents
    const depsRaw = answers['p_dependents'] || '';
    const depsMap: Record<string, number> = {
      "no dependents": 0, "1 child": 1, "2 children": 2, "3 or more children": 3, "other dependents": 1,
    };
    const dependents = depsMap[depsRaw.toLowerCase()] || 0;

    const hasBusiness = mappedEntity !== "individual";
    const cp = clientProfile || getClientProfile();

    // Build V2 profile from voice answers + any existing profile data
    const profile = {
      entityType: mappedEntity,
      filingStatus: filing,
      annualIncome: incomeNum,
      dependents,
      state: answers['p_state'] || cp?.state || "Unknown",
      hasBusinessIncome: hasBusiness,
      age: 40, // default
      hasInvestments: cp?.hasInvestments,
      hasRealEstate: cp?.hasRealEstate,
      hasCharitableGiving: cp?.hasCharitableGiving,
      hasRetirementAccounts: cp?.hasRetirementAccounts,
      retirementAccountTypes: cp?.retirementAccountTypes || [],
      hasMortgage: cp?.hasMortgage,
      hasHealthInsurance: cp?.hasHealthInsurance,
      incomeSources: hasBusiness ? ['Business'] : ['W-2'],
      occupation: answers['p_occupation'] || cp?.occupation || "",
    };

    // Initialize V2 session with the voice-derived profile
    const newSession = initQualWithProfile(createQualSession(), profile);

    // Also inject any strategy-specific answers from the voice interview
    // (V1 strategy question IDs like rc_*, ar_*, etc. won't overlap with V2 IDs)
    const summaryParts: string[] = [];
    for (const [key, value] of Object.entries(answers)) {
      if (value && value !== "skipped") {
        const label = key.replace(/^[a-z]+_/, "").replace(/_/g, " ");
        summaryParts.push(`${label}: ${value}`);
      }
    }
    setAllUserText(`Voice interview completed. ${summaryParts.join(". ")}`);

    setQualSession(newSession);
    setQualificationActive(true);
    overviewShownRef.current = false;
    questionsStartedRef.current = false;
    setMessages([]);
    setPhase("chat");
  }, [selectedEntity, clientProfile]);

  /** Helper: Call AI and return clean text (strips [SUGGESTIONS] and [READY_TO_ANALYZE] for display) */
  const callAI = async (systemPrompt: string, userText: string, strategyInfo?: StrategyInfoContext): Promise<string> => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.filter(m => m.text).map(m => ({
            role: m.role === "bot" ? "assistant" : "user",
            content: m.text,
          })),
          ...(userText ? [{ role: "user" as const, content: userText }] : []),
        ],
      }),
    });

    if (!res.ok) throw new Error("AI request failed");

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";

    // Add empty bot message for streaming (with strategy info if available)
    const botMsg: ChatMessage = { role: "bot", text: "", strategyInfo };
    setMessages(prev => [...prev, botMsg]);

    if (reader) {
      let lastStreamUpdate = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const now = Date.now();
        if (now - lastStreamUpdate > 80) {
          const sugIdx = accumulated.indexOf("[SUGGESTIONS]");
          const readyIdx = accumulated.indexOf("[READY_TO_ANALYZE]");
          let displayText = accumulated;
          if (sugIdx > -1) displayText = displayText.substring(0, sugIdx);
          if (readyIdx > -1) displayText = displayText.replace("[READY_TO_ANALYZE]", "");
          displayText = displayText.trim();
          setMessages(prev => {
            const copy = [...prev];
            copy[copy.length - 1] = { ...copy[copy.length - 1], text: displayText };
            return copy;
          });
          lastStreamUpdate = now;
        }
      }
    }

    // Parse suggestions and clean up
    let suggestions: string[] = [];
    const sugMatch = accumulated.match(/\[SUGGESTIONS\]([\s\S]*?)\[\/SUGGESTIONS\]/);
    if (sugMatch) {
      suggestions = sugMatch[1].split("\n").map(s => s.trim()).filter(Boolean);
    }
    let cleanText = accumulated;
    cleanText = cleanText.replace(/\[SUGGESTIONS\][\s\S]*?\[\/SUGGESTIONS\]/, "").trim();
    const hasReady = cleanText.includes("[READY_TO_ANALYZE]");
    cleanText = cleanText.replace("[READY_TO_ANALYZE]", "").trim();

    // Update final message (preserve strategyInfo)
    setMessages(prev => {
      const copy = [...prev];
      copy[copy.length - 1] = {
        ...copy[copy.length - 1],
        text: cleanText,
        buttons: suggestions.length > 0 ? suggestions : undefined,
        strategyInfo: copy[copy.length - 1].strategyInfo,
      };
      return copy;
    });

    return hasReady ? accumulated : cleanText;
  };

  /** Helper: Add a bot message (used when we already have the text) */
  const addBotMessage = (text: string) => {
    // The bot message was already added and updated by callAI streaming,
    // so this is a no-op. But it signals intent clearly.
  };

  /** Helper: Build StrategyInfoContext from a question result */
  const buildStrategyInfo = (q: { strategy: { title: string; description: string; category: string; ircReference: string; typicalSavingsRange: { min: number; max: number } }; question: { helpText: string }; questionIndex?: number; totalQuestions?: number; strategyIndex?: number; totalStrategies?: number }): StrategyInfoContext => ({
    strategyTitle: q.strategy.title,
    strategyDescription: q.strategy.description,
    category: q.strategy.category,
    ircReference: q.strategy.ircReference,
    savingsRange: q.strategy.typicalSavingsRange,
    questionHelpText: q.question.helpText,
    questionIndex: q.questionIndex || 0,
    totalQuestions: q.totalQuestions || 0,
    strategyIndex: q.strategyIndex || 0,
    totalStrategies: q.totalStrategies || 0,
  });

  /**
   * Auto-initialize qualification session from existing profile + entity selection.
   * Called once when chat starts — skips the rigid profile form.
   */
  const autoInitQualSession = useCallback(() => {
    if (qualSession.profileComplete) return qualSession; // already initialized

    // Build profile from existing data (entity selection + client profile from localStorage)
    const cp = clientProfile || getClientProfile();
    const entityType = selectedEntity || cp?.entityType || "individual";

    // Map entity type
    const entityMap: Record<string, "individual" | "sole_prop" | "s_corp" | "c_corp" | "partnership"> = {
      individual: "individual", sole_prop: "sole_prop", s_corp: "s_corp",
      c_corp: "c_corp", partnership: "partnership",
    };
    const mappedEntity = entityMap[entityType] || "individual";

    // Map filing status from client profile
    const filingMap: Record<string, "single" | "married_jointly" | "married_separately" | "head_of_household"> = {
      single: "single", mfj: "married_jointly", mfs: "married_separately", hoh: "head_of_household",
      "married filing jointly": "married_jointly", "married filing separately": "married_separately",
      "head of household": "head_of_household",
    };
    const filing = cp?.filingStatus ? (filingMap[cp.filingStatus.toLowerCase()] || "single") : "single";

    // Parse income
    const incomeStr = cp?.annualIncome || "";
    const incomeNum = incomeStr ? parseIncomeToNumber(incomeStr) : 100000;

    const profile = {
      entityType: mappedEntity,
      filingStatus: filing,
      annualIncome: incomeNum,
      dependents: cp?.dependents || 0,
      state: cp?.state || "Unknown",
      hasBusinessIncome: cp?.hasBusinessIncome || mappedEntity !== "individual",
      age: 40, // default
      // Extended fields for smart pre-fill
      // IMPORTANT: pass undefined (not false) when unknown — engine will ASK instead of killing strategies
      hasInvestments: cp?.hasInvestments,           // undefined = ask
      hasRealEstate: cp?.hasRealEstate,             // undefined = ask
      hasCharitableGiving: cp?.hasCharitableGiving,  // undefined = ask
      hasRetirementAccounts: cp?.hasRetirementAccounts, // undefined = ask
      retirementAccountTypes: cp?.retirementAccountTypes || [],
      hasMortgage: cp?.hasMortgage,                 // undefined = ask
      hasHealthInsurance: cp?.hasHealthInsurance,     // undefined = ask
      incomeSources: cp?.incomeSources || [],
      occupation: cp?.occupation || "",
    };

    const newSession = initQualWithProfile(qualSession, profile);
    setQualSession(newSession);
    setQualificationActive(true);
    return newSession;
  }, [qualSession, clientProfile, selectedEntity]);

  /**
   * Core AI conversation function — qualification-driven
   * Auto-builds profile from existing data, then asks qualification questions
   * one at a time. No rigid profile form.
   */
  const aiRespond = useCallback(async (userText: string) => {
    setIsAiThinking(true);

    // Track legacy intents for backward-compat
    const combinedText = allUserText + " " + userText;
    const newCovered = detectCoveredIntents(combinedText);
    setCoveredIntents(newCovered);
    setAllUserText(combinedText);

    try {
      // Auto-initialize qualification session if not done yet
      let session = qualSession;
      if (!session.profileComplete) {
        session = autoInitQualSession();
      }

      // ---- Session already ready (all strategies auto-resolved) → generate ----
      if (session.phase === 'ready' && overviewShownRef.current) {
        const resolvedSession = resolveUnresolved(session);
        setQualSession(resolvedSession);
        const rSummary = getSessionSummary(resolvedSession);
        if (rSummary.qualified > 0) {
          setMessages(prev => [...prev, { role: "bot", text: `I've identified **${rSummary.qualified} strategies** for your profile. Building your personalized plan now...` }]);
          setTimeout(() => triggerQualifiedPlanGeneration(), 500);
        }
        setIsAiThinking(false);
        return;
      }

      // ---- After overview: user confirms → start first question ----
      if (session.phase === 'qualifying' && overviewShownRef.current && !questionsStartedRef.current) {
        // User just confirmed they want to proceed — ask the FIRST question
        setQuestionsStarted(true);
        questionsStartedRef.current = true;
        const firstQ = getNextQuestion(
          session.candidates,
          session.qualifiedIds,
          session.disqualifiedIds,
          session.answers
        );

        if (firstQ) {
          const summary = getSessionSummary(session);
          const conversationHistory = messages
            .map(m => `${m.role === "bot" ? "Advisor" : "Client"}: ${m.text}`)
            .join("\n");
          const prompt = buildQualificationPrompt(
            session.profile,
            firstQ,
            summary.qualified,
            summary.remaining,
            summary.disqualified,
            conversationHistory
          );
          await callAI(prompt, userText, buildStrategyInfo(firstQ));
          setIsAiThinking(false);
          return;
        }
        // No questions needed — go straight to ready
        const resolvedSession = resolveUnresolved(session);
        setQualSession(resolvedSession);
        const rSummary = getSessionSummary(resolvedSession);
        if (rSummary.qualified > 0) {
          setTimeout(() => triggerQualifiedPlanGeneration(), 500);
        }
        setIsAiThinking(false);
        return;
      }

      // ---- Qualification Questions (ongoing) ----
      if (session.phase === 'qualifying' && questionsStartedRef.current) {
        const currentQ = getNextQuestion(
          session.candidates,
          session.qualifiedIds,
          session.disqualifiedIds,
          session.answers
        );

        // Process answer if user responded to a qualification question
        if (currentQ && userText) {
          const updatedSession = processQualAnswer(session, currentQ.question.id, userText);
          setQualSession(updatedSession);
          session = updatedSession;

          // Check if done or get next question
          const nextQ = getNextQuestion(
            updatedSession.candidates,
            updatedSession.qualifiedIds,
            updatedSession.disqualifiedIds,
            updatedSession.answers
          );

          const summary = getSessionSummary(updatedSession);
          const conversationHistory = messages
            .map(m => `${m.role === "bot" ? "Advisor" : "Client"}: ${m.text}`)
            .join("\n");

          if (updatedSession.phase === 'ready' || !nextQ) {
            // Resolve any strategies still in limbo (pre-disqualified by answers but not recorded)
            const resolvedSession = resolveUnresolved(updatedSession);
            setQualSession(resolvedSession);
            session = resolvedSession;
            const resolvedSummary = getSessionSummary(resolvedSession);

            // All done — tell user and offer to generate
            const prompt = buildQualificationPrompt(
              resolvedSession.profile,
              null,
              resolvedSummary.qualified,
              resolvedSummary.remaining,
              resolvedSummary.disqualified,
              conversationHistory
            );
            const aiText = await callAI(prompt, userText);
            if (aiText.includes("[READY_TO_ANALYZE]") && resolvedSummary.qualified > 0) {
              setTimeout(() => triggerQualifiedPlanGeneration(), 1000);
            }
            setIsAiThinking(false);
            return;
          }

          // Ask the next qualification question
          const prompt = buildQualificationPrompt(
            updatedSession.profile,
            nextQ,
            summary.qualified,
            summary.remaining,
            summary.disqualified,
            conversationHistory
          );
          await callAI(prompt, userText, buildStrategyInfo(nextQ));
          setIsAiThinking(false);
          return;
        }

        // First question (no user answer yet — starting the conversation)
        if (currentQ) {
          const summary = getSessionSummary(session);
          const conversationHistory = messages
            .map(m => `${m.role === "bot" ? "Advisor" : "Client"}: ${m.text}`)
            .join("\n");
          const prompt = buildQualificationPrompt(
            session.profile,
            currentQ,
            summary.qualified,
            summary.remaining,
            summary.disqualified,
            conversationHistory
          );
          await callAI(prompt, userText, buildStrategyInfo(currentQ));
          setIsAiThinking(false);
          return;
        }
      }

      // ---- Fallback: if no qualification questions remain, use legacy flow ----
      const conversationHistory = messages
        .map(m => `${m.role === "bot" ? "Advisor" : "Client"}: ${m.text}`)
        .join("\n");
      const systemPrompt = buildConversationPrompt(newCovered, conversationHistory, selectedEntity || undefined);
      await callAI(systemPrompt, userText);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "bot", text: "I had trouble processing that. Could you try rephrasing?" },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  }, [messages, allUserText, coveredIntents, qualSession, qualificationActive, overviewShown, questionsStarted, selectedEntity, autoInitQualSession]);

  /**
   * Process voice transcript — AI analyzes what's covered and asks for more
   */
  const processVoiceTranscript = useCallback(async (transcript: string) => {
    stopVoiceInput();
    const detected = detectCoveredIntents(transcript);
    setCoveredIntents(detected);
    setAllUserText(transcript);

    // Switch to chat mode with the transcript as first user message
    setMessages([{ role: "user", text: transcript }]);
    setPhase("chat");
    setIsAiThinking(true);

    // AI analyzes what was said and asks for what's missing
    const prompt = buildVoiceAnalysisPrompt(transcript, detected, selectedEntity || undefined);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: transcript },
          ],
        }),
      });

      if (!res.ok) throw new Error("Failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      const botMsg: ChatMessage = { role: "bot", text: "" };
      setMessages((prev) => [...prev, botMsg]);

      if (reader) {
        let lastVoiceUpdate = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          const now = Date.now();
          if (now - lastVoiceUpdate > 80) {
            setMessages((prev) => {
              const copy = [...prev];
              copy[copy.length - 1] = { ...copy[copy.length - 1], text: accumulated };
              return copy;
            });
            lastVoiceUpdate = now;
          }
        }
        // Final update
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { ...copy[copy.length - 1], text: accumulated };
          return copy;
        });
      }

      if (accumulated.includes("[READY_TO_ANALYZE]")) {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            ...copy[copy.length - 1],
            text: accumulated.replace("[READY_TO_ANALYZE]", "").trim(),
          };
          return copy;
        });
        setTimeout(() => triggerPlanGeneration(transcript), 1000);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "bot", text: "I had trouble analyzing that. Let me ask you some questions instead." }]);
    } finally {
      setIsAiThinking(false);
    }
  }, [stopVoiceInput]);

  /**
   * Trigger plan generation from accumulated text + client profile
   */
  const triggerPlanGeneration = (fullText: string) => {
    // Enforce free-tier plan limit
    if (!canCreatePlan()) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: `You've reached your free plan limit (${FREE_PLAN_LIMIT} plans). Upgrade to Pro for unlimited plans and advanced strategies.` },
      ]);
      return;
    }

    setPhase("loading");
    setMessages((prev) => [...prev, { role: "bot", text: "Building your personalized tax plan..." }]);

    // Build profile answers from clientProfile state (if loaded) — these feed into
    // both the AI API call and the client-side strategy filter
    const cp = clientProfile || getClientProfile();
    const answers: Record<string, string> = {
      additional_context: fullText,
      entity_type: selectedEntity || cp?.entityType || "individual",
      occupation: cp?.occupation || "",
      filing_status: cp?.filingStatus || "",
      annual_income: cp?.annualIncome || "",
      dependents: String(cp?.dependents ?? 0),
      state: cp?.state || "",
      real_estate: cp?.hasRealEstate ? "Yes" : "No",
      mortgage: cp?.hasMortgage ? "Yes" : "No",
      self_employment: cp?.hasBusinessIncome || (cp?.incomeSources || []).includes("Self-Employment") ? "Yes" : "No",
      health_insurance: cp?.hasHealthInsurance ? "Yes" : "No",
      home_office: cp?.hasBusinessIncome ? "Yes" : "No",
      children_under_18: String(cp?.dependents ?? 0),
    };

    console.log("=== SMART PLAN GENERATION STARTED ===");
    console.log("Client Profile from localStorage:", cp);
    console.log("Answers being sent:", answers);
    console.log("Selected Entity:", selectedEntity);
    console.log("Income (raw):", answers.annual_income, "→ parsed:", parseIncomeToNumber(answers.annual_income || "100000"));
    console.log("Applicable strategies count:", getApplicableStrategies(answers).length);
    console.log("Strategy names:", getApplicableStrategies(answers).map(s => s.title));

    submitPlan(answers);
  };

  /**
   * Trigger plan generation using ONLY qualified strategies from the qualification engine
   */
  const triggerQualifiedPlanGeneration = () => {
    if (!canCreatePlan()) {
      setMessages(prev => [
        ...prev,
        { role: "bot", text: `You've reached your free plan limit (${FREE_PLAN_LIMIT} plans). Upgrade to Pro for unlimited plans and advanced strategies.` },
      ]);
      return;
    }

    const summary = getSessionSummary(qualSession);
    if (summary.qualified === 0) {
      setMessages(prev => [
        ...prev,
        { role: "bot", text: "We haven't identified any qualified strategies yet. Let's continue the interview to find the best strategies for you." },
      ]);
      return;
    }

    setPhase("loading");
    setMessages(prev => [...prev, { role: "bot", text: `Building your personalized tax plan with ${summary.qualified} qualified strategies...` }]);

    // Build answers for submitPlan from qualification session
    const profile = qualSession.profile;
    const answers: Record<string, string> = {
      additional_context: allUserText,
      entity_type: profile?.entityType || selectedEntity || "individual",
      occupation: "",
      filing_status: profile?.filingStatus || "",
      annual_income: profile ? String(profile.annualIncome) : "",
      dependents: profile ? String(profile.dependents) : "0",
      state: profile?.state || "",
      real_estate: "No",
      mortgage: "No",
      self_employment: profile?.hasBusinessIncome ? "Yes" : "No",
      health_insurance: "No",
      home_office: "No",
      children_under_18: profile ? String(profile.dependents) : "0",
    };

    // Override submitPlan to use qualified strategies
    submitQualifiedPlan(answers, summary.qualifiedStrategies);
  };

  /** Submit plan using ONLY strategies that passed qualification gates */
  const submitQualifiedPlan = async (answers: Record<string, string>, qualifiedStrategies: ReturnType<typeof getSessionSummary>["qualifiedStrategies"]) => {
    stopVoiceInput();

    const profile = qualSession.profile;
    const entity = profile?.entityType || selectedEntity || "individual";
    const incomeNum = profile?.annualIncome || 100000;
    const filingStatus = profile?.filingStatus || "single";
    const dependents = profile?.dependents || 0;
    const state = profile?.state || "";

    const filingLabel = filingStatus === "married_jointly" ? "Married Filing Jointly"
      : filingStatus === "married_separately" ? "Married Filing Separately"
      : filingStatus === "head_of_household" ? "Head of Household"
      : filingStatus === "single" ? "Single"
      : filingStatus;
    const incomeDisplay = incomeNum >= 1_000_000
      ? `$${(incomeNum / 1_000_000).toFixed(1)}M`
      : `$${(incomeNum / 1_000).toFixed(0)}K`;

    // ── Compute marginal rate early so displayProfile can reference it ──
    const marginalRate = profile ? getMarginalRate(profile.annualIncome, profile.filingStatus) : 24;

    const displayProfile = {
      occupation: "Professional",
      filingStatus: filingLabel,
      income: incomeDisplay,
      dependents: String(dependents),
      state,
      rawIncome: incomeNum,
      marginalRate,
      filingStatusRaw: filingStatus,
    };

    // ── STEP 1: Calculate savings deterministically from qualification answers ──
    const qualAnswers = qualSession.answers || {};
    const qualStrategyIds = qualifiedStrategies.map(qs => qs.id);
    const calculatedSavingsMap = profile
      ? calculateAllSavings(qualStrategyIds, qualAnswers, profile)
      : new Map<string, ReturnType<typeof calculateAllSavings> extends Map<string, infer V> ? V : never>();

    console.log("=== CALCULATED SAVINGS (Math-Based) ===");
    calculatedSavingsMap.forEach((calc, id) => {
      console.log(`  ${id}: $${calc.estimatedSavings.toLocaleString()} | ${calc.calculation}`);
    });

    // Map qualified strategies from strategy-database to the API format
    const strategyData = qualifiedStrategies.map(qs => {
      const calc = calculatedSavingsMap.get(qs.id);
      return {
        id: qs.id,
        title: qs.title,
        category: qs.category,
        description: qs.description,
        ircReference: qs.ircReference,
        savingsFormula: qs.savingsFormula,
        typicalSavingsRange: qs.typicalSavingsRange,
        eligibilityCriteria: qs.implementationSteps.slice(0, 3),
        implementationSteps: qs.implementationSteps,
        // Pass calculated savings so AI knows the target number
        calculatedSavings: calc ? calc.estimatedSavings : undefined,
        calculationExplanation: calc ? calc.calculation : undefined,
      };
    });
    const strategyNames = qualifiedStrategies.map(qs => qs.title);

    console.log("=== QUALIFIED PLAN GENERATION ===");
    console.log(`Qualified strategies: ${strategyNames.length}`, strategyNames);
    console.log(`Profile: ${entity}, $${incomeNum}, ${filingStatus}, marginal rate: ${marginalRate}%`);
    console.log(`Qualification answers:`, Object.keys(qualAnswers).length, "answers collected");

    const profilePayload = {
      occupation: profile?.occupation || clientProfile?.occupation || "Professional",
      filingStatus,
      income: incomeNum,
      dependents,
      hasRealEstate: profile?.hasRealEstate || false,
      hasBusinessIncome: profile?.hasBusinessIncome || false,
      hasMortgage: profile?.hasMortgage || false,
      hasInvestments: profile?.hasInvestments || false,
      hasCharitableGiving: profile?.hasCharitableGiving || false,
      state,
      additionalInfo: answers.additional_context || "",
      entityType: entity,
    };

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);

      const res = await fetch("/api/smart-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          profile: profilePayload,
          referenceStrategies: strategyNames,
          referenceStrategyData: strategyData,
          // ── Pass qualification answers so AI can reference actual client data ──
          qualificationAnswers: qualAnswers,
          marginalRate,
        }),
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // ── STEP 2: Override AI savings with CALCULATED savings where available ──
      const allStrats: Strategy[] = (data.strategies || []).map((s: Strategy) => {
        const calc = calculatedSavingsMap.get(s.id || '');
        if (calc && calc.estimatedSavings >= 0) {
          return {
            ...s,
            estimatedSavings: calc.estimatedSavings,
            savingsMin: calc.savingsMin,
            savingsMax: calc.savingsMax,
            // Keep AI description but ensure savings numbers match calculator
          };
        }
        return s;
      });

      const actionable = allStrats.filter((s: Strategy) => s.estimatedSavings > 0);
      const longTerm = allStrats.filter((s: Strategy) => s.estimatedSavings === 0);
      actionable.sort((a: Strategy, b: Strategy) => b.estimatedSavings - a.estimatedSavings);
      const sortedStrategies = [...actionable, ...longTerm];
      const actionableTotal = actionable.reduce((sum: number, s: Strategy) => sum + s.estimatedSavings, 0);

      const planResult: PlanResult = {
        strategies: sortedStrategies,
        totalEstimatedSavings: actionableTotal,
        profile: displayProfile,
      };
      setResult(planResult);

      savePlan({
        entityType: entity as EntityType,
        profile: displayProfile,
        strategies: planResult.strategies.map(s => ({
          title: s.title,
          category: s.category,
          description: s.description,
          estimatedSavings: s.estimatedSavings,
          savingsMin: s.savingsMin,
          savingsMax: s.savingsMax,
          implementationSteps: s.implementationSteps,
          ircReference: s.ircReference,
          applicability: s.applicability,
          id: s.id,
        })),
        totalSavings: planResult.totalEstimatedSavings,
        createdAt: new Date().toISOString(),
        coveredIntents: coveredIntents,
      });

      setPlanHistory(getPlanHistory());

      const sv: Record<number, number> = {};
      const cv: Record<number, number> = {};
      sortedStrategies.forEach((s: Strategy, i: number) => {
        sv[i] = s.estimatedSavings;
        const cc = getContributionConfig(s, planResult.profile);
        if (cc.isContribution && s.estimatedSavings > 0) {
          const rate = marginalRate || 24;
          cv[i] = Math.min(Math.round(s.estimatedSavings / (rate / 100)), cc.max);
        }
      });
      setSliderValues(sv);
      setContributionValues(cv);
      setPhase("results");
    } catch (err) {
      console.error("=== QUALIFIED PLAN API FAILED ===", err);
      setMessages(prev => [
        ...prev,
        { role: "bot", text: `Unable to generate your tax plan. ${err instanceof Error ? err.message : "Please try again."}` },
      ]);
      setPhase("chat");
    }
  };

  // Auto-scroll chat — flex-col-reverse handles most cases automatically,
  // but we nudge scroll to 0 (which is "bottom" in reverse layout) on new messages
  const messageCountRef = useRef(0);
  useEffect(() => {
    if (messages.length !== messageCountRef.current) {
      messageCountRef.current = messages.length;
      requestAnimationFrame(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = 0;
        }
      });
    }
  }, [messages.length, phase, isAiThinking]);

  /* ---- AI-driven conversation send ---- */

  const handleSend = useCallback(() => {
    const trimmed = userInput.trim();
    if (!trimmed || isAiThinking) return;
    stopVoiceInput();
    setMessages((prev) => [...prev, { role: "user" as const, text: trimmed }]);
    setUserInput("");
    aiRespond(trimmed);
  }, [userInput, isAiThinking, stopVoiceInput, aiRespond]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleSuggestionClick = useCallback((text: string) => {
    if (isAiThinking) return;
    setMessages((prev) => [...prev, { role: "user" as const, text }]);
    aiRespond(text);
  }, [isAiThinking, aiRespond]);

  /* old fixed-question logic removed — now AI-driven */

  /* ---- voice input (continuous with interim results) ---- */

  const startVoiceInput = useCallback(() => {
    if (isRecording) {
      stopVoiceInput();
      return;
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input is not supported in your browser. Try Chrome.");
      return;
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interim = transcript;
        }
      }
      setUserInput((finalTranscript + interim).trim());
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "no-speech") {
        stopVoiceInput();
      }
    };

    recognition.onend = () => {
      if (recognitionRef.current) {
        try { recognition.start(); } catch { setIsRecording(false); recognitionRef.current = null; }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [isRecording, stopVoiceInput]);

  useEffect(() => {
    return () => { if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; } };
  }, []);

  /* old send/skip removed — now AI-driven above */

  /* ---- API call ---- */

  const submitPlan = async (answers: Record<string, string>) => {
    // Stop recording if active
    stopVoiceInput();

    // Resolve client profile — prefer state, fallback to localStorage
    const cp = clientProfile || getClientProfile();
    const entity = selectedEntity || answers.entity_type || cp?.entityType || "individual";

    // Build the best profile payload by merging answers + client profile
    const occupation = answers.occupation || cp?.occupation || "";
    const filingStatus = answers.filing_status || cp?.filingStatus || "";
    const incomeRaw = answers.annual_income || cp?.annualIncome || "";
    const incomeNum = incomeRaw ? parseIncomeToNumber(incomeRaw) : (cp ? parseIncomeToNumber(cp.annualIncome) : 100000);
    const dependents = parseInt(answers.dependents || String(cp?.dependents ?? 0)) || 0;
    const state = answers.state || cp?.state || "";
    const hasRealEstate = answers.real_estate === "Yes" || !!cp?.hasRealEstate;
    const hasBusinessIncome = answers.self_employment === "Yes" || !!cp?.hasBusinessIncome || (cp?.incomeSources || []).includes("Self-Employment");
    const hasMortgage = answers.mortgage === "Yes" || !!cp?.hasMortgage;

    // Build additional info from profile
    const additionalParts: string[] = [];
    if (answers.additional_context) additionalParts.push(answers.additional_context);
    if (cp) {
      if (cp.incomeSources.length > 0) additionalParts.push(`Income sources: ${cp.incomeSources.join(", ")}`);
      if (cp.retirementAccountTypes.length > 0) additionalParts.push(`Retirement accounts: ${cp.retirementAccountTypes.join(", ")}`);
      if (cp.hasRetirementAccounts) additionalParts.push("Has retirement accounts");
      if (cp.hasInvestments) additionalParts.push("Has investments/stocks");
      if (cp.hasCharitableGiving) additionalParts.push("Makes charitable contributions");
      if (cp.hasHealthInsurance) additionalParts.push("Has health insurance");
      if (cp.hasStudentLoans) additionalParts.push("Has student loans");
      if (cp.hasInternational) additionalParts.push("Has international income/assets");
      if (cp.businessName) additionalParts.push(`Business: ${cp.businessName}`);
      if (cp.businessIncome) additionalParts.push(`Business income: ${cp.businessIncome}`);
      if (cp.planningPriorities.length > 0) additionalParts.push(`Priorities: ${cp.planningPriorities.join(", ")}`);
      // Include comprehensive summary (from re-analysis) and per-doc data
      if (cp.comprehensiveSummary) {
        additionalParts.push(`Document intelligence:\n${cp.comprehensiveSummary}`);
      }
      if (cp.ocrSummary && cp.ocrSummary !== cp.comprehensiveSummary) {
        additionalParts.push(`Return analysis: ${cp.ocrSummary}`);
      }
      if ((cp.uploadedDocuments || []).length > 0) {
        const docDetails = cp.uploadedDocuments.map(d =>
          `${d.documentType.toUpperCase()} (${d.fileName}): ${d.summary || "processed"}${d.keyFindings?.length ? " — " + d.keyFindings.slice(0, 3).join("; ") : ""}`
        ).join("\n");
        additionalParts.push(`Analyzed documents:\n${docDetails}`);
      }
    }

    const profilePayload = {
      occupation: occupation || "Professional",
      filingStatus: filingStatus || "Single",
      income: incomeNum,
      dependents,
      hasRealEstate,
      hasBusinessIncome,
      hasMortgage,
      state,
      additionalInfo: additionalParts.filter(Boolean).join(". "),
      entityType: entity,
    };

    // Human-readable display values for the result card
    const filingLabel = filingStatus === "mfj" ? "Married Filing Jointly"
      : filingStatus === "mfs" ? "Married Filing Separately"
      : filingStatus === "hoh" ? "Head of Household"
      : filingStatus === "single" ? "Single"
      : filingStatus || "Single";
    const incomeDisplay = incomeNum >= 1_000_000
      ? `$${(incomeNum / 1_000_000).toFixed(1)}M`
      : `$${(incomeNum / 1_000).toFixed(0)}K`;
    const displayProfile = {
      occupation: occupation || "Professional",
      filingStatus: filingLabel,
      income: incomeDisplay,
      dependents: String(dependents),
      state,
      rawIncome: incomeNum,
      marginalRate: incomeNum > 0 ? getMarginalRate(incomeNum, filingStatus || 'single') : 24,
      filingStatusRaw: filingStatus,
    };

    // Pre-compute applicable MASTER_STRATEGIES — send full data to API
    const applicable = getApplicableStrategies(answers);
    const strategyNames = applicable.map((ms) => ms.title);
    const strategyData = applicable.map((ms) => ({
      id: ms.id,
      title: ms.title,
      category: ms.category,
      description: ms.description,
      ircReference: ms.ircReference,
      savingsFormula: ms.savingsFormula,
      typicalSavingsRange: ms.typicalSavingsRange,
      eligibilityCriteria: ms.eligibilityCriteria,
      implementationSteps: ms.implementationSteps,
    }));

    console.log("=== SUBMIT PLAN ===");
    console.log("Profile payload:", profilePayload);
    console.log("Display profile:", displayProfile);
    console.log("Matched strategies from library:", strategyNames.length, strategyNames);
    console.log("Calling /api/smart-plan with full strategy data...");

    try {
      // 60-second timeout — server needs up to 45s per model attempt
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);

      const res = await fetch("/api/smart-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          profile: profilePayload,
          referenceStrategies: strategyNames,
          referenceStrategyData: strategyData,
        }),
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      console.log("=== AI RESPONSE SUCCESS ===");
      console.log("Strategies from AI:", data.strategies?.length);
      console.log("Total savings from AI:", data.totalEstimatedSavings);
      console.log("AI strategies:", data.strategies?.map((s: Strategy) => `${s.title}: ${formatCurrency(s.estimatedSavings)}`));

      // Separate actionable strategies (savings > 0) from long-term/informational
      const allStrats2: Strategy[] = data.strategies || [];
      const actionable2 = allStrats2.filter((s: Strategy) => s.estimatedSavings > 0);
      const longTerm2 = allStrats2.filter((s: Strategy) => s.estimatedSavings === 0);
      actionable2.sort((a: Strategy, b: Strategy) => b.estimatedSavings - a.estimatedSavings);
      const sortedStrategies2 = [...actionable2, ...longTerm2];
      const actionableTotal2 = actionable2.reduce((sum: number, s: Strategy) => sum + s.estimatedSavings, 0);

      const planResult: PlanResult = {
        strategies: sortedStrategies2,
        totalEstimatedSavings: actionableTotal2,
        profile: displayProfile,
      };
      setResult(planResult);

      savePlan({
        entityType: entity as EntityType,
        profile: displayProfile,
        strategies: planResult.strategies.map((s) => ({
          title: s.title,
          category: s.category,
          description: s.description,
          estimatedSavings: s.estimatedSavings,
          savingsMin: s.savingsMin,
          savingsMax: s.savingsMax,
          implementationSteps: s.implementationSteps,
          ircReference: s.ircReference,
          applicability: s.applicability,
          id: s.id,
        })),
        totalSavings: planResult.totalEstimatedSavings,
        createdAt: new Date().toISOString(),
        coveredIntents: coveredIntents,
      });

      // Refresh plan history
      setPlanHistory(getPlanHistory());

      const sv: Record<number, number> = {};
      const cv2: Record<number, number> = {};
      sortedStrategies2.forEach((s: Strategy, i: number) => {
        sv[i] = s.estimatedSavings;
        const cc = getContributionConfig(s, planResult.profile);
        if (cc.isContribution && s.estimatedSavings > 0) {
          const rate = planResult.profile.marginalRate || 24;
          cv2[i] = Math.min(Math.round(s.estimatedSavings / (rate / 100)), cc.max);
        }
      });
      setSliderValues(sv);
      setContributionValues(cv2);
      setPhase("results");
    } catch (err) {
      console.error("=== SMART PLAN API FAILED ===", err);
      console.error("No fallback — showing error to user. Check:");
      console.error("1. Is OPENROUTER_API_KEY set in .env.local?");
      console.error("2. Does the API key have credits? Check https://openrouter.ai/settings/credits");
      console.error("3. Check server terminal for detailed error from /api/smart-plan");
      // Show error state — no fake fallback data
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: `Unable to generate your tax plan. ${err instanceof Error ? err.message : "Please try again."}\n\nCheck the browser console (F12) and server terminal for details.`,
        },
      ]);
      setPhase("chat");
    }
  };

  /* ---- slider handling ---- */

  const handleSliderChange = (index: number, value: number) => {
    setSliderValues((prev) => ({ ...prev, [index]: value }));
  };

  /** Get effective savings for a strategy, accounting for contribution-based strategies */
  const getEffectiveSavings = useCallback((idx: number, strategy: Strategy): number => {
    if (!result) return 0;
    const contribConfig = getContributionConfig(strategy, result.profile);
    if (contribConfig.isContribution && contributionValues[idx] !== undefined) {
      const rate = result.profile.marginalRate || 24;
      return Math.round(contributionValues[idx] * rate / 100);
    }
    return sliderValues[idx] ?? strategy.estimatedSavings;
  }, [result, contributionValues, sliderValues]);

  const computedTotal = result
    ? result.strategies.reduce(
        (sum, s, i) => sum + getEffectiveSavings(i, s),
        0
      )
    : 0;

  const toggleExpand = (index: number) => {
    setExpandedCards((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  /* ---- AI Deep Dive Modal ---- */
  const [deepDiveStrategy, setDeepDiveStrategy] = useState<Strategy | null>(null);
  const [deepDiveContent, setDeepDiveContent] = useState("");
  const [isLoadingDeepDive, setIsLoadingDeepDive] = useState(false);

  const openDeepDive = useCallback(async (strategy: Strategy) => {
    setDeepDiveStrategy(strategy);
    setDeepDiveContent("");
    setIsLoadingDeepDive(true);

    try {
      const profileSummary = result
        ? `${result.profile.occupation}, ${result.profile.filingStatus}, ${result.profile.income} income, ${result.profile.dependents} dependents`
        : "General taxpayer";

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are an expert tax educator for AG FinTax. Explain tax strategies in a way that makes complex concepts simple and actionable. Use clear examples with real numbers. Format with markdown headers, bullets, and bold text.`,
            },
            {
              role: "user",
              content: `I'm a ${profileSummary}. Give me a comprehensive deep-dive on this strategy:

**${strategy.title}** (${strategy.category})
${strategy.description}
Estimated savings: ${formatCurrency(strategy.estimatedSavings)}

Please cover:
1. **What is it?** — Simple explanation anyone can understand, with a real-world analogy
2. **How does it work?** — Step-by-step walkthrough with specific dollar amounts based on my income
3. **Example calculation** — Show me the actual math with my numbers
4. **Who qualifies?** — Specific eligibility requirements
5. **Step-by-step implementation** — Exactly what to do, in order, with deadlines
6. **Common mistakes to avoid** — Top 3 pitfalls
7. **Pro tip** — One insider strategy most people miss

Keep it concise but thorough. Use my actual income level in examples.`,
            },
          ],
        }),
      });

      if (!res.ok) throw new Error("Failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      if (reader) {
        let lastDDUpdate = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          const now = Date.now();
          if (now - lastDDUpdate > 100) {
            setDeepDiveContent(accumulated);
            lastDDUpdate = now;
          }
        }
        setDeepDiveContent(accumulated);
      }
    } catch {
      setDeepDiveContent("Unable to load detailed explanation. Please try again or discuss with a Tax Architect at (425) 395-4318.");
    } finally {
      setIsLoadingDeepDive(false);
    }
  }, [result]);

  /* ---- Generate PDF Report ---- */
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const generateReport = useCallback(() => {
    if (!result) return;
    setIsGeneratingReport(true);

    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const taxYear = now.getFullYear();
    const clientName = result.profile.occupation || "Client";
    const totalMin = result.strategies.reduce((sum, s) => sum + s.savingsMin, 0);
    const totalMax = result.strategies.reduce((sum, s) => sum + s.savingsMax, 0);
    const reportMarginalRate = qualSession.profile ? getMarginalRate(qualSession.profile.annualIncome, qualSession.profile.filingStatus) : 24;
    const actionableStrategies = result.strategies.filter(s => s.estimatedSavings > 0);
    const longTermStrategies = result.strategies.filter(s => s.estimatedSavings === 0);
    const actionableTotal = actionableStrategies.reduce((sum, s) => {
      const idx = result.strategies.indexOf(s);
      return sum + getEffectiveSavings(idx, s);
    }, 0);

    // Category icons for visual enhancement
    const categoryIcons: Record<string, string> = {
      Deductions: "&#128200;",
      Credits: "&#9989;",
      Retirement: "&#127793;",
      Medical: "&#9889;",
      "Real Estate": "&#127968;",
      Income: "&#128176;",
      "Entity Structure": "&#127970;",
      Charitable: "&#10084;",
      Education: "&#127891;",
      Insurance: "&#128737;",
    };

    // Priority labels
    const getPriorityLabel = (applicability: string | undefined) => {
      if (applicability === "High") return '<span class="priority high">HIGH PRIORITY</span>';
      if (applicability === "Medium") return '<span class="priority medium">MEDIUM PRIORITY</span>';
      return '<span class="priority low">EXPLORE FURTHER</span>';
    };

    // Build strategy detail pages
    const strategyPages = result.strategies.map((s, i) => {
      const val = getEffectiveSavings(i, s);
      const isLongTerm = s.estimatedSavings === 0;
      const catIcon = categoryIcons[s.category] || "&#128202;";
      const eligibilitySteps = s.implementationSteps?.slice(0, Math.ceil((s.implementationSteps?.length || 0) / 2)) || [];
      const implementSteps = s.implementationSteps?.slice(Math.ceil((s.implementationSteps?.length || 0) / 2)) || [];

      return `
        <div class="page strategy-page">
          <div class="header-bar"></div>
          <div class="page-header">
            <span class="page-header-left">AG FinTax &bull; Tax Strategy Report</span>
            <span class="page-header-right">${clientName}</span>
          </div>
          <div class="content">
            <div class="strategy-header">
              <div class="strategy-icon">${catIcon}</div>
              <div class="strategy-header-text">
                <div class="strategy-category-tag">${s.category}${s.ircReference ? ` &bull; ${s.ircReference}` : ""}</div>
                <h2 class="strategy-title">${s.title}</h2>
                ${getPriorityLabel(s.applicability)}
              </div>
            </div>

            ${isLongTerm ? `
              <div class="long-term-banner">
                <span class="lt-icon">&#128337;</span>
                <div>
                  <strong>Long-Term Planning Strategy</strong>
                  <p>This strategy builds wealth over time. No immediate tax savings, but significant long-term benefits when implemented as part of your overall tax plan.</p>
                </div>
              </div>
            ` : `
              <div class="savings-grid">
                <div class="savings-card">
                  <span class="savings-label">Estimated Tax Savings</span>
                  <span class="savings-amount">${formatCurrency(val)}</span>
                  <span class="savings-sub">Based on your profile</span>
                </div>
                <div class="savings-card">
                  <span class="savings-label">Potential Range</span>
                  <span class="savings-amount-sm">${formatCurrency(s.savingsMin)} &ndash; ${formatCurrency(s.savingsMax)}</span>
                  <span class="savings-sub">Depending on implementation</span>
                </div>
                <div class="savings-card accent">
                  <span class="savings-label">Marginal Tax Rate Applied</span>
                  <span class="savings-amount">${reportMarginalRate}%</span>
                  <span class="savings-sub">Federal marginal rate</span>
                </div>
              </div>
            `}

            <div class="strategy-description">
              <h3>Strategy Overview</h3>
              <p>${s.description}</p>
            </div>

            ${!isLongTerm ? `
              <div class="example-box">
                <h4>&#128161; How This Works For You</h4>
                <p>Based on your ${result.profile.filingStatus} filing status and ${result.profile.income} income, this strategy could ${val > 5000 ? "significantly reduce" : "help lower"} your tax liability by leveraging ${s.category.toLowerCase()}-related provisions in the tax code${s.ircReference ? ` (${s.ircReference})` : ""}. ${val > 10000 ? "This is one of the highest-impact strategies in your plan." : "Every dollar saved compounds over your financial lifetime."}</p>
              </div>
            ` : `
              <div class="example-box">
                <h4>&#128161; Why This Matters</h4>
                <p>While this strategy doesn't produce immediate tax savings, it positions you for significant future benefits. As a ${result.profile.filingStatus} filer, establishing this now ensures you're prepared to capture tax advantages${s.ircReference ? ` under ${s.ircReference}` : ""} when the opportunity arises.</p>
              </div>
            `}

            ${eligibilitySteps.length > 0 ? `
              <div class="steps-section">
                <h3>&#9989; Eligibility &amp; Requirements</h3>
                <ul class="step-list">
                  ${eligibilitySteps.map(step => `<li><span class="step-bullet"></span>${step}</li>`).join("")}
                </ul>
              </div>
            ` : ""}

            ${implementSteps.length > 0 ? `
              <div class="steps-section">
                <h3>&#128736; Implementation Steps</h3>
                <ol class="impl-list">
                  ${implementSteps.map((step, idx) => `<li><span class="step-num">${idx + 1}</span>${step}</li>`).join("")}
                </ol>
              </div>
            ` : ""}

            <p class="footnote">*Savings estimates are based on the information provided and may vary. Consult with AG FinTax for personalized implementation guidance.</p>
          </div>
          <div class="page-footer">
            <span>Page ${i + 5}</span>
            <span>Confidential &bull; Prepared for ${clientName}</span>
          </div>
        </div>
      `;
    }).join("");

    const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8" />
<title>AG FinTax Tax Strategy Report - ${clientName}</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
<style>
  @page { size: letter; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; color: #1a1a2e; background: #fff; font-size: 14px; line-height: 1.6; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 8.5in; min-height: 11in; position: relative; page-break-after: always; padding: 0; overflow: hidden; }
  .page:last-child { page-break-after: auto; }

  /* ===== HEADER BAR ===== */
  .header-bar { position: absolute; top: 0; left: 0; right: 0; height: 6px; background: linear-gradient(90deg, #ff6600, #ff8533, #03045e); }

  /* ===== PAGE HEADER ===== */
  .page-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 60px 0; font-size: 10px; color: #999; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 6px; }
  .page-header-left { font-weight: 600; color: #03045e; }

  /* ===== CONTENT ===== */
  .content { padding: 16px 60px 60px; }

  /* ===== PAGE FOOTER ===== */
  .page-footer { position: absolute; bottom: 30px; left: 60px; right: 60px; display: flex; justify-content: space-between; font-size: 9px; color: #bbb; border-top: 1px solid #eee; padding-top: 10px; }

  /* ===== COVER PAGE ===== */
  .cover-page { display: flex; flex-direction: column; background: linear-gradient(145deg, #03045e 0%, #023e8a 50%, #0077b6 100%); color: white; }
  .cover-inner { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 80px; }
  .cover-logo { font-family: 'Montserrat', sans-serif; font-size: 18px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #ff6600; margin-bottom: 60px; }
  .cover-logo span { color: rgba(255,255,255,0.7); font-weight: 400; }
  .cover-title { font-family: 'Montserrat', sans-serif; font-size: 48px; font-weight: 800; line-height: 1.1; margin-bottom: 24px; }
  .cover-accent { width: 100px; height: 5px; background: #ff6600; border-radius: 3px; margin-bottom: 32px; }
  .cover-subtitle { font-size: 18px; font-weight: 300; color: rgba(255,255,255,0.8); margin-bottom: 8px; }
  .cover-client { font-family: 'Montserrat', sans-serif; font-size: 20px; font-weight: 600; margin-top: 40px; }
  .cover-details { font-size: 14px; color: rgba(255,255,255,0.6); margin-top: 8px; }
  .cover-bottom { padding: 40px 80px; display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid rgba(255,255,255,0.1); }
  .cover-bottom-left { font-size: 12px; color: rgba(255,255,255,0.5); }
  .cover-bottom-right { text-align: right; }
  .cover-bottom-right p { font-size: 11px; color: rgba(255,255,255,0.4); }

  /* ===== EXECUTIVE SUMMARY ===== */
  .exec-hero { background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 16px; padding: 32px; margin-bottom: 28px; border: 1px solid #dee2e6; }
  .exec-hero-number { font-family: 'Montserrat', sans-serif; font-size: 56px; font-weight: 800; color: #03045e; line-height: 1; }
  .exec-hero-label { font-size: 14px; color: #666; margin-top: 4px; font-weight: 500; }
  .exec-hero-range { font-size: 13px; color: #999; margin-top: 8px; }
  .exec-stats { display: flex; gap: 16px; margin-top: 24px; }
  .exec-stat { flex: 1; background: white; border-radius: 12px; padding: 18px; text-align: center; border: 1px solid #e9ecef; }
  .exec-stat-num { font-family: 'Montserrat', sans-serif; font-size: 28px; font-weight: 700; color: #ff6600; }
  .exec-stat-label { font-size: 11px; color: #888; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }

  .section-title { font-family: 'Montserrat', sans-serif; font-size: 26px; font-weight: 700; color: #03045e; margin-bottom: 8px; line-height: 1.2; }
  .section-subtitle { font-size: 13px; color: #888; margin-bottom: 24px; }
  .accent-line { width: 60px; height: 3px; background: #ff6600; border-radius: 2px; margin-bottom: 20px; }

  /* ===== TOC ===== */
  .toc-list { list-style: none; padding: 0; margin-top: 8px; }
  .toc-list li { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-radius: 8px; font-size: 14px; color: #333; }
  .toc-list li:nth-child(odd) { background: #f8f9fa; }
  .toc-num { width: 28px; height: 28px; border-radius: 50%; background: #03045e; color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
  .toc-text { flex: 1; }
  .toc-savings { font-weight: 600; color: #ff6600; font-size: 13px; }

  /* ===== STRATEGY PAGES ===== */
  .strategy-header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px; }
  .strategy-icon { font-size: 36px; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; background: #f0f4ff; border-radius: 14px; flex-shrink: 0; }
  .strategy-header-text { flex: 1; }
  .strategy-category-tag { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #03045e; font-weight: 600; margin-bottom: 4px; }
  .strategy-title { font-family: 'Montserrat', sans-serif; font-size: 24px; font-weight: 700; color: #1a1a2e; line-height: 1.2; margin-bottom: 6px; }
  .priority { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 3px 10px; border-radius: 4px; }
  .priority.high { background: #dcfce7; color: #166534; }
  .priority.medium { background: #fef3c7; color: #92400e; }
  .priority.low { background: #e0e7ff; color: #3730a3; }

  .savings-grid { display: flex; gap: 12px; margin-bottom: 20px; }
  .savings-card { flex: 1; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 12px; padding: 16px; text-align: center; }
  .savings-card.accent { background: linear-gradient(135deg, #03045e, #023e8a); border: none; color: white; }
  .savings-card.accent .savings-label { color: rgba(255,255,255,0.7); }
  .savings-card.accent .savings-sub { color: rgba(255,255,255,0.5); }
  .savings-label { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; margin-bottom: 6px; font-weight: 600; }
  .savings-amount { display: block; font-family: 'Montserrat', sans-serif; font-size: 28px; font-weight: 800; color: #03045e; }
  .savings-amount-sm { display: block; font-family: 'Montserrat', sans-serif; font-size: 18px; font-weight: 700; color: #03045e; margin-top: 4px; }
  .savings-sub { display: block; font-size: 10px; color: #aaa; margin-top: 4px; }

  .long-term-banner { display: flex; gap: 16px; align-items: flex-start; background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 1px solid #93c5fd; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
  .lt-icon { font-size: 28px; }
  .long-term-banner strong { display: block; color: #1e40af; margin-bottom: 4px; font-size: 14px; }
  .long-term-banner p { color: #3b82f6; font-size: 13px; line-height: 1.6; margin: 0; }

  .strategy-description { margin-bottom: 20px; }
  .strategy-description h3 { font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 700; color: #03045e; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  .strategy-description p { font-size: 13.5px; line-height: 1.7; color: #444; }

  .example-box { background: #fff7ed; border-left: 4px solid #ff6600; border-radius: 0 12px 12px 0; padding: 16px 20px; margin-bottom: 20px; }
  .example-box h4 { font-size: 13px; font-weight: 700; color: #c2410c; margin-bottom: 6px; }
  .example-box p { font-size: 13px; line-height: 1.65; color: #78350f; margin: 0; }

  .steps-section { margin-bottom: 16px; }
  .steps-section h3 { font-size: 13px; font-weight: 700; color: #03045e; margin-bottom: 10px; }
  .step-list { list-style: none; padding: 0; }
  .step-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 12.5px; color: #444; line-height: 1.6; padding: 5px 0; }
  .step-bullet { width: 6px; height: 6px; border-radius: 50%; background: #ff6600; margin-top: 7px; flex-shrink: 0; }
  .impl-list { list-style: none; padding: 0; counter-reset: none; }
  .impl-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 12.5px; color: #444; line-height: 1.6; padding: 5px 0; }
  .step-num { width: 22px; height: 22px; border-radius: 50%; background: #03045e; color: white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }

  .footnote { font-size: 10px; color: #bbb; font-style: italic; margin-top: 16px; line-height: 1.5; }

  /* ===== CALC TABLE ===== */
  .calc-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  .calc-table th { text-align: left; font-size: 11px; color: #03045e; font-weight: 700; padding: 10px 12px; background: #f0f4ff; text-transform: uppercase; letter-spacing: 0.5px; }
  .calc-table th:last-child { text-align: right; }
  .calc-table .data-row td { padding: 10px 12px; font-size: 13px; color: #444; border-bottom: 1px solid #f0f0f0; }
  .calc-table .data-row td:last-child { text-align: right; font-weight: 600; color: #333; }
  .calc-table .data-row:nth-child(even) { background: #fafafa; }
  .calc-table .total-row td { padding: 14px 12px; font-size: 15px; font-weight: 700; color: #03045e; background: linear-gradient(135deg, #f0f4ff, #dbeafe); border-top: 2px solid #03045e; }
  .calc-table .total-row td:last-child { text-align: right; color: #ff6600; font-size: 18px; }
  .calc-table .lt-row td { color: #888; font-style: italic; }

  /* ===== DISCLAIMER ===== */
  .disclaimer-text { font-size: 12px; color: #666; line-height: 1.7; margin-bottom: 14px; }

  /* ===== TIMELINE ===== */
  .timeline-item { display: flex; gap: 16px; margin-bottom: 20px; }
  .timeline-dot { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; flex-shrink: 0; }
  .timeline-dot.now { background: #dcfce7; color: #166534; }
  .timeline-dot.q1 { background: #fef3c7; color: #92400e; }
  .timeline-dot.q2 { background: #dbeafe; color: #1e40af; }
  .timeline-dot.annual { background: #f3e8ff; color: #6b21a8; }
  .timeline-content h4 { font-size: 14px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
  .timeline-content p { font-size: 12.5px; color: #666; line-height: 1.5; }

  /* ===== CONTACT FOOTER ===== */
  .contact-footer { text-align: center; padding: 40px; border-top: 2px solid #03045e; margin-top: 40px; }
  .contact-logo { font-family: 'Montserrat', sans-serif; font-size: 24px; font-weight: 800; color: #03045e; letter-spacing: 1px; }
  .contact-logo .accent { color: #ff6600; }
  .contact-tagline { font-size: 13px; color: #888; margin-top: 4px; font-style: italic; }
  .contact-details { margin-top: 16px; font-size: 13px; color: #555; }
  .contact-powered { font-size: 10px; color: #ccc; margin-top: 16px; }

  /* Print */
  @media print {
    .no-print { display: none !important; }
    .page { page-break-after: always; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

<!-- PAGE 1: Cover -->
<div class="page cover-page">
  <div class="cover-inner">
    <div class="cover-logo">AG FINTAX <span>&bull; Financial & Tax Services</span></div>
    <h1 class="cover-title">Personalized<br/>Tax Planning<br/>Strategy Report</h1>
    <div class="cover-accent"></div>
    <p class="cover-subtitle">Comprehensive tax optimization analysis tailored to your financial profile</p>
    <div class="cover-client">Prepared for: ${clientName}</div>
    <p class="cover-details">${result.profile.filingStatus} &bull; ${result.profile.income} Annual Income &bull; Tax Year ${taxYear}</p>
  </div>
  <div class="cover-bottom">
    <div class="cover-bottom-left">${dateStr}</div>
    <div class="cover-bottom-right">
      <p>AG FinTax &bull; Anil Grandhi</p>
      <p>Financial & Tax Services for the Dynamic Business Owners</p>
    </div>
  </div>
</div>

<!-- PAGE 2: Executive Summary -->
<div class="page">
  <div class="header-bar"></div>
  <div class="page-header">
    <span class="page-header-left">AG FinTax &bull; Tax Strategy Report</span>
    <span class="page-header-right">${clientName}</span>
  </div>
  <div class="content">
    <h2 class="section-title">Executive Summary</h2>
    <div class="accent-line"></div>
    <p class="section-subtitle">Your personalized tax savings overview based on the information you provided.</p>

    <div class="exec-hero">
      <div class="exec-hero-number">${formatCurrency(actionableTotal)}</div>
      <div class="exec-hero-label">Total Estimated Tax Savings Identified</div>
      <div class="exec-hero-range">Potential range: ${formatCurrency(totalMin)} &ndash; ${formatCurrency(totalMax)}</div>
      <div class="exec-stats">
        <div class="exec-stat">
          <div class="exec-stat-num">${actionableStrategies.length}</div>
          <div class="exec-stat-label">Actionable Strategies</div>
        </div>
        <div class="exec-stat">
          <div class="exec-stat-num">${longTermStrategies.length}</div>
          <div class="exec-stat-label">Long-Term Strategies</div>
        </div>
        <div class="exec-stat">
          <div class="exec-stat-num">${result.strategies.length}</div>
          <div class="exec-stat-label">Total Strategies</div>
        </div>
        <div class="exec-stat">
          <div class="exec-stat-num">${formatCurrency(actionableTotal)}</div>
          <div class="exec-stat-label">Est. Tax Savings</div>
        </div>
      </div>
    </div>

    <p style="font-size: 13px; color: #555; line-height: 1.7;">Based on your profile as a <strong>${clientName}</strong> with <strong>${result.profile.income}</strong> in annual income filing as <strong>${result.profile.filingStatus}</strong>${result.profile.state ? ` in <strong>${result.profile.state}</strong>` : ""}, our AI-powered analysis has identified ${result.strategies.length} tax strategies specifically tailored to your financial situation. ${actionableStrategies.length > 0 ? `Of these, ${actionableStrategies.length} strategies can be implemented immediately for an estimated ${formatCurrency(actionableTotal)} in tax savings.` : ""} ${longTermStrategies.length > 0 ? `Additionally, ${longTermStrategies.length} long-term planning strategies have been identified to build future tax advantages.` : ""}</p>
  </div>
  <div class="page-footer">
    <span>Page 2</span>
    <span>Confidential &bull; Prepared for ${clientName}</span>
  </div>
</div>

<!-- PAGE 3: Table of Contents / Strategy Overview -->
<div class="page">
  <div class="header-bar"></div>
  <div class="page-header">
    <span class="page-header-left">AG FinTax &bull; Tax Strategy Report</span>
    <span class="page-header-right">${clientName}</span>
  </div>
  <div class="content">
    <h2 class="section-title">Your Tax Strategies at a Glance</h2>
    <div class="accent-line"></div>
    <p class="section-subtitle">A complete listing of all identified strategies, ranked by estimated savings impact.</p>

    <table class="calc-table">
      <tr><th>#</th><th>Strategy</th><th>Category</th><th>Savings</th></tr>
      ${actionableStrategies.map((s, i) => {
        const idx = result.strategies.indexOf(s);
        const val = getEffectiveSavings(idx, s);
        return `<tr class="data-row"><td>${i + 1}</td><td>${s.title}</td><td>${s.category}</td><td>${formatCurrency(val)}</td></tr>`;
      }).join("")}
      <tr class="total-row"><td colspan="3">Total Actionable Savings</td><td>${formatCurrency(actionableTotal)}</td></tr>
      ${longTermStrategies.length > 0 ? `
        ${longTermStrategies.map((s, i) => `<tr class="data-row lt-row"><td>${actionableStrategies.length + i + 1}</td><td>${s.title}</td><td>${s.category}</td><td>Long-Term</td></tr>`).join("")}
      ` : ""}
    </table>
  </div>
  <div class="page-footer">
    <span>Page 3</span>
    <span>Confidential &bull; Prepared for ${clientName}</span>
  </div>
</div>

<!-- PAGE 4: Important Information / Disclaimers -->
<div class="page">
  <div class="header-bar"></div>
  <div class="page-header">
    <span class="page-header-left">AG FinTax &bull; Tax Strategy Report</span>
    <span class="page-header-right">${clientName}</span>
  </div>
  <div class="content">
    <h2 class="section-title">Important Information</h2>
    <div class="accent-line"></div>
    <br/>
    <p class="disclaimer-text">This report, including all associated materials (collectively "this report"), is for informational purposes only and intended for use by the account holder. The tax savings presented are estimates based on the information provided and should not be construed as guaranteed results. No legal, tax, or accounting advice is provided, and no professional-client relationship is created by your use of this report.</p>
    <p class="disclaimer-text">All liability in connection with your use of this report is disclaimed. You assume all responsibilities and obligations with respect to any decisions or actions taken based on the information presented herein. Any reproduction, copying, or redistribution of this report, in whole or in part, is strictly prohibited without express written permission.</p>
    <p class="disclaimer-text">The tax-related information provided should not be used to avoid taxes, penalties, or interest imposed by tax authorities, nor to promote, market, or recommend any tax-related matters. This report utilizes sections of the tax code and associated regulations in effect as of the report date. No obligation is assumed to update this report to reflect changes in tax laws.</p>
    <p class="disclaimer-text">This report is generated based on information you provided. Neither the publisher nor its suppliers or licensors shall be held liable for any consequences arising from incomplete, inaccurate, or erroneous information provided or for any errors or omissions in the use of this report.</p>
    <p class="disclaimer-text">You acknowledge that your use of this report does not make you a third-party beneficiary with respect to any products or services provided or licensed in relation to this report.</p>
  </div>
  <div class="page-footer">
    <span>Page 4</span>
    <span>Confidential &bull; Prepared for ${clientName}</span>
  </div>
</div>

<!-- Strategy Detail Pages -->
${strategyPages}

<!-- Savings Breakdown Page -->
<div class="page">
  <div class="header-bar"></div>
  <div class="page-header">
    <span class="page-header-left">AG FinTax &bull; Tax Strategy Report</span>
    <span class="page-header-right">${clientName}</span>
  </div>
  <div class="content">
    <h2 class="section-title">Total Savings Breakdown</h2>
    <div class="accent-line"></div>
    <p style="font-size: 13px; color: #666; line-height: 1.7; margin-bottom: 24px;">The following table provides a detailed breakdown of your estimated tax savings across all identified strategies. These figures are based on your specific financial profile and can be refined with additional documentation.</p>

    <table class="calc-table">
      <tr><th>Strategy</th><th>Category</th><th>Estimated Savings</th></tr>
      ${result.strategies.map((s, i) => {
        const val = getEffectiveSavings(i, s);
        const isLT = s.estimatedSavings === 0;
        return `<tr class="data-row${isLT ? " lt-row" : ""}"><td>${s.title}${s.ircReference ? ` <span style="color:#999;font-size:11px">(${s.ircReference})</span>` : ""}</td><td>${s.category}</td><td>${isLT ? "Long-Term" : formatCurrency(val)}</td></tr>`;
      }).join("")}
      <tr class="total-row"><td colspan="2"><strong>Total Estimated Tax Savings</strong></td><td><strong>${formatCurrency(actionableTotal)}</strong></td></tr>
    </table>

    <div style="display: flex; gap: 16px; margin-top: 24px;">
      <div style="flex: 1; background: #f0f4ff; border-radius: 12px; padding: 20px; text-align: center;">
        <div style="font-size: 11px; text-transform: uppercase; color: #666; font-weight: 600; letter-spacing: 0.5px;">Total Est. Tax Savings</div>
        <div style="font-family: Montserrat, sans-serif; font-size: 32px; font-weight: 800; color: #03045e; margin-top: 4px;">${formatCurrency(actionableTotal)}</div>
      </div>
      <div style="flex: 1; background: #fff7ed; border-radius: 12px; padding: 20px; text-align: center;">
        <div style="font-size: 11px; text-transform: uppercase; color: #666; font-weight: 600; letter-spacing: 0.5px;">${result.strategies.length} Strategies</div>
        <div style="font-family: Montserrat, sans-serif; font-size: 32px; font-weight: 800; color: #ff6600; margin-top: 4px;">${new Set(result.strategies.map((s: Strategy) => s.category)).size} Categories</div>
      </div>
      <div style="flex: 1; background: #f0fdf4; border-radius: 12px; padding: 20px; text-align: center;">
        <div style="font-size: 11px; text-transform: uppercase; color: #666; font-weight: 600; letter-spacing: 0.5px;">Savings Range</div>
        <div style="font-family: Montserrat, sans-serif; font-size: 18px; font-weight: 700; color: #166534; margin-top: 8px;">${formatCurrency(totalMin)} &ndash; ${formatCurrency(totalMax)}</div>
      </div>
    </div>
  </div>
  <div class="page-footer">
    <span>Page ${result.strategies.length + 5}</span>
    <span>Confidential &bull; Prepared for ${clientName}</span>
  </div>
</div>

<!-- Implementation Timeline Page -->
<div class="page">
  <div class="header-bar"></div>
  <div class="page-header">
    <span class="page-header-left">AG FinTax &bull; Tax Strategy Report</span>
    <span class="page-header-right">${clientName}</span>
  </div>
  <div class="content">
    <h2 class="section-title">Recommended Implementation Timeline</h2>
    <div class="accent-line"></div>
    <p style="font-size: 13px; color: #666; line-height: 1.7; margin-bottom: 28px;">To maximize your tax savings, we recommend the following phased implementation approach. Acting quickly on immediate opportunities ensures you capture the full benefit for the current tax year.</p>

    <div class="timeline-item">
      <div class="timeline-dot now">&#9889;</div>
      <div class="timeline-content">
        <h4>Immediate Actions (This Month)</h4>
        <p>${actionableStrategies.slice(0, 3).map(s => s.title).join(", ")}${actionableStrategies.length > 3 ? ` — These ${Math.min(3, actionableStrategies.length)} high-impact strategies should be implemented first for maximum ${taxYear} tax year benefit.` : " — Start with these strategies for immediate impact."}</p>
      </div>
    </div>

    <div class="timeline-item">
      <div class="timeline-dot q1">Q1</div>
      <div class="timeline-content">
        <h4>Short-Term (Within 90 Days)</h4>
        <p>${actionableStrategies.length > 3 ? `${actionableStrategies.slice(3, 6).map(s => s.title).join(", ")} — Complete these strategies within the first quarter to ensure compliance deadlines are met and maximum deductions are captured.` : "Review and optimize the strategies already implemented. Ensure all documentation is in order for tax filing."}</p>
      </div>
    </div>

    <div class="timeline-item">
      <div class="timeline-dot q2">Q2</div>
      <div class="timeline-content">
        <h4>Mid-Year Review (6 Months)</h4>
        <p>Schedule a mid-year check-in with AG FinTax to review strategy performance, adjust estimates based on actual financial data, and identify any additional optimization opportunities${longTermStrategies.length > 0 ? `. Begin planning for long-term strategies: ${longTermStrategies.slice(0, 2).map(s => s.title).join(", ")}.` : "."}</p>
      </div>
    </div>

    <div class="timeline-item">
      <div class="timeline-dot annual">&#128197;</div>
      <div class="timeline-content">
        <h4>Year-End &amp; Annual Planning</h4>
        <p>Conduct year-end tax planning session. Review all strategy outcomes, calculate actual savings achieved, and prepare the foundation for next year's tax optimization plan. ${longTermStrategies.length > 0 ? "Long-term strategies should be evaluated annually for eligibility changes." : "Consider expanding strategy coverage as your financial situation evolves."}</p>
      </div>
    </div>

    <div style="background: #f0f4ff; border-radius: 12px; padding: 24px; margin-top: 28px;">
      <h4 style="font-size: 14px; font-weight: 700; color: #03045e; margin-bottom: 8px;">&#128222; Next Steps</h4>
      <p style="font-size: 13px; color: #444; line-height: 1.7; margin: 0;">Contact AG FinTax to schedule your implementation consultation. Our team will walk you through each strategy in detail, answer your questions, and create a customized action plan tailored to your specific situation.</p>
      <p style="font-size: 13px; color: #666; margin-top: 12px; margin-bottom: 0;"><strong>Phone:</strong> (425) 395-4318 &bull; <strong>Email:</strong> hello@agfintax.com &bull; <strong>Web:</strong> agfintax.com</p>
    </div>
  </div>
  <div class="page-footer">
    <span>Page ${result.strategies.length + 6}</span>
    <span>Confidential &bull; Prepared for ${clientName}</span>
  </div>
</div>

<!-- Key Tax References Page -->
<div class="page">
  <div class="header-bar"></div>
  <div class="page-header">
    <span class="page-header-left">AG FinTax &bull; Tax Strategy Report</span>
    <span class="page-header-right">${clientName}</span>
  </div>
  <div class="content">
    <h2 class="section-title">Key Tax Code References</h2>
    <div class="accent-line"></div>
    <p style="font-size: 13px; color: #666; line-height: 1.7; margin-bottom: 24px;">The strategies in this report are grounded in specific sections of the Internal Revenue Code (IRC). Below are the primary references supporting your tax plan.</p>

    <table class="calc-table">
      <tr><th>IRC Section</th><th>Description</th><th>Relevance</th></tr>
      ${[...new Set(result.strategies.filter(s => s.ircReference).map(s => s.ircReference))].map(ref => {
        const matchingStrategies = result.strategies.filter(s => s.ircReference === ref);
        return `<tr class="data-row"><td style="font-weight:600;color:#03045e">${ref}</td><td>${matchingStrategies[0].title}</td><td>${matchingStrategies.length > 1 ? `Applies to ${matchingStrategies.length} strategies` : "Direct application"}</td></tr>`;
      }).join("")}
      ${[
        { ref: "IRC Section 199A", desc: "Qualified Business Income (QBI) Deduction" },
        { ref: "IRC Section 401(k)", desc: "Retirement Plan Contributions" },
        { ref: "IRC Section 223", desc: "Health Savings Accounts" },
        { ref: "IRC Section 170", desc: "Charitable Contributions" },
        { ref: "IRC Section 179", desc: "Expensing Depreciable Assets" },
        { ref: "IRC Section 1031", desc: "Like-Kind Exchanges" },
        { ref: "IRC Section 121", desc: "Exclusion of Gain from Sale of Principal Residence" },
        { ref: "IRC Section 529", desc: "Qualified Tuition Programs" },
      ].filter(r => !result.strategies.some(s => s.ircReference && s.ircReference.includes(r.ref.replace("IRC ", "")))).slice(0, 4).map(r =>
        `<tr class="data-row"><td style="font-weight:600;color:#03045e">${r.ref}</td><td>${r.desc}</td><td>General reference</td></tr>`
      ).join("")}
    </table>

    <div class="contact-footer">
      <div class="contact-logo">AG <span class="accent">FinTax</span></div>
      <p class="contact-tagline">Financial & Tax Services for the Dynamic Business Owners</p>
      <div class="contact-details">
        <p><strong>Anil Grandhi</strong></p>
        <p>(425) 395-4318 &bull; hello@agfintax.com &bull; agfintax.com</p>
      </div>
      <p class="contact-powered">Report generated by AG FinTax &bull; Built & Powered by LoukriAI.com &bull; ${dateStr}</p>
    </div>
  </div>
  <div class="page-footer">
    <span>Page ${result.strategies.length + 7}</span>
    <span>Confidential &bull; Prepared for ${clientName}</span>
  </div>
</div>

<div class="no-print" style="text-align: center; padding: 40px; background: linear-gradient(135deg, #03045e, #023e8a);">
  <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin-bottom: 16px;">Your AG FinTax Tax Strategy Report is ready</p>
  <button onclick="window.print()" style="background: #ff6600; color: white; padding: 16px 48px; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 16px; font-family: Montserrat, Inter, sans-serif; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(255,102,0,0.4);">
    Save as PDF / Print
  </button>
  <p style="color: rgba(255,255,255,0.4); font-size: 11px; margin-top: 12px;">Use Ctrl+P / Cmd+P to save as PDF</p>
</div>

</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) {
      win.onload = () => {
        setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 600);
      };
    }
    setIsGeneratingReport(false);
  }, [result, sliderValues, contributionValues, computedTotal, qualSession, getEffectiveSavings]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: sliderCSS }} />

      <div className="min-h-[calc(100vh-5rem)] bg-[#131318] text-[#E4E1E9] flex">
        {/* ---- Strategy Sidebar (shown when entity is selected, not on entity-select or results) ---- */}
        {selectedEntity && phase !== "entity-select" && phase !== "results" && (
          <StrategySidebar
            entityType={selectedEntity}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen((prev) => !prev)}
            expandedId={expandedSidebarStrategy}
            onExpandToggle={(id) => setExpandedSidebarStrategy((prev) => prev === id ? null : id)}
            categoryFilter={sidebarCategoryFilter}
            onCategoryFilter={setSidebarCategoryFilter}
            qualSession={qualSession.profileComplete ? qualSession : undefined}
          />
        )}

        {/* ---- Main Content Area ---- */}
        <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
        {/* ---- Progress Bar (inline, no redundant tabs) ---- */}
        {phase === "voice" && (
          <div className="sticky top-0 z-30 bg-[#131318]/80 backdrop-blur-md border-b border-white/5">
            <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FFB596]" />
                <span className="text-sm font-semibold text-[#E4E1E9]">Voice Input</span>
              </div>
              {isRecording && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-[11px] text-red-400 font-medium">Recording</span>
                </div>
              )}
            </div>
          </div>
        )}
        {/* chat/loading header is inside the flex column below */}
        {/* results header is inside the flex column below */}

        {/* ---- Entity Type Selection Screen ---- */}
        {phase === "entity-select" && (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] px-4 animate-fade-in-up">
            <div className="max-w-2xl w-full text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[#DC5700] to-[#FFB596] mb-6 shadow-2xl shadow-[#DC5700]/30">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#E4E1E9] mb-2">AG FinTax Smart Plan</h1>
              <p className="text-[#C7C5D3] mb-2 leading-relaxed">
                What type of tax return are we planning for?
              </p>
              <p className="text-xs text-[#C7C5D3]/60 mb-4">
                This determines which strategies, forms, and questions we focus on.
              </p>

              {/* Prompt to build profile if none exists */}
              {!hasProfile && (
                <div className="mb-8 mx-auto max-w-md rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5 text-center">
                  <Upload className="w-8 h-8 text-orange-400 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-[#E4E1E9] mb-1">Upload Your Tax Documents First</p>
                  <p className="text-xs text-[#C7C5D3] mb-4 leading-relaxed">
                    Upload your prior year 1040 or W-2 to auto-build your profile. This gives you the most accurate plan with exact numbers.
                  </p>
                  <Link href="/dashboard/profile">
                    <button className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/20">
                      Build Profile & Upload Docs
                    </button>
                  </Link>
                  <p className="text-[10px] text-[#C7C5D3]/50 mt-3">Or select your entity type below to start without documents</p>
                </div>
              )}
              {hasProfile && (
                <p className="text-xs text-green-400/70 mb-8 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Profile loaded — select your entity type to continue
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ENTITY_TYPES.map((entity) => {
                  const isSelected = selectedEntity === entity.id;
                  return (
                    <button
                      key={entity.id}
                      onClick={() => handleEntitySelect(entity.id)}
                      className={`group relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300 hover:scale-[1.02] border ${
                        isSelected
                          ? "border-[#DC5700]/50 bg-[#DC5700]/10 shadow-xl shadow-[#DC5700]/10"
                          : "border-[#464651]/20 bg-[rgba(31,31,37,0.6)] hover:border-[#464651]/40 hover:shadow-xl"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center transition"
                          style={{ backgroundColor: `${entity.color}15` }}
                        >
                          <EntityIcon icon={entity.icon} color={entity.color} />
                        </div>
                        <div className="flex-1 text-left">
                          <span
                            className="text-[10px] font-bold uppercase tracking-widest"
                            style={{ color: entity.color }}
                          >
                            Form {entity.formNumber}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-[#E4E1E9] mb-1">{entity.label}</h3>
                      <p className="text-xs text-[#C7C5D3] leading-relaxed mb-3">
                        {entity.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {entity.features.slice(0, 3).map((f) => (
                          <span
                            key={f}
                            className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#1B1B20] text-[#C7C5D3]"
                          >
                            {f}
                          </span>
                        ))}
                        {entity.features.length > 3 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#1B1B20] text-[#C7C5D3]">
                            +{entity.features.length - 3} more
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ---- Welcome Screen (after entity selected) ---- */}
        {phase === "welcome" && (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] px-4 py-8 animate-fade-in-up">
            <div className="max-w-3xl w-full">

              {/* ---- Hero Section ---- */}
              <div className="text-center mb-8">
                {selectedEntity && (() => {
                  const eInfo = getEntityInfo(selectedEntity);
                  return (
                    <button
                      onClick={changeEntityType}
                      className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-[rgba(31,31,37,0.6)] mb-5 transition-all hover:border-[#DC5700]/30 text-xs"
                    >
                      <EntityIcon icon={eInfo.icon} color={eInfo.color} className="w-3.5 h-3.5" />
                      <span className="font-semibold text-[#E4E1E9]">{eInfo.label}</span>
                      <span className="text-[#C7C5D3]">({eInfo.formNumber})</span>
                      <ChevronDown className="w-3 h-3 text-[#C7C5D3] group-hover:text-[#FFB596] transition" />
                    </button>
                  );
                })()}
                <h1 className="text-3xl font-extrabold tracking-tight text-[#E4E1E9] mb-2">
                  {selectedEntity ? `${getEntityInfo(selectedEntity).label} Tax Planning` : "AG FinTax Smart Plan"}
                </h1>
                <p className="text-sm text-[#C7C5D3] leading-relaxed max-w-lg mx-auto">
                  {hasProfile && profileAnalysis && profileAnalysis.readinessPercent >= 50
                    ? "Your profile is loaded. Choose how to build your personalized tax savings plan."
                    : "Get a personalized tax savings plan in minutes. Choose how you'd like to start."}
                </p>
              </div>

              {/* ---- Profile Summary Card (compact, clean) ---- */}
              {hasProfile && profileAnalysis && clientProfile && (
                <div className="rounded-2xl bg-[rgba(31,31,37,0.6)] border border-white/5 overflow-hidden mb-6 animate-fade-in-up">
                  <div className="p-5">
                    {/* Top row: profile headline + readiness */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#E4E1E9]">Profile Ready</p>
                        </div>
                      </div>
                      <Link
                        href="/dashboard/profile"
                        className="text-[11px] text-[#FFB596] hover:text-[#FFB596]/80 font-medium transition flex items-center gap-1"
                      >
                        <Settings className="w-3 h-3" />
                        Edit
                      </Link>
                    </div>

                    {/* Key stats as clean pills */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {clientProfile.occupation && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B1B20] border border-white/5 text-xs">
                          <Briefcase className="w-3 h-3 text-[#4CD6FB]" />
                          <span className="text-[#E4E1E9] font-medium">{clientProfile.occupation}</span>
                        </span>
                      )}
                      {clientProfile.annualIncome && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B1B20] border border-white/5 text-xs">
                          <DollarSign className="w-3 h-3 text-green-400" />
                          <span className="text-[#E4E1E9] font-medium">{clientProfile.annualIncome.startsWith("$") ? clientProfile.annualIncome : `$${Number(clientProfile.annualIncome).toLocaleString()}`}</span>
                        </span>
                      )}
                      {clientProfile.filingStatus && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B1B20] border border-white/5 text-xs">
                          <FileText className="w-3 h-3 text-[#FFB596]" />
                          <span className="text-[#E4E1E9] font-medium">
                            {clientProfile.filingStatus === "mfj" ? "MFJ"
                              : clientProfile.filingStatus === "mfs" ? "MFS"
                              : clientProfile.filingStatus === "hoh" ? "HOH"
                              : clientProfile.filingStatus === "single" ? "Single"
                              : clientProfile.filingStatus}
                          </span>
                        </span>
                      )}
                      {clientProfile.dependents > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B1B20] border border-white/5 text-xs">
                          <Users className="w-3 h-3 text-violet-400" />
                          <span className="text-[#E4E1E9] font-medium">{clientProfile.dependents} dependent{clientProfile.dependents !== 1 ? "s" : ""}</span>
                        </span>
                      )}
                      {clientProfile.state && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B1B20] border border-white/5 text-xs">
                          <MapPin className="w-3 h-3 text-amber-400" />
                          <span className="text-[#E4E1E9] font-medium">{clientProfile.state}</span>
                        </span>
                      )}
                      {clientProfile.hasRealEstate && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B1B20] border border-white/5 text-xs">
                          <Building2 className="w-3 h-3 text-orange-400" />
                          <span className="text-[#E4E1E9] font-medium">Real Estate</span>
                        </span>
                      )}
                      {clientProfile.hasRetirementAccounts && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B1B20] border border-white/5 text-xs">
                          <PiggyBank className="w-3 h-3 text-purple-400" />
                          <span className="text-[#E4E1E9] font-medium">{clientProfile.retirementAccountTypes.length > 0 ? clientProfile.retirementAccountTypes.join(", ") : "Retirement"}</span>
                        </span>
                      )}
                      {clientProfile.hasInvestments && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B1B20] border border-white/5 text-xs">
                          <TrendingUp className="w-3 h-3 text-cyan-400" />
                          <span className="text-[#E4E1E9] font-medium">Investments</span>
                        </span>
                      )}
                      {clientProfile.hasCharitableGiving && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B1B20] border border-white/5 text-xs">
                          <Heart className="w-3 h-3 text-pink-400" />
                          <span className="text-[#E4E1E9] font-medium">Charitable</span>
                        </span>
                      )}
                    </div>

                    {/* AI Summary */}
                    {(llmSummary || isLoadingLlmSummary) && (
                      <div className="rounded-xl bg-gradient-to-r from-[#DC5700]/5 to-[#4CD6FB]/5 border border-white/5 px-4 py-3">
                        <div className="flex items-start gap-2">
                          <Brain className="w-4 h-4 text-[#FFB596] shrink-0 mt-0.5" />
                          {isLoadingLlmSummary && !llmSummary ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-3 h-3 text-[#FFB596] animate-spin" />
                              <span className="text-xs text-[#C7C5D3]">Reviewing your profile...</span>
                            </div>
                          ) : (
                            <p className="text-xs text-[#C7C5D3] leading-relaxed">{llmSummary}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Missing areas hint */}
                    {profileAnalysis.slots.filter((s) => s.status === "red").length > 0 && (
                      <div className="flex items-center gap-2 mt-3 text-[11px] text-[#C7C5D3]">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>
                          Missing: {profileAnalysis.slots.filter((s) => s.status === "red").map((s) => s.label).join(", ")}
                          {" "}&mdash;{" "}
                          <Link href="/dashboard/profile" className="text-[#FFB596] hover:underline">add to profile</Link>
                          {" "}or we&apos;ll ask during planning.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* No profile — first visit prompt */}
              {!hasProfile && (
                <div className="rounded-2xl bg-gradient-to-br from-[#DC5700]/5 to-[#FFB596]/5 border border-[#DC5700]/15 p-6 mb-6 text-center animate-fade-in-up">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#DC5700]/10 mb-3">
                    <User className="w-6 h-6 text-[#FFB596]" />
                  </div>
                  <h3 className="text-base font-bold text-[#E4E1E9] mb-1">No Profile Yet</h3>
                  <p className="text-sm text-[#C7C5D3] mb-4 leading-relaxed max-w-md mx-auto">
                    Build your tax profile for the best results, or skip and we&apos;ll ask you directly.
                  </p>
                  <Link
                    href="/dashboard/profile"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#DC5700] to-[#FFB596] text-white font-semibold text-sm shadow-lg shadow-[#DC5700]/25 hover:shadow-[#DC5700]/40 transition-all"
                  >
                    <User className="w-4 h-4" />
                    Build My Profile
                  </Link>
                </div>
              )}

              {/* ---- Action Buttons ---- */}
              <div className="max-w-2xl mx-auto space-y-4">
                {/* Info banner: qualification required */}
                <div className="rounded-2xl bg-[rgba(31,31,37,0.6)] border border-white/5 p-4 mb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-[#4CD6FB]" />
                    <span className="text-xs font-bold text-[#E4E1E9]">
                      Smart Qualification
                    </span>
                  </div>
                  <p className="text-xs text-[#C7C5D3] leading-relaxed">
                    We&apos;ll ask a few quick questions to find the strategies that actually apply to your situation.
                    Only qualified strategies make it into your plan — no irrelevant recommendations.
                  </p>
                </div>

                {/* Primary: Chat — qualification happens here */}
                <button
                  onClick={startChatMode}
                  className="w-full group relative overflow-hidden rounded-2xl p-6 text-center transition-all duration-300 hover:scale-[1.01] bg-gradient-to-r from-[#DC5700] to-[#DC5700]/80 border border-[#DC5700]/30 shadow-xl shadow-[#DC5700]/20 hover:shadow-[#DC5700]/30"
                >
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-white">Start Tax Planning Chat</h3>
                      <p className="text-xs text-white/70">
                        Smart questions to find your best strategies
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-white/80 ml-2" />
                  </div>
                </button>

                {/* Secondary: Voice Interview */}
                <div className="space-y-3">
                  <button
                    onClick={startVoiceInterview}
                    className="w-full group relative overflow-hidden rounded-2xl p-5 text-center transition-all duration-300 hover:scale-[1.01] bg-[rgba(31,31,37,0.6)] border border-white/10 hover:border-[#DC5700]/30"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-[#FFB596]" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm font-bold text-[#E4E1E9]">Voice-Guided Interview</h3>
                        <p className="text-xs text-[#C7C5D3]">
                          Answer questions by voice
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#C7C5D3] ml-auto" />
                    </div>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ---- Structured Voice Interview Mode (Two-Way: TTS + Whisper) ---- */}
        {phase === "voice-interview" && (
          <div className="flex flex-col h-[calc(100vh-5rem)]">
            <div className="flex-1 flex items-start justify-center overflow-y-auto px-4 pt-6 pb-8">
              <div className="w-full max-w-2xl animate-fade-in-up">
                <div className="relative rounded-2xl bg-[rgba(31,31,37,0.6)] border border-white/5 overflow-hidden" style={{ minHeight: "min(70vh, 600px)" }}>
                  <VoiceInterview
                    sections={interviewSections}
                    onComplete={handleVoiceInterviewComplete}
                    entityType={selectedEntity || undefined}
                    profile={clientProfile ? {
                      occupation: clientProfile.occupation || undefined,
                      entityType: clientProfile.entityType || undefined,
                      filingStatus: clientProfile.filingStatus || undefined,
                      annualIncome: clientProfile.annualIncome || undefined,
                      dependents: clientProfile.dependents,
                      state: clientProfile.state || undefined,
                      hasRealEstate: clientProfile.hasRealEstate,
                      hasBusinessIncome: clientProfile.hasBusinessIncome,
                    } : undefined}
                  />
                </div>
                <div className="flex items-center justify-center gap-4 mt-4">
                  <button
                    onClick={() => { setPhase("welcome"); }}
                    className="text-xs text-[#C7C5D3] hover:text-[#FFB596] transition"
                  >
                    ← Back to options
                  </button>
                  <button
                    onClick={() => {
                      const allText = messages.filter(m => m.role === "user").map(m => m.text).join(" ");
                      triggerPlanGeneration(allText || allUserText || "Generate plan from available information");
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#DC5700] to-[#FFB596] text-white text-xs font-bold shadow-lg shadow-[#DC5700]/20 transition-all hover:shadow-[#DC5700]/30 hover:brightness-110"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate Report Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---- Voice Summary Mode (Hybrid: Live Web Speech + Whisper) ---- */}
        {phase === "voice" && (
          <div className="max-w-2xl mx-auto px-4 pt-6 pb-40 animate-fade-in-up">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#E4E1E9] mb-2">
                {isRecording ? "Listening to you..." : isTranscribing ? "Refining your response..." : "Tell me your tax situation"}
              </h2>
              <p className="text-sm text-[#C7C5D3] max-w-md mx-auto">
                {isRecording
                  ? "Speak naturally — I see everything you say in real-time below."
                  : isTranscribing
                  ? "Perfecting your transcript for maximum accuracy..."
                  : "Hit record and describe your income, family, business, property — anything tax relevant."}
              </p>
            </div>

            {/* Live transcript area — always visible */}
            <div className="mb-6 rounded-2xl bg-[rgba(31,31,37,0.6)] border border-white/5 p-5 min-h-[200px] text-left relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {isRecording && (
                    <>
                      <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Live</span>
                      <span className="text-[10px] text-[#C7C5D3] ml-2">{Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, "0")}</span>
                    </>
                  )}
                  {isTranscribing && (
                    <>
                      <Loader2 className="w-3 h-3 text-[#4CD6FB] animate-spin" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#4CD6FB]">Refining...</span>
                    </>
                  )}
                  {!isRecording && !isTranscribing && voiceTranscript && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-green-400">Ready</span>
                  )}
                  {!isRecording && !isTranscribing && !voiceTranscript && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#C7C5D3]">Transcript</span>
                  )}
                </div>
                {voiceTranscript && !isRecording && (
                  <button onClick={() => { setVoiceTranscript(""); setInterimText(""); }} className="text-[10px] text-[#C7C5D3] hover:text-red-400 transition">Clear</button>
                )}
              </div>

              {/* The transcript text */}
              {(voiceTranscript || interimText) ? (
                <div className="text-sm leading-relaxed">
                  <span className="text-[#E4E1E9]">{voiceTranscript}</span>
                  {interimText && (
                    <span className="text-[#FFB596]/60 italic"> {interimText}</span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[#C7C5D3]/30 italic leading-relaxed">
                  Your words will appear here as you speak...
                  {"\n\n"}Example: &ldquo;I&apos;m a software engineer making $180K, married with 2 kids, own a home in Texas with a mortgage, have an S-Corp side business...&rdquo;
                </p>
              )}

              {/* Listening animation at bottom */}
              {isRecording && (
                <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-[3px]">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-[3px] rounded-full bg-[#DC5700]/40"
                      style={{
                        height: `${8 + Math.random() * 16}px`,
                        animation: `pulse 0.8s ease-in-out ${i * 0.05}s infinite alternate`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Edit area when not recording */}
            {!isRecording && !isTranscribing && voiceTranscript && (
              <div className="mb-6">
                <textarea
                  value={voiceTranscript}
                  onChange={(e) => setVoiceTranscript(e.target.value)}
                  className="w-full rounded-2xl bg-[rgba(31,31,37,0.6)] border border-[#464651]/20 p-4 text-sm text-[#E4E1E9] outline-none focus:border-[#DC5700]/30 resize-none"
                  rows={3}
                  placeholder="Edit your transcript..."
                />
              </div>
            )}

            {/* Type instead area when no recording yet */}
            {!isRecording && !isTranscribing && !voiceTranscript && (
              <div className="mb-6">
                <textarea
                  value={voiceTranscript}
                  onChange={(e) => setVoiceTranscript(e.target.value)}
                  className="w-full rounded-2xl bg-[rgba(31,31,37,0.6)] border border-[#464651]/20 p-4 text-sm text-[#E4E1E9] placeholder-[#C7C5D3]/40 outline-none focus:border-[#DC5700]/30 resize-none"
                  rows={3}
                  placeholder="Or type your situation here instead of speaking..."
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {!isTranscribing && (
                <button
                  onClick={() => {
                    if (isRecording) {
                      // STOP: stop MediaRecorder + Web Speech, send to Whisper
                      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
                      setRecordingDuration(0);
                      // Stop Web Speech (live preview)
                      if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
                      setInterimText("");
                      // Stop MediaRecorder → triggers onstop → Whisper transcription
                      if (mediaRecorderRef.current?.state === "recording") {
                        mediaRecorderRef.current.stop();
                      }
                      setIsRecording(false);
                    } else {
                      // START: MediaRecorder (for Whisper) + Web Speech (for live preview)
                      audioChunksRef.current = [];
                      setRecordingDuration(0);
                      setInterimText("");

                      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
                        // 1. MediaRecorder for Whisper
                        const mr = new MediaRecorder(stream, {
                          mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm"
                        });
                        mediaRecorderRef.current = mr;
                        mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
                        mr.onstop = async () => {
                          stream.getTracks().forEach((t) => t.stop());
                          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                          if (blob.size < 500) return;
                          setIsTranscribing(true);
                          try {
                            const fd = new FormData();
                            fd.append("audio", blob, "recording.webm");
                            const res = await fetch("/api/transcribe", { method: "POST", body: fd });
                            if (res.ok) {
                              const data = await res.json();
                              if (data.text && data.text.trim().length > 20) {
                                const finalText = data.text.trim();
                                setVoiceTranscript(finalText);
                                setIsTranscribing(false);
                                // Auto-analyze after short delay so user sees transcript
                                setTimeout(() => processVoiceTranscript(finalText), 1500);
                                return;
                              }
                            }
                          } catch (e) { console.error("Whisper error:", e); }
                          finally { setIsTranscribing(false); }
                        };
                        mr.start(1000);

                        // 2. Web Speech API for live preview
                        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                        if (SR) {
                          const recog = new SR();
                          recog.continuous = true;
                          recog.interimResults = true;
                          recog.lang = "en-US";
                          let finalT = "";
                          recog.onresult = (event: any) => {
                            let interim = "";
                            for (let i = event.resultIndex; i < event.results.length; i++) {
                              if (event.results[i].isFinal) {
                                finalT += event.results[i][0].transcript + " ";
                              } else {
                                interim = event.results[i][0].transcript;
                              }
                            }
                            setVoiceTranscript(finalT.trim());
                            setInterimText(interim);
                          };
                          recog.onerror = () => {};
                          recog.onend = () => {
                            if (recognitionRef.current) {
                              try { recog.start(); } catch { /* ignore */ }
                            }
                          };
                          recognitionRef.current = recog;
                          recog.start();
                        }

                        // 3. Timer
                        timerRef.current = setInterval(() => setRecordingDuration((d) => d + 1), 1000);
                        setIsRecording(true);
                      }).catch(() => alert("Microphone access denied."));
                    }
                  }}
                  className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm transition-all ${
                    isRecording
                      ? "bg-red-500 hover:bg-red-400 text-white shadow-xl shadow-red-500/20"
                      : "bg-gradient-to-r from-[#DC5700] to-[#FFB596] text-white shadow-xl shadow-[#DC5700]/25 hover:shadow-[#DC5700]/40"
                  }`}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  {isRecording ? "Stop Recording" : voiceTranscript ? "Record More" : "Start Recording"}
                </button>
              )}

              {!isRecording && !isTranscribing && voiceTranscript.trim().length > 20 && (
                <button
                  onClick={() => processVoiceTranscript(voiceTranscript)}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm shadow-xl transition-all"
                >
                  <Sparkles className="w-5 h-5" />
                  Analyze and Build My Plan
                </button>
              )}
            </div>

            <div className="text-center mt-6">
              <button
                onClick={() => { setPhase("welcome"); setVoiceTranscript(""); setInterimText(""); }}
                className="text-xs text-[#C7C5D3] hover:text-[#FFB596] transition"
              >
                Back to options
              </button>
            </div>
          </div>
        )}

        {/* ---- Guided Questions Chat / Loading ---- */}
        {(phase === "chat" || phase === "loading") && (
          <div className="flex flex-col h-[calc(100vh-5rem)]">
          {/* Header bar */}
          <div className="shrink-0 z-30 bg-[#131318]/80 backdrop-blur-md border-b border-white/5">
            <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FFB596]" />
                <span className="text-sm font-semibold text-[#E4E1E9]">Smart Plan</span>
                {selectedEntity && (() => {
                  const eInfo = getEntityInfo(selectedEntity);
                  return (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ml-1" style={{ backgroundColor: `${eInfo.color}15`, color: eInfo.color }}>
                      {eInfo.formNumber}
                    </span>
                  );
                })()}
                {isAiThinking && <Loader2 className="w-3 h-3 text-[#FFB596] animate-spin ml-1" />}
              </div>
              <div className="flex items-center gap-2">
                {isAiThinking && (
                  <span className="text-[11px] text-[#FFB596] font-medium">Thinking...</span>
                )}
              </div>
            </div>
          </div>
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto flex flex-col-reverse max-w-2xl w-full mx-auto px-4 pt-6 pb-6">
           <div>
            {/* Profile context banner (compact) */}
            {hasProfile && clientProfile && (
              <div className="mb-4 rounded-xl bg-[rgba(31,31,37,0.4)] border border-white/5 px-4 py-2.5 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                <p className="text-[11px] text-[#C7C5D3] truncate">
                  <span className="text-green-400 font-medium">Profile loaded</span>
                  {clientProfile.occupation && <> &middot; {clientProfile.occupation}</>}
                  {clientProfile.annualIncome && !isNaN(Number(clientProfile.annualIncome)) && Number(clientProfile.annualIncome) > 0 && <> &middot; ${Number(clientProfile.annualIncome).toLocaleString()}</>}
                  {clientProfile.state && <> &middot; {clientProfile.state}</>}
                </p>
              </div>
            )}

            {/* Messages */}
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "bot" && (
                    <div className="flex-shrink-0 mr-3 mt-1">
                      <div className="w-9 h-9 rounded-full bg-[#DC5700]/20 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-[#FFB596]" />
                      </div>
                    </div>
                  )}

                  <div
                    className={`${msg.tiles ? 'max-w-[95%]' : 'max-w-[80%]'} ${
                      msg.role === "user"
                        ? "bg-[#DC5700]/15 border border-[#DC5700]/20"
                        : "bg-[rgba(31,31,37,0.6)] backdrop-blur-[16px] border border-white/5"
                    } rounded-2xl px-4 py-3`}
                  >
                    {/* Strategy Category Tiles */}
                    {msg.tiles && msg.tiles.length > 0 && (
                      <div className="mb-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                          {msg.tiles.map((tile) => {
                            const IconMap: Record<string, React.ElementType> = {
                              PiggyBank, Banknote, Heart, BadgeDollarSign, Receipt,
                              GraduationCap, TrendingUp, Zap, HeartPulse, Building2,
                              Landmark, Shield, DollarSign,
                            };
                            const TileIcon = IconMap[tile.icon] || Zap;
                            return (
                              <div
                                key={tile.category}
                                className="rounded-xl p-3 border transition-all"
                                style={{
                                  backgroundColor: `${tile.color}10`,
                                  borderColor: `${tile.color}30`,
                                }}
                              >
                                <div className="flex items-center gap-2 mb-1.5">
                                  <TileIcon className="w-4 h-4" style={{ color: tile.color }} />
                                  <span className="text-xs font-semibold" style={{ color: tile.color }}>
                                    {tile.category}
                                  </span>
                                </div>
                                <div className="text-[11px] text-[#C7C5D3]">
                                  {tile.count} {tile.count === 1 ? 'strategy' : 'strategies'}
                                  {tile.qualified > 0 && (
                                    <span className="text-green-400 ml-1">
                                      · {tile.qualified} ✓
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1.5 space-y-0.5">
                                  {tile.strategies.slice(0, 3).map((name) => (
                                    <div key={name} className="flex items-center gap-1 text-[10px] text-[#8B8A97] group/strat cursor-help" title={name}>
                                      <span className="truncate">• {name.replace(/ - .*/, '')}</span>
                                      <Info className="w-2.5 h-2.5 text-[#4CD6FB]/40 shrink-0 group-hover/strat:text-[#4CD6FB]/80 transition-colors" />
                                    </div>
                                  ))}
                                  {tile.strategies.length > 3 && (
                                    <div className="text-[10px] text-[#8B8A97]">
                                      +{tile.strategies.length - 3} more
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {/* Auto-qualified strategies list */}
                        {msg.autoQualified && msg.autoQualified.length > 0 && (
                          <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-3 mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                              <span className="text-xs font-semibold text-green-400">
                                Already Qualified from Your Profile
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.autoQualified.map((name) => (
                                <span
                                  key={name}
                                  className="px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-[11px] text-green-300 font-medium"
                                >
                                  ✓ {name.replace(/ - .*/, '')}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {/* (i) Strategy Info Card — shown for qualification questions */}
                    {msg.strategyInfo && msg.text && (
                      <div className="mb-3 rounded-xl bg-gradient-to-r from-[#03045e]/20 to-[#0077b6]/10 border border-[#4CD6FB]/15 p-3">
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#4CD6FB]/15 flex items-center justify-center shrink-0 mt-0.5">
                            <Info className="w-4 h-4 text-[#4CD6FB]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[11px] font-bold text-[#4CD6FB] uppercase tracking-wider">{msg.strategyInfo.category}</span>
                              {msg.strategyInfo.ircReference && (
                                <span className="text-[10px] text-[#8B8A97] font-medium">{msg.strategyInfo.ircReference}</span>
                              )}
                              <span className="text-[10px] text-[#8B8A97] ml-auto whitespace-nowrap">
                                Strategy {msg.strategyInfo.strategyIndex}/{msg.strategyInfo.totalStrategies}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#C7C5D3] leading-relaxed line-clamp-2">{msg.strategyInfo.strategyDescription}</p>
                            {msg.strategyInfo.savingsRange.max > 0 && (
                              <p className="text-[10px] text-green-400/80 mt-1 font-medium">
                                Potential savings: ${msg.strategyInfo.savingsRange.min.toLocaleString()} &ndash; ${msg.strategyInfo.savingsRange.max.toLocaleString()}
                              </p>
                            )}
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <div className="w-3.5 h-3.5 rounded-full bg-[#FFB596]/15 flex items-center justify-center">
                                <Info className="w-2.5 h-2.5 text-[#FFB596]" />
                              </div>
                              <span className="text-[10px] text-[#FFB596]/80 italic">Why: {msg.strategyInfo.questionHelpText}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {msg.role === "bot" ? (
                      <div
                        className="text-sm leading-relaxed [&_strong]:text-[#E4E1E9] [&_strong]:font-semibold [&_li]:ml-3 [&_li]:list-disc [&_h3]:font-bold [&_h3]:text-[#FFB596] [&_h3]:mt-2 [&_h3]:mb-1"
                        dangerouslySetInnerHTML={{
                          __html: msg.text
                            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                            .replace(/^### (.*$)/gm, "<h3>$1</h3>")
                            .replace(/^- (.*$)/gm, "<li>$1</li>")
                            .replace(/\n/g, "<br/>"),
                        }}
                      />
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.text}
                      </p>
                    )}

                    {/* Loading animation on analyzing message */}
                    {phase === "loading" &&
                      i === messages.length - 1 &&
                      msg.role === "bot" && (
                        <div className="mt-4 space-y-3">
                          <div className="flex items-center gap-2 text-[#FFB596]">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-xs font-medium">Analyzing your tax profile...</span>
                          </div>
                          <div className="space-y-2">
                            {["Scanning 29 tax strategies", "Matching eligibility criteria", "Calculating potential savings", "Building your personalized plan"].map((step, si) => (
                              <div key={si} className="flex items-center gap-2 animate-fade-in-up" style={{ animationDelay: `${si * 0.5}s` }}>
                                <div className="w-1.5 h-1.5 rounded-full bg-[#FFB596]" />
                                <span className="text-[11px] text-[#C7C5D3]">{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* AI thinking indicator */}
                    {isAiThinking && i === messages.length - 1 && msg.role === "bot" && !msg.text && (
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFB596] animate-bounce" />
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFB596] animate-bounce" style={{ animationDelay: "0.15s" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFB596] animate-bounce" style={{ animationDelay: "0.3s" }} />
                      </div>
                    )}

                    {/* Quick-reply suggestion buttons */}
                    {msg.buttons && msg.buttons.length > 0 && i === messages.length - 1 && !isAiThinking && phase === "chat" && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {msg.buttons.map((btn) => (
                          <button
                            key={btn}
                            onClick={() => handleSuggestionClick(btn)}
                            className="group px-4 py-2 text-xs font-medium rounded-xl bg-[#1B1B20] hover:bg-[#DC5700]/15 text-[#C7C5D3] hover:text-[#FFB596] border border-[#464651]/20 hover:border-[#DC5700]/30 transition-all duration-200 hover:shadow-lg hover:shadow-[#DC5700]/5"
                          >
                            {btn}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Build Plan button — ONLY visible when qualification is COMPLETE */}
            {phase === "chat" && qualSession.phase === 'ready' && qualSession.qualifiedIds.length > 0 && (
              <div className="mb-4 text-center">
                <button
                  onClick={() => triggerQualifiedPlanGeneration()}
                  disabled={isAiThinking}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#DC5700] to-[#FFB596] text-white font-bold text-sm shadow-xl shadow-[#DC5700]/25 transition-all hover:shadow-[#DC5700]/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate My Tax Plan ({qualSession.qualifiedIds.length} strategies)
                </button>
                <p className="text-[10px] text-[#908F9C] mt-1.5">
                  {(() => {
                    const s = getSessionSummary(qualSession);
                    return `${s.qualified} qualified · ${s.disqualified} not applicable`;
                  })()}
                </p>
              </div>
            )}

           </div>
          </div>

            {/* Input bar — anchored to bottom of flex column */}
            {phase === "chat" && (
              <div className="shrink-0 border-t border-white/5 bg-[#131318] px-4 py-4">
                <div className="max-w-2xl mx-auto space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center bg-[rgba(31,31,37,0.6)] backdrop-blur-[16px] border border-white/10 rounded-xl px-4 py-3">
                      <input
                        ref={inputRef}
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your answer..."
                        className="flex-1 bg-transparent text-sm text-[#E4E1E9] placeholder-[#C7C5D3]/50 outline-none"
                      />
                      {isRecording && (
                        <div className="flex items-center gap-1 mr-1">
                          <div className="w-1 h-3 bg-red-400 rounded-full animate-pulse" />
                          <div className="w-1 h-4 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: "0.15s" }} />
                          <div className="w-1 h-2 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} />
                          <span className="text-[10px] text-red-400 font-medium ml-1">REC</span>
                        </div>
                      )}
                      <button
                        onClick={startVoiceInput}
                        className={`ml-1 p-2 rounded-xl transition-all ${
                          isRecording
                            ? "bg-red-500/20 text-red-400 ring-2 ring-red-500/30 recording-pulse"
                            : "hover:bg-[#DC5700]/10 text-[#C7C5D3] hover:text-[#FFB596]"
                        }`}
                        title={isRecording ? "Stop recording" : "Start voice input"}
                      >
                        {isRecording ? (
                          <MicOff className="w-4 h-4" />
                        ) : (
                          <Mic className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <button
                      onClick={handleSend}
                      disabled={!userInput.trim()}
                      className="p-3 rounded-xl bg-[#DC5700] hover:bg-[#DC5700]/80 disabled:opacity-30 disabled:cursor-not-allowed transition text-white"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Generate button in input bar — only when qualification is COMPLETE */}
                  {qualSession.phase === 'ready' && qualSession.qualifiedIds.length > 0 && (
                    <button
                      onClick={() => triggerQualifiedPlanGeneration()}
                      disabled={isAiThinking}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#DC5700]/15 to-[#FFB596]/10 border border-[#DC5700]/20 text-[#FFB596] text-xs font-bold transition-all hover:from-[#DC5700]/25 hover:to-[#FFB596]/15 hover:border-[#DC5700]/40 disabled:opacity-40"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Generate My Tax Plan ({qualSession.qualifiedIds.length} strategies)
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---- Phase 2: Strategy Results ---- */}
        {phase === "results" && result && (
          <div className="flex flex-col h-[calc(100vh-5rem)]">
            {/* Header bar */}
            <div className="shrink-0 z-30 bg-[#131318]/80 backdrop-blur-md border-b border-white/5">
              <div className="max-w-5xl mx-auto px-4 py-3">
                {/* Top row: New Plan button prominent */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      if (!canCreatePlan()) {
                        alert(`You've used all ${FREE_PLAN_LIMIT} free plans. Upgrade to Pro for unlimited plans.`);
                        return;
                      }
                      setResult(null);
                      setSliderValues({});
                      setContributionValues({});
                      setExpandedCards({});
                      setMessages([]);
                      setCoveredIntents([]);
                      setAllUserText("");
                      setPhase(selectedEntity ? "welcome" : "entity-select");
                    }}
                    className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-[#DC5700] to-[#FFB596] text-white text-sm font-bold shadow-xl shadow-[#DC5700]/25 hover:shadow-[#DC5700]/40 transition-all hover:scale-[1.02]"
                  >
                    <Sparkles className="w-4 h-4" />
                    + New Plan
                    <span className="px-2 py-1 rounded-lg bg-white/20 text-xs font-bold">{getRemainingPlans()} left</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-[11px] text-[#C7C5D3]">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      {result.strategies.length} Strategies Ready
                    </div>
                    {planHistory.length > 1 && (
                      <button
                        onClick={() => setShowPlanHistory(!showPlanHistory)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-medium text-[#C7C5D3] hover:text-white transition flex items-center gap-1"
                      >
                        <Clock className="w-3 h-3" />
                        {planHistory.length} Plans
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom row: Plan info */}
                <div className="flex items-center gap-2 mt-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#FFB596]" />
                  <span className="text-xs font-semibold text-[#E4E1E9]">Your Tax Plan</span>
                  {selectedEntity && (() => {
                    const eInfo = getEntityInfo(selectedEntity);
                    return (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{ backgroundColor: `${eInfo.color}15`, color: eInfo.color }}>
                        {eInfo.label} ({eInfo.formNumber})
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Plan history dropdown */}
            {showPlanHistory && planHistory.length > 1 && (
              <div className="shrink-0 bg-[#1B1B20] border-b border-white/5 px-4 py-3">
                <div className="max-w-5xl mx-auto">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-[#C7C5D3]">Your Saved Plans ({planHistory.length}/{FREE_PLAN_LIMIT} free)</p>
                    <button onClick={() => setShowPlanHistory(false)} className="p-1 hover:bg-white/5 rounded-lg transition">
                      <X className="w-3.5 h-3.5 text-[#C7C5D3]" />
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                    {[...planHistory].reverse().map((plan) => {
                      const isCurrent = plan.createdAt === (getPlan()?.createdAt ?? "");
                      return (
                        <button
                          key={plan.id}
                          onClick={() => {
                            loadPlanFromHistory(plan.id);
                            const loaded = getPlan();
                            if (loaded) {
                              setResult({
                                strategies: loaded.strategies.map((s) => {
                                  const steps = s.implementationSteps?.length
                                    ? s.implementationSteps
                                    : (MASTER_STRATEGIES.find((ms) => ms.title === s.title)?.implementationSteps ?? []);
                                  return { ...s, implementationSteps: steps };
                                }),
                                totalEstimatedSavings: loaded.totalSavings,
                                profile: loaded.profile,
                              });
                              if (loaded.entityType) setSelectedEntity(loaded.entityType);
                              // Initialize slider values from saved strategy data
                              const sv: Record<number, number> = {};
                              const cvH: Record<number, number> = {};
                              loaded.strategies.forEach((s, i) => {
                                sv[i] = s.estimatedSavings;
                                const cc = getContributionConfig(s as Strategy, loaded.profile);
                                if (cc.isContribution && s.estimatedSavings > 0) {
                                  const rate = (loaded.profile as PlanResult['profile']).marginalRate || 24;
                                  cvH[i] = Math.min(Math.round(s.estimatedSavings / (rate / 100)), cc.max);
                                }
                              });
                              setSliderValues(sv);
                              setContributionValues(cvH);
                              setExpandedCards({});
                            }
                            setShowPlanHistory(false);
                          }}
                          className={`shrink-0 px-3 py-2 rounded-xl border text-left transition-all ${
                            isCurrent
                              ? "bg-[#DC5700]/15 border-[#DC5700]/30 text-[#FFB596]"
                              : "bg-white/5 border-white/5 text-[#C7C5D3] hover:border-white/10"
                          }`}
                        >
                          <p className="text-xs font-semibold whitespace-nowrap">{plan.label ?? "Plan"}</p>
                          <p className="text-[10px] opacity-60 mt-0.5">
                            {new Date(plan.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            {" · "}
                            {plan.strategies.length} strategies
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-5xl mx-auto px-4 pt-6 pb-6 animate-fade-in-up">
            {/* Header Card — sticky total savings */}
            <div className="sticky top-0 z-20 rounded-2xl bg-[rgba(31,31,37,0.95)] backdrop-blur-[16px] border border-white/5 p-6 mb-6 shadow-lg shadow-black/20">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-[#FFB596]" />
                <h1 className="text-lg font-semibold">
                  Your Smart Tax Plan
                </h1>
              </div>

              {/* Profile summary with entity badge */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {selectedEntity && (() => {
                  const eInfo = getEntityInfo(selectedEntity);
                  return (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                      style={{ backgroundColor: `${eInfo.color}15`, color: eInfo.color }}
                    >
                      {eInfo.label} ({eInfo.formNumber})
                    </span>
                  );
                })()}
                <span className="text-sm text-[#C7C5D3]">
                  {result.profile.occupation} &bull;{" "}
                  {result.profile.filingStatus} Filing &bull;{" "}
                  {result.profile.income} income &bull;{" "}
                  {result.profile.dependents} dependents
                </span>
              </div>

              {/* Big savings number */}
              <div className="mb-5">
                <p className="text-xs uppercase tracking-wider text-[#C7C5D3] mb-1">
                  Estimated Total Savings
                </p>
                <p className="text-4xl font-bold shimmer-text">
                  {formatCurrency(computedTotal)}
                </p>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 bg-[#1B1B20] rounded-lg px-3 py-2">
                  <Target className="w-4 h-4 text-[#4CD6FB]" />
                  <span>
                    <span className="font-semibold text-[#E4E1E9]">
                      {result.strategies.filter(s => s.estimatedSavings > 0).length}
                    </span>{" "}
                    <span className="text-[#C7C5D3]">Actionable Strategies</span>
                    {result.strategies.some(s => s.estimatedSavings === 0) && (
                      <span className="text-slate-500 ml-1">+ {result.strategies.filter(s => s.estimatedSavings === 0).length} long-term</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-[#1B1B20] rounded-lg px-3 py-2">
                  <TrendingUp className="w-4 h-4 text-[#4CD6FB]" />
                  <span>
                    <span className="font-semibold text-[#E4E1E9]">
                      {
                        new Set(result.strategies.map((s) => s.category))
                          .size
                      }
                    </span>{" "}
                    <span className="text-[#C7C5D3]">
                      Categories Covered
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-[#1B1B20] rounded-lg px-3 py-2">
                  <ArrowRight className="w-4 h-4 text-[#4CD6FB]" />
                  <span className="text-[#C7C5D3]">
                    Savings Range:{" "}
                    <span className="font-semibold text-[#E4E1E9]">
                      {formatCurrency(
                        result.strategies.filter(s => s.estimatedSavings > 0).reduce(
                          (sum, s) => sum + s.savingsMin,
                          0
                        )
                      )}{" "}
                      &ndash;{" "}
                      {formatCurrency(
                        result.strategies.filter(s => s.estimatedSavings > 0).reduce(
                          (sum, s) => sum + s.savingsMax,
                          0
                        )
                      )}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Personalized Situation Summary */}
            <div className="rounded-2xl bg-gradient-to-r from-[#DC5700]/5 to-[#4CD6FB]/5 border border-[#DC5700]/10 p-5 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#DC5700]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Brain className="w-5 h-5 text-[#FFB596]" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#FFB596] mb-2">Expert Analysis Summary</p>
                  <p className="text-sm text-[#C7C5D3] leading-relaxed">
                    Based on your profile as a <strong className="text-[#E4E1E9]">{result.profile.occupation}</strong> filing <strong className="text-[#E4E1E9]">{result.profile.filingStatus}</strong> with <strong className="text-[#E4E1E9]">{result.profile.income}</strong> income
                    {result.profile.dependents !== "0" && <> and <strong className="text-[#E4E1E9]">{result.profile.dependents} dependent{result.profile.dependents !== "1" ? "s" : ""}</strong></>},
                    we identified <strong className="text-[#FFB596]">{result.strategies.filter(s => s.estimatedSavings > 0).length} actionable strategies</strong>{result.strategies.some(s => s.estimatedSavings === 0) && <> plus <strong className="text-slate-400">{result.strategies.filter(s => s.estimatedSavings === 0).length} long-term planning strategies</strong></>} across <strong className="text-[#FFB596]">{new Set(result.strategies.map((s) => s.category)).size} categories</strong> that could save you between <strong className="text-green-400">{formatCurrency(result.strategies.filter(s => s.estimatedSavings > 0).reduce((s, st) => s + st.savingsMin, 0))}</strong> and <strong className="text-green-400">{formatCurrency(result.strategies.filter(s => s.estimatedSavings > 0).reduce((s, st) => s + st.savingsMax, 0))}</strong> this year.
                    The top opportunities are in {Array.from(new Set(result.strategies.filter(s => s.estimatedSavings > 0).slice(0, 3).map((s) => s.category))).join(", ")}.
                    Click <strong className="text-[#4CD6FB]">Learn More</strong> on any strategy for a personalized deep-dive with examples using your actual numbers.
                  </p>
                </div>
              </div>
            </div>

            {/* Strategy Cards */}
            <div className="space-y-4">
              {result.strategies.map((strategy, idx) => {
                const colors =
                  categoryColors[strategy.category] || categoryColors.Deductions;
                const expanded = expandedCards[idx] ?? false;
                const isLongTerm = strategy.estimatedSavings === 0;
                const contribConfig = getContributionConfig(strategy, result.profile);
                const effectiveSavings = getEffectiveSavings(idx, strategy);

                // Find matching master strategy to link content
                const masterMatch = MASTER_STRATEGIES.find((ms) => ms.title === strategy.title);
                const strategyVideos = masterMatch ? getVideosForStrategy(masterMatch.id) : [];
                const strategyPosts = masterMatch ? getPostsForStrategy(masterMatch.id) : [];

                // Show "Long-Term / Planning Strategies" divider before first $0 strategy
                const isFirstLongTerm = isLongTerm && (idx === 0 || result.strategies[idx - 1].estimatedSavings > 0);

                return (
                  <React.Fragment key={idx}>
                    {isFirstLongTerm && (
                      <div className="flex items-center gap-3 pt-6 pb-2">
                        <div className="h-px flex-1 bg-white/10" />
                        <span className="text-xs font-medium text-[#C7C5D3] uppercase tracking-wider">Long-Term Planning Strategies</span>
                        <div className="h-px flex-1 bg-white/10" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl bg-[rgba(31,31,37,0.6)] backdrop-blur-[16px] border p-5 transition-all hover:border-white/10 ${isLongTerm ? 'border-white/3 opacity-80' : 'border-white/5'}`}
                    >
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${colors.bg} ${colors.text}`}
                          >
                            {strategy.category}
                          </span>
                          {isLongTerm && (
                            <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-400">
                              Long-Term
                            </span>
                          )}
                          {!isLongTerm && contribConfig.isContribution && (
                            <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-[#DC5700]/10 text-[#FFB596]">
                              Contribution-Based
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-[#E4E1E9]">
                          {strategy.title}
                        </h3>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        {isLongTerm ? (
                          <>
                            <p className="text-lg font-bold text-slate-400">No immediate savings</p>
                            <p className="text-xs text-[#C7C5D3]">future tax benefit</p>
                          </>
                        ) : (
                          <>
                            <p className="text-2xl font-bold text-[#FFB596]">
                              {formatCurrency(effectiveSavings)}
                            </p>
                            <p className="text-xs text-[#C7C5D3]">tax savings</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-[#C7C5D3] mb-4 leading-relaxed">
                      {strategy.description}
                    </p>

                    {/* Contribution slider for contribution-based strategies */}
                    {!isLongTerm && contribConfig.isContribution && (() => {
                      const rate = result.profile.marginalRate || 24;
                      const contribVal = contributionValues[idx] ?? Math.min(Math.round(strategy.estimatedSavings / (rate / 100)), contribConfig.max);
                      const computedSav = Math.round(contribVal * rate / 100);
                      const step = contribConfig.max > 50000 ? 1000 : contribConfig.max > 10000 ? 500 : 100;
                      return (
                        <div className="mb-4 space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-xs font-medium text-[#C7C5D3]">
                                {contribConfig.label}: How much do you want to contribute?
                              </label>
                              <span className="text-sm font-bold text-[#E4E1E9]">
                                {formatCurrency(contribVal)}
                              </span>
                            </div>
                            <input
                              type="range"
                              className="smart-plan-slider"
                              min={0}
                              max={contribConfig.max}
                              step={step}
                              value={contribVal}
                              onChange={(e) => {
                                const newContrib = Number(e.target.value);
                                setContributionValues(prev => ({ ...prev, [idx]: newContrib }));
                              }}
                            />
                            <div className="flex justify-between mt-1 text-xs text-[#C7C5D3]">
                              <span>$0</span>
                              <span>{formatCurrency(contribConfig.max)} max</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-green-500/5 border border-green-500/10">
                            <span className="text-xs text-[#C7C5D3]">
                              Estimated Tax Savings <span className="text-[10px] opacity-60">({rate}% marginal rate)</span>
                            </span>
                            <span className="text-sm font-bold text-green-400">
                              {formatCurrency(computedSav)}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Savings range slider for non-contribution strategies */}
                    {!isLongTerm && !contribConfig.isContribution && (
                    <div className="mb-4">
                      <input
                        type="range"
                        className="smart-plan-slider"
                        min={strategy.savingsMin}
                        max={strategy.savingsMax}
                        value={sliderValues[idx] ?? strategy.estimatedSavings}
                        onChange={(e) =>
                          handleSliderChange(idx, Number(e.target.value))
                        }
                      />
                      <div className="flex justify-between mt-1 text-xs text-[#C7C5D3]">
                        <span>{formatCurrency(strategy.savingsMin)}</span>
                        <span>{formatCurrency(strategy.savingsMax)}</span>
                      </div>
                    </div>
                    )}

                    {/* Actions row */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleExpand(idx)}
                        className="flex items-center gap-1.5 text-xs text-[#FFB596] hover:text-[#FFB596]/80 transition"
                      >
                        {expanded ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            Hide Steps
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            Implementation Steps
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => openDeepDive(strategy)}
                        className="flex items-center gap-1.5 text-xs text-[#4CD6FB] hover:text-[#4CD6FB]/80 transition font-medium"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Learn More — Deep Dive
                      </button>
                      {strategyVideos.length > 0 && (
                        <Link
                          href={`/dashboard/content?strategy=${masterMatch?.id}`}
                          className="flex items-center gap-1.5 text-xs text-[#A78BFA] hover:text-[#A78BFA]/80 transition font-medium"
                        >
                          <Video className="w-3.5 h-3.5" />
                          Watch Video
                        </Link>
                      )}
                      {strategyPosts.length > 0 && (
                        <Link
                          href={`/dashboard/blog?strategy=${masterMatch?.id}`}
                          className="flex items-center gap-1.5 text-xs text-[#34D399] hover:text-[#34D399]/80 transition font-medium"
                        >
                          <Newspaper className="w-3.5 h-3.5" />
                          Read Article
                        </Link>
                      )}
                    </div>

                    {expanded && (
                      <ol className="mt-3 space-y-2 pl-5 list-decimal text-sm text-[#C7C5D3] animate-fade-in-up">
                        {strategy.implementationSteps.map((step, si) => (
                          <li key={si} className="leading-relaxed">
                            {step}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                  </React.Fragment>
                );
              })}
              </div>

              {/* ---- What-If Scenario Engine CTA ---- */}
              <Link href="/dashboard/scenarios" className="block mt-8 mb-6 group">
                <div className="rounded-2xl bg-gradient-to-r from-[#DC5700]/10 to-[#4CD6FB]/5 border border-[#DC5700]/20 p-6 hover:border-[#DC5700]/40 transition-all hover:shadow-lg hover:shadow-[#DC5700]/10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#DC5700] to-[#FFB596] flex items-center justify-center shrink-0">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-extrabold text-[#E4E1E9] group-hover:text-[#FFB596] transition">What-If Scenario Engine</h3>
                      <p className="text-[11px] text-[#C7C5D3] mt-0.5">
                        See the exact dollar impact — LLC vs S-Corp, Roth Conversions, 1031 Exchanges, Retirement Plans & more. Auto-generated from your profile with real numbers, bar charts, and 5-year projections.
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-[#DC5700] group-hover:text-[#FFB596] transition">
                      View Scenarios <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>

              </div>
            </div>

            {/* Bottom bar — anchored to bottom of flex column */}
            <div className="shrink-0 border-t border-white/5 bg-[#131318] px-4 py-4">
              <div className="max-w-5xl mx-auto">
                <div className="rounded-2xl bg-[rgba(31,31,37,0.6)] backdrop-blur-[16px] border border-white/5 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 shrink-0">
                    <TrendingUp className="w-5 h-5 text-[#FFB596]" />
                    <div>
                      <p className="text-xs text-[#C7C5D3]">
                        Total Estimated Savings
                      </p>
                      <p className="text-xl font-bold shimmer-text">
                        {formatCurrency(computedTotal)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={generateReport}
                      disabled={isGeneratingReport}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(31,31,37,0.6)] backdrop-blur-[16px] border border-white/10 text-sm font-medium text-[#E4E1E9] hover:border-[#FFB596]/30 transition disabled:opacity-50"
                    >
                      {isGeneratingReport ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {isGeneratingReport ? "Generating..." : "Report"}
                    </button>
                    <Link
                      href="/dashboard/strategies"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(31,31,37,0.6)] backdrop-blur-[16px] border border-white/10 text-sm font-medium text-[#E4E1E9] hover:border-[#FFB596]/30 transition"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Strategies
                    </Link>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(31,31,37,0.6)] backdrop-blur-[16px] border border-white/10 text-sm font-medium text-[#E4E1E9] hover:border-[#FFB596]/30 transition"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/content"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(31,31,37,0.6)] backdrop-blur-[16px] border border-white/10 text-sm font-medium text-[#E4E1E9] hover:border-[#A78BFA]/30 transition"
                    >
                      <Video className="w-4 h-4" />
                      Videos
                    </Link>
                    <Link
                      href="/dashboard/scenarios"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(31,31,37,0.6)] backdrop-blur-[16px] border border-[#DC5700]/20 text-sm font-medium text-[#FFB596] hover:border-[#DC5700]/40 transition"
                    >
                      <Zap className="w-4 h-4" />
                      What-If
                    </Link>
                    <a
                      href="tel:+14253954318"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#DC5700] hover:bg-[#DC5700]/80 text-sm font-semibold text-white transition"
                    >
                      <Phone className="w-4 h-4" />
                      Discuss with Advisor
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* ---- Deep Dive Modal ---- */}
      {deepDiveStrategy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDeepDiveStrategy(null)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <div
            className="relative w-full max-w-2xl max-h-[85vh] rounded-3xl bg-[#1B1B20] border border-white/10 shadow-2xl overflow-hidden animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#1B1B20] border-b border-white/5 px-6 py-4 flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-[#4CD6FB] shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#4CD6FB]">Strategy Deep Dive</span>
                </div>
                <h3 className="text-lg font-bold text-[#E4E1E9] truncate">{deepDiveStrategy.title}</h3>
                <p className="text-xs text-[#C7C5D3] mt-0.5">
                  Estimated savings: <span className="text-[#FFB596] font-semibold">{formatCurrency(deepDiveStrategy.estimatedSavings)}</span>
                </p>
              </div>
              <button
                onClick={() => setDeepDiveStrategy(null)}
                className="p-2 rounded-xl hover:bg-white/5 text-[#C7C5D3] hover:text-[#E4E1E9] transition shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto px-6 py-5" style={{ maxHeight: "calc(85vh - 120px)" }}>
              {isLoadingDeepDive && !deepDiveContent && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 text-[#FFB596] animate-spin" />
                  <p className="text-sm text-[#C7C5D3]">Building your personalized guide...</p>
                </div>
              )}
              {deepDiveContent && (
                <div className="prose prose-invert prose-sm max-w-none
                  [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-[#E4E1E9] [&_h1]:mt-6 [&_h1]:mb-3
                  [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-[#E4E1E9] [&_h2]:mt-5 [&_h2]:mb-2
                  [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-[#FFB596] [&_h3]:mt-4 [&_h3]:mb-2
                  [&_p]:text-sm [&_p]:text-[#C7C5D3] [&_p]:leading-relaxed [&_p]:mb-3
                  [&_strong]:text-[#E4E1E9]
                  [&_ul]:space-y-1 [&_ul]:mb-3 [&_ol]:space-y-1 [&_ol]:mb-3
                  [&_li]:text-sm [&_li]:text-[#C7C5D3] [&_li]:leading-relaxed
                  [&_code]:bg-[#35343A] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[#FFB596] [&_code]:text-xs
                  [&_blockquote]:border-l-2 [&_blockquote]:border-[#DC5700] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[#C7C5D3]
                ">
                  <div dangerouslySetInnerHTML={{ __html: deepDiveContent
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
                    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
                    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
                    .replace(/^- (.*$)/gm, "<li>$1</li>")
                    .replace(/^(\d+)\. (.*$)/gm, "<li><strong>$1.</strong> $2</li>")
                    .replace(/\n\n/g, "</p><p>")
                    .replace(/\n/g, "<br/>")
                  }} />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-[#1B1B20] border-t border-white/5 px-6 py-3 flex items-center justify-between">
              <p className="text-[10px] text-[#C7C5D3]">Personalized for your tax profile</p>
              <a
                href="tel:+14253954318"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#DC5700]/10 text-[#FFB596] text-xs font-semibold hover:bg-[#DC5700]/20 transition"
              >
                <Phone className="w-3.5 h-3.5" />
                Discuss with CPA
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ---- Mobile Strategy Floating Button + Drawer ---- */}
      {selectedEntity && phase !== "entity-select" && phase !== "results" && (
        <>
          {/* Floating toggle button (mobile/tablet only) */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden fixed bottom-20 right-4 z-30 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[rgba(31,31,37,0.9)] border border-white/10 shadow-xl text-[#FFB596] hover:bg-[rgba(31,31,37,1)] transition"
          >
            <Zap className="w-4 h-4" />
            <span className="text-xs font-semibold">Strategies</span>
          </button>

          {/* Mobile drawer overlay */}
          {mobileSidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-50" onClick={() => setMobileSidebarOpen(false)}>
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <div
                className="absolute top-0 left-0 bottom-0 w-[320px] max-w-[85vw] bg-[#131318] shadow-2xl animate-fade-in-up flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Reuse sidebar content inline for mobile */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" style={{ color: getEntityInfo(selectedEntity).color }} />
                    <span className="text-sm font-bold text-[#E4E1E9]">Tax Strategies</span>
                  </div>
                  <button onClick={() => setMobileSidebarOpen(false)} className="p-2 rounded-lg hover:bg-white/5 text-[#C7C5D3]">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                  {(() => {
                    const V2_CAT_MAP: Record<string, string> = {
                      'Retirement Planning': 'retirement', 'Credits': 'credits', 'Charity': 'charity',
                      'Advanced': 'deductions', 'Investable Gains': 'real_estate', 'Compensation': 'compensation',
                      'Medical': 'medical', 'Education': 'education', 'Entity': 'entity',
                      'Real Estate': 'real_estate', 'Deductions': 'deductions',
                    };
                    const v2Strats = getStrategiesForEntity(selectedEntity as import("@/lib/tax/strategy-database").EntityType);
                    const cats = new Map<string, typeof v2Strats>();
                    for (const s of v2Strats) {
                      const catKey = V2_CAT_MAP[s.category] || s.category.toLowerCase().replace(/\s+/g, '_');
                      const list = cats.get(catKey) || [];
                      list.push(s);
                      cats.set(catKey, list);
                    }
                    return Array.from(cats.entries()).map(([catId, strats]) => {
                      const masterCat = STRATEGY_CATEGORIES.find(c => c.id === catId);
                      const cat = masterCat || { id: catId, label: strats[0]?.category || catId, icon: 'Zap', color: '#ff6600' };
                      return (
                        <div key={cat.id} className="mb-3">
                          <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: cat.color }}>{cat.label}</span>
                          </div>
                          {strats.map((s) => (
                            <div key={s.id} className="px-3 py-2 rounded-lg hover:bg-white/[0.03]">
                              <p className="text-xs font-medium text-[#E4E1E9]">{s.title}</p>
                              <p className="text-[10px] text-green-400 mt-0.5">
                                {formatCurrency(s.typicalSavingsRange.min)}–{formatCurrency(s.typicalSavingsRange.max)}
                              </p>
                            </div>
                          ))}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
