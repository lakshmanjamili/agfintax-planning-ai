// =============================================================================
// Smart Plan Tax Strategies — Based on Corvee 2024 Tax Strategies Masterclass
// =============================================================================

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface StrategyCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export interface MasterStrategy {
  id: string;
  title: string;
  category:
    | "retirement"
    | "compensation"
    | "deductions"
    | "family"
    | "real_estate"
    | "depreciation"
    | "credits"
    | "medical"
    | "education"
    | "entity"
    | "charity"
    | "business_ops";
  description: string;
  eligibilityCriteria: string[];
  implementationSteps: string[];
  taxFiling: string;
  ircReference: string;
  applicableTo: string[];
  incomeThreshold?: { min?: number; max?: number };
  savingsFormula: string;
  typicalSavingsRange: { min: number; max: number };
  qualificationQuestions: string[];
  riskLevel: "low" | "medium" | "high";
  timeToImplement: string;
}

export interface SmartPlanQuestion {
  key: string;
  text: string;
  subtext?: string;
  buttons?: string[];
  freeText?: boolean;
  showSkip?: boolean;
  strategiesUnlocked: string[];
}

// -----------------------------------------------------------------------------
// Strategy Categories
// -----------------------------------------------------------------------------

export const STRATEGY_CATEGORIES: StrategyCategory[] = [
  { id: "retirement", label: "Retirement", icon: "PiggyBank", color: "#4f46e5" },
  { id: "compensation", label: "Compensation", icon: "Banknote", color: "#0891b2" },
  { id: "deductions", label: "Deductions", icon: "Receipt", color: "#16a34a" },
  { id: "family", label: "Family", icon: "Users", color: "#d946ef" },
  { id: "real_estate", label: "Real Estate", icon: "Building2", color: "#ea580c" },
  { id: "depreciation", label: "Depreciation", icon: "TrendingDown", color: "#ca8a04" },
  { id: "credits", label: "Credits", icon: "BadgeDollarSign", color: "#dc2626" },
  { id: "medical", label: "Medical", icon: "HeartPulse", color: "#e11d48" },
  { id: "education", label: "Education", icon: "GraduationCap", color: "#7c3aed" },
  { id: "entity", label: "Entity Structure", icon: "Landmark", color: "#0d9488" },
  { id: "charity", label: "Charity", icon: "Heart", color: "#be185d" },
  { id: "business_ops", label: "Business Operations", icon: "Briefcase", color: "#475569" },
];

// -----------------------------------------------------------------------------
// Master Strategies (~30 strategies from Corvee 2024 Masterclass)
// -----------------------------------------------------------------------------

