// =============================================================================
// Qualification Engine V2 — Two-Phase Strategy Filtering
// Phase 1: Profile gates (entity, income, filing status) → narrow 62 → ~15
// Phase 2: Per-strategy qualification questions with disqualifyOn → ~5-8 qualified
// =============================================================================

import {
  strategyDatabase,
  type StrategyQualification,
  type QualificationQuestion,
  type EntityType,
  type FilingStatus,
  type StrategyTier,
} from './strategy-database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClientProfileV2 {
  entityType: EntityType;
  filingStatus: FilingStatus;
  annualIncome: number;
  dependents: number;
  state: string;
  hasBusinessIncome: boolean;
  age: number;
  // Extended fields — used for smart pre-fill of qualification answers
  hasInvestments?: boolean;
  hasRealEstate?: boolean;
  hasCharitableGiving?: boolean;
  hasRetirementAccounts?: boolean;
  retirementAccountTypes?: string[];
  hasMortgage?: boolean;
  hasHealthInsurance?: boolean;
  incomeSources?: string[];
  occupation?: string;
}

export interface QualificationResult {
  strategyId: string;
  strategyTitle: string;
  qualified: boolean;
  disqualifiedBy?: string; // question ID that failed
  answeredQuestions: Record<string, string>;
  pendingRequiredQuestions: QualificationQuestion[];
  allPendingQuestions: QualificationQuestion[];
}

export interface PlanSession {
  profile: ClientProfileV2 | null;
  phase: 'profile' | 'qualifying' | 'ready';
  candidates: StrategyQualification[];
  qualifiedIds: string[];
  disqualifiedIds: string[];
  answers: Record<string, string>;
  currentStrategyIndex: number;
  profileComplete: boolean;
}

// ---------------------------------------------------------------------------
// Phase 1: Filter by Profile
// ---------------------------------------------------------------------------

export function filterByProfile(profile: ClientProfileV2): StrategyQualification[] {
  // Determine tier based on entity type
  const isIndividual = profile.entityType === 'individual';

  return strategyDatabase.filter(strategy => {
    // 1. Tier check: individuals only see individual strategies (unless they have business income)
    if (isIndividual && !profile.hasBusinessIncome && strategy.tier === 'business') {
      return false;
    }

    // 2. Entity type check
    if (!strategy.applicableTo.includes(profile.entityType)) {
      return false;
    }

    // 3. Income threshold check
    if (strategy.incomeThreshold?.min && profile.annualIncome < strategy.incomeThreshold.min) {
      return false;
    }
    if (strategy.incomeThreshold?.max && profile.annualIncome > strategy.incomeThreshold.max) {
      return false;
    }

    // 4. Filing status restriction check
    if (strategy.filingStatusRestriction && strategy.filingStatusRestriction.length > 0) {
      if (!strategy.filingStatusRestriction.includes(profile.filingStatus)) {
        return false;
      }
    }

    return true;
  });
}

// ---------------------------------------------------------------------------
// KNOWLEDGE-TEST QUESTIONS — should NEVER disqualify someone
// These ask "do you understand X?" — a CPA would teach you, so "no" is fine.
// We auto-answer "yes" for these so they never block a strategy.
// ---------------------------------------------------------------------------

const KNOWLEDGE_TEST_QUESTION_IDS = new Set([
  'wash-sale-understanding',        // "Do you understand wash sale rules?"
  'long-term-vs-short-term',        // "Do you understand long-term vs short-term impacts?"
  'carryforward-expectations',      // "Do you understand unused losses carry forward?"
]);

// ---------------------------------------------------------------------------
// SMART PRE-FILL — Use profile data to auto-answer qualification questions
// This is the KEY to reducing questions from ~100 to ~10-15
// ---------------------------------------------------------------------------

