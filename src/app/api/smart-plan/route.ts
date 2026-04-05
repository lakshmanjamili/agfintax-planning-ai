import { TAX_SYSTEM_PROMPT } from "@/lib/ai/tax-system-prompt";

export const maxDuration = 60;

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface SmartPlanProfile {
  occupation: string;
  filingStatus: string;
  income: number;
  dependents: number;
  hasRealEstate: boolean;
  hasBusinessIncome: boolean;
  hasMortgage: boolean;
  state: string;
  additionalInfo: string;
  entityType?: string;
}

interface ReferenceStrategy {
  id: string;
  title: string;
  category: string;
  description: string;
  ircReference: string;
  savingsFormula: string;
  typicalSavingsRange: { min: number; max: number };
  eligibilityCriteria: string[];
  implementationSteps: string[];
  calculatedSavings?: number;
  calculationExplanation?: string;
}

// Entity-specific strategy focus areas
const ENTITY_STRATEGY_FOCUS: Record<string, string> = {
  individual: `Focus on: W-2 optimization, 401(k)/IRA maximization, itemized deductions, tax credits (child, education, EV), Roth conversions, tax-loss harvesting, charitable giving strategies, HSA, and state tax planning.`,
  s_corp: `Focus on: Reasonable compensation optimization (FICA savings), shareholder distribution planning, retirement plan stacking (401k + profit sharing + cash balance pension), accountable plan, self-employed health insurance deduction, hiring family members, Augusta Rule (home office rental), Section 199A QBI deduction, and entity-level deductions.
CRITICAL: Always include Reasonable Compensation strategy — this is the #1 S-Corp savings opportunity.`,
  c_corp: `Focus on: 21% flat corporate rate advantages, Section 1202 QSBS exclusion ($10M+ gain exclusion), retained earnings strategy, medical expense reimbursement plan (MERP/HRA), group term life insurance, accumulated earnings tax planning, R&D tax credit, fringe benefit optimization, and corporate charitable giving.
CRITICAL: Always evaluate QSBS eligibility — this can exclude up to $10M in capital gains.`,
  partnership: `Focus on: Special allocation strategies, guaranteed payments optimization, self-employment tax on partner income, Section 754 election for basis step-up, carried interest rules (IRC 1061), partner-level retirement plans, K-1 distribution planning, and Section 199A QBI deduction.
CRITICAL: Always include special allocation and guaranteed payment optimization strategies.`,
  sole_prop: `Focus on: Schedule C deductions maximization, self-employment tax optimization, S-Corp election evaluation (when net income exceeds $50K-$60K), home office deduction (simplified vs actual), vehicle expenses (standard mileage vs actual), SEP IRA / Solo 401(k), self-employed health insurance deduction, and QBI deduction (Section 199A).
CRITICAL: Always evaluate whether S-Corp election would save payroll taxes — include this as a strategy.`,
};

/**
 * Attempt to repair common JSON issues from LLM output:
 * - Trailing commas before } or ]
 * - Truncated JSON (close unclosed brackets)
 * - Code fence wrappers
 */
function repairJSON(raw: string): string {
  // Strip markdown code fences
  let s = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

  // Find the first { and work from there
  const start = s.indexOf("{");
  if (start > 0) s = s.slice(start);

  // Remove trailing commas before } or ]
  s = s.replace(/,\s*([\]}])/g, "$1");

  // If JSON is truncated (unclosed), try to close it
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escaped = false;

  for (const ch of s) {
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") openBraces++;
    if (ch === "}") openBraces--;
    if (ch === "[") openBrackets++;
    if (ch === "]") openBrackets--;
  }

  // Close any unclosed structures
  // If we're inside a string, close it first
  if (inString) s += '"';

  // Remove any trailing partial key-value (incomplete last entry)
  // Look for trailing comma or incomplete object
  const lastComplete = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
  if (lastComplete > 0 && (openBraces > 0 || openBrackets > 0)) {
    // Trim to last complete entry
    s = s.slice(0, lastComplete + 1);
    // Recount
    openBraces = 0;
    openBrackets = 0;
    inString = false;
    escaped = false;
    for (const ch of s) {
      if (escaped) { escaped = false; continue; }
      if (ch === "\\") { escaped = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "{") openBraces++;
      if (ch === "}") openBraces--;
      if (ch === "[") openBrackets++;
      if (ch === "]") openBrackets--;
    }
  }

  while (openBrackets > 0) { s += "]"; openBrackets--; }
  while (openBraces > 0) { s += "}"; openBraces--; }

  return s;
}

