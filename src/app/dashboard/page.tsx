"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  FileText,
  PiggyBank,
  ClipboardCheck,
  Brain,
  Upload,
  Eye,
  CheckCircle,
  Search as SearchIcon,
  Calendar,
  ArrowUpRight,
} from "lucide-react";

/* ─── animation variants ─── */
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

/* ─── chart data (12 months) ─── */
const chartData = [
  { month: "Jan", value: 18000 },
  { month: "Feb", value: 22000 },
  { month: "Mar", value: 20000 },
  { month: "May", value: 28000 },
  { month: "Jun", value: 25000 },
  { month: "Jul", value: 32000 },
  { month: "Aug", value: 30000 },
  { month: "Sep", value: 38000 },
  { month: "Oct", value: 35000 },
  { month: "Nov", value: 47250 },
];

/* ─── recent activity ─── */
const recentActivity = [
  {
    id: 1,
    title: "Strategy Approved",
    detail: "Estate Planning Module V2",
    time: "2 hours ago",
    dotColor: "bg-orange-500",
    icon: CheckCircle,
    iconColor: "text-orange-400",
  },
  {
    id: 2,
    title: "AI Scan Complete",
    detail: "3 missing deductions found",
    time: "5 hours ago",
    dotColor: "bg-cyan-500",
    icon: SearchIcon,
    iconColor: "text-cyan-400",
  },
  {
    id: 3,
    title: "Documents Uploaded",
    detail: "Bank Statements Oct 2023",
    time: "1 day ago",
    dotColor: "bg-violet-400",
    icon: Upload,
    iconColor: "text-violet-400",
  },
  {
    id: 4,
    title: "Review Scheduled",
    detail: "Call with Tax Architect",
    time: "2 days ago",
    dotColor: "bg-slate-500",
    icon: Calendar,
    iconColor: "text-slate-400",
  },
];

/* ─── intelligent actions ─── */
const actions = [
  {
    label: "Start AI Chat",
    href: "/dashboard/tax-chat",
    icon: Brain,
    variant: "primary" as const,
  },
  {
    label: "Upload Docs",
    href: "/dashboard/documents",
    icon: Upload,
    variant: "secondary" as const,
  },
  {
    label: "View Strategies",
    href: "/dashboard/strategies",
    icon: Eye,
    variant: "tertiary" as const,
  },
  {
    label: "Run Tax Review",
    href: "/dashboard/tax-review",
    icon: ClipboardCheck,
    variant: "orange" as const,
  },
];

/* ─── SVG Area Chart ─── */
function SavingsChart() {
  const max = Math.max(...chartData.map((d) => d.value));
  const w = 600;
  const h = 220;
  const padX = 40;
  const padY = 20;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;

  const points = chartData.map((d, i) => ({
    x: padX + (i / (chartData.length - 1)) * innerW,
    y: padY + innerH - (d.value / max) * innerH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x},${h - padY} L${points[0].x},${h - padY} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(234,88,12)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="rgb(234,88,12)" stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
        const y = padY + innerH - pct * innerH;
        return (
          <line
            key={pct}
            x1={padX}
            y1={y}
            x2={w - padX}
            y2={y}
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="4 4"
          />
        );
      })}

      {/* Area fill */}
      <path d={areaPath} fill="url(#areaGrad)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke="rgb(234,88,12)" strokeWidth="2.5" filter="url(#glow)" />

      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="rgb(234,88,12)" stroke="#131318" strokeWidth="2" />
      ))}

      {/* X-axis labels */}
      {chartData.map((d, i) => (
        <text
          key={d.month}
          x={padX + (i / (chartData.length - 1)) * innerW}
          y={h - 2}
          textAnchor="middle"
          className="fill-slate-500 text-[11px]"
        >
          {d.month}
        </text>
      ))}
    </svg>
  );
}

