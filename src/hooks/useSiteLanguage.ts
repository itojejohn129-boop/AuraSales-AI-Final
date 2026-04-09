"use client";

import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { normalizeBrowserLanguage, resolveSupportedLanguage } from "@/lib/i18n/languages";

export function useSiteLanguage() {
  const { i18n } = useTranslation();

  return useSyncExternalStore(
    (onStoreChange) => {
      i18n.on("languageChanged", onStoreChange);
      i18n.on("loaded", onStoreChange);
      return () => {
        i18n.off("languageChanged", onStoreChange);
        i18n.off("loaded", onStoreChange);
      };
    },
    () => {
      const current = i18n.resolvedLanguage || i18n.language || "en";
      return resolveSupportedLanguage(current) || normalizeBrowserLanguage(current);
    },
    () => "en"
  );
}
