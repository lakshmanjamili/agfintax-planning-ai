"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import ReactMarkdown from "react-markdown";
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
  { id: "upload", label: "Upload Docs", icon: Upload },
  { id: "review", label: "Review Profile", icon: User },
  { id: "goals", label: "Goals", icon: Target },
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
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  // Document type is auto-detected from filename — no manual selection needed
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
  const processOneFile = useCallback(async (file: File, docType: string, currentProfile: ClientProfile): Promise<{
    extractedFields?: Record<string, unknown>;
    summary?: string;
    keyFindings?: string[];
    profileSuggestions?: string[];
  }> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("entityType", currentProfile.entityType);
    formData.append("documentType", docType);

    const res = await fetch("/api/profile-ocr", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error(`OCR processing failed for ${file.name}`);
    return res.json();
  }, []);

  const handleOcrUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    setIsUploading(true);
    setUploadStatus("uploading");

    try {
      // Process each file sequentially, merging results into profile progressively
      const currentProfile = { ...profile };
      const allSuggestions: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Auto-detect document type from filename
        const nameLower = file.name.toLowerCase();
        let docType = "tax-return"; // default fallback
        if (nameLower.includes("w-2") || nameLower.includes("w2")) docType = "w2";
        else if (nameLower.includes("1040") || nameLower.includes("1120") || nameLower.includes("1065")) docType = "tax-return";
        else if (nameLower.includes("1099-nec") || nameLower.includes("1099nec")) docType = "1099-nec";
        else if (nameLower.includes("1099-int") || nameLower.includes("1099int")) docType = "1099-int";
        else if (nameLower.includes("1099-div") || nameLower.includes("1099div")) docType = "1099-div";
        else if (nameLower.includes("1099-r") || nameLower.includes("1099r")) docType = "1099-r";
        else if (nameLower.includes("1099-k") || nameLower.includes("1099k")) docType = "1099-k";
        else if (nameLower.includes("1099-misc") || nameLower.includes("1099misc")) docType = "1099-misc";
        else if (nameLower.includes("1099")) docType = "1099-nec";
        else if (nameLower.includes("1098-t") || nameLower.includes("1098t")) docType = "1098-t";
        else if (nameLower.includes("1098")) docType = "1098";
        else if (nameLower.includes("k-1") || nameLower.includes("k1")) docType = "k1";
        console.log(`Auto-detected doc type for "${file.name}": ${docType}`);

        setUploadStatus("processing");

        const data = await processOneFile(file, docType, currentProfile);
        const isTaxReturn = docType === "tax-return";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fields: Record<string, any> = data.extractedFields || {};

        // --- Core fields: tax return overrides, other docs fill gaps ---
        if (fields.occupation && (isTaxReturn || !currentProfile.occupation)) currentProfile.occupation = fields.occupation;
        if (fields.filingStatus && (isTaxReturn || !currentProfile.filingStatus)) currentProfile.filingStatus = fields.filingStatus;
        // Income: W-2s ACCUMULATE (add up wages), tax return OVERRIDES with AGI
        if (fields.annualIncome) {
          if (isTaxReturn) {
            // Tax return has the definitive AGI — use it directly
            currentProfile.annualIncome = fields.annualIncome;
          } else if (docType === "w2") {
            // W-2: add wages to running total
            const newWages = parseFloat(String(fields.annualIncome).replace(/[$,]/g, "")) || 0;
            const existingIncome = parseFloat(String(currentProfile.annualIncome || "0").replace(/[$,]/g, "")) || 0;
            const total = existingIncome + newWages;
            currentProfile.annualIncome = `$${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          } else if (!currentProfile.annualIncome) {
            // Other doc types: only fill gap
            currentProfile.annualIncome = fields.annualIncome;
          }
        }
        if (typeof fields.dependents === "number" && (isTaxReturn || currentProfile.dependents === 0)) currentProfile.dependents = fields.dependents;
        if (fields.state && (isTaxReturn || !currentProfile.state)) currentProfile.state = fields.state;
        if (fields.businessName && (isTaxReturn || !currentProfile.businessName)) currentProfile.businessName = fields.businessName;
        if (fields.businessIncome && fields.businessIncome !== "$0.00" && fields.businessIncome !== "0" && (isTaxReturn || !currentProfile.businessIncome)) currentProfile.businessIncome = fields.businessIncome;

        // --- Arrays: MERGE (accumulate from multiple docs) ---
        if (Array.isArray(fields.incomeSources) && fields.incomeSources.length > 0) {
          currentProfile.incomeSources = mergeArraysUnique(currentProfile.incomeSources, fields.incomeSources);
        }
        if (Array.isArray(fields.retirementAccountTypes) && fields.retirementAccountTypes.length > 0) {
          currentProfile.retirementAccountTypes = mergeArraysUnique(currentProfile.retirementAccountTypes, fields.retirementAccountTypes);
          currentProfile.hasRetirementAccounts = true;
        }

        // --- Boolean flags: only turn ON (never turn off from a new doc) ---
        if (fields.hasRealEstate === true) currentProfile.hasRealEstate = true;
        if (fields.hasBusinessIncome === true) currentProfile.hasBusinessIncome = true;
        if (fields.hasMortgage === true) currentProfile.hasMortgage = true;
        if (fields.hasRetirementAccounts === true) currentProfile.hasRetirementAccounts = true;
        if (fields.hasInvestments === true) currentProfile.hasInvestments = true;
        if (fields.hasCharitableGiving === true) currentProfile.hasCharitableGiving = true;
        if (fields.hasHealthInsurance === true) currentProfile.hasHealthInsurance = true;
        if (fields.hasStudentLoans === true) currentProfile.hasStudentLoans = true;

        // --- OCR summary: keep last doc's summary as placeholder until re-analyze runs ---
        if (data.summary) {
          currentProfile.ocrSummary = data.summary;
        }

        // --- Extracted fields: MERGE — only upgrade, never downgrade ---
        const ocrFields: Record<string, string> = { ...(currentProfile.ocrExtractedFields || {}) };
        // Helper: only set field if new value is meaningful and better than existing
        const setIfBetter = (key: string, val: string | undefined) => {
          if (!val) return;
          const lower = val.toLowerCase();
          // Skip junk values
          if (lower.includes("unknown") || lower === "n/a" || lower === "$0.00" || val.trim() === "0") return;
          // Only overwrite if no existing value, or if from a tax return (authoritative)
          if (!ocrFields[key] || isTaxReturn) {
            ocrFields[key] = val;
          }
        };
        setIfBetter("Total Income / AGI", fields.annualIncome);
        setIfBetter("Adjusted Gross Income", fields.agi);
        setIfBetter("Taxable Income", fields.taxableIncome);
        setIfBetter("Total Deductions", fields.totalDeductions);
        setIfBetter("Federal Tax Withheld", fields.taxWithheld);
        setIfBetter("Tax Owed / Refund", fields.taxOwed);
        setIfBetter("Effective Tax Rate", fields.effectiveRate);
        setIfBetter("State Income Tax", fields.stateIncomeTax);
        if (Array.isArray(fields.schedulesPresent) && fields.schedulesPresent.length > 0) {
          const existing = (ocrFields["Schedules Filed"] || "").split(", ").filter(Boolean);
          ocrFields["Schedules Filed"] = mergeArraysUnique(existing, fields.schedulesPresent).join(", ");
        }
        if (Array.isArray(fields.creditsUsed) && fields.creditsUsed.length > 0) {
          const existing = (ocrFields["Credits Used"] || "").split(", ").filter(Boolean);
          ocrFields["Credits Used"] = mergeArraysUnique(existing, fields.creditsUsed).join(", ");
        }
        // Only store meaningful financial summary fields — no PII or raw dumps
        currentProfile.ocrExtractedFields = ocrFields;

        // --- Track this document in upload history ---
        // Smart duplicate detection: if same docType + same filename exists, replace it
        const existingDocs = currentProfile.uploadedDocuments || [];
        const duplicateIndex = existingDocs.findIndex(
          (d) => d.documentType === docType && d.fileName === file.name
        );
        const docRecord = {
          id: duplicateIndex >= 0 ? existingDocs[duplicateIndex].id : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          fileName: file.name,
          documentType: docType,
          uploadedAt: new Date().toISOString(),
          summary: data.summary || "",
          extractedFields: Object.fromEntries(
            Object.entries(fields)
              .filter(([k, v]) => {
                if (typeof v !== "string" && typeof v !== "number") return false;
                // Exclude PII and noise fields
                const lower = k.toLowerCase();
                if (lower.includes("tin") || lower.includes("ssn") || lower.includes("address") || lower.includes("accountnumber") || lower.includes("documentid") || lower.includes("payert") || lower.includes("recipientt")) return false;
                const valStr = String(v).toLowerCase();
                if (valStr === "$0.00" || valStr === "0" || valStr.includes("unknown") || valStr === "n/a") return false;
                return true;
              })
              .map(([k, v]) => [k, String(v)])
          ),
          keyFindings: [...(data.keyFindings || []), ...(data.profileSuggestions || [])],
        };
        if (duplicateIndex >= 0) {
          // Replace existing doc (re-upload of same file)
          existingDocs[duplicateIndex] = docRecord;
          currentProfile.uploadedDocuments = [...existingDocs];
          console.log(`  Replaced existing ${docType}: ${file.name}`);
        } else {
          currentProfile.uploadedDocuments = [...existingDocs, docRecord];
        }

        // Collect suggestions from each file
        allSuggestions.push(...(data.profileSuggestions || []), ...(data.keyFindings || []));

        console.log(`=== DOCUMENT MERGED [${i + 1}/${files.length}]: ${docType} (${file.name}) ===`);
        console.log("Documents now:", currentProfile.uploadedDocuments.length);
      }

      // After all files processed, apply accumulated profile updates
      const summary = buildComprehensiveSummary(currentProfile as ClientProfile);
      currentProfile.comprehensiveSummary = summary;
      updateProfile(currentProfile);

      // Auto-save to localStorage so data persists without manual Save click
      const finalProfile = { ...profile, ...currentProfile, comprehensiveSummary: summary };
      saveClientProfile(finalProfile as ClientProfile);
      if (finalProfile.entityType) saveEntityType(finalProfile.entityType);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);

      setUploadStatus("done");
      console.log("All documents merged & auto-saved. Summary:", summary.length, "chars");

      // Show suggestions
      if (allSuggestions.length > 0) {
        setOcrSuggestions(allSuggestions);
      }

      // Auto-trigger holistic re-analysis after multi-file upload
      // so the Document Summary combines ALL documents, not just the first one
      if ((currentProfile.uploadedDocuments || []).length > 1) {
        setTimeout(() => {
          handleReanalyze();
        }, 500);
      }
    } catch (err) {
      console.error("OCR upload error:", err);
      setUploadStatus("error");
    } finally {
      setIsUploading(false);
    }
  }, [profile, updateProfile, processOneFile]);

  // Re-analyze: send ALL document data + previous summary to LLM for a holistic update
  // IMPORTANT: reads from localStorage (always fresh) — NOT from React state (can be stale in closures)
  const handleReanalyze = useCallback(async () => {
    // Read latest profile from localStorage to avoid stale closure issues
    const latestProfile = getClientProfile() || profile;
    const docs = latestProfile.uploadedDocuments || [];
    if (docs.length === 0) return;
    setIsReanalyzing(true);
    try {
      const previousSummary = latestProfile.comprehensiveSummary || latestProfile.ocrSummary || "";

      const docSummaries = docs
        .map((d, i) => `Document ${i + 1}: ${d.documentType.toUpperCase()} (${d.fileName})\nSummary: ${d.summary || "N/A"}\nKey findings: ${(d.keyFindings || []).join("; ") || "N/A"}\nExtracted: ${JSON.stringify(d.extractedFields || {})}`)
        .join("\n\n");

      const profileFields = [
        `Entity: ${latestProfile.entityType}`,
        `Filing: ${latestProfile.filingStatus}`,
        `Income: ${latestProfile.annualIncome || "unknown"}`,
        `State: ${latestProfile.state || "unknown"}`,
        `Dependents: ${latestProfile.dependents || 0}`,
        latestProfile.occupation ? `Occupation: ${latestProfile.occupation}` : "",
        latestProfile.incomeSources.length > 0 ? `Income sources: ${latestProfile.incomeSources.join(", ")}` : "",
        latestProfile.retirementAccountTypes.length > 0 ? `Retirement: ${latestProfile.retirementAccountTypes.join(", ")}` : "",
        latestProfile.hasRealEstate ? "Has real estate" : "",
        latestProfile.hasInvestments ? "Has investments" : "",
        latestProfile.hasCharitableGiving ? "Has charitable giving" : "",
        latestProfile.hasHealthInsurance ? "Has health insurance" : "",
        latestProfile.hasMortgage ? "Has mortgage" : "",
        latestProfile.hasStudentLoans ? "Has student loans" : "",
      ].filter(Boolean).join(" | ");

      const reanalyzePrompt = `You are a senior CPA at AG FinTax (Anil Grandhi's firm). Never mention AI, LLM, or machine learning. You are re-analyzing a client's complete financial profile after new documents were added.

IMPORTANT CONTEXT: This is a married filing jointly household. Multiple W-2s from different employers (and possibly different spouses) should be COMBINED into total household income. Do NOT treat each W-2 as a separate taxpayer.

CURRENT PROFILE: ${profileFields}

PREVIOUS HOLISTIC ANALYSIS:
${previousSummary || "(No previous analysis — this is the first analysis)"}

ALL DOCUMENTS ON FILE (${docs.length}):
${docSummaries}

YOUR TASK:
Build on the previous analysis. Incorporate ALL documents — old and new — into ONE unified holistic profile. Do not lose any information from the previous analysis. If new documents add income, investments, deductions, or other data, merge them into the totals.

CRITICAL: Add up ALL W-2 wages to get total household income. If the profile says "${latestProfile.annualIncome || "unknown"}" but documents show a different total, state the corrected total.

FORMAT YOUR RESPONSE AS:
## 1. Holistic summary
2-3 sentences covering the COMPLETE financial picture across ALL documents. State total combined household income.

## 2. Key numbers
All financial figures: total income (broken down by source/employer), AGI estimate, total 401(k) deferrals (by employer), total withholding (federal + state), deductions, credits, investment data, etc. Use bold for dollar amounts.

## 3. Top 3 actionable observations for tax planning
Specific, numbered strategies with IRC references and estimated savings ranges.

## 4. Profile corrections
List any profile fields that need updating:
- annualIncome: $TOTAL (combined from all W-2s)
- filingStatus: mfj (if multiple spouses detected)
- dependents: N (if evidence found)
- Any boolean flags that should be true

Be specific with dollar amounts. Reference IRC sections. No disclaimers.`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: reanalyzePrompt }],
        }),
      });

      if (!res.ok) throw new Error("Re-analysis failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
        }
      }

      if (fullText.trim()) {
        const analysisText = fullText.trim();

        // Start with latest profile from localStorage (NOT stale React state)
        const correctedProfile = { ...latestProfile };
        const correctionsMatch = analysisText.match(/##\s*4\.\s*Profile corrections([\s\S]*?)(?:##|$)/i);
        if (correctionsMatch) {
          const corrections = correctionsMatch[1];
          // Parse income correction
          const incomeMatch = corrections.match(/annualIncome[^:]*:\s*\$?([\d,]+)/i);
          if (incomeMatch) {
            correctedProfile.annualIncome = `$${incomeMatch[1]}`;
          }
          // Parse filing status correction
          const filingMatch = corrections.match(/filingStatus[^:]*:\s*(mfj|single|mfs|hoh)/i);
          if (filingMatch) {
            correctedProfile.filingStatus = filingMatch[1].toLowerCase();
          }
          // Parse dependents correction
          const depMatch = corrections.match(/dependents[^:]*:\s*(\d+)/i);
          if (depMatch) {
            correctedProfile.dependents = parseInt(depMatch[1]);
          }
          // Boolean flags — only turn ON
          if (/hasInvestments[^:]*:\s*true/i.test(corrections)) correctedProfile.hasInvestments = true;
          if (/hasRealEstate[^:]*:\s*true/i.test(corrections)) correctedProfile.hasRealEstate = true;
          if (/hasCharitableGiving[^:]*:\s*true/i.test(corrections)) correctedProfile.hasCharitableGiving = true;
          if (/hasMortgage[^:]*:\s*true/i.test(corrections)) correctedProfile.hasMortgage = true;
          if (/hasHealthInsurance[^:]*:\s*true/i.test(corrections)) correctedProfile.hasHealthInsurance = true;
          if (/hasStudentLoans[^:]*:\s*true/i.test(corrections)) correctedProfile.hasStudentLoans = true;
        }

        correctedProfile.ocrSummary = analysisText;
        correctedProfile.comprehensiveSummary = analysisText;

        updateProfile(correctedProfile);
        saveClientProfile(correctedProfile as ClientProfile);
        if (correctedProfile.entityType) saveEntityType(correctedProfile.entityType);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Re-analyze error:", err);
    } finally {
      setIsReanalyzing(false);
    }
  }, [profile, updateProfile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleOcrUpload,
    accept: { "application/pdf": [".pdf"], "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] },
    maxSize: 25 * 1024 * 1024,
    maxFiles: 5, // Allow multiple: 1040 + 2 W-2s (MFJ) + other docs
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
              Start by uploading your prior year tax return — we&apos;ll auto-fill most of your profile.
              Then review and complete any remaining details for your personalized tax plan.
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
            {/* STEP 0: Tax Return Upload (fastest way to build profile) */}
            {currentStep === 0 && (
              <motion.div key="upload" initial="hidden" animate="visible" exit="exit" variants={fadeIn}>
                <GlassPanel>
                  <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <Upload className="h-5 w-5" style={{ color: accentColor }} />
                    Upload Your Tax Documents
                  </h2>

                  {/* Instructions */}
                  <div className="mb-5 p-4 rounded-xl border border-white/[0.06] bg-[rgba(15,15,20,0.6)]">
                    <p className="text-sm text-slate-300 leading-relaxed mb-3">
                      Welcome! I&apos;m your profile builder. Upload all your tax documents so I can initialize your
                      complete financial profile. The more you provide, the better Anil Grandhi&apos;s strategies
                      will be tailored to your situation.
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-500">
                      <span>1040 / 1120-S / 1065 (Tax Return)</span>
                      <span>W-2s (Wage Statements)</span>
                      <span>1099s (NEC, INT, DIV, R, K, MISC)</span>
                      <span>1098 (Mortgage Interest)</span>
                      <span>K-1 (Partnership / S-Corp)</span>
                      <span>Any other tax documents</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-3 italic">
                      Document type is auto-detected from filename and content — no manual selection needed.
                    </p>
                  </div>

                  {/* Upload zone */}
                  <div
                    {...getRootProps()}
                    className="rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all"
                    style={{
                      borderColor: isDragActive ? accentColor : "rgba(255,255,255,0.08)",
                      backgroundColor: isDragActive ? `${accentColor}08` : "rgba(15,15,20,0.5)",
                    }}
                  >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-3">
                      {uploadStatus === "processing" ? (
                        <>
                          <Loader2 className="h-10 w-10 animate-spin" style={{ color: accentColor }} />
                          <p className="text-sm font-medium text-white">Analyzing your documents...</p>
                          <p className="text-xs text-slate-500">
                            Reading all pages, extracting income, deductions, schedules, and credits
                          </p>
                        </>
                      ) : uploadStatus === "done" ? (
                        <>
                          <CheckCircle2 className="h-10 w-10 text-green-400" />
                          <p className="text-sm font-medium text-green-400">
                            Documents analyzed &amp; profile updated!
                          </p>
                          <p className="text-xs text-slate-500">
                            {(profile.uploadedDocuments || []).length} document{(profile.uploadedDocuments || []).length !== 1 ? "s" : ""} processed — upload more or review your profile below
                          </p>
                        </>
                      ) : uploadStatus === "error" ? (
                        <>
                          <AlertCircle className="h-10 w-10 text-red-400" />
                          <p className="text-sm font-medium text-red-400">Processing failed — try again or fill in manually</p>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${accentColor}15` }}>
                            <Upload className="w-7 h-7" style={{ color: accentColor }} />
                          </div>
                          <p className="text-base font-bold text-white">
                            {isDragActive ? "Drop your files here..." : "Drop all your tax documents here"}
                          </p>
                          <p className="text-sm text-slate-400">
                            PDF, PNG, or JPG — up to 5 files at once
                          </p>
                          <p className="text-xs text-slate-600 mt-1">
                            1040, W-2, 1099, 1098, K-1, and more — every page is read
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* OCR Summary + Re-Analyze */}
                  {profile.ocrSummary && (
                    <div className="mt-5 rounded-xl border border-white/[0.05] bg-[rgba(31,31,37,0.4)] p-5">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Sparkles className="h-4 w-4" style={{ color: accentColor }} />
                          Document Summary
                        </h3>
                        {(profile.uploadedDocuments || []).length > 0 && (
                          <button
                            type="button"
                            onClick={handleReanalyze}
                            disabled={isReanalyzing}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:brightness-110 disabled:opacity-50"
                            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                          >
                            {isReanalyzing ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3 w-3" />
                                Re-Analyze
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <div className="text-sm text-slate-300 leading-relaxed prose prose-invert prose-sm max-w-none prose-headings:text-white prose-headings:text-sm prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2 prose-strong:text-white prose-li:my-0.5 prose-ul:my-1 prose-p:my-1">
                        <ReactMarkdown>{profile.ocrSummary}</ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {/* Key Financial Summary — only meaningful values */}
                  {Object.keys(profile.ocrExtractedFields).length > 0 && (() => {
                    // Allowlist of summary-worthy fields
                    const SUMMARY_KEYS = [
                      "Total Income / AGI",
                      "Adjusted Gross Income",
                      "Taxable Income",
                      "Total Deductions",
                      "Federal Tax Withheld",
                      "Tax Owed / Refund",
                      "Effective Tax Rate",
                      "State Income Tax",
                      "Credits Used",
                      "Schedules Filed",
                    ];
                    const cleanFields = SUMMARY_KEYS
                      .filter((key) => {
                        const val = profile.ocrExtractedFields[key];
                        if (!val) return false;
                        const lower = val.toLowerCase();
                        // Hide unknown, $0.00, and verbose "not determinable" entries
                        if (lower.includes("unknown") || lower.includes("not determinable") || lower.includes("not available") || lower === "n/a") return false;
                        if (val.trim() === "$0.00" || lower.includes("$0.00 ")) return false;
                        return true;
                      })
                      .map((key) => [key, profile.ocrExtractedFields[key]] as [string, string]);

                    return cleanFields.length > 0 ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {cleanFields.map(([key, val]) => (
                          <div key={key} className="rounded-xl border border-white/[0.05] bg-[rgba(15,15,20,0.5)] p-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">{key}</p>
                            <p className="text-sm font-medium text-white">{val}</p>
                          </div>
                        ))}
                      </div>
                    ) : null;
                  })()}

                  {/* OCR Suggestions */}
                  {ocrSuggestions.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Suggestions</h3>
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
                      <div className="space-y-3">
                        {profile.uploadedDocuments.map((doc) => (
                          <div key={doc.id} className="rounded-xl border border-white/[0.05] bg-[rgba(15,15,20,0.5)] overflow-hidden">
                            <div className="flex items-center gap-3 p-3">
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-extrabold shrink-0"
                                style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
                                {doc.documentType === "tax-return" ? "1040" : doc.documentType.toUpperCase().slice(0, 4)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-white truncate">{doc.fileName}</p>
                                <p className="text-[10px] text-slate-500">
                                  {doc.documentType.toUpperCase()} — {new Date(doc.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                              <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                            </div>
                            {/* Per-document summary */}
                            {doc.summary && (
                              <div className="px-3 pb-3 pt-0">
                                <p className="text-[11px] text-slate-400 leading-relaxed">{doc.summary}</p>
                              </div>
                            )}
                            {/* Key findings */}
                            {doc.keyFindings && doc.keyFindings.length > 0 && (
                              <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                                {doc.keyFindings.slice(0, 3).map((finding, fi) => (
                                  <span key={fi} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-500">
                                    {finding.length > 60 ? finding.slice(0, 60) + "..." : finding}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-600 mt-2">
                        Upload more documents to refine your profile — re-uploading a file replaces the old version
                      </p>
                    </div>
                  )}

                  {/* Skip upload hint */}
                  {(profile.uploadedDocuments || []).length === 0 && uploadStatus === "idle" && (
                    <p className="text-center text-xs text-slate-600 mt-4">
                      Don&apos;t have your return handy? No problem — click <strong className="text-slate-400">Next</strong> to fill in your details manually.
                    </p>
                  )}
                </GlassPanel>
              </motion.div>
            )}

            {/* STEP 1: Review Profile (all-in-one) */}
            {currentStep === 1 && (
              <motion.div key="review" initial="hidden" animate="visible" exit="exit" variants={fadeIn}>
                <GlassPanel>
                  <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <User className="h-5 w-5" style={{ color: accentColor }} />
                    Review &amp; Edit Profile
                  </h2>
                  <p className="text-sm text-slate-500 mb-5">
                    {(profile.uploadedDocuments || []).length > 0
                      ? "Extracted from your documents. Confirm or correct any fields below."
                      : "Fill in your details for personalized tax strategies."}
                  </p>

                  <div className="space-y-6">
                    {/* Entity Type */}
                    <div>
                      <label className={labelClasses}>Entity Type</label>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {ENTITY_TYPES.map((entity) => {
                          const isSelected = profile.entityType === entity.id;
                          return (
                            <button
                              key={entity.id}
                              onClick={() => updateProfile({ entityType: entity.id })}
                              className="text-left rounded-xl border p-3 transition-all"
                              style={
                                isSelected
                                  ? { borderColor: `${entity.color}50`, backgroundColor: `${entity.color}08` }
                                  : { borderColor: "rgba(255,255,255,0.05)", backgroundColor: "rgba(31,31,37,0.5)" }
                              }
                            >
                              <div className="flex items-center gap-2">
                                <Building2 className="h-3.5 w-3.5" style={{ color: isSelected ? entity.color : "#64748B" }} />
                                <span className="text-xs font-bold" style={{ color: isSelected ? entity.color : "#E2E8F0" }}>
                                  {entity.label}
                                </span>
                                <span className="text-[10px] text-slate-500 ml-auto">{entity.formNumber}</span>
                                {isSelected && <CheckCircle2 className="h-3 w-3" style={{ color: entity.color }} />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Personal Info */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelClasses}>Occupation</label>
                        <div className="relative">
                          <input
                            placeholder="e.g., Software Engineer"
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
                      <div>
                        <label className={labelClasses}>State</label>
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
                        <label className={labelClasses}>Dependents</label>
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

                    {/* Income */}
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

                    {/* Business details — show if business entity or self-employment */}
                    {(profile.entityType !== "individual" || profile.incomeSources.includes("Self-Employment")) && (
                      <div className="rounded-xl border border-white/[0.05] bg-[rgba(31,31,37,0.4)] p-4 space-y-3">
                        <h3 className="text-xs font-bold text-white flex items-center gap-2">
                          <Briefcase className="h-3.5 w-3.5" style={{ color: accentColor }} />
                          Business Details
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className={labelClasses}>Business Name</label>
                            <input placeholder="e.g., Acme LLC" value={profile.businessName} onChange={(e) => updateProfile({ businessName: e.target.value })} className={inputClasses} />
                          </div>
                          <div>
                            <label className={labelClasses}>Business Income</label>
                            <input placeholder="$200,000" value={profile.businessIncome} onChange={(e) => updateProfile({ businessIncome: e.target.value })} className={inputClasses} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Financial flags — compact toggles */}
                    <div>
                      <label className={labelClasses}>Financial Situation</label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {[
                          { label: "Real estate / rentals", icon: Home, field: "hasRealEstate" as const, value: profile.hasRealEstate },
                          { label: "Business income", icon: Briefcase, field: "hasBusinessIncome" as const, value: profile.hasBusinessIncome },
                          { label: "Mortgage", icon: Home, field: "hasMortgage" as const, value: profile.hasMortgage },
                          { label: "Retirement accounts", icon: PiggyBank, field: "hasRetirementAccounts" as const, value: profile.hasRetirementAccounts },
                          { label: "Investments / stocks", icon: TrendingUp, field: "hasInvestments" as const, value: profile.hasInvestments },
                          { label: "Health insurance", icon: Shield, field: "hasHealthInsurance" as const, value: profile.hasHealthInsurance },
                          { label: "Student loans", icon: GraduationCap, field: "hasStudentLoans" as const, value: profile.hasStudentLoans },
                          { label: "Charitable giving", icon: Heart, field: "hasCharitableGiving" as const, value: profile.hasCharitableGiving },
                          { label: "International income", icon: Globe, field: "hasInternational" as const, value: profile.hasInternational },
                        ].map((item) => (
                          <div key={item.field} className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-[rgba(15,15,20,0.5)] px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <item.icon className="h-3.5 w-3.5 text-slate-500" />
                              <span className="text-xs text-slate-300">{item.label}</span>
                            </div>
                            <Toggle checked={item.value} onChange={(v) => updateProfile({ [item.field]: v })} color={accentColor} />
                          </div>
                        ))}
                      </div>
                      {profile.hasRetirementAccounts && (
                        <div className="mt-3">
                          <label className={labelClasses}>Retirement account types</label>
                          <PillSelect
                            options={RETIREMENT_TYPES}
                            selected={profile.retirementAccountTypes}
                            onToggle={(val) => toggleArrayItem("retirementAccountTypes", val)}
                            color={accentColor}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </GlassPanel>
              </motion.div>
            )}

            {/* STEP 2: Goals */}
            {currentStep === 2 && (
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
