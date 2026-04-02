# AgFinTax Planning AI — Full Architecture & Technical Document

**Version**: 2.0 | **Last Updated**: March 2026
**Client**: AG FinTax (Anil Grandhi) | **Built by**: LoukriAI.com

---

## 1. System Overview

AgFinTax Planning AI is an AI-powered tax planning platform that helps clients build financial profiles, upload tax documents for automated extraction, receive personalized tax strategies, and interact with an intelligent tax advisor through chat and voice interfaces.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                               │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ Landing  │  │Dashboard │  │ AI Chat  │  │  Smart   │           │
│  │  Page    │  │  Hub     │  │ (TaxGPT) │  │  Plan    │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ Profile  │  │Documents │  │Strategies│  │ Savings  │           │
│  │ Builder  │  │ Manager  │  │ Library  │  │Dashboard │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              HOOKS & CLIENT-SIDE ENGINES                     │   │
│  │  use-chat.ts │ use-voice-conversation.ts │ plan-store.ts    │   │
│  │  smart-plan-engine.ts │ savings-calculator.ts               │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     NEXT.JS APP ROUTER (API LAYER)                  │
│                                                                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐      │
│  │ /api/chat  │ │/api/smart- │ │/api/profile│ │/api/docs/  │      │
│  │ (streaming)│ │  plan      │ │   -ocr     │ │  process   │      │
│  └─────┬──────┘ └─────┬──────┘ └──┬───┬─────┘ └──┬───┬─────┘      │
│  ┌─────┴──────┐ ┌─────┴──────┐    │   │          │   │            │
│  │ /api/tts   │ │/api/trans- │    │   │          │   │            │
│  │ (speech)   │ │  cribe     │    │   │          │   │            │
│  └─────┬──────┘ └─────┬──────┘    │   │          │   │            │
└────────┼──────────────┼───────────┼───┼──────────┼───┼────────────┘
         │              │           │   │          │   │
         ▼              ▼           │   ▼          │   ▼
┌─────────────┐ ┌─────────────┐    │ ┌──────────┐ │ ┌──────────┐
│   OpenAI    │ │   OpenAI    │    │ │OpenRouter│ │ │OpenRouter│
│  TTS API    │ │ Whisper API │    │ │(Claude/  │ │ │(Claude/  │
│  (tts-1)    │ │ (whisper-1) │    │ │  GPT)    │ │ │  GPT)    │
└─────────────┘ └─────────────┘    │ └──────────┘ │ └──────────┘
                                   ▼               ▼
                           ┌──────────────────────────┐
                           │   Azure Document         │
                           │   Intelligence (OCR)     │
                           │   Prebuilt Tax Models     │
                           └──────────────────────────┘

