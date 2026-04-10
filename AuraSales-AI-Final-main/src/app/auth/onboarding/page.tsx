"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { CheckCircle, Building2, TrendingUp } from "lucide-react";

export default function OnboardingPage() {
  const { user, isLoaded } = useSupabaseAuth();
  const router = useRouter();
  const [step, setStep] = useState<"welcome" | "company" | "complete">(
    "welcome"
  );
  const [companyName, setCompanyName] = useState("");
  const [salesVolume, setSalesVolume] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/auth/signin");
    }
  }, [isLoaded, user, router]);

  const handleCompleteProfile = async () => {
    if (!companyName || !salesVolume) {
      alert("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      // Update user metadata with company information via Supabase
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: {
          company_name: companyName,
          monthly_sales_volume: salesVolume,
          onboarding_completed: "true",
        },
      });

      if (error) throw error;

      setStep("complete");
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to complete profile");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-24">
      <div className="w-full max-w-lg">
        {step === "welcome" && (
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-slate-50 mb-2">
              Email Verified!
            </h1>
            <p className="text-slate-400 mb-8">
              Welcome to AuraSales, {user.user_metadata?.first_name || user.email?.split("@")[0]}
            </p>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold text-slate-50 mb-4">
                Complete Your Profile
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                To personalize your experience and set up your sales analytics, we need a bit more information:
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3 text-slate-300">
                  <Building2 size={16} className="text-blue-400 flex-shrink-0" />
                  Company details
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <TrendingUp size={16} className="text-blue-400 flex-shrink-0" />
                  Sales volume information
                </li>
              </ul>
            </div>

            <button
              onClick={() => setStep("company")}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-slate-950 font-semibold rounded-lg transition-colors"
            >
              Complete Profile
            </button>
          </div>
        )}

        {step === "company" && (
          <div>
            <h1 className="text-3xl font-bold text-slate-50 mb-2">
              Company Information
            </h1>
            <p className="text-slate-400 mb-8">
              Help us understand your business better
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Your company name"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-600 bg-slate-800 text-slate-50 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Monthly Sales Volume
                </label>
                <select
                  value={salesVolume}
                  onChange={(e) => setSalesVolume(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-600 bg-slate-800 text-slate-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none"
                >
                  <option value="">Select range</option>
                  <option value="0-50k">$0 - $50K</option>
                  <option value="50k-100k">$50K - $100K</option>
                  <option value="100k-500k">$100K - $500K</option>
                  <option value="500k-1m">$500K - $1M</option>
                  <option value="1m+">$1M+</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep("welcome")}
                className="flex-1 py-2.5 border border-slate-600 text-slate-50 font-semibold rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCompleteProfile}
                disabled={isLoading}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-slate-950 font-semibold rounded-lg transition-colors"
              >
                {isLoading ? "Saving..." : "Continue to Dashboard"}
              </button>
            </div>
          </div>
        )}

        {step === "complete" && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-50 mb-2">
              You're All Set!
            </h2>
            <p className="text-slate-400">
              Redirecting to your dashboard...
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
