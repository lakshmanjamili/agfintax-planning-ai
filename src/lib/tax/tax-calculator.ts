// =============================================================================
// 1040 Tax Estimator Engine — 2025 Tax Year
// Based on Rev. Proc. 2024-40 and OBBB 2025 changes
// =============================================================================

export type FilingStatus = "single" | "mfj" | "mfs" | "hoh" | "qss";

export const FILING_STATUS_OPTIONS: { id: FilingStatus; label: string; description: string }[] = [
  { id: "single", label: "Single", description: "Unmarried or legally separated" },
  { id: "mfj", label: "Married Filing Jointly", description: "Married, filing one return together" },
  { id: "mfs", label: "Married Filing Separately", description: "Married, each filing own return" },
  { id: "hoh", label: "Head of Household", description: "Unmarried, paying 50%+ of household costs" },
  { id: "qss", label: "Qualifying Surviving Spouse", description: "Spouse died within past 2 years" },
];

// ---------------------------------------------------------------------------
// 2025 Federal Income Tax Brackets
// ---------------------------------------------------------------------------
interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

const BRACKETS_2025: Record<FilingStatus, TaxBracket[]> = {
  single: [
    { min: 0, max: 11925, rate: 0.10 },
    { min: 11925, max: 48475, rate: 0.12 },
    { min: 48475, max: 103350, rate: 0.22 },
    { min: 103350, max: 197300, rate: 0.24 },
    { min: 197300, max: 250525, rate: 0.32 },
    { min: 250525, max: 626350, rate: 0.35 },
    { min: 626350, max: Infinity, rate: 0.37 },
  ],
  mfj: [
    { min: 0, max: 23850, rate: 0.10 },
    { min: 23850, max: 96950, rate: 0.12 },
    { min: 96950, max: 206700, rate: 0.22 },
    { min: 206700, max: 394600, rate: 0.24 },
    { min: 394600, max: 501050, rate: 0.32 },
    { min: 501050, max: 751600, rate: 0.35 },
    { min: 751600, max: Infinity, rate: 0.37 },
  ],
  mfs: [
    { min: 0, max: 11925, rate: 0.10 },
    { min: 11925, max: 48475, rate: 0.12 },
    { min: 48475, max: 103350, rate: 0.22 },
    { min: 103350, max: 197300, rate: 0.24 },
    { min: 197300, max: 250525, rate: 0.32 },
    { min: 250525, max: 375800, rate: 0.35 },
    { min: 375800, max: Infinity, rate: 0.37 },
  ],
  hoh: [
    { min: 0, max: 17000, rate: 0.10 },
    { min: 17000, max: 64850, rate: 0.12 },
    { min: 64850, max: 103350, rate: 0.22 },
    { min: 103350, max: 197300, rate: 0.24 },
    { min: 197300, max: 250500, rate: 0.32 },
    { min: 250500, max: 626350, rate: 0.35 },
    { min: 626350, max: Infinity, rate: 0.37 },
  ],
  qss: [
    { min: 0, max: 23850, rate: 0.10 },
    { min: 23850, max: 96950, rate: 0.12 },
    { min: 96950, max: 206700, rate: 0.22 },
    { min: 206700, max: 394600, rate: 0.24 },
    { min: 394600, max: 501050, rate: 0.32 },
    { min: 501050, max: 751600, rate: 0.35 },
    { min: 751600, max: Infinity, rate: 0.37 },
  ],
};

// ---------------------------------------------------------------------------
// Standard Deductions 2025 (with OBBB increases)
// ---------------------------------------------------------------------------
const STANDARD_DEDUCTION_2025: Record<FilingStatus, number> = {
  single: 15750,
  mfj: 31500,
  mfs: 15750,
  hoh: 23625,
  qss: 31500,
};

// ---------------------------------------------------------------------------
// Long-term Capital Gains Brackets 2025
// ---------------------------------------------------------------------------
const LTCG_BRACKETS_2025: Record<FilingStatus, { zero: number; fifteen: number }> = {
  single: { zero: 48350, fifteen: 533400 },
  mfj: { zero: 96700, fifteen: 600050 },
  mfs: { zero: 48350, fifteen: 300000 },
  hoh: { zero: 64750, fifteen: 566700 },
  qss: { zero: 96700, fifteen: 600050 },
};

