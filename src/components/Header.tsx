
"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";
import { useTranslatedTexts } from "@/hooks/useTranslatedTexts";

export default function Header() {
  const pathname = usePathname();
  const language = useSiteLanguage();
  const [features, solutions, pricing, faq, launchDashboard] = useTranslatedTexts(language, [
    "Features",
    "Solutions",
    "Pricing",
    "FAQ",
    "Launch Dashboard",
  ]);
  if (pathname?.startsWith("/dashboard")) {
    return null;
  }
  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-slate-900/70 border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Image src="/logo.svg" alt="AuraSales Logo" width={36} height={36} />
          <span className="hidden sm:inline">AuraSales</span>
        </Link>
        {/* Navigation */}
        <nav className="hidden md:flex gap-8 text-base font-medium">
          <Link href="/#features" className="hover:text-cyan-400 transition">{features}</Link>
          <Link href="/#solutions" className="hover:text-cyan-400 transition">{solutions}</Link>
          <Link href="/#pricing" className="hover:text-cyan-400 transition">{pricing}</Link>
          <Link href="/#faq" className="hover:text-cyan-400 transition">{faq}</Link>
        </nav>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {/* CTA Button */}
          <Link href="/dashboard" className="ml-1 px-5 py-2 rounded-lg bg-cyan-500 text-white font-semibold shadow hover:bg-cyan-400 transition hidden sm:block" aria-label={launchDashboard}>
            {launchDashboard}
          </Link>
        </div>
        {/* Mobile Nav */}
        <div className="md:hidden">
          {/* Hamburger menu placeholder (implement mobile nav as needed) */}
        </div>
      </div>
    </header>
  );
}
