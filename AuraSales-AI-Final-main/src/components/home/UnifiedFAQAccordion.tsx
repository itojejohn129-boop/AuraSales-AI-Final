"use client";

import { useState } from "react";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";
import { useTranslatedTexts } from "@/hooks/useTranslatedTexts";

const faqs = [
  { q: "How secure is my data?", a: "Your data is encrypted in transit and at rest. We use industry best practices and never share or sell your information." },
  { q: "Which AI models power AURA?", a: "AURA leverages state-of-the-art models including OpenAI GPT, Hugging Face Transformers, and custom ML pipelines." },
  { q: "Can I export my forecasts?", a: "Yes, you can export your forecasts and insights as CSV or PDF for further analysis and sharing." },
  { q: "What data formats do you support?", a: "We support CSV files for sales, feedback, and most tabular data exports from your CRM or ERP." },
  { q: "Is my data secure?", a: "Yes. All data is encrypted in transit and at rest. We never share or sell your data." },
  { q: "Can I use voice commands on any device?", a: "Voice features work on all modern browsers and devices with a microphone." },
  { q: "How accurate are the AI insights?", a: "Our models are trained on millions of sales records and continuously improved for accuracy." },
  { q: "Do you offer a free trial?", a: "Yes, you can start with a 14-day free trial. No credit card required." },
];

export default function UnifiedFAQAccordion() {
  const [open, setOpen] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const language = useSiteLanguage();
  const translated = useTranslatedTexts(language, [
    "Frequently Asked Questions",
    "Search FAQs...",
    ...faqs.flatMap((faq) => [faq.q, faq.a]),
  ]);
  const [heading, searchPlaceholder, ...faqTexts] = translated;
  const renderedFaqs = faqs.map((faq, i) => ({
    q: faqTexts[i * 2] ?? faq.q,
    a: faqTexts[i * 2 + 1] ?? faq.a,
  }));
  const filteredFaqs = renderedFaqs.filter(
    (faq) =>
      faq.q.toLowerCase().includes(search.toLowerCase()) ||
      faq.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section id="faq" className="py-20 bg-slate-950">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-50 text-center mb-6">{heading}</h2>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-6 px-4 py-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-100 focus:outline-none focus:border-cyan-400"
        />
        <div className="space-y-4">
          {filteredFaqs.map((faq, i) => (
            <div key={i} className="border border-slate-800 rounded-xl bg-slate-900 overflow-hidden">
              <button
                className="w-full flex justify-between items-center px-6 py-5 text-left text-lg font-medium text-slate-100 focus:outline-none focus:bg-slate-800 transition"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                aria-controls={`faq-panel-unified-${i}`}
              >
                <span>{faq.q}</span>
                <span className={`ml-4 transition-transform ${open === i ? "rotate-180" : "rotate-0"}`}>▼</span>
              </button>
              <div
                id={`faq-panel-unified-${i}`}
                className={`px-6 pb-5 text-slate-400 text-base transition-all duration-300 ease-in-out ${open === i ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}
                style={{ overflow: "hidden" }}
              >
                {open === i && <div>{faq.a}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