// ---------------------------------------------------------------------------
// Social Security tax threshold 2025
// ---------------------------------------------------------------------------
const SS_WAGE_BASE_2025 = 176100;
const SS_RATE = 0.124; // combined employee+employer for SE
const MEDICARE_RATE = 0.029;
const SE_ADJUSTMENT = 0.9235;

// ---------------------------------------------------------------------------
// Child Tax Credit 2025
// ---------------------------------------------------------------------------
const CTC_AMOUNT_2025 = 2200;
const CTC_OTHER_DEPENDENT = 500;
const CTC_PHASEOUT: Record<FilingStatus, number> = {
  single: 200000,
  mfj: 400000,
  mfs: 200000,
  hoh: 200000,
  qss: 200000,
};

// ---------------------------------------------------------------------------
// Input & Output Types
// ---------------------------------------------------------------------------
export interface TaxInput {
  filingStatus: FilingStatus;
  // Dependents
  qualifyingChildren: number;      // under 17, for CTC
  otherDependents: number;         // for other dependent credit
  // Income
  wages: number;                   // W-2 box 1
  spouseWages: number;             // spouse W-2 (for MFJ)
  businessIncome: number;          // Schedule C net profit
  shortTermGains: number;
  longTermGains: number;
  taxableInterest: number;
  ordinaryDividends: number;
  qualifiedDividends: number;
  rentalIncome: number;            // Schedule E
  retirementDistributions: number; // taxable IRA/401k distributions
  socialSecurityBenefits: number;
  otherIncome: number;
  // Adjustments
  hsaDeduction: number;
  iraDeduction: number;
  studentLoanInterest: number;
  seHealthInsurance: number;
  retirementContributions: number; // SEP/SIMPLE/qualified plans
  otherAdjustments: number;
  // Deductions
  useItemized: boolean;
  medicalExpenses: number;
  stateLocalTaxes: number;         // SALT
  mortgageInterest: number;
  charitableCash: number;
  charitableNonCash: number;
  otherItemized: number;
  // Credits
  childCareCreditExpenses: number;
  educationCredits: number;
  energyCredits: number;
  otherCredits: number;
  // Payments
  federalWithheld: number;
  estimatedPayments: number;
  // QBI
  qbiDeduction: number;
}

export interface TaxResult {
  // Income
  totalWages: number;
  totalBusinessIncome: number;
  totalInvestmentIncome: number;
  totalOtherIncome: number;
  grossIncome: number;
  // Adjustments
  halfSETax: number;
  totalAdjustments: number;
  agi: number;
  // Deductions
  standardDeduction: number;
  itemizedDeduction: number;
  deductionUsed: "standard" | "itemized";
  deductionAmount: number;
  // Taxable Income
  taxableIncome: number;
  // Tax Calculation
  ordinaryIncomeTax: number;
  ltcgTax: number;
  totalIncomeTax: number;
  // Self-employment tax
  selfEmploymentTax: number;
  // Credits
  childTaxCredit: number;
  otherDependentCredit: number;
  childCareCredit: number;
  totalCredits: number;
  // Final
  taxAfterCredits: number;
  totalTax: number;              // includes SE tax, NIIT, etc.
  totalPayments: number;
  additionalChildTaxCredit: number;
  refundOrOwed: number;          // positive = refund, negative = owed
  effectiveRate: number;         // as decimal
  marginalRate: number;          // top bracket rate
  // Bracket breakdown
  bracketBreakdown: { rate: number; amount: number; tax: number }[];
}

