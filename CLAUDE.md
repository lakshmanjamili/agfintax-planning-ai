# CLAUDE.md — AgFinTax Planning AI

## Project Overview

AgFinTax Planning AI is an AI-powered tax planning platform for AG FinTax (Anil Grandhi's firm). Clients upload tax documents, get AI-powered analysis, personalized tax strategies, and savings recommendations. Think TaxGPT but better — with charts, savings dashboards, document intelligence, and proactive planning. Built and powered by LoukriAI.com.

## Tech Stack

### Core Framework
- **Next.js 16** (App Router) with React 19 and TypeScript 5
- **Tailwind CSS v4** with `@import "tailwindcss"` syntax
- **shadcn/ui** (new-york style, zinc base color, CSS variables, lucide icons)

### Authentication & Authorization
- **Clerk** (`@clerk/nextjs`) — primary auth provider
- Middleware at `middleware.ts` protects `/dashboard/**` routes

### Database
- **Supabase** (PostgreSQL) via `@supabase/supabase-js`
- Server client: `lib/supabase/server.ts` | Browser client: `lib/supabase/client.ts`

### AI & Chat
- **OpenRouter** (`OPENROUTER_API_KEY`) — routes to Claude/GPT models
- Tax AI system prompt: `lib/ai/tax-system-prompt.ts`
- Streaming chat API: `app/api/chat/route.ts` (Edge runtime)
- Document classification: `lib/ai/document-classifier.ts`
- Demo mode when no API key configured

### Document Intelligence
- **Azure Document Intelligence** for OCR (production)
- Document upload, classification, and structured data extraction
- Based on document_labs architecture

### Charts & Visualization
- **Recharts** for tax savings charts (bar, pie, area)

### UI Components
- shadcn/ui primitives in `components/ui/`
- **Framer Motion** for animations
- **lucide-react** for icons
- **react-dropzone** for file uploads
- **react-markdown** for AI response rendering

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/                # AI tax chat streaming API
│   │   └── documents/           # Document upload & processing APIs
│   ├── dashboard/
│   │   ├── tax-chat/            # AI Tax Chat (TaxGPT-style)
│   │   ├── documents/           # Document upload & management
│   │   ├── strategies/          # Tax strategy library (15+ strategies)
│   │   ├── savings/             # Savings dashboard with charts
│   │   ├── tax-review/          # AI return review (red/green flags)
│   │   ├── profile/             # Client tax profile
│   │   └── settings/            # User settings
│   ├── sign-in/                 # Clerk sign in
│   ├── sign-up/                 # Clerk sign up
│   └── page.tsx                 # Landing page
├── components/
│   ├── ui/                      # shadcn/ui primitives
│   ├── layout/                  # Sidebar, Header
│   ├── tax-chat/                # Chat message, suggested questions
│   ├── documents/               # Upload zone, document card
│   ├── dashboard/               # Stats card
│   └── charts/                  # Chart components
├── hooks/
│   └── use-chat.ts              # Streaming chat hook
├── lib/
│   ├── ai/                      # OpenRouter client, system prompts, classifier
│   ├── supabase/                # Supabase clients
│   ├── tax/                     # Tax strategies data, savings calculator
│   └── utils.ts                 # cn() utility
└── middleware.ts                 # Clerk auth middleware
```

## Brand

- **Primary**: Orange `#ff6600`
- **Secondary**: Navy `#03045e`
- **Font**: Montserrat (300-700)
- **Client**: AG FinTax — Anil Grandhi
- **Tagline**: "Financial & Tax Services for the Dynamic Business Owners"
- **Footer**: "Built & Powered by LoukriAI.com"

## Key Conventions

- TypeScript strict mode — no `any` types
- `@/` path aliases for all imports
- Server Components by default; `"use client"` only when needed
- All AI calls through OpenRouter (not direct OpenAI)
- Clerk for auth, Supabase for data persistence
- Framer motion ease values must use `as const` for TypeScript compatibility

## Environment Variables

Required: `CLERK_*`, `NEXT_PUBLIC_SUPABASE_*`, `OPENROUTER_API_KEY`
Optional: `AZURE_DOCUMENT_INTELLIGENCE_*` (for production OCR)
Copy `.env.example` to `.env.local` for development.

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
```

## Deployment

Deploy to Vercel:
1. Push to GitHub
2. Import in Vercel dashboard
3. Set environment variables
4. Deploy