export const MASTER_STRATEGIES: MasterStrategy[] = [
  // ===========================================================================
  // RETIREMENT (5)
  // ===========================================================================
  {
    id: "traditional_401k_max",
    title: "Traditional 401(k) Maximization",
    category: "retirement",
    description:
      "Maximize pre-tax 401(k) contributions to reduce current-year taxable income. The 2024 employee deferral limit is $23,500 ($31,000 if age 50+). Contributions grow tax-deferred until withdrawal in retirement, when income and therefore the tax rate are typically lower.",
    eligibilityCriteria: [
      "Employee of a company that offers a 401(k) plan, or self-employed with a Solo 401(k)",
      "Earned income at least equal to the contribution amount",
      "Under the annual deferral limit ($23,500 / $31,000 catch-up)",
    ],
    implementationSteps: [
      "Review current 401(k) contribution rate with payroll or plan administrator",
      "Increase deferral percentage to reach the $23,500 annual limit",
      "If age 50+, add the $7,500 catch-up contribution",
      "Evaluate employer match and ensure contributions capture the full match",
      "Confirm investments align with retirement timeline and risk tolerance",
    ],
    taxFiling: "Reported on Form W-2 Box 12 Code D; reduces Box 1 taxable wages. Not separately claimed on Form 1040.",
    ircReference: "IRC Section 401(k); IRC Section 402(g) (deferral limits)",
    applicableTo: ["individual", "s_corp", "c_corp", "partnership"],
    incomeThreshold: { min: 50000 },
    savingsFormula: "contribution_amount * marginal_tax_rate",
    typicalSavingsRange: { min: 4700, max: 12400 },
    qualificationQuestions: [
      "Does your employer offer a 401(k) plan?",
      "Are you currently contributing the maximum allowed?",
      "Are you age 50 or older (catch-up eligible)?",
    ],
    riskLevel: "low",
    timeToImplement: "1-2 weeks",
  },
  {
    id: "roth_401k_strategy",
    title: "Roth 401(k) Strategy",
    category: "retirement",
    description:
      "Contribute after-tax dollars to a Roth 401(k) for tax-free growth and tax-free qualified withdrawals in retirement. This is optimal when your current tax rate is lower than your expected retirement tax rate, or for tax diversification alongside traditional accounts.",
    eligibilityCriteria: [
      "Employer plan offers a Roth 401(k) option",
      "Earned income sufficient to cover contributions",
      "Expect to be in the same or higher tax bracket in retirement",
    ],
    implementationSteps: [
      "Confirm Roth 401(k) availability with plan administrator",
      "Evaluate current vs. projected retirement tax bracket",
      "Designate all or a portion of deferrals as Roth contributions",
      "Continue capturing employer match (employer match is always pre-tax)",
      "Consider splitting contributions between traditional and Roth for diversification",
    ],
    taxFiling:
      "Reported on Form W-2 Box 12 Code AA. Contributions do NOT reduce Box 1 taxable wages. Qualified distributions are tax-free.",
    ircReference: "IRC Section 402A",
    applicableTo: ["individual", "s_corp", "c_corp", "partnership"],
    incomeThreshold: { min: 50000 },
    savingsFormula: "projected_retirement_withdrawals * (retirement_rate - current_rate)",
    typicalSavingsRange: { min: 3000, max: 15000 },
    qualificationQuestions: [
      "Does your employer offer a Roth 401(k) option?",
      "Do you expect your tax rate to be the same or higher in retirement?",
      "Do you want tax diversification across retirement accounts?",
    ],
    riskLevel: "low",
    timeToImplement: "1-2 weeks",
  },
  {
    id: "cash_balance_plan",
    title: "Cash Balance Pension Plan",
    category: "retirement",
    description:
      "A defined-benefit plan that allows high-income business owners and professionals to contribute $200,000+ per year on a tax-deductible basis, far exceeding 401(k) limits. The plan provides a guaranteed annual return credit and is ideal for those over 40 with consistent high income.",
    eligibilityCriteria: [
      "Business owner, partner, or self-employed professional",
      "Consistent high income ($250,000+) expected for at least 5-7 years",
      "Willing to fund contributions for all eligible employees (if any)",
      "Typically age 40+ to maximize contribution limits (actuarially determined)",
    ],
    implementationSteps: [
      "Engage a third-party actuary to design the plan and calculate contributions",
      "Adopt the plan document before the fiscal year end",
      "Often paired with a 401(k) profit-sharing plan for maximum deferral",
      "Make required annual contributions (mandatory once established)",
      "File Form 5500 annually; maintain plan compliance",
    ],
    taxFiling:
      "Employer deduction on Schedule C (sole prop), Form 1120-S (S-Corp), or Form 1065 (partnership). Reported on Form 5500 annually.",
    ircReference: "IRC Section 401(a); IRC Section 404(a)(1) (deduction limits for defined-benefit plans)",
    applicableTo: ["sole_prop", "s_corp", "c_corp", "partnership"],
    incomeThreshold: { min: 250000 },
    savingsFormula: "annual_contribution * marginal_tax_rate",
    typicalSavingsRange: { min: 50000, max: 100000 },
    qualificationQuestions: [
      "Is your annual income consistently above $250,000?",
      "Are you a business owner or self-employed professional?",
      "Are you age 40 or older?",
      "Can you commit to funding the plan for at least 5 years?",
    ],
    riskLevel: "medium",
    timeToImplement: "2-3 months",
  },
  {
    id: "sep_ira",
    title: "SEP IRA",
    category: "retirement",
    description:
      "Simplified Employee Pension IRA allows self-employed individuals and small business owners to contribute up to 25% of net self-employment income (or compensation), with a maximum of $69,000 for 2024. Easy to set up and fund, with no annual filing requirements.",
    eligibilityCriteria: [
      "Self-employed or business owner with few or no employees",
      "If employees exist, must contribute the same percentage for all eligible employees",
      "Earned income from self-employment or business compensation",
    ],
    implementationSteps: [
      "Open a SEP IRA account at a brokerage or financial institution",
      "Complete IRS Form 5305-SEP (plan adoption agreement)",
      "Calculate 25% of net self-employment income (after the SE tax deduction)",
      "Make contributions by the tax filing deadline (including extensions)",
      "No annual Form 5500 filing required",
    ],
    taxFiling:
      "Deducted on Schedule 1 (Form 1040), Line 16. Reduces AGI directly. Reported as employer contribution.",
    ircReference: "IRC Section 408(k)",
    applicableTo: ["sole_prop", "s_corp", "c_corp", "partnership"],
    incomeThreshold: { min: 50000 },
    savingsFormula: "min(net_income * 0.25, 69000) * marginal_tax_rate",
    typicalSavingsRange: { min: 5000, max: 25000 },
    qualificationQuestions: [
      "Are you self-employed or a small business owner?",
      "Do you have employees (other than yourself)?",
      "Do you currently have a retirement plan?",
    ],
    riskLevel: "low",
    timeToImplement: "1-2 weeks",
  },
  {
    id: "solo_401k",
    title: "Solo 401(k)",
    category: "retirement",
    description:
      "Designed for self-employed individuals with no full-time employees. Combines employee deferrals ($23,500) with employer profit-sharing (25% of compensation), allowing total contributions up to $69,000 ($76,500 if 50+). Offers both traditional and Roth options.",
    eligibilityCriteria: [
      "Self-employed with no full-time W-2 employees (spouse can participate)",
      "Earned income from the business",
      "Plan must be established by December 31 of the tax year",
    ],
    implementationSteps: [
      "Establish the Solo 401(k) plan with a provider by December 31",
      "Make employee deferral contributions ($23,500 / $31,000 catch-up) by December 31",
      "Make employer profit-sharing contributions (25% of compensation) by tax filing deadline",
      "Choose traditional, Roth, or split contributions",
      "File Form 5500-EZ if plan assets exceed $250,000",
    ],
    taxFiling:
      "Employee deferrals reduce self-employment income. Employer contributions deducted on Schedule C or Form 1120-S. Form 5500-EZ when assets exceed $250,000.",
    ircReference: "IRC Section 401(k); Revenue Ruling 2004-12",
    applicableTo: ["sole_prop", "s_corp", "partnership"],
    incomeThreshold: { min: 40000 },
    savingsFormula: "(employee_deferral + employer_contribution) * marginal_tax_rate",
    typicalSavingsRange: { min: 8000, max: 28000 },
    qualificationQuestions: [
      "Are you self-employed or a single-member business owner?",
      "Do you have any full-time employees (other than a spouse)?",
      "Do you want both traditional and Roth contribution options?",
    ],
    riskLevel: "low",
    timeToImplement: "2-4 weeks",
  },

  // ===========================================================================
  // COMPENSATION (3)
  // ===========================================================================
  {
    id: "reasonable_compensation_scorp",
    title: "Reasonable Compensation (S-Corp)",
    category: "compensation",
    description:
      "S-Corp shareholders who are also employees must pay themselves a reasonable salary, but only that salary is subject to FICA payroll taxes (15.3%). Remaining profits distributed as shareholder distributions avoid FICA. Setting the right salary saves thousands in self-employment tax annually.",
    eligibilityCriteria: [
      "Active shareholder-employee of an S-Corporation",
      "Business has net income above a reasonable salary amount",
      "Salary must be defensible as reasonable for the work performed",
    ],
    implementationSteps: [
      "Research comparable compensation for similar roles, industry, and geography",
      "Document the reasonable compensation analysis (use BLS data, salary surveys)",
      "Set up payroll and pay regular W-2 wages at the determined amount",
      "Distribute remaining profits as shareholder distributions (Schedule K-1)",
      "File Form 1120-S and issue W-2 and K-1 to shareholder-employee",
    ],
    taxFiling:
      "Salary reported on W-2; distributions on Schedule K-1 (Form 1120-S). FICA applies only to W-2 wages. Distributions reported on Schedule E, page 2.",
    ircReference:
      "IRC Section 1366; IRC Section 1368; Revenue Ruling 74-44 (reasonable compensation requirement)",
    applicableTo: ["s_corp"],
    incomeThreshold: { min: 60000 },
    savingsFormula: "(net_income - reasonable_salary) * 0.153",
    typicalSavingsRange: { min: 5000, max: 30000 },
    qualificationQuestions: [
      "Is your business structured as an S-Corporation?",
      "Are you an active shareholder-employee?",
      "What is your current salary vs. business net income?",
    ],
    riskLevel: "medium",
    timeToImplement: "2-4 weeks",
  },
  {
    id: "self_employed_health_insurance",
    title: "Self-Employed Health Insurance Deduction",
    category: "compensation",
    description:
      "Self-employed individuals (including S-Corp >2% shareholders) can deduct 100% of health, dental, and vision insurance premiums for themselves, their spouse, and dependents. This is an above-the-line deduction that reduces AGI directly.",
    eligibilityCriteria: [
      "Self-employed with net profit, or >2% S-Corp shareholder",
      "Not eligible for an employer-subsidized health plan (through own or spouse's employer)",
      "Premiums paid for health, dental, vision, or long-term care insurance",
      "Deduction cannot exceed net self-employment income",
    ],
    implementationSteps: [
      "Verify no eligibility for a subsidized employer plan",
      "For S-Corp shareholders: premiums must be paid by the corporation and included in W-2 wages",
      "Track all qualifying premium payments throughout the year",
      "Calculate the deduction (limited to net self-employment income)",
      "Report on Schedule 1 (Form 1040), Line 17",
    ],
    taxFiling:
      "Deducted on Schedule 1 (Form 1040), Line 17. For S-Corp >2% shareholders, premiums are included in W-2 Box 1 but excluded from Box 3 and Box 5 (not subject to FICA).",
    ircReference: "IRC Section 162(l)",
    applicableTo: ["sole_prop", "s_corp", "partnership"],
    incomeThreshold: { min: 30000 },
    savingsFormula: "annual_premiums * marginal_tax_rate",
    typicalSavingsRange: { min: 2000, max: 8000 },
    qualificationQuestions: [
      "Are you self-employed or an S-Corp >2% shareholder?",
      "Are you eligible for a subsidized employer health plan through any source?",
      "How much do you pay annually in health/dental/vision premiums?",
    ],
    riskLevel: "low",
    timeToImplement: "1 week",
  },
  {
    id: "accountable_plan",
    title: "Accountable Plan",
    category: "compensation",
    description:
      "An accountable plan allows a business to reimburse employees (including owner-employees) for legitimate business expenses tax-free. Reimbursements are not included in employee income and are fully deductible by the business. This is especially powerful for S-Corp owner-employees.",
    eligibilityCriteria: [
      "Business with W-2 employees (including owner-employees of S-Corps or C-Corps)",
      "Plan must have a business connection, adequate accounting, and return of excess reimbursements",
      "Expenses must be ordinary and necessary business expenses",
    ],
    implementationSteps: [
      "Draft a written accountable plan document with the three IRS requirements",
      "Establish expense reporting procedures (receipts, business purpose, dates)",
      "Employees submit expense reports within 60 days of the expense",
      "Excess reimbursements returned within 120 days",
      "Reimburse qualifying expenses through payroll (not subject to FICA or income tax)",
    ],
    taxFiling:
      "Reimbursements are NOT reported on the employee W-2. The business deducts the reimbursed expenses on the applicable return (Form 1120-S, Schedule C, etc.).",
    ircReference: "IRC Section 62(c); Treasury Regulation Section 1.62-2",
    applicableTo: ["s_corp", "c_corp", "partnership"],
    savingsFormula: "reimbursed_expenses * (marginal_tax_rate + fica_rate)",
    typicalSavingsRange: { min: 2000, max: 10000 },
    qualificationQuestions: [
      "Does your business have W-2 employees?",
      "Do you or your employees incur out-of-pocket business expenses?",
      "Do you currently have a written reimbursement policy?",
    ],
    riskLevel: "low",
    timeToImplement: "1-2 weeks",
  },

  // ===========================================================================
  // FAMILY (3)
  // ===========================================================================
  {
    id: "hiring_children",
    title: "Hiring Children in the Family Business",
    category: "family",
    description:
      "Employ your children under age 18 in a sole proprietorship or husband-wife partnership. Their wages are exempt from FICA (Social Security and Medicare), and each child can earn up to the standard deduction ($14,600 for 2024) tax-free. The business gets a full deduction for wages paid.",
    eligibilityCriteria: [
      "Business structured as a sole proprietorship or partnership owned entirely by parents",
      "Child is under age 18 for FICA exemption (under 21 for FUTA exemption)",
      "Child performs legitimate services appropriate for their age",
      "Wages must be reasonable for the work performed",
    ],
    implementationSteps: [
      "Identify age-appropriate tasks (filing, cleaning, social media, data entry, modeling)",
      "Document job description and maintain timesheets",
      "Set a reasonable hourly rate for the work performed",
      "Pay wages via check or direct deposit (maintain records)",
      "Issue W-2 to the child; child files a return if income exceeds standard deduction",
      "No FICA withholding required for sole prop/partnership owned by parents",
    ],
    taxFiling:
      "Business deducts wages on Schedule C (sole prop) or Form 1065 (partnership). Child receives W-2. No FICA taxes (sole prop/spousal partnership only). Child's income sheltered by $14,600 standard deduction.",
    ircReference: "IRC Section 3121(b)(3)(A) (FICA exemption); IRC Section 3306(c)(5) (FUTA exemption)",
    applicableTo: ["sole_prop", "partnership"],
    savingsFormula: "wages_per_child * (parent_marginal_rate + 0.153)",
    typicalSavingsRange: { min: 4000, max: 12000 },
    qualificationQuestions: [
      "Do you have children under age 18?",
      "Is your business a sole proprietorship or spousal partnership?",
      "Can your children perform legitimate work for the business?",
    ],
    riskLevel: "low",
    timeToImplement: "1-2 weeks",
  },
  {
    id: "family_management_company",
    title: "Family Office Management Company",
    category: "family",
    description:
      "Create a family management company (typically an S-Corp or C-Corp) to centralize administrative, financial, and management services for family-owned businesses and investments. This allows legitimate business deductions for shared services, office space, and professional development.",
    eligibilityCriteria: [
      "Family with multiple business entities or significant investment holdings",
      "Genuine management and administrative services provided across entities",
      "Formal management agreements with arm's-length fees",
    ],
    implementationSteps: [
      "Form a separate entity (often S-Corp) for management services",
      "Draft management service agreements with each family entity",
      "Set reasonable management fees based on time and services rendered",
      "Centralize shared expenses: office space, technology, professional services, travel",
      "Maintain detailed records of services provided and time spent",
    ],
    taxFiling:
      "Management company files its own return (Form 1120-S or 1120). Management fees are income to the management company and deductions to the paying entities.",
    ircReference: "IRC Section 162 (ordinary and necessary business expenses); IRC Section 482 (arm's length requirement)",
    applicableTo: ["s_corp", "c_corp", "partnership"],
    incomeThreshold: { min: 300000 },
    savingsFormula: "centralized_deductions * marginal_tax_rate",
    typicalSavingsRange: { min: 10000, max: 50000 },
    qualificationQuestions: [
      "Does your family own multiple businesses or substantial investments?",
      "Are management and administrative services shared across entities?",
      "Would centralizing these expenses create efficiency and documentation?",
    ],
    riskLevel: "medium",
    timeToImplement: "1-3 months",
  },
  {
    id: "merp_section_125",
    title: "Medical Expense Reimbursement Plan (MERP) / Section 125 Cafeteria Plan",
    category: "family",
    description:
      "A Section 105 MERP allows a C-Corp to reimburse employees (including owner-employees) for medical expenses tax-free. A Section 125 Cafeteria Plan allows employees to pay health premiums with pre-tax dollars. For S-Corp >2% shareholders, an ICHRA or QSEHRA may be more appropriate.",
    eligibilityCriteria: [
      "C-Corp or eligible employer with W-2 employees",
      "Formal written plan document in place",
      "Plan must not discriminate in favor of highly compensated employees (for C-Corps)",
    ],
    implementationSteps: [
      "Determine the best plan type: MERP (Section 105), Section 125, ICHRA, or QSEHRA",
      "Draft and adopt a written plan document",
      "Communicate plan terms to all eligible employees",
      "Employees submit qualified medical expenses for reimbursement",
      "Employer reimburses expenses and deducts them as a business expense",
    ],
    taxFiling:
      "Reimbursements are excluded from employee W-2 income (Section 105). Employer deducts reimbursements as a business expense. Section 125 premiums reduce W-2 Box 1, 3, and 5.",
    ircReference: "IRC Section 105 (MERP); IRC Section 125 (Cafeteria Plans); IRC Section 9831 (QSEHRA)",
    applicableTo: ["c_corp", "s_corp", "partnership"],
    savingsFormula: "medical_expenses_reimbursed * (marginal_tax_rate + fica_rate)",
    typicalSavingsRange: { min: 2000, max: 15000 },
    qualificationQuestions: [
      "What is your business entity type?",
      "Do you have significant out-of-pocket medical expenses?",
      "Do you have W-2 employees beyond yourself?",
    ],
    riskLevel: "low",
    timeToImplement: "2-4 weeks",
  },

  // ===========================================================================
  // REAL ESTATE (4)
  // ===========================================================================
  {
    id: "1031_exchange",
    title: "1031 Like-Kind Exchange",
    category: "real_estate",
    description:
      "Defer capital gains tax when selling an investment or business property by exchanging it for a like-kind property. There is no limit on the number of exchanges or the amount deferred. Properly structured, the tax deferral can last indefinitely or until death (stepped-up basis).",
    eligibilityCriteria: [
      "Property sold must be held for investment or business use (not personal residence)",
      "Replacement property must be like-kind (real property for real property)",
      "Must use a Qualified Intermediary (QI) — cannot touch the proceeds",
      "45-day identification period and 180-day closing deadline",
    ],
    implementationSteps: [
      "Engage a Qualified Intermediary before closing the sale",
      "Close the sale of the relinquished property; proceeds go to the QI",
      "Identify up to 3 replacement properties within 45 days",
      "Close on the replacement property within 180 days",
      "Acquire property of equal or greater value to defer 100% of gain",
      "File Form 8824 with the tax return for the year of the exchange",
    ],
    taxFiling:
      "File Form 8824 (Like-Kind Exchanges) with the tax return. No gain recognized if fully deferred. Basis of new property is adjusted (carryover basis).",
    ircReference: "IRC Section 1031",
    applicableTo: ["individual", "sole_prop", "s_corp", "c_corp", "partnership"],
    incomeThreshold: { min: 100000 },
    savingsFormula: "capital_gain * (federal_capital_gains_rate + state_rate)",
    typicalSavingsRange: { min: 15000, max: 200000 },
    qualificationQuestions: [
      "Are you selling investment or business real estate?",
      "Do you plan to reinvest in like-kind real property?",
      "Can you meet the 45-day identification and 180-day closing deadlines?",
    ],
    riskLevel: "medium",
    timeToImplement: "1-6 months (tied to transaction timeline)",
  },
  {
    id: "cost_segregation",
    title: "Cost Segregation Study",
    category: "real_estate",
    description:
      "A cost segregation study reclassifies components of a building (flooring, electrical, plumbing, site improvements) into shorter depreciation lives (5, 7, or 15 years vs. 27.5 or 39 years). Combined with bonus depreciation, this can generate massive first-year deductions on real estate acquisitions.",
    eligibilityCriteria: [
      "Own commercial or residential rental property with a cost basis of $500,000+",
      "Property was recently acquired, built, or renovated",
      "Study must be performed by a qualified engineering firm",
    ],
    implementationSteps: [
      "Engage a qualified cost segregation engineering firm",
      "The firm performs a detailed analysis of the property and its components",
      "Reclassified assets are assigned to 5-year, 7-year, or 15-year MACRS lives",
      "Apply bonus depreciation (currently 60% for 2024, phasing down) to short-life assets",
      "File Form 3115 (Change in Accounting Method) if applying to previously placed-in-service property",
    ],
    taxFiling:
      "Depreciation reported on Form 4562. Accelerated deductions flow through to the applicable return. Form 3115 required for look-back studies on existing property.",
    ircReference: "IRC Section 168; IRC Section 168(k) (bonus depreciation); Hospital Corp of America v. Commissioner",
    applicableTo: ["individual", "sole_prop", "s_corp", "c_corp", "partnership"],
    incomeThreshold: { min: 150000 },
    savingsFormula: "reclassified_basis * bonus_depreciation_pct * marginal_tax_rate",
    typicalSavingsRange: { min: 20000, max: 150000 },
    qualificationQuestions: [
      "Do you own commercial or rental real estate worth $500,000+?",
      "Was the property recently acquired, constructed, or renovated?",
      "Have you already performed a cost segregation study on this property?",
    ],
    riskLevel: "low",
    timeToImplement: "4-8 weeks",
  },
  {
    id: "real_estate_professional",
    title: "Real Estate Professional Status (REPS)",
    category: "real_estate",
    description:
      "Qualifying as a Real Estate Professional allows you to deduct rental real estate losses against all other income without the $25,000 passive activity limitation. You must spend 750+ hours AND more than half your working time in real property trades or businesses.",
    eligibilityCriteria: [
      "More than 750 hours per year in real property trades or businesses",
      "More than half of total working hours spent in real property activities",
      "Material participation in each rental activity (or elect to aggregate all rentals)",
      "Detailed contemporaneous time log is essential",
    ],
    implementationSteps: [
      "Maintain a detailed time log of all real estate activities (acquisitions, management, maintenance, development)",
      "Ensure 750+ hours AND majority-of-time tests are met",
      "Elect to aggregate all rental activities by attaching a statement to the tax return",
      "Materially participate in rental activities (500+ hours, or facts and circumstances test)",
      "Claim rental losses as non-passive on Schedule E and Form 8582",
    ],
    taxFiling:
      "Rental income/loss reported on Schedule E. Form 8582 (Passive Activity Loss Limitations) used to show non-passive treatment. Aggregation election attached to return.",
    ircReference: "IRC Section 469(c)(7) (real estate professional exception); Treasury Regulation 1.469-9",
    applicableTo: ["individual", "sole_prop", "s_corp", "partnership"],
    incomeThreshold: { min: 100000 },
    savingsFormula: "rental_losses * marginal_tax_rate",
    typicalSavingsRange: { min: 10000, max: 100000 },
    qualificationQuestions: [
      "Do you spend 750+ hours per year on real estate activities?",
      "Is real estate your primary profession (more than half your working time)?",
      "Do you have rental losses being limited by passive activity rules?",
    ],
    riskLevel: "high",
    timeToImplement: "Ongoing (must be maintained all year)",
  },
  {
    id: "installment_sale",
    title: "Installment Sale (Section 453)",
    category: "real_estate",
    description:
      "Spread the recognition of capital gains over multiple tax years by receiving payments over time rather than in a lump sum. This keeps the seller in a lower tax bracket each year and can reduce or avoid the 3.8% Net Investment Income Tax (NIIT).",
    eligibilityCriteria: [
      "Selling property at a gain (real estate, business assets, etc.)",
      "At least one payment received after the year of sale",
      "Cannot be used for publicly traded securities or dealer property (inventory)",
    ],
    implementationSteps: [
      "Structure the sale with payments over 2+ tax years",
      "Determine the gross profit ratio (gain / total contract price)",
      "Each payment is split into return of basis, gain, and interest income",
      "Report using Form 6252 each year a payment is received",
      "Charge adequate stated interest (AFR minimum) to avoid imputed interest rules",
    ],
    taxFiling:
      "File Form 6252 (Installment Sale Income) each year. Capital gain portion taxed in each year of receipt. Interest income reported on Schedule B.",
    ircReference: "IRC Section 453",
    applicableTo: ["individual", "sole_prop", "s_corp", "c_corp", "partnership"],
    savingsFormula: "total_gain * (lump_sum_rate - spread_rate)",
    typicalSavingsRange: { min: 5000, max: 75000 },
    qualificationQuestions: [
      "Are you selling property or business assets at a significant gain?",
      "Are you willing to receive payments over multiple years?",
      "Would spreading the gain keep you in a lower bracket?",
    ],
    riskLevel: "medium",
    timeToImplement: "Structured at time of sale",
  },

  // ===========================================================================
  // DEPRECIATION (2)
  // ===========================================================================
  {
    id: "section_179",
    title: "Section 179 Expensing",
    category: "depreciation",
    description:
      "Immediately deduct the full cost of qualifying business assets (equipment, vehicles, furniture, software, certain improvements) in the year placed in service, up to $1,220,000 for 2024. The deduction phases out dollar-for-dollar when total asset purchases exceed $3,050,000.",
    eligibilityCriteria: [
      "Tangible personal property used in the active conduct of a trade or business",
      "Property placed in service during the tax year",
      "Total purchases under the $3,050,000 phase-out threshold",
      "Deduction limited to taxable income from the business",
    ],
    implementationSteps: [
      "Identify qualifying assets purchased and placed in service during the year",
      "Confirm total asset purchases are under the phase-out threshold",
      "Elect Section 179 on Form 4562 for the chosen assets",
      "Ensure deduction does not exceed active business taxable income",
      "Consider combining with bonus depreciation for amounts exceeding 179 limits",
    ],
    taxFiling:
      "Elected on Form 4562 (Depreciation and Amortization), Part I. Flows to Schedule C, Form 1120-S, or Form 1065 as applicable.",
    ircReference: "IRC Section 179",
    applicableTo: ["sole_prop", "s_corp", "c_corp", "partnership"],
    savingsFormula: "min(asset_cost, 1220000) * marginal_tax_rate",
    typicalSavingsRange: { min: 5000, max: 50000 },
    qualificationQuestions: [
      "Did you purchase business equipment, vehicles, or software this year?",
      "Were the assets placed in service during the current tax year?",
      "What was the total cost of qualifying purchases?",
    ],
    riskLevel: "low",
    timeToImplement: "At time of purchase / year-end",
  },
  {
    id: "bonus_depreciation",
    title: "Bonus Depreciation",
    category: "depreciation",
    description:
      "First-year bonus depreciation allows an additional depreciation deduction on qualified assets in the year they are placed in service. For 2024, the rate is 60% (phasing down from 100% in 2022). Unlike Section 179, bonus depreciation can create a net operating loss and has no income limitation.",
    eligibilityCriteria: [
      "Qualified property with a MACRS recovery period of 20 years or less",
      "Property must be new or used (first use by the taxpayer)",
      "Placed in service during the tax year",
      "No phase-out based on total purchases (unlike Section 179)",
    ],
    implementationSteps: [
      "Identify all qualifying assets placed in service during the year",
      "Calculate 60% (2024 rate) bonus depreciation on the depreciable basis",
      "Remaining basis depreciated under normal MACRS schedules",
      "Can elect out of bonus depreciation on a class-by-class basis if desired",
      "Report on Form 4562, Part II (Special Depreciation Allowance)",
    ],
    taxFiling:
      "Reported on Form 4562, Part II. Automatic unless an election out is made. Can create or increase a net operating loss (NOL).",
    ircReference: "IRC Section 168(k)",
    applicableTo: ["sole_prop", "s_corp", "c_corp", "partnership"],
    savingsFormula: "asset_cost * bonus_pct * marginal_tax_rate",
    typicalSavingsRange: { min: 3000, max: 40000 },
    qualificationQuestions: [
      "Did you acquire business assets this year?",
      "Are the assets new to your business (first use by you)?",
      "Do you want to accelerate depreciation deductions into this year?",
    ],
    riskLevel: "low",
    timeToImplement: "At time of purchase / year-end",
  },

  // ===========================================================================
  // DEDUCTIONS / WORKHORSE (5)
  // ===========================================================================
  {
    id: "home_office",
    title: "Home Office Deduction",
    category: "deductions",
    description:
      "Deduct expenses for a portion of your home used regularly and exclusively for business. Two methods: (1) Regular method — actual expenses prorated by square footage (mortgage interest, insurance, utilities, repairs, depreciation), or (2) Simplified method — $5/sq ft up to 300 sq ft ($1,500 max).",
    eligibilityCriteria: [
      "Regular and exclusive use of a specific area for business",
      "Principal place of business, or used to meet clients regularly",
      "Self-employed (Schedule C) or statutory employee — W-2 employees cannot deduct (post-TCJA)",
    ],
    implementationSteps: [
      "Measure the square footage of the dedicated office space",
      "Calculate the business-use percentage (office sq ft / total home sq ft)",
      "Choose regular method or simplified method ($5/sq ft, max $1,500)",
      "For regular method: allocate mortgage interest, rent, insurance, utilities, repairs, depreciation",
      "Complete Form 8829 (regular method) or enter simplified deduction on Schedule C",
    ],
    taxFiling:
      "Regular method: Form 8829, flows to Schedule C Line 30. Simplified method: reported directly on Schedule C Line 30. Deduction limited to gross income from the business.",
    ircReference: "IRC Section 280A(c); Revenue Procedure 2013-13 (simplified method)",
    applicableTo: ["sole_prop", "partnership"],
    savingsFormula: "home_office_deduction * marginal_tax_rate",
    typicalSavingsRange: { min: 500, max: 5000 },
    qualificationQuestions: [
      "Do you have a dedicated space in your home used exclusively for business?",
      "Is the space your principal place of business?",
      "Are you self-employed (not a W-2 employee)?",
    ],
    riskLevel: "low",
    timeToImplement: "1 week (calculation at tax time)",
  },
  {
    id: "augusta_rule",
    title: "Augusta Rule (Section 280A(g))",
    category: "deductions",
    description:
      "Rent your personal residence to your business for up to 14 days per year. The rental income is completely tax-free to you (not reported on your return), while the business gets a deduction for the rent expense. The rental rate must be at fair market value and the rental must have a bona fide business purpose.",
    eligibilityCriteria: [
      "Own a personal residence",
      "Have a legitimate business that needs meeting or event space",
      "Rental limited to 14 days or fewer per year",
      "Fair market rental rate documented (comparable venue pricing)",
    ],
    implementationSteps: [
      "Research fair market rental rates for comparable venues in your area",
      "Document each rental occasion: date, business purpose, attendees, hours used",
      "Execute a rental agreement between yourself and the business",
      "The business pays rent and deducts it as an ordinary business expense",
      "You do NOT report the income (14-day exclusion). Keep all documentation on file",
    ],
    taxFiling:
      "Rental income excluded from individual return entirely (not reported anywhere). Business deducts rental expense on Schedule C, Form 1120-S, or applicable return.",
    ircReference: "IRC Section 280A(g)",
    applicableTo: ["sole_prop", "s_corp", "c_corp", "partnership"],
    incomeThreshold: { min: 50000 },
    savingsFormula: "daily_rate * rental_days * marginal_tax_rate",
    typicalSavingsRange: { min: 2000, max: 10000 },
    qualificationQuestions: [
      "Do you own your personal residence?",
      "Does your business hold meetings, retreats, or events?",
      "Can you document a bona fide business purpose for using your home?",
    ],
    riskLevel: "medium",
    timeToImplement: "1-2 weeks",
  },
  {
    id: "business_meals",
    title: "Business Meals Deduction",
    category: "deductions",
    description:
      "Deduct 50% of the cost of business meals where business is discussed with clients, prospects, or associates. The meal must not be lavish or extravagant, and the taxpayer (or an employee) must be present. Documentation must include date, amount, attendees, business purpose, and restaurant name.",
    eligibilityCriteria: [
      "Meal involves a business discussion with a client, prospect, or business associate",
      "Taxpayer or employee is present at the meal",
      "Meal is not lavish or extravagant",
      "Proper documentation maintained (receipt, business purpose, attendees)",
    ],
    implementationSteps: [
      "Maintain a system for documenting business meals in real time",
      "Record: date, restaurant name, amount, attendees, and business purpose",
      "Keep receipts for all meals over $75 (best practice: keep all receipts)",
      "Categorize meals correctly in bookkeeping (50% deductible meals)",
      "Report deductible portion on Schedule C, Form 1120-S, or applicable return",
    ],
    taxFiling:
      "50% of qualifying meals deducted on the applicable business return. Reported on Schedule C Line 24b, or on the S-Corp/C-Corp/partnership return in the meals category.",
    ircReference: "IRC Section 274(k); IRC Section 274(d) (substantiation requirements)",
    applicableTo: ["sole_prop", "s_corp", "c_corp", "partnership", "individual"],
    savingsFormula: "annual_meal_expenses * 0.50 * marginal_tax_rate",
    typicalSavingsRange: { min: 500, max: 5000 },
    qualificationQuestions: [
      "Do you regularly have meals with clients or business associates?",
      "Do you currently track and document business meals?",
      "Approximately how much do you spend annually on business meals?",
    ],
    riskLevel: "low",
    timeToImplement: "Immediate (documentation habit)",
  },
  {
    id: "business_travel",
    title: "Business Travel Deduction",
    category: "deductions",
    description:
      "Deduct transportation, lodging, and 50% of meals while traveling away from your tax home for business. Travel must be primarily for business, and you must be away from home overnight. Combining business and personal travel is allowed if the primary purpose is business.",
    eligibilityCriteria: [
      "Travel is away from your tax home (overnight stay required)",
      "Primary purpose of the trip is business",
      "Expenses are ordinary and necessary",
      "Adequate records maintained (receipts, itinerary, business purpose)",
    ],
    implementationSteps: [
      "Plan trips with a documented primary business purpose",
      "Track all expenses: airfare, hotel, ground transportation, meals, Wi-Fi, tips",
      "For mixed trips: allocate travel days between business and personal",
      "Domestic travel: transportation fully deductible if trip is primarily business",
      "International travel: allocate transportation costs if personal days exceed 25% of trip",
    ],
    taxFiling:
      "Deducted on Schedule C (Line 24a for travel, Line 24b for meals at 50%), or on the business entity return. Per diem rates can be used in lieu of actual expenses for meals and incidentals.",
    ircReference: "IRC Section 162(a)(2); IRC Section 274 (travel substantiation)",
    applicableTo: ["sole_prop", "s_corp", "c_corp", "partnership"],
    savingsFormula: "annual_travel_expenses * marginal_tax_rate",
    typicalSavingsRange: { min: 1000, max: 10000 },
    qualificationQuestions: [
      "Do you travel away from home overnight for business?",
      "How many business trips do you take per year?",
      "Do you combine business and personal travel?",
    ],
    riskLevel: "low",
    timeToImplement: "Immediate (documentation habit)",
  },
  {
    id: "itemized_deduction_optimizer",
    title: "Itemized Deduction Optimizer",
    category: "deductions",
    description:
      "Maximize itemized deductions by strategically timing medical expenses (>7.5% AGI), mortgage interest, SALT payments ($10,000 cap), and charitable contributions. Compare to the standard deduction ($14,600 single / $29,200 MFJ for 2024) and bunch deductions into alternating years if beneficial.",
    eligibilityCriteria: [
      "Total itemized deductions exceed the standard deduction, or can with bunching",
      "Components: medical (>7.5% AGI), mortgage interest, SALT (up to $10K), charitable",
      "Filing status and income determine optimal strategy",
    ],
    implementationSteps: [
      "Calculate total itemized deductions under current spending patterns",
      "If close to or below the standard deduction, consider bunching",
      "Bunch charitable gifts and medical procedures into alternating years",
      "Prepay state/local taxes or property taxes (within $10,000 SALT cap)",
      "Accelerate or defer deductible expenses to maximize the higher-deduction year",
      "Use a donor-advised fund for charitable bunching",
    ],
    taxFiling:
      "Schedule A (Form 1040): Line 1 (medical), Line 5a-5e (taxes — SALT capped at $10,000), Line 8a (mortgage interest), Line 12-14 (charitable). Compare total to standard deduction.",
    ircReference:
      "IRC Section 63 (standard deduction); IRC Section 164 (SALT); IRC Section 163(h) (mortgage interest); IRC Section 170 (charitable)",
    applicableTo: ["individual"],
    incomeThreshold: { min: 75000 },
    savingsFormula: "(itemized_total - standard_deduction) * marginal_tax_rate",
    typicalSavingsRange: { min: 1000, max: 8000 },
    qualificationQuestions: [
      "Do you own a home with a mortgage?",
      "What are your annual state/local tax payments?",
      "Do you make significant charitable contributions?",
      "Do you have large medical expenses?",
    ],
    riskLevel: "low",
    timeToImplement: "Year-end planning",
  },

  // ===========================================================================
  // CREDITS (3)
  // ===========================================================================
  {
    id: "child_tax_credit",
    title: "Child Tax Credit",
    category: "credits",
    description:
      "A $2,000 tax credit per qualifying child under age 17. Up to $1,700 is refundable (Additional Child Tax Credit). The credit phases out at $200,000 AGI ($400,000 MFJ). This is a direct dollar-for-dollar reduction in tax liability, making it one of the most valuable credits for families.",
    eligibilityCriteria: [
      "Qualifying child under age 17 at end of tax year",
      "Child has a valid Social Security Number",
      "AGI below $200,000 (single) or $400,000 (MFJ) for full credit",
      "Child lived with you for more than half the year",
    ],
    implementationSteps: [
      "Verify each child meets the age, residency, and relationship tests",
      "Ensure each child has a valid SSN (ITIN does not qualify for CTC)",
      "Claim the credit on Form 1040 using the Child Tax Credit Worksheet",
      "If credit exceeds tax liability, claim the refundable Additional CTC on Schedule 8812",
      "For higher incomes, calculate phase-out ($50 reduction per $1,000 over threshold)",
    ],
    taxFiling:
      "Claimed on Form 1040, Line 19. Schedule 8812 for the Additional (refundable) Child Tax Credit. Phase-out calculated in the worksheet.",
    ircReference: "IRC Section 24",
    applicableTo: ["individual"],
    incomeThreshold: { max: 400000 },
    savingsFormula: "number_of_children * 2000",
    typicalSavingsRange: { min: 2000, max: 8000 },
    qualificationQuestions: [
      "How many children under age 17 do you have?",
      "What is your approximate AGI?",
      "Do all children have valid Social Security Numbers?",
    ],
    riskLevel: "low",
    timeToImplement: "At tax filing",
  },
  {
    id: "rd_tax_credit",
    title: "Research & Development Tax Credit (Section 41)",
    category: "credits",
    description:
      "The R&D credit provides up to 20% of qualified research expenses (QREs) above a base amount. For small businesses (under $5M gross receipts), up to $500,000 can offset payroll taxes. QREs include wages, supplies, and contract research for developing new/improved products, processes, or software.",
    eligibilityCriteria: [
      "Business conducts qualified research activities in the U.S.",
      "Activities must satisfy the 4-part test: technological in nature, elimination of uncertainty, process of experimentation, permitted purpose",
      "Qualified expenses: W-2 wages, supplies, and 65% of contract research costs",
    ],
    implementationSteps: [
      "Identify all qualifying research activities using the 4-part test",
      "Calculate Qualified Research Expenses (QREs): wages of researchers, supplies, contract research",
      "Determine credit using regular method (20% of QREs over base) or simplified method (14% of QREs over 50% of prior 3-year average)",
      "For startups: elect to offset payroll taxes (up to $500,000 per year for 5 years)",
      "File Form 6765 and maintain detailed contemporaneous documentation",
    ],
    taxFiling:
      "Form 6765 (Credit for Increasing Research Activities). Credit claimed on Form 3800 (General Business Credit). Payroll tax election on Form 6765, Section D.",
    ircReference: "IRC Section 41; IRC Section 3111(f) (payroll tax offset for small businesses)",
    applicableTo: ["sole_prop", "s_corp", "c_corp", "partnership"],
    incomeThreshold: { min: 75000 },
    savingsFormula: "qualified_research_expenses * 0.20 (regular) or * 0.14 (simplified)",
    typicalSavingsRange: { min: 5000, max: 100000 },
    qualificationQuestions: [
      "Does your business develop new or improved products, processes, or software?",
      "Do you have employees or contractors performing research activities?",
      "What is your approximate annual spending on research and development?",
    ],
    riskLevel: "medium",
    timeToImplement: "1-3 months (study and documentation)",
  },
  {
    id: "dependent_care_credit",
    title: "Dependent Care Credit",
    category: "credits",
    description:
      "A non-refundable credit for child care or dependent care expenses that allow you (and your spouse) to work. The credit is 20-35% of up to $3,000 in expenses for one qualifying individual, or $6,000 for two or more, depending on AGI.",
    eligibilityCriteria: [
      "Care expenses for a qualifying child under 13 or a disabled dependent/spouse",
      "Care must enable the taxpayer (and spouse if married) to work or look for work",
      "Care provider cannot be your spouse, parent of the child (if under 19), or your dependent",
      "Must file jointly if married",
    ],
    implementationSteps: [
      "Obtain the care provider's name, address, and TIN (SSN or EIN)",
      "Track all qualifying childcare/dependent care expenses throughout the year",
      "Calculate the credit percentage based on AGI (20% for AGI above $43,000; up to 35% for lower AGI)",
      "Apply the percentage to qualifying expenses (capped at $3,000 for one / $6,000 for two+)",
      "Complete Form 2441 and attach to Form 1040",
    ],
    taxFiling:
      "Form 2441 (Child and Dependent Care Expenses). Credit claimed on Form 1040, Schedule 3, Line 2.",
    ircReference: "IRC Section 21",
    applicableTo: ["individual"],
    savingsFormula: "min(qualifying_expenses, expense_limit) * credit_percentage",
    typicalSavingsRange: { min: 600, max: 2100 },
    qualificationQuestions: [
      "Do you pay for childcare or dependent care to enable you to work?",
      "How old are your dependents receiving care?",
      "What are your annual childcare/dependent care expenses?",
    ],
    riskLevel: "low",
    timeToImplement: "At tax filing",
  },

  // ===========================================================================
  // ENTITY (2)
  // ===========================================================================
  {
    id: "s_corp_election",
    title: "S Corporation Election",
    category: "entity",
    description:
      "Elect S-Corporation status for your LLC or corporation to avoid self-employment tax on business profits above a reasonable salary. Net income passes through to shareholders but only W-2 wages are subject to FICA (15.3%). This is the single most common tax-saving strategy for profitable small businesses.",
    eligibilityCriteria: [
      "Domestic corporation or eligible LLC",
      "100 or fewer shareholders, all U.S. citizens/residents (no entity shareholders except certain trusts/estates)",
      "One class of stock only",
      "Business net income consistently above a reasonable salary ($50,000+)",
    ],
    implementationSteps: [
      "Determine if S-Corp status provides net tax savings (factor in payroll costs and state taxes)",
      "File Form 2553 (Election by a Small Business Corporation) with the IRS",
      "Must be filed within 75 days of the start of the tax year (or prior year for existing entities)",
      "Set up payroll and begin paying a reasonable salary to owner-employees",
      "Distribute remaining profits as shareholder distributions (not subject to FICA)",
      "File Form 1120-S annually; issue K-1s to shareholders",
    ],
    taxFiling:
      "Form 2553 to elect. File Form 1120-S annually. Income/loss passes through on Schedule K-1 to shareholders' individual returns (Schedule E, page 2).",
    ircReference: "IRC Section 1362 (election); IRC Section 1366 (pass-through); IRC Section 1368 (distributions)",
    applicableTo: ["sole_prop", "partnership"],
    incomeThreshold: { min: 50000 },
    savingsFormula: "(net_income - reasonable_salary) * 0.153",
    typicalSavingsRange: { min: 5000, max: 30000 },
    qualificationQuestions: [
      "Is your business currently a sole proprietorship, LLC, or partnership?",
      "Is your net business income consistently above $50,000?",
      "Do you have 100 or fewer U.S.-based owners?",
    ],
    riskLevel: "low",
    timeToImplement: "2-4 weeks",
  },
  {
    id: "late_s_corp_election",
    title: "Late S Corporation Election",
    category: "entity",
    description:
      "If you missed the 75-day window for a timely S-Corp election, you can file a late election under Revenue Procedure 2013-30 if reasonable cause exists and the entity has been operating as if the election were in effect. This allows retroactive S-Corp status back to the beginning of the tax year.",
    eligibilityCriteria: [
      "Missed the Form 2553 filing deadline (75 days from start of tax year)",
      "Reasonable cause for the late filing",
      "Entity has been treating itself as an S-Corp (filing 1120-S, paying reasonable salary)",
      "Filed within 3 years and 75 days of the intended effective date",
    ],
    implementationSteps: [
      "Prepare Form 2553 with a reasonable cause statement explaining the late filing",
      "Attach the statement referencing Revenue Procedure 2013-30",
      "Ensure the entity has operated consistently with S-Corp status",
      "File Form 2553 with the applicable IRS service center",
      "If more than 3 years and 75 days late, request a Private Letter Ruling (more costly)",
    ],
    taxFiling:
      "File Form 2553 with reasonable cause statement. Once accepted, file Form 1120-S for all applicable years. May need to amend prior returns if initially filed as a different entity type.",
    ircReference: "IRC Section 1362(b); Revenue Procedure 2013-30",
    applicableTo: ["sole_prop", "partnership"],
    incomeThreshold: { min: 50000 },
    savingsFormula: "(net_income - reasonable_salary) * 0.153",
    typicalSavingsRange: { min: 5000, max: 30000 },
    qualificationQuestions: [
      "Did you miss the S-Corp election deadline?",
      "Has your business been operating as if it were an S-Corp?",
      "When was the intended effective date of the election?",
    ],
    riskLevel: "medium",
    timeToImplement: "2-6 weeks",
  },

  // ===========================================================================
  // EDUCATION (1)
  // ===========================================================================
  {
    id: "education_savings",
    title: "Coverdell ESA / 529 Plan",
    category: "education",
    description:
      "Save for education expenses with tax-free growth. 529 Plans have no contribution limits (subject to gift tax) and cover tuition, room, board, and up to $10,000/year for K-12 tuition. Coverdell ESAs allow $2,000/year per beneficiary for K-12 and higher education with more investment flexibility.",
    eligibilityCriteria: [
      "529: No income limit for contributions. State tax deduction varies by state.",
      "Coverdell: AGI below $110,000 (single) / $220,000 (MFJ). Max $2,000/year per beneficiary.",
      "Beneficiary must use funds for qualified education expenses",
    ],
    implementationSteps: [
      "Choose between 529 Plan (higher limits, state deduction) and Coverdell ESA (more flexibility)",
      "Open the account and designate the beneficiary",
      "Fund the account — 529: up to $18,000/year (gift tax exclusion) or 5-year superfunding up to $90,000",
      "Invest the funds in age-appropriate portfolios",
      "Withdraw for qualified expenses: tuition, books, room and board, computers, K-12 (529 up to $10K)",
    ],
    taxFiling:
      "Contributions are not federally deductible (many states offer a deduction for 529). Qualified distributions reported on Form 1099-Q are tax-free. Non-qualified distributions: earnings taxed + 10% penalty.",
    ircReference: "IRC Section 529 (Qualified Tuition Programs); IRC Section 530 (Coverdell ESAs)",
    applicableTo: ["individual"],
    savingsFormula: "annual_contribution * growth_rate * years * marginal_tax_rate (tax-free growth benefit)",
    typicalSavingsRange: { min: 500, max: 5000 },
    qualificationQuestions: [
      "Do you have children or dependents who will attend school or college?",
      "Are you currently saving for education expenses?",
      "Does your state offer a tax deduction for 529 contributions?",
    ],
    riskLevel: "low",
    timeToImplement: "1-2 weeks",
  },

  // ===========================================================================
  // CHARITY (1)
  // ===========================================================================
  {
    id: "charitable_optimization",
    title: "Charitable Contribution Optimization",
    category: "charity",
    description:
      "Maximize the tax benefit of charitable giving through strategic approaches: bunching contributions into alternating years to exceed the standard deduction, donating appreciated stock (avoid capital gains + get full FMV deduction), and using donor-advised funds (DAFs) to pre-fund future giving.",
    eligibilityCriteria: [
      "Taxpayer makes or intends to make charitable contributions",
      "For appreciated stock: held more than one year with unrealized gains",
      "For bunching: total itemized deductions near or below standard deduction in a normal year",
      "Contributions must be to qualified 501(c)(3) organizations",
    ],
    implementationSteps: [
      "Evaluate whether bunching donations every other year creates a larger total deduction",
      "Open a donor-advised fund (DAF) to pre-fund multiple years of giving in one year",
      "Donate appreciated stock or mutual funds instead of cash to avoid capital gains tax",
      "Obtain written acknowledgment for donations of $250+",
      "For donations over $5,000 of non-cash property, obtain a qualified appraisal",
      "Deduction limits: 60% of AGI for cash, 30% for appreciated property to public charities",
    ],
    taxFiling:
      "Schedule A, Lines 12-14. Form 8283 for non-cash donations over $500. Deduction limited to 60% AGI (cash) or 30% AGI (appreciated property). Excess carries forward 5 years.",
    ircReference: "IRC Section 170; IRC Section 170(b)(1)(C) (30% limitation on appreciated property)",
    applicableTo: ["individual"],
    incomeThreshold: { min: 75000 },
    savingsFormula: "(donation_amount * marginal_tax_rate) + avoided_capital_gains_tax",
    typicalSavingsRange: { min: 2000, max: 25000 },
    qualificationQuestions: [
      "Do you make annual charitable contributions?",
      "Do you hold appreciated stock or investments?",
      "Are your itemized deductions close to the standard deduction?",
      "Would you benefit from bunching multiple years of giving?",
    ],
    riskLevel: "low",
    timeToImplement: "1-2 weeks (DAF setup) / immediate (stock donation)",
  },
];