export function preAnswerFromProfile(
  profile: ClientProfileV2,
  candidates: StrategyQualification[]
): Record<string, string> {
  const answers: Record<string, string> = {};

  const hasKids = profile.dependents > 0;
  const isW2 = profile.incomeSources?.includes('W-2') || (!profile.hasBusinessIncome && profile.entityType === 'individual');
  // IMPORTANT: Only use EXPLICIT true/false from profile. undefined = UNKNOWN → ASK, don't assume.
  const hasInvestments = profile.hasInvestments; // could be undefined
  const hasCharitable = profile.hasCharitableGiving; // could be undefined
  const hasRealEstate = profile.hasRealEstate; // could be undefined
  const hasMortgage = profile.hasMortgage; // could be undefined
  const hasRetirement = profile.hasRetirementAccounts; // could be undefined
  const isMFJ = profile.filingStatus === 'married_jointly';
  const isOver50 = profile.age >= 50;
  const isOver70 = profile.age >= 70;
  const incomeUnder400K = profile.annualIncome < 400000;
  const incomeUnder200K = profile.annualIncome < 200000;
  const isHighIncome = profile.annualIncome >= 150000;

  // Auto-answer knowledge-test questions as "yes" (CPA will guide them)
  for (const strategy of candidates) {
    for (const q of strategy.qualificationQuestions) {
      if (KNOWLEDGE_TEST_QUESTION_IDS.has(q.id)) {
        answers[q.id] = 'yes';
      }
    }
  }

  // ---- CHILD TAX CREDIT — auto-qualify if has kids + income under limit ----
  if (hasKids) {
    answers['child-age-ctc'] = 'yes';           // children under 17 (assume)
    answers['child-relationship-ctc'] = 'yes';   // biological/step/foster
    answers['financial-support-ctc'] = 'yes';    // >50% support
    answers['residence-test-ctc'] = 'yes';       // lived with >6 months
    answers['dependent-claim-ctc'] = 'yes';      // claimed as dependent
    answers['ssn-ctc'] = 'yes';                  // has SSN
    answers['citizen-status-ctc'] = 'yes';       // US citizen
    if ((isMFJ && profile.annualIncome < 400000) || (!isMFJ && incomeUnder200K)) {
      answers['income-limit-ctc'] = 'yes';       // under income limit
    }
  } else {
    // DEFINITIVE: 0 dependents = no children
    answers['child-age-ctc'] = 'no';
    answers['child-age-coverdell'] = 'no';
    answers['dependent-age-dcc'] = 'no';
  }

  // ---- DEPENDENT CARE — auto-fill if has kids ----
  if (hasKids) {
    answers['dependent-age-dcc'] = 'yes';
    answers['income-requirement-dcc'] = 'yes';
    answers['care-services-paid'] = 'yes';       // working parents with kids use childcare
    answers['care-provider-info'] = 'yes';        // they can provide provider info
    if (isMFJ) {
      answers['filing-status-dcc'] = 'married filing jointly';
    }
  }

  // ---- COVERDELL — auto-fill if has kids + income known ----
  if (hasKids) {
    answers['child-age-coverdell'] = 'yes';
    answers['distribution-by-30'] = 'yes';
    answers['contribution-amount-coverdell'] = 'yes'; // $2K is modest
    if (isMFJ) {
      answers['filing-status-coverdell'] = 'married filing jointly';
    }
  }

  // ---- 401(k) / RETIREMENT — auto-fill for W-2 employees ----
  if (isW2) {
    // Most W-2 professionals at high income levels have 401(k) access
    if (hasRetirement === true || profile.retirementAccountTypes?.some(t => t.toLowerCase().includes('401'))) {
      answers['has-employer-401k'] = 'yes';
      answers['employer-roth-401k'] = 'yes';
      answers['current-contribution-401k'] = 'yes';
      answers['plan-to-max-401k'] = 'yes';
    } else if (isHighIncome) {
      // High-income W-2 professionals very likely have 401(k) — assume yes
      answers['has-employer-401k'] = 'yes';
      answers['current-contribution-401k'] = 'yes';
    }
    if (isOver50) {
      answers['age-401k'] = 'yes';
    }
    // Filing status for various strategies
    if (isMFJ) {
      answers['filing-status-coverdell'] = 'married filing jointly';
      answers['filing-status-home-sale'] = 'married filing jointly';
      answers['filing-status-se-health'] = 'married filing jointly';
    }
  }

  // ---- INVESTMENTS / TAX-LOSS HARVESTING ----
  if (hasInvestments === true) {
    // Explicitly has investments → auto-fill tax-loss-harvesting
    answers['investment-losses'] = 'yes';
    answers['capital-gains-to-offset'] = 'yes';
    answers['liquidity-for-harvesting'] = 'yes';
    answers['annual-portfolio-review'] = 'yes';
    // Also enable DAF with appreciated securities if charitable
    answers['large-unrealized-gains'] = 'yes';
    // QOZ — auto-fill "willingness" gates (these are implementation, not real eligibility)
    answers['capital-gains-qoz'] = 'yes';
    answers['higher-risk-comfort'] = 'yes';
    answers['need-access-10-years'] = 'no';     // "no" = don't need early access = GOOD
    answers['tax-professional-guidance'] = 'yes';
  }
  // If hasInvestments is undefined → DON'T pre-answer, let the engine ask

  // ---- QOZ — only disqualify if we KNOW they have no capital gains ----
  // Don't auto-disqualify W-2 employees — they may have significant investments
  // Only disqualify if hasInvestments is explicitly false
  if (hasInvestments === false && isW2 && !profile.hasBusinessIncome) {
    answers['capital-gains-qoz'] = 'no';
  }

  // ---- SELF-DIRECTED RETIREMENT — W-2 with employer 401(k) rarely needs this ----
  // Self-directed IRAs are for people who want alternative investments (RE, crypto, etc.)
  // A W-2 employee with existing retirement accounts is already served by traditional/Roth 401(k)
  if (isW2 && hasRetirement === true) {
    answers['alternative-investment-interest'] = 'no'; // disqualifies self-directed-retirement
  }

  // ---- CONSERVATION EASEMENTS — W-2 employees very rarely own conservation land ----
  // Only leave this open if they EXPLICITLY have real estate
  if (isW2 && hasRealEstate !== true) {
    answers['conservation-property'] = 'no';    // disqualifies conservation-easements-individual
    answers['easement-compatible-land'] = 'no';
  }

  // ---- CHARITABLE GIVING ----
  if (hasCharitable === true) {
    answers['charitable-intent'] = 'yes';
    answers['charitable-contributions-qcd'] = 'yes';
    answers['charitable-contributions'] = 'yes';
    answers['makes-charitable-gifts'] = 'yes';
    // DAF: charitable donors likely itemize and may have appreciated securities
    if (hasInvestments === true) {
      answers['appreciated-securities'] = 'yes';
      answers['initial-daf-contribution'] = 'yes';
    }
    if (hasMortgage === true || isHighIncome) {
      answers['bunch-deductions'] = 'yes';
    }
  }
  // If hasCharitable is undefined → DON'T pre-answer 'no', let the engine ASK
  // Only disqualify if EXPLICITLY false
  if (hasCharitable === false) {
    answers['charitable-intent'] = 'no';
    answers['charitable-contributions-qcd'] = 'no';
    answers['makes-charitable-gifts'] = 'no';
  }

  // ---- REAL ESTATE ----
  // Only disqualify conservation if we KNOW they have no real estate
  if (hasRealEstate === false) {
    answers['conservation-property'] = 'no';
    answers['easement-compatible-land'] = 'no';
  }
  // Don't auto-disqualify home sale — many people own primary residences
  // even without checking "hasRealEstate" (which often means investment RE)

  // ---- HOME SALE — W-2 employees rarely planning to sell home ----
  // Only ask if they have real estate flagged; otherwise assume not selling
  if (isW2 && hasRealEstate !== true) {
    answers['planning-home-sale'] = 'no'; // disqualifies home-sale-gain-exclusion
  }

  // ---- DEFERRED COMPENSATION — Only realistic at very high income levels ----
  // Most employers under $400K don't offer 409A plans
  if (isW2 && profile.annualIncome < 400000) {
    answers['employer-allows-deferral'] = 'no'; // disqualifies deferred-compensation-individual
  }

  // ---- MORTGAGE / ITEMIZATION ----
  if (hasMortgage === true) {
    answers['mortgage-interest'] = 'yes';
    answers['itemize-deductions-daf'] = 'yes';
    answers['itemize-easement'] = 'yes';
  }
  // High income + state taxes → likely itemizing
  if (isHighIncome) {
    answers['property-taxes-itemize'] = 'yes';
    answers['salt-tax-payment'] = 'yes';
  }

  // ---- SELF-EMPLOYMENT — DEFINITIVE: W-2 only = not self-employed ----
  if (!profile.hasBusinessIncome && profile.entityType === 'individual') {
    answers['self-employed-definition'] = 'no';
    answers['earned-income-se-health'] = 'no';
    answers['no-employer-coverage'] = 'no';
  }

  // ---- AGE-BASED — DEFINITIVE ----
  if (!isOver70) {
    answers['age-70-5'] = 'no';                   // not eligible for QCD
  }
  if (isOver50) {
    answers['age-401k'] = 'yes';
    answers['age-55-hsa'] = 'yes';
  }

  // ---- HIGH NET WORTH — DEFINITIVE for < $500K income ----
  if (profile.annualIncome < 500000) {
    answers['net-worth-foundation'] = 'no';
  }

  // ---- EARNED INCOME — W-2 = yes ----
  if (isW2) {
    answers['income-requirement-dcc'] = 'yes';
  }

  // ---- HSA — only disqualify if explicitly no insurance ----
  if (profile.hasHealthInsurance === false) {
    answers['hdhp-coverage'] = 'no';
  }
  // Pre-fill non-gate HSA questions to reduce count when they do qualify
  if (!isOver50) {
    answers['age-55-hsa'] = 'no';
  }
  // Investment-minded people would invest HSA funds
  if (hasInvestments === true) {
    answers['invest-hsa-funds'] = 'yes';
    answers['emergency-funds-separate'] = 'yes';
  }

  // ---- DEFERRED COMPENSATION — high income W-2 likely has excess ----
  if (isW2 && isHighIncome) {
    answers['excess-compensation'] = 'yes';
  }

  // ---- ROTH 401(k) — high income = likely higher bracket in retirement ----
  if (isHighIncome && isW2) {
    answers['already-contributing-roth-401k'] = 'no'; // conservative — ask
  }

  // ---- ROTH CONVERSION — auto-fill if has retirement accounts ----
  if (hasRetirement === true) {
    answers['has-traditional-ira'] = 'yes';
    answers['roth-time-horizon'] = 'yes'; // assume not retiring immediately
    answers['conversion-tax-ability'] = 'yes'; // high income likely can pay
  }

  // ---- CHARITABLE OPTIMIZATION — don't pre-answer, let engine ask ----
  // (charitable-intent already handled above)

  // ---- REAL ESTATE PROFESSIONAL — auto-disqualify for typical W-2 employees ----
  if (isW2 && !profile.hasBusinessIncome) {
    answers['real-estate-hours'] = 'no'; // W-2 employees typically can't hit 750 hours
    answers['majority-time-re'] = 'no';
  }

  return answers;
}

