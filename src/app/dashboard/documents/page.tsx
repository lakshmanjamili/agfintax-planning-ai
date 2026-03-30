"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import {
  Upload,
  FileText,
  Grid3x3,
  List,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  File,
  X,
  Sparkles,
  ArrowRight,
  Building2,
  ShieldCheck,
  Search,
} from "lucide-react";
import {
  getPlan,
  getDocuments,
  saveDocuments,
  addDocument,
  getRecommendedDocuments,
  getEntityType,
  getEntityInfo,
  type UploadedDocument,
  type SavedPlan,
  type EntityType,
} from "@/lib/tax/plan-store";

/* ─── animation ─── */
const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const },
  }),
};

/* ─── Type inference from filename ─── */
function inferDocType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes("w2") || lower.includes("w-2")) return "w2";
  if (lower.includes("1099-nec") || lower.includes("1099nec")) return "1099-nec";
  if (lower.includes("1099-div")) return "1099-div";
  if (lower.includes("1099-int")) return "1099-int";
  if (lower.includes("1099-b")) return "1099-b";
  if (lower.includes("1099-r")) return "1099-r";
  if (lower.includes("1099-misc")) return "1099-misc";
  if (lower.includes("1099")) return "1099-nec";
  if (lower.includes("k1") || lower.includes("k-1")) return "k1";
  if (lower.includes("1040")) return "prior-return";
  if (lower.includes("1120-s") || lower.includes("1120s")) return "1120-s";
  if (lower.includes("1120")) return "1120";
  if (lower.includes("1065")) return "1065";
  if (lower.includes("schedule-c") || lower.includes("schedule c")) return "schedule-c";
  if (lower.includes("1098")) return "1098";
  if (lower.includes("1095")) return "1095-a";
  if (lower.includes("5498")) return "5498";
  if (lower.includes("bank")) return "bank-statement";
  if (lower.includes("mortgage")) return "mortgage-statement";
  if (lower.includes("property") && lower.includes("tax")) return "property-tax";
  if (lower.includes("charit") || lower.includes("donat")) return "charitable-receipt";
  if (lower.includes("receipt") || lower.includes("expense")) return "business-expense";
  if (lower.includes("invest")) return "investment-statement";
  if (lower.includes("payroll")) return "payroll-reports";
  if (lower.includes("balance")) return "balance-sheet";
  if (lower.includes("profit") || lower.includes("p&l") || lower.includes("pnl")) return "profit-loss";
  if (lower.includes("partnership") && lower.includes("agree")) return "partnership-agreement";
  if (lower.includes("childcare") || lower.includes("daycare")) return "childcare-receipts";
  if (lower.includes("rental")) return "rental-income";
  return "other";
}

/* ─── Friendly label for doc type ─── */
function docTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    "w2": "W-2",
    "1099-nec": "1099-NEC",
    "1099-div": "1099-DIV",
    "1099-int": "1099-INT",
    "1099-b": "1099-B",
    "1099-r": "1099-R",
    "1099-misc": "1099-MISC",
    "k1": "K-1",
    "prior-return": "Prior Return",
    "1120-s": "1120-S",
    "1120": "1120",
    "1065": "1065",
    "schedule-c": "Schedule C",
    "1098": "1098",
    "1095-a": "1095-A/B/C",
    "5498": "5498",
    "bank-statement": "Bank Statement",
    "mortgage-statement": "Mortgage",
    "property-tax": "Property Tax",
    "charitable-receipt": "Charitable",
    "business-expense": "Business Expense",
    "investment-statement": "Investment",
    "payroll-reports": "Payroll",
    "balance-sheet": "Balance Sheet",
    "profit-loss": "P&L",
    "partnership-agreement": "Partnership Agmt",
    "childcare-receipts": "Childcare",
    "rental-income": "Rental Income",
    "other": "Other",
  };
  return labels[type] || type.toUpperCase();
}