// -----------------------------------------------------------------------------
// Smart Plan Questions (12 onboarding questions)
// -----------------------------------------------------------------------------

export const SMART_PLAN_QUESTIONS: SmartPlanQuestion[] = [
  {
    key: "occupation",
    text: "What is your occupation?",
    subtext: "Helps us identify industry-specific deductions and strategies",
    buttons: [
      "Software Engineer",
      "Doctor",
      "Business Owner",
      "Real Estate Investor",
      "Consultant",
      "Restaurant Owner",
      "Attorney",
      "Dentist",
    ],
    freeText: true,
    showSkip: false,
    strategiesUnlocked: [
      "rd_tax_credit",
      "home_office",
      "business_travel",
      "business_meals",
      "accountable_plan",
    ],
  },
  {
    key: "filing_status",
    text: "What is your filing status?",
    subtext: "Determines standard deduction amounts and credit phase-outs",
    buttons: ["Single", "Married Filing Jointly", "Married Filing Separately", "Head of Household"],
    freeText: false,
    showSkip: false,
    strategiesUnlocked: [
      "child_tax_credit",
      "dependent_care_credit",
      "itemized_deduction_optimizer",
    ],
  },
  {
    key: "annual_income",
    text: "What is your approximate annual income?",
    subtext: "Income level determines which strategies provide the most savings",
    buttons: [
      "Under $50,000",
      "$50,000 - $100,000",
      "$100,000 - $200,000",
      "$200,000 - $500,000",
      "$500,000 - $1,000,000",
      "Over $1,000,000",
    ],
    freeText: true,
    showSkip: false,
    strategiesUnlocked: [
      "traditional_401k_max",
      "cash_balance_plan",
      "reasonable_compensation_scorp",
      "s_corp_election",
      "charitable_optimization",
    ],
  },
  {
    key: "dependents",
    text: "How many dependents do you have?",
    subtext: "This determines Child Tax Credit and Dependent Care eligibility",
    buttons: ["0", "1", "2", "3", "4+"],
    freeText: false,
    showSkip: false,
    strategiesUnlocked: [
      "child_tax_credit",
      "dependent_care_credit",
      "hiring_children",
      "education_savings",
    ],
  },
  {
    key: "entity_type",
    text: "What is your business entity type?",
    subtext: "Entity type determines which strategies apply",
    buttons: ["None (W-2 Employee)", "Sole Proprietor", "LLC", "S-Corp", "C-Corp", "Partnership"],
    freeText: false,
    showSkip: false,
    strategiesUnlocked: [
      "reasonable_compensation_scorp",
      "s_corp_election",
      "late_s_corp_election",
      "accountable_plan",
      "hiring_children",
      "family_management_company",
      "merp_section_125",
      "section_179",
      "bonus_depreciation",
      "solo_401k",
      "sep_ira",
    ],
  },
  {
    key: "real_estate",
    text: "Do you own real estate or rental properties?",
    subtext: "Unlocks depreciation, 1031 exchange, and RE professional strategies",
    buttons: ["No", "Yes, primary residence only", "Yes, rental properties", "Yes, both primary and rental"],
    freeText: false,
    showSkip: false,
    strategiesUnlocked: [
      "1031_exchange",
      "cost_segregation",
      "real_estate_professional",
      "installment_sale",
      "augusta_rule",
    ],
  },
  {
    key: "home_office",
    text: "Do you have a home office?",
    subtext: "Required for home office deduction",
    buttons: ["Yes, dedicated room", "Yes, shared space", "No"],
    freeText: false,
    showSkip: false,
    strategiesUnlocked: ["home_office"],
  },
  {
    key: "mortgage",
    text: "Do you have a mortgage?",
    subtext: "Mortgage interest is a key itemized deduction",
    buttons: ["Yes", "No"],
    freeText: false,
    showSkip: false,
    strategiesUnlocked: ["itemized_deduction_optimizer"],
  },
  {
    key: "children_under_18",
    text: "Do you have children under 18?",
    subtext: "Unlocks hiring children, Child Tax Credit, and education strategies",
    buttons: ["No", "Yes, 1 child", "Yes, 2 children", "Yes, 3+ children"],
    freeText: false,
    showSkip: false,
    strategiesUnlocked: [
      "hiring_children",
      "child_tax_credit",
      "dependent_care_credit",
      "education_savings",
    ],
  },
  {
    key: "retirement_plan",
    text: "Do you currently have a retirement plan?",
    subtext: "Identifies retirement optimization opportunities",
    buttons: ["401(k)", "IRA", "SEP IRA", "None", "Multiple plans"],
    freeText: false,
    showSkip: false,
    strategiesUnlocked: [
      "traditional_401k_max",
      "roth_401k_strategy",
      "cash_balance_plan",
      "sep_ira",
      "solo_401k",
    ],
  },
  {
    key: "health_insurance",
    text: "What is your health insurance situation?",
    subtext: "Self-employed health insurance deduction requires no employer plan",
    buttons: ["Employer plan", "Self-employed / individual plan", "Marketplace (ACA)", "Medicare"],
    freeText: false,
    showSkip: false,
    strategiesUnlocked: [
      "self_employed_health_insurance",
      "merp_section_125",
    ],
  },
  {
    key: "additional_context",
    text: "Any additional financial details?",
    subtext: "Select all that apply, or describe your situation",
    buttons: [
      "Stock options / RSUs",
      "Crypto / investments",
      "International income",
      "Charitable giving",
      "R&D / innovation",
      "Vehicles for business",
    ],
    freeText: true,
    showSkip: true,
    strategiesUnlocked: [
      "rd_tax_credit",
      "charitable_optimization",
      "installment_sale",
      "section_179",
      "bonus_depreciation",
    ],
  },
];

