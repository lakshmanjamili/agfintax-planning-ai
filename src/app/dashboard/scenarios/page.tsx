"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  TrendingUp,
  Home,
  PiggyBank,
  Receipt,
  Landmark,
  Heart,
  ArrowLeft,
  Sparkles,
  Download,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  Zap,
  Phone,
  Loader2,
  Shield,
  Info,
  FileText,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  generateAllScenarios,
  generateDemoScenarios,
  saveScenarios,
  formatUSD,
  type ScenarioResult,
  type ScenarioArm,
} from "@/lib/tax/scenario-engine";
import { getClientProfile, getPlan } from "@/lib/tax/plan-store";

// ---------------------------------------------------------------------------
// Icon map
// ---------------------------------------------------------------------------
const ICONS: Record<string, React.ElementType> = {
  Building2, TrendingUp, Home, PiggyBank, Receipt, Landmark, Heart,
};
const COLORS = ["#4CD6FB", "#DC5700", "#10B981", "#8B5CF6"];

const CONFIDENCE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  high: { label: "High Confidence", color: "#34D399", icon: "shield" },
  medium: { label: "Medium Confidence", color: "#FBBF24", icon: "info" },
  low: { label: "Estimated", color: "#F87171", icon: "alert" },
};

// ---------------------------------------------------------------------------
// Executive PDF Report
// ---------------------------------------------------------------------------
function generateReport(scenarios: ScenarioResult[], clientName?: string) {
  const totalSavings = scenarios.reduce((s, sc) => s + sc.annualSavings, 0);
  const totalFiveYear = scenarios.reduce((s, sc) => s + sc.fiveYearSavings, 0);
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const scenarioHtml = scenarios.map((sc, idx) => {
    const arms = [sc.armA, sc.armB, sc.armC, sc.armD].filter((a): a is ScenarioArm => !!a);
    const conf = CONFIDENCE_LABELS[sc.confidenceLevel] || CONFIDENCE_LABELS.medium;

    const armsHtml = arms.map((arm) => {
      const isWin = arm.shortLabel === sc.recommendation;
      return `<div style="flex:1;min-width:200px;padding:18px;border-radius:12px;background:${isWin ? "#DC570008" : "#f9fafb"};border:${isWin ? "2px solid #DC5700" : "1px solid #e5e7eb"};position:relative">
        ${isWin ? '<div style="position:absolute;top:-9px;right:12px;background:#DC5700;color:white;padding:2px 10px;border-radius:6px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px">✓ Recommended</div>' : ""}
        <h4 style="font-size:13px;font-weight:700;color:#111;margin-bottom:10px;border-bottom:1px solid #e5e7eb;padding-bottom:6px">${arm.label}</h4>
        ${arm.details.map((d) => `<div style="display:flex;justify-content:space-between;font-size:11px;padding:3px 0;border-bottom:1px dashed #f3f4f6">
          <span style="color:#6b7280">${d.label}</span>
          <span style="font-weight:600;color:${d.isSavings ? "#059669" : "#111"}">${d.isSavings ? "+" : ""}${formatUSD(d.value)}</span>
        </div>`).join("")}
        ${arm.highlights.length > 0 ? `<div style="margin-top:10px;padding-top:8px;border-top:1px solid #e5e7eb">
          ${arm.highlights.slice(0, 3).map((h) => `<div style="font-size:10px;color:#059669;padding:1px 0">✓ ${h}</div>`).join("")}
        </div>` : ""}
        ${arm.warnings.filter(Boolean).length > 0 ? `<div style="margin-top:6px">
          ${arm.warnings.filter(Boolean).slice(0, 2).map((w) => `<div style="font-size:10px;color:#DC2626;padding:1px 0">⚠ ${w}</div>`).join("")}
        </div>` : ""}
      </div>`;
    }).join("");

    return `<div style="margin-bottom:40px;page-break-inside:avoid;${idx > 0 ? "border-top:1px solid #e5e7eb;padding-top:30px" : ""}">
      <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:4px">
        <div style="min-width:36px;height:36px;border-radius:10px;background:${sc.color}12;display:flex;align-items:center;justify-content:center;margin-top:2px">
          <span style="color:${sc.color};font-size:16px;font-weight:900">▸</span>
        </div>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <h3 style="font-size:16px;font-weight:800;color:#111;margin:0">${sc.title}</h3>
              <p style="font-size:11px;color:#9ca3af;margin:2px 0 0">${sc.subtitle}</p>
            </div>
            <div style="text-align:right">
              <span style="font-size:24px;font-weight:900;color:#059669">${sc.annualSavings > 0 ? "+" : ""}${formatUSD(sc.annualSavings)}</span>
              <p style="font-size:10px;color:#9ca3af">${sc.fiveYearSavings > 0 ? `${formatUSD(sc.fiveYearSavings)} over 5 years` : "per year"}</p>
            </div>
          </div>
        </div>
      </div>

      ${sc.personalNote ? `<div style="background:#eff6ff;border-left:3px solid #3b82f6;padding:10px 14px;border-radius:0 8px 8px 0;margin:12px 0;font-size:11px;color:#1e40af;line-height:1.6">${sc.personalNote}</div>` : ""}

      <div style="display:flex;gap:12px;flex-wrap:wrap;margin:16px 0">${armsHtml}</div>

      <div style="background:#fafafa;border-radius:10px;padding:14px 18px;border-left:3px solid #DC5700;margin-top:12px">
        <p style="font-size:10px;font-weight:700;color:#DC5700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">AG FinTax Recommendation: ${sc.recommendation}</p>
        <p style="font-size:12px;color:#374151;line-height:1.65;margin:0">${sc.reason}</p>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:6px">
        <span style="font-size:9px;color:${conf.color};font-weight:600">● ${conf.label}</span>
        <span style="font-size:9px;color:#d1d5db">${sc.dataSource}</span>
      </div>
    </div>`;
  }).join("");

  // Executive summary table
  const summaryRows = scenarios.map((sc) =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;font-weight:600;color:#111">${sc.title}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#059669;font-weight:700;text-align:right">${sc.annualSavings > 0 ? "+" : ""}${formatUSD(sc.annualSavings)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#6b7280;text-align:right">${formatUSD(sc.fiveYearSavings)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;font-weight:600;color:#DC5700">${sc.recommendation}</td>
    </tr>`
  ).join("");

  const html = `<!DOCTYPE html><html><head><title>What-If Tax Scenarios — AG FinTax</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif;background:#f4f4f5;color:#111}
.page{max-width:820px;margin:0 auto;background:white;box-shadow:0 4px 24px rgba(0,0,0,0.06)}
.hero{background:linear-gradient(135deg,#131318 0%,#1B1B20 70%,#2a1a10 100%);padding:48px 44px;text-align:center;overflow:hidden;position:relative}
.hero::before{content:'';position:absolute;top:-60px;right:-60px;width:220px;height:220px;background:radial-gradient(circle,#DC570018,transparent);border-radius:50%}
.hero::after{content:'';position:absolute;bottom:-40px;left:-40px;width:160px;height:160px;background:radial-gradient(circle,#4CD6FB10,transparent);border-radius:50%}
.hero .brand{font-size:11px;font-weight:800;letter-spacing:4px;color:#DC5700;text-transform:uppercase;margin-bottom:4px}
.hero .subtitle{font-size:13px;color:#908F9C;margin-bottom:2px}
.hero h1{font-size:22px;font-weight:800;color:#E4E1E9;margin-bottom:4px}
.hero .date{font-size:11px;color:#6b7280;margin-top:2px}
.hero .big{font-size:56px;font-weight:900;color:#34D399;margin:18px 0 4px;letter-spacing:-1px}
.hero .sub{font-size:13px;color:#908F9C}
.summary{padding:30px 44px;background:#f9fafb;border-bottom:1px solid #e5e7eb}
.summary h2{font-size:15px;font-weight:800;color:#111;margin-bottom:14px;text-transform:uppercase;letter-spacing:1px}
.summary table{width:100%;border-collapse:collapse}
.summary th{text-align:left;padding:8px 12px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e5e7eb}
.summary .total td{font-weight:800;font-size:13px;border-top:2px solid #111;padding-top:10px}
.content{padding:36px 44px}
.disc{font-size:9px;color:#bbb;padding:0 44px 24px;line-height:1.6}
.footer{text-align:center;padding:24px 44px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;background:#fafafa}
.cta-box{text-align:center;margin:28px 0;padding:28px;background:linear-gradient(135deg,#DC570008,#FFB59604);border:1px solid #DC570020;border-radius:16px}
.cta-box h3{font-size:18px;font-weight:800;margin-bottom:8px;color:#111}
.cta-box p{font-size:12px;color:#6b7280;margin-bottom:16px}
.cta-box a{display:inline-block;padding:12px 32px;background:#DC5700;color:white;text-decoration:none;border-radius:10px;font-weight:700;font-size:13px}
@media print{body{background:white}.page{box-shadow:none}.no-print{display:none!important}}
</style></head><body>
<div class="page">
  <div class="hero">
    <div class="brand">AG FinTax · What-If Scenario Analysis</div>
    <h1>${clientName ? `Prepared for ${clientName}` : "Your Personalized Tax Scenarios"}</h1>
    <div class="big">+${formatUSD(totalSavings)}</div>
    <div class="sub">Total Annual Savings Across ${scenarios.length} Scenarios</div>
    <div class="sub" style="margin-top:2px">${formatUSD(totalFiveYear)} projected over 5 years</div>
    <div class="date">${today}</div>
  </div>

  <div class="summary">
    <h2>Executive Summary</h2>
    <table>
      <tr><th>Strategy</th><th style="text-align:right">Annual Savings</th><th style="text-align:right">5-Year Impact</th><th>Best Option</th></tr>
      ${summaryRows}
      <tr class="total">
        <td style="padding:10px 12px;color:#111">TOTAL</td>
        <td style="padding:10px 12px;text-align:right;color:#059669">+${formatUSD(totalSavings)}</td>
        <td style="padding:10px 12px;text-align:right;color:#059669">${formatUSD(totalFiveYear)}</td>
        <td style="padding:10px 12px"></td>
      </tr>
    </table>
  </div>

  <div class="content">${scenarioHtml}</div>

  <div class="cta-box">
    <h3>Ready to Implement These Strategies?</h3>
    <p>Schedule a complimentary consultation with AG FinTax to execute these scenarios, ensure compliance, and maximize every dollar of savings.</p>
    <a href="tel:+14253954318">📞 (425) 395-4318 — Schedule Free Consultation</a>
  </div>

  <div class="disc">
    <p><strong>Important Disclaimers:</strong></p>
    <p>* All scenarios are estimates based on profile data, uploaded tax documents, and 2025 federal tax rules (Rev. Proc. 2024-40). Actual results depend on specific financial circumstances, state laws, and final IRS guidance.</p>
    <p>** This analysis is for informational and educational purposes only. It does not constitute tax, legal, or financial advice. No CPA-client or attorney-client relationship is established.</p>
    <p>*** AI-generated projections use simplified models. AMT, NIIT, state-specific rules, and other factors not fully modeled may affect actual outcomes.</p>
    <p>**** Scenario confidence levels indicate data quality: "High Confidence" uses actual tax return data; "Medium" uses profile estimates; "Estimated" uses income-based approximations.</p>
    <p style="margin-top:8px"><strong>Terms:</strong> AG FinTax provides this analysis "as is" without warranty of any kind. Tax laws change frequently — all figures reflect 2025 tax year rules. Consult a qualified CPA or tax attorney before making financial decisions.</p>
  </div>

  <div class="footer">
    <strong style="color:#DC5700">AG FinTax</strong> — Financial & Tax Services for the Dynamic Business Owner<br/>
    (425) 395-4318 · hello@agfintax.com · agfintax.com<br/>
    <span style="margin-top:6px;display:inline-block;color:#d1d5db">Built & Powered by LoukriAI.com</span>
  </div>
</div>
<div class="no-print" style="text-align:center;padding:24px;background:#f4f4f5">
  <button onclick="window.print()" style="background:#DC5700;color:white;padding:12px 32px;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-size:13px;font-family:Inter,sans-serif">Save as PDF</button>
</div>
</body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) win.onload = () => setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 600);
}

// ===========================================================================
// PAGE
// ===========================================================================
export default function ScenariosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0D0D10] flex items-center justify-center"><Loader2 className="w-6 h-6 text-[#FFB596] animate-spin" /></div>}>
      <ScenariosContent />
    </Suspense>
  );
}

function ScenariosContent() {
  const [scenarios, setScenarios] = useState<ScenarioResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const profile = getClientProfile();
    const plan = getPlan();
    let results = generateAllScenarios(profile, plan);

    // If no real data, show demo scenarios so the page isn't empty
    if (results.length === 0) {
      results = generateDemoScenarios();
      setIsDemo(true);
    } else {
      saveScenarios(results);
    }

    setScenarios(results);
    if (results.length > 0) {
      setExpanded(results[0].id);
    }
    setLoading(false);
  }, []);

  const totalSavings = scenarios.reduce((s, sc) => s + sc.annualSavings, 0);
  const totalFiveYear = scenarios.reduce((s, sc) => s + sc.fiveYearSavings, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D10] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#FFB596] animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#C7C5D3]">Analyzing your tax profile for scenarios...</p>
          <p className="text-[10px] text-[#C7C5D3]/40 mt-1">Mining OCR data, document insights, and profile flags</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D10] overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo mode banner */}
        {isDemo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl bg-gradient-to-r from-[#DC5700]/15 to-[#FFB596]/10 border border-[#DC5700]/20 px-5 py-4 flex items-center justify-between gap-4 flex-wrap"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DC5700]/20">
                <Sparkles className="w-5 h-5 text-[#FFB596]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#E4E1E9]">Demo Mode — Sample Scenarios</p>
                <p className="text-xs text-[#C7C5D3]">These use a sample $150K profile. Generate a Smart Plan to see scenarios personalized to your real tax situation.</p>
              </div>
            </div>
            <Link
              href="/dashboard/smart-plan"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#DC5700] to-[#FFB596] text-white rounded-xl text-sm font-bold shrink-0 shadow-lg shadow-[#DC5700]/20 hover:shadow-[#DC5700]/30 transition-all"
            >
              <Sparkles className="w-4 h-4" /> Create My Plan
            </Link>
          </motion.div>
        )}
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between">
            <Link href="/dashboard/smart-plan" className="flex items-center gap-1.5 text-xs text-[#C7C5D3] hover:text-[#FFB596] transition">
              <ArrowLeft className="w-3.5 h-3.5" /> Smart Plan
            </Link>
            <button onClick={() => generateReport(scenarios)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#DC5700]/20 text-[#FFB596] hover:bg-[#DC5700]/30 transition">
              <Download className="w-3.5 h-3.5" /> Download Executive Report
            </button>
          </div>
        </motion.div>

        {/* Summary Banner */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="glass-card rounded-3xl p-8 text-center mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#DC5700] to-[#FFB596] opacity-60" />
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-[#FFB596]" />
            <span className="text-xs font-extrabold text-[#FFB596] uppercase tracking-wider">What-If Scenario Engine</span>
          </div>
          <p className="text-sm text-[#C7C5D3] mb-1">Total identified savings across {scenarios.length} personalized scenarios</p>
          <motion.p initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="text-5xl sm:text-6xl font-black tracking-tight text-[#34D399]">
            +{formatUSD(totalSavings)}
          </motion.p>
          <p className="text-[11px] text-[#C7C5D3]/50 mt-1">/year · {formatUSD(totalFiveYear)} projected over 5 years</p>

          {/* Mini summary table */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
            {scenarios.slice(0, 6).map((sc) => (
              <button key={sc.id} onClick={() => { setExpanded(sc.id); document.getElementById(`scenario-${sc.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }}
                className="text-left rounded-xl bg-white/[0.03] border border-white/5 p-3 hover:bg-white/[0.06] transition">
                <p className="text-[9px] text-[#C7C5D3]/40 truncate">{sc.title}</p>
                <p className={`text-sm font-bold ${sc.annualSavings > 0 ? "text-[#34D399]" : "text-[#F87171]"}`}>
                  +{formatUSD(sc.annualSavings)}
                </p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Scenario Cards */}
        <div className="space-y-4">
          {scenarios.map((sc, idx) => {
            const Icon = ICONS[sc.icon] || Zap;
            const isExpanded = expanded === sc.id;
            const arms = [sc.armA, sc.armB, sc.armC, sc.armD].filter((a): a is ScenarioArm => !!a);
            const conf = CONFIDENCE_LABELS[sc.confidenceLevel] || CONFIDENCE_LABELS.medium;
            const ConfIcon = sc.confidenceLevel === "high" ? Shield : sc.confidenceLevel === "medium" ? Info : AlertTriangle;

            return (
              <motion.div
                key={sc.id}
                id={`scenario-${sc.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
                className="glass-card rounded-2xl border border-white/5 overflow-hidden"
              >
                {/* Scenario Header — always visible */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : sc.id)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${sc.color}15` }}>
                    <Icon className="w-5 h-5" style={{ color: sc.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#E4E1E9]">{sc.title}</h3>
                    <p className="text-[11px] text-[#C7C5D3]/50 truncate">{sc.subtitle}</p>
                  </div>
                  <div className="text-right shrink-0 mr-2">
                    <p className={`text-xl font-black ${sc.annualSavings > 0 ? "text-[#34D399]" : "text-[#F87171]"}`}>
                      {sc.annualSavings > 0 ? "+" : ""}{formatUSD(sc.annualSavings)}
                    </p>
                    <div className="flex items-center gap-1.5 justify-end mt-0.5">
                      <ConfIcon className="w-2.5 h-2.5" style={{ color: conf.color }} />
                      <p className="text-[9px]" style={{ color: conf.color }}>{conf.label}</p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-[#C7C5D3]/30 shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#C7C5D3]/30 shrink-0" />}
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-6 space-y-5">
                        {/* Personal Note */}
                        {sc.personalNote && (
                          <div className="rounded-xl bg-blue-500/5 border border-blue-500/10 p-4">
                            <div className="flex items-start gap-2.5">
                              <FileText className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                              <p className="text-[11px] text-blue-300/80 leading-relaxed">{sc.personalNote}</p>
                            </div>
                          </div>
                        )}

                        {/* Side-by-Side Arms */}
                        <div className={`grid gap-3 ${arms.length <= 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`}>
                          {arms.map((arm, i) => {
                            const isWin = arm.shortLabel === sc.recommendation;
                            return (
                              <div key={arm.shortLabel}
                                className={`rounded-xl p-4 ${isWin ? "bg-[#DC5700]/5 border border-[#DC5700]/20 relative" : "bg-white/[0.02] border border-white/5"}`}>
                                {isWin && (
                                  <div className="absolute -top-2 right-3 bg-gradient-to-r from-[#DC5700] to-[#FFB596] text-white text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    ✓ Best
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                                  <h4 className="text-[11px] font-bold text-[#E4E1E9]">{arm.shortLabel}</h4>
                                </div>
                                <div className="space-y-1.5">
                                  {arm.details.map((d, j) => (
                                    <div key={j} className="flex justify-between text-[10px]">
                                      <span className="text-[#C7C5D3]/60">{d.label}</span>
                                      <span className={`font-semibold ${d.isSavings ? "text-[#34D399]" : "text-[#E4E1E9]"}`}>
                                        {d.isSavings ? "+" : ""}{formatUSD(d.value)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                {arm.highlights.length > 0 && (
                                  <div className="mt-3 pt-2 border-t border-white/5 space-y-1">
                                    {arm.highlights.slice(0, 4).map((h, j) => (
                                      <div key={j} className="flex gap-1.5">
                                        <CheckCircle2 className="w-2.5 h-2.5 text-[#34D399] shrink-0 mt-0.5" />
                                        <p className="text-[9px] text-[#C7C5D3]/60 leading-relaxed">{h}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {arm.warnings.filter(Boolean).length > 0 && (
                                  <div className="mt-2 space-y-0.5">
                                    {arm.warnings.filter(Boolean).slice(0, 2).map((w, j) => (
                                      <div key={j} className="flex gap-1.5">
                                        <AlertTriangle className="w-2.5 h-2.5 text-[#F87171]/60 shrink-0 mt-0.5" />
                                        <p className="text-[9px] text-[#F87171]/50 leading-relaxed">{w}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Bar Chart */}
                        <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                          <h4 className="text-[9px] font-bold text-[#FFB596] uppercase tracking-wider mb-3">Side-by-Side Comparison</h4>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={sc.bars} barCategoryGap="20%">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="label" tick={{ fill: "#C7C5D3", fontSize: 9 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: "#C7C5D3", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`} />
                                <Tooltip contentStyle={{ background: "#1F1F25", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 11 }}
                                  formatter={(v) => [formatUSD(Number(v ?? 0)), ""]} />
                                <Legend wrapperStyle={{ fontSize: 10 }} />
                                <Bar dataKey="armA" name={sc.armA.shortLabel} fill={COLORS[0]} radius={[3, 3, 0, 0]} />
                                <Bar dataKey="armB" name={sc.armB.shortLabel} fill={COLORS[1]} radius={[3, 3, 0, 0]} />
                                {sc.armC && <Bar dataKey="armC" name={sc.armC.shortLabel} fill={COLORS[2]} radius={[3, 3, 0, 0]} />}
                                {sc.armD && <Bar dataKey="armD" name={sc.armD.shortLabel} fill={COLORS[3]} radius={[3, 3, 0, 0]} />}
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Projection Chart */}
                        {sc.projections.length > 2 && (
                          <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                            <h4 className="text-[9px] font-bold text-[#FFB596] uppercase tracking-wider mb-3">
                              {sc.projections.length}-Year Projection
                              <span className="text-[#C7C5D3]/30 ml-2 normal-case font-normal">
                                Cumulative impact: {formatUSD(sc.fiveYearSavings)}
                              </span>
                            </h4>
                            <div className="h-40">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={sc.projections}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                  <XAxis dataKey="year" tick={{ fill: "#C7C5D3", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `Yr ${v}`} />
                                  <YAxis tick={{ fill: "#C7C5D3", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                                  <Tooltip contentStyle={{ background: "#1F1F25", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 11 }}
                                    formatter={(v) => [formatUSD(Number(v ?? 0)), ""]} />
                                  <Area type="monotone" dataKey="armA" name={sc.armA.shortLabel} stroke={COLORS[0]} fill={`${COLORS[0]}20`} strokeWidth={2} />
                                  <Area type="monotone" dataKey="armB" name={sc.armB.shortLabel} stroke={COLORS[1]} fill={`${COLORS[1]}20`} strokeWidth={2} />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}

                        {/* Recommendation */}
                        <div className="rounded-xl bg-gradient-to-r from-[#DC5700]/5 to-transparent border border-[#DC5700]/10 p-4">
                          <div className="flex items-start gap-2.5">
                            <Trophy className="w-4 h-4 text-[#FFB596] shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-bold text-[#FFB596] uppercase tracking-wider mb-1">
                                AG FinTax Recommendation: {sc.recommendation}
                              </p>
                              <p className="text-[11px] text-[#C7C5D3] leading-relaxed">{sc.reason}</p>
                            </div>
                          </div>
                        </div>

                        {/* Data Source & Confidence */}
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-1.5">
                            <ConfIcon className="w-2.5 h-2.5" style={{ color: conf.color }} />
                            <p className="text-[8px] font-semibold" style={{ color: conf.color }}>{conf.label}</p>
                          </div>
                          <p className="text-[8px] text-[#C7C5D3]/20">{sc.dataSource}</p>
                        </div>

                        {/* Disclaimers */}
                        <div className="space-y-0.5">
                          {sc.disclaimers.map((d, i) => (
                            <p key={i} className="text-[8px] text-[#C7C5D3]/20 leading-relaxed">{d}</p>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="mt-8 rounded-2xl bg-gradient-to-r from-[#DC5700]/12 to-[#FFB596]/5 border border-[#DC5700]/15 p-8 text-center">
          <Sparkles className="w-8 h-8 text-[#FFB596] mx-auto mb-3" />
          <h3 className="text-lg font-extrabold text-white mb-2">
            {formatUSD(totalSavings)}/year in Identified Savings
          </h3>
          <p className="text-xs text-[#C7C5D3] mb-1 max-w-lg mx-auto">
            These {scenarios.length} scenarios are personalized to your tax profile. Our advisors can help you implement each one, ensuring compliance and maximizing every dollar.
          </p>
          <p className="text-[10px] text-[#34D399] mb-5">{formatUSD(totalFiveYear)} projected over 5 years</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="tel:+14253954318"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#DC5700] to-[#FFB596] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#DC5700]/20 transition hover:shadow-[#DC5700]/40">
              <Phone className="w-4 h-4" /> Schedule Free Consultation
            </a>
            <button onClick={() => generateReport(scenarios)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-[#E4E1E9] hover:bg-white/10 transition">
              <Download className="w-4 h-4" /> Download Executive Report
            </button>
          </div>
        </motion.div>

        {/* Disclaimers */}
        <div className="mt-6 mb-4">
          <button onClick={() => setShowDisclaimer(!showDisclaimer)}
            className="flex items-center gap-1.5 text-[9px] text-[#C7C5D3]/25 hover:text-[#C7C5D3]/40 transition">
            {showDisclaimer ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
            Disclaimers & Terms
          </button>
          <AnimatePresence>
            {showDisclaimer && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-2 space-y-1.5 text-[8px] text-[#C7C5D3]/20 leading-relaxed">
                  <p>* All scenarios are estimates based on your profile data, uploaded tax documents, and 2025 federal tax rules (Rev. Proc. 2024-40). Actual results depend on specific financial circumstances, state laws, and final IRS guidance.</p>
                  <p>** This analysis is for informational and educational purposes only. It does not constitute tax, legal, or financial advice. No CPA-client or attorney-client relationship is established by using this tool.</p>
                  <p>*** AI-generated projections use simplified models. AMT, NIIT (3.8%), state-specific rules, and other factors not fully modeled may affect actual outcomes. Estimated property values, retirement balances, and other figures are approximated from available data.</p>
                  <p>**** Scenario confidence levels: &quot;High Confidence&quot; — built from actual tax return data (OCR extraction); &quot;Medium Confidence&quot; — from profile + document insights; &quot;Estimated&quot; — income-based approximations requiring actual documents for precision.</p>
                  <p className="pt-1">Terms: AG FinTax provides this tool &quot;as is&quot; without warranty of any kind, express or implied. Tax laws change frequently — all figures reflect 2025 tax year rules. Consult a qualified CPA or tax attorney before making financial decisions.</p>
                  <p className="text-[#C7C5D3]/15 pt-1">© {new Date().getFullYear()} AG FinTax. Built & Powered by LoukriAI.com.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
