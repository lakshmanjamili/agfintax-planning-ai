"use client";

// ---------------------------------------------------------------------------
// Entity Types — Foundation for the entire platform
// ---------------------------------------------------------------------------

export type EntityType = "individual" | "sole_prop" | "s_corp" | "c_corp" | "partnership";

export interface EntityTypeInfo {
  id: EntityType;
  label: string;
  formNumber: string;
  description: string;
  icon: string; // lucide icon name
  color: string;
  features: string[];
}

export const ENTITY_TYPES: EntityTypeInfo[] = [
  {
    id: "individual",
    label: "Individual",
    formNumber: "1040",
    description: "W-2 employees, freelancers, and individuals",
    icon: "User",
    color: "#4CD6FB",
    features: ["Standard/Itemized Deductions", "Retirement Contributions", "Tax Credits", "Investment Strategies"],
  },
  {
    id: "s_corp",
    label: "S-Corporation",
    formNumber: "1120-S",
    description: "Pass-through entity with payroll tax savings",
    icon: "Building2",
    color: "#DC5700",
    features: ["Reasonable Compensation", "Distribution Planning", "Retirement Stacking", "Fringe Benefits"],
  },
  {
    id: "c_corp",
    label: "C-Corporation",
    formNumber: "1120",
    description: "Separate tax entity with 21% flat rate",
    icon: "Landmark",
    color: "#8B5CF6",
    features: ["Retained Earnings", "QSBS Exclusion", "Fringe Benefits", "Medical Reimbursement"],
  },
  {
    id: "partnership",
    label: "Partnership",
    formNumber: "1065",
    description: "Multi-member pass-through entity",
    icon: "Users",
    color: "#10B981",
    features: ["Special Allocations", "Guaranteed Payments", "K-1 Planning", "754 Election"],
  },
  {
    id: "sole_prop",
    label: "Sole Proprietorship / LLC",
    formNumber: "Schedule C",
    description: "Single-owner business (default LLC)",
    icon: "Briefcase",
    color: "#F59E0B",
    features: ["Schedule C Deductions", "SE Tax Optimization", "Entity Election", "Home Office"],
  },
];

export function getEntityInfo(entityType: EntityType): EntityTypeInfo {
  return ENTITY_TYPES.find((e) => e.id === entityType) || ENTITY_TYPES[0];
}

// ---------------------------------------------------------------------------
// Saved Plan — now includes entity type
// ---------------------------------------------------------------------------

export interface SavedPlan {
  entityType: EntityType;
  profile: {
    occupation: string;
    filingStatus: string;
    income: string;
    dependents: string;
    state: string;
  };
  strategies: Array<{
    title: string;
    category: string;
    description: string;
    estimatedSavings: number;
    savingsMin: number;
    savingsMax: number;
    implementationSteps?: string[];
    isPlanned?: boolean;
  }>;
  totalSavings: number;
  createdAt: string;
  coveredIntents: string[];
}

export interface UploadedDocument {
  id: string;
  name: string;
  type: string; // w2, 1099-nec, 1099-div, k1, etc.
  status: "uploaded" | "processing" | "processed" | "error";
  uploadedAt: string;
  extractedData?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Client Profile — comprehensive intake data for personalized planning
// ---------------------------------------------------------------------------

export interface ClientProfile {
  // Personal
  entityType: EntityType;
  occupation: string;
  filingStatus: string;
  annualIncome: string;
  incomeSources: string[]; // "W-2", "Self-Employment", "Rental", "Investment", etc.
  dependents: number;
  state: string;

  // Business details (if applicable)
  businessType: string; // "s_corp", "c_corp", "partnership", "sole_prop", ""
  businessName: string;
  businessIncome: string;
  numberOfEmployees: string;
  yearEstablished: string;

  // Financial situation
  hasRealEstate: boolean;
  hasBusinessIncome: boolean;
  hasInternational: boolean;
  hasMortgage: boolean;
  hasRetirementAccounts: boolean;
  retirementAccountTypes: string[]; // "401k", "IRA", "Roth IRA", "SEP IRA", "Solo 401k"
  hasInvestments: boolean;
  hasHealthInsurance: boolean;
  hasStudentLoans: boolean;
  hasCharitableGiving: boolean;

  // Goals
  savingsTarget: string;
  planningPriorities: string[]; // "Minimize Tax", "Maximize Deductions", etc.

