// =============================================================================
// Scenario Comparison Engine — "What If?" Tax Analysis
// Auto-generates from ClientProfile + SavedPlan — zero user input needed
// Deep OCR/document intelligence extraction for real-number scenarios
// =============================================================================

import {
  calculateTax,
  defaultTaxInput,
  formatUSD,
  formatPercent,
  type TaxInput,
  type FilingStatus,
} from "./tax-calculator";
import type { ClientProfile, SavedPlan } from "./plan-store";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type ScenarioTypeId =
  | "llc_vs_scorp"
  | "roth_conversion"
  | "retirement_plan"
  | "standard_vs_itemized"
  | "1031_exchange"
  | "cost_segregation"
  | "child_tax_credit"
  | "charitable_bunching"
  | "hsa_optimization";

export interface ScenarioArm {
  label: string;
  shortLabel: string;
  totalTax: number;
  details: { label: string; value: number; isSavings?: boolean }[];
  highlights: string[];
  warnings: string[];
}

export interface YearProjection {
  year: number;
  armA: number;
  armB: number;
  armC?: number;
  armD?: number;
  delta: number;
}

export interface ScenarioResult {
  id: ScenarioTypeId;
  title: string;
  subtitle: string;
  personalNote: string; // personalized "why this matters to YOU" line
  icon: string;
  color: string;
  armA: ScenarioArm;
  armB: ScenarioArm;
  armC?: ScenarioArm;
  armD?: ScenarioArm;
  annualSavings: number;
  fiveYearSavings: number;
  recommendation: string;
  reason: string;
  projections: YearProjection[];
  bars: { label: string; armA: number; armB: number; armC?: number; armD?: number }[];
  disclaimers: string[];
  applicable: boolean;
  confidenceLevel: "high" | "medium" | "low"; // based on data quality
  dataSource: string; // what data this was built from
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const SS_BASE = 176100;
const SS_RATE = 0.124;
const MED_RATE = 0.029;

function seTax(net: number): number {
  const base = net * 0.9235;
  return Math.min(base, SS_BASE) * SS_RATE + base * MED_RATE;
}

function ficaOnWages(wages: number): number {
  return Math.min(wages, SS_BASE) * SS_RATE + wages * MED_RATE;
}

function parseIncome(s: string | undefined | null): number {
  if (!s) return 0;
  const cleaned = String(s).replace(/[^0-9.-]/g, "");
  return parseFloat(cleaned) || 0;
}

function mapFS(fs: string): FilingStatus {
  const f = (fs || "").toLowerCase();
  if (f.includes("joint") || f === "mfj" || f === "married_jointly") return "mfj";
  if (f.includes("separate") || f === "mfs" || f === "married_separately") return "mfs";
  if (f.includes("head") || f === "hoh" || f === "head_of_household") return "hoh";
  if (f.includes("widow") || f.includes("surviv") || f === "qss") return "qss";
  return "single";
}

// ---------------------------------------------------------------------------
// Deep Data Extractor — mines OCR, keyFindings, and comprehensiveSummary
// ---------------------------------------------------------------------------
interface ExtractedTaxData {
  // Core
  totalIncome: number;
  w2Wages: number;
  businessIncome: number;
  rentalIncome: number;
  capitalGains: number;
  interestIncome: number;
  dividendIncome: number;
  retirementDistributions: number;
  // Tax details
  taxableIncome: number;
  totalDeductions: number;
  federalWithheld: number;
  stateTax: number;
  effectiveRate: number;
  // Retirement
  retirementContributions: number;
  has401k: boolean;
  hasIRA: boolean;
  hasRothIRA: boolean;
  hasSEP: boolean;
  hasSolo401k: boolean;
  noRetirementContributions: boolean;
  // Real estate
  rentalLoss: number;
  propertyCount: number;
  mortgageInterest: number;
  propertyTaxes: number;
  // Credits & deductions
  childTaxCreditClaimed: number;
  childCareCreditClaimed: number;
  charitableDeductions: number;
  saltDeductions: number;
  isItemizing: boolean;
  // Schedules
  schedulesClFiled: string[];
  creditsUsed: string[];
  // Meta
  occupation: string;
  state: string;
  filingStatus: FilingStatus;
  dependents: number;
  dataQuality: "high" | "medium" | "low";
}

function extractDeepData(profile: ClientProfile | null, plan: SavedPlan | null): ExtractedTaxData {
  const ocr = profile?.ocrExtractedFields || {};
  const docs = profile?.uploadedDocuments || [];
  const summary = profile?.comprehensiveSummary || "";
  const findings: string[] = [];
  docs.forEach((d) => findings.push(...(d.keyFindings || [])));

  // Parse all OCR fields
  const ocrIncome = parseIncome(ocr["Taxable Income"]);
  const ocrDeductions = parseIncome(ocr["Total Deductions"]);
  const ocrWithheld = parseIncome(ocr["Federal Tax Withheld"]);
  const ocrStateTax = parseIncome(ocr["State Income Tax"]);
  const ocrEffRate = parseFloat(String(ocr["Effective Tax Rate"] || "0").replace(/[^0-9.]/g, "")) / 100 || 0;
  const ocrSchedules = (ocr["Schedules Filed"] || "").split(",").map((s) => s.trim()).filter(Boolean);
  const ocrCredits = (ocr["Credits Used"] || "").split(",").map((s) => s.trim()).filter(Boolean);

  // Extract dollar amounts from keyFindings
  function findDollarInFindings(pattern: RegExp): number {
    for (const f of findings) {
      const match = f.match(pattern);
      if (match) return parseIncome(match[1] || match[0]);
    }
    return 0;
  }

  function findingContains(keyword: string): boolean {
    return findings.some((f) => f.toLowerCase().includes(keyword.toLowerCase())) ||
      summary.toLowerCase().includes(keyword.toLowerCase());
  }

  // Core income
  const profileIncome = parseIncome(profile?.annualIncome ?? plan?.profile?.income ?? "0");
  const totalIncome = ocrIncome > 0 ? ocrIncome : profileIncome;

  // W-2 wages: try to separate from business income
  const businessIncome = parseIncome(profile?.businessIncome ?? "0");
  const w2Wages = businessIncome > 0 ? Math.max(0, totalIncome - businessIncome) : totalIncome;

  // Rental income/loss from findings
  const rentalLoss = findDollarInFindings(/rental (?:loss|income).*?\$?([\d,]+)/i) ||
    findDollarInFindings(/\$([\d,]+).*?rental (?:loss|income)/i);
  const hasScheduleE = ocrSchedules.some((s) => s.includes("E")) || findingContains("Schedule E");
  const rentalIncome = hasScheduleE ? (rentalLoss > 0 ? -rentalLoss : 0) : 0;

  // Capital gains
  const hasScheduleD = ocrSchedules.some((s) => s.includes("D")) || findingContains("Schedule D");
  const capitalGains = findDollarInFindings(/capital (?:gain|loss).*?\$?([\d,]+)/i) || (hasScheduleD ? totalIncome * 0.05 : 0);

  // Interest & dividends
  const hasScheduleB = ocrSchedules.some((s) => s.includes("B")) || findingContains("Schedule B");
  const interestIncome = findDollarInFindings(/interest.*?\$?([\d,]+)/i) || (hasScheduleB ? totalIncome * 0.02 : 0);
  const dividendIncome = findDollarInFindings(/dividend.*?\$?([\d,]+)/i) || 0;

  // Retirement detection
  const noRetirement = findingContains("no visible retirement") ||
    findingContains("no retirement") ||
    findingContains("zero retirement") ||
    findingContains("no 401") ||
    findingContains("no IRA");
  const retTypes = profile?.retirementAccountTypes || [];
  const has401k = retTypes.some((r) => r.toLowerCase().includes("401k") || r.toLowerCase().includes("401(k)"));
  const hasIRA = retTypes.some((r) => r.toLowerCase() === "ira" || r.toLowerCase() === "traditional ira");
  const hasRothIRA = retTypes.some((r) => r.toLowerCase().includes("roth"));
  const hasSEP = retTypes.some((r) => r.toLowerCase().includes("sep"));
  const hasSolo401k = retTypes.some((r) => r.toLowerCase().includes("solo"));

  // Retirement contributions from findings
  const retContrib = findDollarInFindings(/retirement.*?contribution.*?\$?([\d,]+)/i) ||
    findDollarInFindings(/401.*?contribution.*?\$?([\d,]+)/i);

  // Deduction details
  const charitableDeductions = findDollarInFindings(/charit.*?\$?([\d,]+)/i);
  const mortgageInterest = findDollarInFindings(/mortgage.*?interest.*?\$?([\d,]+)/i);
  const propertyTaxes = findDollarInFindings(/property.*?tax.*?\$?([\d,]+)/i);
  const saltDeductions = ocrStateTax > 0 ? Math.min(ocrStateTax + propertyTaxes, 40000) : 0;
  const isItemizing = ocrSchedules.some((s) => s.includes("A")) || findingContains("itemiz");

  // Credits
  const ctcClaimed = ocrCredits.some((c) => c.toLowerCase().includes("child tax")) ?
    findDollarInFindings(/child tax credit.*?\$?([\d,]+)/i) : 0;
  const careCreditClaimed = ocrCredits.some((c) => c.toLowerCase().includes("care")) ?
    findDollarInFindings(/care credit.*?\$?([\d,]+)/i) : 0;

  // Property count
  const propertyCount = (summary.match(/propert/gi) || []).length > 1 ? 2 : (profile?.hasRealEstate ? 1 : 0);

  // Data quality
  const hasOCR = ocrIncome > 0 || ocrWithheld > 0;
  const hasDocs = docs.length > 0;
  const dataQuality: "high" | "medium" | "low" = hasOCR && hasDocs ? "high" : hasOCR || hasDocs ? "medium" : "low";

  const fs = mapFS(profile?.filingStatus ?? plan?.profile?.filingStatus ?? "single");
  const dependents = profile?.dependents ?? (parseInt(plan?.profile?.dependents ?? "0") || 0);

  return {
    totalIncome,
    w2Wages,
    businessIncome,
    rentalIncome,
    capitalGains,
    interestIncome,
    dividendIncome,
    retirementDistributions: findDollarInFindings(/distribution.*?\$?([\d,]+)/i),
    taxableIncome: ocrIncome || totalIncome * 0.85,
    totalDeductions: ocrDeductions,
    federalWithheld: ocrWithheld,
    stateTax: ocrStateTax,
    effectiveRate: ocrEffRate,
    retirementContributions: retContrib,
    has401k,
    hasIRA,
    hasRothIRA,
    hasSEP,
    hasSolo401k,
    noRetirementContributions: noRetirement,
    rentalLoss,
    propertyCount,
    mortgageInterest,
    propertyTaxes,
    childTaxCreditClaimed: ctcClaimed,
    childCareCreditClaimed: careCreditClaimed,
    charitableDeductions,
    saltDeductions,
    isItemizing,
    schedulesClFiled: ocrSchedules,
    creditsUsed: ocrCredits,
    occupation: profile?.occupation ?? plan?.profile?.occupation ?? "",
    state: profile?.state ?? plan?.profile?.state ?? "",
    filingStatus: fs,
    dependents,
    dataQuality,
  };
}

// ---------------------------------------------------------------------------
// Master: generate ALL applicable scenarios from profile + plan
// ---------------------------------------------------------------------------
export function generateAllScenarios(
  profile: ClientProfile | null,
  plan: SavedPlan | null,
): ScenarioResult[] {
  if (!profile && !plan) return [];

  const d = extractDeepData(profile, plan);
  const income = d.totalIncome;
  if (income <= 0) return [];

  const fs = d.filingStatus;
  const hasBusiness = profile?.hasBusinessIncome || d.businessIncome > 0;
  const hasRealEstate = profile?.hasRealEstate || false;
  const hasRetirement = profile?.hasRetirementAccounts || false;
  const hasMortgage = profile?.hasMortgage || false;
  const hasCharity = profile?.hasCharitableGiving || false;
  const hasInvestments = profile?.hasInvestments || false;

  // Marginal rate
  const marginalRate = income > 600000 ? 0.37 : income > 250000 ? 0.35 : income > 200000 ? 0.32 : income > 100000 ? 0.24 : income > 50000 ? 0.22 : income > 12000 ? 0.12 : 0.10;

  // Filing status label for personalized text
  const fsLabel = fs === "mfj" ? "MFJ" : fs === "mfs" ? "MFS" : fs === "hoh" ? "HOH" : fs === "qss" ? "QSS" : "Single";
  const stateLabel = d.state ? ` in ${d.state}` : "";
  const occLabel = d.occupation || "taxpayer";

  const results: ScenarioResult[] = [];

  // =========================================================================
  // 1. LLC vs S-Corp (if they have business income > $30k)
  // =========================================================================
  if (hasBusiness && d.businessIncome > 30000) {
    const bi = d.businessIncome;
    const salaryPct = bi > 200000 ? 0.50 : bi > 100000 ? 0.55 : 0.60;
    const salary = Math.round(bi * salaryPct);
    const distribution = bi - salary;
    const llcSE = seTax(bi);
    const scorpFICA = ficaOnWages(salary);
    const overhead = bi > 200000 ? 5800 : bi > 100000 ? 4800 : 3800;

    const llcInput: TaxInput = { ...defaultTaxInput(), filingStatus: fs, wages: d.w2Wages, businessIncome: bi };
    const llcR = calculateTax(llcInput);
    const scorpInput: TaxInput = { ...defaultTaxInput(), filingStatus: fs, wages: d.w2Wages + salary, otherIncome: distribution };
    const scorpR = calculateTax(scorpInput);

    const annualSave = (llcR.totalTax + llcSE) - (scorpR.totalTax + scorpFICA + overhead);

    const proj: YearProjection[] = [];
    let cA = 0, cB = 0;
    for (let yr = 1; yr <= 5; yr++) {
      const g = Math.pow(1.03, yr - 1);
      const ybi = Math.round(bi * g);
      const ys = Math.round(ybi * salaryPct);
      const ySE = seTax(ybi);
      const yFICA = ficaOnWages(ys);
      const yLLC = calculateTax({ ...defaultTaxInput(), filingStatus: fs, wages: d.w2Wages, businessIncome: ybi }).totalTax + ySE;
      const ySCorp = calculateTax({ ...defaultTaxInput(), filingStatus: fs, wages: d.w2Wages + ys, otherIncome: ybi - ys }).totalTax + yFICA + overhead;
      cA += yLLC; cB += ySCorp;
      proj.push({ year: yr, armA: Math.round(cA), armB: Math.round(cB), delta: Math.round(cA - cB) });
    }

    results.push({
      id: "llc_vs_scorp",
      title: "LLC vs S-Corp Election",
      subtitle: `Business income: ${formatUSD(bi)} · ${fsLabel}${stateLabel}`,
      personalNote: `As a ${occLabel} earning ${formatUSD(bi)} in business income, you're paying ${formatUSD(llcSE)} in self-employment tax on every dollar. An S-Corp election could save you ${formatUSD(Math.max(0, llcSE - scorpFICA))}/year in payroll taxes alone.`,
      icon: "Building2", color: "#DC5700", applicable: true,
      confidenceLevel: d.dataQuality,
      dataSource: d.businessIncome > 0 ? "Profile business income" : "Estimated from total income",
      armA: {
        label: "Stay as LLC / Sole Prop", shortLabel: "LLC",
        totalTax: Math.round(llcR.totalTax + llcSE),
        details: [
          { label: "Income Tax", value: Math.round(llcR.totalIncomeTax) },
          { label: `SE Tax (15.3% on ${formatUSD(bi)})`, value: Math.round(llcSE) },
          { label: "Compliance Cost", value: 0 },
          { label: "Total Annual Cost", value: Math.round(llcR.totalTax + llcSE) },
        ],
        highlights: [
          `Full SE tax on ${formatUSD(bi)}: ${formatUSD(llcSE)}`,
          "No payroll required",
          "Simpler filing (Schedule C)",
        ],
        warnings: [`Paying ${formatUSD(llcSE)} in self-employment tax — highest cost path`],
      },
      armB: {
        label: "Elect S-Corp Status", shortLabel: "S-Corp",
        totalTax: Math.round(scorpR.totalTax + scorpFICA + overhead),
        details: [
          { label: "Income Tax", value: Math.round(scorpR.totalIncomeTax) },
          { label: `FICA on salary (${formatUSD(salary)})`, value: Math.round(scorpFICA) },
          { label: "Compliance Cost", value: overhead },
          { label: "Total Annual Cost", value: Math.round(scorpR.totalTax + scorpFICA + overhead) },
        ],
        highlights: [
          `Reasonable salary: ${formatUSD(salary)} (${(salaryPct * 100).toFixed(0)}%)`,
          `Tax-free distributions: ${formatUSD(distribution)}/year`,
          `SE tax savings: ${formatUSD(Math.max(0, llcSE - scorpFICA))}/year`,
        ],
        warnings: [
          "Must run payroll & file 1120-S",
          `Annual compliance: ${formatUSD(overhead)}`,
          "Reasonable salary must be defensible to IRS",
        ],
      },
      annualSavings: Math.round(Math.max(0, annualSave)),
      fiveYearSavings: proj[4]?.delta ?? 0,
      recommendation: annualSave > 0 ? "S-Corp" : "LLC",
      reason: annualSave > 0
        ? `${occLabel}, at ${formatUSD(bi)} in business income${stateLabel}, the S-Corp election saves ${formatUSD(annualSave)}/year after ${formatUSD(overhead)} in compliance costs. The key: only ${formatUSD(salary)} is subject to FICA (${(salaryPct * 100).toFixed(0)}% reasonable salary), while ${formatUSD(distribution)} flows as tax-free distributions. Over 5 years, that's ${formatUSD(proj[4]?.delta ?? 0)} in cumulative savings.`
        : `At ${formatUSD(bi)} business income, the S-Corp compliance overhead (${formatUSD(overhead)}/year) exceeds the payroll tax savings. Stay as LLC until income exceeds ~$50,000.`,
      projections: proj,
      bars: [
        { label: "Income Tax", armA: Math.round(llcR.totalIncomeTax), armB: Math.round(scorpR.totalIncomeTax) },
        { label: "SE / FICA", armA: Math.round(llcSE), armB: Math.round(scorpFICA) },
        { label: "Compliance", armA: 0, armB: overhead },
        { label: "Total Cost", armA: Math.round(llcR.totalTax + llcSE), armB: Math.round(scorpR.totalTax + scorpFICA + overhead) },
      ],
      disclaimers: [
        "* Reasonable salary must be justifiable based on industry, duties, and experience.",
        "** S-Corp election requires Form 2553 filed by March 15th (or within 75 days of formation).",
        "*** State franchise taxes, PTE elections, and payroll taxes vary by state.",
        `**** Business income of ${formatUSD(bi)} sourced from ${d.dataQuality === "high" ? "uploaded tax documents" : "profile data"}.`,
      ],
    });
  }

  // =========================================================================
  // 2. Retirement Plan Optimization
  // =========================================================================
  if (income > 50000) {
    const seIncome = d.businessIncome || (hasBusiness ? income * 0.4 : 0);
    const w2Income = d.w2Wages > 0 ? d.w2Wages : income - seIncome;
    const age = 45; // default

    // Detect current contribution status
    const currentContrib = d.retirementContributions;
    const isUnderContributing = d.noRetirementContributions || currentContrib === 0;

    // Current state
    const baseInput: TaxInput = {
      ...defaultTaxInput(), filingStatus: fs, wages: w2Income, businessIncome: seIncome,
      retirementContributions: currentContrib,
    };
    const baseR = calculateTax(baseInput);

    // 401(k) max
    const k401Max = age >= 50 ? 31000 : 23500;
    const k401Input: TaxInput = { ...defaultTaxInput(), filingStatus: fs, wages: w2Income, businessIncome: seIncome, retirementContributions: k401Max };
    const k401R = calculateTax(k401Input);
    const k401Save = baseR.totalTax - k401R.totalTax;

    // IRA
    const iraMax = age >= 50 ? 8000 : 7000;
    const iraInput: TaxInput = { ...defaultTaxInput(), filingStatus: fs, wages: w2Income, businessIncome: seIncome, retirementContributions: currentContrib, iraDeduction: iraMax };
    const iraR = calculateTax(iraInput);
    const iraSave = baseR.totalTax - iraR.totalTax;

    // HSA
    const hsaMax = fs === "mfj" || fs === "qss" ? 8550 : 4300;
    const hsaInput: TaxInput = { ...defaultTaxInput(), filingStatus: fs, wages: w2Income, businessIncome: seIncome, retirementContributions: currentContrib, hsaDeduction: hsaMax };
    const hsaR = calculateTax(hsaInput);
    const hsaSave = baseR.totalTax - hsaR.totalTax;

    // All combined
    const allInput: TaxInput = {
      ...defaultTaxInput(), filingStatus: fs, wages: w2Income, businessIncome: seIncome,
      retirementContributions: k401Max, iraDeduction: iraMax, hsaDeduction: hsaMax,
    };
    const allR = calculateTax(allInput);
    const allSave = baseR.totalTax - allR.totalTax;

    // SEP-IRA / Solo 401(k) for business owners
    const sepMax = seIncome > 0 ? Math.min(Math.round(seIncome * 0.25), 69000) : 0;
    let sepSave = 0;
    if (sepMax > 0) {
      const sepInput: TaxInput = { ...defaultTaxInput(), filingStatus: fs, wages: w2Income, businessIncome: seIncome, retirementContributions: sepMax };
      const sepR = calculateTax(sepInput);
      sepSave = baseR.totalTax - sepR.totalTax;
    }

    const proj: YearProjection[] = [];
    for (let yr = 1; yr <= 5; yr++) {
      proj.push({
        year: yr,
        armA: Math.round(baseR.totalTax * yr),
        armB: Math.round(allR.totalTax * yr),
        delta: Math.round(allSave * yr),
      });
    }

    const personalWarning = isUnderContributing
      ? `Your tax return shows no visible retirement contributions despite earning ${formatUSD(income)}. At the ${(marginalRate * 100).toFixed(0)}% bracket, every dollar you defer saves ${(marginalRate * 100).toFixed(0)}¢ in taxes immediately.`
      : `You currently contribute ${formatUSD(currentContrib)}/year. Maximizing could save an additional ${formatUSD(allSave)}/year.`;

    const retDetails: { label: string; value: number; isSavings?: boolean }[] = [
      { label: `401(k): ${formatUSD(k401Max)}`, value: Math.round(k401Save), isSavings: true },
      { label: `IRA: ${formatUSD(iraMax)}`, value: Math.round(iraSave), isSavings: true },
      { label: `HSA: ${formatUSD(hsaMax)}`, value: Math.round(hsaSave), isSavings: true },
    ];
    if (sepMax > 0) {
      retDetails.push({ label: `SEP-IRA: ${formatUSD(sepMax)}`, value: Math.round(sepSave), isSavings: true });
    }
    retDetails.push(
      { label: "Total Tax After", value: Math.round(allR.totalTax) },
      { label: "Total Annual Savings", value: Math.round(allSave), isSavings: true },
    );

    const retHighlights = [
      `401(k) saves ${formatUSD(k401Save)}/year (contribute ${formatUSD(k401Max)})`,
      `IRA saves ${formatUSD(iraSave)}/year (contribute ${formatUSD(iraMax)})`,
      `HSA saves ${formatUSD(hsaSave)}/year — triple tax advantage`,
    ];
    if (sepMax > 0) {
      retHighlights.push(`SEP-IRA: up to ${formatUSD(sepMax)} (25% of ${formatUSD(seIncome)} business income)`);
    }
    retHighlights.push(`Combined annual tax savings: ${formatUSD(allSave)}`);

    results.push({
      id: "retirement_plan",
      title: "Retirement & Tax-Advantaged Accounts",
      subtitle: `${formatPercent(marginalRate)} bracket · ${isUnderContributing ? "No contributions detected" : `Currently: ${formatUSD(currentContrib)}/yr`}`,
      personalNote: personalWarning,
      icon: "PiggyBank", color: "#4CD6FB", applicable: true,
      confidenceLevel: d.noRetirementContributions ? "high" : d.dataQuality,
      dataSource: d.noRetirementContributions ? "Tax return analysis: no retirement contributions found" : "Profile retirement accounts",
      armA: {
        label: isUnderContributing ? "Current: No Contributions" : `Current: ${formatUSD(currentContrib)}/yr`,
        shortLabel: "Current",
        totalTax: Math.round(baseR.totalTax),
        details: [
          { label: "Taxable Income", value: Math.round(baseR.taxableIncome) },
          { label: "Total Tax", value: Math.round(baseR.totalTax) },
          { label: "Effective Rate", value: Math.round(baseR.effectiveRate * 10000) / 100 },
          { label: "Tax-Deferred Savings", value: currentContrib },
        ],
        highlights: [
          `Current tax: ${formatUSD(baseR.totalTax)}`,
          `Effective rate: ${formatPercent(baseR.effectiveRate)}`,
          `${formatPercent(marginalRate)} marginal bracket`,
        ],
        warnings: isUnderContributing
          ? ["No retirement contributions = no tax shelter", "Missing employer match is money left on the table", `Losing ${formatUSD(allSave)}/year in potential tax savings`]
          : [],
      },
      armB: {
        label: "Maximize All Tax-Advantaged Accounts", shortLabel: "Maximized",
        totalTax: Math.round(allR.totalTax),
        details: retDetails,
        highlights: retHighlights,
        warnings: [
          income > (fs === "mfj" ? 230000 : 153000) ? "IRA deductibility limited at this income (consider backdoor Roth)" : "",
          "HSA requires enrollment in a qualifying HDHP",
        ].filter(Boolean),
      },
      annualSavings: Math.round(allSave), fiveYearSavings: Math.round(allSave * 5),
      recommendation: "Maximized",
      reason: `${occLabel} earning ${formatUSD(income)} ${fsLabel}${stateLabel} — maximizing retirement accounts saves ${formatUSD(allSave)}/year. The 401(k) alone shelters ${formatUSD(k401Max)} from the ${(marginalRate * 100).toFixed(0)}% bracket, saving ${formatUSD(k401Save)}/year. ${isUnderContributing ? "Your return shows zero retirement contributions — this is the single highest-impact move available." : ""} Over 5 years: ${formatUSD(allSave * 5)} in tax savings, plus tax-deferred compound growth.`,
      projections: proj,
      bars: [
        { label: "401(k)", armA: 0, armB: Math.round(k401Save) },
        { label: "IRA", armA: 0, armB: Math.round(iraSave) },
        { label: "HSA", armA: 0, armB: Math.round(hsaSave) },
        ...(sepMax > 0 ? [{ label: "SEP-IRA", armA: 0, armB: Math.round(sepSave) }] : []),
        { label: "Total Tax", armA: Math.round(baseR.totalTax), armB: Math.round(allR.totalTax) },
      ],
      disclaimers: [
        "* 401(k) limit: $23,500 ($31,000 if 50+) for 2025.",
        "** IRA deductibility phases out at higher incomes if covered by employer plan.",
        "*** HSA requires enrollment in a qualifying HDHP.",
        ...(sepMax > 0 ? [`**** SEP-IRA limit: 25% of net SE income, max $69,000 for 2025.`] : []),
      ],
    });
  }

  // =========================================================================
  // 3. Standard vs Itemized Deductions
  // =========================================================================
  if (income > 30000) {
    // Use actual data where available
    const actualSALT = d.saltDeductions > 0 ? d.saltDeductions : (d.stateTax > 0 ? Math.min(d.stateTax + d.propertyTaxes, 40000) : Math.min(income * 0.05, 40000));
    const actualMortgage = d.mortgageInterest > 0 ? d.mortgageInterest : (hasMortgage ? Math.min(income * 0.06, 30000) : 0);
    const actualCharity = d.charitableDeductions > 0 ? d.charitableDeductions : (hasCharity ? income * 0.03 : 0);

    const stdInput: TaxInput = { ...defaultTaxInput(), filingStatus: fs, wages: d.w2Wages, businessIncome: d.businessIncome, useItemized: false };
    const stdR = calculateTax(stdInput);

    const itemInput: TaxInput = {
      ...defaultTaxInput(), filingStatus: fs, wages: d.w2Wages, businessIncome: d.businessIncome, useItemized: true,
      stateLocalTaxes: actualSALT, mortgageInterest: actualMortgage, charitableCash: actualCharity,
    };
    const itemR = calculateTax(itemInput);
    const savings = stdR.totalTax - itemR.totalTax;

    const isClose = Math.abs(itemR.itemizedDeduction - stdR.standardDeduction) < 5000;

    results.push({
      id: "standard_vs_itemized",
      title: "Standard vs Itemized Deductions",
      subtitle: `${d.isItemizing ? "Currently itemizing" : "Using standard deduction"} · ${d.totalDeductions > 0 ? formatUSD(d.totalDeductions) : formatUSD(income)} income`,
      personalNote: isClose
        ? `Your itemized deductions (${formatUSD(itemR.itemizedDeduction)}) are close to the standard deduction (${formatUSD(stdR.standardDeduction)}). Consider "bunching" — doubling charitable contributions every other year to alternate between standard and itemized.`
        : savings > 0
          ? `With ${formatUSD(actualSALT)} in SALT, ${actualMortgage > 0 ? formatUSD(actualMortgage) + " mortgage interest, " : ""}${actualCharity > 0 ? "and " + formatUSD(actualCharity) + " in charitable giving, " : ""}itemizing saves you ${formatUSD(savings)}/year.`
          : `The standard deduction of ${formatUSD(stdR.standardDeduction)} exceeds your itemizable expenses. This is actually a good thing — you get a larger deduction with zero documentation.`,
      icon: "Receipt", color: "#F59E0B", applicable: hasMortgage || hasCharity || d.stateTax > 10000 || d.isItemizing,
      confidenceLevel: d.saltDeductions > 0 || d.mortgageInterest > 0 ? "high" : d.dataQuality,
      dataSource: d.saltDeductions > 0 ? "Actual SALT/mortgage from tax return" : "Estimated from profile flags",
      armA: {
        label: "Standard Deduction", shortLabel: "Standard",
        totalTax: Math.round(stdR.totalTax),
        details: [
          { label: "Deduction Amount", value: Math.round(stdR.standardDeduction) },
          { label: "Taxable Income", value: Math.round(stdR.taxableIncome) },
          { label: "Total Tax", value: Math.round(stdR.totalTax) },
        ],
        highlights: [`Standard deduction: ${formatUSD(stdR.standardDeduction)}`, "No documentation required", "Simple filing"],
        warnings: [],
      },
      armB: {
        label: "Itemized Deductions", shortLabel: "Itemized",
        totalTax: Math.round(itemR.totalTax),
        details: [
          { label: `SALT (capped at $40k)`, value: Math.round(actualSALT) },
          ...(actualMortgage > 0 ? [{ label: "Mortgage Interest", value: Math.round(actualMortgage) }] : []),
          ...(actualCharity > 0 ? [{ label: "Charitable", value: Math.round(actualCharity) }] : []),
          { label: "Total Itemized", value: Math.round(itemR.itemizedDeduction) },
          { label: "Total Tax", value: Math.round(itemR.totalTax) },
        ],
        highlights: [
          `Total itemized: ${formatUSD(itemR.itemizedDeduction)}`,
          `SALT: ${formatUSD(actualSALT)}${d.state ? ` (${d.state})` : ""}`,
          actualMortgage > 0 ? `Mortgage interest: ${formatUSD(actualMortgage)}` : "",
          actualCharity > 0 ? `Charitable: ${formatUSD(actualCharity)}` : "",
        ].filter(Boolean),
        warnings: [
          "Requires receipts and documentation",
          actualSALT >= 40000 ? `SALT capped at $40,000 — you're losing ${formatUSD(Math.max(0, (d.stateTax + d.propertyTaxes) - 40000))} in excess` : "",
        ].filter(Boolean),
      },
      annualSavings: Math.round(Math.max(0, savings)),
      fiveYearSavings: Math.round(Math.max(0, savings) * 5),
      recommendation: savings > 0 ? "Itemized" : "Standard",
      reason: savings > 0
        ? `Itemizing saves ${formatUSD(savings)}/year. Your deductions (${formatUSD(itemR.itemizedDeduction)}) exceed the ${formatUSD(stdR.standardDeduction)} standard deduction by ${formatUSD(itemR.itemizedDeduction - stdR.standardDeduction)}.${isClose ? " Consider bunching charitable donations every other year for an even bigger benefit." : ""}`
        : `Standard deduction (${formatUSD(stdR.standardDeduction)}) saves more — your itemized total is only ${formatUSD(itemR.itemizedDeduction)}.${isClose ? " You're close though — consider bunching charitable donations to push past the threshold every other year." : ""}`,
      projections: Array.from({ length: 5 }, (_, i) => ({
        year: i + 1, armA: Math.round(stdR.totalTax * (i + 1)), armB: Math.round(itemR.totalTax * (i + 1)), delta: Math.round(savings * (i + 1)),
      })),
      bars: [
        { label: "Deduction", armA: Math.round(stdR.standardDeduction), armB: Math.round(itemR.itemizedDeduction) },
        { label: "Taxable Income", armA: Math.round(stdR.taxableIncome), armB: Math.round(itemR.taxableIncome) },
        { label: "Total Tax", armA: Math.round(stdR.totalTax), armB: Math.round(itemR.totalTax) },
      ],
      disclaimers: [
        "* SALT deduction capped at $40,000 ($20,000 MFS) for 2025.",
        "** Medical expenses deductible only above 7.5% of AGI.",
        d.saltDeductions > 0 ? "*** SALT amount from uploaded tax return." : "*** Estimated values based on profile. Provide documents for exact amounts.",
      ],
    });
  }

  // =========================================================================
  // 4. Child & Family Tax Credits (if dependents > 0)
  // =========================================================================
  if (d.dependents > 0) {
    const noCTCInput: TaxInput = { ...defaultTaxInput(), filingStatus: fs, wages: d.w2Wages, businessIncome: d.businessIncome, qualifyingChildren: 0 };
    const noCTCR = calculateTax(noCTCInput);

    const ctcInput: TaxInput = { ...defaultTaxInput(), filingStatus: fs, wages: d.w2Wages, businessIncome: d.businessIncome, qualifyingChildren: d.dependents };
    const ctcR = calculateTax(ctcInput);

    const childCareExpense = Math.min(d.dependents * 3000, 6000);
    const fullInput: TaxInput = {
      ...defaultTaxInput(), filingStatus: fs, wages: d.w2Wages, businessIncome: d.businessIncome,
      qualifyingChildren: d.dependents, childCareCreditExpenses: childCareExpense,
    };
    const fullR = calculateTax(fullInput);

    const ctcSave = noCTCR.totalTax - ctcR.totalTax;
    const fullSave = noCTCR.totalTax - fullR.totalTax;

    // 529 plan benefit (state-specific)
    const has529Benefit = ["KS", "NY", "IN", "PA", "OH", "MO", "IA"].includes(d.state.toUpperCase());
    const est529Savings = has529Benefit ? d.dependents * 300 : 0;

    results.push({
      id: "child_tax_credit",
      title: "Child & Family Tax Credits",
      subtitle: `${d.dependents} dependent${d.dependents > 1 ? "s" : ""} · ${formatUSD(income)} ${fsLabel}${stateLabel}`,
      personalNote: `With ${d.dependents} qualifying child${d.dependents > 1 ? "ren" : ""} at ${formatUSD(income)} income, you qualify for up to ${formatUSD(d.dependents * 2200)} in Child Tax Credits plus ${formatUSD(fullR.childCareCredit)} in Child Care Credits.${has529Benefit ? ` ${d.state} also offers a 529 plan state tax deduction worth ~${formatUSD(est529Savings)}/year.` : ""}`,
      icon: "Heart", color: "#EC4899", applicable: true,
      confidenceLevel: d.dataQuality,
      dataSource: d.childTaxCreditClaimed > 0 ? "Tax return shows CTC claimed" : "Profile dependents count",
      armA: {
        label: "Without Family Credits", shortLabel: "No Credits",
        totalTax: Math.round(noCTCR.totalTax),
        details: [
          { label: "Total Tax", value: Math.round(noCTCR.totalTax) },
          { label: "Credits Applied", value: 0 },
        ],
        highlights: [`Base tax: ${formatUSD(noCTCR.totalTax)}`, "No family credits claimed"],
        warnings: [`Missing ${formatUSD(fullSave)}/year in available credits`],
      },
      armB: {
        label: "All Family Credits Maximized", shortLabel: "Maximized",
        totalTax: Math.round(fullR.totalTax),
        details: [
          { label: `Child Tax Credit (${d.dependents} × $2,200)`, value: Math.round(ctcR.childTaxCredit), isSavings: true },
          { label: `Child Care Credit`, value: Math.round(fullR.childCareCredit), isSavings: true },
          ...(est529Savings > 0 ? [{ label: `529 State Deduction (${d.state})`, value: est529Savings, isSavings: true }] : []),
          { label: "Total Credits", value: Math.round(fullR.totalCredits + est529Savings), isSavings: true },
          { label: "Tax After Credits", value: Math.round(fullR.totalTax - est529Savings) },
        ],
        highlights: [
          `CTC: ${formatUSD(ctcR.childTaxCredit)} (${d.dependents} × $2,200)`,
          `Child Care Credit: ${formatUSD(fullR.childCareCredit)} on ${formatUSD(childCareExpense)} expenses`,
          ...(est529Savings > 0 ? [`${d.state} 529 deduction: ~${formatUSD(est529Savings)}/year`] : []),
          `Total annual benefit: ${formatUSD(fullSave + est529Savings)}`,
        ],
        warnings: income > 400000 && fs === "mfj" ? ["CTC phases out above $400,000 MFJ income"] : income > 200000 && fs === "single" ? ["CTC phases out above $200,000 income"] : [],
      },
      annualSavings: Math.round(fullSave + est529Savings), fiveYearSavings: Math.round((fullSave + est529Savings) * 5),
      recommendation: "Maximized",
      reason: `Claiming all family credits saves ${formatUSD(fullSave + est529Savings)}/year for your ${d.dependents}-child${d.dependents > 1 ? "" : ""} family. The CTC alone provides ${formatUSD(ctcR.childTaxCredit)}.${has529Benefit ? ` ${d.state} offers a 529 plan deduction worth ~${formatUSD(est529Savings)}/year in state tax savings.` : ""} Over 5 years: ${formatUSD((fullSave + est529Savings) * 5)}.`,
      projections: Array.from({ length: 5 }, (_, i) => ({
        year: i + 1, armA: Math.round(noCTCR.totalTax * (i + 1)), armB: Math.round((fullR.totalTax - est529Savings) * (i + 1)), delta: Math.round((fullSave + est529Savings) * (i + 1)),
      })),
      bars: [
        { label: "CTC", armA: 0, armB: Math.round(ctcR.childTaxCredit) },
        { label: "Care Credit", armA: 0, armB: Math.round(fullR.childCareCredit) },
        ...(est529Savings > 0 ? [{ label: "529 Plan", armA: 0, armB: est529Savings }] : []),
        { label: "Total Tax", armA: Math.round(noCTCR.totalTax), armB: Math.round(fullR.totalTax - est529Savings) },
      ],
      disclaimers: [
        "* CTC: $2,200 per qualifying child under 17 for 2025.",
        "** CTC phases out at $200,000 (single) / $400,000 (MFJ).",
        "*** Child Care Credit based on estimated $3,000/child (max $6,000).",
        ...(has529Benefit ? [`**** ${d.state} 529 deduction is estimated. Check state-specific limits.`] : []),
      ],
    });
  }

  // =========================================================================
  // 5. Roth Conversion Analysis
  // =========================================================================
  if (hasRetirement || income > 100000) {
    const convAmount = Math.min(50000, income * 0.15);
    const currentAge = 45;
    const retireAge = 65;
    const returnRate = 0.07;
    const futureRate = Math.max(0.12, marginalRate - 0.10);
    const yearsToRetire = retireAge - currentAge;

    const baseInput: TaxInput = { ...defaultTaxInput(), filingStatus: fs, wages: d.w2Wages, businessIncome: d.businessIncome };
    const baseR = calculateTax(baseInput);
    const convInput: TaxInput = { ...defaultTaxInput(), filingStatus: fs, wages: d.w2Wages, businessIncome: d.businessIncome, retirementDistributions: convAmount };
    const convR = calculateTax(convInput);
    const taxCost = convR.totalTax - baseR.totalTax;

    const rothFV = convAmount * Math.pow(1 + returnRate, yearsToRetire);
    const tradFV = convAmount * Math.pow(1 + returnRate, yearsToRetire);
    const tradAfterTax = tradFV * (1 - futureRate);
    const benefit = rothFV - tradAfterTax - taxCost;

    const proj: YearProjection[] = [];
    let breakEven: number | undefined;
    for (let yr = 1; yr <= 20; yr++) {
      const fv = convAmount * Math.pow(1 + returnRate, yr);
      const trad = fv * (1 - futureRate);
      const delta = fv - trad - taxCost;
      if (!breakEven && delta > 0) breakEven = yr;
      proj.push({ year: yr, armA: Math.round(trad), armB: Math.round(fv - taxCost), delta: Math.round(delta) });
    }

    // Bracket space analysis — how much can be converted before hitting next bracket
    const bracketSpace = convR.taxableIncome - baseR.taxableIncome;
    const currentBracketTop = income > 250000 ? 501050 : income > 200000 ? 394600 : income > 100000 ? 206700 : 96950;
    const roomInBracket = Math.max(0, currentBracketTop - baseR.taxableIncome);

    results.push({
      id: "roth_conversion",
      title: "Roth Conversion Analysis",
      subtitle: `Convert ${formatUSD(convAmount)} · Current: ${formatPercent(marginalRate)} bracket · ${formatPercent(futureRate)} future est.`,
      personalNote: `At ${formatUSD(income)} income in the ${(marginalRate * 100).toFixed(0)}% bracket, you have approximately ${formatUSD(roomInBracket)} of room before hitting the next bracket. Converting ${formatUSD(convAmount)} to Roth now costs ${formatUSD(taxCost)} in taxes but grows completely tax-free — ${formatUSD(rothFV)} by age ${retireAge}.${breakEven ? ` Breaks even in year ${breakEven}.` : ""}`,
      icon: "TrendingUp", color: "#10B981", applicable: hasRetirement,
      confidenceLevel: d.dataQuality,
      dataSource: hasRetirement ? "Profile retirement accounts" : "Income-based eligibility",
      armA: {
        label: "Keep Traditional (Tax Later)", shortLabel: "Traditional",
        totalTax: Math.round(tradFV * futureRate),
        details: [
          { label: "Tax Paid Now", value: 0 },
          { label: `Value at Age ${retireAge}`, value: Math.round(tradFV) },
          { label: `Tax at Withdrawal (${(futureRate * 100).toFixed(0)}%)`, value: Math.round(tradFV * futureRate) },
          { label: "After-Tax Value", value: Math.round(tradAfterTax) },
        ],
        highlights: ["No tax hit this year", `Grows to ${formatUSD(tradFV)} by age ${retireAge}`, `After-tax: ${formatUSD(tradAfterTax)}`],
        warnings: ["RMDs start at 73 — forced withdrawals at ordinary rates", "Withdrawals taxed as ordinary income", "Future rates could increase (current law sunsets 2026)"],
      },
      armB: {
        label: "Convert to Roth (Tax Now)", shortLabel: "Roth",
        totalTax: Math.round(taxCost),
        details: [
          { label: "Tax Paid Now", value: Math.round(taxCost) },
          { label: `Roth Value at Age ${retireAge}`, value: Math.round(rothFV) },
          { label: "Tax at Withdrawal", value: 0, isSavings: true },
          { label: "After-Tax Value", value: Math.round(rothFV) },
          { label: "Net Lifetime Benefit", value: Math.round(benefit), isSavings: benefit > 0 },
        ],
        highlights: [
          `Tax cost today: ${formatUSD(taxCost)}`,
          `Grows tax-FREE to ${formatUSD(rothFV)}`,
          "No RMDs — grows indefinitely",
          `Net lifetime benefit: ${formatUSD(benefit)}`,
          breakEven ? `Breaks even in year ${breakEven}` : "",
          `Bracket space: ${formatUSD(roomInBracket)} before next bracket`,
        ].filter(Boolean),
        warnings: [
          `Pushes into ${formatPercent(convR.marginalRate)} bracket this year`,
          "5-year rule for penalty-free earnings withdrawal",
          income + convAmount > (fs === "mfj" ? 206000 : 103000) ? "May trigger Medicare IRMAA surcharge at this income" : "",
        ].filter(Boolean),
      },
      annualSavings: 0, fiveYearSavings: Math.round(benefit),
      recommendation: benefit > 0 ? "Roth" : "Traditional",
      reason: benefit > 0
        ? `Converting ${formatUSD(convAmount)} to Roth nets ${formatUSD(benefit)} over ${yearsToRetire} years at ${(returnRate * 100).toFixed(0)}% return. You pay ${formatUSD(taxCost)} now but save ${formatUSD(Math.round(tradFV * futureRate))} in future taxes.${breakEven ? ` Breaks even in year ${breakEven}.` : ""} With TCJA provisions potentially sunsetting in 2026, locking in today's lower rates is strategic.`
        : `At your current bracket (${formatPercent(marginalRate)}), keeping traditional is better — the tax cost now exceeds the future benefit.`,
      projections: proj.slice(0, 10),
      bars: [
        { label: "Tax Now", armA: 0, armB: Math.round(taxCost) },
        { label: "Tax at Retirement", armA: Math.round(tradFV * futureRate), armB: 0 },
        { label: `After-Tax at ${retireAge}`, armA: Math.round(tradAfterTax), armB: Math.round(rothFV - taxCost) },
      ],
      disclaimers: [
        "* Assumes 7% annual return and constant tax rates. Actual returns vary.",
        "** IRMAA thresholds: $103,000 (single) / $206,000 (MFJ) for 2025.",
        "*** Optimal conversion amount depends on bracket space and other income.",
        "**** TCJA provisions may sunset after 2025 — rates could increase.",
      ],
    });
  }

  // =========================================================================
  // 6. 1031 Exchange (if real estate)
  // =========================================================================
  if (hasRealEstate) {
    const propValue = income > 500000 ? 800000 : income > 200000 ? 500000 : 350000;
    const basis = propValue * 0.6;
    const deprec = propValue * 0.15;
    const gain = propValue - basis;
    const ltcgTax = (gain - deprec) * 0.15;
    const recapture = deprec * 0.25;
    const stTax = gain * 0.05;
    const totalTax = ltcgTax + recapture + stTax;
    const replacement = propValue * 1.1;
    const projYears = 10;

    const proj: YearProjection[] = [];
    for (let yr = 1; yr <= projYears; yr++) {
      const sellVal = (propValue - totalTax) * Math.pow(1.03, yr);
      const exchVal = replacement * Math.pow(1.03, yr);
      proj.push({ year: yr, armA: Math.round(sellVal), armB: Math.round(exchVal), delta: Math.round(exchVal - sellVal) });
    }

    const rentalNote = d.rentalLoss > 0
      ? `Your return shows ${formatUSD(d.rentalLoss)} in rental losses, indicating active depreciation. A 1031 exchange preserves this tax-deferral advantage.`
      : `As a real estate holder${stateLabel}, selling triggers ${formatUSD(totalTax)} in taxes. A 1031 exchange defers 100% and keeps the full value working.`;

    results.push({
      id: "1031_exchange",
      title: "1031 Exchange vs Sell Property",
      subtitle: `Est. property: ${formatUSD(propValue)} · ${formatUSD(gain)} gain · ${formatUSD(totalTax)} tax`,
      personalNote: rentalNote,
      icon: "Home", color: "#8B5CF6", applicable: true,
      confidenceLevel: d.rentalLoss > 0 ? "medium" : "low",
      dataSource: d.rentalLoss > 0 ? "Schedule E rental data detected" : "Profile: real estate flag",
      armA: {
        label: "Sell Outright", shortLabel: "Sell",
        totalTax: Math.round(totalTax),
        details: [
          { label: "Capital Gain", value: Math.round(gain) },
          { label: "LTCG Tax (15%)", value: Math.round(ltcgTax) },
          { label: "Depreciation Recapture (25%)", value: Math.round(recapture) },
          { label: "State Tax (~5%)", value: Math.round(stTax) },
          { label: "Total Tax on Sale", value: Math.round(totalTax) },
          { label: "Net Proceeds", value: Math.round(propValue - totalTax) },
        ],
        highlights: [`Net after tax: ${formatUSD(propValue - totalTax)}`, "Full liquidity", "No reinvestment requirement"],
        warnings: [`${formatUSD(totalTax)} in taxes due this year`, "Depreciation recapture at 25% — often overlooked"],
      },
      armB: {
        label: "1031 Exchange", shortLabel: "1031",
        totalTax: 0,
        details: [
          { label: "Tax Deferred", value: Math.round(totalTax), isSavings: true },
          { label: "Amount Reinvested", value: Math.round(replacement) },
          { label: `Value at Year ${projYears}`, value: proj[projYears - 1]?.armB ?? 0 },
        ],
        highlights: [
          `Defer ${formatUSD(totalTax)} in taxes`,
          `Full ${formatUSD(propValue)} reinvested (plus equity from sale)`,
          `${projYears}-year wealth: ${formatUSD(proj[projYears - 1]?.armB ?? 0)}`,
          "Step-up in basis at death eliminates deferred gain",
        ],
        warnings: [
          "45-day identification window — must identify replacement properties",
          "180-day closing deadline — must close on replacement",
          "Basis carries over — deferred, not eliminated (except at death)",
        ],
      },
      annualSavings: Math.round(totalTax), fiveYearSavings: proj[4]?.delta ?? 0,
      recommendation: "1031",
      reason: `A 1031 exchange defers ${formatUSD(totalTax)} in taxes and keeps the full ${formatUSD(propValue)} working. Over 10 years at 3% appreciation: ${formatUSD(proj[9]?.delta ?? 0)} wealth advantage. If held until death, the deferred gain is eliminated via stepped-up basis — making this potentially a permanent tax elimination, not just a deferral.`,
      projections: proj,
      bars: [
        { label: "Tax Due", armA: Math.round(totalTax), armB: 0 },
        { label: "Amount Invested", armA: Math.round(propValue - totalTax), armB: Math.round(replacement) },
        { label: `Year ${projYears} Value`, armA: proj[projYears - 1]?.armA ?? 0, armB: proj[projYears - 1]?.armB ?? 0 },
      ],
      disclaimers: [
        "* Property values and basis are estimated from profile data.",
        "** 1031 exchange requires a Qualified Intermediary — cannot touch funds directly.",
        "*** State conformity varies. Some states (e.g., CA) don't fully recognize 1031 exchanges.",
        "**** Consult with your CPA and a QI before initiating an exchange.",
      ],
    });
  }

  // =========================================================================
  // 7. Cost Segregation Study (if real estate)
  // =========================================================================
  if (hasRealEstate) {
    const propValue = income > 500000 ? 1000000 : income > 200000 ? 600000 : 400000;
    const landPct = 0.20;
    const depBasis = propValue * (1 - landPct);
    const life = 27.5;
    const straightLine = depBasis / life;
    const reclassPct = 0.30;
    const bonusRate = 0.60; // 2025
    const reclassed = depBasis * reclassPct;
    const bonusYr1 = reclassed * bonusRate;
    const costSegYr1 = bonusYr1 + (depBasis - reclassed) / life;
    const yr1Extra = (costSegYr1 - straightLine) * marginalRate;
    const studyCost = Math.round(propValue * 0.005);

    const proj: YearProjection[] = [];
    let cumS = 0, cumC = 0;
    for (let yr = 1; yr <= 5; yr++) {
      const dep = yr === 1 ? costSegYr1 : ((depBasis - reclassed) / life + (yr <= 6 ? (reclassed * (1 - bonusRate)) / 6 : 0));
      cumS += Math.round(straightLine * marginalRate);
      cumC += Math.round(dep * marginalRate);
      proj.push({ year: yr, armA: cumS, armB: cumC, delta: cumC - cumS });
    }

    results.push({
      id: "cost_segregation",
      title: "Cost Segregation Study",
      subtitle: `${formatUSD(propValue)} property · ${(marginalRate * 100).toFixed(0)}% bracket · 60% bonus (2025)`,
      personalNote: `At the ${(marginalRate * 100).toFixed(0)}% federal bracket, accelerating ${formatUSD(reclassed)} in depreciation from 27.5 years to year 1 generates ${formatUSD(yr1Extra)} in immediate tax savings. The study costs ~${formatUSD(studyCost)} — ROI of ${Math.round(yr1Extra / studyCost)}x in year 1 alone.`,
      icon: "Landmark", color: "#EF4444", applicable: true,
      confidenceLevel: "low",
      dataSource: "Profile: real estate flag. Actual property value needed for precise analysis.",
      armA: {
        label: "Straight-Line Depreciation", shortLabel: "Standard",
        totalTax: 0,
        details: [
          { label: "Annual Depreciation", value: Math.round(straightLine) },
          { label: "Year 1 Tax Benefit", value: Math.round(straightLine * marginalRate) },
          { label: "Depreciable Basis", value: Math.round(depBasis) },
        ],
        highlights: [`${formatUSD(straightLine)}/year over ${life} years`, `Year 1 benefit: ${formatUSD(straightLine * marginalRate)}`],
        warnings: [],
      },
      armB: {
        label: "Cost Segregation + Bonus Depreciation", shortLabel: "Cost Seg",
        totalTax: 0,
        details: [
          { label: "Reclassified (5/7/15-yr)", value: Math.round(reclassed) },
          { label: "Year 1 Bonus (60%)", value: Math.round(bonusYr1) },
          { label: "Year 1 Total Depreciation", value: Math.round(costSegYr1) },
          { label: "Year 1 Tax Benefit", value: Math.round(costSegYr1 * marginalRate), isSavings: true },
          { label: "Extra vs Standard", value: Math.round(yr1Extra), isSavings: true },
          { label: `Study Cost`, value: studyCost },
          { label: "Net Year 1 Benefit", value: Math.round(yr1Extra - studyCost), isSavings: true },
        ],
        highlights: [
          `Year 1: ${formatUSD(costSegYr1)} depreciation (vs ${formatUSD(straightLine)} standard)`,
          `Net year 1 benefit: ${formatUSD(yr1Extra - studyCost)} (after ${formatUSD(studyCost)} study cost)`,
          `Year 1 ROI: ${Math.round(yr1Extra / studyCost)}x on study investment`,
        ],
        warnings: [
          "Bonus depreciation: 60% (2025), 40% (2026), 20% (2027), 0% (2028+) — act now",
          "Recapture risk if property sold within 5 years",
        ],
      },
      annualSavings: Math.round(yr1Extra), fiveYearSavings: proj[4]?.delta ?? 0,
      recommendation: "Cost Seg",
      reason: `Cost segregation generates ${formatUSD(yr1Extra)} in additional year-1 tax savings on your ${formatUSD(propValue)} property. With 2025's 60% bonus depreciation (declining to 40% in 2026), acting this year maximizes the front-loaded benefit. The study costs ~${formatUSD(studyCost)} with ${Math.round(yr1Extra / studyCost)}x ROI. Over 5 years: ${formatUSD(proj[4]?.delta ?? 0)} cumulative advantage.`,
      projections: proj,
      bars: [
        { label: "Year 1 Depreciation", armA: Math.round(straightLine), armB: Math.round(costSegYr1) },
        { label: "Year 1 Tax Saved", armA: Math.round(straightLine * marginalRate), armB: Math.round(costSegYr1 * marginalRate) },
        { label: "5-Year Cumulative", armA: proj[4]?.armA ?? 0, armB: proj[4]?.armB ?? 0 },
      ],
      disclaimers: [
        "* Property values estimated from profile. Actual engineering study required.",
        "** Bonus depreciation: 60% (2025), 40% (2026), 20% (2027), 0% (2028+).",
        "*** Recapture applies at sale — accelerated deductions reverse at 25%.",
        "**** Study cost is estimated at 0.5% of property value.",
      ],
    });
  }

  // =========================================================================
  // 8. Charitable Bunching Strategy (if charitable giving or high income)
  // =========================================================================
  if ((hasCharity || income > 150000) && income > 50000) {
    const annualCharity = d.charitableDeductions > 0 ? d.charitableDeductions : (hasCharity ? income * 0.03 : income * 0.02);
    const stdDed = fs === "mfj" || fs === "qss" ? 31500 : fs === "hoh" ? 23625 : 15750;
    const otherItemized = (d.saltDeductions || Math.min(income * 0.05, 40000)) + (d.mortgageInterest || (hasMortgage ? income * 0.04 : 0));

    // Year 1: standard deduction, no charity
    // Year 2: bunch 2 years of charity, itemize
    const yr1Std: TaxInput = { ...defaultTaxInput(), filingStatus: fs, wages: d.w2Wages, businessIncome: d.businessIncome, useItemized: false };
    const yr1R = calculateTax(yr1Std);

    const yr2Bunch: TaxInput = {
      ...defaultTaxInput(), filingStatus: fs, wages: d.w2Wages, businessIncome: d.businessIncome, useItemized: true,
      stateLocalTaxes: d.saltDeductions || Math.min(income * 0.05, 40000),
      mortgageInterest: d.mortgageInterest || (hasMortgage ? income * 0.04 : 0),
      charitableCash: annualCharity * 2,
    };
    const yr2R = calculateTax(yr2Bunch);

    // Normal: give same amount every year, itemize or standard
    const normalInput: TaxInput = {
      ...defaultTaxInput(), filingStatus: fs, wages: d.w2Wages, businessIncome: d.businessIncome, useItemized: true,
      stateLocalTaxes: d.saltDeductions || Math.min(income * 0.05, 40000),
      mortgageInterest: d.mortgageInterest || (hasMortgage ? income * 0.04 : 0),
      charitableCash: annualCharity,
    };
    const normalR = calculateTax(normalInput);

    const twoYearNormal = normalR.totalTax * 2;
    const twoYearBunched = yr1R.totalTax + yr2R.totalTax;
    const bunchSavings = twoYearNormal - twoYearBunched;
    const annualizedSave = Math.round(bunchSavings / 2);

    // Only show if bunching actually helps (when normal charity doesn't push past standard)
    const normalItemized = normalR.deductionUsed === "itemized";
    const bunchItemized = yr2R.deductionUsed === "itemized";
    const isApplicable = !normalItemized || (bunchSavings > 500);

    if (isApplicable && annualizedSave > 0) {
      results.push({
        id: "charitable_bunching",
        title: "Charitable Bunching Strategy",
        subtitle: `${formatUSD(annualCharity)}/yr giving · ${normalItemized ? "Currently itemizing" : "Using standard deduction"}`,
        personalNote: `By "bunching" two years of charitable donations (${formatUSD(annualCharity * 2)}) into a single year using a Donor Advised Fund, you alternate between itemizing (high-donation year) and the standard deduction (skip year) — capturing both benefits. Same total giving, lower total tax.`,
        icon: "Heart", color: "#059669", applicable: true,
        confidenceLevel: d.charitableDeductions > 0 ? "high" : "medium",
        dataSource: d.charitableDeductions > 0 ? "Charitable deductions from tax return" : "Profile: charitable giving flag",
        armA: {
          label: "Give Annually (Same Amount)", shortLabel: "Annual",
          totalTax: Math.round(twoYearNormal),
          details: [
            { label: "Annual Giving", value: Math.round(annualCharity) },
            { label: "Deduction Used", value: Math.round(normalR.deductionAmount) },
            { label: "Tax Per Year", value: Math.round(normalR.totalTax) },
            { label: "2-Year Tax Total", value: Math.round(twoYearNormal) },
          ],
          highlights: [
            `${formatUSD(annualCharity)}/year in donations`,
            `Using ${normalR.deductionUsed} deduction: ${formatUSD(normalR.deductionAmount)}`,
          ],
          warnings: normalItemized ? [] : [`Charitable giving of ${formatUSD(annualCharity)} doesn't push past standard deduction — no tax benefit from donations`],
        },
        armB: {
          label: "Bunch Every Other Year (DAF)", shortLabel: "Bunched",
          totalTax: Math.round(twoYearBunched),
          details: [
            { label: "Year 1: Standard Deduction", value: Math.round(yr1R.deductionAmount) },
            { label: "Year 1 Tax", value: Math.round(yr1R.totalTax) },
            { label: `Year 2: Itemize (${formatUSD(annualCharity * 2)} donations)`, value: Math.round(yr2R.deductionAmount) },
            { label: "Year 2 Tax", value: Math.round(yr2R.totalTax) },
            { label: "2-Year Tax Total", value: Math.round(twoYearBunched) },
            { label: "2-Year Savings", value: Math.round(bunchSavings), isSavings: true },
          ],
          highlights: [
            `Fund DAF with ${formatUSD(annualCharity * 2)} → distribute ${formatUSD(annualCharity)}/year to charities`,
            `Year 2 itemized: ${formatUSD(yr2R.itemizedDeduction)} (vs ${formatUSD(stdDed)} standard)`,
            `2-year savings: ${formatUSD(bunchSavings)}`,
            "Same total giving — charities still receive annual distributions",
          ],
          warnings: [
            "Requires discipline to alternate annual strategy",
            "DAF has minimum initial contribution (typically $5,000+)",
          ],
        },
        annualSavings: annualizedSave, fiveYearSavings: Math.round(annualizedSave * 5),
        recommendation: "Bunched",
        reason: `Bunching ${formatUSD(annualCharity * 2)} into one year via a Donor Advised Fund saves ${formatUSD(bunchSavings)} every 2-year cycle (${formatUSD(annualizedSave)}/year averaged). Your charities still receive ${formatUSD(annualCharity)}/year from the DAF — same impact, lower taxes.`,
        projections: Array.from({ length: 5 }, (_, i) => ({
          year: i + 1,
          armA: Math.round(normalR.totalTax * (i + 1)),
          armB: Math.round((yr1R.totalTax + yr2R.totalTax) / 2 * (i + 1)),
          delta: Math.round(annualizedSave * (i + 1)),
        })),
        bars: [
          { label: "Annual Giving Tax", armA: Math.round(normalR.totalTax), armB: 0 },
          { label: "Yr 1 (Std Ded)", armA: 0, armB: Math.round(yr1R.totalTax) },
          { label: "Yr 2 (Itemize)", armA: 0, armB: Math.round(yr2R.totalTax) },
          { label: "2-Year Total", armA: Math.round(twoYearNormal), armB: Math.round(twoYearBunched) },
        ],
        disclaimers: [
          "* DAF contributions are irrevocable — funds committed to charity.",
          "** DAF providers: Fidelity Charitable, Schwab Charitable, Vanguard Charitable.",
          "*** Appreciated stock donations to DAF avoid capital gains tax entirely.",
        ],
      });
    }
  }

  // =========================================================================
  // 9. HSA Optimization (if eligible)
  // =========================================================================
  if (income > 40000 && (profile?.hasHealthInsurance || true)) {
    const hsaMax = fs === "mfj" || fs === "qss" ? 8550 : 4300;
    const catchUp = 1000; // age 55+ catch-up
    const hsaTotal = hsaMax; // not including catch-up since age unknown

    const baseInput: TaxInput = { ...defaultTaxInput(), filingStatus: fs, wages: d.w2Wages, businessIncome: d.businessIncome };
    const baseR = calculateTax(baseInput);
    const hsaInput: TaxInput = { ...defaultTaxInput(), filingStatus: fs, wages: d.w2Wages, businessIncome: d.businessIncome, hsaDeduction: hsaTotal };
    const hsaR = calculateTax(hsaInput);
    const hsaSave = baseR.totalTax - hsaR.totalTax;

    // HSA as stealth retirement account: invest and grow
    const hsaGrowth10yr = hsaTotal * ((Math.pow(1.07, 10) - 1) / 0.07); // annuity FV
    const taxFreeMedical = hsaTotal * 10 * 0.3; // 30% of contributions used for medical

    if (hsaSave > 200) {
      results.push({
        id: "hsa_optimization",
        title: "HSA Triple Tax Advantage",
        subtitle: `${formatUSD(hsaTotal)}/year · ${(marginalRate * 100).toFixed(0)}% bracket · Tax-free growth`,
        personalNote: `The HSA is the only account in the tax code with a triple tax advantage: deductible going in, grows tax-free, and comes out tax-free for medical. At the ${(marginalRate * 100).toFixed(0)}% bracket, contributing ${formatUSD(hsaTotal)} saves ${formatUSD(hsaSave)}/year in taxes immediately — plus you build a medical emergency fund.`,
        icon: "Heart", color: "#0EA5E9", applicable: true,
        confidenceLevel: "medium",
        dataSource: "Profile income + filing status. Requires HDHP enrollment.",
        armA: {
          label: "No HSA Contributions", shortLabel: "No HSA",
          totalTax: Math.round(baseR.totalTax),
          details: [
            { label: "Taxable Income", value: Math.round(baseR.taxableIncome) },
            { label: "Total Tax", value: Math.round(baseR.totalTax) },
            { label: "Medical Fund", value: 0 },
          ],
          highlights: [`Current tax: ${formatUSD(baseR.totalTax)}`, "No tax-advantaged medical savings"],
          warnings: [`Missing ${formatUSD(hsaSave)}/year in tax deductions`, "Medical expenses paid with after-tax dollars"],
        },
        armB: {
          label: `Max HSA (${formatUSD(hsaTotal)}/yr)`, shortLabel: "Max HSA",
          totalTax: Math.round(hsaR.totalTax),
          details: [
            { label: "HSA Contribution", value: hsaTotal },
            { label: "Tax Savings", value: Math.round(hsaSave), isSavings: true },
            { label: "Total Tax", value: Math.round(hsaR.totalTax) },
            { label: "10-Year HSA Balance", value: Math.round(hsaGrowth10yr) },
          ],
          highlights: [
            `Immediate tax savings: ${formatUSD(hsaSave)}/year`,
            "No income tax on contributions",
            "No tax on investment growth",
            "No tax on qualified medical withdrawals",
            `10-year invested balance: ~${formatUSD(hsaGrowth10yr)}`,
          ],
          warnings: [
            "Requires High Deductible Health Plan (HDHP)",
            "2025 HDHP min deductible: $1,650 (self) / $3,300 (family)",
            "Non-medical withdrawals before 65 subject to 20% penalty + tax",
          ],
        },
        annualSavings: Math.round(hsaSave), fiveYearSavings: Math.round(hsaSave * 5),
        recommendation: "Max HSA",
        reason: `Contributing ${formatUSD(hsaTotal)}/year to an HSA saves ${formatUSD(hsaSave)}/year in taxes at the ${(marginalRate * 100).toFixed(0)}% bracket. Over 10 years (invested at 7%), you build a ~${formatUSD(hsaGrowth10yr)} tax-free medical fund. After 65, it functions as an additional retirement account (medical withdrawals remain tax-free; other withdrawals taxed like a Traditional IRA — no penalty).`,
        projections: Array.from({ length: 5 }, (_, i) => ({
          year: i + 1,
          armA: Math.round(baseR.totalTax * (i + 1)),
          armB: Math.round(hsaR.totalTax * (i + 1)),
          delta: Math.round(hsaSave * (i + 1)),
        })),
        bars: [
          { label: "Tax Savings", armA: 0, armB: Math.round(hsaSave) },
          { label: "Annual Contribution", armA: 0, armB: hsaTotal },
          { label: "Total Tax", armA: Math.round(baseR.totalTax), armB: Math.round(hsaR.totalTax) },
        ],
        disclaimers: [
          `* HSA limit: ${formatUSD(hsaMax)} (${fs === "mfj" || fs === "qss" ? "family" : "self-only"}) for 2025. $1,000 catch-up if 55+.`,
          "** Must be enrolled in a qualifying HDHP. Not compatible with FSA (except limited-purpose).",
          "*** After age 65, non-medical HSA withdrawals taxed as ordinary income (no penalty).",
        ],
      });
    }
  }

  // Sort: applicable first, then by annual savings (highest first)
  return results.sort((a, b) => {
    if (a.applicable !== b.applicable) return a.applicable ? -1 : 1;
    return b.annualSavings - a.annualSavings;
  });
}

// Re-export
export { formatUSD, formatPercent };

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------
const KEY = "agfintax_scenarios";
export interface SavedScenario { id: string; results: ScenarioResult[]; createdAt: string; }
export function saveScenarios(results: ScenarioResult[]): void {
  if (typeof window === "undefined") return;
  const s: SavedScenario = { id: crypto.randomUUID(), results, createdAt: new Date().toISOString() };
  localStorage.setItem(KEY, JSON.stringify(s));
}