┌──────────────┐    ┌──────────────┐
│    Clerk     │    │   Supabase   │
│  (Auth/SSO)  │    │ (PostgreSQL) │
└──────────────┘    └──────────────┘
```

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16 (App Router) | Server/client rendering, API routes |
| **Language** | TypeScript 5 (strict) | Type safety across full stack |
| **UI** | React 19 + Tailwind CSS v4 + shadcn/ui | Component library, dark theme |
| **Animation** | Framer Motion | Page transitions, voice waveforms |
| **Charts** | Recharts | Tax savings visualizations |
| **Auth** | Clerk (@clerk/nextjs) | SSO, user management, route protection |
| **Database** | Supabase (PostgreSQL) | Plans, documents, profiles (+ localStorage) |
| **AI Routing** | OpenRouter | Multi-model LLM access (Claude, GPT) |
| **OCR** | Azure Document Intelligence | Tax form extraction (W-2, 1099, etc.) |
| **Speech** | OpenAI Whisper + TTS | Voice interview (STT + TTS) |
| **Deployment** | Vercel | Serverless, edge-optimized |

---

## 3. External Services & API Keys

| Service | Env Variable | Used For |
|---------|-------------|----------|
| **OpenRouter** | `OPENROUTER_API_KEY` | All LLM reasoning (chat, plan generation, document analysis, answer interpretation) |
| **OpenAI** | `OPENAI_API_KEY` | Whisper transcription (STT) + TTS voice generation |
| **Azure Doc Intelligence** | `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT`, `AZURE_DOCUMENT_INTELLIGENCE_KEY` | OCR for tax documents (prebuilt W-2, 1099, 1098 models + layout fallback) |
| **Clerk** | `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_*` | Authentication, session management |
| **Supabase** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Database persistence |

---

## 4. Application Routes & Pages

### Public Routes
| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Marketing page — features, pricing, testimonials |
| `/about` | About | AG FinTax company info, Anil Grandhi bio, services |
| `/sign-in` | Auth | Clerk sign-in (redirects to /dashboard) |
| `/sign-up` | Auth | Clerk sign-up (redirects to /dashboard) |

### Protected Routes (require Clerk auth via middleware)
| Route | Page | AI Features Used |
|-------|------|-----------------|
| `/dashboard` | Hub | Entity-type-specific guidance, quick actions |
| `/dashboard/profile` | Profile Builder | OCR document upload (Azure), voice input (Web Speech API) |
| `/dashboard/smart-plan` | AI Tax Planner | Chat (OpenRouter), voice interview (Whisper + TTS), plan generation (OpenRouter) |
| `/dashboard/tax-chat` | TaxGPT Chat | Streaming chat (OpenRouter), document upload + classification (Azure + OpenRouter) |
| `/dashboard/documents` | Doc Manager | Upload, OCR processing (Azure), classification (OpenRouter) |
| `/dashboard/strategies` | Strategy Library | 46 curated strategies, entity-type filtering |
| `/dashboard/savings` | Savings Dashboard | Tax bracket calculator, savings charts (Recharts) |
| `/dashboard/tax-review` | Return Review | Red/green flag analysis (demo mode) |
| `/dashboard/settings` | Settings | Notifications, integrations (placeholder) |

---

## 5. API Routes — Complete Reference

### 5.1 `/api/chat` — AI Tax Chat (Streaming)

```
POST /api/chat
├── Input:  { messages: Message[], maxTokens?: number }
├── AI:     OpenRouter → Claude Sonnet 4 → Claude 3.5 Sonnet → GPT-4o Mini (fallback chain)
├── System: TAX_SYSTEM_PROMPT (2025 tax law, OBBBA changes, 12 expertise areas)
├── Output: Streaming text/event-stream
└── Used by: Tax Chat page, Smart Plan chat, Voice interview (answer interpretation)
```

**How LLM is used**: The tax system prompt injects deep knowledge of 2025 tax law (brackets, standard deductions, SALT cap, QBI, bonus depreciation, HSA limits, etc.). Every user message is processed with this context so the AI acts as a knowledgeable tax advisor. Responses stream in real-time for a conversational feel.

### 5.2 `/api/smart-plan` — Personalized Tax Plan Generation

```
POST /api/smart-plan
├── Input:  { profile: SmartPlanProfile, referenceStrategyData: ReferenceStrategy[] }
├── AI:     OpenRouter → Claude Sonnet 4 (primary)
├── System: TAX_SYSTEM_PROMPT + Entity-specific strategy focus prompts
├── Output: JSON { totalEstimatedSavings, strategies[] }
└── Used by: Smart Plan page (after chat/voice interview completion)
```

**How LLM is used**: The qualification engine first filters the 46-strategy library down to applicable strategies based on the client's entity type, income, and financial situation. These pre-matched strategies are sent to the LLM along with the client profile. The LLM then:
1. Calculates **actual estimated savings** for each strategy using the client's specific income and marginal rate
2. Writes **personalized descriptions** referencing the client's situation
3. Generates **implementation steps** tailored to the client
4. Sorts by savings potential and excludes strategies that don't truly apply

**Critical constraint**: The LLM is restricted to ONLY the pre-matched strategies from the curated library — it cannot invent new ones. This ensures compliance review integrity.

### 5.3 `/api/profile-ocr` — Document OCR for Profile Building

```
POST /api/profile-ocr
├── Input:  FormData { file, entityType, documentType }
├── AI:     Azure Document Intelligence (OCR) → OpenRouter (field extraction)
├── Models: Azure prebuilt:w2, prebuilt:invoice, prebuilt:receipt + layout fallback
├── Output: { extractedFields, summary, keyFindings, profileSuggestions }
└── Used by: Profile Builder page (tax return upload step)
```

**How LLM is used** (two-stage pipeline):
1. **Stage 1 — Azure OCR**: The document is sent to Azure Document Intelligence. For known form types (W-2, 1099, 1098), specialized prebuilt models extract structured fields. For tax returns (1040, 1120, etc.), the layout model extracts text.
2. **Stage 2 — LLM Analysis**: The extracted text is sent to OpenRouter with a prompt to identify tax-relevant fields: income, filing status, deductions, schedules present, credits used, state tax, etc. The LLM returns structured JSON that maps directly to the ClientProfile interface.

### 5.4 `/api/documents/process` — Document Classification & Processing

```
POST /api/documents/process
├── Input:  FormData { file, documentId, documentType }
├── AI:     Azure Document Intelligence → OpenRouter (classification)
├── Output: { documentType, confidence, extractedText, classifiedAs }
└── Used by: Tax Chat page (in-chat doc upload), Documents page
```

**How LLM is used**: After Azure OCR extracts text, the document classifier (`document-classifier.ts`) sends the first 4,000 characters to GPT-4o via OpenRouter. The LLM classifies the document into types (W-2, 1099-NEC, 1040, K-1, bank statement, etc.) with a confidence score, tax year, and brief description.

### 5.5 `/api/transcribe` — Voice-to-Text

```
POST /api/transcribe
├── Input:  FormData { audio: Blob (webm/opus) }
├── AI:     OpenAI Whisper (whisper-1)
├── Prompt: "Tax planning conversation. The speaker is describing their financial
│           situation including income, filing status, dependents, business type,
│           real estate, retirement plans, and other tax-relevant details."
├── Output: { text: string }
└── Used by: Smart Plan voice mode, Voice interview
```

**How LLM is used**: Whisper receives audio with a domain-specific prompt that biases transcription toward tax terminology (filing status, dependents, S-Corp, etc.), improving accuracy for financial vocabulary.

### 5.6 `/api/tts` — Text-to-Speech

```
POST /api/tts
├── Input:  { text: string, voice?: string }
├── AI:     OpenAI TTS (tts-1 model, "nova" voice)
├── Output: audio/mpeg blob
└── Used by: Voice interview (AI speaks questions)
```

**How LLM is used**: The AI-generated question text (from OpenRouter) is converted to natural speech using OpenAI's TTS model. The "nova" voice provides a warm, professional tone appropriate for tax advisory.

### 5.7 `/api/documents/upload` — File Upload

```
POST /api/documents/upload
├── Input:  FormData { file }
├── AI:     None (mock implementation)
├── Output: { documentId, name, size, type, status }
└── Status: Placeholder — Supabase storage integration planned
```

---

## 6. Feature-by-Feature LLM Usage Map

### Feature 1: AI Tax Chat (TaxGPT)
**Page**: `/dashboard/tax-chat`
**User Flow**: User types tax questions → AI responds with expert advice

```
User types question
    │
    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  use-chat.ts │────▶│  /api/chat   │────▶│  OpenRouter   │
