"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  FileText,
  PiggyBank,
  Brain,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  Circle,
  ArrowRight,
  Building2,
  Target,
  AlertCircle,
  Download,
  DollarSign,
  Shield,
  Users,
  Briefcase,
  Landmark,
  User,
} from "lucide-react";
import {
  getPlan,
  getEntityType,
  getEntityInfo,
  clearPlan,
  getClientProfile,
  type SavedPlan,
  type EntityType,
} from "@/lib/tax/plan-store";

/* ─── animation variants ─── */
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

/* ─── Entity-specific config ─── */
const ENTITY_DASHBOARD_CONFIG: Record<
  EntityType,
  {
    icon: typeof User;
    gradient: string;
    gradientHover: string;
    ringGradient: [string, string];
    focusAreas: Array<{ label: string; description: string }>;
    quickActions: Array<{ label: string; href: string; icon: typeof Brain; desc: string }>;
    tagline: string;
    savingsLabel: string;
  }
> = {
  individual: {
    icon: User,
    gradient: "from-cyan-600 to-cyan-400",
    gradientHover: "hover:border-cyan-500/40 hover:shadow-cyan-900/20",
    ringGradient: ["#4CD6FB", "#A5EDFF"],
    focusAreas: [
      { label: "Retirement Maximization", description: "401(k), IRA, Roth conversions" },
      { label: "Tax Credits", description: "Child, education, EV, earned income" },
      { label: "Itemized Deductions", description: "Mortgage, SALT, medical, charitable" },
      { label: "Investment Planning", description: "Tax-loss harvesting, capital gains" },
    ],
    quickActions: [
      { label: "Build Profile", href: "/dashboard/profile", icon: User, desc: "Upload docs & build profile" },
      { label: "Smart Plan", href: "/dashboard/smart-plan", icon: Sparkles, desc: "AI builds your tax plan" },
      { label: "View Strategies", href: "/dashboard/strategies", icon: TrendingUp, desc: "Review your strategies" },
      { label: "AI Tax Chat", href: "/dashboard/tax-chat", icon: Brain, desc: "Ask about deductions & credits" },
    ],
    tagline: "Individual Tax Planning (Form 1040)",
    savingsLabel: "Deduction & Credit Savings",
  },
  s_corp: {
    icon: Building2,
    gradient: "from-orange-600 to-orange-400",
    gradientHover: "hover:border-orange-500/40 hover:shadow-orange-900/20",
    ringGradient: ["#DC5700", "#FFB596"],
    focusAreas: [
      { label: "Reasonable Compensation", description: "FICA savings via salary/distribution split" },
      { label: "Distribution Planning", description: "Optimize distributions vs salary" },
      { label: "Retirement Stacking", description: "401(k) + profit sharing + cash balance" },
      { label: "QBI Deduction (199A)", description: "20% qualified business income deduction" },
    ],
    quickActions: [
      { label: "Build Profile", href: "/dashboard/profile", icon: Building2, desc: "Upload 1120-S, K-1, W-2" },
      { label: "Smart Plan", href: "/dashboard/smart-plan", icon: Sparkles, desc: "AI builds your S-Corp plan" },
      { label: "View Strategies", href: "/dashboard/strategies", icon: DollarSign, desc: "Salary vs distribution" },
      { label: "AI Tax Chat", href: "/dashboard/tax-chat", icon: Brain, desc: "Ask about S-Corp strategies" },
    ],
    tagline: "S-Corporation Planning (Form 1120-S)",
    savingsLabel: "Payroll & Entity Savings",
  },
  c_corp: {
    icon: Landmark,
    gradient: "from-violet-600 to-violet-400",
    gradientHover: "hover:border-violet-500/40 hover:shadow-violet-900/20",
    ringGradient: ["#8B5CF6", "#C4B5FD"],
    focusAreas: [
      { label: "21% Flat Rate Advantage", description: "Corporate tax rate vs individual" },
      { label: "QSBS Exclusion (Sec 1202)", description: "Exclude up to $10M in capital gains" },
      { label: "Fringe Benefits", description: "MERP, group term life, education" },
      { label: "R&D Tax Credit", description: "Credit for qualifying research activities" },
    ],
    quickActions: [
      { label: "Build Profile", href: "/dashboard/profile", icon: Landmark, desc: "Upload Form 1120, returns" },
      { label: "Smart Plan", href: "/dashboard/smart-plan", icon: Sparkles, desc: "AI builds your C-Corp plan" },
      { label: "QSBS Analysis", href: "/dashboard/strategies", icon: Shield, desc: "Evaluate gain exclusion" },
      { label: "AI Tax Chat", href: "/dashboard/tax-chat", icon: Brain, desc: "Ask about C-Corp strategies" },
    ],
    tagline: "C-Corporation Planning (Form 1120)",
    savingsLabel: "Corporate Tax Savings",
  },
  partnership: {
    icon: Users,
    gradient: "from-emerald-600 to-emerald-400",
    gradientHover: "hover:border-emerald-500/40 hover:shadow-emerald-900/20",
    ringGradient: ["#10B981", "#6EE7B7"],
    focusAreas: [
      { label: "Special Allocations", description: "Strategic income/loss allocation to partners" },
      { label: "Guaranteed Payments", description: "Optimize partner compensation structure" },
      { label: "754 Election", description: "Basis step-up for partnership interest transfers" },
      { label: "K-1 Planning", description: "Partner distribution & income optimization" },
    ],
    quickActions: [
      { label: "Build Profile", href: "/dashboard/profile", icon: Users, desc: "Upload 1065, K-1 forms" },
      { label: "Smart Plan", href: "/dashboard/smart-plan", icon: Sparkles, desc: "AI builds your plan" },
      { label: "Allocation Review", href: "/dashboard/strategies", icon: Users, desc: "Review partner allocations" },
      { label: "AI Tax Chat", href: "/dashboard/tax-chat", icon: Brain, desc: "Ask about partnership strategies" },
    ],
    tagline: "Partnership Planning (Form 1065)",
    savingsLabel: "Partner-Level Savings",
  },
  sole_prop: {
    icon: Briefcase,
    gradient: "from-amber-600 to-amber-400",
    gradientHover: "hover:border-amber-500/40 hover:shadow-amber-900/20",
    ringGradient: ["#F59E0B", "#FCD34D"],
    focusAreas: [
      { label: "Schedule C Deductions", description: "Maximize business expense deductions" },
      { label: "SE Tax Optimization", description: "Reduce self-employment tax burden" },
      { label: "Entity Election Review", description: "Evaluate S-Corp or LLC election" },
      { label: "Home Office Deduction", description: "Simplified or actual method" },
    ],
    quickActions: [
      { label: "Build Profile", href: "/dashboard/profile", icon: Briefcase, desc: "Upload Schedule C, 1099s" },
      { label: "Smart Plan", href: "/dashboard/smart-plan", icon: Sparkles, desc: "AI builds your plan" },
      { label: "Entity Evaluation", href: "/dashboard/strategies", icon: Building2, desc: "Should you elect S-Corp?" },
      { label: "AI Tax Chat", href: "/dashboard/tax-chat", icon: Brain, desc: "Ask about sole prop strategies" },
    ],
    tagline: "Sole Proprietorship Planning (Schedule C)",
    savingsLabel: "Business Deduction Savings",
  },
};

