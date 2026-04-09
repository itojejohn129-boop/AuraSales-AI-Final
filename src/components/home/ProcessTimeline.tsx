"use client";
import { motion } from "framer-motion";

const steps = [
  {
    title: "Upload CSV Data",
    description: "Import your sales or feedback CSV in seconds. No manual formatting required.",
    icon: "📤",
  },
  {
    title: "Configure Sliders",
    description: "Adjust parameters to fine-tune your analysis and forecasting.",
    icon: "🎚️",
  },
  {
    title: "AI Analysis",
    description: "Let our AI engine summarize, analyze sentiment, and detect trends instantly.",
    icon: "🤖",
  },
  {
    title: "Scale Operations",
    description: "Apply insights to drive growth and automate your business processes.",
    icon: "🚀",
  },
];

export default function ProcessTimeline() {
  return (
    <section className="py-20 bg-slate-950">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-50 text-center mb-12">How it Works</h2>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-12">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center md:w-1/4"
            >
              <div className="text-4xl mb-4">{step.icon}</div>
              <h3 className="font-semibold text-lg text-slate-100 mb-2">{step.title}</h3>
              <p className="text-slate-400 text-sm mb-4">{step.description}</p>
              {i < steps.length - 1 && (
                <div className="hidden md:block h-24 w-1 bg-gradient-to-b from-cyan-400/40 to-blue-400/10 mx-auto" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