// ---------------------------------------------------------------------------
// Phase 2: Evaluate a Strategy Against Answers
// ---------------------------------------------------------------------------

export function evaluateStrategy(
  strategy: StrategyQualification,
  answers: Record<string, string>
): QualificationResult {
  const pendingRequired: QualificationQuestion[] = [];
  const allPending: QualificationQuestion[] = [];

  for (const q of strategy.qualificationQuestions) {
    const answer = answers[q.id];

    if (!answer || answer === '') {
      // Unanswered
      if (q.required) pendingRequired.push(q);
      allPending.push(q);
      continue;
    }

    // Check disqualification
    if (q.disqualifyOn) {
      const disqualifiers = Array.isArray(q.disqualifyOn)
        ? q.disqualifyOn
        : [q.disqualifyOn];

      if (disqualifiers.includes(answer.toLowerCase())) {
        return {
          strategyId: strategy.id,
          strategyTitle: strategy.title,
          qualified: false,
          disqualifiedBy: q.id,
          answeredQuestions: answers,
          pendingRequiredQuestions: [],
          allPendingQuestions: [],
        };
      }
    }
  }

  // If no pending required questions → qualified
  const qualified = pendingRequired.length === 0;

  return {
    strategyId: strategy.id,
    strategyTitle: strategy.title,
    qualified,
    answeredQuestions: answers,
    pendingRequiredQuestions: pendingRequired,
    allPendingQuestions: allPending,
  };
}

