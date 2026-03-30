// =============================================================================
// Qualification Engine — Structured Corvée-Style Interview Flow
// Drives the voice-guided tax planning intake conversation
// =============================================================================

export interface QualificationQuestion {
  id: string;
  strategyId: string;
  strategyTitle: string;
  question: string;
  helpText?: string;
  answerType: "yes_no" | "multiple_choice" | "number" | "text" | "currency";
  options?: string[];
  required: boolean;
  followUpIf?: { answer: string; nextQuestionId: string };
}

export interface QualificationSection {
  id: string;
  title: string;
  description: string;
  phase: "profile" | "qualification" | "calculation";
  questions: QualificationQuestion[];
}

export interface InterviewState {
  currentSectionIndex: number;
  currentQuestionIndex: number;
  answers: Record<string, string>;
  qualifiedStrategies: string[];
  disqualifiedStrategies: string[];
  completedSections: string[];
}

// =============================================================================
// Phase 1: Profile Building Questions (asked first, always)
// =============================================================================

const PROFILE_SECTION: QualificationSection = {
  id: "profile",
  title: "Getting to Know You",
  description: "Let me learn about your financial situation so I can find the best tax strategies for you.",
  phase: "profile",
  questions: [
    {
      id: "p_occupation",
      strategyId: "profile",
      strategyTitle: "Client Profile",
      question: "What do you do for a living?",
      helpText: "This helps me identify industry-specific tax strategies.",
      answerType: "text",
      required: true,
    },
    {
      id: "p_entity_type",
      strategyId: "profile",
      strategyTitle: "Client Profile",
      question: "How is your business structured?",
      helpText: "Your entity type determines which strategies are available.",
      answerType: "multiple_choice",
      options: [
        "I'm a W-2 employee (no business)",
        "Sole Proprietorship or Single-Member LLC",
        "LLC with S-Corp Election",
        "S-Corporation",
        "C-Corporation",
        "Partnership",
      ],
      required: true,
    },
    {
      id: "p_filing_status",
      strategyId: "profile",
      strategyTitle: "Client Profile",
      question: "What's your filing status?",
      answerType: "multiple_choice",
      options: ["Single", "Married Filing Jointly", "Married Filing Separately", "Head of Household"],
      required: true,
    },
    {
      id: "p_income",
      strategyId: "profile",
      strategyTitle: "Client Profile",
      question: "What's your approximate annual income?",
      helpText: "Include all sources — wages, business income, investments, rental income.",
      answerType: "multiple_choice",
      options: ["Under $75,000", "$75,000 to $150,000", "$150,000 to $300,000", "$300,000 to $500,000", "$500,000 to $1 million", "Over $1 million"],
      required: true,
    },
    {
      id: "p_dependents",
      strategyId: "profile",
      strategyTitle: "Client Profile",
      question: "Do you have any children or dependents?",
      answerType: "multiple_choice",
      options: ["No dependents", "1 child", "2 children", "3 or more children", "Other dependents"],
      required: true,
    },
    {
      id: "p_state",
      strategyId: "profile",
      strategyTitle: "Client Profile",
      question: "What state do you live in?",
      helpText: "Some strategies have state-specific benefits or limitations.",
      answerType: "text",
      required: true,
    },
  ],
};

// =============================================================================
// Phase 2: Strategy Qualification Questions (from Corvée Masterclass)
// Each section maps to a strategy tab from the Excel
// =============================================================================

