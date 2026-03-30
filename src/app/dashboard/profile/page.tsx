"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  DollarSign,
  Building2,
  MapPin,
  Target,
  Save,
  CheckCircle2,
  Mic,
  MicOff,
  Upload,
  FileText,
  Sparkles,
  ArrowRight,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  Home,
  PiggyBank,
  Heart,
  GraduationCap,
  TrendingUp,
  Shield,
  Globe,
  AlertCircle,
  X,
} from "lucide-react";
import {
  getClientProfile,
  saveClientProfile,
  createEmptyProfile,
  calculateProfileCompleteness,
  getEntityType,
  getEntityInfo,
  saveEntityType,
  buildComprehensiveSummary,
  mergeArraysUnique,
  ENTITY_TYPES,
  type ClientProfile,
  type EntityType,
} from "@/lib/tax/plan-store";

/* ─── Constants ─── */
const FILING_STATUSES = [
  { value: "single", label: "Single" },
  { value: "mfj", label: "Married Filing Jointly" },
  { value: "mfs", label: "Married Filing Separately" },
  { value: "hoh", label: "Head of Household" },
  { value: "qss", label: "Qualifying Surviving Spouse" },
];

const INCOME_SOURCES = ["W-2", "Self-Employment", "Rental", "Investment", "Retirement", "Other"];

const RETIREMENT_TYPES = ["401(k)", "Traditional IRA", "Roth IRA", "SEP IRA", "Solo 401(k)", "Pension", "403(b)"];

const PLANNING_PRIORITIES = [
  "Minimize Tax Liability",
  "Maximize Deductions",
  "Retirement Planning",
  "Business Optimization",
  "Estate Planning",
  "Real Estate Strategies",
];

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware",
  "Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky",
  "Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi",
  "Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico",
  "New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania",
  "Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont",
  "Virginia","Washington","West Virginia","Wisconsin","Wyoming",
];

/* ─── Animation ─── */
const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.3 } },
};

/* ─── Steps ─── */
const STEPS = [
  { id: "entity", label: "Entity Type", icon: Building2 },
  { id: "personal", label: "Personal Info", icon: User },
  { id: "income", label: "Income", icon: DollarSign },
  { id: "financial", label: "Financial", icon: TrendingUp },
  { id: "goals", label: "Goals", icon: Target },
  { id: "upload", label: "Tax Return", icon: Upload },
];

/* ─── Glass Panel ─── */
function GlassPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/[0.05] bg-[rgba(27,27,32,0.6)] p-6 backdrop-blur-[16px] ${className}`}>
      {children}
    </div>
  );
}

/* ─── Toggle ─── */
function Toggle({ checked, onChange, color }: { checked: boolean; onChange: (v: boolean) => void; color: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors"
      style={{ backgroundColor: checked ? color : "#35343A" }}
    >
      <span
        className={`pointer-events-none inline-block w-5 h-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ml-0.5 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/* ─── Pill Toggle (multi-select) ─── */
