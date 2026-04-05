"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Download,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Brain,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Zap,
  FileText,
  Home,
  Heart,
  Receipt,
  GraduationCap,
} from "lucide-react";
import {
  calculateTax,
  defaultTaxInput,
  formatUSD,
  formatPercent,
  FILING_STATUS_OPTIONS,
  type TaxInput,
  type TaxResult,
  type FilingStatus,
} from "@/lib/tax/tax-calculator";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const STD_DED: Record<FilingStatus, number> = { single: 15750, mfj: 31500, mfs: 15750, hoh: 23625, qss: 31500 };
function seniorBonus(fs: FilingStatus, age: number) { return age < 65 ? 0 : (fs === "single" || fs === "hoh" ? 2050 : 1650); }
const parse = (v: string) => parseFloat(v.replace(/[^0-9.-]/g, "")) || 0;

const FS_LABELS: Record<FilingStatus, string> = {
  single: "Single", mfj: "Married Filing Jointly", mfs: "Married Filing Separately",
  hoh: "Head of Household", qss: "Qualifying Surviving Spouse",
};

// ---------------------------------------------------------------------------
// Currency input
// ---------------------------------------------------------------------------
function $Input({ label, hint, value, onChange, placeholder, icon }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void; placeholder?: string; icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#C7C5D3] mb-1">{label}</label>
      <div className="relative">
        {icon || <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#C7C5D3]/40" />}
        <input
          type="text" inputMode="numeric" value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
          onBlur={() => { const n = parse(value); onChange(n > 0 ? n.toLocaleString("en-US") : ""); }}
          onFocus={() => { const n = parse(value); onChange(n > 0 ? String(n) : ""); }}
          placeholder={placeholder ?? "0"}
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0D0D10] border border-white/10 text-[#E4E1E9] text-sm focus:outline-none focus:border-[#DC5700]/50 focus:ring-1 focus:ring-[#DC5700]/20 transition placeholder:text-[#C7C5D3]/20"
        />
      </div>
      {hint && <p className="text-[9px] text-[#C7C5D3]/40 mt-0.5">{hint}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI Insights type
// ---------------------------------------------------------------------------
interface AIInsights {
  greeting: string;
  summary: string;
  opportunities: string[];
  estimatedAdditionalSavings: number;
  riskFlag: string | null;
  ctaMessage: string;
}

// ---------------------------------------------------------------------------
// Report Generator (wow version)
// ---------------------------------------------------------------------------
function generateWowReport(
  filingStatus: FilingStatus, age: number, result: TaxResult,
  itemized: { salt: number; mortgage: number; charityCash: number; charityNonCash: number; medical: number; other: number },
  advanced: { k401: number; ira: number; hsa: number; otherDed: number; businessIncome: number },
  grossIncome: number, withheld: number,
  insights: AIInsights | null,
) {
  const isRefund = result.refundOrOwed >= 0;
  const bracketBars = result.bracketBreakdown.map((b) => {
    const mx = Math.max(...result.bracketBreakdown.map((x) => x.tax));
    const w = mx > 0 ? Math.max(4, (b.tax / mx) * 300) : 4;
    return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <span style="width:40px;font-size:12px;font-weight:600;color:#666;text-align:right">${(b.rate*100).toFixed(0)}%</span>
      <div style="height:20px;width:${w}px;border-radius:4px;background:linear-gradient(90deg,#DC5700,#FFB596)"></div>
      <span style="font-size:12px;color:#555">${formatUSD(b.amount)} taxed → <strong>${formatUSD(b.tax)}</strong></span>
    </div>`;
  }).join("");

  const opportunitiesHtml = insights?.opportunities?.map((o, i) =>
    `<div style="display:flex;gap:10px;margin-bottom:10px">
      <div style="width:28px;height:28px;border-radius:50%;background:#DC570015;display:flex;align-items:center;justify-content:center;shrink:0;font-size:13px;font-weight:700;color:#DC5700">${i+1}</div>
      <p style="font-size:13px;color:#444;line-height:1.5;margin:0">${o}</p>
    </div>`
  ).join("") ?? "";

  const html = `<!DOCTYPE html><html><head><title>Your Tax Report — AG FinTax</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#f4f4f5;color:#1a1a1a}
.page{max-width:720px;margin:0 auto;background:white;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
.hero{background:linear-gradient(135deg,#131318,#1B1B20);padding:48px 40px;text-align:center;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:-50px;right:-50px;width:200px;height:200px;background:radial-gradient(circle,#DC570020,transparent);border-radius:50%}
.hero::after{content:'';position:absolute;bottom:-30px;left:-30px;width:150px;height:150px;background:radial-gradient(circle,#4CD6FB10,transparent);border-radius:50%}
.hero .brand{font-size:13px;font-weight:800;letter-spacing:3px;color:#DC5700;text-transform:uppercase;margin-bottom:4px}
.hero h1{font-size:20px;font-weight:400;color:#C7C5D3;margin-bottom:24px}
.hero .big{font-size:56px;font-weight:900;letter-spacing:-2px}
.hero .big.refund{color:#34D399}.hero .big.owed{color:#F87171}
.hero .sub{font-size:13px;color:#908F9C;margin-top:8px}
.content{padding:36px 40px}
.section{margin-bottom:32px}
.section-title{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#DC5700;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #f0f0f0}
.row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px}
.row .l{color:#666}.row .v{font-weight:600;color:#1a1a1a}
.row.total{border-top:2px solid #eee;padding-top:10px;margin-top:6px;font-size:14px}
.row.total .l,.row.total .v{font-weight:800}
.minus{color:#dc2626}
.rates{display:flex;gap:24px;margin-bottom:20px}
.rate-box{flex:1;text-align:center;padding:16px;border-radius:12px;background:#f8f8f8}
.rate-box .num{font-size:28px;font-weight:800}.rate-box .lab{font-size:11px;color:#888;margin-top:2px}
.ai-box{background:linear-gradient(135deg,#DC570008,#4CD6FB05);border:1px solid #DC570020;border-radius:16px;padding:24px;margin-bottom:32px}
.ai-box h3{font-size:14px;font-weight:700;color:#DC5700;margin-bottom:8px;display:flex;align-items:center;gap:6px}
.ai-box .greeting{font-size:14px;color:#333;font-weight:500;margin-bottom:12px}
.ai-box .summary{font-size:13px;color:#555;line-height:1.6;margin-bottom:16px}
.savings-badge{display:inline-flex;align-items:center;gap:6px;background:#34D39915;color:#16a34a;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:700;margin:12px 0}
.risk{background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:12px 16px;margin-top:12px;font-size:12px;color:#991B1B}
.cta-box{text-align:center;margin:32px 0;padding:28px;background:linear-gradient(135deg,#DC570010,#FFB59605);border:1px solid #DC570025;border-radius:16px}
.cta-box h3{font-size:18px;font-weight:800;color:#1a1a1a;margin-bottom:6px}
.cta-box p{font-size:13px;color:#666;margin-bottom:16px;max-width:480px;margin-left:auto;margin-right:auto}
.cta-box a{display:inline-block;padding:12px 32px;background:#DC5700;color:white;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;box-shadow:0 4px 12px #DC570030}
.footer{text-align:center;padding:24px 40px;border-top:1px solid #eee;font-size:11px;color:#aaa}
.disc{font-size:10px;color:#bbb;padding:0 40px 24px;line-height:1.5}
@media print{body{background:white}.page{box-shadow:none}.no-print{display:none!important}}
</style></head><body>
<div class="page">
  <div class="hero">
    <div class="brand">AG FinTax</div>
    <h1>Your 2025 Federal Tax Estimate</h1>
    <div class="big ${isRefund ? "refund" : "owed"}">${isRefund ? "+" : ""}${formatUSD(Math.abs(result.refundOrOwed))}</div>
    <div class="sub">${isRefund ? "Estimated Tax Refund" : "Estimated Taxes Owed"} · ${FS_LABELS[filingStatus]} · Age ${age}</div>
    <div class="sub" style="margin-top:4px">Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
  </div>

  <div class="content">
    ${insights ? `
    <div class="ai-box">
      <h3>🧠 AG Tax Analysis</h3>
      <div class="greeting">${insights.greeting}</div>
      <div class="summary">${insights.summary}</div>
      ${insights.opportunities.length > 0 ? `
        <div style="font-size:12px;font-weight:700;color:#333;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px">💡 Savings Opportunities</div>
        ${opportunitiesHtml}
        <div class="savings-badge">✨ Potential Additional Savings: ${formatUSD(insights.estimatedAdditionalSavings)}/year</div>
      ` : ""}
      ${insights.riskFlag ? `<div class="risk">⚠️ ${insights.riskFlag}</div>` : ""}
    </div>` : ""}

    <div class="section">
      <div class="section-title">Income & Deductions</div>
      <div class="row"><span class="l">Gross Income</span><span class="v">${formatUSD(grossIncome)}</span></div>
      <div class="row"><span class="l">${result.deductionUsed === "standard" ? "Standard" : "Itemized"} Deduction</span><span class="v minus">−${formatUSD(result.deductionAmount)}</span></div>
      ${result.totalAdjustments > 0 ? `<div class="row"><span class="l">Above-the-Line Adjustments</span><span class="v minus">−${formatUSD(result.totalAdjustments)}</span></div>` : ""}
      <div class="row total"><span class="l">Taxable Income</span><span class="v">${formatUSD(result.taxableIncome)}</span></div>
    </div>

    ${result.deductionUsed === "itemized" ? `
    <div class="section">
      <div class="section-title">Itemized Deductions Breakdown</div>
      ${itemized.salt > 0 ? `<div class="row"><span class="l">State & Local Taxes (SALT)</span><span class="v">${formatUSD(Math.min(itemized.salt, filingStatus === "mfs" ? 20000 : 40000))}</span></div>` : ""}
      ${itemized.mortgage > 0 ? `<div class="row"><span class="l">Mortgage Interest</span><span class="v">${formatUSD(itemized.mortgage)}</span></div>` : ""}
      ${itemized.charityCash > 0 ? `<div class="row"><span class="l">Charitable Giving (Cash)</span><span class="v">${formatUSD(itemized.charityCash)}</span></div>` : ""}
      ${itemized.charityNonCash > 0 ? `<div class="row"><span class="l">Charitable Giving (Non-Cash)</span><span class="v">${formatUSD(itemized.charityNonCash)}</span></div>` : ""}
      ${itemized.medical > 0 ? `<div class="row"><span class="l">Medical & Dental (over 7.5% AGI)</span><span class="v">${formatUSD(Math.max(0, itemized.medical - result.agi * 0.075))}</span></div>` : ""}
      ${itemized.other > 0 ? `<div class="row"><span class="l">Other Itemized</span><span class="v">${formatUSD(itemized.other)}</span></div>` : ""}
      <div class="row total"><span class="l">Total Itemized</span><span class="v">${formatUSD(result.itemizedDeduction)}</span></div>
    </div>` : ""}

    ${advanced.k401 > 0 || advanced.ira > 0 || advanced.hsa > 0 ? `
    <div class="section">
      <div class="section-title">Retirement & Savings</div>
      ${advanced.k401 > 0 ? `<div class="row"><span class="l">401(k) Contributions</span><span class="v">${formatUSD(advanced.k401)}</span></div>` : ""}
      ${advanced.ira > 0 ? `<div class="row"><span class="l">IRA Contributions</span><span class="v">${formatUSD(advanced.ira)}</span></div>` : ""}
      ${advanced.hsa > 0 ? `<div class="row"><span class="l">HSA Contributions</span><span class="v">${formatUSD(advanced.hsa)}</span></div>` : ""}
      ${advanced.otherDed > 0 ? `<div class="row"><span class="l">Other Adjustments</span><span class="v">${formatUSD(advanced.otherDed)}</span></div>` : ""}
    </div>` : ""}

    <div class="section">
      <div class="section-title">Federal Tax Calculation</div>
      <div class="row"><span class="l">Income Tax</span><span class="v">${formatUSD(result.totalIncomeTax)}</span></div>
      ${result.selfEmploymentTax > 0 ? `<div class="row"><span class="l">Self-Employment Tax</span><span class="v">${formatUSD(result.selfEmploymentTax)}</span></div>` : ""}
      ${result.totalCredits > 0 ? `<div class="row"><span class="l">Tax Credits</span><span class="v minus">−${formatUSD(result.totalCredits)}</span></div>` : ""}
      <div class="row total"><span class="l">Total Tax</span><span class="v">${formatUSD(result.totalTax)}</span></div>
      ${withheld > 0 ? `<div class="row"><span class="l">Payments & Withholdings</span><span class="v minus">−${formatUSD(result.totalPayments)}</span></div>` : ""}
      <div class="row total"><span class="l">${isRefund ? "Estimated Refund" : "Amount Owed"}</span><span class="v" style="color:${isRefund ? "#16a34a" : "#dc2626"};font-size:16px">${isRefund ? "+" : ""}${formatUSD(Math.abs(result.refundOrOwed))}</span></div>
    </div>

    <div class="section">
      <div class="section-title">Tax Rate Analysis</div>
      <div class="rates">
        <div class="rate-box"><div class="num" style="color:#DC5700">${formatPercent(result.effectiveRate)}</div><div class="lab">Effective Rate</div></div>
        <div class="rate-box"><div class="num" style="color:#4CD6FB">${formatPercent(result.marginalRate)}</div><div class="lab">Marginal Rate</div></div>
        <div class="rate-box"><div class="num" style="color:#333">${formatUSD(result.totalTax)}</div><div class="lab">Total Tax</div></div>
      </div>
      <div style="font-size:12px;font-weight:700;color:#666;margin-bottom:10px">Bracket Breakdown</div>
      ${bracketBars}
    </div>

    <div class="cta-box">
      <h3>Save ${formatUSD(Math.max(5000, insights?.estimatedAdditionalSavings ?? result.totalTax * 0.15))}+ More With a Smart Plan</h3>
      <p>${insights?.ctaMessage ?? "AG FinTax analyzes 46+ tax strategies personalized to your exact situation. Business owners typically save 15-40% on their taxes."}</p>
      <a href="https://agfintax.com/dashboard/smart-plan">Get My Personalized Smart Plan →</a>
      <div style="font-size:11px;color:#999;margin-top:10px">Free account · Takes 5 minutes · No credit card</div>
    </div>
  </div>

  <div class="disc">
    <p style="margin-bottom:8px"><strong>Disclaimers:</strong></p>
    <p style="margin-bottom:6px">* This tax estimator provides approximate federal income tax calculations based on 2025 tax brackets and standard IRS rules. Results are for educational and informational purposes only and should not be considered tax advice.</p>
    <p style="margin-bottom:6px">** Estimated refund or tax owed is based solely on the information provided. Actual results may vary based on additional income sources, credits, deductions, state/local taxes, AMT, NIIT, and other factors not captured by this calculator.</p>
    <p style="margin-bottom:6px">*** Potential savings estimates represent hypothetical scenarios based on AG FinTax's methodology. Individual results will vary. Savings are not guaranteed and depend on your specific financial circumstances and eligibility.</p>
    <p style="margin-bottom:6px">**** Savings percentages are based on historical client data and may not be representative of all outcomes. Past results do not guarantee future performance.</p>
    <p style="margin-top:12px;padding-top:8px;border-top:1px solid #eee"><strong>Terms & Conditions:</strong> By using this calculator, you acknowledge that (1) AG FinTax provides this tool "as is" without warranty; (2) no CPA-client or attorney-client relationship is established; (3) you should consult a qualified tax professional before making tax decisions; (4) AG FinTax is not responsible for errors or actions taken based on these results; (5) insights are generated programmatically and may contain inaccuracies. This calculator covers federal income tax only. Tax laws change frequently. For comprehensive planning, contact AG FinTax.</p>
  </div>
  <div class="footer">
    <strong>AG FinTax</strong> — Financial & Tax Services for the Dynamic Business Owner<br/>
    (425) 395-4318 · hello@agfintax.com · agfintax.com<br/>
    <span style="margin-top:4px;display:inline-block">Built & Powered by LoukriAI.com</span>
  </div>
</div>
<div class="no-print" style="text-align:center;padding:24px;background:#f4f4f5">
  <button onclick="window.print()" style="background:#DC5700;color:white;padding:12px 32px;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-size:14px;font-family:Inter,sans-serif;box-shadow:0 4px 12px #DC570030">Save as PDF</button>
</div>
</body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) win.onload = () => setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 600);
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function InlineTaxCalculator() {
  // Core
  const [filingStatus, setFilingStatus] = useState<FilingStatus>("single");
  const [age, setAge] = useState(35);
  const [incomeRaw, setIncomeRaw] = useState("");
  const [withheldRaw, setWithheldRaw] = useState("");

  // Deduction type
  const [deductionType, setDeductionType] = useState<"standard" | "itemized">("standard");

  // Itemized breakdown
  const [saltRaw, setSaltRaw] = useState("");
  const [mortgageRaw, setMortgageRaw] = useState("");
  const [charityCashRaw, setCharityCashRaw] = useState("");
  const [charityNonCashRaw, setCharityNonCashRaw] = useState("");
  const [medicalRaw, setMedicalRaw] = useState("");
  const [otherItemizedRaw, setOtherItemizedRaw] = useState("");

  // Advanced
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [k401Raw, setK401Raw] = useState("");
  const [iraRaw, setIraRaw] = useState("");
  const [hsaRaw, setHsaRaw] = useState("");
  const [otherDedRaw, setOtherDedRaw] = useState("");
  const [creditsRaw, setCreditsRaw] = useState("");
  const [businessIncomeRaw, setBusinessIncomeRaw] = useState("");

  // AI insights
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  const grossIncome = parse(incomeRaw);
  const stdDed = STD_DED[filingStatus] + seniorBonus(filingStatus, age);
  const hasIncome = grossIncome > 0;

  // Calculate result
  const result = useMemo<TaxResult>(() => {
    const input: TaxInput = {
      ...defaultTaxInput(),
      filingStatus,
      wages: Math.max(0, grossIncome - parse(businessIncomeRaw)),
      businessIncome: parse(businessIncomeRaw),
      hsaDeduction: parse(hsaRaw),
      iraDeduction: parse(iraRaw),
      retirementContributions: parse(k401Raw),
      otherAdjustments: parse(otherDedRaw),
      useItemized: deductionType === "itemized",
      stateLocalTaxes: parse(saltRaw),
      mortgageInterest: parse(mortgageRaw),
      charitableCash: parse(charityCashRaw),
      charitableNonCash: parse(charityNonCashRaw),
      medicalExpenses: parse(medicalRaw),
      otherItemized: parse(otherItemizedRaw),
      otherCredits: parse(creditsRaw),
      federalWithheld: parse(withheldRaw),
    };
    return calculateTax(input);
  }, [filingStatus, incomeRaw, withheldRaw, deductionType, saltRaw, mortgageRaw, charityCashRaw, charityNonCashRaw, medicalRaw, otherItemizedRaw, k401Raw, iraRaw, hsaRaw, otherDedRaw, creditsRaw, businessIncomeRaw]);

  const isRefund = result.refundOrOwed >= 0;

  // Generate AI insights
  const generateInsights = useCallback(async () => {
    if (!hasIncome) return;
    setIsLoadingInsights(true);
    setShowInsights(true);
    try {
      const res = await fetch("/api/tax-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            filingStatus: FS_LABELS[filingStatus],
            age,
            grossIncome,
            deductionType,
            deductionAmount: result.deductionAmount,
            has401k: parse(k401Raw) > 0, k401: parse(k401Raw),
            hasIRA: parse(iraRaw) > 0, ira: parse(iraRaw),
            hasHSA: parse(hsaRaw) > 0, hsa: parse(hsaRaw),
            hasMortgage: parse(mortgageRaw) > 0, mortgage: parse(mortgageRaw),
            hasCharity: parse(charityCashRaw) + parse(charityNonCashRaw) > 0,
            charity: parse(charityCashRaw) + parse(charityNonCashRaw),
            salt: parse(saltRaw),
            hasBusiness: parse(businessIncomeRaw) > 0, businessIncome: parse(businessIncomeRaw),
            withheld: parse(withheldRaw),
          },
          result: {
            taxableIncome: result.taxableIncome,
            totalTax: result.totalTax,
            effectiveRate: result.effectiveRate,
            marginalRate: result.marginalRate,
            refundOrOwed: result.refundOrOwed,
          },
        }),
      });
      const data = await res.json();
      setInsights(data);
    } catch {
      setInsights(null);
    } finally {
      setIsLoadingInsights(false);
    }
  }, [hasIncome, filingStatus, age, grossIncome, deductionType, result, k401Raw, iraRaw, hsaRaw, mortgageRaw, charityCashRaw, charityNonCashRaw, saltRaw, businessIncomeRaw, withheldRaw]);

  const handleReport = () => {
    generateWowReport(
      filingStatus, age, result,
      { salt: parse(saltRaw), mortgage: parse(mortgageRaw), charityCash: parse(charityCashRaw), charityNonCash: parse(charityNonCashRaw), medical: parse(medicalRaw), other: parse(otherItemizedRaw) },
      { k401: parse(k401Raw), ira: parse(iraRaw), hsa: parse(hsaRaw), otherDed: parse(otherDedRaw), businessIncome: parse(businessIncomeRaw) },
      grossIncome, parse(withheldRaw), insights,
    );
  };

  // Itemized total for display
  const itemizedTotal = parse(saltRaw) + parse(mortgageRaw) + parse(charityCashRaw) + parse(charityNonCashRaw) + parse(medicalRaw) + parse(otherItemizedRaw);

  return (
    <section id="calculator" className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute top-20 left-0 w-[400px] h-[400px] bg-[#DC5700]/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-[#4CD6FB]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} className="text-center mb-12">
          <span className="inline-flex items-center gap-2 text-[10px] font-extrabold tracking-[0.3em] text-[#FFB596] uppercase mb-4">
            <Calculator className="w-4 h-4" /> Free 2025 Tax Estimator
          </span>
          <h2 className="text-4xl font-extrabold tracking-tight text-[#E4E1E9] sm:text-5xl">
            See Your{" "}
            <span className="bg-gradient-to-r from-[#DC5700] to-[#FFB596] bg-clip-text text-transparent">2025 Taxes</span>{" "}
            Instantly
          </h2>
          <p className="mt-4 text-lg text-[#C7C5D3] max-w-2xl mx-auto">
            Enter your details, get your estimated refund or tax bill, and let AG FinTax uncover savings opportunities you might be missing.*
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.7, delay: 0.1 }} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* ---- LEFT: Form ---- */}
          <div className="lg:col-span-5 space-y-5">
            <div className="glass-card rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-bold text-[#FFB596] uppercase tracking-wider flex items-center gap-2"><Receipt className="w-3.5 h-3.5" /> Tax Details</h3>

              {/* Filing Status */}
              <div>
                <label className="block text-xs font-semibold text-[#C7C5D3] mb-1">Filing Status</label>
                <select value={filingStatus} onChange={(e) => setFilingStatus(e.target.value as FilingStatus)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0D0D10] border border-white/10 text-[#E4E1E9] text-sm focus:outline-none focus:border-[#DC5700]/50 appearance-none cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23C7C5D3' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}>
                  {FILING_STATUS_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <$Input label="Annual Gross Income" value={incomeRaw} onChange={setIncomeRaw} placeholder="100,000" />
                <div>
                  <label className="block text-xs font-semibold text-[#C7C5D3] mb-1">Age</label>
                  <input type="number" min={1} max={120} value={age} onChange={(e) => setAge(parseInt(e.target.value) || 35)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0D0D10] border border-white/10 text-[#E4E1E9] text-sm focus:outline-none focus:border-[#DC5700]/50" />
                  {age >= 65 && <p className="text-[9px] text-[#34D399] mt-0.5">+{formatUSD(seniorBonus(filingStatus, age))} senior bonus</p>}
                </div>
              </div>

              {/* Deduction Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#C7C5D3]">Deductions</label>
                  <span className="text-[10px] text-[#FFB596]">Standard: {formatUSD(stdDed)}</span>
                </div>
                <div className="flex gap-2 mb-2">
                  <button onClick={() => setDeductionType("standard")} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${deductionType === "standard" ? "bg-[#DC5700] text-white" : "bg-white/5 text-[#C7C5D3] hover:bg-white/10"}`}>Standard</button>
                  <button onClick={() => setDeductionType("itemized")} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${deductionType === "itemized" ? "bg-[#DC5700] text-white" : "bg-white/5 text-[#C7C5D3] hover:bg-white/10"}`}>Itemized</button>
                </div>

                {/* Itemized breakdown fields */}
                <AnimatePresence>
                  {deductionType === "itemized" && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 overflow-hidden">
                      <$Input label="State & Local Taxes (SALT)" hint={`Capped at ${formatUSD(filingStatus === "mfs" ? 20000 : 40000)}`} value={saltRaw} onChange={setSaltRaw} />
                      <$Input label="Mortgage Interest" hint="Home mortgage interest (Form 1098)" value={mortgageRaw} onChange={setMortgageRaw} />
                      <$Input label="Charitable Giving (Cash)" hint="Up to 60% of AGI" value={charityCashRaw} onChange={setCharityCashRaw} />
                      <$Input label="Charitable Giving (Non-Cash)" hint="Fair market value" value={charityNonCashRaw} onChange={setCharityNonCashRaw} />
                      <$Input label="Medical & Dental Expenses" hint="Only amount exceeding 7.5% of AGI" value={medicalRaw} onChange={setMedicalRaw} />
                      <$Input label="Other Itemized Deductions" value={otherItemizedRaw} onChange={setOtherItemizedRaw} />
                      {itemizedTotal > 0 && (
                        <div className="flex justify-between text-xs pt-1 border-t border-white/5">
                          <span className="text-[#C7C5D3]">Total itemized</span>
                          <span className={`font-bold ${itemizedTotal > stdDed ? "text-[#34D399]" : "text-[#F87171]"}`}>
                            {formatUSD(itemizedTotal)} {itemizedTotal > stdDed ? "(saves more!)" : `(standard is better)`}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <$Input label="Taxes Withheld" hint="Federal taxes withheld + estimated payments" value={withheldRaw} onChange={setWithheldRaw} />

              {/* Advanced */}
              <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-between text-[11px] font-semibold text-[#C7C5D3]/60 hover:text-[#C7C5D3] transition pt-2 border-t border-white/5">
                <span className="flex items-center gap-1.5">
                  {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  Show Advanced
                </span>
                <span className="text-[9px] text-[#C7C5D3]/30">401(k), IRA, HSA, business, credits</span>
              </button>
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 overflow-hidden">
                    <$Input label="401(k) Contributions" hint="Max $23,500 (under 50)" value={k401Raw} onChange={setK401Raw} />
                    <$Input label="IRA Contributions" hint="Max $7,000 ($8,000 if 50+)" value={iraRaw} onChange={setIraRaw} />
                    <$Input label="HSA Contributions" hint="Max $4,300 / $8,550 family" value={hsaRaw} onChange={setHsaRaw} />
                    <$Input label="Business Income (Sched C)" hint="Self-employment net profit" value={businessIncomeRaw} onChange={setBusinessIncomeRaw} />
                    <$Input label="Other Above-Line Deductions" hint="Student loan interest, etc." value={otherDedRaw} onChange={setOtherDedRaw} />
                    <$Input label="Tax Credits" hint="Child, education, energy credits" value={creditsRaw} onChange={setCreditsRaw} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ---- RIGHT: Results ---- */}
          <div className="lg:col-span-7 space-y-5">
            {/* Big Number */}
            <div className="glass-card rounded-3xl p-8 sm:p-10 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#DC5700] to-[#FFB596] opacity-60" />
              <p className="text-sm text-[#C7C5D3] mb-1">
                {hasIncome ? (isRefund ? "Your estimated tax refund**" : "Your estimated taxes owed**") : "Enter your income to get started"}
              </p>
              <motion.p
                key={result.refundOrOwed}
                initial={{ scale: 0.95, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-5xl sm:text-7xl font-black tracking-tight ${!hasIncome ? "text-[#C7C5D3]/15" : isRefund ? "text-[#34D399]" : "text-[#F87171]"}`}
              >
                {hasIncome && (isRefund ? "+" : "−")}{formatUSD(hasIncome ? Math.abs(result.refundOrOwed) : 0)}
              </motion.p>
              {hasIncome && (
                <p className="text-[11px] text-[#C7C5D3]/50 mt-2">
                  {formatPercent(result.effectiveRate)} effective rate on {formatUSD(result.grossIncome)} income · {formatPercent(result.marginalRate)} marginal bracket
                </p>
              )}
            </div>

            {hasIncome && (
              <>
                {/* CTA + Action Buttons — Top */}
                <div className="rounded-2xl bg-gradient-to-r from-[#DC5700]/12 to-[#FFB596]/5 border border-[#DC5700]/15 p-6 text-center">
                  <Sparkles className="w-7 h-7 text-[#FFB596] mx-auto mb-2" />
                  <h3 className="text-lg font-bold text-white mb-1">
                    Want to Save {formatUSD(Math.max(5000, insights?.estimatedAdditionalSavings ?? Math.round(result.totalTax * 0.15)))}+ More?***
                  </h3>
                  <p className="text-xs text-[#C7C5D3] mb-4 max-w-md mx-auto">
                    {insights?.ctaMessage ?? "Our AG Smart Plan analyzes 46+ strategies personalized to your situation. Business owners save 15-40% on taxes.****"}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link href="/sign-up"
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#DC5700] to-[#FFB596] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#DC5700]/20 hover:shadow-[#DC5700]/40 transition">
                      Create Free Account <ArrowRight className="w-4 h-4" />
                    </Link>
                    <button onClick={() => { generateInsights(); }}
                      disabled={isLoadingInsights}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1B1B20] border border-[#DC5700]/20 text-sm font-bold text-[#FFB596] hover:border-[#DC5700]/40 transition disabled:opacity-50">
                      {isLoadingInsights ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                      {showInsights && insights ? "Refresh AG Analysis" : "Generate AG Smart Analysis"}
                    </button>
                  </div>
                  <p className="text-[9px] text-[#C7C5D3]/30 mt-2">Free account · 5 minutes · No credit card</p>
                </div>

                {/* AG Insights Section */}
                <AnimatePresence>
                  {showInsights && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      className="glass-card rounded-2xl p-6 border border-[#DC5700]/10">
                      <h3 className="text-xs font-bold text-[#DC5700] uppercase tracking-wider flex items-center gap-2 mb-4">
                        <Brain className="w-4 h-4" /> AG Tax Analysis
                      </h3>
                      {isLoadingInsights ? (
                        <div className="flex flex-col items-center py-6 gap-2">
                          <Loader2 className="w-6 h-6 text-[#FFB596] animate-spin" />
                          <p className="text-xs text-[#C7C5D3]">AG FinTax is analyzing your tax profile...</p>
                        </div>
                      ) : insights ? (
                        <div className="space-y-4">
                          <p className="text-sm text-[#E4E1E9] font-medium">{insights.greeting}</p>
                          <p className="text-[13px] text-[#C7C5D3] leading-relaxed">{insights.summary}</p>

                          {insights.opportunities.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-[#FFB596] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Lightbulb className="w-3 h-3" /> Savings Opportunities
                              </p>
                              <div className="space-y-2">
                                {insights.opportunities.map((opp, i) => (
                                  <div key={i} className="flex gap-2.5">
                                    <div className="w-5 h-5 rounded-full bg-[#DC5700]/10 flex items-center justify-center shrink-0 mt-0.5">
                                      <span className="text-[10px] font-bold text-[#FFB596]">{i + 1}</span>
                                    </div>
                                    <p className="text-xs text-[#C7C5D3] leading-relaxed">{opp}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {insights.estimatedAdditionalSavings > 0 && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#34D399]/10 border border-[#34D399]/20">
                              <Sparkles className="w-4 h-4 text-[#34D399]" />
                              <span className="text-sm font-bold text-[#34D399]">
                                Potential additional savings: {formatUSD(insights.estimatedAdditionalSavings)}/year***
                              </span>
                            </div>
                          )}

                          {insights.riskFlag && (
                            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[#F87171]/10 border border-[#F87171]/20">
                              <AlertTriangle className="w-4 h-4 text-[#F87171] shrink-0 mt-0.5" />
                              <span className="text-xs text-[#F87171]">{insights.riskFlag}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-[#C7C5D3]/50">Unable to generate insights. Try again.</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Two-col breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="glass-card rounded-2xl p-5">
                    <h3 className="text-[10px] font-bold text-[#FFB596] uppercase tracking-wider mb-3">Taxable Income</h3>
                    <div className="space-y-2 text-[13px]">
                      <div className="flex justify-between"><span className="text-[#C7C5D3]">Gross income</span><span className="text-[#E4E1E9] font-semibold">{formatUSD(result.grossIncome)}</span></div>
                      <div className="flex justify-between"><span className="text-[#C7C5D3]">{result.deductionUsed === "standard" ? "Standard" : "Itemized"} deduction</span><span className="text-[#F87171] font-semibold">−{formatUSD(result.deductionAmount)}</span></div>
                      {result.totalAdjustments > 0 && <div className="flex justify-between"><span className="text-[#C7C5D3]">Adjustments</span><span className="text-[#F87171] font-semibold">−{formatUSD(result.totalAdjustments)}</span></div>}
                      <div className="flex justify-between border-t border-white/10 pt-2"><span className="text-[#E4E1E9] font-bold">Taxable income</span><span className="text-[#E4E1E9] font-bold">{formatUSD(result.taxableIncome)}</span></div>
                    </div>
                  </div>
                  <div className="glass-card rounded-2xl p-5">
                    <h3 className="text-[10px] font-bold text-[#FFB596] uppercase tracking-wider mb-3">Federal Taxes</h3>
                    <div className="space-y-2 text-[13px]">
                      <div className="flex justify-between"><span className="text-[#C7C5D3]">Income tax</span><span className="text-[#E4E1E9] font-semibold">{formatUSD(result.totalIncomeTax)}</span></div>
                      {result.selfEmploymentTax > 0 && <div className="flex justify-between"><span className="text-[#C7C5D3]">SE tax</span><span className="text-[#E4E1E9] font-semibold">{formatUSD(result.selfEmploymentTax)}</span></div>}
                      {result.totalCredits > 0 && <div className="flex justify-between"><span className="text-[#C7C5D3]">Credits</span><span className="text-[#F87171] font-semibold">−{formatUSD(result.totalCredits)}</span></div>}
                      {result.totalPayments > 0 && <div className="flex justify-between"><span className="text-[#C7C5D3]">Withheld</span><span className="text-[#F87171] font-semibold">−{formatUSD(result.totalPayments)}</span></div>}
                      <div className="flex justify-between border-t border-white/10 pt-2">
                        <span className="text-[#E4E1E9] font-bold">{isRefund ? "Refund" : "Owed"}</span>
                        <span className={`font-bold ${isRefund ? "text-[#34D399]" : "text-[#F87171]"}`}>{isRefund ? "+" : ""}{formatUSD(Math.abs(result.refundOrOwed))}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bracket visualization */}
                <div className="glass-card rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-bold text-[#FFB596] uppercase tracking-wider">Tax Brackets</h3>
                    <div className="flex gap-4">
                      <span className="text-[11px] text-[#C7C5D3]">Effective <span className="text-[#FFB596] font-bold">{formatPercent(result.effectiveRate)}</span></span>
                      <span className="text-[11px] text-[#C7C5D3]">Marginal <span className="text-[#4CD6FB] font-bold">{formatPercent(result.marginalRate)}</span></span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {result.bracketBreakdown.map((b, i) => {
                      const mx = Math.max(...result.bracketBreakdown.map((x) => x.amount));
                      const pct = mx > 0 ? (b.amount / mx) * 100 : 0;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-[#C7C5D3] w-7 text-right shrink-0">{(b.rate * 100).toFixed(0)}%</span>
                          <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(2, pct)}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                              className="h-full rounded-full bg-gradient-to-r from-[#DC5700] to-[#FFB596]" />
                          </div>
                          <span className="text-[10px] text-[#C7C5D3] w-20 text-right shrink-0">{formatUSD(b.tax)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Download Report */}
                <div className="flex justify-center">
                  <button onClick={handleReport}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl glass-card text-sm font-semibold text-[#E4E1E9] hover:bg-[#35343a]/60 transition">
                    <Download className="w-4 h-4" /> Download Report
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Disclaimers & Terms */}
        {hasIncome && (
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12 pt-8 border-t border-white/5 max-w-3xl mx-auto">
            <div className="space-y-2.5 text-[10px] leading-relaxed text-[#C7C5D3]/35">
              <p>* This tax estimator provides approximate federal income tax calculations based on 2025 tax brackets and standard IRS rules. Results are for educational and informational purposes only and should not be considered tax advice, legal advice, or a guarantee of your actual tax liability.</p>
              <p>** Estimated refund or tax owed is based solely on the information you provide. Actual results may vary based on additional income sources, credits, deductions, state and local taxes, Alternative Minimum Tax (AMT), Net Investment Income Tax (NIIT), and other factors not captured by this calculator.</p>
              <p>*** Potential savings estimates represent hypothetical scenarios based on general tax strategies. Individual results will vary. Savings are not guaranteed and depend on your specific financial circumstances, eligibility, and proper implementation of tax strategies.</p>
              <p>**** Savings percentages cited are based on historical client data and may not be representative of all outcomes. Past performance or savings achieved by other clients do not guarantee future results.</p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 text-[9px] text-[#C7C5D3]/25 space-y-2">
              <p className="font-semibold text-[#C7C5D3]/35 uppercase tracking-wider">Terms & Conditions</p>
              <p>By using this tax calculator, you acknowledge and agree that: (1) AG FinTax and LoukriAI provide this tool &quot;as is&quot; without warranty of any kind, express or implied; (2) this calculator does not establish a CPA-client or attorney-client relationship; (3) you should consult with a qualified tax professional before making any tax-related decisions; (4) AG FinTax is not responsible for any errors, omissions, or actions taken based on the results of this calculator; (5) your data entered into this calculator is processed in real-time and is not stored on our servers; (6) AI-generated insights are powered by third-party language models and may contain inaccuracies.</p>
              <p>This calculator covers federal income tax only. State, local, self-employment (beyond basic Sched C), capital gains, estate, gift, and excise taxes may apply to your situation. Tax laws change frequently — calculations reflect rules as of the 2025 tax year. For comprehensive tax planning, schedule a consultation with AG FinTax.</p>
              <p className="pt-1 text-[#C7C5D3]/20">© {new Date().getFullYear()} AG FinTax. All rights reserved. Built & Powered by LoukriAI.com. AG FinTax is a registered trade name. LoukriAI.com provides the technology platform and is not a tax advisory firm.</p>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
