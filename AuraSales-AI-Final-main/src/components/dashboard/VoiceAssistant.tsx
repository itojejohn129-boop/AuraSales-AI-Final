"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X, Send, Volume2, Zap } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import SoundWave from "./SoundWave";
import { responseCache } from "@/lib/responseCache";
import { toast } from "sonner";

const REFUSAL_MESSAGE = "I can only assist with dashboard and sales-related questions.";

function isStaleChatResponse(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return (
    normalized === REFUSAL_MESSAGE.toLowerCase() ||
    normalized.startsWith("error:") ||
    normalized.includes("something went wrong")
  );
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isPlaying?: boolean;
  isCached?: boolean;
}

interface VoiceAssistantProps {
  salesData?: any[];
  csvContent?: string;
  dashboardSnapshot?: any;
}

export default function VoiceAssistant({ salesData = [], csvContent = "", dashboardSnapshot = {} }: VoiceAssistantProps) {
  const [open, setOpen] = useState(false);
  const [activated, setActivated] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeakingId, setCurrentSpeakingId] = useState<string | null>(null);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [systemStatus, setSystemStatus] = useState<"idle" | "warming" | "ready">("idle");
  
  // Debounce timer for voice input
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const DEBOUNCE_DELAY = 1500; // 1.5 seconds

  const { isListening, transcript, error, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const { user } = useSupabaseAuth();

  // Get business name from user metadata (moved up so effects can reference it)
  const businessName = user?.user_metadata?.business_name || "AuraSales";

  // Handle speech synthesis with proper voice initialization (moved up)
  const speakResponse = useCallback((text: string, messageId: string) => {
    if (!("speechSynthesis" in window)) {
      toast.error("Speech synthesis not supported");
      return;
    }

    // CRUCIAL: Always cancel before speak to unblock audio queue
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Load voices and select a professional one
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.name.includes("Google US English") || v.name.includes("Samantha") || v.name.includes("Microsoft")
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setCurrentSpeakingId(messageId);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentSpeakingId(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setCurrentSpeakingId(null);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  // Initialize voices for speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Trigger voice loading
      const handleVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
      handleVoicesChanged();
    }
  }, []);

  // Greet user on first open
  useEffect(() => {
    if (open && !hasGreeted && user) {
      triggerGreeting();
      setHasGreeted(true);
    }
  }, [open, hasGreeted, user]);

  // Warm up the model when component mounts
  useEffect(() => {
    let mounted = true;

    const warmupModel = async () => {
      if (systemStatus !== "idle") return;
      
      setSystemStatus("warming");
      
      try {
        const res = await fetch("/api/chat", { method: "GET" });
        if (mounted && res.ok) {
          setSystemStatus("ready");
        } else if (mounted) {
          setSystemStatus("ready"); // Mark as ready anyway to not block user
        }
      } catch (err) {
        if (mounted) {
          setSystemStatus("ready"); // Non-critical, still mark as ready
        }
      }
    };

    // Warm up on component mount
    warmupModel();

    return () => {
      mounted = false;
    };
  }, [systemStatus]);

  // Update input when transcript changes and implement debouncing to auto-send
  useEffect(() => {
    if (transcript) {
      setInput(transcript);

      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new debounce timer (after 1.5s of silence, auto-send)
      // Store transcript in ref to use in the timeout callback
      debounceTimerRef.current = setTimeout(async () => {
        if (!isProcessing && transcript.trim()) {
          // Directly send the transcribed message
          const userMessage: Message = {
            id: `msg-${Date.now()}`,
            role: "user",
            content: transcript,
          };

          setMessages((prev) => [...prev, userMessage]);
          setInput("");
          resetTranscript();
          setIsProcessing(true);

          try {
            // Check cache first
            const cachedResponse = responseCache.get(transcript);
            if (cachedResponse) {
              if (isStaleChatResponse(cachedResponse)) {
                responseCache.delete(transcript);
              } else {
                const assistantMessage: Message = {
                  id: `msg-${Date.now()}-ai`,
                  role: "assistant",
                  content: cachedResponse,
                  isCached: true,
                };
                setMessages((prev) => [...prev, assistantMessage]);
                // speakResponse will be called in the next callback below
                setIsProcessing(false);
                return;
              }
            }

            // Build comprehensive context from dashboard and CSV data
            const dashboardData = {
              totalRecords: salesData.length,
              records: salesData,
              summary: {
                totalRevenue: salesData.reduce((sum, record) => sum + (record.amount || 0), 0),
                averageRevenue: salesData.length > 0 ? salesData.reduce((sum, record) => sum + (record.amount || 0), 0) / salesData.length : 0,
                recordCount: salesData.length,
              },
            };

            const csvContext = csvContent ? csvContent : "No CSV data uploaded";

            // Call the unified chat API endpoint
            const response = await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: `You are an AI Analyst. Use this live data: ${JSON.stringify(dashboardSnapshot)} to answer the user's voice query. If they ask 'What is my forecast?', use these specific numbers.\n${transcript}`,
                dashboardData,
                csvContent: csvContext,
                businessName,
                metrics: dashboardSnapshot,
                forecast: dashboardSnapshot,
              }),
            });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();
      const aiResponse = data?.content || data?.message || data?.response;
      if (aiResponse) {
        // Cache successful responses, but never cache refusal/error replies.
        if (!isStaleChatResponse(aiResponse) && data?.source !== "privacy-wall") {
          responseCache.set(transcript, aiResponse);
        }

        const assistantMessage: Message = {
                id: `msg-${Date.now()}-ai`,
                role: "assistant",
                content: aiResponse,
              };

              setMessages((prev) => [...prev, assistantMessage]);
              speakResponse(aiResponse, assistantMessage.id);
            } else {
              console.error("Malformed AI response:", data);
              throw new Error("Invalid response format");
            }
          } catch (err: any) {
            console.error("Auto-send error:", err);
            toast.error("Voice Assistant Error", {
              description: err?.message || "Failed to process your request",
            });
          } finally {
            setIsProcessing(false);
          }
        }
      }, DEBOUNCE_DELAY);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [transcript, isProcessing, salesData, csvContent, businessName, speakResponse, resetTranscript]);

  // Personalized greeting based on time of day
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // (businessName is declared earlier)

  // Trigger greeting message and speak it
  const triggerGreeting = async () => {
    const greeting = `${getTimeGreeting()}, welcome back to ${businessName}. I am Aura AI, your business assistant. What can I do for you today?`;

    const greetingMessage: Message = {
      id: `msg-greeting-${Date.now()}`,
      role: "assistant",
      content: greeting,
    };

    setMessages([greetingMessage]);
    speakResponse(greeting, greetingMessage.id);
  };


  // Activation: audible utterance on user gesture to unlock autoplay and then start listening
  const activateAuraAI = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance("Aura AI system active");
      utter.rate = 1;
      utter.pitch = 1;
      utter.volume = 0.9;
      utter.onend = () => {
        setActivated(true);
        // open panel and start listening immediately after the activation utterance
        setOpen(true);
        // small delay to ensure recognition start after speak
        setTimeout(() => {
          try {
            // startListening will be a function from the hook - call if available
            (startListening as unknown as () => void)();
          } catch (e) {}
        }, 250);
      };
      window.speechSynthesis.speak(utter);
    } catch (e) {
      // best-effort: just open
      setActivated(true);
      setOpen(true);
      try {
        (startListening as unknown as () => void)();
      } catch (e) {}
    }
  }, [startListening]);

  const handleSend = useCallback(async (messageToSend?: string) => {
    const textToSend = (messageToSend || input).trim();
    if (!textToSend) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    resetTranscript();
    setIsProcessing(true);

    try {
      // Check cache first
      const cachedResponse = responseCache.get(textToSend);
      if (cachedResponse) {
        const assistantMessage: Message = {
          id: `msg-${Date.now()}-ai`,
          role: "assistant",
          content: cachedResponse,
          isCached: true,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        speakResponse(cachedResponse, assistantMessage.id);
        setIsProcessing(false);
        return;
      }

      // Build comprehensive context from dashboard and CSV data
      const dashboardData = {
        totalRecords: salesData.length,
        records: salesData,
        summary: {
          totalRevenue: salesData.reduce((sum, record) => sum + (record.amount || 0), 0),
          averageRevenue: salesData.length > 0 ? salesData.reduce((sum, record) => sum + (record.amount || 0), 0) / salesData.length : 0,
          recordCount: salesData.length,
        },
      };

      const csvContext = csvContent ? csvContent : "No CSV data uploaded";

      // Call the unified chat API endpoint
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          dashboardData,
          csvContent: csvContext,
          businessName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();
      const aiResponse = data?.content || data?.message || data?.response;
      if (aiResponse) {
        // Cache successful responses, but never cache refusal/error replies.
        if (!isStaleChatResponse(aiResponse) && data?.source !== "privacy-wall") {
          responseCache.set(textToSend, aiResponse);
        }

        const assistantMessage: Message = {
          id: `msg-${Date.now()}-ai`,
          role: "assistant",
          content: aiResponse,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Immediately speak the response
        speakResponse(aiResponse, assistantMessage.id);
      } else {
        console.error("Malformed AI response:", data);
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      toast.error("Voice Assistant Error", {
        description: err?.message || "Failed to process your request",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [input, salesData, csvContent, businessName, speakResponse, resetTranscript]);

  const handleMicClick = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  if (!open) {
    return (
      <div>
        <motion.button
          onClick={activateAuraAI}
          className="fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-shadow z-40"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Activate AuraAI"
        >
          <Mic className="w-6 h-6" />
        </motion.button>
      </div>
    );
  }

  return (
    <motion.div
      className="fixed bottom-6 right-6 w-96 h-screen md:h-[600px] md:rounded-2xl rounded-none bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col z-50"
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-50">AURA AI Voice Assistant</h3>
          {systemStatus === "warming" && (
            <motion.div
              className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/20 border border-amber-500/30"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs text-amber-300">Initializing...</span>
            </motion.div>
          )}
          {systemStatus === "ready" && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-green-500/20 border border-green-500/30">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs text-green-300">Ready</span>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            setOpen(false);
            window.speechSynthesis.cancel();
          }}
          className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex items-center justify-center text-slate-400 text-sm text-center"
            >
              <div>
                <p>🎤 AURA AI Voice Assistant</p>
                <p className="text-xs mt-2">Talk or type to get insights from your business data</p>
              </div>
            </motion.div>
          ) : (
            messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className="flex flex-col max-w-xs">
                  <div
                    className={`px-4 py-3 rounded-lg backdrop-blur-sm ${
                      msg.role === "user"
                        ? "bg-blue-600/40 border border-blue-500/30 text-slate-50 rounded-br-none"
                        : "bg-slate-700/40 border border-slate-600/30 text-slate-100 rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    {msg.role === "assistant" && currentSpeakingId === msg.id && <SoundWave isPlaying={true} />}
                  </div>
                  {msg.isCached && msg.role === "assistant" && (
                    <div className="flex items-center gap-1 mt-1 px-2 text-xs text-slate-400">
                      <Zap size={10} />
                      <span>from cache</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        {isProcessing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-slate-700/40 border border-slate-600/30 px-4 py-3 rounded-lg text-sm text-slate-300 backdrop-blur-sm">
              <span className="inline-block">Processing your question</span>
              <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity }}>
                ...
              </motion.span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/5 space-y-3 bg-gradient-to-r from-slate-900/30 to-slate-900/20 backdrop-blur-sm">
        {error && <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded border border-red-500/30">{error}</div>}

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={isListening ? "Listening..." : "Type or speak..."}
            className="flex-1 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all backdrop-blur-sm"
            disabled={isProcessing}
          />
          <motion.button
            onClick={handleMicClick}
            className={`p-2 rounded-lg transition-all ${
              isListening ? "bg-red-500/40 border border-red-500/60 text-red-300" : "bg-slate-700/50 border border-slate-600/50 text-slate-400 hover:text-slate-200"
            }`}
            title={isListening ? "Stop listening" : "Click to speak"}
            style={
              isListening
                ? {
                    animation: "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                  }
                : undefined
            }
          >
            <Mic className="w-5 h-5" />
          </motion.button>
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isProcessing}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all border border-blue-500/50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={() => speakResponse(input || "Please enter some text", "test")}
          disabled={!input.trim()}
          className="w-full px-3 py-2 text-xs rounded-lg bg-purple-600/40 hover:bg-purple-600/60 disabled:opacity-50 disabled:cursor-not-allowed text-purple-200 transition-all flex items-center justify-center gap-2 border border-purple-500/30"
        >
          <Volume2 className="w-4 h-4" />
          Read Aloud
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </motion.div>
  );
}