// ---------------------------------------------------------------------------
// Smart Question Deduplication — Ask Once, Apply to Many Strategies
// Maps shared concepts to multiple strategy-specific question IDs.
// When the user answers a shared topic, all related questions get auto-filled.
// ---------------------------------------------------------------------------

interface TopicMapping {
  /** The shared topic question to ask the user */
  question: string;
  helpText: string;
  type: 'yes_no' | 'choice' | 'currency' | 'number' | 'text';
  choices?: string[];
  /** Strategy question IDs that this topic answers */
  mappedIds: string[];
  /** How to map the answer: 'direct' means same answer, or a transform function key */
  answerMapping: 'direct' | 'invert';
}

const TOPIC_MAPPINGS: TopicMapping[] = [
  {
    question: 'Do you have children under 17?',
    helpText: 'This affects child tax credit, dependent care, and education strategies.',
    type: 'yes_no',
    mappedIds: ['child-age-ctc', 'child-age-coverdell', 'dependent-age-dcc', 'care-services-paid'],
    answerMapping: 'direct',
  },
  {
    question: 'Do you make charitable contributions or plan to?',
    helpText: 'This determines eligibility for multiple charitable giving strategies.',
    type: 'yes_no',
    mappedIds: ['charitable-intent', 'charitable-contributions-qcd', 'charitable-contributions', 'makes-charitable-gifts'],
    answerMapping: 'direct',
  },
  {
    question: 'Do you itemize deductions (vs. taking the standard deduction)?',
    helpText: 'Several strategies require itemizing deductions to be beneficial.',
    type: 'yes_no',
    mappedIds: ['itemize-deductions-daf', 'itemize-easement'],
    answerMapping: 'direct',
  },
  {
    question: 'Does your employer offer a 401(k) or similar retirement plan?',
    helpText: 'This affects traditional 401(k), Roth 401(k), and other retirement strategies.',
    type: 'yes_no',
    mappedIds: ['has-employer-401k', 'employer-roth-401k'],
    answerMapping: 'direct',
  },
  {
    question: 'Are you self-employed or have self-employment income?',
    helpText: 'This determines eligibility for self-employed specific deductions.',
    type: 'yes_no',
    mappedIds: ['self-employed-definition', 'earned-income-se-health'],
    answerMapping: 'direct',
  },
  {
    question: 'Do you have investments with unrealized capital gains or losses?',
    helpText: 'This affects tax-loss harvesting, opportunity zones, and charitable contribution strategies.',
    type: 'yes_no',
    mappedIds: ['investment-losses', 'capital-gains-to-offset', 'capital-gains-qoz', 'appreciated-securities', 'large-unrealized-gains'],
    answerMapping: 'direct',
  },
  {
    question: 'Are you enrolled in a High Deductible Health Plan (HDHP)?',
    helpText: 'Required for Health Savings Account eligibility.',
    type: 'yes_no',
    mappedIds: ['hdhp-coverage'],
    answerMapping: 'direct',
  },
  {
    question: 'Are you planning to sell your primary residence?',
    helpText: 'Determines eligibility for home sale gain exclusion.',
    type: 'yes_no',
    mappedIds: ['planning-home-sale'],
    answerMapping: 'direct',
  },
  {
    question: 'Do you own land with conservation value?',
    helpText: 'Determines eligibility for conservation easement deductions.',
    type: 'yes_no',
    mappedIds: ['conservation-property', 'easement-compatible-land'],
    answerMapping: 'direct',
  },
  {
    question: 'Does your employer offer a deferred compensation plan?',
    helpText: 'For non-qualified deferred compensation strategies.',
    type: 'yes_no',
    mappedIds: ['employer-allows-deferral'],
    answerMapping: 'direct',
  },
  {
    question: 'Are you age 50 or older?',
    helpText: 'Affects catch-up contribution limits for retirement accounts.',
    type: 'yes_no',
    mappedIds: ['age-401k', 'age-55-hsa'],
    answerMapping: 'direct',
  },
  {
    question: 'Are you age 70.5 or older?',
    helpText: 'Determines eligibility for Qualified Charitable Distributions from IRAs.',
    type: 'yes_no',
    mappedIds: ['age-70-5'],
    answerMapping: 'direct',
  },
  {
    question: 'Do you have a net worth exceeding $10 million?',
    helpText: 'High net worth philanthropy strategies.',
    type: 'yes_no',
    mappedIds: ['net-worth-foundation'],
    answerMapping: 'direct',
  },
  {
    question: 'What is your anticipated 2025 W-2 wages?',
    helpText: 'Used across retirement and Roth strategies to determine contribution limits.',
    type: 'currency',
    mappedIds: ['annual-income-401k', 'anticipated-wages-roth-401k'],
    answerMapping: 'direct',
  },
];

