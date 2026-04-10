"use client";

import { useEffect } from "react";
import { testVoiceCapabilities } from "@/lib/testAuraCapabilities";

/**
 * Component that runs AURA capability tests on page load
 * Results are logged to browser console (F12)
 */
export function AuraTestRunner() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    // Run tests on component mount
    try {
      testVoiceCapabilities();
    } catch (error: any) {
      console.error("Error running AURA tests:", error?.message);
    }
  }, []);

  return null; // This component doesn't render anything visible
}
