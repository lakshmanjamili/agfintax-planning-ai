"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useRef, useCallback } from "react";
import { useAuth, UserButton } from "@clerk/nextjs";
import {
  Landmark,
  Brain,
  FileText,
  TrendingUp,
  PiggyBank,
  ClipboardCheck,
  ShieldCheck,
  BarChart3,
  LayoutDashboard,
  ArrowRight,
  Shield,
  Send,
  Upload,
  Zap,
  Lock,
  Check,
  MessageCircle,
  X,
  Loader2,
} from "lucide-react";
import InlineTaxCalculator from "@/components/tax-calculator/inline-calculator";

/* ── animation variants ── */
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

/* ── features data ── */
const features = [
  {
    icon: Brain,
    bgIcon: Brain,
    title: "Neural Tax Engine",
    description:
      "Deep-learning models trained on 10M+ tax scenarios identify optimization vectors invisible to traditional methods.",
    color: "bg-[#DC5700]/20 text-[#FFB596]",
  },
  {
    icon: FileText,
    bgIcon: FileText,
    title: "Liquidity Guard",
    description:
      "Real-time cash-flow modeling ensures your tax strategy never compromises operational liquidity requirements.",
    color: "bg-[#4CD6FB]/20 text-[#4CD6FB]",
  },
  {
    icon: TrendingUp,
    bgIcon: TrendingUp,
    title: "Risk Architecture",
    description:
      "Multi-dimensional risk scoring evaluates every strategy against audit probability and regulatory exposure.",
    color: "bg-[#BFC2FF]/20 text-[#BFC2FF]",
  },
  {
    icon: PiggyBank,
    bgIcon: PiggyBank,
    title: "Automated Yield",
    description:
      "Continuous portfolio rebalancing and tax-loss harvesting execute autonomously within your defined parameters.",
    color: "bg-[#DC5700]/20 text-[#FFB596]",
  },
  {
    icon: ClipboardCheck,
    bgIcon: ClipboardCheck,
    title: "Audit Immutability",
    description:
      "Blockchain-anchored audit trails provide immutable documentation for every financial decision and transaction.",
    color: "bg-[#4CD6FB]/20 text-[#4CD6FB]",
  },
  {
    icon: LayoutDashboard,
    bgIcon: LayoutDashboard,
    title: "Multi-Entity Sync",
    description:
      "Unified orchestration across LLCs, trusts, and holding companies with real-time consolidated reporting.",
    color: "bg-[#464651]/40 text-[#C7C5D3]",
  },
];

