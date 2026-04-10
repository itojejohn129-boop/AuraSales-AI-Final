"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

export function useSupabaseAuth() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!mounted) return;
        if (error) {
          throw error;
        }
        setUser(data.user ?? null);
        setIsLoaded(true);
      } catch {
        try {
          await supabase.auth.signOut({ scope: "local" });
        } catch {
          // Ignore cleanup failures.
        }
        if (!mounted) return;
        setUser(null);
        setIsLoaded(true);
      }
    }

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  return {
    user,
    isLoaded,
    isSignedIn: !!user,
  };
}