  // OCR-extracted data (from uploaded tax return)
  ocrSummary: string;
  ocrExtractedFields: Record<string, string>;

  // Multi-document intelligence — accumulates across uploads
  uploadedDocuments: Array<{
    id: string;
    fileName: string;
    documentType: string; // "tax-return", "w2", "1099-nec", "k1", etc.
    uploadedAt: string;
    summary: string;
    extractedFields: Record<string, string>;
    keyFindings: string[];
  }>;
  comprehensiveSummary: string; // AI-ready summary of ALL uploaded documents

  // Meta
  completeness: number; // 0-100
  lastUpdated: string;
  createdAt: string;
}

export function createEmptyProfile(): ClientProfile {
  return {
    entityType: "individual",
    occupation: "",
    filingStatus: "single",
    annualIncome: "",
    incomeSources: [],
    dependents: 0,
    state: "",
    businessType: "",
    businessName: "",
    businessIncome: "",
    numberOfEmployees: "",
    yearEstablished: "",
    hasRealEstate: false,
    hasBusinessIncome: false,
    hasInternational: false,
    hasMortgage: false,
    hasRetirementAccounts: false,
    retirementAccountTypes: [],
    hasInvestments: false,
    hasHealthInsurance: false,
    hasStudentLoans: false,
    hasCharitableGiving: false,
    savingsTarget: "",
    planningPriorities: [],
    ocrSummary: "",
    ocrExtractedFields: {},
    uploadedDocuments: [],
    comprehensiveSummary: "",
    completeness: 0,
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

export function calculateProfileCompleteness(profile: ClientProfile): number {
  let score = 0;
  const checks = [
    () => !!profile.entityType, // 10
    () => !!profile.occupation, // 10
    () => !!profile.filingStatus, // 10
    () => !!profile.annualIncome, // 15
    () => profile.incomeSources.length > 0, // 10
    () => !!profile.state, // 10
    () => profile.dependents >= 0, // 5 (always true but intentional)
    () => profile.planningPriorities.length > 0, // 10
    () => profile.hasRealEstate || profile.hasBusinessIncome || profile.hasRetirementAccounts || profile.hasInvestments, // 10
    () => !!profile.ocrSummary || Object.keys(profile.ocrExtractedFields).length > 0, // 10
  ];
  const weights = [10, 10, 10, 15, 10, 10, 5, 10, 10, 10];
  checks.forEach((check, i) => { if (check()) score += weights[i]; });
  return Math.min(100, score);
}

/**
 * Build a comprehensive summary from all uploaded documents.
 * This summary is the "intelligence brief" that Smart Plan uses.
 */
export function buildComprehensiveSummary(profile: ClientProfile): string {
  const docs = profile.uploadedDocuments || [];
  if (docs.length === 0 && !profile.ocrSummary) return "";

  const parts: string[] = [];

  // Header
  const entityInfo = getEntityInfo(profile.entityType);
  parts.push(`CLIENT PROFILE INTELLIGENCE — ${entityInfo.label} (${entityInfo.formNumber})`);
  parts.push(`Documents analyzed: ${docs.length}`);
  parts.push("");

  // Core financials
  const financials: string[] = [];
  if (profile.annualIncome) financials.push(`Income/AGI: ${profile.annualIncome}`);
  if (profile.ocrExtractedFields["Taxable Income"]) financials.push(`Taxable Income: ${profile.ocrExtractedFields["Taxable Income"]}`);
  if (profile.ocrExtractedFields["Total Deductions"]) financials.push(`Deductions: ${profile.ocrExtractedFields["Total Deductions"]}`);
  if (profile.ocrExtractedFields["Effective Tax Rate"]) financials.push(`Effective Rate: ${profile.ocrExtractedFields["Effective Tax Rate"]}`);
  if (profile.ocrExtractedFields["Federal Tax Withheld"]) financials.push(`Tax Withheld: ${profile.ocrExtractedFields["Federal Tax Withheld"]}`);
  if (profile.ocrExtractedFields["Tax Owed / Refund"]) financials.push(`Tax Owed/Refund: ${profile.ocrExtractedFields["Tax Owed / Refund"]}`);
  if (profile.ocrExtractedFields["State Income Tax"]) financials.push(`State Tax: ${profile.ocrExtractedFields["State Income Tax"]}`);
  if (financials.length > 0) {
    parts.push("FINANCIALS:");
    parts.push(financials.join(" | "));
    parts.push("");
  }

  // Profile snapshot
  const snapshot: string[] = [];
  if (profile.occupation) snapshot.push(`Occupation: ${profile.occupation}`);
  if (profile.filingStatus) snapshot.push(`Filing: ${profile.filingStatus}`);
  if (profile.state) snapshot.push(`State: ${profile.state}`);
  if (profile.dependents > 0) snapshot.push(`Dependents: ${profile.dependents}`);
  if (profile.incomeSources.length > 0) snapshot.push(`Income Sources: ${profile.incomeSources.join(", ")}`);
  if (profile.businessName) snapshot.push(`Business: ${profile.businessName}`);
  if (profile.businessIncome) snapshot.push(`Business Income: ${profile.businessIncome}`);
  if (profile.retirementAccountTypes.length > 0) snapshot.push(`Retirement: ${profile.retirementAccountTypes.join(", ")}`);
  if (snapshot.length > 0) {
    parts.push("PROFILE:");
    parts.push(snapshot.join(" | "));
    parts.push("");
  }

  // Flags
  const flags: string[] = [];
  if (profile.hasRealEstate) flags.push("Real Estate");
  if (profile.hasBusinessIncome) flags.push("Business Income");
  if (profile.hasMortgage) flags.push("Mortgage");
  if (profile.hasRetirementAccounts) flags.push("Retirement Accounts");
  if (profile.hasInvestments) flags.push("Investments");
  if (profile.hasCharitableGiving) flags.push("Charitable Giving");
  if (profile.hasHealthInsurance) flags.push("Health Insurance");
  if (profile.hasStudentLoans) flags.push("Student Loans");
  if (profile.hasInternational) flags.push("International");
  if (flags.length > 0) {
    parts.push(`ACTIVE FLAGS: ${flags.join(", ")}`);
    parts.push("");
  }

  // Schedules & Credits
  if (profile.ocrExtractedFields["Schedules Filed"]) {
    parts.push(`SCHEDULES FILED: ${profile.ocrExtractedFields["Schedules Filed"]}`);
  }
  if (profile.ocrExtractedFields["Credits Used"]) {
    parts.push(`CREDITS USED: ${profile.ocrExtractedFields["Credits Used"]}`);
  }

  // Document-by-document insights
  if (docs.length > 0) {
    parts.push("");
    parts.push("DOCUMENT INSIGHTS:");
    for (const doc of docs) {
      parts.push(`--- ${doc.documentType.toUpperCase()} (${doc.fileName}) ---`);
      if (doc.summary) parts.push(doc.summary);
      if (doc.keyFindings.length > 0) {
        parts.push("Key findings: " + doc.keyFindings.join("; "));
      }
    }
  } else if (profile.ocrSummary) {
    parts.push("");
    parts.push("TAX RETURN ANALYSIS:");
    parts.push(profile.ocrSummary);
  }

  return parts.join("\n");
}

/**
 * Merge arrays without duplicates (case-insensitive)
 */
export function mergeArraysUnique(existing: string[], incoming: string[]): string[] {
  const lower = new Set(existing.map(s => s.toLowerCase()));
  const merged = [...existing];
  for (const item of incoming) {
    if (!lower.has(item.toLowerCase())) {
      merged.push(item);
      lower.add(item.toLowerCase());
    }
  }
  return merged;
}

/**
 * Strategy requirement slot — maps what strategies need to profile data.
 * "status" is green (filled), amber (partial), or red (missing).
 */
export interface StrategySlot {
  id: string;
  label: string;
  icon: string; // lucide icon name
  status: "green" | "amber" | "red";
  value: string;         // human-readable value or ""
  detail: string;        // what strategies this unlocks
  strategiesUnlocked: number; // how many strategies this slot enables
}

/**
 * Analyze profile readiness for a specific entity type.
 * Maps profile data against strategy-requirement "slots" so the UI
 * can show a checklist of what's covered (green), partial (amber), missing (red).
 */
export function analyzeProfileForEntity(
  profile: ClientProfile,
  entityType: EntityType
): {
  slots: StrategySlot[];
  readinessPercent: number;
  readySummary: string;
  coveredCount: number;
  totalSlots: number;
  strategiesMatched: number;
  totalStrategies: number;
} {
  const isBusiness = entityType !== "individual";

  const slots: StrategySlot[] = [
    // --- Core profile slots (every entity needs these) ---
    {
      id: "income",
      label: "Income & Employment",
      icon: "DollarSign",
      status: profile.annualIncome ? "green" : "red",
      value: profile.annualIncome
        ? `${profile.annualIncome}${profile.occupation ? ` · ${profile.occupation}` : ""}`
        : "",
      detail: "401(k), IRA, QBI Deduction, HSA",
      strategiesUnlocked: 8,
    },
    {
      id: "income_sources",
      label: "Income Sources",
      icon: "FileText",
      status: profile.incomeSources.length > 0 ? "green"
        : profile.annualIncome ? "amber" : "red",
      value: profile.incomeSources.length > 0
        ? profile.incomeSources.join(", ")
        : profile.annualIncome ? "Not specified" : "",
      detail: "W-2 strategies, 1099 deductions, SE tax",
      strategiesUnlocked: 6,
    },
    {
      id: "filing",
      label: "Filing Status",
      icon: "ClipboardCheck",
      status: profile.filingStatus ? "green" : "red",
      value: profile.filingStatus === "mfj" ? "Married Filing Jointly"
        : profile.filingStatus === "mfs" ? "Married Filing Separately"
        : profile.filingStatus === "hoh" ? "Head of Household"
        : profile.filingStatus === "qss" ? "Qualifying Surviving Spouse"
        : profile.filingStatus === "single" ? "Single"
        : "",
      detail: "Standard deduction, tax bracket optimization",
      strategiesUnlocked: 3,
    },
    {
      id: "state",
      label: "State of Residence",
      icon: "MapPin",
      status: profile.state ? "green" : "amber",
      value: profile.state || "Not set",
      detail: "State-specific deductions & credits",
      strategiesUnlocked: 2,
    },
    {
      id: "dependents",
      label: "Family & Dependents",
      icon: "Users",
      status: profile.dependents > 0 ? "green" : "amber",
      value: profile.dependents > 0 ? `${profile.dependents} dependent${profile.dependents > 1 ? "s" : ""}` : "None listed",
      detail: "Child Tax Credit, Dependent Care, 529 Plans",
      strategiesUnlocked: 4,
    },
    {
      id: "retirement",
      label: "Retirement Accounts",
      icon: "PiggyBank",
      status: profile.hasRetirementAccounts ? "green" : "red",
      value: profile.hasRetirementAccounts
        ? (profile.retirementAccountTypes.length > 0 ? profile.retirementAccountTypes.join(", ") : "Yes")
        : "",
      detail: "401(k) Max, Roth Strategy, Cash Balance Plan",
      strategiesUnlocked: 5,
    },
    {
      id: "real_estate",
      label: "Real Estate & Property",
      icon: "Building2",
      status: profile.hasRealEstate ? "green" : profile.hasMortgage ? "amber" : "red",
      value: profile.hasRealEstate
        ? `Yes${profile.hasMortgage ? " · Mortgage" : ""}`
        : profile.hasMortgage ? "Mortgage only" : "",
      detail: "1031 Exchange, Cost Segregation, Mortgage Deduction",
      strategiesUnlocked: 4,
    },
    {
      id: "investments",
      label: "Investments & Capital",
      icon: "TrendingUp",
      status: profile.hasInvestments ? "green" : "red",
      value: profile.hasInvestments ? "Yes" : "",
      detail: "Capital gains planning, Tax-loss harvesting",
      strategiesUnlocked: 3,
    },
    {
      id: "charitable",
      label: "Charitable Giving",
      icon: "Heart",
      status: profile.hasCharitableGiving ? "green" : "amber",
      value: profile.hasCharitableGiving ? "Yes" : "Not specified",
      detail: "Donor Advised Fund, QCD, Bunching Strategy",
      strategiesUnlocked: 2,
    },
    {
      id: "health",
      label: "Health & Insurance",
      icon: "HeartPulse",
      status: profile.hasHealthInsurance ? "green" : "amber",
      value: profile.hasHealthInsurance ? "Yes" : "Not specified",
      detail: "HSA, SE Health Deduction, MERP",
      strategiesUnlocked: 3,
    },
  ];

  // --- Business-specific slots ---
  if (isBusiness) {
    slots.push(
      {
        id: "business_info",
        label: "Business Details",
        icon: "Briefcase",
        status: profile.businessName && profile.businessIncome ? "green"
          : profile.businessName || profile.businessIncome ? "amber" : "red",
        value: [profile.businessName, profile.businessIncome].filter(Boolean).join(" · ") || "",
        detail: "QBI Deduction, Business Expense Deductions",
        strategiesUnlocked: 6,
      },
      {
        id: "employees",
        label: "Employees & Payroll",
        icon: "Users",
        status: profile.numberOfEmployees ? "green" : "amber",
        value: profile.numberOfEmployees ? `${profile.numberOfEmployees} employees` : "Not specified",
        detail: "Hiring Credits, Retirement Plan Setup, FICA Optimization",
        strategiesUnlocked: 3,
      },
    );

    if (entityType === "s_corp") {
      slots.push({
        id: "reasonable_comp",
        label: "Reasonable Compensation",
        icon: "Banknote",
        status: profile.occupation && profile.annualIncome ? "green" : "red",
        value: profile.occupation && profile.annualIncome ? `${profile.occupation} · ${profile.annualIncome}` : "",
        detail: "S-Corp salary vs distribution split, FICA savings",
        strategiesUnlocked: 2,
      });
    }
  }

  // Prior tax return uploaded
  if (profile.ocrSummary || Object.keys(profile.ocrExtractedFields).length > 0) {
    slots.push({
      id: "prior_return",
      label: "Prior Tax Return",
      icon: "FileText",
      status: "green",
      value: "Uploaded & Analyzed",
      detail: "Year-over-year comparison, carryforward items",
      strategiesUnlocked: 2,
    });
  }

  const coveredCount = slots.filter((s) => s.status === "green").length;
  const totalSlots = slots.length;
  const readinessPercent = totalSlots > 0 ? Math.round((coveredCount / totalSlots) * 100) : 0;

  // Count strategies matched (simplified — strategies whose applicableTo includes this entity)
  const strategiesMatched = slots.filter((s) => s.status === "green").reduce((sum, s) => sum + s.strategiesUnlocked, 0);
  const totalStrategies = slots.reduce((sum, s) => sum + s.strategiesUnlocked, 0);

  const readySummary = readinessPercent >= 80
    ? "Profile is comprehensive — ready for full AI analysis!"
    : readinessPercent >= 50
    ? `Good foundation — ${totalSlots - coveredCount} area${totalSlots - coveredCount > 1 ? "s" : ""} need attention for a complete plan.`
    : readinessPercent > 0
    ? `Profile started — fill in more details to unlock additional strategies.`
    : "No profile yet — build one for personalized strategy matching.";

  return { slots, readinessPercent, readySummary, coveredCount, totalSlots, strategiesMatched, totalStrategies };
}

const PROFILE_KEY = "agfintax_client_profile";
const PLAN_KEY = "agfintax_smart_plan";
const PLAN_HISTORY_KEY = "agfintax_plan_history";
const DOCS_KEY = "agfintax_documents";
const ENTITY_KEY = "agfintax_entity_type";

/** Max plans allowed on free tier */
export const FREE_PLAN_LIMIT = 5;

// ---------------------------------------------------------------------------
// Client Profile persistence
// ---------------------------------------------------------------------------

export function saveClientProfile(profile: ClientProfile): void {
  if (typeof window !== "undefined") {
    profile.completeness = calculateProfileCompleteness(profile);
    profile.lastUpdated = new Date().toISOString();
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    // Keep entity type in sync
    if (profile.entityType) {
      localStorage.setItem(ENTITY_KEY, profile.entityType);
    }
  }
}

export function getClientProfile(): ClientProfile | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(PROFILE_KEY);
  if (!data) return null;
  const profile = JSON.parse(data) as ClientProfile;
  // Migration: ensure all fields exist
  const empty = createEmptyProfile();
  return { ...empty, ...profile };
}

export function clearClientProfile(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(PROFILE_KEY);
  }
}

/**
 * Convert a saved client profile into the format expected by the Smart Plan API
 */
export function profileToSmartPlanInput(profile: ClientProfile): {
  occupation: string;
  filingStatus: string;
  income: number;
  dependents: number;
  hasRealEstate: boolean;
  hasBusinessIncome: boolean;
  hasMortgage: boolean;
  state: string;
  additionalInfo: string;
  entityType: string;
} {
  const incomeStr = profile.annualIncome.replace(/[^0-9KkMm.]/g, "").toUpperCase();
  let income = 100000;
  if (incomeStr.includes("M")) income = parseFloat(incomeStr) * 1_000_000 || 500000;
  else if (incomeStr.includes("K")) income = parseFloat(incomeStr) * 1_000 || 100000;
  else { const n = parseInt(incomeStr); if (n > 0) income = n; }

  const additionalParts: string[] = [];
  if (profile.incomeSources.length > 0) additionalParts.push(`Income sources: ${profile.incomeSources.join(", ")}`);
  if (profile.businessName) additionalParts.push(`Business: ${profile.businessName}`);
  if (profile.businessIncome) additionalParts.push(`Business income: ${profile.businessIncome}`);
  if (profile.retirementAccountTypes.length > 0) additionalParts.push(`Retirement accounts: ${profile.retirementAccountTypes.join(", ")}`);
  if (profile.hasInvestments) additionalParts.push("Has investments/stocks");
  if (profile.hasHealthInsurance) additionalParts.push("Has health insurance");
  if (profile.hasStudentLoans) additionalParts.push("Has student loans");
  if (profile.hasCharitableGiving) additionalParts.push("Makes charitable contributions");
  if (profile.hasInternational) additionalParts.push("Has international income/assets");
  if (profile.planningPriorities.length > 0) additionalParts.push(`Priorities: ${profile.planningPriorities.join(", ")}`);
  // Prefer comprehensive summary (multi-document) over single OCR summary
  if (profile.comprehensiveSummary) {
    additionalParts.push(`Document intelligence: ${profile.comprehensiveSummary}`);
  } else if (profile.ocrSummary) {
    additionalParts.push(`From prior return: ${profile.ocrSummary}`);
  }

  return {
    occupation: profile.occupation,
    filingStatus: profile.filingStatus,
    income,
    dependents: profile.dependents,
    hasRealEstate: profile.hasRealEstate,
    hasBusinessIncome: profile.hasBusinessIncome,
    hasMortgage: profile.hasMortgage,
    state: profile.state,
    additionalInfo: additionalParts.join(". "),
    entityType: profile.entityType,
  };
}

// ---------------------------------------------------------------------------
// Entity Type persistence (separate from plan — set before plan is created)
// ---------------------------------------------------------------------------

export function saveEntityType(entityType: EntityType): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(ENTITY_KEY, entityType);
  }
}

