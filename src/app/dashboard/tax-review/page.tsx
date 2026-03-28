"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  MessageSquare,
  Upload,
  FileText,
  ArrowRight,
} from "lucide-react";

type ReviewFlag = {
  type: "red" | "green" | "cleared";
  description: string;
  impact?: string;
  ircReference?: string;
};

const redFlags: ReviewFlag[] = [
  {
    type: "red",
    description: "Missing Schedule C deduction for home office ($4,200 potential savings)",
    impact: "$4,200",
    ircReference: "IRC \u00A7280A",
  },
  {
    type: "red",
    description: "Incorrect depreciation method on rental property",
    impact: "$6,800",
    ircReference: "IRC \u00A7168",
  },
  {
    type: "red",
    description: "Overlooked state tax credit eligibility",
    impact: "$2,100",
    ircReference: "State Credit",
  },
];

const greenFlags: ReviewFlag[] = [
  {
    type: "green",
    description: "Eligible for QBI deduction \u2014 estimated $8,500 savings",
    impact: "$8,500",
    ircReference: "IRC \u00A7199A",
  },
  {
    type: "green",
    description: "S-Corp election could save $12,000 in SE tax",
    impact: "$12,000",
    ircReference: "IRC \u00A71361",
  },
  {
    type: "green",
    description: "Qualified for R&D credit on software development",
    impact: "$6,200",
    ircReference: "IRC \u00A741",
  },
  {
    type: "green",
    description: "Cost segregation study recommended \u2014 $15,000+ savings",
    impact: "$15,000+",
    ircReference: "IRC \u00A7168",
  },
];

const clearedItems: ReviewFlag[] = [
  { type: "cleared", description: "W-2 income matches employer records" },
  { type: "cleared", description: "Standard deduction correctly applied" },
  { type: "cleared", description: "Estimated tax payments verified" },
];

