"""
Generate AG FinTax Tax Strategies Knowledge Base PDF
Based on Corvée 2024 Tax Strategies Masterclass + AgFinTax Smart Plan Engine
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable
)

# ===========================================================================
# Strategy Data — All 30 strategies from the codebase
# ===========================================================================

STRATEGIES = [
    # --- RETIREMENT ---
    {
        "id": "traditional_401k_max",
        "title": "Traditional 401(k) Maximization",
        "category": "Retirement",
        "description": "Maximize pre-tax 401(k) contributions to reduce current-year taxable income. The 2025 employee deferral limit is $23,500 ($31,000 if age 50+, or $34,750 for ages 60-63 with the new super catch-up). Contributions grow tax-deferred until withdrawal in retirement.",
        "eligibility": [
            "Employee of a company that offers a 401(k) plan, or self-employed with a Solo 401(k)",
            "Earned income at least equal to the contribution amount",
            "Under the annual deferral limit ($23,500 / $31,000 catch-up / $34,750 super catch-up ages 60-63)",
        ],
        "implementation": [
            "Review current 401(k) contribution rate with payroll or plan administrator",
            "Increase deferral percentage to reach the $23,500 annual limit",
            "If age 50+, add the $7,500 catch-up contribution (ages 60-63: $11,250 super catch-up)",
            "Evaluate employer match and ensure contributions capture the full match",
            "Confirm investments align with retirement timeline and risk tolerance",
        ],
        "tax_filing": "Reported on Form W-2 Box 12 Code D; reduces Box 1 taxable wages. Not separately claimed on Form 1040.",
        "irc_reference": "IRC Section 401(k); IRC Section 402(g) (deferral limits)",
        "entity_types": ["Individual", "S-Corp", "C-Corp", "Partnership"],
        "income_threshold": "$50,000+",
        "savings_range": "$4,700 - $12,400",
        "savings_formula": "contribution_amount x marginal_tax_rate",
        "risk_level": "Low",
        "time_to_implement": "1-2 weeks",
        "qualification_questions": [
            "Does your employer offer a 401(k) plan?",
            "Are you currently contributing the maximum allowed?",
            "Are you age 50 or older (catch-up eligible)?",
        ],
    },
    {
        "id": "roth_401k_strategy",
        "title": "Roth 401(k) Strategy",
        "category": "Retirement",
        "description": "Contribute after-tax dollars to a Roth 401(k) for tax-free growth and tax-free qualified withdrawals in retirement. Optimal when your current tax rate is lower than your expected retirement tax rate, or for tax diversification.",
        "eligibility": [
            "Employer plan offers a Roth 401(k) option",
            "Earned income sufficient to cover contributions",
            "Expect to be in the same or higher tax bracket in retirement",
        ],
        "implementation": [
            "Confirm Roth 401(k) availability with plan administrator",
            "Evaluate current vs. projected retirement tax bracket",
            "Designate all or a portion of deferrals as Roth contributions",
            "Continue capturing employer match (employer match is always pre-tax)",
            "Consider splitting contributions between traditional and Roth for diversification",
        ],
        "tax_filing": "Reported on Form W-2 Box 12 Code AA. Contributions do NOT reduce Box 1 taxable wages. Qualified distributions are tax-free.",
        "irc_reference": "IRC Section 402A",
        "entity_types": ["Individual", "S-Corp", "C-Corp", "Partnership"],
        "income_threshold": "$50,000+",
        "savings_range": "$3,000 - $15,000",
        "savings_formula": "projected_retirement_withdrawals x (retirement_rate - current_rate)",
        "risk_level": "Low",
        "time_to_implement": "1-2 weeks",
        "qualification_questions": [
            "Does your employer offer a Roth 401(k) option?",
            "Do you expect your tax rate to be the same or higher in retirement?",
            "Do you want tax diversification across retirement accounts?",
        ],
    },
    {
        "id": "cash_balance_plan",
        "title": "Cash Balance Pension Plan",
        "category": "Retirement",
        "description": "A defined-benefit plan that allows high-income business owners and professionals to contribute $200,000+ per year on a tax-deductible basis, far exceeding 401(k) limits. Ideal for those over 40 with consistent high income.",
        "eligibility": [
            "Business owner, partner, or self-employed professional",
            "Consistent high income ($250,000+) expected for at least 5-7 years",
            "Willing to fund contributions for all eligible employees (if any)",
            "Typically age 40+ to maximize contribution limits (actuarially determined)",
        ],
        "implementation": [
            "Engage a third-party actuary to design the plan and calculate contributions",
            "Adopt the plan document before the fiscal year end",
            "Often paired with a 401(k) profit-sharing plan for maximum deferral",
            "Make required annual contributions (mandatory once established)",
            "File Form 5500 annually; maintain plan compliance",
        ],
        "tax_filing": "Employer deduction on Schedule C (sole prop), Form 1120-S (S-Corp), or Form 1065 (partnership). Reported on Form 5500 annually.",
        "irc_reference": "IRC Section 401(a); IRC Section 404(a)(1)",
        "entity_types": ["Sole Prop", "S-Corp", "C-Corp", "Partnership"],
        "income_threshold": "$250,000+",
        "savings_range": "$50,000 - $100,000",
        "savings_formula": "annual_contribution x marginal_tax_rate",
        "risk_level": "Medium",
        "time_to_implement": "2-3 months",
        "qualification_questions": [
            "Is your annual income consistently above $250,000?",
            "Are you a business owner or self-employed professional?",
            "Are you age 40 or older?",
            "Can you commit to funding the plan for at least 5 years?",
        ],
    },
    {
        "id": "sep_ira",
        "title": "SEP IRA",
        "category": "Retirement",
        "description": "Simplified Employee Pension IRA allows self-employed individuals and small business owners to contribute up to 25% of net self-employment income, max $70,000 for 2025. Easy to set up, no annual filing requirements.",
        "eligibility": [
            "Self-employed or business owner with few or no employees",
            "If employees exist, must contribute the same percentage for all eligible employees",
            "Earned income from self-employment or business compensation",
        ],
        "implementation": [
            "Open a SEP IRA account at a brokerage or financial institution",
            "Complete IRS Form 5305-SEP (plan adoption agreement)",
            "Calculate 25% of net self-employment income (after the SE tax deduction)",
            "Make contributions by the tax filing deadline (including extensions)",
            "No annual Form 5500 filing required",
        ],
        "tax_filing": "Deducted on Schedule 1 (Form 1040), Line 16. Reduces AGI directly.",
        "irc_reference": "IRC Section 408(k)",
        "entity_types": ["Sole Prop", "S-Corp", "C-Corp", "Partnership"],
        "income_threshold": "$50,000+",
        "savings_range": "$5,000 - $25,000",
        "savings_formula": "min(net_income x 0.25, $70,000) x marginal_tax_rate",
        "risk_level": "Low",
        "time_to_implement": "1-2 weeks",
        "qualification_questions": [
            "Are you self-employed or a small business owner?",
            "Do you have employees (other than yourself)?",
            "Do you currently have a retirement plan?",
        ],
    },
    {
        "id": "solo_401k",
        "title": "Solo 401(k)",
        "category": "Retirement",
        "description": "Designed for self-employed individuals with no full-time employees. Combines employee deferrals ($23,500) with employer profit-sharing (25% of compensation), allowing total contributions up to $70,000 ($77,500 if 50+) for 2025. Offers both traditional and Roth options.",
        "eligibility": [
            "Self-employed with no full-time W-2 employees (spouse can participate)",
            "Earned income from the business",
            "Plan must be established by December 31 of the tax year",
        ],
        "implementation": [
            "Establish the Solo 401(k) plan with a provider by December 31",
            "Make employee deferral contributions by December 31",
            "Make employer profit-sharing contributions by tax filing deadline",
            "Choose traditional, Roth, or split contributions",
            "File Form 5500-EZ if plan assets exceed $250,000",
        ],
        "tax_filing": "Employee deferrals reduce self-employment income. Employer contributions deducted on Schedule C or Form 1120-S. Form 5500-EZ when assets exceed $250,000.",
        "irc_reference": "IRC Section 401(k); Revenue Ruling 2004-12",
        "entity_types": ["Sole Prop", "S-Corp", "Partnership"],
        "income_threshold": "$40,000+",
        "savings_range": "$8,000 - $28,000",
        "savings_formula": "(employee_deferral + employer_contribution) x marginal_tax_rate",
        "risk_level": "Low",
        "time_to_implement": "2-4 weeks",
        "qualification_questions": [
            "Are you self-employed or a single-member business owner?",
            "Do you have any full-time employees (other than a spouse)?",
            "Do you want both traditional and Roth contribution options?",
        ],
    },
    # --- COMPENSATION ---
    {
        "id": "reasonable_compensation_scorp",
        "title": "Reasonable Compensation (S-Corp)",
        "category": "Compensation",
        "description": "S-Corp shareholders who are also employees must pay themselves a reasonable salary, but only that salary is subject to FICA payroll taxes (15.3%). Remaining profits distributed as shareholder distributions avoid FICA. Setting the right salary saves thousands annually.",
        "eligibility": [
            "Active shareholder-employee of an S-Corporation",
            "Business has net income above a reasonable salary amount",
            "Salary must be defensible as reasonable for the work performed",
        ],
        "implementation": [
            "Obtain description of services performed by business owner/shareholder employee",
            "Perform a 'market approach' analysis using RCReports.com to determine reasonableness",
            "Adjust compensation based on the market approach analysis",
            "Set up payroll (Gusto, ADP) and pay regular W-2 wages at the determined amount",
            "Distribute remaining profits as shareholder distributions (Schedule K-1)",
            "Store market approach analysis, job description, and salary confirmation for recordkeeping",
        ],
        "tax_filing": "S-Corp: wages on Form 1040 Line 1, deduction on Form 1120-S Line 8, K-1 Line 1. C-Corp: Form 1120 Line 12 (officer compensation), Form 1125-E. Partnership: guaranteed payments on Form 1065 Line 10.",
        "irc_reference": "IRC Section 1366; IRC Section 1368; Revenue Ruling 74-44",
        "entity_types": ["S-Corp"],
        "income_threshold": "$60,000+",
        "savings_range": "$5,000 - $30,000",
        "savings_formula": "(net_income - reasonable_salary) x 0.153",
        "risk_level": "Medium",
        "time_to_implement": "2-4 weeks",
        "qualification_questions": [
            "Is your business structured as an S-Corporation?",
            "Are you an active shareholder-employee?",
            "What is your current salary vs. business net income?",
        ],
    },
    {
        "id": "self_employed_health_insurance",
        "title": "Self-Employed Health Insurance Deduction",
        "category": "Compensation",
        "description": "Self-employed individuals (including S-Corp >2% shareholders) can deduct 100% of health, dental, and vision insurance premiums for themselves, their spouse, and dependents. This is an above-the-line deduction that reduces AGI directly.",
        "eligibility": [
            "Self-employed with net profit, or >2% S-Corp shareholder",
            "Not eligible for an employer-subsidized health plan",
            "Premiums paid for health, dental, vision, or long-term care insurance",
            "Deduction cannot exceed net self-employment income",
        ],
        "implementation": [
            "Purchase health insurance through individual market or healthcare.gov",
            "Verify no eligibility for an employer-subsidized health plan",
            "For S-Corp >2% shareholders: premiums must be paid by the corporation and included in W-2 wages",
            "Track all qualifying premium payments",
            "Report on Schedule 1 (Form 1040), Part II, Line 17",
        ],
        "tax_filing": "Deducted on Form 1040, Schedule 1, Part II, Line 17. For S-Corp >2% shareholders, premiums included in W-2 Box 1 but excluded from Box 3 and Box 5 (not subject to FICA).",
        "irc_reference": "IRC Section 162(l)",
        "entity_types": ["Sole Prop", "S-Corp", "Partnership"],
        "income_threshold": "$30,000+",
        "savings_range": "$2,000 - $8,000",
        "savings_formula": "annual_premiums x marginal_tax_rate",
        "risk_level": "Low",
        "time_to_implement": "1 week",
        "qualification_questions": [
            "Are you self-employed or an S-Corp >2% shareholder?",
            "Are you eligible for a subsidized employer health plan through any source?",
            "How much do you pay annually in health/dental/vision premiums?",
        ],
    },
    {
        "id": "accountable_plan",
        "title": "Accountable Plan",
        "category": "Compensation",
        "description": "An accountable plan allows a business to reimburse employees (including owner-employees) for legitimate business expenses tax-free. Reimbursements are not included in employee income and are fully deductible by the business. Covers home office, travel, meals, and out-of-pocket expenses.",
        "eligibility": [
            "Business with W-2 employees (including owner-employees of S-Corps or C-Corps)",
            "Plan must have business connection, adequate accounting, and return of excess reimbursements",
            "Expenses must be ordinary and necessary business expenses",
        ],
        "implementation": [
            "Draft a written accountable plan document with the three IRS requirements",
            "Establish expense reporting procedures (receipts, business purpose, dates)",
            "Employees submit expense reports within 60 days of the expense",
            "Excess reimbursements returned within 120 days",
            "Reimburse qualifying expenses through payroll (not subject to FICA or income tax)",
        ],
        "tax_filing": "Reimbursements NOT reported on employee W-2. Business deducts as 'Employee Benefit Programs': Form 1120-S Line 18, Form 1120 Line 24, Form 1065 Line 19. Schedule C Line 14. See IRS Publication 15-B.",
        "irc_reference": "IRC Section 62(c); Treasury Regulation Section 1.62-2",
        "entity_types": ["S-Corp", "C-Corp", "Partnership"],
        "income_threshold": "Any",
        "savings_range": "$2,000 - $10,000",
        "savings_formula": "reimbursed_expenses x (marginal_tax_rate + FICA_rate)",
        "risk_level": "Low",
        "time_to_implement": "1-2 weeks",
        "qualification_questions": [
            "Does your business have W-2 employees?",
            "Do you or employees incur out-of-pocket business expenses?",
            "Do you currently have a written reimbursement policy?",
        ],
    },
    # --- FAMILY ---
    {
        "id": "hiring_children",
        "title": "Hiring Children in the Family Business",
        "category": "Family",
        "description": "Employ children under age 18 in a sole proprietorship or spousal partnership. Wages are exempt from FICA, and each child can earn up to the standard deduction ($15,000 for 2025) tax-free. The business gets a full deduction.",
        "eligibility": [
            "Business structured as a sole proprietorship or partnership owned entirely by parents",
            "Child under age 18 for FICA exemption (under 21 for FUTA exemption)",
            "Child performs legitimate services appropriate for their age",
            "Wages must be reasonable for the work performed",
        ],
        "implementation": [
            "Build job description for each child (Workable.com templates)",
            "Assess fair market wage (salary.com/research/salary)",
            "Track hours and job duties (TSheets or equivalent)",
            "Craft employment memo/agreement outlining duties and salary",
            "Complete IRS Form W-4 and Form I-9",
            "Establish separate bank account for each child",
            "Pay wages with proper withholding; no FICA for under 18 in sole prop/spousal partnership",
            "Provide pay stubs, file child's return, complete payroll forms (940/941/W-2/W-3/SUTA)",
        ],
        "tax_filing": "Business deducts wages on Schedule C (sole prop) or Form 1065 (partnership). Child receives W-2. No FICA for children under 18. No FUTA for under 21. Child's income sheltered by $15,000 standard deduction (2025).",
        "irc_reference": "IRC Section 3121(b)(3)(A) (FICA exemption); IRC Section 3306(c)(5) (FUTA exemption)",
        "entity_types": ["Sole Prop", "Partnership"],
        "income_threshold": "Any",
        "savings_range": "$4,000 - $12,000",
        "savings_formula": "wages_per_child x (parent_marginal_rate + 0.153)",
        "risk_level": "Low",
        "time_to_implement": "1-2 weeks",
        "qualification_questions": [
            "Do you have children under age 18?",
            "Is your business a sole proprietorship or spousal partnership?",
            "Can your children perform legitimate work for the business?",
        ],
    },
    {
        "id": "family_management_company",
        "title": "Family Office Management Company",
        "category": "Family",
        "description": "Create a family management company to centralize administrative, financial, and management services for family-owned businesses and investments. Allows legitimate business deductions for shared services, office space, and professional development.",
        "eligibility": [
            "Family with multiple business entities or significant investment holdings",
            "Genuine management and administrative services provided across entities",
            "Formal management agreements with arm's-length fees",
        ],
        "implementation": [
            "Create FMC entity (Schedule C or C-Corp) with attorney",
            "Build job descriptions for family members; assess fair market wages",
            "Track hours and duties; craft employment agreements",
            "Complete W-4 and I-9 for each employee; set up payroll",
            "Craft management services agreement between FMC and main company",
            "Track services, submit invoices, receive payment from main company",
        ],
        "tax_filing": "FMC files Schedule C or Form 1120/1120-S. Management fees are income to FMC and deductions to paying entities. File 1099 between entities.",
        "irc_reference": "IRC Section 162; IRC Section 482 (arm's length requirement)",
        "entity_types": ["S-Corp", "C-Corp", "Partnership"],
        "income_threshold": "$300,000+",
        "savings_range": "$10,000 - $50,000",
        "savings_formula": "centralized_deductions x marginal_tax_rate",
        "risk_level": "Medium",
        "time_to_implement": "1-3 months",
        "qualification_questions": [
            "Does your family own multiple businesses or substantial investments?",
            "Are management services shared across entities?",
            "Would centralizing expenses create efficiency and documentation?",
        ],
    },
    {
        "id": "merp_section_125",
        "title": "MERP / Section 125 Cafeteria Plan",
        "category": "Family",
        "description": "A Section 105 MERP allows a C-Corp to reimburse employees for medical expenses tax-free. A Section 125 Cafeteria Plan allows employees to pay health premiums with pre-tax dollars. For S-Corp >2% shareholders, an ICHRA or QSEHRA may be more appropriate.",
        "eligibility": [
            "C-Corp or eligible employer with W-2 employees",
            "Formal written plan document in place",
            "Plan must not discriminate in favor of highly compensated employees",
        ],
        "implementation": [
            "Determine best plan type: MERP (Section 105), Section 125, ICHRA, or QSEHRA",
            "Draft and adopt a written plan document",
            "Communicate plan terms to all eligible employees",
            "Employees submit qualified medical expenses for reimbursement",
            "Employer reimburses and deducts as business expense",
        ],
        "tax_filing": "Reimbursements excluded from employee W-2 income (Section 105). Employer deducts reimbursements. Section 125 premiums reduce W-2 Box 1, 3, and 5.",
        "irc_reference": "IRC Section 105 (MERP); IRC Section 125 (Cafeteria Plans); IRC Section 9831 (QSEHRA)",
        "entity_types": ["C-Corp", "S-Corp", "Partnership"],
        "income_threshold": "Any",
        "savings_range": "$2,000 - $15,000",
        "savings_formula": "medical_expenses_reimbursed x (marginal_tax_rate + FICA_rate)",
        "risk_level": "Low",
        "time_to_implement": "2-4 weeks",
        "qualification_questions": [
            "What is your business entity type?",
            "Do you have significant out-of-pocket medical expenses?",
            "Do you have W-2 employees beyond yourself?",
        ],
    },
    # --- REAL ESTATE ---
    {
        "id": "1031_exchange",
        "title": "1031 Like-Kind Exchange",
        "category": "Real Estate",
        "description": "Defer capital gains tax when selling investment or business property by exchanging for like-kind property. No limit on the number of exchanges or amount deferred. Tax deferral can last indefinitely or until death (stepped-up basis).",
        "eligibility": [
            "Property sold must be held for investment or business use",
            "Replacement property must be like-kind (real property for real property)",
            "Must use a Qualified Intermediary (cannot touch proceeds)",
            "45-day identification period and 180-day closing deadline",
        ],
        "implementation": [
            "Engage a Qualified Intermediary before closing the sale",
            "Close the sale; proceeds go to the QI",
            "Identify up to 3 replacement properties within 45 days",
            "Close on the replacement property within 180 days",
            "Acquire property of equal or greater value to defer 100% of gain",
            "File Form 8824 with the tax return",
        ],
        "tax_filing": "File Form 8824 (Like-Kind Exchanges). No gain recognized if fully deferred. Basis of new property is adjusted (carryover basis).",
        "irc_reference": "IRC Section 1031",
        "entity_types": ["Individual", "Sole Prop", "S-Corp", "C-Corp", "Partnership"],
        "income_threshold": "$100,000+",
        "savings_range": "$15,000 - $200,000",
        "savings_formula": "capital_gain x (federal_capital_gains_rate + state_rate)",
        "risk_level": "Medium",
        "time_to_implement": "1-6 months (tied to transaction)",
        "qualification_questions": [
            "Are you selling investment or business real estate?",
            "Do you plan to reinvest in like-kind real property?",
            "Can you meet the 45-day identification and 180-day closing deadlines?",
        ],
    },
    {
        "id": "cost_segregation",
        "title": "Cost Segregation Study",
        "category": "Real Estate",
        "description": "Reclassifies building components (flooring, electrical, plumbing, site improvements) into shorter depreciation lives (5, 7, or 15 years vs. 27.5 or 39 years). Combined with 100% bonus depreciation (restored for 2025), this generates massive first-year deductions.",
        "eligibility": [
            "Own commercial or residential rental property with cost basis of $500,000+",
            "Property recently acquired, built, or renovated",
            "Study must be performed by a qualified engineering firm",
        ],
        "implementation": [
            "Engage a qualified cost segregation engineering firm (e.g., KBKG)",
            "Firm performs detailed analysis of the property and its components",
            "Reclassified assets assigned to 5-year, 7-year, or 15-year MACRS lives",
            "Apply 100% bonus depreciation to short-life assets",
            "File Form 3115 if applying to previously placed-in-service property",
        ],
        "tax_filing": "Depreciation reported on Form 4562. Form 3115 required for look-back studies on existing property.",
        "irc_reference": "IRC Section 168; IRC Section 168(k) (bonus depreciation)",
        "entity_types": ["Individual", "Sole Prop", "S-Corp", "C-Corp", "Partnership"],
        "income_threshold": "$150,000+",
        "savings_range": "$20,000 - $150,000",
        "savings_formula": "reclassified_basis x bonus_depreciation_pct x marginal_tax_rate",
        "risk_level": "Low",
        "time_to_implement": "4-8 weeks",
        "qualification_questions": [
            "Do you own commercial or rental real estate worth $500,000+?",
            "Was the property recently acquired, constructed, or renovated?",
            "Have you already performed a cost segregation study?",
        ],
    },
    {
        "id": "real_estate_professional",
        "title": "Real Estate Professional Status (REPS)",
        "category": "Real Estate",
        "description": "Qualifying as a Real Estate Professional allows deducting rental losses against all other income without the $25,000 passive activity limitation. Must spend 750+ hours AND more than half your working time in real property trades or businesses.",
        "eligibility": [
            "More than 750 hours per year in real property trades or businesses",
            "More than half of total working hours in real property activities",
            "Material participation in each rental activity (or elect to aggregate)",
            "Detailed contemporaneous time log is essential",
        ],
        "implementation": [
            "Maintain a detailed time log of all real estate activities",
            "Ensure 750+ hours AND majority-of-time tests are met",
            "Elect to aggregate all rental activities by attaching statement to return",
            "Materially participate in rental activities (500+ hours or facts and circumstances test)",
            "Claim rental losses as non-passive on Schedule E and Form 8582",
        ],
        "tax_filing": "Rental income/loss on Schedule E. Form 8582 for non-passive treatment. Aggregation election attached to return.",
        "irc_reference": "IRC Section 469(c)(7); Treasury Regulation 1.469-9",
        "entity_types": ["Individual", "Sole Prop", "S-Corp", "Partnership"],
        "income_threshold": "$100,000+",
        "savings_range": "$10,000 - $100,000",
        "savings_formula": "rental_losses x marginal_tax_rate",
        "risk_level": "High",
        "time_to_implement": "Ongoing (maintained all year)",
        "qualification_questions": [
            "Do you spend 750+ hours per year on real estate activities?",
            "Is real estate your primary profession (more than half your working time)?",
            "Do you have rental losses being limited by passive activity rules?",
        ],
    },
    {
        "id": "installment_sale",
        "title": "Installment Sale (Section 453)",
        "category": "Real Estate",
        "description": "Spread capital gains recognition over multiple years by receiving payments over time. Keeps seller in lower tax brackets and can reduce or avoid the 3.8% Net Investment Income Tax (NIIT).",
        "eligibility": [
            "Selling property at a gain (real estate, business assets, etc.)",
            "At least one payment received after the year of sale",
            "Cannot be used for publicly traded securities or dealer property",
        ],
        "implementation": [
            "Structure the sale with payments over 2+ tax years",
            "Determine gross profit ratio (gain / total contract price)",
            "Each payment split into return of basis, gain, and interest income",
            "Report using Form 6252 each year a payment is received",
            "Charge adequate stated interest (AFR minimum)",
        ],
        "tax_filing": "File Form 6252 (Installment Sale Income) each year. Interest on Schedule B.",
        "irc_reference": "IRC Section 453",
        "entity_types": ["Individual", "Sole Prop", "S-Corp", "C-Corp", "Partnership"],
        "income_threshold": "Any",
        "savings_range": "$5,000 - $75,000",
        "savings_formula": "total_gain x (lump_sum_rate - spread_rate)",
        "risk_level": "Medium",
        "time_to_implement": "Structured at time of sale",
        "qualification_questions": [
            "Are you selling property or business assets at a significant gain?",
            "Are you willing to receive payments over multiple years?",
            "Would spreading the gain keep you in a lower bracket?",
        ],
    },
    # --- DEPRECIATION ---
    {
        "id": "section_179",
        "title": "Section 179 Expensing",
        "category": "Depreciation",
        "description": "Immediately deduct the full cost of qualifying business assets (equipment, vehicles, furniture, software) in the year placed in service, up to $1,290,000 for 2025. Phases out when total purchases exceed $3,220,000.",
        "eligibility": [
            "Tangible personal property used in active conduct of a trade or business",
            "Property placed in service during the tax year",
            "Total purchases under $3,220,000 phase-out threshold",
            "Deduction limited to taxable income from the business",
        ],
        "implementation": [
            "Identify qualifying assets purchased and placed in service during the year",
            "Confirm total purchases under the phase-out threshold",
            "Elect Section 179 on Form 4562 for chosen assets",
            "Ensure deduction does not exceed active business taxable income",
            "Consider combining with bonus depreciation for amounts exceeding 179 limits",
        ],
        "tax_filing": "Elected on Form 4562 (Depreciation and Amortization), Part I.",
        "irc_reference": "IRC Section 179",
        "entity_types": ["Sole Prop", "S-Corp", "C-Corp", "Partnership"],
        "income_threshold": "Any",
        "savings_range": "$5,000 - $50,000",
        "savings_formula": "min(asset_cost, $1,290,000) x marginal_tax_rate",
        "risk_level": "Low",
        "time_to_implement": "At time of purchase / year-end",
        "qualification_questions": [
            "Did you purchase business equipment, vehicles, or software this year?",
            "Were the assets placed in service during the current tax year?",
            "What was the total cost of qualifying purchases?",
        ],
    },
    {
        "id": "bonus_depreciation",
        "title": "Bonus Depreciation (100%)",
        "category": "Depreciation",
        "description": "First-year 100% depreciation deduction on qualified assets (restored by OBBBA for 2025). Unlike Section 179, bonus depreciation can create a net operating loss and has no income limitation.",
        "eligibility": [
            "Qualified property with a MACRS recovery period of 20 years or less",
            "Property must be new or used (first use by the taxpayer)",
            "Placed in service during the tax year",
            "No phase-out based on total purchases",
        ],
        "implementation": [
            "Identify all qualifying assets placed in service during the year",
            "Calculate 100% bonus depreciation on the depreciable basis",
            "Remaining basis depreciated under normal MACRS schedules",
            "Can elect out on a class-by-class basis if desired",
            "Report on Form 4562, Part II",
        ],
        "tax_filing": "Reported on Form 4562, Part II. Automatic unless election out is made. Can create or increase a net operating loss.",
        "irc_reference": "IRC Section 168(k)",
        "entity_types": ["Sole Prop", "S-Corp", "C-Corp", "Partnership"],
        "income_threshold": "Any",
        "savings_range": "$3,000 - $40,000",
        "savings_formula": "asset_cost x bonus_pct x marginal_tax_rate",
        "risk_level": "Low",
        "time_to_implement": "At time of purchase / year-end",
        "qualification_questions": [
            "Did you acquire business assets this year?",
            "Are the assets new to your business (first use by you)?",
            "Do you want to accelerate depreciation deductions?",
        ],
    },
    # --- DEDUCTIONS ---
    {
        "id": "home_office",
        "title": "Home Office Deduction",
        "category": "Deductions",
        "description": "Deduct expenses for a portion of your home used regularly and exclusively for business. Regular method: actual expenses prorated by square footage. Simplified method: $5/sq ft up to 300 sq ft ($1,500 max).",
        "eligibility": [
            "Regular and exclusive use of a specific area for business",
            "Principal place of business, or used to meet clients regularly",
            "Self-employed (Schedule C) or statutory employee — W-2 employees cannot deduct (post-TCJA)",
        ],
        "implementation": [
            "Measure the square footage of the dedicated office space",
            "Calculate business-use percentage (office sq ft / total home sq ft)",
            "Choose regular method or simplified method",
            "For regular method: allocate mortgage interest, rent, insurance, utilities, repairs, depreciation",
            "Complete Form 8829 (regular method) or enter simplified deduction on Schedule C",
        ],
        "tax_filing": "Schedule C Line 30. Partnership: Schedule E Line 28. S-Corp/C-Corp: use Accountable Plan instead. Form 8829 for regular method.",
        "irc_reference": "IRC Section 280A(c); Revenue Procedure 2013-13",
        "entity_types": ["Sole Prop", "Partnership"],
        "income_threshold": "Any",
        "savings_range": "$500 - $5,000",
        "savings_formula": "home_office_deduction x marginal_tax_rate",
        "risk_level": "Low",
        "time_to_implement": "1 week",
        "qualification_questions": [
            "Do you have a dedicated space used exclusively for business?",
            "Is the space your principal place of business?",
            "Are you self-employed (not a W-2 employee)?",
        ],
    },
    {
        "id": "augusta_rule",
        "title": "Augusta Rule (Section 280A(g))",
        "category": "Deductions",
        "description": "Rent your personal residence to your business for up to 14 days per year. The rental income is completely tax-free (not reported on your return), while the business deducts the rent. Must be at fair market value with documented business purpose.",
        "eligibility": [
            "Own a personal residence",
            "Have a legitimate business that needs meeting or event space",
            "Rental limited to 14 days or fewer per year",
            "Fair market rental rate documented",
        ],
        "implementation": [
            "Plan meeting dates for the year (up to 14 days)",
            "Find comparable quotes for local venues (Peerspace.com, Liquidspace.com)",
            "Complete and sign a rental agreement (eforms.com)",
            "Document each occasion: date, business purpose, attendees, content",
            "Invoice the business and transfer rental fees",
            "Do NOT report the income (14-day exclusion)",
        ],
        "tax_filing": "Rental income excluded entirely under Section 280A(g). Business deducts: Schedule C Line 48/27a, Form 1120-S Line 19, Form 1120 Line 26, Form 1065 Line 20. Business files 1099 to individual.",
        "irc_reference": "IRC Section 280A(g)",
        "entity_types": ["Sole Prop", "S-Corp", "C-Corp", "Partnership"],
        "income_threshold": "$50,000+",
        "savings_range": "$2,000 - $10,000",
        "savings_formula": "daily_rate x rental_days x marginal_tax_rate",
        "risk_level": "Medium",
        "time_to_implement": "1-2 weeks",
        "qualification_questions": [
            "Do you own your personal residence?",
            "Does your business hold meetings, retreats, or events?",
            "Can you document a bona fide business purpose?",
        ],
    },
    {
        "id": "business_meals",
        "title": "Business Meals Deduction",
        "category": "Deductions",
        "description": "Deduct 50% of business meals where business is discussed with clients, prospects, or associates. Documentation must include date, amount, attendees, business purpose, and restaurant name.",
        "eligibility": [
            "Meal involves business discussion with a client, prospect, or associate",
            "Taxpayer or employee is present",
            "Meal is not lavish or extravagant",
            "Proper documentation maintained",
        ],
        "implementation": [
            "Maintain a system for documenting business meals in real time",
            "Record: date, restaurant name, amount, attendees, business purpose",
            "Keep receipts for all meals (best practice: keep all receipts)",
            "Categorize meals correctly in bookkeeping",
            "Report deductible portion on the applicable return",
        ],
        "tax_filing": "50% of qualifying meals: Schedule C Line 24b, Form 1120-S Line 19, Form 1120 Line 26, Form 1065 Line 20. See IRS Publication 463.",
        "irc_reference": "IRC Section 274(k); IRC Section 274(d)",
        "entity_types": ["Sole Prop", "S-Corp", "C-Corp", "Partnership", "Individual"],
        "income_threshold": "Any",
        "savings_range": "$500 - $5,000",
        "savings_formula": "annual_meal_expenses x 0.50 x marginal_tax_rate",
        "risk_level": "Low",
        "time_to_implement": "Immediate",
        "qualification_questions": [
            "Do you regularly have meals with clients or business associates?",
            "Do you currently track and document business meals?",
            "Approximately how much do you spend annually on business meals?",
        ],
    },
    {
        "id": "business_travel",
        "title": "Business Travel Deduction",
        "category": "Deductions",
        "description": "Deduct transportation, lodging, and 50% of meals while traveling away from your tax home for business. Travel must be primarily for business with overnight stay required.",
        "eligibility": [
            "Travel is away from your tax home (overnight stay required)",
            "Primary purpose of the trip is business",
            "Expenses are ordinary and necessary",
            "Adequate records maintained",
        ],
        "implementation": [
            "Plan trips with a documented primary business purpose",
            "Track all expenses: airfare, hotel, ground transportation, meals, Wi-Fi, tips",
            "For mixed trips: allocate travel days between business and personal",
            "Domestic travel: transportation fully deductible if trip is primarily business",
            "International travel: allocate transportation if personal days exceed 25%",
        ],
        "tax_filing": "Schedule C Line 24a (travel), Line 24b (meals at 50%). Form 1120-S/1120/1065: attach statement. Per diem rates per Publication 463.",
        "irc_reference": "IRC Section 162(a)(2); IRC Section 274",
        "entity_types": ["Sole Prop", "S-Corp", "C-Corp", "Partnership"],
        "income_threshold": "Any",
        "savings_range": "$1,000 - $10,000",
        "savings_formula": "annual_travel_expenses x marginal_tax_rate",
        "risk_level": "Low",
        "time_to_implement": "Immediate",
        "qualification_questions": [
            "Do you travel away from home overnight for business?",
            "How many business trips per year?",
            "Do you combine business and personal travel?",
        ],
    },
    {
        "id": "itemized_deduction_optimizer",
        "title": "Itemized Deduction Optimizer",
        "category": "Deductions",
        "description": "Maximize itemized deductions by strategically timing medical expenses (>7.5% AGI), mortgage interest, SALT ($40,000 cap for joint filers per OBBBA), and charitable contributions. Compare to standard deduction and bunch deductions into alternating years.",
        "eligibility": [
            "Total itemized deductions exceed the standard deduction, or can with bunching",
            "Components: medical (>7.5% AGI), mortgage interest, SALT, charitable",
        ],
        "implementation": [
            "Calculate total itemized deductions under current spending patterns",
            "If close to standard deduction, consider bunching",
            "Bunch charitable gifts and medical procedures into alternating years",
            "Prepay state/local taxes or property taxes (within SALT cap)",
            "Use a donor-advised fund for charitable bunching",
        ],
        "tax_filing": "Schedule A: Line 1 (medical), Line 5a-5e (SALT, capped at $40,000 joint per OBBBA), Line 8a (mortgage interest), Line 12-14 (charitable). Form 8283 for noncash >$500.",
        "irc_reference": "IRC Section 63; IRC Section 164 (SALT); IRC Section 163(h); IRC Section 170",
        "entity_types": ["Individual"],
        "income_threshold": "$75,000+",
        "savings_range": "$1,000 - $8,000",
        "savings_formula": "(itemized_total - standard_deduction) x marginal_tax_rate",
        "risk_level": "Low",
        "time_to_implement": "Year-end planning",
        "qualification_questions": [
            "Do you own a home with a mortgage?",
            "What are your annual state/local tax payments?",
            "Do you make significant charitable contributions?",
        ],
    },
    # --- CREDITS ---
    {
        "id": "child_tax_credit",
        "title": "Child Tax Credit",
        "category": "Credits",
        "description": "$2,000 per qualifying child under 17. Up to $1,700 refundable (Additional Child Tax Credit). Phases out at $200,000 AGI ($400,000 MFJ). Direct dollar-for-dollar reduction in tax liability.",
        "eligibility": [
            "Qualifying child under age 17",
            "Child has valid Social Security Number",
            "AGI below $200,000 (single) or $400,000 (MFJ) for full credit",
            "Child lived with you more than half the year",
        ],
        "implementation": [
            "Verify each child meets age, residency, and relationship tests",
            "Ensure each child has a valid SSN (ITIN does not qualify)",
            "Claim on Form 1040 using the Child Tax Credit Worksheet",
            "If credit exceeds tax liability, claim Additional CTC on Schedule 8812",
            "For higher incomes, calculate phase-out ($50 reduction per $1,000 over threshold)",
        ],
        "tax_filing": "Form 1040 Line 19 and Schedule 8812 Line 38. State credits in: CA, CO, CT, ID, ME, MD, MA, NJ, NM, NY, OK, VT.",
        "irc_reference": "IRC Section 24",
        "entity_types": ["Individual"],
        "income_threshold": "Up to $400,000 (MFJ)",
        "savings_range": "$2,000 - $8,000",
        "savings_formula": "number_of_children x $2,000",
        "risk_level": "Low",
        "time_to_implement": "At tax filing",
        "qualification_questions": [
            "How many children under age 17 do you have?",
            "What is your approximate AGI?",
            "Do all children have valid Social Security Numbers?",
        ],
    },
    {
        "id": "rd_tax_credit",
        "title": "Research & Development Tax Credit",
        "category": "Credits",
        "description": "Up to 20% of qualified research expenses above a base amount. Small businesses (under $5M gross receipts) can offset up to $500,000 in payroll taxes. QREs include wages, supplies, and contract research for developing new/improved products or software.",
        "eligibility": [
            "Business conducts qualified research activities in the U.S.",
            "Activities satisfy the 4-part test: technological in nature, elimination of uncertainty, process of experimentation, permitted purpose",
            "Qualified expenses: W-2 wages, supplies, 65% of contract research costs",
        ],
        "implementation": [
            "Identify qualifying research activities using the 4-part test",
            "Calculate QREs: wages, supplies, contract research",
            "Determine credit: regular method (20% over base) or simplified (14% over 50% of prior 3-year average)",
            "For startups: elect payroll tax offset (up to $500,000/year for 5 years)",
            "File Form 6765 with detailed contemporaneous documentation",
        ],
        "tax_filing": "Form 6765 Line 44. Partnership: Schedule K Line 15f. S-Corp: Schedule K Line 13g. States with credits: AL, AK, AZ, AR, CA, CO, CT, DE, FL, GA, HI, ID, IL, IN, IA, KS, KY, LA, ME, MD, MA, MN, NE, NH, NJ, NM, NY, ND, OH, PA, RI, SC, TX, UT, VT, VA, WI.",
        "irc_reference": "IRC Section 41; IRC Section 174; IRC Section 3111(f)",
        "entity_types": ["Sole Prop", "S-Corp", "C-Corp", "Partnership"],
        "income_threshold": "$75,000+",
        "savings_range": "$5,000 - $100,000",
        "savings_formula": "QREs x 0.20 (regular) or x 0.14 (simplified)",
        "risk_level": "Medium",
        "time_to_implement": "Up to 8 hours; retroactive allowed",
        "qualification_questions": [
            "Can you describe new/improved products or processes you created?",
            "Did development involve eliminating technological uncertainty?",
            "Does your process rely on engineering, computer science, or hard sciences?",
            "Did you evaluate alternatives through experimentation?",
        ],
    },
    {
        "id": "dependent_care_credit",
        "title": "Dependent Care Credit",
        "category": "Credits",
        "description": "Non-refundable credit for child care or dependent care expenses that allow you to work. 20-35% of up to $3,000 for one qualifying individual, or $6,000 for two or more, depending on AGI.",
        "eligibility": [
            "Care expenses for child under 13 or disabled dependent/spouse",
            "Care must enable taxpayer (and spouse if married) to work",
            "Care provider cannot be spouse, parent of child (if under 19), or your dependent",
            "Must file jointly if married",
        ],
        "implementation": [
            "Obtain qualified caregiver and their TIN via IRS Form W-10",
            "Keep payment history of all dependent care expenses",
            "Calculate credit percentage based on AGI (20% for AGI above $43,000)",
            "Apply percentage to qualifying expenses (capped at $3,000/$6,000)",
            "Complete Form 2441 and attach to Form 1040",
        ],
        "tax_filing": "Form 2441 attached to Form 1040. Credit on Form 1040, Schedule 3, Line 13g.",
        "irc_reference": "IRC Section 21",
        "entity_types": ["Individual"],
        "income_threshold": "Any",
        "savings_range": "$600 - $2,100",
        "savings_formula": "min(qualifying_expenses, limit) x credit_percentage",
        "risk_level": "Low",
        "time_to_implement": "At tax filing",
        "qualification_questions": [
            "Do you pay for childcare or dependent care to enable you to work?",
            "How old are your dependents receiving care?",
            "What are your annual childcare expenses?",
        ],
    },
    # --- ENTITY STRUCTURE ---
    {
        "id": "s_corp_election",
        "title": "S Corporation Election",
        "category": "Entity Structure",
        "description": "Elect S-Corp status to avoid self-employment tax on business profits above a reasonable salary. Net income passes through to shareholders but only W-2 wages are subject to FICA (15.3%). The single most common tax-saving strategy for profitable small businesses.",
        "eligibility": [
            "Domestic corporation or eligible LLC",
            "100 or fewer shareholders, all U.S. citizens/residents",
            "One class of stock only",
            "Business net income consistently above $50,000+",
        ],
        "implementation": [
            "Determine if S-Corp provides net tax savings (factor in payroll costs and state taxes)",
            "Create and set up entity: articles of incorporation, bylaws, EIN",
            "File Form 2553 within 2 months and 15 days of tax year start",
            "Obtain all shareholder signatures; mail with confirmation",
            "Set up reasonable compensation via RCReports.com; set up payroll",
            "Submit W-2s by January 31, Form 940 annually, estimated quarterly taxes",
            "File Form 1120-S by March 15; issue K-1s to shareholders",
        ],
        "tax_filing": "Form 2553 to elect. File Form 1120-S by March 15. K-1s to shareholders. Shareholders report on Form 1040 Schedule E page 2.",
        "irc_reference": "IRC Section 1362; IRC Section 1366; IRC Section 1368",
        "entity_types": ["Sole Prop", "Partnership"],
        "income_threshold": "$50,000+",
        "savings_range": "$5,000 - $30,000",
        "savings_formula": "(net_income - reasonable_salary) x 0.153",
        "risk_level": "Low",
        "time_to_implement": "2-4 weeks",
        "qualification_questions": [
            "Is your business currently a sole proprietorship, LLC, or partnership?",
            "Is your net business income consistently above $50,000?",
            "Do you have 100 or fewer U.S.-based owners?",
        ],
    },
    {
        "id": "late_s_corp_election",
        "title": "Late S Corporation Election",
        "category": "Entity Structure",
        "description": "If you missed the 75-day window for a timely S-Corp election, file under Revenue Procedure 2013-30 with reasonable cause for retroactive S-Corp status back to the beginning of the tax year.",
        "eligibility": [
            "Missed the Form 2553 filing deadline",
            "Reasonable cause for the late filing",
            "Entity has been treating itself as an S-Corp",
            "Filed within 3 years and 75 days of intended effective date",
        ],
        "implementation": [
            "Prepare Form 2553; write 'Filed Pursuant to Rev. Proc. 2013-30' at top",
            "Craft reasonable cause statement",
            "Craft shareholder's statement; obtain all signatures",
            "Mail package with confirmation of receipt",
            "Follow up 2-3 months later for verification letter",
        ],
        "tax_filing": "Form 2553 with reasonable cause per Rev. Proc. 2013-30. Once accepted, file 1120-S and K-1s for all applicable years.",
        "irc_reference": "IRC Section 1362(b); Revenue Procedure 2013-30",
        "entity_types": ["Sole Prop", "Partnership"],
        "income_threshold": "$50,000+",
        "savings_range": "$5,000 - $30,000",
        "savings_formula": "(net_income - reasonable_salary) x 0.153",
        "risk_level": "Medium",
        "time_to_implement": "2-6 weeks",
        "qualification_questions": [
            "Did you miss the S-Corp election deadline?",
            "Has your business been operating as if it were an S-Corp?",
            "When was the intended effective date?",
        ],
    },
    # --- EDUCATION ---
    {
        "id": "education_savings",
        "title": "Coverdell ESA / 529 Plan",
        "category": "Education",
        "description": "Tax-free growth for education expenses. 529 Plans have no contribution limits (subject to gift tax) and cover tuition, room, board, and up to $10,000/year for K-12. Coverdell ESAs allow $2,000/year per beneficiary with more investment flexibility.",
        "eligibility": [
            "529: No income limit. State tax deduction varies by state.",
            "Coverdell: AGI below $110,000 (single) / $220,000 (MFJ)",
            "Beneficiary must use funds for qualified education expenses",
        ],
        "implementation": [
            "Choose between 529 Plan and Coverdell ESA",
            "Open account and designate beneficiary",
            "Fund: 529 up to $18,000/year (gift exclusion) or 5-year superfunding $90,000",
            "Invest in age-appropriate portfolios",
            "Withdraw for qualified expenses: tuition, books, room and board, computers",
        ],
        "tax_filing": "529 distributions reported on Form 1099-Q. Coverdell on Form 5498-ESA (contributions) and Form 1099-Q (distributions).",
        "irc_reference": "IRC Section 529; IRC Section 530 (Coverdell ESA)",
        "entity_types": ["Individual"],
        "income_threshold": "Any",
        "savings_range": "$500 - $5,000",
        "savings_formula": "investment_growth x avoided_capital_gains_rate",
        "risk_level": "Low",
        "time_to_implement": "1-2 weeks",
        "qualification_questions": [
            "Do you have children or dependents with upcoming education expenses?",
            "Are you looking for tax-advantaged savings for college or K-12?",
            "What is your state of residence (for state tax deduction)?",
        ],
    },
]

# ===========================================================================
# PDF Generation
# ===========================================================================

BRAND_ORANGE = HexColor("#DC5700")
BRAND_NAVY = HexColor("#03045e")
DARK_TEXT = HexColor("#1a1a2e")
MEDIUM_TEXT = HexColor("#333355")
LIGHT_BG = HexColor("#f8f7fc")
BORDER_COLOR = HexColor("#ddd8e8")

OUTPUT_PATH = "/sessions/vibrant-beautiful-gates/mnt/agfintax-planning-ai/docs/AG-FinTax-Tax-Strategies-Knowledge-Base.pdf"

def build_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="CoverTitle", fontName="Helvetica-Bold", fontSize=28, textColor=white, alignment=TA_CENTER, spaceAfter=6))
    styles.add(ParagraphStyle(name="CoverSub", fontName="Helvetica", fontSize=14, textColor=HexColor("#FFB596"), alignment=TA_CENTER, spaceAfter=20))
    styles.add(ParagraphStyle(name="CoverInfo", fontName="Helvetica", fontSize=10, textColor=HexColor("#cccccc"), alignment=TA_CENTER, spaceAfter=4))
    styles.add(ParagraphStyle(name="StratTitle", fontName="Helvetica-Bold", fontSize=14, textColor=BRAND_NAVY, spaceBefore=2, spaceAfter=4))
    styles.add(ParagraphStyle(name="StratDesc", fontName="Helvetica", fontSize=9.5, textColor=MEDIUM_TEXT, spaceAfter=6, leading=13, alignment=TA_JUSTIFY))
    styles.add(ParagraphStyle(name="SectionHead", fontName="Helvetica-Bold", fontSize=10, textColor=BRAND_ORANGE, spaceBefore=8, spaceAfter=3))
    styles.add(ParagraphStyle(name="BulletItem", fontName="Helvetica", fontSize=9, textColor=DARK_TEXT, leftIndent=16, spaceBefore=1, spaceAfter=1, leading=12))
    styles.add(ParagraphStyle(name="MetaLabel", fontName="Helvetica-Bold", fontSize=8.5, textColor=MEDIUM_TEXT))
    styles.add(ParagraphStyle(name="MetaValue", fontName="Helvetica", fontSize=8.5, textColor=DARK_TEXT))
    styles.add(ParagraphStyle(name="CatHeader", fontName="Helvetica-Bold", fontSize=20, textColor=BRAND_NAVY, spaceBefore=12, spaceAfter=8))
    styles.add(ParagraphStyle(name="TOCEntry", fontName="Helvetica", fontSize=10, textColor=DARK_TEXT, spaceBefore=2, spaceAfter=2, leftIndent=12))
    styles.add(ParagraphStyle(name="TOCCat", fontName="Helvetica-Bold", fontSize=11, textColor=BRAND_NAVY, spaceBefore=8, spaceAfter=2))
    styles.add(ParagraphStyle(name="FooterText", fontName="Helvetica", fontSize=7.5, textColor=HexColor("#999999"), alignment=TA_CENTER))
    return styles

def make_cover(styles):
    elements = []
    elements.append(Spacer(1, 2*inch))
    # Title block using a colored table as background
    title_data = [
        [Paragraph("AG FinTax", styles["CoverTitle"])],
        [Paragraph("Tax Strategies Knowledge Base", styles["CoverSub"])],
        [Spacer(1, 12)],
        [Paragraph("30 Tax Planning Strategies with IRC References,", styles["CoverInfo"])],
        [Paragraph("Qualification Questions, Implementation Steps,", styles["CoverInfo"])],
        [Paragraph("and Entity-Specific Filing Instructions", styles["CoverInfo"])],
        [Spacer(1, 20)],
        [Paragraph("Based on Corvee 2024 Tax Strategies Masterclass", styles["CoverInfo"])],
        [Paragraph("Updated for 2025 Tax Law (OBBBA)", styles["CoverInfo"])],
        [Spacer(1, 30)],
        [Paragraph("Prepared for AI Agent Knowledge Base", styles["CoverInfo"])],
        [Paragraph("AG FinTax | Built &amp; Powered by LoukriAI.com", styles["CoverInfo"])],
    ]
    title_table = Table(title_data, colWidths=[5.5*inch])
    title_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BRAND_NAVY),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 30),
        ("RIGHTPADDING", (0, 0), (-1, -1), 30),
        ("ROUNDEDCORNERS", [8, 8, 8, 8]),
    ]))
    elements.append(title_table)
    elements.append(PageBreak())
    return elements

def make_toc(styles):
    elements = []
    elements.append(Paragraph("Table of Contents", styles["CatHeader"]))
    elements.append(Spacer(1, 8))
    categories_seen = set()
    for i, s in enumerate(STRATEGIES):
        cat = s["category"]
        if cat not in categories_seen:
            categories_seen.add(cat)
            elements.append(Paragraph(f"<b>{cat}</b>", styles["TOCCat"]))
        elements.append(Paragraph(f"{i+1}. {s['title']}  —  {s['savings_range']}  |  {', '.join(s['entity_types'])}", styles["TOCEntry"]))
    elements.append(PageBreak())
    return elements

def make_strategy(s, idx, styles):
    elems = []
    # Title bar
    title_data = [[
        Paragraph(f"<b>#{idx+1}</b>", ParagraphStyle("n", fontName="Helvetica-Bold", fontSize=10, textColor=white)),
        Paragraph(f"<b>{s['title']}</b>", ParagraphStyle("n", fontName="Helvetica-Bold", fontSize=12, textColor=white)),
        Paragraph(f"{s['category']}", ParagraphStyle("n", fontName="Helvetica", fontSize=9, textColor=HexColor('#FFB596'), alignment=TA_CENTER)),
    ]]
    title_tbl = Table(title_data, colWidths=[0.5*inch, 4.5*inch, 1.5*inch])
    title_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BRAND_NAVY),
        ("TEXTCOLOR", (0, 0), (-1, -1), white),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (0, 0), 10),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elems.append(title_tbl)

    # Description
    elems.append(Spacer(1, 4))
    elems.append(Paragraph(s["description"], styles["StratDesc"]))

    # Meta row
    meta_data = [[
        Paragraph(f"<b>IRC:</b> {s['irc_reference']}", styles["MetaValue"]),
        Paragraph(f"<b>Savings:</b> {s['savings_range']}", styles["MetaValue"]),
        Paragraph(f"<b>Risk:</b> {s['risk_level']}", styles["MetaValue"]),
        Paragraph(f"<b>Time:</b> {s['time_to_implement']}", styles["MetaValue"]),
    ]]
    meta_tbl = Table(meta_data, colWidths=[2.2*inch, 1.5*inch, 1*inch, 1.8*inch])
    meta_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    elems.append(meta_tbl)
    elems.append(Spacer(1, 2))

    # Entity types + Income + Formula
    ent_line = f"<b>Entity Types:</b> {', '.join(s['entity_types'])}  |  <b>Income Threshold:</b> {s['income_threshold']}  |  <b>Formula:</b> {s['savings_formula']}"
    elems.append(Paragraph(ent_line, ParagraphStyle("n", fontName="Helvetica", fontSize=8, textColor=MEDIUM_TEXT, spaceAfter=6)))

    # Eligibility
    elems.append(Paragraph("Eligibility Criteria", styles["SectionHead"]))
    for item in s["eligibility"]:
        elems.append(Paragraph(f"\u2022 {item}", styles["BulletItem"]))

    # Implementation
    elems.append(Paragraph("Implementation Steps", styles["SectionHead"]))
    for i, step in enumerate(s["implementation"]):
        elems.append(Paragraph(f"{i+1}. {step}", styles["BulletItem"]))

    # Tax Filing
    elems.append(Paragraph("Tax Filing by Entity Type", styles["SectionHead"]))
    elems.append(Paragraph(s["tax_filing"], ParagraphStyle("n", fontName="Helvetica", fontSize=9, textColor=DARK_TEXT, leftIndent=8, spaceAfter=4, leading=12)))

    # Qualification Questions
    elems.append(Paragraph("Qualification Questions (for Client Intake)", styles["SectionHead"]))
    for q in s["qualification_questions"]:
        elems.append(Paragraph(f"\u2022 {q}", styles["BulletItem"]))

    elems.append(Spacer(1, 6))
    elems.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR, spaceAfter=10))
    return elems

def footer(canvas_obj, doc):
    canvas_obj.saveState()
    canvas_obj.setFont("Helvetica", 7.5)
    canvas_obj.setFillColor(HexColor("#999999"))
    canvas_obj.drawCentredString(letter[0]/2, 0.4*inch, f"AG FinTax Tax Strategies Knowledge Base  |  Built & Powered by LoukriAI.com  |  Page {doc.page}")
    canvas_obj.restoreState()

def generate_pdf():
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=letter,
        topMargin=0.6*inch,
        bottomMargin=0.7*inch,
        leftMargin=0.75*inch,
        rightMargin=0.75*inch,
    )
    styles = build_styles()
    story = []

    # Cover
    story.extend(make_cover(styles))

    # TOC
    story.extend(make_toc(styles))

    # Strategies grouped by category
    current_cat = None
    for i, s in enumerate(STRATEGIES):
        if s["category"] != current_cat:
            if current_cat is not None:
                story.append(PageBreak())
            current_cat = s["category"]
            story.append(Paragraph(current_cat.upper(), styles["CatHeader"]))
            story.append(HRFlowable(width="100%", thickness=1, color=BRAND_ORANGE, spaceAfter=10))

        strategy_elems = make_strategy(s, i, styles)
        story.append(KeepTogether(strategy_elems))

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(f"PDF generated: {OUTPUT_PATH}")

if __name__ == "__main__":
    generate_pdf()
