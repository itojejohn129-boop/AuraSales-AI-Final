"use client";

import Link from "next/link";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";
import { useTranslatedTexts } from "@/hooks/useTranslatedTexts";

export default function FinalCTA() {
  const language = useSiteLanguage();
  const [heading, description, cta] = useTranslatedTexts(language, [
    "Ready to see your future?",
    "Launch AURA now and unlock predictive revenue, market intelligence, and voice-powered analytics.",
    "Get Started",
  ]);

  return (
    <section id="about" className="w-full py-20 bg-gradient-to-r from-slate-950 via-blue-900 to-slate-950 text-center">
      <div className="max-w-2xl mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">{heading}</h2>
        <p className="text-lg text-slate-300 mb-8">{description}</p>
        <Link
          href="/auth/signup"
          className="px-10 py-4 inline-flex rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg shadow-lg hover:from-cyan-400 hover:to-blue-500 transition-all duration-300"
        >
          {cta}
        </Link>
      </div>
    </section>
  );
}