/**
 * Apply topic-based answer propagation: when a topic question is answered,
 * fill in all mapped strategy-specific question IDs with the same answer.
 */
function propagateTopicAnswer(questionId: string, answer: string, currentAnswers: Record<string, string>): Record<string, string> {
  const updated = { ...currentAnswers, [questionId]: answer };

  for (const topic of TOPIC_MAPPINGS) {
    if (topic.mappedIds.includes(questionId)) {
      // This question belongs to a topic — fill all sibling IDs
      for (const siblingId of topic.mappedIds) {
        if (!updated[siblingId]) {
          if (topic.answerMapping === 'direct') {
            updated[siblingId] = answer;
          } else if (topic.answerMapping === 'invert') {
            updated[siblingId] = answer === 'yes' ? 'no' : 'yes';
          }
        }
      }
      break;
    }
  }

  return updated;
}

/**
 * Check if a question has already been answered via topic propagation
 * and doesn't need to be asked again.
 */
function isQuestionAnsweredByTopic(questionId: string, answers: Record<string, string>): boolean {
  return !!answers[questionId];
}

// ---------------------------------------------------------------------------
// Get Next Question to Ask (with topic deduplication)
// ---------------------------------------------------------------------------

export function getNextQuestion(
  candidates: StrategyQualification[],
  qualifiedIds: string[],
  disqualifiedIds: string[],
  answers: Record<string, string>
): { strategy: StrategyQualification; question: QualificationQuestion; questionIndex: number; totalQuestions: number; strategyIndex: number; totalStrategies: number } | null {
  // Include both unresolved AND qualified strategies — we want ALL questions answered.
  // Only exclude disqualified strategies (they failed a hard gate, no point asking more).
  const active = candidates.filter(
    s => !disqualifiedIds.includes(s.id)
  );

  if (active.length === 0) return null;

  // Sort: unresolved strategies first, then qualified.
  // Within each group, sort by "readiness" — strategies with fewer unanswered questions first
  // (they're already partially pre-filled = more relevant). Break ties by savings potential.
  const sortByReadiness = (a: StrategyQualification, b: StrategyQualification) => {
    const aRemaining = a.qualificationQuestions.filter(q => !isQuestionAnsweredByTopic(q.id, answers)).length;
    const bRemaining = b.qualificationQuestions.filter(q => !isQuestionAnsweredByTopic(q.id, answers)).length;
    if (aRemaining !== bRemaining) return aRemaining - bRemaining; // fewer questions first
    return b.typicalSavingsRange.max - a.typicalSavingsRange.max; // tie-break by savings
  };
  const unresolved = active.filter(s => !qualifiedIds.includes(s.id)).sort(sortByReadiness);
  const qualified = active.filter(s => qualifiedIds.includes(s.id)).sort(sortByReadiness);
  const sorted = [...unresolved, ...qualified];

  const totalActive = sorted.length;

  // STRATEGY-BY-STRATEGY: Finish ALL questions for one strategy before moving to next.
  // Within each strategy: gate questions first, then required, then optional/amounts.
  for (let si = 0; si < sorted.length; si++) {
    const strategy = sorted[si];
    const result = evaluateStrategy(strategy, answers);
    if (!result.qualified && result.disqualifiedBy) continue; // Disqualified by a gate

    // Count total unanswered questions for this strategy (for progress display)
    const allUnanswered = strategy.qualificationQuestions.filter(
      q => !isQuestionAnsweredByTopic(q.id, answers)
    );
    if (allUnanswered.length === 0) continue; // Strategy fully interviewed

    const totalQs = strategy.qualificationQuestions.length;
    const answeredQs = totalQs - allUnanswered.length;

    // Pass 1: Gate questions (disqualifyOn) — can eliminate this strategy
    for (const q of strategy.qualificationQuestions) {
      if (!q.disqualifyOn || !q.required) continue;
      if (isQuestionAnsweredByTopic(q.id, answers)) continue;
      return { strategy, question: q, questionIndex: answeredQs + 1, totalQuestions: totalQs, strategyIndex: si + 1, totalStrategies: totalActive };
    }

    // Pass 2: Remaining required questions — needed for accurate data
    for (const q of strategy.qualificationQuestions) {
      if (!q.required || q.disqualifyOn) continue;
      if (isQuestionAnsweredByTopic(q.id, answers)) continue;
      return { strategy, question: q, questionIndex: answeredQs + 1, totalQuestions: totalQs, strategyIndex: si + 1, totalStrategies: totalActive };
    }

    // Pass 3: Optional AMOUNT questions (currency/number) — needed for accurate calculations
    // Skip optional yes/no questions to keep the interview focused
    for (const q of strategy.qualificationQuestions) {
      if (q.required) continue;
      if (q.type !== 'currency' && q.type !== 'number') continue; // Only ask amount questions
      if (isQuestionAnsweredByTopic(q.id, answers)) continue;
      return { strategy, question: q, questionIndex: answeredQs + 1, totalQuestions: totalQs, strategyIndex: si + 1, totalStrategies: totalActive };
    }
  }

  return null; // All strategies fully interviewed
}

