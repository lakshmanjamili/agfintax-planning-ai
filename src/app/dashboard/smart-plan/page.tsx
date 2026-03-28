"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Brain,
  Lock,
  Send,
  Mic,
  MicOff,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  Target,
  FileText,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ChatMessage {
  role: "bot" | "user";
  text: string;
  buttons?: string[];
  showSkip?: boolean;
}

interface Strategy {
  title: string;
  category: string;
  description: string;
  estimatedSavings: number;
  savingsMin: number;
  savingsMax: number;
  implementationSteps: string[];
}

interface PlanResult {
  strategies: Strategy[];
  totalEstimatedSavings: number;
  profile: {
    occupation: string;
    filingStatus: string;
    income: string;
    dependents: string;
    state: string;
  };
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const categoryColors: Record<string, { bg: string; text: string }> = {
  Deductions: { bg: "bg-blue-500/10", text: "text-blue-400" },
  Credits: { bg: "bg-green-500/10", text: "text-green-400" },
  Retirement: { bg: "bg-purple-500/10", text: "text-purple-400" },
  Medical: { bg: "bg-cyan-500/10", text: "text-cyan-400" },
  Assets: { bg: "bg-[#DC5700]/10", text: "text-[#FFB596]" },
  Charity: { bg: "bg-pink-500/10", text: "text-pink-400" },
  Business: { bg: "bg-amber-500/10", text: "text-amber-400" },
  Entity: { bg: "bg-indigo-500/10", text: "text-indigo-400" },
  International: { bg: "bg-teal-500/10", text: "text-teal-400" },
};

interface Question {
  key: string;
  text: string;
  buttons?: string[];
  showSkip?: boolean;
  freeText?: boolean;
}

const questions: Question[] = [
  {
    key: "occupation",
    text: "Welcome! I am here to help you find every tax-saving opportunity. Let\u2019s get started \u2014 what do you do for a living?",
    freeText: true,
  },
  {
    key: "filingStatus",
    text: "Great! What is your filing status?",
    buttons: [
      "Single",
      "Married Filing Jointly",
      "Married Filing Separately",
      "Head of Household",
    ],
  },
  {
    key: "income",
    text: "What is your approximate annual income?",
    buttons: [
      "Under $75K",
      "$75K-$150K",
      "$150K-$300K",
      "$300K-$500K",
      "$500K-$1M",
      "$1M+",
    ],
    freeText: true,
  },
  {
    key: "dependents",
    text: "How many dependents do you have?",
    buttons: ["0", "1", "2", "3", "4+"],
  },
  {
    key: "realEstate",
    text: "Do you own any real estate or rental properties?",
    buttons: ["Yes", "No"],
  },
  {
    key: "selfEmployment",
    text: "Do you have any business or self-employment income?",
    buttons: ["Yes", "No"],
  },
  {
    key: "mortgage",
    text: "Do you have a mortgage?",
    buttons: ["Yes", "No"],
  },
  {
    key: "state",
    text: "What state do you live in?",
    freeText: true,
  },
  {
    key: "additional",
    text: "Anything else I should know about your financial situation?",
    freeText: true,
    showSkip: true,
  },
];

/* ------------------------------------------------------------------ */
/*  Custom range slider CSS (injected once)                            */
/* ------------------------------------------------------------------ */

const sliderCSS = `
  input[type="range"].smart-plan-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: #35343A;
    outline: none;
    cursor: pointer;
  }
  input[type="range"].smart-plan-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #DC5700;
    border: 2px solid #FFB596;
    cursor: pointer;
    box-shadow: 0 0 8px rgba(220, 87, 0, 0.4);
    transition: box-shadow 0.2s;
  }
  input[type="range"].smart-plan-slider::-webkit-slider-thumb:hover {
    box-shadow: 0 0 14px rgba(220, 87, 0, 0.7);
  }
  input[type="range"].smart-plan-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #DC5700;
    border: 2px solid #FFB596;
    cursor: pointer;
    box-shadow: 0 0 8px rgba(220, 87, 0, 0.4);
  }
  input[type="range"].smart-plan-slider::-moz-range-track {
    height: 6px;
    border-radius: 3px;
    background: #35343A;
  }
  @keyframes pulse-recording {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  .recording-pulse {
    animation: pulse-recording 1s ease-in-out infinite;
  }
  @keyframes fade-in-up {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in-up {
    animation: fade-in-up 0.4s ease-out forwards;
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .shimmer-text {
    background: linear-gradient(90deg, #FFB596 0%, #4CD6FB 50%, #FFB596 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 3s linear infinite;
  }
`;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SmartPlanPage() {
  // Phase: "chat" | "loading" | "results"
  const [phase, setPhase] = useState<"chat" | "loading" | "results">("chat");

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Results state
  const [result, setResult] = useState<PlanResult | null>(null);
  const [sliderValues, setSliderValues] = useState<Record<number, number>>({});
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Seed first bot message
  useEffect(() => {
    if (messages.length === 0 && questions.length > 0) {
      const q = questions[0];
      setMessages([
        {
          role: "bot",
          text: q.text,
          buttons: q.buttons,
          showSkip: q.showSkip,
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, phase]);

  /* ---- answer handling ---- */

  const handleAnswer = useCallback(
    (answer: string) => {
      const q = questions[currentQ];
      const newAnswers = { ...answers, [q.key]: answer };
      setAnswers(newAnswers);

      // Add user message
      const updatedMessages: ChatMessage[] = [
        ...messages,
        { role: "user", text: answer },
      ];

      const nextQ = currentQ + 1;

      if (nextQ < questions.length) {
        const nq = questions[nextQ];
        updatedMessages.push({
          role: "bot",
          text: nq.text,
          buttons: nq.buttons,
          showSkip: nq.showSkip,
        });
        setMessages(updatedMessages);
        setCurrentQ(nextQ);
        setUserInput("");
        setTimeout(() => inputRef.current?.focus(), 100);
      } else {
        // All questions answered — analyze
        updatedMessages.push({
          role: "bot",
          text: "Analyzing your tax situation...",
        });
        setMessages(updatedMessages);
        setUserInput("");
        setPhase("loading");
        submitPlan(newAnswers);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentQ, answers, messages]
  );

  const handleSkip = useCallback(() => {
    handleAnswer("N/A");
  }, [handleAnswer]);

  const handleSend = useCallback(() => {
    const trimmed = userInput.trim();
    if (!trimmed) return;
    handleAnswer(trimmed);
  }, [userInput, handleAnswer]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ---- voice input ---- */

  const startVoiceInput = () => {
    if (
      !(
        "webkitSpeechRecognition" in window ||
        "SpeechRecognition" in window
      )
    ) {
      alert("Voice input is not supported in your browser");
      return;
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setUserInput(transcript);
      setIsRecording(false);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    setIsRecording(true);
  };

  /* ---- API call ---- */

  const submitPlan = async (profile: Record<string, string>) => {
    try {
      const res = await fetch("/api/smart-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error("API error");
      const data: PlanResult = await res.json();
      setResult(data);

      // Initialize slider values
      const sv: Record<number, number> = {};
      data.strategies.forEach((s, i) => {
        sv[i] = s.estimatedSavings;
      });
      setSliderValues(sv);
      setPhase("results");
    } catch {
      // Fallback demo data so the page is usable without the API
      const demo = generateDemoResult(profile);
      setResult(demo);
      const sv: Record<number, number> = {};
      demo.strategies.forEach((s, i) => {
        sv[i] = s.estimatedSavings;
      });
      setSliderValues(sv);
      setPhase("results");
    }
  };

  /* ---- demo fallback ---- */

  function generateDemoResult(profile: Record<string, string>): PlanResult {
    const strategies: Strategy[] = [
      {
        title: "Standard vs. Itemized Deduction Optimization",
        category: "Deductions",
        description:
          "Based on your profile, itemizing deductions could yield significantly more savings than the standard deduction. Key areas include mortgage interest, state and local taxes (SALT), and charitable contributions.",
        estimatedSavings: 4200,
        savingsMin: 2000,
        savingsMax: 8000,
        implementationSteps: [
          "Gather all receipts and records for deductible expenses",
          "Calculate total itemized deductions vs. standard deduction",
          "Consider bunching deductions into a single tax year for maximum benefit",
          "Track SALT deduction cap at $10,000",
        ],
      },
      {
        title: "Retirement Account Maximization",
        category: "Retirement",
        description:
          "Maximize contributions to tax-advantaged retirement accounts including 401(k), IRA, and potentially a backdoor Roth IRA to reduce taxable income.",
        estimatedSavings: 6500,
        savingsMin: 3000,
        savingsMax: 12000,
        implementationSteps: [
          "Max out 401(k) contributions ($23,500 for 2026)",
          "Contribute to Traditional or Roth IRA ($7,000 limit)",
          "Explore backdoor Roth IRA if income exceeds limits",
          "Consider catch-up contributions if age 50+",
        ],
      },
      {
        title: "Health Savings Account (HSA) Strategy",
        category: "Medical",
        description:
          "If enrolled in a high-deductible health plan, maximize HSA contributions for triple tax benefits: tax-deductible contributions, tax-free growth, and tax-free withdrawals for medical expenses.",
        estimatedSavings: 2800,
        savingsMin: 1000,
        savingsMax: 4500,
        implementationSteps: [
          "Verify enrollment in a qualifying HDHP",
          "Maximize HSA contributions ($4,300 individual / $8,550 family for 2026)",
          "Invest HSA funds for long-term growth",
          "Keep receipts for future tax-free reimbursements",
        ],
      },
      {
        title: "Child and Dependent Tax Credits",
        category: "Credits",
        description:
          "Claim applicable child tax credits and dependent care credits based on your family situation. Credits directly reduce your tax bill dollar-for-dollar.",
        estimatedSavings: 4000,
        savingsMin: 2000,
        savingsMax: 6000,
        implementationSteps: [
          "Verify eligibility for Child Tax Credit ($2,000 per child)",
          "Claim Child and Dependent Care Credit if applicable",
          "Explore Earned Income Tax Credit eligibility",
          "Review education credits for dependents",
        ],
      },
      {
        title: "Charitable Giving Optimization",
        category: "Charity",
        description:
          "Optimize charitable giving through donor-advised funds, appreciated stock donations, and bunching strategies to maximize deduction value.",
        estimatedSavings: 1800,
        savingsMin: 500,
        savingsMax: 5000,
        implementationSteps: [
          "Consider opening a donor-advised fund for bunching strategy",
          "Donate appreciated securities instead of cash to avoid capital gains",
          "Track all charitable contributions with proper documentation",
          "Explore qualified charitable distributions from IRAs if 70.5+",
        ],
      },
      {
        title: "Business Expense Deductions",
        category: "Business",
        description:
          "If you have self-employment or business income, deduct eligible business expenses including home office, equipment, vehicle use, and professional development.",
        estimatedSavings: 3500,
        savingsMin: 1000,
        savingsMax: 8000,
        implementationSteps: [
          "Calculate home office deduction (simplified or actual method)",
          "Track business mileage and vehicle expenses",
          "Deduct professional development and education costs",
          "Review Section 199A qualified business income deduction",
        ],
      },
    ];

    // Filter strategies based on answers
    const filtered = strategies.filter((s) => {
      if (
        s.category === "Credits" &&
        profile.dependents === "0"
      )
        return false;
      if (
        s.category === "Business" &&
        profile.selfEmployment === "No"
      )
        return false;
      return true;
    });

    const total = filtered.reduce(
      (sum, s) => sum + s.estimatedSavings,
      0
    );

    return {
      strategies: filtered,
      totalEstimatedSavings: total,
      profile: {
        occupation: profile.occupation || "Professional",
        filingStatus: profile.filingStatus || "Single",
        income: profile.income || "$75K-$150K",
        dependents: profile.dependents || "0",
        state: profile.state || "California",
      },
    };
  }

  /* ---- slider handling ---- */

  const handleSliderChange = (index: number, value: number) => {
    setSliderValues((prev) => ({ ...prev, [index]: value }));
  };

  const computedTotal = result
    ? result.strategies.reduce(
        (sum, _, i) => sum + (sliderValues[i] ?? 0),
        0
      )
    : 0;

  const toggleExpand = (index: number) => {
    setExpandedCards((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: sliderCSS }} />

      <div className="min-h-screen bg-[#131318] text-[#E4E1E9]">
        {/* ---- Top Tab Bar ---- */}
        <div className="sticky top-0 z-30 bg-[#131318]/80 backdrop-blur-md border-b border-white/5">
          <div className="max-w-6xl mx-auto flex items-center gap-1 px-4 py-3">
            <button className="px-5 py-2 rounded-lg bg-[#DC5700]/15 text-[#FFB596] font-semibold text-sm transition">
              Smart Plan
            </button>
            <button className="px-5 py-2 rounded-lg text-[#C7C5D3] hover:bg-white/5 text-sm transition">
              Chat
            </button>
            <button className="px-5 py-2 rounded-lg text-[#C7C5D3] hover:bg-white/5 text-sm transition">
              Dashboard
            </button>
          </div>
        </div>

        {/* ---- Phase 1: Chat / Loading ---- */}
        {(phase === "chat" || phase === "loading") && (
          <div className="max-w-2xl mx-auto px-4 pt-6 pb-40">
            {/* Security notice */}
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-[#1B1B20] border border-white/5 p-4 animate-fade-in-up">
              <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-[#4CD6FB]/10 flex items-center justify-center">
                <Lock className="w-4 h-4 text-[#4CD6FB]" />
              </div>
              <p className="text-sm text-[#C7C5D3] leading-relaxed">
                <span className="font-semibold text-[#4CD6FB]">
                  Security Notice:
                </span>{" "}
                Do not share personal identifiers (SSN, bank accounts). Only
                general information is needed.
              </p>
            </div>

            {/* Messages */}
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  } animate-fade-in-up`}
                >
                  {msg.role === "bot" && (
                    <div className="flex-shrink-0 mr-3 mt-1">
                      <div className="w-9 h-9 rounded-full bg-[#DC5700]/20 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-[#FFB596]" />
                      </div>
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] ${
                      msg.role === "user"
                        ? "bg-[#DC5700]/15 border border-[#DC5700]/20"
                        : "bg-[rgba(31,31,37,0.6)] backdrop-blur-[16px] border border-white/5"
                    } rounded-2xl px-4 py-3`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.text}
                    </p>

                    {/* Loading spinner on analyzing message */}
                    {phase === "loading" &&
                      i === messages.length - 1 &&
                      msg.role === "bot" && (
                        <div className="mt-3 flex items-center gap-2 text-[#FFB596]">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-xs">
                            Processing your profile...
                          </span>
                        </div>
                      )}

                    {/* Quick-reply buttons */}
                    {msg.buttons &&
                      i === messages.length - 1 &&
                      phase === "chat" && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {msg.buttons.map((btn) => (
                            <button
                              key={btn}
                              onClick={() => handleAnswer(btn)}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#35343A] hover:bg-[#DC5700]/20 hover:text-[#FFB596] border border-white/5 transition-all"
                            >
                              {btn}
                            </button>
                          ))}
                        </div>
                      )}

                    {/* Skip button */}
                    {msg.showSkip &&
                      i === messages.length - 1 &&
                      phase === "chat" && (
                        <button
                          onClick={handleSkip}
                          className="mt-2 text-xs text-[#C7C5D3] hover:text-[#FFB596] underline underline-offset-2 transition"
                        >
                          Skip this question
                        </button>
                      )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input bar */}
            {phase === "chat" && (
              <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#131318] via-[#131318]/95 to-transparent pt-8 pb-6 px-4 z-20">
                <div className="max-w-2xl mx-auto flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-[rgba(31,31,37,0.6)] backdrop-blur-[16px] border border-white/10 rounded-xl px-4 py-3">
                    <input
                      ref={inputRef}
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your answer..."
                      className="flex-1 bg-transparent text-sm text-[#E4E1E9] placeholder-[#C7C5D3]/50 outline-none"
                    />
                    <button
                      onClick={
                        isRecording ? () => setIsRecording(false) : startVoiceInput
                      }
                      className={`ml-2 p-1.5 rounded-lg transition ${
                        isRecording
                          ? "bg-red-500/20 text-red-400 recording-pulse"
                          : "hover:bg-white/5 text-[#C7C5D3]"
                      }`}
                      title="Voice input"
                    >
                      {isRecording ? (
                        <MicOff className="w-4 h-4" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!userInput.trim()}
                    className="p-3 rounded-xl bg-[#DC5700] hover:bg-[#DC5700]/80 disabled:opacity-30 disabled:cursor-not-allowed transition text-white"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---- Phase 2: Strategy Results ---- */}
        {phase === "results" && result && (
          <div className="max-w-5xl mx-auto px-4 pt-6 pb-32 animate-fade-in-up">
            {/* Header Card */}
            <div className="rounded-2xl bg-[rgba(31,31,37,0.6)] backdrop-blur-[16px] border border-white/5 p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-[#FFB596]" />
                <h1 className="text-lg font-semibold">
                  Your Smart Tax Plan
                </h1>
              </div>

              {/* Profile summary */}
              <p className="text-sm text-[#C7C5D3] mb-4">
                {result.profile.occupation} &bull;{" "}
                {result.profile.filingStatus} Filing &bull;{" "}
                {result.profile.income} income &bull;{" "}
                {result.profile.dependents} dependents
              </p>

              {/* Big savings number */}
              <div className="mb-5">
                <p className="text-xs uppercase tracking-wider text-[#C7C5D3] mb-1">
                  Estimated Total Savings
                </p>
                <p className="text-4xl font-bold shimmer-text">
                  {formatCurrency(computedTotal)}
                </p>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 bg-[#1B1B20] rounded-lg px-3 py-2">
                  <Target className="w-4 h-4 text-[#4CD6FB]" />
                  <span>
                    <span className="font-semibold text-[#E4E1E9]">
                      {result.strategies.length}
                    </span>{" "}
                    <span className="text-[#C7C5D3]">Strategies Found</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-[#1B1B20] rounded-lg px-3 py-2">
                  <TrendingUp className="w-4 h-4 text-[#4CD6FB]" />
                  <span>
                    <span className="font-semibold text-[#E4E1E9]">
                      {
                        new Set(result.strategies.map((s) => s.category))
                          .size
                      }
                    </span>{" "}
                    <span className="text-[#C7C5D3]">
                      Categories Covered
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-[#1B1B20] rounded-lg px-3 py-2">
                  <ArrowRight className="w-4 h-4 text-[#4CD6FB]" />
                  <span className="text-[#C7C5D3]">
                    Savings Range:{" "}
                    <span className="font-semibold text-[#E4E1E9]">
                      {formatCurrency(
                        result.strategies.reduce(
                          (sum, s) => sum + s.savingsMin,
                          0
                        )
                      )}{" "}
                      &ndash;{" "}
                      {formatCurrency(
                        result.strategies.reduce(
                          (sum, s) => sum + s.savingsMax,
                          0
                        )
                      )}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Strategy Cards */}
            <div className="space-y-4">
              {result.strategies.map((strategy, idx) => {
                const colors =
                  categoryColors[strategy.category] || categoryColors.Deductions;
                const expanded = expandedCards[idx] ?? false;
                const sliderVal = sliderValues[idx] ?? strategy.estimatedSavings;

                return (
                  <div
                    key={idx}
                    className="rounded-2xl bg-[rgba(31,31,37,0.6)] backdrop-blur-[16px] border border-white/5 p-5 transition-all hover:border-white/10"
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <span
                          className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full mb-2 ${colors.bg} ${colors.text}`}
                        >
                          {strategy.category}
                        </span>
                        <h3 className="font-bold text-[#E4E1E9]">
                          {strategy.title}
                        </h3>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <p className="text-2xl font-bold text-[#FFB596]">
                          {formatCurrency(sliderVal)}
                        </p>
                        <p className="text-xs text-[#C7C5D3]">estimated</p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-[#C7C5D3] mb-4 leading-relaxed">
                      {strategy.description}
                    </p>

                    {/* Slider */}
                    <div className="mb-4">
                      <input
                        type="range"
                        className="smart-plan-slider"
                        min={strategy.savingsMin}
                        max={strategy.savingsMax}
                        value={sliderVal}
                        onChange={(e) =>
                          handleSliderChange(idx, Number(e.target.value))
                        }
                      />
                      <div className="flex justify-between mt-1 text-xs text-[#C7C5D3]">
                        <span>{formatCurrency(strategy.savingsMin)}</span>
                        <span>{formatCurrency(strategy.savingsMax)}</span>
                      </div>
                    </div>

                    {/* Expand/collapse steps */}
                    <button
                      onClick={() => toggleExpand(idx)}
                      className="flex items-center gap-1.5 text-xs text-[#FFB596] hover:text-[#FFB596]/80 transition"
                    >
                      {expanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          Hide Implementation Steps
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          Show Implementation Steps
                        </>
                      )}
                    </button>

                    {expanded && (
                      <ol className="mt-3 space-y-2 pl-5 list-decimal text-sm text-[#C7C5D3] animate-fade-in-up">
                        {strategy.implementationSteps.map((step, si) => (
                          <li key={si} className="leading-relaxed">
                            {step}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom sticky bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#131318] via-[#131318]/95 to-transparent pt-6 pb-6 px-4 z-20">
              <div className="max-w-5xl mx-auto">
                <div className="rounded-2xl bg-[rgba(31,31,37,0.6)] backdrop-blur-[16px] border border-white/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-[#FFB596]" />
                    <div>
                      <p className="text-xs text-[#C7C5D3]">
                        Total Estimated Savings
                      </p>
                      <p className="text-xl font-bold shimmer-text">
                        {formatCurrency(computedTotal)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[rgba(31,31,37,0.6)] backdrop-blur-[16px] border border-white/10 text-sm font-medium text-[#E4E1E9] hover:border-[#FFB596]/30 transition">
                      <FileText className="w-4 h-4" />
                      Generate Report
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#DC5700] hover:bg-[#DC5700]/80 text-sm font-semibold text-white transition">
                      <Brain className="w-4 h-4" />
                      Discuss with Tax Architect
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
