"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
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
} from "lucide-react";

/* ── Types ── */
type DocStatus = "processing" | "processed" | "ready" | "error";
interface Document {
  id: string;
  name: string;
  type: string;
  status: DocStatus;
  uploadedAt: string;
  taxYear: string;
}

/* ── Mock data ── */
const mockDocuments: Document[] = [
  { id: "1", name: "W-2 Form 2024", type: "W-2", status: "processed", uploadedAt: "Jan 15, 2025", taxYear: "2024" },
  { id: "2", name: "1099-NEC Consulting", type: "1099-NEC", status: "processed", uploadedAt: "Jan 18, 2025", taxYear: "2024" },
  { id: "3", name: "K-1 Partnership", type: "K-1", status: "processing", uploadedAt: "Jan 20, 2025", taxYear: "2024" },
  { id: "4", name: "Bank Statement Q4", type: "Bank Statement", status: "processed", uploadedAt: "Jan 22, 2025", taxYear: "2024" },
  { id: "5", name: "Mortgage Statement", type: "Mortgage", status: "processed", uploadedAt: "Jan 25, 2025", taxYear: "2024" },
  { id: "6", name: "Charitable Donation Receipt", type: "Receipt", status: "ready", uploadedAt: "Feb 1, 2025", taxYear: "2024" },
  { id: "7", name: "Business Expense Report", type: "Expense Report", status: "processed", uploadedAt: "Feb 5, 2025", taxYear: "2024" },
  { id: "8", name: "Property Tax Statement", type: "Property Tax", status: "processed", uploadedAt: "Feb 10, 2025", taxYear: "2024" },
];

const tabFilters: Record<string, (doc: Document) => boolean> = {
  all: () => true,
  "tax-forms": (doc) => ["W-2", "1099-NEC", "K-1"].includes(doc.type),
  statements: (doc) => ["Bank Statement", "Mortgage", "Property Tax"].includes(doc.type),
  receipts: (doc) => ["Receipt", "Expense Report"].includes(doc.type),
};

const tabs = [
  { key: "all", label: "All" },
  { key: "tax-forms", label: "Tax Forms" },
  { key: "statements", label: "Statements" },
  { key: "receipts", label: "Receipts" },
];

/* ── Type badge colors (dark-themed) ── */
const typeColors: Record<string, { bg: string; text: string }> = {
  "W-2": { bg: "bg-[#4CD6FB]/10", text: "text-[#4CD6FB]" },
  "1099-NEC": { bg: "bg-[#FFB596]/10", text: "text-[#FFB596]" },
  "K-1": { bg: "bg-[#BFC2FF]/10", text: "text-[#BFC2FF]" },
  "Bank Statement": { bg: "bg-[#4CD6FB]/10", text: "text-[#4CD6FB]" },
  Mortgage: { bg: "bg-[#FFB4AB]/10", text: "text-[#FFB4AB]" },
  Receipt: { bg: "bg-[#FFB596]/10", text: "text-[#FFB596]" },
  "Expense Report": { bg: "bg-[#BFC2FF]/10", text: "text-[#BFC2FF]" },
  "Property Tax": { bg: "bg-[#FFB596]/10", text: "text-[#FFB596]" },
};

const statusConfig: Record<string, { icon: typeof CheckCircle2; label: string; dotColor: string }> = {
  processed: { icon: CheckCircle2, label: "Processed", dotColor: "bg-emerald-400" },
  processing: { icon: Clock, label: "Processing", dotColor: "bg-[#FFB596] animate-pulse" },
  ready: { icon: CheckCircle2, label: "Ready", dotColor: "bg-[#4CD6FB]" },
  error: { icon: AlertCircle, label: "Error", dotColor: "bg-[#FFB4AB]" },
};