export function getEntityType(): EntityType | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(ENTITY_KEY);
  if (data && ENTITY_TYPES.some((e) => e.id === data)) return data as EntityType;
  return null;
}

export function clearEntityType(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ENTITY_KEY);
  }
}

export function savePlan(plan: SavedPlan): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
    // Also add to history
    addPlanToHistory(plan);
  }
}

export function getPlan(): SavedPlan | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(PLAN_KEY);
  if (!data) return null;
  const plan = JSON.parse(data) as SavedPlan;
  // Migration: old plans without entityType get "individual" default
  if (!plan.entityType) {
    plan.entityType = "individual";
  }
  return plan;
}

/**
 * Check if the saved plan matches the current entity type.
 * Returns true if they match, false if stale/mismatched.
 */
export function isPlanCurrentForEntity(): boolean {
  const plan = getPlan();
  const entity = getEntityType();
  if (!plan || !entity) return true; // no plan or no entity = no mismatch
  return plan.entityType === entity;
}

export function clearPlan(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(PLAN_KEY);
  }
}

// ---------------------------------------------------------------------------
// Plan History — persists all generated plans, enforces free-tier limit
// ---------------------------------------------------------------------------

export interface PlanHistoryEntry extends SavedPlan {
  id: string;       // unique identifier
  label?: string;    // user-facing label e.g. "Plan #2 — S-Corp"
}

