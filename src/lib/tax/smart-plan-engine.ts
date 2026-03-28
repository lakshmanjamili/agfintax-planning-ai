// =============================================================================
// Smart Plan AI Engine — Adaptive Tax Planning Conversation
// =============================================================================

export interface TaxIntent {
  id: string;
  label: string;
  category: string;
  icon: string;
  triggerKeywords: string[];
  priority: "critical" | "high" | "medium" | "low";
}

// All tax-relevant topics the AI needs to cover
export const TAX_INTENTS: TaxIntent[] = [
  // CRITICAL — Must know before generating any plan
  { id: "income_level", label: "Income Level", category: "Income", icon: "DollarSign", triggerKeywords: ["income", "salary", "make", "earn", "gross", "net", "compensation", "pay", "wage", "$", "100k", "150k", "200k", "250k", "300k", "350k", "400k", "500k", "50k", "75k", "1m", "million", "thousand", "annually", "per year", "a year"], priority: "critical" },
  { id: "filing_status", label: "Filing Status", category: "Family", icon: "Users", triggerKeywords: ["single", "married", "filing jointly", "filing separately", "head of household", "widow", "spouse", "husband", "wife", "jointly", "mfj", "mfs", "hoh"], priority: "critical" },
  { id: "occupation", label: "Occupation", category: "Income", icon: "Briefcase", triggerKeywords: ["job", "work", "profession", "career", "engineer", "doctor", "lawyer", "consultant", "owner", "manager", "nurse", "teacher", "developer", "business", "employed", "dentist", "physician", "contractor", "freelancer", "software", "accountant", "realtor", "investor", "restaurant"], priority: "critical" },

  // HIGH — Major strategy unlocks
  { id: "self_employment", label: "Self-Employment / Business", category: "Business", icon: "Building2", triggerKeywords: ["self-employed", "self employed", "freelance", "consulting", "contractor", "1099", "side business", "side hustle", "own business", "business owner", "llc", "s-corp", "s corp", "c-corp", "c corp", "sole proprietor", "sole prop", "partnership", "ein", "schedule c", "my business", "my company", "run a", "own a"], priority: "high" },
  { id: "dependents", label: "Children & Dependents", category: "Family", icon: "Baby", triggerKeywords: ["child", "children", "kid", "kids", "dependent", "son", "daughter", "baby", "teenager"], priority: "high" },
  { id: "real_estate", label: "Real Estate / Rental", category: "Property", icon: "Home", triggerKeywords: ["rental", "property", "real estate", "landlord", "tenant", "investment property", "house", "home", "mortgage", "condo"], priority: "high" },
  { id: "retirement", label: "Retirement Plans", category: "Retirement", icon: "PiggyBank", triggerKeywords: ["401k", "401(k)", "ira", "roth", "sep", "pension", "retirement", "403b", "defined benefit", "cash balance", "profit sharing"], priority: "high" },

  // MEDIUM — Important for specific strategies
  { id: "health_insurance", label: "Health Insurance", category: "Medical", icon: "HeartPulse", triggerKeywords: ["health insurance", "medical", "hsa", "hdhp", "high deductible", "marketplace", "cobra", "medicare", "premium"], priority: "medium" },
  { id: "investments", label: "Investments & Stocks", category: "Assets", icon: "TrendingUp", triggerKeywords: ["stocks", "investment", "dividend", "capital gain", "portfolio", "brokerage", "crypto", "bitcoin", "rsu", "stock options", "espp"], priority: "medium" },
  { id: "home_office", label: "Home Office", category: "Business", icon: "Monitor", triggerKeywords: ["home office", "work from home", "wfh", "remote", "dedicated office"], priority: "medium" },
  { id: "charitable", label: "Charitable Giving", category: "Deductions", icon: "Heart", triggerKeywords: ["charity", "charitable", "donate", "donation", "church", "tithe", "nonprofit", "giving"], priority: "medium" },
  { id: "state", label: "State of Residence", category: "Deductions", icon: "MapPin", triggerKeywords: ["texas", "california", "new york", "florida", "washington", "state", "live in", "reside"], priority: "medium" },
  { id: "education", label: "Education Expenses", category: "Family", icon: "GraduationCap", triggerKeywords: ["college", "university", "tuition", "student loan", "education", "school", "529"], priority: "medium" },
  { id: "vehicles", label: "Business Vehicle", category: "Business", icon: "Car", triggerKeywords: ["car", "vehicle", "truck", "mileage", "drive", "business vehicle", "company car"], priority: "low" },
  { id: "international", label: "International / NRI", category: "Income", icon: "Globe", triggerKeywords: ["international", "foreign", "overseas", "expat", "nri", "india", "fbar", "fatca", "abroad"], priority: "medium" },
  { id: "depreciation", label: "Business Assets / Equipment", category: "Business", icon: "Server", triggerKeywords: ["equipment", "machinery", "computer", "depreciation", "capital expense", "asset", "section 179", "cost segregation"], priority: "medium" },
];