const STRATEGY_SECTIONS: QualificationSection[] = [
  // ---------------------------------------------------------------------------
  // S-CORP / REASONABLE COMPENSATION
  // ---------------------------------------------------------------------------
  {
    id: "reasonable_comp",
    title: "Compensation Optimization",
    description: "Let's see if we can optimize how you pay yourself to save on self-employment taxes.",
    phase: "qualification",
    questions: [
      {
        id: "rc_pays_compensation",
        strategyId: "reasonable_compensation_scorp",
        strategyTitle: "Reasonable Compensation",
        question: "Does your business currently pay compensation to you as an owner or shareholder-employee?",
        helpText: "This is important for S-Corps and C-Corps to optimize the salary vs distribution split.",
        answerType: "yes_no",
        required: true,
      },
      {
        id: "rc_current_salary",
        strategyId: "reasonable_compensation_scorp",
        strategyTitle: "Reasonable Compensation",
        question: "What's your current annual salary from the business?",
        helpText: "We'll compare this against market rates for your role to determine if it's reasonable.",
        answerType: "currency",
        required: true,
      },
      {
        id: "rc_distribution_amount",
        strategyId: "reasonable_compensation_scorp",
        strategyTitle: "Reasonable Compensation",
        question: "How much do you take in distributions or draws from the business annually?",
        answerType: "currency",
        required: true,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // AUGUSTA RULE
  // ---------------------------------------------------------------------------
  {
    id: "augusta_rule",
    title: "Augusta Rule — Home Rental Deduction",
    description: "You may be able to rent your home to your business for up to 14 days a year, tax-free.",
    phase: "qualification",
    questions: [
      {
        id: "ar_willing_to_host",
        strategyId: "augusta_rule",
        strategyTitle: "Augusta Rule",
        question: "Would you be willing to hold business meetings at your personal residence this year?",
        helpText: "This could include annual meetings, planning sessions, team meetings, or company events.",
        answerType: "yes_no",
        required: true,
      },
      {
        id: "ar_frequency",
        strategyId: "augusta_rule",
        strategyTitle: "Augusta Rule",
        question: "How often would you host these business meetings at home? You can do up to 14 days per year.",
        answerType: "multiple_choice",
        options: ["Monthly (12 days)", "Quarterly (4 days)", "A few times a year (6-8 days)", "Maximum 14 days"],
        required: true,
      },
      {
        id: "ar_local_rate",
        strategyId: "augusta_rule",
        strategyTitle: "Augusta Rule",
        question: "If you were to rent a meeting space in your area, what would it cost per day?",
        helpText: "This establishes the fair market rental rate. Look up local conference room or event space daily rates.",
        answerType: "currency",
        required: true,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // HOME OFFICE
  // ---------------------------------------------------------------------------
  {
    id: "home_office",
    title: "Home Office Deduction",
    description: "If you use part of your home exclusively for business, you may qualify for a deduction.",
    phase: "qualification",
    questions: [
      {
        id: "ho_has_office",
        strategyId: "home_office",
        strategyTitle: "Home Office",
        question: "Do you have a dedicated home office space used exclusively for business?",
        answerType: "yes_no",
        required: true,
      },
      {
        id: "ho_percentage",
        strategyId: "home_office",
        strategyTitle: "Home Office",
        question: "What percentage of your work time do you spend in the home office for business purposes?",
        answerType: "multiple_choice",
        options: ["Less than 50%", "About 50%", "Greater than 50%", "Almost all my work"],
        required: true,
      },
      {
        id: "ho_sqft_office",
        strategyId: "home_office",
        strategyTitle: "Home Office",
        question: "What's the square footage of your home office?",
        answerType: "number",
        required: true,
      },
      {
        id: "ho_sqft_total",
        strategyId: "home_office",
        strategyTitle: "Home Office",
        question: "What's the total square footage of your home?",
        answerType: "number",
        required: true,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // ACCOUNTABLE PLAN
  // ---------------------------------------------------------------------------
  {
    id: "accountable_plan",
    title: "Accountable Plan — Business Expense Reimbursement",
    description: "An accountable plan lets your business reimburse you tax-free for legitimate business expenses.",
    phase: "qualification",
    questions: [
      {
        id: "ap_travel",
        strategyId: "accountable_plan",
        strategyTitle: "Accountable Plan",
        question: "Do you plan to travel for business purposes this year?",
        answerType: "yes_no",
        required: true,
      },
      {
        id: "ap_meals",
        strategyId: "accountable_plan",
        strategyTitle: "Accountable Plan",
        question: "Does your business incur meal expenses at restaurants for business purposes?",
        answerType: "yes_no",
        required: true,
      },
      {
        id: "ap_oop_expenses",
        strategyId: "accountable_plan",
        strategyTitle: "Accountable Plan",
        question: "Do you have other out-of-pocket business expenses that aren't currently reimbursed?",
        helpText: "Things like office supplies, software subscriptions, phone bills, professional memberships.",
        answerType: "yes_no",
        required: true,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // RETIREMENT PLANNING
  // ---------------------------------------------------------------------------
  {
    id: "retirement",
    title: "Retirement Plan Optimization",
    description: "Retirement contributions are one of the most powerful tax deductions available.",
    phase: "qualification",
    questions: [
      {
        id: "ret_has_plan",
        strategyId: "traditional_401k_max",
        strategyTitle: "Retirement Planning",
        question: "Do you currently have a retirement plan set up?",
        answerType: "multiple_choice",
        options: ["401(k) through employer", "Solo 401(k)", "SEP IRA", "SIMPLE IRA", "Traditional IRA only", "No retirement plan"],
        required: true,
      },
      {
        id: "ret_maxing_out",
        strategyId: "traditional_401k_max",
        strategyTitle: "Retirement Planning",
        question: "Are you currently contributing the maximum allowed to your retirement accounts?",
        answerType: "yes_no",
        required: true,
      },
      {
        id: "ret_age",
        strategyId: "cash_balance_plan",
        strategyTitle: "Cash Balance Pension",
        question: "Are you over 40 years old?",
        helpText: "Certain advanced retirement plans like Cash Balance Pensions allow much higher contributions for older high earners.",
        answerType: "yes_no",
        required: true,
      },
      {
        id: "ret_employees",
        strategyId: "solo_401k",
        strategyTitle: "Solo 401(k)",
        question: "Do you have any full-time employees other than yourself and your spouse?",
        helpText: "Some retirement plans like Solo 401(k)s are only available to businesses with no other full-time employees.",
        answerType: "yes_no",
        required: true,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // SELF-EMPLOYED HEALTH INSURANCE
  // ---------------------------------------------------------------------------
  {
    id: "health_insurance",
    title: "Health Insurance Deduction",
    description: "Self-employed individuals can deduct 100% of their health insurance premiums.",
    phase: "qualification",
    questions: [
      {
        id: "hi_self_employed",
        strategyId: "self_employed_health_insurance",
        strategyTitle: "Self-Employed Health Insurance",
        question: "Do you meet the definition of self-employed — are you a sole proprietor, independent contractor, partner, or 2%+ S-Corp shareholder?",
        answerType: "yes_no",
        required: true,
      },
      {
        id: "hi_employer_plan",
        strategyId: "self_employed_health_insurance",
        strategyTitle: "Self-Employed Health Insurance",
        question: "Are you or your spouse eligible to participate in an employer-subsidized health plan?",
        helpText: "The self-employed health insurance deduction is only available for months when no employer plan is available.",
        answerType: "yes_no",
        required: true,
      },
      {
        id: "hi_premiums",
        strategyId: "self_employed_health_insurance",
        strategyTitle: "Self-Employed Health Insurance",
        question: "How much do you pay annually in health, dental, vision, and long-term care insurance premiums?",
        answerType: "currency",
        required: true,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // HIRING FAMILY MEMBERS
  // ---------------------------------------------------------------------------
  {
    id: "family_hiring",
    title: "Family Employment Strategies",
    description: "Hiring family members can shift income to lower tax brackets and create legitimate deductions.",
    phase: "qualification",
    questions: [
      {
        id: "fh_has_children",
        strategyId: "hiring_children",
        strategyTitle: "Hiring Children",
        question: "Do you have children between the ages of 7 and 17 who could perform legitimate work for your business?",
        helpText: "Children under 18 working for a parent's sole proprietorship are exempt from FICA taxes.",
        answerType: "yes_no",
        required: true,
      },
      {
        id: "fh_child_tasks",
        strategyId: "hiring_children",
        strategyTitle: "Hiring Children",
        question: "What kind of tasks could your children realistically perform? Things like filing, social media, cleaning the office, data entry?",
        answerType: "text",
        required: false,
      },
      {
        id: "fh_family_office",
        strategyId: "family_management_company",
        strategyTitle: "Family Office Management Company",
        question: "Does your family have significant wealth that could benefit from a management company for financial services like wealth management and planning?",
        answerType: "yes_no",
        required: true,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // R&D TAX CREDIT
  // ---------------------------------------------------------------------------
  {
    id: "rd_credit",
    title: "Research & Development Tax Credit",
    description: "If your business develops new or improved products or processes, you may qualify for R&D credits.",
    phase: "qualification",
    questions: [
      {
        id: "rd_new_product",
        strategyId: "rd_tax_credit",
        strategyTitle: "R&D Tax Credit",
        question: "Can you describe any new or improved products or processes your business has created to increase performance, function, reliability, or quality?",
        helpText: "This is the 'business component test' — the research must develop a new or improved business component.",
        answerType: "text",
        required: true,
      },
      {
        id: "rd_uncertainty",
        strategyId: "rd_tax_credit",
        strategyTitle: "R&D Tax Credit",
        question: "Did your development process involve eliminating uncertainty about capability, method, or appropriate design?",
        helpText: "The 'technological uncertainty test' — you must have faced genuine technical challenges.",
        answerType: "yes_no",
        required: true,
      },
      {
        id: "rd_experimentation",
        strategyId: "rd_tax_credit",
        strategyTitle: "R&D Tax Credit",
        question: "Did your process involve experimentation — like modeling, simulation, systematic trial and error — relying on engineering, computer science, or other hard sciences?",
        helpText: "This is the 'process of experimentation test.'",
        answerType: "yes_no",
        required: true,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // REAL ESTATE STRATEGIES
  // ---------------------------------------------------------------------------
  {
    id: "real_estate",
    title: "Real Estate Tax Strategies",
    description: "Real estate offers some of the most powerful tax benefits in the entire tax code.",
    phase: "qualification",
    questions: [
      {
        id: "re_owns_property",
        strategyId: "cost_segregation",
        strategyTitle: "Cost Segregation",
        question: "Do you own any commercial, rental, or mixed-use real estate?",
        answerType: "yes_no",
        required: true,
      },
      {
        id: "re_property_value",
        strategyId: "cost_segregation",
        strategyTitle: "Cost Segregation",
        question: "What's the approximate value of your real estate holdings?",
        answerType: "multiple_choice",
        options: ["Under $500,000", "$500,000 to $1 million", "$1 million to $5 million", "Over $5 million"],
        required: true,
      },
      {
        id: "re_hours_spent",
        strategyId: "real_estate_professional",
        strategyTitle: "Real Estate Professional Status",
        question: "Do you or your spouse spend more than 750 hours per year on real estate activities, and is that more than any other profession?",
        helpText: "Real Estate Professional Status allows you to deduct rental losses against ordinary income — this is a huge benefit.",
        answerType: "yes_no",
        required: true,
      },
      {
        id: "re_selling",
        strategyId: "1031_exchange",
        strategyTitle: "1031 Exchange",
        question: "Are you planning to sell any investment property in the near future?",
        helpText: "A 1031 exchange can defer capital gains indefinitely by reinvesting in like-kind property.",
        answerType: "yes_no",
        required: true,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // DEPRECIATION
  // ---------------------------------------------------------------------------
  {
    id: "depreciation",
    title: "Depreciation & Asset Strategies",
    description: "Accelerated depreciation can create massive upfront deductions for business assets.",
    phase: "qualification",
    questions: [
      {
        id: "dep_purchased_assets",
        strategyId: "bonus_depreciation",
        strategyTitle: "Bonus Depreciation",
        question: "Have you purchased or plan to purchase any business equipment, vehicles, or assets this year?",
        answerType: "yes_no",
        required: true,
      },
      {
        id: "dep_asset_value",
        strategyId: "section_179",
        strategyTitle: "Section 179 Expensing",
        question: "What's the approximate total value of business assets you've purchased or plan to purchase?",
        answerType: "currency",
        required: true,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // BUSINESS MEALS & TRAVEL
  // ---------------------------------------------------------------------------
  {
    id: "meals_travel",
    title: "Business Meals & Travel",
    description: "Properly documented business meals and travel can generate significant deductions.",
    phase: "qualification",
    questions: [
      {
        id: "mt_meals",
        strategyId: "business_meals",
        strategyTitle: "Business Meals",
        question: "Does your business incur meal expenses at restaurants for business purposes — client meetings, team lunches, business discussions?",
        answerType: "yes_no",
        required: true,
      },
      {
        id: "mt_meals_amount",
        strategyId: "business_meals",
        strategyTitle: "Business Meals",
        question: "Roughly how much does your business spend on meals annually?",
        answerType: "currency",
        required: true,
      },
      {
        id: "mt_travel",
        strategyId: "business_travel",
        strategyTitle: "Business Travel",
        question: "Do you travel for business purposes — conferences, client visits, business trips?",
        answerType: "yes_no",
        required: true,
      },
      {
        id: "mt_mileage",
        strategyId: "business_travel",
        strategyTitle: "Business Travel",
        question: "Approximately how many business miles do you drive per year?",
        answerType: "number",
        required: false,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // ENTITY ELECTION
  // ---------------------------------------------------------------------------
  {
    id: "entity_election",
    title: "Entity Structure Optimization",
    description: "The right entity structure can save thousands in taxes every year.",
    phase: "qualification",
    questions: [
      {
        id: "ee_considering_change",
        strategyId: "s_corp_election",
        strategyTitle: "S-Corp Election",
        question: "Have you considered changing your business entity type — for example, electing S-Corp status?",
        helpText: "S-Corp election can save significant self-employment taxes when net income exceeds $50,000-$60,000.",
        answerType: "yes_no",
        required: true,
      },
      {
        id: "ee_net_income",
        strategyId: "s_corp_election",
        strategyTitle: "S-Corp Election",
        question: "What's your business net income after expenses?",
        helpText: "S-Corp election typically makes sense when net income consistently exceeds $50,000.",
        answerType: "currency",
        required: true,
      },
    ],
  },
];

// =============================================================================
// Gap-Filling Question Pool
// Questions organized by what's MISSING from the profile, not by strategy.
// =============================================================================

export interface GapQuestion {
  id: string;
  question: string;
  helpText?: string;
  answerType: "yes_no" | "multiple_choice" | "number" | "text" | "currency";
  options?: string[];
  priority: "critical" | "important" | "nice_to_have";
  /** Profile fields that, if populated, make this question unnecessary */
  resolvedByProfileFields: string[];
  /** Only include when these conditions are true */
  applicableWhen?: {
    entityTypes?: string[];         // only these entity types
    excludeEntityTypes?: string[];  // exclude these entity types
    incomeAbove?: number;
    requiresBusinessIncome?: boolean;
    requiresRealEstate?: boolean;
    requiresDependents?: boolean;
  };
  /** Answer keys this populates for plan generation */
  feedsAnswerKeys: string[];
  /** Strategy IDs this helps qualify/disqualify */
  informsStrategies: string[];
}

const GAP_QUESTIONS: GapQuestion[] = [
  // ---- CRITICAL: Core financial info needed for any plan ----
  {
    id: "gap_retirement_type",
    question: "What type of retirement plan do you currently have, if any?",
    answerType: "multiple_choice",
    options: ["401(k) through employer", "Solo 401(k)", "SEP IRA", "SIMPLE IRA", "Traditional IRA only", "No retirement plan"],
    priority: "critical",
    resolvedByProfileFields: ["retirementAccountTypes"],
    feedsAnswerKeys: ["ret_has_plan"],
    informsStrategies: ["traditional_401k_max", "solo_401k", "sep_ira", "cash_balance_plan"],
  },
  {
    id: "gap_maxing_retirement",
    question: "Are you currently contributing the maximum allowed to your retirement accounts?",
    answerType: "yes_no",
    priority: "critical",
    resolvedByProfileFields: [],
    feedsAnswerKeys: ["ret_maxing_out"],
    informsStrategies: ["traditional_401k_max", "roth_conversion", "backdoor_roth"],
  },
  {
    id: "gap_health_premiums",
    question: "How much do you pay annually for health, dental, and vision insurance premiums?",
    answerType: "currency",
    priority: "critical",
    resolvedByProfileFields: [],
    applicableWhen: { excludeEntityTypes: ["individual"] },
    feedsAnswerKeys: ["hi_premiums"],
    informsStrategies: ["self_employed_health_insurance", "hsa_optimization"],
  },
  {
    id: "gap_business_salary",
    question: "What's your current annual salary from the business?",
    answerType: "currency",
    priority: "critical",
    resolvedByProfileFields: [],
    applicableWhen: { entityTypes: ["s_corp", "c_corp"] },
    feedsAnswerKeys: ["rc_current_salary"],
    informsStrategies: ["reasonable_compensation_scorp"],
  },
  {
    id: "gap_distributions",
    question: "How much do you take in distributions or draws from the business annually?",
    answerType: "currency",
    priority: "critical",
    resolvedByProfileFields: [],
    applicableWhen: { entityTypes: ["s_corp", "c_corp", "partnership"] },
    feedsAnswerKeys: ["rc_distribution_amount"],
    informsStrategies: ["reasonable_compensation_scorp"],
  },

  // ---- IMPORTANT: Situation-specific details ----
  {
    id: "gap_home_office",
    question: "Do you have a dedicated space at home used exclusively for business?",
    answerType: "yes_no",
    priority: "important",
    resolvedByProfileFields: [],
    applicableWhen: { requiresBusinessIncome: true },
    feedsAnswerKeys: ["ho_has_office"],
    informsStrategies: ["home_office"],
  },
  {
    id: "gap_business_meals_amount",
    question: "Roughly how much does your business spend on meals for client meetings and business discussions annually?",
    answerType: "currency",
    priority: "important",
    resolvedByProfileFields: [],
    applicableWhen: { requiresBusinessIncome: true },
    feedsAnswerKeys: ["mt_meals_amount"],
    informsStrategies: ["business_meals", "accountable_plan"],
  },
  {
    id: "gap_business_travel",
    question: "Do you travel for business purposes — conferences, client visits, or business trips?",
    answerType: "yes_no",
    priority: "important",
    resolvedByProfileFields: [],
    applicableWhen: { requiresBusinessIncome: true },
    feedsAnswerKeys: ["mt_travel"],
    informsStrategies: ["business_travel", "accountable_plan"],
  },
  {
    id: "gap_business_assets",
    question: "Have you purchased or do you plan to purchase any significant business equipment or assets this year?",
    answerType: "yes_no",
    priority: "important",
    resolvedByProfileFields: [],
    applicableWhen: { requiresBusinessIncome: true },
    feedsAnswerKeys: ["dep_purchased_assets"],
    informsStrategies: ["bonus_depreciation", "section_179"],
  },
  {
    id: "gap_re_type",
    question: "What type of real estate do you own — primary residence, rental property, or commercial?",
    answerType: "multiple_choice",
    options: ["Primary residence only", "Rental property", "Commercial property", "Multiple properties"],
    priority: "important",
    resolvedByProfileFields: [],
    applicableWhen: { requiresRealEstate: true },
    feedsAnswerKeys: ["re_owns_property", "re_property_type"],
    informsStrategies: ["cost_segregation", "augusta_rule", "1031_exchange", "real_estate_professional"],
  },
  {
    id: "gap_over_40",
    question: "Are you over 40 years old? This matters for certain advanced retirement strategies.",
    answerType: "yes_no",
    priority: "important",
    resolvedByProfileFields: [],
    applicableWhen: { incomeAbove: 150000 },
    feedsAnswerKeys: ["ret_age"],
    informsStrategies: ["cash_balance_plan", "defined_benefit"],
  },
  {
    id: "gap_employees",
    question: "Do you have any full-time employees other than yourself and your spouse?",
    answerType: "yes_no",
    priority: "important",
    resolvedByProfileFields: ["numberOfEmployees"],
    applicableWhen: { requiresBusinessIncome: true },
    feedsAnswerKeys: ["ret_employees"],
    informsStrategies: ["solo_401k", "hiring_children"],
  },
  {
    id: "gap_child_work",
    question: "Do you have children between ages 7-17 who could perform legitimate work for your business — like filing, social media, or data entry?",
    answerType: "yes_no",
    priority: "important",
    resolvedByProfileFields: [],
    applicableWhen: { requiresDependents: true, requiresBusinessIncome: true },
    feedsAnswerKeys: ["fh_has_children"],
    informsStrategies: ["hiring_children"],
  },
  {
    id: "gap_scorp_evaluation",
    question: "What's your approximate business net income after expenses?",
    helpText: "S-Corp election typically makes sense when net income consistently exceeds $50,000.",
    answerType: "currency",
    priority: "important",
    resolvedByProfileFields: ["businessIncome"],
    applicableWhen: { entityTypes: ["sole_prop"] },
    feedsAnswerKeys: ["ee_net_income"],
    informsStrategies: ["s_corp_election"],
  },

  // ---- NICE TO HAVE: Extra detail for richer plans ----
  {
    id: "gap_rd_activities",
    question: "Does your business develop new or improved products, software, or processes that involved technical challenges?",
    answerType: "yes_no",
    priority: "nice_to_have",
    resolvedByProfileFields: [],
    applicableWhen: { incomeAbove: 100000, requiresBusinessIncome: true },
    feedsAnswerKeys: ["rd_new_product"],
    informsStrategies: ["rd_tax_credit"],
  },
  {
    id: "gap_charitable",
    question: "Do you make charitable donations, and if so, roughly how much per year?",
    answerType: "text",
    priority: "nice_to_have",
    resolvedByProfileFields: ["hasCharitableGiving"],
    feedsAnswerKeys: ["charitable_amount"],
    informsStrategies: ["charitable_giving", "donor_advised_fund"],
  },
  {
    id: "gap_hsa",
    question: "Do you have a High Deductible Health Plan and contribute to an HSA?",
    answerType: "yes_no",
    priority: "nice_to_have",
    resolvedByProfileFields: [],
    feedsAnswerKeys: ["hsa_status"],
    informsStrategies: ["hsa_optimization"],
  },
  {
    id: "gap_additional_context",
    question: "Is there anything else about your financial situation I should know to build the best tax plan for you?",
    answerType: "text",
    priority: "nice_to_have",
    resolvedByProfileFields: [],
    feedsAnswerKeys: ["additional_context"],
    informsStrategies: [],
  },
];

// =============================================================================
// Gap-Filling Engine
// =============================================================================

/**
 * Compute which gap questions to ask based on existing profile data.
 * Returns a filtered, prioritized list capped at maxQuestions.
 */
export function computeGapQuestions(
  profile: ProfileForInterview | null,
  maxQuestions: number = 8
): GapQuestion[] {
  const entityType = profile?.entityType || "individual";
  const income = profile?.annualIncome
    ? typeof profile.annualIncome === "string"
      ? parseInt(String(profile.annualIncome).replace(/[^0-9]/g, ""), 10) || 0
      : profile.annualIncome
    : 0;
  const hasBusiness = profile?.hasBusinessIncome || ["s_corp", "c_corp", "partnership", "sole_prop"].includes(entityType);
  const hasRE = profile?.hasRealEstate || false;
  const hasDeps = (profile?.dependents ?? 0) > 0;

  // profileFieldValues: quick lookup for which profile fields have data
  const profileFieldValues: Record<string, boolean> = {};
  if (profile) {
    // Map known profile keys to whether they have meaningful values
    const p = profile as Record<string, unknown>;
    for (const key of Object.keys(p)) {
      const val = p[key];
      if (val === undefined || val === null || val === "" || val === false) continue;
      if (Array.isArray(val) && val.length === 0) continue;
      profileFieldValues[key] = true;
    }
  }

  return GAP_QUESTIONS
    .filter((q) => {
      // Skip if profile already has all the fields this question resolves
      if (q.resolvedByProfileFields.length > 0) {
        const allResolved = q.resolvedByProfileFields.every((f) => profileFieldValues[f]);
        if (allResolved) return false;
      }

      // Check applicability predicates
      const when = q.applicableWhen;
      if (!when) return true;
      if (when.entityTypes && !when.entityTypes.includes(entityType)) return false;
      if (when.excludeEntityTypes && when.excludeEntityTypes.includes(entityType)) return false;
      if (when.incomeAbove && income < when.incomeAbove) return false;
      if (when.requiresBusinessIncome && !hasBusiness) return false;
      if (when.requiresRealEstate && !hasRE) return false;
      if (when.requiresDependents && !hasDeps) return false;

      return true;
    })
    .sort((a, b) => {
      const order = { critical: 0, important: 1, nice_to_have: 2 };
      return order[a.priority] - order[b.priority];
    })
    .slice(0, maxQuestions);
}

/**
 * Convert gap questions into a single QualificationSection that works with the existing
 * InterviewState engine (recordAnswer, getCurrentQuestion, etc.).
 */
export function gapQuestionsToSection(questions: GapQuestion[]): QualificationSection {
  return {
    id: "gap_filling",
    title: "A Few Quick Questions",
    description: "I just need a few more details to build your personalized tax plan.",
    phase: "qualification",
    questions: questions.map((gq) => ({
      id: gq.id,
      strategyId: gq.informsStrategies[0] || "profile",
      strategyTitle: "Tax Plan Details",
      question: gq.question,
      helpText: gq.helpText,
      answerType: gq.answerType,
      options: gq.options,
      required: gq.priority !== "nice_to_have",
    })),
  };
}

/**
 * Create the gap-filling interview: one section of filtered questions + state.
 * Returns everything the voice hook needs to start the interview.
 */
export function createGapFillingInterview(
  profile: ProfileForInterview | null
): { sections: QualificationSection[]; state: InterviewState; profileSummary: string } {
  const gapQs = computeGapQuestions(profile);
  const section = gapQuestionsToSection(gapQs);
  const sections = [section];

  return {
    sections,
    state: {
      currentSectionIndex: 0,
      currentQuestionIndex: 0,
      answers: {},
      qualifiedStrategies: [],
      disqualifiedStrategies: [],
      completedSections: [],
    },
    profileSummary: profile ? buildProfileSummaryForVoice(profile) : "",
  };
}

// =============================================================================
// Engine Functions
// =============================================================================

/**
 * Get the full interview flow — profile questions first, then entity-relevant strategy sections.
 * Used as fallback when no profile exists (empty profile → full structured interview).
 */
export function getInterviewSections(
  entityType?: string,
  income?: number,
  hasRealEstate?: boolean,
  hasChildren?: boolean
): QualificationSection[] {
  const sections: QualificationSection[] = [PROFILE_SECTION];

  for (const section of STRATEGY_SECTIONS) {
    // Filter sections based on entity type and profile
    if (section.id === "reasonable_comp" && entityType !== "s_corp" && entityType !== "c_corp") continue;
    if (section.id === "entity_election" && (entityType === "s_corp" || entityType === "c_corp" || entityType === "individual")) continue;
    if (section.id === "real_estate" && hasRealEstate === false) continue;
    if (section.id === "family_hiring" && hasChildren === false) continue;
    if (section.id === "health_insurance" && entityType === "individual") continue;
    if (section.id === "rd_credit" && (income ?? 0) < 100000) continue;

    sections.push(section);
  }

  return sections;
}

/**
 * Create a fresh interview state
 */
export function createInterviewState(): InterviewState {
  return {
    currentSectionIndex: 0,
    currentQuestionIndex: 0,
    answers: {},
    qualifiedStrategies: [],
    disqualifiedStrategies: [],
    completedSections: [],
  };
}

/**
 * Profile data used to pre-populate the voice interview.
 */
export interface ProfileForInterview {
  occupation?: string;
  entityType?: string;
  filingStatus?: string;
  annualIncome?: string | number;
  dependents?: number;
  state?: string;
  hasRealEstate?: boolean;
  hasBusinessIncome?: boolean;
  hasMortgage?: boolean;
  comprehensiveSummary?: string;
}

/**
 * Create an interview state pre-populated from an existing profile.
 * Profile questions that are already answered get pre-filled and the
 * profile section is skipped entirely if all profile fields are present.
 */
export function createInterviewStateFromProfile(
  profile: ProfileForInterview,
  sections: QualificationSection[]
): InterviewState {
  const answers: Record<string, string> = {};

  // Map profile fields → interview question IDs
  if (profile.occupation) answers["p_occupation"] = profile.occupation;
  if (profile.entityType) {
    const entityMap: Record<string, string> = {
      individual: "I'm a W-2 employee (no business)",
      sole_prop: "Sole Proprietorship or Single-Member LLC",
      s_corp: "S-Corporation",
      c_corp: "C-Corporation",
      partnership: "Partnership",
    };
    answers["p_entity_type"] = entityMap[profile.entityType] || profile.entityType;
  }
  if (profile.filingStatus) answers["p_filing_status"] = profile.filingStatus;
  if (profile.annualIncome) {
    const inc = typeof profile.annualIncome === "string"
      ? parseInt(profile.annualIncome.replace(/[$,\s]/g, ""), 10)
      : profile.annualIncome;
    if (inc < 75000) answers["p_income"] = "Under $75,000";
    else if (inc < 150000) answers["p_income"] = "$75,000 to $150,000";
    else if (inc < 300000) answers["p_income"] = "$150,000 to $300,000";
    else if (inc < 500000) answers["p_income"] = "$300,000 to $500,000";
    else if (inc < 1000000) answers["p_income"] = "$500,000 to $1 million";
    else answers["p_income"] = "Over $1 million";
  }
  if (profile.dependents !== undefined) {
    if (profile.dependents === 0) answers["p_dependents"] = "No dependents";
    else if (profile.dependents === 1) answers["p_dependents"] = "1 child";
    else if (profile.dependents === 2) answers["p_dependents"] = "2 children";
    else answers["p_dependents"] = "3 or more children";
  }
  if (profile.state) answers["p_state"] = profile.state;

  // Check if the profile section is fully answered
  const profileSectionIndex = sections.findIndex((s) => s.id === "profile");
  let skipProfileSection = false;
  if (profileSectionIndex !== -1) {
    const profileSection = sections[profileSectionIndex];
    const allProfileAnswered = profileSection.questions.every((q) => answers[q.id]);
    skipProfileSection = allProfileAnswered;
  }

  return {
    currentSectionIndex: skipProfileSection ? (profileSectionIndex + 1) : 0,
    currentQuestionIndex: 0,
    answers,
    qualifiedStrategies: [],
    disqualifiedStrategies: [],
    completedSections: skipProfileSection ? ["profile"] : [],
  };
}

/**
 * Build a summary of what we already know about the client from their profile.
 * Used in the voice interview greeting so the AI doesn't re-ask known info.
 */
export function buildProfileSummaryForVoice(profile: ProfileForInterview): string {
  const parts: string[] = [];
  if (profile.occupation) parts.push(`Occupation: ${profile.occupation}`);
  if (profile.entityType) {
    const labels: Record<string, string> = {
      individual: "W-2 Employee", sole_prop: "Sole Proprietor", s_corp: "S-Corporation",
      c_corp: "C-Corporation", partnership: "Partnership",
    };
    parts.push(`Entity: ${labels[profile.entityType] || profile.entityType}`);
  }
  if (profile.filingStatus) parts.push(`Filing: ${profile.filingStatus}`);
  if (profile.annualIncome) parts.push(`Income: $${Number(profile.annualIncome).toLocaleString()}`);
  if (profile.dependents !== undefined) parts.push(`Dependents: ${profile.dependents}`);
  if (profile.state) parts.push(`State: ${profile.state}`);
  if (profile.hasRealEstate) parts.push("Owns real estate");
  if (profile.hasBusinessIncome) parts.push("Has business income");
  return parts.join(" | ");
}

/**
 * Get the current question in the interview
 */
export function getCurrentQuestion(
  state: InterviewState,
  sections: QualificationSection[]
): { section: QualificationSection; question: QualificationQuestion } | null {
  if (state.currentSectionIndex >= sections.length) return null;
  const section = sections[state.currentSectionIndex];
  if (state.currentQuestionIndex >= section.questions.length) return null;
  return { section, question: section.questions[state.currentQuestionIndex] };
}

/**
 * Record an answer and advance to the next question
 */
export function recordAnswer(
  state: InterviewState,
  questionId: string,
  answer: string,
  sections: QualificationSection[]
): InterviewState {
  const newState = { ...state, answers: { ...state.answers, [questionId]: answer } };
  const section = sections[newState.currentSectionIndex];

  // Check if disqualifying answer
  const question = section?.questions[newState.currentQuestionIndex];
  if (question) {
    const isDisqualifying = checkDisqualification(question, answer);
    if (isDisqualifying && question.strategyId !== "profile") {
      newState.disqualifiedStrategies = [...newState.disqualifiedStrategies, question.strategyId];
    }
  }

  // Advance to next question or section
  if (section && newState.currentQuestionIndex < section.questions.length - 1) {
    newState.currentQuestionIndex += 1;
  } else {
    // Section complete
    if (section) {
      newState.completedSections = [...newState.completedSections, section.id];
      // Mark strategies in this section as qualified if not disqualified
      const strategyIds = [...new Set(section.questions.map((q) => q.strategyId))];
      for (const sid of strategyIds) {
        if (!newState.disqualifiedStrategies.includes(sid) && sid !== "profile") {
          newState.qualifiedStrategies = [...newState.qualifiedStrategies, sid];
        }
      }
    }
    newState.currentSectionIndex += 1;
    newState.currentQuestionIndex = 0;
  }

  return newState;
}

/**
 * Check if an answer disqualifies the strategy
 */
function checkDisqualification(question: QualificationQuestion, answer: string): boolean {
  const lower = answer.toLowerCase().trim();

  // For yes/no questions where "no" is disqualifying
  if (question.answerType === "yes_no") {
    const disqualifyOnNo = [
      "ar_willing_to_host",
      "ho_has_office",
      "hi_self_employed",
      "re_owns_property",
      "rd_uncertainty",
      "rd_experimentation",
    ];
    if (disqualifyOnNo.includes(question.id) && (lower === "no" || lower === "n")) {
      return true;
    }
  }

  // Home office: less than 50% usage
  if (question.id === "ho_percentage" && lower.includes("less than 50")) {
    return true;
  }

  return false;
}

/**
 * Get interview progress as a percentage
 */
export function getInterviewProgress(state: InterviewState, sections: QualificationSection[]): number {
  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);
  const answeredCount = Object.keys(state.answers).length;
  return Math.round((answeredCount / totalQuestions) * 100);
}

/**
 * Check if interview is complete
 */
export function isInterviewComplete(state: InterviewState, sections: QualificationSection[]): boolean {
  return state.currentSectionIndex >= sections.length;
}

/**
 * Build the AI prompt for the current voice question — conversational wrapper
 */
export function buildVoiceQuestionPrompt(
  section: QualificationSection,
  question: QualificationQuestion,
  previousAnswers: Record<string, string>,
  isFirstQuestion: boolean,
  profileSummary?: string
): string {
  const context = Object.entries(previousAnswers)
    .slice(-3)
    .map(([, v]) => v)
    .join("; ");

  const isGapFilling = section.id === "gap_filling";

  let greetingBlock = "";
  if (isFirstQuestion) {
    if (profileSummary) {
      greetingBlock = `This is the START of the conversation. Give a brief warm greeting (1 sentence). You already know: ${profileSummary}. Acknowledge what you know briefly (e.g. "Great to connect — I see you're a [occupation] filing jointly in [state]"). Then say you just need a few quick details to build their plan. Do NOT re-ask anything you already know. Do NOT mention specific strategy names.`;
    } else {
      greetingBlock = "This is the START of the conversation. Give a brief warm greeting first.";
    }
  }

  const sectionBlock = isGapFilling
    ? "You are gathering missing financial details to complete a tax plan. Ask naturally — do NOT mention strategy names, tax code sections, or specific rules. Just ask for the information."
    : `CURRENT SECTION: ${section.title}\n${section.description}`;

  return `You are a friendly, professional tax advisor conducting a voice interview.
Speak naturally as if you're having a conversation — not reading a script.

${greetingBlock}

${sectionBlock}

ASK THIS QUESTION (rephrase naturally for speech, keep it concise):
"${question.question}"
${question.helpText ? `CONTEXT TO WEAVE IN (but do NOT mention strategy names): ${question.helpText}` : ""}
${question.answerType === "multiple_choice" && question.options ? `OPTIONS: ${question.options.join(", ")}` : ""}
${context ? `RECENT CONTEXT: The client previously said: ${context}` : ""}

RULES:
- Keep it under 2-3 sentences
- Sound warm and conversational, not robotic
- If there are options, mention the key ones naturally
${isGapFilling ? "- Do NOT mention tax strategy names, IRC sections, or specific rules — just ask for the financial detail" : ""}
${!isFirstQuestion && isGapFilling ? "- Use a brief conversational connector like \"Great, and...\" or \"Got it. Next...\"" : ""}
- End with the question clearly so they know to respond
- Do NOT use markdown, bullet points, or formatting — this will be spoken aloud`;
}

/**
 * Build the AI prompt for interpreting a voice answer
 */
export function buildAnswerInterpretationPrompt(
  question: QualificationQuestion,
  transcript: string
): string {
  return `The user was asked: "${question.question}"
${question.answerType === "multiple_choice" && question.options ? `Valid options: ${question.options.join(", ")}` : ""}
Answer type expected: ${question.answerType}

The user's voice response (transcribed): "${transcript}"

Extract their answer. Return ONLY a JSON object:
{
  "answer": "the extracted answer (use exact option text if multiple choice, or 'yes'/'no' for yes_no, or the number/amount for number/currency)",
  "confidence": 0.0 to 1.0,
  "needsClarification": true/false,
  "clarificationQuestion": "follow-up question if unclear"
}`;
}

/**
 * Build a transition message between sections
 */
export function buildSectionTransitionPrompt(
  completedSection: QualificationSection,
  nextSection: QualificationSection,
  qualifiedStrategies: string[],
  disqualifiedStrategies: string[]
): string {
  return `You are a friendly tax advisor transitioning between interview sections.

JUST COMPLETED: "${completedSection.title}"
MOVING TO: "${nextSection.title}" — ${nextSection.description}

${qualifiedStrategies.length > 0 ? `GOOD NEWS: Based on their answers, they appear to qualify for strategies related to: ${completedSection.title}` : ""}
${disqualifiedStrategies.length > 0 ? `NOTE: Some strategies in ${completedSection.title} may not apply based on their answers.` : ""}

Give a brief (1-2 sentence) positive transition. Acknowledge what you just covered, then introduce the next topic naturally. Sound warm and professional.
Do NOT use markdown or formatting — this will be spoken aloud.`;
}

/**
 * Build the final summary prompt
 */
export function buildInterviewSummaryPrompt(
  answers: Record<string, string>,
  qualifiedStrategies: string[],
  disqualifiedStrategies: string[]
): string {
  const answerSummary = Object.entries(answers)
    .map(([key, val]) => `${key}: ${val}`)
    .join("\n");

  return `You are a friendly tax advisor wrapping up an intake interview.

ALL CLIENT ANSWERS:
${answerSummary}

QUALIFIED STRATEGIES: ${qualifiedStrategies.join(", ") || "None identified yet"}
DISQUALIFIED STRATEGIES: ${disqualifiedStrategies.join(", ") || "None"}

Give a warm, encouraging summary (3-4 sentences):
1. Acknowledge the key details about their situation
2. Mention how many potential strategies you've identified
3. Tell them you're now going to build their personalized tax plan
4. Sound excited about the savings potential

Keep it concise and conversational — this will be spoken aloud.
Do NOT use markdown or formatting.`;
}
