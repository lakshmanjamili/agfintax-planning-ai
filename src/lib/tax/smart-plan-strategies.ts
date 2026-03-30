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
// Master Strategies (46 strategies aligned with Corvee 2024 Tax Strategies Masterclass)
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
      "Maximize pre-tax 401(k) contributions to reduce current-year taxable income. The 2025 employee deferral limit is $23,500 ($31,000 if age 50+, or $34,750 for ages 60-63 with the new super catch-up). Contributions grow tax-deferred until withdrawal in retirement, when income and therefore the tax rate are typically lower.",
    eligibilityCriteria: [
      "Employee of a company that offers a 401(k) plan, or self-employed with a Solo 401(k)",
      "Earned income at least equal to the contribution amount",
      "Under the annual deferral limit ($23,500 / $31,000 catch-up / $34,750 super catch-up ages 60-63)",
    ],
    implementationSteps: [
      "Review current 401(k) contribution rate with payroll or plan administrator",
      "Increase deferral percentage to reach the $23,500 annual limit",
      "If age 50+, add the $7,500 catch-up contribution (ages 60-63: $11,250 super catch-up)",
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
      "Simplified Employee Pension IRA allows self-employed individuals and small business owners to contribute up to 25% of net self-employment income (or compensation), with a maximum of $70,000 for 2025. Easy to set up and fund, with no annual filing requirements.",
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
    savingsFormula: "min(net_income * 0.25, 70000) * marginal_tax_rate",
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
      "Designed for self-employed individuals with no full-time employees. Combines employee deferrals ($23,500) with employer profit-sharing (25% of compensation), allowing total contributions up to $70,000 ($77,500 if 50+) for 2025. Offers both traditional and Roth options.",
    eligibilityCriteria: [
      "Self-employed with no full-time W-2 employees (spouse can participate)",
      "Earned income from the business",
      "Plan must be established by December 31 of the tax year",
    ],
    implementationSteps: [
      "Establish the Solo 401(k) plan with a provider by December 31",
      "Make employee deferral contributions ($23,500 / $31,000 catch-up / $34,750 super catch-up ages 60-63) by December 31",
      "Make employer profit-sharing contributions (25% of compensation) by tax filing deadline",
      "Choose traditional, Roth, or split contributions",
      "File Form 5500-EZ if plan assets exceed $250,000",
    ],
    taxFiling:
      "Employee deferrals reduce self-employment income. Employer contributions deducted on Schedule C or Form 1120-S. Form 5500-EZ when assets exceed $250,000.",
    ircReference: "IRC Section 401(k); Revenue Ruling 2004-12",
    applicableTo: ["sole_prop", "s_corp", "partnership"],
    incomeThreshold: { min: 40000 },
    savingsFormula: "(employee_deferral + employer_contribution) * marginal_tax_rate (max $70,000 total for 2025)",
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
      "Obtain description of services performed by business owner/shareholder employee",
      "Perform a 'market approach' analysis using RCReports.com to determine reasonableness",
      "Adjust compensation based on the market approach analysis for services performed",
      "Set up payroll (Gusto, ADP) and pay regular W-2 wages at the determined amount",
      "Distribute remaining profits as shareholder distributions (Schedule K-1)",
      "Store market approach analysis, job description, and salary confirmation for recordkeeping",
    ],
    taxFiling:
      "S-Corp: wages on Form 1040 Line 1, deduction on Form 1120-S Line 8, K-1 Line 1. C-Corp: Form 1120 Line 12 (officer compensation), Form 1125-E. Partnership: guaranteed payments on Form 1065 Line 10, K-1 Line 1. FICA applies only to W-2 wages.",
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
      "Purchase health insurance through individual market, healthcare.gov, or state exchange marketplace",
      "Verify no eligibility for an employer-subsidized health plan (through own or spouse's employer)",
      "For S-Corp >2% shareholders: premiums must be paid by the corporation and included in W-2 wages",
      "Track all qualifying premium payments: medical, dental, vision, qualified long-term care, Medicare",
      "Calculate the deduction (limited to net self-employment income)",
      "Report on Schedule 1 (Form 1040), Part II, Line 17",
    ],
    taxFiling:
      "Deducted on Form 1040, Schedule 1, Part II, Line 17. For S-Corp >2% shareholders, premiums included in W-2 Box 1 but excluded from Box 3 and Box 5 (not subject to FICA). Deduction cannot exceed earned income from the business.",
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
      "Reimbursements are NOT reported on the employee W-2. Business deducts as 'Employee Benefit Programs': Form 1120-S Line 18, Form 1120 Line 24, Form 1065 Line 19. Schedule C Line 14. See IRS Publication 15-B. Not available for sole prop owners — only employees.",
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
      "Employ your children under age 18 in a sole proprietorship or husband-wife partnership. Their wages are exempt from FICA (Social Security and Medicare), and each child can earn up to the standard deduction ($15,000 for 2025) tax-free. The business gets a full deduction for wages paid.",
    eligibilityCriteria: [
      "Business structured as a sole proprietorship or partnership owned entirely by parents",
      "Child is under age 18 for FICA exemption (under 21 for FUTA exemption)",
      "Child performs legitimate services appropriate for their age",
      "Wages must be reasonable for the work performed",
    ],
    implementationSteps: [
      "Build job description for each child the business wishes to hire (Workable.com templates)",
      "Assess fair market wage for services performed (salary.com/research/salary)",
      "Track hours performed and job duties (Tsheets.com or equivalent time tracking)",
      "Craft employment memo/agreement outlining duties and reasonable salary",
      "Complete IRS Form W-4 and Form I-9 for employment eligibility",
      "Establish separate bank account for each child (BankOfAmerica, Chase First Banking, Capital One 360 Kids)",
      "Pay wages with proper withholding: income tax withholding required regardless of age; no FICA for under 18 in sole prop/spousal partnership; no FUTA for under 21",
      "Provide pay stubs, file child's tax return, complete payroll forms (940/941/W-2/W-3/SUTA)",
    ],
    taxFiling:
      "Business deducts wages on Schedule C (sole prop) or Form 1065 (partnership). Child receives W-2. No FICA for children under 18 in sole prop/spousal partnership. No FUTA for children under 21. Child's income sheltered by $15,000 standard deduction (2025). Complete W-4 and I-9 for each child.",
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
      "Create and set up FMC entity (Schedule C or C-Corp) with attorney — register name, articles, EIN, licenses",
      "Build job descriptions for family members the business wishes to hire",
      "Assess fair market wages for services performed (salary.com/research)",
      "Track hours and job duties; craft employment agreements for each family member",
      "Complete W-4 and I-9 for each employee; set up payroll",
      "Craft management services agreement between FMC and main operating company",
      "Track management services, submit invoices from FMC to main company",
      "Receive payment from main company for management services rendered",
      "File Schedule C or 1120 for FMC; complete payroll forms (940/941/W-2/W-3)",
    ],
    taxFiling:
      "FMC files Schedule C (if sole prop) or Form 1120/1120-S. Management fees are income to FMC and deductions to paying entities. Main company deducts fees. File 1099 between entities.",
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
      "Apply 100% bonus depreciation (restored by OBBBA for 2025+) to short-life assets for massive first-year deductions",
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
      "Immediately deduct the full cost of qualifying business assets (equipment, vehicles, furniture, software, certain improvements) in the year placed in service, up to $1,290,000 for 2025 (enhanced by OBBBA). The deduction phases out dollar-for-dollar when total asset purchases exceed $3,220,000.",
    eligibilityCriteria: [
      "Tangible personal property used in the active conduct of a trade or business",
      "Property placed in service during the tax year",
      "Total purchases under the $3,220,000 phase-out threshold",
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
    savingsFormula: "min(asset_cost, 1290000) * marginal_tax_rate",
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
      "First-year bonus depreciation allows an additional 100% depreciation deduction on qualified assets in the year they are placed in service. For 2025, the rate was restored to 100% by the One Big Beautiful Bill Act (was phasing down: 80% in 2023, 60% in 2024). Unlike Section 179, bonus depreciation can create a net operating loss and has no income limitation.",
    eligibilityCriteria: [
      "Qualified property with a MACRS recovery period of 20 years or less",
      "Property must be new or used (first use by the taxpayer)",
      "Placed in service during the tax year",
      "No phase-out based on total purchases (unlike Section 179)",
    ],
    implementationSteps: [
      "Identify all qualifying assets placed in service during the year",
      "Calculate 100% (2025 rate, restored by OBBBA) bonus depreciation on the depreciable basis",
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
      "Schedule C Line 30 (Business Use of Home). Partnership: Schedule E Line 28, column (i). S-Corp/C-Corp: not available directly for owner-employees — use Accountable Plan instead. Regular method requires Form 8829. Simplified method: $5/sq ft up to 300 sq ft ($1,500 max).",
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
      "Plan meeting dates for the year (up to 14 days maximum)",
      "Find comparable quotes for local venues (Peerspace.com, Liquidspace.com) to establish fair market rate",
      "Complete and sign a rental agreement between the business and taxpayer (eforms.com)",
      "Document each rental occasion: date, business purpose, attendees, meeting content",
      "Invoice the business and transfer rental fees from business to taxpayer",
      "You do NOT report the income (14-day exclusion). Keep all documentation on file",
    ],
    taxFiling:
      "Rental income excluded from individual return entirely under Section 280A(g). Business deducts as 'Other Expenses': Schedule C Line 48/27a, Form 1120-S Line 19, Form 1120 Line 26, Form 1065 Line 20. Attach statement listing expense. Business files 1099 to individual.",
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
      "50% of qualifying meals deducted: Schedule C Line 24b, Form 1120-S Line 19 (attach statement), Form 1120 Line 26 (attach statement), Form 1065 Line 20 (attach statement). See IRS Publication 463.",
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
      "Schedule C Line 24a (travel), Line 24b (meals at 50%). Form 1120-S Line 19 (attach statement). Form 1120 Line 26 (attach statement). Form 1065 Line 20 (attach statement). Per diem rates can be used per Publication 463.",
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
      "Maximize itemized deductions by strategically timing medical expenses (>7.5% AGI), mortgage interest, SALT payments (now $40,000 cap for joint filers per OBBBA, up from $10,000; phases out above $500,000 AGI), and charitable contributions. Compare to the standard deduction ($15,000 single / $30,000 MFJ for 2025) and bunch deductions into alternating years if beneficial.",
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
      "Schedule A (Form 1040 or 1040-SR): Line 1 (medical >7.5% AGI), Line 5a-5e (taxes — SALT now capped at $40,000 joint filers per OBBBA), Line 8a (mortgage interest), Line 12-14 (charitable). Form 8283 for noncash charitable >$500. Form 4684 for casualty/theft losses from federally declared disaster.",
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
      "Claimed on Form 1040 Line 19 and Schedule 8812 Line 38. State child tax credits available in: CA, CO, CT, ID, ME, MD, MA, NJ, NM, NY, OK, VT.",
    ircReference: "IRC Section 24; IRS Publication 501",
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
      "Form 6765 Line 44. Corporation: Form 6765 with Form 3800. Partnership: Form 6765 filed with Form 1065, Schedule K Line 15f. S-Corp: Form 6765 filed with Form 1120-S, Schedule K Line 13g. Payroll tax offset election on Form 6765 Section D. States with R&D credits: AL, AK, AZ, AR, CA, CO, CT, DE, FL, GA, HI, ID, IL, IN, IA, KS, KY, LA, ME, MD, MA, MN, NE, NH, NJ, NM, NY, ND, OH, PA, RI, SC, TX, UT, VT, VA, WI.",
    ircReference: "IRC Section 41; IRC Section 174 (amortization); IRC Section 3111(f) (payroll tax offset for small businesses)",
    applicableTo: ["sole_prop", "s_corp", "c_corp", "partnership"],
    incomeThreshold: { min: 75000 },
    savingsFormula: "qualified_research_expenses * 0.20 (regular) or * 0.14 (simplified)",
    typicalSavingsRange: { min: 5000, max: 100000 },
    qualificationQuestions: [
      "Can you describe a new or improved product or process you created (business component test)?",
      "Did you attempt to eliminate technological uncertainty in development (uncertainty test)?",
      "Does your process of experimentation rely on engineering, physics, chemistry, biology, or computer science?",
      "Did you evaluate alternatives through modeling, simulation, or systematic trial and error (experimentation test)?",
    ],
    riskLevel: "medium",
    timeToImplement: "Up to 8 hours (study and documentation); retroactive claims allowed",
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
      "Obtain a qualified caregiver (licensed daycare, professional medical care provider — cannot be your spouse, parent of child, or your dependent)",
      "Obtain the care provider's name, address, and TIN (SSN or EIN) via IRS Form W-10",
      "Keep a payment history of all dependent care expenses (weekly or as often as care is given)",
      "Calculate the credit percentage based on AGI (20% for AGI above $43,000; up to 35% for lower AGI)",
      "Apply the percentage to qualifying expenses (capped at $3,000 for one / $6,000 for two+)",
      "If married, must file jointly. Complete Form 2441 and attach to Form 1040",
    ],
    taxFiling:
      "Form 2441 (Child and Dependent Care Expenses) must be completed and attached to Form 1040. Credit claimed on Form 1040, Schedule 3, Line 13g.",
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
      "Create and properly set up the business entity: articles of incorporation, bylaws, EIN registration",
      "File Form 2553 (Election by a Small Business Corporation) — must be filed within 2 months and 15 days after start of tax year",
      "Obtain signatures of all shareholders on Form 2553 and mail with confirmation of receipt",
      "Determine proper reasonable compensation using RCReports.com; set up payroll (Gusto, ADP)",
      "Submit W-2s by January 31st, Form 940 (FUTA) annually, estimated quarterly taxes",
      "File Form 1120-S annually by March 15th; issue K-1s to all shareholders",
    ],
    taxFiling:
      "Form 2553 to elect. File Form 1120-S annually by March 15. Issue Schedule K-1 to shareholders. Shareholders report on Form 1040, Schedule E page 2. Estimated taxes due April 15, June 15, Sep 15, Jan 15.",
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
      "Prepare Form 2553 and write 'Filed Pursuant to Rev. Proc. 2013-30' at the top",
      "Craft a reasonable cause statement for failing to file by the original due date",
      "Craft a reasonable cause shareholder's statement — send to all shareholders for signature",
      "Assemble the Late S Election package: Form 2553 + reasonable cause statement + shareholder statement",
      "Mail the package with confirmation of receipt to the appropriate IRS office",
      "Follow up 2-3 months later to confirm IRS receipt of verification letter",
      "If more than 3 years and 75 days late, request a Private Letter Ruling (more costly)",
    ],
    taxFiling:
      "File Form 2553 with reasonable cause per Rev. Proc. 2013-30. Once accepted, file Form 1120-S and issue K-1s for all applicable years. May need to amend prior returns.",
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
      "Coverdell: Form 1040 Schedule 1, Line 8z. Non-qualified distributions: Form 5329 Part II for penalty, reported on Schedule 2 Line 8 (IRS Publication 970). 529: Contributions not federally deductible (many states offer deduction). Qualified distributions via Form 1099-Q are tax-free. Non-qualified: earnings taxed + 10% penalty.",
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

  // ===========================================================================
  // ADDITIONAL CORVEE STRATEGIES
  // ===========================================================================

  // --- Compensation ---
  {
    id: "hsa_strategy",
    title: "Health Savings Account (HSA) Maximization",
    category: "medical",
    description:
      "Triple tax advantage: contributions are pre-tax, growth is tax-free, and qualified withdrawals are tax-free. For 2025, contribute up to $4,350 (individual) or $8,750 (family), plus $1,000 catch-up if 55+. Enhanced by OBBBA to include gym memberships and nutrition programs as eligible expenses. HSA funds can be invested and grow indefinitely — making it one of the best retirement vehicles available.",
    eligibilityCriteria: [
      "Must be enrolled in a High Deductible Health Plan (HDHP)",
      "Cannot be enrolled in Medicare",
      "Cannot be claimed as a dependent on someone else's tax return",
      "2025 HDHP minimum deductible: $1,650 (self) / $3,300 (family)",
    ],
    implementationSteps: [
      "Confirm enrollment in a qualifying HDHP",
      "Open an HSA with a provider that offers investment options",
      "Contribute the maximum allowed for your coverage level",
      "Invest HSA funds beyond a cash reserve for long-term growth",
      "Keep receipts for qualified medical expenses (can reimburse yourself years later)",
    ],
    taxFiling: "Form 8889. Deduction on Form 1040, Line 13. Above-the-line deduction — no itemizing required.",
    ircReference: "IRC Section 223",
    applicableTo: ["individual", "sole_prop", "s_corp", "c_corp", "partnership"],
    savingsFormula: "contribution_amount * marginal_tax_rate + FICA_savings (if through employer)",
    typicalSavingsRange: { min: 1500, max: 6000 },
    qualificationQuestions: ["Are you enrolled in a High Deductible Health Plan?", "Have you maximized your HSA contributions?"],
    riskLevel: "low",
    timeToImplement: "1-2 hours",
  },
  {
    id: "donor_advised_fund",
    title: "Donor-Advised Fund (DAF)",
    category: "charity",
    description:
      "Make a large charitable contribution in a single year for an immediate tax deduction, then distribute grants to charities over multiple years. Ideal for bunching strategy — take the standard deduction in off years and itemize in the contribution year. Can fund with cash, appreciated stock, or other assets.",
    eligibilityCriteria: [
      "Donor makes regular charitable contributions",
      "Itemized deductions near or below the standard deduction threshold",
      "For appreciated stock: held more than one year",
    ],
    implementationSteps: [
      "Open a DAF with a sponsoring organization (Fidelity Charitable, Schwab Charitable, etc.)",
      "Contribute appreciated stock or cash to the DAF before year-end",
      "Take the full tax deduction in the contribution year",
      "Recommend grants to qualified charities over time from the DAF",
    ],
    taxFiling: "Schedule A, Line 12. Form 8283 for non-cash donations over $500.",
    ircReference: "IRC Section 170(e)(1)(B)(ii); IRC Section 4966",
    applicableTo: ["individual"],
    incomeThreshold: { min: 100000 },
    savingsFormula: "bunched_contribution * marginal_tax_rate + avoided_capital_gains_on_stock",
    typicalSavingsRange: { min: 5000, max: 40000 },
    qualificationQuestions: ["Do you make regular charitable contributions?", "Do you hold appreciated stock?"],
    riskLevel: "low",
    timeToImplement: "1-2 weeks",
  },
  {
    id: "tax_loss_harvesting",
    title: "Tax-Loss Harvesting",
    category: "deductions",
    description:
      "Sell investments at a loss to offset capital gains and up to $3,000 of ordinary income per year. Excess losses carry forward indefinitely. Reinvest in similar (but not substantially identical) securities to maintain market exposure while capturing the tax benefit.",
    eligibilityCriteria: [
      "Taxpayer holds investments with unrealized losses",
      "Must avoid wash sale rule: cannot buy substantially identical securities within 30 days before/after the sale",
      "Most beneficial when offsetting short-term capital gains (taxed at ordinary rates)",
    ],
    implementationSteps: [
      "Review portfolio for positions with unrealized losses",
      "Sell losing positions before year-end",
      "Wait 31 days before repurchasing substantially identical securities (wash sale rule)",
      "Or immediately reinvest in a similar but not identical fund/ETF",
      "Track carryforward losses for future years",
    ],
    taxFiling: "Schedule D and Form 8949. Net losses up to $3,000 deductible against ordinary income. Excess carries forward.",
    ircReference: "IRC Section 1091 (Wash Sale Rule); IRC Section 1211(b) ($3,000 limit)",
    applicableTo: ["individual", "s_corp", "c_corp", "partnership"],
    incomeThreshold: { min: 75000 },
    savingsFormula: "harvested_losses * marginal_tax_rate (or capital gains rate)",
    typicalSavingsRange: { min: 1000, max: 30000 },
    qualificationQuestions: ["Do you have investment accounts with unrealized losses?", "Have you realized capital gains this year?"],
    riskLevel: "low",
    timeToImplement: "1-2 hours",
  },
  {
    id: "qualified_opportunity_zone",
    title: "Qualified Opportunity Zone (QOZ) Investment",
    category: "real_estate",
    description:
      "Defer and potentially reduce capital gains by investing in a Qualified Opportunity Zone Fund. If held 10+ years, all appreciation in the QOZ investment is tax-free. Powerful for taxpayers with significant realized capital gains looking for long-term investments.",
    eligibilityCriteria: [
      "Taxpayer has realized capital gains to reinvest",
      "Investment must be made within 180 days of the gain",
      "Must invest in a Qualified Opportunity Fund (QOF) that holds QOZ property",
      "10-year hold required for tax-free appreciation",
    ],
    implementationSteps: [
      "Identify a capital gain eligible for deferral",
      "Research and select a Qualified Opportunity Fund (QOF)",
      "Invest the gain amount within 180 days of realization",
      "File Form 8949 and Form 8997 annually",
      "Hold the investment for 10+ years for maximum benefit",
    ],
    taxFiling: "Form 8949 (election to defer gain), Form 8997 (annual QOF statement).",
    ircReference: "IRC Section 1400Z-2",
    applicableTo: ["individual", "s_corp", "c_corp", "partnership"],
    incomeThreshold: { min: 200000 },
    savingsFormula: "deferred_gain * capital_gains_rate + appreciation * 0 (if held 10 years)",
    typicalSavingsRange: { min: 10000, max: 100000 },
    qualificationQuestions: ["Have you realized significant capital gains this year?", "Are you interested in long-term real estate or business investments?"],
    riskLevel: "medium",
    timeToImplement: "2-4 weeks",
  },
  {
    id: "sale_of_home_exclusion",
    title: "Sale of Home Gain Exclusion (Section 121)",
    category: "real_estate",
    description:
      "Exclude up to $250,000 ($500,000 for married filing jointly) of capital gains from the sale of your primary residence. Must have owned and used the home as your primary residence for at least 2 of the last 5 years. This is one of the largest tax-free income events available to individuals.",
    eligibilityCriteria: [
      "Must have owned the home for at least 2 of the last 5 years",
      "Must have used the home as primary residence for at least 2 of the last 5 years",
      "Cannot have excluded gain from another home sale in the past 2 years",
    ],
    implementationSteps: [
      "Verify ownership and use tests are met (2 out of 5 years)",
      "Calculate the gain (selling price minus adjusted basis)",
      "If gain exceeds exclusion limit, plan timing or consider partial exclusion",
      "No filing required if gain is fully excluded; report on Form 8949 if partially excluded",
    ],
    taxFiling: "Fully excluded: no reporting required. Partial exclusion: Form 8949 and Schedule D.",
    ircReference: "IRC Section 121",
    applicableTo: ["individual"],
    savingsFormula: "excluded_gain * capital_gains_rate (15% or 20%)",
    typicalSavingsRange: { min: 15000, max: 100000 },
    qualificationQuestions: ["Are you planning to sell your primary residence?", "Have you lived in the home for at least 2 of the last 5 years?"],
    riskLevel: "low",
    timeToImplement: "Immediate (if qualified)",
  },
  {
    id: "profit_sharing_plan",
    title: "Profit Sharing Plan",
    category: "retirement",
    description:
      "Employer-funded retirement plan that allows flexible annual contributions up to 25% of eligible compensation (max $70,000 for 2025). Unlike 401(k), contributions are entirely employer-funded and discretionary — allowing variable contributions based on business profitability each year.",
    eligibilityCriteria: [
      "Business must have earned income",
      "Can be combined with a 401(k) plan for stacking",
      "Total combined contribution limit: $70,000 (2025) or $77,500 if 50+",
    ],
    implementationSteps: [
      "Establish a profit sharing plan document",
      "Determine contribution formula (pro-rata, new comparability, or integrated)",
      "Make contributions by tax filing deadline (including extensions)",
      "File Form 5500 annually if plan assets exceed $250,000",
    ],
    taxFiling: "Form 5500 (annual return). Deduction on business return (Schedule C, 1120-S, etc.).",
    ircReference: "IRC Section 401(a); IRC Section 404(a)(3)",
    applicableTo: ["sole_prop", "s_corp", "c_corp", "partnership"],
    incomeThreshold: { min: 100000 },
    savingsFormula: "contribution_amount * marginal_tax_rate",
    typicalSavingsRange: { min: 5000, max: 50000 },
    qualificationQuestions: ["Does your business have consistent net income?", "Do you want to shelter more income beyond 401(k) limits?"],
    riskLevel: "low",
    timeToImplement: "2-4 weeks",
  },
  {
    id: "defined_benefit_plan",
    title: "Defined Benefit Pension Plan",
    category: "retirement",
    description:
      "The most powerful tax-sheltering retirement vehicle available. Annual contributions can exceed $200,000+ for older, high-income business owners. The plan promises a fixed annual benefit at retirement, and contributions are actuarially determined. Can be combined with a 401(k) and profit sharing for massive total deferrals.",
    eligibilityCriteria: [
      "Business owner or highly-compensated professional",
      "Consistent high income ($200K+) expected for at least 3-5 years",
      "Ideally age 45+ (contributions increase with age)",
      "Few or no employees (reduces cost of covering others)",
    ],
    implementationSteps: [
      "Hire an actuary to design the plan and calculate annual required contributions",
      "Establish the plan before year-end (contributions can be made until tax filing deadline)",
      "Make the required annual contribution (mandatory once established)",
      "File Form 5500 annually",
      "Plan can be frozen or terminated if business circumstances change",
    ],
    taxFiling: "Form 5500. Deduction on business return. Subject to actuarial certification.",
    ircReference: "IRC Section 412; IRC Section 404(a)(1)",
    applicableTo: ["sole_prop", "s_corp", "c_corp", "partnership"],
    incomeThreshold: { min: 200000 },
    savingsFormula: "annual_contribution * marginal_tax_rate (contributions can exceed $200K)",
    typicalSavingsRange: { min: 30000, max: 150000 },
    qualificationQuestions: ["Is your income consistently above $200K?", "Are you 45 or older?", "Do you have few or no employees?"],
    riskLevel: "medium",
    timeToImplement: "4-8 weeks (requires actuary)",
  },
  {
    id: "qbi_deduction",
    title: "Qualified Business Income (QBI) Deduction — Section 199A",
    category: "deductions",
    description:
      "Deduct up to 20% of qualified business income from pass-through entities (S-Corp, Partnership, Sole Prop). For a $350K business income, this could mean a $70,000 deduction. Subject to income-based phase-outs and W-2 wage/capital limitations for higher earners in specified service trades.",
    eligibilityCriteria: [
      "Income from a pass-through entity (S-Corp, Partnership, Sole Prop)",
      "Phase-out begins at $197,300 (single) / $394,600 (MFJ) for 2025",
      "Specified Service Trade or Business (SSTB) faces full phase-out above thresholds",
      "Non-SSTB limited to greater of: 50% of W-2 wages OR 25% of W-2 wages + 2.5% of UBIA",
    ],
    implementationSteps: [
      "Determine if the business qualifies (not an SSTB, or income below threshold)",
      "Calculate QBI from each qualified business",
      "Apply W-2 wage / UBIA limitations if income exceeds threshold",
      "Optimize by increasing W-2 wages paid (for S-Corps) to maximize the 50% W-2 limitation",
      "Consider entity restructuring if SSTB limitations apply",
    ],
    taxFiling: "Form 8995 (simplified) or Form 8995-A (detailed). Deduction on Form 1040, Line 13.",
    ircReference: "IRC Section 199A",
    applicableTo: ["sole_prop", "s_corp", "partnership"],
    incomeThreshold: { min: 50000 },
    savingsFormula: "qualified_business_income * 20% * marginal_tax_rate",
    typicalSavingsRange: { min: 3000, max: 50000 },
    qualificationQuestions: ["Do you have income from a pass-through entity?", "Is your business a specified service trade?"],
    riskLevel: "low",
    timeToImplement: "Included in tax return preparation",
  },
  {
    id: "deferred_compensation",
    title: "Deferred Compensation Plan (Section 409A)",
    category: "compensation",
    description:
      "Defer a portion of salary or bonus to a future year when you may be in a lower tax bracket (e.g., retirement). Unlike 401(k), there are no contribution limits. The deferred amount is not subject to current income tax, though it remains subject to FICA at the time of deferral.",
    eligibilityCriteria: [
      "Must be a highly compensated employee or key executive",
      "Employer must offer a nonqualified deferred compensation plan",
      "Election to defer must be made before the start of the tax year (or within 30 days of eligibility)",
    ],
    implementationSteps: [
      "Evaluate whether a deferred compensation plan makes sense given future tax rate expectations",
      "Submit deferral election before the applicable deadline",
      "Choose distribution schedule (lump sum or installments at separation/retirement)",
      "Monitor plan compliance with Section 409A requirements",
    ],
    taxFiling: "Reported on W-2 Box 12 (Code Y) for FICA purposes. Income deferred until distribution year.",
    ircReference: "IRC Section 409A",
    applicableTo: ["individual", "s_corp", "c_corp"],
    incomeThreshold: { min: 200000 },
    savingsFormula: "deferred_amount * (current_marginal_rate - future_marginal_rate)",
    typicalSavingsRange: { min: 5000, max: 50000 },
    qualificationQuestions: ["Does your employer offer a deferred compensation plan?", "Do you expect to be in a lower tax bracket in the future?"],
    riskLevel: "medium",
    timeToImplement: "1-2 weeks (election period)",
  },
  {
    id: "fringe_benefits",
    title: "Tax-Free Fringe Benefits",
    category: "compensation",
    description:
      "Provide employees (including owner-employees of C-Corps) with tax-free fringe benefits: group term life insurance (up to $50K), employee achievement awards, qualified transportation/parking ($315/month), employee discounts, and educational assistance ($5,250/year). These are deductible to the business and tax-free to the employee.",
    eligibilityCriteria: [
      "Must have a business entity (most effective for C-Corps)",
      "Benefits must be provided under a qualified plan",
      "Must generally be offered to employees on a non-discriminatory basis",
    ],
    implementationSteps: [
      "Identify which fringe benefits are most valuable for your situation",
      "Establish formal benefit plans (transportation, education, life insurance)",
      "Document the benefits and ensure non-discrimination requirements are met",
      "Deduct the cost on the business return",
    ],
    taxFiling: "Deducted on business return. Excluded from employee W-2 income (if properly structured).",
    ircReference: "IRC Sections 79, 119, 127, 132",
    applicableTo: ["s_corp", "c_corp", "partnership"],
    savingsFormula: "benefit_value * (employee_marginal_rate + employer_FICA_rate)",
    typicalSavingsRange: { min: 2000, max: 15000 },
    qualificationQuestions: ["Does your business provide any employee benefits?", "Are you a C-Corp owner-employee?"],
    riskLevel: "low",
    timeToImplement: "1-2 weeks",
  },
  {
    id: "work_opportunity_credit",
    title: "Work Opportunity Tax Credit (WOTC)",
    category: "credits",
    description:
      "Receive a tax credit of $2,400-$9,600 per qualifying new hire from targeted groups: veterans, ex-felons, SNAP recipients, long-term unemployed, and others. The credit is based on wages paid during the first year of employment. Available to any business that hires qualifying individuals.",
    eligibilityCriteria: [
      "Business must hire individuals from one of the targeted groups",
      "Must submit IRS Form 8850 within 28 days of the employee's start date",
      "Employee must work at least 120 hours for minimum credit (400 hours for full credit)",
    ],
    implementationSteps: [
      "Screen new hires using Form 8850 (Pre-Screening Notice)",
      "Submit Form 8850 to the state workforce agency within 28 days of hire",
      "Track qualifying wages for each eligible employee",
      "Claim the credit on Form 5884",
    ],
    taxFiling: "Form 5884 (Work Opportunity Credit). Flows to Form 3800 (General Business Credit).",
    ircReference: "IRC Section 51",
    applicableTo: ["sole_prop", "s_corp", "c_corp", "partnership"],
    savingsFormula: "$2,400-$9,600 per qualifying hire",
    typicalSavingsRange: { min: 2400, max: 25000 },
    qualificationQuestions: ["Is your business planning to hire new employees?", "Do you screen new hires for WOTC eligibility?"],
    riskLevel: "low",
    timeToImplement: "Immediate (screening at hire)",
  },
  {
    id: "roth_conversion",
    title: "Roth Conversion Strategy",
    category: "retirement",
    description:
      "Convert traditional IRA/401(k) funds to Roth accounts, paying tax now at current rates to enjoy tax-free growth and withdrawals in retirement. Most valuable when current tax rates are expected to be lower than future rates, or in years with lower-than-usual income. No income limits for conversions.",
    eligibilityCriteria: [
      "Has funds in traditional IRA or 401(k)",
      "Expects to be in an equal or higher tax bracket in retirement",
      "Has cash available to pay the conversion tax (avoid using converted funds)",
      "No income limits for Roth conversions (unlike Roth contributions)",
    ],
    implementationSteps: [
      "Analyze current vs. expected future tax rates",
      "Determine optimal conversion amount (stay within current tax bracket)",
      "Execute the conversion before year-end",
      "Pay estimated taxes on the converted amount",
      "Consider partial conversions over multiple years to manage bracket impact",
    ],
    taxFiling: "Form 8606 (Nondeductible IRAs). Converted amount included as ordinary income on Form 1040.",
    ircReference: "IRC Section 408A(d)(3)",
    applicableTo: ["individual", "sole_prop", "s_corp", "partnership"],
    savingsFormula: "converted_amount * (future_rate - current_rate) + tax_free_growth",
    typicalSavingsRange: { min: 3000, max: 50000 },
    qualificationQuestions: ["Do you have funds in traditional IRA/401(k)?", "Do you expect higher tax rates in the future?"],
    riskLevel: "low",
    timeToImplement: "1-2 hours",
  },
  {
    id: "qualified_charitable_distribution",
    title: "Qualified Charitable Distribution (QCD)",
    category: "charity",
    description:
      "If age 70½ or older, donate up to $105,000 directly from your IRA to qualified charities. The distribution satisfies your Required Minimum Distribution (RMD) but is excluded from taxable income — far better than taking the RMD as income and donating separately.",
    eligibilityCriteria: [
      "Must be age 70½ or older at the time of distribution",
      "Distribution must go directly from IRA to a qualified 501(c)(3) charity",
      "Maximum $105,000 per year (2024, indexed for inflation)",
      "Cannot be from a SEP IRA or SIMPLE IRA that received employer contributions that year",
    ],
    implementationSteps: [
      "Verify age eligibility (70½+)",
      "Contact IRA custodian to set up a direct transfer to the charity",
      "Ensure the distribution is made payable to the charity (not to you)",
      "Obtain written acknowledgment from the charity",
    ],
    taxFiling: "Reported on Form 1099-R. Excluded from income by writing 'QCD' on Form 1040, Line 4b.",
    ircReference: "IRC Section 408(d)(8)",
    applicableTo: ["individual"],
    incomeThreshold: { min: 75000 },
    savingsFormula: "QCD_amount * marginal_tax_rate (since it's excluded from income)",
    typicalSavingsRange: { min: 3000, max: 25000 },
    qualificationQuestions: ["Are you age 70½ or older?", "Do you have Required Minimum Distributions from an IRA?"],
    riskLevel: "low",
    timeToImplement: "1-2 weeks",
  },
  {
    id: "education_assistance_program",
    title: "Qualified Education Assistance Program",
    category: "education",
    description:
      "Employers can provide up to $5,250 per year in tax-free educational assistance to employees under Section 127. This covers tuition, fees, books, and supplies for undergraduate or graduate courses. The benefit is deductible to the business and tax-free to the employee.",
    eligibilityCriteria: [
      "Must have a written educational assistance plan (Section 127)",
      "Plan must not discriminate in favor of highly compensated employees",
      "Maximum $5,250 per employee per year",
      "Can cover job-related or non-job-related education",
    ],
    implementationSteps: [
      "Adopt a written Section 127 educational assistance plan",
      "Provide eligible education benefits to qualifying employees",
      "Exclude the benefit from employees' W-2 income (up to $5,250)",
      "Deduct the cost as a business expense",
    ],
    taxFiling: "Excluded from employee W-2 wages. Deducted on business return.",
    ircReference: "IRC Section 127",
    applicableTo: ["s_corp", "c_corp", "partnership"],
    savingsFormula: "$5,250 * (employee_marginal_rate + employer_FICA_rate)",
    typicalSavingsRange: { min: 1500, max: 5000 },
    qualificationQuestions: ["Do you or your employees have ongoing education expenses?"],
    riskLevel: "low",
    timeToImplement: "1-2 weeks",
  },

  // --- Remaining Corvee strategies ---
  {
    id: "simple_ira",
    title: "SIMPLE IRA Plan",
    category: "retirement",
    description:
      "A Savings Incentive Match Plan for Employees. Easy to set up with lower administrative costs than a 401(k). Employees can defer up to $16,500 (2025), $20,000 if 50+ (super catch-up $21,750 for ages 60-63). Employer must either match up to 3% or contribute 2% for all eligible employees. Ideal for small businesses with under 100 employees.",
    eligibilityCriteria: [
      "Business with 100 or fewer employees who earned $5,000+ in the prior year",
      "No other employer retirement plan may be maintained",
      "Must be established by October 1 of the plan year",
    ],
    implementationSteps: [
      "Choose a financial institution as the SIMPLE IRA plan trustee",
      "Execute IRS Form 5304-SIMPLE or 5305-SIMPLE",
      "Notify employees 60 days before the plan year",
      "Set up payroll deductions for employee contributions",
      "Make employer matching or non-elective contributions by tax filing deadline",
    ],
    taxFiling: "No Form 5500 filing required. Employer contributions deducted on business return.",
    ircReference: "IRC Section 408(p)",
    applicableTo: ["sole_prop", "s_corp", "partnership"],
    savingsFormula: "employee_deferral * marginal_tax_rate + employer_match_deduction",
    typicalSavingsRange: { min: 3000, max: 15000 },
    qualificationQuestions: ["Does your business have fewer than 100 employees?", "Do you currently have a retirement plan?"],
    riskLevel: "low",
    timeToImplement: "1-2 weeks",
  },
  {
    id: "fica_tip_credit",
    title: "FICA Tip Credit (Section 45B)",
    category: "credits",
    description:
      "Restaurant and food service employers can claim a tax credit for the employer's share of FICA taxes paid on employee tips exceeding the federal minimum wage ($7.25/hr). The credit is dollar-for-dollar against income tax liability. For a busy restaurant, this can generate $10,000-$50,000+ annually.",
    eligibilityCriteria: [
      "Business is in food/beverage industry where tipping is customary",
      "Employees receive tips of $20+ per month",
      "Credit applies only to tips above the amount needed to bring employee to minimum wage",
    ],
    implementationSteps: [
      "Calculate total tips reported by employees above minimum wage threshold",
      "Compute employer FICA (7.65%) on the qualifying tip amount",
      "Claim the credit on Form 8846",
      "Credit flows to Form 3800 (General Business Credit)",
    ],
    taxFiling: "Form 8846 with Form 3800. Schedule C Line 6, Partnership Form 1065 Schedule K Line 15f, S-Corp Form 1120-S Schedule K Line 13g, C-Corp Form 1120 Schedule J Part I Line 5c. State minimum wage rates may override federal rate — check applicable state laws.",
    ircReference: "IRC Section 45B",
    applicableTo: ["sole_prop", "s_corp", "c_corp", "partnership"],
    savingsFormula: "qualifying_tips * 7.65% FICA rate",
    typicalSavingsRange: { min: 5000, max: 50000 },
    qualificationQuestions: ["Is your business in the food/beverage industry?", "Do employees regularly receive tips?"],
    riskLevel: "low",
    timeToImplement: "Included in tax return preparation",
  },
  {
    id: "c_corp_election",
    title: "C-Corporation Election",
    category: "entity",
    description:
      "Elect C-Corporation status for the flat 21% corporate tax rate — significantly lower than top individual rates (37%). Allows retention of earnings in the corporation at lower rates, full deduction of fringe benefits (health insurance, life insurance), and potential QSBS exclusion for $10M+ in capital gains.",
    eligibilityCriteria: [
      "Business generates substantial net income",
      "Plans to retain earnings for growth rather than distribute all profits",
      "Willing to accept double taxation on distributions (corporate + shareholder level)",
      "Owner wants tax-free fringe benefits (health insurance, MERP)",
    ],
    implementationSteps: [
      "Evaluate whether C-Corp structure provides net tax savings after double taxation",
      "File Form 8832 (Entity Classification Election) if converting from LLC",
      "Set up corporate formalities (minutes, resolutions, stock certificates)",
      "Establish payroll for officer compensation",
      "Implement fringe benefit plans (MERP, group term life, etc.)",
    ],
    taxFiling: "Form 1120 (U.S. Corporation Income Tax Return). Due April 15.",
    ircReference: "IRC Section 11 (flat 21% rate); IRC Section 1202 (QSBS)",
    applicableTo: ["c_corp"],
    incomeThreshold: { min: 100000 },
    savingsFormula: "(individual_rate - 21%) * retained_earnings + fringe_benefit_savings",
    typicalSavingsRange: { min: 5000, max: 50000 },
    qualificationQuestions: ["Does your business retain significant earnings?", "Would you benefit from tax-free fringe benefits?"],
    riskLevel: "medium",
    timeToImplement: "2-4 weeks",
  },
  {
    id: "partnership_election",
    title: "Partnership Entity Election",
    category: "entity",
    description:
      "Elect partnership status for multi-member businesses to gain flexible allocation of income, losses, and credits among partners. Partnerships avoid entity-level tax while allowing special allocations that can optimize each partner's individual tax situation.",
    eligibilityCriteria: [
      "Business has two or more owners",
      "Owners want flexible income/loss allocation",
      "Default classification for multi-member LLC; formal election via Form 8832 if needed",
    ],
    implementationSteps: [
      "Draft or update the partnership/operating agreement with allocation provisions",
      "File Form 8832 if changing from another entity classification",
      "Obtain new EIN if needed",
      "Set up K-1 reporting for each partner",
      "Evaluate special allocation strategies (Section 704(b) substantial economic effect test)",
    ],
    taxFiling: "Form 1065 (Return of Partnership Income). Schedule K-1 for each partner.",
    ircReference: "IRC Section 761; Reg. 301.7701-3 (entity classification)",
    applicableTo: ["partnership"],
    savingsFormula: "Varies based on allocation strategy and partner tax situations",
    typicalSavingsRange: { min: 3000, max: 30000 },
    qualificationQuestions: ["Does your business have multiple owners?", "Would flexible income allocation benefit your partners?"],
    riskLevel: "low",
    timeToImplement: "2-4 weeks",
  },
  {
    id: "oil_gas_deduction",
    title: "Oil & Gas Investment Deductions",
    category: "deductions",
    description:
      "Invest in oil and gas drilling programs to deduct intangible drilling costs (IDCs) — typically 65-80% of the investment — in the first year. IDCs include labor, chemicals, mud, and grease used in drilling. This is one of the few remaining tax shelters with immediate large deductions against ordinary income.",
    eligibilityCriteria: [
      "Taxpayer has high ordinary income to offset",
      "Willing to accept investment risk in energy sector",
      "Accredited investor status typically required",
      "Working interest in oil/gas not subject to passive activity limitations",
    ],
    implementationSteps: [
      "Evaluate oil and gas investment opportunities with qualified sponsors",
      "Determine allocation between IDCs (deductible) and tangible costs (depreciable)",
      "Make investment before year-end for current-year deduction",
      "Report IDC deduction on Schedule C or appropriate business return",
    ],
    taxFiling: "Form 1040, Schedule C or E. IDCs deducted under IRC Section 263(c).",
    ircReference: "IRC Section 263(c) (IDCs); IRC Section 469(c)(3) (working interest exception)",
    applicableTo: ["individual", "s_corp", "c_corp", "partnership"],
    incomeThreshold: { min: 300000 },
    savingsFormula: "investment_amount * 70% IDC ratio * marginal_tax_rate",
    typicalSavingsRange: { min: 15000, max: 75000 },
    qualificationQuestions: ["Do you have high ordinary income to offset?", "Are you an accredited investor?"],
    riskLevel: "high",
    timeToImplement: "4-8 weeks (due diligence)",
  },
  {
    id: "conservation_easement",
    title: "Conservation Easement",
    category: "deductions",
    description:
      "Donate a conservation easement on qualified real property to a land trust or government entity for a charitable deduction based on the reduction in property value. Deduction can be up to 50% of AGI (100% for qualified farmers/ranchers), with 15-year carryforward. IRS scrutinizes syndicated easements heavily.",
    eligibilityCriteria: [
      "Owns qualified real property with conservation value",
      "Easement must be granted to a qualified organization in perpetuity",
      "Must serve a valid conservation purpose (open space, habitat, historic)",
      "Qualified appraisal required for deductions over $5,000",
      "WARNING: Syndicated conservation easements are under heavy IRS scrutiny",
    ],
    implementationSteps: [
      "Identify property with legitimate conservation value",
      "Engage a qualified appraiser to determine the before/after property value",
      "Select a qualified land trust or government entity as recipient",
      "Execute the conservation easement deed",
      "File Form 8283 (Noncash Charitable Contributions) with tax return",
    ],
    taxFiling: "Schedule A, Line 12. Form 8283 (Section B) with qualified appraisal. Deduction limited to 50% of AGI.",
    ircReference: "IRC Section 170(h); IRC Section 170(b)(1)(E) (enhanced deduction for farmers)",
    applicableTo: ["individual", "s_corp", "c_corp", "partnership"],
    incomeThreshold: { min: 500000 },
    savingsFormula: "easement_value * marginal_tax_rate",
    typicalSavingsRange: { min: 20000, max: 150000 },
    qualificationQuestions: ["Do you own property with conservation value?", "Are you comfortable with IRS scrutiny risk?"],
    riskLevel: "high",
    timeToImplement: "3-6 months (appraisal + legal)",
  },
  {
    id: "ic_disc",
    title: "IC-DISC (Interest Charge Domestic International Sales Corporation)",
    category: "deductions",
    description:
      "A tax incentive for U.S. exporters. The IC-DISC receives a commission from the operating company on export sales, converting ordinary income into qualified dividends taxed at 20% (plus 3.8% NIIT). Effective for manufacturers, distributors, and companies with $10M+ in export revenue.",
    eligibilityCriteria: [
      "Company has export revenue (goods manufactured, grown, or extracted in the US sold internationally)",
      "Must incorporate as a separate domestic corporation",
      "95% of assets and receipts must be export-related",
      "Minimum export receipts typically $2M+ for cost-effectiveness",
    ],
    implementationSteps: [
      "Incorporate the IC-DISC as a separate C-Corporation",
      "File Form 4876-A (Election to be Treated as an IC-DISC)",
      "Establish a commission agreement between the operating company and IC-DISC",
      "Calculate the commission (greater of 4% of export receipts or 50% of export profits)",
      "IC-DISC distributes qualified dividends to shareholders at preferential rates",
    ],
    taxFiling: "Form 1120-IC-DISC. Interest charge computed on Form 8404.",
    ircReference: "IRC Sections 991-997",
    applicableTo: ["s_corp", "c_corp", "partnership"],
    incomeThreshold: { min: 500000 },
    savingsFormula: "export_commission * (ordinary_rate - qualified_dividend_rate)",
    typicalSavingsRange: { min: 10000, max: 100000 },
    qualificationQuestions: ["Does your company export goods manufactured in the US?", "Is your annual export revenue above $2M?"],
    riskLevel: "medium",
    timeToImplement: "4-8 weeks (incorporation + election)",
  },
  {
    id: "disaster_relief_139",
    title: "Disaster Relief Payments (Section 139)",
    category: "compensation",
    description:
      "Employers can make tax-free disaster relief payments to employees for reasonable and necessary personal, family, living, or funeral expenses incurred due to a qualified disaster. These payments are deductible by the employer and excluded from the employee's income — no W-2 reporting required.",
    eligibilityCriteria: [
      "A qualified disaster has occurred (federally declared or determined by employer)",
      "Payments cover reasonable/necessary personal expenses from the disaster",
      "Not limited to FEMA-declared disasters — also covers employer-determined events",
      "Cannot compensate for lost wages; only for actual disaster-related expenses",
    ],
    implementationSteps: [
      "Establish a written disaster relief program/policy",
      "Document the qualifying disaster event",
      "Employees submit expense documentation for disaster-related costs",
      "Employer makes payments — excluded from W-2 and employment taxes",
      "Deduct payments as ordinary business expense",
    ],
    taxFiling: "Excluded from employee W-2. Deducted as business expense on employer return.",
    ircReference: "IRC Section 139",
    applicableTo: ["s_corp", "c_corp", "partnership"],
    savingsFormula: "payment_amount * (employee_marginal_rate + employer_FICA_rate)",
    typicalSavingsRange: { min: 1000, max: 10000 },
    qualificationQuestions: ["Has a qualified disaster affected your employees?"],
    riskLevel: "low",
    timeToImplement: "1-2 weeks",
  },
  {
    id: "simple_401k",
    title: "SIMPLE 401(k) Plan",
    category: "retirement",
    description:
      "A hybrid retirement plan for small businesses combining features of a SIMPLE IRA and 401(k). Employees can defer up to $16,000 (2024), $19,500 if 50+. Employer makes either matching contributions (up to 3%) or non-elective contributions (2% for all). Allows Roth contributions and loans, unlike SIMPLE IRA.",
    eligibilityCriteria: [
      "Business with 100 or fewer employees who earned $5,000+ in the prior year",
      "No other employer retirement plan maintained",
      "Must be established before October 1 of the plan year",
    ],
    implementationSteps: [
      "Choose a financial institution as plan trustee",
      "Adopt the plan using IRS Form 5304-SIMPLE or 5305-SIMPLE with 401(k) provisions",
      "Notify employees at least 60 days before the plan year",
      "Set up payroll deductions for employee contributions",
      "Make employer matching (up to 3%) or non-elective (2%) contributions",
    ],
    taxFiling: "Form 5500 filing required. Employer contributions deducted on business return.",
    ircReference: "IRC Section 401(k)(11)",
    applicableTo: ["sole_prop", "s_corp", "c_corp", "partnership"],
    incomeThreshold: { min: 50000 },
    savingsFormula: "employee_deferral * marginal_tax_rate + employer_contribution_deduction",
    typicalSavingsRange: { min: 3000, max: 15000 },
    qualificationQuestions: ["Does your business have fewer than 100 employees?", "Do you want loan and Roth features in a simple retirement plan?"],
    riskLevel: "low",
    timeToImplement: "2-4 weeks",
  },
  {
    id: "section_412e3_plan",
    title: "Section 412(e)(3) Fully Insured Defined Benefit Plan",
    category: "retirement",
    description:
      "A defined benefit plan funded exclusively with insurance products (annuities and life insurance). Contributions are guaranteed and often higher than traditional DB plans — particularly beneficial for older business owners (55+) with high income who want to shelter $200,000-$300,000+ per year. No investment risk since returns are guaranteed by the insurer.",
    eligibilityCriteria: [
      "Business owner or self-employed professional age 50+",
      "Consistent high income ($300,000+) for at least 3-5 years",
      "Few or no employees (reduces cost of covering others)",
      "Willing to commit to guaranteed annual premiums",
    ],
    implementationSteps: [
      "Engage an actuary and insurance specialist to design the plan",
      "Select qualifying insurance and annuity contracts",
      "Adopt the plan document before fiscal year end",
      "Make required annual premium contributions (mandatory once established)",
      "File Form 5500 annually; maintain actuarial compliance",
    ],
    taxFiling: "Form 5500 with actuarial certification. Deduction on business return (Schedule C, 1120-S, 1065, or 1120).",
    ircReference: "IRC Section 412(e)(3); formerly Section 412(i)",
    applicableTo: ["sole_prop", "s_corp", "c_corp", "partnership"],
    incomeThreshold: { min: 300000 },
    savingsFormula: "annual_premium * marginal_tax_rate (premiums often $200K-$300K+)",
    typicalSavingsRange: { min: 60000, max: 150000 },
    qualificationQuestions: ["Is your income consistently above $300K?", "Are you age 50 or older?", "Do you want guaranteed retirement benefits with no investment risk?"],
    riskLevel: "medium",
    timeToImplement: "2-3 months (requires actuary and insurer)",
  },
  {
    id: "captive_insurance",
    title: "Captive Insurance Company",
    category: "deductions",
    description:
      "Form a wholly-owned insurance company (captive) to insure risks of your operating business. Premiums paid to the captive are deductible by the operating company, and a small captive (under $2.65M in premiums) can elect to be taxed only on investment income under Section 831(b). Requires legitimate insurable risks and actuarial support.",
    eligibilityCriteria: [
      "Business with identifiable insurable risks not fully covered by commercial insurance",
      "Annual premiums must be actuarially justified and reasonable",
      "For 831(b) election: net premiums under $2.65 million (2024)",
      "WARNING: IRS lists micro-captives as a listed transaction — requires proper structure",
    ],
    implementationSteps: [
      "Conduct a feasibility study with a captive insurance consultant",
      "Obtain an actuarial study to determine appropriate premium levels",
      "Form the captive entity in a favorable domicile (Vermont, Delaware, etc.)",
      "Execute insurance policies between the operating company and captive",
      "File Form 8886 (Reportable Transaction Disclosure) and annual returns",
    ],
    taxFiling: "Operating company deducts premiums. Captive files Form 1120-PC or elects 831(b). Form 8886 required.",
    ircReference: "IRC Section 831(b); IRC Section 162 (premium deduction); Notice 2016-66 (listed transaction)",
    applicableTo: ["s_corp", "c_corp", "partnership"],
    incomeThreshold: { min: 500000 },
    savingsFormula: "premium_amount * operating_company_marginal_rate - captive_tax",
    typicalSavingsRange: { min: 30000, max: 200000 },
    qualificationQuestions: ["Does your business have significant uninsured or underinsured risks?", "Is your business income above $500K?"],
    riskLevel: "high",
    timeToImplement: "3-6 months (feasibility, actuarial, formation)",
  },
  {
    id: "private_foundation",
    title: "Private Foundation",
    category: "charity",
    description:
      "Establish a private foundation for significant charitable giving with maximum control. Deduct contributions up to 30% of AGI for cash (20% for appreciated property). Unlike DAFs, foundations allow family involvement in governance and grant-making. Can pay reasonable compensation to family members who serve as directors or officers.",
    eligibilityCriteria: [
      "Taxpayer with significant wealth or income for substantial charitable giving",
      "Wants ongoing control over charitable distributions",
      "Willing to comply with annual distribution requirements (5% of assets)",
      "Annual administrative costs justify the scale ($500K+ in initial funding typical)",
    ],
    implementationSteps: [
      "Engage an attorney to draft articles of incorporation and bylaws",
      "Apply for 501(c)(3) tax-exempt status with the IRS (Form 1023)",
      "Fund the foundation with cash, appreciated stock, or other assets",
      "Distribute at least 5% of net investment assets annually to qualifying charities",
      "File Form 990-PF annually and comply with self-dealing and excess business holdings rules",
    ],
    taxFiling: "Contributions deducted on Schedule A. Foundation files Form 990-PF annually.",
    ircReference: "IRC Section 509(a); IRC Section 170(b)(1)(B) (30% AGI limit); IRC Section 4941-4945 (excise taxes)",
    applicableTo: ["individual"],
    incomeThreshold: { min: 500000 },
    savingsFormula: "contribution_amount * marginal_tax_rate + avoided_capital_gains_on_appreciated_assets",
    typicalSavingsRange: { min: 20000, max: 150000 },
    qualificationQuestions: ["Do you plan significant ongoing charitable giving ($50K+/year)?", "Do you want family involvement in charitable governance?"],
    riskLevel: "medium",
    timeToImplement: "3-6 months (formation + IRS application)",
  },
  {
    id: "schedule_c_entity",
    title: "Schedule C Sole Proprietorship",
    category: "entity",
    description:
      "The simplest business structure — report business income and expenses directly on Schedule C of your personal return. No separate entity formation required. Ideal for freelancers and consultants starting out. All net income is subject to self-employment tax (15.3%), which is why evaluating S-Corp election is critical once income exceeds $50K-$60K.",
    eligibilityCriteria: [
      "Activity qualifies as a business operated for profit",
      "Business owner is involved with continuity and regularity",
      "Single owner (not a partnership)",
    ],
    implementationSteps: [
      "Register your business name with your state (DBA if needed)",
      "Obtain an EIN from the IRS",
      "Obtain required business licenses and permits",
      "Set up a separate business bank account",
      "Track all income and expenses; file Schedule C with Form 1040",
    ],
    taxFiling: "Schedule C (Form 1040). Self-employment tax on Schedule SE.",
    ircReference: "IRC Section 162 (trade or business expenses); IRC Section 1402 (self-employment tax)",
    applicableTo: ["sole_prop"],
    savingsFormula: "business_deductions * marginal_tax_rate",
    typicalSavingsRange: { min: 2000, max: 20000 },
    qualificationQuestions: ["Are you a sole owner of an unincorporated business?", "Have you evaluated whether S-Corp election would save payroll taxes?"],
    riskLevel: "low",
    timeToImplement: "1-2 hours",
  },
  {
    id: "employee_achievement_award",
    title: "Employee Achievement Award",
    category: "compensation",
    description:
      "Employers can provide tax-free achievement awards to employees for length of service or safety achievements. Awards of tangible personal property (not cash) up to $400 per employee ($1,600 under a qualified plan) are deductible by the employer and excluded from the employee's income.",
    eligibilityCriteria: [
      "Award must be for length of service or safety achievement",
      "Must be tangible personal property (not cash, gift cards, or securities)",
      "Length-of-service awards: employee must have at least 5 years of service",
      "Safety awards: cannot be given to managers or to more than 10% of employees",
    ],
    implementationSteps: [
      "Establish a written qualified plan for employee achievement awards",
      "Identify qualifying employees (5+ years service or safety achievement)",
      "Purchase tangible personal property as awards (watches, jewelry, tools, etc.)",
      "Present awards in a meaningful ceremony or presentation",
      "Document the award, recipient, reason, and cost",
    ],
    taxFiling: "Deducted on business return. Excluded from employee W-2 income up to the applicable limit.",
    ircReference: "IRC Section 74(c); IRC Section 274(j)",
    applicableTo: ["s_corp", "c_corp", "partnership", "sole_prop"],
    savingsFormula: "award_cost * (employee_marginal_rate + employer_FICA_rate)",
    typicalSavingsRange: { min: 500, max: 5000 },
    qualificationQuestions: ["Do you have long-tenured employees (5+ years)?", "Does your business have a safety program?"],
    riskLevel: "low",
    timeToImplement: "1-2 weeks",
  },
  {
    id: "business_vehicle_mileage",
    title: "Business Vehicle & Mileage Deduction",
    category: "deductions",
    description:
      "Deduct vehicle expenses for business use via the standard mileage rate ($0.70/mile for 2025) or actual expenses (gas, insurance, maintenance, depreciation). Choose the method that provides the larger deduction. For vehicles over 6,000 lbs GVW (SUVs, trucks), Section 179 can provide a first-year deduction up to $30,500.",
    eligibilityCriteria: [
      "Vehicle is used for business purposes",
      "Must maintain a contemporaneous mileage log (date, destination, purpose, miles)",
      "Standard mileage rate must be elected in the first year the vehicle is used for business",
      "If using actual expenses, must track all vehicle costs",
    ],
    implementationSteps: [
      "Choose between standard mileage rate or actual expense method",
      "Maintain a detailed mileage log throughout the year",
      "For actual method: track gas, oil, repairs, insurance, registration, depreciation",
      "Calculate business-use percentage (business miles / total miles)",
      "For heavy vehicles (6,000+ lbs): evaluate Section 179 deduction",
    ],
    taxFiling: "Schedule C (Line 9 for car expenses) or Form 2106. Form 4562 for depreciation. Listed property rules apply.",
    ircReference: "IRC Section 162(a); IRC Section 274(d) (substantiation); Revenue Procedure 2023-34 (mileage rate)",
    applicableTo: ["sole_prop", "s_corp", "c_corp", "partnership"],
    savingsFormula: "business_miles * mileage_rate * marginal_tax_rate OR actual_expenses * business_pct * marginal_tax_rate",
    typicalSavingsRange: { min: 1000, max: 15000 },
    qualificationQuestions: ["Do you use a vehicle for business?", "How many business miles do you drive annually?", "Do you have a vehicle over 6,000 lbs GVW?"],
    riskLevel: "low",
    timeToImplement: "Immediate (mileage tracking habit)",
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
  const realEstateVal = (answers.real_estate || "").toLowerCase();
  const ownsRealEstate = realEstateVal !== "" && !realEstateVal.startsWith("no");
  const hasRentalProperty = ownsRealEstate && (
    realEstateVal.includes("rental") || realEstateVal.includes("both") || realEstateVal === "yes"
  );
  const hasHomeOffice =
    answers.home_office !== undefined &&
    answers.home_office.toLowerCase().startsWith("yes");
  const selfEmploymentVal = (answers.self_employment || "").toLowerCase();
  const isSelfEmployed = selfEmploymentVal === "yes" || (
    answers.health_insurance !== undefined &&
    answers.health_insurance.toLowerCase().includes("self-employed")
  );
  const hasMortgage =
    answers.mortgage !== undefined &&
    answers.mortgage.toLowerCase() === "yes";
  const isSCorp = entityTypes.includes("s_corp");
  const isSoleProp = entityTypes.includes("sole_prop");
  const isIndividualOnly =
    entityTypes.length === 1 && entityTypes[0] === "individual";
  const hasBusinessEntity = !isIndividualOnly || isSelfEmployed;
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
      case "donor_advised_fund":
        return additionalContext.includes("charit") || income >= 150000;

      case "qualified_charitable_distribution":
        return additionalContext.includes("charit") || additionalContext.includes("rmd") || additionalContext.includes("70");

      // HSA — broadly applicable
      case "hsa_strategy":
        return true;

      // Tax-loss harvesting — needs investments
      case "tax_loss_harvesting":
        return additionalContext.includes("invest") || additionalContext.includes("stock") || additionalContext.includes("crypto") || income >= 150000;

      // Opportunity Zone — needs capital gains
      case "qualified_opportunity_zone":
        return additionalContext.includes("capital gain") || additionalContext.includes("invest") || ownsRealEstate;

      // Sale of home — needs real estate
      case "sale_of_home_exclusion":
        return ownsRealEstate || additionalContext.includes("sell") || additionalContext.includes("home");

      // Retirement stacking
      case "profit_sharing_plan":
      case "defined_benefit_plan":
        return hasBusinessEntity && income >= 200000;

      // QBI deduction — pass-through entities
      case "qbi_deduction":
        return hasBusinessEntity && !entityTypes.includes("c_corp");

      // Deferred comp
      case "deferred_compensation":
        return income >= 200000;

      // Fringe benefits
      case "fringe_benefits":
      case "education_assistance_program":
        return hasBusinessEntity;

      // Work opportunity credit
      case "work_opportunity_credit":
        return hasBusinessEntity;

      // Roth conversion — broadly applicable
      case "roth_conversion":
        return true;

      // SIMPLE IRA — small business
      case "simple_ira":
        return hasBusinessEntity;

      // FICA Tip Credit — restaurant/food service only
      case "fica_tip_credit":
        return hasBusinessEntity && (additionalContext.includes("restaurant") || additionalContext.includes("food") || additionalContext.includes("tip"));

      // C-Corp election
      case "c_corp_election":
        return entityTypes.includes("c_corp");

      // Partnership election
      case "partnership_election":
        return entityTypes.includes("partnership");

      // Oil & Gas — high income, accredited investors
      case "oil_gas_deduction":
        return income >= 300000 && (additionalContext.includes("oil") || additionalContext.includes("gas") || additionalContext.includes("energy") || additionalContext.includes("invest"));

      // Conservation easement — very high income, owns land
      case "conservation_easement":
        return income >= 500000 && ownsRealEstate;

      // IC-DISC — exporters only
      case "ic_disc":
        return hasBusinessEntity && (additionalContext.includes("export") || additionalContext.includes("international") || additionalContext.includes("manufacturing"));

      // Disaster relief
      case "disaster_relief_139":
        return hasBusinessEntity;

      // SIMPLE 401(k) — small business
      case "simple_401k":
        return hasBusinessEntity;

      // Section 412(e)(3) — high income, older owners
      case "section_412e3_plan":
        return hasBusinessEntity && income >= 300000;

      // Captive Insurance — high income businesses
      case "captive_insurance":
        return hasBusinessEntity && income >= 500000;

      // Private Foundation — wealthy individuals
      case "private_foundation":
        return income >= 500000 && (additionalContext.includes("charit") || additionalContext.includes("foundation"));

      // Schedule C entity — sole proprietors
      case "schedule_c_entity":
        return isSoleProp;

      // Employee Achievement Award — businesses with employees
      case "employee_achievement_award":
        return hasBusinessEntity;

      // Business vehicle/mileage — businesses that use vehicles
      case "business_vehicle_mileage":
        return hasBusinessEntity || additionalContext.includes("vehicle");

      default:
        return true;
    }
  }).sort(
    (a, b) => b.typicalSavingsRange.max - a.typicalSavingsRange.max
  );
}

/**
 * Get all strategies applicable to a specific entity type, grouped by category.
 * Used for the strategy sidebar in Smart Plan.
 */
export function getStrategiesByEntity(
  entityType: string
): { category: StrategyCategory; strategies: MasterStrategy[] }[] {
  const filtered = MASTER_STRATEGIES.filter((s) =>
    s.applicableTo.includes(entityType)
  ).sort((a, b) => b.typicalSavingsRange.max - a.typicalSavingsRange.max);

  const grouped = new Map<string, MasterStrategy[]>();
  for (const s of filtered) {
    const list = grouped.get(s.category) || [];
    list.push(s);
    grouped.set(s.category, list);
  }

  return STRATEGY_CATEGORIES.filter((c) => grouped.has(c.id)).map((c) => ({
    category: c,
    strategies: grouped.get(c.id)!,
  }));
}
