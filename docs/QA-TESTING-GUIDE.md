# AG FinTax Smart Plan — QA Testing Guide

## Prerequisites
- Access to the staging/dev environment
- Sample tax documents (W-2 PDFs, 1099 PDFs, 1040 PDFs)
- At least 2 W-2s for MFJ testing (e.g., one for each spouse)
- At least 1 brokerage statement (Fidelity, Robinhood, etc.)

---

## Test Flow 1: Profile Builder — Document Upload

### 1.1 First-Time Upload (Single W-2)
1. Navigate to `/dashboard/profile`
2. Verify you see **3 steps**: Upload Docs → Review Profile → Goals
3. Drop a single W-2 PDF into the upload zone
4. **Verify:**
   - Loading spinner shows "Analyzing your documents..."
   - After processing, green checkmark shows "Documents analyzed & profile updated!"
   - **Document Summary** section appears with a readable paragraph summary
   - **Key Financial Summary** grid shows only meaningful values (NO "Unknown", NO "$0.00")
   - **Suggestions** section shows actionable recommendations
   - **Analyzed Documents** section shows the W-2 with summary and key findings
5. Click **Next** → verify "Review Profile" step shows fields auto-filled from the W-2:
   - Filing status, state, income, dependents (if detectable from W-2)
   - Financial flags toggled on (e.g., Retirement accounts, Health insurance)

### 1.2 Multi-File Upload (MFJ — 2 W-2s)
1. Go back to Upload step
2. Drop 2 W-2 PDFs at once (one per spouse)
3. **Verify:**
   - Both files process sequentially
   - Document Summary reflects BOTH W-2s (combined wages, both employers mentioned)
   - Key Financial Summary shows combined withholding
   - Analyzed Documents section shows 2 entries
   - Profile fields updated (income should reflect primary W-2, filing status if detectable)

### 1.3 Upload Additional Document Types (1099, Brokerage Statement)
1. Upload a brokerage 1099 (e.g., Robinhood, Fidelity)
2. **Verify:**
   - Document type auto-detected from filename (e.g., "Robinhood_1099.pdf" → 1099-NEC)
   - Previous W-2 data is NOT lost or overwritten
   - Key Financial Summary does NOT show $0.00 fields from the 1099
   - No PII displayed (no TIN, SSN, address, account numbers)
   - Investment flags toggled on in profile
   - Analyzed Documents now shows 3+ entries

### 1.4 Duplicate Upload
1. Re-upload the same W-2 file (same filename)
2. **Verify:**
   - Old entry is REPLACED, not duplicated
   - Document count stays the same
   - Console log shows "Replaced existing..."

### 1.5 Re-Analyze Button
1. After uploading multiple documents, click **Re-Analyze** button (next to "Document Summary")
2. **Verify:**
   - Button shows spinner "Analyzing..."
   - New summary is HOLISTIC — mentions ALL documents (W-2s + 1099s)
   - Previous document context is preserved (not lost)
   - Summary renders as formatted markdown (headers, bold, bullet lists)
   - If LLM detects income discrepancy, profile fields get auto-corrected
   - Profile auto-saves after re-analysis

---

## Test Flow 2: Profile Review & Save

### 2.1 Review Profile Step
1. Navigate to Step 2 (Review Profile)
2. **Verify:**
   - Entity Type selector shows all options (Individual, S-Corp, C-Corp, Partnership, Sole Prop, Non-Profit)
   - Personal Info fields pre-filled from OCR (occupation, filing status, state, dependents)
   - Annual Income pre-filled
   - Income Sources pills reflect document types (W-2, Capital Gains, Dividends, etc.)
   - Financial Situation toggles reflect what OCR detected
   - All fields are editable

### 2.2 Goals Step
1. Navigate to Step 3 (Goals)
2. Set a tax savings target and select planning priorities
3. Click **Save Profile**
4. **Verify:** Green "Saved" confirmation appears

### 2.3 Profile Persistence
1. Navigate away from profile (e.g., go to Dashboard)
2. Come back to `/dashboard/profile`
3. **Verify:** All data persists — uploaded documents, summary, extracted fields, manual edits

---

## Test Flow 3: Smart Plan — Strategy Generation

