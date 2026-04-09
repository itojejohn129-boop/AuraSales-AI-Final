"use client";

import { motion } from "framer-motion";
import { TrendingUp, Zap, Globe, Upload, Wand2, AlertTriangle } from "lucide-react";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";
import { useTranslatedTexts } from "@/hooks/useTranslatedTexts";

interface FeatureProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  gridSize: "large" | "small" | "medium";
  gradient: string;
}

const featureKeys: FeatureProps[] = [
  {
    title: "Neural Forecasting",
    description:
      "Predict next 30 days of revenue with 92% accuracy. Built-in anomaly detection alerts you to anomalies before they impact your quarter.",
    icon: <TrendingUp className="w-8 h-8" />,
    gridSize: "large",
    gradient: "from-blue-600/40 to-cyan-600/40",
  },
  {
    title: "Auto-Mapper",
    description: "Upload your CSV. AI instantly maps columns. Zero manual config.",
    icon: <Wand2 className="w-6 h-6" />,
    gridSize: "small",
    gradient: "from-indigo-600/40 to-purple-600/40",
  },
  {
    title: "Region Intelligence",
    description: "Rank regions by performance. Drill down into geographies that matter.",
    icon: <Globe className="w-6 h-6" />,
    gridSize: "small",
    gradient: "from-emerald-600/40 to-teal-600/40",
  },
  {
    title: "What-If Simulator",
    description: "Model marketing spend impact instantly. Visualize revenue outcomes at 0.5x to 2.0x investment.",
    icon: <Zap className="w-6 h-6" />,
    gridSize: "medium",
    gradient: "from-orange-600/40 to-red-600/40",
  },
  {
    title: "Anomaly Detector",
    description: "Z-score powered. Catches outliers and alerts you with severity levels.",
    icon: <AlertTriangle className="w-6 h-6" />,
    gridSize: "small",
    gradient: "from-pink-600/40 to-rose-600/40",
  },
  {
    title: "Bulk Import Engine",
    description: "Upload thousands of rows. Chunked processing. Zero downtime. Progress tracking.",
    icon: <Upload className="w-6 h-6" />,
    gridSize: "medium",
    gradient: "from-violet-600/40 to-indigo-600/40",
  },
];

function FeatureCard({
  feature,
  index,
}: {
  feature: FeatureProps;
  index: number;
}) {
  const isLarge = feature.gridSize === "large";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true, margin: "-100px" }}
      className={`group relative overflow-hidden rounded-2xl border border-slate-700/50 
        ${
          isLarge
            ? "md:col-span-2 md:row-span-2 p-12"
            : feature.gridSize === "medium"
              ? "md:col-span-2 md:row-span-1 p-8"
              : "p-8"
        }`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 h-full flex flex-col justify-between">
        <div>
          <motion.div
            className="mb-4 text-cyan-400 inline-flex p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 group-hover:border-cyan-600/50 transition-all"
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            {feature.icon}
          </motion.div>

          <h3
            className={`font-bold text-slate-50 mb-2 ${
              isLarge ? "text-3xl" : feature.gridSize === "medium" ? "text-2xl" : "text-xl"
            }`}
          >
            {feature.title}
          </h3>

          <p className={`text-slate-300 leading-relaxed ${isLarge ? "text-base" : "text-sm"}`}>
            {feature.description}
          </p>
        </div>

        <motion.div
          className="mt-6 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
          initial={{ width: "0%" }}
          whileInView={{ width: "40%" }}
          transition={{ duration: 0.8, delay: index * 0.15 }}
          viewport={{ once: true }}
        />
      </div>
    </motion.div>
  );
}

export function FeatureBoxGrid() {
  const language = useSiteLanguage();
  const translated = useTranslatedTexts(language, [
    "Enterprise-Grade Features",
    "From neural forecasting to bulk imports, every tool is designed for modern sales ops teams",
    ...featureKeys.flatMap((item) => [item.title, item.description]),
  ]);
  const [heading, subtitle, ...featureTexts] = translated;
  const features = featureKeys.map((feature, index) => ({
    ...feature,
    title: featureTexts[index * 2] ?? feature.title,
    description: featureTexts[index * 2 + 1] ?? feature.description,
  }));

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-950 to-slate-900">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, margin: "-100px" }}
        className="mx-auto max-w-7xl"
      >
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-slate-50 mb-4"
          >
            {heading}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-lg text-slate-400 max-w-2xl mx-auto"
          >
            {subtitle}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-6">
          {features.map((feature, idx) => (
            <FeatureCard key={idx} feature={feature} index={idx} />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
