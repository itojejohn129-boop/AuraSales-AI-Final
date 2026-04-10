"use client";
import { motion } from "framer-motion";

const benefits = [
  {
    title: "Iterative Forecasting",
    description: "Harness our ML Engine for continuous, adaptive revenue predictions that improve with every data cycle.",
    icon: "🔁",
  },
  {
    title: "Voice Command",
    description: "Control your analytics and get instant insights using natural language, powered by Hugging Face AI.",
    icon: "🎙️",
  },
  {
    title: "Sentinel Intelligence",
    description: "Stay ahead with real-time market signals and news, integrated via News API for actionable alerts.",
    icon: "🛰️",
  },
];

export default function ValuePropGrid() {
  return (
    <section className="py-20 bg-slate-950">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-50 text-center mb-12">Why AuraSales?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center text-center shadow-lg"
            >
              <div className="text-4xl mb-4">{b.icon}</div>
              <h3 className="font-semibold text-lg text-slate-100 mb-2">{b.title}</h3>
              <p className="text-slate-400 text-sm">{b.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
