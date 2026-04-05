// =============================================================================
// Deterministic Savings Calculator — Math-Based Strategy Savings
// =============================================================================
// Uses actual qualification answers (dollar amounts) + profile data to compute
// precise, verifiable tax savings for each qualified strategy.
// The AI only personalizes descriptions; numbers come from THIS calculator.
// =============================================================================

import type { ClientProfileV2 } from './qualification-engine-v2';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
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

export interface CalculatedSavings {
  strategyId: string;
  estimatedSavings: number;
  savingsMin: number;
  savingsMax: number;
  calculation: string;       // Human-readable formula explanation
  inputs: Record<string, string | number | boolean>;  // The actual numbers used
}

// ---------------------------------------------------------------------------
// 2025 Federal Tax Brackets
// ---------------------------------------------------------------------------
const MFJ_BRACKETS = [
  { min: 0, max: 23_850, rate: 0.10 },
  { min: 23_850, max: 96_950, rate: 0.12 },
  { min: 96_950, max: 206_700, rate: 0.22 },
  { min: 206_700, max: 394_600, rate: 0.24 },
  { min: 394_600, max: 501_050, rate: 0.32 },
  { min: 501_050, max: 751_600, rate: 0.35 },
  { min: 751_600, max: Infinity, rate: 0.37 },
];

const SINGLE_BRACKETS = [
  { min: 0, max: 11_925, rate: 0.10 },
  { min: 11_925, max: 48_475, rate: 0.12 },
  { min: 48_475, max: 103_350, rate: 0.22 },
  { min: 103_350, max: 197_300, rate: 0.24 },
  { min: 197_300, max: 250_525, rate: 0.32 },
  { min: 250_525, max: 626_350, rate: 0.35 },
  { min: 626_350, max: Infinity, rate: 0.37 },
];

const HOH_BRACKETS = [
  { min: 0, max: 17_000, rate: 0.10 },
  { min: 17_000, max: 64_850, rate: 0.12 },
  { min: 64_850, max: 103_350, rate: 0.22 },
  { min: 103_350, max: 197_300, rate: 0.24 },
  { min: 197_300, max: 250_500, rate: 0.32 },
  { min: 250_500, max: 626_350, rate: 0.35 },
  { min: 626_350, max: Infinity, rate: 0.37 },
];

const STANDARD_DEDUCTIONS: Record<string, number> = {
  single: 15_000,
  married_jointly: 30_000,
  married_separately: 15_000,
  head_of_household: 22_500,
};

