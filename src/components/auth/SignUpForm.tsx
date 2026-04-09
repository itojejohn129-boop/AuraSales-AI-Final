"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Building2, TrendingUp } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import OTPVerification from "./OTPVerification";
import { GoogleOAuthButton } from "./GoogleOAuthButton";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";
import { useTranslatedTexts } from "@/hooks/useTranslatedTexts";

export function SignUpForm() {
  const [step, setStep] = useState<"credentials" | "company" | "verify" | "complete">("credentials");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const language = useSiteLanguage();
  const translated = useTranslatedTexts(language, [
    "Create your account",
    "Join thousands of sales teams using AuraSales",
    "Please fill in all fields",
    "Passwords do not match",
    "Password must be at least 8 characters",
    "Email Address",
    "Password",
    "Confirm Password",
    "Continue",
    "OR",
    "Tell us about your business",
    "This helps us personalize your experience",
    "Company Name",
    "Monthly Sales Volume",
    "Back",
    "Create Account",
    "Creating...",
    "Account Created!",
    "Welcome to AuraSales,",
    "Redirecting to your dashboard...",
    "Already have an account?",
    "Sign in",
    "Select range",
    "Your company name",
    "you@company.com",
    "Min. 8 characters",
    "Confirm your password",
    "Please fill in all fields",
  ]);
  const [
    createAccountTitle,
    createAccountSubtitle,
    fillAllFieldsError,
    passwordsMismatch,
    passwordLengthError,
    emailLabel,
    passwordLabel,
    confirmPasswordLabel,
    continueLabel,
    orLabel,
    businessTitle,
    businessSubtitle,
    companyLabel,
    monthlySalesLabel,
    backLabel,
    createAccountLabel,
    creatingLabel,
    accountCreatedLabel,
    welcomeLabel,
    redirectingLabel,
    alreadyHaveAccountLabel,
    signInLabel,
    selectRangeLabel,
    companyPlaceholder,
    emailPlaceholder,
    minPasswordPlaceholder,
    confirmPasswordPlaceholder,
  ] = translated;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (step === "complete") {
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step, router]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    monthlySalesVolume: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMounted) return;
    setError("");

    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError(fillAllFieldsError);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(passwordsMismatch);
      return;
    }

    if (formData.password.length < 8) {
      setError(passwordLengthError);
      return;
    }

    setStep("company");
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMounted) return;
    setError("");
    setIsLoading(true);

    if (!formData.companyName || !formData.monthlySalesVolume) {
      setError(fillAllFieldsError);
      setIsLoading(false);
      return;
    }

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const redirectUrl = `${origin}/auth/onboarding`;

      try {
        localStorage.setItem(
          "signup:company_info",
          JSON.stringify({ companyName: formData.companyName, monthlySalesVolume: formData.monthlySalesVolume })
        );
      } catch {
        // ignore storage errors
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            company_name: formData.companyName,
            monthly_sales_volume: formData.monthlySalesVolume,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setPendingEmail(formData.email);
        setStep("verify");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center gap-4 mb-8">
        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-colors ${step === "credentials" || step === "company" || step === "complete" ? "bg-blue-600 text-slate-950" : "bg-slate-700 text-slate-400"}`}>1</div>
        <div className={`flex-1 h-1 rounded-full transition-colors ${step === "company" || step === "complete" ? "bg-blue-600" : "bg-slate-700"}`}></div>
        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-colors ${step === "company" || step === "complete" ? "bg-blue-600 text-slate-950" : "bg-slate-700 text-slate-400"}`}>2</div>
        <div className={`flex-1 h-1 rounded-full transition-colors ${step === "complete" ? "bg-blue-600" : "bg-slate-700"}`}></div>
        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-colors ${step === "complete" ? "bg-blue-600 text-slate-950" : "bg-slate-700 text-slate-400"}`}>3</div>
      </div>

      {step === "credentials" && (
        <form onSubmit={handleCredentialsSubmit}>
          <h2 className="text-2xl font-bold text-slate-50 mb-2">{createAccountTitle}</h2>
          <p className="text-slate-400 mb-6 text-sm">{createAccountSubtitle}</p>

          {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm">{error}</div>}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">{emailLabel}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder={emailPlaceholder} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-600 bg-slate-800 text-slate-50 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">{passwordLabel}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder={minPasswordPlaceholder} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-600 bg-slate-800 text-slate-50 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">{confirmPasswordLabel}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} placeholder={confirmPasswordPlaceholder} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-600 bg-slate-800 text-slate-50 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" />
              </div>
            </div>
          </div>

          <button type="submit" className="w-full mt-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-slate-950 font-semibold rounded-lg transition-colors">
            {continueLabel}
          </button>

          <div className="flex items-center gap-3 mt-6 mb-4">
            <div className="flex-1 h-px bg-slate-700"></div>
            <span className="text-xs text-slate-500">{orLabel}</span>
            <div className="flex-1 h-px bg-slate-700"></div>
          </div>

          <GoogleOAuthButton isMounted={isMounted} />
        </form>
      )}

      {step === "company" && (
        <form onSubmit={handleCompanySubmit}>
          <h2 className="text-2xl font-bold text-slate-50 mb-2">{businessTitle}</h2>
          <p className="text-slate-400 mb-6 text-sm">{businessSubtitle}</p>

          {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm">{error}</div>}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">{companyLabel}</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} placeholder={companyPlaceholder} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-600 bg-slate-800 text-slate-50 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">{monthlySalesLabel}</label>
              <div className="relative">
                <TrendingUp className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <select name="monthlySalesVolume" value={formData.monthlySalesVolume} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-600 bg-slate-800 text-slate-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none">
                  <option value="">{selectRangeLabel}</option>
                  <option value="0-50k">$0 - $50K</option>
                  <option value="50k-100k">$50K - $100K</option>
                  <option value="100k-500k">$100K - $500K</option>
                  <option value="500k-1m">$500K - $1M</option>
                  <option value="1m+">$1M+</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setStep("credentials")}
              className="flex-1 py-2.5 border border-slate-600 text-slate-50 font-semibold rounded-lg hover:bg-slate-800/50 transition-colors"
            >
              {backLabel}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-slate-950 font-semibold rounded-lg transition-colors"
            >
              {isLoading ? creatingLabel : createAccountLabel}
            </button>
          </div>
        </form>
      )}

      {step === "complete" && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-2xl">✓</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-50 mb-2">{accountCreatedLabel}</h2>
          <p className="text-slate-400 mb-2">
            {welcomeLabel} {formData.email.split("@")[0]}
          </p>
          <p className="text-sm text-slate-500">{redirectingLabel}</p>
        </div>
      )}

      {step === "verify" && pendingEmail && (
        <div className="pt-4">
          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
          {/* @ts-ignore */}
          <OTPVerification
            email={pendingEmail}
            type="signup"
            onSuccess={() => setStep("complete")}
            onCancel={() => setStep("company")}
          />
        </div>
      )}

      {step !== "complete" && (
        <p className="text-center text-slate-400 text-sm mt-6">
          {alreadyHaveAccountLabel}{" "}
          <Link href="/auth/signin" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
            {signInLabel}
          </Link>
        </p>
      )}
    </div>
  );
}
