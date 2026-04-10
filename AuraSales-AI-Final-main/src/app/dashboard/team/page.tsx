"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";

export default function TeamPage() {
  const { isLoaded, user } = useSupabaseAuth();
  const router = useRouter();
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/auth/signin");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded || !user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-slate-700 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Users className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold text-slate-50">Team</h1>
            <p className="text-slate-400">Manage team members and permissions</p>
          </div>
        </div>

        {/* Placeholder content */}
        <div className="grid gap-6">
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
            <h2 className="text-lg font-semibold text-slate-50 mb-2">
              Coming Soon
            </h2>
            <p className="text-slate-400">
              Team management features are being developed. You'll soon be able to:
            </p>
            <ul className="mt-4 space-y-2 text-slate-400 text-sm list-disc list-inside">
              <li>Invite team members via email</li>
              <li>Manage user roles and permissions</li>
              <li>Set up team workspaces</li>
              <li>Track activity and collaboration</li>
              <li>Configure SSO (Single Sign-On)</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
