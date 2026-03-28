export interface TaxProfile {
  income: number;
  filingStatus: "single" | "married_jointly" | "married_separately" | "head_of_household";
  entityType: "individual" | "sole_proprietor" | "llc" | "s_corp" | "c_corp" | "partnership";
  hasRealEstate: boolean;
  hasBusinessIncome: boolean;
  businessIncome?: number;
  realEstateValue?: number;
  hasInvestments: boolean;
  investmentGains?: number;
  state?: string;
}

export interface TaxBracketResult {
  marginalRate: number;
  effectiveRate: number;
  totalTax: number;
  bracket: string;
}

export interface SavingsEstimate {
  strategy: string;
  estimatedSavings: number;
  description: string;
}

// 2025 Federal Tax Brackets - Married Filing Jointly
const MFJ_BRACKETS = [
  { min: 0, max: 23_850, rate: 0.10 },
  { min: 23_850, max: 96_950, rate: 0.12 },
  { min: 96_950, max: 206_700, rate: 0.22 },
  { min: 206_700, max: 394_600, rate: 0.24 },
  { min: 394_600, max: 501_050, rate: 0.32 },
  { min: 501_050, max: 751_600, rate: 0.35 },
  { min: 751_600, max: Infinity, rate: 0.37 },
];

// 2025 Federal Tax Brackets - Single
const SINGLE_BRACKETS = [
  { min: 0, max: 11_925, rate: 0.10 },
  { min: 11_925, max: 48_475, rate: 0.12 },
  { min: 48_475, max: 103_350, rate: 0.22 },
  { min: 103_350, max: 197_300, rate: 0.24 },
  { min: 197_300, max: 250_525, rate: 0.32 },
  { min: 250_525, max: 626_350, rate: 0.35 },
  { min: 626_350, max: Infinity, rate: 0.37 },
];

// 2025 Federal Tax Brackets - Head of Household
const HOH_BRACKETS = [
  { min: 0, max: 17_000, rate: 0.10 },
  { min: 17_000, max: 64_850, rate: 0.12 },
  { min: 64_850, max: 103_350, rate: 0.22 },
  { min: 103_350, max: 197_300, rate: 0.24 },
  { min: 197_300, max: 250_500, rate: 0.32 },
  { min: 250_500, max: 626_350, rate: 0.35 },
  { min: 626_350, max: Infinity, rate: 0.37 },
];

// Standard deductions for 2025
const STANDARD_DEDUCTIONS: Record<string, number> = {
  single: 15_000,
  married_jointly: 30_000,
  married_separately: 15_000,
  head_of_household: 22_500,
};

function getBrackets(filingStatus: string) {
  switch (filingStatus) {
    case "married_jointly":
      return MFJ_BRACKETS;
    case "married_separately":
      // Married separately brackets are half of MFJ
      return MFJ_BRACKETS.map((b) => ({
        min: Math.round(b.min / 2),
        max: b.max === Infinity ? Infinity : Math.round(b.max / 2),
        rate: b.rate,
      }));
    case "head_of_household":
      return HOH_BRACKETS;
    case "single":
    default:
      return SINGLE_BRACKETS;
  }
}

function calculateTaxFromBrackets(
  taxableIncome: number,
  brackets: { min: number; max: number; rate: number }[]
): number {
  let tax = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break;
    const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
    tax += taxableInBracket * bracket.rate;
  }
  return tax;
}

export function calculateTaxBracket(
  income: number,
  filingStatus: string
): TaxBracketResult {
  const brackets = getBrackets(filingStatus);
  const standardDeduction = STANDARD_DEDUCTIONS[filingStatus] || 15_000;
  const taxableIncome = Math.max(0, income - standardDeduction);

  const totalTax = calculateTaxFromBrackets(taxableIncome, brackets);

  // Find marginal bracket
  let marginalRate = 0.10;
  for (const bracket of brackets) {
    if (taxableIncome > bracket.min) {
      marginalRate = bracket.rate;
    }
  }

  const effectiveRate = income > 0 ? totalTax / income : 0;

  return {
    marginalRate,
    effectiveRate: Math.round(effectiveRate * 10000) / 10000,
    totalTax: Math.round(totalTax),
    bracket: `${(marginalRate * 100).toFixed(0)}%`,
  };
}

/**
 * Estimate savings from the Section 199A QBI deduction.
 * Deduction is 20% of qualified business income, limited by taxable income.
 */
