# Qualification Engine Architecture & Test Plan

## The Problem

The current system suggests ALL strategies regardless of eligibility. A W-2 employee
sees Augusta Rule and S-Corp Election. The client said: **"It's giving all wrong strategies."**

## The Rule

**No strategy is suggested unless the client qualifies for it.**

More questions is fine. The system should ask as many questions as needed. But until those
questions are answered, the strategy MUST NOT appear in the generated plan.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    USER ENTRY POINTS                     │
│                                                          │
│   1. Entity Select (Individual 1040 = default)           │
│   2. Choose: Chat / Voice / Voice Interview              │
└──────────────┬──────────────────────────────┬────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────┐     ┌──────────────────────────┐
│   CHAT / VOICE MODE  │     │  VOICE INTERVIEW MODE    │
│                      │     │  (structured Q&A)        │
│  AI has natural      │     │  Pre-built question      │
│  conversation but    │     │  sections with voice     │
│  every answer feeds  │     │  answers                 │
│  into the engine     │     │                          │
└──────────┬───────────┘     └──────────┬───────────────┘
           │                            │
           ▼                            ▼
┌─────────────────────────────────────────────────────────┐
│              QUALIFICATION ENGINE V2                      │
│                                                          │
│  Phase 1: PROFILE GATES                                  │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Input: entity type, filing status, income,      │    │
│  │        dependents, age, state                    │    │
│  │                                                  │    │
│  │ Action: filterByProfile() narrows 62 strategies  │    │
│  │         down to ~10-20 candidates                │    │
│  │                                                  │    │
│  │ Example: Individual, $100K, Single               │    │
│  │   → Removes: S-Corp strategies, C-Corp,         │    │
│  │     Partnership, high-income-only strategies     │    │
│  │   → Keeps: ~15 individual strategies             │    │
│  └─────────────────────────────────────────────────┘    │
│                          │                               │
│                          ▼                               │
│  Phase 2: PER-STRATEGY QUALIFICATION                     │
│  ┌─────────────────────────────────────────────────┐    │
│  │ For each candidate strategy, ask its specific   │    │
│  │ qualification questions:                         │    │
│  │                                                  │    │
│  │ Example: Child Tax Credit (§24)                  │    │
│  │   Q: "Do you have children under 17?"            │    │
│  │   disqualifyOn: "no"                             │    │
│  │   → User says "no" → DISQUALIFIED               │    │
│  │   → User says "yes" → Ask next Q                │    │
│  │   → All Qs pass → QUALIFIED ✓                   │    │
│  │                                                  │    │
│  │ Example: Home Office Deduction                   │    │
│  │   Q: "Do you use a dedicated space at home       │    │
│  │       exclusively for business?"                 │    │
│  │   disqualifyOn: "no"                             │    │
│  │   → User says "no" → DISQUALIFIED               │    │
│  │                                                  │    │
│  │ Strategies sorted by highest savings first.      │    │
│  │ Engine asks required questions one at a time.    │    │
│  └─────────────────────────────────────────────────┘    │
│                          │                               │
│                          ▼                               │
│  Output: qualifiedIds[] — ONLY these go to plan          │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   GENERATE BUTTON                        │
│                                                          │
│  LOCKED until qualifiedIds.length >= 1                   │
│                                                          │
│  Shows: "Generate Plan (X qualified strategies)"         │
│                                                          │
│  When clicked → sends ONLY qualified strategies          │
│  to /api/smart-plan for AI personalization               │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   PLAN RESULTS                           │
│                                                          │
│  ONLY shows strategies the client qualified for.         │
│  Each strategy has personalized savings calculation.     │
│  No Augusta Rule for W-2 employees.                      │
│  No S-Corp Election for salaried workers.                │
│  No Child Tax Credit for people without kids.            │
└─────────────────────────────────────────────────────────┘
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/tax/strategy-database.ts` | 62 strategies with qualification questions & `disqualifyOn` gates |
| `src/lib/tax/qualification-engine-v2.ts` | Two-phase engine: `filterByProfile()` → `evaluateStrategy()` → `getNextQuestion()` → `processAnswer()` |
| `src/lib/ai/tax-system-prompt.ts` | AI prompts for qualification flow (`buildQualificationPrompt`, `buildProfilePrompt`) |
| `src/lib/tax/smart-plan-engine.ts` | Re-exports engine + legacy backward compat |
| `src/app/dashboard/smart-plan/page.tsx` | The UI — needs to wire qualification engine into chat/voice flow |
| `src/app/api/smart-plan/route.ts` | API that takes qualified strategies + profile → AI personalizes savings |

---

## How disqualifyOn Works

Each strategy has qualification questions. Each question can have a `disqualifyOn` field:

```typescript
{
  id: "child_tax_credit",
  title: "Child Tax Credit",
  qualificationQuestions: [
    {
      id: "ctc_has_children",
      question: "Do you have children under 17?",
      type: "yes_no",
      required: true,
      disqualifyOn: "no"        // ← If user says "no", strategy is eliminated
    },
    {
      id: "ctc_income_check",
      question: "Is your AGI under $200,000 (single) or $400,000 (MFJ)?",
      type: "yes_no",
      required: true,
      disqualifyOn: "no"        // ← If over income limit, eliminated
    }
  ]
}
```

The engine asks required questions one at a time. The moment a `disqualifyOn` answer
matches, the strategy is immediately eliminated and the engine moves to the next candidate.

---

## Chat UX Flow (Simplified)

The chat should feel like a **natural CPA intake conversation**, not a form.

```
1. AI: "Hi! I'm your AG FinTax planning advisor. Let's find the best
        tax strategies for you. First, what's your approximate annual income?"
        [SUGGESTIONS: Under $50K | $50K-$100K | $100K-$200K | $200K-$400K | $400K+]