function buildPrompt(profile: SmartPlanProfile, marginalRate: number, strategies: ReferenceStrategy[], qualificationAnswers?: Record<string, string>): string {
  const entityType = profile.entityType || "individual";
  const entityFocus = ENTITY_STRATEGY_FOCUS[entityType] || ENTITY_STRATEGY_FOCUS.individual;
  const entityLabel = entityType === "s_corp" ? "S-Corporation (1120-S)"
    : entityType === "c_corp" ? "C-Corporation (1120)"
    : entityType === "partnership" ? "Partnership (1065)"
    : entityType === "sole_prop" ? "Sole Proprietorship (Schedule C)"
    : "Individual (1040)";

  // Build strategy reference block from our curated library
  const strategyBlock = strategies.map((s, i) => {
    const calcLine = s.calculatedSavings !== undefined
      ? `\n   CALCULATED SAVINGS: $${s.calculatedSavings.toLocaleString()} (${s.calculationExplanation || 'math-based'})`
      : '';
    return `${i + 1}. [${s.id}] ${s.title} (${s.category})
   IRC: ${s.ircReference}
   Formula: ${s.savingsFormula}
   Typical range: $${s.typicalSavingsRange.min.toLocaleString()}-$${s.typicalSavingsRange.max.toLocaleString()}
   Eligibility: ${s.eligibilityCriteria.slice(0, 2).join("; ")}${calcLine}`;
  }).join("\n");

  // Include qualification answers for context
  const answersBlock = qualificationAnswers && Object.keys(qualificationAnswers).length > 0
    ? Object.entries(qualificationAnswers)
      .filter(([, v]) => v && v !== 'yes' && v !== 'no') // Only include substantive answers (dollar amounts, choices)
      .map(([k, v]) => `- ${k.replace(/-/g, ' ')}: ${v}`)
      .join('\n')
    : '';
  const yesNoBlock = qualificationAnswers && Object.keys(qualificationAnswers).length > 0
    ? Object.entries(qualificationAnswers)
      .filter(([, v]) => v === 'yes' || v === 'no')
      .map(([k, v]) => `- ${k.replace(/-/g, ' ')}: ${v}`)
      .join('\n')
    : '';

  return `You are a tax planning advisor for AG FinTax. Your job is to write PERSONALIZED descriptions for the pre-matched strategies below. The savings numbers have been CALCULATED using the client's actual qualification answers — use them as-is.

ENTITY TYPE: ${entityLabel}
${entityFocus}

CLIENT PROFILE:
- Occupation: ${profile.occupation}
- Filing Status: ${profile.filingStatus}
- Annual Income: $${profile.income.toLocaleString()}
- Marginal Tax Rate: ${marginalRate}%
- Dependents: ${profile.dependents}
- Real Estate: ${profile.hasRealEstate ? "Yes" : "No"}
- Business Income: ${profile.hasBusinessIncome ? "Yes" : "No"}
- Mortgage: ${profile.hasMortgage ? "Yes" : "No"}
- State: ${profile.state || "Not specified"}
- Additional: ${profile.additionalInfo || "None"}
${answersBlock ? `\nCLIENT'S QUALIFICATION ANSWERS (dollar amounts and specific data):\n${answersBlock}` : ''}
${yesNoBlock ? `\nCLIENT'S ELIGIBILITY ANSWERS:\n${yesNoBlock}` : ''}

PRE-MATCHED STRATEGIES FROM OUR LIBRARY (${strategies.length} matched):
${strategyBlock}

YOUR TASK:
1. For EACH strategy above, write a 2-3 sentence personalized description referencing the client's SPECIFIC numbers from their qualification answers.
2. Keep the same id, title, category, and ircReference from the library.
3. If the strategy has CALCULATED SAVINGS shown above, use EXACTLY that number for estimatedSavings. Do NOT invent a different number.
4. If no calculated savings are shown, calculate: deductions × ${marginalRate}% marginal rate, credits = dollar-for-dollar.
5. For savingsMin and savingsMax: use the calculated range if available, otherwise estimate conservatively.
6. Include the actual math in descriptions (e.g., "2 children × $2,000 = $4,000 credit" or "$23,500 × 24% = $5,640 savings").
7. Sort by estimatedSavings descending.
8. For long-term/future-benefit strategies ($0 immediate savings), explain WHY there is no current-year benefit.

CRITICAL CONSTRAINTS:
- You MUST ONLY use strategies from the pre-matched list above. Do NOT generate, suggest, or invent any strategies not in this list.
- Every strategy in your response MUST have an id that matches one from the pre-matched list.
- The savings numbers are AUTHORITATIVE — they were computed from the client's actual answers using IRS formulas. Do NOT change them.
- Reference the client's actual numbers (income, dependents, contribution amounts, expense amounts) in each description.
- This is a curated, compliance-reviewed strategy library. Do not deviate from it.

Return ONLY valid JSON (no markdown, no code fences):
{"totalEstimatedSavings":<number>,"strategies":[{"id":"<from library>","category":"<from library>","title":"<from library>","description":"<personalized 2-3 sentences with MATH showing how savings were calculated>","estimatedSavings":<number>,"savingsMin":<number>,"savingsMax":<number>,"ircReference":"<from library>","applicability":"<High|Medium|Low>","implementationSteps":["step1 for this client","step2","step3"]}]}`;
}

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const { profile, referenceStrategies, referenceStrategyData, qualificationAnswers, marginalRate: clientMarginalRate } = await req.json() as {
      profile: SmartPlanProfile;
      referenceStrategies?: string[];
      referenceStrategyData?: ReferenceStrategy[];
      qualificationAnswers?: Record<string, string>;
      marginalRate?: number;
    };
    const apiKey = process.env.OPENROUTER_API_KEY;

    console.log("=== SMART PLAN API ===");
    console.log(`Profile: ${profile.occupation}, $${profile.income.toLocaleString()}, ${profile.filingStatus}, ${profile.entityType || "individual"}`);
    console.log(`Strategy data objects: ${referenceStrategyData?.length || 0}`);
    console.log(`Strategy name hints: ${referenceStrategies?.length || 0}`);
    console.log(`Qualification answers: ${qualificationAnswers ? Object.keys(qualificationAnswers).length : 0}`);

    if (!apiKey) {
      return Response.json({ error: "OPENROUTER_API_KEY not configured. Set it in .env.local" }, { status: 500 });
    }

    // Use client-calculated marginal rate if provided, otherwise estimate from income
    const marginalRate = clientMarginalRate || (profile.income >= 626350 ? 37
      : profile.income >= 250525 ? 35
      : profile.income >= 197300 ? 32
      : profile.income >= 103350 ? 24
      : profile.income >= 48475 ? 22
      : profile.income >= 11925 ? 12
      : 10);

    const prompt = buildPrompt(profile, marginalRate, referenceStrategyData || [], qualificationAnswers);
    const systemContent = TAX_SYSTEM_PROMPT + "\n\nRespond with ONLY valid JSON. No markdown, no explanation, no code blocks.";

    // Models in priority order
    const models = [
      "openai/gpt-5.4",
      "anthropic/claude-sonnet-4",
    ];

    let lastError = "";

    for (const model of models) {
      try {
        console.log(`→ Trying ${model}...`);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 45000);

        const response = await fetch(OPENROUTER_URL, {
          method: "POST",
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://agfintax.com",
            "X-Title": "AgFinTax Smart Plan",
          },
          body: JSON.stringify({
            model,
            temperature: 0.2,
            max_tokens: 3000,
            messages: [
              { role: "system", content: systemContent },
              { role: "user", content: prompt },
            ],
          }),
        });
        clearTimeout(timeout);

        if (!response.ok) {
          const errText = await response.text();
          lastError = `${model}: HTTP ${response.status} - ${errText.slice(0, 200)}`;
          console.error(`  ✗ ${lastError}`);
          continue;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        const finishReason = data.choices?.[0]?.finish_reason || "unknown";

        console.log(`  Response: ${content.length} chars, finish_reason: ${finishReason}`);

        if (!content) {
          lastError = `${model}: Empty response`;
          console.error(`  ✗ ${lastError}`);
          continue;
        }

        // Try direct parse first, then repair
        let parsed;
        try {
          const cleaned = content.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
          parsed = JSON.parse(cleaned);
        } catch (directErr) {
          console.log(`  Direct JSON parse failed: ${directErr}. Attempting repair...`);
          try {
            const repaired = repairJSON(content);
            parsed = JSON.parse(repaired);
            console.log(`  ✓ JSON repair successful`);
          } catch (repairErr) {
            lastError = `${model}: JSON parse failed even after repair - ${repairErr}`;
            console.error(`  ✗ ${lastError}`);
            // Log first/last 200 chars to help debug
            console.error(`  Content start: ${content.slice(0, 200)}`);
            console.error(`  Content end: ${content.slice(-200)}`);
            continue;
          }
        }

        // Validate the response has strategies
        if (!parsed.strategies || !Array.isArray(parsed.strategies) || parsed.strategies.length === 0) {
          lastError = `${model}: Response missing strategies array`;
          console.error(`  ✗ ${lastError}`);
          continue;
        }

        // Ensure all strategies have required fields
        parsed.strategies = parsed.strategies
          .filter((s: Record<string, unknown>) => s.title && typeof s.estimatedSavings === "number")
          .map((s: Record<string, unknown>) => ({
            id: s.id || String(Math.random()).slice(2, 10),
            category: s.category || "Deductions",
            title: s.title,
            description: s.description || "",
            estimatedSavings: s.estimatedSavings,
            savingsMin: s.savingsMin || Math.round((s.estimatedSavings as number) * 0.5),
            savingsMax: s.savingsMax || Math.round((s.estimatedSavings as number) * 1.5),
            ircReference: s.ircReference || "",
            applicability: s.applicability || "Medium",
            implementationSteps: Array.isArray(s.implementationSteps) ? s.implementationSteps : [],
          }));

        // Recalculate total from actual strategies
        parsed.totalEstimatedSavings = parsed.strategies.reduce(
          (sum: number, s: { estimatedSavings: number }) => sum + s.estimatedSavings, 0
        );

        const elapsed = Date.now() - startTime;
        console.log(`  ✓ SUCCESS with ${model} in ${(elapsed / 1000).toFixed(1)}s`);
        console.log(`  Strategies: ${parsed.strategies.length}, Total: $${parsed.totalEstimatedSavings.toLocaleString()}`);

        return Response.json(parsed);
      } catch (err) {
        lastError = `${model}: ${err instanceof Error ? err.message : String(err)}`;
        console.error(`  ✗ ${lastError}`);
        continue;
      }
    }

    // All models failed
    const elapsed = Date.now() - startTime;
    console.error(`=== ALL MODELS FAILED in ${(elapsed / 1000).toFixed(1)}s ===`);
    console.error(`Last error: ${lastError}`);
    return Response.json({ error: "All AI models failed", details: lastError }, { status: 500 });
  } catch (error) {
    console.error("Smart Plan API error:", error);
    return Response.json({ error: "Failed to generate plan", details: String(error) }, { status: 500 });
  }
}