/* ─── Doc type badge color ─── */
function docTypeColor(type: string, entityColor: string): { bg: string; text: string } {
  if (type.includes("1099") || type === "w2" || type === "k1" || type.includes("1120") || type === "1065" || type === "schedule-c" || type === "prior-return") {
    return { bg: `${entityColor}15`, text: entityColor };
  }
  if (type.includes("statement") || type.includes("mortgage") || type.includes("property")) {
    return { bg: "rgba(76,214,251,0.12)", text: "#4CD6FB" };
  }
  if (type.includes("receipt") || type.includes("expense") || type.includes("childcare") || type.includes("rental")) {
    return { bg: "rgba(139,92,246,0.12)", text: "#8B5CF6" };
  }
  return { bg: "rgba(148,163,184,0.1)", text: "#94A3B8" };
}

const statusConfig: Record<string, { icon: typeof CheckCircle2; label: string; dotColor: string }> = {
  uploaded: { icon: Clock, label: "Uploaded", dotColor: "bg-blue-400" },
  processing: { icon: Clock, label: "Processing", dotColor: "bg-amber-400 animate-pulse" },
  processed: { icon: CheckCircle2, label: "Processed", dotColor: "bg-emerald-400" },
  error: { icon: AlertCircle, label: "Error", dotColor: "bg-red-400" },
};

/* ─── Tab filter ─── */
const tabs = [
  { key: "all", label: "All" },
  { key: "required", label: "Required" },
  { key: "tax-forms", label: "Tax Forms" },
  { key: "statements", label: "Statements" },
  { key: "receipts", label: "Receipts" },
];

function matchesTab(doc: UploadedDocument, tab: string): boolean {
  if (tab === "all") return true;
  if (tab === "tax-forms") return /w2|1099|k1|1040|1065|1120|schedule|prior|1098|1095|5498/.test(doc.type);
  if (tab === "statements") return /statement|mortgage|property|balance|profit|payroll/.test(doc.type);
  if (tab === "receipts") return /receipt|expense|childcare|rental|charitable/.test(doc.type);
  return true;
}

