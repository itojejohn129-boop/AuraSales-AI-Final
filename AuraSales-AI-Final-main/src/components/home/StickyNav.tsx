"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";
import { useTranslatedTexts } from "@/hooks/useTranslatedTexts";

export function StickyNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const language = useSiteLanguage();
  const [features, pricing, faq, signIn, getStarted] = useTranslatedTexts(language, [
    "Features",
    "Pricing",
    "FAQ",
    "Sign In",
    "Get Started",
  ]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "bg-slate-950/80 backdrop-blur-md border-b border-slate-700/50"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl text-slate-50 hover:text-cyan-400 transition-colors">
            AuraSales AI
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-300 hover:text-slate-50 transition-colors text-sm">
              {features}
            </a>
            <a href="#pricing" className="text-slate-300 hover:text-slate-50 transition-colors text-sm">
              {pricing}
            </a>
            <a href="#faq" className="text-slate-300 hover:text-slate-50 transition-colors text-sm">
              {faq}
            </a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/auth/signin" className="text-slate-300 hover:text-slate-50 transition-colors text-sm font-medium">
              {signIn}
            </Link>
            <Link
              href="/auth/signup"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300"
            >
              {getStarted}
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-slate-300 hover:text-slate-50"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-slate-900 border-t border-slate-700 py-4 px-4"
          >
            <div className="space-y-4">
              <a href="#features" className="block text-slate-300 hover:text-slate-50 transition-colors">
                {features}
              </a>
              <a href="#pricing" className="block text-slate-300 hover:text-slate-50 transition-colors">
                {pricing}
              </a>
              <a href="#faq" className="block text-slate-300 hover:text-slate-50 transition-colors">
                {faq}
              </a>
              <Link href="/auth/signin" className="block w-full text-left text-slate-300 hover:text-slate-50 transition-colors py-2">
                {signIn}
              </Link>
              <Link
                href="/auth/signup"
                className="block w-full px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold text-center"
              >
                {getStarted}
              </Link>
            </div>
          </motion.div>
        )}
      </motion.nav>
    </>
  );
}
