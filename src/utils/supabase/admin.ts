"use server";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Create a server-side admin client using the Service Role Key.
// WARNING: This must never be used in client-side bundles.
export async function createAdminClient(): Promise<SupabaseClient> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) is not set");
  }
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set (required for admin client)");
  }

  // Return the admin client; function is async to satisfy `use server` export rules.
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

export default createAdminClient;