export function estimateQBISavings(
  qualifiedIncome: number,
  marginalRate?: number
): number {
  const rate = marginalRate || 0.24;
  const qbiDeduction = qualifiedIncome * 0.20;
  // Cap the deduction at a reasonable amount
  const cappedDeduction = Math.min(qbiDeduction, qualifiedIncome);
  return Math.round(cappedDeduction * rate);
}

/**
 * Estimate savings from accelerated depreciation (cost segregation + bonus depreciation).
 * Assumes ~30% of property value can be reclassified to shorter-lived assets.
 */
export function estimateDepreciationSavings(
  propertyValue: number,
  years: number = 1,
  marginalRate?: number
): number {
  const rate = marginalRate || 0.32;

  // Standard straight-line depreciation for the year (residential: 27.5 years, commercial: 39 years)
  const avgLife = 33.25; // blended average
  const standardAnnualDeduction = propertyValue / avgLife;
  const standardDeduction = standardAnnualDeduction * years;

  // Cost segregation: ~30% reclassified to 5/7/15-year property
  // With 100% bonus depreciation, these are fully deducted in year 1
  const reclassifiedPortion = propertyValue * 0.30;
  const acceleratedFirstYear = reclassifiedPortion; // 100% bonus depreciation
  const remainingStandardAnnual = (propertyValue * 0.70) / avgLife;

  // Total accelerated deduction over the period
  const acceleratedDeduction =
    years === 1
      ? acceleratedFirstYear + remainingStandardAnnual
      : acceleratedFirstYear + remainingStandardAnnual * years;

  const additionalDeduction = acceleratedDeduction - standardDeduction;
  return Math.round(Math.max(0, additionalDeduction * rate));
}

/**
 * Estimate savings from S-Corp election (self-employment tax reduction).
 * Assumes reasonable salary of ~60% of net income, saving SE tax on distribution portion.
 */
export function estimateSCorpSavings(netIncome: number): number {
  if (netIncome <= 50_000) return 0; // Not beneficial below ~$50K

  // Self-employment tax rate: 15.3% (12.4% SS + 2.9% Medicare)
  // SS cap for 2025: $176,100
  const SE_TAX_RATE = 0.153;
  const MEDICARE_RATE = 0.029;
  const SS_CAP = 176_100;

  // Current SE tax (as sole proprietor)
  const seIncome = netIncome * 0.9235; // 92.35% of net SE income
  const ssTax = Math.min(seIncome, SS_CAP) * 0.124;
  const medicareTax = seIncome * MEDICARE_RATE;
  const currentSETax = ssTax + medicareTax;

  // S-Corp: reasonable salary at ~60% of net income (min $40K for most roles)
  const reasonableSalary = Math.max(40_000, Math.min(netIncome * 0.60, netIncome));
  const sCorpSSTax = Math.min(reasonableSalary, SS_CAP) * 0.124;
  const sCorpMedicareTax = reasonableSalary * MEDICARE_RATE;
  const sCorpSETax = sCorpSSTax + sCorpMedicareTax;

  // Additional S-Corp costs (payroll, compliance ~$2,000-$3,000/year)
  const sCorpOverhead = 2_500;

  const savings = currentSETax - sCorpSETax - sCorpOverhead;
  return Math.round(Math.max(0, savings));
}

/**
 * Calculate total potential tax savings based on a comprehensive profile.
 */