function addPlanToHistory(plan: SavedPlan): void {
  if (typeof window === "undefined") return;
  const history = getPlanHistory();
  const entry: PlanHistoryEntry = {
    ...plan,
    id: `plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    label: `Plan #${history.length + 1} — ${plan.entityType.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}`,
  };
  history.push(entry);
  localStorage.setItem(PLAN_HISTORY_KEY, JSON.stringify(history));
}

export function getPlanHistory(): PlanHistoryEntry[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(PLAN_HISTORY_KEY);
  if (!data) return [];
  return JSON.parse(data) as PlanHistoryEntry[];
}

export function getPlanCount(): number {
  return getPlanHistory().length;
}

export function canCreatePlan(): boolean {
  return getPlanCount() < FREE_PLAN_LIMIT;
}

export function getRemainingPlans(): number {
  return Math.max(0, FREE_PLAN_LIMIT - getPlanCount());
}

export function loadPlanFromHistory(planId: string): SavedPlan | null {
  const history = getPlanHistory();
  const entry = history.find((p) => p.id === planId);
  if (!entry) return null;
  // Set as current plan
  if (typeof window !== "undefined") {
    localStorage.setItem(PLAN_KEY, JSON.stringify(entry));
  }
  return entry;
}

export function deletePlanFromHistory(planId: string): void {
  if (typeof window === "undefined") return;
  const history = getPlanHistory().filter((p) => p.id !== planId);
  localStorage.setItem(PLAN_HISTORY_KEY, JSON.stringify(history));
}

