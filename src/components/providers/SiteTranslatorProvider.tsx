"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n/i18n";
import { isRightToLeftLanguage, LANGUAGE_STORAGE_KEY, resolveSupportedLanguage } from "@/lib/i18n/languages";

export function SiteTranslatorProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const syncLanguage = () => {
      const saved = typeof window === "undefined" ? null : window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      const next = resolveSupportedLanguage(saved?.trim() || "") || "en";
      void i18n.changeLanguage(next);
    };

    const updateDocumentLanguage = (nextLanguage: string) => {
      if (typeof document === "undefined") return;
      document.documentElement.lang = String(nextLanguage || "en");
      document.documentElement.dir = isRightToLeftLanguage(nextLanguage) ? "rtl" : "ltr";
    };

    syncLanguage();
    updateDocumentLanguage(i18n.resolvedLanguage || i18n.language || "en");

    const onStorage = () => syncLanguage();
    const onLanguageChanged = (nextLanguage: string) => updateDocumentLanguage(nextLanguage);
    window.addEventListener("storage", onStorage);
    i18n.on("languageChanged", onLanguageChanged);
    return () => {
      window.removeEventListener("storage", onStorage);
      i18n.off("languageChanged", onLanguageChanged);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