export function calculateTotalPotentialSavings(
  profile: TaxProfile
): {
  totalEstimatedSavings: number;
  strategies: SavingsEstimate[];
  currentTax: TaxBracketResult;
} {
  const currentTax = calculateTaxBracket(profile.income, profile.filingStatus);
  const strategies: SavingsEstimate[] = [];

  // QBI Deduction (for pass-through business income)
  if (
    profile.hasBusinessIncome &&
    profile.businessIncome &&
    profile.entityType !== "c_corp" &&
    profile.entityType !== "individual"
  ) {
    const qbiSavings = estimateQBISavings(
      profile.businessIncome,
      currentTax.marginalRate
    );
    if (qbiSavings > 0) {
      strategies.push({
        strategy: "Section 199A QBI Deduction",
        estimatedSavings: qbiSavings,
        description: `20% deduction on $${profile.businessIncome.toLocaleString()} of qualified business income`,
      });
    }
  }

  // S-Corp Election Savings
  if (
    profile.hasBusinessIncome &&
    profile.businessIncome &&
    (profile.entityType === "sole_proprietor" || profile.entityType === "llc") &&
    profile.businessIncome > 50_000
  ) {
    const sCorpSavings = estimateSCorpSavings(profile.businessIncome);
    if (sCorpSavings > 0) {
      strategies.push({
        strategy: "S-Corp Election",
        estimatedSavings: sCorpSavings,
        description:
          "Reduce self-employment tax by splitting income into salary and distributions",
      });
    }
  }

  // Real Estate Depreciation
  if (profile.hasRealEstate && profile.realEstateValue) {
    const depreciationSavings = estimateDepreciationSavings(
      profile.realEstateValue,
      1,
      currentTax.marginalRate
    );
    if (depreciationSavings > 0) {
      strategies.push({
        strategy: "Cost Segregation + Bonus Depreciation",
        estimatedSavings: depreciationSavings,
        description: `Accelerated depreciation on $${profile.realEstateValue.toLocaleString()} property value`,
      });
    }
  }

  // Retirement Contribution Savings
  if (profile.income > 50_000) {
    const maxContribution =
      profile.entityType === "sole_proprietor" ||
      profile.entityType === "llc" ||
      profile.entityType === "s_corp"
        ? 69_000 // Solo 401(k) max for 2025
        : 23_500; // Employee 401(k) max for 2025
    const retirementSavings = Math.round(
      maxContribution * currentTax.marginalRate
    );
    strategies.push({
      strategy: "Maximize Retirement Contributions",
      estimatedSavings: retirementSavings,
      description: `Tax-deferred contributions up to $${maxContribution.toLocaleString()} via Solo 401(k) or employer plan`,
    });
  }

  // HSA Savings
  const hsaLimit = profile.filingStatus === "single" ? 4_350 : 8_750;
  const hsaSavings = Math.round(hsaLimit * currentTax.marginalRate);
  strategies.push({
    strategy: "HSA Triple Tax Advantage",
    estimatedSavings: hsaSavings,
    description: `Tax-deductible HSA contributions up to $${hsaLimit.toLocaleString()}`,
  });

  // Tax-Loss Harvesting (if has investments)
  if (profile.hasInvestments && profile.investmentGains) {
    // Estimate harvesting can offset 30-50% of gains
    const harvestableAmount = profile.investmentGains * 0.35;
    const capitalGainsRate =
      profile.income > 533_400 ? 0.20 : profile.income > 48_350 ? 0.15 : 0;
    const tlhSavings = Math.round(harvestableAmount * capitalGainsRate);
    if (tlhSavings > 0) {
      strategies.push({
        strategy: "Tax-Loss Harvesting",
        estimatedSavings: tlhSavings,
        description: `Offset capital gains by strategically realizing investment losses`,
      });
    }
  }

  // SALT PTE Workaround (for business owners in high-tax states)
  if (
    profile.hasBusinessIncome &&
    profile.businessIncome &&
    profile.businessIncome > 100_000 &&
    (profile.entityType === "s_corp" ||
      profile.entityType === "llc" ||
      profile.entityType === "partnership")
  ) {
    // Estimate ~5% state tax rate on business income above the SALT cap
    const stateRate = 0.05;
    const saltSavings = Math.round(
      Math.min(profile.businessIncome * stateRate, 40_000) *
        currentTax.marginalRate
    );
    if (saltSavings > 0) {
      strategies.push({
        strategy: "SALT Cap PTE Workaround",
        estimatedSavings: saltSavings,
        description:
          "Bypass SALT deduction cap through pass-through entity state tax election",
      });
    }
  }

  // Augusta Rule (for business owners)
  if (
    profile.hasBusinessIncome &&
    (profile.entityType === "s_corp" ||
      profile.entityType === "llc" ||
      profile.entityType === "c_corp")
  ) {
    // 14 days at fair market rate (~$500-$2,000/day depending on area)
    const dailyRate = Math.min(1_500, Math.max(500, profile.income / 365));
    const augustaSavings = Math.round(14 * dailyRate * currentTax.marginalRate);
    strategies.push({
      strategy: "Augusta Rule (Section 280A)",
      estimatedSavings: augustaSavings,
      description:
        "Rent your home to your business for up to 14 days tax-free",
    });
  }

  const totalEstimatedSavings = strategies.reduce(
    (sum, s) => sum + s.estimatedSavings,
    0
  );

  return {
    totalEstimatedSavings,
    strategies: strategies.sort((a, b) => b.estimatedSavings - a.estimatedSavings),
    currentTax,
  };
}