2. User: "$150K"

3. AI: "Great. And your filing status?"
        [SUGGESTIONS: Single | Married Filing Jointly | Head of Household]

4. User: "Married filing jointly"

5. AI: "Got it. Do you have any children under 17?"
        [SUGGESTIONS: Yes | No]

6. User: "Yes, 2 kids"

   → Engine: Profile complete enough. filterByProfile() → 15 candidates
   → Engine: Child Tax Credit question answered "yes" → QUALIFIED ✓
   → Engine: Next highest-savings strategy question...

7. AI: "Thanks! Do you contribute to a 401(k) or IRA?"
        [SUGGESTIONS: Yes, 401(k) | Yes, IRA | Both | Neither]

8. User: "Yes, 401(k)"

   → Engine: Retirement strategies → QUALIFIED ✓
   → Engine: Next question...

9. AI: "Do you use a dedicated space at home exclusively for business?"
        [SUGGESTIONS: Yes | No]

10. User: "No"

    → Engine: Home Office Deduction → DISQUALIFIED ✗
    → Engine: Next question...

... continues until enough strategies resolved ...

11. AI: "I've identified 6 strategies that apply to your situation.
         Ready to build your personalized plan?"
         [SUGGESTIONS: Yes, let's go | I want to add more details]

12. User: "Yes"

    → Generate button activates
    → ONLY those 6 qualified strategies sent to API
    → Plan shows ONLY relevant strategies
```

---

## What the Generate Button Does

**BEFORE (broken):**
- Available immediately after 1 user message
- Sends ALL strategies from `getApplicableStrategies()` (loose keyword matching)
- Result: Augusta Rule for W-2 employees, S-Corp for salaried workers

**AFTER (correct):**
- LOCKED until `qualifiedIds.length >= 1`
- Shows count: "Generate Plan (6 qualified strategies)"
- Sends ONLY strategies from `qualSession.qualifiedIds`
- Result: Only strategies the client actually qualifies for

---

## Test Plan

### Test 1: W-2 Employee — Should NOT See Business Strategies

**Steps:**
1. Go to `/dashboard/smart-plan`
2. Select "Individual (1040)"
3. Start chat
4. Answer: Income $100K, Single, no kids, no business, no real estate
5. Complete qualification questions
6. Click Generate

**Expected:**
- Should see: Standard Deduction optimization, 401(k)/IRA, HSA (if eligible)
- Should NOT see: Augusta Rule, S-Corp Election, Home Office, Reasonable Compensation
- Should NOT see: Any business-tier strategies

**How to verify:**
- Open browser console (F12)
- Look for `=== QUALIFIED PLAN GENERATION ===` log
- Check `Qualified strategies:` list — no business strategies should appear

---

### Test 2: Parent with Kids — Should See Child Tax Credit

**Steps:**
1. Select "Individual (1040)"
2. Start chat
3. Answer: Income $120K, Married Filing Jointly, 2 kids under 17
4. When asked "Do you have children under 17?" → answer "Yes"

**Expected:**
- Child Tax Credit should be QUALIFIED
- Estimated savings: ~$4,000 ($2,000 × 2 kids)

**How to verify:**
- Check console: `qualifiedIds` should include `child_tax_credit`

---

### Test 3: No Kids — Child Tax Credit Should Be ELIMINATED

**Steps:**
1. Select "Individual (1040)"
2. Start chat
3. Answer: Income $120K, Single, 0 dependents
4. When asked about children → answer "No"

**Expected:**
- Child Tax Credit should be DISQUALIFIED
- Should NOT appear in generated plan

**How to verify:**
- Console: `disqualifiedIds` should include `child_tax_credit`
- Generated plan should have no Child Tax Credit

---

### Test 4: High Income — Should See Different Strategies

**Steps:**
1. Select "Individual (1040)"
2. Start chat
3. Answer: Income $500K, Married Filing Jointly

**Expected:**
- Should see high-income strategies (Backdoor Roth, Tax-Loss Harvesting, etc.)
- Should NOT see strategies with income caps below $500K
- filterByProfile should eliminate low-income-only strategies

---

### Test 5: S-Corp Owner — Should See Business Strategies

**Steps:**
1. Select "S-Corporation (1120-S)"
2. Start chat
3. Answer: Income $300K, business income, no kids

**Expected:**
- Should see: Reasonable Compensation, Accountable Plan, Augusta Rule, QBI
- Should NOT see: Individual-only strategies that don't apply to S-Corp

---

### Test 6: Generate Button Stays Locked

**Steps:**
1. Select "Individual (1040)"
2. Start chat
3. Send only 1 message: "Hi"
4. Look at Generate button

**Expected:**
- Generate button should be DISABLED or show "0 strategies qualified"
- Should NOT be able to generate a plan with 0 qualified strategies

---

### Test 7: disqualifyOn Actually Eliminates

**Steps:**
1. Start chat as Individual, $100K
2. When asked about home office → answer "No"
3. When asked about rental property → answer "No"
4. When asked about charitable giving over standard deduction → answer "No"

**Expected:**
- Home Office Deduction → DISQUALIFIED
- Rental Property strategies → DISQUALIFIED
- Charitable strategies → DISQUALIFIED
- These should NOT appear in final plan

**How to verify in console:**
```javascript
// In browser console after answering questions:
// Look for these logs:
// "disqualifiedIds: [home_office_deduction, rental_property_income, ...]"
```

---

### Test 8: Voice Mode — Same Qualification Rules Apply

**Steps:**
1. Select Individual
2. Choose Voice mode
3. Speak: "I'm a software engineer making $150K, married, two kids, no business"
4. AI should parse this and start qualification questions
5. Generate plan

**Expected:**
- Same qualification rules as chat
- Only qualified strategies in final plan

---

### Quick Console Debugging

After any chat interaction, open browser console (F12) and look for:

```
=== QUALIFIED PLAN GENERATION ===
Qualified strategies: 6 ["Child Tax Credit", "401(k) Maximization", ...]
Profile: individual, $150000, married_jointly
```

If you see `=== SMART PLAN GENERATION STARTED ===` instead, the OLD flow is running
(using `getApplicableStrategies` with loose matching). That's the bug.

---

## Engine Functions Quick Reference

```typescript
// Create a fresh session
const session = createSession();

// After collecting profile (entity, income, filing, dependents, age, state)
const profile: ClientProfileV2 = parseProfileAnswers(answers);
const session2 = initializeWithProfile(session, profile);
// session2.candidates = ~15 strategies (filtered from 62)

// Get next question to ask
const nextQ = getNextQuestion(candidates, qualifiedIds, disqualifiedIds, answers);
// Returns: { strategy, question } or null if all done

// Process user's answer
const session3 = processAnswer(session2, questionId, userAnswer);
// Automatically qualifies or disqualifies strategies

// Check progress
const summary = getSessionSummary(session3);
// { qualified: 6, disqualified: 8, remaining: 1, isReady: true, qualifiedStrategies: [...] }
```

---

## Summary

| Before | After |
|--------|-------|
| Suggests all strategies | Only qualified strategies |
| Loose keyword matching | Per-strategy qualification questions |
| Generate fires immediately | Generate locked until qualified |
| W-2 sees Augusta Rule | W-2 only sees W-2 strategies |
| No disqualification | `disqualifyOn` eliminates wrong strategies |
| ~15-20 strategies per plan | ~5-8 truly relevant strategies |
