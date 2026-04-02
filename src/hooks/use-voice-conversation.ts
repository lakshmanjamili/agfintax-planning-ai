"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  type InterviewState,
  type QualificationSection,
  type QualificationQuestion,
  type ProfileForInterview,
  createInterviewState,
  createGapFillingInterview,
  getCurrentQuestion,
  recordAnswer,
  getInterviewProgress,
  isInterviewComplete,
  buildVoiceQuestionPrompt,
  buildAnswerInterpretationPrompt,
  buildSectionTransitionPrompt,
  buildInterviewSummaryPrompt,
} from "@/lib/tax/qualification-engine";

// Web Speech API — use `any` for cross-browser compat
type SpeechRecognitionAny = any;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VoicePhase =
  | "idle"
  | "speaking"       // AI is speaking via TTS
  | "listening"      // Mic is on, waiting for user
  | "processing"     // Transcribing + interpreting answer
  | "transitioning"  // Moving between sections
  | "complete";      // Interview done

export interface VoiceMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
  questionId?: string;
}

export interface UseVoiceConversationReturn {
  // State
  phase: VoicePhase;
  messages: VoiceMessage[];
  interviewState: InterviewState;
  currentSection: QualificationSection | null;
  currentQuestion: QualificationQuestion | null;
  progress: number;
  isComplete: boolean;
  interimTranscript: string;
  error: string | null;
  isMuted: boolean;
  isGapFillingMode: boolean;
  effectiveSections: QualificationSection[];

