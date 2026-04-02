// =============================================================================
// Video Content Library — Tax Strategy Videos for AG FinTax
// =============================================================================

export interface VideoContent {
  slug: string;
  title: string;
  description: string;
  duration: string;          // e.g. "12:34"
  category: VideoCategory;
  thumbnailText: string;     // For placeholder thumbnails
  videoUrl?: string;         // YouTube/Vimeo embed URL (add real URLs later)
  presenter: string;
  publishedAt: string;
  tags: string[];
  relatedStrategyIds: string[];
  featured?: boolean;
  series?: string;           // Group into series
}

export type VideoCategory =
  | "strategy-explainer"
  | "tax-tip"
  | "client-walkthrough"
  | "webinar"
  | "news-update"
  | "smart-plan-guide";

export const VIDEO_CATEGORIES: { id: VideoCategory; label: string; color: string }[] = [
  { id: "strategy-explainer", label: "Strategy Explainer", color: "#4CD6FB" },
  { id: "tax-tip", label: "Quick Tax Tip", color: "#FFB596" },
  { id: "client-walkthrough", label: "Client Walkthrough", color: "#34D399" },
  { id: "webinar", label: "Webinar", color: "#A78BFA" },
  { id: "news-update", label: "News Update", color: "#F87171" },
  { id: "smart-plan-guide", label: "Smart Plan Guide", color: "#FBBF24" },
];

export const VIDEO_SERIES: { id: string; title: string; description: string }[] = [
  {
    id: "tax-strategy-101",
    title: "Tax Strategy 101",
    description: "Essential tax strategies every business owner should know, explained in plain English.",
  },
  {
    id: "smart-plan-deep-dives",
    title: "Smart Plan Deep Dives",
    description: "Detailed walkthroughs of strategies recommended in your AG FinTax Smart Plan.",
  },
  {
    id: "year-end-planning",
    title: "Year-End Tax Planning",
    description: "Timely strategies to maximize deductions before the tax year closes.",
  },
];

