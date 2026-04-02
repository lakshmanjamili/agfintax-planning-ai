"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { getApplicableStrategies, getStrategiesByEntity, STRATEGY_CATEGORIES, MASTER_STRATEGIES, type MasterStrategy, type StrategyCategory } from "@/lib/tax/smart-plan-strategies";
import { TAX_INTENTS, detectCoveredIntents, getUncoveredIntents, hasEnoughInfo, buildCoverageMap, buildConversationPrompt, buildVoiceAnalysisPrompt } from "@/lib/tax/smart-plan-engine";
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
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ChatMessage {
  role: "bot" | "user";
  text: string;
  buttons?: string[];
  showSkip?: boolean;
}

interface Strategy {
  title: string;
  category: string;
  description: string;
  estimatedSavings: number;
  savingsMin: number;
  savingsMax: number;
  implementationSteps: string[];
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
}: {
  entityType: string;
  isOpen: boolean;
  onToggle: () => void;
  expandedId: string | null;
  onExpandToggle: (id: string) => void;
  categoryFilter: string | null;
  onCategoryFilter: (id: string | null) => void;
}) {
  const grouped = getStrategiesByEntity(entityType);
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
    } else if (cp.ocrSummary) {
      parts.push(`Prior return summary: ${cp.ocrSummary}`);
    }
    if ((cp.uploadedDocuments || []).length > 0) {
      parts.push(`${cp.uploadedDocuments.length} documents analyzed`);
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
              content: `You are a tax planning AI for AG FinTax. Summarize a client's tax profile in 2-3 concise sentences. Be specific with numbers. Mention what's strong and what's missing for ${entityLabel} (Form ${getEntityInfo(entity).formNumber}) planning. No markdown, just plain text.`,
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

  // Start guided chat — AI sends first message (pre-fill from profile if available)
  useEffect(() => {
    if (phase === "chat" && messages.length === 0) {
      if (hasProfile && profileSummary && profileAnalysis) {
        // Pre-seed the conversation with profile data
        const detected = detectCoveredIntents(profileSummary);
        setCoveredIntents(detected);
        setAllUserText(profileSummary);

        // Build a clean profile recap as the first user message
        const entityLabel = selectedEntity ? getEntityInfo(selectedEntity).label : "Individual";
        const redSlots = profileAnalysis.slots.filter((s) => s.status === "red").map((s) => s.label);
        const missingNote = redSlots.length > 0
          ? `\n\nI still need help with: ${redSlots.join(", ")}.`
          : "";
        const profileMessage = `Here's my tax profile for ${entityLabel} planning:\n\n${profileSummary}${missingNote}`;

        setMessages([{ role: "user", text: profileMessage }]);
        // AI will acknowledge what it knows and ask for what's missing
        aiRespond(profileMessage);
      } else {
        aiRespond("");
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

  // Handle voice interview completion → trigger plan generation
  const handleVoiceInterviewComplete = useCallback((answers: Record<string, string>, qualifiedStrategies: string[]) => {
    const summaryParts: string[] = [];
    for (const [key, value] of Object.entries(answers)) {
      if (value && value !== "skipped") {
        const label = key.replace(/^[a-z]+_/, "").replace(/_/g, " ");
        summaryParts.push(`${label}: ${value}`);
      }
    }
    const fullText = `Voice interview results (qualified strategies: ${qualifiedStrategies.join(", ")}). Client details: ${summaryParts.join(". ")}`;
    setAllUserText(fullText);
    const detected = detectCoveredIntents(fullText);
    setCoveredIntents(detected);
    triggerPlanGeneration(fullText);
  }, []);

  /**
   * Core AI conversation function — sends user message, gets AI response
   */
  const aiRespond = useCallback(async (userText: string) => {
    setIsAiThinking(true);

    // Detect intents from all user text so far
    const combinedText = allUserText + " " + userText;
    const newCovered = detectCoveredIntents(combinedText);
    setCoveredIntents(newCovered);
    setAllUserText(combinedText);

    const conversationHistory = messages
      .map((m) => `${m.role === "bot" ? "Advisor" : "Client"}: ${m.text}`)
      .join("\n");

    const systemPrompt = buildConversationPrompt(newCovered, conversationHistory, selectedEntity || undefined);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.filter((m) => m.text).map((m) => ({
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

      // Add empty bot message for streaming
      const botMsg: ChatMessage = { role: "bot", text: "" };
      setMessages((prev) => [...prev, botMsg]);

      if (reader) {
        let lastStreamUpdate = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          // Debounce streaming updates to prevent UI shaking (every 80ms)
          const now = Date.now();
          if (now - lastStreamUpdate > 80) {
            // Strip suggestion tags during streaming display
            const sugIdx = accumulated.indexOf("[SUGGESTIONS]");
            const readyIdx = accumulated.indexOf("[READY_TO_ANALYZE]");
            let displayText = accumulated;
            if (sugIdx > -1) displayText = displayText.substring(0, sugIdx);
            if (readyIdx > -1) displayText = displayText.replace("[READY_TO_ANALYZE]", "");
            displayText = displayText.trim();
            setMessages((prev) => {
              const copy = [...prev];
              copy[copy.length - 1] = { ...copy[copy.length - 1], text: displayText };
              return copy;
            });
            lastStreamUpdate = now;
          }
        }
        // Final update with complete text
        const sugIdx = accumulated.indexOf("[SUGGESTIONS]");
        const readyIdx = accumulated.indexOf("[READY_TO_ANALYZE]");
        let finalDisplay = accumulated;
        if (sugIdx > -1) finalDisplay = finalDisplay.substring(0, sugIdx);
        if (readyIdx > -1) finalDisplay = finalDisplay.replace("[READY_TO_ANALYZE]", "");
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { ...copy[copy.length - 1], text: finalDisplay.trim() };
          return copy;
        });
      }

      // Parse suggestions from AI response
      let cleanText = accumulated;
      let suggestions: string[] = [];
      const sugMatch = accumulated.match(/\[SUGGESTIONS\]([\s\S]*?)\[\/SUGGESTIONS\]/);
      if (sugMatch) {
        cleanText = accumulated.replace(/\[SUGGESTIONS\][\s\S]*?\[\/SUGGESTIONS\]/, "").trim();
        suggestions = sugMatch[1].split("\n").map((s) => s.trim()).filter(Boolean);
      }

      // Remove READY_TO_ANALYZE marker
      const isReady = cleanText.includes("[READY_TO_ANALYZE]");
      cleanText = cleanText.replace("[READY_TO_ANALYZE]", "").trim();

      // Update final message with clean text + suggestions
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          ...copy[copy.length - 1],
          text: cleanText,
          buttons: suggestions.length > 0 ? suggestions : undefined,
        };
        return copy;
      });

      if (isReady) {
        setTimeout(() => triggerPlanGeneration(combinedText), 1000);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "I had trouble processing that. Could you try rephrasing?" },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  }, [messages, allUserText, coveredIntents]);

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
      // Prefer comprehensive summary (multi-document intelligence) over single OCR summary
      if (cp.comprehensiveSummary) {
        additionalParts.push(`Document intelligence:\n${cp.comprehensiveSummary}`);
      } else if (cp.ocrSummary) {
        additionalParts.push(`From prior return: ${cp.ocrSummary}`);
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
      const timeout = setTimeout(() => controller.abort(), 60000);

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

      const planResult: PlanResult = {
        strategies: data.strategies || [],
        totalEstimatedSavings: data.totalEstimatedSavings || 0,
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
        })),
        totalSavings: planResult.totalEstimatedSavings,
        createdAt: new Date().toISOString(),
        coveredIntents: coveredIntents,
      });

      // Refresh plan history
      setPlanHistory(getPlanHistory());

      const sv: Record<number, number> = {};
      (data.strategies as Strategy[]).forEach((s: Strategy, i: number) => {
        sv[i] = s.estimatedSavings;
      });
      setSliderValues(sv);
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

  const computedTotal = result
    ? result.strategies.reduce(
        (sum, _, i) => sum + (sliderValues[i] ?? 0),
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
    const dateStr = now.toLocaleDateString("en-US", { year: "long" === "long" ? "numeric" : "numeric", month: "long", day: "numeric" });
    const taxYear = now.getFullYear();
    const clientName = result.profile.occupation;
    const totalMin = result.strategies.reduce((sum, s) => sum + s.savingsMin, 0);
    const totalMax = result.strategies.reduce((sum, s) => sum + s.savingsMax, 0);

    const strategyPages = result.strategies.map((s, i) => {
      const val = sliderValues[i] ?? s.estimatedSavings;
      return `
        <div class="page">
          <div class="header-bar"></div>
          <div class="content">
            <p class="client-line">${clientName} | ${result.profile.filingStatus} (${result.profile.income})</p>
            <h2 class="section-title">${s.title} summary</h2>
            <table class="summary-table">
              <tr>
                <td>
                  <span class="label">Deduction</span>
                  <span class="big-number">${formatCurrency(val)}</span>
                  <span class="sub-label">Potential deduction*</span>
                  <span class="sub-value">${formatCurrency(s.savingsMax)}</span>
                </td>
                <td>
                  <span class="label">Tax savings</span>
                  <span class="big-number">${formatCurrency(Math.round(val * 0.32))}</span>
                  <span class="sub-label">Potential tax savings*</span>
                  <span class="sub-value">${formatCurrency(s.savingsMin)} - ${formatCurrency(s.savingsMax)}</span>
                </td>
              </tr>
            </table>
            <p class="body-text">${s.description}</p>
            ${s.implementationSteps?.length ? `
              <p class="bold-label">Eligibility criteria and requirements</p>
              <ul class="dash-list">
                ${s.implementationSteps.slice(0, Math.ceil(s.implementationSteps.length / 2)).map((step) => `<li>- &nbsp;${step}</li>`).join("")}
              </ul>
              <p class="bold-label">Recommended steps for implementation</p>
              <ul class="dash-list">
                ${s.implementationSteps.slice(Math.ceil(s.implementationSteps.length / 2)).map((step) => `<li>- &nbsp;${step}</li>`).join("")}
              </ul>
            ` : ""}
            <p class="footnote">*Potential savings are determined based on the estimated savings calculator associated with this strategy. Update amount by adjusting the estimated savings calculator amounts.</p>
          </div>
          <div class="page-number">${i + 4}</div>
        </div>
      `;
    }).join("");

    const overviewItems = result.strategies.map((s) => s.title);

    const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8" />
<title>AgFinTax Tax Strategy Report - ${clientName}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
<style>
  @page { size: letter; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; color: #333; background: #fff; font-size: 14px; line-height: 1.6; }
  .page { width: 8.5in; min-height: 11in; position: relative; page-break-after: always; padding: 60px 60px 80px; }
  .page:last-child { page-break-after: auto; }
  .header-bar { position: absolute; top: 0; left: 0; right: 0; height: 8px; background: linear-gradient(90deg, #b8c43c, #8fa832); }
  .page-number { position: absolute; bottom: 40px; left: 60px; font-size: 11px; color: #999; }

  /* Cover page */
  .cover { display: flex; flex-direction: column; justify-content: center; }
  .cover h1 { font-family: 'Playfair Display', Georgia, serif; font-size: 42px; font-weight: 700; color: #222; line-height: 1.15; margin-bottom: 20px; }
  .cover .accent-line { width: 80px; height: 4px; background: #b8c43c; margin-bottom: 24px; }
  .cover .client-info { font-size: 16px; color: #444; margin-bottom: 8px; }
  .cover .date { font-size: 14px; color: #888; margin-top: 16px; }

  /* Section titles */
  .section-title { font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 700; color: #222; margin-bottom: 16px; line-height: 1.2; }
  .accent-line-sm { width: 60px; height: 3px; background: #b8c43c; margin-bottom: 24px; }

  /* Overview / TOC */
  .toc-list { list-style: none; padding: 0; }
  .toc-list li { padding: 8px 0; padding-left: 24px; position: relative; font-size: 14px; color: #444; }
  .toc-list li::before { content: '\\25CB'; position: absolute; left: 0; color: #999; }

  /* Body text */
  .body-text { font-size: 13.5px; line-height: 1.7; color: #444; margin-bottom: 20px; }
  .bold-label { font-size: 13.5px; font-weight: 600; color: #333; margin-top: 24px; margin-bottom: 8px; }
  .dash-list { list-style: none; padding: 0; margin-bottom: 16px; }
  .dash-list li { font-size: 13px; color: #555; line-height: 1.8; padding-left: 4px; }
  .client-line { font-size: 13px; color: #666; margin-bottom: 4px; }

  /* Summary table */
  .summary-table { width: 100%; border: 1px solid #e0e0e0; border-collapse: collapse; margin-bottom: 28px; }
  .summary-table td { padding: 20px 24px; width: 50%; vertical-align: top; border: 1px solid #e0e0e0; }
  .summary-table .label { display: block; font-size: 12px; color: #888; margin-bottom: 4px; }
  .summary-table .big-number { display: block; font-family: 'Playfair Display', Georgia, serif; font-size: 42px; font-weight: 700; color: #222; line-height: 1.1; margin-bottom: 8px; }
  .summary-table .sub-label { display: block; font-size: 11px; color: #888; }
  .summary-table .sub-value { display: block; font-size: 13px; color: #444; font-weight: 500; }

  /* Calculations table */
  .calc-table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
  .calc-table th { text-align: left; font-size: 12px; color: #666; font-weight: 500; padding: 8px 0; border-bottom: 1px solid #ddd; }
  .calc-table th:last-child { text-align: right; }
  .calc-table .section-row td { font-weight: 600; color: #222; padding: 10px 0 6px; border-bottom: none; font-size: 13px; }
  .calc-table .data-row td { padding: 6px 0 6px 20px; font-size: 13px; color: #555; border-bottom: 1px solid #f0f0f0; }
  .calc-table .data-row td:last-child { text-align: right; font-weight: 500; }

  .footnote { font-size: 11px; color: #999; font-style: italic; margin-top: 24px; line-height: 1.5; }

  /* Disclaimer */
  .disclaimer-text { font-size: 13px; color: #555; line-height: 1.7; margin-bottom: 16px; }

  /* Print */
  @media print {
    .no-print { display: none !important; }
    .page { page-break-after: always; }
  }
</style>
</head>
<body>

<!-- PAGE 1: Cover -->
<div class="page cover">
  <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
    <h1>Tax Planning<br/>Strategy Report</h1>
    <div class="accent-line"></div>
    <p class="client-info">${clientName} | ${result.profile.filingStatus} | Tax year ${taxYear}</p>
    <p class="date">${dateStr}</p>
  </div>
</div>

<!-- PAGE 2: Overview / TOC -->
<div class="page">
  <div class="header-bar"></div>
  <div class="content" style="padding-top: 80px;">
    <h2 class="section-title">Overview</h2>
    <div class="accent-line-sm"></div>
    <ul class="toc-list">
      <li>Executive Summary</li>
      <li>Tax Savings Calculations</li>
      ${overviewItems.map((t) => `<li>${t}</li>`).join("")}
      <li>Implementation Timeline</li>
      <li>Potential Pitfalls to Avoid</li>
      <li>Key Tax References</li>
    </ul>
  </div>
  <div class="page-number">2</div>
</div>

<!-- PAGE 3: Important Information / Disclaimers -->
<div class="page">
  <div class="header-bar"></div>
  <div class="content" style="padding-top: 40px;">
    <h2 class="section-title">Important information</h2>
    <br/>
    <p class="disclaimer-text">This report, including all associated materials (collectively "this report"), is for informational purposes only and intended for use by the account holder. The tax savings presented are estimates based on the information provided and should not be construed as guaranteed results. No legal, tax, or accounting advice is provided, and no professional-client relationship is created by your use of this report.</p>
    <p class="disclaimer-text">All liability in connection with your use of this report is disclaimed. You assume all responsibilities and obligations with respect to any decisions or actions taken based on the information presented herein. Any reproduction, copying, or redistribution of this report, in whole or in part, is strictly prohibited without express written permission.</p>
    <p class="disclaimer-text">The tax-related information provided should not be used to avoid taxes, penalties, or interest imposed by tax authorities, nor to promote, market, or recommend any tax-related matters. This report utilizes sections of the tax code and associated regulations in effect as of the report date. No obligation is assumed to update this report to reflect changes in tax laws.</p>
    <p class="disclaimer-text">This report is generated based on information you provided. Neither the publisher nor its suppliers or licensors shall be held liable for any consequences arising from incomplete, inaccurate, or erroneous information provided or for any errors or omissions in the use of this report.</p>
    <p class="disclaimer-text">You acknowledge that your use of this report does not make you a third-party beneficiary with respect to any products or services provided or licensed in relation to this report.</p>
  </div>
  <div class="page-number">3</div>
</div>

<!-- Strategy Pages -->
${strategyPages}

<!-- Savings Calculation Page -->
<div class="page">
  <div class="header-bar"></div>
  <div class="content">
    <p class="client-line">${clientName} | ${result.profile.filingStatus} (${result.profile.income})</p>
    <h2 class="section-title">Total potential savings calculation</h2>
    <p class="body-text">Based on your provided inputs, here is a breakdown of your potential tax savings. These calculations use your specific profile data to provide a more accurate estimate than the initial range, though final savings may vary based on full implementation and additional factors.</p>
    <table class="calc-table">
      <tr><th>Strategy</th><th>Amount</th></tr>
      ${result.strategies.map((s, i) => {
        const val = sliderValues[i] ?? s.estimatedSavings;
        return `<tr class="data-row"><td>${s.title}</td><td>${formatCurrency(val)}</td></tr>`;
      }).join("")}
      <tr class="section-row"><td><strong>Total estimated tax savings</strong></td><td style="text-align:right"><strong>${formatCurrency(computedTotal)}</strong></td></tr>
    </table>
    <table class="calc-table" style="margin-top: 24px;">
      <tr><th>Summary</th><th>Amount</th></tr>
      <tr class="data-row"><td>Total deductions identified</td><td>${formatCurrency(computedTotal)}</td></tr>
      <tr class="data-row"><td>Estimated effective tax rate</td><td>32%</td></tr>
      <tr class="section-row"><td><strong>Estimated tax savings</strong></td><td style="text-align:right"><strong>${formatCurrency(Math.round(computedTotal * 0.32))}</strong></td></tr>
      <tr class="data-row"><td>Potential savings range</td><td>${formatCurrency(totalMin)} - ${formatCurrency(totalMax)}</td></tr>
    </table>
  </div>
  <div class="page-number">${result.strategies.length + 4}</div>
</div>

<!-- Key Tax References Page -->
<div class="page">
  <div class="header-bar"></div>
  <div class="content">
    <h2 class="section-title">Key tax references</h2>
    <div class="accent-line-sm"></div>
    <table class="calc-table">
      <tr><th>Reference</th><th>Description</th></tr>
      <tr class="data-row"><td>IRC Section 199A</td><td>Qualified Business Income (QBI) Deduction</td></tr>
      <tr class="data-row"><td>IRC Section 401(k)</td><td>Retirement Plan Contributions</td></tr>
      <tr class="data-row"><td>IRC Section 223</td><td>Health Savings Accounts</td></tr>
      <tr class="data-row"><td>IRC Section 170</td><td>Charitable Contributions</td></tr>
      <tr class="data-row"><td>IRC Section 179</td><td>Expensing Depreciable Assets</td></tr>
      <tr class="data-row"><td>IRC Section 1031</td><td>Like-Kind Exchanges</td></tr>
      <tr class="data-row"><td>IRC Section 121</td><td>Exclusion of Gain from Sale of Principal Residence</td></tr>
      <tr class="data-row"><td>IRC Section 529</td><td>Qualified Tuition Programs</td></tr>
      <tr class="data-row"><td>IRC Section 280A</td><td>Home Office / Augusta Rule</td></tr>
      <tr class="data-row"><td>IRC Section 41</td><td>Research & Development Credit</td></tr>
    </table>
    <br/><br/>
    <div style="text-align: center; padding-top: 40px; border-top: 1px solid #e0e0e0;">
      <p style="font-size: 14px; font-weight: 600; color: #333;">AG FinTax</p>
      <p style="font-size: 12px; color: #888; margin-top: 4px;">(425) 395-4318 &bull; hello@agfintax.com &bull; agfintax.com</p>
      <p style="font-size: 10px; color: #bbb; margin-top: 8px;">Report generated by AgFinTax AI &bull; Built & Powered by LoukriAI.com</p>
    </div>
  </div>
  <div class="page-number">${result.strategies.length + 5}</div>
</div>

<div class="no-print" style="text-align: center; padding: 40px; background: #f9f9f6;">
  <button onclick="window.print()" style="background: #b8c43c; color: white; padding: 14px 40px; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 15px; font-family: Inter, sans-serif;">
    Save as PDF / Print
  </button>
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
  }, [result, sliderValues, computedTotal]);

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
              <h1 className="text-3xl font-extrabold tracking-tight text-[#E4E1E9] mb-2">AI Tax Planning</h1>
              <p className="text-[#C7C5D3] mb-2 leading-relaxed">
                What type of tax return are we planning for?
              </p>
              <p className="text-xs text-[#C7C5D3]/60 mb-8">
                This determines which strategies, forms, and questions we focus on.
              </p>

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
                  {selectedEntity ? `${getEntityInfo(selectedEntity).label} Tax Planning` : "AI Tax Planning"}
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
                              <span className="text-xs text-[#C7C5D3]">AI is reviewing your profile...</span>
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
                          {" "}or the AI will ask during planning.
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
                    Build your tax profile for the best results, or skip and the AI will ask you directly.
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
                {/* Primary: Generate Plan directly from profile */}
                {hasProfile && profileAnalysis && profileAnalysis.readinessPercent >= 50 && (
                  <>
                    {/* Strategy Preview — what the AI will work with */}
                    {(() => {
                      const cp = clientProfile || getClientProfile();
                      const previewAnswers: Record<string, string> = {
                        entity_type: selectedEntity || cp?.entityType || "individual",
                        annual_income: cp?.annualIncome || "",
                        real_estate: cp?.hasRealEstate ? "Yes" : "No",
                        mortgage: cp?.hasMortgage ? "Yes" : "No",
                        self_employment: cp?.hasBusinessIncome ? "Yes" : "No",
                        home_office: cp?.hasBusinessIncome ? "Yes" : "No",
                        children_under_18: String(cp?.dependents ?? 0),
                        dependents: String(cp?.dependents ?? 0),
                        additional_context: [
                          ...(cp?.incomeSources || []),
                          cp?.hasInvestments ? "investments" : "",
                          cp?.hasCharitableGiving ? "charitable" : "",
                          cp?.comprehensiveSummary || cp?.ocrSummary || "",
                        ].filter(Boolean).join(" "),
                      };
                      const matched = getApplicableStrategies(previewAnswers);
                      const categories = new Set(matched.map(s => STRATEGY_CATEGORIES.find(c => c.id === s.category)?.label || s.category));
                      return (
                        <div className="rounded-2xl bg-[rgba(31,31,37,0.6)] border border-white/5 p-4 mb-2">
                          <div className="flex items-center gap-2 mb-3">
                            <Target className="w-4 h-4 text-[#4CD6FB]" />
                            <span className="text-xs font-bold text-[#E4E1E9]">
                              {matched.length} strategies matched from our library
                            </span>
                            <span className="text-[10px] text-[#C7C5D3]">across {categories.size} categories</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {Array.from(categories).map(cat => (
                              <span key={cat} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#4CD6FB]/10 text-[#4CD6FB]">
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    <button
                      onClick={() => {
                        const allText = messages.filter(m => m.role === "user").map(m => m.text).join(" ");
                        triggerPlanGeneration(allText || "Generate plan from profile");
                      }}
                      className="w-full group relative overflow-hidden rounded-2xl p-6 text-center transition-all duration-300 hover:scale-[1.01] bg-gradient-to-r from-[#DC5700] to-[#DC5700]/80 border border-[#DC5700]/30 shadow-xl shadow-[#DC5700]/20 hover:shadow-[#DC5700]/30"
                    >
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-lg font-bold text-white">Generate My Tax Plan</h3>
                          <p className="text-xs text-white/70">
                            AI personalizes strategies from our library based on your profile
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-white/80 ml-2" />
                      </div>
                    </button>

                    {/* Secondary options */}
                    <div className="flex items-center justify-center gap-4 mt-1">
                      <button
                        onClick={startVoiceInterview}
                        className="flex items-center gap-1.5 text-xs font-medium text-[#C7C5D3] hover:text-[#FFB596] transition"
                      >
                        <Phone className="w-3 h-3" />
                        Voice-guided interview
                      </button>
                      <span className="text-[#464651]">|</span>
                      <button
                        onClick={startChatMode}
                        className="text-xs font-medium text-[#C7C5D3] hover:text-[#FFB596] transition"
                      >
                        Add context via chat
                      </button>
                    </div>
                  </>
                )}

                {/* No profile — need to build it first or use chat */}
                {(!hasProfile || !profileAnalysis || profileAnalysis.readinessPercent < 50) && (
                  <div className="space-y-3">
                    {/* Primary: Voice Interview */}
                    <button
                      onClick={startVoiceInterview}
                      className="w-full group relative overflow-hidden rounded-2xl p-6 text-center transition-all duration-300 hover:scale-[1.01] bg-gradient-to-r from-[#DC5700] to-[#DC5700]/80 border border-[#DC5700]/30 shadow-xl shadow-[#DC5700]/20 hover:shadow-[#DC5700]/30"
                    >
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                          <Phone className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-lg font-bold text-white">Voice-Guided Interview</h3>
                          <p className="text-xs text-white/70">
                            Talk with AI — it asks questions, you answer by voice
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-white/80 ml-2" />
                      </div>
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Link
                        href="/dashboard/profile"
                        className="group relative overflow-hidden rounded-2xl p-5 text-center transition-all duration-300 hover:scale-[1.02] bg-[rgba(31,31,37,0.6)] border border-[#464651]/20 hover:border-[#464651]/40"
                      >
                        <div className="flex items-center justify-center gap-3">
                          <User className="w-5 h-5 text-[#4CD6FB]" />
                          <div className="text-left">
                            <h3 className="text-sm font-bold text-[#E4E1E9]">Build My Profile</h3>
                            <p className="text-[11px] text-[#C7C5D3]">Upload docs for best results</p>
                          </div>
                        </div>
                      </Link>

                      <button
                        onClick={startChatMode}
                        className="group relative overflow-hidden rounded-2xl p-5 text-center transition-all duration-300 hover:scale-[1.02] bg-[rgba(31,31,37,0.6)] border border-[#464651]/20 hover:border-[#464651]/40"
                      >
                        <div className="flex items-center justify-center gap-3">
                          <Brain className="w-5 h-5 text-[#4CD6FB]" />
                          <div className="text-left">
                            <h3 className="text-sm font-bold text-[#E4E1E9]">Quick Start Chat</h3>
                            <p className="text-[11px] text-[#C7C5D3]">AI will ask what it needs</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
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
                <div className="text-center mt-4">
                  <button
                    onClick={() => { setPhase("welcome"); }}
                    className="text-xs text-[#C7C5D3] hover:text-[#FFB596] transition"
                  >
                    ← Back to options
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
                {isRecording ? "Listening to you..." : isTranscribing ? "Refining with AI..." : "Tell me your tax situation"}
              </h2>
              <p className="text-sm text-[#C7C5D3] max-w-md mx-auto">
                {isRecording
                  ? "Speak naturally — I see everything you say in real-time below."
                  : isTranscribing
                  ? "Whisper AI is perfecting your transcript for maximum accuracy..."
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
                    className={`max-w-[80%] ${
                      msg.role === "user"
                        ? "bg-[#DC5700]/15 border border-[#DC5700]/20"
                        : "bg-[rgba(31,31,37,0.6)] backdrop-blur-[16px] border border-white/5"
                    } rounded-2xl px-4 py-3`}
                  >
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

            {/* Build Plan button — shows when AI has enough info */}
            {phase === "chat" && hasEnoughInfo(coveredIntents) && (
              <div className="mb-4 text-center">
                <button
                  onClick={() => triggerPlanGeneration(allUserText)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#DC5700] to-[#FFB596] text-white font-bold text-sm shadow-xl shadow-[#DC5700]/25 transition-all hover:shadow-[#DC5700]/40 hover:scale-[1.02]"
                >
                  <Sparkles className="w-4 h-4" />
                  Build My Tax Plan
                </button>
              </div>
            )}

           </div>
          </div>

            {/* Input bar — anchored to bottom of flex column */}
            {phase === "chat" && (
              <div className="shrink-0 border-t border-white/5 bg-[#131318] px-4 py-4">
                <div className="max-w-2xl mx-auto flex items-center gap-2">
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
              </div>
            )}
          </div>
        )}

        {/* ---- Phase 2: Strategy Results ---- */}
        {phase === "results" && result && (
          <div className="flex flex-col h-[calc(100vh-5rem)]">
            {/* Header bar */}
            <div className="shrink-0 z-30 bg-[#131318]/80 backdrop-blur-md border-b border-white/5">
              <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FFB596]" />
                  <span className="text-sm font-semibold text-[#E4E1E9]">Your Tax Plan</span>
                  {selectedEntity && (() => {
                    const eInfo = getEntityInfo(selectedEntity);
                    return (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ml-1" style={{ backgroundColor: `${eInfo.color}15`, color: eInfo.color }}>
                        {eInfo.label} ({eInfo.formNumber})
                      </span>
                    );
                  })()}
                </div>
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
                  <button
                    onClick={() => {
                      if (!canCreatePlan()) {
                        alert(`You've used all ${FREE_PLAN_LIMIT} free plans. Upgrade to Pro for unlimited plans.`);
                        return;
                      }
                      setResult(null);
                      setSliderValues({});
                      setExpandedCards({});
                      setMessages([]);
                      setCoveredIntents([]);
                      setAllUserText("");
                      setPhase(selectedEntity ? "welcome" : "entity-select");
                    }}
                    className="px-3 py-1 rounded-lg bg-[#DC5700]/20 hover:bg-[#DC5700]/30 text-[10px] font-semibold text-[#FFB596] transition flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    New Plan ({getRemainingPlans()} left)
                  </button>
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
                              setSliderValues({});
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
            {/* Header Card */}
            <div className="rounded-2xl bg-[rgba(31,31,37,0.6)] backdrop-blur-[16px] border border-white/5 p-6 mb-6">
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
                      {result.strategies.length}
                    </span>{" "}
                    <span className="text-[#C7C5D3]">Strategies Found</span>
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
                        result.strategies.reduce(
                          (sum, s) => sum + s.savingsMin,
                          0
                        )
                      )}{" "}
                      &ndash;{" "}
                      {formatCurrency(
                        result.strategies.reduce(
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
                  <p className="text-xs font-bold uppercase tracking-widest text-[#FFB596] mb-2">AI Analysis Summary</p>
                  <p className="text-sm text-[#C7C5D3] leading-relaxed">
                    Based on your profile as a <strong className="text-[#E4E1E9]">{result.profile.occupation}</strong> filing <strong className="text-[#E4E1E9]">{result.profile.filingStatus}</strong> with <strong className="text-[#E4E1E9]">{result.profile.income}</strong> income
                    {result.profile.dependents !== "0" && <> and <strong className="text-[#E4E1E9]">{result.profile.dependents} dependent{result.profile.dependents !== "1" ? "s" : ""}</strong></>},
                    we identified <strong className="text-[#FFB596]">{result.strategies.length} strategies</strong> across <strong className="text-[#FFB596]">{new Set(result.strategies.map((s) => s.category)).size} categories</strong> that could save you between <strong className="text-green-400">{formatCurrency(result.strategies.reduce((s, st) => s + st.savingsMin, 0))}</strong> and <strong className="text-green-400">{formatCurrency(result.strategies.reduce((s, st) => s + st.savingsMax, 0))}</strong>.
                    The top opportunities are in {Array.from(new Set(result.strategies.slice(0, 3).map((s) => s.category))).join(", ")}.
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
                const sliderVal = sliderValues[idx] ?? strategy.estimatedSavings;

                // Find matching master strategy to link content
                const masterMatch = MASTER_STRATEGIES.find((ms) => ms.title === strategy.title);
                const strategyVideos = masterMatch ? getVideosForStrategy(masterMatch.id) : [];
                const strategyPosts = masterMatch ? getPostsForStrategy(masterMatch.id) : [];

                return (
                  <div
                    key={idx}
                    className="rounded-2xl bg-[rgba(31,31,37,0.6)] backdrop-blur-[16px] border border-white/5 p-5 transition-all hover:border-white/10"
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <span
                          className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full mb-2 ${colors.bg} ${colors.text}`}
                        >
                          {strategy.category}
                        </span>
                        <h3 className="font-bold text-[#E4E1E9]">
                          {strategy.title}
                        </h3>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <p className="text-2xl font-bold text-[#FFB596]">
                          {formatCurrency(sliderVal)}
                        </p>
                        <p className="text-xs text-[#C7C5D3]">estimated</p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-[#C7C5D3] mb-4 leading-relaxed">
                      {strategy.description}
                    </p>

                    {/* Slider */}
                    <div className="mb-4">
                      <input
                        type="range"
                        className="smart-plan-slider"
                        min={strategy.savingsMin}
                        max={strategy.savingsMax}
                        value={sliderVal}
                        onChange={(e) =>
                          handleSliderChange(idx, Number(e.target.value))
                        }
                      />
                      <div className="flex justify-between mt-1 text-xs text-[#C7C5D3]">
                        <span>{formatCurrency(strategy.savingsMin)}</span>
                        <span>{formatCurrency(strategy.savingsMax)}</span>
                      </div>
                    </div>

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
                        Learn More — AI Deep Dive
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
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#4CD6FB]">AI Deep Dive</span>
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
                  <p className="text-sm text-[#C7C5D3]">AI is building your personalized guide...</p>
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
                  {getStrategiesByEntity(selectedEntity).map((group) => (
                    <div key={group.category.id} className="mb-3">
                      <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: group.category.color }}
                        />
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: group.category.color }}>
                          {group.category.label}
                        </span>
                      </div>
                      {group.strategies.map((s) => (
                        <div key={s.id} className="px-3 py-2 rounded-lg hover:bg-white/[0.03]">
                          <p className="text-xs font-medium text-[#E4E1E9]">{s.title}</p>
                          <p className="text-[10px] text-green-400 mt-0.5">
                            {formatCurrency(s.typicalSavingsRange.min)}–{formatCurrency(s.typicalSavingsRange.max)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
