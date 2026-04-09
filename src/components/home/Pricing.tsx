"use client";

import { useState } from "react";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";
import { useTranslatedTexts } from "@/hooks/useTranslatedTexts";
import { createClient } from "@/utils/supabase/client";

const plans = [
  {
    name: "Starter",
    price: 0,
    priceIdMonthly: "",
    priceIdYearly: "",
    credits: 1000,
    features: ["1,000 AI credits", "Basic analytics", "Community support"],
    highlight: false,
    badge: "Free Tier",
  },
  {
    name: "Pro",
    price: 30,
    yearly: 320,
    priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || "",
    priceIdYearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY || "",
    credits: "Unlimited",
    features: ["Unlimited AI credits", "Advanced analytics", "Priority support"],
    highlight: true,
    badge: "Best Value",
  },
  {
    name: "Enterprise",
    price: "Contact",
    priceIdMonthly: "",
    priceIdYearly: "",
    credits: "Custom",
    features: ["Custom AI credits", "Custom analytics", "Dedicated support"],
    highlight: false,
    badge: "Contact Us",
  },
];

export default function Pricing() {
  const language = useSiteLanguage();
  const translated = useTranslatedTexts(language, [
    "Pricing",
    "Monthly",
    "Yearly",
    "Free Tier",
    "Best Value",
    "Contact Us",
    "Starter",
    "Pro",
    "Enterprise",
    "1,000 credits included",
    "Basic analytics",
    "Community support",
    "Unlimited credits",
    "Advanced analytics",
    "Priority support",
    "Custom credits & features",
    "Custom analytics",
    "Dedicated support",
    "Get Started",
    "Processing...",
    "Save $40",
    "($26.66/mo billed yearly)",
    "Contact Sales",
    "Redirecting...",
  ]);
  const [
    heading,
    monthlyLabel,
    yearlyLabel,
    freeTierLabel,
    bestValueLabel,
    contactUsLabel,
    starterLabel,
    proLabel,
    enterpriseLabel,
    starterCredits,
    starterBasic,
    starterCommunity,
    unlimitedCredits,
    proAdvanced,
    proPriority,
    enterpriseCredits,
    enterpriseAnalytics,
    enterpriseSupport,
    getStartedLabel,
    processingLabel,
    saveLabel,
    yearlyBilledLabel,
    contactSalesLabel,
    redirectingLabel,
  ] = translated;

  const [yearly, setYearly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleCheckout = async (priceId: string, planName: string, amount: number | string) => {
    if (isLoading) return;

    setCheckoutError(null);
    setLoadingPlan(planName);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        window.location.href = "/auth/signin";
        return;
      }

      if (amount === 0 || priceId === "free") {
        const initRes = await fetch("/api/credits/init", { method: "POST" });
        if (!initRes.ok) {
          if (initRes.status === 401) {
            window.location.href = "/auth/signin";
            return;
          }
          const initErr = await initRes.json().catch(() => ({}));
          throw new Error(initErr?.error || "Unable to initialize free credits");
        }

        window.location.href = "/dashboard";
        return;
      }

      if (!priceId) {
        throw new Error("Stripe price ID is not configured for this plan");
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/auth/signin";
          return;
        }
        throw new Error(data?.error || "Failed to start checkout");
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error("Checkout URL missing from response");
    } catch (error: unknown) {
      setCheckoutError(error instanceof Error ? error.message : "Unable to process checkout");
      setIsLoading(false);
      setLoadingPlan(null);
    }
  };

  return (
    <section id="pricing" className="py-20 bg-slate-950">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-50 text-center mb-10">{heading}</h2>
        <div className="flex justify-center mb-8">
          <button
            className={`px-6 py-2 rounded-l-lg font-semibold text-sm ${!yearly ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"}`}
            onClick={() => setYearly(false)}
          >
            {monthlyLabel}
          </button>
          <button
            className={`px-6 py-2 rounded-r-lg font-semibold text-sm ${yearly ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"}`}
            onClick={() => setYearly(true)}
          >
            {yearlyLabel}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center text-center shadow-lg">
            <span className="mb-2 text-xs font-semibold text-cyan-400">{freeTierLabel}</span>
            <h3 className="font-bold text-xl text-slate-100 mb-2">{starterLabel}</h3>
            <div className="text-3xl font-bold text-slate-50 mb-2">$0</div>
            <div className="text-sm text-slate-400 mb-4">{starterCredits}</div>
            <ul className="mb-6 text-slate-300 text-sm space-y-1">
              <li>{starterBasic}</li>
              <li>{starterCommunity}</li>
            </ul>
            <button
              onClick={() => handleCheckout("free", "Starter", 0)}
              disabled={isLoading}
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold disabled:opacity-60"
            >
              {isLoading && loadingPlan === "Starter" ? processingLabel : getStartedLabel}
            </button>
          </div>
          <div className="bg-slate-900 border-2 border-gradient-to-r from-cyan-400 to-blue-600 rounded-2xl p-8 flex flex-col items-center text-center shadow-lg relative">
            <span className="mb-2 text-xs font-semibold text-cyan-400">{bestValueLabel}</span>
            <h3 className="font-bold text-xl text-slate-100 mb-2">{proLabel}</h3>
            <div className="text-3xl font-bold text-slate-50 mb-2">
              {yearly ? "$320" : "$30"}
              <span className="text-base text-slate-400">{yearly ? " /year" : " /month"}</span>
            </div>
            <div className="text-sm text-slate-400 mb-2">{yearly ? saveLabel : ""}</div>
            <div className="text-sm text-slate-400 mb-4">{yearly ? yearlyBilledLabel : ""}</div>
            <ul className="mb-6 text-slate-300 text-sm space-y-1">
              <li>{unlimitedCredits}</li>
              <li>{proAdvanced}</li>
              <li>{proPriority}</li>
            </ul>
            <button
              onClick={() =>
                handleCheckout(
                  yearly ? plans[1].priceIdYearly : plans[1].priceIdMonthly,
                  "Pro",
                  yearly ? plans[1].yearly || 0 : plans[1].price
                )
              }
              disabled={isLoading}
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold disabled:opacity-60"
            >
              {isLoading && loadingPlan === "Pro" ? processingLabel : getStartedLabel}
            </button>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center text-center shadow-lg">
            <span className="mb-2 text-xs font-semibold text-cyan-400">{contactUsLabel}</span>
            <h3 className="font-bold text-xl text-slate-100 mb-2">{enterpriseLabel}</h3>
            <div className="text-3xl font-bold text-slate-50 mb-2">Custom</div>
            <div className="text-sm text-slate-400 mb-4">{enterpriseCredits}</div>
            <ul className="mb-6 text-slate-300 text-sm space-y-1">
              <li>{enterpriseAnalytics}</li>
              <li>{enterpriseSupport}</li>
            </ul>
            <button
              onClick={() => {
                window.location.href = "mailto:salesanalyzer500@gmail.com";
              }}
              disabled={isLoading}
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold disabled:opacity-60"
            >
              {isLoading && loadingPlan === "Enterprise" ? redirectingLabel : contactSalesLabel}
            </button>
          </div>
        </div>
        {checkoutError && (
          <div className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300 text-center">
            {checkoutError}
          </div>
        )}
      </div>

    </section>
  );
}
