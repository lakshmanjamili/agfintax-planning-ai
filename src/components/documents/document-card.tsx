"use client";

import { motion } from "framer-motion";
import { FileText, Eye, Trash2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface Document {
  id: string;
  name: string;
  type: string;
  status: "processing" | "processed" | "ready" | "error";
  uploadedAt: string;
  taxYear: string;
}

interface DocumentCardProps {
  document: Document;
  view: "grid" | "list";
  onView?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const typeColors: Record<string, string> = {
  "W-2": "bg-blue-100 text-blue-700 border-blue-200",
  "1099-NEC": "bg-green-100 text-green-700 border-green-200",
  "K-1": "bg-purple-100 text-purple-700 border-purple-200",
  "Bank Statement": "bg-amber-100 text-amber-700 border-amber-200",
  "Mortgage": "bg-rose-100 text-rose-700 border-rose-200",
  "Receipt": "bg-teal-100 text-teal-700 border-teal-200",
  "Expense Report": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Property Tax": "bg-orange-100 text-orange-700 border-orange-200",
};

const statusConfig: Record<
  string,
  { icon: typeof CheckCircle2; label: string; className: string }
> = {
  processed: {
    icon: CheckCircle2,
    label: "Processed",
    className: "text-green-600",
  },
  processing: {
    icon: Clock,
    label: "Processing",
    className: "text-[#ff6600] animate-pulse",
  },
  ready: {
    icon: CheckCircle2,
    label: "Ready",
    className: "text-blue-600",
  },
  error: {
    icon: AlertCircle,
    label: "Error",
    className: "text-red-600",
  },
};

function getTypeBadgeClass(type: string): string {
  return typeColors[type] || "bg-gray-100 text-gray-700 border-gray-200";
}

export function DocumentCard({
  document,
  view,
  onView,
  onDelete,
}: DocumentCardProps) {
  const status = statusConfig[document.status];
  const StatusIcon = status.icon;

  if (view === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-[#03045e]/5 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-[#03045e]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#03045e] truncate">
                  {document.name}
                </p>
                <p className="text-xs text-gray-500">{document.uploadedAt}</p>
              </div>
              <Badge
                variant="outline"
                className={`${getTypeBadgeClass(document.type)} text-xs flex-shrink-0`}
              >
                {document.type}
              </Badge>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <StatusIcon className={`w-4 h-4 ${status.className}`} />
                <span className={`text-xs font-medium ${status.className}`}>
                  {status.label}
                </span>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {document.taxYear}
              </span>
            </div>
            <div className="flex items-center gap-1 ml-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:text-[#ff6600]"
                onClick={() => onView?.(document.id)}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:text-red-600"
                onClick={() => onDelete?.(document.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="p-5 hover:shadow-lg transition-all duration-200 group">
        {/* Thumbnail placeholder */}
        <div className="w-full h-28 rounded-lg bg-gradient-to-br from-[#03045e]/5 to-[#03045e]/10 flex items-center justify-center mb-4">
          <FileText className="w-10 h-10 text-[#03045e]/30" />
        </div>

        {/* Name & type */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[#03045e] truncate">
            {document.name}
          </h3>
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className={`${getTypeBadgeClass(document.type)} text-xs`}
            >
              {document.type}
            </Badge>
            <span className="text-xs text-gray-400">{document.taxYear}</span>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5 mt-3">
          <StatusIcon className={`w-4 h-4 ${status.className}`} />
          <span className={`text-xs font-medium ${status.className}`}>
            {status.label}
          </span>
        </div>

        {/* Date & actions */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <p className="text-xs text-gray-500">{document.uploadedAt}</p>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:text-[#ff6600]"
              onClick={() => onView?.(document.id)}
            >
              <Eye className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:text-red-600"
              onClick={() => onDelete?.(document.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Processing animation overlay */}
        {document.status === "processing" && (
          <div className="absolute inset-0 rounded-lg bg-white/60 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-[#ff6600] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium text-[#ff6600]">
                Processing...
              </span>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
