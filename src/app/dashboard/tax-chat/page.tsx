"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  Brain,
  MessageSquare,
  Plus,
  Send,
  Square,
  Menu,
  Paperclip,
  Zap,
  Download,
  FileText,
  X,
  Loader2,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChatMessage } from "@/components/tax-chat/chat-message";
import { SuggestedQuestions } from "@/components/tax-chat/suggested-questions";
import { useChat } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Mock previous chat sessions                                       */
/* ------------------------------------------------------------------ */
const mockSessions = [
  {
    id: "1",
    title: "R&D Credit Analysis",
    timestamp: "2 hours ago",
    active: true,
  },
  {
    id: "2",
    title: "S-Corp vs LLC Inquiry",
    timestamp: "Yesterday",
    active: false,
  },
  {
    id: "3",
    title: "Capital Gains Forecast",
    timestamp: "Jan 12, 2024",
    active: false,
  },
  {
    id: "4",
    title: "1031 Exchange Strategy",
    timestamp: "Jan 08, 2024",
    active: false,
  },
];

/* ------------------------------------------------------------------ */
/*  Sidebar content (reused in desktop & mobile sheet)                */
/* ------------------------------------------------------------------ */
function ChatHistorySidebar({
  activeId,
  onNewChat,
}: {
  activeId: string | null;
  onNewChat: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-[#1B1B20]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#464651]/10 px-4 py-4">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#C7C5D3]">
          History
        </span>
        <button
          onClick={onNewChat}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#464651]/20 text-[#C7C5D3] transition-colors hover:bg-[#2A292F] hover:text-[#E4E1E9]"
          title="New chat"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Sessions list */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {mockSessions.map((session) => (
            <button
              key={session.id}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                (activeId === session.id || (!activeId && session.active))
                  ? "bg-[#2A292F] border border-white/5"
                  : "border border-transparent text-[#C7C5D3] hover:bg-[#2A292F]/50"
              )}
            >
              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-[#C7C5D3]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#E4E1E9]">
                  {session.title}
                </p>
                <p className="mt-0.5 text-[11px] text-[#C7C5D3]/60">
                  {session.timestamp}
                </p>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

/* ================================================================== */
/*  Main page                                                         */
/* ================================================================== */
export default function TaxChatPage() {
  const { messages, isLoading, sendMessage, stop, clear } = useChat();
  const [input, setInput] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<Array<{ file: File; name: string; status: "pending" | "processing" | "done" | "error"; extractedText?: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasMessages = messages.length > 0;

  /* Auto-scroll on new messages */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  /* File upload handler */
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files).map((file) => ({
      file,
      name: file.name,
      status: "pending" as const,
    }));

    setAttachedFiles((prev) => [...prev, ...newFiles]);
    setIsUploading(true);

    // Process each file
    for (const fileEntry of newFiles) {
      setAttachedFiles((prev) =>
        prev.map((f) => f.name === fileEntry.name ? { ...f, status: "processing" as const } : f)
      );

      try {
        const formData = new FormData();
        formData.append("file", fileEntry.file);

        const response = await fetch("/api/documents/process", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Upload failed");

        const result = await response.json();
        const extractedText = result.ocr?.text ||
          result.extractedData?.fields?.map((f: { name: string; value: string }) => `${f.name}: ${f.value}`).join("\n") ||
          `Document: ${fileEntry.name} (${result.classification?.documentType || "unknown"})`;

        setAttachedFiles((prev) =>
          prev.map((f) => f.name === fileEntry.name ? { ...f, status: "done" as const, extractedText } : f)
        );
      } catch {
        setAttachedFiles((prev) =>
          prev.map((f) => f.name === fileEntry.name ? { ...f, status: "error" as const } : f)
        );
      }
    }

    setIsUploading(false);
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const removeFile = (name: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.name !== name));
  };

  /* Send handler */
  const handleSend = () => {
    const trimmed = input.trim();
    const hasFiles = attachedFiles.some((f) => f.status === "done");
    if ((!trimmed && !hasFiles) || isLoading) return;

    // Build message with file context
    let fullMessage = trimmed;
    const doneFiles = attachedFiles.filter((f) => f.status === "done");
    if (doneFiles.length > 0) {
      const fileContext = doneFiles
        .map((f) => `[Uploaded Document: ${f.name}]\n${f.extractedText}`)
        .join("\n\n");
      fullMessage = fileContext + (trimmed ? `\n\nUser question: ${trimmed}` : "\n\nPlease analyze the uploaded document(s) and provide tax-relevant insights, deductions, and strategies.");
    }

    sendMessage(fullMessage);
    setInput("");
    setAttachedFiles([]);
    textareaRef.current?.focus();
  };

  /* Keyboard shortcut */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* Suggested question click */
  const handleSuggestedClick = (question: string) => {
    sendMessage(question);
  };

  /* New chat */
  const handleNewChat = () => {
    clear();
    setInput("");
    textareaRef.current?.focus();
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] overflow-hidden">
      {/* ------------------------------------------------------------ */}
      {/*  Desktop sidebar                                             */}
      {/* ------------------------------------------------------------ */}
      <aside className="hidden w-80 shrink-0 border-r border-[#464651]/10 md:flex md:flex-col">
        <ChatHistorySidebar activeId={null} onNewChat={handleNewChat} />
      </aside>

      {/* ------------------------------------------------------------ */}
      {/*  Main chat area                                              */}
      {/* ------------------------------------------------------------ */}
      <div className="relative flex flex-1 flex-col ai-chat-gradient">
        {/* Top Header Bar — glass panel */}
        <header className="absolute top-0 left-0 right-0 z-10 flex h-16 items-center justify-between border-b border-[#464651]/10 px-5 glass-panel">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-[#C7C5D3] hover:bg-[#2A292F]">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 border-r border-[#464651]/10 bg-[#1B1B20] p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Chat History</SheetTitle>
                </SheetHeader>
                <ChatHistorySidebar activeId={null} onNewChat={handleNewChat} />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#DC5700]">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-[#E4E1E9]">
                New Consultation
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-[#C7C5D3] transition-colors hover:bg-[#2A292F]">
              <Download className="h-3.5 w-3.5" />
              Export Chat
            </button>
            <div className="h-5 w-px bg-[#464651]/30" />
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#4CD6FB]/10">
                <Zap className="h-3 w-3 text-[#4CD6FB]" />
              </div>
              <span className="hidden text-xs font-medium text-[#C7C5D3] sm:inline">
                GPT-4 Fiscal Engine
              </span>
            </div>
          </div>
        </header>

        {/* Chat Content Area */}
        <div className="flex-1 overflow-hidden pt-16 pb-40">
          {!hasMessages ? (
            /* ----- Empty / Welcome state ----- */
            <div className="flex h-full flex-col items-center justify-center px-4 py-8">
              <div className="mx-auto w-full max-w-3xl space-y-10">
                {/* Heading */}
                <div className="text-center">
                  <h2 className="mesh-gradient-text text-5xl font-extrabold leading-tight">
                    Ask AgFinTax AI
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-[#C7C5D3]">
                    Your architectural blueprint for tax optimization. Ask any
                    question about deductions, strategies, entity structuring,
                    and compliance.
                  </p>
                </div>

                {/* Suggested questions */}
                <SuggestedQuestions onSelect={handleSuggestedClick} />
              </div>
            </div>
          ) : (
            /* ----- Messages area ----- */
            <ScrollArea className="h-full">
              <div
                ref={scrollRef}
                className="mx-auto max-w-3xl space-y-6 px-4 py-6 md:px-8"
              >
                {messages.map((msg, idx) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    isLoading={isLoading && idx === messages.length - 1}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* ---------------------------------------------------------- */}
        {/*  Bottom Input Bar                                           */}
        {/* ---------------------------------------------------------- */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          {/* Gradient fade */}
          <div className="pointer-events-none h-12 bg-gradient-to-t from-[#131318] to-transparent" />

          <div className="bg-[#131318] px-4 pb-4">
            <div className="mx-auto max-w-3xl">
              {/* Attached files preview */}
              {attachedFiles.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {attachedFiles.map((f) => (
                    <div
                      key={f.name}
                      className="flex items-center gap-2 rounded-xl bg-[#1F1F25] border border-[#464651]/20 px-3 py-2 text-xs"
                    >
                      {f.status === "processing" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FFB596]" />
                      ) : f.status === "done" ? (
                        <FileText className="h-3.5 w-3.5 text-green-400" />
                      ) : f.status === "error" ? (
                        <FileText className="h-3.5 w-3.5 text-red-400" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 text-[#C7C5D3]" />
                      )}
                      <span className="max-w-[150px] truncate text-[#E4E1E9]">{f.name}</span>
                      {f.status === "processing" && (
                        <span className="text-[#FFB596]">Processing...</span>
                      )}
                      {f.status === "error" && (
                        <span className="text-red-400">Failed</span>
                      )}
                      <button
                        onClick={() => removeFile(f.name)}
                        className="ml-1 rounded p-0.5 text-[#C7C5D3] hover:bg-[#35343A] hover:text-[#E4E1E9]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Glass input container */}
              <div className="flex items-end gap-3 rounded-2xl border border-[#464651]/20 bg-[rgba(31,31,37,0.6)] p-3 shadow-xl backdrop-blur-2xl">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {/* Attach button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#C7C5D3] transition-colors hover:bg-[#2A292F] hover:text-[#FFB596] disabled:opacity-40"
                  title="Upload document (PDF, PNG, JPG)"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#FFB596]" />
                  ) : (
                    <Paperclip className="h-4 w-4" />
                  )}
                </button>

                {/* Textarea */}
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message AgFinTax AI..."
                  className="min-h-[40px] max-h-32 flex-1 resize-none border-0 bg-transparent text-sm text-[#E4E1E9] placeholder:text-[#C7C5D3]/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                  rows={1}
                  disabled={isLoading}
                />

                {/* Send / Stop button */}
                {isLoading ? (
                  <button
                    onClick={stop}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/80 text-white transition-colors hover:bg-red-500"
                    title="Stop generating"
                  >
                    <Square className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#FFB596] to-[#DC5700] text-white shadow-lg transition-opacity disabled:opacity-30"
                    title="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Disclaimer */}
              <p className="mt-3 text-center text-[10px] font-medium uppercase tracking-wider text-[#C7C5D3]/40">
                AgFinTax AI may provide information that requires professional
                CPA validation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