  // Actions
  startInterview: () => Promise<void>;
  pauseInterview: () => void;
  resumeInterview: () => void;
  skipQuestion: () => void;
  toggleMute: () => void;
  retryLastQuestion: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useVoiceConversation(
  sections: QualificationSection[],
  profile?: ProfileForInterview
): UseVoiceConversationReturn {
  // If profile exists, use gap-filling mode: a single section with only missing questions
  const gapFilling = React.useMemo(() => {
    if (profile && Object.values(profile).some((v) => v !== undefined && v !== "" && v !== false)) {
      return createGapFillingInterview(profile);
    }
    return null;
  }, [profile]);

  // Use gap-filling sections when available, otherwise the full structured sections
  const effectiveSections = gapFilling?.sections ?? sections;
  const isGapFillingMode = !!gapFilling;

  const [phase, setPhase] = useState<VoicePhase>("idle");
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [interviewState, setInterviewState] = useState<InterviewState>(createInterviewState());
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Refs for audio + recording
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const isPausedRef = useRef(false);
  const isFirstSpokenQuestionRef = useRef(true);
  const profileSummaryRef = useRef<string>("");
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      recognitionRef.current?.abort();
      audioRef.current?.pause();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  // -------------------------------------------------------------------------
  // TTS: Make the AI speak
  // -------------------------------------------------------------------------
  const speak = useCallback(async (text: string): Promise<void> => {
    if (isMuted) return;
    setPhase("speaking");

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "nova" }),
      });

      if (!response.ok) {
        // Fallback to browser TTS
        return new Promise<void>((resolve) => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 1.05;
          utterance.onend = () => resolve();
          utterance.onerror = () => resolve();
          window.speechSynthesis.speak(utterance);
        });
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      return new Promise<void>((resolve) => {
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        const audio = audioRef.current;
        audio.src = audioUrl;
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.play().catch(() => resolve());
      });
    } catch {
      // Silent fallback — continue without TTS
      return;
    }
  }, [isMuted]);

  // -------------------------------------------------------------------------
  // STT: Listen for user's response
  // -------------------------------------------------------------------------
  const startListening = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      setPhase("listening");
      setInterimTranscript("");
      audioChunksRef.current = [];

      // --- MediaRecorder for Whisper ---
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        streamRef.current = stream;
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";
        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

          if (audioBlob.size < 500) {
            resolve("");
            return;
          }

          // Send to Whisper
          setPhase("processing");
          try {
            const formData = new FormData();
            formData.append("audio", audioBlob, "recording.webm");

            const res = await fetch("/api/transcribe", { method: "POST", body: formData });
            if (!res.ok) throw new Error("Transcription failed");
            const data = await res.json();
            resolve(data.text || "");
          } catch (err) {
            reject(err);
          }
        };

        recorder.start(250); // Collect in 250ms chunks

        // --- Web Speech API for live preview ---
        const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognitionCtor) {
          const recognition: SpeechRecognitionAny = new SpeechRecognitionCtor();
          recognitionRef.current = recognition;
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-US";

          let lastSpeechTime = Date.now();

          recognition.onresult = (event: any) => {
            lastSpeechTime = Date.now();
            let interim = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
              interim += event.results[i][0].transcript;
            }
            setInterimTranscript(interim);

            // Reset silence timer
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              // 2.5 seconds of silence → stop recording
              if (Date.now() - lastSpeechTime >= 2400) {
                recognition.stop();
                if (mediaRecorderRef.current?.state === "recording") {
                  mediaRecorderRef.current.stop();
                }
              }
            }, 2500);
          };

          recognition.onerror = () => {
            // Silence or no speech — stop recording
            if (mediaRecorderRef.current?.state === "recording") {
              mediaRecorderRef.current.stop();
            }
          };

          recognition.onend = () => {
            if (mediaRecorderRef.current?.state === "recording") {
              mediaRecorderRef.current.stop();
            }
          };

          recognition.start();
        } else {
          // No Web Speech API — use timer-based recording (8 seconds)
          setTimeout(() => {
            if (mediaRecorderRef.current?.state === "recording") {
              mediaRecorderRef.current.stop();
            }
          }, 8000);
        }
      }).catch((err) => {
        setError("Microphone access denied. Please allow microphone access to use voice mode.");
        reject(err);
      });
    });
  }, []);

  // -------------------------------------------------------------------------
  // Interpret the user's answer using AI
  // -------------------------------------------------------------------------
  const interpretAnswer = useCallback(async (
    question: QualificationQuestion,
    transcript: string
  ): Promise<{ answer: string; confidence: number; needsClarification: boolean; clarificationQuestion?: string }> => {
    try {
      const prompt = buildAnswerInterpretationPrompt(question, transcript);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          maxTokens: 200,
        }),
      });

      if (!response.ok) throw new Error("Interpretation failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
        }
      }

      // Parse JSON from response
      const jsonMatch = accumulated.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback: use transcript directly
    }

    return { answer: transcript, confidence: 0.7, needsClarification: false };
  }, []);

  // -------------------------------------------------------------------------
  // Generate AI speech for a question
  // -------------------------------------------------------------------------
  const generateQuestionSpeech = useCallback(async (
    section: QualificationSection,
    question: QualificationQuestion,
    previousAnswers: Record<string, string>,
    isFirst: boolean
  ): Promise<string> => {
    const prompt = buildVoiceQuestionPrompt(section, question, previousAnswers, isFirst, profileSummaryRef.current || undefined);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          maxTokens: 300,
        }),
      });

      if (!response.ok) return question.question;

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let text = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
        }
      }

      return text.trim() || question.question;
    } catch {
      return question.question;
    }
  }, []);

  // -------------------------------------------------------------------------
  // Main interview loop
  // -------------------------------------------------------------------------
  const askCurrentQuestion = useCallback(async (state: InterviewState) => {
    if (isPausedRef.current) return;

    const current = getCurrentQuestion(state, effectiveSections);
    if (!current) {
      // Interview complete
      if (isGapFillingMode) {
        // In gap-filling mode, keep it short — no lengthy summary
        const msg = "Perfect, that's everything I need. Let me build your personalized tax plan now.";
        addMessage("assistant", msg);
        await speak(msg);
      } else {
        // Full structured mode — generate AI summary
        setPhase("transitioning");
        const summaryPrompt = buildInterviewSummaryPrompt(
          state.answers,
          state.qualifiedStrategies,
          state.disqualifiedStrategies
        );

        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: [{ role: "user", content: summaryPrompt }], maxTokens: 300 }),
          });
          const reader = res.body?.getReader();
          const decoder = new TextDecoder();
          let summary = "";
          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              summary += decoder.decode(value, { stream: true });
            }
          }

          addMessage("assistant", summary.trim());
          await speak(summary.trim());
        } catch {
          addMessage("assistant", "Great — I have everything I need! Let me build your personalized tax plan now.");
          await speak("Great — I have everything I need! Let me build your personalized tax plan now.");
        }
      }

      setPhase("complete");
      return;
    }

    const { section, question } = current;
    const isFirst = isFirstSpokenQuestionRef.current;
    if (isFirst) isFirstSpokenQuestionRef.current = false;

    // Section transitions — skip entirely in gap-filling mode (single section)
    if (!isGapFillingMode && state.currentQuestionIndex === 0 && state.currentSectionIndex > 0) {
      const prevSection = effectiveSections[state.currentSectionIndex - 1];
      if (prevSection) {
        const transitionPrompt = buildSectionTransitionPrompt(
          prevSection,
          section,
          state.qualifiedStrategies,
          state.disqualifiedStrategies
        );
        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: [{ role: "user", content: transitionPrompt }], maxTokens: 150 }),
          });
          const reader = res.body?.getReader();
          const decoder = new TextDecoder();
          let transition = "";
          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              transition += decoder.decode(value, { stream: true });
            }
          }
          if (transition.trim()) {
            await speak(transition.trim());
          }
        } catch {
          // Skip transition if fails
        }
      }
    }

    // Generate natural question
    const questionText = await generateQuestionSpeech(section, question, state.answers, isFirst);
    addMessage("assistant", questionText, question.id);

    // Speak the question
    await speak(questionText);

    if (isPausedRef.current) return;

    // Listen for answer
    try {
      const transcript = await startListening();
      setInterimTranscript("");

      if (!transcript.trim()) {
        // No speech detected — re-ask
        addMessage("assistant", "I didn't quite catch that. Could you repeat your answer?");
        await speak("I didn't quite catch that. Could you repeat your answer?");
        await askCurrentQuestion(state);
        return;
      }

      addMessage("user", transcript, question.id);

      // Interpret the answer
      const interpretation = await interpretAnswer(question, transcript);

      if (interpretation.needsClarification && interpretation.clarificationQuestion) {
        addMessage("assistant", interpretation.clarificationQuestion);
        await speak(interpretation.clarificationQuestion);

        const clarification = await startListening();
        setInterimTranscript("");
        if (clarification.trim()) {
          addMessage("user", clarification, question.id);
          const reinterpretation = await interpretAnswer(question, clarification);
          interpretation.answer = reinterpretation.answer;
        }
      }

      // Record the answer and advance
      const newState = recordAnswer(state, question.id, interpretation.answer, effectiveSections);
      setInterviewState(newState);

      // Continue to next question
      await askCurrentQuestion(newState);
    } catch (err) {
      setError(`Voice error: ${String(err)}`);
      setPhase("idle");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveSections, isGapFillingMode, speak, startListening, interpretAnswer, generateQuestionSpeech]);

  // -------------------------------------------------------------------------
  // Helper to add messages
  // -------------------------------------------------------------------------
  const addMessage = useCallback((role: "assistant" | "user", content: string, questionId?: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role,
        content,
        timestamp: new Date(),
        questionId,
      },
    ]);
  }, []);

  // -------------------------------------------------------------------------
  // Public actions
  // -------------------------------------------------------------------------
  const startInterview = useCallback(async () => {
    setError(null);
    isPausedRef.current = false;
    isFirstSpokenQuestionRef.current = true;

    // Gap-filling mode: use pre-computed state; otherwise fresh state
    const freshState = gapFilling?.state ?? createInterviewState();
    profileSummaryRef.current = gapFilling?.profileSummary ?? "";

    setInterviewState(freshState);
    setMessages([]);
    await askCurrentQuestion(freshState);
  }, [askCurrentQuestion, gapFilling]);

  const pauseInterview = useCallback(() => {
    isPausedRef.current = true;
    recognitionRef.current?.stop();
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    audioRef.current?.pause();
    setPhase("idle");
  }, []);

  const resumeInterview = useCallback(() => {
    isPausedRef.current = false;
    askCurrentQuestion(interviewState);
  }, [askCurrentQuestion, interviewState]);

  const skipQuestion = useCallback(() => {
    const current = getCurrentQuestion(interviewState, effectiveSections);
    if (!current) return;
    const newState = recordAnswer(interviewState, current.question.id, "skipped", effectiveSections);
    setInterviewState(newState);
    recognitionRef.current?.stop();
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    askCurrentQuestion(newState);
  }, [interviewState, effectiveSections, askCurrentQuestion]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const retryLastQuestion = useCallback(() => {
    isPausedRef.current = false;
    askCurrentQuestion(interviewState);
  }, [askCurrentQuestion, interviewState]);

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------
  const current = getCurrentQuestion(interviewState, effectiveSections);
  const progress = getInterviewProgress(interviewState, effectiveSections);
  const complete = isInterviewComplete(interviewState, effectiveSections);

  return {
    phase,
    messages,
    interviewState,
    currentSection: current?.section ?? null,
    currentQuestion: current?.question ?? null,
    progress,
    isComplete: complete || phase === "complete",
    interimTranscript,
    error,
    isMuted,
    isGapFillingMode,
    effectiveSections,
    startInterview,
    pauseInterview,
    resumeInterview,
    skipQuestion,
    toggleMute,
    retryLastQuestion,
  };
}
