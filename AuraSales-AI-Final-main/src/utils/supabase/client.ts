"use client";

import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

function cleanupStaleAuthSession() {
  if (typeof window === "undefined") return;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return;

    const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
    const storageKey = `sb-${projectRef}-auth-token`;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    const session = parsed?.currentSession ?? parsed;
    const refreshToken = session?.refresh_token;

    if (typeof refreshToken !== "string" || !refreshToken.trim()) {
      window.localStorage.removeItem(storageKey);
    }
  } catch {
    // If the stored session is malformed, remove it so Supabase does not try to refresh it.
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) return;

      const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
      const storageKey = `sb-${projectRef}-auth-token`;
      window.localStorage.removeItem(storageKey);
    } catch {
      // Ignore cleanup failures.
    }
  }
}

export function createClient() {
  if (!browserClient) {
    cleanupStaleAuthSession();
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return browserClient;
}
