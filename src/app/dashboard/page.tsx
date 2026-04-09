import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { consumeLoginCreditIfNeeded } from "@/lib/server/credits";

async function validateAuth() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: Parameters<typeof cookieStore.set>[2];
          }>
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch (error) {
            console.error("Error setting cookies:", error);
          }
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/signin");
  }

  return user;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-slate-800 rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-80 bg-slate-800 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

interface DashboardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  await searchParams; // preserve current signature without enabling demo bypass
  const isDemo = false;
  const user = await validateAuth();
  const loginCreditCheck = await consumeLoginCreditIfNeeded(
    user.id,
    user.email,
    user.last_sign_in_at
  );
  if (!loginCreditCheck.allowed && loginCreditCheck.summary.plan === "free") {
    redirect("/pricing?payment=required");
  }

  if (loginCreditCheck.summary.exceeded && loginCreditCheck.summary.plan === "free") {
    redirect("/pricing?payment=required");
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-50 mb-2">
            {isDemo ? "Live Demo - Sales Dashboard" : "Sales Dashboard"}
          </h1>
          <p className="text-slate-400">
            {isDemo 
              ? "Experience AuraSales AI with sample data. All features are fully interactive."
              : `AI-powered analytics and forecasting for ${user?.user_metadata?.company_name || "your business"}`
            }
          </p>
          {isDemo && (
            <p className="text-xs text-cyan-400 mt-2">
              This is a demonstration environment with sample sales data. All visualizations, forecasts, and simulators are fully functional.
            </p>
          )}
        </div>

        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent isDemo={isDemo} />
        </Suspense>
      </div>
    </main>
  );
}
