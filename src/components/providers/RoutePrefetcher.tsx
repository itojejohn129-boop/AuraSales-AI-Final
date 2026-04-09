"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ROUTES_TO_PREFETCH = [
  "/dashboard",
  "/auth/signin",
  "/auth/signup",
  "/auth/forgot-password",
  "/pricing",
  "/privacy-policy",
  "/terms-of-service",
];

export function RoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const prefetchRoutes = () => {
      if (cancelled) return;

      ROUTES_TO_PREFETCH.forEach((route) => {
        try {
          router.prefetch(route);
        } catch {
          // Prefetch is a best-effort optimization.
        }
      });
    };

    const timer = window.setTimeout(prefetchRoutes, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [router]);

  return null;
}