│  (hook)      │◀────│  (streaming) │◀────│  Claude       │
└──────────────┘     └──────────────┘     │  Sonnet 4     │
                                          └──────────────┘
                                                │
                                    TAX_SYSTEM_PROMPT injected
                                    (2025 brackets, OBBBA, 12
                                     expertise areas, entity rules)
```

**LLM Role**: General-purpose tax advisor. Answers questions about deductions, entity selection, retirement planning, real estate strategies, etc. System prompt contains full 2025 tax law knowledge.

---

### Feature 2: Smart Plan Generator (Conversational)
**Page**: `/dashboard/smart-plan`
**User Flow**: Chat or voice interview → AI gathers info → generates personalized plan

```
┌─────────────────────────────────────────────────────────────┐
│                    SMART PLAN PIPELINE                       │
│                                                             │
│  ┌─────────┐   ┌─────────────┐   ┌──────────────────────┐  │
│  │  Chat   │   │ Intent      │   │ Strategy Matching    │  │
│  │  or     │──▶│ Detection   │──▶│ (46 strategies)      │  │
│  │  Voice  │   │ (18 intents)│   │ by entity + profile  │  │
│  └─────────┘   └─────────────┘   └──────────┬───────────┘  │
│                                              │              │
│  ┌─────────────────────┐   ┌─────────────────▼───────────┐  │
│  │  Personalized Plan  │◀──│  /api/smart-plan            │  │
│  │  with $ savings     │   │  LLM personalizes each      │  │
│  │  per strategy       │   │  strategy for THIS client   │  │
│  └─────────────────────┘   └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**LLM Touchpoints** (up to 4 per session):
1. **Chat responses** (`/api/chat`) — Conversational Q&A to gather profile info
2. **Voice transcription** (`/api/transcribe`) — Whisper converts speech to text
3. **Answer interpretation** (`/api/chat`) — LLM interprets voice responses ("yeah I think so" → "yes")
4. **Plan generation** (`/api/smart-plan`) — LLM personalizes strategy savings and descriptions

