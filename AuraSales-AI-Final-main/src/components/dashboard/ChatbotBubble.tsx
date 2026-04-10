"use client";

import { useState } from "react";
import { MessageSquare, X } from "lucide-react";

interface Props {
  salesData: any[];
}

export default function ChatbotBubble({ salesData }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const summarize = () => {
    const total = salesData.reduce((s, r) => s + (r.amount || 0), 0);
    const today = salesData[salesData.length - 1]?.amount || 0;
    const avg = salesData.length ? Math.round(total / salesData.length) : 0;
    return `Total: $${total.toLocaleString()}, Today: $${today.toLocaleString()}, Average: $${avg.toLocaleString()}`;
  };

  const reply = (q: string) => {
    // Lightweight rule-based replies; this can be swapped for an AI backend later.
    const ql = q.toLowerCase();
    if (ql.includes("how are sales today")) {
      const today = salesData[salesData.length - 1]?.amount || 0;
      return `Sales today are $${today.toLocaleString()}. ${summarize()}`;
    }
    if (ql.includes("top region")) {
      const regions: Record<string, number> = {};
      salesData.forEach((r) => (regions[r.region] = (regions[r.region] || 0) + (r.amount || 0)));
      const top = Object.entries(regions).sort((a, b) => b[1] - a[1])[0];
      return top ? `Top region is ${top[0]} with $${top[1].toLocaleString()}` : "No region data available.";
    }
    return `Summary: ${summarize()}. I can answer questions like 'How are sales today?' or 'Top region'.`;
  };

  // For lightweight offline behavior keep rule-based fallback when API not available
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = input?.trim();
    if (!text) return;
    setIsLoading(true);
    setMessages((m) => [...m, { role: 'user', content: text }]);
    try {
       const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
       if (!res.ok) {
         const errorData = await res.json();
         const fallbackReply = errorData?.content || errorData?.message || errorData?.response;
         if (fallbackReply) {
           setMessages((m) => [...m, { role: 'assistant', content: fallbackReply }]);
           return;
         }
         setMessages((m) => [...m, { role: 'assistant', content: errorData?.error || errorData?.details || `Request failed with status ${res.status}` }]);
         return;
       }
     
       const data = await res.json();
       const reply = data?.content || data?.message || data?.response || "Sorry, I couldn't understand that.";
       setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: `Error: ${(err as any)?.message || String(err)}` }]);
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  return (
    <div>
      <div className="fixed bottom-6 right-6 z-60">
        <div className="flex flex-col items-end">
          {open && (
            <div className="mb-3 w-80 bg-white/8 backdrop-blur-md border border-slate-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-slate-50">Data Chat</div>
                <button onClick={() => setOpen(false)} className="text-slate-300">
                  <X size={16} />
                </button>
              </div>
              <div className="h-40 overflow-y-auto mb-2 space-y-2 text-sm">
                {messages.map((m: any, i: number) => (
                  <div key={i} className={`p-2 rounded ${m.role === "user" ? "bg-slate-700/20 text-slate-100" : "bg-slate-800/30 text-slate-200"}`}>
                    {m.content}
                  </div>
                ))}
                {isLoading && (
                  <div className="p-2 rounded bg-slate-800/30 text-slate-200 italic">AuraAssistant is typing…</div>
                )}
              </div>
              <div className="flex gap-2">
                <form onSubmit={handleSend} className="flex gap-2 w-full">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-transparent border border-slate-700 rounded px-2 py-1 text-slate-100"
                    placeholder="Ask about sales..."
                  />
                  <button type="submit" className="px-3 py-1 bg-blue-600 rounded text-slate-900">Send</button>
                </form>
              </div>
            </div>
          )}

          <button
            onClick={() => setOpen((s) => !s)}
            className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg"
            title="Open Data Chat"
          >
            <MessageSquare size={18} className="text-slate-950" />
          </button>
        </div>
      </div>
    </div>
  );
}