// -----------------------------------------------------------------------------
// Strategy Filtering Logic
// -----------------------------------------------------------------------------

/**
 * Parse the income answer into a numeric value for threshold comparisons.
 */
function parseIncome(answer: string | undefined): number {
  if (!answer) return 0;
  // Handle preset button values
  if (answer.includes("Under $50")) return 40000;
  if (answer.includes("$50,000 - $100")) return 75000;
  if (answer.includes("$100,000 - $200")) return 150000;
  if (answer.includes("$200,000 - $500")) return 350000;
  if (answer.includes("$500,000 - $1,000")) return 750000;
  if (answer.includes("Over $1,000")) return 1500000;
  // Try to parse a raw number (strip $, commas, etc.)
  const parsed = parseInt(answer.replace(/[$,\s]/g, ""), 10);
  return isNaN(parsed) ? 75000 : parsed;
}

/**
 * Parse the number of children from the answer.
 */
function parseChildCount(answer: string | undefined): number {
  if (!answer) return 0;
  if (answer === "No" || answer === "0") return 0;
  const match = answer.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Map the entity answer to applicableTo keys.
 */
function mapEntityType(answer: string | undefined): string[] {
  if (!answer) return ["individual"];
  const lower = answer.toLowerCase();
  if (lower.includes("none") || lower.includes("w-2")) return ["individual"];
  if (lower.includes("sole")) return ["sole_prop", "individual"];
  if (lower.includes("s-corp") || lower.includes("s corp")) return ["s_corp"];
  if (lower.includes("c-corp") || lower.includes("c corp")) return ["c_corp"];
  if (lower.includes("partnership")) return ["partnership"];
  if (lower.includes("llc")) return ["sole_prop", "s_corp", "partnership"]; // LLC is flexible
  return ["individual"];
}

/**
 * Filters the master strategy list based on user onboarding answers.
 * Returns strategies sorted by typical savings (highest first).
 */
export function getApplicableStrategies(
  answers: Record<string, string>
): MasterStrategy[] {
  const income = parseIncome(answers.annual_income);
  const entityTypes = mapEntityType(answers.entity_type);
  const hasChildren = parseChildCount(answers.children_under_18) > 0;
  const hasDependents = parseChildCount(answers.dependents) > 0;
  const ownsRealEstate =
    answers.real_estate !== undefined &&
    !answers.real_estate.toLowerCase().startsWith("no");
  const hasRentalProperty =
    answers.real_estate !== undefined &&
    (answers.real_estate.toLowerCase().includes("rental") ||
      answers.real_estate.toLowerCase().includes("both"));
  const hasHomeOffice =
    answers.home_office !== undefined &&
    answers.home_office.toLowerCase().startsWith("yes");
  const isSelfEmployed =
    answers.health_insurance !== undefined &&
    answers.health_insurance.toLowerCase().includes("self-employed");
  const hasMortgage =
    answers.mortgage !== undefined &&
    answers.mortgage.toLowerCase() === "yes";
  const isSCorp = entityTypes.includes("s_corp");
  const isSoleProp = entityTypes.includes("sole_prop");
  const isIndividualOnly =
    entityTypes.length === 1 && entityTypes[0] === "individual";
  const hasBusinessEntity = !isIndividualOnly;
  const additionalContext = (answers.additional_context || "").toLowerCase();

  return MASTER_STRATEGIES.filter((strategy) => {
    // --- Entity type filter ---
    const entityMatch = strategy.applicableTo.some((type) =>
      entityTypes.includes(type)
    );
    if (!entityMatch) return false;

    // --- Income threshold filter ---
    if (strategy.incomeThreshold) {
      if (strategy.incomeThreshold.min && income < strategy.incomeThreshold.min) {
        return false;
      }
      if (strategy.incomeThreshold.max && income > strategy.incomeThreshold.max) {
        return false;
      }
    }

    // --- Strategy-specific filters ---
    switch (strategy.id) {
      // S-Corp specific
      case "reasonable_compensation_scorp":
        return isSCorp;

      case "s_corp_election":
      case "late_s_corp_election":
        // Only suggest if they are NOT already an S-Corp
        return !isSCorp && hasBusinessEntity && (isSoleProp || entityTypes.includes("partnership"));

      // Real estate
      case "1031_exchange":
      case "real_estate_professional":
        return hasRentalProperty;

      case "cost_segregation":
        return hasRentalProperty || ownsRealEstate;

      case "installment_sale":
        return ownsRealEstate || additionalContext.includes("invest");

      // Home office
      case "home_office":
        return hasHomeOffice && hasBusinessEntity;

      // Augusta rule — needs a home and a business
      case "augusta_rule":
        return ownsRealEstate && hasBusinessEntity;

      // Children / family
      case "hiring_children":
        return hasChildren && (isSoleProp || entityTypes.includes("partnership"));

      case "child_tax_credit":
        return hasChildren || hasDependents;

      case "dependent_care_credit":
        return hasChildren || hasDependents;

      case "education_savings":
        return hasChildren || hasDependents;

      case "family_management_company":
        return hasBusinessEntity && income >= 300000;

      // Health insurance
      case "self_employed_health_insurance":
        return isSelfEmployed && hasBusinessEntity;

      case "merp_section_125":
        return hasBusinessEntity;

      // Retirement — filter by current plan situation
      case "solo_401k":
        return hasBusinessEntity && !isIndividualOnly && (isSoleProp || entityTypes.includes("partnership") || isSCorp);

      case "sep_ira":
        return hasBusinessEntity;

      case "cash_balance_plan":
        return hasBusinessEntity && income >= 250000;

      case "traditional_401k_max":
      case "roth_401k_strategy":
        return true; // Broadly applicable

      // Depreciation — needs business assets
      case "section_179":
      case "bonus_depreciation":
        return hasBusinessEntity;

      // Business deductions
      case "business_meals":
      case "business_travel":
        return hasBusinessEntity;

      case "accountable_plan":
        return isSCorp || entityTypes.includes("c_corp") || entityTypes.includes("partnership");

      // Itemized deductions
      case "itemized_deduction_optimizer":
        return hasMortgage || additionalContext.includes("charit");

      // R&D credit
      case "rd_tax_credit":
        return hasBusinessEntity && (additionalContext.includes("r&d") || additionalContext.includes("innovation") || additionalContext.includes("software"));

      // Charitable
      case "charitable_optimization":
        return additionalContext.includes("charit") || income >= 150000;

      default:
        return true;
    }
  }).sort(
    (a, b) => b.typicalSavingsRange.max - a.typicalSavingsRange.max
  );
}