// ---------------------------------------------------------------------------
// Process an Answer — Update Session State
// ---------------------------------------------------------------------------

/**
 * Resolve all unresolved strategies — strategies that have been fully answered
 * (or have no more required questions to ask) but haven't been marked qualified/disqualified.
 * This catches strategies that got pre-disqualified by pre-fill answers or topic propagation.
 */
export function resolveUnresolved(session: PlanSession): PlanSession {
  const updated = { ...session };
  const newQualified = [...session.qualifiedIds];
  const newDisqualified = [...session.disqualifiedIds];

  for (const strategy of session.candidates) {
    if (newQualified.includes(strategy.id) || newDisqualified.includes(strategy.id)) continue;

    const result = evaluateStrategy(strategy, session.answers);
    if (result.disqualifiedBy) {
      newDisqualified.push(strategy.id);
    } else if (result.qualified) {
      newQualified.push(strategy.id);
    }
  }

  updated.qualifiedIds = newQualified;
  updated.disqualifiedIds = newDisqualified;

  // Ready ONLY when all questions (including optional/amounts) are fully answered.
  const hasMoreQuestions = getNextQuestion(session.candidates, newQualified, newDisqualified, session.answers) !== null;
  if (!hasMoreQuestions) {
    updated.phase = 'ready';
  }

  return updated;
}

