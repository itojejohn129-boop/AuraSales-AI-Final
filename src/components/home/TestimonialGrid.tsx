"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";
import { useTranslatedTexts } from "@/hooks/useTranslatedTexts";

interface SalesTitanProps {
  name: string;
  title: string;
  company: string;
  quote: string;
  emoji: string;
}

const salesTitans: SalesTitanProps[] = [
  {
    name: "Aaron Ross",
    title: "Author of Predictable Revenue",
    company: "Sales Visionary",
    quote: "The future of sales isn't more cold calls; it's better intelligence. AuraSales AI is that edge.",
    emoji: "👨‍💼",
  },
  {
    name: "Sarah Chen",
    title: "VP of Sales Operations",
    company: "Fortune 500 Tech",
    quote: "Finally, a tool that speaks the language of revenue, not just rows and columns.",
    emoji: "👩‍💼",
  },
  {
    name: "Marcus Chan",
    title: "Sales Coach & Author",
    company: "Revenue Strategist",
    quote: "Predictive accuracy is the difference between hitting quota and missing your year. This tool makes it easy.",
    emoji: "🧑‍🏫",
  },
];

export function TestimonialGrid() {
  const language = useSiteLanguage();
  const translated = useTranslatedTexts(language, [
    "Sales Titans Trust AuraSales",
    "Endorsements from industry leaders and revenue experts",
    ...salesTitans.flatMap((titan) => [titan.quote, titan.title, titan.company]),
  ]);
  const [heading, subtitle, ...testimonialTexts] = translated;

  const rendered = salesTitans.map((titan, idx) => ({
    ...titan,
    quote: testimonialTexts[idx * 3] ?? titan.quote,
    title: testimonialTexts[idx * 3 + 1] ?? titan.title,
    company: testimonialTexts[idx * 3 + 2] ?? titan.company,
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
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
            className="text-lg text-slate-400"
          >
            {subtitle}
          </motion.p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {rendered.map((titan, idx) => (
            <motion.div key={idx} variants={itemVariants} className="group relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 via-cyan-500/30 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg" />
              <div className="relative p-8 rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm hover:border-cyan-600/50 transition-all duration-300">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-cyan-400 text-cyan-400" />
                  ))}
                </div>

                <p className="text-slate-100 mb-6 leading-relaxed text-lg italic">"{titan.quote}"</p>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl">
                    {titan.emoji}
                  </div>

                  <div>
                    <p className="font-bold text-slate-50">{titan.name}</p>
                    <p className="text-xs text-cyan-400 font-semibold">{titan.title}</p>
                    <p className="text-xs text-slate-400">{titan.company}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