/* ─── Circular Progress Ring ─── */
function ProgressRing({ value, max }: { value: number; max: number }) {
  const pct = value / max;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);

  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="url(#ringGrad)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 36 36)"
      />
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgb(234,88,12)" />
          <stop offset="100%" stopColor="rgb(251,146,60)" />
        </linearGradient>
      </defs>
      <text x="36" y="40" textAnchor="middle" className="fill-white text-sm font-bold">
        {value}
      </text>
    </svg>
  );
}

/* ─── Glass Panel wrapper ─── */
function GlassPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.05] bg-[rgba(27,27,32,0.6)] p-6 backdrop-blur-[16px] ${className}`}
    >
      {children}
    </div>
  );
}

/* ─── Action Button ─── */
function ActionButton({
  item,
}: {
  item: (typeof actions)[0];
}) {
  const isPrimary = item.variant === "primary";

  return (
    <Link href={item.href}>
      <div
        className={`group relative overflow-hidden rounded-xl p-[1px] transition-all duration-300 ${
          isPrimary
            ? "bg-gradient-to-r from-orange-600 to-orange-400 shadow-lg shadow-orange-900/20"
            : "bg-gradient-to-r from-slate-700/50 to-slate-600/50 hover:from-orange-600/60 hover:to-orange-400/60"
        }`}
      >
        <div className="flex items-center gap-3 rounded-[11px] bg-[#1B1B20] px-5 py-4 transition-all duration-300 group-hover:bg-transparent">
          <item.icon
            className={`h-5 w-5 shrink-0 ${
              isPrimary ? "text-orange-400" : "text-slate-400 group-hover:text-white"
            }`}
          />
          <span
            className={`text-sm font-semibold ${
              isPrimary ? "text-orange-400 group-hover:text-white" : "text-slate-300 group-hover:text-white"
            }`}
          >
            {item.label}
          </span>
          <ArrowUpRight className="ml-auto h-4 w-4 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
        </div>
      </div>
    </Link>
  );
}

/* ════════════════════════════════════════════════════════════════
   DASHBOARD PAGE
   ════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { user } = useUser();
  const firstName = user?.firstName || "there";
  const [timeFilter, setTimeFilter] = useState<"12M" | "6M" | "3M">("12M");

  return (
    <div className="space-y-8">
      {/* ─── Welcome ─── */}
      <motion.div initial="hidden" animate="visible" custom={0} variants={fadeIn}>
        <h2 className="text-2xl font-bold text-white md:text-3xl">
          Welcome, {firstName}
        </h2>
        <p className="mt-1 text-slate-500">
          Your financial architecture is optimized for Q4.
        </p>
      </motion.div>

      {/* ─── Stats Cards ─── */}
      <motion.div
        initial="hidden"
        animate="visible"
        custom={1}
        variants={fadeIn}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {/* Potential Savings */}
        <GlassPanel>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Potential Savings
              </p>
              <p className="mt-2 text-3xl font-bold text-white">$47,250</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                +12% vs LY
              </span>
            </div>
            <div className="rounded-xl bg-orange-500/10 p-3">
              <PiggyBank className="h-6 w-6 text-orange-400" />
            </div>
          </div>
        </GlassPanel>

        {/* Documents */}
        <GlassPanel>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Documents
              </p>
              <p className="mt-2 text-3xl font-bold text-white">12</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                3 new this week
              </span>
            </div>
            <div className="rounded-xl bg-blue-500/10 p-3">
              <FileText className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </GlassPanel>

        {/* Strategies */}
        <GlassPanel>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Strategies
              </p>
              <p className="mt-2 text-3xl font-bold text-white">15</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-400">
                5 recommendations
              </span>
            </div>
            <div className="rounded-xl bg-violet-500/10 p-3">
              <TrendingUp className="h-6 w-6 text-violet-400" />
            </div>
          </div>
        </GlassPanel>

        {/* Review Score */}
        <GlassPanel>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Review Score
              </p>
              <p className="mt-2 text-3xl font-bold text-white">85/100</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-0.5 text-xs font-medium text-orange-400">
                Up 8 points
              </span>
            </div>
            <ProgressRing value={85} max={100} />
          </div>
        </GlassPanel>
      </motion.div>

      {/* ─── Chart + Activity ─── */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Tax Savings Overview */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={2}
          variants={fadeIn}
          className="lg:col-span-3"
        >
          <GlassPanel>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Tax Savings Overview
              </h3>
              <div className="flex gap-1 rounded-lg bg-[#1F1F25] p-1">
                {(["12M", "6M", "3M"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setTimeFilter(f)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      timeFilter === f
                        ? "bg-orange-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <SavingsChart />
          </GlassPanel>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={3}
          variants={fadeIn}
          className="lg:col-span-2"
        >
          <GlassPanel className="h-full">
            <h3 className="mb-5 text-lg font-semibold text-white">
              Recent Activity
            </h3>
            <div className="relative space-y-6">
              {/* Vertical timeline line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-800" />

              {recentActivity.map((item) => (
                <div key={item.id} className="relative flex gap-4 pl-6">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-0 top-1 h-[14px] w-[14px] rounded-full ${item.dotColor} ring-4 ring-[#1B1B20] flex items-center justify-center`}
                  >
                    {item.id === 1 && (
                      <CheckCircle className="h-2.5 w-2.5 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-200">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500">{item.detail}</p>
                    <p className="mt-1 text-[11px] text-slate-600">
                      {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </motion.div>
      </div>

      {/* ─── Intelligent Actions ─── */}
      <motion.div initial="hidden" animate="visible" custom={4} variants={fadeIn}>
        <h3 className="mb-4 text-lg font-semibold text-white">
          Intelligent Actions
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((action) => (
            <ActionButton key={action.label} item={action} />
          ))}
        </div>
      </motion.div>

      {/* ─── Footer ─── */}
      <motion.footer
        initial="hidden"
        animate="visible"
        custom={5}
        variants={fadeIn}
        className="mt-12 border-t border-white/[0.05] bg-[rgba(27,27,32,0.6)] backdrop-blur-[16px]"
        style={{ marginLeft: "-1rem", marginRight: "-1rem", marginBottom: "-1rem", padding: "0" }}
      >
        <div className="px-4 pt-12 pb-6 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Link href="/" className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-600 to-orange-400">
                  <span className="text-sm font-extrabold text-white">AG</span>
                </div>
                <span className="text-xl font-bold tracking-tight text-white">
                  AG <span className="text-orange-500">FinTax</span>
                </span>
              </Link>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/50">
                Financial &amp; Tax Services for the Dynamic Business Owners.
                AI-powered tax planning and optimization.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/70">
                Quick Links
              </h4>
              <ul className="space-y-2.5">
                {["Features", "How it Works", "Pricing", "About"].map(
                  (link) => (
                    <li key={link}>
                      <a
                        href={`/#${link.toLowerCase().replace(/ /g, "-")}`}
                        className="text-sm text-white/50 transition-colors hover:text-orange-500"
                      >
                        {link}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/70">
                Legal
              </h4>
              <ul className="space-y-2.5">
                {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(
                  (link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-white/50 transition-colors hover:text-orange-500"
                      >
                        {link}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/70">
                Contact
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href="tel:425-395-4318"
                    className="text-sm text-white/50 transition-colors hover:text-orange-500"
                  >
                    425-395-4318
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:hello@agfintax.com"
                    className="text-sm text-white/50 transition-colors hover:text-orange-500"
                  >
                    hello@agfintax.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
            <p className="text-sm text-white/40">
              &copy; {new Date().getFullYear()} AG FinTax. All rights reserved.
            </p>
            <p className="text-sm text-white/40">
              Built &amp; Powered by{" "}
              <a
                href="https://loukriai.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-orange-500 transition-colors hover:text-orange-400"
              >
                LoukriAI.com
              </a>
            </p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