export function clearPlanHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PLAN_HISTORY_KEY);
}

export function saveDocuments(docs: UploadedDocument[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
  }
}

export function getDocuments(): UploadedDocument[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(DOCS_KEY);
  return data ? JSON.parse(data) : [];
}

export function addDocument(doc: UploadedDocument): void {
  const docs = getDocuments();
  docs.push(doc);
  saveDocuments(docs);
}

// What documents should the user upload based on their Smart Plan profile?
export function getRecommendedDocuments(plan: SavedPlan | null): Array<{ type: string; label: string; description: string; priority: "required" | "recommended" | "optional" }> {
  const docs: Array<{ type: string; label: string; description: string; priority: "required" | "recommended" | "optional" }> = [];
  const entityType = plan?.entityType || getEntityType() || "individual";

  if (!plan) {
    // Generic recommendations based on entity type
    const base: Array<{ type: string; label: string; description: string; priority: "required" | "recommended" | "optional" }> = [];
    const entityInfo = getEntityInfo(entityType);
    base.push({ type: "prior-return", label: `Prior Year Tax Return (${entityInfo.formNumber})`, description: `Last year's complete ${entityInfo.formNumber} return for analysis`, priority: "required" });

    if (entityType === "individual") {
      base.push({ type: "w2", label: "W-2 Form", description: "Wage and tax statement from employer", priority: "required" });
      base.push({ type: "1099-nec", label: "1099-NEC", description: "Non-employee compensation", priority: "recommended" });
    } else if (entityType === "s_corp") {
      base.push({ type: "1120-s", label: "Form 1120-S", description: "S-Corporation income tax return", priority: "required" });
      base.push({ type: "k1", label: "Schedule K-1", description: "Shareholder's share of income", priority: "required" });
      base.push({ type: "w2", label: "Officer W-2", description: "Reasonable compensation W-2", priority: "required" });
    } else if (entityType === "c_corp") {
      base.push({ type: "1120", label: "Form 1120", description: "C-Corporation income tax return", priority: "required" });
      base.push({ type: "balance-sheet", label: "Balance Sheet", description: "Current year balance sheet", priority: "recommended" });
    } else if (entityType === "partnership") {
      base.push({ type: "1065", label: "Form 1065", description: "Partnership income tax return", priority: "required" });
      base.push({ type: "k1", label: "Schedule K-1", description: "Partner's share of income", priority: "required" });
    } else if (entityType === "sole_prop") {
      base.push({ type: "schedule-c", label: "Schedule C", description: "Profit or loss from business", priority: "required" });
      base.push({ type: "1099-nec", label: "1099-NEC Forms", description: "Non-employee compensation from clients", priority: "required" });
    }
    base.push({ type: "1099-int", label: "1099-INT", description: "Interest income", priority: "recommended" });
    return base;
  }

  const profile = plan.profile;
  const occ = (profile.occupation || "").toLowerCase();
  const intents = plan.coveredIntents || [];
  const entityInfo = getEntityInfo(entityType);

  // Entity-specific prior return
  docs.push({ type: "prior-return", label: `Prior Year Tax Return (${entityInfo.formNumber})`, description: `Last year's complete ${entityInfo.formNumber} return for comparison`, priority: "required" });

  // Entity-specific core documents
  if (entityType === "s_corp") {
    docs.push({ type: "1120-s", label: "Form 1120-S", description: "S-Corporation income tax return", priority: "required" });
    docs.push({ type: "k1", label: "Schedule K-1 (Form 1120-S)", description: "Shareholder's share of income", priority: "required" });
    docs.push({ type: "w2", label: "Officer W-2", description: "Reasonable compensation W-2 for shareholders", priority: "required" });
    docs.push({ type: "payroll-reports", label: "Payroll Reports", description: "Quarterly payroll tax returns (941)", priority: "recommended" });
  } else if (entityType === "c_corp") {
    docs.push({ type: "1120", label: "Form 1120", description: "C-Corporation income tax return", priority: "required" });
    docs.push({ type: "balance-sheet", label: "Balance Sheet", description: "Current year balance sheet", priority: "required" });
    docs.push({ type: "profit-loss", label: "Profit & Loss Statement", description: "Current year P&L", priority: "required" });
  } else if (entityType === "partnership") {
    docs.push({ type: "1065", label: "Form 1065", description: "Partnership income tax return", priority: "required" });
    docs.push({ type: "k1", label: "Schedule K-1 (Form 1065)", description: "Partner's share of income", priority: "required" });
    docs.push({ type: "partnership-agreement", label: "Partnership Agreement", description: "Operating agreement with allocation terms", priority: "recommended" });
  } else if (entityType === "sole_prop") {
    docs.push({ type: "schedule-c", label: "Schedule C", description: "Profit or loss from business", priority: "required" });
    docs.push({ type: "1099-nec", label: "1099-NEC Forms", description: "Non-employee compensation from clients", priority: "required" });
    docs.push({ type: "business-expenses", label: "Business Expense Records", description: "Receipts, invoices, and expense tracking", priority: "required" });
  }

  // W-2 if employed
  if (!intents.includes("self_employment") || occ.includes("employee")) {
    docs.push({ type: "w2", label: "W-2 Form", description: "Wage and tax statement from each employer", priority: "required" });
  }

  // Self-employment docs
  if (intents.includes("self_employment") || occ.includes("self") || occ.includes("freelance") || occ.includes("business") || occ.includes("consult")) {
    docs.push({ type: "1099-nec", label: "1099-NEC Forms", description: "Non-employee compensation from clients", priority: "required" });
    docs.push({ type: "profit-loss", label: "Profit & Loss Statement", description: "Business income and expenses summary", priority: "required" });
    docs.push({ type: "business-expenses", label: "Business Expense Records", description: "Receipts, invoices, and expense tracking", priority: "recommended" });
  }

  // Rental property
  if (intents.includes("real_estate") || intents.includes("rental_income")) {
    docs.push({ type: "rental-income", label: "Rental Income Statement", description: "Rent collected, property expenses, depreciation", priority: "required" });
    docs.push({ type: "1099-misc", label: "1099-MISC", description: "Miscellaneous income from rental activities", priority: "recommended" });
    docs.push({ type: "property-tax", label: "Property Tax Statements", description: "Annual property tax bills for all properties", priority: "required" });
  }

  // Investments
  if (intents.includes("investments")) {
    docs.push({ type: "1099-b", label: "1099-B", description: "Proceeds from broker/barter exchange", priority: "required" });
    docs.push({ type: "1099-div", label: "1099-DIV", description: "Dividends and distributions", priority: "recommended" });
    docs.push({ type: "1099-int", label: "1099-INT", description: "Interest income from banks and investments", priority: "recommended" });
  }

  // Retirement
  if (intents.includes("retirement") || intents.includes("retirement_plans")) {
    docs.push({ type: "1099-r", label: "1099-R", description: "Distributions from retirement accounts", priority: "recommended" });
    docs.push({ type: "5498", label: "Form 5498", description: "IRA contribution information", priority: "optional" });
  }

  // Children / Education
  if (intents.includes("dependents") || intents.includes("dependents_children")) {
    docs.push({ type: "childcare-receipts", label: "Childcare Expense Receipts", description: "Daycare, nanny, after-school program costs", priority: "recommended" });
  }

  // Health
  if (intents.includes("health_insurance")) {
    docs.push({ type: "1095-a", label: "Form 1095-A/B/C", description: "Health insurance coverage proof", priority: "recommended" });
  }

  // Charity
  if (intents.includes("charitable")) {
    docs.push({ type: "charitable-receipts", label: "Charitable Donation Receipts", description: "Donation receipts and acknowledgment letters", priority: "recommended" });
  }

  // Mortgage
  if (intents.includes("mortgage") || intents.includes("primary_home")) {
    docs.push({ type: "1098", label: "Form 1098", description: "Mortgage interest statement", priority: "required" });
  }

  // K-1 for partnerships
  if (intents.includes("entity_type")) {
    docs.push({ type: "k1", label: "Schedule K-1", description: "Partner's share of income from partnerships/S-Corps", priority: "recommended" });
  }

  return docs;
}

