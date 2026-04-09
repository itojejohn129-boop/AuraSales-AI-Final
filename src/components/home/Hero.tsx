"use client";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-20 pb-12 px-4 sm:px-6 lg:px-8 bg-slate-950">
      <div className="relative z-10 mx-auto max-w-7xl w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
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
              Engineered for Growth. <br className="hidden md:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">Driven by AI.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-slate-300 max-w-lg leading-relaxed"
            >
              Predict revenue, track market sentiment, and command your business via voice.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex items-center gap-4 pt-4"
            >
              <Link
                href="/auth/signup"
                className="inline-flex px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300"
              >
                Start Free Trial
              </Link>
            </motion.div>
          </motion.div>
          {/* Right: Decorative Revenue Chart Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative flex justify-center"
          >
            <div className="relative w-full max-w-md aspect-video bg-gradient-to-br from-blue-900/30 via-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 p-6 flex flex-col justify-end">
              {/* Chart bars */}
              <div className="flex items-end h-32 gap-2 w-full">
                <div className="bg-cyan-400/70 rounded-md w-6 h-12" />
                <div className="bg-blue-400/70 rounded-md w-6 h-20" />
                <div className="bg-cyan-300/80 rounded-md w-6 h-24" />
                <div className="bg-blue-500/80 rounded-md w-6 h-32" />
                <div className="bg-cyan-500/90 rounded-md w-6 h-28" />
                <div className="bg-blue-400/60 rounded-md w-6 h-16" />
              </div>
              <div className="mt-6 text-center text-slate-300 text-sm font-medium">Revenue (Mock Data)</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
