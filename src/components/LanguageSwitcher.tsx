"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import i18n from "@/lib/i18n/i18n";
import {
  LANGUAGE_OPTIONS,
  LANGUAGE_STORAGE_KEY,
  getInitialLanguage,
  normalizeBrowserLanguage,
  resolveSupportedLanguage,
} from "@/lib/i18n/languages";

function getLanguageLabel(value: string): string {
  return LANGUAGE_OPTIONS.find((option) => option.value === value)?.label || value || "English";
}

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const [language, setLanguage] = useState(getInitialLanguage);
  const [statusMessage, setStatusMessage] = useState("");
  const [customLanguage, setCustomLanguage] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const clearStatusTimerRef = useRef<number | null>(null);

  const setTimedStatus = (message: string, autoClear = true) => {
    setStatusMessage(message);
    if (clearStatusTimerRef.current) {
      window.clearTimeout(clearStatusTimerRef.current);
      clearStatusTimerRef.current = null;
    }
    if (autoClear) {
      clearStatusTimerRef.current = window.setTimeout(() => {
        setStatusMessage("");
        clearStatusTimerRef.current = null;
      }, 2500);
    }
  };

  useEffect(() => {
    const syncFromStorage = () => {
      const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved && saved.trim()) {
        const next = resolveSupportedLanguage(saved.trim()) || "en";
        setLanguage(next);
        setIsCustomMode(false);
      }
    };

    const syncFromI18n = () => {
      const next = resolveSupportedLanguage(i18n.resolvedLanguage || i18n.language || "en") || "en";
      setLanguage(next);
      setIsCustomMode(false);
    };

    syncFromI18n();
    window.addEventListener("storage", syncFromStorage);
    i18n.on("languageChanged", syncFromI18n);

    return () => {
      window.removeEventListener("storage", syncFromStorage);
      i18n.off("languageChanged", syncFromI18n);
      if (clearStatusTimerRef.current) {
        window.clearTimeout(clearStatusTimerRef.current);
      }
    };
  }, []);

  const selectedValue = useMemo(
    () => (isCustomMode || !resolveSupportedLanguage(language) ? "custom" : language),
    [language, isCustomMode]
  );

  const applyLanguage = async (nextLanguage: string, options?: { clearStatus?: boolean }) => {
    const next = resolveSupportedLanguage(nextLanguage) || normalizeBrowserLanguage(nextLanguage);
    setLanguage(next);
    setIsCustomMode(false);
    if (options?.clearStatus !== false) {
      setStatusMessage("");
    }
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    document.cookie = `${LANGUAGE_STORAGE_KEY}=${encodeURIComponent(next)}; path=/; max-age=31536000; samesite=lax`;
    await i18n.changeLanguage(next);
    setTimedStatus(`Language set to ${getLanguageLabel(next)}.`);
  };

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value;
    if (next === "custom") {
      setIsCustomMode(true);
      setCustomLanguage("");
      setTimedStatus("Type a supported language below.", false);
      return;
    }

    void applyLanguage(next);
  };

  const handleApplyCustom = () => {
    const supported = resolveSupportedLanguage(customLanguage);
    if (!supported) {
      const fallback = normalizeBrowserLanguage(window.navigator.language);
      setIsCustomMode(false);
      void applyLanguage(fallback, { clearStatus: false });
      const typedLabel = customLanguage.trim() || "That language";
      setTimedStatus(`${typedLabel} is not supported yet. Showing ${getLanguageLabel(fallback)} instead.`);
      return;
    }

    void applyLanguage(supported);
    setCustomLanguage("");
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`} data-aura-translate-skip>
      <div className="flex items-center gap-2">
        <label htmlFor="site-language-switcher" className="sr-only">
          Language
        </label>
        <select
          id="site-language-switcher"
          value={selectedValue}
          onChange={handleChange}
          className="min-w-[132px] rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-100 outline-none transition hover:border-cyan-500 focus:border-cyan-500"
          aria-label="Site language"
          title={language}
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          <option value="custom">More languages...</option>
        </select>
      </div>
      {selectedValue === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customLanguage}
            onChange={(e) => setCustomLanguage(e.target.value)}
            placeholder="Type supported language..."
            className="w-full min-w-[180px] rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none transition hover:border-cyan-500 focus:border-cyan-500"
            aria-label="Custom language"
          />
          <button
            type="button"
            onClick={handleApplyCustom}
            className="rounded-md border border-cyan-500/60 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
          >
            Apply
          </button>
        </div>
      )}
      {statusMessage && (
        <div
          className="inline-flex max-w-[280px] items-center gap-2 rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2 text-[11px] leading-4 text-slate-300"
          aria-live="polite"
        >
          {statusMessage.toLowerCase().includes("language") ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-300" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-cyan-300" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
}
