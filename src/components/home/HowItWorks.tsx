"use client";

import { motion } from "framer-motion";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";
import { useTranslatedTexts } from "@/hooks/useTranslatedTexts";

const steps = [
  {
    title: "Upload Your Data",
    description: "Import your sales or feedback CSV in seconds. No manual formatting required.",
    icon: "📤",
  },
  {
    title: "AI Analysis & Summarization",
    description: "Our engine summarizes, analyzes sentiment, and detects trends instantly.",
    icon: "🤖",
  },
  {
    title: "Get Actionable Insights",
    description: "View recommendations, risk alerts, and revenue forecasts on your dashboard.",
    icon: "📈",
  },
  {
    title: "Command by Voice (Optional)",
    description: "Use natural language or voice to query your data and get instant answers.",
    icon: "🎤",
  },
];

export default function HowItWorks() {
  const language = useSiteLanguage();
  const translated = useTranslatedTexts(language, [
    "How it Works",
    ...steps.flatMap((step) => [step.title, step.description]),
  ]);
  const [heading, ...stepTexts] = translated;
  const renderedSteps = steps.map((step, index) => ({
    ...step,
    title: stepTexts[index * 2] ?? step.title,
    description: stepTexts[index * 2 + 1] ?? step.description,
  }));

  return (
    <section className="py-20 bg-slate-950">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-50 text-center mb-12">{heading}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {renderedSteps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center text-center shadow-lg"
            >
              <div className="text-4xl mb-4">{step.icon}</div>
              <h3 className="font-semibold text-lg text-slate-100 mb-2">{step.title}</h3>
              <p className="text-slate-400 text-sm">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
