"use client";
import { useState } from "react";

const faqs = [
  {
    q: "What data formats do you support?",
    a: "We support CSV files for sales, feedback, and most tabular data exports from your CRM or ERP.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is encrypted in transit and at rest. We never share or sell your data.",
  },
  {
    q: "Can I use voice commands on any device?",
    a: "Voice features work on all modern browsers and devices with a microphone.",
  },
  {
    q: "How accurate are the AI insights?",
    a: "Our models are trained on millions of sales records and continuously improved for accuracy.",
  },
  {
    q: "Do you offer a free trial?",
    a: "Yes, you can start with a 14-day free trial. No credit card required.",
  },
];

export default function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="py-20 bg-slate-950">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-50 text-center mb-10">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-slate-800 rounded-xl bg-slate-900 overflow-hidden">
              <button
                className="w-full flex justify-between items-center px-6 py-5 text-left text-lg font-medium text-slate-100 focus:outline-none focus:bg-slate-800 transition"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                aria-controls={`faq-panel-${i}`}
              >
                <span>{faq.q}</span>
                <span className={`ml-4 transition-transform ${open === i ? "rotate-180" : "rotate-0"}`}>▼</span>
              </button>
              <div
                id={`faq-panel-${i}`}
                className={`px-6 pb-5 text-slate-400 text-base transition-all duration-300 ease-in-out ${open === i ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}
                style={{ overflow: 'hidden' }}
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