/**
 * Detect which intents are covered in the user's text
 */
export function detectCoveredIntents(text: string): string[] {
  const lower = text.toLowerCase();
  const covered: string[] = [];
  for (const intent of TAX_INTENTS) {
    for (const kw of intent.triggerKeywords) {
      if (lower.includes(kw.toLowerCase())) {
        covered.push(intent.id);
        break;
      }
    }
  }
  return [...new Set(covered)];
}

/**
 * Get uncovered intents sorted by priority
 */
export function getUncoveredIntents(coveredIds: string[]): TaxIntent[] {
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return TAX_INTENTS
    .filter((i) => !coveredIds.includes(i.id))
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/**
 * Check if we have enough info to generate a plan
 */
export function hasEnoughInfo(coveredIds: string[]): boolean {
  const criticals = TAX_INTENTS.filter((i) => i.priority === "critical");
  const coveredCriticals = criticals.filter((i) => coveredIds.includes(i.id));
  const highPriority = TAX_INTENTS.filter((i) => i.priority === "high");
  const coveredHigh = highPriority.filter((i) => coveredIds.includes(i.id));
  // Need ALL critical + at least 2 high priority
  return coveredCriticals.length >= criticals.length && coveredHigh.length >= 2;
}

/**
 * Build coverage map for visual display
 */
export function buildCoverageMap(coveredIds: string[]): Array<{
  category: string;
  intents: Array<{ id: string; label: string; covered: boolean; priority: string }>;
}> {
  const categories = [...new Set(TAX_INTENTS.map((i) => i.category))];
  return categories.map((cat) => ({
    category: cat,
    intents: TAX_INTENTS
      .filter((i) => i.category === cat)
      .map((i) => ({ id: i.id, label: i.label, covered: coveredIds.includes(i.id), priority: i.priority })),
  }));
}

/**
 * Build the AI system prompt for guided conversation
 */
export function buildConversationPrompt(coveredIds: string[], conversationHistory: string): string {
  const uncovered = getUncoveredIntents(coveredIds);
  const uncoveredCritical = uncovered.filter((i) => i.priority === "critical");
  const uncoveredHigh = uncovered.filter((i) => i.priority === "high");
  const uncoveredMedium = uncovered.filter((i) => i.priority === "medium");
  const ready = hasEnoughInfo(coveredIds);

  return `You are an expert tax planning advisor for AG FinTax. You are conducting an INTAKE CONVERSATION to understand the client's tax situation before building their personalized plan.

YOUR ROLE: Ask smart questions to understand their COMPLETE tax picture. You must gather enough information before generating strategies. Be conversational, warm, and professional — like a real CPA intake meeting.

ALREADY DISCUSSED: ${coveredIds.length > 0 ? coveredIds.join(", ") : "Nothing yet"}

STILL NEED TO COVER:
${uncoveredCritical.length > 0 ? `CRITICAL (must ask): ${uncoveredCritical.map((i) => i.label).join(", ")}` : "All critical topics covered!"}
${uncoveredHigh.length > 0 ? `HIGH PRIORITY: ${uncoveredHigh.map((i) => i.label).join(", ")}` : "All high-priority topics covered!"}
${uncoveredMedium.length > 0 ? `NICE TO KNOW: ${uncoveredMedium.map((i) => i.label).join(", ")}` : ""}

${ready ? `IMPORTANT: You have enough information to build a plan. Ask the user if they'd like to proceed or if there's anything else to add. If they say yes/proceed/go/build, respond with EXACTLY: [READY_TO_ANALYZE]` : `IMPORTANT: You do NOT have enough information yet. Keep asking questions. Do NOT suggest building a plan yet.`}

RULES:
1. Ask ONE question at a time — don't overwhelm
2. After they answer, acknowledge briefly, then ask the next most important question
3. Keep responses SHORT — 2-3 sentences max, then your question
4. NEVER generate tax strategies or savings numbers during the conversation
5. When enough info is gathered, summarize what you know and ask if they want to build the plan
6. Be proactive — if they say "software engineer" suggest stock options, if "self-employed" suggest entity structure

CRITICAL FORMAT RULE: After EVERY response, you MUST include a [SUGGESTIONS] block with 3-5 clickable options relevant to the current question. Format:
[SUGGESTIONS]
Option 1 text
Option 2 text
Option 3 text
[/SUGGESTIONS]

Examples:
- For "what do you do?": [SUGGESTIONS]Software Engineer\nDoctor / Physician\nBusiness Owner\nReal Estate Investor\nConsultant / Freelancer\nRestaurant Owner[/SUGGESTIONS]
- For filing status: [SUGGESTIONS]Single\nMarried Filing Jointly\nMarried Filing Separately\nHead of Household[/SUGGESTIONS]
- For income: [SUGGESTIONS]Under $75K\n$75K-$150K\n$150K-$300K\n$300K-$500K\n$500K-$1M\nOver $1M[/SUGGESTIONS]
- For entity type: [SUGGESTIONS]Sole Proprietorship\nSingle-Member LLC\nLLC with S-Corp Election\nS-Corp\nC-Corp\nPartnership[/SUGGESTIONS]
- For yes/no questions: [SUGGESTIONS]Yes\nNo\nNot sure[/SUGGESTIONS]
- For dependents: [SUGGESTIONS]No dependents\n1 child\n2 children\n3+ children[/SUGGESTIONS]

ALWAYS include relevant suggestions. Make them specific to the question being asked.

${conversationHistory ? `CONVERSATION SO FAR:\n${conversationHistory}` : "Start by warmly greeting them and asking what they do for a living."}`;
}

/**
 * Build prompt for analyzing voice transcript and identifying what's covered vs missing
 */
export function buildVoiceAnalysisPrompt(transcript: string, coveredIds: string[]): string {
  const uncovered = getUncoveredIntents(coveredIds);
  const ready = hasEnoughInfo(coveredIds);

  return `You heard the user describe their tax situation. Analyze what they told you and identify what's MISSING.

TRANSCRIPT: "${transcript}"

TOPICS ALREADY DETECTED: ${coveredIds.join(", ") || "none"}
TOPICS STILL NEEDED: ${uncovered.filter((i) => i.priority === "critical" || i.priority === "high").map((i) => i.label).join(", ")}

${ready
  ? `You have enough core info. Summarize what you understood, list 2-3 additional topics that COULD help refine the plan, and ask if they want to proceed or add more details. If they say proceed, respond with EXACTLY: [READY_TO_ANALYZE]`
  : `You do NOT have enough info. Summarize what you understood, then ask about the MOST IMPORTANT missing topic. Be specific.`
}

Keep response concise — summarize in bullets, then ask your question.`;
}