// ---------------------------------------------------------------------------
// Bracket Calculation Utilities
// ---------------------------------------------------------------------------
function getBrackets(filingStatus: string) {
  switch (filingStatus) {
    case "married_jointly":
      return MFJ_BRACKETS;
    case "married_separately":
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

/** Get marginal rate as percentage (e.g., 35) */
export function getMarginalRate(income: number, filingStatus: string): number {
  return Math.round(calculateTaxBracket(income, filingStatus).marginalRate * 100);
}

/** Get 2025 long-term capital gains rate as percentage */
function getLTCGRate(income: number, filingStatus: string): number {
  if (filingStatus === 'married_jointly' || filingStatus === 'married filing jointly') {
    if (income >= 583750) return 20;
    if (income >= 96700) return 15;
    return 0;
  }
  if (income >= 518900) return 20;
  if (income >= 48350) return 15;
  return 0;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse a currency/number answer into a numeric value */
function parseAmount(answer: string | undefined): number {
  if (!answer) return 0;
  const cleaned = answer.replace(/[$,\s]/g, '').replace(/k$/i, '000').replace(/m$/i, '000000');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num);
}

// ---------------------------------------------------------------------------
// Per-Strategy Calculation Functions
// ---------------------------------------------------------------------------

function calcTraditional401k(
  answers: Record<string, string>,
  profile: ClientProfileV2,
  marginalRate: number
): CalculatedSavings {
  const age50 = answers['age-401k'] === 'yes' || profile.age >= 50;
  const maxContribution = age50 ? 31000 : 23500;
  const isMFJ = profile.filingStatus === 'married_jointly';
  const currentContribution = parseAmount(answers['current-401k-contribution-amount']);

  // If no current contribution info, assume contributing ~50% of max (conservative default)
  const effectiveCurrent = currentContribution > 0 ? currentContribution : Math.round(maxContribution * 0.5);
  const perPersonGap = Math.max(0, maxContribution - effectiveCurrent);
  const totalGap = perPersonGap;
  const totalMax = isMFJ ? perPersonGap * 2 : perPersonGap;

  const savings = Math.round(totalGap * (marginalRate / 100));
  const savingsMin = Math.round(savings * 0.6);
  const savingsMax = Math.round(totalMax * (marginalRate / 100));

  const calcText = effectiveCurrent > 0
    ? `$${maxContribution.toLocaleString()} max − $${effectiveCurrent.toLocaleString()} current = $${totalGap.toLocaleString()} gap × ${marginalRate}% = $${savings.toLocaleString()}${isMFJ ? ' (per earner; up to $' + savingsMax.toLocaleString() + ' if both spouses contribute)' : ''}`
    : `$${maxContribution.toLocaleString()} max × ${marginalRate}% = $${savings.toLocaleString()}`;

  return {
    strategyId: 'traditional-401k',
    estimatedSavings: savings,
    savingsMin,
    savingsMax,
    calculation: calcText,
    inputs: { maxContribution, currentContribution: effectiveCurrent, totalGap, marginalRate, age50, isMFJ },
  };
}

function calcChildTaxCredit(
  _answers: Record<string, string>,
  profile: ClientProfileV2,
): CalculatedSavings {
  const dependents = profile.dependents || 0;
  const threshold = profile.filingStatus === 'married_jointly' ? 400000 : 200000;
  const creditPerChild = 2000;
  const fullCredit = dependents * creditPerChild;

  let phaseOutReduction = 0;
  if (profile.annualIncome > threshold) {
    const excess = Math.ceil((profile.annualIncome - threshold) / 1000) * 50;
    phaseOutReduction = Math.min(excess, fullCredit);
  }

  const savings = Math.max(0, fullCredit - phaseOutReduction);

  return {
    strategyId: 'child-tax-credit',
    estimatedSavings: savings,
    savingsMin: savings,
    savingsMax: savings,
    calculation: `${dependents} children × $2,000/child = $${fullCredit.toLocaleString()}${phaseOutReduction > 0 ? ` − $${phaseOutReduction.toLocaleString()} phase-out` : ''} = $${savings.toLocaleString()} (dollar-for-dollar credit)`,
    inputs: { dependents, creditPerChild, threshold, phaseOutReduction, income: profile.annualIncome },
  };
}

function calcDependentCareCredit(
  answers: Record<string, string>,
  profile: ClientProfileV2,
): CalculatedSavings {
  const expenses = parseAmount(answers['dependent-care-expenses']);
  const dependents = profile.dependents || 0;
  const maxEligible = dependents >= 2 ? 6000 : 3000;
  const eligibleExpenses = Math.min(expenses || maxEligible, maxEligible);

  // Credit rate: 35% at AGI <= $15K, decreasing 1% per $2K, min 20% at AGI >= $43K
  let creditRate = 20;
  if (profile.annualIncome <= 15000) creditRate = 35;
  else if (profile.annualIncome <= 43000) creditRate = Math.max(20, 35 - Math.floor((profile.annualIncome - 15000) / 2000));

  const savings = Math.round(eligibleExpenses * (creditRate / 100));

  return {
    strategyId: 'dependent-care-credit',
    estimatedSavings: savings,
    savingsMin: Math.round(savings * 0.5),
    savingsMax: savings,
    calculation: `min($${(expenses || 0).toLocaleString()} expenses, $${maxEligible.toLocaleString()} max) × ${creditRate}% credit rate = $${savings.toLocaleString()}`,
    inputs: { expenses, maxEligible, eligibleExpenses, creditRate, dependents },
  };
}

function calcTaxLossHarvesting(
  answers: Record<string, string>,
  profile: ClientProfileV2,
  marginalRate: number
): CalculatedSavings {
  const harvestableAmount = parseAmount(answers['harvestable-loss-amount']);
  const capitalGains = parseAmount(answers['capital-gains-amount']);

  let losses = harvestableAmount;
  if (losses === 0 && answers['investment-losses'] === 'yes') {
    losses = 3000; // Conservative default: max ordinary income offset
  }

  const gainsOffset = Math.min(losses, capitalGains);
  const ordinaryOffset = Math.min(losses - gainsOffset, 3000);

  const ltcgRate = getLTCGRate(profile.annualIncome, profile.filingStatus);
  const savingsFromGains = Math.round(gainsOffset * (ltcgRate / 100));
  const savingsFromOrdinary = Math.round(ordinaryOffset * (marginalRate / 100));
  const savings = savingsFromGains + savingsFromOrdinary;

  const savingsMin = Math.round(savings * 0.7);
  const savingsMax = Math.round(savings * 1.3);

  return {
    strategyId: 'tax-loss-harvesting',
    estimatedSavings: savings || Math.round(3000 * (marginalRate / 100)), // At minimum, $3K ordinary offset
    savingsMin: savingsMin || Math.round(1000 * (marginalRate / 100)),
    savingsMax: savingsMax || Math.round(10000 * (marginalRate / 100)),
    calculation: losses > 0
      ? `$${gainsOffset.toLocaleString()} gains offset × ${ltcgRate}% + $${ordinaryOffset.toLocaleString()} ordinary offset × ${marginalRate}% = $${savings.toLocaleString()}`
      : `Conservative estimate: $3,000 ordinary income offset × ${marginalRate}% = $${Math.round(3000 * (marginalRate / 100)).toLocaleString()}`,
    inputs: { harvestableAmount, capitalGains, gainsOffset, ordinaryOffset, ltcgRate, marginalRate },
  };
}

function calcItemizedDeductions(
  answers: Record<string, string>,
  profile: ClientProfileV2,
  marginalRate: number
): CalculatedSavings {
  // Smart defaults for high-income profiles: estimate typical deduction amounts
  const saltAmount = parseAmount(answers['salt-amount']) || (profile.annualIncome > 150000 ? Math.min(Math.round(profile.annualIncome * 0.04), 40000) : 0);
  const mortgageInterest = parseAmount(answers['mortgage-interest-amount']) || (profile.annualIncome > 150000 ? Math.round(profile.annualIncome * 0.03) : 0);
  const charityAmount = parseAmount(answers['annual-giving-amount']) || parseAmount(answers['annual-charity-amount']) || Math.round(profile.annualIncome * 0.02);
  const medicalExpenses = parseAmount(answers['anticipated-medical-expenses']);

  const medicalThreshold = Math.round(profile.annualIncome * 0.075);
  const medicalDeduction = Math.max(0, medicalExpenses - medicalThreshold);

  const saltCap = profile.filingStatus === 'married_jointly' ? 40000 : 10000;
  const saltDeduction = Math.min(saltAmount || 0, saltCap);

  const totalItemized = saltDeduction + mortgageInterest + charityAmount + medicalDeduction;
  const standardDeduction = STANDARD_DEDUCTIONS[profile.filingStatus] || 15000;
  const benefit = Math.max(0, totalItemized - standardDeduction);
  const savings = Math.round(benefit * (marginalRate / 100));

  return {
    strategyId: 'itemized-deductions',
    estimatedSavings: savings,
    savingsMin: Math.round(savings * 0.5),
    savingsMax: savings,
    calculation: `Itemized ($${totalItemized.toLocaleString()}) − Standard ($${standardDeduction.toLocaleString()}) = $${benefit.toLocaleString()} excess × ${marginalRate}% = $${savings.toLocaleString()}`,
    inputs: { saltDeduction, mortgageInterest, charityAmount, medicalDeduction, totalItemized, standardDeduction, benefit },
  };
}

function calcCharitableContribution(
  answers: Record<string, string>,
  profile: ClientProfileV2,
  marginalRate: number
): CalculatedSavings {
  // Smart default: if no amount provided, estimate ~3% of income for charitable giving
  const givingAmount = parseAmount(answers['annual-giving-amount']) || Math.round(profile.annualIncome * 0.03);

  // Check if they actually itemize — charitable deduction only helps if itemized > standard deduction
  const saltAmount = parseAmount(answers['salt-amount']);
  const mortgageInterest = parseAmount(answers['mortgage-interest-amount']);
  const saltCap = profile.filingStatus === 'married_jointly' ? 40000 : 10000;
  const saltDeduction = Math.min(saltAmount || 0, saltCap);
  const totalItemized = saltDeduction + mortgageInterest + givingAmount;
  const standardDeduction = STANDARD_DEDUCTIONS[profile.filingStatus] || 15000;

  // If they don't itemize, charitable giving provides $0 incremental tax benefit
  // (unless they use the above-the-line $300 deduction, which expired)
  if (totalItemized <= standardDeduction) {
    return {
      strategyId: 'charitable-contribution-optimization',
      estimatedSavings: 0,
      savingsMin: 0,
      savingsMax: Math.round(givingAmount * (marginalRate / 100)),
      calculation: `Itemized total ($${totalItemized.toLocaleString()}) ≤ standard deduction ($${standardDeduction.toLocaleString()}) → $0 incremental benefit. Consider bunching via DAF to exceed standard deduction.`,
      inputs: { givingAmount, marginalRate, totalItemized, standardDeduction },
    };
  }

  // They DO itemize — charitable deduction provides incremental benefit
  const savings = Math.round(givingAmount * (marginalRate / 100));
  return {
    strategyId: 'charitable-contribution-optimization',
    estimatedSavings: savings,
    savingsMin: Math.round(savings * 0.5),
    savingsMax: savings,
    calculation: `$${givingAmount.toLocaleString()} charitable giving × ${marginalRate}% marginal rate = $${savings.toLocaleString()} (itemizing exceeds standard deduction)`,
    inputs: { givingAmount, marginalRate, totalItemized, standardDeduction },
  };
}

function calcDonorAdvisedFund(
  answers: Record<string, string>,
  profile: ClientProfileV2,
  marginalRate: number
): CalculatedSavings {
  const annualCharity = parseAmount(answers['annual-charity-amount']) || parseAmount(answers['annual-giving-amount']) || Math.round(profile.annualIncome * 0.03);
  const initialContribution = parseAmount(answers['initial-daf-contribution']);

  const bunchingYears = 2;
  const bunchedAmount = initialContribution || (annualCharity * bunchingYears);
  const standardDeduction = STANDARD_DEDUCTIONS[profile.filingStatus] || 15000;

  const bunchYear = Math.max(0, bunchedAmount - standardDeduction) * (marginalRate / 100);
  const spreadYearBenefit = bunchingYears * Math.max(0, annualCharity - standardDeduction) * (marginalRate / 100);
  const netBenefit = Math.round(Math.max(0, bunchYear - spreadYearBenefit));

  return {
    strategyId: 'donor-advised-fund',
    estimatedSavings: netBenefit,
    savingsMin: Math.round(netBenefit * 0.5),
    savingsMax: netBenefit,
    calculation: `Bunching ${bunchingYears}yr × $${annualCharity.toLocaleString()}/yr = $${bunchedAmount.toLocaleString()} → excess × ${marginalRate}% = $${netBenefit.toLocaleString()} net`,
    inputs: { annualCharity, bunchedAmount, bunchingYears, standardDeduction, marginalRate },
  };
}

function calcHSA(
  answers: Record<string, string>,
  _profile: ClientProfileV2,
  marginalRate: number
): CalculatedSavings {
  const age55 = answers['age-55-hsa'] === 'yes';
  const dependentsCovered = answers['hdhp-dependents-covered'];
  const isFamily = dependentsCovered && dependentsCovered !== 'none' && dependentsCovered !== '0' && dependentsCovered !== 'self only';

  const baseLimit = isFamily ? 8750 : 4350;
  const catchUp = age55 ? 1000 : 0;
  const maxContribution = baseLimit + catchUp;

  const savings = Math.round(maxContribution * (marginalRate / 100));

  return {
    strategyId: 'health-savings-account',
    estimatedSavings: savings,
    savingsMin: savings,
    savingsMax: Math.round(savings * 1.2),
    calculation: `$${maxContribution.toLocaleString()} max HSA${catchUp > 0 ? ' (incl. $1,000 catch-up)' : ''} × ${marginalRate}% = $${savings.toLocaleString()}`,
    inputs: { baseLimit, catchUp, maxContribution, isFamily, age55, marginalRate },
  };
}

function calcRothConversion(): CalculatedSavings {
  return {
    strategyId: 'roth-conversion',
    estimatedSavings: 0,
    savingsMin: 0,
    savingsMax: 0,
    calculation: 'No immediate tax savings — future tax-free growth benefit',
    inputs: { note: 'Long-term strategy' },
  };
}

function calcRoth401k(): CalculatedSavings {
  return {
    strategyId: 'roth-401k',
    estimatedSavings: 0,
    savingsMin: 0,
    savingsMax: 0,
    calculation: 'No immediate tax savings — after-tax contributions grow tax-free',
    inputs: { note: 'Long-term strategy' },
  };
}

function calcSelfDirectedRetirement(): CalculatedSavings {
  return {
    strategyId: 'self-directed-retirement',
    estimatedSavings: 0,
    savingsMin: 0,
    savingsMax: 0,
    calculation: 'No separate current-year tax reduction beyond normal retirement account rules',
    inputs: { note: 'Alternative investment vehicle within existing accounts' },
  };
}

function calcQualifiedOpportunityZone(
  answers: Record<string, string>,
  profile: ClientProfileV2,
): CalculatedSavings {
  const capitalGains = parseAmount(answers['capital-gains-amount-qoz']);
  const ltcgRate = getLTCGRate(profile.annualIncome, profile.filingStatus);
  const deferredTax = Math.round(capitalGains * (ltcgRate / 100));

  return {
    strategyId: 'qualified-opportunity-zone',
    estimatedSavings: 0,
    savingsMin: 0,
    savingsMax: 0,
    calculation: capitalGains > 0
      ? `$${capitalGains.toLocaleString()} gains × ${ltcgRate}% = $${deferredTax.toLocaleString()} deferred (long-term benefit)`
      : 'Minimal current gains — long-term strategy',
    inputs: { capitalGains, ltcgRate, deferredTax },
  };
}

function calcHomeSaleExclusion(
  answers: Record<string, string>,
  profile: ClientProfileV2,
): CalculatedSavings {
  const gain = parseAmount(answers['home-gain-amount']);
  const exclusion = profile.filingStatus === 'married_jointly' ? 500000 : 250000;
  const excludedGain = Math.min(gain, exclusion);
  const ltcgRate = getLTCGRate(profile.annualIncome, profile.filingStatus);
  const savings = Math.round(excludedGain * (ltcgRate / 100));

  return {
    strategyId: 'home-sale-gain-exclusion',
    estimatedSavings: savings,
    savingsMin: savings,
    savingsMax: savings,
    calculation: `$${excludedGain.toLocaleString()} excluded gain × ${ltcgRate}% = $${savings.toLocaleString()}`,
    inputs: { gain, exclusion, excludedGain, ltcgRate },
  };
}

function calcSelfEmployedHealthInsurance(
  answers: Record<string, string>,
  _profile: ClientProfileV2,
  marginalRate: number
): CalculatedSavings {
  // Smart default: $12,000/yr avg health insurance premium for self-employed
  const premiums = parseAmount(answers['premium-expense-se']) || 12000;
  const savings = Math.round(premiums * (marginalRate / 100));

  return {
    strategyId: 'self-employed-health-insurance',
    estimatedSavings: savings,
    savingsMin: savings,
    savingsMax: savings,
    calculation: `$${premiums.toLocaleString()} premiums × ${marginalRate}% = $${savings.toLocaleString()}`,
    inputs: { premiums, marginalRate },
  };
}

function calcCoverdellESA(
  _answers: Record<string, string>,
  profile: ClientProfileV2,
): CalculatedSavings {
  const dependents = profile.dependents || 0;
  return {
    strategyId: 'coverdell-esa',
    estimatedSavings: 0,
    savingsMin: 0,
    savingsMax: 0,
    calculation: 'Coverdell contributions are not tax-deductible — tax-free growth benefit only',
    inputs: { maxPerBeneficiary: 2000, dependents },
  };
}

function calcQCD(
  answers: Record<string, string>,
  _profile: ClientProfileV2,
  marginalRate: number
): CalculatedSavings {
  const qcdAmount = parseAmount(answers['qcd-annual-amount']);
  const maxQCD = 105000;
  const actualQCD = Math.min(qcdAmount || 0, maxQCD);
  const savings = Math.round(actualQCD * (marginalRate / 100));

  return {
    strategyId: 'qualified-charitable-distribution',
    estimatedSavings: savings,
    savingsMin: savings,
    savingsMax: savings,
    calculation: `$${actualQCD.toLocaleString()} QCD × ${marginalRate}% = $${savings.toLocaleString()}`,
    inputs: { qcdAmount, maxQCD, actualQCD, marginalRate },
  };
}

function calcConservationEasement(
  answers: Record<string, string>,
  profile: ClientProfileV2,
  marginalRate: number
): CalculatedSavings {
  const easementValue = parseAmount(answers['property-fmv']);
  const maxDeduction = Math.round(profile.annualIncome * 0.5);
  const deduction = Math.min(easementValue, maxDeduction);
  const savings = Math.round(deduction * (marginalRate / 100));

  return {
    strategyId: 'conservation-easements-individual',
    estimatedSavings: savings,
    savingsMin: savings,
    savingsMax: savings,
    calculation: `$${deduction.toLocaleString()} deduction × ${marginalRate}% = $${savings.toLocaleString()}`,
    inputs: { easementValue, maxDeduction, deduction, marginalRate },
  };
}

// Kept for backward compatibility with scenario-engine and other callers
function calcSimple401k(
  answers: Record<string, string>,
  profile: ClientProfileV2,
  marginalRate: number
): CalculatedSavings {
  const age50 = answers['age-simple-401k'] === 'yes' || (profile.age >= 50);
  const maxContribution = age50 ? 19500 : 16000; // SIMPLE 401(k) limits 2025
  const savings = Math.round(maxContribution * (marginalRate / 100));
  return {
    strategyId: 'simple-401k',
    estimatedSavings: savings,
    savingsMin: savings,
    savingsMax: savings,
    calculation: `$${maxContribution.toLocaleString()} max SIMPLE 401(k) × ${marginalRate}% = $${savings.toLocaleString()}`,
    inputs: { maxContribution, marginalRate, age50 },
  };
}

function calcSimpleIRA(
  answers: Record<string, string>,
  profile: ClientProfileV2,
  marginalRate: number
): CalculatedSavings {
  const age50 = answers['age-simple-ira'] === 'yes' || (profile.age >= 50);
  const maxContribution = age50 ? 19500 : 16000;
  const savings = Math.round(maxContribution * (marginalRate / 100));
  return {
    strategyId: 'simple-ira',
    estimatedSavings: savings,
    savingsMin: savings,
    savingsMax: savings,
    calculation: `$${maxContribution.toLocaleString()} max SIMPLE IRA × ${marginalRate}% = $${savings.toLocaleString()}`,
    inputs: { maxContribution, marginalRate, age50 },
  };
}

function calcSolo401k(
  answers: Record<string, string>,
  profile: ClientProfileV2,
  marginalRate: number
): CalculatedSavings {
  const age50 = profile.age >= 50;
  const employeeDeferral = age50 ? 31000 : 23500;
  // Employer profit sharing: up to 25% of net SE income, capped at total limit of $70,000 (2025)
  const netSE = parseAmount(answers['net-se-income']) || profile.annualIncome;
  const employerContrib = Math.min(Math.round(netSE * 0.25), 70000 - employeeDeferral);
  const totalContrib = employeeDeferral + Math.max(0, employerContrib);
  const savings = Math.round(totalContrib * (marginalRate / 100));
  return {
    strategyId: 'solo-401k',
    estimatedSavings: savings,
    savingsMin: Math.round(employeeDeferral * (marginalRate / 100)),
    savingsMax: savings,
    calculation: `$${employeeDeferral.toLocaleString()} deferral + $${Math.max(0, employerContrib).toLocaleString()} profit sharing × ${marginalRate}% = $${savings.toLocaleString()}`,
    inputs: { employeeDeferral, employerContrib, totalContrib, marginalRate },
  };
}

function calcDeferredCompensation(
  answers: Record<string, string>,
  profile: ClientProfileV2,
  marginalRate: number
): CalculatedSavings {
  // Smart default: estimate ~10% of income for deferral if no amount provided
  const deferredAmount = parseAmount(answers['annual-deferral-amount']) || Math.round(profile.annualIncome * 0.10);
  const savings = Math.round(deferredAmount * (marginalRate / 100));
  return {
    strategyId: 'deferred-compensation-individual',
    estimatedSavings: savings,
    savingsMin: savings,
    savingsMax: savings,
    calculation: `$${deferredAmount.toLocaleString()} deferred × ${marginalRate}% = $${savings.toLocaleString()}`,
    inputs: { deferredAmount, marginalRate },
  };
}

function calcPrivateFoundation(
  answers: Record<string, string>,
  profile: ClientProfileV2,
  marginalRate: number
): CalculatedSavings {
  const contribution = parseAmount(answers['annual-charitable-goal']);
  const maxDeduction = Math.round(profile.annualIncome * 0.3); // 30% AGI limit for PF
  const deduction = Math.min(contribution, maxDeduction);
  const savings = Math.round(deduction * (marginalRate / 100));
  return {
    strategyId: 'private-foundation',
    estimatedSavings: savings,
    savingsMin: savings,
    savingsMax: savings,
    calculation: `$${deduction.toLocaleString()} deduction × ${marginalRate}% = $${savings.toLocaleString()}`,
    inputs: { contribution, maxDeduction, deduction, marginalRate },
  };
}

// ---------------------------------------------------------------------------
// Strategy Calculator Registry
// ---------------------------------------------------------------------------
const CALCULATORS: Record<string, (answers: Record<string, string>, profile: ClientProfileV2, marginalRate: number) => CalculatedSavings> = {
  'traditional-401k': calcTraditional401k,
  'solo-401k': calcSolo401k,
  'roth-401k': calcRoth401k,
  'simple-401k': calcSimple401k,
  'simple-ira': calcSimpleIRA,
  'self-directed-retirement': calcSelfDirectedRetirement,
  'health-savings-account': calcHSA,
  'deferred-compensation-individual': calcDeferredCompensation,
  'donor-advised-fund': calcDonorAdvisedFund,
  'qualified-charitable-distribution': calcQCD,
  'private-foundation': calcPrivateFoundation,
  'coverdell-esa': calcCoverdellESA,
  'qualified-opportunity-zone': calcQualifiedOpportunityZone,
  'child-tax-credit': calcChildTaxCredit,
  'dependent-care-credit': calcDependentCareCredit,
  'tax-loss-harvesting': calcTaxLossHarvesting,
  'home-sale-gain-exclusion': calcHomeSaleExclusion,
  'conservation-easements-individual': calcConservationEasement,
  'itemized-deductions': calcItemizedDeductions,
  'self-employed-health-insurance': calcSelfEmployedHealthInsurance,
  'roth-conversion': calcRothConversion,
  'charitable-contribution-optimization': calcCharitableContribution,
};

// ---------------------------------------------------------------------------
// Main Entry Points
// ---------------------------------------------------------------------------

/**
 * Calculate savings for all qualified strategies using actual qualification answers.
 * Returns a map of strategyId -> CalculatedSavings.
 */
export function calculateAllSavings(
  qualifiedStrategyIds: string[],
  answers: Record<string, string>,
  profile: ClientProfileV2
): Map<string, CalculatedSavings> {
  const marginalRate = getMarginalRate(profile.annualIncome, profile.filingStatus);
  const results = new Map<string, CalculatedSavings>();

  for (const strategyId of qualifiedStrategyIds) {
    const calculator = CALCULATORS[strategyId];
    if (calculator) {
      results.set(strategyId, calculator(answers, profile, marginalRate));
    }
  }

  return results;
}

/**
 * Format qualification answers as a readable summary for the AI prompt.
 * Includes both yes/no answers AND dollar amounts for context.
 */
export function formatAnswersForAI(answers: Record<string, string>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(answers)) {
    if (!value) continue;
    const label = key.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    lines.push(`- ${label}: ${value}`);
  }
  return lines.length > 0 ? lines.join('\n') : 'No specific answers collected';
}

// ---------------------------------------------------------------------------
// Backward-compatible exports (used by scenario-engine, etc.)
// ---------------------------------------------------------------------------
export function estimateQBISavings(
  qualifiedIncome: number,
  marginalRate?: number
): number {
  const rate = marginalRate || 0.24;
  const qbiDeduction = qualifiedIncome * 0.20;
  const cappedDeduction = Math.min(qbiDeduction, qualifiedIncome);
  return Math.round(cappedDeduction * rate);
}

export function estimateDepreciationSavings(
  propertyValue: number,
  years: number = 1,
  marginalRate?: number
): number {
  const rate = marginalRate || 0.32;
  const avgLife = 33.25;
  const standardAnnualDeduction = propertyValue / avgLife;
  const standardDeduction = standardAnnualDeduction * years;

  const reclassifiedPortion = propertyValue * 0.30;
  const acceleratedFirstYear = reclassifiedPortion;
  const remainingStandardAnnual = (propertyValue * 0.70) / avgLife;

  const acceleratedDeduction =
    years === 1
      ? acceleratedFirstYear + remainingStandardAnnual
      : acceleratedFirstYear + remainingStandardAnnual * years;

  const additionalDeduction = acceleratedDeduction - standardDeduction;
  return Math.round(Math.max(0, additionalDeduction * rate));
}

export function estimateSCorpSavings(netIncome: number): number {
  if (netIncome <= 50_000) return 0;

  const MEDICARE_RATE = 0.029;
  const SS_CAP = 176_100;

  const seIncome = netIncome * 0.9235;
  const ssTax = Math.min(seIncome, SS_CAP) * 0.124;
  const medicareTax = seIncome * MEDICARE_RATE;
  const currentSETax = ssTax + medicareTax;

  const reasonableSalary = Math.max(40_000, Math.min(netIncome * 0.60, netIncome));
  const sCorpSSTax = Math.min(reasonableSalary, SS_CAP) * 0.124;
  const sCorpMedicareTax = reasonableSalary * MEDICARE_RATE;
  const sCorpSETax = sCorpSSTax + sCorpMedicareTax;

  const sCorpOverhead = 2_500;
  const savings = currentSETax - sCorpSETax - sCorpOverhead;
  return Math.round(Math.max(0, savings));
}

export function calculateTotalPotentialSavings(
  profile: TaxProfile
): {
  totalEstimatedSavings: number;
  strategies: SavingsEstimate[];
  currentTax: TaxBracketResult;
} {
  const currentTax = calculateTaxBracket(profile.income, profile.filingStatus);
  const strategies: SavingsEstimate[] = [];

  if (
    profile.hasBusinessIncome &&
    profile.businessIncome &&
    profile.entityType !== "c_corp" &&
    profile.entityType !== "individual"
  ) {
    const qbiSavings = estimateQBISavings(profile.businessIncome, currentTax.marginalRate);
    if (qbiSavings > 0) {
      strategies.push({
        strategy: "Section 199A QBI Deduction",
        estimatedSavings: qbiSavings,
        description: `20% deduction on $${profile.businessIncome.toLocaleString()} of qualified business income`,
      });
    }
  }

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
        description: "Reduce self-employment tax by splitting income into salary and distributions",
      });
    }
  }

  if (profile.hasRealEstate && profile.realEstateValue) {
    const depreciationSavings = estimateDepreciationSavings(profile.realEstateValue, 1, currentTax.marginalRate);
    if (depreciationSavings > 0) {
      strategies.push({
        strategy: "Cost Segregation + Bonus Depreciation",
        estimatedSavings: depreciationSavings,
        description: `Accelerated depreciation on $${profile.realEstateValue.toLocaleString()} property value`,
      });
    }
  }

  if (profile.income > 50_000) {
    const maxContribution =
      profile.entityType === "sole_proprietor" || profile.entityType === "llc" || profile.entityType === "s_corp"
        ? 69_000
        : 23_500;
    const retirementSavings = Math.round(maxContribution * currentTax.marginalRate);
    strategies.push({
      strategy: "Maximize Retirement Contributions",
      estimatedSavings: retirementSavings,
      description: `Tax-deferred contributions up to $${maxContribution.toLocaleString()} via Solo 401(k) or employer plan`,
    });
  }

  const hsaLimit = profile.filingStatus === "single" ? 4_350 : 8_750;
  const hsaSavings = Math.round(hsaLimit * currentTax.marginalRate);
  strategies.push({
    strategy: "HSA Triple Tax Advantage",
    estimatedSavings: hsaSavings,
    description: `Tax-deductible HSA contributions up to $${hsaLimit.toLocaleString()}`,
  });

  if (profile.hasInvestments && profile.investmentGains) {
    const harvestableAmount = profile.investmentGains * 0.35;
    const capitalGainsRate = profile.income > 533_400 ? 0.20 : profile.income > 48_350 ? 0.15 : 0;
    const tlhSavings = Math.round(harvestableAmount * capitalGainsRate);
    if (tlhSavings > 0) {
      strategies.push({
        strategy: "Tax-Loss Harvesting",
        estimatedSavings: tlhSavings,
        description: "Offset capital gains by strategically realizing investment losses",
      });
    }
  }

  const totalEstimatedSavings = strategies.reduce((sum, s) => sum + s.estimatedSavings, 0);

  return {
    totalEstimatedSavings,
    strategies: strategies.sort((a, b) => b.estimatedSavings - a.estimatedSavings),
    currentTax,
  };
}