---

### Feature 3: Voice-Guided Interview
**Page**: `/dashboard/smart-plan` (voice interview mode)
**User Flow**: AI speaks questions → User answers by voice → AI processes → Next question

```
┌──────────────────────────────────────────────────────────────┐
│               VOICE INTERVIEW LOOP                            │
│                                                              │
│   ┌────────────┐    ┌────────────┐    ┌────────────┐        │
│   │ Question   │    │   OpenAI   │    │  Browser   │        │
│   │ Generator  │───▶│   TTS      │───▶│  Speaker   │        │
│   │ (LLM)     │    │  (nova)    │    │            │        │
│   └────────────┘    └────────────┘    └────────────┘        │
│         ▲                                    │               │
│         │                              User speaks           │
│         │                                    ▼               │
│   ┌────────────┐    ┌────────────┐    ┌────────────┐        │
│   │ Answer     │◀───│  Whisper   │◀───│ MediaRec   │        │
│   │Interpreter │    │  (STT)     │    │ + WebSpeech│        │
│   │  (LLM)    │    │            │    │  (preview) │        │
│   └─────┬──────┘    └────────────┘    └────────────┘        │
│         │                                                    │
│         ▼                                                    │
│   ┌────────────┐                                             │
│   │ Interview  │  Gap-filling mode: skips known profile      │
│   │   State    │  fields, asks only missing financial        │
│   │  Engine    │  details (5-8 questions max)                │
│   └────────────┘                                             │
└──────────────────────────────────────────────────────────────┘
```

**LLM Touchpoints per question** (3 calls):
1. **Question generation** (`/api/chat`) — Rephrases question naturally for speech, includes profile context
2. **TTS** (`/api/tts`) — Converts question text to audio
3. **Answer interpretation** (`/api/chat`) — Maps spoken response to structured answer

**Gap-filling intelligence**: When a client profile already exists, the qualification engine computes which financial details are missing and generates only 5-8 targeted questions instead of the full 35+ question interview.

---

### Feature 4: Profile Builder with Document OCR
**Page**: `/dashboard/profile`
**User Flow**: Upload tax return → AI extracts all fields → Review/edit → Save

