"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X, Send, Volume2, Loader } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatbotProps {
  salesData?: any[];
  csvContent?: string;
}

export default function ExecutiveAIChatbot({ salesData = [], csvContent = "" }: ChatbotProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasActivated, setHasActivated] = useState(false);
  const [currentSpeakingId, setCurrentSpeakingId] = useState<string | null>(null);

  const { isListening, transcript, error, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const { user } = useSupabaseAuth();
  const soundWaveRef = useRef<HTMLDivElement>(null);

  // Initialize speech synthesis voices on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices();
    }
  }, []);

  // Auto-send when speech recognition completes
  useEffect(() => {
    if (transcript && !isListening) {
      setInput(transcript);
      // Auto-send after a short delay
      const timer = setTimeout(() => {
        handleSend(transcript);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [transcript, isListening]);

  // Get business name from user metadata
  const businessName = user?.user_metadata?.business_name || "AuraSales";

  // Get time-based greeting
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Activation: Speak greeting and unlock audio
  const activateAuraAI = useCallback(() => {
    if (!("speechSynthesis" in window)) {
      toast.error("Speech synthesis not supported");
      return;
    }

    window.speechSynthesis.cancel();
    const activationPhrase = `System Active. ${getTimeGreeting()}, I am ready to analyze ${businessName}.`;
    const utterance = new SpeechSynthesisUtterance(activationPhrase);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find((v) => v.name.includes("Google") || v.name.includes("Samantha"));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => {
      setHasActivated(true);
      // Start listening after activation
      setTimeout(() => startListening(), 500);
    };

    window.speechSynthesis.speak(utterance);
  }, [businessName, startListening]);

  // Speak AI response with animation
  const speakResponse = useCallback((text: string, messageId: string) => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    setCurrentSpeakingId(messageId);
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find((v) => v.name.includes("Google") || v.name.includes("Samantha"));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentSpeakingId(null);
      // Resume listening after response finishes
      setTimeout(() => startListening(), 500);
    };

    window.speechSynthesis.speak(utterance);
  }, [startListening]);

  // Send message to API and get response
  const handleSend = useCallback(
    async (textToSend?: string) => {
      const messageText = textToSend || input;
      if (!messageText.trim()) return;

      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "user",
        content: messageText,
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      resetTranscript();
      setIsProcessing(true);

      try {
        // Build dashboard context
        const dashboardContext = JSON.stringify({
          totalRecords: salesData.length,
          records: salesData.slice(0, 5), // Limit to first 5 for token efficiency
          summary: {
            totalRevenue: salesData.reduce((sum, r) => sum + (r.amount || 0), 0),
            averageRevenue:
              salesData.length > 0
                ? salesData.reduce((sum, r) => sum + (r.amount || 0), 0) / salesData.length
                : 0,
            recordCount: salesData.length,
          },
        });

        // Call the new chat API
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: messageText,
            dashboardData: dashboardContext,
            csvContent: csvContent || "No CSV uploaded",
            businessName: businessName,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          const fallbackReply = errorData?.content || errorData?.message || errorData?.response;
          if (fallbackReply) {
            const assistantMessage: Message = {
              id: `msg-${Date.now()}-ai`,
              role: "assistant",
              content: fallbackReply,
            };
            setMessages((prev) => [...prev, assistantMessage]);
            speakResponse(fallbackReply, assistantMessage.id);
            return;
          }
          throw new Error(errorData?.error || errorData?.details || `Request failed with status ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.content || data.message || data.response || "I couldn't process that request.";

        const assistantMessage: Message = {
          id: `msg-${Date.now()}-ai`,
          role: "assistant",
          content: aiResponse,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        speakResponse(aiResponse, assistantMessage.id);

        console.log("Chat Response:", { model: data.model, response: aiResponse });
      } catch (err: any) {
        toast.error("Chat Error", {
          description: err?.message || "Failed to process your request",
        });
        console.error("Chat Error:", err);
      } finally {
        setIsProcessing(false);
      }
    },
    [input, salesData, csvContent, businessName, speakResponse, resetTranscript]
  );

  // Mic button toggle
  const handleMicClick = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Floating activation button
  if (!open) {
    return (
      <motion.button
        onClick={() => {
          setOpen(true);
          if (!hasActivated) {
            activateAuraAI();
          }
        }}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-2xl hover:shadow-xl transition-shadow z-40"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open AuraAI Executive Chatbot"
      >
        <Mic className="w-6 h-6" />
      </motion.button>
    );
  }

  return (
    <motion.div
      className="fixed bottom-6 right-6 w-96 h-[600px] md:rounded-3xl rounded-none bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl flex flex-col z-50 overflow-hidden"
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <h3 className="font-semibold text-white text-sm">Executive AI Analyst</h3>
        </div>
        <button
          onClick={() => {
            setOpen(false);
            stopListening();
            window.speechSynthesis.cancel();
          }}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-white/60" />
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent via-white/5 to-transparent">
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex items-center justify-center text-center"
            >
              <div className="space-y-2">
                <p className="text-white/70 text-sm">👋 Welcome to Executive AI</p>
                <p className="text-white/40 text-xs">Ask me about your sales data</p>
              </div>
            </motion.div>
          ) : (
            messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-3 rounded-2xl backdrop-blur-sm ${
                    msg.role === "user"
                      ? "bg-blue-500/40 border border-blue-400/30 text-white rounded-br-none"
                      : "bg-white/15 border border-white/20 text-white/90 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  {msg.role === "assistant" && currentSpeakingId === msg.id && isSpeaking && (
                    <SoundWave />
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {isProcessing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-white/15 border border-white/20 px-4 py-3 rounded-2xl text-sm text-white/70 backdrop-blur-sm flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              Analyzing...
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 space-y-3 bg-gradient-to-t from-white/5 to-transparent backdrop-blur-sm">
        {error && (
          <div className="text-xs text-red-300 bg-red-500/20 p-2 rounded border border-red-400/30">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={isListening ? "🎤 Listening..." : "Ask about your data..."}
            className="flex-1 px-4 py-2 rounded-full bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all backdrop-blur-sm"
            disabled={isProcessing}
          />

          <motion.button
            onClick={handleMicClick}
            className={`p-2 rounded-full transition-all ${
              isListening
                ? "bg-red-500/40 border border-red-400/60 text-red-200"
                : "bg-white/20 border border-white/30 text-white hover:bg-white/30"
            }`}
            whileTap={{ scale: 0.9 }}
            disabled={isProcessing}
          >
            <Mic className="w-5 h-5" />
          </motion.button>

          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isProcessing}
            className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all border border-blue-400/50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Sound Wave Animation Component
function SoundWave() {
  return (
    <div className="flex items-center gap-1 mt-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1 bg-blue-400 rounded-full"
          animate={{ height: [8, 16, 8] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
        />
      ))}
    </div>
  );
}