/* ─── Glass Panel ─── */
function GlassPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/[0.05] bg-[rgba(27,27,32,0.6)] p-6 backdrop-blur-[16px] ${className}`}>
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   DOCUMENTS PAGE — Entity-Aware, Real Data, Upload + Process
   ════════════════════════════════════════════════════════════════ */
export default function DocumentsPage() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [plan, setPlan] = useState<SavedPlan | null>(null);
  const [entityType, setEntityType] = useState<EntityType | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("all");
  const [uploadingFiles, setUploadingFiles] = useState<{ name: string; progress: number; id: string; status: "uploading" | "processing" | "done" | "error" }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<UploadedDocument | null>(null);

  useEffect(() => {
    setDocuments(getDocuments());
    setPlan(getPlan());
    setEntityType(getEntityType());
  }, []);

  const entityInfo = entityType ? getEntityInfo(entityType) : null;
  const accentColor = entityInfo?.color || "#DC5700";
  const recommendedDocs = getRecommendedDocuments(plan);
  const requiredDocs = recommendedDocs.filter((d) => d.priority === "required");

  // Check which required docs have been uploaded
  const uploadedTypes = new Set(documents.map((d) => d.type));
  const missingRequired = requiredDocs.filter((d) => !uploadedTypes.has(d.type));
  const completedRequired = requiredDocs.filter((d) => uploadedTypes.has(d.type));

  // Filter documents
  const filteredDocuments = documents
    .filter((doc) => matchesTab(doc, activeTab))
    .filter((doc) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return doc.name.toLowerCase().includes(q) || doc.type.toLowerCase().includes(q);
    });

  // Stats
  const totalDocs = documents.length;
  const processedDocs = documents.filter((d) => d.status === "processed").length;
  const pendingDocs = documents.filter((d) => d.status === "processing" || d.status === "uploaded").length;

  /* ─── Upload handler — real API call ─── */
  const handleUpload = useCallback(async (files: File[]) => {
    for (const file of files) {
      const uploadId = crypto.randomUUID();
      const detectedType = inferDocType(file.name);

      // Add to uploading state
      setUploadingFiles((prev) => [...prev, { name: file.name, progress: 0, id: uploadId, status: "uploading" }]);

      try {
        // Step 1: Upload
        const formData = new FormData();
        formData.append("file", file);

        // Simulate progress for upload
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += Math.random() * 15 + 5;
          if (progress > 60) progress = 60;
          setUploadingFiles((prev) =>
            prev.map((f) => f.id === uploadId ? { ...f, progress: Math.min(progress, 60) } : f)
          );
        }, 300);

        const uploadRes = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);

        if (!uploadRes.ok) throw new Error("Upload failed");

        const uploadData = await uploadRes.json();
        setUploadingFiles((prev) =>
          prev.map((f) => f.id === uploadId ? { ...f, progress: 65, status: "processing" } : f)
        );

        // Step 2: Process with AI
        const processFormData = new FormData();
        processFormData.append("file", file);
        processFormData.append("documentId", uploadData.id);
        processFormData.append("documentType", detectedType);

        // Simulate processing progress
        let procProgress = 65;
        const procInterval = setInterval(() => {
          procProgress += Math.random() * 8 + 2;
          if (procProgress > 95) procProgress = 95;
          setUploadingFiles((prev) =>
            prev.map((f) => f.id === uploadId ? { ...f, progress: Math.min(procProgress, 95) } : f)
          );
        }, 500);

        const processRes = await fetch("/api/documents/process", {
          method: "POST",
          body: processFormData,
        });

        clearInterval(procInterval);

        const processData = processRes.ok ? await processRes.json() : null;

        // Complete
        setUploadingFiles((prev) =>
          prev.map((f) => f.id === uploadId ? { ...f, progress: 100, status: "done" } : f)
        );

        // Save to localStorage
        const newDoc: UploadedDocument = {
          id: uploadData.id || uploadId,
          name: file.name,
          type: processData?.classification?.documentType || detectedType,
          status: processData ? "processed" : "uploaded",
          uploadedAt: new Date().toISOString(),
          extractedData: processData?.extractedData?.fields
            ? Object.fromEntries(
                processData.extractedData.fields.map((f: { name: string; value: string }) => [f.name, f.value])
              )
            : undefined,
        };

        addDocument(newDoc);
        setDocuments((prev) => [newDoc, ...prev]);

        // Remove from uploading after a moment
        setTimeout(() => {
          setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadId));
        }, 1500);

      } catch (err) {
        console.error("Upload error:", err);
        setUploadingFiles((prev) =>
          prev.map((f) => f.id === uploadId ? { ...f, status: "error", progress: 100 } : f)
        );

        // Still save locally as uploaded (even if processing failed)
        const fallbackDoc: UploadedDocument = {
          id: uploadId,
          name: file.name,
          type: detectedType,
          status: "uploaded",
          uploadedAt: new Date().toISOString(),
        };
        addDocument(fallbackDoc);
        setDocuments((prev) => [fallbackDoc, ...prev]);

        setTimeout(() => {
          setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadId));
        }, 3000);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleUpload,
    accept: { "application/pdf": [".pdf"], "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] },
    maxSize: 25 * 1024 * 1024,
  });

  const handleDelete = (id: string) => {
    const updated = documents.filter((doc) => doc.id !== id);
    setDocuments(updated);
    saveDocuments(updated);
    if (selectedDoc?.id === id) setSelectedDoc(null);
  };

  return (
    <div className="space-y-8">
      {/* ─── Header ─── */}
      <motion.div initial="hidden" animate="visible" custom={0} variants={fadeIn}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white md:text-3xl">
              Document Intelligence
            </h1>
            <p className="mt-1 text-slate-500">
              {entityInfo
                ? `Upload and process your ${entityInfo.label} (${entityInfo.formNumber}) tax documents.`
                : "Upload, process, and manage your tax documents with AI."}
            </p>
          </div>
          {entityInfo && (
            <span
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider"
              style={{
                backgroundColor: `${accentColor}12`,
                color: accentColor,
                border: `1px solid ${accentColor}25`,
              }}
            >
              <Building2 className="h-4 w-4" />
              {entityInfo.label}
            </span>
          )}
        </div>
      </motion.div>

      {/* ─── Stats ─── */}
      <motion.div initial="hidden" animate="visible" custom={0.5} variants={fadeIn}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Documents", value: String(totalDocs), icon: FileText, color: accentColor },
            { label: "Processed", value: String(processedDocs), icon: CheckCircle2, color: "#10B981" },
            { label: "Pending", value: String(pendingDocs), icon: Clock, color: "#F59E0B" },
            { label: "Required Left", value: String(missingRequired.length), icon: AlertCircle, color: missingRequired.length === 0 ? "#10B981" : "#EF4444" },
          ].map((stat, i) => (
            <GlassPanel key={stat.label} className="!p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>
      </motion.div>

      {/* ─── Required Documents Checklist ─── */}
      {requiredDocs.length > 0 && (
        <motion.div initial="hidden" animate="visible" custom={1} variants={fadeIn}>
          <GlassPanel>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg p-1.5" style={{ backgroundColor: `${accentColor}15` }}>
                  <ShieldCheck className="h-4 w-4" style={{ color: accentColor }} />
                </div>
                <h3 className="text-base font-semibold text-white">
                  Required Documents
                  {entityInfo && <span className="text-xs font-normal text-slate-500 ml-2">for {entityInfo.label}</span>}
                </h3>
              </div>
              <span className="text-xs font-medium text-slate-400">
                {completedRequired.length}/{requiredDocs.length} uploaded
              </span>
            </div>

            {/* Progress bar */}
            <div className="mb-4 h-1.5 w-full rounded-full bg-[#1F1F25]">
              <div
                className="h-1.5 rounded-full transition-all duration-700"
                style={{
                  width: `${requiredDocs.length > 0 ? (completedRequired.length / requiredDocs.length) * 100 : 0}%`,
                  background: `linear-gradient(to right, ${accentColor}, ${accentColor}99)`,
                }}
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {requiredDocs.map((doc) => {
                const isUploaded = uploadedTypes.has(doc.type);
                return (
                  <div
                    key={doc.type}
                    className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                      isUploaded
                        ? "border-green-500/10 bg-green-500/5"
                        : "border-white/[0.05] bg-[rgba(31,31,37,0.5)]"
                    }`}
                  >
                    {isUploaded ? (
                      <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-600 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isUploaded ? "text-green-400" : "text-slate-200"}`}>
                        {doc.label}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">{doc.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {missingRequired.length === 0 && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-green-500/5 border border-green-500/10 p-3">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <p className="text-sm font-medium text-green-400">All required documents uploaded!</p>
              </div>
            )}
          </GlassPanel>
        </motion.div>
      )}

      {/* ─── No Plan CTA ─── */}
      {!plan && (
        <motion.div initial="hidden" animate="visible" custom={1.2} variants={fadeIn}>
          <Link href="/dashboard/smart-plan">
            <div
              className="group rounded-2xl border p-5 transition-all duration-200 hover:shadow-lg"
              style={{ borderColor: `${accentColor}20`, background: `linear-gradient(135deg, ${accentColor}08 0%, rgba(27,27,32,0.8) 100%)` }}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${accentColor}15` }}>
                  <Sparkles className="h-6 w-6" style={{ color: accentColor }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white">Complete Your Smart Plan First</h3>
                  <p className="mt-0.5 text-sm text-slate-400">
                    Your Smart Plan determines exactly which documents you need. Complete it for personalized recommendations.
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-600 group-hover:translate-x-1 transition-transform" style={{ color: accentColor }} />
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      {/* ─── Upload Zone ─── */}
      <motion.div initial="hidden" animate="visible" custom={1.5} variants={fadeIn}>
        <div
          {...getRootProps()}
          className={`rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? "border-opacity-50 bg-opacity-5"
              : "border-[rgba(255,255,255,0.08)]"
          }`}
          style={{
            borderColor: isDragActive ? accentColor : undefined,
            backgroundColor: isDragActive ? `${accentColor}08` : "rgba(27,27,32,0.4)",
          }}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center transition-colors"
              style={{ backgroundColor: isDragActive ? `${accentColor}15` : "rgba(31,31,37,0.8)" }}
            >
              <Upload className="w-6 h-6" style={{ color: isDragActive ? accentColor : "#94A3B8" }} />
            </div>
            <div>
              <p className="text-base font-bold text-white">
                {isDragActive ? "Drop files here..." : "Drop files or click to browse"}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                PDF, PNG, JPG up to 25MB — AI will classify and extract data automatically
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Upload Progress ─── */}
      <AnimatePresence>
        {uploadingFiles.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {uploadingFiles.map((file) => (
              <GlassPanel key={file.id} className="!p-4">
                <div className="flex items-center gap-3 mb-2">
                  {file.status === "error" ? (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  ) : file.status === "done" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <Clock className="w-4 h-4 animate-pulse" style={{ color: accentColor }} />
                  )}
                  <span className="text-sm font-medium text-white flex-1 truncate">{file.name}</span>
                  <span className="text-xs text-slate-400">
                    {file.status === "uploading" && "Uploading..."}
                    {file.status === "processing" && "AI Processing..."}
                    {file.status === "done" && "Complete"}
                    {file.status === "error" && "Error — saved locally"}
                  </span>
                  <span className="text-xs font-bold" style={{ color: accentColor }}>
                    {Math.round(file.progress)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[#1F1F25] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${file.progress}%`,
                      backgroundColor: file.status === "error" ? "#EF4444" : file.status === "done" ? "#10B981" : accentColor,
                    }}
                  />
                </div>
              </GlassPanel>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Filters + Search + View Toggle ─── */}
      {documents.length > 0 && (
        <motion.div initial="hidden" animate="visible" custom={2} variants={fadeIn}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="px-4 py-2 rounded-full text-xs font-semibold transition-all"
                  style={
                    activeTab === tab.key
                      ? { backgroundColor: `${accentColor}15`, color: accentColor }
                      : { color: "#94A3B8" }
                  }
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.key) (e.target as HTMLElement).style.backgroundColor = "rgba(31,31,37,0.8)";
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.key) (e.target as HTMLElement).style.backgroundColor = "transparent";
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 rounded-lg border border-white/[0.05] bg-[rgba(31,31,37,0.5)] pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-opacity-20 focus:outline-none"
                  style={{ borderColor: searchQuery ? `${accentColor}30` : undefined }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              {/* View toggle */}
              <div className="flex items-center gap-1 rounded-lg border border-white/[0.05] bg-[rgba(27,27,32,0.6)] p-1">
                <button
                  className="p-2 rounded-md transition-colors"
                  style={viewMode === "grid" ? { backgroundColor: `${accentColor}15`, color: accentColor } : { color: "#94A3B8" }}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  className="p-2 rounded-md transition-colors"
                  style={viewMode === "list" ? { backgroundColor: `${accentColor}15`, color: accentColor } : { color: "#94A3B8" }}
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── Document Grid / List ─── */}
      {documents.length > 0 && (
        <motion.div initial="hidden" animate="visible" custom={2.5} variants={fadeIn}>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocuments.map((doc, i) => {
                const status = statusConfig[doc.status] || statusConfig.uploaded;
                const typeStyle = docTypeColor(doc.type, accentColor);
                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                  >
                    <div className="rounded-2xl border border-white/[0.05] bg-[rgba(27,27,32,0.6)] p-5 group relative hover:bg-[rgba(31,31,37,0.8)] transition-colors">
                      {/* Thumbnail */}
                      <div className="w-full h-28 rounded-xl bg-[#1B1B20] flex items-center justify-center mb-4">
                        <File className="w-10 h-10 text-slate-700" />
                      </div>
                      {/* Name */}
                      <h3 className="text-sm font-bold text-white truncate">{doc.name}</h3>
                      {/* Type + date */}
                      <div className="flex items-center justify-between mt-2">
                        <span
                          className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                          style={{ backgroundColor: typeStyle.bg, color: typeStyle.text }}
                        >
                          {docTypeLabel(doc.type)}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(doc.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      {/* Status */}
                      <div className="flex items-center gap-1.5 mt-3">
                        <span className={`w-2 h-2 rounded-full ${status.dotColor}`} />
                        <span className="text-xs font-medium text-slate-400">{status.label}</span>
                      </div>
                      {/* Extracted data preview */}
                      {doc.extractedData && Object.keys(doc.extractedData).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/[0.05]">
                          {Object.entries(doc.extractedData).slice(0, 2).map(([key, val]) => (
                            <p key={key} className="text-[10px] text-slate-500 truncate">
                              <span className="text-slate-400">{key}:</span> {val}
                            </p>
                          ))}
                        </div>
                      )}
                      {/* Actions */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.05]">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {doc.extractedData && (
                            <button
                              className="p-1.5 rounded-md hover:bg-white/5 text-slate-500 hover:text-cyan-400 transition-colors"
                              onClick={() => setSelectedDoc(selectedDoc?.id === doc.id ? null : doc)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            className="p-1.5 rounded-md hover:bg-white/5 text-slate-500 hover:text-red-400 transition-colors"
                            onClick={() => handleDelete(doc.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {/* Processing overlay */}
                      {doc.status === "processing" && (
                        <div className="absolute inset-0 rounded-2xl bg-[#131318]/70 backdrop-blur-sm flex items-center justify-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${accentColor} transparent ${accentColor} ${accentColor}` }} />
                            <span className="text-xs font-medium" style={{ color: accentColor }}>Processing...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocuments.map((doc, i) => {
                const status = statusConfig[doc.status] || statusConfig.uploaded;
                const typeStyle = docTypeColor(doc.type, accentColor);
                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                  >
                    <div className="rounded-xl border border-white/[0.05] bg-[rgba(27,27,32,0.6)] p-4 hover:bg-[rgba(31,31,37,0.8)] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[#1B1B20] flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5" style={{ color: accentColor }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-white truncate">{doc.name}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(doc.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                        <span
                          className="text-xs font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: typeStyle.bg, color: typeStyle.text }}
                        >
                          {docTypeLabel(doc.type)}
                        </span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={`w-2 h-2 rounded-full ${status.dotColor}`} />
                          <span className="text-xs font-medium text-slate-400">{status.label}</span>
                        </div>
                        {doc.extractedData && Object.keys(doc.extractedData).length > 0 && (
                          <span className="hidden lg:inline text-[10px] text-slate-500 flex-shrink-0">
                            {Object.keys(doc.extractedData).length} fields
                          </span>
                        )}
                        <div className="flex items-center gap-1 ml-2">
                          {doc.extractedData && (
                            <button
                              className="p-2 rounded-md hover:bg-white/5 text-slate-500 hover:text-cyan-400 transition-colors"
                              onClick={() => setSelectedDoc(selectedDoc?.id === doc.id ? null : doc)}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            className="p-2 rounded-md hover:bg-white/5 text-slate-500 hover:text-red-400 transition-colors"
                            onClick={() => handleDelete(doc.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ─── Extracted Data Detail Panel ─── */}
      <AnimatePresence>
        {selectedDoc && selectedDoc.extractedData && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <GlassPanel>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-white">Extracted Data</h3>
                  <p className="text-xs text-slate-500">{selectedDoc.name}</p>
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-1.5 rounded-md hover:bg-white/5 text-slate-500 hover:text-white transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(selectedDoc.extractedData).map(([key, val]) => (
                  <div key={key} className="rounded-xl border border-white/[0.05] bg-[rgba(31,31,37,0.5)] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{key}</p>
                    <p className="text-sm font-medium text-white">{val}</p>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Empty State ─── */}
      {documents.length === 0 && uploadingFiles.length === 0 && (
        <motion.div initial="hidden" animate="visible" custom={2} variants={fadeIn}>
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${accentColor}10` }}>
              <FileText className="w-8 h-8" style={{ color: accentColor }} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No documents yet</h3>
            <p className="text-sm text-slate-500 mb-4">
              Upload your first document above — AI will classify and extract data automatically.
            </p>
            {missingRequired.length > 0 && (
              <p className="text-xs text-slate-500">
                You have <strong className="text-white">{missingRequired.length} required documents</strong> to upload for your {entityInfo?.label || "tax"} plan.
              </p>
            )}
          </div>
        </motion.div>
      )}

      {filteredDocuments.length === 0 && documents.length > 0 && (
        <div className="text-center py-12">
          <FileText className="w-10 h-10 text-slate-700 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No documents match this filter</p>
        </div>
      )}
    </div>
  );
}

/* ─── Circle icon (used in checklist) ─── */
function Circle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}