```
┌─────────────────────────────────────────────────────────┐
│              DOCUMENT OCR PIPELINE                       │
│                                                         │
│  ┌──────────┐   ┌────────────────┐   ┌──────────────┐  │
│  │  Upload  │   │    Azure Doc   │   │  OpenRouter   │  │
│  │  PDF/    │──▶│  Intelligence  │──▶│  (Claude)     │  │
│  │  Image   │   │                │   │              │  │
│  └──────────┘   │  Prebuilt W-2  │   │  Extract:    │  │
│                 │  Prebuilt 1099 │   │  - Income    │  │
│                 │  Prebuilt 1098 │   │  - Filing    │  │
│                 │  Layout (1040) │   │  - Deductions│  │
│                 └────────────────┘   │  - Schedules │  │
│                                      │  - Credits   │  │
│                                      └──────┬───────┘  │
│                                             │          │
│                                             ▼          │
│                                   ┌──────────────────┐ │
│                                   │  Client Profile  │ │
│                                   │  (auto-filled)   │ │
│                                   └──────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**LLM Touchpoints** (2 per document):
1. **Azure OCR** — Extracts raw text/fields from document image
2. **LLM field extraction** (`OpenRouter`) — Maps raw OCR output to structured profile fields (income, filing status, state, deductions, retirement accounts, etc.)

**Multi-document merging**: Each uploaded document accumulates into the profile. Tax returns override core fields; supplementary docs (W-2, 1099, K-1) add detail. Arrays (income sources, retirement types, schedules) are merged.

---

### Feature 5: Document Management & Classification
**Page**: `/dashboard/documents`
**User Flow**: Upload any tax document → AI classifies and extracts data

**LLM Touchpoints** (2 per document):
1. **Azure OCR** — Text extraction
2. **GPT-4o classification** — Document type identification with confidence score

---

### Feature 6: Tax Savings Calculator
**Page**: `/dashboard/savings`
**User Flow**: View calculated savings based on profile

**LLM Touchpoints**: None — Pure computational engine using 2025 tax brackets and formulas. Calculates across 8 strategy categories: QBI deduction, S-Corp election savings, real estate depreciation, retirement contributions, HSA, tax-loss harvesting, SALT PTE workaround, Augusta Rule.

---

### Feature 7: Strategy Library
**Page**: `/dashboard/strategies`
**User Flow**: Browse 46 curated strategies, filter by entity type and category

**LLM Touchpoints**: None — Static strategy data from `smart-plan-strategies.ts` (aligned with Corvee 2024 Tax Strategies Masterclass). Each strategy includes IRC references, savings formulas, eligibility criteria, implementation steps, and tax filing details per entity type.

---

### Feature 8: Tax Return Review (Red/Green Flags)
**Page**: `/dashboard/tax-review`
**User Flow**: View compliance analysis with flags

**LLM Touchpoints**: Currently demo mode with hardcoded flags. Production version will use LLM to analyze uploaded returns against strategy library.

---

## 7. Data Architecture

### 7.1 Client-Side State (localStorage)

```
┌─────────────────────────────────────────────────┐
│               LOCAL STORAGE                      │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ ClientProfile                            │    │
│  │ ├── entityType (individual/s_corp/...)   │    │
│  │ ├── occupation, filingStatus, state      │    │
│  │ ├── annualIncome, dependents             │    │
│  │ ├── incomeSources[], businessDetails     │    │
│  │ ├── financial flags (9 booleans)         │    │
│  │ ├── retirementAccountTypes[]             │    │
│  │ ├── planningPriorities[]                 │    │
│  │ ├── ocrSummary, ocrExtractedFields{}     │    │
│  │ ├── uploadedDocuments[] (history)        │    │
│  │ ├── comprehensiveSummary (AI-ready)      │    │
│  │ └── completeness (0-100%)               │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ SavedPlan                                │    │
│  │ ├── id, entityType, createdAt           │    │
│  │ ├── profile snapshot                     │    │
│  │ ├── strategies[] (with savings ranges)  │    │
│  │ ├── totalEstimatedSavings               │    │
│  │ └── coveredIntents[]                    │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

### 7.2 Server-Side (Supabase — planned)

```
┌─────────────────────────────────────────────┐
│              SUPABASE (PostgreSQL)            │
│                                             │
│  users          (via Clerk sync)            │
│  profiles       (client tax profiles)       │
│  plans          (generated tax plans)       │
│  documents      (uploaded file metadata)    │
│  chat_history   (conversation logs)         │
│                                             │
│  Storage Bucket: tax-documents              │
│  (encrypted PDFs, images)                   │
└─────────────────────────────────────────────┘
```

