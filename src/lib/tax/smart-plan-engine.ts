// =============================================================================
// Smart Plan AI Engine V2 — Qualification-Based Tax Planning Conversation
// Replaces intent-based keyword detection with two-phase qualification
// =============================================================================

import {
  createSession,
  initializeWithProfile,
  filterByProfile,
  evaluateStrategy,
  getNextQuestion,
  processAnswer,
  getSessionSummary,
  parseProfileAnswers,
  PROFILE_QUESTIONS,
  type PlanSession,
  type ClientProfileV2,
} from './qualification-engine-v2';

import {
  buildQualificationPrompt,
  buildProfilePrompt,
} from '@/lib/ai/tax-system-prompt';

// Re-export everything the page needs
export {
  createSession,
  initializeWithProfile,
  filterByProfile,
  evaluateStrategy,
  getNextQuestion,
  processAnswer,
  getSessionSummary,
  parseProfileAnswers,
  PROFILE_QUESTIONS,
  type PlanSession,
  type ClientProfileV2,
};

export { buildQualificationPrompt, buildProfilePrompt };

// ---------------------------------------------------------------------------
// Legacy exports — keep backward compat so existing UI doesn't break
// These are used by the current smart-plan page.tsx
// ---------------------------------------------------------------------------

export interface TaxIntent {
  id: string;
  label: string;
  category: string;
  icon: string;
  triggerKeywords: string[];
  priority: "critical" | "high" | "medium" | "low";
}

// Minimal TAX_INTENTS for backward compat (used by coverage map display)
export const TAX_INTENTS: TaxIntent[] = [
  { id: "income_level", label: "Income Level", category: "Income", icon: "DollarSign", triggerKeywords: ["income", "salary", "earn", "$"], priority: "critical" },
  { id: "filing_status", label: "Filing Status", category: "Family", icon: "Users", triggerKeywords: ["single", "married", "filing", "jointly"], priority: "critical" },
  { id: "occupation", label: "Occupation", category: "Income", icon: "Briefcase", triggerKeywords: ["job", "work", "profession"], priority: "critical" },
  { id: "dependents", label: "Children & Dependents", category: "Family", icon: "Baby", triggerKeywords: ["child", "children", "kid", "dependent"], priority: "high" },
  { id: "self_employment", label: "Self-Employment", category: "Business", icon: "Building2", triggerKeywords: ["self-employed", "business", "1099", "llc"], priority: "high" },
  { id: "real_estate", label: "Real Estate", category: "Property", icon: "Home", triggerKeywords: ["rental", "property", "real estate", "mortgage"], priority: "high" },
  { id: "retirement", label: "Retirement Plans", category: "Retirement", icon: "PiggyBank", triggerKeywords: ["401k", "ira", "roth", "retirement"], priority: "high" },
  { id: "state", label: "State", category: "Deductions", icon: "MapPin", triggerKeywords: ["texas", "california", "state"], priority: "medium" },
];

/**
 * Legacy: Detect covered intents from text (kept for backward compat)
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

export function getUncoveredIntents(coveredIds: string[]): TaxIntent[] {
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return TAX_INTENTS
    .filter((i) => !coveredIds.includes(i.id))
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

export function hasEnoughInfo(coveredIds: string[]): boolean {
  const criticals = TAX_INTENTS.filter((i) => i.priority === "critical");
  const coveredCriticals = criticals.filter((i) => coveredIds.includes(i.id));
  const highPriority = TAX_INTENTS.filter((i) => i.priority === "high");
  const coveredHigh = highPriority.filter((i) => coveredIds.includes(i.id));
  return coveredCriticals.length >= criticals.length && coveredHigh.length >= 2;
}

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
 * Legacy: Build conversation prompt — now delegates to qualification prompt
 */
