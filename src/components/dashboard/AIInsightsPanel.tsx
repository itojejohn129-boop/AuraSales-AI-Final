"use client";

import { Lightbulb, TrendingUp, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslatedTexts } from "@/hooks/useTranslatedTexts";

interface AIInsightsPanelProps {
  insights: string[];
  isLoading?: boolean;
  targetLanguage?: string;
}

export function AIInsightsPanel({ insights, isLoading = false, targetLanguage = "en" }: AIInsightsPanelProps) {
  const [translatedTitle, translatedEmpty] = useTranslatedTexts(targetLanguage, [
    "AI Insights",
    "Upload sales data to generate AI-powered insights",
  ]);
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  if (isLoading) {
    return (
      <div className="p-6 rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-md" data-aura-translate-skip>
        <div className="flex items-center gap-3 mb-4">
          <Lightbulb className="w-5 h-5 text-yellow-500 animate-pulse" />
          <h3 className="text-lg font-semibold text-slate-50">{translatedTitle}</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-700/50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="p-6 rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-md"
      data-aura-translate-skip
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <Lightbulb className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-semibold text-slate-50">{translatedTitle}</h3>
      </div>

      {insights.length === 0 ? (
        <p className="text-sm text-slate-400">{translatedEmpty}</p>
      ) : (
        <motion.ul
          className="space-y-2"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {insights.map((insight, idx) => (
            <motion.li
              key={idx}
              className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50 text-sm text-slate-200"
              variants={item}
            >
              {insight}
            </motion.li>
          ))}
        </motion.ul>
      )}
    </motion.div>
  );
}