// ---------------------------------------------------------------------------
// Calculator
// ---------------------------------------------------------------------------
export function calculateTax(input: TaxInput): TaxResult {
  const fs = input.filingStatus;

  // ---- Total Income ----
  const totalWages = input.wages + (fs === "mfj" ? input.spouseWages : 0);
  const totalBusinessIncome = input.businessIncome;
  const totalInvestmentIncome =
    input.taxableInterest +
    input.ordinaryDividends +
    input.shortTermGains +
    input.longTermGains +
    input.rentalIncome;
  const totalOtherIncome =
    input.retirementDistributions +
    input.otherIncome;

  // Social Security taxable portion (simplified: 85% if income > base)
  let taxableSS = 0;
  if (input.socialSecurityBenefits > 0) {
    const ssBase = fs === "mfj" ? 32000 : fs === "mfs" ? 0 : 25000;
    const provisionalIncome =
      totalWages + totalBusinessIncome + totalInvestmentIncome + totalOtherIncome +
      input.socialSecurityBenefits * 0.5;
    if (provisionalIncome > ssBase) {
      taxableSS = Math.min(input.socialSecurityBenefits * 0.85, input.socialSecurityBenefits);
    }
  }

  const grossIncome =
    totalWages + totalBusinessIncome + totalInvestmentIncome + totalOtherIncome + taxableSS;

  // ---- Self-Employment Tax ----
  let selfEmploymentTax = 0;
  let halfSETax = 0;
  if (totalBusinessIncome > 400) {
    const seIncome = totalBusinessIncome * SE_ADJUSTMENT;
    const ssTax = Math.min(seIncome, Math.max(0, SS_WAGE_BASE_2025 - totalWages)) * SS_RATE;
    const medicareTax = seIncome * MEDICARE_RATE;
    selfEmploymentTax = ssTax + medicareTax;
    halfSETax = selfEmploymentTax / 2;
  }

  // ---- Adjustments ----
  const totalAdjustments =
    halfSETax +
    input.hsaDeduction +
    input.iraDeduction +
    Math.min(input.studentLoanInterest, 2500) +
    input.seHealthInsurance +
    input.retirementContributions +
    input.otherAdjustments;

  const agi = Math.max(0, grossIncome - totalAdjustments);

  // ---- Deductions ----
  const standardDeduction = STANDARD_DEDUCTION_2025[fs];

  // Itemized deduction calculation
  const medicalDeduction = Math.max(0, input.medicalExpenses - agi * 0.075);
  const saltCap = fs === "mfs" ? 20000 : 40000;
  const saltDeduction = Math.min(input.stateLocalTaxes, saltCap);
  const totalCharity = input.charitableCash + input.charitableNonCash;
  const charityLimit = agi * 0.6;
  const charityDeduction = Math.min(totalCharity, charityLimit);
  const itemizedDeduction =
    medicalDeduction + saltDeduction + input.mortgageInterest + charityDeduction + input.otherItemized;

  const useItemized = input.useItemized || itemizedDeduction > standardDeduction;
  const deductionAmount = useItemized ? itemizedDeduction : standardDeduction;

  // ---- Taxable Income ----
  const taxableIncome = Math.max(0, agi - deductionAmount - input.qbiDeduction);

  // ---- Tax Calculation ----
  // Separate ordinary income from preferential income (qualified dividends + LTCG)
  const preferentialIncome = Math.min(
    input.qualifiedDividends + Math.max(0, input.longTermGains),
    taxableIncome
  );
  const ordinaryTaxableIncome = Math.max(0, taxableIncome - preferentialIncome);

  // Calculate ordinary income tax with bracket breakdown
  const brackets = BRACKETS_2025[fs];
  const bracketBreakdown: { rate: number; amount: number; tax: number }[] = [];
  let ordinaryIncomeTax = 0;
  let marginalRate = 0.10;

  let remaining = ordinaryTaxableIncome;
  for (const bracket of brackets) {
    if (remaining <= 0) break;
    const bracketWidth = bracket.max - bracket.min;
    const taxableInBracket = Math.min(remaining, bracketWidth);
    const taxInBracket = taxableInBracket * bracket.rate;
    if (taxableInBracket > 0) {
      bracketBreakdown.push({ rate: bracket.rate, amount: taxableInBracket, tax: taxInBracket });
      marginalRate = bracket.rate;
    }
    ordinaryIncomeTax += taxInBracket;
    remaining -= taxableInBracket;
  }

  // Calculate LTCG/qualified dividend tax
  let ltcgTax = 0;
  if (preferentialIncome > 0) {
    const ltcgBrackets = LTCG_BRACKETS_2025[fs];
    // The 0% bracket applies up to the threshold minus ordinary taxable income
    const zeroSpaceLeft = Math.max(0, ltcgBrackets.zero - ordinaryTaxableIncome);
    const fifteenSpaceLeft = Math.max(0, ltcgBrackets.fifteen - ordinaryTaxableIncome);

    const at0 = Math.min(preferentialIncome, zeroSpaceLeft);
    const at15 = Math.min(preferentialIncome - at0, fifteenSpaceLeft - zeroSpaceLeft);
    const at20 = Math.max(0, preferentialIncome - at0 - at15);

    ltcgTax = at0 * 0 + at15 * 0.15 + at20 * 0.20;
  }

  const totalIncomeTax = ordinaryIncomeTax + ltcgTax;

  // ---- Credits ----
  // Child Tax Credit
  let childTaxCredit = 0;
  const ctcPhaseout = CTC_PHASEOUT[fs];
  if (input.qualifyingChildren > 0) {
    const rawCTC = input.qualifyingChildren * CTC_AMOUNT_2025;
    const phaseoutReduction = Math.max(0, Math.floor((agi - ctcPhaseout) / 1000)) * 50;
    childTaxCredit = Math.max(0, rawCTC - phaseoutReduction);
  }

  // Other dependent credit
  let otherDependentCredit = 0;
  if (input.otherDependents > 0) {
    const rawODC = input.otherDependents * CTC_OTHER_DEPENDENT;
    const phaseoutReduction = Math.max(0, Math.floor((agi - ctcPhaseout) / 1000)) * 50;
    otherDependentCredit = Math.max(0, rawODC - phaseoutReduction);
  }

  // Child and Dependent Care Credit (simplified)
  let childCareCredit = 0;
  if (input.childCareCreditExpenses > 0) {
    const maxExpenses = input.qualifyingChildren >= 2 ? 6000 : 3000;
    const eligibleExpenses = Math.min(input.childCareCreditExpenses, maxExpenses);
    let creditRate = 0.20; // default
    if (agi <= 125000) creditRate = 0.35;
    else if (agi <= 185000) creditRate = 0.20 + (185000 - agi) / 60000 * 0.15;
    if (agi > 438000) creditRate = 0;
    childCareCredit = Math.round(eligibleExpenses * creditRate);
  }

  const totalNonRefundableCredits =
    childTaxCredit + otherDependentCredit + childCareCredit +
    input.educationCredits + input.energyCredits + input.otherCredits;

  const taxAfterCredits = Math.max(0, totalIncomeTax - totalNonRefundableCredits);

  // Total tax (income tax after credits + SE tax)
  const totalTax = taxAfterCredits + selfEmploymentTax;

  // ---- Payments & Refund ----
  // Additional (refundable) child tax credit — simplified
  const additionalChildTaxCredit = Math.min(
    Math.max(0, (input.qualifyingChildren * CTC_AMOUNT_2025) - childTaxCredit),
    input.qualifyingChildren * 1700
  );

  const totalPayments = input.federalWithheld + input.estimatedPayments + additionalChildTaxCredit;
  const refundOrOwed = totalPayments - totalTax;

  const effectiveRate = grossIncome > 0 ? totalTax / grossIncome : 0;

  return {
    totalWages,
    totalBusinessIncome,
    totalInvestmentIncome,
    totalOtherIncome,
    grossIncome,
    halfSETax,
    totalAdjustments,
    agi,
    standardDeduction,
    itemizedDeduction,
    deductionUsed: useItemized ? "itemized" : "standard",
    deductionAmount,
    taxableIncome,
    ordinaryIncomeTax,
    ltcgTax,
    totalIncomeTax,
    selfEmploymentTax,
    childTaxCredit,
    otherDependentCredit,
    childCareCredit,
    totalCredits: totalNonRefundableCredits,
    taxAfterCredits,
    totalTax,
    totalPayments,
    additionalChildTaxCredit,
    refundOrOwed,
    effectiveRate,
    marginalRate,
    bracketBreakdown,
  };
}