const stats = [
  { label: "Total Documents", value: "8", icon: FileText, color: "#4CD6FB" },
  { label: "Processed", value: "6", icon: CheckCircle2, color: "#FFB596" },
  { label: "Pending", value: "1", icon: Clock, color: "#BFC2FF" },
  { label: "Tax Year", value: "2024", icon: FileText, color: "#4CD6FB" },
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("all");
  const [uploadingFiles, setUploadingFiles] = useState<{ name: string; progress: number; id: string }[]>([]);

  const filteredDocuments = documents.filter(tabFilters[activeTab] || tabFilters.all);

  /* ── Upload logic ── */
  const handleUpload = useCallback((files: File[]) => {
    const newUploading = files.map((file) => ({
      name: file.name,
      progress: 0,
      id: crypto.randomUUID(),
    }));
    setUploadingFiles((prev) => [...prev, ...newUploading]);

    newUploading.forEach((uploadFile) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 25;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          const newDoc: Document = {
            id: uploadFile.id,
            name: uploadFile.name,
            type: "W-2",
            status: "processing",
            uploadedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            taxYear: "2024",
          };
          setDocuments((prev) => [newDoc, ...prev]);
          setTimeout(() => {
            setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadFile.id));
          }, 500);
        }
        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: Math.min(progress, 100) } : f))
        );
      }, 400);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleUpload,
    accept: { "application/pdf": [".pdf"], "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] },
  });

  const handleDelete = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  return (
    <div className="space-y-8 p-6">
      {/* ── Editorial Header ── */}
      <div>
        <p className="text-xs font-medium text-[#4CD6FB] uppercase tracking-[0.2em] mb-2">
          AI-POWERED DOCUMENT PROCESSING
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight text-[#E4E1E9]">
          Document Intelligence
        </h1>
        <p className="text-[#C7C5D3] mt-2 text-sm">
          Upload, process, and manage your tax documents with AI-powered extraction.
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <div className="glass-card p-5 rounded-xl">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}10` }}
                >
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#C7C5D3] uppercase tracking-widest">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-extrabold tracking-tighter text-[#E4E1E9]">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Upload Zone (react-dropzone) ── */}
      <div
        {...getRootProps()}
        className={`glass-card rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 border-2 border-dashed ${
          isDragActive ? "border-[#4CD6FB]/50 bg-[#4CD6FB]/5" : "border-[#464651]/30"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isDragActive ? "bg-[#4CD6FB]/10" : "bg-[#2A292F]"
            }`}
          >
            <Upload className={`w-6 h-6 ${isDragActive ? "text-[#4CD6FB]" : "text-[#C7C5D3]"}`} />
          </div>
          <div>
            <p className="text-base font-bold text-[#E4E1E9]">
              {isDragActive ? "Drop files here..." : "Drop files or click to browse"}
            </p>
            <p className="text-sm text-[#C7C5D3] mt-1">Supports PDF, PNG, JPG up to 25MB</p>
          </div>
        </div>
      </div>

      {/* ── Uploading Progress ── */}
      <AnimatePresence>
        {uploadingFiles.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {uploadingFiles.map((file) => (
              <div key={file.id} className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-4 h-4 text-[#FFB596] animate-pulse" />
                  <span className="text-sm font-medium text-[#E4E1E9]">{file.name}</span>
                  <span className="text-xs text-[#C7C5D3] ml-auto">{Math.round(file.progress)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#2A292F] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#FFB596] transition-all duration-300"
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pill Tab Filters + View Toggle ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-[#FFB596]/15 text-[#FFB596]"
                  : "text-[#C7C5D3] hover:bg-[#2A292F] hover:text-[#E4E1E9]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-[#1B1B20] rounded-lg p-1">
          <button
            className={`p-2 rounded-md transition-colors ${
              viewMode === "grid" ? "bg-[#2A292F] text-[#FFB596]" : "text-[#C7C5D3] hover:text-[#E4E1E9]"
            }`}
            onClick={() => setViewMode("grid")}
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button
            className={`p-2 rounded-md transition-colors ${
              viewMode === "list" ? "bg-[#2A292F] text-[#FFB596]" : "text-[#C7C5D3] hover:text-[#E4E1E9]"
            }`}
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Document Grid / List ── */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocuments.map((doc, i) => {
            const status = statusConfig[doc.status];
            const typeStyle = typeColors[doc.type] || { bg: "bg-[#35343A]", text: "text-[#C7C5D3]" };
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
              >
                <div className="glass-card p-5 rounded-2xl group relative hover:bg-[#2A292F]/60 transition-colors">
                  {/* Thumbnail */}
                  <div className="w-full h-28 rounded-xl bg-[#1B1B20] flex items-center justify-center mb-4">
                    <File className="w-10 h-10 text-[#464651]" />
                  </div>
                  {/* Name */}
                  <h3 className="text-sm font-bold text-[#E4E1E9] truncate">{doc.name}</h3>
                  {/* Type badge + tax year */}
                  <div className="flex items-center justify-between mt-2">
                    <span className={`${typeStyle.bg} ${typeStyle.text} text-xs font-medium px-2.5 py-0.5 rounded-full`}>
                      {doc.type}
                    </span>
                    <span className="text-xs text-[#C7C5D3]">{doc.taxYear}</span>
                  </div>
                  {/* Status */}
                  <div className="flex items-center gap-1.5 mt-3">
                    <span className={`w-2 h-2 rounded-full ${status.dotColor}`} />
                    <span className="text-xs font-medium text-[#C7C5D3]">{status.label}</span>
                  </div>
                  {/* Date & actions */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#35343A]/50">
                    <p className="text-xs text-[#C7C5D3]">{doc.uploadedAt}</p>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 rounded-md hover:bg-[#35343A] text-[#C7C5D3] hover:text-[#4CD6FB] transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="p-1.5 rounded-md hover:bg-[#35343A] text-[#C7C5D3] hover:text-[#FFB4AB] transition-colors"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {/* Processing overlay */}
                  {doc.status === "processing" && (
                    <div className="absolute inset-0 rounded-2xl bg-[#131318]/60 backdrop-blur-sm flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-[#FFB596] border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-medium text-[#FFB596]">Processing...</span>
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
            const status = statusConfig[doc.status];
            const typeStyle = typeColors[doc.type] || { bg: "bg-[#35343A]", text: "text-[#C7C5D3]" };
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
              >
                <div className="glass-card rounded-xl p-4 hover:bg-[#2A292F]/60 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-[#1B1B20] flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-[#4CD6FB]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#E4E1E9] truncate">{doc.name}</p>
                        <p className="text-xs text-[#C7C5D3]">{doc.uploadedAt}</p>
                      </div>
                      <span className={`${typeStyle.bg} ${typeStyle.text} text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0`}>
                        {doc.type}
                      </span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`w-2 h-2 rounded-full ${status.dotColor}`} />
                        <span className="text-xs font-medium text-[#C7C5D3]">{status.label}</span>
                      </div>
                      <span className="text-xs text-[#C7C5D3] flex-shrink-0">{doc.taxYear}</span>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <button className="p-2 rounded-md hover:bg-[#35343A] text-[#C7C5D3] hover:text-[#4CD6FB] transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 rounded-md hover:bg-[#35343A] text-[#C7C5D3] hover:text-[#FFB4AB] transition-colors"
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

      {filteredDocuments.length === 0 && (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-[#464651] mx-auto mb-3" />
          <p className="text-sm text-[#C7C5D3]">No documents found in this category</p>
        </div>
      )}
    </div>
  );
}
