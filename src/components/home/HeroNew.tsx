"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import Link from "next/link";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";
import { useTranslatedTexts } from "@/hooks/useTranslatedTexts";

export function HeroNew() {
  const language = useSiteLanguage();
  const [title, description, getStartedFree, liveDemo, dashboardTitle, dashboardSubtitle] =
    useTranslatedTexts(language, [
      "The Neural Engine for High-Velocity Sales Teams.",
      "Stop guessing on revenue. AI-powered forecasting, intelligent mapping, and real-time insights that give sales teams the edge they need.",
      "Get Started Free",
      "Live Demo",
      "Sales Analytics Dashboard",
      "Real-time predictions • Anomaly detection • Regional insights",
    ]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-12 px-4 sm:px-6 lg:px-8 bg-slate-950">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full opacity-60" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full opacity-60" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-50 leading-tight"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                {title}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-slate-300 max-w-lg leading-relaxed"
            >
              {description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex items-center gap-4 pt-4"
            >
              <Link
                href="/auth/signup"
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300"
              >
                {getStartedFree}
              </Link>
              <Link
                href="/dashboard"
                className="px-8 py-3 border border-cyan-500/50 text-cyan-300 rounded-lg font-semibold hover:bg-cyan-500/10 transition-all duration-300 flex items-center gap-2"
              >
                <Play className="w-4 h-4" /> {liveDemo}
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative"
          >
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="relative"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/30 via-blue-500/20 to-transparent blur-2xl -z-10" />
              <div className="relative p-1 rounded-2xl border border-slate-800 backdrop-blur-md bg-slate-900/40">
                <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 p-6">
                  <div className="aspect-video bg-gradient-to-br from-blue-900/30 via-slate-800 to-slate-900 rounded-lg flex items-center justify-center border border-slate-700/50">
                    <div className="text-center">
                      <div className="text-6xl mb-2">📊</div>
                      <p className="text-slate-300 font-semibold text-lg">{dashboardTitle}</p>
                      <p className="text-slate-500 text-sm mt-2">{dashboardSubtitle}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="h-2 bg-slate-700/50 rounded w-3/4" />
                    <div className="h-2 bg-slate-700/50 rounded w-1/2" />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
