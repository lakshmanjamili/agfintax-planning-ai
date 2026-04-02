// =============================================================================
// Blog Posts — Tax News & Insights for AG FinTax
// =============================================================================

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: BlogCategory;
  author: string;
  publishedAt: string;        // ISO date
  readTime: string;           // e.g. "5 min read"
  coverImage?: string;
  tags: string[];
  relatedStrategyIds: string[]; // links to MasterStrategy IDs
  featured?: boolean;
}

export type BlogCategory =
  | "tax-news"
  | "strategy-spotlight"
  | "irs-updates"
  | "business-tips"
  | "year-end-planning"
  | "case-study";

export const BLOG_CATEGORIES: { id: BlogCategory; label: string; color: string }[] = [
  { id: "tax-news", label: "Tax News", color: "#FFB596" },
  { id: "strategy-spotlight", label: "Strategy Spotlight", color: "#4CD6FB" },
  { id: "irs-updates", label: "IRS Updates", color: "#F87171" },
  { id: "business-tips", label: "Business Tips", color: "#A78BFA" },
  { id: "year-end-planning", label: "Year-End Planning", color: "#34D399" },
  { id: "case-study", label: "Case Study", color: "#FBBF24" },
];

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "2026-tax-brackets-what-changed",
    title: "2026 Tax Brackets Are Here — What Changed and What It Means for You",
    excerpt:
      "The IRS has released updated tax brackets for 2026. Here's a breakdown of the changes, inflation adjustments, and how business owners can position themselves to save.",
    content: `## The Big Picture

The IRS announced inflation-adjusted tax brackets for 2026, shifting thresholds upward by approximately 2.8%. While this sounds small, for business owners earning $200K+, it can mean thousands in savings — if you plan ahead.

## Key Changes

- **10% bracket** now covers up to $11,925 (single) / $23,850 (MFJ)
- **22% bracket** starts at $48,476 (single) / $96,951 (MFJ)
- **37% bracket** kicks in at $626,351 (single) / $751,601 (MFJ)
- **Standard deduction** increases to $15,225 (single) / $30,450 (MFJ)

## What This Means for Business Owners

If you're an S-Corp owner taking reasonable compensation, the bracket shift means you may be able to adjust your salary/distribution split more favorably. Combined with the QBI deduction (Section 199A), this creates a planning opportunity worth reviewing with your tax advisor.

## Action Items

1. Review your current W-2 salary if you're an S-Corp owner
2. Reassess estimated tax payments for 2026
3. Consider accelerating or deferring income across the bracket boundaries
4. Schedule a mid-year tax planning session

*At AG FinTax, we proactively adjust your tax plan when bracket changes create new opportunities. Your Smart Plan updates automatically.*`,
    category: "tax-news",
    author: "AG FinTax Team",
    publishedAt: "2026-03-15",
    readTime: "4 min read",
    tags: ["tax brackets", "2026", "inflation adjustment", "S-Corp"],
    relatedStrategyIds: ["reasonable_compensation_scorp", "s_corp_election"],
    featured: true,
  },
  {
    slug: "cost-segregation-hidden-goldmine",
    title: "Cost Segregation: The Hidden Goldmine in Your Commercial Property",
    excerpt:
      "If you own commercial real estate and haven't done a cost segregation study, you're likely overpaying taxes by $50K-$500K. Here's how it works.",
    content: `## What Is Cost Segregation?

Cost segregation is an IRS-approved tax strategy that accelerates depreciation on commercial property components. Instead of depreciating your entire building over 39 years, a cost segregation study reclassifies certain components — flooring, lighting, landscaping, specialized electrical — into 5, 7, or 15-year categories.

## The Math That Matters

**Example:** You purchase a $2M commercial building.

- **Without cost seg:** $51,282/year depreciation (straight-line over 39 years)
- **With cost seg:** ~$400,000 in Year 1 deductions (with bonus depreciation)

That's a potential **first-year tax savings of $120,000-$148,000** at the 37% bracket.

## Who Qualifies?

- Own commercial real estate worth $500K+
- Purchased, built, or renovated property in the last 15 years
- Properties include: office buildings, retail, restaurants, apartments, warehouses, medical facilities

## How AG FinTax Helps

Our Smart Plan automatically identifies cost segregation opportunities when your profile indicates real estate ownership. We partner with certified engineers to conduct the study and handle all IRS documentation.

## The Bottom Line

If your property cost $1M+, the study typically pays for itself 5-10x over. It's one of the highest-ROI tax strategies available to real estate owners.`,
    category: "strategy-spotlight",
    author: "Anil Grandhi, CPA",
    publishedAt: "2026-03-10",
    readTime: "5 min read",
    tags: ["cost segregation", "real estate", "depreciation", "commercial property"],
    relatedStrategyIds: ["cost_segregation", "bonus_depreciation", "real_estate_professional"],
  },
  {
    slug: "irs-crackdown-reasonable-compensation",
    title: "IRS Crackdown on S-Corp Reasonable Compensation — Are You at Risk?",
    excerpt:
      "The IRS is increasing audits on S-Corp owners who pay themselves too little in salary. Learn the safe harbor guidelines and how to stay compliant.",
    content: `## What's Happening

The IRS has signaled increased enforcement on S-Corp owners who minimize their W-2 salary to reduce self-employment taxes. While paying yourself a lower salary and taking larger distributions is a legitimate strategy, the IRS requires your compensation to be "reasonable" — and they're now using AI to flag outliers.

## The Risk

If the IRS determines your salary is unreasonably low, they can:
- Reclassify distributions as wages (retroactively)
- Assess back payroll taxes + penalties + interest
- In extreme cases, revoke your S-Corp election

## What "Reasonable" Actually Means

The IRS considers factors like:
- Comparable salaries for similar roles in your industry
- Your experience and responsibilities
- Company revenue and profitability
- Time spent working in the business
- Regional salary data

## Safe Harbor Guidelines

While there's no official "safe harbor," most tax professionals recommend:
- Salary should be at least **50-60% of net business income** for most service businesses
- Use Bureau of Labor Statistics data to benchmark
- Document your compensation methodology annually

## How AG FinTax Protects You

Our Smart Plan calculates the optimal salary/distribution split that maximizes your tax savings while staying well within IRS guidelines. We document the methodology so you have an audit-ready defense.`,
    category: "irs-updates",
    author: "AG FinTax Team",
    publishedAt: "2026-03-05",
    readTime: "6 min read",
    tags: ["S-Corp", "reasonable compensation", "IRS audit", "payroll tax"],
    relatedStrategyIds: ["reasonable_compensation_scorp", "s_corp_election", "accountable_plan"],
  },
  {
    slug: "hire-your-kids-save-taxes",
    title: "How Hiring Your Kids Can Save You $12,000+ Per Year in Taxes",
    excerpt:
      "One of the most powerful (and legal) family tax strategies. If you have a business and kids under 18, you could be saving thousands every year.",
    content: `## The Strategy

If you own a sole proprietorship or a partnership where both partners are parents, you can hire your children under 18 for legitimate work — and the wages are:

- **Deductible** to your business
- **Tax-free** to your child (up to the standard deduction — $15,225 in 2026)
- **Exempt from FICA** (Social Security & Medicare taxes) if child is under 18
- **Exempt from FUTA** if child is under 21

## Real Savings Example

**Scenario:** You're in the 32% tax bracket and hire your 14-year-old for $12,000/year.

- Your tax deduction: **$12,000 × 32% = $3,840** in income tax savings
- FICA savings: **$12,000 × 15.3% = $1,836** (employer + employee portions)
- Child's tax: **$0** (under standard deduction)
- **Total family tax savings: ~$5,676/year**

Plus, your child can contribute to a Roth IRA — building tax-free wealth from age 14.

## What Counts as "Legitimate Work"?

- Social media management
- Data entry and filing
- Cleaning and maintaining office space
- Modeling for marketing materials
- Website updates
- Answering phones

## Important Rules

1. Pay must be reasonable for work actually performed
2. Keep time sheets and job descriptions
3. Issue a W-2 at year end
4. Set up a real bank account for the child
5. The work must be for a legitimate business purpose`,
    category: "strategy-spotlight",
    author: "Anil Grandhi, CPA",
    publishedAt: "2026-02-28",
    readTime: "4 min read",
    tags: ["hiring children", "family tax", "FICA exemption", "deductions"],
    relatedStrategyIds: ["hiring_children", "family_management_company"],
  },
  {
    slug: "q1-2026-estimated-tax-deadlines",
    title: "Q1 2026 Tax Calendar: Deadlines Every Business Owner Should Know",
    excerpt:
      "Miss a deadline, pay a penalty. Here's your complete Q1 2026 tax calendar with key dates for estimated payments, extensions, and filings.",
    content: `## Critical Q1 2026 Dates

### January
- **Jan 15** — Q4 2025 estimated tax payment due
- **Jan 31** — W-2s and 1099-NEC due to recipients
- **Jan 31** — Form 940 (FUTA) due

### February
- **Feb 28** — Paper filing deadline for 1099s/W-2s to IRS
- **Feb 28** — Form 1096 due (if filing paper 1099s)

### March
- **Mar 15** — S-Corp (1120-S) and Partnership (1065) returns due
- **Mar 15** — S-Corp election deadline (Form 2553) for 2026
- **Mar 17** — Corporate estimated tax payment (Q1)
- **Mar 31** — Electronic filing deadline for 1099s to IRS

## Don't Forget: Extension ≠ Extension to Pay

Filing an extension (Form 7004 or 4868) gives you more time to file, but **not more time to pay**. You still need to estimate and pay any tax owed by the original due date to avoid penalties.

## Pro Tip

Set up your estimated tax payments on autopay through EFTPS.gov to avoid missed deadlines. AG FinTax clients get automated reminders built into their dashboard.`,
    category: "tax-news",
    author: "AG FinTax Team",
    publishedAt: "2026-01-05",
    readTime: "3 min read",
    tags: ["deadlines", "estimated taxes", "Q1 2026", "calendar"],
    relatedStrategyIds: [],
  },
  {
    slug: "home-office-deduction-2026-guide",
    title: "The Complete 2026 Guide to the Home Office Deduction",
    excerpt:
      "Working from home? You might be leaving money on the table. Here's everything you need to know about claiming the home office deduction — simplified vs. actual method.",
    content: `## Two Methods, Very Different Results

### Simplified Method
- **$5 per square foot**, up to 300 sq ft
- Maximum deduction: **$1,500/year**
- No depreciation tracking required
- Easy but often leaves money on the table

### Actual Expense Method
- Calculate the **percentage of your home used for business**
- Deduct that percentage of: mortgage/rent, utilities, insurance, repairs, depreciation
- More record-keeping but significantly higher deduction

## Example Comparison

**2,000 sq ft home, 200 sq ft dedicated office (10%)**

| Expense | Annual Cost | Deduction (10%) |
|---------|------------|-----------------|
| Mortgage interest | $18,000 | $1,800 |
| Property tax | $6,000 | $600 |
| Utilities | $3,600 | $360 |
| Insurance | $1,800 | $180 |
| Depreciation | $5,000 | $500 |
| **Total** | | **$3,440** |

vs. Simplified: **$1,000** (200 sq ft × $5)

The actual method saves **$2,440 more** in this example.

## Key Requirements

1. Space must be used **regularly and exclusively** for business
2. Must be your **principal place of business** (or where you meet clients)
3. If employed by someone else: the W-2 employee home office deduction was eliminated by TCJA (only self-employed can claim)

## AG FinTax Smart Plan Integration

When you tell us you work from home during your Smart Plan interview, we automatically calculate both methods and recommend the one that saves you more.`,
    category: "strategy-spotlight",
    author: "Anil Grandhi, CPA",
    publishedAt: "2026-02-15",
    readTime: "5 min read",
    tags: ["home office", "deduction", "self-employed", "work from home"],
    relatedStrategyIds: ["home_office", "section_179", "business_vehicle_mileage"],
  },
  {
    slug: "case-study-scorp-savings-180k",
    title: "Case Study: How an IT Consultant Saved $47,000 by Switching to S-Corp",
    excerpt:
      "Real numbers, real savings. See how a software consultant earning $280K restructured from Schedule C to S-Corp and cut their tax bill dramatically.",
    content: `## The Client

- **Occupation:** IT Consultant (solo practice)
- **Annual revenue:** $280,000
- **Filing status:** Married Filing Jointly
- **Previous structure:** Sole Proprietorship (Schedule C)

## The Problem

As a sole proprietor, the client was paying self-employment tax (15.3%) on their entire net income. With $250K in net profit after deductions:

- **Self-employment tax:** $250K × 15.3% = **$38,250**
- This was on top of income tax

## The Solution

We implemented a multi-strategy approach:

### 1. S-Corp Election
- Set reasonable compensation at $130,000 (benchmarked to industry)
- Remaining $120,000 taken as distributions (no FICA)
- **FICA savings: $120,000 × 15.3% = $18,360**

### 2. Solo 401(k) Maximization
- Employee contribution: $23,500 (2026 limit)
- Employer match: $32,500 (25% of compensation)
- **Total retirement contribution: $56,000**
- Tax savings at 32% bracket: **$17,920**

### 3. Accountable Plan
- Documented home office, vehicle, phone, and internet expenses
- **Additional deductions: $14,200**
- Tax savings: **$4,544**

### 4. Self-Employed Health Insurance
- Family premium deducted above the line: $18,000
- Tax savings: **$5,760**

## Total Annual Savings

| Strategy | Annual Savings |
|----------|---------------|
| S-Corp FICA savings | $18,360 |
| 401(k) tax deferral | $17,920 |
| Accountable plan | $4,544 |
| Health insurance deduction | $5,760 |
| **Total** | **$46,584** |

*Names and identifying details changed for privacy. Results vary based on individual circumstances.*`,
    category: "case-study",
    author: "Anil Grandhi, CPA",
    publishedAt: "2026-02-20",
    readTime: "6 min read",
    tags: ["S-Corp", "case study", "self-employed", "401k", "savings"],
    relatedStrategyIds: [
      "s_corp_election",
      "reasonable_compensation_scorp",
      "solo_401k",
      "accountable_plan",
      "self_employed_health_insurance",
    ],
    featured: true,
  },
  {
    slug: "bonus-depreciation-phase-down-2026",
    title: "Bonus Depreciation Drops to 40% in 2026 — Act Now or Pay More Later",
    excerpt:
      "The 100% bonus depreciation from TCJA is phasing down. In 2026 it's only 40%. Here's what business owners need to do before it drops further.",
    content: `## The Phase-Down Schedule

| Year | Bonus Depreciation |
|------|--------------------|
| 2022 | 100% |
| 2023 | 80% |
| 2024 | 60% |
| 2025 | 40% |
| 2026 | 20% |
| 2027+ | 0% (unless extended by Congress) |

## What This Means

If you're planning major equipment purchases, vehicle acquisitions, or building improvements — timing matters more than ever.

**Example:** $500,000 equipment purchase
- At 40% bonus: $200,000 first-year deduction → **$74,000 tax savings** (at 37%)
- At 20% bonus (2026): $100,000 first-year deduction → **$37,000 tax savings**
- At 0% (2027): Standard depreciation only → **~$14,000 first-year tax savings**

## Strategies to Maximize Remaining Bonus

1. **Accelerate purchases** into the current tax year when possible
2. **Cost segregation studies** on real estate — reclassified components still qualify
3. **Section 179** as an alternative — $1.22M limit for 2026, not subject to phase-down
4. **Like-kind exchanges (1031)** to defer gains and get full basis on replacement property

## Should You Wait for Congress?

There's bipartisan talk about restoring 100% bonus depreciation, but no guarantees. Plan based on current law, and treat any extension as a bonus.`,
    category: "tax-news",
    author: "AG FinTax Team",
    publishedAt: "2026-01-20",
    readTime: "4 min read",
    tags: ["bonus depreciation", "TCJA", "Section 179", "equipment"],
    relatedStrategyIds: ["bonus_depreciation", "section_179", "cost_segregation", "1031_exchange"],
  },
];

/** Lookup helper: get posts related to a strategy ID */
export function getPostsForStrategy(strategyId: string): BlogPost[] {
  return BLOG_POSTS.filter((p) => p.relatedStrategyIds.includes(strategyId));
}

/** Lookup helper: get posts by category */
export function getPostsByCategory(category: BlogCategory): BlogPost[] {
  return BLOG_POSTS.filter((p) => p.category === category);
}

/** Get featured posts */
export function getFeaturedPosts(): BlogPost[] {
  return BLOG_POSTS.filter((p) => p.featured);
}
