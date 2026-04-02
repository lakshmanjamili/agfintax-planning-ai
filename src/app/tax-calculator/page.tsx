"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Calculator,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Download,
  ArrowRight,
  Sparkles,
  Info,
  TrendingUp,
  PiggyBank,
  Receipt,
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
// Currency input helper
// ---------------------------------------------------------------------------
function useCurrencyField(initial: number) {
  const [raw, setRaw] = useState(initial === 0 ? "" : String(initial));
  const value = parseFloat(raw.replace(/[^0-9.-]/g, "")) || 0;
  return { raw, value, setRaw };
}

function CurrencyInput({
  label,
  hint,
  raw,
  setRaw,
}: {
  label: string;
  hint?: string;
  raw: string;
  setRaw: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#C7C5D3] mb-1.5">{label}</label>
      <div className="relative">
        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C7C5D3]/50" />
        <input
          type="text"
          inputMode="numeric"
          value={raw}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9.]/g, "");
            setRaw(v);
          }}
          onBlur={() => {
            const n = parseFloat(raw) || 0;
            if (n > 0) setRaw(n.toLocaleString("en-US"));
            else setRaw("");
          }}
          onFocus={() => {
            const n = parseFloat(raw.replace(/,/g, "")) || 0;
            setRaw(n > 0 ? String(n) : "");
          }}
          placeholder="0"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#1F1F25] border border-white/10 text-[#E4E1E9] text-sm focus:outline-none focus:border-[#DC5700]/50 focus:ring-1 focus:ring-[#DC5700]/20 transition placeholder:text-[#C7C5D3]/30"
        />
      </div>
      {hint && <p className="text-[11px] text-[#C7C5D3]/50 mt-1">{hint}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filing status labels for display
// ---------------------------------------------------------------------------
const FS_LABELS: Record<FilingStatus, string> = {
  single: "Single",
  mfj: "Married Filing Jointly",
  mfs: "Married Filing Separately",
  hoh: "Head of Household",
  qss: "Qualifying Surviving Spouse",
};

// ---------------------------------------------------------------------------
// Standard deduction lookup for display
// ---------------------------------------------------------------------------
const STD_DEDUCTION: Record<FilingStatus, number> = {
  single: 15750,
  mfj: 31500,
  mfs: 15750,
  hoh: 23625,
  qss: 31500,
};

// Age-based additional standard deduction (65+)
function getAdditionalStdDeduction(fs: FilingStatus, age: number): number {
  if (age < 65) return 0;
  if (fs === "single" || fs === "hoh") return 2050;
  return 1650; // MFJ/MFS/QSS per person
}

// ---------------------------------------------------------------------------
// Report Generator
// ---------------------------------------------------------------------------
function generateReport(input: TaxInput, result: TaxResult, age: number) {
  const html = `<!DOCTYPE html>
<html><head><title>2025 Tax Estimate — AG FinTax</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #f8f9fa; color: #333; }
  .page { max-width: 700px; margin: 0 auto; padding: 40px; background: white; }
  .header { text-align: center; padding-bottom: 30px; border-bottom: 3px solid #DC5700; margin-bottom: 30px; }
  .header h1 { font-size: 24px; font-weight: 800; color: #1a1a1a; }
  .header p { font-size: 13px; color: #666; margin-top: 4px; }
  .brand { font-size: 15px; font-weight: 700; color: #DC5700; margin-bottom: 4px; }
  .big-number { text-align: center; margin: 30px 0; }
  .big-number .label { font-size: 14px; color: #666; margin-bottom: 8px; }
  .big-number .amount { font-size: 42px; font-weight: 800; }
  .refund { color: #16a34a; }
  .owed { color: #dc2626; }
  .section { margin-bottom: 28px; }
  .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #DC5700; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #eee; }
  .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
  .row .label { color: #555; }
  .row .value { font-weight: 600; color: #1a1a1a; }
  .row.subtotal { border-top: 1px solid #eee; padding-top: 10px; margin-top: 4px; }
  .row.subtotal .label, .row.subtotal .value { font-weight: 700; }
  .row .minus { color: #dc2626; }
  .bracket-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .bracket-bar .rate { width: 40px; font-size: 12px; font-weight: 600; color: #555; text-align: right; }
  .bracket-bar .bar { height: 18px; border-radius: 4px; background: #DC5700; min-width: 2px; }
  .bracket-bar .amount { font-size: 12px; color: #666; }
  .cta { text-align: center; margin-top: 40px; padding: 24px; background: linear-gradient(135deg, #DC570010, #DC570005); border: 1px solid #DC570030; border-radius: 12px; }
  .cta h3 { font-size: 16px; font-weight: 700; color: #1a1a1a; margin-bottom: 6px; }
  .cta p { font-size: 13px; color: #666; margin-bottom: 16px; }
  .cta a { display: inline-block; padding: 10px 28px; background: #DC5700; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }
  .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #999; }
  .disclaimer { font-size: 11px; color: #999; margin-top: 24px; line-height: 1.6; }
  @media print { body { background: white; } .page { padding: 20px; } .no-print { display: none !important; } }
</style>
</head><body>
<div class="page">
  <div class="header">
    <div class="brand">AG FinTax</div>
    <h1>Federal Income Tax Estimate — 2025</h1>
    <p>Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
  </div>

  <div class="big-number">
    <div class="label">${result.refundOrOwed >= 0 ? "Estimated Tax Refund" : "Estimated Taxes Owed"}</div>
    <div class="amount ${result.refundOrOwed >= 0 ? "refund" : "owed"}">${formatUSD(Math.abs(result.refundOrOwed))}</div>
  </div>

  <div class="section">
    <div class="section-title">Your Details</div>
    <div class="row"><span class="label">Filing Status</span><span class="value">${FS_LABELS[input.filingStatus]}</span></div>
    <div class="row"><span class="label">Age</span><span class="value">${age}</span></div>
    ${input.qualifyingChildren > 0 ? `<div class="row"><span class="label">Qualifying Children</span><span class="value">${input.qualifyingChildren}</span></div>` : ""}
  </div>

  <div class="section">
    <div class="section-title">Taxable Income</div>
    <div class="row"><span class="label">Gross Income</span><span class="value">${formatUSD(result.grossIncome)}</span></div>
    <div class="row"><span class="label">${result.deductionUsed === "standard" ? "Standard" : "Itemized"} Deduction</span><span class="value minus">−${formatUSD(result.deductionAmount)}</span></div>
    ${result.totalAdjustments > 0 ? `<div class="row"><span class="label">Adjustments</span><span class="value minus">−${formatUSD(result.totalAdjustments)}</span></div>` : ""}
    ${input.qbiDeduction > 0 ? `<div class="row"><span class="label">QBI Deduction</span><span class="value minus">−${formatUSD(input.qbiDeduction)}</span></div>` : ""}
    <div class="row subtotal"><span class="label">Taxable Income</span><span class="value">${formatUSD(result.taxableIncome)}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Estimated Federal Taxes</div>
    <div class="row"><span class="label">Income Tax</span><span class="value">${formatUSD(result.totalIncomeTax)}</span></div>
    ${result.selfEmploymentTax > 0 ? `<div class="row"><span class="label">Self-Employment Tax</span><span class="value">${formatUSD(result.selfEmploymentTax)}</span></div>` : ""}
    ${result.totalCredits > 0 ? `<div class="row"><span class="label">Tax Credits</span><span class="value minus">−${formatUSD(result.totalCredits)}</span></div>` : ""}
    <div class="row subtotal"><span class="label">Total Tax</span><span class="value">${formatUSD(result.totalTax)}</span></div>
    ${result.totalPayments > 0 ? `<div class="row"><span class="label">Taxes Withheld / Payments</span><span class="value minus">−${formatUSD(result.totalPayments)}</span></div>` : ""}
    <div class="row subtotal"><span class="label">${result.refundOrOwed >= 0 ? "Estimated Refund" : "Amount Owed"}</span><span class="value ${result.refundOrOwed >= 0 ? "refund" : "owed"}" style="color: ${result.refundOrOwed >= 0 ? "#16a34a" : "#dc2626"}">${formatUSD(Math.abs(result.refundOrOwed))}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Tax Bracket Breakdown</div>
    ${result.bracketBreakdown.map((b) => {
      const maxTax = Math.max(...result.bracketBreakdown.map((x) => x.tax));
      const barWidth = maxTax > 0 ? Math.max(2, (b.tax / maxTax) * 300) : 2;
      return `<div class="bracket-bar">
        <span class="rate">${(b.rate * 100).toFixed(0)}%</span>
        <div class="bar" style="width: ${barWidth}px"></div>
        <span class="amount">${formatUSD(b.amount)} → ${formatUSD(b.tax)}</span>
      </div>`;
    }).join("")}
    <div class="row" style="margin-top: 12px"><span class="label">Effective Tax Rate</span><span class="value">${formatPercent(result.effectiveRate)}</span></div>
    <div class="row"><span class="label">Marginal Tax Rate</span><span class="value">${formatPercent(result.marginalRate)}</span></div>
  </div>

  <div class="cta">
    <h3>Want a Personalized Tax Savings Plan?</h3>
    <p>Our AI-powered Smart Plan identifies strategies that could save you thousands. See exactly how much you could keep.</p>
    <a href="https://agfintax.com/dashboard/smart-plan">Get My Smart Plan →</a>
  </div>

  <div class="disclaimer">
    <strong>Disclaimer:</strong> This estimate is for informational purposes only and should not be considered tax advice.
    Actual tax liability may differ. This calculator does not account for state taxes, AMT, or all possible credits and deductions.
    Consult a qualified tax professional for personalized guidance.
  </div>

  <div class="footer">
    <p><strong>AG FinTax</strong> — Financial & Tax Services for the Dynamic Business Owner</p>
    <p style="margin-top: 4px;">(425) 395-4318 &bull; hello@agfintax.com &bull; agfintax.com</p>
    <p style="margin-top: 8px;">Built & Powered by LoukriAI.com</p>
  </div>
</div>

<div class="no-print" style="text-align: center; padding: 30px; background: #f8f9fa;">
  <button onclick="window.print()" style="background: #DC5700; color: white; padding: 12px 32px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; font-family: Inter, sans-serif;">
    Save as PDF / Print
  </button>
</div>
</body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.onload = () => setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 500);
  }
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------
export default function TaxCalculatorPage() {
  // Core fields
  const [filingStatus, setFilingStatus] = useState<FilingStatus>("single");
  const [age, setAge] = useState(35);
  const [qualifyingChildren, setQualifyingChildren] = useState(0);

  // Income
  const grossIncome = useCurrencyField(0);

  // Deductions
  const [deductionType, setDeductionType] = useState<"standard" | "itemized">("standard");
  const itemizedAmount = useCurrencyField(0);

  // Withholdings
  const taxesWithheld = useCurrencyField(0);

  // Advanced (collapsed by default)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const k401Contributions = useCurrencyField(0);
  const iraContributions = useCurrencyField(0);
  const hsaContributions = useCurrencyField(0);
  const studentLoanInterest = useCurrencyField(0);
  const otherDeductions = useCurrencyField(0);
  const taxCredits = useCurrencyField(0);
  const businessIncome = useCurrencyField(0);
  const longTermGains = useCurrencyField(0);

  // Compute result in real-time
  const result = useMemo<TaxResult>(() => {
    const additionalStd = getAdditionalStdDeduction(filingStatus, age);
    const stdDeduction = STD_DEDUCTION[filingStatus] + additionalStd;

    // Gross income minus above-the-line deductions = rough allocation
    const totalAboveLine = k401Contributions.value + iraContributions.value +
      hsaContributions.value + studentLoanInterest.value + otherDeductions.value;

    const input: TaxInput = {
      ...defaultTaxInput(),
      filingStatus,
      qualifyingChildren,
      wages: Math.max(0, grossIncome.value - businessIncome.value - longTermGains.value),
      businessIncome: businessIncome.value,
      longTermGains: longTermGains.value,
      // Adjustments
      hsaDeduction: hsaContributions.value,
      iraDeduction: iraContributions.value,
      studentLoanInterest: studentLoanInterest.value,
      retirementContributions: k401Contributions.value,
      otherAdjustments: otherDeductions.value,
      // Deductions
      useItemized: deductionType === "itemized",
      stateLocalTaxes: deductionType === "itemized" ? itemizedAmount.value * 0.4 : 0,
      mortgageInterest: deductionType === "itemized" ? itemizedAmount.value * 0.3 : 0,
      charitableCash: deductionType === "itemized" ? itemizedAmount.value * 0.2 : 0,
      otherItemized: deductionType === "itemized" ? itemizedAmount.value * 0.1 : 0,
      // Credits
      otherCredits: taxCredits.value,
      // Payments
      federalWithheld: taxesWithheld.value,
    };

    return calculateTax(input);
  }, [
    filingStatus, age, qualifyingChildren, grossIncome.value, deductionType,
    itemizedAmount.value, taxesWithheld.value, k401Contributions.value,
    iraContributions.value, hsaContributions.value, studentLoanInterest.value,
    otherDeductions.value, taxCredits.value, businessIncome.value, longTermGains.value,
  ]);

  const isRefund = result.refundOrOwed >= 0;
  const displayAmount = Math.abs(result.refundOrOwed);
  const stdDeduction = STD_DEDUCTION[filingStatus] + getAdditionalStdDeduction(filingStatus, age);

  return (
    <div className="min-h-screen bg-[#0D0D10]">
      {/* Top nav */}
      <nav className="border-b border-white/5 bg-[#131318]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-600 to-orange-400">
              <span className="text-xs font-extrabold text-white">AG</span>
            </div>
            <span className="text-lg font-bold text-white">AgFinTax</span>
          </Link>
          <Link
            href="/dashboard/smart-plan"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#DC5700] hover:bg-[#DC5700]/80 text-white text-sm font-semibold transition"
          >
            <Sparkles className="w-4 h-4" />
            Get Smart Plan
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#DC5700]/10 text-[#FFB596] text-xs font-semibold mb-4">
            <Calculator className="w-3.5 h-3.5" />
            Free 2025 Tax Estimator
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Federal Income Tax Calculator
          </h1>
          <p className="text-[#C7C5D3] max-w-2xl mx-auto text-sm sm:text-base">
            Estimate your 2025 tax refund or bill. Enter your income, filing status and deductions to get started — results update instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* ---- LEFT: Form ---- */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tax Details Card */}
            <div className="rounded-2xl bg-[#1B1B20] border border-white/5 p-6">
              <h2 className="text-sm font-bold text-[#E4E1E9] uppercase tracking-wider mb-5 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#FFB596]" />
                Tax Details
              </h2>

              {/* Filing Status */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-[#C7C5D3] mb-1.5">Filing Status</label>
                <select
                  value={filingStatus}
                  onChange={(e) => setFilingStatus(e.target.value as FilingStatus)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#1F1F25] border border-white/10 text-[#E4E1E9] text-sm focus:outline-none focus:border-[#DC5700]/50 appearance-none cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23C7C5D3' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
                >
                  {FILING_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Gross Income */}
              <div className="mb-5">
                <CurrencyInput label="Annual Gross Income" hint="Total income before taxes — W-2, 1099, investments, etc." raw={grossIncome.raw} setRaw={grossIncome.setRaw} />
              </div>

              {/* Age */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-[#C7C5D3] mb-1.5">Age</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value) || 35)}
                  className="w-24 px-4 py-2.5 rounded-xl bg-[#1F1F25] border border-white/10 text-[#E4E1E9] text-sm focus:outline-none focus:border-[#DC5700]/50"
                />
                {age >= 65 && (
                  <p className="text-[11px] text-[#34D399] mt-1">
                    Senior bonus: +{formatUSD(getAdditionalStdDeduction(filingStatus, age))} standard deduction
                  </p>
                )}
              </div>

              {/* Dependents */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-[#C7C5D3] mb-1.5">Qualifying Children (under 17)</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={qualifyingChildren}
                  onChange={(e) => setQualifyingChildren(parseInt(e.target.value) || 0)}
                  className="w-24 px-4 py-2.5 rounded-xl bg-[#1F1F25] border border-white/10 text-[#E4E1E9] text-sm focus:outline-none focus:border-[#DC5700]/50"
                />
                {qualifyingChildren > 0 && (
                  <p className="text-[11px] text-[#4CD6FB] mt-1">
                    Child tax credit: up to {formatUSD(qualifyingChildren * 2200)}
                  </p>
                )}
              </div>

              {/* Standard/Itemized Deduction */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-[#C7C5D3] mb-2">Deductions</label>
                <p className="text-[11px] text-[#C7C5D3]/60 mb-2">
                  Your standard deduction: <span className="text-[#FFB596] font-semibold">{formatUSD(stdDeduction)}</span>
                </p>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setDeductionType("standard")}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
                      deductionType === "standard"
                        ? "bg-[#DC5700] text-white"
                        : "bg-white/5 text-[#C7C5D3] hover:bg-white/10"
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    onClick={() => setDeductionType("itemized")}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
                      deductionType === "itemized"
                        ? "bg-[#DC5700] text-white"
                        : "bg-white/5 text-[#C7C5D3] hover:bg-white/10"
                    }`}
                  >
                    Itemized
                  </button>
                </div>
                {deductionType === "itemized" && (
                  <CurrencyInput label="Total Itemized Deductions" hint="Sum of SALT, mortgage interest, charity, medical, etc." raw={itemizedAmount.raw} setRaw={itemizedAmount.setRaw} />
                )}
              </div>

              {/* Taxes Withheld */}
              <div className="mb-2">
                <CurrencyInput label="Taxes Withheld" hint="Federal taxes withheld from paychecks + estimated payments" raw={taxesWithheld.raw} setRaw={taxesWithheld.setRaw} />
              </div>
            </div>

            {/* Advanced Section */}
            <div className="rounded-2xl bg-[#1B1B20] border border-white/5 overflow-hidden">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full px-6 py-4 flex items-center justify-between text-sm font-semibold text-[#C7C5D3] hover:text-white transition"
              >
                <span className="flex items-center gap-2">
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  Advanced Options
                </span>
                <span className="text-[10px] text-[#C7C5D3]/50">401(k), IRA, HSA, credits & more</span>
              </button>
              {showAdvanced && (
                <div className="px-6 pb-6 space-y-4 border-t border-white/5 pt-4">
                  <CurrencyInput label="401(k) Contributions" hint="Pre-tax traditional 401(k) — max $23,500 (under 50)" raw={k401Contributions.raw} setRaw={k401Contributions.setRaw} />
                  <CurrencyInput label="IRA Contributions" hint="Traditional IRA — max $7,000 ($8,000 if 50+)" raw={iraContributions.raw} setRaw={iraContributions.setRaw} />
                  <CurrencyInput label="HSA Contributions" hint="Max $4,300 single / $8,550 family" raw={hsaContributions.raw} setRaw={hsaContributions.setRaw} />
                  <CurrencyInput label="Student Loan Interest" hint="Max $2,500 deduction" raw={studentLoanInterest.raw} setRaw={studentLoanInterest.setRaw} />
                  <CurrencyInput label="Business Income (Schedule C)" hint="Self-employment net profit" raw={businessIncome.raw} setRaw={businessIncome.setRaw} />
                  <CurrencyInput label="Long-term Capital Gains" hint="Gains from assets held 1+ year" raw={longTermGains.raw} setRaw={longTermGains.setRaw} />
                  <CurrencyInput label="Other Deductions" hint="Any other above-the-line deductions" raw={otherDeductions.raw} setRaw={otherDeductions.setRaw} />
                  <CurrencyInput label="Tax Credits" hint="Child care, education, energy credits, etc." raw={taxCredits.raw} setRaw={taxCredits.setRaw} />
                </div>
              )}
            </div>
          </div>

          {/* ---- RIGHT: Results ---- */}
          <div className="lg:col-span-3 space-y-6">
            {/* Big Result Card */}
            <div className="rounded-2xl bg-[#1B1B20] border border-white/5 p-6 sm:p-8">
              <p className="text-sm text-[#C7C5D3] text-center mb-2">
                {grossIncome.value > 0 ? "For the 2025 tax year" : "Enter your income to get started"}
              </p>
              <p className="text-center text-sm text-[#C7C5D3] mb-1">
                {grossIncome.value > 0
                  ? isRefund
                    ? "Your estimated tax refund is"
                    : "Your estimated taxes owed are"
                  : "Estimated taxes owed"
                }
              </p>
              <p className={`text-center text-5xl sm:text-6xl font-extrabold mb-1 ${
                grossIncome.value === 0 ? "text-[#C7C5D3]/30" : isRefund ? "text-[#34D399]" : "text-[#F87171]"
              }`}>
                {grossIncome.value > 0 && isRefund && "+"}
                {grossIncome.value > 0 && !isRefund && "-"}
                {formatUSD(grossIncome.value > 0 ? displayAmount : 0)}
              </p>
              {grossIncome.value > 0 && (
                <p className="text-center text-xs text-[#C7C5D3]/60 mt-1">
                  {isRefund ? "Estimated refund based on your withholdings" : "Amount you may owe when filing"}
                </p>
              )}
            </div>

            {/* Breakdown Cards */}
            {grossIncome.value > 0 && (
              <>
                {/* Taxable Income Breakdown */}
                <div className="rounded-2xl bg-[#1B1B20] border border-white/5 p-6">
                  <h3 className="text-sm font-bold text-[#E4E1E9] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <PiggyBank className="w-4 h-4 text-[#FFB596]" />
                    Taxable Income
                  </h3>
                  <div className="space-y-3">
                    <ResultRow label="Gross Income" value={formatUSD(result.grossIncome)} />
                    <ResultRow label={`${result.deductionUsed === "standard" ? "Standard" : "Itemized"} Deduction`} value={`−${formatUSD(result.deductionAmount)}`} negative />
                    {result.totalAdjustments > 0 && (
                      <ResultRow label="Retirement & Adjustments" value={`−${formatUSD(result.totalAdjustments)}`} negative />
                    )}
                    <div className="border-t border-white/10 pt-3">
                      <ResultRow label="Taxable Income" value={formatUSD(result.taxableIncome)} bold />
                    </div>
                  </div>
                </div>

                {/* Federal Taxes Breakdown */}
                <div className="rounded-2xl bg-[#1B1B20] border border-white/5 p-6">
                  <h3 className="text-sm font-bold text-[#E4E1E9] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#FFB596]" />
                    Estimated Federal Taxes
                  </h3>
                  <div className="space-y-3">
                    <ResultRow label="Income Tax" value={formatUSD(result.totalIncomeTax)} />
                    {result.selfEmploymentTax > 0 && (
                      <ResultRow label="Self-Employment Tax" value={formatUSD(result.selfEmploymentTax)} />
                    )}
                    {result.totalCredits > 0 && (
                      <ResultRow label="Tax Credits" value={`−${formatUSD(result.totalCredits)}`} negative />
                    )}
                    <div className="border-t border-white/10 pt-3">
                      <ResultRow label="Total Tax" value={formatUSD(result.totalTax)} bold />
                    </div>
                    {result.totalPayments > 0 && (
                      <ResultRow label="Taxes Withheld / Payments" value={`−${formatUSD(result.totalPayments)}`} negative />
                    )}
                    <div className="border-t border-white/10 pt-3">
                      <ResultRow
                        label={isRefund ? "Estimated Refund" : "Amount Owed"}
                        value={(isRefund ? "+" : "") + formatUSD(displayAmount)}
                        bold
                        color={isRefund ? "#34D399" : "#F87171"}
                      />
                    </div>
                  </div>
                </div>

                {/* Tax Rate */}
                <div className="rounded-2xl bg-[#1B1B20] border border-white/5 p-6">
                  <h3 className="text-sm font-bold text-[#E4E1E9] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#FFB596]" />
                    Tax Rate
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div className="text-center p-4 rounded-xl bg-white/5">
                      <p className="text-2xl font-bold text-[#FFB596]">{formatPercent(result.effectiveRate)}</p>
                      <p className="text-xs text-[#C7C5D3] mt-1">Effective Tax Rate</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-white/5">
                      <p className="text-2xl font-bold text-[#4CD6FB]">{formatPercent(result.marginalRate)}</p>
                      <p className="text-xs text-[#C7C5D3] mt-1">Marginal Tax Rate</p>
                    </div>
                  </div>

                  {/* Bracket Visualization */}
                  <div className="space-y-2">
                    {result.bracketBreakdown.map((b, i) => {
                      const maxAmount = Math.max(...result.bracketBreakdown.map((x) => x.amount));
                      const pct = maxAmount > 0 ? (b.amount / maxAmount) * 100 : 0;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs font-mono text-[#C7C5D3] w-8 text-right shrink-0">
                            {(b.rate * 100).toFixed(0)}%
                          </span>
                          <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#DC5700] to-[#FFB596] transition-all duration-500"
                              style={{ width: `${Math.max(2, pct)}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-[#C7C5D3] w-24 text-right shrink-0">
                            {formatUSD(b.tax)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Download Report */}
                <button
                  onClick={() => generateReport(
                    {
                      ...defaultTaxInput(),
                      filingStatus,
                      qualifyingChildren,
                      wages: Math.max(0, grossIncome.value - businessIncome.value - longTermGains.value),
                      businessIncome: businessIncome.value,
                      longTermGains: longTermGains.value,
                      hsaDeduction: hsaContributions.value,
                      iraDeduction: iraContributions.value,
                      studentLoanInterest: studentLoanInterest.value,
                      retirementContributions: k401Contributions.value,
                      otherAdjustments: otherDeductions.value,
                      useItemized: deductionType === "itemized",
                      stateLocalTaxes: deductionType === "itemized" ? itemizedAmount.value * 0.4 : 0,
                      mortgageInterest: deductionType === "itemized" ? itemizedAmount.value * 0.3 : 0,
                      charitableCash: deductionType === "itemized" ? itemizedAmount.value * 0.2 : 0,
                      otherItemized: deductionType === "itemized" ? itemizedAmount.value * 0.1 : 0,
                      otherCredits: taxCredits.value,
                      federalWithheld: taxesWithheld.value,
                    },
                    result,
                    age,
                  )}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[rgba(31,31,37,0.6)] border border-white/10 text-sm font-semibold text-[#E4E1E9] hover:border-[#DC5700]/30 transition"
                >
                  <Download className="w-4 h-4" />
                  Download Tax Estimate Report
                </button>

                {/* CTA to Smart Plan */}
                <div className="rounded-2xl bg-gradient-to-r from-[#DC5700]/15 to-[#DC5700]/5 border border-[#DC5700]/20 p-6 text-center">
                  <Sparkles className="w-8 h-8 text-[#FFB596] mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white mb-2">
                    Want to save {formatUSD(Math.max(5000, result.totalTax * 0.15))}+ more?
                  </h3>
                  <p className="text-sm text-[#C7C5D3] mb-4 max-w-md mx-auto">
                    Our AI-powered Smart Plan identifies personalized tax strategies based on your unique situation. Business owners typically save 15-40% on their taxes.
                  </p>
                  <Link
                    href="/dashboard/smart-plan"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#DC5700] hover:bg-[#DC5700]/80 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-[#DC5700]/20"
                  >
                    Get My Personalized Smart Plan <ArrowRight className="w-4 h-4" />
                  </Link>
                  <p className="text-[10px] text-[#C7C5D3]/40 mt-3">
                    Free account &middot; Takes 5 minutes &middot; No credit card required
                  </p>
                </div>
              </>
            )}

            {/* Empty state */}
            {grossIncome.value === 0 && (
              <div className="rounded-2xl bg-[#1B1B20] border border-white/5 p-8 text-center">
                <Info className="w-8 h-8 text-[#C7C5D3]/30 mx-auto mb-3" />
                <p className="text-sm text-[#C7C5D3]">
                  Enter your annual gross income to see your estimated tax breakdown, effective rate, and bracket visualization.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* How it Works */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-6 text-center">How This Tax Calculator Works</h2>
          <div className="space-y-4 text-sm text-[#C7C5D3] leading-relaxed">
            <p>
              This estimator takes your gross income and subtracts applicable deductions and adjustments — such as 401(k) contributions, HSA contributions, and your standard or itemized deductions. This determines your <strong className="text-white">taxable income</strong>, the amount subject to federal tax.
            </p>
            <p>
              The U.S. uses a <strong className="text-white">progressive tax system</strong> — your income is divided into portions (brackets), and each portion is taxed at a different rate. Tax rates range from 10% to 37% depending on your taxable income and filing status.
            </p>
            <p>
              The calculator also accounts for tax credits (which directly reduce your tax bill) and any taxes already withheld from your paychecks. If withholdings exceed your tax liability, you get a refund. If they fall short, you&apos;ll owe the difference.
            </p>
          </div>

          {/* 2025 Tax Brackets Table */}
          <div className="mt-8 overflow-x-auto">
            <h3 className="text-sm font-bold text-[#E4E1E9] mb-3">2025 Federal Income Tax Brackets</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 text-[#FFB596] font-semibold">Rate</th>
                  <th className="text-left py-2 text-[#C7C5D3]">Single</th>
                  <th className="text-left py-2 text-[#C7C5D3]">MFJ</th>
                  <th className="text-left py-2 text-[#C7C5D3]">HOH</th>
                </tr>
              </thead>
              <tbody className="text-[#C7C5D3]">
                {[
                  ["10%", "$0–$11,925", "$0–$23,850", "$0–$17,000"],
                  ["12%", "$11,926–$48,475", "$23,851–$96,950", "$17,001–$64,850"],
                  ["22%", "$48,476–$103,350", "$96,951–$206,700", "$64,851–$103,350"],
                  ["24%", "$103,351–$197,300", "$206,701–$394,600", "$103,351–$197,300"],
                  ["32%", "$197,301–$250,525", "$394,601–$501,050", "$197,301–$250,500"],
                  ["35%", "$250,526–$626,350", "$501,051–$751,600", "$250,501–$626,350"],
                  ["37%", "$626,351+", "$751,601+", "$626,351+"],
                ].map(([rate, single, mfj, hoh]) => (
                  <tr key={rate} className="border-b border-white/5">
                    <td className="py-2 font-semibold text-[#FFB596]">{rate}</td>
                    <td className="py-2">{single}</td>
                    <td className="py-2">{mfj}</td>
                    <td className="py-2">{hoh}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-[#C7C5D3]/40 mt-2">Source: IRS Rev. Proc. 2024-40</p>
          </div>

          {/* Disclaimer */}
          <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/5">
            <p className="text-[11px] text-[#C7C5D3]/60 leading-relaxed">
              <strong className="text-[#C7C5D3]">Disclaimer:</strong> This calculator provides estimates for informational purposes only and should not be considered tax advice. It does not account for state/local taxes, AMT, NIIT, or all possible deductions and credits. Actual results may vary. Consult a qualified tax professional for personalized advice.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center pb-8">
          <p className="text-xs text-[#C7C5D3]/40">
            AG FinTax — Financial & Tax Services for the Dynamic Business Owner
          </p>
          <p className="text-[10px] text-[#C7C5D3]/30 mt-1">
            Built & Powered by <a href="https://loukriai.com" className="hover:text-[#FFB596] transition">LoukriAI.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function ResultRow({
  label,
  value,
  bold,
  negative,
  color,
}: {
  label: string;
  value: string;
  bold?: boolean;
  negative?: boolean;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${bold ? "font-bold text-[#E4E1E9]" : "text-[#C7C5D3]"}`}>
        {label}
      </span>
      <span
        className={`text-sm ${bold ? "font-bold" : "font-medium"}`}
        style={{ color: color ?? (negative ? "#F87171" : "#E4E1E9") }}
      >
        {value}
      </span>
    </div>
  );
}