export function buildConversationPrompt(coveredIds: string[], conversationHistory: string, entityType?: string): string {
  const uncovered = getUncoveredIntents(coveredIds);
  const uncoveredCritical = uncovered.filter((i) => i.priority === "critical");
  const uncoveredHigh = uncovered.filter((i) => i.priority === "high");
  const ready = hasEnoughInfo(coveredIds);

  const entityContext = getEntityContext(entityType);

  return `You are an expert tax planning advisor for AG FinTax. You are conducting an INTAKE CONVERSATION to understand the client's tax situation before building their personalized plan.

${entityContext}

YOUR ROLE: Ask smart questions to understand their COMPLETE tax picture. Be conversational, warm, and professional.

ALREADY DISCUSSED: ${coveredIds.length > 0 ? coveredIds.join(", ") : "Nothing yet"}

STILL NEED TO COVER:
${uncoveredCritical.length > 0 ? `CRITICAL (must ask): ${uncoveredCritical.map((i) => i.label).join(", ")}` : "All critical topics covered!"}
${uncoveredHigh.length > 0 ? `HIGH PRIORITY: ${uncoveredHigh.map((i) => i.label).join(", ")}` : ""}

${ready ? `You have enough information. Ask if they want to proceed. If yes, respond with: [READY_TO_ANALYZE]` : `Keep asking questions. Do NOT suggest building a plan yet.`}

RULES:
1. Ask ONE question at a time
2. Keep responses SHORT — 2-3 sentences max
3. NEVER generate tax strategies during conversation
4. Include [SUGGESTIONS] block with 3-5 answer options after every response

${conversationHistory ? `CONVERSATION SO FAR:\n${conversationHistory}` : "Start by warmly greeting them and asking what they do for a living."}`;
}

function getEntityContext(entityType?: string): string {
  if (!entityType || entityType === "individual") {
    return `CLIENT: Individual (Form 1040). Focus on: W-2 income, retirement (401k, IRA, Roth), deductions, credits (child, education), investments, charitable giving.`;
  }
  if (entityType === "s_corp") {
    return `CLIENT: S-Corporation (Form 1120-S). Focus on: Reasonable compensation, distributions vs salary, retirement stacking, accountable plan, Augusta Rule, fringe benefits.`;
  }
  if (entityType === "c_corp") {
    return `CLIENT: C-Corporation (Form 1120). Focus on: 21% flat rate, QSBS (§1202), fringe benefits, R&D credits, retained earnings.`;
  }
  if (entityType === "partnership") {
    return `CLIENT: Partnership (Form 1065). Focus on: Special allocations, guaranteed payments, SE tax, §754 elections.`;
  }
  if (entityType === "sole_prop") {
    return `CLIENT: Sole Proprietor (Schedule C). Focus on: Deductions, SE tax, S-Corp evaluation, home office, retirement (SEP/Solo 401k), QBI.`;
  }
  return "";
}

/**
 * Legacy: Voice analysis prompt
 */
export function buildVoiceAnalysisPrompt(transcript: string, coveredIds: string[], entityType?: string): string {
  const uncovered = getUncoveredIntents(coveredIds);
  const ready = hasEnoughInfo(coveredIds);
  const entityContext = entityType ? getEntityContext(entityType) : "";

  return `You heard the user describe their tax situation. Analyze what they told you and identify what's MISSING.

${entityContext}

TRANSCRIPT: "${transcript}"

TOPICS DETECTED: ${coveredIds.join(", ") || "none"}
TOPICS STILL NEEDED: ${uncovered.filter((i) => i.priority === "critical" || i.priority === "high").map((i) => i.label).join(", ")}

${ready
  ? `You have enough info. Summarize what you understood, then ask if they want to proceed. If they say proceed, respond with: [READY_TO_ANALYZE]`
  : `NOT enough info. Summarize what you understood, then ask about the MOST IMPORTANT missing topic.`
}

Keep response concise — bullets for what you heard, then your question.

[SUGGESTIONS]
Yes, let's proceed
I need to add more details
Let me correct something
[/SUGGESTIONS]`;
}
