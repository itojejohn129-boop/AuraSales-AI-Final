"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { MessageSquare, X, Send, Sparkles, Zap, Mic, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { responseCache } from "@/lib/responseCache";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { getLanguageDisplayName, getSpeechLocale } from "@/lib/i18n/dashboardCopy";

interface Message {
  role: "user" | "assistant";
  content: string;
  isCached?: boolean;
}

interface AuraChatProps {
  dashboardData?: unknown;
  csvContent?: string;
  businessName?: string;
  targetLanguage?: string;
}

interface CsvSummary {
  topProducts: Array<{ name: string; count: number }>;
  dateRange: {
    start: string | null;
    end: string | null;
  };
  totalRows: number;
}

interface SystemContextPayload {
  totalRevenue: number | null;
  dailyAverage: number | null;
  volatilityPercentage: number | null;
  csvSummary: CsvSummary | null;
}

const AUTO_SEND_VOICE_TRANSCRIPT = true;
const REFUSAL_MESSAGE = "I can only assist with dashboard and sales-related questions.";

function isStaleChatResponse(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return (
    normalized === REFUSAL_MESSAGE.toLowerCase() ||
    normalized.startsWith("error:") ||
    normalized.includes("something went wrong")
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return null;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      const nextChar = line[i + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells.map((cell) => cell.replace(/^"|"$/g, "").trim());
}

function toIsoDate(value: string): string | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function summarizeCsv(csvContent: string): CsvSummary | null {
  if (!csvContent?.trim()) return null;

  const lines = csvContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return null;

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());
  const productCandidates = ["product_name", "product", "item", "name", "sku", "category"];
  const dateCandidates = ["sale_date", "date", "transaction_date", "order_date", "timestamp"];

  const productIndex = headers.findIndex((header) => productCandidates.includes(header));
  const dateIndex = headers.findIndex((header) => dateCandidates.includes(header));

  const productCounts = new Map<string, number>();
  const dates: string[] = [];

  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);

    if (productIndex >= 0) {
      const product = cells[productIndex];
      if (product) {
        productCounts.set(product, (productCounts.get(product) || 0) + 1);
      }
    }

    if (dateIndex >= 0) {
      const rawDate = cells[dateIndex];
      if (rawDate) {
        const isoDate = toIsoDate(rawDate);
        if (isoDate) dates.push(isoDate);
      }
    }
  }

  const topProducts = Array.from(productCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const sortedDates = dates.sort();
  const dateRange = {
    start: sortedDates.length ? sortedDates[0] : null,
    end: sortedDates.length ? sortedDates[sortedDates.length - 1] : null,
  };

  return {
    topProducts,
    dateRange,
    totalRows: Math.max(0, lines.length - 1),
  };
}

function buildSystemContext(dashboardData: unknown, csvContent: string): SystemContextPayload {
  const dashboardRecord = asRecord(dashboardData);
  const summaryRecord = asRecord(dashboardRecord?.summary);

  const totalRevenue = toNumberOrNull(summaryRecord?.totalRevenue);
  const dailyAverage = toNumberOrNull(summaryRecord?.averageDaily ?? summaryRecord?.dailyAverage);
  const rawVolatility = toNumberOrNull(summaryRecord?.volatility ?? summaryRecord?.volatilityPercentage);
  const volatilityPercentage = rawVolatility === null ? null : rawVolatility <= 1 ? Number((rawVolatility * 100).toFixed(2)) : Number(rawVolatility.toFixed(2));

  return {
    totalRevenue,
    dailyAverage,
    volatilityPercentage,
    csvSummary: summarizeCsv(csvContent),
  };
}