export default function TaxReviewPage() {
  const [showResults, setShowResults] = useState(true);
  const overallScore = 85;
  const circumference = 2 * Math.PI * 56; // r=56
  const strokeDash = (overallScore / 100) * circumference;

  return (
    <div className="space-y-8 p-6">
      {/* ── Editorial Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium text-[#4CD6FB] uppercase tracking-[0.2em] mb-2">
            COMPLIANCE ENGINE
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#E4E1E9]">
            AI Tax Return Review
          </h1>
          <p className="text-[#C7C5D3] mt-2 text-sm">
            Upload your return for comprehensive AI-powered analysis.
          </p>
        </div>
        <button
          onClick={() => setShowResults(true)}
          className="flex items-center gap-2 bg-[#DC5700] hover:bg-[#DC5700]/90 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
        >
          <Upload className="w-4 h-4" />
          Start New Review
        </button>
      </div>

      {/* ── Upload Section ── */}
      <div className="glass-card rounded-2xl p-10 border-2 border-dashed border-[#464651]/30">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#DC5700]/10 flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8 text-[#FFB596]" />
          </div>
          <h3 className="text-lg font-bold text-[#E4E1E9]">Upload Your Tax Return</h3>
          <p className="text-sm text-[#C7C5D3] max-w-md mx-auto">
            Upload your tax return (1040, 1065, 1120, 1120-S) for AI review.
            We&apos;ll analyze it for errors, missed deductions, and savings opportunities.
          </p>
          <button className="px-5 py-2.5 rounded-xl text-sm font-bold border border-[#FFB596]/30 text-[#FFB596] hover:bg-[#FFB596]/10 transition-colors inline-flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Choose File or Drag &amp; Drop
          </button>
          <p className="text-xs text-[#C7C5D3]">PDF, up to 25MB. Your data is encrypted and secure.</p>
        </div>
      </div>

      {/* ── Review Results ── */}
      {showResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Score + Summary Row */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Circular Score */}
            <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-10">
              <p className="text-xs font-medium text-[#C7C5D3] uppercase tracking-widest mb-4">
                Review Score
              </p>
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="#2A292F"
                    strokeWidth="10"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke={overallScore >= 80 ? "#4CD6FB" : overallScore >= 60 ? "#FFB596" : "#FFB4AB"}
                    strokeWidth="10"
                    strokeDasharray={`${strokeDash} ${circumference}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-extrabold text-[#E4E1E9]">{overallScore}</span>
                  <span className="text-sm text-[#C7C5D3]">/100</span>
                </div>
              </div>
              <p className="text-sm text-[#C7C5D3] mt-4">Good \u2014 savings opportunities found</p>
            </div>

            {/* Review Summary */}
            <div className="lg:col-span-2 glass-card rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-[#E4E1E9]">Review Summary</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-[#93000A]/10 p-4 text-center">
                  <XCircle className="w-6 h-6 text-[#FFB4AB] mx-auto mb-1" />
                  <p className="text-2xl font-extrabold text-[#FFB4AB]">{redFlags.length}</p>
                  <p className="text-xs text-[#FFB4AB]/80">Issues Found</p>
                </div>
                <div className="rounded-xl bg-[#DC5700]/10 p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 text-[#FFB596] mx-auto mb-1" />
                  <p className="text-2xl font-extrabold text-[#FFB596]">{greenFlags.length}</p>
                  <p className="text-xs text-[#FFB596]/80">Savings Opportunities</p>
                </div>
                <div className="rounded-xl bg-[#35343A]/50 p-4 text-center">
                  <Shield className="w-6 h-6 text-[#C7C5D3] mx-auto mb-1" />
                  <p className="text-2xl font-extrabold text-[#C7C5D3]">{clearedItems.length}</p>
                  <p className="text-xs text-[#C7C5D3]/80">Items Verified</p>
                </div>
              </div>
              <div className="rounded-xl bg-[#DC5700]/10 border border-[#FFB596]/20 p-4">
                <p className="text-sm font-bold text-[#FFB596]">Total Potential Savings Identified</p>
                <p className="text-3xl font-extrabold text-[#FFB596]">$41,700+</p>
              </div>
            </div>
          </div>

          {/* ── Red Flags ── */}
          <div className="glass-card rounded-2xl p-6 bg-[#93000A]/10 border border-[#FFB4AB]/20">
            <h2 className="text-lg font-bold text-[#FFB4AB] flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5" />
              Red Flags \u2014 Issues Found
            </h2>
            <div className="space-y-3">
              <AnimatePresence>
                {redFlags.map((flag, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between gap-4 rounded-xl bg-[#93000A]/10 border border-[#FFB4AB]/10 p-4"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <XCircle className="w-5 h-5 text-[#FFB4AB] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-[#E4E1E9]">{flag.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {flag.impact && (
                            <span className="text-xs font-medium bg-[#FFB4AB]/10 text-[#FFB4AB] px-2 py-0.5 rounded-full">
                              Impact: {flag.impact}
                            </span>
                          )}
                          {flag.ircReference && (
                            <span className="text-xs font-medium text-[#C7C5D3] bg-[#35343A] px-2 py-0.5 rounded-full">
                              {flag.ircReference}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-[#FFB4AB]/30 text-[#FFB4AB] hover:bg-[#FFB4AB]/10 transition-colors shrink-0">
                      Fix <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Green Flags (using primary palette) ── */}
          <div className="glass-card rounded-2xl p-6 bg-[#DC5700]/10 border border-[#FFB596]/20">
            <h2 className="text-lg font-bold text-[#FFB596] flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5" />
              Savings Opportunities Found
            </h2>
            <div className="space-y-3">
              <AnimatePresence>
                {greenFlags.map((flag, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between gap-4 rounded-xl bg-[#DC5700]/10 border border-[#FFB596]/10 p-4"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <CheckCircle2 className="w-5 h-5 text-[#FFB596] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-[#E4E1E9]">{flag.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {flag.impact && (
                            <span className="text-xs font-medium bg-[#FFB596]/10 text-[#FFB596] px-2 py-0.5 rounded-full">
                              Savings: {flag.impact}
                            </span>
                          )}
                          {flag.ircReference && (
                            <span className="text-xs font-medium text-[#C7C5D3] bg-[#35343A] px-2 py-0.5 rounded-full">
                              {flag.ircReference}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#DC5700] text-white hover:bg-[#DC5700]/90 transition-colors shrink-0">
                      Apply <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Cleared Items ── */}
          <div className="glass-card rounded-2xl p-6 bg-[#35343A]/50">
            <h2 className="text-lg font-bold text-[#C7C5D3] flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5" />
              Cleared Items
            </h2>
            <div className="space-y-3">
              {clearedItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 rounded-xl bg-[#35343A]/40 p-4"
                >
                  <CheckCircle2 className="w-5 h-5 text-[#464651] shrink-0" />
                  <p className="text-sm text-[#C7C5D3] flex-1">{item.description}</p>
                  <span className="text-xs font-medium text-[#C7C5D3] bg-[#2A292F] px-2.5 py-1 rounded-full shrink-0">
                    Verified
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button className="flex items-center justify-center gap-2 bg-[#1F1F25] hover:bg-[#2A292F] text-[#E4E1E9] px-6 py-3 rounded-xl text-sm font-bold transition-colors border-t border-white/10">
              <Download className="w-4 h-4" />
              Download Report
            </button>
            <button className="flex items-center justify-center gap-2 border border-[#FFB596]/30 text-[#FFB596] hover:bg-[#FFB596]/10 px-6 py-3 rounded-xl text-sm font-bold transition-colors">
              <MessageSquare className="w-4 h-4" />
              Discuss with Architect
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