export function processAnswer(
  session: PlanSession,
  questionId: string,
  answer: string
): PlanSession {
  const updated = { ...session };
  // Propagate answer to all related strategy questions via topic mapping
  updated.answers = propagateTopicAnswer(questionId, answer.toLowerCase(), session.answers);

  // Re-evaluate all candidate strategies
  const newQualified: string[] = [...session.qualifiedIds];
  const newDisqualified: string[] = [...session.disqualifiedIds];

  for (const strategy of session.candidates) {
    if (newQualified.includes(strategy.id) || newDisqualified.includes(strategy.id)) {
      continue; // Already decided
    }

    const result = evaluateStrategy(strategy, updated.answers);

    if (result.disqualifiedBy && !newDisqualified.includes(strategy.id)) {
      newDisqualified.push(strategy.id);
    } else if (result.qualified && !newQualified.includes(strategy.id)) {
      newQualified.push(strategy.id);
    }
  }

  updated.qualifiedIds = newQualified;
  updated.disqualifiedIds = newDisqualified;

  // Only move to 'ready' when ALL questions (required + optional/amounts) are answered
  // across ALL active strategies. This ensures we collect full data for accurate calculations.
  const hasMoreQuestions = getNextQuestion(session.candidates, newQualified, newDisqualified, updated.answers) !== null;

  if (!hasMoreQuestions) {
    // Every strategy has been fully interviewed (all questions answered)
    // Auto-qualify any remaining unresolved strategies
    for (const strategy of session.candidates) {
      if (!newQualified.includes(strategy.id) && !newDisqualified.includes(strategy.id)) {
        newQualified.push(strategy.id);
      }
    }
    updated.qualifiedIds = newQualified;
    updated.phase = 'ready';
  }

  return updated;
}

/**
 * Check if there are any remaining eligibility gate questions (ones with disqualifyOn).
 * Returns the first gate question found, or null if all gates are answered.
 */
