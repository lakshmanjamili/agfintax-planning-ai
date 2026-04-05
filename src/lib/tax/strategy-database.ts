export type StrategyTier = 'individual' | 'business';

export type EntityType = 'individual' | 'sole_prop' | 'llc' | 's_corp' | 'c_corp' | 'partnership';

export type FilingStatus = 'single' | 'married_jointly' | 'married_separately' | 'head_of_household' | 'qualifying_widow';

export type QuestionType = 'yes_no' | 'currency' | 'number' | 'choice' | 'text';

export interface QualificationQuestion {
  id: string;
  question: string;
  helpText: string;
  type: QuestionType;
  required: boolean;
  disqualifyOn?: string | string[];
  choices?: string[];
}

export interface StrategyQualification {
  id: string;
  title: string;
  tier: StrategyTier;
  category: string;
  description: string;
  ircReference: string;
  applicableTo: EntityType[];
  incomeThreshold?: { min?: number; max?: number };
  filingStatusRestriction?: FilingStatus[];
  qualificationQuestions: QualificationQuestion[];
  implementationTime: string;
  thirdPartyNeeded: boolean;
  thirdPartyDetails?: string;
  isRetroactive: boolean;
  deadline: string;
  riskLevel: 'low' | 'medium' | 'high';
  typicalSavingsRange: { min: number; max: number };
  savingsFormula: string;
  implementationSteps: string[];
  taxFiling: string;
}