// ---------------------------------------------------------------------------
// Default Input
// ---------------------------------------------------------------------------
export function defaultTaxInput(): TaxInput {
  return {
    filingStatus: "single",
    qualifyingChildren: 0,
    otherDependents: 0,
    wages: 0,
    spouseWages: 0,
    businessIncome: 0,
    shortTermGains: 0,
    longTermGains: 0,
    taxableInterest: 0,
    ordinaryDividends: 0,
    qualifiedDividends: 0,
    rentalIncome: 0,
    retirementDistributions: 0,
    socialSecurityBenefits: 0,
    otherIncome: 0,
    hsaDeduction: 0,
    iraDeduction: 0,
    studentLoanInterest: 0,
    seHealthInsurance: 0,
    retirementContributions: 0,
    otherAdjustments: 0,
    useItemized: false,
    medicalExpenses: 0,
    stateLocalTaxes: 0,
    mortgageInterest: 0,
    charitableCash: 0,
    charitableNonCash: 0,
    otherItemized: 0,
    childCareCreditExpenses: 0,
    educationCredits: 0,
    energyCredits: 0,
    otherCredits: 0,
    federalWithheld: 0,
    estimatedPayments: 0,
    qbiDeduction: 0,
  };
}

// ---------------------------------------------------------------------------
// Format Helpers
// ---------------------------------------------------------------------------
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}