---

## 8. AI Model Usage Summary

| Model | Provider | Route | Purpose | Temp |
|-------|----------|-------|---------|------|
| **Claude Sonnet 4** | OpenRouter | `/api/chat` | Tax advisory chat (primary) | 0.3 |
| **Claude Sonnet 4** | OpenRouter | `/api/smart-plan` | Plan personalization (primary) | 0.2 |
| **Claude 3.5 Sonnet** | OpenRouter | `/api/chat`, `/api/smart-plan` | Fallback model | 0.3 |
| **GPT-4o Mini** | OpenRouter | `/api/chat`, `/api/smart-plan` | Second fallback | 0.3 |
| **GPT-4o** | OpenRouter | `/api/documents/process` | Document classification | — |
| **Whisper-1** | OpenAI | `/api/transcribe` | Voice-to-text (STT) | — |
| **TTS-1 (nova)** | OpenAI | `/api/tts` | Text-to-speech for voice interview | — |
| **Azure Prebuilt Models** | Azure | `/api/profile-ocr`, `/api/documents/process` | W-2, 1099, 1098 form OCR | — |
| **Azure Layout Model** | Azure | `/api/profile-ocr`, `/api/documents/process` | General document OCR (1040, etc.) | — |

**Fallback Chain**: All OpenRouter routes use a 3-model fallback: Claude Sonnet 4 → Claude 3.5 Sonnet → GPT-4o Mini. If one model fails or times out (45s), the next is tried automatically.

---

## 9. Strategy Engine Architecture

### 9.1 Master Strategy Library (46 Strategies)

Aligned with the **Corvee 2024 Tax Strategies Masterclass** matrix. Each strategy includes:

```typescript
interface MasterStrategy {
  id: string;                    // e.g., "augusta_rule"
  title: string;                 // "Augusta Rule — Home Rental"
  category: StrategyCategory;    // 1 of 12 categories
  description: string;           // Detailed explanation
  ircReference: string;          // "IRC Section 280A(g)"
  applicableEntities: string[];  // ["s_corp", "c_corp", ...]
  savingsFormula: string;        // "rental_days × fair_market_rate"
  typicalSavingsRange: { min, max };
  eligibilityCriteria: string[];
  implementationSteps: string[];
  riskLevel: "low" | "medium" | "high";
  taxFilingDetails: Record<string, string>;  // per entity type
}
```

### 9.2 The 12 Strategy Categories

| # | Category | Example Strategies |
|---|----------|-------------------|
| 1 | Retirement & Savings | 401(k), Solo 401(k), SEP IRA, Cash Balance Plan, Roth Conversion, Backdoor Roth |
| 2 | Compensation | Reasonable Compensation (S-Corp), FICA Tip Credit |
| 3 | Deductions | Home Office, Accountable Plan, Business Meals, Business Travel, Vehicle Mileage |
| 4 | Family Strategies | Hiring Children, Family Management Company, Dependent Care |
| 5 | Real Estate | Cost Segregation, 1031 Exchange, RE Professional Status, Augusta Rule |
| 6 | Depreciation & Assets | Bonus Depreciation (100% OBBBA), Section 179 |
| 7 | Tax Credits | R&D Credit, Child Tax Credit, EV Credit, Employee Retention |
| 8 | Medical & Health | Self-Employed Health Insurance, HSA Optimization |
| 9 | Education | 529 Plan, Coverdell ESA |
| 10 | Entity Optimization | S-Corp Election, Schedule C Entity Evaluation |
| 11 | Charitable | Charitable Giving, Donor Advised Fund |
| 12 | Business Operations | Captive Insurance, Private Foundation, Achievement Awards |

### 9.3 Strategy Matching Pipeline