export const strategyDatabase: StrategyQualification[] = [
  // INDIVIDUAL TIER - RETIREMENT PLANNING
  {
    id: 'traditional-401k',
    title: 'Traditional 401(k) - Maximize Pre-Tax Contributions',
    tier: 'individual',
    category: 'Retirement Planning',
    description: 'Contribute up to $23,500 ($31,000 if age 50+) to traditional 401(k) to reduce taxable income and defer taxes until retirement.',
    ircReference: 'IRC §401(k)',
    applicableTo: ['individual'],
    qualificationQuestions: [
      {
        id: 'has-employer-401k',
        question: 'Does your employer offer a 401(k) plan?',
        helpText: 'You can only contribute to a 401(k) if your employer sponsors one.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'annual-income-401k',
        question: 'What is your anticipated 2025 W-2 wages?',
        helpText: 'Your 401(k) contributions cannot exceed your W-2 compensation.',
        type: 'currency',
        required: true
      },
      {
        id: 'age-401k',
        question: 'Will you be age 50 or older by December 31, 2025?',
        helpText: 'Catch-up contributions of $7,500 are allowed for those age 50+.',
        type: 'yes_no',
        required: true
      },
      {
        id: 'current-contribution-401k',
        question: 'Are you currently contributing to this 401(k)?',
        helpText: 'Verify if you are already enrolled.',
        type: 'yes_no',
        required: true
      },
      {
        id: 'current-401k-contribution-amount',
        question: 'How much do you currently contribute per year to your 401(k)?',
        helpText: 'Your current annual contribution amount. 2025 max: $23,500 (under 50) or $31,000 (50+). We need this to calculate how much more you can contribute and the exact tax savings.',
        type: 'currency',
        required: true
      },
      {
        id: 'employer-match-available',
        question: 'Does your employer offer matching contributions?',
        helpText: 'Employer matching is free money for retirement.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'roth-401k-option',
        question: 'Does your plan offer Roth 401(k) option?',
        helpText: 'Some plans allow both traditional and Roth contributions.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'current-401k-balance',
        question: 'What is your current 401(k) balance?',
        helpText: 'Used to estimate total retirement savings trajectory.',
        type: 'currency',
        required: false
      },
      {
        id: 'plan-to-max-401k',
        question: 'Do you plan to maximize your 401(k) contribution?',
        helpText: 'This strategy assumes you want to contribute the maximum allowed amount.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      }
    ],
    implementationTime: 'Immediate (set up payroll deduction)',
    thirdPartyNeeded: false,
    isRetroactive: false,
    deadline: 'December 31, 2025 (contribution year)',
    riskLevel: 'low',
    typicalSavingsRange: { min: 5000, max: 15000 },
    savingsFormula: 'Contribution Amount × Marginal Tax Rate',
    implementationSteps: [
      'Contact your HR/benefits department',
      'Elect contribution amount on 401(k) election form',
      'Contribution deducted from paycheck',
      'Report on tax return (automatic on W-2)',
      'Monitor contribution tracking'
    ],
    taxFiling: 'Reported on W-2 Box 12(a-d), reduces Box 1 wages'
  },

  {
    id: 'solo-401k',
    title: 'Solo 401(k) - Self-Employed Retirement Plan',
    tier: 'business',
    category: 'Retirement Planning',
    description: 'For self-employed individuals with no full-time employees. Contribute up to $69,000 ($76,500 if age 50+) combining employee deferrals and employer contributions.',
    ircReference: 'IRC §401(k), §4972',
    applicableTo: ['sole_prop', 's_corp', 'llc'],
    qualificationQuestions: [
      {
        id: 'self-employed-solo-401k',
        question: 'Are you self-employed with no full-time employees?',
        helpText: 'Solo 401(k) requires zero employees (except spouse).',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'business-income-solo-401k',
        question: 'What is your anticipated 2025 net business income?',
        helpText: 'Contributions are limited to your net self-employment income.',
        type: 'currency',
        required: true
      },
      {
        id: 'age-solo-401k',
        question: 'Will you be age 50 or older by December 31, 2025?',
        helpText: 'Catch-up contributions are allowed for those age 50+.',
        type: 'yes_no',
        required: true
      },
      {
        id: 'existing-solo-401k',
        question: 'Do you already have a solo 401(k) established?',
        helpText: 'If yes, you can make contributions to existing plan.',
        type: 'yes_no',
        required: true
      },
      {
        id: 'spouse-employee-solo-401k',
        question: 'Does your spouse work in the business?',
        helpText: 'Spouse can be treated as employee for additional contributions.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'desire-investment-control',
        question: 'Do you want self-directed investment options?',
        helpText: 'Some solo 401(k) providers offer self-directed investing.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'loan-feature-needed',
        question: 'Do you want the ability to borrow from the plan?',
        helpText: 'Solo 401(k) plans allow loans (not available with SEP-IRA).',
        type: 'yes_no',
        required: false
      },
      {
        id: 'cash-flow-for-contributions',
        question: 'Will you have sufficient cash flow to fund contributions?',
        helpText: 'Solo 401(k) contributions require cash availability.',
        type: 'yes_no',
        required: true,
      }
    ],
    implementationTime: '1-2 weeks (establish plan, set up custodian)',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'IRA custodian, plan administrator (Fidelity, E*TRADE, Schwab, etc.)',
    isRetroactive: true,
    deadline: 'October 15, 2026 (with extension)',
    riskLevel: 'low',
    typicalSavingsRange: { min: 10000, max: 25000 },
    savingsFormula: 'Employee Deferrals + Employer Contributions × Marginal Tax Rate',
    implementationSteps: [
      'Determine plan provider (Fidelity, E*TRADE, Schwab, Directed IRA)',
      'Complete plan adoption documents',
      'Fund the plan with business cash',
      'Track contributions on Form 8606 and Schedule C',
      'File Form 5498-SA with tax return'
    ],
    taxFiling: 'Deducted on Schedule C (self-employment income reduction), reported on Form 8606'
  },

  {
    id: 'roth-401k',
    title: 'Roth 401(k) - After-Tax Retirement Contributions',
    tier: 'individual',
    category: 'Retirement Planning',
    description: 'After-tax contributions to employer Roth 401(k) for tax-free growth and withdrawals in retirement. Up to $23,500 contribution limit.',
    ircReference: 'IRC §402A',
    applicableTo: ['individual'],
    qualificationQuestions: [
      {
        id: 'employer-roth-401k',
        question: 'Does your employer offer a Roth 401(k) option?',
        helpText: 'Not all 401(k) plans include Roth elections.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'anticipated-wages-roth-401k',
        question: 'What is your anticipated 2025 W-2 wages?',
        helpText: 'Roth 401(k) contributions cannot exceed compensation.',
        type: 'currency',
        required: true
      },
      {
        id: 'already-contributing-roth-401k',
        question: 'Are you currently contributing to a Roth 401(k)?',
        helpText: 'Verify current enrollment status.',
        type: 'yes_no',
        required: true
      },
      {
        id: 'anticipated-tax-bracket-roth',
        question: 'What is your anticipated 2025 tax bracket?',
        helpText: 'Higher brackets make Roth conversions more valuable.',
        type: 'choice',
        required: true,
        choices: ['10%', '12%', '22%', '24%', '32%', '35%', '37%']
      },
      {
        id: 'higher-bracket-retirement',
        question: 'Do you expect to be in a higher tax bracket in retirement?',
        helpText: 'Roth is more valuable if retirement bracket will be higher.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'years-to-retire',
        question: 'How many years until you plan to retire?',
        helpText: 'Longer timelines benefit from Roth tax-free growth.',
        type: 'number',
        required: true
      },
      {
        id: 'also-traditional-401k',
        question: 'Are you also making traditional 401(k) contributions?',
        helpText: 'You can split contributions between Roth and traditional.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'tax-free-heirs',
        question: 'Is leaving tax-free assets to heirs important?',
        helpText: 'Roth balances pass tax-free to beneficiaries.',
        type: 'yes_no',
        required: false
      }
    ],
    implementationTime: 'Immediate (election on 401(k) form)',
    thirdPartyNeeded: false,
    isRetroactive: false,
    deadline: 'December 31, 2025 (contribution year)',
    riskLevel: 'low',
    typicalSavingsRange: { min: 8000, max: 20000 },
    savingsFormula: 'Roth Contribution Amount × Marginal Tax Rate × Investment Growth Years',
    implementationSteps: [
      'Contact HR/benefits department',
      'Elect Roth 401(k) option on election form',
      'Set contribution amount (after-tax)',
      'Contributions deducted from paycheck',
      'Monitor account growth (no RMDs during lifetime)'
    ],
    taxFiling: 'Reported on W-2 Box 12, tracked separately from traditional 401(k)'
  },

  {
    id: 'simple-401k',
    title: 'SIMPLE 401(k) - Small Employer Retirement Plan',
    tier: 'business',
    category: 'Retirement Planning',
    description: 'For employers with 100 or fewer employees. Employees contribute up to $16,500 ($20,500 if age 50+) with required employer matching or non-elective contributions.',
    ircReference: 'IRC §401(k)(11)',
    applicableTo: ['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership'],
    qualificationQuestions: [
      {
        id: 'employee-count-simple-401k',
        question: 'Do you have 100 or fewer employees?',
        helpText: 'SIMPLE 401(k) is limited to employers with ≤100 employees.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'no-other-401k',
        question: 'Do you currently offer another 401(k) or retirement plan?',
        helpText: 'SIMPLE 401(k) cannot coexist with other 401(k) plans.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'yes'
      },
      {
        id: 'anticipated-employees-simple-401k',
        question: 'How many employees do you anticipate in 2025?',
        helpText: 'SIMPLE 401(k) available for ≤100 employee businesses.',
        type: 'number',
        required: true
      },
      {
        id: 'payroll-budget-simple-401k',
        question: 'What is your anticipated total 2025 payroll?',
        helpText: 'Helps estimate employer match costs.',
        type: 'currency',
        required: true
      },
      {
        id: 'willing-to-match-simple-401k',
        question: 'Are you willing to provide employer matching contributions?',
        helpText: 'Employer must match 3% of salaries or contribute 2% non-elective.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'administrative-capacity',
        question: 'Do you have administrative capacity to manage a 401(k)?',
        helpText: 'SIMPLE 401(k) requires ongoing compliance and administration.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'owner-contribution-simple-401k',
        question: 'Do you want to maximize owner retirement savings?',
        helpText: 'SIMPLE 401(k) allows owner participation with employee deferrals.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'cash-flow-for-match',
        question: 'Can you commit to funding employer contributions annually?',
        helpText: 'Employer match is a mandatory recurring cost.',
        type: 'yes_no',
        required: true,
      }
    ],
    implementationTime: '2-3 weeks (plan establishment, employee communication)',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'Plan administrator, payroll processor, recordkeeper',
    isRetroactive: false,
    deadline: 'October 1, 2025 (for 2025 plan year)',
    riskLevel: 'low',
    typicalSavingsRange: { min: 5000, max: 15000 },
    savingsFormula: '(Employee Deferrals + Employer Match) × Marginal Tax Rate',
    implementationSteps: [
      'Select SIMPLE 401(k) provider',
      'Adopt plan document',
      'Communicate plan to employees',
      'Set up payroll integration',
      'File Form 5500 if required',
      'Provide annual disclosures'
    ],
    taxFiling: 'Employer contributions deducted on business return, employee deferrals reduce W-2 wages'
  },

  {
    id: 'simple-ira',
    title: 'SIMPLE IRA - Small Employer Retirement Plan',
    tier: 'business',
    category: 'Retirement Planning',
    description: 'For employers with 100 or fewer employees. Simpler alternative to SIMPLE 401(k) with contributions up to $16,500 ($20,500 if age 50+).',
    ircReference: 'IRC §408(p)',
    applicableTo: ['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership'],
    qualificationQuestions: [
      {
        id: 'employee-count-simple-ira',
        question: 'Do you have 100 or fewer employees?',
        helpText: 'SIMPLE IRA is limited to ≤100 employee businesses.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'no-other-retirement-plan',
        question: 'Do you currently sponsor another retirement plan?',
        helpText: 'SIMPLE IRA cannot coexist with 401(k), SEP-IRA, or other qualified plans.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'yes'
      },
      {
        id: 'employee-deferral-preference',
        question: 'Do you want employees to choose contribution amounts?',
        helpText: 'SIMPLE IRA allows employee salary deferrals (similar to 401(k)).',
        type: 'yes_no',
        required: true
      },
      {
        id: 'match-vs-nonelective',
        question: 'Will you match contributions or make non-elective contributions?',
        helpText: 'Employer must provide 3% match (or 2% non-elective).',
        type: 'choice',
        required: true,
        choices: ['3% Match', '2% Non-Elective', 'Unsure']
      },
      {
        id: 'simplicity-priority',
        question: 'Do you prioritize simplicity over features?',
        helpText: 'SIMPLE IRA has fewer administrative requirements than 401(k).',
        type: 'yes_no',
        required: true
      },
      {
        id: 'payroll-integration-simple-ira',
        question: 'Is your payroll system set up for automated deductions?',
        helpText: 'SIMPLE IRA requires payroll integration for employee deferrals.',
        type: 'yes_no',
        required: true
      },
      {
        id: 'anticipated-growth',
        question: 'Do you expect employee count to exceed 100 soon?',
        helpText: 'SIMPLE IRA not available if you exceed 100 employees.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'match-commitment-simple-ira',
        question: 'Can you commit to annual employer contributions?',
        helpText: 'Employer matching is mandatory under SIMPLE IRA.',
        type: 'yes_no',
        required: true,
      }
    ],
    implementationTime: '1-2 weeks (setup with financial institution)',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'Bank or financial institution offering SIMPLE IRA',
    isRetroactive: false,
    deadline: 'October 1, 2025 (for 2025 plan year)',
    riskLevel: 'low',
    typicalSavingsRange: { min: 5000, max: 12000 },
    savingsFormula: '(Employee Deferrals + Employer Match) × Marginal Tax Rate',
    implementationSteps: [
      'Select financial institution for SIMPLE IRA administration',
      'Complete adoption agreement',
      'Communicate to employees',
      'Set up payroll deductions',
      'Provide annual statements',
      'File Form 5498-SIMPLE'
    ],
    taxFiling: 'Employee deferrals reduce W-2 wages; employer match deducted on business return'
  },

  {
    id: 'self-directed-retirement',
    title: 'Self-Directed Retirement Funds - Alternative Investments',
    tier: 'individual',
    category: 'Retirement Planning',
    description: 'Use self-directed IRA or 401(k) to invest in alternative assets like real estate, private equity, cryptocurrencies, or precious metals while maintaining tax-deferred growth.',
    ircReference: 'IRC §408(a), §401(k)',
    applicableTo: ['individual', 'sole_prop'],
    qualificationQuestions: [
      {
        id: 'alternative-investment-interest',
        question: 'Are you interested in investing in alternative assets (real estate, crypto, etc.)?',
        helpText: 'Self-directed IRAs/401(k)s allow investments beyond stocks and bonds.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'existing-ira-rollover',
        question: 'Do you have an existing IRA or 401(k) to roll over?',
        helpText: 'You can open self-directed account and roll existing funds into it.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'alternative-investment-experience',
        question: 'Do you have experience with alternative investments?',
        helpText: 'Self-directed accounts require more investor knowledge and due diligence.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'prohibited-transaction-understanding',
        question: 'Do you understand prohibited transaction rules?',
        helpText: 'Self-directed accounts have strict rules about self-dealing and related parties.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'capital-for-alternative-investment',
        question: 'Do you have capital to fund alternative investments?',
        helpText: 'Alternative investments typically require significant capital.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'custodian-available',
        question: 'Have you identified a self-directed IRA custodian?',
        helpText: 'You need a custodian that allows alternative investments (e.g., Directed IRA, New Direction).',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'account-type-self-directed',
        question: 'Will you use a Traditional IRA, Roth IRA, or Solo 401(k)?',
        helpText: 'Different account types have different contribution limits and tax treatment.',
        type: 'choice',
        required: true,
        choices: ['Traditional IRA', 'Roth IRA', 'Solo 401(k)']
      },
      {
        id: 'willing-to-track-basis',
        question: 'Are you willing to maintain detailed investment records?',
        helpText: 'Self-directed accounts require precise documentation for compliance.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      }
    ],
    implementationTime: '2-4 weeks (custodian setup, investment identification)',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'Self-directed IRA custodian (Directed IRA, Rocket Dollar, New Direction, etc.)',
    isRetroactive: false,
    deadline: 'December 31, 2025 (contribution year)',
    riskLevel: 'high',
    typicalSavingsRange: { min: 5000, max: 30000 },
    savingsFormula: 'Deferred Taxes on Alternative Investment Gains × Years Until Distribution',
    implementationSteps: [
      'Research self-directed IRA custodians',
      'Open account with custodian',
      'Fund account (new contributions or rollover)',
      'Identify and execute alternative investment',
      'Maintain meticulous records',
      'File Form 8606 if applicable'
    ],
    taxFiling: 'Same as regular IRA/401(k); gains grow tax-deferred (no annual reporting of gains)'
  },

  // INDIVIDUAL - COMPENSATION
  {
    id: 'health-savings-account',
    title: 'Health Savings Account (HSA) - Triple Tax Advantage',
    tier: 'individual',
    category: 'Compensation',
    description: 'Triple tax-advantaged account for health expenses. Contribute up to $4,150 (individual) or $8,300 (family) in 2025. Tax-deductible contributions, tax-free growth, tax-free withdrawals for qualified medical expenses.',
    ircReference: 'IRC §223',
    applicableTo: ['individual'],
    qualificationQuestions: [
      {
        id: 'hdhp-coverage',
        question: 'Are you enrolled in a High Deductible Health Plan (HDHP)?',
        helpText: 'HSA eligibility requires coverage under an IRS-qualified HDHP (2025: $1,500+ individual deductible, $3,050+ family).',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'non-hdhp-coverage',
        question: 'Do you have any non-HDHP health coverage (Medicare, Tricare, VA)?',
        helpText: 'HSA not available if covered by non-HDHP health insurance or Medicare.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'yes'
      },
      {
        id: 'hdhp-dependents-covered',
        question: 'How many dependents will be covered under your HDHP?',
        helpText: 'Contribution limits vary by individual vs. family coverage.',
        type: 'choice',
        required: true,
        choices: ['Self only', 'Self + spouse', 'Self + family']
      },
      {
        id: 'age-55-hsa',
        question: 'Will you be age 55 or older by December 31, 2025?',
        helpText: 'Age 55+ can make additional $1,000 catch-up contributions.',
        type: 'yes_no',
        required: true
      },
      {
        id: 'anticipated-medical-expenses',
        question: 'What are your anticipated 2025 medical expenses?',
        helpText: 'Helps us calculate the full tax benefit of your HSA — deduction plus tax-free withdrawals for qualified expenses.',
        type: 'currency',
        required: true
      },
      {
        id: 'existing-hsa',
        question: 'Do you already have an HSA?',
        helpText: 'Existing HSA can receive additional contributions.',
        type: 'yes_no',
        required: true
      },
      {
        id: 'invest-hsa-funds',
        question: 'Do you want to invest HSA funds for long-term growth?',
        helpText: 'Some HSA providers allow investment of account balance.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'emergency-funds-separate',
        question: 'Do you have emergency funds separate from HSA?',
        helpText: 'HSA is best used as long-term savings if you can pay medical expenses with other funds.',
        type: 'yes_no',
        required: false
      }
    ],
    implementationTime: 'Immediate (if during open enrollment)',
    thirdPartyNeeded: false,
    isRetroactive: false,
    deadline: 'December 31, 2025 (contribution year)',
    riskLevel: 'low',
    typicalSavingsRange: { min: 1000, max: 3000 },
    savingsFormula: 'Contribution Amount × Marginal Tax Rate + Investment Growth on Unused Balance',
    implementationSteps: [
      'Confirm HDHP eligibility',
      'Open HSA with provider (bank, investment firm)',
      'Make annual contribution (max: $4,150 individual or $8,300 family)',
      'Maintain receipts for qualified medical expenses',
      'Reimburse yourself from HSA tax-free',
      'Track withdrawals on Form 8889'
    ],
    taxFiling: 'Reported on Form 8889, contribution deducted above-the-line'
  },

  {
    id: 'deferred-compensation-individual',
    title: 'Deferred Compensation Plan - Defer Salary to Future Years',
    tier: 'individual',
    category: 'Compensation',
    description: 'Defer a portion of salary or bonus to future years through a Section 409A deferred compensation arrangement, deferring taxes until cash receipt.',
    ircReference: 'IRC §409A',
    applicableTo: ['individual'],
    qualificationQuestions: [
      {
        id: 'employer-allows-deferral',
        question: 'Does your employer offer a deferred compensation plan?',
        helpText: 'Requires employer sponsorship of §409A compliant plan.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'excess-compensation',
        question: 'Do you have compensation above your spending needs?',
        helpText: 'Deferrals should only be made with excess income you won\'t need short-term.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'income-above-200k',
        question: 'Is your 2025 anticipated income above $200,000?',
        helpText: 'Deferred compensation is most valuable for high earners in high tax brackets.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'deferral-distribution-timing',
        question: 'When do you plan to receive the deferred compensation?',
        helpText: 'Deferral must specify distribution date (§409A requirement).',
        type: 'choice',
        required: true,
        choices: ['At retirement', 'In 5 years', 'In 10 years', 'Upon separation from service']
      },
      {
        id: 'lower-bracket-future',
        question: 'Do you expect to be in a lower tax bracket when compensation is deferred?',
        helpText: 'Tax deferral is only beneficial if you\'ll be in a lower bracket later.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'unsecured-promise-comfort',
        question: 'Are you comfortable with deferral being unsecured company promise?',
        helpText: 'Deferred comp is typically an unsecured promise (creditor risk).',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'remain-with-employer',
        question: 'Do you plan to remain with your employer for the deferral period?',
        helpText: 'Early termination may restrict deferral access under §409A.',
        type: 'yes_no',
        required: true
      },
      {
        id: 'annual-deferral-amount',
        question: 'What annual amount would you like to defer (in dollars)?',
        helpText: 'We need this to calculate the exact tax savings from deferring compensation to a lower-tax year.',
        type: 'currency',
        required: true
      }
    ],
    implementationTime: '1-2 weeks (plan election before year-end)',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'Employer HR, tax attorney to review §409A compliance',
    isRetroactive: false,
    deadline: 'December 31, 2025 (for 2025 deferral)',
    riskLevel: 'medium',
    typicalSavingsRange: { min: 5000, max: 50000 },
    savingsFormula: 'Deferred Amount × (Current Tax Rate - Future Tax Rate)',
    implementationSteps: [
      'Obtain plan document from employer',
      'Verify §409A compliance',
      'Make deferral election (typically before December 31)',
      'Document deferral in writing',
      'Track deferred balance annually',
      'Report as W-2 wages when received'
    ],
    taxFiling: 'Deferred comp not included in current year W-2; reported when actually/constructively received'
  },

  // INDIVIDUAL - CHARITY
  {
    id: 'donor-advised-fund',
    title: 'Donor-Advised Fund - Bunch Charitable Deductions',
    tier: 'individual',
    category: 'Charity',
    description: 'Contribute appreciated assets to a DAF for immediate tax deduction, then grant funds to charities over time. Excellent for bunching deductions in high-income years.',
    ircReference: 'IRC §4966',
    applicableTo: ['individual'],
    qualificationQuestions: [
      {
        id: 'charitable-intent',
        question: 'Do you plan to make significant charitable contributions?',
        helpText: 'DAF is most valuable if you have sustained charitable giving goals.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'appreciated-securities',
        question: 'Do you have appreciated securities or assets to contribute?',
        helpText: 'DAF allows donation of appreciated assets (stocks, mutual funds) to avoid capital gains tax.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'bunch-deductions',
        question: 'Do you want to bunch charitable deductions in higher income years?',
        helpText: 'DAF allows year-to-year timing flexibility for deductions vs. charitable giving.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'itemize-deductions-daf',
        question: 'Do you itemize deductions (or plan to)?',
        helpText: 'Charitable deduction only benefits if itemizing exceeds standard deduction.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'annual-charity-amount',
        question: 'What annual amount would you contribute to charity?',
        helpText: 'DAF requires realistic assessment of charitable giving capacity.',
        type: 'currency',
        required: true
      },
      {
        id: 'specific-charities',
        question: 'Do you have specific charities in mind to support?',
        helpText: 'While DAF provides flexibility, having charitable goals helps justify the strategy.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'large-unrealized-gains',
        question: 'Do you have large unrealized capital gains in securities?',
        helpText: 'Donating appreciated securities avoids capital gains tax.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'initial-daf-contribution',
        question: 'Are you able to make an initial contribution to the DAF?',
        helpText: 'Typical minimum DAF contributions are $5,000-$25,000 depending on provider.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      }
    ],
    implementationTime: '2-3 weeks (open DAF account, transfer assets)',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'DAF sponsor (Schwab Charitable, Fidelity, Vanguard, local community foundation)',
    isRetroactive: false,
    deadline: 'December 31, 2025 (for 2025 deduction)',
    riskLevel: 'low',
    typicalSavingsRange: { min: 2000, max: 20000 },
    savingsFormula: 'Contributed Asset Value × Marginal Tax Rate + Capital Gains Tax Avoided',
    implementationSteps: [
      'Research DAF sponsors and fee structures',
      'Open DAF account',
      'Transfer appreciated securities to DAF',
      'Obtain charitable contribution receipt',
      'Make grant recommendations to charities over time',
      'Report deduction on Form 8283 (if >$500)'
    ],
    taxFiling: 'Deduction claimed on Schedule A as charitable contribution; Form 8283 for >$500 contributions'
  },

  {
    id: 'qualified-charitable-distribution',
    title: 'Qualified Charitable Distribution (QCD) - Direct IRA Gifts',
    tier: 'individual',
    category: 'Charity',
    description: 'Direct IRA distribution to qualified charity for those age 70.5+. Counts toward RMD, excludes from income, doesn\'t require itemizing. Up to $100,000 per year.',
    ircReference: 'IRC §408(d)(8)',
    applicableTo: ['individual'],
    qualificationQuestions: [
      {
        id: 'age-70-5',
        question: 'Will you be age 70.5 or older by December 31, 2025?',
        helpText: 'QCD is only available for age 70.5+ individuals.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'ira-balance-qcd',
        question: 'Do you have an IRA (Traditional or Roth) with available balance?',
        helpText: 'QCD requires distribution from owned IRA.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'rmd-subject',
        question: 'Are you subject to Required Minimum Distributions (RMD)?',
        helpText: 'QCD can satisfy RMD requirement even if distribution not included in income.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'charitable-contributions-qcd',
        question: 'Do you make charitable contributions to qualified charities?',
        helpText: 'QCD must go directly to qualified charitable organization (501(c)(3)).',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'itemizing-or-standard-qcd',
        question: 'Are you itemizing deductions or taking standard deduction?',
        helpText: 'QCD benefit doesn\'t depend on itemizing — it reduces AGI directly.',
        type: 'choice',
        required: true,
        choices: ['Itemizing', 'Standard deduction', 'Not sure']
      },
      {
        id: 'qcd-annual-amount',
        question: 'What annual amount would you distribute to charity via QCD?',
        helpText: 'QCD maximum is $100,000 per year (per person).',
        type: 'currency',
        required: true
      },
      {
        id: 'spouse-age-qcd',
        question: 'Does your spouse also meet the age 70.5+ requirement?',
        helpText: 'Each spouse can do separate $100,000 QCD.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'multi-year-qcd',
        question: 'Do you plan to do QCDs in multiple future years?',
        helpText: 'QCD is renewable annually, unlike one-time charitable gifts.',
        type: 'yes_no',
        required: false
      }
    ],
    implementationTime: '1-2 weeks (coordinate with IRA custodian and charity)',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'IRA custodian (Fidelity, Schwab, Vanguard, etc.); qualified charity (501(c)(3))',
    isRetroactive: false,
    deadline: 'December 31, 2025 (for 2025 QCD)',
    riskLevel: 'low',
    typicalSavingsRange: { min: 2000, max: 30000 },
    savingsFormula: 'QCD Amount × Marginal Tax Rate',
    implementationSteps: [
      'Confirm age 70.5+ and IRA ownership',
      'Identify qualified charitable organization',
      'Request QCD distribution from IRA custodian',
      'Custodian transfers directly to charity',
      'Obtain distribution confirmation from custodian',
      'Do NOT report as income on Form 1040 (exception to RMD reporting)',
      'Keep documentation of direct transfer'
    ],
    taxFiling: 'Not reported on Form 1040 as income; QCD counts toward RMD; custodian reports on Form 1099-R with code "G"'
  },

  {
    id: 'private-foundation',
    title: 'Private Foundation - High Net Worth Philanthropy',
    tier: 'individual',
    category: 'Charity',
    description: 'Establish a private foundation for substantial ongoing charitable giving. Allows multi-year commitments, involvement in grantmaking, and family engagement in philanthropy.',
    ircReference: 'IRC §501(c)(3)',
    applicableTo: ['individual'],
    qualificationQuestions: [
      {
        id: 'net-worth-foundation',
        question: 'Do you have a net worth exceeding $10 million?',
        helpText: 'Private foundations are typically established by high net worth individuals due to complexity and costs.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'annual-charitable-goal',
        question: 'What is your anticipated annual charitable contribution goal?',
        helpText: 'Foundations are economical if you plan to give $500,000+ annually.',
        type: 'currency',
        required: true
      },
      {
        id: 'multi-decade-giving',
        question: 'Do you plan to make charitable giving over multiple decades?',
        helpText: 'Perpetual foundations make sense for long-term giving commitments.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'family-grantmaking',
        question: 'Do you want family members involved in grantmaking?',
        helpText: 'Private foundations allow family governance and philanthropic education.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'philanthropic-control',
        question: 'Is maintaining control over philanthropic decisions important?',
        helpText: 'Private foundation provides donor control over grants and investments.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'appreciated-assets-foundation',
        question: 'Do you have appreciated assets to transfer to foundation?',
        helpText: 'Transfer appreciated securities/real estate to avoid capital gains tax.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'willing-admin-burden',
        question: 'Are you willing to accept administrative burden of foundation governance?',
        helpText: 'Private foundations require annual Form 990-PF, payroll reporting, board meetings.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'charitable-mission',
        question: 'Do you have a clear charitable mission in mind?',
        helpText: 'Foundations require documented charitable purpose.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      }
    ],
    implementationTime: '4-8 weeks (legal formation, IRS approval, initial funding)',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'Estate planning attorney, CPA for 990-PF preparation, foundation accountant',
    isRetroactive: false,
    deadline: 'December 31, 2025 (for 2025 charitable deduction)',
    riskLevel: 'medium',
    typicalSavingsRange: { min: 50000, max: 500000 },
    savingsFormula: 'Transferred Asset Value × Marginal Tax Rate + Capital Gains Tax Avoided + Investment Growth',
    implementationSteps: [
      'Meet with estate planning attorney',
      'Draft foundation articles of incorporation and bylaws',
      'File Form 1023 with IRS for 501(c)(3) recognition',
      'Receive IRS determination letter',
      'Fund foundation with initial contribution',
      'Establish board of directors',
      'File annual Form 990-PF',
      'Make annual charitable grants'
    ],
    taxFiling: 'Foundation files Form 990-PF; donor deducts contribution on Form 1040 Schedule A; foundation income generally tax-exempt'
  },

  // INDIVIDUAL - EDUCATION
  {
    id: 'coverdell-esa',
    title: 'Coverdell ESA - Education Savings Account',
    tier: 'individual',
    category: 'Education',
    description: 'Save up to $2,000/year per child for education expenses. Tax-free growth if used for qualified education expenses (K-12 or college). Subject to MAGI limits.',
    ircReference: 'IRC §530',
    applicableTo: ['individual'],
    incomeThreshold: { max: 235000 }, // MFJ phase-out: $220K-$235K; Single: $95K-$110K
    qualificationQuestions: [
      {
        id: 'child-age-coverdell',
        question: 'Is the child under age 18?',
        helpText: 'Coverdell ESA contributions can only be made for beneficiaries under age 18.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'magi-coverdell',
        question: 'What is your anticipated 2025 MAGI?',
        helpText: 'Coverdell has MAGI phase-out: Single $110K-$125K, MFJ $220K-$235K. Phase-out limit applies to contribution ability.',
        type: 'currency',
        required: true
      },
      {
        id: 'filing-status-coverdell',
        question: 'What is your filing status?',
        helpText: 'MAGI limits vary by filing status.',
        type: 'choice',
        required: true,
        choices: ['Single', 'Married Filing Jointly', 'Married Filing Separately', 'Head of Household']
      },
      {
        id: 'contribution-amount-coverdell',
        question: 'Will the contribution be $2,000 or less per child per year?',
        helpText: 'Coverdell maximum is $2,000 per beneficiary per year.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'education-expenses-coverdell',
        question: 'What are the anticipated education expenses for the child?',
        helpText: 'Coverdell funds can cover K-12 expenses (tuition, books, equipment, room/board in college, tutoring).',
        type: 'currency',
        required: false
      },
      {
        id: 'distribution-by-30',
        question: 'Will funds be distributed by age 30 or rolled to another family member?',
        helpText: 'Funds not used by age 30 must be distributed (subject to income tax on earnings).',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'maxed-529',
        question: 'Have you already maxed out a 529 plan?',
        helpText: 'Coverdell can supplement 529 but each have limits.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'investment-flexibility',
        question: 'Do you want investment flexibility in the account?',
        helpText: 'Coverdell offers broader investment options than 529 plans.',
        type: 'yes_no',
        required: false
      }
    ],
    implementationTime: '1-2 weeks (open account, make contribution)',
    thirdPartyNeeded: false,
    isRetroactive: false,
    deadline: 'December 31, 2025 (for 2025 contribution)',
    riskLevel: 'low',
    typicalSavingsRange: { min: 500, max: 2000 },
    savingsFormula: 'Contribution Amount × Marginal Tax Rate + Investment Growth on Earnings',
    implementationSteps: [
      'Open Coverdell ESA account (broker, bank, mutual fund company)',
      'Make annual contribution (up to $2,000 per beneficiary)',
      'Direct investment of account balance',
      'Use funds for qualified education expenses',
      'Receive distributions (tax-free if used for qualified expenses)',
      'If funds unused by age 30, distribute or rollover to sibling'
    ],
    taxFiling: 'Contributions not deductible; investment growth tax-free if distributed for education; reported on Form 1098-T (if applicable for college)'
  },

  // INDIVIDUAL - INVESTABLE GAINS
  {
    id: 'qualified-opportunity-zone',
    title: 'Qualified Opportunity Zone - Defer Capital Gains',
    tier: 'individual',
    category: 'Investable Gains',
    description: 'Invest capital gains into Opportunity Zone fund to defer/reduce federal capital gains taxes. 100% exclusion of QOZ fund gains if held 10+ years.',
    ircReference: 'IRC §1400Z-1, §1400Z-2',
    applicableTo: ['individual', 'sole_prop'],
    qualificationQuestions: [
      {
        id: 'capital-gains-qoz',
        question: 'Do you have capital gains to invest (from securities, business sale, etc.)?',
        helpText: 'QOZ requires realizable capital gains to defer.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'capital-gains-amount-qoz',
        question: 'What is the approximate amount of capital gains?',
        helpText: 'Helps determine investment opportunity zone fund size.',
        type: 'currency',
        required: true
      },
      {
        id: 'commit-10-years',
        question: 'Can you commit capital to QOZ investment for 10+ years?',
        helpText: 'Maximum benefit requires 10-year hold period for full gain exclusion.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'higher-risk-comfort',
        question: 'Are you comfortable with higher-risk growth investments?',
        helpText: 'QOZ funds typically focus on development/growth (higher risk than stable income).',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'need-access-10-years',
        question: 'Do you anticipate needing access to these funds in the next 10 years?',
        helpText: 'Early withdrawal before 10-year period reduces tax benefit.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'yes'
      },
      {
        id: 'identified-qoz-fund',
        question: 'Have you identified suitable QOZ funds/investments?',
        helpText: 'Must invest in certified QOZ business or fund.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: '180-day-window',
        question: 'Can you make the QOZ investment within 180 days of realizing the gain?',
        helpText: 'QOZ investment must occur within 180 days of gain recognition.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'tax-professional-guidance',
        question: 'Are you willing to work with tax professional on QOZ compliance?',
        helpText: 'QOZ has strict compliance requirements and reporting rules.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      }
    ],
    implementationTime: '2-4 weeks (identify fund, complete investment, file Form 8949)',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'QOZ fund manager, tax attorney for compliance review',
    isRetroactive: false,
    deadline: '180 days from capital gain recognition',
    riskLevel: 'high',
    typicalSavingsRange: { min: 10000, max: 100000 },
    savingsFormula: 'Deferred Gains × Tax Rate + Step-Up on Basis at 5/7 Year Mark',
    implementationSteps: [
      'Identify capital gain event',
      'Research QOZ funds/investments',
      'Complete QOZ fund investment within 180 days',
      'File Form 8949 reporting deferral election',
      'Track basis adjustments at 5-year and 7-year marks',
      'Hold for 10 years to qualify for full gain exclusion',
      'Maintain QOZ compliance documentation'
    ],
    taxFiling: 'Deferral election on Form 8949; basis step-up reported when gains ultimately recognized after holding period'
  },

  // INDIVIDUAL - CREDITS
  {
    id: 'child-tax-credit',
    title: 'Child Tax Credit - $2,000 per Qualifying Child',
    tier: 'individual',
    category: 'Credits',
    description: 'Claim $2,000 credit for each qualifying child under age 17. Partially refundable (up to $1,600 as ACTC). Phases out at higher incomes.',
    ircReference: 'IRC §24',
    applicableTo: ['individual'],
    qualificationQuestions: [
      {
        id: 'child-age-ctc',
        question: 'Will each child be under age 17 at the end of 2025?',
        helpText: 'Child Tax Credit only applies to children under 17 as of December 31, 2025.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'child-relationship-ctc',
        question: 'Is each child your biological child, stepchild, foster child, or descendant?',
        helpText: 'Child, stepchild, eligible foster child, brother, sister, or descendant of above.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'financial-support-ctc',
        question: 'Did you provide more than half of financial support for each child?',
        helpText: 'You must provide >50% of child\'s financial support.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'residence-test-ctc',
        question: 'Did each child live with you for more than half the year?',
        helpText: 'Child must reside with you >6 months of the year (temporary absences don\'t count against).',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'dependent-claim-ctc',
        question: 'Can each child be claimed as a dependent on your return?',
        helpText: 'Child must be eligible to be claimed as your dependent.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'ssn-ctc',
        question: 'Does each child have a valid Social Security number?',
        helpText: 'Each child must have SSN valid for employment in the U.S.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'citizen-status-ctc',
        question: 'Is each child a U.S. citizen, national, or resident alien?',
        helpText: 'Child must be U.S. citizen, national, or resident alien.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'income-limit-ctc',
        question: 'Does your MAGI meet the income test?',
        helpText: 'CTC phases out: Single $400K, MFJ $800K. Full credit available below thresholds.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      }
    ],
    implementationTime: 'Immediate (claim on tax return)',
    thirdPartyNeeded: false,
    isRetroactive: false,
    deadline: 'April 15, 2026 (2025 tax return)',
    riskLevel: 'low',
    typicalSavingsRange: { min: 2000, max: 8000 },
    savingsFormula: 'Number of Qualifying Children × $2,000 Credit (up to $1,600 refundable as ACTC)',
    implementationSteps: [
      'Verify each child qualifies (age, relationship, support, residency, dependent status, SSN, citizen status)',
      'Gather child SSNs',
      'Report on Form 1040 Schedule 8812',
      'Claim credit on tax return',
      'If overpaid tax, receive CTC and/or Additional CTC'
    ],
    taxFiling: 'Claimed on Form 1040 Schedule 8812; partially refundable as ACTC'
  },

  {
    id: 'dependent-care-credit',
    title: 'Dependent Care Credit - Childcare & Dependent Care',
    tier: 'individual',
    category: 'Credits',
    description: 'Claim credit for child/dependent care expenses paid to allow you to work. Credit between 20-35% of qualifying expenses (max $3,000 one dependent, $6,000 two+).',
    ircReference: 'IRC §21',
    applicableTo: ['individual'],
    qualificationQuestions: [
      {
        id: 'care-services-paid',
        question: 'Do you pay someone to care for a dependent so you can work?',
        helpText: 'Must have care expenses to allow taxpayer (and spouse if MFJ) to work.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'dependent-age-dcc',
        question: 'Is the dependent child under age 13 or disabled (any age)?',
        helpText: 'Dependent must be under 13, or any age but physically/mentally incapable of self-care.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'spouse-care-recipient',
        question: 'Is your spouse unable to care for themselves (full-time care recipient)?',
        helpText: 'If spouse qualifies as care recipient and lived with you 6+ months.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'other-dependent-care',
        question: 'Do you have a dependent (other than spouse/child) unable to self-care who lived with you 6+ months?',
        helpText: 'Qualifying dependent care applies to unable-to-care relatives.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'income-requirement-dcc',
        question: 'Did you (and spouse if MFJ) have earned income during the year?',
        helpText: 'Both spouses (if MFJ) must have earned income for credit to apply.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'filing-status-dcc',
        question: 'What is your filing status?',
        helpText: 'DCC allowed for Single, HOH, QW, or MFJ (not MFS except in limited cases).',
        type: 'choice',
        required: true,
        choices: ['Single', 'Married Filing Jointly', 'Head of Household', 'Qualifying Widow(er)']
      },
      {
        id: 'dependent-care-expenses',
        question: 'What are your anticipated 2025 dependent care expenses?',
        helpText: 'Credit is 20-35% of qualifying care expenses (up to $3,000 or $6,000 depending on dependents).',
        type: 'currency',
        required: true
      },
      {
        id: 'care-provider-info',
        question: 'Do you have the care provider\'s name, address, and tax ID (SSN or EIN)?',
        helpText: 'Must be able to identify care provider (name, address, EIN/SSN).',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      }
    ],
    implementationTime: 'Ongoing (track expense receipts)',
    thirdPartyNeeded: false,
    isRetroactive: false,
    deadline: 'April 15, 2026 (2025 tax return)',
    riskLevel: 'low',
    typicalSavingsRange: { min: 600, max: 2100 },
    savingsFormula: 'Qualifying Care Expenses × Credit Percentage (20%-35% based on AGI)',
    implementationSteps: [
      'Verify dependent and income requirements',
      'Collect care expense receipts/invoices',
      'Identify care provider (name, address, TIN)',
      'Calculate qualifying expenses (max $3,000 per dependent or $6,000 for 2+)',
      'Complete Form 2441',
      'Report credit on Form 1040',
      'File tax return'
    ],
    taxFiling: 'Credit claimed on Form 2441 (Child and Dependent Care Expenses) and carried to Form 1040'
  },

  // INDIVIDUAL - ADVANCED
  {
    id: 'tax-loss-harvesting',
    title: 'Tax-Loss Harvesting - Offset Investment Gains',
    tier: 'individual',
    category: 'Advanced',
    description: 'Sell investments at a loss to offset capital gains, reducing taxable income. Can carry forward unused losses indefinitely. Key to managing investment taxes.',
    ircReference: 'IRC §165, §1211',
    applicableTo: ['individual'],
    qualificationQuestions: [
      {
        id: 'investment-losses',
        question: 'Do you have investments currently trading below your cost basis?',
        helpText: 'Tax-loss harvesting requires investments with unrealized losses.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'capital-gains-to-offset',
        question: 'Do you have capital gains (from securities sales, business sale, etc.) to offset?',
        helpText: 'Tax-loss harvesting is most valuable when you have gains to offset.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'wash-sale-understanding',
        question: 'Do you understand wash sale rules (no repurchase within 30 days)?',
        helpText: 'Must wait 30 days before repurchasing same/substantially identical security.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'liquidity-for-harvesting',
        question: 'Can you hold harvested losses or immediately redeploy capital?',
        helpText: 'After harvesting, you have 30-day waiting period before buying back similar security.',
        type: 'yes_no',
        required: true
      },
      {
        id: 'long-term-vs-short-term',
        question: 'Do you understand long-term vs. short-term gain/loss impacts?',
        helpText: 'Short-term losses offset short-term gains first, then long-term gains.',
        type: 'yes_no',
        required: true
      },
      {
        id: 'annual-portfolio-review',
        question: 'Are you willing to review portfolio annually for harvesting opportunities?',
        helpText: 'Tax-loss harvesting requires annual tax planning discipline.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'carryforward-expectations',
        question: 'Do you understand unused losses carry forward indefinitely?',
        helpText: 'Excess losses beyond $3,000/year carry forward to offset future year gains.',
        type: 'yes_no',
        required: true
      },
      {
        id: 'harvestable-loss-amount',
        question: 'What is the approximate amount of unrealized losses you could harvest?',
        helpText: 'The total dollar amount of investments currently below your cost basis that could be sold for tax-loss harvesting. We need this to calculate your exact tax savings.',
        type: 'currency',
        required: true
      },
      {
        id: 'capital-gains-amount',
        question: 'What is the approximate amount of capital gains you have this year?',
        helpText: 'Total realized or expected capital gains from securities sales, business sales, etc. Losses offset gains first. Needed for accurate savings calculation.',
        type: 'currency',
        required: true
      },
      {
        id: 'concentrated-positions',
        question: 'Do you have concentrated positions in employer stock or single security?',
        helpText: 'Concentrated positions often present harvesting opportunities.',
        type: 'yes_no',
        required: false
      }
    ],
    implementationTime: 'Ongoing (typically year-end review)',
    thirdPartyNeeded: false,
    isRetroactive: false,
    deadline: 'December 31, 2025 (for 2025 tax year)',
    riskLevel: 'low',
    typicalSavingsRange: { min: 1000, max: 25000 },
    savingsFormula: 'Harvested Losses × Marginal Tax Rate',
    implementationSteps: [
      'Review portfolio for unrealized losses',
      'Identify securities to harvest',
      'Sell securities at loss',
      'Identify alternative investments (not substantially identical)',
      'Redeploy capital to alternative securities (after 30 days minimum)',
      'Track cost basis and holding periods',
      'Report sales on Form 8949 and Schedule D'
    ],
    taxFiling: 'Reported on Form 8949 (Sales of Securities) and Schedule D (Capital Gains and Losses)'
  },

  {
    id: 'home-sale-gain-exclusion',
    title: 'Sale of Home Gain Exclusion - Exclude $250K/$500K Gain',
    tier: 'individual',
    category: 'Advanced',
    description: 'Exclude up to $250,000 (single) or $500,000 (MFJ) of gain from sale of primary residence. No tax on gain if you meet ownership and use tests.',
    ircReference: 'IRC §121',
    applicableTo: ['individual'],
    qualificationQuestions: [
      {
        id: 'planning-home-sale',
        question: 'Are you planning to sell your primary residence?',
        helpText: 'Gain exclusion only applies to sale of principal residence.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'ownership-test-home',
        question: 'Have you owned the home for at least 2 of the last 5 years?',
        helpText: 'Ownership test: owned property 2+ of last 5 years.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'use-test-home',
        question: 'Have you lived in the home as your principal residence for at least 2 of the last 5 years?',
        helpText: 'Use test: lived in home 2+ of last 5 years as primary residence.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'filing-status-home-sale',
        question: 'What is your filing status?',
        helpText: 'Married filing jointly can exclude $500K; single/HOH/QW can exclude $250K.',
        type: 'choice',
        required: true,
        choices: ['Single', 'Married Filing Jointly', 'Head of Household', 'Qualifying Widow(er)']
      },
      {
        id: 'exclusion-used-recently',
        question: 'Have you used this exclusion in the last 2 years?',
        helpText: 'Can\'t use exclusion more than once every 2 years.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'yes'
      },
      {
        id: 'home-gain-amount',
        question: 'What is the approximate unrealized gain on your home sale?',
        helpText: 'Sale price minus adjusted basis (original cost + improvements - depreciation). We need this to calculate how much gain can be excluded tax-free.',
        type: 'currency',
        required: true
      },
      {
        id: 'spouse-meets-tests',
        question: 'If MFJ, does your spouse also meet ownership and use tests?',
        helpText: 'Both spouses must meet tests for full $500K exclusion.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'divorce-settlement-home',
        question: 'Did you receive the home as part of divorce settlement?',
        helpText: 'Special rules may apply for property received via divorce/spousal transfer.',
        type: 'yes_no',
        required: false
      }
    ],
    implementationTime: 'At time of sale (report on tax return)',
    thirdPartyNeeded: false,
    isRetroactive: false,
    deadline: 'April 15, 2026 (2025 tax return if 2025 sale)',
    riskLevel: 'low',
    typicalSavingsRange: { min: 50000, max: 200000 },
    savingsFormula: 'Realized Gain Excluded × Marginal Tax Rate',
    implementationSteps: [
      'Verify ownership and use tests met',
      'Calculate adjusted basis (cost + improvements)',
      'Calculate realized gain (sale price - adjusted basis)',
      'Determine excluded gain ($250K single or $500K MFJ)',
      'Report on Form 8949 and Schedule D',
      'If gain exceeds exclusion, report excess as capital gain'
    ],
    taxFiling: 'Reported on Form 8949 and Schedule D; excluded portion shows zero gain'
  },

  {
    id: 'conservation-easements-individual',
    title: 'Conservation Easements - Charitable Deduction for Land',
    tier: 'individual',
    category: 'Advanced',
    description: 'Donate a conservation easement (development rights) on land for substantial tax deduction. Allows charitable deduction while retaining ownership.',
    ircReference: 'IRC §170(h)',
    applicableTo: ['individual'],
    qualificationQuestions: [
      {
        id: 'conservation-property',
        question: 'Do you own land with conservation value?',
        helpText: 'Property must have ecological/scenic/historic significance.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'easement-compatible-land',
        question: 'Is your property eligible for conservation easement (not already heavily developed)?',
        helpText: 'Property must not be predominantly used for commercial/industrial purposes.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'itemize-easement',
        question: 'Do you itemize deductions?',
        helpText: 'Easement deduction requires itemizing (vs. standard deduction).',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'professional-appraisal',
        question: 'Are you willing to obtain professional appraisal of easement value?',
        helpText: 'Requires qualified appraiser valuation for tax deduction substantiation.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'conservation-org-identified',
        question: 'Have you identified a qualified conservation organization to hold easement?',
        helpText: 'Easement must be held by qualified charity (government, 501(c)(3)).',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'perpetual-restriction-comfort',
        question: 'Are you comfortable with perpetual conservation restriction?',
        helpText: 'Conservation easement is typically perpetual (binds you and future owners).',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'property-fmv',
        question: 'What is approximate fair market value of property?',
        helpText: 'Deduction is typically 20-50% of land value depending on easement restrictions.',
        type: 'currency',
        required: true
      },
      {
        id: 'keep-property-perpetuity',
        question: 'Do you intend to keep the property in perpetuity?',
        helpText: 'Perpetual easement should align with long-term ownership intentions.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      }
    ],
    implementationTime: '3-6 months (appraaisal, easement negotiation, legal documentation)',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'Conservation organization, appraiser, tax attorney for conservation easement',
    isRetroactive: false,
    deadline: 'December 31, 2025 (for 2025 deduction)',
    riskLevel: 'medium',
    typicalSavingsRange: { min: 10000, max: 100000 },
    savingsFormula: 'Easement Deduction Value × Marginal Tax Rate',
    implementationSteps: [
      'Identify qualified conservation organization',
      'Obtain property appraisal and easement valuation',
      'Negotiate easement restrictions and terms',
      'Draft conservation easement legal documents',
      'Execute and record easement with organization',
      'Obtain appraisal report (Form 8283-B)',
      'File Form 8283 with tax return',
      'Claim charitable deduction on Schedule A'
    ],
    taxFiling: 'Claimed on Schedule A as charitable contribution; Form 8283 (Section B) required for >$5,000 deductions'
  },

  {
    id: 'itemized-deductions',
    title: 'Itemized Deductions vs. Standard Deduction',
    tier: 'individual',
    category: 'Advanced',
    description: 'Deduct medical expenses (>7.5% AGI), mortgage interest, property taxes (SALT capped $40K), charitable giving, casualty losses, and investment interest.',
    ircReference: 'IRC §161-§275',
    applicableTo: ['individual'],
    qualificationQuestions: [
      {
        id: 'medical-expenses-itemize',
        question: 'Do you have large unreimbursed medical/dental expenses > 7.5% of AGI?',
        helpText: 'Medical/dental expenses deductible to extent exceeding 7.5% of AGI.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'mortgage-interest',
        question: 'Do you pay mortgage interest on acquisition debt ($750K+)?',
        helpText: 'Mortgage interest on up to $750K acquisition debt is deductible.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'property-taxes-itemize',
        question: 'Do you pay state/local property taxes?',
        helpText: 'Property taxes deductible subject to $40K SALT cap.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'salt-tax-payment',
        question: 'Do you pay significant state/local income or sales taxes?',
        helpText: 'State income or sales tax deductible subject to $40K SALT cap combined with property taxes.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'casualty-losses',
        question: 'Do you have large uninsured casualty/theft losses from federally declared disaster?',
        helpText: 'Casualty losses from federally declared disasters deductible (requires 10% AGI threshold met).',
        type: 'yes_no',
        required: false
      },
      {
        id: 'charitable-contributions',
        question: 'Do you make significant charitable contributions to qualified charities?',
        helpText: 'Charitable donations deductible (typically limited to 50% of AGI, higher % for appreciated securities).',
        type: 'yes_no',
        required: false
      },
      {
        id: 'gambling-losses',
        question: 'Do you have gambling losses to deduct against gambling income?',
        helpText: 'Gambling losses deductible to extent of gambling income (requires itemizing).',
        type: 'yes_no',
        required: false
      },
      {
        id: 'investment-interest-expense',
        question: 'Do you have investment interest expense from margin accounts/loans?',
        helpText: 'Investment interest deductible to extent of net investment income.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'salt-amount',
        question: 'What is your approximate total state/local tax payments (income + property)?',
        helpText: 'Combined state income tax, property tax, and sales tax. Subject to SALT cap ($40K MFJ). Needed to determine if itemizing beats the standard deduction.',
        type: 'currency',
        required: true
      },
      {
        id: 'mortgage-interest-amount',
        question: 'What is your approximate annual mortgage interest payment?',
        helpText: 'Total mortgage interest paid on acquisition debt up to $750K. Reported on Form 1098. Critical for itemization calculation.',
        type: 'currency',
        required: true
      }
    ],
    implementationTime: 'Annual tax planning (December year-end review)',
    thirdPartyNeeded: false,
    isRetroactive: false,
    deadline: 'April 15, 2026 (2025 tax return)',
    riskLevel: 'low',
    typicalSavingsRange: { min: 5000, max: 50000 },
    savingsFormula: 'Total Itemized Deductions (if > Standard Deduction) × Marginal Tax Rate',
    implementationSteps: [
      'Calculate total itemized deductions (medical, mortgage, SALT, charitable, casualty, investment interest)',
      'Compare to standard deduction (2025: $14,600 single, $29,200 MFJ)',
      'If itemized > standard, deduct itemized on Schedule A',
      'File Schedule A with Form 1040',
      'Maintain documentation (receipts, statements, appraisals)'
    ],
    taxFiling: 'Reported on Schedule A (Itemized Deductions); claimed on Form 1040'
  },

  {
    id: 'self-employed-health-insurance',
    title: 'Self-Employed Health Insurance Deduction - Above-the-Line',
    tier: 'individual',
    category: 'Advanced',
    description: 'Deduct health insurance and long-term care premiums as self-employed above-the-line deduction. Applies to self-employed, partners, S-corp shareholders (>2%).',
    ircReference: 'IRC §162(l)',
    applicableTo: ['sole_prop', 's_corp'],
    qualificationQuestions: [
      {
        id: 'self-employed-definition',
        question: 'Are you self-employed (sole proprietor, partner, or >2% S-corp shareholder)?',
        helpText: 'Above-the-line SE health insurance deduction requires self-employment income.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'earned-income-se-health',
        question: 'Did you have net self-employment income in 2025?',
        helpText: 'SE health insurance deduction cannot exceed net self-employment income.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'no-employer-coverage',
        question: 'Were you, spouse, or dependents NOT eligible for employer-subsidized health coverage?',
        helpText: 'Cannot deduct if you (spouse if MFJ, dependents) had access to subsidized employer plan.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'paid-premiums-se',
        question: 'Did you pay for health, dental, or long-term care insurance premiums for yourself, spouse, dependents?',
        helpText: 'Deductible premiums for you, spouse, dependents, and children under 27.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'premium-expense-se',
        question: 'What is your anticipated 2025 health insurance premium expense?',
        helpText: 'Helps calculate deductible amount.',
        type: 'currency',
        required: true
      },
      {
        id: 'filing-status-se-health',
        question: 'What is your filing status?',
        helpText: 'Individual, HOH, or MFJ (not MFS unless permanently separated).',
        type: 'choice',
        required: true,
        choices: ['Single', 'Married Filing Jointly', 'Head of Household', 'Qualifying Widow(er)']
      },
      {
        id: 'net-se-income',
        question: 'What is your estimated 2025 net self-employment income?',
        helpText: 'Deduction limited to SE income (cannot exceed SE net income).',
        type: 'currency',
        required: true
      },
      {
        id: 'insurance-type-se',
        question: 'Is the insurance policy health/dental/long-term care (no Medicare)?',
        helpText: 'Deductible premiums are for health, dental, long-term care (not Medicare for first time enrollee).',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      }
    ],
    implementationTime: 'Ongoing (track premium payments throughout year)',
    thirdPartyNeeded: false,
    isRetroactive: false,
    deadline: 'April 15, 2026 (2025 tax return)',
    riskLevel: 'low',
    typicalSavingsRange: { min: 3000, max: 15000 },
    savingsFormula: 'SE Health Insurance Premiums × Marginal Tax Rate',
    implementationSteps: [
      'Verify self-employment status',
      'Confirm no subsidized employer coverage available',
      'Collect health/dental/long-term care insurance premium receipts',
      'Calculate total deductible premiums (limited to SE income)',
      'Report deduction on Form 1040 (above-the-line)',
      'Reduce self-employment income by deduction before calculating SE tax'
    ],
    taxFiling: 'Deducted above-the-line on Form 1040 (separate line, not Schedule C)'
  },

  // INDIVIDUAL TIER - ROTH CONVERSION
  {
    id: 'roth-conversion',
    title: 'Roth Conversion Strategy - Tax-Free Growth',
    tier: 'individual' as StrategyTier,
    category: 'Retirement Planning',
    description: 'Convert traditional IRA/401(k) funds to Roth accounts. Pay tax now at current rates for tax-free growth and withdrawals in retirement. No income limits for conversions.',
    ircReference: 'IRC §408A(d)(3)',
    applicableTo: ['individual', 'sole_prop'] as EntityType[],
    qualificationQuestions: [
      {
        id: 'has-traditional-ira',
        question: 'Do you have a Traditional IRA, 401(k), or other pre-tax retirement account?',
        helpText: 'You need pre-tax retirement funds to convert to Roth.',
        type: 'yes_no' as QuestionType,
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'conversion-tax-ability',
        question: 'Can you pay the income tax on the conversion from non-retirement funds?',
        helpText: 'Best practice is to pay conversion taxes from outside the retirement account to maximize growth.',
        type: 'yes_no' as QuestionType,
        required: true,
      },
      {
        id: 'roth-time-horizon',
        question: 'Is your retirement at least 5 years away?',
        helpText: 'Roth conversions have a 5-year holding period before tax-free withdrawals.',
        type: 'yes_no' as QuestionType,
        required: true,
      },
      {
        id: 'current-vs-future-bracket',
        question: 'Do you expect your tax rate to be the same or higher in retirement?',
        helpText: 'Converting makes most sense when current rates are lower than expected future rates.',
        type: 'yes_no' as QuestionType,
        required: false
      },
    ],
    implementationTime: '1-2 hours',
    thirdPartyNeeded: false,
    isRetroactive: false,
    deadline: 'December 31, 2025 (for 2025 tax year)',
    riskLevel: 'low' as const,
    typicalSavingsRange: { min: 3000, max: 50000 },
    savingsFormula: 'Conversion Amount × (Future Tax Rate - Current Tax Rate) + Tax-Free Growth Over Remaining Years',
    implementationSteps: [
      'Determine optimal conversion amount based on current tax bracket',
      'Request conversion from IRA custodian (Traditional → Roth)',
      'Pay estimated taxes on the conversion amount from non-retirement funds',
      'Report conversion on Form 8606 and Form 1040',
      'Wait 5 years before withdrawing converted amounts penalty-free',
    ],
    taxFiling: 'Report on Form 8606 (Nondeductible IRAs) and Form 1040. Conversion amount added to taxable income for the year.'
  },

  // INDIVIDUAL TIER - CHARITABLE CONTRIBUTION OPTIMIZATION
  {
    id: 'charitable-contribution-optimization',
    title: 'Charitable Contribution Optimization - Strategic Giving',
    tier: 'individual' as StrategyTier,
    category: 'Charity',
    description: 'Maximize tax benefits of charitable giving through bunching, appreciated stock donations (avoid capital gains + full FMV deduction), and donor-advised funds.',
    ircReference: 'IRC §170',
    applicableTo: ['individual'] as EntityType[],
    qualificationQuestions: [
      {
        id: 'makes-charitable-gifts',
        question: 'Do you currently make charitable contributions or plan to?',
        helpText: 'This strategy optimizes the timing and form of charitable giving.',
        type: 'yes_no' as QuestionType,
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'annual-giving-amount',
        question: 'What is your approximate annual charitable giving?',
        helpText: 'We need the exact amount to calculate your tax deduction and compare itemizing vs. standard deduction.',
        type: 'currency' as QuestionType,
        required: true
      },
      {
        id: 'has-appreciated-stock',
        question: 'Do you own appreciated stocks or other assets you could donate?',
        helpText: 'Donating appreciated stock avoids capital gains tax and provides a full FMV deduction.',
        type: 'yes_no' as QuestionType,
        required: false
      },
    ],
    implementationTime: '1-2 weeks',
    thirdPartyNeeded: false,
    isRetroactive: false,
    deadline: 'December 31, 2025 (for 2025 tax year)',
    riskLevel: 'low' as const,
    typicalSavingsRange: { min: 2000, max: 25000 },
    savingsFormula: 'Charitable Contribution × Marginal Tax Rate + Capital Gains Tax Avoided on Appreciated Assets',
    implementationSteps: [
      'Calculate total planned charitable giving for the year',
      'Evaluate bunching: contribute 2 years of giving in one year to exceed standard deduction',
      'Identify appreciated stocks/assets to donate instead of cash',
      'Consider donor-advised fund for immediate deduction with multi-year distributions',
      'Report contributions on Schedule A',
    ],
    taxFiling: 'Reported on Schedule A (Itemized Deductions). Cash donations deductible up to 60% AGI. Appreciated property up to 30% AGI.'
  },

  // INDIVIDUAL TIER - REAL ESTATE PROFESSIONAL STATUS
  {
    id: 'real-estate-professional',
    title: 'Real Estate Professional Status (REPS)',
    tier: 'individual' as StrategyTier,
    category: 'Advanced',
    description: 'Qualify as a Real Estate Professional to deduct rental losses against all income without the $25K passive activity limitation. Requires 750+ hours and majority of working time in real property.',
    ircReference: 'IRC §469(c)(7)',
    applicableTo: ['individual', 'sole_prop'] as EntityType[],
    incomeThreshold: { min: 100000 },
    qualificationQuestions: [
      {
        id: 'real-estate-hours',
        question: 'Do you or your spouse spend 750+ hours per year in real estate activities?',
        helpText: 'Must materially participate in real property trades or businesses.',
        type: 'yes_no' as QuestionType,
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'majority-time-re',
        question: 'Is more than half of your total working time spent in real estate?',
        helpText: 'Real estate must be your primary occupation or activity.',
        type: 'yes_no' as QuestionType,
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'has-rental-losses',
        question: 'Do you have rental property losses to deduct?',
        helpText: 'REPS allows unlimited rental loss deductions against other income.',
        type: 'yes_no' as QuestionType,
        required: true,
        disqualifyOn: 'no'
      },
    ],
    implementationTime: 'Ongoing (must maintain year-round)',
    thirdPartyNeeded: false,
    isRetroactive: false,
    deadline: 'December 31, 2025',
    riskLevel: 'medium' as const,
    typicalSavingsRange: { min: 10000, max: 100000 },
    savingsFormula: 'Total Rental Losses × Marginal Tax Rate (losses no longer limited by passive activity rules)',
    implementationSteps: [
      'Track all hours spent in real property trades or businesses',
      'Ensure 750+ hours and majority of working time test',
      'Document material participation in each rental activity',
      'Elect to aggregate rental activities if beneficial',
      'Report on Schedule E with real estate professional status indicated',
    ],
    taxFiling: 'Rental losses reported on Schedule E. Must document hour logs. No Form 8582 passive loss limitation applies.'
  },

  // BUSINESS TIER - ENTITY ELECTION
  {
    id: 'partnership-entity-election',
    title: 'Partnership Entity Election',
    tier: 'business',
    category: 'Entity Election',
    description: 'Multi-member LLC or partnership elects to be taxed as partnership. Provides pass-through taxation with flexible distributions and loss allocation.',
    ircReference: 'IRC §761(a), §704',
    applicableTo: ['llc', 'partnership'],
    qualificationQuestions: [
      {
        id: 'entity-type-partnership-election',
        question: 'Is your business a multi-member LLC or partnership?',
        helpText: 'Partnership election applies to partnerships and multi-member LLCs.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'current-election-partnership',
        question: 'Are you currently taxed as a partnership or C-corporation?',
        helpText: 'If currently C-corp, partnership election is major change.',
        type: 'choice',
        required: true,
        choices: ['Partnership', 'C-Corporation', 'S-Corporation', 'Unsure']
      },
      {
        id: 'members-count',
        question: 'How many members/partners do you have?',
        helpText: 'Partnership requires 2+ members.',
        type: 'number',
        required: true
      },
      {
        id: 'loss-allocation-flexibility',
        question: 'Do you need flexibility in allocating profits/losses among members?',
        helpText: 'Partnership allows special allocations (not pro-rata).',
        type: 'yes_no',
        required: false
      },
      {
        id: 'capital-contributions-vary',
        question: 'Do members have varying capital contributions?',
        helpText: 'Partnership allows different ownership percentages and allocations.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'passthrough-preferred',
        question: 'Do you prefer pass-through taxation vs. entity-level tax?',
        helpText: 'Partnership provides pass-through (no entity-level tax); C-corp has entity tax.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'state-tax-considerations',
        question: 'Are you concerned about state-level entity taxes?',
        helpText: 'Some states impose partnership-level taxes; LLC taxation may vary.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'form-1065-filing',
        question: 'Are you willing to file annual Form 1065 partnership return?',
        helpText: 'Partnership election requires annual Form 1065 filing and K-1 distribution.',
        type: 'yes_no',
        required: true,
      }
    ],
    implementationTime: '1-2 weeks (file Form 8832 or default election)',
    thirdPartyNeeded: false,
    isRetroactive: true,
    deadline: 'December 31, 2025 (for 2025 tax year)',
    riskLevel: 'low',
    typicalSavingsRange: { min: 5000, max: 50000 },
    savingsFormula: '(Entity-Level Tax - Pass-Through Member Taxes) if lower',
    implementationSteps: [
      'Verify LLC/partnership status',
      'Determine current tax classification',
      'File Form 8832 (entity election) if needed',
      'Ensure partnership agreement allows partnership taxation',
      'File Form 1065 for first partnership year',
      'Issue K-1s to members'
    ],
    taxFiling: 'File Form 1065 (partnership return) and issue Schedule K-1 to members'
  },

  {
    id: 's-corp-election',
    title: 'S Corporation Election - Pass-Through with Salary/Dividend Split',
    tier: 'business',
    category: 'Entity Election',
    description: 'Eligible business elects S-corp status. Provides pass-through taxation with ability to split income into W-2 wages and distributions, minimizing self-employment taxes.',
    ircReference: 'IRC §1362',
    applicableTo: ['llc', 's_corp', 'c_corp'],
    qualificationQuestions: [
      {
        id: 'entity-type-s-corp',
        question: 'Is your business a domestic corporation, LLC, or partnership?',
        helpText: 'S-corp election available to eligible domestic entities.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'shareholder-count-s-corp',
        question: 'Do you have 100 or fewer shareholders?',
        helpText: 'S-corp limited to 100 shareholders.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'shareholder-residency-s-corp',
        question: 'Are all shareholders U.S. residents or citizens?',
        helpText: 'S-corp shareholders must be U.S. citizens, nationals, or resident aliens.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'one-class-stock-s-corp',
        question: 'Does your entity have only one class of stock with identical voting rights?',
        helpText: 'S-corp requirement: one class of stock (can have voting/non-voting differences, but only one class).',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'business-income-s-corp',
        question: 'What is your anticipated 2025 net business income?',
        helpText: 'S-corp election is most valuable for profitable businesses.',
        type: 'currency',
        required: true
      },
      {
        id: 'owner-compensation-s-corp',
        question: 'Will you take a W-2 salary from the S-corp?',
        helpText: 'S-corp requires reasonable W-2 salary (salary + distributions strategy).',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'payroll-capacity-s-corp',
        question: 'Do you have payroll infrastructure to process W-2 wages?',
        helpText: 'S-corp requires payroll processing, withholding, employment tax filings.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'current-election-s-corp',
        question: 'Are you currently taxed as a C-corp or sole proprietor?',
        helpText: 'S-corp election can be from C-corp, partnership, or sole prop.',
        type: 'choice',
        required: true,
        choices: ['Sole Proprietorship', 'Partnership', 'C-Corporation', 'Already S-corp']
      }
    ],
    implementationTime: '2-3 weeks (IRS Form 2553 filing, payroll setup)',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'Payroll processor (ADP, Guidepoint, Zenefits), accountant for payroll setup',
    isRetroactive: true,
    deadline: 'March 15, 2026 (Form 2553 with 2025 tax return)',
    riskLevel: 'medium',
    typicalSavingsRange: { min: 5000, max: 50000 },
    savingsFormula: '(Net Income - Reasonable Salary) × (SE Tax Rate - Corporate Tax Rate)',
    implementationSteps: [
      'Verify S-corp eligibility (domestic, ≤100 US shareholders, one class stock)',
      'File Form 2553 (S-corp election) with IRS',
      'Set up payroll processing and W-2 wage structure',
      'Implement reasonable salary strategy',
      'File Form 1120-S (S-corp return)',
      'Issue W-2s and K-1s to owners'
    ],
    taxFiling: 'File Form 1120-S (S-corp return) and Form 941 (payroll tax return), issue W-2s and K-1s'
  },

  {
    id: 'schedule-c-entity',
    title: 'Schedule C Entity - Sole Proprietorship',
    tier: 'business',
    category: 'Entity Election',
    description: 'Operate as sole proprietorship reported on Schedule C. Simplest entity structure with all income/losses flowing to individual return.',
    ircReference: 'IRC §1402',
    applicableTo: ['sole_prop'],
    qualificationQuestions: [
      {
        id: 'sole-owner-schedule-c',
        question: 'Is there a single owner of the business?',
        helpText: 'Schedule C sole proprietorship requires single owner.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'no-separate-entity-schedule-c',
        question: 'Have you not formed an LLC, corporation, or partnership?',
        helpText: 'Schedule C is default for unincorporated sole proprietorship.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'yes'
      },
      {
        id: 'business-income-schedule-c',
        question: 'What is your anticipated 2025 net business income?',
        helpText: 'Helps assess if Schedule C is optimal vs. entity election.',
        type: 'currency',
        required: true
      },
      {
        id: 'simplicity-priority-schedule-c',
        question: 'Do you prioritize simplicity over tax savings?',
        helpText: 'Schedule C is simplest structure but may not provide SE tax savings.',
        type: 'yes_no',
        required: true
      },
      {
        id: 'liability-concern-schedule-c',
        question: 'Are you concerned about business liability exposure?',
        helpText: 'Sole proprietorship offers no liability protection (vs. LLC/corp).',
        type: 'yes_no',
        required: false
      },
      {
        id: 'self-employment-income-schedule-c',
        question: 'Will you have self-employment income subject to SE tax?',
        helpText: 'Schedule C is subject to full self-employment tax (no payroll splitting).',
        type: 'yes_no',
        required: true
      },
      {
        id: 'estimated-tax-capacity-schedule-c',
        question: 'Can you track estimated quarterly tax payments?',
        helpText: 'Schedule C often requires quarterly estimated tax payments.',
        type: 'yes_no',
        required: true
      },
      {
        id: 'business-deductions-schedule-c',
        question: 'Do you have significant business deductions (home office, supplies, etc.)?',
        helpText: 'Schedule C allows full deduction of business expenses.',
        type: 'yes_no',
        required: false
      }
    ],
    implementationTime: 'Immediate (no filing required; default classification)',
    thirdPartyNeeded: false,
    isRetroactive: false,
    deadline: 'April 15, 2026 (2025 tax return)',
    riskLevel: 'low',
    typicalSavingsRange: { min: 0, max: 5000 },
    savingsFormula: 'Minimal (Schedule C is default; no election savings)',
    implementationSteps: [
      'Confirm sole proprietor status',
      'Do not file formal entity election',
      'Track business income and expenses',
      'File Schedule C with Form 1040',
      'Pay estimated quarterly taxes',
      'Pay self-employment tax via Schedule SE'
    ],
    taxFiling: 'Report on Schedule C (Profit or Loss from Business), pay SE tax via Schedule SE'
  },

  {
    id: 'c-corp-election',
    title: 'C Corporation Election - 21% Corporate Tax Rate',
    tier: 'business',
    category: 'Entity Election',
    description: 'Elect to be taxed as C-corporation. Entity pays 21% federal corporate tax on net income; no pass-through to owners (double taxation on dividends).',
    ircReference: 'IRC §1362(d)',
    applicableTo: ['llc', 's_corp', 'c_corp'],
    qualificationQuestions: [
      {
        id: 'entity-type-c-corp',
        question: 'Is your business a domestic corporation or LLC?',
        helpText: 'C-corp election available for eligible domestic entities.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'reinvest-earnings-c-corp',
        question: 'Do you plan to reinvest earnings in the business rather than distribute?',
        helpText: 'C-corp is beneficial if you retain earnings (avoid dividend double-tax).',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'business-income-c-corp',
        question: 'What is your anticipated 2025 business income?',
        helpText: 'C-corp 21% rate vs. personal rate determines benefit.',
        type: 'currency',
        required: true
      },
      {
        id: 'personal-tax-bracket-c-corp',
        question: 'What is your anticipated 2025 personal tax bracket?',
        helpText: 'C-corp is beneficial if 21% corp rate < personal tax rate.',
        type: 'choice',
        required: true,
        choices: ['10%', '12%', '22%', '24%', '32%', '35%', '37%']
      },
      {
        id: 'dividend-distribution-c-corp',
        question: 'Do you plan to take distributions/dividends from the company?',
        helpText: 'Distributions create double-taxation; C-corp disadvantage if taking distributions.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'business-loss-c-corp',
        question: 'Do you anticipate losses in early years?',
        helpText: 'C-corp losses trapped at entity level (cannot flow through to offset personal income).',
        type: 'yes_no',
        required: false
      },
      {
        id: 'section-1244-stock',
        question: 'Are you interested in Section 1244 stock loss treatment?',
        helpText: 'C-corp allows Section 1244 small business stock (loss treated as ordinary, not capital).',
        type: 'yes_no',
        required: false
      },
      {
        id: 'current-s-corp-c-corp',
        question: 'Are you currently an S-corp?',
        helpText: 'S-corp revocation to C-corp creates built-in gains tax potential.',
        type: 'yes_no',
        required: false
      }
    ],
    implementationTime: '1-2 weeks (file Form 8832 revocation if S-corp)',
    thirdPartyNeeded: false,
    isRetroactive: false,
    deadline: 'December 31, 2025 (for 2025 tax year)',
    riskLevel: 'medium',
    typicalSavingsRange: { min: 0, max: 30000 },
    savingsFormula: '(Personal Tax Rate - 21% Corp Rate) × Retained Earnings',
    implementationSteps: [
      'Verify entity is eligible for C-corp election',
      'File Form 8832 (entity election) with IRS',
      'Set up corporate tax accounting and payroll',
      'File Form 1120 (corporate tax return)',
      'Track retained earnings vs. distributions',
      'Plan for dividend taxation at shareholder level'
    ],
    taxFiling: 'File Form 1120 (U.S. Corporate Income Tax Return)'
  },

  {
    id: 'late-s-corp-election',
    title: 'Late S Corporation Election - Retroactive S-Corp Status',
    tier: 'business',
    category: 'Entity Election',
    description: 'File late S-corp election (Form 2553) to get retroactive S-corp treatment. Available if business was eligible but failed to timely elect.',
    ircReference: 'IRC §1362(b)',
    applicableTo: ['llc', 's_corp', 'c_corp'],
    qualificationQuestions: [
      {
        id: 'eligible-late-s-corp',
        question: 'Is your business domestic, ≤100 US resident shareholders, one class stock?',
        helpText: 'Late S-corp requires entity to meet all S-corp eligibility tests.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'missed-timely-election',
        question: 'Did you fail to timely file S-corp election for current/prior year?',
        helpText: 'Late election available if you missed the deadline.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'no-prior-s-termination',
        question: 'Has your S-corp election NOT been terminated in past 5 years?',
        helpText: 'Cannot reelect S-corp if terminated in past 5 years (with limited exceptions).',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'reasonable-cause-late-s',
        question: 'Do you have reasonable cause for late election (error, accountant oversight)?',
        helpText: 'IRS considers reasonable cause for late election relief.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'year-wanting-retroactive',
        question: 'What year do you want the S-corp election to be retroactive to?',
        helpText: 'Late election can cover current year and possibly prior years.',
        type: 'choice',
        required: true,
        choices: ['Current year only', 'Prior year (1 year back)', 'Multiple prior years']
      },
      {
        id: 'payroll-setup-late-s',
        question: 'Are you willing to set up payroll for W-2 wages?',
        helpText: 'S-corp requires payroll processing for all years claimed retroactively.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'irs-consent-late-s',
        question: 'Are you willing to file IRS Form 2553 with request for late filing relief?',
        helpText: 'Late election requires Form 2553 filed with explanation and reasonable cause.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'tax-professional-help-late-s',
        question: 'Are you willing to work with tax professional on late election?',
        helpText: 'Late S-corp election is complex and usually requires professional assistance.',
        type: 'yes_no',
        required: true,
      }
    ],
    implementationTime: '3-4 weeks (IRS request, potential correspondence)',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'CPA or tax attorney for late election request and IRS correspondence',
    isRetroactive: true,
    deadline: 'As soon as possible (cannot be filed after statute expires)',
    riskLevel: 'high',
    typicalSavingsRange: { min: 5000, max: 30000 },
    savingsFormula: 'SE Tax Savings from Prior Year(s) × Years Claimed',
    implementationSteps: [
      'Verify all S-corp eligibility requirements met',
      'File Form 2553 (late election) with IRS',
      'Include statement explaining reasonable cause for late filing',
      'Retroactively set up payroll and W-2 treatment for prior years',
      'Amend prior year returns (1040-X) if necessary',
      'Respond to any IRS inquiries'
    ],
    taxFiling: 'File amended Form 1040-X for prior years; file 1120-S for retroactive S-corp years'
  },

  // BUSINESS - COMPENSATION
  {
    id: 'compensation-optimization',
    title: 'Compensation Optimization / Reasonable Compensation',
    tier: 'business',
    category: 'Compensation',
    description: 'S-corp owners optimize salary vs. distributions to minimize self-employment tax. Salary must be reasonable, then excess profits distributed.',
    ircReference: 'IRC §162(a)(1)',
    applicableTo: ['s_corp', 'llc', 'c_corp'],
    qualificationQuestions: [
      {
        id: 'entity-s-corp-comp',
        question: 'Is your business taxed as an S-corporation?',
        helpText: 'Compensation optimization is unique S-corp advantage.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'owner-works-in-business',
        question: 'Do you work actively in the business?',
        helpText: 'S-corp owners taking compensation must provide services.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'annual-profits-comp',
        question: 'What are anticipated 2025 net business profits?',
        helpText: 'Optimization works best with substantial net income after wages.',
        type: 'currency',
        required: true
      },
      {
        id: 'similar-business-wages',
        question: 'What do comparable positions pay in your industry?',
        helpText: 'IRS requires salary to be reasonable for services performed.',
        type: 'currency',
        required: true
      },
      {
        id: 'documentation-capacity',
        question: 'Can you document the reasonableness of your salary?',
        helpText: 'Must justify salary with job description, industry benchmarks, etc.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'distribution-plan',
        question: 'Will you distribute profits as dividends/distributions?',
        helpText: 'Salary + distributions strategy saves FICA taxes.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'payroll-processing',
        question: 'Do you have payroll system to process W-2 wages?',
        helpText: 'Requires proper W-2 processing and withholding.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'business-plan-comp',
        question: 'Does your business plan account for salary expenses?',
        helpText: 'Salary is business expense; reduces taxable income.',
        type: 'yes_no',
        required: true
      }
    ],
    implementationTime: 'Ongoing (annual salary determination)',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'Accountant for reasonable salary documentation, payroll processor',
    isRetroactive: false,
    deadline: 'December 31, 2025 (for 2025 tax year)',
    riskLevel: 'medium',
    typicalSavingsRange: { min: 5000, max: 40000 },
    savingsFormula: '(Distribution Amount) × (SE Tax Rate - 0%) assuming distributions not subject to SE tax',
    implementationSteps: [
      'Research reasonable salary for your position/industry',
      'Document market data and justification',
      'Set W-2 salary amount (reasonable compensation)',
      'Pay W-2 salary through payroll',
      'Distribute remaining profits as S-corp distributions',
      'File Form 1120-S and W-2s'
    ],
    taxFiling: 'W-2 wages on Form 941 and W-2; distributions on Form 1120-S Schedule K'
  },

  {
    id: 'deferred-compensation-business',
    title: 'Deferred Compensation Plan (Business) - Defer Owner/Employee Pay',
    tier: 'business',
    category: 'Compensation',
    description: 'Business-sponsored deferred compensation plan allowing owners/employees to defer salary/bonus to future years (§409A compliant).',
    ircReference: 'IRC §409A',
    applicableTo: ['s_corp', 'c_corp', 'partnership'],
    qualificationQuestions: [
      {
        id: 'business-sponsoring-plan',
        question: 'Are you willing to sponsor a deferred compensation plan?',
        helpText: 'Requires employer-sponsored §409A compliant plan document.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'owner-deferral-amount',
        question: 'What annual amount would the owner defer?',
        helpText: 'Helps assess feasibility and cash flow impact.',
        type: 'currency',
        required: true
      },
      {
        id: 'employee-participation',
        question: 'Will employees also participate in deferrals?',
        helpText: 'Can offer to both owner and employees (must be §409A compliant).',
        type: 'yes_no',
        required: false
      },
      {
        id: '409a-expertise',
        question: 'Do you have tax expertise or will hire professional for §409A compliance?',
        helpText: 'Deferred comp plans must comply with §409A (strict timing/distribution rules).',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'deferral-period',
        question: 'How long will deferred comp be deferred (years)?',
        helpText: 'Must specify distribution date in plan (retirement, separation, specified year, etc.).',
        type: 'number',
        required: true
      },
      {
        id: 'financial-stability',
        question: 'Is your business financially stable to support deferral obligations?',
        helpText: 'Deferred comp is unsecured liability on business books.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'plan-documentation',
        question: 'Are you willing to document plan in writing per §409A?',
        helpText: 'Plan must be in writing with specific terms before deferrals made.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'lower-future-bracket',
        question: 'Do you expect to be in lower tax bracket at deferral distribution?',
        helpText: 'Deferral benefit depends on tax bracket difference.',
        type: 'yes_no',
        required: false
      }
    ],
    implementationTime: '2-3 weeks (plan drafting, §409A compliance review)',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'Tax attorney for §409A plan document, tax advisor for compliance',
    isRetroactive: false,
    deadline: 'Before deferrals made (typically before December 31)',
    riskLevel: 'medium',
    typicalSavingsRange: { min: 5000, max: 30000 },
    savingsFormula: 'Deferred Amount × (Current Tax Rate - Future Tax Rate)',
    implementationSteps: [
      'Draft §409A compliant plan document',
      'Have attorney review for compliance',
      'Present plan to owner/employees',
      'Obtain deferrals elections (before year-end)',
      'Document deferral in payroll system',
      'Track deferred balance and distribution dates',
      'Report on payroll when distributed'
    ],
    taxFiling: 'Deferred comp not on current W-2; reported when actually/constructively received'
  },

  // BUSINESS - DEDUCTIONS
  {
    id: 'augusta-rule',
    title: 'Augusta Rule - Rent Personal Home to Business',
    tier: 'business',
    category: 'Deductions',
    description: 'Rent personal residence to business for up to 14 days per year tax-free (IRC §280A(g)). Business deducts rent; no income reported by homeowner.',
    ircReference: 'IRC §280A(g)',
    applicableTo: ['sole_prop', 's_corp', 'c_corp', 'llc', 'partnership'],
    qualificationQuestions: [
      {
        id: 'personal-residence',
        question: 'Do you own a personal residence that could host business events?',
        helpText: 'Augusta Rule applies to rental of personal home.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'business-meetings-home',
        question: 'Would you be willing to hold business-related meetings at your home?',
        helpText: 'Augusta Rule limited to 14 days/year of business use.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'meeting-frequency',
        question: 'How many days per year would you use home for business meetings?',
        helpText: 'Augusta Rule limited to 14 days/year (including employee occupancy).',
        type: 'number',
        required: true
      },
      {
        id: 'fair-market-rental',
        question: 'What is the fair market daily rental rate for comparable meeting space?',
        helpText: 'Rent must be reasonable FMV for the location/size.',
        type: 'currency',
        required: true
      },
      {
        id: 'business-entity',
        question: 'Do you have a separate business entity to sign rental agreement?',
        helpText: 'Rental agreement should be between business entity and owner.',
        type: 'yes_no',
        required: true
      },
      {
        id: 'rental-agreement-willing',
        question: 'Are you willing to execute a written rental agreement?',
        helpText: 'Should document rental arrangement in writing.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'personal-use-days',
        question: 'How many days is the home used for personal purposes?',
        helpText: 'Augusta Rule requires <14 days business, unlimited personal use.',
        type: 'number',
        required: true
      },
      {
        id: 'available-documentation',
        question: 'Can you document business meetings and fair market rent?',
        helpText: 'Should maintain calendar of business meetings and rent receipts.',
        type: 'yes_no',
        required: true,
      }
    ],
    implementationTime: '1-2 weeks (rental agreement drafting)',
    thirdPartyNeeded: false,
    isRetroactive: false,
    deadline: 'December 31, 2025 (for 2025 deduction)',
    riskLevel: 'medium',
    typicalSavingsRange: { min: 2000, max: 15000 },
    savingsFormula: 'Fair Market Rental Rate × Days Used × Business Tax Rate',
    implementationSteps: [
      'Determine fair market rental rate for comparable space',
      'Draft written rental agreement between business and owner',
      'Maintain calendar of business meetings held at home',
      'Pay rent to owner from business account',
      'Document rent payments',
      'Deduct rent on business tax return (Schedule C, Form 1120, etc.)',
      'Owner reports no income from rental (IRC §280A(g) exemption)'
    ],
    taxFiling: 'Business deducts rent expense; owner reports no rental income (IRC §280A(g) exemption applies)'
  },

  {
    id: 'business-meals',
    title: 'Business Meals - 50% Deduction',
    tier: 'business',
    category: 'Deductions',
    description: 'Deduct 50% of business meal and entertainment expenses (75% for meals during business travel in certain situations). Meals must be ordinary and necessary.',
    ircReference: 'IRC §162(e), §274',
    applicableTo: ['sole_prop', 's_corp', 'c_corp', 'llc', 'partnership'],
    qualificationQuestions: [
      {
        id: 'business-meals-expenses',
        question: 'Do you incur meal expenses while conducting business?',
        helpText: 'Business meals must be ordinary and necessary for business purposes.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'meal-with-business-purpose',
        question: 'Are meals associated with direct business discussions or entertainment?',
        helpText: 'Meals must have clear business purpose (client meeting, business discussion, etc.).',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'annual-meal-expenses',
        question: 'What are your anticipated 2025 business meal expenses?',
        helpText: 'Helps estimate deductible amount.',
        type: 'currency',
        required: false
      },
      {
        id: 'meal-documentation',
        question: 'Can you document meal expenses (date, amount, attendees, purpose)?',
        helpText: 'Must maintain records of date, amount, attendees, and business purpose.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'client-entertainment-vs-solo',
        question: 'Are meals with clients/customers or primarily for yourself?',
        helpText: 'Client meals are deductible; meals eaten alone may not qualify.',
        type: 'choice',
        required: true,
        choices: ['Meals with clients/vendors', 'Meals with employees', 'Solo business meals', 'Mix of both']
      },
      {
        id: 'lavish-meals',
        question: 'Are meal expenses reasonable (not lavish or extravagant)?',
        helpText: 'Meals must not be lavish or extravagant to be deductible.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'receipt-retention',
        question: 'Will you retain receipts and documentation for all meals?',
        helpText: 'Meals >$75 typically require written substantiation.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'accounting-system-meals',
        question: 'Do you have accounting system to track meal expenses?',
        helpText: 'Separate category for meal expenses aids deduction tracking.',
        type: 'yes_no',
        required: false
      }
    ],
    implementationTime: 'Ongoing (track throughout year)',
    thirdPartyNeeded: false,
    isRetroactive: false,
    deadline: 'December 31, 2025 (for 2025 deduction)',
    riskLevel: 'low',
    typicalSavingsRange: { min: 500, max: 5000 },
    savingsFormula: 'Business Meal Expenses × 50% × Business Tax Rate',
    implementationSteps: [
      'Separate business meal expenses from personal meals',
      'Obtain and retain receipts for each meal',
      'Document attendees and business purpose',
      'Record in accounting system with business purpose',
      'Maintain contemporaneous written substantiation',
      'Deduct 50% of total meal expenses on tax return'
    ],
    taxFiling: 'Deduct on Schedule C (meals and entertainment) or Form 1120'
  },

  {
    id: 'travel-expenses',
    title: 'Travel Expenses - Deduct Business Travel Costs',
    tier: 'business',
    category: 'Deductions',
    description: 'Deduct ordinary and necessary business travel expenses including airfare, lodging, meals (50%), ground transportation, and business-related incidentals.',
    ircReference: 'IRC §162(a)(2)',
    applicableTo: ['sole_prop', 's_corp', 'c_corp', 'llc', 'partnership'],
    qualificationQuestions: [
      {
        id: 'business-travel-trips',
        question: 'Do you travel for business purposes (meetings, client visits, conferences)?',
        helpText: 'Travel must be away from home for business purposes.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'away-from-home-requirement',
        question: 'Will your trips require you to be away from your home/office overnight?',
        helpText: 'To deduct travel, must be away from "home" long enough to require rest.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'business-purpose-travel',
        question: 'Is the primary purpose of travel business-related (not pleasure)?',
        helpText: 'Travel must have primary business purpose (not primarily personal vacation).',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'annual-travel-expenses',
        question: 'What are your anticipated 2025 business travel expenses?',
        helpText: 'Helps estimate total deductible travel costs.',
        type: 'currency',
        required: false
      },
      {
        id: 'travel-documentation',
        question: 'Can you document travel expenses (airfare, hotel, meals, transportation)?',
        helpText: 'Must retain receipts for expenses.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'domestic-vs-international',
        question: 'Will travel be domestic, international, or both?',
        helpText: 'International travel has additional substantiation requirements.',
        type: 'choice',
        required: false,
        choices: ['Domestic only', 'International', 'Both']
      },
      {
        id: 'spouse-travel',
        question: 'Will your spouse travel with you (and if so, what is their role)?',
        helpText: 'Spouse expenses generally not deductible unless spouse is employee doing business purpose.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'personal-vacation-component',
        question: 'Will any trips have a personal vacation component?',
        helpText: 'Only business portion of trip is deductible (must allocate personal vs. business).',
        type: 'yes_no',
        required: false
      }
    ],
    implementationTime: 'Ongoing (track throughout year)',
    thirdPartyNeeded: false,
    isRetroactive: false,
    deadline: 'December 31, 2025 (for 2025 deduction)',
    riskLevel: 'low',
    typicalSavingsRange: { min: 2000, max: 20000 },
    savingsFormula: 'Business Travel Expenses × Business Tax Rate',
    implementationSteps: [
      'Determine that travel is away from home and business-related',
      'Retain airfare/transportation receipts',
      'Retain hotel/lodging receipts',
      'Document meals (50% deductible) with business purpose',
      'Track ground transportation (car rental, taxi, etc.)',
      'Record business purpose of trip',
      'Allocate any personal component of trip',
      'Deduct business portion on tax return'
    ],
    taxFiling: 'Deduct on Schedule C or Form 1120 under travel expenses'
  },

  {
    id: 'accountable-plan',
    title: 'Accountable Plan - Reimburse Expenses Tax-Free',
    tier: 'business',
    category: 'Deductions',
    description: 'Establish accountable plan to reimburse employees/owners for business expenses tax-free. Must meet three requirements: business connection, substantiation, and timely return.',
    ircReference: 'IRC §162(d), Reg. §1.62-2',
    applicableTo: ['s_corp', 'c_corp', 'llc', 'partnership'],
    qualificationQuestions: [
      {
        id: 'employee-reimbursements',
        question: 'Do you reimburse employees for business expenses (travel, meals, mileage, etc.)?',
        helpText: 'Accountable plan governs employee reimbursements.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'home-office-business',
        question: 'Do you have a home office?',
        helpText: 'Accountable plan can cover home office allocation.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'home-office-percentage',
        question: 'What percentage of time is spent in home office for business?',
        helpText: 'Helps determine home office allocation if applicable.',
        type: 'number',
        required: false
      },
      {
        id: 'spouse-home-office',
        question: 'If married, does spouse have a home office?',
        helpText: 'Spouse home office can be separate allocation.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'spouse-home-office-percentage',
        question: 'If spouse has home office, what percentage is business use?',
        helpText: 'Spouse percentage used in accountable plan allocation.',
        type: 'number',
        required: false
      },
      {
        id: 'business-travel-employees',
        question: 'Do employees travel for business?',
        helpText: 'Accountable plan covers travel reimbursements.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'other-business-expenses',
        question: 'Do you reimburse employees for other business expenses (supplies, tools, etc.)?',
        helpText: 'Accountable plan covers various business expense reimbursements.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'documentation-capacity-ap',
        question: 'Can you maintain documentation of all reimbursable expenses?',
        helpText: 'Accountable plan requires substantiation (receipts, business purpose, etc.).',
        type: 'yes_no',
        required: true,
      }
    ],
    implementationTime: '1-2 weeks (accountable plan document drafting)',
    thirdPartyNeeded: false,
    isRetroactive: false,
    deadline: 'Before reimburements made (typically document before year-end)',
    riskLevel: 'low',
    typicalSavingsRange: { min: 5000, max: 30000 },
    savingsFormula: 'Reimbursable Expenses × (1 - Non-Accountable Plan Tax Rate)',
    implementationSteps: [
      'Draft written accountable plan document',
      'Define covered reimbursable expenses',
      'Establish substantiation requirements (receipts, documentation)',
      'Implement timely return/reconciliation process',
      'Employees submit claims with documentation',
      'Business reimburses per plan',
      'Deduct reimbursements on business tax return',
      'No W-2 wages reported for reimbursements (vs. non-accountable plan)'
    ],
    taxFiling: 'Reimbursements deductible on business return; not reported as W-2 wages if accountable plan'
  },

  {
    id: 'home-office-mileage',
    title: 'Home Office / Mileage - Deduct Home-Based Business Expenses',
    tier: 'business',
    category: 'Deductions',
    description: 'Deduct home office expenses using regular (actual) or simplified method ($5.00/sq ft, max 300 sq ft = $1,500/year). Or deduct business mileage at IRS rate.',
    ircReference: 'IRC §280A',
    applicableTo: ['sole_prop', 's_corp', 'llc'],
    qualificationQuestions: [
      {
        id: 'home-office-exists',
        question: 'Do you have a dedicated space in your home used exclusively for business?',
        helpText: 'Home office must be regular/exclusive business use (not multi-purpose).',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'home-office-square-footage',
        question: 'What is the square footage of your home office?',
        helpText: 'Used to calculate simplified or actual method deduction.',
        type: 'number',
        required: true
      },
      {
        id: 'total-home-square-footage',
        question: 'What is the total square footage of your home?',
        helpText: 'Used to calculate percentage for actual method.',
        type: 'number',
        required: true
      },
      {
        id: 'method-choice-home',
        question: 'Will you use simplified method or actual expense method?',
        helpText: 'Simplified: $5/sq ft. Actual: allocate mortgage/rent, utilities, maintenance, etc.',
        type: 'choice',
        required: true,
        choices: ['Simplified Method ($5/sq ft)', 'Actual Expense Method']
      },
      {
        id: 'annual-home-expenses',
        question: 'What are your annual home expenses (rent/mortgage, utilities, insurance, repairs)?',
        helpText: 'Used if choosing actual method (allocate to office percentage).',
        type: 'currency',
        required: false
      },
      {
        id: 'business-mileage-driven',
        question: 'Do you drive for business purposes?',
        helpText: 'Mileage deduction available for business-related driving.',
        type: 'yes_no',
        required: false
      },
      {
        id: 'annual-business-miles',
        question: 'Estimate annual business miles driven in 2025.',
        helpText: 'Business mileage deducted at IRS rate (typically $0.67/mile for 2025).',
        type: 'number',
        required: false
      },
      {
        id: 'mileage-documentation',
        question: 'Can you maintain mileage records (log book or tracking)?',
        helpText: 'Must document business mileage contemporaneously.',
        type: 'yes_no',
        required: false
      }
    ],
    implementationTime: 'Ongoing (monthly tracking)',
    thirdPartyNeeded: false,
    isRetroactive: false,
    deadline: 'December 31, 2025 (for 2025 deduction)',
    riskLevel: 'low',
    typicalSavingsRange: { min: 2000, max: 10000 },
    savingsFormula: 'Home Office Deduction OR Mileage × IRS Rate × Tax Rate',
    implementationSteps: [
      'Confirm exclusive business use of home office',
      'Choose simplified ($5/sq ft) or actual method',
      'If simplified: multiply office sq ft × $5 × 12 months',
      'If actual: allocate home expenses by office percentage',
      'For mileage: maintain log of business miles',
      'Track using app or written log',
      'Deduct on Schedule C (self-employed) or Form 1120'
    ],
    taxFiling: 'Home office on Schedule C (profit/loss); mileage on Schedule C or Form 1120'
  },

  // BUSINESS TIER - REMAINING 30 STRATEGIES
  {
    id: 'family-office',
    title: 'Family Office Management Company',
    tier: 'business',
    category: 'Family Planning',
    description: 'Establish a family office management company to centralize investment management, tax planning, and administrative services for high-net-worth families. Deduct management fees, salaries to family members, and operational costs that would otherwise be non-deductible.',
    ircReference: 'IRC §162; IRC §212',
    applicableTo: ['sole_prop', 's_corp', 'c_corp'],
    incomeThreshold: { min: 500000 },
    qualificationQuestions: [
      {
        id: 'family-office-has-family-members',
        question: 'Do you have multiple family members who could perform legitimate management or administrative roles?',
        helpText: 'Family office structures require genuine employment of family members in bona fide roles. The IRS scrutinizes arrangements where family members are paid without performing real services.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'family-office-annual-income',
        question: 'Is your combined family investment/business income at least $500,000 per year?',
        helpText: 'A family office is typically cost-effective only at $500K+ income. Below this threshold the overhead may exceed the tax benefit.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no',
      },
      {
        id: 'family-office-separate-entity',
        question: 'Are you willing to establish a separate legal entity (LLC or corporation) to serve as the management company?',
        helpText: 'The family office must be a legitimate standalone entity with its own bank account, EIN, and operating agreements. It cannot be a phantom entity.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'family-office-management-agreement',
        question: 'Are you willing to execute written management agreements between the family office and the entities it serves?',
        helpText: 'Written arm\'s-length management agreements are essential documentation. They must specify services, fee structure, and terms as if negotiated with a third party.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'family-office-reasonable-compensation',
        question: 'Can you document that compensation paid to family members reflects reasonable market rates for the services performed?',
        helpText: 'The IRS requires compensation to be reasonable. Gather comparable salary data for similar roles. Overpaying family members is a common audit trigger.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'family-office-num-entities',
        question: 'How many separate business entities or investment vehicles does your family own or control?',
        helpText: 'The more entities the family office manages, the stronger the business purpose argument. A single entity may not justify the overhead.',
        type: 'number',
        required: true,
      },
      {
        id: 'family-office-investment-assets',
        question: 'Approximately what is the total value of family investment assets under management?',
        helpText: 'Higher asset values strengthen the business necessity of a dedicated management structure and justify higher management fees.',
        type: 'currency',
        required: false,
      },
      {
        id: 'family-office-cpa-attorney',
        question: 'Are you working with a CPA and attorney who have specific family office experience?',
        helpText: 'Family office structures require specialized legal and tax guidance. Improper setup can result in disallowance of deductions and penalties.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'family-office-existing-payroll',
        question: 'Do you already have payroll infrastructure in place for the operating business?',
        helpText: 'Existing payroll systems can be extended to the family office, reducing setup complexity and cost.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'family-office-family-member-count',
        question: 'How many family members (including spouse and adult children) could realistically be employed?',
        helpText: 'Each family member employed must have a genuine role. List roles such as bookkeeper, scheduler, property manager, or investment researcher.',
        type: 'number',
        required: false,
      },
    ],
    implementationTime: '60-90 days',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'Attorney for entity formation and management agreements; CPA for compensation benchmarking and tax structuring',
    isRetroactive: false,
    deadline: 'Best implemented before year-end; management agreements must predate services rendered',
    riskLevel: 'medium',
    typicalSavingsRange: { min: 15000, max: 80000 },
    savingsFormula: 'Management fees deducted × marginal tax rate; family member salaries shift income to lower brackets',
    implementationSteps: [
      'Engage attorney to form LLC or S-Corp as the management company',
      'Obtain EIN and open dedicated business bank account',
      'Draft written management service agreements with each entity served',
      'Benchmark compensation for each family member role using market data',
      'Establish formal job descriptions and document hours worked',
      'Set up payroll for family members with proper withholding',
      'Adopt corporate minutes or operating agreement amendments authorizing the arrangement',
      'File required entity tax returns (Form 1120S or 1065) annually',
    ],
    taxFiling: 'Management company files its own return (1120S or 1065). Deductions flow through to owner(s). Family member wages reported on W-2.',
  },
  {
    id: 'hiring-children',
    title: 'Hire Your Children',
    tier: 'business',
    category: 'Family Planning',
    description: 'Pay your children reasonable wages for legitimate work performed in your sole proprietorship or partnership. Children under 18 are exempt from FICA (Social Security and Medicare) taxes when working for a parent\'s unincorporated business, and their wages are deductible to the business while taxed at the child\'s lower rate.',
    ircReference: 'IRC §3121(b)(3)(A); IRC §1(g)',
    applicableTo: ['sole_prop', 'partnership'],
    qualificationQuestions: [
      {
        id: 'hiring-children-has-children',
        question: 'Do you have children under age 18?',
        helpText: 'The FICA exemption applies only to children under 18 working for a sole proprietorship or partnership owned entirely by the parent(s). Once a child turns 18 the FICA exemption ends, though hiring can continue with standard employment taxes.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no',
      },
      {
        id: 'hiring-children-business-type',
        question: 'Is your business structured as a sole proprietorship or a partnership owned solely by you and/or your spouse?',
        helpText: 'The IRC §3121(b)(3)(A) FICA exemption is NOT available if your business is incorporated (S-Corp, C-Corp) or is an LLC taxed as a corporation. The exemption only applies to unincorporated entities.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no',
      },
      {
        id: 'hiring-children-legitimate-work',
        question: 'Can your children perform legitimate, documentable business tasks appropriate for their age?',
        helpText: 'The IRS requires that children perform real work. Acceptable duties include filing, social media management, data entry, cleaning, product photography, website updates, or running errands. Age-appropriate documentation of duties is essential.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'hiring-children-reasonable-wages',
        question: 'Are you willing to pay wages that are reasonable and comparable to what you would pay a non-family employee for the same work?',
        helpText: 'Wages must be reasonable for the work performed. Paying a 10-year-old $50,000/year for filing would be disallowed. Research market rates for similar part-time tasks.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'hiring-children-separate-account',
        question: 'Are you willing to open a separate bank account for the child and make actual paycheck deposits?',
        helpText: 'Wages must actually be paid — not just a journal entry. A dedicated account demonstrates genuine employment. Consider pairing with a Roth IRA contribution for additional tax benefit.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'hiring-children-document-hours',
        question: 'Are you willing to maintain timesheets or work logs documenting hours and tasks performed?',
        helpText: 'In an audit, the IRS will ask for proof of work performed. Maintain weekly timesheets signed by both parent and child (where age-appropriate).',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'hiring-children-ages',
        question: 'What are the ages of the children you plan to hire?',
        helpText: 'List ages to determine FICA exemption eligibility and Standard Deduction offset. In 2025 the standard deduction for dependents is the greater of $1,350 or earned income + $450 (up to the regular standard deduction).',
        type: 'text',
        required: true,
      },
      {
        id: 'hiring-children-annual-wages',
        question: 'Approximately how much in total wages per year do you plan to pay your children?',
        helpText: 'Keeping total wages at or below $14,600 (2025 standard deduction) means the child pays zero federal income tax. Wages above this are taxed at the child\'s rate, not yours.',
        type: 'currency',
        required: false,
      },
      {
        id: 'hiring-children-roth-ira',
        question: 'Are you interested in pairing this strategy with a Roth IRA contribution for the child?',
        helpText: 'Once a child has earned income, they can contribute up to 100% of earned wages (up to $7,000 in 2025) into a Roth IRA. Tax-free compounding starting at a young age is extraordinarily powerful.',
        type: 'yes_no',
        required: false,
      },
    ],
    implementationTime: '2-4 weeks',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'Payroll service to properly process child wages and file W-2; CPA to confirm structure qualifies for FICA exemption',
    isRetroactive: false,
    deadline: 'Employment and payroll must be established before wages are paid. W-2 due January 31 following tax year.',
    riskLevel: 'low',
    typicalSavingsRange: { min: 3000, max: 18000 },
    savingsFormula: '(Child wages × parent marginal rate) + (Child wages × 15.3% FICA saved) − (Child wages × child tax rate)',
    implementationSteps: [
      'Confirm business is sole proprietorship or spousal partnership (not incorporated)',
      'Define age-appropriate job duties with written job description',
      'Set reasonable hourly wage benchmarked to market rates',
      'Obtain EIN if not already in place and add child to payroll',
      'Open dedicated checking account or custodial account for the child',
      'Issue actual paychecks (do not pay cash without records)',
      'Maintain weekly timesheets documenting hours and tasks',
      'File W-2 by January 31; child files own tax return if income exceeds filing threshold',
      'Consider opening Roth IRA in child\'s name and contributing earned wages',
    ],
    taxFiling: 'Child\'s wages deducted on Schedule C or partnership return. Child receives W-2 and may file Form 1040 (or 1040-EZ equivalent). No FICA withheld for children under 18 in sole proprietorship.',
  },
  {
    id: 'profit-sharing',
    title: 'Profit Sharing Plan',
    tier: 'business',
    category: 'Retirement Planning',
    description: 'Establish a discretionary profit sharing plan allowing the business to contribute up to 25% of eligible compensation (up to $70,000 per participant in 2025) annually. Contributions are fully deductible, tax-deferred until withdrawal, and flexible — the employer decides each year whether and how much to contribute.',
    ircReference: 'IRC §401(a); IRC §404(a)(3)',
    applicableTo: ['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership'],
    qualificationQuestions: [
      {
        id: 'profit-sharing-has-profits',
        question: 'Does your business generate consistent annual profits that you want to shelter from taxes?',
        helpText: 'Profit sharing contributions must come from business profits. While there is no strict requirement of profit to contribute, contributions in excess of profits may face limitations. Consistent profitability makes this strategy most effective.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'profit-sharing-employees',
        question: 'Do you have W-2 employees other than yourself and your spouse?',
        helpText: 'If you have non-owner employees, the plan must include them under non-discrimination rules. You can offset their contributions against taxes saved, but the cost structure changes significantly.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'profit-sharing-existing-plan',
        question: 'Do you currently have a qualified retirement plan in place (401k, SEP-IRA, SIMPLE)?',
        helpText: 'Profit sharing can be added to an existing 401(k) plan (combined limit $70,000 in 2025) or as a standalone plan. Avoid exceeding combined contribution limits.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'profit-sharing-contribution-amount',
        question: 'What is your approximate annual W-2 compensation or net self-employment income?',
        helpText: 'Profit sharing contributions are limited to 25% of W-2 wages (for corporations) or ~20% of net self-employment income (for sole proprietors). Maximum contribution is $70,000 (2025).',
        type: 'currency',
        required: true,
      },
      {
        id: 'profit-sharing-age',
        question: 'Are you age 50 or older?',
        helpText: 'Profit sharing plans do not have catch-up contributions like 401(k)s, but combining a profit sharing plan with a 401(k) allows $7,500 catch-up contributions for those 50+.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'profit-sharing-cash-flow',
        question: 'Can you set aside the desired contribution amount by your tax filing deadline (including extensions)?',
        helpText: 'Profit sharing contributions can be made up to the tax return due date including extensions (e.g., October 15 for most pass-throughs). The plan must be established by December 31 of the tax year.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'profit-sharing-tpa',
        question: 'Are you willing to engage a Third Party Administrator (TPA) to manage plan documents and annual testing?',
        helpText: 'Qualified plans require formal plan documents, annual non-discrimination testing, and Form 5500 filing (for plans with assets over $250K). A TPA handles this for typically $1,000-$3,000/year.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'profit-sharing-vesting',
        question: 'Do you want to use a vesting schedule to retain key employees?',
        helpText: 'Vesting schedules (cliff or graded) can be used to incentivize employee retention. Owner contributions vest immediately for the owner.',
        type: 'yes_no',
        required: false,
      },
    ],
    implementationTime: '2-6 weeks',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'TPA or plan document provider; financial institution as trustee; CPA for contribution calculation',
    isRetroactive: false,
    deadline: 'Plan must be established by December 31 of the tax year. Contributions can be made up to tax return due date (including extensions).',
    riskLevel: 'low',
    typicalSavingsRange: { min: 10000, max: 35000 },
    savingsFormula: 'Annual contribution × marginal federal + state tax rate (e.g., $70,000 × 37% = $25,900 federal tax deferred)',
    implementationSteps: [
      'Determine maximum contribution based on compensation and business entity type',
      'Engage TPA or prototype plan document provider',
      'Adopt formal plan document by December 31',
      'Open trust account at a financial institution',
      'Calculate contribution amount and make deposit by tax return due date',
      'Complete non-discrimination testing if employees are covered',
      'File Form 5500 annually (if plan assets exceed $250K)',
      'Coordinate with CPA to claim deduction on business return',
    ],
    taxFiling: 'Deduction claimed on Schedule C (sole prop), Form 1065 (partnership), or Form 1120S/1120 (corporations). Form 5500 filed separately for the plan.',
  },
  {
    id: '412e3-plan',
    title: 'Section 412(e)(3) Fully Insured Defined Benefit Plan',
    tier: 'business',
    category: 'Retirement Planning',
    description: 'A special type of defined benefit plan funded exclusively with insurance products (annuity contracts and life insurance). Contributions can be dramatically larger than 401(k) limits — often $100,000-$300,000+ per year — and are fully deductible. The guaranteed nature of insurance funding satisfies the minimum funding requirements under IRC §412(e)(3).',
    ircReference: 'IRC §412(e)(3); IRC §404(a)(1)',
    applicableTo: ['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership'],
    incomeThreshold: { min: 250000 },
    qualificationQuestions: [
      {
        id: '412e3-income-threshold',
        question: 'Is your annual business income at least $250,000?',
        helpText: 'Section 412(e)(3) plans require large annual premium payments that are only cost-effective at high income levels. Below $250K, the administrative overhead and insurance premium costs may outweigh the tax benefit.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no',
      },
      {
        id: '412e3-stable-income',
        question: 'Is your income stable and expected to remain at this level for at least 5 years?',
        helpText: 'Defined benefit plans require ongoing minimum funding. If business income drops significantly, you may be required to continue contributions or face excise taxes. Stable income is critical.',
        type: 'yes_no',
        required: true,
      },
      {
        id: '412e3-age',
        question: 'Are you at least 40 years old?',
        helpText: 'Older business owners receive the most benefit from 412(e)(3) plans because the actuarial funding formula allows larger contributions to accumulate the same retirement benefit in fewer years.',
        type: 'yes_no',
        required: true,
      },
      {
        id: '412e3-employees',
        question: 'Do you have W-2 employees other than yourself and your spouse?',
        helpText: 'If you have other employees, they must generally be included in the plan, significantly increasing costs. The strategy is most powerful for owner-only or owner+spouse businesses.',
        type: 'yes_no',
        required: true,
      },
      {
        id: '412e3-life-insurance',
        question: 'Are you comfortable using life insurance as a funding vehicle for this retirement strategy?',
        helpText: 'Section 412(e)(3) plans are funded with annuity and/or life insurance contracts. The life insurance component provides incidental death benefit but must meet the "incidental benefit" rules.',
        type: 'yes_no',
        required: true,
      },
      {
        id: '412e3-annual-contribution',
        question: 'Can you commit to annual premium payments in the range of $100,000 to $300,000 or more?',
        helpText: 'Unlike discretionary plans, 412(e)(3) plans require minimum funding. Missing required contributions results in excise taxes. Ensure you have the cash flow to sustain contributions.',
        type: 'yes_no',
        required: true,
      },
      {
        id: '412e3-actuary',
        question: 'Are you willing to engage an enrolled actuary and TPA to design and administer the plan?',
        helpText: 'IRC §412(e)(3) plans require actuarial certification. An enrolled actuary must calculate the required contributions and certify the plan meets IRS requirements.',
        type: 'yes_no',
        required: false,
      },
      {
        id: '412e3-retirement-age',
        question: 'What is your target retirement age?',
        helpText: 'The plan is designed around a specific normal retirement age (typically 62 or 65). Contribution amounts are calculated to fund the maximum defined benefit by that age.',
        type: 'number',
        required: false,
      },
    ],
    implementationTime: '60-90 days',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'Enrolled actuary, TPA, insurance carrier, and CPA; plan design is complex and requires specialist coordination',
    isRetroactive: false,
    deadline: 'Plan must be established by December 31 of the tax year for deductions. Annual contributions follow actuarial schedule.',
    riskLevel: 'medium',
    typicalSavingsRange: { min: 40000, max: 150000 },
    savingsFormula: 'Annual deductible contribution (often $150K-$300K) × combined federal + state marginal rate',
    implementationSteps: [
      'Consult enrolled actuary to determine maximum deductible contribution based on age, compensation, and target retirement benefit',
      'Select insurance carrier and products (annuity + life insurance)',
      'Engage TPA to draft plan document and adoption agreement',
      'Adopt plan by December 31 of the tax year',
      'Fund plan with required annual premiums by contribution deadline',
      'File Form 5500 annually',
      'Conduct annual actuarial valuation to confirm minimum funding requirements',
      'Coordinate with CPA for deduction on business return',
    ],
    taxFiling: 'Deduction taken on business return (Schedule C, 1065, 1120S, or 1120). Annual Form 5500 required. Actuarial certification attached.',
  },
  {
    id: 'cash-balance-plan',
    title: 'Cash Balance Plan',
    tier: 'business',
    category: 'Retirement Planning',
    description: 'A hybrid defined benefit plan that expresses each participant\'s benefit as a hypothetical account balance. Allows high-income owners age 40+ to contribute $100,000-$300,000+ annually (deductible), far exceeding 401(k) limits. Often paired with a 401(k) profit sharing plan for maximum contribution.',
    ircReference: 'IRC §401(a); Rev. Rul. 2002-62',
    applicableTo: ['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership'],
    incomeThreshold: { min: 250000 },
    qualificationQuestions: [
      {
        id: 'cash-balance-income',
        question: 'Is your annual business income at least $250,000?',
        helpText: 'Cash balance plans require large annual contributions. At $250K+ income, the tax savings typically justify the plan setup and ongoing administration costs of $3,000-$8,000 per year.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no',
      },
      {
        id: 'cash-balance-age',
        question: 'Are you age 40 or older?',
        helpText: 'The primary benefit of a cash balance plan accrues to older owners. At 40+, the allowable annual contribution is significantly larger because there are fewer years to accumulate the maximum benefit.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'cash-balance-five-years',
        question: 'Can you commit to funding this plan for at least 5 years?',
        helpText: 'Cash balance plans are difficult and expensive to terminate early. The IRS requires minimum funding. Committing to at least 5 years is important before establishing the plan.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'cash-balance-employees',
        question: 'Do you have W-2 employees other than yourself and your spouse?',
        helpText: 'Non-discrimination rules require that employees be included, often at 5-8% of compensation. This adds cost but can still be worthwhile at high income levels. Answer carefully — it significantly impacts the strategy\'s ROI.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'cash-balance-401k',
        question: 'Do you currently have, or are you willing to establish, a 401(k) profit sharing plan?',
        helpText: 'Cash balance plans are most powerful when paired with a 401(k) + profit sharing plan. Combined, an owner age 55 can potentially contribute $300,000+ annually, all deductible.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'cash-balance-actuary',
        question: 'Are you willing to engage an enrolled actuary to design and administer the plan annually?',
        helpText: 'Cash balance plans require actuarial certification each year. Annual administration costs typically run $3,000-$8,000 for an owner-only plan.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'cash-balance-contribution-estimate',
        question: 'What is your approximate annual W-2 compensation or net self-employment income?',
        helpText: 'Contribution limits are based on age and compensation. Provide your income so we can estimate the allowable annual deduction.',
        type: 'currency',
        required: true,
      },
      {
        id: 'cash-balance-current-age',
        question: 'What is your current age?',
        helpText: 'Contribution limits increase with age. At age 60, a business owner may be able to contribute $250,000+ annually to a cash balance plan.',
        type: 'number',
        required: true,
      },
    ],
    implementationTime: '45-60 days',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'Enrolled actuary, TPA, CPA, and financial advisor for investment of plan assets',
    isRetroactive: false,
    deadline: 'Plan must be established by December 31 of the tax year. Contributions can be made up to tax return due date including extensions.',
    riskLevel: 'low',
    typicalSavingsRange: { min: 40000, max: 120000 },
    savingsFormula: 'Annual deductible contribution (varies by age: $100K-$300K+) × combined marginal tax rate',
    implementationSteps: [
      'Engage enrolled actuary and TPA to design plan',
      'Determine contribution amounts based on age, income, and employee census',
      'Adopt plan document and 401(k) plan (if pairing) by December 31',
      'Open trust account and investment accounts for plan assets',
      'Make annual contributions by tax return due date',
      'Obtain annual actuarial certification',
      'File Form 5500 annually',
      'Coordinate with CPA for deduction on business return',
    ],
    taxFiling: 'Deduction taken on business return. Annual Form 5500 and actuarial certification required. Combined with 401(k) on same 5500 filing.',
  },
  {
    id: 'defined-benefit-plan',
    title: 'Traditional Defined Benefit Plan',
    tier: 'business',
    category: 'Retirement Planning',
    description: 'A traditional defined benefit pension plan that promises a specific monthly benefit at retirement. Allows the largest deductible contributions of any qualified plan — particularly for older, high-income owners — by funding the promised benefit using actuarial calculations. Suitable for owners age 45+ who want to defer $200,000+ per year.',
    ircReference: 'IRC §401(a); IRC §404(a)(1); IRC §415(b)',
    applicableTo: ['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership'],
    incomeThreshold: { min: 250000 },
    qualificationQuestions: [
      {
        id: 'db-plan-age',
        question: 'Are you age 45 or older?',
        helpText: 'Traditional defined benefit plans provide the greatest benefit to older business owners. At age 45+ there are fewer years to fund the maximum benefit ($280,000/year annuity in 2025), requiring larger annual contributions and thus larger deductions.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'db-plan-income',
        question: 'Is your annual income at least $250,000?',
        helpText: 'Traditional DB plans are most cost-effective at $250K+ income because the potential deductions are large. Below this threshold, simpler plans like SEP-IRA or 401(k) are usually more appropriate.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'db-plan-defer-200k',
        question: 'Do you want to shelter more than $200,000 per year in pre-tax retirement contributions?',
        helpText: 'If your goal is to contribute $70,000 or less per year, a cash balance plan or 401(k)+profit sharing plan is simpler. A traditional DB plan is justified when you want to maximize contributions beyond $200,000 annually.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'db-plan-stable-income',
        question: 'Is your income expected to remain stable or growing for at least 5-10 years?',
        helpText: 'Defined benefit plans have mandatory minimum funding requirements. A significant drop in income could create funding shortfalls with excise tax consequences. Plan termination is also costly and complex.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'db-plan-employees',
        question: 'Do you have W-2 employees other than yourself and your spouse?',
        helpText: 'Non-owner employees must be covered under non-discrimination rules. Each additional employee increases plan cost substantially. This plan is most powerful for owner-only businesses.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'db-plan-actuary',
        question: 'Are you willing to engage an enrolled actuary and TPA annually?',
        helpText: 'Traditional DB plans require annual actuarial valuations, Form 5500 filings, and ongoing compliance. Annual costs typically run $5,000-$15,000 for an owner-only plan.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'db-plan-current-age-number',
        question: 'What is your current age?',
        helpText: 'The maximum annual deductible contribution increases significantly with age. At age 60, contributions can exceed $350,000 per year for high earners.',
        type: 'number',
        required: true,
      },
      {
        id: 'db-plan-compensation',
        question: 'What is your annual W-2 compensation or net self-employment income?',
        helpText: 'Benefit and contribution calculations are based on highest 3-year average compensation. Provide your current figure for preliminary estimates.',
        type: 'currency',
        required: true,
      },
    ],
    implementationTime: '60-90 days',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'Enrolled actuary (ERISA-qualified), TPA, ERISA attorney if plan covers employees, CPA',
    isRetroactive: false,
    deadline: 'Plan established by December 31. Contributions follow actuarial funding schedule; first contribution typically due 8.5 months after plan year end.',
    riskLevel: 'medium',
    typicalSavingsRange: { min: 75000, max: 200000 },
    savingsFormula: 'Annual deductible contribution (can exceed $300,000 for age 60+) × combined marginal tax rate',
    implementationSteps: [
      'Engage enrolled actuary to calculate maximum deductible contribution based on age and compensation',
      'Engage TPA to draft plan document',
      'Adopt plan before December 31 of first plan year',
      'Open trust account for plan assets',
      'Fund plan per actuarial schedule',
      'Obtain annual actuarial certification (Schedule SB)',
      'File Form 5500 (and Schedule SB) annually by July 31',
      'Claim deduction on business return',
    ],
    taxFiling: 'Deduction on Schedule C, 1065, 1120S, or 1120. Form 5500 with Schedule SB (actuarial information) filed annually.',
  },
  {
    id: 'qeap',
    title: 'Qualified Educational Assistance Program',
    tier: 'business',
    category: 'Employee Benefits',
    description: 'Establish a written educational assistance program allowing the business to pay up to $5,250 per year per employee for job-related or non-job-related education, completely tax-free to the employee and fully deductible to the employer. No payroll taxes on the benefit.',
    ircReference: 'IRC §127',
    applicableTo: ['c_corp', 's_corp'],
    qualificationQuestions: [
      {
        id: 'qeap-has-employees',
        question: 'Do you have W-2 employees (other than yourself as an owner)?',
        helpText: 'IRC §127 requires a written program that benefits employees. While sole proprietors and S-Corp owners may participate, the primary benefit is for businesses with employees. The plan cannot discriminate in favor of highly compensated employees.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no',
      },
      {
        id: 'qeap-written-plan',
        question: 'Are you willing to establish a formal written educational assistance plan document?',
        helpText: 'IRC §127 requires a written plan that describes the benefits, eligible employees, and conditions. The plan cannot offer employees a choice between education benefits and other taxable compensation.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'qeap-nondiscrimination',
        question: 'Does your employee population include a mix of compensation levels (not only highly compensated employees)?',
        helpText: 'The §127 plan cannot provide more than 5% of benefits to shareholders/owners who own more than 5% of the company. If the benefit primarily flows to owner-employees, it may fail non-discrimination testing.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'qeap-education-type',
        question: 'What type of education will be covered? (tuition reimbursement, online courses, certifications, etc.)',
        helpText: 'IRC §127 covers undergraduate, graduate, job-related, and non-job-related education through 2025. Payments must go to accredited institutions or cover books, supplies, and equipment. Student loan repayments are also covered through 2025.',
        type: 'text',
        required: false,
      },
      {
        id: 'qeap-annual-budget',
        question: 'What annual budget are you planning per employee for educational assistance?',
        helpText: 'The tax-free exclusion is limited to $5,250 per employee per year. Amounts above this are taxable compensation to the employee.',
        type: 'currency',
        required: false,
      },
      {
        id: 'qeap-no-choice',
        question: 'Do you understand that employees cannot choose between the educational benefit and cash compensation?',
        helpText: 'A critical requirement: employees must not be able to elect cash instead of education benefits. This would make the benefit taxable. The plan must be a standalone non-elective employer-paid benefit.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'qeap-student-loans',
        question: 'Are you interested in using this plan to help employees repay student loans?',
        helpText: 'Through December 31, 2025, employers may use §127 plans to make up to $5,250 of student loan repayments per employee tax-free. This is an employer-paid benefit, not employee salary reduction.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'qeap-entity-type',
        question: 'Is your business structured as a C-Corporation or S-Corporation?',
        helpText: '§127 plans work best for corporations. S-Corp 2%+ shareholders cannot exclude the benefit. Sole proprietors and partners cannot participate as employees.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no',
      },
    ],
    implementationTime: '1-3 weeks',
    thirdPartyNeeded: false,
    thirdPartyDetails: 'Attorney or HR consultant to draft plan document; CPA to ensure non-discrimination testing compliance',
    isRetroactive: false,
    deadline: 'Plan must be in place before benefits are paid. No specific year-end deadline, but establish before first reimbursement.',
    riskLevel: 'low',
    typicalSavingsRange: { min: 2000, max: 15000 },
    savingsFormula: '($5,250 × number of employees) × (employer payroll tax rate 7.65% + employer marginal income tax rate)',
    implementationSteps: [
      'Draft written §127 educational assistance plan document',
      'Adopt the plan by board resolution (corporations) or operating agreement amendment',
      'Communicate plan to all eligible employees',
      'Establish reimbursement request and documentation procedures',
      'Process education payments directly to institutions or reimburse employees with supporting receipts',
      'Exclude benefits from W-2 Box 1 wages (up to $5,250)',
      'Track annual benefits per employee to ensure $5,250 limit is not exceeded',
    ],
    taxFiling: 'Benefits excluded from employee W-2 income. Employer deducts payments as ordinary business expense. No special form required, but plan document must be available for audit.',
  },
  {
    id: 'achievement-awards',
    title: 'Employee Achievement Awards',
    tier: 'business',
    category: 'Employee Benefits',
    description: 'Award employees tangible personal property (not cash, gift cards, or vacations) for length-of-service or employee safety achievements. Awards up to $400 per employee ($1,600 under a qualified written plan) are deductible to the employer and excluded from employee income.',
    ircReference: 'IRC §274(j); IRC §132(e)',
    applicableTo: ['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership'],
    qualificationQuestions: [
      {
        id: 'achievement-has-employees',
        question: 'Do you have W-2 employees?',
        helpText: 'Employee achievement awards must be given to employees. Payments to independent contractors do not qualify under §274(j).',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no',
      },
      {
        id: 'achievement-tangible-property',
        question: 'Are your awards tangible personal property (plaques, watches, tools, electronics) rather than cash, gift cards, or experiences?',
        helpText: 'The IRS specifically excludes cash, cash equivalents, gift cards, gift coupons, vacations, meals, lodging, theater/sporting event tickets, and securities from qualifying as achievement awards. The award must be a tangible item.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'achievement-program-type',
        question: 'Are these awards for length-of-service recognition or employee safety achievements?',
        helpText: 'Only two types of awards qualify: (1) length-of-service awards (employee must have at least 5 years of service and not received such award in past 5 years), and (2) safety achievement awards. Performance bonuses do NOT qualify.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'achievement-qualified-plan',
        question: 'Do you have, or will you establish, a written qualified achievement award plan?',
        helpText: 'A qualified plan (with written documentation, non-discrimination requirements, and awards presented as part of a meaningful ceremony) allows the exclusion to increase from $400 to $1,600 per employee per year.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'achievement-nondiscrimination',
        question: 'Is your award program available to a broad group of employees, not just managers and highly compensated employees?',
        helpText: 'Qualified achievement award plans cannot favor highly compensated employees. The plan must not be primarily limited to officers, shareholders, or executives.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no',
      },
      {
        id: 'achievement-ceremony',
        question: 'Are awards presented as part of a meaningful ceremony or recognition event?',
        helpText: 'Qualified awards must be presented in a meaningful presentation context — not simply shipped to an employee. Document the recognition ceremony in writing.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'achievement-annual-budget',
        question: 'What is your estimated annual budget for achievement awards?',
        helpText: 'Estimate total annual spend to ensure deductible amounts stay within the $400/$1,600 per-employee limits. Excess amounts are taxable to the employee.',
        type: 'currency',
        required: false,
      },
      {
        id: 'achievement-safety-pct',
        question: 'Are safety awards limited to less than 10% of eligible employees per year?',
        helpText: 'Safety achievement awards are disqualified if more than 10% of the employees eligible for safety awards received such awards during the year (managers and administrators excluded from this calculation).',
        type: 'yes_no',
        required: false,
      },
    ],
    implementationTime: '1-2 weeks',
    thirdPartyNeeded: false,
    thirdPartyDetails: 'HR consultant to design plan; CPA to confirm limits are not exceeded',
    isRetroactive: false,
    deadline: 'Awards must be given during the tax year for deduction. Written qualified plan should be adopted before first award.',
    riskLevel: 'low',
    typicalSavingsRange: { min: 500, max: 5000 },
    savingsFormula: 'Total qualified award value × (employer marginal tax rate + 7.65% payroll tax avoided)',
    implementationSteps: [
      'Draft written qualified achievement award plan document specifying award criteria and maximum amounts',
      'Ensure plan is non-discriminatory',
      'Select tangible personal property awards (no cash, gift cards)',
      'Present awards in a meaningful ceremony with written documentation',
      'Track per-employee totals to stay within $1,600 annual limit',
      'Exclude qualifying award values from employee W-2',
      'Deduct award costs as ordinary business expense',
    ],
    taxFiling: 'Awards excluded from employee W-2 income up to limits. Employer deducts as business expense. No special form required.',
  },
  {
    id: 'fringe-benefits',
    title: 'Fringe Benefits Program',
    tier: 'business',
    category: 'Employee Benefits',
    description: 'Establish a comprehensive fringe benefits program providing employees (and owner-employees) with tax-free benefits including de minimis fringe benefits, working condition fringes, qualified transportation benefits ($325/month for parking and $325/month for transit in 2025), and other IRC §132 benefits. Fully deductible to the employer, excluded from employee income.',
    ircReference: 'IRC §132',
    applicableTo: ['c_corp', 's_corp'],
    qualificationQuestions: [
      {
        id: 'fringe-provides-benefits',
        question: 'Do you provide, or want to provide, employee benefits beyond base salary (transportation, meals, phones, gym, etc.)?',
        helpText: 'If you are already providing these benefits informally, formalizing them under IRC §132 converts taxable compensation to tax-free fringe benefits, reducing payroll taxes for both employer and employee.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'fringe-entity-type',
        question: 'Is your business a C-Corporation or S-Corporation?',
        helpText: 'C-Corp employees (including owner-employees) can receive the full range of §132 fringe benefits. S-Corp 2%+ shareholders cannot exclude certain benefits like health insurance and group term life on the same basis. Confirm entity type.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no',
      },
      {
        id: 'fringe-transportation',
        question: 'Do employees commute using transit, vanpool, or employer-provided parking?',
        helpText: 'Qualified transportation fringes allow $325/month tax-free for transit passes/vanpool and $325/month for parking (2025). These are among the most commonly used §132 fringes.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'fringe-working-condition',
        question: 'Do you provide employees with items used for business (cell phones, laptops, professional subscriptions)?',
        helpText: 'Working condition fringes allow employer-provided property or services the employee would otherwise deduct as a business expense to be excluded from income. Cell phones provided primarily for business use are excluded from income.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'fringe-de-minimis',
        question: 'Do you provide occasional meals, holiday gifts, or minor perks to employees?',
        helpText: 'De minimis fringes — property or services so small accounting for them is unreasonable (e.g., occasional meals, holiday parties, birthday gifts of nominal value) — are excluded from income.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'fringe-nondiscrimination',
        question: 'Are you willing to offer these benefits to all employees on a non-discriminatory basis?',
        helpText: 'Some §132 fringe benefits require non-discrimination testing. If benefits are primarily provided to highly compensated employees, they may be partially includible in income.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'fringe-written-policy',
        question: 'Are you willing to establish a written fringe benefit policy document?',
        helpText: 'While not always legally required, a written policy protects the deduction and demonstrates the business purpose. It also sets clear employee expectations.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'fringe-annual-value',
        question: 'What is the approximate annual value of fringe benefits you want to formalize?',
        helpText: 'Estimate the annual cost of transportation subsidies, cell phone reimbursements, de minimis benefits, etc. This helps quantify the payroll tax savings from formalizing these benefits.',
        type: 'currency',
        required: false,
      },
    ],
    implementationTime: '2-4 weeks',
    thirdPartyNeeded: false,
    thirdPartyDetails: 'HR consultant or attorney for plan documents; payroll service for proper tax treatment',
    isRetroactive: false,
    deadline: 'Benefits must be established before being provided. Transportation benefit elections typically made before the month of the benefit.',
    riskLevel: 'low',
    typicalSavingsRange: { min: 2000, max: 15000 },
    savingsFormula: 'Annual fringe benefit value × (employer payroll tax rate 7.65% + employee payroll tax rate 7.65%) + income tax benefit from exclusion',
    implementationSteps: [
      'Identify current informal benefits that can be formalized',
      'Draft written fringe benefit policy covering each benefit type',
      'Implement qualified transportation benefit elections (pre-tax via payroll deduction or employer-paid)',
      'Establish cell phone/technology policy for working condition fringes',
      'Document de minimis benefit procedures',
      'Train payroll to exclude qualifying amounts from W-2 income',
      'Review annually for changes in limits (transportation amounts adjusted annually)',
    ],
    taxFiling: 'Qualifying fringe benefits excluded from employee W-2 income. Employer deducts as ordinary business expense. Transportation benefits reported in W-2 Box 12 (Code P for parking, Code T for transit).',
  },
  {
    id: 'medical-reimbursement',
    title: 'Medical Reimbursement Plan (HRA/ICHRA/QSEHRA)',
    tier: 'business',
    category: 'Medical Benefits',
    description: 'Establish a Health Reimbursement Arrangement to reimburse employees for medical expenses and/or individual health insurance premiums. HRAs are fully deductible to the employer and tax-free to employees. Three main types: traditional HRA, ICHRA (Individual Coverage HRA — no size limit), and QSEHRA (for businesses with fewer than 50 full-time employees).',
    ircReference: 'IRC §105; IRC §9831(d); IRS Notice 2017-67',
    applicableTo: ['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership'],
    qualificationQuestions: [
      {
        id: 'medical-fewer-50',
        question: 'Does your business have fewer than 50 full-time equivalent employees?',
        helpText: 'QSEHRA is available only to businesses with fewer than 50 FTEs. ICHRA has no size restriction. Traditional HRA rules also vary by company size. Confirm your employee count to determine which HRA type applies.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'medical-no-group-health',
        question: 'Do you NOT currently offer a group health insurance plan to employees?',
        helpText: 'QSEHRA cannot be offered if the employer also offers a group health plan. ICHRA can be offered alongside group plans but with specific eligibility classes. If you offer group health, consult about ICHRA design.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'medical-employees-enrolled',
        question: 'Do your employees have (or are they willing to obtain) individual health insurance coverage?',
        helpText: 'ICHRA and QSEHRA reimbursements are tax-free only if employees are enrolled in qualifying individual market coverage (or Medicare). Employees cannot receive tax-free QSEHRA if they have no insurance.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'medical-owner-spouse',
        question: 'Do you have a spouse who is a genuine W-2 employee of the business?',
        helpText: 'Sole proprietors and partners cannot participate as employees. However, if your spouse is a bona fide W-2 employee, they can participate and family coverage effectively covers you as well.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'medical-annual-reimbursement',
        question: 'What annual reimbursement amount per employee are you considering?',
        helpText: 'QSEHRA limits for 2025: $6,350 for self-only coverage, $12,800 for family coverage. ICHRA has no statutory dollar limit. Provide an estimate to quantify the potential deduction and tax savings.',
        type: 'currency',
        required: false,
      },
      {
        id: 'medical-substantiation',
        question: 'Are you willing to require employees to submit receipts and documentation for reimbursements?',
        helpText: 'HRA reimbursements must be substantiated. Employees must submit proof of qualified medical expenses or insurance premiums before receiving tax-free reimbursements. A third-party administrator can automate this.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'medical-written-plan',
        question: 'Are you willing to adopt a formal written HRA plan document?',
        helpText: 'HRAs require formal written plan documents. QSEHRA requires a 90-day notice to employees (or 90 days before the plan year). Failure to follow procedural requirements results in excise taxes.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'medical-s-corp-owner',
        question: 'Are you a 2%+ shareholder of an S-Corporation?',
        helpText: 'S-Corp 2%+ shareholders are treated as self-employed for health insurance purposes. Health insurance premiums paid on their behalf must be included in W-2 Box 1 wages and then deducted on their personal return (Form 1040, Line 17). They cannot participate in a tax-free HRA as an employee.',
        type: 'yes_no',
        required: false,
      },
    ],
    implementationTime: '2-4 weeks',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'HRA administrator or benefits platform for plan documents, employee notice, and claim substantiation',
    isRetroactive: false,
    deadline: 'QSEHRA requires 90-day advance notice to employees before plan year start. ICHRA requires 90-day notice before plan year. Best adopted before January 1.',
    riskLevel: 'low',
    typicalSavingsRange: { min: 5000, max: 25000 },
    savingsFormula: 'Annual reimbursements × (employer payroll tax rate 7.65% + employer income tax rate) + employee tax savings',
    implementationSteps: [
      'Determine which HRA type is appropriate (QSEHRA, ICHRA, or traditional)',
      'Engage HRA administrator or benefits platform for plan documents',
      'Adopt written HRA plan document',
      'Provide 90-day advance notice to eligible employees',
      'Establish documentation and substantiation procedures',
      'Process tax-free reimbursements monthly or as claims are submitted',
      'Exclude reimbursements from employee W-2 income',
      'Deduct as ordinary business expense',
    ],
    taxFiling: 'Reimbursements excluded from employee W-2 income. Employer deducts payments as business expense. QSEHRA amounts reported in W-2 Box 12 (Code FF). Form 720 may be required for PCORI fee.',
  },
  {
    id: 'section-139',
    title: 'Section 139 Disaster Relief Payments',
    tier: 'business',
    category: 'Disaster Relief',
    description: 'Make tax-free payments to employees to reimburse or pay reasonable and necessary personal, family, living, or funeral expenses incurred as a result of a qualified disaster. Payments are fully deductible to the employer and completely excluded from the employee\'s gross income — no payroll taxes, no income tax.',
    ircReference: 'IRC §139',
    applicableTo: ['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership'],
    qualificationQuestions: [
      {
        id: 'section-139-qualified-disaster',
        question: 'Has there been a federally declared disaster, presidentially declared disaster, or qualified disaster that affected your employees?',
        helpText: 'IRC §139 applies only during "qualified disasters" — which include federally declared disasters (hurricanes, floods, wildfires, pandemics like COVID-19), terrorist attacks, and other catastrophic events. Ordinary hardships do not qualify.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'section-139-employee-expenses',
        question: 'Have your employees incurred reasonable and necessary personal expenses as a result of the disaster?',
        helpText: 'Qualifying expenses include medical costs, temporary housing, home repairs, transportation, childcare disruption costs, and other reasonable expenses. Expenses must not be covered by insurance or other government assistance.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'section-139-has-employees',
        question: 'Do you have W-2 employees?',
        helpText: 'Section 139 payments are made to employees (and self-employed individuals). Independent contractors may also qualify for payments from their client businesses under certain interpretations, but W-2 employees are the clearest case.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no',
      },
      {
        id: 'section-139-not-compensation',
        question: 'Are these payments intended as disaster relief (not as a substitute for regular wages or compensation)?',
        helpText: 'Section 139 payments cannot replace regular wages, bonuses, or other compensation. They must be in addition to normal pay and specifically tied to qualifying disaster-related expenses.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'section-139-documentation',
        question: 'Are you willing to document the disaster, the employees affected, and the nature of expenses reimbursed?',
        helpText: 'While employees are not required to provide detailed receipts (unlike accountable plans), the employer should document the qualified disaster declaration, identify affected employees, and note the general nature of expenses being reimbursed.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'section-139-payment-amount',
        question: 'What is the approximate amount you plan to provide per employee?',
        helpText: 'There is no statutory cap under §139, but payments must be reasonable and tied to actual disaster-related expenses. Excessive payments unrelated to actual expenses could be recharacterized as wages.',
        type: 'currency',
        required: false,
      },
      {
        id: 'section-139-insurance-coverage',
        question: 'Have you confirmed that the expenses are not already covered by employee insurance or FEMA assistance?',
        helpText: 'Section 139 payments are not intended to duplicate insurance reimbursements or government assistance. Payments should cover unreimbursed, out-of-pocket disaster expenses only.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'section-139-timing',
        question: 'Are you making these payments during or shortly after the qualified disaster period?',
        helpText: 'Payments should be made during or reasonably proximate to the disaster period. Making disaster relief payments months after a disaster has ended may invite scrutiny.',
        type: 'yes_no',
        required: false,
      },
    ],
    implementationTime: '1-2 weeks',
    thirdPartyNeeded: false,
    thirdPartyDetails: 'CPA review recommended to confirm disaster qualification and proper documentation',
    isRetroactive: false,
    deadline: 'Payments should be made during or shortly after the qualified disaster period',
    riskLevel: 'low',
    typicalSavingsRange: { min: 1500, max: 15000 },
    savingsFormula: 'Total payments × (employer payroll tax rate 7.65% + employer marginal income tax rate) + employee tax savings',
    implementationSteps: [
      'Confirm there is an active federally or presidentially declared qualified disaster',
      'Identify employees affected by the disaster',
      'Determine reasonable payment amounts based on likely employee expenses',
      'Issue payments via payroll or separate check',
      'Exclude payments from employee W-2 Box 1 wages',
      'Document disaster declaration, affected employees, and general expense categories in writing',
      'Deduct as ordinary business expense on business tax return',
    ],
    taxFiling: 'Payments excluded from employee W-2 income — do not include in Box 1. Employer deducts as business expense. No special form required, but maintain documentation of qualified disaster and payment rationale.',
  },
  {
    id: 'emergency-sick-leave',
    title: 'Emergency Sick Leave Credit (FFCRA/ARPA Retroactive)',
    tier: 'business',
    category: 'Disaster Relief',
    description: 'Claim retroactive payroll tax credits for paid sick leave and paid family leave provided to employees in 2020 and 2021 under the Families First Coronavirus Response Act (FFCRA) and American Rescue Plan Act (ARPA). Credits offset payroll taxes dollar-for-dollar and may result in a refund. Statute of limitations allows retroactive claims through April 2024 (3 years from original filing).',
    ircReference: 'IRC §3131; IRC §3132; FFCRA §7001-7005; ARPA §9641',
    applicableTo: ['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership'],
    qualificationQuestions: [
      {
        id: 'sick-leave-provided-leave',
        question: 'Did you provide paid sick leave or paid family leave to employees during 2020 or 2021?',
        helpText: 'The FFCRA (April 1 - December 31, 2020) and ARPA (April 1 - September 30, 2021) provided refundable payroll tax credits for employers who paid qualifying sick leave and family leave. If you paid leave but did not claim the credit on Form 941, you may be able to amend.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no',
      },
      {
        id: 'sick-leave-covid-related',
        question: 'Was the leave provided for COVID-19 related reasons (quarantine, symptoms, school closure, caregiving)?',
        helpText: 'Qualifying reasons include: employee quarantine/isolation order, COVID-19 symptoms and seeking diagnosis, caring for a quarantined family member, or caring for a child whose school/daycare was closed due to COVID-19.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'sick-leave-less-500',
        question: 'Did your business employ fewer than 500 employees during 2020-2021?',
        helpText: 'Large employers with 500+ employees were not eligible for FFCRA credits (though different rules applied to government employers). Most small businesses qualify.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no',
      },
      {
        id: 'sick-leave-not-already-claimed',
        question: 'Did you NOT already claim the full FFCRA/ARPA credit on Form 941?',
        helpText: 'If you already claimed the credit on your original Form 941, no further action is needed. This strategy is for employers who provided qualifying leave but failed to claim — or under-claimed — the available credit.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'sick-leave-payroll-records',
        question: 'Do you have payroll records documenting the leave provided (dates, amounts, COVID reason)?',
        helpText: 'Amended 941-X claims require documentation of: employee names, COVID reason for leave, dates of leave, and wages paid. Gather payroll records, employee statements, and leave policies before filing.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'sick-leave-941x-filed',
        question: 'Have you already filed amended Form 941-X returns for the relevant quarters?',
        helpText: 'If not yet filed, the statute of limitations for amending 2020 Q2-Q4 Forms 941 generally runs through April 2023-2024. Act promptly. For 2021, the window extends into 2024-2025.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'sick-leave-self-employed',
        question: 'Are you self-employed (sole proprietor or single-member LLC)?',
        helpText: 'Self-employed individuals also qualified for sick and family leave credits under FFCRA/ARPA using Form 7202. The credit is based on net self-employment income and qualifying days unable to work due to COVID-19.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'sick-leave-payroll-professional',
        question: 'Are you working with a payroll professional or CPA experienced in 941-X amendments?',
        helpText: 'Retroactive 941-X claims require careful calculation and IRS-specific documentation. An experienced professional can maximize the refundable credit and minimize audit risk.',
        type: 'yes_no',
        required: false,
      },
    ],
    implementationTime: '4-8 weeks (for amended return preparation and IRS processing)',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'CPA or payroll specialist experienced in 941-X amendments and FFCRA/ARPA credit calculations',
    isRetroactive: true,
    deadline: 'Amended 941-X must be filed within 3 years of original 941 due date. Act promptly as windows are closing.',
    riskLevel: 'medium',
    typicalSavingsRange: { min: 5000, max: 50000 },
    savingsFormula: 'For FFCRA: up to $5,110/employee for sick leave + $10,000/employee for family leave. For ARPA 2021: up to $12,000/employee. Credits are dollar-for-dollar against payroll taxes with refund of excess.',
    implementationSteps: [
      'Gather 2020 and 2021 payroll records identifying all paid leave',
      'Determine qualifying COVID-19 reasons for each instance of leave',
      'Calculate maximum credits per employee per qualifying quarter',
      'Prepare amended Form 941-X for each applicable quarter',
      'Attach supporting documentation (employee names, leave dates, COVID reasons)',
      'File 941-X with IRS and await processing (4-6 months typical)',
      'Receive refund check or credit applied to future payroll taxes',
    ],
    taxFiling: 'File Form 941-X (Adjusted Employer\'s Quarterly Federal Tax Return) for each relevant quarter. Self-employed use Form 7202 on Form 1040-X if applicable.',
  },
  {
    id: 'fmla-credit',
    title: 'Family Medical Leave Credit (§45S)',
    tier: 'business',
    category: 'Disaster Relief',
    description: 'Claim a federal income tax credit of 12.5% to 25% of wages paid to employees during qualifying Family and Medical Leave Act (FMLA) leave. Employers must have a written paid family/medical leave policy providing at least 2 weeks of paid leave at not less than 50% of normal wages.',
    ircReference: 'IRC §45S',
    applicableTo: ['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership'],
    qualificationQuestions: [
      {
        id: 'fmla-paid-leave-policy',
        question: 'Do you provide (or are you willing to provide) paid family or medical leave to employees?',
        helpText: 'The §45S credit requires a written paid leave policy providing at least 2 weeks per year of paid FMLA leave at a minimum 50% wage replacement rate. State-mandated paid leave may not qualify unless it meets federal criteria.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'fmla-has-employees',
        question: 'Do you have W-2 employees who have been employed for at least one year?',
        helpText: 'The credit applies to wages paid to employees who have been employed for at least one year and received no more than a threshold amount in compensation ($81,000 in 2025). Check current limits.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no',
      },
      {
        id: 'fmla-written-policy',
        question: 'Do you have a written FMLA paid leave policy?',
        helpText: 'A written policy is required. The policy must specify the leave duration (at least 2 weeks), wage replacement rate (at least 50%), and apply to all qualifying employees on a non-discriminatory basis.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'fmla-leave-taken',
        question: 'Have any employees actually taken FMLA leave in the current or prior tax year?',
        helpText: 'The credit is only available when qualifying leave is actually taken. If no employees have taken qualifying leave, there is no credit available (though establishing the policy now qualifies future leave).',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'fmla-no-discrimination',
        question: 'Does your paid leave policy apply to all qualifying employees on a non-discriminatory basis?',
        helpText: 'The policy cannot discriminate in favor of highly compensated employees. All qualifying employees must have access to the same paid leave benefit.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'fmla-leave-amount',
        question: 'What is the approximate total amount of wages paid to employees on FMLA leave during the year?',
        helpText: 'The credit is 12.5% to 25% of FMLA wages paid (higher credit rates apply when wage replacement exceeds 50%). Provide estimated total to calculate potential credit amount.',
        type: 'currency',
        required: false,
      },
      {
        id: 'fmla-wage-replacement-rate',
        question: 'What wage replacement rate do you provide during FMLA leave (e.g., 50%, 75%, 100%)?',
        helpText: 'The credit rate starts at 12.5% when replacement wages are 50% of normal wages, and increases by 0.25 percentage points for each additional 1% of wage replacement above 50%, up to 25% credit at 100% replacement.',
        type: 'choice',
        choices: ['50%', '60%', '75%', '100%'],
        required: false,
      },
      {
        id: 'fmla-state-mandated',
        question: 'Is your paid leave policy driven by a state mandate (California, New York, etc.)?',
        helpText: 'Paid leave funded by state programs or employee payroll deductions may not qualify for the federal §45S credit. The credit requires employer-funded paid leave. Clarify with your CPA if state-mandated programs qualify.',
        type: 'yes_no',
        required: false,
      },
    ],
    implementationTime: '2-4 weeks (to establish policy); credit claimed on annual return',
    thirdPartyNeeded: false,
    thirdPartyDetails: 'HR consultant or employment attorney to draft FMLA policy; CPA to calculate and claim credit on Form 8994',
    isRetroactive: false,
    deadline: 'Policy must be in place before leave is taken. Credit claimed on annual business income tax return.',
    riskLevel: 'low',
    typicalSavingsRange: { min: 1000, max: 15000 },
    savingsFormula: 'FMLA wages paid × credit rate (12.5% to 25%). Credit reduces income tax liability dollar-for-dollar.',
    implementationSteps: [
      'Draft written paid FMLA leave policy meeting §45S requirements',
      'Distribute policy to all eligible employees',
      'Track FMLA leave taken and wages paid during leave',
      'Calculate credit on Form 8994 (Employer Credit for Paid Family and Medical Leave)',
      'Include credit on Form 3800 (General Business Credit)',
      'Claim credit on business income tax return',
    ],
    taxFiling: 'Form 8994 calculates the credit. Flows to Form 3800 (General Business Credit). Credit taken on business return (1120, 1120S, 1065, or Schedule C).',
  },
  {
    id: 'erc',
    title: 'Employee Retention Credit (ERC)',
    tier: 'business',
    category: 'Disaster Relief',
    description: 'Claim the retroactive Employee Retention Credit — a refundable payroll tax credit of up to 70% of qualified wages per employee per quarter in 2021 (up to $7,000 per employee per quarter, or $28,000 per employee for all of 2021). Available to businesses that experienced a significant revenue decline or were subject to government-ordered shutdowns due to COVID-19.',
    ircReference: 'IRC §3134; CARES Act §2301; CAA 2021; ARPA §9651',
    applicableTo: ['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership'],
    qualificationQuestions: [
      {
        id: 'erc-revenue-decline-2021',
        question: 'Did your business experience a revenue decline of at least 20% in any quarter of 2021 compared to the same quarter in 2019?',
        helpText: 'For 2021 quarters, ERC requires gross receipts to be less than 80% of the same quarter in 2019 (a 20%+ decline). If 2019 comparison is not possible, use 2020. This is the most common qualification route.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'erc-government-shutdown',
        question: 'Was your business subject to a full or partial government-ordered shutdown due to COVID-19 in 2020 or 2021?',
        helpText: 'The second qualification route is government-ordered suspension of operations due to COVID-19. This includes restaurant capacity restrictions, office closures, and supply chain disruptions caused by government orders affecting suppliers.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'erc-qualifies-either',
        question: 'Does your business qualify under at least one of the two ERC qualification routes (revenue decline OR government shutdown)?',
        helpText: 'If you answered No to both previous questions, your business likely does not qualify for ERC. If Yes to either, proceed. ERC promoters have aggressively marketed questionable claims — ensure you have genuine qualification.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'erc-less-500-employees',
        question: 'Did your business have 500 or fewer full-time employees in 2021?',
        helpText: 'For 2021, businesses with 500 or fewer FTEs can claim ERC on wages paid to ALL employees during qualifying quarters, whether working or not. Businesses over 500 can only claim ERC on wages paid to employees not providing services.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'erc-ppp-loan',
        question: 'Did your business receive a PPP loan?',
        helpText: 'Receiving a PPP loan does not disqualify you from ERC, but the same wages cannot be used for both PPP forgiveness and ERC. A CPA must carefully coordinate which wages are allocated to each program to maximize both benefits.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'erc-not-already-claimed',
        question: 'Have you NOT already claimed the full ERC on your Form 941?',
        helpText: 'If you already claimed ERC on original Form 941 filings, no further action may be needed. This strategy targets businesses that have not yet claimed ERC through amended 941-X returns.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'erc-payroll-records',
        question: 'Do you have payroll records for 2020 and 2021 documenting wages paid?',
        helpText: 'ERC calculations require detailed payroll records including gross wages, health plan contributions, and employee headcount by quarter. Gather these records before proceeding.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'erc-repayment-risk',
        question: 'Do you understand that improper ERC claims are subject to repayment with interest and penalties, and that IRS scrutiny is high?',
        helpText: 'The IRS has flagged ERC as a top compliance concern. Congress has increased penalties for promoters of questionable ERC claims. Ensure your claim is based on genuine qualification and is prepared by a reputable CPA.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'erc-gross-receipts',
        question: 'Do you have quarterly gross receipts records for 2019, 2020, and 2021?',
        helpText: 'Revenue decline qualification requires quarterly gross receipts comparisons. Gather quarterly revenue figures from your accounting records or tax returns for 2019-2021.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'erc-experienced-cpa',
        question: 'Are you working with a CPA experienced in ERC qualification analysis (not an ERC mill)?',
        helpText: 'Due to widespread ERC fraud, use a trusted CPA for qualification analysis. Avoid "ERC mills" that guarantee credits without genuine qualification review. Contingency fee arrangements are a red flag.',
        type: 'yes_no',
        required: false,
      },
    ],
    implementationTime: '4-12 weeks (preparation and IRS processing may take 6-18 months)',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'CPA experienced in ERC qualification analysis and Form 941-X amendment preparation',
    isRetroactive: true,
    deadline: 'Amended 941-X for 2020 quarters: statute closes April 2024. For 2021 quarters: statute closes April 2025. Act immediately.',
    riskLevel: 'medium',
    typicalSavingsRange: { min: 10000, max: 200000 },
    savingsFormula: '2021: 70% × qualified wages per employee per quarter, max $7,000/employee/quarter × number of qualifying quarters × number of qualifying employees',
    implementationSteps: [
      'Gather quarterly gross receipts for 2019, 2020, and 2021',
      'Identify qualifying quarters based on revenue decline or government shutdown',
      'Compile payroll records for qualifying quarters',
      'Coordinate with PPP loan forgiveness records to avoid double-counting wages',
      'Calculate ERC per quarter with experienced CPA',
      'Prepare and file amended Form 941-X for each qualifying quarter',
      'Respond to any IRS correspondence or documentation requests',
      'Reduce wage deduction on business return by amount of ERC claimed (if applicable)',
    ],
    taxFiling: 'Amended Form 941-X filed for each qualifying quarter. ERC is a refundable payroll tax credit. Wages deducted on business income return must be reduced by the amount of ERC claimed.',
  },
  {
    id: 'captive-insurance',
    title: 'Captive Insurance Company',
    tier: 'business',
    category: 'Insurance & Risk',
    description: 'Form a captive insurance company — an insurance company owned by the business owner — to insure legitimate business risks that are uninsured or underinsured in the commercial market. Premiums paid to the captive are deductible to the operating company. The captive electing §831(b) status pays tax only on investment income (not premium income) if premiums are $2.85 million or less (2025).',
    ircReference: 'IRC §831(b); IRC §162',
    applicableTo: ['s_corp', 'c_corp', 'llc', 'partnership'],
    incomeThreshold: { min: 1000000 },
    qualificationQuestions: [
      {
        id: 'captive-revenue',
        question: 'Does your business have annual revenue of at least $1,000,000?',
        helpText: 'Captive insurance is generally cost-effective only at $1M+ revenue. Below this level, the administrative costs, actuarial fees, regulatory compliance, and domicile fees typically exceed the tax benefit.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'captive-identifiable-risks',
        question: 'Does your business have identifiable, insurable business risks that are currently uninsured or underinsured?',
        helpText: 'A legitimate captive must insure genuine business risks — such as reputational risk, supply chain disruption, regulatory risk, data breach, employee key-person risk, or catastrophic equipment failure. The IRS has disallowed captives insuring implausible or phantom risks.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'captive-actuarial-support',
        question: 'Are you willing to engage an independent actuary to price the risks at arm\'s-length market rates?',
        helpText: 'Premiums must be actuarially determined at arm\'s-length rates — what a commercial insurer would charge for the same risk. The IRS scrutinizes captives where premiums are set to maximize deductions rather than reflect actual risk pricing.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'captive-claims-history',
        question: 'Does your business have a history of actual or potential claims for the risks to be insured?',
        helpText: 'Captives insuring risks that have never resulted in claims and never realistically could are flagged as abusive tax shelters. The insured risks must be genuine with plausible claim scenarios.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'captive-831b',
        question: 'Do you want to use the §831(b) small captive election (premium income under $2.85M, pay tax only on investment income)?',
        helpText: 'The §831(b) election is powerful but heavily scrutinized. The IRS has placed §831(b) captives on its "Dirty Dozen" list of abusive tax schemes. Legitimate §831(b) captives exist but require rigorous compliance. Captives failing the risk distribution test or insuring sham risks face full disallowance.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'captive-experienced-manager',
        question: 'Are you working with a captive manager with a strong compliance reputation (not a promoter-driven arrangement)?',
        helpText: 'Captive managers vary widely in quality and compliance orientation. Choose a manager with a track record of legitimate captive structures, not one marketing captives primarily as a tax strategy. Check IRS-listed promoters to avoid.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'captive-annual-premiums',
        question: 'What is the approximate annual premium budget you are considering?',
        helpText: 'Premiums must be set by an independent actuary based on risk. Annual premiums for small captives typically range from $300,000 to $2,850,000 for §831(b) elections. Provide a budget estimate for feasibility analysis.',
        type: 'currency',
        required: false,
      },
      {
        id: 'captive-disclosure',
        question: 'Do you understand that §831(b) captives may require disclosure on Form 8886 as a Listed Transaction or Transaction of Interest?',
        helpText: 'The IRS has designated certain captive structures as Listed Transactions or Transactions of Interest requiring Form 8886 disclosure. Failure to disclose results in substantial penalties. Ensure your advisor addresses disclosure requirements.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'captive-legal-counsel',
        question: 'Are you working with a tax attorney experienced in captive insurance to review the structure?',
        helpText: 'Given the high IRS scrutiny of captives, independent legal review of the structure by a tax attorney (separate from the captive manager) is strongly recommended before implementation.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'captive-risk-distribution',
        question: 'Can the captive achieve genuine risk distribution through a risk pool or by insuring multiple unrelated entities?',
        helpText: 'Insurance requires risk distribution — shifting risk to a pool. A captive insuring only one company\'s risks may not qualify as insurance for tax purposes. Pool arrangements or multi-owner captives address this requirement.',
        type: 'yes_no',
        required: true,
      },
    ],
    implementationTime: '90-180 days',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'Captive manager, domicile attorney, actuary, CPA, and ideally independent tax counsel',
    isRetroactive: false,
    deadline: 'Captive must be formed and premiums paid within the tax year for deduction. Annual premium payments and regulatory filings required.',
    riskLevel: 'high',
    typicalSavingsRange: { min: 50000, max: 300000 },
    savingsFormula: 'Annual premiums deducted × operating company marginal tax rate; captive pays tax only on investment income under §831(b) election',
    implementationSteps: [
      'Conduct risk analysis to identify genuine uninsured or underinsured business risks',
      'Engage independent actuary to price risks at arm\'s-length rates',
      'Select captive domicile (Vermont, Delaware, Hawaii, or offshore)',
      'Engage captive manager and domicile attorney to form the captive',
      'Capitalize the captive with sufficient reserves',
      'Enter into insurance policy between operating company and captive',
      'Pay annual premiums (actuary-determined amounts)',
      'File Form 8886 if required as Listed Transaction or Transaction of Interest',
      'Maintain captive as a genuine insurance company (claims handling, reserve adequacy)',
      'File annual captive insurance company tax return and regulatory reports',
    ],
    taxFiling: 'Operating company deducts premiums as ordinary business expense. Captive (§831(b) election) files Form 1120-PC and pays tax only on investment income. May require Form 8886 disclosure.',
  },
  {
    id: '1031-exchange',
    title: '1031 Like-Kind Exchange',
    tier: 'business',
    category: 'Investable Gains',
    description: 'Defer capital gains tax on the sale of investment or business real property by reinvesting proceeds into a like-kind replacement property. All gain recognition is deferred — potentially indefinitely through successive exchanges — preserving capital for reinvestment. Rules: 45-day identification period and 180-day closing period.',
    ircReference: 'IRC §1031',
    applicableTo: ['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership'],
    qualificationQuestions: [
      {
        id: '1031-selling-property',
        question: 'Are you selling investment real property or business-use real property (not your primary residence)?',
        helpText: 'Since 2017, §1031 exchanges apply ONLY to real property. Personal property exchanges no longer qualify. The relinquished property must be held for productive use in business or for investment — not primarily for personal use.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: '1031-replacement-property',
        question: 'Do you intend to purchase replacement real property of equal or greater value?',
        helpText: 'To defer 100% of the gain, the replacement property must be of equal or greater fair market value AND you must reinvest all net proceeds. Receiving cash ("boot") results in immediate taxable gain to the extent of boot received.',
        type: 'yes_no',
        required: true,
      },
      {
        id: '1031-qualified-intermediary',
        question: 'Are you willing to use a Qualified Intermediary (QI) to hold proceeds between sale and purchase?',
        helpText: 'You cannot touch the sale proceeds — a Qualified Intermediary (exchange accommodator) must hold funds between the sale of the relinquished property and the purchase of the replacement property. Using a QI is mandatory.',
        type: 'yes_no',
        required: true,
      },
      {
        id: '1031-timing',
        question: 'Can you identify replacement property within 45 days of closing on the relinquished property?',
        helpText: 'The 45-day identification rule is strict and not extendable. You must identify potential replacement properties in writing within 45 days of the sale of the relinquished property. Missing this deadline voids the exchange.',
        type: 'yes_no',
        required: true,
      },
      {
        id: '1031-180-days',
        question: 'Can you close on the replacement property within 180 days of the sale of the relinquished property?',
        helpText: 'The 180-day rule is also strict. You must actually close on the replacement property within 180 days of the relinquished property sale (or tax return due date, whichever is earlier). Extensions are rarely granted.',
        type: 'yes_no',
        required: true,
      },
      {
        id: '1031-gain-amount',
        question: 'What is the approximate capital gain you would recognize if you sold the property without a 1031 exchange?',
        helpText: 'Estimate your gain to quantify the deferred tax liability. Include depreciation recapture (taxed at 25%) and capital gains (0%, 15%, or 20% plus 3.8% NIIT for high earners).',
        type: 'currency',
        required: false,
      },
      {
        id: '1031-debt-replacement',
        question: 'Is the replacement property subject to equal or greater debt than the relinquished property?',
        helpText: 'Mortgage relief is treated as boot. If the replacement property has less debt than the relinquished property, the difference is taxable boot. Ensure debt levels are maintained or increased to avoid partial gain recognition.',
        type: 'yes_no',
        required: false,
      },
      {
        id: '1031-experienced-qi',
        question: 'Have you selected an experienced, bonded Qualified Intermediary (not a related party)?',
        helpText: 'The QI cannot be a related party (attorney, CPA, realtor, or family member who has served you in certain capacities in the past 2 years). Select an established, bonded, and insured QI.',
        type: 'yes_no',
        required: false,
      },
      {
        id: '1031-dealer-property',
        question: 'Is the property held primarily for sale to customers (dealer property) rather than for investment?',
        helpText: 'Dealer property (inventory or property held for sale in the ordinary course of business) does NOT qualify for §1031. The property must be held for investment or productive use in business, not for sale.',
        type: 'yes_no',
        required: true,
      },
    ],
    implementationTime: '45-180 days',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'Qualified Intermediary (mandatory), real estate attorney, CPA for gain calculation and Form 8824',
    isRetroactive: false,
    deadline: '45-day identification and 180-day closing deadlines are statutory and not extendable in most cases',
    riskLevel: 'low',
    typicalSavingsRange: { min: 20000, max: 500000 },
    savingsFormula: 'Capital gain deferred × (combined federal capital gains rate + state rate). Depreciation recapture deferred × 25% federal rate.',
    implementationSteps: [
      'Engage Qualified Intermediary before sale closes',
      'Sign exchange agreement with QI before transferring relinquished property',
      'Close sale of relinquished property; QI receives and holds proceeds',
      'Identify replacement property in writing to QI within 45 days',
      'Conduct due diligence on replacement property',
      'Close on replacement property within 180 days',
      'QI transfers funds to complete replacement purchase',
      'Report exchange on Form 8824 (Like-Kind Exchanges) attached to tax return',
    ],
    taxFiling: 'File Form 8824 (Like-Kind Exchanges) with the tax return for the year of exchange. Report any boot received as gain. Basis in replacement property is carryover basis from relinquished property.',
  },
  {
    id: 'installment-sale',
    title: 'Installment Sale',
    tier: 'business',
    category: 'Investable Gains',
    description: 'Spread gain recognition over multiple years by receiving payments from the buyer over time rather than in a lump sum. Tax is paid only as principal payments are received, keeping the seller in lower tax brackets and deferring the tax liability into future years.',
    ircReference: 'IRC §453',
    applicableTo: ['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership'],
    qualificationQuestions: [
      {
        id: 'installment-selling-asset',
        question: 'Are you selling a business asset, investment property, or a business itself?',
        helpText: 'Installment sales work for most asset sales where at least one payment is received after the year of sale. Commonly used for real estate, business sales, and high-value equipment. Dealer property and publicly traded securities generally cannot use installment reporting.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'installment-payments-over-time',
        question: 'Are you willing to receive payments from the buyer over multiple years (rather than a lump sum at closing)?',
        helpText: 'Installment sale reporting is only available when at least one payment is received after the year of sale. If the buyer pays all cash at closing, installment reporting is not available (unless the seller uses a structured installment sale via an annuity).',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'installment-buyer-creditworthy',
        question: 'Is the buyer creditworthy and able to make payments over the installment period?',
        helpText: 'Seller-financed installment sales carry default risk. Secure the obligation with a promissory note, UCC filing, or deed of trust. Evaluate the buyer\'s financial strength and consider personal guarantees.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'installment-gain-amount',
        question: 'What is the approximate total gain you expect to recognize on the sale?',
        helpText: 'Estimate the total gain (sales price minus adjusted basis) to calculate the gross profit percentage. Each installment payment is taxed at the gross profit percentage, spreading gain proportionally over the payment period.',
        type: 'currency',
        required: true,
      },
      {
        id: 'installment-ordinary-vs-capital',
        question: 'Is the gain primarily capital gain or ordinary income (depreciation recapture)?',
        helpText: 'Depreciation recapture under §1245 and §1250 must be recognized in the year of sale (not spread over installments). Only capital gain portion can be deferred. If significant recapture is involved, the deferral benefit is reduced.',
        type: 'choice',
        choices: ['Primarily capital gain', 'Primarily depreciation recapture', 'Mixed'],
        required: false,
      },
      {
        id: 'installment-interest-rate',
        question: 'Will the installment note carry an adequate stated interest rate (at least the Applicable Federal Rate)?',
        helpText: 'The installment note must charge at least the Applicable Federal Rate (AFR) to avoid imputed interest rules. Below-market interest rates result in the IRS imputing additional ordinary income to the seller.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'installment-c-corp',
        question: 'Is the selling entity a C-Corporation?',
        helpText: 'C-Corporations generally cannot use installment sale reporting for dealer property or for sales of property to which the accrual method applies. Confirm eligibility with your CPA.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'installment-related-party',
        question: 'Is the buyer a related party (family member, controlled entity)?',
        helpText: 'Installment sales to related parties trigger special rules. If the related buyer resells the property before the seller has received all installments, the seller may have to recognize the remaining gain immediately.',
        type: 'yes_no',
        required: false,
      },
    ],
    implementationTime: '2-8 weeks',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'Attorney to draft installment sale agreement and promissory note; CPA to calculate gross profit percentage and advise on recapture',
    isRetroactive: false,
    deadline: 'Installment election is made on the tax return for the year of sale. Opt-out is available by the due date of the return.',
    riskLevel: 'low',
    typicalSavingsRange: { min: 10000, max: 150000 },
    savingsFormula: 'Gain deferred per year × (current year marginal rate − expected future marginal rate); time value of deferred tax payments',
    implementationSteps: [
      'Negotiate installment sale terms with buyer (down payment, payment schedule, interest rate)',
      'Draft promissory note with adequate stated interest (at least AFR)',
      'Secure note with appropriate collateral (lien, deed of trust, UCC filing)',
      'Calculate gross profit percentage (total gain ÷ contract price)',
      'Report installment sale on Form 6252 (Installment Sale Income)',
      'Recognize depreciation recapture in year of sale on Form 4797',
      'Recognize installment payments × gross profit percentage each year',
      'Report interest income separately at ordinary income rates',
    ],
    taxFiling: 'Form 6252 (Installment Sale Income) filed each year payments are received. Form 4797 (Sales of Business Property) for year of sale. Depreciation recapture reported in year of sale.',
  },
  {
    id: 'qoz-business',
    title: 'Qualified Opportunity Zone Investment',
    tier: 'business',
    category: 'Investable Gains',
    description: 'Invest capital gains into a Qualified Opportunity Fund (QOF) within 180 days of the triggering sale. Defers recognition of those gains until the earlier of the QOF investment disposal or December 31, 2026. Gains on the QOF investment itself are permanently excluded from income if held for 10+ years.',
    ircReference: 'IRC §1400Z-2',
    applicableTo: ['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership'],
    qualificationQuestions: [
      {
        id: 'qoz-has-capital-gains',
        question: 'Have you recently realized, or do you expect to realize, capital gains from the sale of assets, business interests, or investments?',
        helpText: 'QOZ investing only defers and potentially eliminates capital gains. If you have no capital gains to reinvest, this strategy does not apply. Both short-term and long-term capital gains are eligible.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no',
      },
      {
        id: 'qoz-180-days',
        question: 'Can you invest the gain amount into a Qualified Opportunity Fund within 180 days of the sale?',
        helpText: 'The 180-day window is measured from the date of the sale that generated the gains. Only the gain amount (not the entire proceeds) must be reinvested into the QOF. Missing the 180-day deadline disqualifies the deferral.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'qoz-hold-10-years',
        question: 'Are you willing to hold the QOF investment for at least 10 years?',
        helpText: 'The 10-year hold provides the most significant benefit: permanent exclusion of appreciation on the QOF investment. Investors who exit before 10 years receive partial benefits. Consider your liquidity needs before committing.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'qoz-gain-amount',
        question: 'What is the approximate capital gain amount you are considering reinvesting?',
        helpText: 'Only the gain portion needs to be reinvested to achieve full deferral. If you reinvest less than the full gain, you recognize the uninvested portion immediately. Provide the gain amount for analysis.',
        type: 'currency',
        required: true,
      },
      {
        id: 'qoz-qof-selection',
        question: 'Have you identified a Qualified Opportunity Fund to invest in, or are you forming your own QOF?',
        helpText: 'A QOF must be a corporation or partnership that invests at least 90% of its assets in Qualified Opportunity Zone property. Many investment funds offer QOF products. You can also self-certify your own QOF using Form 8996.',
        type: 'choice',
        choices: ['Identified third-party QOF', 'Planning to form own QOF', 'Still researching options'],
        required: false,
      },
      {
        id: 'qoz-2026-recognition',
        question: 'Do you understand that deferred gains will be recognized no later than December 31, 2026, regardless of QOF hold period?',
        helpText: 'Under current law, deferred gains are recognized on December 31, 2026, or when the QOF investment is sold — whichever comes first. Plan for the 2026 tax liability even if you plan to hold long-term.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'qoz-oz-business',
        question: 'If forming your own QOF, does the underlying business operate substantially in a designated Opportunity Zone?',
        helpText: 'QOF investments must ultimately be deployed into qualified OZ property or an active OZ business. Passive holding or "sin businesses" (golf courses, massage parlors, hot tub facilities, etc.) are disqualified.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'qoz-form-8949',
        question: 'Are you aware that you must make the QOZ deferral election on Form 8949 in the year of the gain?',
        helpText: 'The deferral election is made on Form 8949 (Sales and Other Dispositions of Capital Assets) for the tax year in which the gain was realized. Work with your CPA to make the election timely.',
        type: 'yes_no',
        required: false,
      },
    ],
    implementationTime: '30-90 days (must invest within 180 days of gain)',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'QOF sponsor or securities attorney if forming own QOF; CPA for elections and Form 8949/8997',
    isRetroactive: false,
    deadline: '180 days from the date of the capital gain triggering event',
    riskLevel: 'medium',
    typicalSavingsRange: { min: 15000, max: 200000 },
    savingsFormula: 'Deferred gain × marginal rate × time value factor + (QOF appreciation after 10 years × capital gains rate permanently excluded)',
    implementationSteps: [
      'Calculate capital gain from triggering sale and identify 180-day deadline',
      'Research and select a suitable Qualified Opportunity Fund',
      'Invest gain proceeds into QOF within 180 days',
      'Make deferral election on Form 8949 for the year of the gain',
      'File Form 8997 (Initial and Annual Statement of QOZ Business Investments) annually',
      'Hold investment for at least 10 years to achieve permanent exclusion on QOF appreciation',
      'At sale after 10 years, make basis step-up election to fair market value',
    ],
    taxFiling: 'Form 8949 election in year of gain deferral. Form 8997 filed annually to track OZ investments. Deferred gain recognized on 2026 return or at sale.',
  },
  {
    id: 'bonus-depreciation-biz',
    title: '100% Bonus Depreciation',
    tier: 'business',
    category: 'Depreciation',
    description: 'Deduct 100% of the cost of qualifying new or used business property in the year placed in service (restored to 100% for property placed in service in 2025 and beyond under current law). Applies to tangible personal property, qualified improvement property, and certain listed property with recovery periods of 20 years or less.',
    ircReference: 'IRC §168(k)',
    applicableTo: ['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership'],
    qualificationQuestions: [
      {
        id: 'bonus-dep-qualifying-property',
        question: 'Are you placing new or used qualifying business property in service this tax year?',
        helpText: 'Qualifying property includes: tangible personal property with a MACRS recovery period of 20 years or less (computers, machinery, furniture, vehicles, tools), qualified film/TV/theatrical productions, and qualified improvement property (interior building improvements). Buildings and land do not qualify.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'bonus-dep-business-use',
        question: 'Is the property used more than 50% for business purposes?',
        helpText: 'Listed property (vehicles, computers, cell phones) must be used more than 50% for business to qualify for bonus depreciation. If business use is 50% or less, the property is subject to straight-line depreciation only.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'bonus-dep-new-or-used',
        question: 'Is this new property being placed in service for the first time, or used property being acquired from an unrelated party?',
        helpText: 'For bonus depreciation, used property qualifies only if it was not previously used by the taxpayer or a predecessor and was not acquired from a related party. New property acquired from any source qualifies.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'bonus-dep-property-cost',
        question: 'What is the approximate total cost of qualifying property to be placed in service this year?',
        helpText: 'There is no dollar limit on bonus depreciation (unlike §179). Provide an estimate to calculate the potential first-year deduction.',
        type: 'currency',
        required: true,
      },
      {
        id: 'bonus-dep-sufficient-income',
        question: 'Does the business have sufficient taxable income to absorb the deduction, or are you comfortable with a net operating loss (NOL)?',
        helpText: 'Bonus depreciation can create or increase a net operating loss. NOLs can be carried forward indefinitely (with the 80% taxable income limitation). Consider whether creating an NOL this year is strategically beneficial.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'bonus-dep-vehicles',
        question: 'Are any of the qualifying assets passenger automobiles?',
        helpText: 'Passenger automobiles are subject to luxury auto depreciation limits under §280F. For 2025, the first-year §280F limit for passenger automobiles with bonus depreciation is approximately $20,400. Heavy SUVs (>6,000 lb GVWR) may qualify for full §179 expensing instead.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'bonus-dep-qip',
        question: 'Are any of the qualifying assets Qualified Improvement Property (interior improvements to existing nonresidential buildings)?',
        helpText: 'Qualified Improvement Property (QIP) — interior improvements to existing nonresidential buildings — has a 15-year MACRS life and qualifies for 100% bonus depreciation. Exterior improvements, elevators, escalators, and structural components do not qualify as QIP.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'bonus-dep-state-conformity',
        question: 'Does your state conform to federal bonus depreciation rules?',
        helpText: 'Many states do not conform to federal bonus depreciation and require a state addback. California, New York, and others have significant differences. State tax savings may be reduced or eliminated depending on your state.',
        type: 'yes_no',
        required: false,
      },
    ],
    implementationTime: '1-4 weeks (property must be placed in service by year-end)',
    thirdPartyNeeded: false,
    thirdPartyDetails: 'CPA to properly classify property, calculate depreciation, and handle §280F limitations for vehicles',
    isRetroactive: false,
    deadline: 'Property must be placed in service (in use and ready for business use) by December 31 of the tax year',
    riskLevel: 'low',
    typicalSavingsRange: { min: 5000, max: 100000 },
    savingsFormula: 'Qualifying property cost × 100% × marginal tax rate (e.g., $100,000 purchase × 37% = $37,000 tax savings)',
    implementationSteps: [
      'Identify all qualifying property to be purchased and placed in service before year-end',
      'Confirm property is tangible personal property with 20-year or less MACRS life (or QIP)',
      'Purchase and place property in service by December 31',
      'Document business use percentage for listed property',
      'Elect bonus depreciation on Form 4562 (Depreciation and Amortization)',
      'Review §280F limits for passenger automobiles',
      'Check state conformity for state return adjustments',
    ],
    taxFiling: 'Form 4562 (Depreciation and Amortization) filed with business return. Part II covers bonus depreciation. State addback adjustments may be required on state returns.',
  },
  {
    id: 'cost-segregation-biz',
    title: 'Cost Segregation Study',
    tier: 'business',
    category: 'Depreciation',
    description: 'Engage an engineering-based cost segregation study to reclassify commercial real estate components from 39-year (or 27.5-year residential) depreciation to 5-year, 7-year, or 15-year property, enabling accelerated depreciation and bonus depreciation. For a $1M+ building, a cost seg study can generate $50,000-$200,000+ in additional first-year deductions.',
    ircReference: 'IRC §168; Rev. Proc. 87-56; IRS MSSP Audit Technique Guide',
    applicableTo: ['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership'],
    qualificationQuestions: [
      {
        id: 'cost-seg-owns-building',
        question: 'Do you own (or are you purchasing) a commercial or investment building worth at least $500,000?',
        helpText: 'Cost segregation studies typically cost $8,000-$25,000 and are cost-effective for buildings worth $500,000+. Below this threshold, the study cost may exceed the net present value of the tax benefit.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no',
      },
      {
        id: 'cost-seg-building-use',
        question: 'Is the building used for business or investment purposes (not your primary residence)?',
        helpText: 'Cost segregation applies to commercial buildings, rental residential properties (apartments, multi-family), and mixed-use properties. Personal residence improvements do not qualify.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: 'cost-seg-recently-acquired',
        question: 'Did you purchase, construct, or substantially renovate the building in the past 15 years?',
        helpText: 'Cost segregation studies can be performed retroactively on buildings placed in service in prior years using a "catch-up" depreciation correction (Form 3115, Change in Accounting Method) without amending prior returns.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'cost-seg-building-value',
        question: 'What is the approximate cost or fair market value of the building?',
        helpText: 'The building value determines the potential reclassification opportunity. Typically 20-40% of a commercial building\'s cost can be reclassified to shorter-life property.',
        type: 'currency',
        required: true,
      },
      {
        id: 'cost-seg-bonus-dep',
        question: 'Do you want to combine the cost segregation reclassification with bonus depreciation (100% in 2025)?',
        helpText: 'Combining cost seg with bonus depreciation is extremely powerful: reclassified 5-year and 15-year components qualify for 100% first-year bonus depreciation in 2025. This can generate deductions equal to 25-40% of the building cost in year one.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'cost-seg-passive-activity',
        question: 'Are you a real estate professional (or do you materially participate in the rental activity) who can use real estate losses against active income?',
        helpText: 'Passive activity rules limit deduction of real estate losses against non-passive income. Real estate professionals (750+ hours, more than half of personal services in real estate) can deduct accelerated losses against all income.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'cost-seg-form-3115',
        question: 'For retroactive studies on buildings placed in service in prior years, are you willing to file Form 3115 for catch-up depreciation?',
        helpText: 'Prior-year buildings use Form 3115 (Application for Change in Accounting Method) to claim all missed depreciation in a single year as a §481(a) adjustment. No need to amend prior returns.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'cost-seg-engineer',
        question: 'Are you willing to engage a qualified cost segregation engineer (not just a CPA estimate)?',
        helpText: 'The IRS requires cost segregation studies to be performed by individuals with engineering or construction knowledge. Pure CPA estimates without engineering analysis are more vulnerable on audit.',
        type: 'yes_no',
        required: true,
      },
    ],
    implementationTime: '4-8 weeks for study completion',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'Qualified cost segregation engineering firm; CPA to file Form 3115 and integrate into tax return',
    isRetroactive: true,
    deadline: 'Can be done retroactively for any open tax year. For new acquisitions, perform study in the year of purchase for maximum benefit.',
    riskLevel: 'low',
    typicalSavingsRange: { min: 20000, max: 200000 },
    savingsFormula: 'Reclassified cost × (bonus depreciation rate or MACRS acceleration benefit) × marginal tax rate; NPV of tax deferral on remaining depreciation',
    implementationSteps: [
      'Engage qualified cost segregation engineering firm',
      'Provide building blueprints, construction invoices, and settlement statements',
      'Receive detailed cost segregation report classifying building components',
      'For prior-year buildings, file Form 3115 for catch-up §481(a) adjustment',
      'Apply 100% bonus depreciation to 5-year and 15-year reclassified components',
      'Report on Form 4562',
      'Retain cost segregation report for audit support',
    ],
    taxFiling: 'Form 4562 for depreciation. Form 3115 filed with return (with IRS copy) for retroactive accounting method change. §481(a) catch-up deduction taken in year of change.',
  },
  {
    id: 'section-179-biz',
    title: 'Section 179 Expensing',
    tier: 'business',
    category: 'Depreciation',
    description: 'Immediately expense the full cost of qualifying business equipment, vehicles, and software in the year placed in service, up to $1,290,000 (2025 limit, subject to phase-out above $3,220,000 of qualifying purchases). Unlike bonus depreciation, §179 is limited to taxable income from the business — it cannot create a net operating loss.',
    ircReference: 'IRC §179',
    applicableTo: ['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership'],
    qualificationQuestions: [
      {
        id: '179-qualifying-property',
        question: 'Are you purchasing qualifying property — equipment, machinery, computers, off-the-shelf software, or business vehicles — this year?',
        helpText: 'Qualifying §179 property includes tangible personal property used in business, off-the-shelf computer software, and qualified improvement property. It does NOT include real property (buildings, land) or property used outside the US.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no'
      },
      {
        id: '179-business-use',
        question: 'Is the property used more than 50% for business purposes?',
        helpText: 'Business use must exceed 50% for §179 expensing. If business use drops to 50% or less within the depreciation recovery period, a §179 recapture may be required.',
        type: 'yes_no',
        required: true,
      },
      {
        id: '179-taxable-income',
        question: 'Does the business have sufficient taxable income to absorb the §179 deduction?',
        helpText: 'Section 179 deductions are limited to the taxpayer\'s taxable income from active business activity. §179 cannot create an NOL (unlike bonus depreciation). Disallowed §179 carries forward to future years.',
        type: 'yes_no',
        required: true,
      },
      {
        id: '179-total-purchases',
        question: 'Will total qualifying §179 property purchases exceed $3,220,000 (2025) this year?',
        helpText: 'The §179 deduction phases out dollar-for-dollar above $3,220,000 in qualifying purchases (2025). If total qualifying property exceeds this threshold, the maximum §179 deduction is reduced. Bonus depreciation has no such phase-out.',
        type: 'yes_no',
        required: false,
      },
      {
        id: '179-vehicles',
        question: 'Are any of the qualifying assets business vehicles?',
        helpText: 'Passenger automobiles are subject to §280F luxury auto limits (~$12,400 first year, 2025). However, SUVs and trucks with GVWR over 6,000 lbs can expense up to $30,500 (2025) under §179. Cargo vans and heavy trucks may qualify for the full §179 amount.',
        type: 'yes_no',
        required: false,
      },
      {
        id: '179-property-cost',
        question: 'What is the total cost of qualifying property you plan to purchase this year?',
        helpText: 'Provide the total to determine whether you are within the §179 limit ($1,290,000 in 2025) and whether bonus depreciation should be used for excess amounts.',
        type: 'currency',
        required: true,
      },
      {
        id: '179-placed-in-service',
        question: 'Will the property be placed in service (in use for business) before December 31 of the tax year?',
        helpText: 'Property must be placed in service by December 31 to qualify for the §179 deduction in that tax year. Ordered but not delivered and operational does not count.',
        type: 'yes_no',
        required: true,
      },
      {
        id: '179-software',
        question: 'Are you purchasing off-the-shelf software or SaaS subscriptions?',
        helpText: 'Off-the-shelf computer software (purchased, not licensed) qualifies for §179. Cloud computing and SaaS subscriptions are expensed currently as ordinary business expenses (not §179). Distinguish between purchased software and subscription services.',
        type: 'yes_no',
        required: false,
      },
    ],
    implementationTime: '1-4 weeks (property must be placed in service by year-end)',
    thirdPartyNeeded: false,
    thirdPartyDetails: 'CPA to elect §179, handle §280F limits for vehicles, and coordinate with bonus depreciation elections',
    isRetroactive: false,
    deadline: 'Property must be placed in service by December 31 of the tax year. §179 election made on Form 4562.',
    riskLevel: 'low',
    typicalSavingsRange: { min: 5000, max: 80000 },
    savingsFormula: '§179 expensed amount × marginal tax rate (e.g., $100,000 × 37% = $37,000 tax savings)',
    implementationSteps: [
      'Identify qualifying property to purchase and place in service before year-end',
      'Confirm property is tangible personal property with US business use >50%',
      'Purchase and place property in service by December 31',
      'Elect §179 expensing on Form 4562, Part I',
      'Apply §280F limits for listed property (vehicles)',
      'Coordinate §179 with bonus depreciation for additional savings on amounts above §179 limit',
      'Carry forward any §179 deductions limited by taxable income',
    ],
    taxFiling: 'Form 4562 (Depreciation and Amortization), Part I for §179 election. §179 limited to taxable income; excess carries forward. Most states conform to §179.',
  },
  {
    id: 'fica-tip-credit',
    title: 'FICA Tip Credit',
    tier: 'business',
    category: 'Niche Credits',
    description: 'Claim a federal income tax credit for the employer\'s share of FICA taxes (7.65%) paid on employee tip income above $5.15 per hour (the 1996 minimum wage). Applies to food and beverage establishments where tipping is customary. The credit is dollar-for-dollar against income tax.',
    ircReference: 'IRC §45B',
    applicableTo: ['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership'],
    qualificationQuestions: [
      {
        id: 'tip-food-beverage',
        question: 'Is your business a food or beverage establishment where tipping is customary (restaurant, bar, café, hotel food service)?',
        helpText: 'The §45B FICA tip credit is available ONLY to food and beverage establishments where tipping is a customary practice. Non-food businesses where employees receive tips (e.g., salons, valet services) do not qualify.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no',
      },
      {
        id: 'tip-employees-receive-tips',
        question: 'Do your employees receive tips from customers in excess of $5.15 per hour of employment?',
        helpText: 'The credit applies only to FICA taxes on tip income above $5.15 per hour (the 1996 federal minimum wage). FICA on tips needed to bring the employee up to $5.15/hr does not generate a credit. The credit is on "excess" tips above that floor.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'tip-employer-pays-fica',
        question: 'Do you as the employer pay the 7.65% FICA employer share on reported employee tip income?',
        helpText: 'The credit reimburses the employer\'s portion of FICA taxes on reported tips. Employers cannot lower reported wages to avoid FICA — all reported tips are subject to employer FICA. The §45B credit recovers that cost.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'tip-reported-tips',
        question: 'Do your employees properly report tip income to you?',
        helpText: 'Employees must report tips to the employer for the employer FICA obligation and credit to apply. If tip income is not being reported, address compliance first. Unreported tips create employer FICA liability.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'tip-total-annual-tips',
        question: 'What is the approximate total reported tip income received by employees annually?',
        helpText: 'The credit equals 7.65% of excess tips (above $5.15/hr equivalent). Higher reported tip totals mean a larger credit. Provide an estimate to calculate potential credit value.',
        type: 'currency',
        required: false,
      },
      {
        id: 'tip-wage-deduction',
        question: 'Do you understand that you must reduce the wage deduction by the amount of the §45B credit?',
        helpText: 'The wages corresponding to the FICA credit cannot also be deducted as a business expense. The credit reduces your deductible wages by the credit amount — but the credit (dollar-for-dollar tax reduction) is always worth more than the deduction.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'tip-form-8846',
        question: 'Have you previously claimed the FICA tip credit using Form 8846?',
        helpText: 'If you have not been claiming this credit, you may be able to amend prior returns (within 3-year statute of limitations) to claim missed credits.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'tip-state-credit',
        question: 'Does your state offer a complementary state FICA tip credit?',
        helpText: 'Some states mirror the federal §45B credit. Check with your CPA for state-level tip credits in your jurisdiction.',
        type: 'yes_no',
        required: false,
      },
    ],
    implementationTime: '1-2 weeks (gather payroll data and file Form 8846)',
    thirdPartyNeeded: false,
    thirdPartyDetails: 'CPA or payroll specialist to calculate and file Form 8846',
    isRetroactive: true,
    deadline: 'Claimed on annual business income tax return. Retroactive claims via amended return within 3-year statute.',
    riskLevel: 'low',
    typicalSavingsRange: { min: 2000, max: 30000 },
    savingsFormula: 'Total excess tips (above $5.15/hr equivalent) × 7.65% employer FICA rate = dollar-for-dollar income tax credit',
    implementationSteps: [
      'Gather annual payroll records showing total reported tip income per employee',
      'Calculate hours worked per employee and $5.15/hr floor',
      'Calculate excess tips (total tips − $5.15 × hours worked)',
      'Multiply excess tips by 7.65% to determine credit amount',
      'Complete Form 8846 (Credit for Employer Social Security and Medicare Taxes Paid on Certain Employee Tips)',
      'Include credit on Form 3800 (General Business Credit)',
      'Reduce wage deduction by credit amount on business return',
    ],
    taxFiling: 'Form 8846 calculates credit. Flows to Form 3800 (General Business Credit). Credit on business return (1120, 1120S, 1065, or Schedule C).',
  },
  {
    id: 'rd-credit-federal',
    title: 'R&D Tax Credit — Federal',
    tier: 'business',
    category: 'Niche Credits',
    description: 'Claim the federal Research and Development tax credit for qualified research expenses including wages, supplies, and contract research. The regular credit rate is 20% of QREs above a base amount. The alternative simplified credit (ASC) is 14% of QREs above 50% of the 3-year average QREs. Startup companies can use up to $500,000/year of R&D credit to offset payroll taxes.',
    ircReference: 'IRC §41',
    applicableTo: ['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership'],
    qualificationQuestions: [
      {
        id: 'rd-developing-new-products',
        question: 'Are you developing new or improved products, processes, software, or formulas?',
        helpText: 'The §41 credit requires activities that attempt to discover information that is technological in nature. This includes developing new software, engineering new manufacturing processes, creating new products, or improving existing products. Administrative, social science, and arts activities do not qualify.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'rd-four-part-test',
        question: 'Does your research meet all four parts of the §41 test: (1) technological in nature, (2) permitted purpose, (3) elimination of uncertainty, and (4) process of experimentation?',
        helpText: 'The four-part test: (1) relies on hard sciences, (2) develops a new/improved business component, (3) eliminates uncertainty about capability/methodology/design, and (4) involves experimentation through simulation, modeling, or trial-and-error. ALL four parts must be met.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'rd-qualified-expenses',
        question: 'Do you have identifiable qualified research expenses (QREs) — employee wages for research, supply costs, or contract research payments?',
        helpText: 'QREs include: (1) W-2 wages for employees engaged in qualified research, (2) supplies consumed in research, and (3) 65% of payments to non-employee contractors for qualified research. Document the time employees spend on qualifying research activities.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'rd-startup-payroll-offset',
        question: 'Is your business a startup (5 years or fewer of gross receipts) with no income tax liability?',
        helpText: 'Startups with ≤$5M gross receipts and ≤5 years of gross receipts can elect to apply up to $500,000/year of R&D credit against payroll taxes instead of income taxes. This makes the credit immediately valuable even with no income tax liability.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'rd-documentation',
        question: 'Do you have (or can you create) documentation supporting the research activities and expense allocation?',
        helpText: 'The IRS requires contemporaneous documentation: project descriptions, business objectives, technical uncertainty, experimentation logs, and time allocation records. Without documentation, claims are highly vulnerable on audit.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'rd-industry',
        question: 'What industry is your business in?',
        helpText: 'R&D credits are available across many industries: software, engineering, manufacturing, life sciences, food/beverage, architecture, agriculture, and more. The four-part test determines eligibility, not the industry label.',
        type: 'text',
        required: false,
      },
      {
        id: 'rd-annual-qre',
        question: 'What is your estimate of annual qualified research expenses (wages + supplies + 65% of contract research)?',
        helpText: 'A rough estimate allows calculation of the potential credit. The ASC credit is 14% of QREs above 50% of the 3-year average. If no prior QREs, 6% of current-year QREs (for the first 3 years under ASC).',
        type: 'currency',
        required: false,
      },
      {
        id: 'rd-amc-reduction',
        question: 'Is your business a C-Corporation?',
        helpText: 'C-Corporations must reduce their §174 research deduction by the R&D credit amount (unless they elect to reduce the credit by 35%). Pass-through entities generally do not face this issue.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'rd-state-credit-also',
        question: 'Are you also interested in pursuing state R&D tax credits?',
        helpText: 'Most states with income taxes offer their own R&D credits that stack on top of the federal credit, often at 10-35% of QREs. State credits can significantly enhance the total benefit.',
        type: 'yes_no',
        required: false,
      },
    ],
    implementationTime: '4-8 weeks for credit study and documentation',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'R&D tax credit specialist or CPA with R&D expertise for qualified research expense analysis and documentation',
    isRetroactive: true,
    deadline: 'Claimed on annual return. Can be claimed retroactively via amended return within 3-year statute of limitations.',
    riskLevel: 'medium',
    typicalSavingsRange: { min: 10000, max: 200000 },
    savingsFormula: 'ASC method: 14% × (current QREs − 50% of 3-year average QREs). Regular method: 20% × (QREs − base amount). Dollar-for-dollar income tax reduction.',
    implementationSteps: [
      'Conduct R&D activity identification across all business operations',
      'Apply four-part test to each activity to determine qualification',
      'Allocate employee time to qualified research activities using contemporaneous or reconstructed records',
      'Calculate QREs (wages × time allocation + supplies + 65% contract research)',
      'Determine credit using Alternative Simplified Credit (ASC) or regular method',
      'Complete Form 6765 (Credit for Increasing Research Activities)',
      'Include credit on Form 3800 (General Business Credit)',
      'Retain project documentation for potential audit',
    ],
    taxFiling: 'Form 6765 calculates R&D credit. Flows to Form 3800. Startups use Form 8974 to apply R&D credit against payroll tax. Income tax credit on business return.',
  },
  {
    id: 'rd-credit-state',
    title: 'R&D Tax Credit — State',
    tier: 'business',
    category: 'Niche Credits',
    description: 'Claim state-level research and development tax credits that stack on top of the federal §41 credit. Most states with income taxes offer R&D credits ranging from 5% to 35% of qualified research expenses, often with carryforward provisions and refundability options. State credits can sometimes be sold or transferred.',
    ircReference: 'Varies by state; generally mirrors IRC §41 framework',
    applicableTo: ['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership'],
    qualificationQuestions: [
      {
        id: 'rd-state-federal-qualified',
        question: 'Have you already determined that your business qualifies for the federal §41 R&D tax credit?',
        helpText: 'Most state R&D credits use the same four-part test as the federal credit. If you qualify federally, you likely qualify for state credits in the states where research is performed. Federal qualification is the best starting point.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no',
      },
      {
        id: 'rd-state-research-location',
        question: 'Is your qualified research performed in a state that offers an R&D tax credit?',
        helpText: 'R&D must be performed in-state to qualify for state credits. Major states offering R&D credits include California, New York, Texas, Massachusetts, Illinois, Georgia, Arizona, and 35+ others. Credit rates and carryforward rules vary significantly.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'rd-state-which-state',
        question: 'In which state(s) does your qualified research activity primarily occur?',
        helpText: 'State credit rates vary considerably: California offers 15% (24% over base), New York offers 9%, Massachusetts offers 10%, Texas offers 5%, Georgia offers 10%. Multistate R&D may generate multiple state credits.',
        type: 'text',
        required: true,
      },
      {
        id: 'rd-state-documentation',
        question: 'Do you have state-specific documentation of research expenses incurred within the state?',
        helpText: 'States require that qualifying expenses be incurred in-state. If you have employees in multiple states, you must allocate research wages to the appropriate states.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'rd-state-refundable',
        question: 'Is the state R&D credit refundable or can it be carried forward?',
        helpText: 'Some states make R&D credits refundable for small businesses or allow unused credits to be carried forward 5-20 years. Others allow sale or transfer of credits. Check state-specific rules with your CPA.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'rd-state-annual-qre-state',
        question: 'What is your estimate of annual qualified research expenses incurred in-state?',
        helpText: 'State credits apply to in-state QREs only. Provide an estimate of wages, supplies, and contract research expenses incurred within the qualifying state(s) to estimate the state credit amount.',
        type: 'currency',
        required: false,
      },
      {
        id: 'rd-state-payroll-tax-offset',
        question: 'Does your state allow the R&D credit to offset payroll taxes for startups?',
        helpText: 'A few states (e.g., Massachusetts, California) mirror the federal startup payroll tax offset, allowing the state R&D credit to be applied against state employment taxes. Check with your CPA for availability in your state.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'rd-state-prior-years',
        question: 'Have you claimed state R&D credits in prior years?',
        helpText: 'If not, retroactive state R&D claims may be available through amended state returns, subject to state statute of limitations (typically 3-4 years). Prior-year credits are worth pursuing.',
        type: 'yes_no',
        required: false,
      },
    ],
    implementationTime: '4-8 weeks (coordinate with federal R&D study)',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'CPA or R&D credit specialist with multi-state experience; state-specific forms and schedules required',
    isRetroactive: true,
    deadline: 'Claimed on annual state income tax return. Retroactive via amended state returns within state statute (typically 3-4 years).',
    riskLevel: 'low',
    typicalSavingsRange: { min: 5000, max: 75000 },
    savingsFormula: 'In-state QREs × state credit rate (5%-35% depending on state)',
    implementationSteps: [
      'Confirm federal R&D credit qualification first (same activities apply)',
      'Identify all states where qualified research is performed',
      'Research applicable state R&D credit programs and rates',
      'Allocate in-state QREs by state using payroll and expense records',
      'Complete state-specific R&D credit forms (vary by state)',
      'Apply credits on state income tax return or file amended state returns for prior years',
      'Maintain separate documentation of in-state research activities and expenses',
    ],
    taxFiling: 'State-specific R&D credit forms filed with state income tax return. Each state has different forms, base amount calculations, and carryforward rules.',
  },
  {
    id: 'wotc',
    title: 'Work Opportunity Tax Credit (WOTC)',
    tier: 'business',
    category: 'Tax Credits',
    description: 'Claim a federal income tax credit for hiring employees from targeted groups who face barriers to employment. Credit amounts range from $1,200 to $9,600 per qualifying new hire depending on the target group and hours worked. Common qualifying groups include veterans, ex-felons, long-term unemployment recipients, and recipients of various public assistance programs.',
    ircReference: 'IRC §51',
    applicableTo: ['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership'],
    qualificationQuestions: [
      {
        id: 'wotc-hiring',
        question: 'Are you actively hiring new employees?',
        helpText: 'WOTC applies only to new hires — you cannot claim the credit for existing employees or rehires (with limited exceptions for individuals who previously worked for a different employer). The best time to screen for WOTC eligibility is during the hiring process.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'wotc-targeted-groups',
        question: 'Are any of your new hires from WOTC targeted groups?',
        helpText: 'Targeted groups include: (1) qualified veterans, (2) long-term family assistance recipients, (3) designated community residents, (4) ex-felons, (5) vocational rehabilitation referrals, (6) SNAP recipients, (7) SSI recipients, (8) long-term unemployed (27+ weeks), and (9) summer youth employees.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'wotc-form-8850',
        question: 'Are you willing to submit Form 8850 (WOTC prescreening notice) to your state workforce agency within 28 days of the employee\'s start date?',
        helpText: 'The 28-day filing deadline for Form 8850 is strict. Missing it disqualifies the credit for that employee. Implement a WOTC screening process for all new hires at the offer stage to identify candidates and file timely.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'wotc-minimum-hours',
        question: 'Do your new employees typically work at least 120 hours in their first year?',
        helpText: 'Employees must work at least 120 hours (25% credit rate) or 400 hours (40% credit rate) in the first year of employment. Part-time employees generating fewer than 120 hours generate no credit.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'wotc-not-related',
        question: 'Are the new hires unrelated to you (not a family member, spouse, or dependent)?',
        helpText: 'The WOTC credit is not available for wages paid to relatives of the employer (including spouse, children, siblings, parents, etc.) or to majority owners/shareholders.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'wotc-annual-hires',
        question: 'How many new employees do you typically hire per year?',
        helpText: 'Higher hiring volume increases the potential credit. Even if only 20-30% of new hires qualify, the cumulative credit can be substantial. Estimate annual hires to project potential credit value.',
        type: 'number',
        required: false,
      },
      {
        id: 'wotc-third-party-screener',
        question: 'Are you using a third-party WOTC screening service?',
        helpText: 'Many employers use automated WOTC screening platforms that integrate with hiring workflows to screen applicants, complete Form 8850, and file with state agencies. These services are typically cost-effective at 20+ hires per year.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'wotc-veterans',
        question: 'Do you hire veterans? Veterans can qualify for credits up to $9,600.',
        helpText: 'Qualified veterans provide the highest WOTC credit — up to $9,600 for veterans with service-connected disabilities who are long-term unemployed. Different veteran categories have different credit amounts. Veteran hiring is the most common high-value WOTC category.',
        type: 'yes_no',
        required: false,
      },
    ],
    implementationTime: '1-2 weeks to implement screening process; IRS certification takes 60-90 days',
    thirdPartyNeeded: false,
    thirdPartyDetails: 'WOTC screening service or HR consultant to implement Form 8850 process; state workforce agency for certification',
    isRetroactive: false,
    deadline: 'Form 8850 must be filed with state workforce agency within 28 days of employee start date — no exceptions',
    riskLevel: 'low',
    typicalSavingsRange: { min: 2400, max: 50000 },
    savingsFormula: 'Number of qualifying hires × applicable credit rate (25%-40%) × qualifying first-year wages (up to $6,000-$24,000 depending on category)',
    implementationSteps: [
      'Implement WOTC prescreening for all new job applicants (Form 8850 Part 1 at offer)',
      'Complete Form 8850 (Pre-Screening Notice and Certification Request) for each potentially qualifying hire',
      'Submit Form 8850 to state workforce agency within 28 days of employee start date',
      'Submit Form 9061 or 9062 (Individual Characteristics Form) with Form 8850',
      'Receive certification from state workforce agency',
      'Track qualified wages and hours for certified employees',
      'Calculate credit on Form 5884 (Work Opportunity Credit)',
      'Include on Form 3800 (General Business Credit)',
    ],
    taxFiling: 'Form 5884 calculates WOTC credit. Flows to Form 3800 (General Business Credit). Credit on business return. Dollar-for-dollar income tax reduction.',
  },
  {
    id: 'ic-disc',
    title: 'IC-DISC (Interest Charge Domestic International Sales Corporation)',
    tier: 'business',
    category: 'International',
    description: 'Create a related-party IC-DISC entity to convert ordinary export income into qualified dividend income taxed at preferential long-term capital gains rates (0-20%). The operating company pays commissions to the IC-DISC (deductible at ordinary rates), and the IC-DISC pays dividends to shareholders at lower qualified dividend rates, generating permanent tax savings on export income.',
    ircReference: 'IRC §§991-997',
    applicableTo: ['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership'],
    qualificationQuestions: [
      {
        id: 'ic-disc-export-revenue',
        question: 'Does your business have annual export revenue of at least $1,000,000?',
        helpText: 'IC-DISC is most cost-effective at $1M+ in annual export revenue. Below this threshold, the setup and compliance costs ($5,000-$15,000/year) typically outweigh the tax benefit.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'ic-disc-us-goods',
        question: 'Does your business export US-manufactured goods, software, or engineering services?',
        helpText: 'IC-DISC works for exported goods with US content of at least 50%, architectural/engineering services for construction projects outside the US, and certain other qualifying exports. Services performed in the US do not qualify for IC-DISC unless they support export of goods.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'ic-disc-qualified-export-receipts',
        question: 'Are your exports "qualified export receipts" (sales/leases of qualifying export property, or export services)?',
        helpText: 'Qualified export receipts include: (1) sales/leases of qualified export property (US-made goods exported or for use outside US), (2) services related to export property, (3) engineering/architectural services for foreign projects.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'ic-disc-marginal-rate',
        question: 'Are you or your business partners subject to ordinary income tax rates above the qualified dividend rate?',
        helpText: 'IC-DISC generates permanent savings only when the marginal ordinary income rate exceeds the qualified dividend rate. For taxpayers in the 37% bracket, the spread is 37% − 20% = 17% on converted income.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'ic-disc-separate-entity',
        question: 'Are you willing to form and maintain a separate IC-DISC corporation with its own bank account, records, and tax return?',
        helpText: 'The IC-DISC must be a standalone corporation meeting specific requirements: all outstanding stock qualifies as IC-DISC stock, no more than $10M of assets if electing small DISC, and annual IC-DISC election. A bank account with $2,500 minimum capital is required.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'ic-disc-commission-method',
        question: 'Do you want to use the commission method (operating company pays deductible commission to IC-DISC) rather than the buy-sell method?',
        helpText: 'The commission method is simpler and most commonly used. The operating company pays a commission to the IC-DISC (deductible). IC-DISC uses either the 4% gross receipts method or the 50% combined taxable income method — whichever is larger.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'ic-disc-family-members',
        question: 'Do you have family members as shareholders of the IC-DISC who are in lower tax brackets?',
        helpText: 'Gifting IC-DISC shares to family members in lower brackets (e.g., children) is a powerful income-shifting strategy. Dividends paid to children in the 0% or 15% qualified dividend bracket generate additional savings beyond the rate arbitrage.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'ic-disc-annual-export',
        question: 'What is your approximate annual qualified export revenue?',
        helpText: 'Provide an estimate to calculate the maximum IC-DISC commission. Under the 4% gross receipts method, the maximum commission is approximately 4% of qualified export receipts.',
        type: 'currency',
        required: false,
      },
    ],
    implementationTime: '30-60 days',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'Attorney for IC-DISC incorporation and election; CPA for commission calculation (Form 1120-IC-DISC) and coordination with operating company returns',
    isRetroactive: false,
    deadline: 'IC-DISC election must be made within 90 days of the beginning of the tax year (or within 90 days of formation for new corporations)',
    riskLevel: 'low',
    typicalSavingsRange: { min: 10000, max: 100000 },
    savingsFormula: 'IC-DISC commission (4% of export revenue or 50% of combined taxable income) × (ordinary rate − qualified dividend rate)',
    implementationSteps: [
      'Form IC-DISC corporation in any US state',
      'Obtain EIN and open dedicated bank account with $2,500 minimum capital',
      'File IC-DISC election (Form 4876-A) within 90 days of tax year start',
      'Execute commission agreement between operating company and IC-DISC',
      'Calculate commission using 4% gross receipts or 50% CTI method (larger of the two)',
      'Operating company pays commission to IC-DISC (deductible)',
      'IC-DISC accumulates commission income',
      'IC-DISC pays dividends to shareholders (qualified dividends at 0-20%)',
      'File Form 1120-IC-DISC annually',
    ],
    taxFiling: 'IC-DISC files Form 1120-IC-DISC (information return — no corporate tax). Operating company deducts commissions. Shareholders report qualified dividends on Schedule B.',
  },
  {
    id: 'conservation-easement-biz',
    title: 'Conservation Easements — Business',
    tier: 'business',
    category: 'Charitable & Estate',
    description: 'Donate a permanent restriction on the development of business-owned land to a qualified conservation organization, and claim a charitable deduction for the fair market value of the donated easement. The deduction is limited to 50% of AGI (100% for qualified farmers and ranchers) with a 15-year carryforward.',
    ircReference: 'IRC §170(h)',
    applicableTo: ['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership'],
    qualificationQuestions: [
      {
        id: 'easement-owns-land',
        question: 'Does your business own land with genuine conservation value (scenic, natural habitat, historic, farmland, open space)?',
        helpText: 'The conservation purpose must be genuine and independently significant. Qualifying conservation purposes include: preservation of open space, protection of natural habitat, preservation of historic land areas. Land must have real conservation value to a qualified organization.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'easement-not-syndicated',
        question: 'Is this a direct business land holding — NOT a syndicated conservation easement transaction?',
        helpText: 'Syndicated conservation easements (where promoters contribute land to a partnership, other investors buy in, and all claim disproportionate deductions) are IRS Listed Transactions. Participation subjects taxpayers to automatic penalties and potential criminal liability. Only direct, arm\'s-length easements are appropriate.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'easement-qualified-appraisal',
        question: 'Are you willing to obtain a qualified appraisal from a certified appraiser to establish the fair market value of the easement?',
        helpText: 'A qualified appraisal by a qualified appraiser (as defined in §170(f)(11)) is required for all conservation easement deductions. The appraisal must be obtained no earlier than 60 days before the donation and no later than the tax return due date.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'easement-permanent-restriction',
        question: 'Are you willing to grant a permanent restriction on the land — meaning it cannot be developed in the future?',
        helpText: 'Conservation easements must be permanent. You retain ownership of the land and can continue current uses, but you permanently give up development rights. Consider the long-term impact on land value and estate planning.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'easement-qualified-organization',
        question: 'Have you identified a qualified conservation organization (land trust or government entity) willing to accept the easement?',
        helpText: 'The easement must be donated to a qualified organization (§501(c)(3) or government entity) that has the resources and commitment to monitor and enforce the easement in perpetuity. Most credible land trusts conduct due diligence before accepting easements.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'easement-land-value',
        question: 'What is the approximate value of the land and the estimated development rights being surrendered?',
        helpText: 'The deduction is the difference between the land\'s before-easement and after-easement fair market value (the "diminution in value" approach). Higher development potential = larger potential deduction. Provide an estimate for analysis.',
        type: 'currency',
        required: false,
      },
      {
        id: 'easement-farmer-rancher',
        question: 'Is your primary business farming or ranching?',
        helpText: 'Qualified farmers and ranchers can deduct conservation easements up to 100% of contribution base (vs. 50% for others) with a 15-year carryforward. The land must remain available for agriculture after the easement.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'easement-legal-review',
        question: 'Are you working with a tax attorney and land trust professional who can ensure the easement meets all §170(h) requirements?',
        helpText: 'Conservation easements face high IRS scrutiny. Technical requirements include: the deed must meet specific language requirements, a baseline documentation report is required, and the conservation organization must monitor the easement. Independent legal review is essential.',
        type: 'yes_no',
        required: false,
      },
    ],
    implementationTime: '90-180 days',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'Qualified appraiser, land trust or conservation organization, tax attorney, CPA for Form 8283 and deduction limits',
    isRetroactive: false,
    deadline: 'Easement deed must be executed and delivered before December 31 of the tax year. Appraisal must be obtained before return due date.',
    riskLevel: 'high',
    typicalSavingsRange: { min: 20000, max: 500000 },
    savingsFormula: 'Easement value (before-after appraisal difference) × marginal tax rate, limited to 50% of AGI per year with 15-year carryforward',
    implementationSteps: [
      'Engage qualified appraiser to determine before-and-after fair market value',
      'Identify qualified conservation organization to receive easement',
      'Engage land trust to conduct baseline documentation and due diligence',
      'Have tax attorney draft the conservation easement deed meeting §170(h) requirements',
      'Execute and record easement deed before December 31',
      'Obtain qualified appraisal by tax return due date',
      'Complete Form 8283 (Noncash Charitable Contributions) with appraisal summary',
      'Claim deduction limited to 50% of AGI (100% for farmers/ranchers) with 15-year carryforward',
    ],
    taxFiling: 'Form 8283 (Noncash Charitable Contributions) required for deductions over $500. Qualified appraisal summary attached. Deduction limited to 50% of AGI (100% for qualified farmers/ranchers) with 15-year carryforward.',
  },
  {
    id: '401k-employer',
    title: '401(k) Plan with Employer Match',
    tier: 'business',
    category: 'Retirement Planning',
    description: 'Establish a traditional or safe harbor 401(k) plan allowing employees and owner-employees to defer up to $23,500 (2025, $31,000 for age 50+) in pre-tax or Roth contributions. The employer match (typically 3-6% of salary) is fully deductible. Safe harbor 401(k) plans automatically pass non-discrimination testing.',
    ircReference: 'IRC §401(k)',
    applicableTo: ['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership'],
    qualificationQuestions: [
      {
        id: '401k-has-employees',
        question: 'Do you have W-2 employees whom you want to help with retirement savings?',
        helpText: 'A traditional 401(k) with employer match is most beneficial when you have employees and want to attract/retain talent. If you have no employees (other than yourself and spouse), a Solo 401(k) may be simpler and equally effective.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no',
      },
      {
        id: '401k-match-commitment',
        question: 'Can you commit to an employer match or safe harbor contribution (typically 3-4% of employee compensation)?',
        helpText: 'Safe harbor 401(k)s (3% non-elective or 4% match) automatically pass ADP/ACP non-discrimination testing. Traditional 401(k)s may fail testing, limiting owner contributions. The safe harbor contribution is deductible.',
        type: 'yes_no',
        required: true,
      },
      {
        id: '401k-profit-sharing',
        question: 'Do you want to add a profit sharing component to the 401(k)?',
        helpText: 'Combining 401(k) deferrals with a profit sharing contribution can allow owner-employees to contribute up to $70,000 (2025) in total. The profit sharing component is discretionary — you can contribute 0-25% of compensation.',
        type: 'yes_no',
        required: false,
      },
      {
        id: '401k-roth',
        question: 'Do you want to offer Roth 401(k) as an option for employees?',
        helpText: 'Roth 401(k) allows after-tax contributions that grow tax-free. Many plans now offer both traditional (pre-tax) and Roth 401(k) options. Roth contributions don\'t reduce current taxable income but provide tax-free retirement withdrawals.',
        type: 'yes_no',
        required: false,
      },
      {
        id: '401k-auto-enrollment',
        question: 'Are you interested in auto-enrollment to increase employee participation and qualify for SECURE 2.0 tax credits?',
        helpText: 'SECURE 2.0 (2022) provides a $500/year tax credit for new plans that include automatic enrollment. Auto-enrollment increases participation rates and can help pass non-discrimination testing.',
        type: 'yes_no',
        required: false,
      },
      {
        id: '401k-startup-credit',
        question: 'Is this a new 401(k) plan (first time establishing a qualified plan for this business)?',
        helpText: 'New plans may qualify for the SECURE 2.0 startup plan tax credit: up to $5,000/year for 3 years to offset plan setup and administrative costs, plus $500/year for auto-enrollment. For small businesses under 50 employees, this can cover most or all plan costs.',
        type: 'yes_no',
        required: false,
      },
      {
        id: '401k-annual-compensation',
        question: 'What is your annual W-2 compensation from the business?',
        helpText: '401(k) deferral limits are based on compensation. You can defer 100% of compensation up to $23,500 (2025) or $31,000 with catch-up. Profit sharing is limited to 25% of W-2 wages. Provide compensation for contribution calculations.',
        type: 'currency',
        required: false,
      },
      {
        id: '401k-existing-plan',
        question: 'Do you currently have a retirement plan (SEP-IRA, SIMPLE, pension)?',
        helpText: 'You can transition from a SEP-IRA or SIMPLE to a 401(k), but timing rules apply (SIMPLE must be terminated with 60-day notice before year-end). Avoid exceeding combined plan contribution limits if maintaining multiple plans.',
        type: 'yes_no',
        required: false,
      },
    ],
    implementationTime: '3-6 weeks',
    thirdPartyNeeded: true,
    thirdPartyDetails: 'TPA or bundled 401(k) provider (Fidelity, Vanguard, Human Interest, etc.); CPA for deduction calculations',
    isRetroactive: false,
    deadline: 'Plan must be established by December 31 for current-year deferrals. Safe harbor match must be adopted with 30-day notice before plan year (or by October 1 for new safe harbor plans).',
    riskLevel: 'low',
    typicalSavingsRange: { min: 8000, max: 35000 },
    savingsFormula: '(Employee deferral + employer match + profit sharing) × combined marginal tax rate',
    implementationSteps: [
      'Choose plan type: traditional 401(k), safe harbor 401(k), or Roth 401(k)',
      'Select provider (bundled platform or TPA with separate investment accounts)',
      'Adopt plan document and safe harbor notice by required deadlines',
      'Enroll employees and begin payroll deductions',
      'Make employer match or safe harbor contributions',
      'Conduct annual non-discrimination testing (or rely on safe harbor exemption)',
      'File Form 5500 annually (if plan assets exceed $250K or more than 100 participants)',
      'Claim deductions on business return',
    ],
    taxFiling: 'Employee deferrals excluded from W-2 Box 1 wages. Employer contributions deducted on business return. Form 5500 filed annually for plan. SECURE 2.0 startup credit on Form 8881.',
  },
  {
    id: 'solo-401k-biz',
    title: 'Solo 401(k) for Business',
    tier: 'business',
    category: 'Retirement Planning',
    description: 'Establish a Solo 401(k) (also called Individual 401(k) or One-Participant Plan) for a business with no full-time employees other than the owner and spouse. Allows both employee deferral ($23,500 in 2025, $31,000 age 50+) AND employer profit sharing (up to 25% of compensation), for a combined maximum of $70,000 ($77,500 age 50+).',
    ircReference: 'IRC §401(k); IRC §401(a)',
    applicableTo: ['sole_prop', 'llc'],
    qualificationQuestions: [
      {
        id: 'solo-401k-no-employees',
        question: 'Does your business have zero full-time employees (other than yourself and your spouse)?',
        helpText: 'Solo 401(k) plans are only available to businesses with no full-time employees other than the owner and spouse. If you have even one non-owner employee who works 1,000+ hours per year, you cannot use a Solo 401(k) and must offer a plan covering all eligible employees.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'solo-401k-self-employment-income',
        question: 'Do you have self-employment income or W-2 wages from the business?',
        helpText: 'Contributions must be funded from earned income. Sole proprietors use net self-employment income. Single-member LLCs use Schedule C income. W-2 compensation from an LLC taxed as S-Corp is also eligible.',
        type: 'yes_no',
        required: true,
        disqualifyOn: 'no',
      },
      {
        id: 'solo-401k-vs-sep',
        question: 'Are you currently using a SEP-IRA and want to maximize contributions above the SEP-IRA limit?',
        helpText: 'SEP-IRA allows up to 25% of compensation (max $70,000). Solo 401(k) allows the same employer contribution PLUS an employee deferral. For incomes below $140,000, a Solo 401(k) allows meaningfully higher total contributions than a SEP-IRA.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'solo-401k-roth',
        question: 'Do you want a Roth Solo 401(k) option for after-tax, tax-free growth?',
        helpText: 'Many Solo 401(k) providers offer Roth deferral options. Unlike Roth IRA (which has income limits), Roth Solo 401(k) has no income limits. The employer profit sharing portion remains pre-tax even in a Roth Solo 401(k).',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'solo-401k-loan',
        question: 'Do you want the ability to take a 401(k) loan from your plan assets?',
        helpText: 'Solo 401(k) plans can be designed to allow loans up to $50,000 or 50% of vested account balance. This provides access to capital in emergencies. SEP-IRAs and SIMPLE IRAs do not allow loans.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'solo-401k-annual-income',
        question: 'What is your estimated net self-employment income or W-2 compensation this year?',
        helpText: 'Contribution calculation: employee deferral up to $23,500, PLUS employer contribution up to 20% of net SE income (sole prop) or 25% of W-2 wages (S-Corp), combined maximum $70,000 (2025). Provide income for calculation.',
        type: 'currency',
        required: true,
      },
      {
        id: 'solo-401k-spouse',
        question: 'Does your spouse also work in the business?',
        helpText: 'If your spouse works in the business, they can also participate in the Solo 401(k), potentially doubling the household contribution limit. Each spouse can contribute up to the individual limits.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'solo-401k-establish-deadline',
        question: 'Are you establishing this plan before December 31 of the current tax year?',
        helpText: 'For 2025 and later years, SECURE 2.0 allows Solo 401(k) plans to be established as late as the tax return due date (including extensions) for the purpose of employee deferrals. However, it is still best practice to establish before December 31.',
        type: 'yes_no',
        required: true,
      },
    ],
    implementationTime: '1-2 weeks',
    thirdPartyNeeded: false,
    thirdPartyDetails: 'Financial institution or brokerage for plan documents and investment account (Fidelity, Vanguard, Schwab offer free Solo 401(k) plans)',
    isRetroactive: false,
    deadline: 'Plan established by December 31 (or tax return due date per SECURE 2.0 for deferrals). Contributions can be made up to tax return due date including extensions.',
    riskLevel: 'low',
    typicalSavingsRange: { min: 8000, max: 30000 },
    savingsFormula: '(Employee deferral + employer profit sharing) × marginal tax rate',
    implementationSteps: [
      'Confirm zero non-owner full-time employees',
      'Choose Solo 401(k) provider (Fidelity, Vanguard, Schwab, or self-directed custodian)',
      'Complete plan adoption agreement and investment account application',
      'Establish plan by December 31 (employee deferral deadline)',
      'Calculate employee deferral and employer profit sharing amounts',
      'Make contributions by tax return due date (including extensions)',
      'File Form 5500-EZ if plan assets exceed $250,000',
      'Deduct contributions on Schedule C or business return',
    ],
    taxFiling: 'Employee deferrals and employer contributions deducted on Schedule C (sole prop) or corporate return. Form 5500-EZ required annually if plan assets exceed $250,000.',
  },
  {
    id: 'simple-plan-biz',
    title: 'SIMPLE 401(k)/IRA for Small Business',
    tier: 'business',
    category: 'Retirement Planning',
    description: 'Establish a SIMPLE IRA or SIMPLE 401(k) plan for businesses with 100 or fewer employees. Employees can defer up to $16,500 (2025, $20,000 age 50+) in pre-tax contributions. Employers must make either a 2% non-elective contribution or 3% matching contribution for all eligible employees. Lower administrative burden than traditional 401(k).',
    ircReference: 'IRC §408(p); IRC §401(k)(11)',
    applicableTo: ['sole_prop', 'llc', 's_corp', 'c_corp', 'partnership'],
    qualificationQuestions: [
      {
        id: 'simple-100-employees',
        question: 'Does your business have 100 or fewer employees who earned at least $5,000 in the prior year?',
        helpText: 'SIMPLE plans are available only to employers with 100 or fewer employees. Once the employer exceeds 100 employees, a 2-year grace period applies before the plan must be terminated.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'simple-no-other-plan',
        question: 'Does your business NOT currently maintain another qualified retirement plan (401(k), SEP, pension)?',
        helpText: 'SIMPLE plans cannot be maintained alongside another qualified plan. If you currently have a SEP-IRA or 401(k), you must terminate it before establishing a SIMPLE plan (or vice versa). The prohibition is strict.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'simple-employer-contribution',
        question: 'Can you commit to making either a 3% matching contribution or 2% non-elective contribution for all eligible employees?',
        helpText: 'SIMPLE plans require mandatory employer contributions. Option 1: Match up to 3% of employee compensation (can be reduced to 1% for 2 of every 5 years). Option 2: Non-elective 2% of compensation for ALL eligible employees (regardless of deferral). Both are fully deductible.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'simple-october-deadline',
        question: 'Are you establishing this plan before October 1 of the current year (new plans)?',
        helpText: 'New SIMPLE IRA plans must be established by October 1 of the tax year for which contributions are to be made. Exception: newly established businesses can set up a SIMPLE IRA at any time after establishment. SIMPLE 401(k) plans must be established by December 31.',
        type: 'yes_no',
        required: true,
      },
      {
        id: 'simple-vs-401k',
        question: 'Have you compared SIMPLE to a safe harbor 401(k) with profit sharing?',
        helpText: 'For businesses where the owner wants maximum contributions, a safe harbor 401(k) with profit sharing typically allows larger owner contributions ($70,000 vs. ~$20,000). SIMPLE plans are simpler to administer but have lower limits. Consider your goals before choosing.',
        type: 'yes_no',
        required: false,
      },
      {
        id: 'simple-eligible-employees',
        question: 'How many employees earned at least $5,000 from your business in the prior two years?',
        helpText: 'All employees who earned $5,000 or more in any two prior years and expect to earn $5,000 in the current year must be eligible to participate. Provide a count to estimate total employer contribution cost.',
        type: 'number',
        required: false,
      },
      {
        id: 'simple-plan-type',
        question: 'Do you prefer SIMPLE IRA (held in employee-owned IRAs) or SIMPLE 401(k) (employer-held trust)?',
        helpText: 'SIMPLE IRA: simpler administration, employee-owned accounts, no 5500 filing, no annual testing. SIMPLE 401(k): harder administration, employer trust, requires Form 5500, but automatically passes ADP/ACP testing. Most small businesses prefer SIMPLE IRA for simplicity.',
        type: 'choice',
        choices: ['SIMPLE IRA (simpler, no 5500)', 'SIMPLE 401(k) (more features)', 'Not sure yet'],
        required: false,
      },
      {
        id: 'simple-owner-compensation',
        question: 'What is your annual W-2 compensation from the business?',
        helpText: 'The owner can defer up to $16,500 ($20,000 if age 50+) in 2025. The employer match (3% of W-2 salary) is also deductible. Provide compensation for contribution limit calculations.',
        type: 'currency',
        required: false,
      },
    ],
    implementationTime: '2-4 weeks',
    thirdPartyNeeded: false,
    thirdPartyDetails: 'Financial institution for SIMPLE IRA accounts (IRS Model Form 5304-SIMPLE or 5305-SIMPLE); CPA for contribution calculations',
    isRetroactive: false,
    deadline: 'New SIMPLE IRA plans must be established by October 1. SIMPLE 401(k) by December 31. Contributions made by employer\'s tax return due date.',
    riskLevel: 'low',
    typicalSavingsRange: { min: 5000, max: 20000 },
    savingsFormula: '(Owner deferral + employer match/non-elective) × combined marginal tax rate',
    implementationSteps: [
      'Confirm ≤100 employees and no existing qualified plan',
      'Choose SIMPLE IRA or SIMPLE 401(k) structure',
      'For SIMPLE IRA: adopt IRS Model Form 5304-SIMPLE (employee choice of financial institution) or 5305-SIMPLE (designated institution)',
      'Establish plan by October 1 (SIMPLE IRA) or December 31 (SIMPLE 401(k))',
      'Notify eligible employees at least 60 days before the start of each year',
      'Open SIMPLE IRA accounts at chosen financial institution(s)',
      'Begin payroll deferrals and employer contributions',
      'Deduct employer contributions on business return (contributions due by tax return filing deadline)',
    ],
    taxFiling: 'Employee deferrals excluded from W-2 Box 1 wages. Employer contributions deducted on business return. SIMPLE IRA requires no Form 5500. SIMPLE 401(k) requires Form 5500 if assets exceed $250K.',
  }
];

export function getStrategiesByTier(tier: StrategyTier): StrategyQualification[] {
  return strategyDatabase.filter(s => s.tier === tier);
}

export function getStrategiesByCategory(category: string): StrategyQualification[] {
  return strategyDatabase.filter(s => s.category === category);
}

export function getStrategiesForEntity(entityType: EntityType): StrategyQualification[] {
  return strategyDatabase.filter(s => s.applicableTo.includes(entityType));
}

export function filterByQualification(
  strategies: StrategyQualification[],
  answers: Record<string, string | number | boolean>
): StrategyQualification[] {
  return strategies.filter(strategy => {
    return strategy.qualificationQuestions.every(q => {
      const answer = answers[q.id];
      if (!q.disqualifyOn) return true;
      
      const disqualifyValues = Array.isArray(q.disqualifyOn) 
        ? q.disqualifyOn 
        : [q.disqualifyOn];
      
      return !disqualifyValues.includes(String(answer));
    });
  });
}
