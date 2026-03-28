"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  User,
  DollarSign,
  Building2,
  MapPin,
  Target,
  Save,
} from "lucide-react";

const incomeSources = ["W-2", "Self-Employment", "Rental", "Investment", "Other"];
const businessTypes = ["S-Corp", "LLC", "C-Corp", "Sole Prop", "Partnership"];
const planningPriorities = [
  "Minimize Tax",
  "Maximize Deductions",
  "Retirement Planning",
  "Estate Planning",
  "Business Growth",
];

function estimateBracket(income: number): string {
  if (income <= 11600) return "10%";
  if (income <= 47150) return "12%";
  if (income <= 100525) return "22%";
  if (income <= 191950) return "24%";
  if (income <= 243725) return "32%";
  if (income <= 609350) return "35%";
  return "37%";
}

function estimateSavings(income: number): string {
  if (income <= 50000) return "$3,000 - $8,000";
  if (income <= 100000) return "$8,000 - $20,000";
  if (income <= 250000) return "$20,000 - $50,000";
  if (income <= 500000) return "$50,000 - $100,000";
  return "$100,000+";
}

export default function ProfilePage() {
  const { user } = useUser();

  const [phone, setPhone] = useState("");
  const [filingStatus, setFilingStatus] = useState("single");
  const [annualIncome, setAnnualIncome] = useState("");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [businessType, setBusinessType] = useState("");
  const [state, setState] = useState("");
  const [hasRealEstate, setHasRealEstate] = useState(false);
  const [hasBusinessIncome, setHasBusinessIncome] = useState(false);
  const [hasInternational, setHasInternational] = useState(false);
  const [dependents, setDependents] = useState("0");
  const [savingsTarget, setSavingsTarget] = useState("");
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);

  const incomeNum = parseInt(annualIncome.replace(/[^0-9]/g, "")) || 0;

  function toggleSource(source: string) {
    setSelectedSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  }

  function togglePriority(priority: string) {
    setSelectedPriorities((prev) =>
      prev.includes(priority) ? prev.filter((p) => p !== priority) : [...prev, priority]
    );
  }

  const completeness = Math.min(
    100,
    (phone ? 15 : 0) +
      (annualIncome ? 20 : 0) +
      (selectedSources.length > 0 ? 15 : 0) +
      (businessType ? 10 : 0) +
      (state ? 10 : 0) +
      (savingsTarget ? 15 : 0) +
      (selectedPriorities.length > 0 ? 15 : 0)
  );

  /* ── Reusable dark input classes ── */
  const inputClasses =
    "w-full bg-[#0E0E13] border-none rounded-lg px-4 py-2.5 text-sm text-[#E4E1E9] placeholder:text-[#464651] focus:outline-none focus:ring-1 focus:ring-[#4CD6FB]";
  const labelClasses = "text-xs font-medium text-[#C7C5D3] uppercase tracking-widest";

  /* ── Toggle component ── */
  function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
          checked ? "bg-[#DC5700]" : "bg-[#35343A]"
        }`}
      >
        <span
          className={`pointer-events-none inline-block w-5 h-5 transform rounded-full bg-[#E4E1E9] shadow transition-transform mt-0.5 ml-0.5 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* ── Editorial Header ── */}
      <div>
        <p className="text-xs font-medium text-[#4CD6FB] uppercase tracking-[0.2em] mb-2">
          CLIENT ARCHITECTURE
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight text-[#E4E1E9]">
          Financial Profile
        </h1>
        <p className="text-[#C7C5D3] mt-2 text-sm">
          Complete your profile for personalized tax strategies.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Main Form ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <h2 className="text-base font-bold text-[#E4E1E9] flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#4CD6FB]/10 flex items-center justify-center">
                <User className="w-4 h-4 text-[#4CD6FB]" />
              </div>
              Personal Information
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className={labelClasses}>Full Name</label>
                <input
                  value={user?.fullName || ""}
                  disabled
                  className={`${inputClasses} opacity-60 cursor-not-allowed`}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClasses}>Email</label>
                <input
                  value={user?.primaryEmailAddress?.emailAddress || ""}
                  disabled
                  className={`${inputClasses} opacity-60 cursor-not-allowed`}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClasses}>Phone</label>
                <input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClasses}>Filing Status</label>
                <select
                  value={filingStatus}
                  onChange={(e) => setFilingStatus(e.target.value)}
                  className={`${inputClasses} appearance-none cursor-pointer`}
                >
                  <option value="single">Single</option>
                  <option value="mfj">Married Filing Jointly (MFJ)</option>
                  <option value="mfs">Married Filing Separately (MFS)</option>
                  <option value="hoh">Head of Household (HoH)</option>
                  <option value="qss">Qualifying Surviving Spouse (QSS)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Income Info */}
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <h2 className="text-base font-bold text-[#E4E1E9] flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#FFB596]/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-[#FFB596]" />
              </div>
              Income Information
            </h2>
            <div className="space-y-1.5">
              <label className={labelClasses}>Annual Income</label>
              <input
                type="text"
                placeholder="$150,000"
                value={annualIncome}
                onChange={(e) => setAnnualIncome(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClasses}>Income Sources</label>
              <div className="flex flex-wrap gap-2">
                {incomeSources.map((source) => (
                  <button
                    key={source}
                    type="button"
                    onClick={() => toggleSource(source)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      selectedSources.includes(source)
                        ? "bg-[#DC5700] text-white"
                        : "bg-[#2A292F] text-[#C7C5D3] hover:bg-[#35343A]"
                    }`}
                  >
                    {source}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={labelClasses}>Business Type</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className={`${inputClasses} appearance-none cursor-pointer`}
              >
                <option value="">Select business type</option>
                {businessTypes.map((type) => (
                  <option key={type} value={type.toLowerCase().replace(/[- ]/g, "_")}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tax Situation */}
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <h2 className="text-base font-bold text-[#E4E1E9] flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#BFC2FF]/10 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-[#BFC2FF]" />
              </div>
              Tax Situation
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className={labelClasses}>State of Residence</label>
                <input
                  placeholder="e.g., California"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClasses}>Number of Dependents</label>
                <input
                  type="number"
                  min="0"
                  value={dependents}
                  onChange={(e) => setDependents(e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className={labelClasses}>Applicable Situations</label>
              {[
                { label: "Has real estate / rental property", value: hasRealEstate, setter: setHasRealEstate },
                { label: "Has business income", value: hasBusinessIncome, setter: setHasBusinessIncome },
                { label: "Has international income", value: hasInternational, setter: setHasInternational },
              ].map((toggle) => (
                <div
                  key={toggle.label}
                  className="flex items-center justify-between rounded-xl bg-[#1B1B20] p-4"
                >
                  <span className="text-sm text-[#E4E1E9]">{toggle.label}</span>
                  <Toggle checked={toggle.value} onChange={(v) => toggle.setter(v)} />
                </div>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <h2 className="text-base font-bold text-[#E4E1E9] flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#FFB596]/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-[#FFB596]" />
              </div>
              Goals
            </h2>
            <div className="space-y-1.5">
              <label className={labelClasses}>Tax Savings Target</label>
              <input
                type="text"
                placeholder="$25,000"
                value={savingsTarget}
                onChange={(e) => setSavingsTarget(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClasses}>Planning Priorities</label>
              <div className="flex flex-wrap gap-2">
                {planningPriorities.map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => togglePriority(priority)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      selectedPriorities.includes(priority)
                        ? "bg-[#3B418F] text-[#BFC2FF]"
                        : "bg-[#2A292F] text-[#C7C5D3] hover:bg-[#35343A]"
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>
            <button className="w-full flex items-center justify-center gap-2 bg-[#DC5700] hover:bg-[#DC5700]/90 text-white px-5 py-3 rounded-xl text-sm font-bold transition-colors mt-2">
              <Save className="w-4 h-4" />
              Save Profile
            </button>
          </div>
        </div>

        {/* ── Side Panel ── */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 sticky top-6 space-y-5">
            <h2 className="text-base font-bold text-[#E4E1E9]">Your Tax Summary</h2>

            <div className="rounded-xl bg-[#1B1B20] p-5 space-y-4">
              <div>
                <p className="text-xs font-medium text-[#C7C5D3] uppercase tracking-widest">
                  Estimated Tax Bracket
                </p>
                <p className="text-2xl font-extrabold text-[#E4E1E9]">
                  {incomeNum > 0 ? estimateBracket(incomeNum) : "--"}
                </p>
              </div>
              <div className="border-t border-[#35343A]/50 pt-4">
                <p className="text-xs font-medium text-[#C7C5D3] uppercase tracking-widest">
                  Potential Savings Range
                </p>
                <p className="text-lg font-bold text-[#FFB596]">
                  {incomeNum > 0 ? estimateSavings(incomeNum) : "Enter income"}
                </p>
              </div>
              <div className="border-t border-[#35343A]/50 pt-4">
                <p className="text-xs font-medium text-[#C7C5D3] uppercase tracking-widest">Filing Status</p>
                <p className="text-sm font-medium text-[#E4E1E9] capitalize">
                  {filingStatus === "mfj"
                    ? "Married Filing Jointly"
                    : filingStatus === "mfs"
                      ? "Married Filing Separately"
                      : filingStatus === "hoh"
                        ? "Head of Household"
                        : filingStatus === "qss"
                          ? "Qualifying Surviving Spouse"
                          : "Single"}
                </p>
              </div>
              <div className="border-t border-[#35343A]/50 pt-4">
                <p className="text-xs font-medium text-[#C7C5D3] uppercase tracking-widest">
                  Income Sources
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedSources.length > 0 ? (
                    selectedSources.map((s) => (
                      <span
                        key={s}
                        className="text-xs font-medium text-[#BFC2FF] bg-[#3B418F]/30 px-2 py-0.5 rounded-full"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-[#C7C5D3]">None selected</span>
                  )}
                </div>
              </div>
            </div>

            {/* Completeness */}
            <div className="rounded-xl bg-[#DC5700]/10 p-5 text-center">
              <p className="text-xs font-medium text-[#FFB596] uppercase tracking-widest mb-1">
                Profile Completeness
              </p>
              <p className="text-3xl font-extrabold text-[#FFB596]">{completeness}%</p>
              <div className="mt-3 h-1.5 rounded-full bg-[#2A292F] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#FFB596] transition-all duration-500"
                  style={{ width: `${completeness}%` }}
                />
              </div>
              <p className="text-xs text-[#C7C5D3] mt-2">
                Complete your profile for better recommendations
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