```
Client Profile
    │
    ▼
┌─────────────────────────┐
│ getApplicableStrategies()│  Filters by:
│ (smart-plan-strategies)  │  - Entity type
│                          │  - Income level
│                          │  - Business income flag
│                          │  - Real estate flag
│                          │  - Dependents
│                          │  - Age indicators
└────────────┬────────────┘
             │ ~8-15 matched strategies
             ▼
┌─────────────────────────┐
│  /api/smart-plan        │  LLM personalizes:
│  (OpenRouter + Claude)  │  - Actual $ savings calc
│                          │  - Personalized description
│                          │  - Implementation steps
│                          │  - Applicability rating
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Personalized Plan      │
│  sorted by savings      │
│  with min/max ranges    │
└─────────────────────────┘
```

---

## 10. Authentication & Security

```
┌─────────────────────────────────────────────┐
│                  CLERK AUTH                   │
│                                             │
│  middleware.ts                               │
│  ├── Public: /, /about, /sign-in, /sign-up  │
│  └── Protected: /dashboard/**               │
│                                             │
│  Route Protection:                          │
│  clerkMiddleware() → createRouteMatcher()   │
│  → Redirect unauthenticated to /sign-in     │
│                                             │
│  User Session:                              │
│  useUser() hook → { fullName, email, id }   │
└─────────────────────────────────────────────┘
```

---

## 11. Key System Prompts

### Tax System Prompt (`tax-system-prompt.ts`)
The core AI personality. Injected into every chat and plan generation call. Contains:
- 2025 tax brackets (single, MFJ, HOH)
- Standard deduction amounts ($15,000 / $30,000)
- One Big Beautiful Bill Act (OBBBA) changes: 100% bonus depreciation restored, Section 179 at $1,290,000, SALT cap raised to $40,000
- HSA limits ($4,350 / $8,750)
- 12 areas of expertise with specific knowledge
- Entity-specific guidance rules
- Tone: professional, warm, AG FinTax branded

