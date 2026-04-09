"use client";

import Link from "next/link";
import Image from "next/image";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";
import { useTranslatedTexts } from "@/hooks/useTranslatedTexts";

export default function Footer() {
  const language = useSiteLanguage();
  const [tagline, product, company, legal, features, mlEngine, voiceAi, about, contact, careers, privacy, terms] =
    useTranslatedTexts(language, [
      "Engineering intelligence for the modern era.",
      "Product",
      "Company",
      "Legal",
      "Features",
      "ML Engine",
      "Voice AI",
      "About",
      "Contact",
      "Careers",
      "Privacy Policy",
      "Terms of Service",
    ]);

  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-10 mt-16">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Image src="/logo.svg" alt="AuraSales Logo" width={32} height={32} />
            <span className="font-bold text-lg">AuraSales</span>
          </div>
          <p className="text-slate-400 text-sm">{tagline}</p>
        </div>
        {/* Product */}
        <div>
          <h4 className="font-semibold mb-2">{product}</h4>
          <ul className="space-y-1 text-slate-300">
            <li><Link href="/#features" className="hover:text-cyan-400 transition">{features}</Link></li>
            <li><Link href="/#solutions" className="hover:text-cyan-400 transition">{mlEngine}</Link></li>
            <li><Link href="/#about" className="hover:text-cyan-400 transition">{voiceAi}</Link></li>
          </ul>
        </div>
        {/* Company */}
        <div>
          <h4 className="font-semibold mb-2">{company}</h4>
          <ul className="space-y-1 text-slate-300">
            <li><Link href="/#about" className="hover:text-cyan-400 transition">{about}</Link></li>
            <li><a href="mailto:salesanalyzer500@gmail.com" className="hover:text-cyan-400 transition">{contact}</a></li>
            <li><a href="mailto:salesanalyzer500@gmail.com?subject=Careers%20at%20AuraSales" className="hover:text-cyan-400 transition">{careers}</a></li>
          </ul>
        </div>
        {/* Legal */}
        <div>
          <h4 className="font-semibold mb-2">{legal}</h4>
          <ul className="space-y-1 text-slate-300">
            <li><Link href="/privacy-policy" className="hover:text-cyan-400 transition">{privacy}</Link></li>
            <li><Link href="/terms-of-service" className="hover:text-cyan-400 transition">{terms}</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 mt-10">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-6 py-5">
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400 mb-4">Project Team</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-slate-300 text-sm">
            <div>
              <p className="font-semibold text-slate-50">Data Lead</p>
              <p>Ebore Choice</p>
            </div>
            <div>
              <p className="font-semibold text-slate-50">Visualisation Specialist</p>
              <p>Itoje John</p>
            </div>
            <div>
              <p className="font-semibold text-slate-50">AI Integrator</p>
              <p>Animashaun Jafar</p>
            </div>
            <div>
              <p className="font-semibold text-slate-50">ML Engineer & Frontend/Integration</p>
              <p>Abdulhammed Muhammed Awwal</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
