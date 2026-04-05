"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  Volume2,
  VolumeX,
  Pause,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  Loader2,
  AudioLines,
} from "lucide-react";
import { useVoiceConversation, type VoicePhase } from "@/hooks/use-voice-conversation";
import { type QualificationSection, type ProfileForInterview } from "@/lib/tax/qualification-engine";

interface VoiceInterviewProps {
  sections: QualificationSection[];
  onComplete: (answers: Record<string, string>, qualifiedStrategies: string[]) => void;
  entityType?: string;
  profile?: ProfileForInterview;
}

export default function VoiceInterview({ sections, onComplete, entityType, profile }: VoiceInterviewProps) {
  const {
    phase,
    messages,
    interviewState,
    currentSection,
    currentQuestion,
    progress,
    isComplete,
    interimTranscript,
    error,
    isMuted,
    isGapFillingMode,
    effectiveSections,
    startInterview,
    pauseInterview,
    skipQuestion,
    toggleMute,
    retryLastQuestion,
  } = useVoiceConversation(sections, profile);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, interimTranscript]);

  // Fire completion callback
  useEffect(() => {
    if (isComplete) {
      onComplete(interviewState.answers, interviewState.qualifiedStrategies);
    }
  }, [isComplete, interviewState, onComplete]);

  // Gap-filling mode uses the effective sections from the hook (computed from profile)
  const isGapFilling = isGapFillingMode;
  const totalQuestions = isGapFilling
    ? effectiveSections.reduce((sum, s) => sum + s.questions.length, 0)
    : 0;
  const answeredCount = Object.keys(interviewState.answers).length;

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      {/* Header with progress */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <AudioLines className="w-5 h-5 text-orange-400" />
              <PhaseIndicator phase={phase} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {isGapFilling ? "A Few Quick Questions" : (currentSection?.title ?? "Voice Tax Interview")}
              </h3>
              <p className="text-xs text-white/50">
                {getPhaseLabel(phase)}
              </p>
            </div>
          </div>
          <div className="text-xs text-white/40 font-mono">
            {isGapFilling
              ? `Question ${Math.min(answeredCount + 1, totalQuestions)} of ${totalQuestions}`
              : `${progress}% complete`
            }
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${isGapFilling ? Math.round((answeredCount / totalQuestions) * 100) : progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Section pills — only show in structured (non-gap-filling) mode */}
        {!isGapFilling && effectiveSections.length > 0 && (
          <div className="flex gap-1.5 mt-3 overflow-x-auto scrollbar-none">
            {effectiveSections.map((section, i) => {
              const isActive = i === interviewState.currentSectionIndex;
              const isDone = interviewState.completedSections.includes(section.id);
              return (
                <span
                  key={section.id}
                  className={`
                    px-2.5 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap transition-all
                    ${isDone ? "bg-green-500/20 text-green-400" : ""}
                    ${isActive ? "bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/30" : ""}
                    ${!isDone && !isActive ? "bg-white/5 text-white/30" : ""}
                  `}
                >
                  {isDone && <CheckCircle2 className="w-2.5 h-2.5 inline mr-1" />}
                  {section.title}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
        {/* Start state */}
        {phase === "idle" && messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center mb-6">
              <Mic className="w-8 h-8 text-orange-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              {isGapFilling ? "Quick Details Check" : "Voice-Guided Tax Interview"}
            </h2>
            <p className="text-sm text-white/50 max-w-md mb-8 leading-relaxed">
              {isGapFilling ? (
                <>
                  I already have your profile details. I just need {totalQuestions} quick answers
                  to finalize your personalized tax plan. This should take about a minute.
                </>
              ) : (
                <>
                  I&apos;ll ask you questions about your financial situation and listen to your responses.
                  Together, we&apos;ll identify the best tax strategies for you.
                </>
              )}
              {entityType && (
                <span className="block mt-2 text-orange-400/70">
                  Tailored for your {entityType.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())} entity.
                </span>
              )}
            </p>
            <button
              onClick={startInterview}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/20"
            >
              Start Voice Interview
            </button>
          </motion.div>
        )}

        {/* Message bubbles */}
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`
                  max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed
                  ${msg.role === "assistant"
                    ? "bg-white/5 text-white/90 rounded-bl-sm"
                    : "bg-orange-500/15 text-orange-100 rounded-br-sm"
                  }
                `}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Live transcript */}
        {interimTranscript && phase === "listening" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-end"
          >
            <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-br-sm bg-orange-500/10 text-orange-200/70 text-sm italic border border-orange-500/10">
              {interimTranscript}
              <span className="inline-block w-1 h-4 ml-1 bg-orange-400/50 animate-pulse" />
            </div>
          </motion.div>
        )}

        {/* Phase indicators */}
        {phase === "processing" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-xs text-white/40">
              <Loader2 className="w-3 h-3 animate-spin" />
              Processing your response...
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice visualizer + controls */}
      <div className="flex-shrink-0 border-t border-white/10 px-6 py-4">
        {/* Listening indicator */}
        {phase === "listening" && (
          <div className="flex justify-center mb-4">
            <VoiceWaveform />
          </div>
        )}

        {/* Speaking indicator */}
        {phase === "speaking" && (
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2 text-xs text-cyan-400/70">
              <Volume2 className="w-4 h-4 animate-pulse" />
              Speaking...
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-3 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {/* Mute toggle */}
          <button
            onClick={toggleMute}
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-all"
            title={isMuted ? "Unmute voice" : "Mute voice"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Pause/Resume */}
          {phase !== "idle" && phase !== "complete" && (
            <button
              onClick={pauseInterview}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-all"
              title="Pause"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}

          {/* Main mic button */}
          <button
            onClick={phase === "idle" && messages.length === 0 ? startInterview : retryLastQuestion}
            disabled={phase === "speaking" || phase === "processing"}
            className={`
              p-4 rounded-full transition-all
              ${phase === "listening"
                ? "bg-red-500 text-white shadow-lg shadow-red-500/30 scale-110 animate-pulse"
                : phase === "speaking"
                  ? "bg-cyan-500/20 text-cyan-400 cursor-not-allowed"
                  : "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20"
              }
            `}
            title={phase === "listening" ? "Listening..." : "Start speaking"}
          >
            {phase === "listening" ? (
              <Mic className="w-6 h-6" />
            ) : phase === "processing" ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>

          {/* Skip question */}
          {phase === "listening" && currentQuestion && !currentQuestion.required && (
            <button
              onClick={skipQuestion}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-all"
              title="Skip this question"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          )}

          {/* Retry */}
          {phase === "idle" && messages.length > 0 && !isComplete && (
            <button
              onClick={retryLastQuestion}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-all"
              title="Retry last question"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Current question hint (for multiple choice) */}
        {currentQuestion?.answerType === "multiple_choice" && currentQuestion.options && phase === "listening" && (
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {currentQuestion.options.map((opt) => (
              <span
                key={opt}
                className="px-2.5 py-1 rounded-full text-[10px] bg-white/5 text-white/40 border border-white/5"
              >
                {opt}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Completion overlay */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl"
        >
          <div className="text-center px-8">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {isGapFilling ? "All Set!" : "Interview Complete!"}
            </h3>
            <p className="text-sm text-white/50 mb-2">
              {isGapFilling
                ? "Got everything I need to build your plan"
                : `Identified ${interviewState.qualifiedStrategies.length} potential tax strategies`
              }
            </p>
            <p className="text-xs text-white/30">
              Building your personalized tax plan...
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PhaseIndicator({ phase }: { phase: VoicePhase }) {
  if (phase === "idle") return null;
  return (
    <span
      className={`
        absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#1b1b20]
        ${phase === "listening" ? "bg-red-500 animate-pulse" : ""}
        ${phase === "speaking" ? "bg-cyan-400 animate-pulse" : ""}
        ${phase === "processing" ? "bg-yellow-500 animate-pulse" : ""}
        ${phase === "transitioning" ? "bg-purple-400" : ""}
        ${phase === "complete" ? "bg-green-400" : ""}
      `}
    />
  );
}

// Pre-computed random heights & durations for the waveform bars (avoids Math.random in render)
const WAVEFORM_BARS = Array.from({ length: 12 }, (_, i) => ({
  peakHeight: ((i * 7 + 3) % 24) + 8,
  duration: 0.6 + ((i * 13) % 10) / 25,
}));

function VoiceWaveform() {
  return (
    <div className="flex items-end gap-[3px] h-8">
      {WAVEFORM_BARS.map((bar, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-gradient-to-t from-orange-500 to-orange-300"
          animate={{
            height: [4, bar.peakHeight, 4],
          }}
          transition={{
            duration: bar.duration,
            repeat: Infinity,
            delay: i * 0.05,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function getPhaseLabel(phase: VoicePhase): string {
  switch (phase) {
    case "idle": return "Ready to start";
    case "speaking": return "Asking a question...";
    case "listening": return "Listening — speak your answer";
    case "processing": return "Processing your response...";
    case "transitioning": return "Moving to next topic...";
    case "complete": return "Interview complete!";
    default: return "";
  }
}