### Entity Strategy Focus Prompts (`smart-plan/route.ts`)
Per-entity-type instructions that ensure the LLM prioritizes the right strategies:
- **Individual**: W-2 optimization, 401(k)/IRA, itemized deductions, credits
- **S-Corp**: Reasonable compensation (#1 priority), distribution planning, QBI
- **C-Corp**: 21% flat rate, QSBS exclusion, MERP/HRA, retained earnings
- **Partnership**: Special allocations, guaranteed payments, 754 elections
- **Sole Prop**: Schedule C deductions, S-Corp election evaluation, SE tax

---

## 12. Voice Interview — Gap-Filling Architecture

```
┌──────────────────────────────────────────────────┐
│           GAP-FILLING QUESTION ENGINE             │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  GAP_QUESTIONS pool (~18 questions)         │  │
│  │  Each tagged with:                          │  │
│  │  - priority: critical | important | nice    │  │
│  │  - resolvedByProfileFields: string[]        │  │
│  │  - applicableWhen: entity/income/flags      │  │
│  │  - informsStrategies: string[]              │  │
│  └───────────────────┬────────────────────────┘  │
│                      │                           │
│                      ▼                           │
│  ┌────────────────────────────────────────────┐  │
│  │  computeGapQuestions(profile, max=8)        │  │
│  │  1. Filter out resolved questions           │  │
│  │  2. Filter by entity/income applicability   │  │
│  │  3. Sort by priority                        │  │
│  │  4. Cap at maxQuestions                      │  │
│  └───────────────────┬────────────────────────┘  │
│                      │ 5-8 questions             │
│                      ▼                           │
│  ┌────────────────────────────────────────────┐  │
│  │  Single QualificationSection               │  │
│  │  (no strategy sections, no transitions)     │  │
│  │  Questions asked conversationally           │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

---

## 13. Deployment Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        VERCEL                             │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Static      │  │  Serverless  │  │   Edge       │   │
│  │  Pages       │  │  Functions   │  │  Middleware   │   │
│  │  (ISR/SSG)   │  │  (API routes)│  │  (Clerk auth)│   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                          │
│  Environment Variables:                                  │
│  OPENROUTER_API_KEY, OPENAI_API_KEY,                    │
│  AZURE_DOCUMENT_INTELLIGENCE_*, CLERK_*,                │
│  NEXT_PUBLIC_SUPABASE_*, SUPABASE_SERVICE_ROLE_KEY      │
│                                                          │
│  Timeouts:                                              │
│  - /api/chat: 60s           - /api/tts: 60s            │
│  - /api/smart-plan: 60s     - /api/transcribe: 60s     │
│  - /api/profile-ocr: 120s   - /api/documents/*: 120s   │
└──────────────────────────────────────────────────────────┘
```

---

## 14. LLM Call Count Per User Session

| Action | LLM Calls | Services Hit |
|--------|-----------|-------------|
| Upload 1 tax document | 2 | Azure OCR + OpenRouter |
| Ask 1 chat question | 1 | OpenRouter (streaming) |
| Voice interview (8 questions) | ~25 | OpenRouter (8 question gen + 8 interpretation) + Whisper (8 STT) + OpenAI TTS (8 TTS) + OpenRouter (1 plan gen) |
| Generate smart plan | 1 | OpenRouter |
| Full session (upload + chat + voice + plan) | ~30-35 | All services |

---

## 15. File Structure Reference

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts              # Streaming AI chat
│   │   ├── smart-plan/route.ts        # Plan generation
│   │   ├── profile-ocr/route.ts       # Document OCR → profile
│   │   ├── tts/route.ts               # Text-to-speech
│   │   ├── transcribe/route.ts        # Speech-to-text (Whisper)
│   │   └── documents/
│   │       ├── upload/route.ts        # File upload
│   │       └── process/route.ts       # Doc classification
│   ├── dashboard/
│   │   ├── page.tsx                   # Dashboard hub
│   │   ├── smart-plan/page.tsx        # AI planner (chat + voice)
│   │   ├── tax-chat/page.tsx          # TaxGPT chat
│   │   ├── profile/page.tsx           # Profile builder
│   │   ├── documents/page.tsx         # Doc manager
│   │   ├── strategies/page.tsx        # Strategy library
│   │   ├── savings/page.tsx           # Savings dashboard
│   │   ├── tax-review/page.tsx        # Return review
│   │   └── settings/page.tsx          # Settings
│   ├── page.tsx                       # Landing page
│   ├── about/page.tsx                 # About page
│   ├── sign-in/[[...sign-in]]/page.tsx
│   ├── sign-up/[[...sign-up]]/page.tsx
│   ├── layout.tsx                     # Root layout (Clerk, fonts)
│   └── favicon.ico                    # AG FinTax logo
├── components/
│   ├── ui/                            # shadcn/ui primitives
│   ├── layout/                        # Sidebar, Header
│   ├── voice/voice-interview.tsx      # Voice interview UI
│   ├── tax-chat/                      # Chat components
│   ├── documents/                     # Upload components
│   ├── dashboard/                     # Stats components
│   └── charts/                        # Recharts wrappers
├── hooks/
│   ├── use-chat.ts                    # Streaming chat hook
│   └── use-voice-conversation.ts      # Voice interview hook
├── lib/
│   ├── ai/
│   │   ├── tax-system-prompt.ts       # Core AI system prompt
│   │   ├── document-classifier.ts     # Doc type classification
│   │   └── openrouter.ts             # OpenRouter client
│   ├── tax/
│   │   ├── smart-plan-strategies.ts   # 46 strategy library
│   │   ├── smart-plan-engine.ts       # Intent detection engine
│   │   ├── qualification-engine.ts    # Interview + gap-filling
│   │   ├── savings-calculator.ts      # Tax math engine
│   │   ├── plan-store.ts             # Data models + persistence
│   │   └── strategies.ts             # Legacy strategies
│   ├── supabase/
│   │   ├── server.ts                 # Server-side client
│   │   └── client.ts                 # Browser client
│   └── utils.ts                      # cn() utility
└── middleware.ts                      # Clerk route protection
```

---

*Document generated for AG FinTax internal team review.*
*Platform built and powered by LoukriAI.com.*
