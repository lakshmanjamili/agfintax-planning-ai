"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedFile {
  file: File;
  id: string;
}

interface UploadZoneProps {
  onUpload: (files: File[]) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadZone({ onUpload }: UploadZoneProps) {
  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map((file) => ({
        file,
        id: crypto.randomUUID(),
      }));
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      onUpload(acceptedFiles);
    },
    [onUpload]
  );

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200",
          isDragActive
            ? "border-[#ff6600] bg-[#ff6600]/5"
            : "border-gray-300 hover:border-[#ff6600]/50 hover:bg-gray-50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-colors",
              isDragActive ? "bg-[#ff6600]/10" : "bg-gray-100"
            )}
          >
            <Upload
              className={cn(
                "w-6 h-6 transition-colors",
                isDragActive ? "text-[#ff6600]" : "text-gray-400"
              )}
            />
          </div>
          <div>
            <p className="text-base font-medium text-[#03045e]">
              {isDragActive
                ? "Drop files here..."
                : "Drop files here or click to upload"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Supports PDF, PNG, JPG, JPEG
            </p>
          </div>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-[#03045e]">
            Selected Files ({selectedFiles.length})
          </p>
          {selectedFiles.map(({ file, id }) => (
            <div
              key={id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#ff6600]" />
                <div>
                  <p className="text-sm font-medium text-[#03045e]">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(id);
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
