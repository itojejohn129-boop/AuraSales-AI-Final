"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Mic, X, Send, AlertTriangle } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";


interface AuraAssistantProps {
  currentSalesData?: any;
  rawCsvText?: string;
  dashboardSnapshot?: any;
}

export default function AuraAssistant({ currentSalesData = {}, rawCsvText = "", dashboardSnapshot = {} }: AuraAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  const messagesRef = useRef<HTMLDivElement | null>(null);

  const { isListening, transcript, error, startListening, stopListening, resetTranscript, isSpeechRecognitionReady } = useSpeechRecognition();
  const { user } = useSupabaseAuth();
  const businessName = user?.user_metadata?.business_name || "Your Business";

  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const lastSpokenRef = useRef<string>("");
  const [history, setHistory] = useState<Array<{ role: string; content: string }>>([]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Load recent history from server on mount
  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const res = await fetch('/api/chat/history');
        if (!res.ok) return;
        const data = await res.json();
        if (mounted && data?.messages) setHistory(data.messages || []);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  // When transcript updates (finalized), send it automatically
  useEffect(() => {
    if (transcript && transcript.trim()) {
      void handleSend(transcript.trim());
      resetTranscript();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  const speakText = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find((v) => v.name.includes("Google") || v.lang?.startsWith("en"));
      if (preferred) u.voice = preferred;
      window.speechSynthesis.speak(u);
    } catch (e) {
      // ignore
    }
  }, []);

  const handleSend = useCallback(async (text?: string) => {
    const msg = (text || input || "").trim();
    if (!msg) return;
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setIsLoading(true);
    try {
      // Build context object with latest metrics and forecastData
      const context = {
        analytics: dashboardSnapshot?.analytics || {},
        chartData: dashboardSnapshot?.chartData || [],
        marketingPct: dashboardSnapshot?.marketingPct,
        growthPct: dashboardSnapshot?.growthPct,
        recommendations: dashboardSnapshot?.recommendations || [],
        sentimentScores: dashboardSnapshot?.sentimentScores || [],
        averageSentimentScore: dashboardSnapshot?.averageSentimentScore,
        sentimentTrend: dashboardSnapshot?.sentimentTrend,
        forecastData: dashboardSnapshot?.forecastData || {},
        forecastInsight: dashboardSnapshot?.forecastInsight || {},
        totalRecords: dashboardSnapshot?.totalRecords,
      };
      const res = await fetch('/api/voice-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `You are an AI Analyst. Use this live data: ${JSON.stringify(dashboardSnapshot)} to answer the user's voice query. If they ask 'What is my forecast?', use these specific numbers.\n${msg}`,
          dashboardData: dashboardSnapshot,
          csvContent: rawCsvText,
          businessName,
          context,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 402) {
          window.location.href = errorData?.redirectTo || "/pricing?payment=required";
          return;
        }
        throw new Error(errorData?.error || errorData?.details || `Request failed with status ${res.status}`);
      }
      const data = await res.json();
      // Use choices[0].message.content if present
      let aiText = data?.choices?.[0]?.message?.content || data?.content || data?.response || "Sorry, I couldn't understand that.";
      setMessages((m) => [...m, { role: 'assistant', content: aiText }]);
      if (aiText) speakText(aiText);
    } catch (err) {
      const errorMsg = (err as any)?.message || "Unable to process your request";
      setMessages((m) => [...m, { role: 'assistant', content: errorMsg }]);
    } finally {
      setIsLoading(false);
      setInput('');
    }
  }, [input, dashboardSnapshot, rawCsvText, businessName, speakText]);

  const startSession = useCallback(async () => {
    try {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      const initText = "Say hello and greet the user by their business name.";
      setHasInitialized(true);
      await handleSend(initText);
      if (isSpeechRecognitionReady) startListening();
    } catch (e) {
      // ignore
    }
  }, [handleSend, isSpeechRecognitionReady, startListening]);

  // Progressive TTS: speak incoming assistant tokens as they arrive
  useEffect(() => {
    const lastAssistant = [...messages].reverse().find((m: any) => m.role === "assistant");
    const content = lastAssistant?.content || "";
    if (!content) return;
    const prev = lastSpokenRef.current || "";
    if (content.length > prev.length) {
      const delta = content.slice(prev.length);
      speakText(delta);
      lastSpokenRef.current = content;
    }
  }, [messages, speakText]);

  return (
    <div>
      {!isOpen ? (
        <motion.button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-2xl z-50"
        >
          <div className={`relative`}>
            <div className={`absolute -inset-1 rounded-full ${isListening || isThinking ? "animate-pulse bg-blue-400/30" : ""}`} />
            <Mic className="w-6 h-6 relative" />
          </div>
        </motion.button>
      ) : (
        <motion.div
          className="fixed bottom-6 right-6 w-96 h-[520px] rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl flex flex-col z-50"
          initial={{ x: 200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 200, opacity: 0 }}
        >
          <div className="flex items-center justify-between p-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="bg-white/5 rounded-full p-2">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-100 font-semibold">AuraAssistant</p>
                <p className="text-xs text-slate-300">Data-restricted Executive Analyst</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsOpen(false)} className="p-2 rounded-md hover:bg-white/5" aria-label="Close">
                <X className="w-4 h-4 text-slate-200" />
              </button>
            </div>
          </div>

          <div ref={messagesRef} className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
            { (history.length === 0 && messages.length === 0) ? (
              <div className="text-center text-slate-400">Say "Start Session" to begin. Restricted to your dashboard data and uploaded CSV.</div>
            ) : (
              ([...history, ...messages] as any[]).map((m: any, i: number) => (
                <div key={i} className={`max-w-full ${m.role === "user" ? "ml-auto text-right" : ""}`}>
                  <div className={`inline-block px-3 py-2 rounded-lg ${
                    m.role === "system" ? "bg-slate-700/30 text-slate-300 italic" :
                    m.role === "user" ? "bg-blue-600/40 text-white" : "bg-slate-800/50 text-slate-100"
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 break-words">{m.content}</div>
                      {typeof m.content === 'string' && m.content.toLowerCase().includes('restricted to analyzing your business data') && (
                        <AlertTriangle className="w-4 h-4 text-yellow-300" aria-label="privacy-wall" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="p-2 rounded bg-slate-800/30 text-slate-200 italic">AuraAssistant is typing…</div>
            )}
          </div>

          <div className="p-3 border-t border-white/10 space-y-3">
            <div className="flex gap-2">
              <button onClick={startSession} className="flex-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                Start Session
              </button>
              <button onClick={() => { if (isListening) stopListening(); else startListening(); }} className={`px-3 py-2 rounded-lg border ${isListening ? "border-red-400 bg-red-600/10 text-red-300" : "border-white/10 text-white/80"}`}>
                {isListening ? "Stop" : "Listen"}
              </button>
            </div>

            <div className="flex gap-2">
              <form onSubmit={(e) => { e.preventDefault(); void handleSend(input); }} className="flex gap-2 w-full">
                <input placeholder="Type a question..." className="flex-1 px-3 py-2 rounded-lg bg-white/5 text-slate-50 placeholder-slate-400" value={input} onChange={(e) => setInput(e.target.value)} />
                <button type="submit" className="px-3 py-2 rounded-lg bg-purple-600 text-white">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

            <div className="text-xs text-slate-400">Responses are restricted to your visible dashboard data and uploaded CSV.</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
