"use client";

export interface SavedPlan {
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

const PLAN_KEY = "agfintax_smart_plan";
const DOCS_KEY = "agfintax_documents";

export function savePlan(plan: SavedPlan): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  }
}

export function getPlan(): SavedPlan | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(PLAN_KEY);
  return data ? JSON.parse(data) : null;
}

export function clearPlan(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(PLAN_KEY);
  }
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

  if (!plan) {
    // Generic recommendations
    return [
      { type: "w2", label: "W-2 Form", description: "Wage and tax statement from employer", priority: "required" },
      { type: "1099-nec", label: "1099-NEC", description: "Non-employee compensation", priority: "recommended" },
      { type: "1099-int", label: "1099-INT", description: "Interest income", priority: "recommended" },
    ];
  }

  const profile = plan.profile;
  const occ = (profile.occupation || "").toLowerCase();
  const intents = plan.coveredIntents || [];

  // Everyone needs these
  docs.push({ type: "prior-return", label: "Prior Year Tax Return (1040)", description: "Last year's complete tax return for comparison", priority: "required" });

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