export default function Home() {
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-screen bg-[#131318] font-sans">
      {/* ───────────── NAVIGATION ───────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#131318]/60 backdrop-blur-xl border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#DC5700] to-[#FFB596]">
                <Landmark className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-[#E4E1E9]">
                AgFinTax
              </span>
            </Link>

            {/* Nav links */}
            <div className="hidden items-center gap-8 md:flex">
              <a href="#calculator" className="text-sm font-medium text-orange-500 transition-colors hover:text-[#FFB596]">
                Tax Calculator
              </a>
              <a href="#features" className="text-sm font-medium text-slate-400 transition-colors hover:text-[#E4E1E9]">
                Solutions
              </a>
              <a href="#platform" className="text-sm font-medium text-slate-400 transition-colors hover:text-[#E4E1E9]">
                Platform
              </a>
              <a href="#pricing" className="text-sm font-medium text-slate-400 transition-colors hover:text-[#E4E1E9]">
                Pricing
              </a>
              <Link href="/about" className="text-sm font-medium text-slate-400 transition-colors hover:text-[#E4E1E9]">
                About
              </Link>
            </div>

            {/* Auth buttons */}
            <div className="flex items-center gap-3">
              {isSignedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#DC5700] to-[#FFB596] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#DC5700]/25 transition-all hover:shadow-[#DC5700]/40 hover:brightness-110"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "h-9 w-9 rounded-xl border-2 border-[#DC5700]/30",
                      },
                    }}
                  />
                </>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="text-sm font-medium text-[#C7C5D3] transition-colors hover:text-[#E4E1E9]"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="inline-flex items-center rounded-xl bg-gradient-to-r from-[#DC5700] to-[#FFB596] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#DC5700]/25 transition-all hover:shadow-[#DC5700]/40 hover:brightness-110"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ───────────── HERO SECTION ───────────── */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
        {/* Decorative mesh */}
        <div className="absolute inset-0 mesh-gradient" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full bg-[#DC5700]/10 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-12 gap-8 items-center">
            {/* Left — 7 cols */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="col-span-12 lg:col-span-7"
            >
              {/* Badge */}
              <motion.div
                variants={fadeInUp}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-[#C7C5D3] backdrop-blur-sm"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                AI Financial Protocol 2.0
              </motion.div>

              {/* H1 */}
              <motion.h1
                variants={fadeInUp}
                className="text-6xl md:text-8xl font-extrabold tracking-tighter leading-[0.9] text-[#E4E1E9]"
              >
                The{" "}
                <span className="bg-gradient-to-r from-[#DC5700] to-[#FFB596] bg-clip-text text-transparent">
                  Financial
                </span>
                <br />
                Architect.
              </motion.h1>

              {/* Paragraph */}
              <motion.p
                variants={fadeInUp}
                className="mt-6 max-w-xl text-xl leading-relaxed text-[#C7C5D3]"
              >
                Engineered for high-net-worth entities seeking mathematical
                certainty in tax optimization. Automated strategies, document
                intelligence, and liquidity modeling — all in one platform.
              </motion.p>

              {/* Buttons */}
              <motion.div variants={fadeInUp} className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#DC5700] to-[#FFB596] px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-[#DC5700]/30 transition-all hover:shadow-2xl hover:shadow-[#DC5700]/40 hover:brightness-110"
                >
                  Start Free Audit
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button className="glass-card inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-[#C7C5D3] transition-all hover:bg-[#35343a]/60 hover:text-[#E4E1E9]">
                  View Demo
                </button>
              </motion.div>

              {/* Stats row */}
              <motion.div
                variants={fadeInUp}
                className="mt-12 flex flex-wrap gap-8 border-t border-white/5 pt-8"
              >
                {[
                  { value: "15k+", label: "Global Enterprises" },
                  { value: "$2.4B", label: "Capital Managed" },
                  { value: "99.9%", label: "Audit Protection" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-extrabold text-[#E4E1E9]">{stat.value}</p>
                    <p className="text-sm text-[#908F9C]">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — 5 cols */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="col-span-12 lg:col-span-5 relative"
            >
              {/* Decorative blur orb */}
              <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full bg-[#DC5700]/20 blur-[120px] pointer-events-none" />

              {/* Main glass card */}
              <div className="glass-card rounded-3xl p-8 relative z-10">
                <p className="text-sm font-medium text-[#908F9C] mb-2">
                  Projected Annual Savings
                </p>
                <p className="text-5xl font-extrabold text-[#FFB596] mb-6">
                  $47,250
                </p>

                {/* Progress bar */}
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-[#C7C5D3]">Optimization Progress</p>
                    <p className="text-sm font-semibold text-[#FFB596]">78%</p>
                  </div>
                  <div className="h-2 rounded-full bg-[#35343a]">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-[#DC5700] to-[#FFB596]"
                      style={{ width: "78%" }}
                    />
                  </div>
                </div>

                {/* Stats inside card */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-[#1b1b20]/60 p-4">
                    <BarChart3 className="h-5 w-5 text-[#4CD6FB] mb-2" />
                    <p className="text-lg font-bold text-[#E4E1E9]">+34%</p>
                    <p className="text-xs text-[#908F9C]">Tax Efficiency</p>
                  </div>
                  <div className="rounded-2xl bg-[#1b1b20]/60 p-4">
                    <TrendingUp className="h-5 w-5 text-[#BFC2FF] mb-2" />
                    <p className="text-lg font-bold text-[#E4E1E9]">$12.8M</p>
                    <p className="text-xs text-[#908F9C]">Assets Tracked</p>
                  </div>
                </div>
              </div>

              {/* Overlapping badge card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="absolute -bottom-4 -left-4 z-20 glass-card rounded-2xl px-5 py-3 flex items-center gap-3 shadow-2xl"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4CD6FB]/20">
                  <ShieldCheck className="h-5 w-5 text-[#4CD6FB]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#E4E1E9]">Verified AI</p>
                  <p className="text-xs text-[#908F9C]">SOC 2 Compliant</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ───────────── LOGO CLOUD ───────────── */}
      <section className="border-y border-white/5 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeInUp}
          >
            <p className="mb-8 text-center text-sm font-medium tracking-wider text-[#908F9C] uppercase">
              Trusted by 15k+ Market Leaders
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-10 w-28 rounded-lg bg-[#35343a]/30 flex items-center justify-center"
                >
                  <span className="text-xs text-[#464651] font-medium">Partner {i}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───────────── TAX CALCULATOR ───────────── */}
      <InlineTaxCalculator />

      {/* ───────────── FEATURES GRID ───────────── */}
      <section id="features" className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="mb-16 max-w-2xl"
          >
            <h2 className="text-4xl font-extrabold tracking-tight text-[#E4E1E9] sm:text-5xl">
              Sophisticated{" "}
              <span className="bg-gradient-to-r from-[#DC5700] to-[#FFB596] bg-clip-text text-transparent">
                Capabilities
              </span>
            </h2>
            <p className="mt-4 text-lg text-[#C7C5D3]">
              Every module is engineered for precision, operating at the
              intersection of financial intelligence and autonomous execution.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                className="group relative overflow-hidden rounded-3xl p-10 glass-card transition-colors duration-300 hover:bg-[#35343a]/60"
              >
                {/* Background hover icon */}
                <feature.bgIcon className="absolute top-6 right-6 h-24 w-24 text-white/[0.03] transition-all duration-500 group-hover:text-white/[0.06] group-hover:scale-110" />

                {/* Icon container */}
                <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${feature.color}`}>
                  <feature.icon className="h-7 w-7" />
                </div>

                <h3 className="mb-3 text-xl font-bold text-[#E4E1E9]">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#C7C5D3]">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ───────────── PLATFORM SECTION ───────────── */}
      <section id="platform" className="py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[#3B418F]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <motion.div variants={fadeInUp} className="text-center mb-20">
              <span className="text-[10px] font-extrabold tracking-[0.3em] text-[#FFB596] uppercase mb-4 block">How the Platform Works</span>
              <h2 className="text-4xl font-extrabold tracking-tight text-[#E4E1E9] sm:text-5xl">
                Your AI-Powered{" "}
                <span className="bg-gradient-to-r from-[#DC5700] to-[#FFB596] bg-clip-text text-transparent">
                  Tax Command Center
                </span>
              </h2>
              <p className="mt-4 text-lg text-[#C7C5D3] max-w-2xl mx-auto">
                From document upload to strategy execution — every step is automated, auditable, and optimized.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { step: "01", icon: Upload, title: "Upload Documents", desc: "Drop W-2s, 1099s, K-1s, and financial statements. Our OCR engine extracts every data point.", accent: "from-[#DC5700] to-[#FFB596]" },
                { step: "02", icon: Brain, title: "AI Analysis", desc: "Neural tax engine scans thousands of IRC codes, identifies deductions, and classifies every document.", accent: "from-[#4CD6FB] to-[#4CD6FB]/50" },
                { step: "03", icon: Zap, title: "Strategy Generation", desc: "Personalized tax strategies ranked by savings potential, risk level, and implementation complexity.", accent: "from-[#BFC2FF] to-[#BFC2FF]/50" },
                { step: "04", icon: TrendingUp, title: "Maximize Savings", desc: "Real-time dashboard tracks projected vs. actual savings. Continuous optimization throughout the year.", accent: "from-[#DC5700] to-[#FFB596]" },
              ].map((item) => (
                <motion.div key={item.step} variants={fadeInUp} className="glass-card rounded-3xl p-8 group hover:bg-[#35343a]/40 transition-all relative overflow-hidden">
                  <div className="absolute top-4 right-4 text-6xl font-extrabold text-white/[0.03] group-hover:text-white/[0.06] transition-colors">{item.step}</div>
                  <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} bg-opacity-20`}>
                    <item.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-[#E4E1E9] mb-3">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-[#C7C5D3]">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Platform stats */}
            <motion.div variants={fadeInUp} className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: "3.2s", label: "Avg Processing Time" },
                { value: "40+", label: "Document Types" },
                { value: "46+", label: "Tax Strategies" },
                { value: "99%", label: "OCR Accuracy" },
              ].map((stat) => (
                <div key={stat.label} className="glass-card rounded-2xl p-6 text-center">
                  <p className="text-2xl font-extrabold text-[#FFB596]">{stat.value}</p>
                  <p className="text-xs text-[#908F9C] mt-1 uppercase tracking-wider font-medium">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ───────────── PRICING SECTION ───────────── */}
      <section id="pricing" className="py-24 lg:py-32 relative">
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#DC5700]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <span className="text-[10px] font-extrabold tracking-[0.3em] text-[#FFB596] uppercase mb-4 block">Investment Tiers</span>
              <h2 className="text-4xl font-extrabold tracking-tight text-[#E4E1E9] sm:text-5xl">
                Architectural{" "}
                <span className="bg-gradient-to-r from-[#DC5700] to-[#FFB596] bg-clip-text text-transparent">
                  Pricing
                </span>
              </h2>
              <p className="mt-4 text-lg text-[#C7C5D3] max-w-xl mx-auto">
                Every plan includes AI-powered tax intelligence. Choose the tier that matches your financial complexity.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  name: "Starter",
                  price: "Free",
                  period: "forever",
                  desc: "For individuals exploring AI tax planning",
                  features: ["5 AI chat questions/month", "Basic document upload (3 docs)", "2 tax strategies", "Email support"],
                  cta: "Get Started Free",
                  featured: false,
                },
                {
                  name: "Professional",
                  price: "$49",
                  period: "/month",
                  desc: "For business owners and high-income earners",
                  features: ["Unlimited AI chat", "Unlimited document uploads", "All 46+ tax strategies", "AI tax return review", "Savings dashboard & charts", "Priority support", "Export reports (PDF/CSV)"],
                  cta: "Start Free Trial",
                  featured: true,
                },
                {
                  name: "Enterprise",
                  price: "Custom",
                  period: "contact us",
                  desc: "For CPA firms and multi-entity structures",
                  features: ["Everything in Professional", "Multi-entity management", "Custom AI model training", "API access", "Dedicated tax architect", "White-label options", "SOC 2 compliance reports"],
                  cta: "Contact Sales",
                  featured: false,
                },
              ].map((plan) => (
                <motion.div
                  key={plan.name}
                  variants={fadeInUp}
                  className={`rounded-3xl p-8 relative overflow-hidden transition-all ${
                    plan.featured
                      ? "glass-card border border-[#DC5700]/30 shadow-2xl shadow-[#DC5700]/10 scale-[1.02]"
                      : "glass-card"
                  }`}
                >
                  {plan.featured && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#DC5700] to-[#FFB596]" />
                  )}
                  <div className="mb-6">
                    <span className={`text-xs font-bold uppercase tracking-widest ${plan.featured ? "text-[#FFB596]" : "text-[#908F9C]"}`}>
                      {plan.name}
                    </span>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold tracking-tighter text-[#E4E1E9]">{plan.price}</span>
                      <span className="text-sm text-[#908F9C]">{plan.period}</span>
                    </div>
                    <p className="mt-2 text-sm text-[#C7C5D3]">{plan.desc}</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <Check className={`h-4 w-4 mt-0.5 shrink-0 ${plan.featured ? "text-[#FFB596]" : "text-[#4CD6FB]"}`} />
                        <span className="text-sm text-[#C7C5D3]">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/sign-up"
                    className={`block w-full text-center rounded-xl py-3 text-sm font-bold transition-all ${
                      plan.featured
                        ? "bg-gradient-to-r from-[#DC5700] to-[#FFB596] text-white shadow-lg shadow-[#DC5700]/25 hover:shadow-[#DC5700]/40"
                        : "bg-[#35343a]/60 text-[#E4E1E9] hover:bg-[#35343a]"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Trust badges */}
            <motion.div variants={fadeInUp} className="mt-16 flex flex-wrap items-center justify-center gap-8">
              {[
                { icon: Lock, text: "256-bit Encryption" },
                { icon: ShieldCheck, text: "SOC 2 Compliant" },
                { icon: Shield, text: "GDPR Ready" },
              ].map((badge) => (
                <div key={badge.text} className="flex items-center gap-2 text-[#908F9C]">
                  <badge.icon className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">{badge.text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ───────────── CTA SECTION ───────────── */}
      <section id="strategies" className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-[#3B418F]/30 to-[#0e0e13] px-8 py-20 text-center sm:px-16"
          >
            {/* Mesh overlay */}
            <div className="absolute inset-0 mesh-gradient opacity-50" />

            <div className="relative z-10">
              <h2 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-[#E4E1E9] sm:text-5xl">
                Ready to{" "}
                <span className="bg-gradient-to-r from-[#DC5700] to-[#FFB596] bg-clip-text text-transparent">
                  re-engineer
                </span>{" "}
                your capital?
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg text-[#C7C5D3]">
                Join 15,000+ entities that have transformed their financial
                architecture with AI-driven precision.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#DC5700] to-[#FFB596] px-8 py-3.5 text-base font-bold text-white shadow-xl shadow-[#DC5700]/30 transition-all hover:shadow-2xl hover:shadow-[#DC5700]/40 hover:brightness-110"
                >
                  Start Free Audit
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button className="glass-card inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-semibold text-[#C7C5D3] transition-all hover:bg-[#35343a]/60 hover:text-[#E4E1E9]">
                  Schedule Demo
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───────────── FOOTER ───────────── */}
      <footer className="border-t border-white/5 bg-[#131318] pt-16 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Brand */}
            <div>
              <Link href="/" className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#DC5700] to-[#FFB596]">
                  <Landmark className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-[#E4E1E9]">
                  AgFinTax
                </span>
              </Link>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#908F9C]">
                The Financial Architect. AI-powered tax optimization and
                liquidity modeling engineered for precision.
              </p>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#C7C5D3]">
                  Company
                </h4>
                <ul className="space-y-2.5">
                  {["About", "Careers", "Blog", "Press"].map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-[#908F9C] transition-colors hover:text-[#FFB596]"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#C7C5D3]">
                  Support
                </h4>
                <ul className="space-y-2.5">
                  {["Help Center", "Documentation", "API Status", "Contact"].map(
                    (link) => (
                      <li key={link}>
                        <a
                          href="#"
                          className="text-sm text-[#908F9C] transition-colors hover:text-[#FFB596]"
                        >
                          {link}
                        </a>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#C7C5D3]">
                Stay Updated
              </h4>
              <p className="mb-4 text-sm text-[#908F9C]">
                Get the latest insights on AI-driven financial strategies.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 rounded-xl bg-[#1f1f25] px-4 py-2.5 text-sm text-[#E4E1E9] placeholder-[#464651] outline-none ring-1 ring-white/5 transition-all focus:ring-[#DC5700]/50"
                />
                <button className="flex items-center justify-center rounded-xl bg-gradient-to-r from-[#DC5700] to-[#FFB596] px-4 py-2.5 text-white transition-all hover:brightness-110">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
            <p className="text-sm text-[#464651]">
              &copy; 2024 AgFinTax. All rights reserved.
            </p>
            <p className="text-sm text-[#464651]">
              Built & Powered by{" "}
              <a
                href="https://loukriai.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#FFB596] transition-colors hover:text-[#DC5700]"
              >
                LoukriAI.com
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* ───────────── FLOATING CHATBOT WIDGET ───────────── */}
      <QuickChatBot />
    </div>
  );
}

/* ───────────── QUICK CHATBOT COMPONENT ───────────── */
function QuickChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "Hi! I'm the AgFinTax assistant. I can answer questions about our platform, pricing, features, and how AI-powered tax planning works. What would you like to know?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    "What does AgFinTax do?",
    "How does AI tax planning work?",
    "What documents can I upload?",
    "Is my data secure?",
  ];

  const handleSend = useCallback(async (text?: string) => {
    const message = text || input.trim();
    if (!message || isLoading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setIsLoading(true);

    // Scroll to bottom
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are a helpful assistant for AgFinTax, an AI-powered tax planning platform by AG FinTax (Anil Grandhi's firm). Answer questions about the platform's features: AI tax chat, document intelligence (OCR for W-2s, 1099s, K-1s), 15+ tax strategies (QBI, S-Corp, cost segregation, R&D credits, etc.), savings dashboard with charts, automated tax return review with red/green flags, and client profile management. Pricing: Free tier (5 questions/month, 3 docs), Professional $49/mo (unlimited everything), Enterprise (custom). The platform uses Azure Document Intelligence for OCR and AI models via OpenRouter. Data is encrypted (AES-256), SOC 2 compliant. Located in Texas and Washington. Contact: hello@agfintax.com, (425) 395-4318. Keep answers concise (2-3 sentences max). Be friendly and professional." },
            ...messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: message },
          ],
        }),
      });

      if (!res.ok) throw new Error("Failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          const current = accumulated;
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "assistant", content: current };
            return copy;
          });
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "AgFinTax is an AI-powered tax planning platform that helps you upload documents, get personalized tax strategies, and maximize savings. Sign up free to explore! For questions, contact hello@agfintax.com or call (425) 395-4318." },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 100);
    }
  }, [input, isLoading, messages]);

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[520px] rounded-3xl overflow-hidden shadow-2xl shadow-black/40"
          style={{ background: "rgba(19, 19, 24, 0.98)", backdropFilter: "blur(20px)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#DC5700] to-[#FFB596]">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">AgFinTax AI</p>
                <p className="text-[10px] text-white/70 font-medium">Ask anything about our platform</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-white/20 transition-colors">
              <X className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="h-[340px] overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#DC5700] text-white rounded-tr-none"
                      : "bg-[#1F1F25] text-[#C7C5D3] rounded-tl-none border border-white/5"
                  }`}
                >
                  {msg.content || (
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#FFB596] animate-bounce" />
                      <span className="h-1.5 w-1.5 rounded-full bg-[#FFB596] animate-bounce" style={{ animationDelay: "0.15s" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-[#FFB596] animate-bounce" style={{ animationDelay: "0.3s" }} />
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Quick questions (show only if 1 message) */}
            {messages.length === 1 && (
              <div className="space-y-2 pt-2">
                {quickQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="block w-full text-left text-xs px-3 py-2 rounded-xl bg-[#1B1B20] text-[#C7C5D3] hover:bg-[#2A292F] hover:text-[#FFB596] transition-all border border-white/5"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/5">
            <div className="flex items-center gap-2 bg-[#0E0E13] rounded-xl px-3 py-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Ask a question..."
                className="flex-1 bg-transparent text-sm text-[#E4E1E9] placeholder-[#464651] outline-none"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="p-2 rounded-lg bg-gradient-to-r from-[#DC5700] to-[#FFB596] text-white disabled:opacity-30 hover:brightness-110 transition-all"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-r from-[#DC5700] to-[#FFB596] text-white shadow-2xl shadow-[#DC5700]/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>
    </>
  );
}