/* ─── Glass Panel wrapper ─── */
function GlassPanel({
  children,
  className = "",
  accentColor,
}: {
  children: React.ReactNode;
  className?: string;
  accentColor?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.05] bg-[rgba(27,27,32,0.6)] p-6 backdrop-blur-[16px] ${className}`}
      style={accentColor ? { borderTopColor: `${accentColor}30`, borderTopWidth: "2px" } : undefined}
    >
      {children}
    </div>
  );
}

/* ─── Savings Breakdown Chart ─── */
function SavingsBreakdownChart({
  strategies,
  accentColor,
}: {
  strategies: SavedPlan["strategies"];
  accentColor: string;
}) {
  if (strategies.length === 0) return null;

  const categoryMap = new Map<string, number>();
  for (const s of strategies) {
    const existing = categoryMap.get(s.category) || 0;
    categoryMap.set(s.category, existing + s.estimatedSavings);
  }

  const categories = Array.from(categoryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const maxVal = Math.max(...categories.map(([, v]) => v));

  return (
    <div className="space-y-3">
      {categories.map(([cat, val], i) => {
        const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
        const opacity = 1 - i * 0.08;
        return (
          <div key={cat}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">{cat}</span>
              <span className="text-xs font-bold text-slate-200">
                ${val.toLocaleString()}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#1F1F25]">
              <div
                className="h-2 rounded-full transition-all duration-1000"
                style={{
                  width: `${pct}%`,
                  backgroundColor: accentColor,
                  opacity,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Progress Ring ─── */
function ProgressRing({
  value,
  max,
  label,
  gradientColors,
}: {
  value: number;
  max: number;
  label: string;
  gradientColors: [string, string];
}) {
  const pct = max > 0 ? value / max : 0;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const gradId = `ring-${label.replace(/\s/g, "")}`;

  return (
    <div className="flex flex-col items-center">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle
          cx="44" cy="44" r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 44 44)"
          className="transition-all duration-1000"
        />
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={gradientColors[0]} />
            <stop offset="100%" stopColor={gradientColors[1]} />
          </linearGradient>
        </defs>
        <text x="44" y="42" textAnchor="middle" className="fill-white text-lg font-bold">
          {value}
        </text>
        <text x="44" y="56" textAnchor="middle" className="fill-slate-500 text-[10px]">
          of {max}
        </text>
      </svg>
      <p className="mt-1 text-xs font-medium text-slate-400">{label}</p>
    </div>
  );
}

/* ─── PDF Generation ─── */
async function generateStrategyPDF(plan: SavedPlan, entityType: EntityType, userName: string) {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const entityInfo = getEntityInfo(entityType);
  const doc = new jsPDF();

  // Header
  doc.setFillColor(20, 20, 26);
  doc.rect(0, 0, 210, 40, "F");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("AG FinTax", 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(220, 87, 0);
  doc.text("AI Financial Architect", 14, 28);
  doc.setFontSize(10);
  doc.setTextColor(180, 180, 180);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 140, 20);
  doc.text(`Prepared for: ${userName}`, 140, 28);

  // Entity badge
  doc.setFontSize(12);
  doc.setTextColor(255, 102, 0);
  doc.text(`${entityInfo.label} (${entityInfo.formNumber})`, 14, 50);

  // Profile
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  let y = 60;
  const profile = plan.profile;
  doc.text(`Occupation: ${profile.occupation}  |  Filing: ${profile.filingStatus}  |  Income: $${Number(profile.income).toLocaleString()}  |  State: ${profile.state}`, 14, y);
  y += 10;

  // Summary box
  doc.setFillColor(30, 30, 38);
  doc.roundedRect(14, y, 182, 30, 3, 3, "F");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("Total Estimated Savings", 20, y + 12);
  doc.setFontSize(18);
  doc.setTextColor(220, 87, 0);
  doc.text(`$${plan.totalSavings.toLocaleString()}`, 20, y + 24);
  doc.setFontSize(10);
  doc.setTextColor(180, 180, 180);
  doc.text(`${plan.strategies.length} strategies across ${new Set(plan.strategies.map((s) => s.category)).size} categories`, 100, y + 12);
  doc.text(`Est. Tax Savings: $${Math.round(plan.totalSavings * 0.32).toLocaleString()} (at ~32% rate)`, 100, y + 24);
  y += 40;

  // Strategy table
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("Tax Strategies", 14, y);
  y += 5;

  const sortedStrategies = plan.strategies
    .slice()
    .sort((a, b) => b.estimatedSavings - a.estimatedSavings);

  autoTable(doc, {
    startY: y,
    head: [["#", "Strategy", "Category", "Est. Savings", "Description"]],
    body: sortedStrategies.map((s, i) => [
      String(i + 1),
      s.title,
      s.category,
      `$${s.estimatedSavings.toLocaleString()}`,
      s.description.slice(0, 100) + (s.description.length > 100 ? "..." : ""),
    ]),
    theme: "grid",
    headStyles: {
      fillColor: [220, 87, 0],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [60, 60, 60],
      cellPadding: 3,
    },
    alternateRowStyles: { fillColor: [245, 245, 250] },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 40 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 82 },
    },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("AG FinTax  |  Built & Powered by LoukriAI.com  |  Confidential", 14, 287);
    doc.text(`Page ${i} of ${pageCount}`, 180, 287);
  }

  doc.save(`AgFinTax_Strategy_Report_${entityInfo.label.replace(/\s/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/* ════════════════════════════════════════════════════════════════
   DASHBOARD PAGE — Entity-Differentiated, Data-Driven
   ════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { user } = useUser();
  const firstName = user?.firstName || "there";
  const fullName = user?.fullName || "Client";
  const [plan, setPlan] = useState<SavedPlan | null>(null);
  const [docCount, setDocCount] = useState(0);
  const [entityType, setEntityType] = useState<EntityType | null>(null);
  const [planMismatch, setPlanMismatch] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [profileCompleteness, setProfileCompleteness] = useState(0);

  useEffect(() => {
    const savedPlan = getPlan();
    const savedEntity = getEntityType();
    setPlan(savedPlan);
    setEntityType(savedEntity);

    // Check client profile
    const clientProfile = getClientProfile();
    if (clientProfile && clientProfile.completeness >= 30) {
      setHasProfile(true);
      setProfileCompleteness(clientProfile.completeness);
    }
    // Count docs from profile's upload history
    setDocCount((clientProfile?.uploadedDocuments || []).length);

    if (savedPlan && savedEntity && savedPlan.entityType !== savedEntity) {
      setPlanMismatch(true);
    }
  }, []);

  const handleClearStalePlan = () => {
    clearPlan();
    setPlan(null);
    setPlanMismatch(false);
  };

  const handleGeneratePDF = async () => {
    if (!plan || !entityType) return;
    setPdfGenerating(true);
    try {
      await generateStrategyPDF(plan, entityType, fullName);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setPdfGenerating(false);
    }
  };

  const entityInfo = entityType ? getEntityInfo(entityType) : null;
  const accentColor = entityInfo?.color || "#DC5700";
  const config = entityType
    ? ENTITY_DASHBOARD_CONFIG[entityType]
    : ENTITY_DASHBOARD_CONFIG.individual;

  const hasPlan = !!plan && !planMismatch;
  const hasEntity = !!entityType;
  const hasDocs = docCount > 0;

  // Real numbers from plan
  const totalSavings = plan?.totalSavings || 0;
  const strategyCount = plan?.strategies.length || 0;
  const categoryCount = plan
    ? new Set(plan.strategies.map((s) => s.category)).size
    : 0;

  // Onboarding progress — clear linear flow
  const onboardingSteps = [
    { id: "profile", label: "Build Profile & Upload Docs", done: hasProfile, href: "/dashboard/profile", description: hasProfile ? `${profileCompleteness}% complete${docCount > 0 ? ` · ${docCount} docs analyzed` : ""}` : "Upload tax returns, W-2s, 1099s — AI builds your profile" },
    { id: "plan", label: "Generate Smart Plan", done: hasPlan, href: "/dashboard/smart-plan", description: hasPlan ? `${strategyCount} strategies · $${totalSavings.toLocaleString()} in savings` : "AI analyzes your profile and builds a personalized tax plan" },
    { id: "review", label: "Review Strategies", done: hasPlan && strategyCount > 0, href: "/dashboard/strategies", description: hasPlan ? "Review, customize, and prioritize your strategies" : "Complete Smart Plan first" },
    { id: "download", label: "Download Report", done: hasPlan && strategyCount > 0, href: "/dashboard", description: hasPlan ? "Download your strategy PDF report" : "Generate your plan first" },
  ];
  const completedSteps = onboardingSteps.filter((s) => s.done).length;

  const EntityIcon = config.icon;

  return (
    <div className="space-y-8">
      {/* ─── Welcome Header with Entity Context ─── */}
      <motion.div initial="hidden" animate="visible" custom={0} variants={fadeIn}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white md:text-3xl">
              Welcome back, {firstName}
            </h2>
            <p className="mt-1 text-slate-500">
              {hasPlan
                ? `Your ${entityInfo?.label || "tax"} plan has ${strategyCount} strategies worth $${totalSavings.toLocaleString()}.`
                : entityInfo
                ? config.tagline
                : "Let's get your tax plan started."}
            </p>
          </div>
          {entityInfo && (
            <Link href="/dashboard/smart-plan">
              <span
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:opacity-80"
                style={{
                  backgroundColor: `${accentColor}12`,
                  color: accentColor,
                  border: `1px solid ${accentColor}25`,
                }}
              >
                <EntityIcon className="h-4 w-4" />
                {entityInfo.label} ({entityInfo.formNumber})
              </span>
            </Link>
          )}
        </div>
      </motion.div>

      {/* ─── Plan Mismatch Warning ─── */}
      {planMismatch && plan && entityInfo && (
        <motion.div initial="hidden" animate="visible" custom={0.3} variants={fadeIn}>
          <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-5">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-orange-500/10 p-2.5 shrink-0 mt-0.5">
                <AlertCircle className="h-5 w-5 text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-orange-400">Plan Needs Update</h3>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  Your current plan was built for <strong className="text-slate-300">{getEntityInfo(plan.entityType).label} ({getEntityInfo(plan.entityType).formNumber})</strong> but you switched to <strong className="text-slate-300">{entityInfo.label} ({entityInfo.formNumber})</strong>. The strategies and documents don&apos;t match your new entity type.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <Link
                    href="/dashboard/smart-plan"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-semibold transition"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Build New {entityInfo.label} Plan
                  </Link>
                  <button
                    onClick={handleClearStalePlan}
                    className="text-xs text-slate-500 hover:text-slate-300 transition"
                  >
                    Clear old plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── Stats Cards (entity-colored, real data only) ─── */}
      {hasPlan && (
        <motion.div
          initial="hidden"
          animate="visible"
          custom={0.5}
          variants={fadeIn}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {/* Total Savings */}
          <GlassPanel accentColor={accentColor}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  {config.savingsLabel}
                </p>
                <p className="mt-2 text-3xl font-bold text-white">
                  ${totalSavings.toLocaleString()}
                </p>
                <span
                  className="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                >
                  From Smart Plan
                </span>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: `${accentColor}15` }}>
                <PiggyBank className="h-6 w-6" style={{ color: accentColor }} />
              </div>
            </div>
          </GlassPanel>

          {/* Est. Tax Savings */}
          <GlassPanel accentColor={accentColor}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Est. Tax Savings
                </p>
                <p className="mt-2 text-xl font-bold text-emerald-400">
                  ${Math.round(totalSavings * 0.32).toLocaleString()}
                </p>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                  at ~32% effective rate
                </span>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-3">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </GlassPanel>

          {/* Strategies */}
          <GlassPanel accentColor={accentColor}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Strategies
                </p>
                <p className="mt-2 text-3xl font-bold text-white">{strategyCount}</p>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-400">
                  {categoryCount} categories
                </span>
              </div>
              <div className="rounded-xl bg-violet-500/10 p-3">
                <Target className="h-6 w-6 text-violet-400" />
              </div>
            </div>
          </GlassPanel>

          {/* Profile */}
          <GlassPanel accentColor={accentColor}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Profile
                </p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {profileCompleteness}%
                </p>
                <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  profileCompleteness >= 80
                    ? "bg-green-500/10 text-green-400"
                    : "bg-blue-500/10 text-blue-400"
                }`}>
                  {docCount > 0 ? `${docCount} docs analyzed` : "Upload docs to improve"}
                </span>
              </div>
              <div className="rounded-xl bg-blue-500/10 p-3">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      )}

      {/* ─── Generate PDF + Onboarding Progress ─── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Onboarding Progress */}
        <motion.div initial="hidden" animate="visible" custom={1} variants={fadeIn} className="lg:col-span-2">
          <GlassPanel>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Getting Started</h3>
              <span className="text-xs font-medium text-slate-400">
                {completedSteps} of {onboardingSteps.length} complete
              </span>
            </div>

            {/* Progress bar with entity color */}
            <div className="mb-5 h-1.5 w-full rounded-full bg-[#1F1F25]">
              <div
                className="h-1.5 rounded-full transition-all duration-700"
                style={{
                  width: `${(completedSteps / onboardingSteps.length) * 100}%`,
                  background: `linear-gradient(to right, ${accentColor}, ${accentColor}99)`,
                }}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {onboardingSteps.map((step) => (
                <Link key={step.id} href={step.href}>
                  <div
                    className={`group flex items-start gap-3 rounded-xl border p-4 transition-all duration-200 ${
                      step.done
                        ? "border-green-500/10 bg-green-500/5"
                        : "border-white/[0.05] bg-[rgba(31,31,37,0.5)] hover:bg-opacity-80"
                    }`}
                    style={!step.done ? { "--hover-border": `${accentColor}30` } as React.CSSProperties : undefined}
                    onMouseEnter={(e) => { if (!step.done) (e.currentTarget as HTMLElement).style.borderColor = `${accentColor}30`; }}
                    onMouseLeave={(e) => { if (!step.done) (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)"; }}
                  >
                    <div className="mt-0.5">
                      {step.done ? (
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-600 transition" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${step.done ? "text-green-400" : "text-slate-200"}`}>
                        {step.label}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 truncate">
                        {step.description}
                      </p>
                    </div>
                    {!step.done && (
                      <ArrowRight className="h-4 w-4 text-slate-600 mt-1 shrink-0" />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </GlassPanel>
        </motion.div>

        {/* Key Focus Areas (entity-specific) */}
        <motion.div initial="hidden" animate="visible" custom={1.5} variants={fadeIn}>
          <GlassPanel accentColor={accentColor} className="h-full">
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-lg p-1.5" style={{ backgroundColor: `${accentColor}15` }}>
                <EntityIcon className="h-4 w-4" style={{ color: accentColor }} />
              </div>
              <h3 className="text-base font-semibold text-white">Key Focus Areas</h3>
            </div>
            <div className="space-y-3">
              {config.focusAreas.map((area) => (
                <div key={area.label} className="flex items-start gap-3">
                  <div
                    className="mt-1.5 h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: accentColor }}
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-200">{area.label}</p>
                    <p className="text-xs text-slate-500">{area.description}</p>
                  </div>
                </div>
              ))}
            </div>
            {hasPlan && (
              <button
                onClick={handleGeneratePDF}
                disabled={pdfGenerating}
                className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: accentColor }}
              >
                <Download className="h-4 w-4" />
                {pdfGenerating ? "Generating..." : "Download Strategy PDF"}
              </button>
            )}
          </GlassPanel>
        </motion.div>
      </div>

      {/* ─── Smart Plan CTA (if no plan) ─── */}
      {!hasPlan && !planMismatch && (
        <motion.div initial="hidden" animate="visible" custom={2} variants={fadeIn}>
          <Link href="/dashboard/smart-plan">
            <div
              className={`group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:shadow-lg ${config.gradientHover}`}
              style={{ borderColor: `${accentColor}20`, background: `linear-gradient(135deg, ${accentColor}08 0%, rgba(27,27,32,0.8) 50%, ${accentColor}05 100%)` }}
            >
              <div className="flex items-center gap-5">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${config.gradient} shadow-lg`}
                >
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">
                    {entityInfo ? `Start Your ${entityInfo.label} Plan` : "Start Your Smart Plan"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {entityInfo
                      ? `AI-powered ${entityInfo.formNumber} tax planning — strategies tailored to your ${entityInfo.label.toLowerCase()}.`
                      : "Select your entity type, answer a few questions, and AI builds your personalized tax plan."}
                  </p>
                </div>
                {entityInfo && (
                  <span
                    className="hidden lg:inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
                    style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                  >
                    {entityInfo.formNumber}
                  </span>
                )}
                <ArrowUpRight className="h-6 w-6 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" style={{ color: accentColor }} />
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      {/* ─── Plan Summary + Savings Breakdown ─── */}
      {hasPlan && plan && (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Savings by Category */}
          <motion.div
            initial="hidden" animate="visible" custom={2} variants={fadeIn}
            className="lg:col-span-3"
          >
            <GlassPanel accentColor={accentColor}>
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Savings by Category</h3>
                <Link
                  href="/dashboard/smart-plan"
                  className="flex items-center gap-1 text-xs font-medium transition"
                  style={{ color: accentColor }}
                >
                  View Full Plan <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <SavingsBreakdownChart strategies={plan.strategies} accentColor={accentColor} />
            </GlassPanel>
          </motion.div>

          {/* Plan Overview Ring + Top Strategies */}
          <motion.div
            initial="hidden" animate="visible" custom={3} variants={fadeIn}
            className="lg:col-span-2"
          >
            <GlassPanel className="h-full" accentColor={accentColor}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Plan Overview</h3>
                <button
                  onClick={handleGeneratePDF}
                  disabled={pdfGenerating}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: accentColor }}
                >
                  <Download className="h-3 w-3" />
                  {pdfGenerating ? "..." : "PDF"}
                </button>
              </div>

              <div className="flex justify-center mb-5">
                <ProgressRing
                  value={strategyCount}
                  max={strategyCount + 5}
                  label="Strategies"
                  gradientColors={config.ringGradient}
                />
              </div>

              {/* Top strategies */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Top Strategies</p>
                {plan.strategies
                  .slice()
                  .sort((a, b) => b.estimatedSavings - a.estimatedSavings)
                  .slice(0, 4)
                  .map((s, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-300 truncate flex-1">{s.title}</span>
                      <span className="text-xs font-bold shrink-0" style={{ color: accentColor }}>
                        ${s.estimatedSavings.toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.05]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Total Estimated</span>
                  <span className="text-base font-bold text-white">${totalSavings.toLocaleString()}</span>
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        </div>
      )}

      {/* ─── Your Flow: Profile → Plan → Strategies → Download ─── */}
      {!hasPlan && (
        <motion.div initial="hidden" animate="visible" custom={hasPlan ? 4 : 2.5} variants={fadeIn}>
          <GlassPanel>
            <h3 className="text-lg font-semibold text-white mb-4">How It Works</h3>
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { step: "1", label: "Build Profile", desc: "Upload tax returns, W-2s, 1099s — AI extracts your data", href: "/dashboard/profile", icon: User },
                { step: "2", label: "Smart Plan", desc: "AI analyzes your profile and builds personalized strategies", href: "/dashboard/smart-plan", icon: Sparkles },
                { step: "3", label: "Review", desc: "Review strategies, estimated savings, and recommendations", href: "/dashboard/strategies", icon: TrendingUp },
                { step: "4", label: "Download", desc: "Download your strategy report PDF to share with your CPA", href: "/dashboard", icon: Download },
              ].map((item) => (
                <Link key={item.step} href={item.href}>
                  <div className="group rounded-xl border border-white/[0.05] bg-[rgba(31,31,37,0.5)] p-4 transition-all hover:border-opacity-20"
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${accentColor}30`; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)"; }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white"
                        style={{ backgroundColor: accentColor }}>
                        {item.step}
                      </span>
                      <item.icon className="h-4 w-4 text-slate-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-200">{item.label}</p>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </GlassPanel>
        </motion.div>
      )}

      {/* ─── Quick Actions (entity-specific) ─── */}
      <motion.div initial="hidden" animate="visible" custom={hasPlan ? 5 : 3} variants={fadeIn}>
        <h3 className="mb-4 text-lg font-semibold text-white">Quick Actions</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {config.quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <div
                className="group flex items-center gap-3 rounded-xl border border-white/[0.05] bg-[rgba(31,31,37,0.5)] p-4 transition-all duration-200"
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${accentColor}25`;
                  (e.currentTarget as HTMLElement).style.backgroundColor = `${accentColor}08`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(31,31,37,0.5)";
                }}
              >
                <div
                  className="rounded-xl p-2.5 transition"
                  style={{ backgroundColor: `${accentColor}15` }}
                >
                  <action.icon className="h-5 w-5" style={{ color: accentColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200">{action.label}</p>
                  <p className="text-xs text-slate-500 truncate">{action.desc}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-600 transition shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ─── Footer ─── */}
      <motion.footer
        initial="hidden"
        animate="visible"
        custom={6}
        variants={fadeIn}
        className="mt-12 border-t border-white/[0.05] bg-[rgba(27,27,32,0.6)] backdrop-blur-[16px]"
        style={{ marginLeft: "-1rem", marginRight: "-1rem", marginBottom: "-1rem", padding: "0" }}
      >
        <div className="px-4 pt-12 pb-6 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Link href="/" className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-600 to-orange-400">
                  <span className="text-sm font-extrabold text-white">AG</span>
                </div>
                <span className="text-xl font-bold tracking-tight text-white">
                  AG <span className="text-orange-500">FinTax</span>
                </span>
              </Link>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/50">
                Financial &amp; Tax Services for the Dynamic Business Owners.
                AI-powered tax planning and optimization.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/70">
                Quick Links
              </h4>
              <ul className="space-y-2.5">
                {["Features", "How it Works", "Pricing", "About"].map(
                  (link) => (
                    <li key={link}>
                      <a
                        href={`/#${link.toLowerCase().replace(/ /g, "-")}`}
                        className="text-sm text-white/50 transition-colors hover:text-orange-500"
                      >
                        {link}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/70">
                Legal
              </h4>
              <ul className="space-y-2.5">
                {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(
                  (link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-white/50 transition-colors hover:text-orange-500"
                      >
                        {link}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/70">
                Contact
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href="tel:425-395-4318"
                    className="text-sm text-white/50 transition-colors hover:text-orange-500"
                  >
                    425-395-4318
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:hello@agfintax.com"
                    className="text-sm text-white/50 transition-colors hover:text-orange-500"
                  >
                    hello@agfintax.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
            <p className="text-sm text-white/40">
              &copy; {new Date().getFullYear()} AG FinTax. All rights reserved.
            </p>
            <p className="text-sm text-white/40">
              Built &amp; Powered by{" "}
              <a
                href="https://loukriai.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-orange-500 transition-colors hover:text-orange-400"
              >
                LoukriAI.com
              </a>
            </p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
