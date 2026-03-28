export type StrategyCategory =
  | "business"
  | "individual"
  | "investment"
  | "estate"
  | "international";

export type RiskLevel = "low" | "medium" | "high";

export interface TaxStrategy {
  id: string;
  name: string;
  category: StrategyCategory;
  description: string;
  potentialSavings: string;
  ircReference: string;
  applicableTo: string[];
  riskLevel: RiskLevel;
  steps: string[];
}

export const TAX_STRATEGIES: TaxStrategy[] = [
  {
    id: "qbi-deduction",
    name: "Section 199A QBI Deduction",
    category: "business",
    description:
      "Deduct up to 20% of Qualified Business Income from pass-through entities. Now permanent under the One Big Beautiful Bill Act. Available to sole proprietors, partnerships, S-Corps, and some trusts/estates. Subject to W-2 wage and UBIA limitations for specified service trades above income thresholds.",
    potentialSavings: "$5,000 - $100,000+",
    ircReference: "IRC Section 199A",
    applicableTo: ["S-Corp", "LLC", "Sole Proprietor", "Partnership"],
    riskLevel: "low",
    steps: [
      "Determine if your business qualifies as a qualified trade or business (non-SSTB or under income threshold)",
      "Calculate Qualified Business Income for the tax year",
      "Apply W-2 wage limitation and UBIA of qualified property tests if above threshold ($191,950 single / $383,900 MFJ for 2025)",
      "Ensure proper entity structuring to maximize the deduction",
      "Consider aggregating multiple businesses if beneficial",
      "Report on Form 8995 or 8995-A with your tax return",
    ],
  },
  {
    id: "cost-segregation",
    name: "Cost Segregation Study",
    category: "business",
    description:
      "Accelerate depreciation on commercial real estate by reclassifying building components into shorter-lived asset categories (5, 7, or 15 years instead of 27.5 or 39 years). Combined with 100% bonus depreciation in 2025, this can generate massive first-year deductions.",
    potentialSavings: "$50,000 - $500,000+",
    ircReference: "IRC Section 168; Treasury Reg. 1.168(i)-8",
    applicableTo: ["S-Corp", "LLC", "C-Corp", "Individual", "Partnership"],
    riskLevel: "medium",
    steps: [
      "Identify eligible properties (commercial, rental, or mixed-use real estate)",
      "Engage a qualified cost segregation engineering firm",
      "Complete the study to reclassify assets into 5, 7, and 15-year categories",
      "Apply 100% bonus depreciation to reclassified short-lived assets",
      "File Form 3115 for change in accounting method if applying to previously placed-in-service property",
      "Coordinate with AG FinTax to ensure compliance and optimal tax position",
    ],
  },
  {
    id: "rd-tax-credit",
    name: "R&D Tax Credit (Section 41)",
    category: "business",
    description:
      "Claim a federal tax credit for qualified research activities including developing new products, processes, software, or formulas. Startups with under $5M in gross receipts can offset up to $500,000 in payroll taxes. The credit is approximately 6-8% of qualifying expenditures.",
    potentialSavings: "$25,000 - $250,000+",
    ircReference: "IRC Section 41; IRC Section 174 (amortization)",
    applicableTo: ["S-Corp", "LLC", "C-Corp", "Startup"],
    riskLevel: "medium",
    steps: [
      "Identify qualifying research activities using the four-part test (permitted purpose, technological uncertainty, process of experimentation, technological in nature)",
      "Document qualified research expenses (wages, supplies, contract research, cloud computing)",
      "Calculate the credit using either the regular method or Alternative Simplified Credit (ASC)",
      "For startups: elect to apply credit against payroll taxes on Form 6765",
      "Maintain contemporaneous documentation of research activities",
      "Note: Section 174 requires amortization of R&E expenses over 5 years (domestic) or 15 years (foreign)",
    ],
  },
  {
    id: "opportunity-zone",
    name: "Qualified Opportunity Zone Deferral",
    category: "investment",
    description:
      "Defer and potentially reduce capital gains taxes by investing in designated Qualified Opportunity Zones. After holding the QOZ investment for 10+ years, any appreciation on the QOZ investment itself is tax-free. Ideal for taxpayers with significant realized capital gains.",
    potentialSavings: "$20,000 - $500,000+",
    ircReference: "IRC Section 1400Z-2",
    applicableTo: ["Individual", "S-Corp", "LLC", "C-Corp", "Partnership", "Trust"],
    riskLevel: "high",
    steps: [
      "Realize a capital gain from the sale of an asset",
      "Invest the gain amount into a Qualified Opportunity Fund within 180 days",
      "Ensure the QOF maintains at least 90% of assets in qualified OZ property",
      "Hold the investment for at least 10 years to exclude all appreciation from tax",
      "File Form 8949 and Form 8997 to report the deferral election",
      "Work with AG FinTax to identify vetted QOZ investment opportunities",
    ],
  },
  {
    id: "scorp-election",
    name: "S-Corp Election for Self-Employed",
    category: "business",
    description:
      "Elect S-Corporation status to split business income into salary (subject to FICA/Medicare at 15.3%) and distributions (not subject to self-employment tax). The reasonable compensation must be defensible, but savings on the distribution portion can be significant.",
    potentialSavings: "$5,000 - $50,000+",
    ircReference: "IRC Section 1362; Rev. Rul. 74-44",
    applicableTo: ["LLC", "Sole Proprietor"],
    riskLevel: "low",
    steps: [
      "Evaluate if net business income exceeds $50,000-$60,000 (typical break-even point)",
      "File Form 2553 to elect S-Corp status (due by March 15 for current year, or within 75 days of formation)",
      "Establish reasonable compensation based on industry standards, role, and experience",
      "Set up payroll and run regular paychecks for shareholder-employees",
      "Take remaining profits as shareholder distributions (not subject to SE tax)",
      "Ensure compliance with single class of stock and eligible shareholder requirements",
    ],
  },
  {
    id: "solo-401k-backdoor-roth",
    name: "Solo 401(k) + Backdoor Roth",
    category: "individual",
    description:
      "Maximize retirement savings with a Solo 401(k) allowing up to $69,000 in total contributions for 2025 ($76,500 if age 50+). Combine with a Backdoor Roth IRA strategy for high-income earners to convert after-tax contributions into tax-free Roth growth.",
    potentialSavings: "$15,000 - $75,000+",
    ircReference: "IRC Section 401(k); IRC Section 408A (Roth IRA)",
    applicableTo: ["Sole Proprietor", "LLC", "S-Corp", "Individual"],
    riskLevel: "low",
    steps: [
      "Establish a Solo 401(k) plan before December 31 of the tax year",
      "Make employee elective deferrals up to $23,500 (2025) plus $7,500 catch-up if age 50+",
      "Make employer profit-sharing contributions up to 25% of net self-employment income",
      "For Backdoor Roth: contribute $7,000 ($8,000 if 50+) to a traditional IRA (non-deductible)",
      "Convert the traditional IRA to Roth IRA (ensure no existing pre-tax IRA balances to avoid pro-rata rule)",
      "Consider Mega Backdoor Roth if Solo 401(k) plan allows after-tax contributions and in-plan conversions",
    ],
  },
  {
    id: "augusta-rule",
    name: "Augusta Rule (Section 280A)",
    category: "business",
    description:
      "Rent your personal residence to your own business for up to 14 days per year and exclude the rental income from your personal tax return. The business gets a deduction for the rental expense at fair market value. Ideal for home-based business owners.",
    potentialSavings: "$2,000 - $20,000",
    ircReference: "IRC Section 280A(g)",
    applicableTo: ["S-Corp", "C-Corp", "LLC", "Partnership"],
    riskLevel: "medium",
    steps: [
      "Determine fair market rental value of your home for event/meeting space (get comparable rates)",
      "Document legitimate business use (board meetings, team retreats, client events, strategic planning sessions)",
      "Limit usage to 14 days or fewer per tax year",
      "Create a formal rental agreement between you and your business entity",
      "Business entity pays rent and deducts it as ordinary business expense",
      "Exclude the rental income on your personal return (do not report on Schedule E)",
      "Maintain detailed records of dates, business purpose, and attendees",
    ],
  },
  {
    id: "tax-loss-harvesting",
    name: "Tax-Loss Harvesting",
    category: "investment",
    description:
      "Strategically sell investments at a loss to offset capital gains and reduce taxable income. Up to $3,000 in net capital losses can be deducted against ordinary income annually, with unlimited carryforward. Reinvest in similar (but not substantially identical) securities to maintain market exposure.",
    potentialSavings: "$3,000 - $50,000+",
    ircReference: "IRC Section 1211; IRC Section 1091 (wash sale rule)",
    applicableTo: ["Individual", "Trust", "S-Corp", "LLC"],
    riskLevel: "low",
    steps: [
      "Review portfolio for positions with unrealized losses",
      "Identify gains to offset (short-term gains first, as they are taxed at higher ordinary rates)",
      "Sell loss positions before year-end to realize the loss",
      "Wait at least 31 days before repurchasing substantially identical securities (wash sale rule)",
      "Alternatively, immediately reinvest in a similar but not identical ETF or fund",
      "Track all losses and carryforwards on Schedule D and Form 8949",
      "Consider automated tax-loss harvesting through direct indexing strategies",
    ],
  },
  {
    id: "charitable-remainder-trust",
    name: "Charitable Remainder Trust",
    category: "estate",
    description:
      "Transfer appreciated assets into a Charitable Remainder Trust (CRT) to receive an income stream, an immediate charitable deduction, and avoidance of capital gains tax on the contributed assets. Remaining assets pass to a designated charity at the end of the trust term.",
    potentialSavings: "$25,000 - $250,000+",
    ircReference: "IRC Section 664",
    applicableTo: ["Individual", "Trust", "High Net Worth"],
    riskLevel: "medium",
    steps: [
      "Identify highly appreciated assets (stocks, real estate, business interests)",
      "Establish a CRAT (fixed annuity) or CRUT (percentage-based unitrust) with an irrevocable trust",
      "Transfer the appreciated assets into the CRT (no capital gains triggered on transfer)",
      "CRT sells the assets and reinvests the full proceeds (no capital gains tax at trust level)",
      "Receive annual income stream (5-50% of trust value for CRUT, fixed amount for CRAT)",
      "Claim an immediate partial charitable income tax deduction based on present value of remainder interest",
      "At trust termination, remaining assets transfer to designated charity",
    ],
  },
  {
    id: "salt-pte-workaround",
    name: "SALT Cap Workaround via PTE Election",
    category: "business",
    description:
      "Bypass the $40,000 SALT (State and Local Tax) deduction cap by making a Pass-Through Entity tax election. The business pays state income tax at the entity level (fully deductible against federal income) and owners receive a credit or deduction on their state return. Now available in 36+ states.",
    potentialSavings: "$5,000 - $100,000+",
    ircReference: "IRC Section 164(b)(6); IRS Notice 2020-75",
    applicableTo: ["S-Corp", "LLC", "Partnership"],
    riskLevel: "low",
    steps: [
      "Confirm your state offers a PTE tax election (available in CA, NY, NJ, IL, GA, TX, and 30+ others)",
      "Evaluate whether the election is beneficial based on your state tax rate and SALT cap impact",
      "File the PTE election with your state by the required deadline (varies by state)",
      "Business entity pays state income tax at the entity level",
      "Deduct the full PTE tax payment as a business expense on the federal return",
      "Owners claim a credit or deduction on their individual state tax returns",
      "Coordinate with AG FinTax to ensure proper multi-state compliance",
    ],
  },
  {
    id: "bonus-depreciation",
    name: "Bonus Depreciation (100%)",
    category: "business",
    description:
      "Deduct 100% of the cost of qualifying business assets in the first year they are placed in service. Restored to 100% for 2025 under the One Big Beautiful Bill Act (was phasing down from 80% in 2023). Applies to new and used property with a recovery period of 20 years or less.",
    potentialSavings: "$10,000 - $500,000+",
    ircReference: "IRC Section 168(k)",
    applicableTo: ["S-Corp", "LLC", "C-Corp", "Sole Proprietor", "Partnership"],
    riskLevel: "low",
    steps: [
      "Identify qualifying property (equipment, vehicles, machinery, furniture, certain improvements)",
      "Ensure property has a MACRS recovery period of 20 years or less",
      "Place the property in service during the 2025 tax year",
      "Elect 100% bonus depreciation on Form 4562 (automatic unless you opt out)",
      "For listed property (vehicles), apply applicable luxury auto limits",
      "Consider timing of purchases to maximize current-year deductions",
      "Evaluate interaction with Section 179 expensing for optimal tax benefit",
    ],
  },
  {
    id: "hsa-triple-tax",
    name: "HSA Triple Tax Advantage",
    category: "individual",
    description:
      "Health Savings Accounts offer a unique triple tax benefit: tax-deductible contributions, tax-free investment growth, and tax-free withdrawals for qualified medical expenses. With 2025 enhancements, HSAs now cover gym memberships and nutrition programs. After age 65, withdrawals for any purpose are taxed like a traditional IRA.",
    potentialSavings: "$2,000 - $15,000",
    ircReference: "IRC Section 223",
    applicableTo: ["Individual", "Sole Proprietor", "S-Corp", "LLC"],
    riskLevel: "low",
    steps: [
      "Enroll in a High Deductible Health Plan (HDHP) with minimum deductible of $1,650 (self) / $3,300 (family) for 2025",
      "Contribute up to $4,350 (self) / $8,750 (family) for 2025, plus $1,000 catch-up if age 55+",
      "Invest HSA funds in index funds or growth investments for long-term tax-free compounding",
      "Pay current medical expenses out-of-pocket and save receipts for future tax-free reimbursement",
      "After age 65, use HSA as a supplemental retirement account (non-medical withdrawals taxed as ordinary income)",
      "For S-Corp shareholders: HSA contributions must be reported on W-2 (not pre-tax via payroll)",
    ],
  },
  {
    id: "real-estate-professional",
    name: "Real Estate Professional Status",
    category: "individual",
    description:
      "Qualify as a Real Estate Professional to deduct rental real estate losses against ordinary income without the $25,000 passive activity limitation. Requires spending 750+ hours and more than half of personal service time in real property trades or businesses. Extremely valuable for high-income earners with rental losses.",
    potentialSavings: "$25,000 - $200,000+",
    ircReference: "IRC Section 469(c)(7); Treasury Reg. 1.469-9",
    applicableTo: ["Individual", "LLC", "Partnership"],
    riskLevel: "high",
    steps: [
      "Meet the 750-hour test: spend at least 750 hours in real property trades or businesses during the year",
      "Meet the more-than-half test: real estate hours must exceed hours in all other trades or businesses",
      "Maintain a detailed contemporaneous time log (critical for audit defense)",
      "Make the election to aggregate all rental real estate activities (or treat each separately)",
      "Materially participate in each rental activity (or aggregate and meet material participation tests)",
      "Combine with cost segregation study for maximum depreciation deductions",
      "File appropriate elections and disclosures with your tax return",
    ],
  },
  {
    id: "entity-stacking",
    name: "Entity Stacking Strategy",
    category: "business",
    description:
      "Use multiple entities in a coordinated structure to maximize deductions, limit liability, and optimize tax treatment. Typically involves an operating company (S-Corp), a holding company or management company (LLC), and a real estate holding entity. Each entity serves a specific tax and liability purpose.",
    potentialSavings: "$10,000 - $100,000+",
    ircReference: "IRC Sections 1362, 721, 351; Treasury Reg. 1.701-2",
    applicableTo: ["S-Corp", "LLC", "C-Corp", "Partnership"],
    riskLevel: "medium",
    steps: [
      "Establish an S-Corp as the primary operating entity for active business income",
      "Create a separate LLC to hold real estate and lease it back to the operating entity",
      "Consider a management company LLC to provide services and create additional QBI deductions",
      "Set up proper inter-company agreements with arm's-length terms",
      "Ensure each entity has legitimate business purpose and economic substance",
      "Maintain separate books, bank accounts, and records for each entity",
      "Review annually with AG FinTax to optimize structure based on changing income and tax law",
    ],
  },
  {
    id: "installment-sales",
    name: "Installment Sales (Section 453)",
    category: "investment",
    description:
      "Spread the recognition of gain from the sale of an asset over multiple tax years by receiving payments in installments. This can keep the seller in lower tax brackets, defer capital gains, and potentially avoid the 3.8% Net Investment Income Tax in certain years. Particularly useful for selling real estate or businesses.",
    potentialSavings: "$10,000 - $200,000+",
    ircReference: "IRC Section 453",
    applicableTo: ["Individual", "LLC", "S-Corp", "Partnership", "Trust"],
    riskLevel: "low",
    steps: [
      "Structure the sale agreement with payments spread over 2 or more tax years",
      "Calculate the gross profit ratio (gain / contract price) to determine taxable portion of each payment",
      "Report the installment sale on Form 6252 each year payments are received",
      "Charge adequate stated interest (at least the AFR) to avoid imputed interest rules",
      "Consider the impact on your overall tax bracket in each year of payment receipt",
      "Evaluate whether the installment method is more beneficial than electing out to recognize all gain currently",
      "Secure the installment obligation with appropriate collateral or guarantees",
    ],
  },
];
