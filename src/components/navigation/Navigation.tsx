"use client";

import Link from "next/link";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useRouter } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";
import { useTranslatedTexts } from "@/hooks/useTranslatedTexts";

export function Navigation() {
  const { user, isSignedIn } = useSupabaseAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const language = useSiteLanguage();
  const [
    features,
    pricing,
    about,
    dashboard,
    signOut,
    signIn,
    getStarted,
    signingOut,
  ] = useTranslatedTexts(language, [
    "Features",
    "Pricing",
    "About",
    "Dashboard",
    "Sign Out",
    "Sign In",
    "Get Started",
    "Signing out...",
  ]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/");
      setIsOpen(false);
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-700 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg"></div>
            <span className="text-slate-50">AuraSales</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/#features"
              className="px-3 py-2 text-sm text-slate-300 hover:text-slate-50 transition-colors"
            >
              {features}
            </Link>
            <Link
              href="/#pricing"
              className="px-3 py-2 text-sm text-slate-300 hover:text-slate-50 transition-colors"
            >
              {pricing}
            </Link>
            <Link
              href="/#about"
              className="px-3 py-2 text-sm text-slate-300 hover:text-slate-50 transition-colors"
            >
              {about}
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isSignedIn && user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs font-semibold text-slate-950">
                    {user.email?.[0].toUpperCase() || "U"}
                  </div>
                  <span className="text-sm text-slate-300">{user.email}</span>
                </div>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-sm font-medium text-slate-50 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  {dashboard}
                </Link>
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <LogOut size={16} />
                  {isSigningOut ? signingOut : signOut}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-50 transition-colors"
                >
                  {signIn}
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 text-sm font-medium text-slate-950 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  {getStarted}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-slate-50"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-slate-700">
            <Link
              href="/#features"
              className="block px-3 py-2 text-sm text-slate-300 hover:text-slate-50"
            >
              {features}
            </Link>
            <Link
              href="/#pricing"
              className="block px-3 py-2 text-sm text-slate-300 hover:text-slate-50"
            >
              {pricing}
            </Link>
            <Link
              href="/#about"
              className="block px-3 py-2 text-sm text-slate-300 hover:text-slate-50"
            >
              {about}
            </Link>
            <div className="flex flex-col gap-2 mt-3 px-3">
              {isSignedIn && user ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs font-semibold text-slate-950">
                      {user.email?.[0].toUpperCase() || "U"}
                    </div>
                    <span className="text-sm text-slate-300">{user.email}</span>
                  </div>
                  <Link
                    href="/dashboard"
                    className="px-3 py-2 text-sm font-medium text-center text-slate-50 bg-blue-600 hover:bg-blue-700 rounded-lg"
                  >
                    {dashboard}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="px-3 py-2 text-sm font-medium text-center text-slate-300 hover:text-slate-50 border border-slate-600 rounded-lg disabled:opacity-50 transition-colors"
                  >
                    {isSigningOut ? signingOut : signOut}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    className="px-3 py-2 text-sm font-medium text-center text-slate-300 hover:text-slate-50 border border-slate-600 rounded-lg"
                  >
                    {signIn}
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="px-3 py-2 text-sm font-medium text-center text-slate-950 bg-blue-600 hover:bg-blue-700 rounded-lg"
                  >
                    {getStarted}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