export default function AuraChat({
  dashboardData = {},
  csvContent = "",
  businessName = "Your Business",
  targetLanguage = "en",
}: AuraChatProps) {
  const [open, setOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState<"idle" | "warming" | "ready">("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isTextToSpeechEnabled, setIsTextToSpeechEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isListening, transcript, error, startListening, stopListening, resetTranscript, isSpeechRecognitionReady } =
    useSpeechRecognition();
  const systemContext = useMemo<SystemContextPayload>(() => buildSystemContext(dashboardData, csvContent), [dashboardData, csvContent]);
  const speechLocale = getSpeechLocale(targetLanguage);
  const languageName = getLanguageDisplayName(targetLanguage);

  const isSpeechSynthesisSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  const speak = useCallback(
    (text: string) => {
      if (!isTextToSpeechEnabled || !isSpeechSynthesisSupported || !text?.trim()) return;

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        utterance.lang = speechLocale;
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(
          (voice) =>
            voice.lang?.toLowerCase().startsWith(speechLocale.toLowerCase().split("-")[0]) ||
            voice.lang?.toLowerCase().startsWith(speechLocale.toLowerCase()) ||
            voice.name.toLowerCase().includes(languageName.toLowerCase())
        );
        if (preferredVoice) utterance.voice = preferredVoice;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Ignore speech synthesis failures so chat flow is not interrupted.
      }
    },
    [isTextToSpeechEnabled, isSpeechSynthesisSupported, speechLocale, languageName]
  );

  useEffect(() => {
    if (isTextToSpeechEnabled) return;
    if (!isSpeechSynthesisSupported) return;
    window.speechSynthesis.cancel();
  }, [isTextToSpeechEnabled, isSpeechSynthesisSupported]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Warm up the model on chat mount and show subtle initializing status
  useEffect(() => {
    let mounted = true;

    const warmup = async () => {
      try {
        setSystemStatus("warming");
        const res = await fetch("/api/chat", { method: "GET" });
        if (mounted) {
          if (res.ok) setSystemStatus("ready");
          else setSystemStatus("ready"); // don't block UX on warm-up failure
        }
      } catch {
        if (mounted) setSystemStatus("ready");
      }
    };

    warmup();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSendMessage = useCallback(async (messageOverride?: string) => {
    const text = (messageOverride ?? input)?.trim();
    if (!text) return;
    const cacheKey = `${targetLanguage}::${text}::${JSON.stringify(systemContext)}`;

    // Add user message
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setIsLoading(true);
    setIsThinking(true);

    try {
      // Check cache first
      const cachedResponse = responseCache.get(cacheKey);
      if (cachedResponse) {
        if (isStaleChatResponse(cachedResponse)) {
          responseCache.delete(cacheKey);
        } else {
          setMessages((m) => [...m, { role: "assistant", content: cachedResponse, isCached: true }]);
          speak(cachedResponse);
          setIsLoading(false);
          setIsThinking(false);
          return;
        }
      }

      console.info("Sending chat request:", {
        message: text,
        businessName,
        targetLanguage,
      });

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          dashboardData,
          csvContent,
          businessName,
          systemContext,
          targetLanguage,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 402) {
          window.location.href = errorData?.redirectTo || "/pricing?payment=required";
          return;
        }
        const fallbackResponse = errorData?.content || errorData?.message || errorData?.response;
        if (fallbackResponse) {
          const aiResponse = fallbackResponse;
          if (!isStaleChatResponse(aiResponse)) {
            responseCache.set(cacheKey, aiResponse);
          }
          setMessages((m) => [...m, { role: "assistant", content: aiResponse }]);
          speak(aiResponse);
          return;
        }
        throw new Error(errorData?.error || errorData?.details || `Request failed with status ${res.status}`);
      }

      const data = await res.json();
      console.info("Chat API response:", data);
      const aiResponse = data?.content || data?.message || data?.response;
      if (aiResponse) {
        // Cache successful responses, but never cache refusal/error replies.
        if (!isStaleChatResponse(aiResponse) && data?.source !== "privacy-wall") {
          responseCache.set(cacheKey, aiResponse);
        }
        setMessages((m) => [...m, { role: "assistant", content: aiResponse }]);
        speak(aiResponse);
      } else {
        console.error("Malformed AI response:", data);
        throw new Error("Invalid response format");
      }
    } catch (err: unknown) {
      const errorMsg = `Error: ${err instanceof Error ? err.message : "Unable to process request"}`;
      setMessages((m) => [...m, { role: "assistant", content: errorMsg }]);
    } finally {
      setIsLoading(false);
      setIsThinking(false);
    }
  }, [input, systemContext, speak, dashboardData, csvContent, businessName, targetLanguage]);

  const handleSend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await handleSendMessage();
    },
    [handleSendMessage]
  );

  useEffect(() => {
    if (!transcript?.trim()) return;

    const finalTranscript = transcript.trim();
    setInput(finalTranscript);

    if (AUTO_SEND_VOICE_TRANSCRIPT && !isLoading && !isThinking && systemStatus !== "warming") {
      void handleSendMessage(finalTranscript);
      resetTranscript();
    }
  }, [transcript, isLoading, isThinking, systemStatus, handleSendMessage, resetTranscript]);

  const isChatBusy = isLoading || isThinking;
  const isMicDisabled = isChatBusy || systemStatus === "warming" || !isSpeechRecognitionReady;

  const handleMicClick = useCallback(() => {
    if (isMicDisabled) return;
    if (isListening) {
      stopListening();
      return;
    }
    startListening();
  }, [isListening, isMicDisabled, startListening, stopListening]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="mb-4 w-96 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-96"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-blue-200" />
                <span className="font-semibold text-slate-50">AURA AI</span>
                {systemStatus === "warming" && (
                  <div className="ml-2 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs">
                    Initializing...
                  </div>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-200 hover:text-slate-50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-900/40">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center">
                  <div className="text-slate-400 text-sm">
                    <Sparkles className="mx-auto mb-2 opacity-50" size={24} />
                    <p>Welcome to AURA AI!</p>
                    <p className="text-xs mt-1">Ask about your sales, trends, or business data.</p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className="flex flex-col items-end">
                        <div
                          className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                            m.role === "user"
                              ? "bg-blue-600 text-slate-50 rounded-br-none"
                              : "bg-slate-700/60 text-slate-200 rounded-bl-none"
                          }`}
                        >
                          {m.content}
                        </div>
                        {m.isCached && m.role === "assistant" && (
                          <div className="flex items-center gap-1 mt-1 px-2 text-xs text-slate-400">
                            <Zap size={10} />
                            <span>from cache</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {isThinking && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-slate-700/60 text-slate-200 px-3 py-2 rounded-lg rounded-bl-none text-sm flex items-center gap-2">
                        <div className="flex gap-1">
                          <motion.div
                            className="w-2 h-2 bg-blue-400 rounded-full"
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity }}
                          />
                          <motion.div
                            className="w-2 h-2 bg-blue-400 rounded-full"
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
                          />
                          <motion.div
                            className="w-2 h-2 bg-blue-400 rounded-full"
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                          />
                        </div>
                        <span>Aura is thinking...</span>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="border-t border-slate-700 px-4 py-3 flex items-center gap-2 bg-slate-900/60"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening..." : "Ask Aura anything..."}
                disabled={isChatBusy}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => {
                  if (!isSpeechSynthesisSupported) return;
                  setIsTextToSpeechEnabled((enabled) => !enabled);
                }}
                disabled={!isSpeechSynthesisSupported}
                title={isTextToSpeechEnabled ? "Disable text-to-speech" : "Enable text-to-speech"}
                className={`px-3 py-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isTextToSpeechEnabled
                    ? "bg-blue-600/30 border-blue-400/70 text-blue-100"
                    : "bg-slate-700/40 border-slate-600/50 text-slate-300 hover:bg-slate-700/60"
                }`}
              >
                {isTextToSpeechEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button
                type="button"
                onClick={handleMicClick}
                disabled={isMicDisabled}
                title={isListening ? "Stop listening" : "Start voice input"}
                className={`px-3 py-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isListening
                    ? "bg-red-500/30 border-red-400/70 text-red-200 animate-pulse"
                    : "bg-blue-600/20 border-blue-500/50 text-blue-200 hover:bg-blue-600/30"
                }`}
              >
                <Mic size={16} />
              </button>
              <button
                type="submit"
                disabled={isChatBusy || !input.trim()}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <Send size={16} />
              </button>
            </form>
            {error && <div className="px-4 pb-3 text-xs text-red-300">{error}</div>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((s) => !s)}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow text-slate-50"
        title="Chat with AURA AI"
      >
        {open ? <X size={24} /> : <MessageSquare size={24} />}
      </motion.button>
    </div>
  );
}
