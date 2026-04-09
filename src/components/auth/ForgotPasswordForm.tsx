"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Mail, ArrowRight } from "lucide-react";
import OTPVerification from "./OTPVerification";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";
import { useTranslatedTexts } from "@/hooks/useTranslatedTexts";

type ResetStep = "email" | "check-email";

export function ForgotPasswordForm() {
  const [step, setStep] = useState<ResetStep | "verify">("email");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();
  const language = useSiteLanguage();
  const translated = useTranslatedTexts(language, [
    "Reset Your Password",
    "Enter your email and we'll send you a link to reset it",
    "Email Address",
    "Send Reset Link",
    "Sending...",
    "Remember your password?",
    "Sign in",
    "Please enter your email address",
    "Failed to send reset link. Please try again.",
    "you@company.com",
  ]);
  const [
    heading,
    description,
    emailLabel,
    sendResetLink,
    sending,
    remember,
    signInLabel,
    enterEmailError,
    failedResetLink,
    emailPlaceholder,
  ] = translated;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/signin`,
      });

      if (error) throw error;

      setStep("verify");
    } catch (err: any) {
      setError(err?.message || failedResetLink);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {step === "email" && (
        <>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-50 mb-2">{heading}</h1>
            <p className="text-slate-400">{description}</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">{emailLabel}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={emailPlaceholder}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-600 bg-slate-800 text-slate-50 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-slate-950 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? sending : sendResetLink}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            {remember}{" "}
            <Link
              href="/auth/signin"
              className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
            >
              {signInLabel}
            </Link>
          </p>
        </>
      )}
      {step === "verify" && (
        <OTPVerification
          email={email}
          type="recovery"
          onSuccess={() => {
            window.location.href = "/auth/signin";
          }}
          onCancel={() => setStep("email")}
        />
      )}
    </div>
  );
}
