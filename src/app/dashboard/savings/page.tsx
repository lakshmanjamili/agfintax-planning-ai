"use client";

import Link from "next/link";

export default function SavingsPage() {
  return (
    <div className="min-h-screen bg-[#131318] text-[#E4E1E9]">
      {/* Editorial Header */}
      <header className="px-8 pt-16 pb-12 max-w-7xl mx-auto">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-extrabold tracking-[0.3em] text-[#FFB596] uppercase mb-6">
              FISCAL EFFICIENCY REPORT &bull; Q4 2024
            </p>
            <h1 className="text-6xl font-extrabold tracking-tighter leading-[1.05]">
              Premium Savings
              <br />
              <span className="text-[#908F9C]">Analysis Dashboard.</span>
            </h1>
          </div>
          <div className="text-right pt-2">
            <p className="text-xs text-[#908F9C] mb-2">Last architected: Oct 24, 2024</p>
            <div className="flex items-center justify-end gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs text-[#C7C5D3]">AI Engine Active</span>
            </div>
          </div>
        </div>
      </header>

      <div className="px-8 max-w-7xl mx-auto space-y-8 pb-16">
        {/* Summary Grid - 4 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Savings */}
          <div className="relative overflow-hidden rounded-2xl p-8" style={{ background: "rgba(31,31,37,0.6)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="text-[10px] font-extrabold tracking-[0.2em] text-[#908F9C] uppercase mb-3">Total Savings</p>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-4xl font-extrabold tracking-tight">$47,250</span>
              <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full mb-1">+12%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/5">
              <div className="h-full rounded-full w-[72%]" style={{ background: "linear-gradient(90deg, #DC5700, #FFB596)" }}></div>
            </div>
          </div>

          {/* Current Liability */}
          <div className="relative overflow-hidden rounded-2xl p-8" style={{ background: "rgba(31,31,37,0.6)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="text-[10px] font-extrabold tracking-[0.2em] text-[#908F9C] uppercase mb-3">Current Liability</p>
            <span className="text-4xl font-extrabold tracking-tight block mb-3">$68,500</span>
            <span className="text-[10px] font-extrabold tracking-[0.15em] text-[#FFB4AB]">REQUIRES MITIGATION</span>
          </div>

          {/* Optimized */}
          <div className="relative overflow-hidden rounded-2xl p-8 border-l-4 border-[#FFB596]" style={{ background: "rgba(31,31,37,0.6)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="text-[10px] font-extrabold tracking-[0.2em] text-[#908F9C] uppercase mb-3">Optimized</p>
            <span className="text-4xl font-extrabold tracking-tight text-[#FFB596] block mb-3">$21,250</span>
            <span className="text-[10px] font-extrabold tracking-[0.15em] text-[#FFB596]/60">EFFECTIVE REDUCTION</span>
          </div>

          {/* Savings Rate */}
          <div className="relative overflow-hidden rounded-2xl p-8" style={{ background: "rgba(31,31,37,0.6)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="text-[10px] font-extrabold tracking-[0.2em] text-[#908F9C] uppercase mb-3">Savings Rate</p>
            <div className="flex items-center gap-5">
              <span className="text-4xl font-extrabold tracking-tight">31%</span>
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                <circle
                  cx="24" cy="24" r="20" fill="none"
                  stroke="#FFB596" strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={`${0.31 * 2 * Math.PI * 20} ${2 * Math.PI * 20}`}
                  className="animate-spin-slow"
                  style={{ animation: "spin 8s linear infinite" }}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Main 12-col grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left column - col-span-8 */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* 12-Month Projection */}
            <div className="rounded-3xl p-10" style={{ background: "rgba(31,31,37,0.6)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-xl font-bold tracking-tight mb-1">12-Month Projection</h2>
                  <p className="text-sm text-[#908F9C]">Predictive modeling of tax-efficient wealth growth</p>
                </div>
                <div className="flex items-center gap-5 text-xs text-[#C7C5D3]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#FFB596]"></span>
                    With Planning
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#908F9C]"></span>
                    Without
                  </span>
                </div>
              </div>

              <div className="mt-8">
                <svg viewBox="0 0 700 260" className="w-full" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(220,87,0,0.4)" />
                      <stop offset="100%" stopColor="rgba(220,87,0,0)" />
                    </linearGradient>
                  </defs>

                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4].map((i) => (
                    <line key={i} x1="40" y1={30 + i * 50} x2="680" y2={30 + i * 50} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                  ))}

                  {/* Y-axis labels */}
                  <text x="30" y="35" textAnchor="end" className="fill-[#908F9C] text-[9px]">$70k</text>
                  <text x="30" y="85" textAnchor="end" className="fill-[#908F9C] text-[9px]">$55k</text>
                  <text x="30" y="135" textAnchor="end" className="fill-[#908F9C] text-[9px]">$40k</text>
                  <text x="30" y="185" textAnchor="end" className="fill-[#908F9C] text-[9px]">$25k</text>
                  <text x="30" y="235" textAnchor="end" className="fill-[#908F9C] text-[9px]">$10k</text>

                  {/* Orange gradient fill area (With Planning) */}
                  <path
                    d="M 40,160 C 120,155 200,140 280,120 C 360,100 440,80 520,55 C 580,38 640,28 680,20 L 680,230 L 40,230 Z"
                    fill="url(#areaGrad)"
                  />

                  {/* With Planning line (orange) */}
                  <path
                    d="M 40,160 C 120,155 200,140 280,120 C 360,100 440,80 520,55 C 580,38 640,28 680,20"
                    fill="none" stroke="#FFB596" strokeWidth="2.5" strokeLinecap="round"
                  />

                  {/* Without Planning line (dashed gray) */}
                  <path
                    d="M 40,130 C 120,128 200,125 280,123 C 360,120 440,118 520,115 C 580,113 640,110 680,108"
                    fill="none" stroke="#908F9C" strokeWidth="1.5" strokeDasharray="6 4" strokeLinecap="round"
                  />

                  {/* X-axis labels */}
                  <text x="40" y="252" textAnchor="middle" className="fill-[#908F9C] text-[10px]">Jan</text>
                  <text x="200" y="252" textAnchor="middle" className="fill-[#908F9C] text-[10px]">Mar</text>
                  <text x="360" y="252" textAnchor="middle" className="fill-[#908F9C] text-[10px]">Jun</text>
                  <text x="520" y="252" textAnchor="middle" className="fill-[#908F9C] text-[10px]">Sep</text>
                  <text x="680" y="252" textAnchor="middle" className="fill-[#908F9C] text-[10px]">Dec</text>
                </svg>
              </div>
            </div>

            {/* Two charts side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Savings by Category */}
              <div className="rounded-3xl p-8" style={{ background: "rgba(31,31,37,0.6)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                <h3 className="text-lg font-bold tracking-tight mb-6">Savings by Category</h3>
                <div className="space-y-5">
                  {/* Business Expense */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm text-[#C7C5D3]">Business Expense</span>
                      <span className="text-sm font-semibold text-[#E4E1E9]">$18.2k</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-[#FFB596]" style={{ width: "85%" }}></div>
                    </div>
                  </div>
                  {/* Retirement (401k) */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm text-[#C7C5D3]">Retirement (401k)</span>
                      <span className="text-sm font-semibold text-[#E4E1E9]">$12.5k</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-[#FFB596]/60" style={{ width: "60%" }}></div>
                    </div>
                  </div>
                  {/* R&D Tax Credit */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm text-[#C7C5D3]">R&D Tax Credit</span>
                      <span className="text-sm font-semibold text-[#E4E1E9]">$9.8k</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-[#FFB596]/40" style={{ width: "45%" }}></div>
                    </div>
                  </div>
                  {/* Depreciation */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm text-[#C7C5D3]">Depreciation</span>
                      <span className="text-sm font-semibold text-[#E4E1E9]">$6.7k</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-[#FFB596]/20" style={{ width: "30%" }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Strategy Distribution - Donut */}
              <div className="rounded-3xl p-8 flex flex-col items-center justify-center" style={{ background: "rgba(31,31,37,0.6)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                <h3 className="text-lg font-bold tracking-tight mb-6 self-start">Strategy Distribution</h3>
                <div className="relative">
                  <svg viewBox="0 0 120 120" className="w-40 h-40">
                    {/* Background circle */}
                    <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
                    {/* Segments using stroke-dasharray */}
                    {/* Total circumference = 2 * PI * 48 = ~301.6 */}
                    {/* Active: 38% = 114.6 */}
                    <circle
                      cx="60" cy="60" r="48" fill="none"
                      stroke="#FFB596" strokeWidth="12" strokeLinecap="butt"
                      strokeDasharray="114.6 187"
                      strokeDashoffset="75.4"
                      className="-rotate-90 origin-center"
                    />
                    {/* Pending: 24% = 72.4 */}
                    <circle
                      cx="60" cy="60" r="48" fill="none"
                      stroke="#DC5700" strokeWidth="12" strokeLinecap="butt"
                      strokeDasharray="72.4 229.2"
                      strokeDashoffset={75.4 - 114.6}
                      className="-rotate-90 origin-center"
                    />
                    {/* Optimized: 22% = 66.4 */}
                    <circle
                      cx="60" cy="60" r="48" fill="none"
                      stroke="#4CD6FB" strokeWidth="12" strokeLinecap="butt"
                      strokeDasharray="66.4 235.2"
                      strokeDashoffset={75.4 - 114.6 - 72.4}
                      className="-rotate-90 origin-center"
                    />
                    {/* Manual: 16% = 48.3 */}
                    <circle
                      cx="60" cy="60" r="48" fill="none"
                      stroke="#908F9C" strokeWidth="12" strokeLinecap="butt"
                      strokeDasharray="48.3 253.3"
                      strokeDashoffset={75.4 - 114.6 - 72.4 - 66.4}
                      className="-rotate-90 origin-center"
                    />
                  </svg>
                  {/* Center text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold tracking-tight">84%</span>
                    <span className="text-[9px] font-extrabold tracking-[0.2em] text-[#908F9C] uppercase">Efficiency</span>
                  </div>
                </div>
                {/* Legend */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-6 text-xs text-[#C7C5D3]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#FFB596]"></span>
                    Active
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#DC5700]"></span>
                    Pending
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#4CD6FB]"></span>
                    Optimized
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#908F9C]"></span>
                    Manual
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - col-span-4 */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Recommended Actions */}
            <div className="rounded-3xl p-8 h-full flex flex-col" style={{ background: "rgba(31,31,37,0.6)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <h3 className="text-lg font-bold tracking-tight mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#FFB596]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                </svg>
                Recommended Actions
              </h3>

              <div className="space-y-6 flex-1">
                {/* Action 1 - High Priority */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-extrabold tracking-[0.15em] text-[#FFB4AB] bg-[#93000A]/30 px-2 py-0.5 rounded">HIGH PRIORITY</span>
                    <span className="text-xs font-semibold text-[#E4E1E9] ml-auto">$8,450 Est.</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#E4E1E9] mb-1">Implement Augusta Rule</h4>
                  <p className="text-xs text-[#908F9C] leading-relaxed">Rent personal residence for business meetings to generate tax-free rental income.</p>
                  <div className="border-b border-white/5 mt-5"></div>
                </div>

                {/* Action 2 - Medium Priority */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-extrabold tracking-[0.15em] text-[#FFB596] bg-[#FFB596]/10 px-2 py-0.5 rounded">MEDIUM PRIORITY</span>
                    <span className="text-xs font-semibold text-[#E4E1E9] ml-auto">$4,200 Est.</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#E4E1E9] mb-1">Section 179 Acceleration</h4>
                  <p className="text-xs text-[#908F9C] leading-relaxed">Accelerate equipment deduction to maximize current year tax benefit.</p>
                  <div className="border-b border-white/5 mt-5"></div>
                </div>

                {/* Action 3 - Low Priority */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-extrabold tracking-[0.15em] text-[#4CD6FB] bg-[#4CD6FB]/10 px-2 py-0.5 rounded">LOW PRIORITY</span>
                    <span className="text-xs font-semibold text-[#E4E1E9] ml-auto">$1,850 Est.</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#E4E1E9] mb-1">Charitable Contribution Bunching</h4>
                  <p className="text-xs text-[#908F9C] leading-relaxed">Leverage donor-advised fund to bunch multi-year charitable deductions.</p>
                  <div className="border-b border-white/5 mt-5"></div>
                </div>
              </div>

              {/* AI Architect Insight */}
              <div className="mt-6 rounded-2xl p-6 bg-[#0E0E13] border border-[#FFB596]/10">
                <p className="text-[9px] font-extrabold tracking-[0.2em] text-[#FFB596] uppercase mb-3">AI Architect Insight</p>
                <p className="text-sm text-[#C7C5D3] italic leading-relaxed mb-4">
                  &ldquo;Based on your current income structure, an S-Corp election could save approximately $12,400 in self-employment taxes annually.&rdquo;
                </p>
                <button className="w-full py-3 rounded-xl text-sm font-bold bg-[#FFB596]/10 text-[#FFB596] hover:bg-[#FFB596]/20 transition-colors">
                  Generate Strategy PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-8">
        <div className="max-w-7xl mx-auto px-8 py-8 flex items-center justify-between">
          <p className="text-xs text-[#908F9C]">&copy; 2024 AgFinTax Planning AI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-xs text-[#908F9C] hover:text-[#C7C5D3] transition-colors">Privacy</Link>
            <Link href="#" className="text-xs text-[#908F9C] hover:text-[#C7C5D3] transition-colors">Terms</Link>
            <Link href="#" className="text-xs text-[#908F9C] hover:text-[#C7C5D3] transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
