"use client";

import { Brain, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import type { Message } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-2">
      <span className="h-2 w-2 animate-bounce rounded-full bg-[#FFB596]/60 [animation-delay:0ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-[#FFB596]/60 [animation-delay:150ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-[#FFB596]/60 [animation-delay:300ms]" />
    </div>
  );
}

export function ChatMessage({ message, isLoading }: ChatMessageProps) {
  const isUser = message.role === "user";
  const showTyping = !isUser && isLoading && !message.content;

  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start gap-4"
      )}
    >
      {/* AI Avatar */}
      {!isUser && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#35343A]">
          <Brain className="h-5 w-5 text-[#FFB596]" />
        </div>
      )}

      {/* Message bubble */}
      <div className={cn("flex max-w-[75%] flex-col gap-1", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "p-5 rounded-2xl shadow-lg",
            isUser
              ? "bg-[#DC5700] text-white rounded-tr-none"
              : "bg-[#2A292F] border border-[#464651]/10 text-[#E4E1E9] rounded-tl-none"
          )}
        >
          {showTyping ? (
            <TypingIndicator />
          ) : isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          ) : (
            <div className="prose prose-sm prose-invert max-w-none prose-headings:text-[#E4E1E9] prose-p:text-[#C7C5D3] prose-strong:text-[#E4E1E9] prose-li:text-[#C7C5D3] prose-code:rounded prose-code:bg-[#35343A] prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[#FFB596] prose-pre:bg-[#1B1B20]">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
        <span className="px-1 text-[10px] text-[#C7C5D3]/60">
          {format(message.timestamp, "h:mm a")}
        </span>
      </div>
    </div>
  );
}