function getNextGateQuestion(
  candidates: StrategyQualification[],
  qualifiedIds: string[],
  disqualifiedIds: string[],
  answers: Record<string, string>
): { strategy: StrategyQualification; question: QualificationQuestion } | null {
  const remaining = candidates.filter(
    s => !qualifiedIds.includes(s.id) && !disqualifiedIds.includes(s.id)
  );
  for (const strategy of remaining) {
    const result = evaluateStrategy(strategy, answers);
    if (!result.qualified && result.disqualifiedBy) continue;
    for (const q of result.pendingRequiredQuestions) {
      if (q.disqualifyOn && !isQuestionAnsweredByTopic(q.id, answers)) {
        return { strategy, question: q };
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Create Initial Session
// ---------------------------------------------------------------------------

export function createSession(): PlanSession {
  return {
    profile: null,
    phase: 'profile',
    candidates: [],
    qualifiedIds: [],
    disqualifiedIds: [],
    answers: {},
    currentStrategyIndex: 0,
    profileComplete: false,
  };
}

export function initializeWithProfile(
  session: PlanSession,
  profile: ClientProfileV2
): PlanSession {
  const candidates = filterByProfile(profile);

  // Smart pre-fill: auto-answer questions we can derive from profile data
  const preFilledAnswers = preAnswerFromProfile(profile, candidates);

  // Run initial evaluation with pre-filled answers to auto-qualify/disqualify
  const qualifiedIds: string[] = [];
  const disqualifiedIds: string[] = [];

  for (const strategy of candidates) {
    const result = evaluateStrategy(strategy, preFilledAnswers);
    if (result.disqualifiedBy) {
      disqualifiedIds.push(strategy.id);
    } else if (result.qualified) {
      qualifiedIds.push(strategy.id);
    }
  }

  // Check if there are still questions to ask (including optional/amount questions)
  const hasMoreQuestions = getNextQuestion(candidates, qualifiedIds, disqualifiedIds, preFilledAnswers) !== null;

  return {
    ...session,
    profile,
    phase: hasMoreQuestions ? 'qualifying' : 'ready',
    candidates,
    qualifiedIds,
    disqualifiedIds,
    answers: preFilledAnswers,
    profileComplete: true,
  };
}

// ---------------------------------------------------------------------------
// Get Session Summary (for UI display)
// ---------------------------------------------------------------------------

export function getSessionSummary(session: PlanSession) {
  return {
    totalCandidates: session.candidates.length,
    qualified: session.qualifiedIds.length,
    disqualified: session.disqualifiedIds.length,
    remaining: session.candidates.length - session.qualifiedIds.length - session.disqualifiedIds.length,
    isReady: session.phase === 'ready',
    qualifiedStrategies: session.candidates.filter(s => session.qualifiedIds.includes(s.id)),
    canGenerate: session.qualifiedIds.length >= 1 && session.profileComplete,
  };
}

// ---------------------------------------------------------------------------
// Profile Questions (Phase 1)
// ---------------------------------------------------------------------------

export const PROFILE_QUESTIONS = [
  {
    id: 'profile-entity-type',
    question: 'What type of tax return are we working on?',
    helpText: 'This determines which strategies apply to you.',
    type: 'choice' as const,
    choices: ['Individual (1040)', 'Sole Proprietor (Schedule C)', 'S-Corporation (1120-S)', 'C-Corporation (1120)', 'Partnership (1065)'],
  },
  {
    id: 'profile-filing-status',
    question: 'What is your filing status?',
    helpText: 'Filing status affects standard deduction, tax brackets, and strategy eligibility.',
    type: 'choice' as const,
    choices: ['Single', 'Married Filing Jointly', 'Married Filing Separately', 'Head of Household'],
  },
  {
    id: 'profile-income',
    question: 'What is your approximate annual income?',
    helpText: 'Income level determines which strategies and credits apply.',
    type: 'choice' as const,
    choices: ['Under $50K', '$50K - $100K', '$100K - $200K', '$200K - $400K', '$400K - $600K', '$600K+'],
  },
  {
    id: 'profile-dependents',
    question: 'How many dependents do you have?',
    helpText: 'Dependents unlock child tax credits, dependent care credits, and education strategies.',
    type: 'choice' as const,
    choices: ['None', '1', '2', '3', '4+'],
  },
  {
    id: 'profile-age',
    question: 'What is your age range?',
    helpText: 'Age affects retirement contribution limits, catch-up provisions, and certain credits.',
    type: 'choice' as const,
    choices: ['Under 30', '30-39', '40-49', '50-59', '60-64', '65+'],
  },
  {
    id: 'profile-state',
    question: 'What state do you live in?',
    helpText: 'State of residence affects state-specific strategies and deductions.',
    type: 'text' as const,
  },
];

// Parse profile answers into ClientProfileV2
export function parseProfileAnswers(answers: Record<string, string>): ClientProfileV2 | null {
  const entityRaw = answers['profile-entity-type'] || '';
  const filingRaw = answers['profile-filing-status'] || '';
  const incomeRaw = answers['profile-income'] || '';
  const depsRaw = answers['profile-dependents'] || '';
  const ageRaw = answers['profile-age'] || '';
  const stateRaw = answers['profile-state'] || '';

  if (!entityRaw || !filingRaw || !incomeRaw) return null;

  // Map entity type
  const entityMap: Record<string, EntityType> = {
    'individual (1040)': 'individual',
    'sole proprietor (schedule c)': 'sole_prop',
    's-corporation (1120-s)': 's_corp',
    'c-corporation (1120)': 'c_corp',
    'partnership (1065)': 'partnership',
  };
  const entityType = entityMap[entityRaw.toLowerCase()] || 'individual';

  // Map filing status
  const filingMap: Record<string, FilingStatus> = {
    'single': 'single',
    'married filing jointly': 'married_jointly',
    'married filing separately': 'married_separately',
    'head of household': 'head_of_household',
  };
  const filingStatus = filingMap[filingRaw.toLowerCase()] || 'single';

  // Parse income
  const incomeMap: Record<string, number> = {
    'under $50k': 40000,
    '$50k - $100k': 75000,
    '$100k - $200k': 150000,
    '$200k - $400k': 300000,
    '$400k - $600k': 500000,
    '$600k+': 750000,
  };
  const annualIncome = incomeMap[incomeRaw.toLowerCase()] || 100000;

  // Parse dependents
  const depMap: Record<string, number> = { 'none': 0, '1': 1, '2': 2, '3': 3, '4+': 4 };
  const dependents = depMap[depsRaw.toLowerCase()] || 0;

  // Parse age
  const ageMap: Record<string, number> = {
    'under 30': 28, '30-39': 35, '40-49': 45, '50-59': 55, '60-64': 62, '65+': 68,
  };
  const age = ageMap[ageRaw.toLowerCase()] || 40;

  const hasBusiness = entityType !== 'individual';

  return {
    entityType,
    filingStatus,
    annualIncome,
    dependents,
    state: stateRaw || 'Unknown',
    hasBusinessIncome: hasBusiness,
    age,
  };
}

// Re-export types for convenience
export type { StrategyQualification, QualificationQuestion, EntityType, FilingStatus } from './strategy-database';