function PillSelect({
  options,
  selected,
  onToggle,
  color,
}: {
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
  color: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isActive = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className="rounded-full px-3.5 py-1.5 text-sm font-medium transition-all"
            style={
              isActive
                ? { backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }
                : { backgroundColor: "rgba(42,41,47,0.8)", color: "#94A3B8", border: "1px solid transparent" }
            }
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   BUILD MY PROFILE PAGE
   ════════════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const { user } = useUser();
  const [profile, setProfile] = useState<ClientProfile>(createEmptyProfile());
  const [currentStep, setCurrentStep] = useState(0);
  const [saved, setSaved] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceField, setVoiceField] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "processing" | "done" | "error">("idle");
  const [ocrSuggestions, setOcrSuggestions] = useState<string[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<string>("tax-return");
  const recognitionRef = useRef<ReturnType<typeof Object> | null>(null);

  // Load saved profile on mount
  useEffect(() => {
    const saved = getClientProfile();
    if (saved) {
      setProfile(saved);
    } else {
      const entity = getEntityType();
      if (entity) {
        setProfile((p) => ({ ...p, entityType: entity }));
      }
    }
  }, []);

  const entityInfo = profile.entityType ? getEntityInfo(profile.entityType) : null;
  const accentColor = entityInfo?.color || "#DC5700";
  const completeness = calculateProfileCompleteness(profile);

  // Update helper
  const updateProfile = useCallback((updates: Partial<ClientProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      return next;
    });
    setSaved(false);
  }, []);

  // Toggle array item
  const toggleArrayItem = useCallback((field: keyof ClientProfile, value: string) => {
    setProfile((prev) => {
      const arr = prev[field] as string[];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...prev, [field]: next };
    });
    setSaved(false);
  }, []);

  // Save profile
  const handleSave = useCallback(() => {
    saveClientProfile(profile);
    if (profile.entityType) {
      saveEntityType(profile.entityType);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, [profile]);

  // Voice input
  const startVoiceForField = useCallback((field: string) => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input not supported. Try Chrome.");
      return;
    }

    if (isVoiceActive && recognitionRef.current) {
      (recognitionRef.current as any).stop();
      recognitionRef.current = null;
      setIsVoiceActive(false);
      setVoiceField(null);
      return;
    }

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      updateProfile({ [field]: transcript } as Partial<ClientProfile>);
      setIsVoiceActive(false);
      setVoiceField(null);
    };

    recognition.onerror = () => {
      setIsVoiceActive(false);
      setVoiceField(null);
    };

    recognition.onend = () => {
      setIsVoiceActive(false);
      setVoiceField(null);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsVoiceActive(true);
    setVoiceField(field);
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }, [isVoiceActive, updateProfile]);

  // OCR Upload — merges data from each document into the profile
  const handleOcrUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    setIsUploading(true);
    setUploadStatus("uploading");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", profile.entityType);
      formData.append("documentType", selectedDocType);

      setUploadStatus("processing");

      const res = await fetch("/api/profile-ocr", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("OCR processing failed");

      const data = await res.json();
      setUploadStatus("done");

      const fields = data.extractedFields || {};
      const updates: Partial<ClientProfile> = {};

      // --- Core fields: tax return overrides, other docs fill gaps ---
      const isTaxReturn = selectedDocType === "tax-return";

      if (fields.occupation && (isTaxReturn || !profile.occupation)) updates.occupation = fields.occupation;
      if (fields.filingStatus && (isTaxReturn || !profile.filingStatus)) updates.filingStatus = fields.filingStatus;
      if (fields.annualIncome && (isTaxReturn || !profile.annualIncome)) updates.annualIncome = fields.annualIncome;
      if (typeof fields.dependents === "number" && (isTaxReturn || profile.dependents === 0)) updates.dependents = fields.dependents;
      if (fields.state && (isTaxReturn || !profile.state)) updates.state = fields.state;
      if (fields.businessName && (isTaxReturn || !profile.businessName)) updates.businessName = fields.businessName;
      if (fields.businessIncome && (isTaxReturn || !profile.businessIncome)) updates.businessIncome = fields.businessIncome;

      // --- Arrays: MERGE (accumulate from multiple docs) ---
      if (Array.isArray(fields.incomeSources) && fields.incomeSources.length > 0) {
        updates.incomeSources = mergeArraysUnique(profile.incomeSources, fields.incomeSources);
      }
      if (Array.isArray(fields.retirementAccountTypes) && fields.retirementAccountTypes.length > 0) {
        updates.retirementAccountTypes = mergeArraysUnique(profile.retirementAccountTypes, fields.retirementAccountTypes);
        updates.hasRetirementAccounts = true;
      }

      // --- Boolean flags: only turn ON (never turn off from a new doc) ---
      if (fields.hasRealEstate === true) updates.hasRealEstate = true;
      if (fields.hasBusinessIncome === true) updates.hasBusinessIncome = true;
      if (fields.hasMortgage === true) updates.hasMortgage = true;
      if (fields.hasRetirementAccounts === true) updates.hasRetirementAccounts = true;
      if (fields.hasInvestments === true) updates.hasInvestments = true;
      if (fields.hasCharitableGiving === true) updates.hasCharitableGiving = true;
      if (fields.hasHealthInsurance === true) updates.hasHealthInsurance = true;
      if (fields.hasStudentLoans === true) updates.hasStudentLoans = true;

      // --- OCR summary: latest tax return wins, others append ---
      if (data.summary) {
        if (isTaxReturn) {
          updates.ocrSummary = data.summary;
        } else if (profile.ocrSummary) {
          // Keep tax return summary, new doc insights go to document history
        } else {
          updates.ocrSummary = data.summary;
        }
      }

      // --- Extracted fields: MERGE (accumulate all financial fields) ---
      const ocrFields: Record<string, string> = { ...profile.ocrExtractedFields };
      if (fields.annualIncome) ocrFields["Total Income / AGI"] = fields.annualIncome;
      if (fields.agi) ocrFields["Adjusted Gross Income"] = fields.agi;
      if (fields.taxableIncome) ocrFields["Taxable Income"] = fields.taxableIncome;
      if (fields.totalDeductions) ocrFields["Total Deductions"] = fields.totalDeductions;
      if (fields.taxWithheld) ocrFields["Federal Tax Withheld"] = fields.taxWithheld;
      if (fields.taxOwed) ocrFields["Tax Owed / Refund"] = fields.taxOwed;
      if (fields.effectiveRate) ocrFields["Effective Tax Rate"] = fields.effectiveRate;
      if (fields.stateIncomeTax) ocrFields["State Income Tax"] = fields.stateIncomeTax;
      if (Array.isArray(fields.schedulesPresent) && fields.schedulesPresent.length > 0) {
        const existing = (ocrFields["Schedules Filed"] || "").split(", ").filter(Boolean);
        ocrFields["Schedules Filed"] = mergeArraysUnique(existing, fields.schedulesPresent).join(", ");
      }
      if (Array.isArray(fields.creditsUsed) && fields.creditsUsed.length > 0) {
        const existing = (ocrFields["Credits Used"] || "").split(", ").filter(Boolean);
        ocrFields["Credits Used"] = mergeArraysUnique(existing, fields.creditsUsed).join(", ");
      }
      // Add document-type-specific fields (W-2 wages, 1099 amounts, etc.)
      for (const [key, val] of Object.entries(fields)) {
        if (typeof val === "string" && val && !["occupation", "filingStatus", "annualIncome", "state", "businessName", "businessIncome", "agi", "taxableIncome", "totalDeductions", "taxWithheld", "taxOwed", "effectiveRate", "stateIncomeTax"].includes(key) && !Array.isArray(fields[key]) && typeof fields[key] !== "boolean") {
          const label = `${selectedDocType.toUpperCase()} — ${key.replace(/([A-Z])/g, " $1").trim()}`;
          ocrFields[label] = val;
        }
      }
      updates.ocrExtractedFields = ocrFields;

      // --- Track this document in upload history ---
      const docRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fileName: file.name,
        documentType: selectedDocType,
        uploadedAt: new Date().toISOString(),
        summary: data.summary || "",
        extractedFields: Object.fromEntries(
          Object.entries(fields).filter(([, v]) => typeof v === "string" || typeof v === "number").map(([k, v]) => [k, String(v)])
        ),
        keyFindings: [...(data.keyFindings || []), ...(data.profileSuggestions || [])],
      };
      updates.uploadedDocuments = [...(profile.uploadedDocuments || []), docRecord];

      console.log(`=== DOCUMENT MERGED: ${selectedDocType} (${file.name}) ===`);
      console.log("Documents now:", updates.uploadedDocuments.length);
      console.log("Profile updates:", updates);

      // Apply all updates
      updateProfile(updates);

      // Rebuild comprehensive summary after merge
      const updatedProfile = { ...profile, ...updates };
      const summary = buildComprehensiveSummary(updatedProfile as ClientProfile);
      updateProfile({ comprehensiveSummary: summary });
      console.log("Comprehensive summary rebuilt:", summary.length, "chars");

      // Show suggestions
      const allSuggestions = [...(data.profileSuggestions || []), ...(data.keyFindings || [])];
      if (allSuggestions.length > 0) {
        setOcrSuggestions(allSuggestions);
      }
    } catch (err) {
      console.error("OCR upload error:", err);
      setUploadStatus("error");
    } finally {
      setIsUploading(false);
    }
  }, [profile, selectedDocType, updateProfile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleOcrUpload,
    accept: { "application/pdf": [".pdf"], "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] },
    maxSize: 25 * 1024 * 1024,
    maxFiles: 1,
  });

  // Navigation
  const canGoNext = currentStep < STEPS.length - 1;
  const canGoPrev = currentStep > 0;

  /* ─── Input classes ─── */
  const inputClasses = "w-full rounded-xl border border-white/[0.05] bg-[rgba(15,15,20,0.8)] px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-opacity-30 transition";
  const labelClasses = "text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5 block";

  /* ─── Voice button helper ─── */
  const VoiceBtn = ({ field }: { field: string }) => (
    <button
      type="button"
      onClick={() => startVoiceForField(field)}
      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors"
      style={{ color: isVoiceActive && voiceField === field ? "#EF4444" : "#64748B" }}
      title="Voice input"
    >
      {isVoiceActive && voiceField === field ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white md:text-3xl">Build My Profile</h1>
            <p className="mt-1 text-slate-500">
              Complete your profile for personalized tax planning. Use the form, voice input, or upload a prior return.
            </p>
          </div>
          {saved && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 text-xs font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" /> Saved
            </span>
          )}
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* ─── Step Navigation (sidebar) ─── */}
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <GlassPanel className="lg:sticky lg:top-6">
            {/* Completeness */}
            <div className="mb-5 text-center">
              <div className="relative inline-flex">
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                  <circle
                    cx="40" cy="40" r="34"
                    fill="none"
                    stroke={accentColor}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 34}
                    strokeDashoffset={2 * Math.PI * 34 * (1 - completeness / 100)}
                    transform="rotate(-90 40 40)"
                    className="transition-all duration-700"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">
                  {completeness}%
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">Profile Completeness</p>
            </div>

            {/* Steps */}
            <nav className="space-y-1">
              {STEPS.map((step, i) => {
                const isActive = i === currentStep;
                const StepIcon = step.icon;
                return (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(i)}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all text-left"
                    style={
                      isActive
                        ? { backgroundColor: `${accentColor}15`, color: accentColor }
                        : { color: "#94A3B8" }
                    }
                  >
                    <StepIcon className="h-4 w-4 shrink-0" />
                    {step.label}
                    {isActive && <ChevronRight className="h-3.5 w-3.5 ml-auto" />}
                  </button>
                );
              })}
            </nav>

            {/* Save + Smart Plan buttons */}
            <div className="mt-5 space-y-2">
              <button
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: accentColor }}
              >
                <Save className="h-4 w-4" />
                Save Profile
              </button>
              {completeness >= 50 && (
                <Link href="/dashboard/smart-plan">
                  <button className="w-full flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all hover:opacity-80"
                    style={{ borderColor: `${accentColor}30`, color: accentColor }}
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate Smart Plan
                  </button>
                </Link>
              )}
            </div>
          </GlassPanel>
        </motion.div>

        {/* ─── Step Content ─── */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {/* STEP 0: Entity Type */}
            {currentStep === 0 && (
              <motion.div key="entity" initial="hidden" animate="visible" exit="exit" variants={fadeIn}>
                <GlassPanel>
                  <h2 className="text-lg font-bold text-white mb-1">Select Your Entity Type</h2>
                  <p className="text-sm text-slate-500 mb-5">This determines your tax form, strategies, and document requirements.</p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {ENTITY_TYPES.map((entity) => {
                      const isSelected = profile.entityType === entity.id;
                      return (
                        <button
                          key={entity.id}
                          onClick={() => updateProfile({ entityType: entity.id })}
                          className="text-left rounded-xl border p-4 transition-all"
                          style={
                            isSelected
                              ? { borderColor: `${entity.color}50`, backgroundColor: `${entity.color}08` }
                              : { borderColor: "rgba(255,255,255,0.05)", backgroundColor: "rgba(31,31,37,0.5)" }
                          }
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${entity.color}15` }}>
                              <Building2 className="h-4 w-4" style={{ color: entity.color }} />
                            </div>
                            <div>
                              <p className="text-sm font-bold" style={{ color: isSelected ? entity.color : "#E2E8F0" }}>{entity.label}</p>
                              <p className="text-[10px] text-slate-500">Form {entity.formNumber}</p>
                            </div>
                            {isSelected && <CheckCircle2 className="h-4 w-4 ml-auto" style={{ color: entity.color }} />}
                          </div>
                          <p className="text-xs text-slate-500">{entity.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {entity.features.slice(0, 2).map((f) => (
                              <span key={f} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.03] text-slate-500">
                                {f}
                              </span>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </GlassPanel>
              </motion.div>
            )}

            {/* STEP 1: Personal Info */}
            {currentStep === 1 && (
              <motion.div key="personal" initial="hidden" animate="visible" exit="exit" variants={fadeIn}>
                <GlassPanel>
                  <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <User className="h-5 w-5" style={{ color: accentColor }} />
                    Personal Information
                  </h2>
                  <p className="text-sm text-slate-500 mb-5">Basic info for your tax profile.</p>

                  <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelClasses}>Full Name</label>
                        <input value={user?.fullName || ""} disabled className={`${inputClasses} opacity-50 cursor-not-allowed`} />
                      </div>
                      <div>
                        <label className={labelClasses}>Email</label>
                        <input value={user?.primaryEmailAddress?.emailAddress || ""} disabled className={`${inputClasses} opacity-50 cursor-not-allowed`} />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelClasses}>Occupation</label>
                        <div className="relative">
                          <input
                            placeholder="e.g., Software Engineer, Business Owner"
                            value={profile.occupation}
                            onChange={(e) => updateProfile({ occupation: e.target.value })}
                            className={inputClasses}
                            style={{ borderColor: profile.occupation ? `${accentColor}20` : undefined }}
                          />
                          <VoiceBtn field="occupation" />
                        </div>
                      </div>
                      <div>
                        <label className={labelClasses}>Filing Status</label>
                        <select
                          value={profile.filingStatus}
                          onChange={(e) => updateProfile({ filingStatus: e.target.value })}
                          className={`${inputClasses} appearance-none cursor-pointer`}
                          style={{ borderColor: profile.filingStatus !== "single" ? `${accentColor}20` : undefined }}
                        >
                          {FILING_STATUSES.map((fs) => (
                            <option key={fs.value} value={fs.value}>{fs.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelClasses}>State of Residence</label>
                        <select
                          value={profile.state}
                          onChange={(e) => updateProfile({ state: e.target.value })}
                          className={`${inputClasses} appearance-none cursor-pointer`}
                          style={{ borderColor: profile.state ? `${accentColor}20` : undefined }}
                        >
                          <option value="">Select state</option>
                          {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClasses}>Number of Dependents</label>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={profile.dependents}
                          onChange={(e) => updateProfile({ dependents: parseInt(e.target.value) || 0 })}
                          className={inputClasses}
                        />
                      </div>
                    </div>
                  </div>
                </GlassPanel>
              </motion.div>
            )}

            {/* STEP 2: Income */}
            {currentStep === 2 && (
              <motion.div key="income" initial="hidden" animate="visible" exit="exit" variants={fadeIn}>
                <GlassPanel>
                  <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" style={{ color: accentColor }} />
                    Income Information
                  </h2>
                  <p className="text-sm text-slate-500 mb-5">Tell us about your income for tailored strategies.</p>

                  <div className="space-y-5">
                    <div>
                      <label className={labelClasses}>Annual Income</label>
                      <div className="relative">
                        <input
                          placeholder="$150,000"
                          value={profile.annualIncome}
                          onChange={(e) => updateProfile({ annualIncome: e.target.value })}
                          className={inputClasses}
                          style={{ borderColor: profile.annualIncome ? `${accentColor}20` : undefined }}
                        />
                        <VoiceBtn field="annualIncome" />
                      </div>
                    </div>

                    <div>
                      <label className={labelClasses}>Income Sources</label>
                      <PillSelect
                        options={INCOME_SOURCES}
                        selected={profile.incomeSources}
                        onToggle={(val) => toggleArrayItem("incomeSources", val)}
                        color={accentColor}
                      />
                    </div>

                    {/* Business details — show if business entity or business income source */}
                    {(profile.entityType !== "individual" || profile.incomeSources.includes("Self-Employment")) && (
                      <div className="rounded-xl border border-white/[0.05] bg-[rgba(31,31,37,0.4)] p-5 space-y-4">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Briefcase className="h-4 w-4" style={{ color: accentColor }} />
                          Business Details
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className={labelClasses}>Business Name</label>
                            <input
                              placeholder="e.g., Acme Consulting LLC"
                              value={profile.businessName}
                              onChange={(e) => updateProfile({ businessName: e.target.value })}
                              className={inputClasses}
                            />
                          </div>
                          <div>
                            <label className={labelClasses}>Business Income</label>
                            <div className="relative">
                              <input
                                placeholder="$200,000"
                                value={profile.businessIncome}
                                onChange={(e) => updateProfile({ businessIncome: e.target.value })}
                                className={inputClasses}
                              />
                              <VoiceBtn field="businessIncome" />
                            </div>
                          </div>
                          <div>
                            <label className={labelClasses}>Number of Employees</label>
                            <input
                              placeholder="e.g., 5"
                              value={profile.numberOfEmployees}
                              onChange={(e) => updateProfile({ numberOfEmployees: e.target.value })}
                              className={inputClasses}
                            />
                          </div>
                          <div>
                            <label className={labelClasses}>Year Established</label>
                            <input
                              placeholder="e.g., 2019"
                              value={profile.yearEstablished}
                              onChange={(e) => updateProfile({ yearEstablished: e.target.value })}
                              className={inputClasses}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </GlassPanel>
              </motion.div>
            )}

            {/* STEP 3: Financial Situation */}
            {currentStep === 3 && (
              <motion.div key="financial" initial="hidden" animate="visible" exit="exit" variants={fadeIn}>
                <GlassPanel>
                  <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" style={{ color: accentColor }} />
                    Financial Situation
                  </h2>
                  <p className="text-sm text-slate-500 mb-5">These unlock specific tax strategies.</p>

                  <div className="space-y-4">
                    {[
                      { label: "Real estate or rental properties", icon: Home, field: "hasRealEstate" as const, value: profile.hasRealEstate },
                      { label: "Business income (self-employment, side hustle)", icon: Briefcase, field: "hasBusinessIncome" as const, value: profile.hasBusinessIncome },
                      { label: "Mortgage on primary home", icon: Home, field: "hasMortgage" as const, value: profile.hasMortgage },
                      { label: "Retirement accounts (401k, IRA, etc.)", icon: PiggyBank, field: "hasRetirementAccounts" as const, value: profile.hasRetirementAccounts },
                      { label: "Investments or stocks", icon: TrendingUp, field: "hasInvestments" as const, value: profile.hasInvestments },
                      { label: "Health insurance (employer or marketplace)", icon: Shield, field: "hasHealthInsurance" as const, value: profile.hasHealthInsurance },
                      { label: "Student loans", icon: GraduationCap, field: "hasStudentLoans" as const, value: profile.hasStudentLoans },
                      { label: "Charitable giving / donations", icon: Heart, field: "hasCharitableGiving" as const, value: profile.hasCharitableGiving },
                      { label: "International income or assets", icon: Globe, field: "hasInternational" as const, value: profile.hasInternational },
                    ].map((item) => (
                      <div
                        key={item.field}
                        className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-[rgba(15,15,20,0.5)] p-4"
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="h-4 w-4 text-slate-500" />
                          <span className="text-sm text-slate-200">{item.label}</span>
                        </div>
                        <Toggle
                          checked={item.value}
                          onChange={(v) => updateProfile({ [item.field]: v })}
                          color={accentColor}
                        />
                      </div>
                    ))}

                    {/* Retirement account types */}
                    {profile.hasRetirementAccounts && (
                      <div className="pl-7">
                        <label className={labelClasses}>Which retirement accounts?</label>
                        <PillSelect
                          options={RETIREMENT_TYPES}
                          selected={profile.retirementAccountTypes}
                          onToggle={(val) => toggleArrayItem("retirementAccountTypes", val)}
                          color={accentColor}
                        />
                      </div>
                    )}
                  </div>
                </GlassPanel>
              </motion.div>
            )}

            {/* STEP 4: Goals */}
            {currentStep === 4 && (
              <motion.div key="goals" initial="hidden" animate="visible" exit="exit" variants={fadeIn}>
                <GlassPanel>
                  <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <Target className="h-5 w-5" style={{ color: accentColor }} />
                    Goals & Priorities
                  </h2>
                  <p className="text-sm text-slate-500 mb-5">What matters most to you? This shapes your strategy recommendations.</p>

                  <div className="space-y-5">
                    <div>
                      <label className={labelClasses}>Tax Savings Target</label>
                      <div className="relative">
                        <input
                          placeholder="$25,000"
                          value={profile.savingsTarget}
                          onChange={(e) => updateProfile({ savingsTarget: e.target.value })}
                          className={inputClasses}
                          style={{ borderColor: profile.savingsTarget ? `${accentColor}20` : undefined }}
                        />
                        <VoiceBtn field="savingsTarget" />
                      </div>
                    </div>

                    <div>
                      <label className={labelClasses}>Planning Priorities</label>
                      <PillSelect
                        options={PLANNING_PRIORITIES}
                        selected={profile.planningPriorities}
                        onToggle={(val) => toggleArrayItem("planningPriorities", val)}
                        color={accentColor}
                      />
                    </div>
                  </div>
                </GlassPanel>
              </motion.div>
            )}

            {/* STEP 5: Tax Return Upload */}
            {currentStep === 5 && (
              <motion.div key="upload" initial="hidden" animate="visible" exit="exit" variants={fadeIn}>
                <GlassPanel>
                  <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <Upload className="h-5 w-5" style={{ color: accentColor }} />
                    Upload Tax Documents
                  </h2>
                  <p className="text-sm text-slate-500 mb-4">
                    Upload your tax documents and AI will extract profile data using specialized OCR models.
                  </p>

                  {/* Document type selector */}
                  <div className="mb-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Document Type</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {[
                        { id: "tax-return", label: "Tax Return", sub: "1040 / 1120 / 1065", icon: "📄" },
                        { id: "w2", label: "W-2", sub: "Wage Statement", icon: "💼" },
                        { id: "1099-nec", label: "1099-NEC", sub: "Non-Employee Comp", icon: "📋" },
                        { id: "1099-int", label: "1099-INT", sub: "Interest Income", icon: "🏦" },
                        { id: "1099-div", label: "1099-DIV", sub: "Dividends", icon: "📈" },
                        { id: "1099-r", label: "1099-R", sub: "Retirement Dist.", icon: "🏛️" },
                        { id: "1099-misc", label: "1099-MISC", sub: "Miscellaneous", icon: "📝" },
                        { id: "1099-k", label: "1099-K", sub: "Payment Cards", icon: "💳" },
                        { id: "1098", label: "1098", sub: "Mortgage Interest", icon: "🏠" },
                        { id: "1098-t", label: "1098-T", sub: "Tuition Statement", icon: "🎓" },
                        { id: "k1", label: "K-1", sub: "Partnership / S-Corp", icon: "🤝" },
                        { id: "other", label: "Other", sub: "General Document", icon: "📎" },
                      ].map((dt) => (
                        <button
                          key={dt.id}
                          type="button"
                          onClick={() => setSelectedDocType(dt.id)}
                          className={`text-left rounded-xl px-3 py-2.5 border transition-all ${
                            selectedDocType === dt.id
                              ? "border-opacity-40 bg-opacity-10"
                              : "border-white/[0.05] bg-[rgba(15,15,20,0.5)] hover:border-white/[0.1]"
                          }`}
                          style={selectedDocType === dt.id ? {
                            borderColor: `${accentColor}60`,
                            backgroundColor: `${accentColor}10`,
                          } : undefined}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{dt.icon}</span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">{dt.label}</p>
                              <p className="text-[10px] text-slate-500 truncate">{dt.sub}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Upload zone */}
                  <div
                    {...getRootProps()}
                    className="rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all"
                    style={{
                      borderColor: isDragActive ? accentColor : "rgba(255,255,255,0.08)",
                      backgroundColor: isDragActive ? `${accentColor}08` : "rgba(15,15,20,0.5)",
                    }}
                  >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-3">
                      {uploadStatus === "processing" ? (
                        <>
                          <Loader2 className="h-8 w-8 animate-spin" style={{ color: accentColor }} />
                          <p className="text-sm font-medium text-white">AI is analyzing your document...</p>
                          <p className="text-xs text-slate-500">
                            {selectedDocType === "tax-return"
                              ? "Processing all pages — extracting income, deductions, schedules, and credits"
                              : `Using specialized ${selectedDocType.toUpperCase()} OCR model for precise extraction`}
                          </p>
                        </>
                      ) : uploadStatus === "done" ? (
                        <>
                          <CheckCircle2 className="h-8 w-8 text-green-400" />
                          <p className="text-sm font-medium text-green-400">
                            Document analyzed &amp; merged into profile!
                          </p>
                          <p className="text-xs text-slate-500">
                            {(profile.uploadedDocuments || []).length} document{(profile.uploadedDocuments || []).length !== 1 ? "s" : ""} analyzed — upload more to build a comprehensive profile
                          </p>
                        </>
                      ) : uploadStatus === "error" ? (
                        <>
                          <AlertCircle className="h-8 w-8 text-red-400" />
                          <p className="text-sm font-medium text-red-400">Processing failed — try again or fill manually</p>
                        </>
                      ) : (
                        <>
                          <div className="w-14 h-14 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${accentColor}15` }}>
                            <FileText className="w-6 h-6" style={{ color: accentColor }} />
                          </div>
                          <p className="text-base font-bold text-white">
                            {isDragActive ? "Drop your document..." : "Drop your document or click to browse"}
                          </p>
                          <p className="text-sm text-slate-500">
                            PDF, PNG, or JPG — AI will extract and populate your profile
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* OCR Summary */}
                  {profile.ocrSummary && (
                    <div className="mt-5 rounded-xl border border-white/[0.05] bg-[rgba(31,31,37,0.4)] p-5">
                      <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" style={{ color: accentColor }} />
                        AI Summary
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed">{profile.ocrSummary}</p>
                    </div>
                  )}

                  {/* OCR Extracted Fields */}
                  {Object.keys(profile.ocrExtractedFields).length > 0 && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(profile.ocrExtractedFields).map(([key, val]) => (
                        <div key={key} className="rounded-xl border border-white/[0.05] bg-[rgba(15,15,20,0.5)] p-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">{key}</p>
                          <p className="text-sm font-medium text-white">{val}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* OCR Suggestions */}
                  {ocrSuggestions.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">AI Suggestions</h3>
                      {ocrSuggestions.map((sug, i) => (
                        <div key={i} className="flex items-start gap-2 rounded-xl border border-white/[0.05] bg-[rgba(31,31,37,0.4)] p-3">
                          <Sparkles className="h-4 w-4 mt-0.5 shrink-0" style={{ color: accentColor }} />
                          <p className="text-sm text-slate-300">{sug}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Uploaded Documents History */}
                  {(profile.uploadedDocuments || []).length > 0 && (
                    <div className="mt-5">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                        Analyzed Documents ({profile.uploadedDocuments.length})
                      </h3>
                      <div className="space-y-2">
                        {profile.uploadedDocuments.map((doc) => (
                          <div key={doc.id} className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-[rgba(15,15,20,0.5)] p-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                              style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
                              {doc.documentType === "tax-return" ? "TR" : doc.documentType.toUpperCase().slice(0, 3)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-white truncate">{doc.fileName}</p>
                              <p className="text-[10px] text-slate-500">
                                {doc.documentType.toUpperCase()} — {new Date(doc.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-600 mt-2">
                        Upload more documents to build a more complete profile for Smart Plan
                      </p>
                    </div>
                  )}
                </GlassPanel>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Navigation ─── */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={!canGoPrev}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 transition-all disabled:opacity-30 hover:text-white hover:bg-white/5"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className="w-2 h-2 rounded-full transition-all"
                  style={{
                    backgroundColor: i === currentStep ? accentColor : i < currentStep ? `${accentColor}50` : "rgba(255,255,255,0.1)",
                    transform: i === currentStep ? "scale(1.3)" : "scale(1)",
                  }}
                />
              ))}
            </div>
            {canGoNext ? (
              <button
                onClick={() => setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1))}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: accentColor }}
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: accentColor }}
              >
                <Save className="h-4 w-4" /> Save Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