### 3.1 Navigate to Smart Plan
1. Go to `/dashboard/smart-plan`
2. **Verify:**
   - Entity type auto-selected (Individual if that's what profile has)
   - "Profile Ready" card shows with correct pills (income, filing status, state, dependents, flags)
   - LLM summary loads (shows "Reviewing your profile..." then a 2-3 sentence summary)
   - Summary references ACTUAL dollar amounts from your documents
   - Missing areas hint shows if profile has gaps

### 3.2 Strategy Sidebar
1. Check the strategy sidebar (left panel on desktop, bottom sheet on mobile)
2. **Verify for Individual entity:**
   - **19 strategies total** (NOT 23)
   - Categories: Retirement Planning (4), Compensation (2), Charity (4), Education (1), Investable Gains (1), Credits (2), Advanced (5)
   - "Already Qualified from Your Profile" section shows strategies auto-qualified from profile data
   - If profile has dependents > 0 + MFJ: Child Tax Credit should be auto-qualified
   - If profile has retirement accounts: Roth Conversion should be auto-qualified

### 3.3 Strategy Overview Generation
1. Click **"Start Smart Plan"** or equivalent
2. **Verify:**
   - Strategy overview generates showing: Already Qualified, Needs Verification, and Not Applicable categories
   - Dollar savings ranges shown for each strategy
   - IRC section references included
   - Strategies reference YOUR actual profile data (income, dependents, state)
   - NO mention of "AI", "LLM", "machine learning", "GPT" — only "AG FinTax", "our team", "we"

### 3.4 Qualification Questions
1. Click "Yes, let's proceed" to start verification questions
2. **Verify:**
   - Questions asked ONE at a time
   - Strategy name shown as bold heading with (Question X/Y) progress
   - Suggestion buttons appear below each question (Yes/No/Not sure for yes_no, specific choices for choice questions)
   - Questions reference your actual numbers ("At your $319K income...")
   - After answering all questions, summary shows total qualified strategies

### 3.5 Plan Generation
1. After qualification, confirm to build the plan
2. **Verify:**
   - Plan generates with savings breakdown per strategy
   - Total savings shown (NO double-counting — should NOT multiply by 0.32 again)
   - Plan can be downloaded as PDF
   - PDF shows correct totals and "Total Est. Tax Savings" (not "Est. Tax Reduction (32%)")

---

## Test Flow 4: Dashboard

### 4.1 Dashboard Home
1. Navigate to `/dashboard`
2. **Verify:**
   - "Est. Tax Savings" card shows correct range (e.g., "$8,500 - $15,200")
   - NOT a single number multiplied by 0.32
   - Strategy count matches what was qualified
   - Quick actions show 3 items (not 6)
   - No "AI" text anywhere — should say "AG FinTax", "Ask AG", etc.

### 4.2 Onboarding Steps
1. If onboarding is visible, check step links:
   - "Build Your Profile" → `/dashboard/profile`
   - "Review Strategies" → `/dashboard/smart-plan` (NOT `/dashboard/strategies`)
   - "View Savings" → `/dashboard/savings`

---

## Test Flow 5: Branding Verification

### 5.1 Global AI Text Removal
Check these pages for ANY remaining "AI", "LLM", "GPT", "machine learning", "neural network" text visible to users:

| Page | What to check |
|------|---------------|
| `/` (Landing) | Hero, features, pricing, chatbot, footer |
| `/about` | Team section, testimonials, technology description |
| `/dashboard` | Stats cards, quick actions, onboarding |
| `/dashboard/smart-plan` | Strategy overview, question prompts, plan results |
| `/dashboard/tax-chat` | Input placeholder, header, disclaimer |
| `/dashboard/profile` | Upload instructions, summary, suggestions |
| Sidebar | Navigation labels, upgrade prompt |
| Header | Page titles, subtitles |

### 5.2 LLM Response Branding
1. Use Tax Chat (`/dashboard/tax-chat`) and ask a question
2. **Verify:** Response uses "we", "our team", "AG FinTax" — never "I as an AI" or "as an AI assistant"
3. Run Smart Plan qualification
4. **Verify:** Question prompts sound like a CPA in a meeting, no AI references

---

## Test Flow 6: Edge Cases

### 6.1 No Documents — Manual Profile
1. Clear localStorage (or use incognito)
2. Go to `/dashboard/profile`
3. Skip upload step → fill in all fields manually
4. Save → go to Smart Plan
5. **Verify:** Smart Plan works with manually entered data

### 6.2 Single Document — Incomplete Profile
1. Upload only 1 W-2 (no 1040)
2. **Verify:**
   - Profile shows what it can extract (income, state, employer)
   - Many fields show as empty (not "Unknown")
   - Smart Plan asks verification questions for strategies it can't auto-qualify

### 6.3 Different Entity Types
1. Change entity type to S-Corp, C-Corp, Partnership
2. **Verify:**
   - Strategy sidebar updates to show strategies for that entity
   - Strategy count changes appropriately
   - Profile analysis updates

---

## Known Behaviors

- **$319K vs $322K income discrepancy**: If W-2s were uploaded individually, the first W-2's income becomes `annualIncome`. Use Re-Analyze to correct the total.
- **Re-Analyze required after new uploads**: Uploading new docs updates per-document data but the holistic summary needs Re-Analyze to incorporate everything.
- **localStorage-based**: All profile data is stored in browser localStorage. Clearing browser data resets the profile.
- **Demo mode**: If `OPENROUTER_API_KEY` is not set, AI features return demo responses.
