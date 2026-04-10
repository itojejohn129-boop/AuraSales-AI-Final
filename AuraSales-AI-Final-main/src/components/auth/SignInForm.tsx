"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, Lock, Send } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { GoogleOAuthButton } from "./GoogleOAuthButton";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";
import { useTranslatedTexts } from "@/hooks/useTranslatedTexts";

type SignInMethod = "password" | "magic-link";

export function SignInForm() {
  const [method, setMethod] = useState<SignInMethod>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const router = useRouter();
  const supabase = createClient();
  const language = useSiteLanguage();
  const translated = useTranslatedTexts(language, [
    "Check your email",
    "We sent a magic link to",
    "Click the link to sign in and access your dashboard",
    "Try another method",
    "Welcome back",
    "Sign in to your AuraSales account to continue",
    "Password",
    "Magic Link",
    "Email Address",
    "Forgot password?",
    "Sign in",
    "Sending...",
    "Send Magic Link",
    "Please enter both email and password",
    "Please enter your email address",
    "Sign in failed",
    "Failed to send magic link",
    "Don't have an account?",
    "Sign up",
    "Enter your email address and we'll send you a magic link to sign in",
    "Signing in...",
    "you@company.com",
    "Your password",
  ]);
  const [
    checkEmail,
    sentTo,
    clickLink,
    tryAnother,
    welcomeBack,
    continueText,
    passwordLabel,
    magicLinkLabel,
    emailLabel,
    forgotPassword,
    signInLabel,
    sendingLabel,
    sendMagicLinkLabel,
    enterBothError,
    enterEmailError,
    signInFailed,
    failedMagicLink,
    dontHaveAccount,
    signUpLabel,
    magicLinkDescription,
    signingInLabel,
    emailPlaceholder,
    passwordPlaceholder,
  ] = translated;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMounted) return;
    setError("");
    setIsLoading(true);

    if (!email || !password) {
      setError(enterBothError);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else if (data.session) {
        router.push("/dashboard");

        // Fallback: force a hard reload into the protected route if client navigation stalls.
        setTimeout(() => {
          if (window.location.pathname !== "/dashboard") {
            window.location.href = "/dashboard";
          }
        }, 250);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || signInFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMounted) return;
    setError("");
    setIsLoading(true);

    if (!email) {
      setError(enterEmailError);
      setIsLoading(false);
      return;
    }

    try {
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/onboarding`,
        },
      });

      if (magicLinkError) {
        setError(magicLinkError.message);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || failedMagicLink);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md text-center py-8">
        <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <Send className="w-5 h-5 text-slate-950" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-50 mb-2">{checkEmail}</h2>
        <p className="text-slate-400 mb-4">
          {sentTo} <br />
          <span className="font-semibold text-slate-300">{email}</span>
        </p>
        <p className="text-sm text-slate-500 mb-6">{clickLink}</p>
        <button onClick={() => setSuccess(false)} className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
          {tryAnother}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="text-3xl font-bold text-slate-50 mb-2">{welcomeBack}</h1>
      <p className="text-slate-400 mb-6">{continueText}</p>

      <div className="flex gap-2 mb-6 bg-slate-800 p-1 rounded-lg">
        <button onClick={() => { setMethod("password"); setError(""); }} className={`flex-1 py-2 px-4 rounded-md font-semibold transition-colors ${method === "password" ? "bg-blue-600 text-slate-950" : "text-slate-400 hover:text-slate-200"}`}>
          {passwordLabel}
        </button>
        <button onClick={() => { setMethod("magic-link"); setError(""); }} className={`flex-1 py-2 px-4 rounded-md font-semibold transition-colors ${method === "magic-link" ? "bg-blue-600 text-slate-950" : "text-slate-400 hover:text-slate-200"}`}>
          {magicLinkLabel}
        </button>
      </div>

      <GoogleOAuthButton isMounted={isMounted} className="mb-6" />

      {method === "password" && (
        <form onSubmit={handleSignIn}>
          {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm">{error}</div>}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">{emailLabel}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={emailPlaceholder} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-600 bg-slate-800 text-slate-50 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-200">{passwordLabel}</label>
                <Link href="/auth/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">{forgotPassword}</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={passwordPlaceholder} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-600 bg-slate-800 text-slate-50 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full mt-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-slate-950 font-semibold rounded-lg transition-colors">
            {isLoading ? signingInLabel : signInLabel}
          </button>
        </form>
      )}

      {method === "magic-link" && (
        <form onSubmit={handleMagicLink}>
          {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm">{error}</div>}

          <p className="text-sm text-slate-400 mb-4">{magicLinkDescription}</p>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">{emailLabel}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={emailPlaceholder} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-600 bg-slate-800 text-slate-50 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full mt-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-slate-950 font-semibold rounded-lg transition-colors">{isLoading ? sendingLabel : sendMagicLinkLabel}</button>
        </form>
      )}

      <p className="text-center text-slate-400 text-sm mt-6">
        {dontHaveAccount}{" "}
        <Link href="/auth/signup" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
          {signUpLabel}
        </Link>
      </p>
    </div>
  );
}
