"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";
import { useTranslatedTexts } from "@/hooks/useTranslatedTexts";

export default function DashboardHeader({ credits = 750, maxCredits = 1000, user = { name: "User" } }) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [creditsUsed, setCreditsUsed] = useState<number>(Math.max(0, maxCredits - credits));
  const [creditsLimit, setCreditsLimit] = useState<number | null>(maxCredits);
  const router = useRouter();
  const supabase = createClient();
  const language = useSiteLanguage();
  const [unlimitedCreditsLabel, creditsLabel, signOutLabel, signingOutLabel, homeLabel, userLabel] =
    useTranslatedTexts(language, [
      "Unlimited Credits",
      "Credits",
      "Sign Out",
      "Signing out...",
      "Go to home",
      "User Profile",
    ]);

  const fetchCredits = async () => {
    try {
      const res = await fetch("/api/credits/me");
      const text = await res.text();
      if (!text.trim()) return;

      let data: {
        summary?: {
          creditsUsed?: number;
          creditsLimit?: number | null;
        };
      } | null = null;

      try {
        data = JSON.parse(text) as {
          summary?: {
            creditsUsed?: number;
            creditsLimit?: number | null;
          };
        };
      } catch {
        console.warn("Credits API returned a non-JSON response");
        return;
      }

      if (!res.ok) return;
      if (!data?.summary) return;
      setCreditsUsed(Number(data.summary.creditsUsed || 0));
      setCreditsLimit(
        data.summary.creditsLimit === null ? null : Number(data.summary.creditsLimit || 0)
      );
    } catch {
      // keep current values
    }
  };

  useEffect(() => {
    let mounted = true;
    const refreshHandler = async () => {
      if (!mounted) return;
      await fetchCredits();
    };

    fetchCredits();
    window.addEventListener("credits:refresh", refreshHandler as EventListener);
    return () => {
      mounted = false;
      window.removeEventListener("credits:refresh", refreshHandler as EventListener);
    };
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
    } finally {
      router.push("/");
      router.refresh();
      setIsSigningOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-slate-900/90 border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo - always visible and clickable */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl hover:text-cyan-400 transition" aria-label={homeLabel}>
          <span className="hidden sm:inline">AuraSales</span>
        </Link>
        <div className="flex items-center gap-4 flex-wrap justify-end">
          <LanguageSwitcher />
          {/* Credits Counter */}
          <span className="text-cyan-400 font-semibold text-sm" aria-label={creditsLabel}>
            {creditsLimit === null
              ? unlimitedCreditsLabel
              : `${Math.max(0, creditsLimit - creditsUsed)}/${creditsLimit} ${creditsLabel}`}
          </span>
          {/* User Profile */}
          <span className="text-slate-200 font-medium text-sm" aria-label={userLabel}>{user.name}</span>
          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="ml-4 px-4 py-2 rounded-lg bg-slate-800 text-white font-semibold hover:bg-slate-700 transition disabled:opacity-60"
            aria-label={signOutLabel}
          >
            {isSigningOut ? signingOutLabel : signOutLabel}
          </button>
        </div>
        {/* Sidebar toggle for mobile - always visible on mobile */}
        <button className="md:hidden ml-4 p-2 rounded hover:bg-slate-800" aria-label="Open sidebar">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-menu"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </button>
      </div>
    </header>
  );
}