export const VIDEOS: VideoContent[] = [
  // --- Tax Strategy 101 Series ---
  {
    slug: "s-corp-election-explained",
    title: "S-Corp Election Explained: Save $15K-$40K in Taxes",
    description:
      "Learn how switching from a sole proprietorship to an S-Corp can dramatically reduce your self-employment taxes. We walk through the math, the process, and common pitfalls.",
    duration: "14:22",
    category: "strategy-explainer",
    thumbnailText: "S-Corp\nElection",
    presenter: "Anil Grandhi, CPA",
    publishedAt: "2026-03-12",
    tags: ["S-Corp", "self-employment tax", "entity structure", "LLC"],
    relatedStrategyIds: ["s_corp_election", "reasonable_compensation_scorp", "late_s_corp_election"],
    featured: true,
    series: "tax-strategy-101",
  },
  {
    slug: "cost-segregation-commercial-property",
    title: "Cost Segregation: Turn Your Building Into a Tax Deduction Machine",
    description:
      "If you own commercial real estate, this strategy could save you $50K-$500K in the first year alone. See real examples of how cost segregation works.",
    duration: "18:45",
    category: "strategy-explainer",
    thumbnailText: "Cost\nSegregation",
    presenter: "Anil Grandhi, CPA",
    publishedAt: "2026-03-01",
    tags: ["cost segregation", "real estate", "depreciation", "commercial property"],
    relatedStrategyIds: ["cost_segregation", "bonus_depreciation", "real_estate_professional"],
    featured: true,
    series: "tax-strategy-101",
  },
  {
    slug: "hiring-your-kids-strategy",
    title: "Hiring Your Kids: The Ultimate Family Tax Strategy",
    description:
      "Pay your children, deduct the wages, and they pay zero tax. Here's exactly how to set it up legally and the common mistakes to avoid.",
    duration: "11:08",
    category: "strategy-explainer",
    thumbnailText: "Hire Your\nKids",
    presenter: "Anil Grandhi, CPA",
    publishedAt: "2026-02-20",
    tags: ["hiring children", "family tax", "FICA", "business deductions"],
    relatedStrategyIds: ["hiring_children", "family_management_company"],
    series: "tax-strategy-101",
  },
  {
    slug: "home-office-deduction-maximize",
    title: "Home Office Deduction: Simplified vs. Actual (Which Saves More?)",
    description:
      "Most business owners leave $2,000-$5,000 on the table by using the wrong home office method. We compare both approaches with real numbers.",
    duration: "9:35",
    category: "strategy-explainer",
    thumbnailText: "Home\nOffice",
    presenter: "Anil Grandhi, CPA",
    publishedAt: "2026-02-10",
    tags: ["home office", "deduction", "self-employed", "workspace"],
    relatedStrategyIds: ["home_office", "accountable_plan"],
    series: "tax-strategy-101",
  },
  {
    slug: "solo-401k-backdoor-roth",
    title: "Solo 401(k) + Backdoor Roth: Shelter $69K+ From Taxes",
    description:
      "The most powerful retirement strategy for self-employed business owners. Learn how to max out contributions and build tax-free retirement wealth.",
    duration: "16:12",
    category: "strategy-explainer",
    thumbnailText: "Solo\n401(k)",
    presenter: "Anil Grandhi, CPA",
    publishedAt: "2026-01-28",
    tags: ["Solo 401k", "Roth", "retirement", "self-employed"],
    relatedStrategyIds: ["solo_401k", "traditional_401k_max", "roth_401k_strategy"],
    series: "tax-strategy-101",
  },

  // --- Quick Tax Tips ---
  {
    slug: "5-deductions-most-miss",
    title: "5 Tax Deductions Most Business Owners Miss Every Year",
    description:
      "Quick rundown of commonly overlooked deductions: business meals, vehicle expenses, education, health insurance, and home office. Don't leave money on the table.",
    duration: "6:45",
    category: "tax-tip",
    thumbnailText: "5 Missed\nDeductions",
    presenter: "AG FinTax Team",
    publishedAt: "2026-03-18",
    tags: ["deductions", "business meals", "vehicle", "quick tips"],
    relatedStrategyIds: ["business_meals", "business_vehicle_mileage", "self_employed_health_insurance", "home_office"],
  },
  {
    slug: "estimated-taxes-avoid-penalties",
    title: "Estimated Taxes: How to Calculate and Avoid Penalties",
    description:
      "Quarterly estimated taxes confuse most business owners. Here's the simple formula, the safe harbor rule, and how to avoid underpayment penalties.",
    duration: "8:20",
    category: "tax-tip",
    thumbnailText: "Estimated\nTaxes",
    presenter: "AG FinTax Team",
    publishedAt: "2026-01-10",
    tags: ["estimated taxes", "penalties", "quarterly payments", "safe harbor"],
    relatedStrategyIds: [],
  },
  {
    slug: "business-meals-2026-rules",
    title: "Business Meals Deduction in 2026: What's Deductible (and What's Not)",
    description:
      "The rules changed after COVID. Here's what's 50% deductible, what's 100% deductible, and how to document meals properly for an audit.",
    duration: "7:15",
    category: "tax-tip",
    thumbnailText: "Business\nMeals",
    presenter: "AG FinTax Team",
    publishedAt: "2026-02-05",
    tags: ["business meals", "entertainment", "deductions", "documentation"],
    relatedStrategyIds: ["business_meals", "business_travel"],
  },

  // --- Smart Plan Guides ---
  {
    slug: "smart-plan-walkthrough",
    title: "AG FinTax Smart Plan: How It Works (Full Walkthrough)",
    description:
      "See how our AI-powered Smart Plan analyzes your financial profile, identifies qualifying strategies, and builds a personalized tax savings roadmap.",
    duration: "12:00",
    category: "smart-plan-guide",
    thumbnailText: "Smart\nPlan",
    presenter: "Anil Grandhi, CPA",
    publishedAt: "2026-03-20",
    tags: ["smart plan", "AI", "walkthrough", "tax planning"],
    relatedStrategyIds: [],
    featured: true,
    series: "smart-plan-deep-dives",
  },
  {
    slug: "reading-your-smart-plan-results",
    title: "How to Read Your Smart Plan Results & Take Action",
    description:
      "Your Smart Plan identified strategies — now what? This video walks through the results page, savings estimates, and how to prioritize implementation.",
    duration: "10:30",
    category: "smart-plan-guide",
    thumbnailText: "Plan\nResults",
    presenter: "Anil Grandhi, CPA",
    publishedAt: "2026-03-22",
    tags: ["smart plan", "results", "implementation", "action items"],
    relatedStrategyIds: [],
    series: "smart-plan-deep-dives",
  },

  // --- Webinars ---
  {
    slug: "2026-tax-law-changes-webinar",
    title: "2026 Tax Law Changes: What Business Owners Need to Know",
    description:
      "Live webinar recording covering all major tax law changes for 2026 including bracket shifts, bonus depreciation phase-down, retirement contribution limits, and planning opportunities.",
    duration: "42:15",
    category: "webinar",
    thumbnailText: "2026 Tax\nChanges",
    presenter: "Anil Grandhi, CPA",
    publishedAt: "2026-01-15",
    tags: ["webinar", "2026", "tax law", "TCJA", "planning"],
    relatedStrategyIds: ["bonus_depreciation", "section_179", "traditional_401k_max"],
    series: "year-end-planning",
  },
  {
    slug: "scorp-vs-llc-which-is-better",
    title: "S-Corp vs LLC: Which Entity Structure Saves You More?",
    description:
      "The most common question we get. We break down the tax differences between LLCs, S-Corps, and C-Corps with real comparisons at different income levels.",
    duration: "22:30",
    category: "webinar",
    thumbnailText: "S-Corp\nvs LLC",
    presenter: "Anil Grandhi, CPA",
    publishedAt: "2026-02-12",
    tags: ["S-Corp", "LLC", "C-Corp", "entity structure", "comparison"],
    relatedStrategyIds: ["s_corp_election", "c_corp_election", "schedule_c_entity"],
  },

  // --- News Updates ---
  {
    slug: "irs-audit-rates-2026",
    title: "IRS Audit Rates Are Up in 2026 — Here's What They're Targeting",
    description:
      "The IRS received $80B in new funding and is hiring thousands of agents. Here's where audits are increasing and how to protect yourself.",
    duration: "8:50",
    category: "news-update",
    thumbnailText: "IRS Audit\nUpdate",
    presenter: "AG FinTax Team",
    publishedAt: "2026-03-08",
    tags: ["IRS", "audit", "enforcement", "compliance"],
    relatedStrategyIds: ["reasonable_compensation_scorp"],
  },
];

/** Lookup helper: get videos related to a strategy ID */
export function getVideosForStrategy(strategyId: string): VideoContent[] {
  return VIDEOS.filter((v) => v.relatedStrategyIds.includes(strategyId));
}

/** Lookup helper: get videos by category */
export function getVideosByCategory(category: VideoCategory): VideoContent[] {
  return VIDEOS.filter((v) => v.category === category);
}

/** Get videos in a series */
export function getVideosBySeries(seriesId: string): VideoContent[] {
  return VIDEOS.filter((v) => v.series === seriesId);
}

/** Get featured videos */
export function getFeaturedVideos(): VideoContent[] {
  return VIDEOS.filter((v) => v.featured);
}
