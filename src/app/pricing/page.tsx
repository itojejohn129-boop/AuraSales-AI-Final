import Link from "next/link";
import Pricing from "@/components/home/Pricing";

interface PricingPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const params = await searchParams;
  const payment = params.payment;
  const paymentState = Array.isArray(payment) ? payment[0] : payment;

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <Link href="/" className="text-cyan-400 hover:text-cyan-300 transition-colors">
            Back to Home
          </Link>
        </div>

        {paymentState === "cancelled" && (
          <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200">
            Payment was cancelled. You can retry checkout any time.
          </div>
        )}

        {paymentState === "required" && (
          <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-200">
            You have reached your 1,000 free credits. Upgrade to continue using AI features.
          </div>
        )}

        <Pricing />
      </div>
    </main>
  );
}
