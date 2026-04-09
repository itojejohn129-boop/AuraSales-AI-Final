export const LANGUAGE_STORAGE_KEY = "aurasales.dashboard.language";

export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "pt", label: "Portuguese" },
  { value: "ar", label: "Arabic" },
  { value: "hi", label: "Hindi" },
  { value: "zh", label: "Chinese" },
  { value: "de", label: "German" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "ru", label: "Russian" },
  { value: "it", label: "Italian" },
  { value: "tr", label: "Turkish" },
  { value: "nl", label: "Dutch" },
  { value: "sw", label: "Swahili" },
  { value: "vi", label: "Vietnamese" },
] as const;

export type SupportedLanguageCode = (typeof LANGUAGE_OPTIONS)[number]["value"];

export const LANGUAGE_ALIASES: Record<string, SupportedLanguageCode> = {
  english: "en",
  french: "fr",
  spanish: "es",
  portuguese: "pt",
  arabic: "ar",
  hindi: "hi",
  chinese: "zh",
  "chinese (simplified)": "zh",
  german: "de",
  japanese: "ja",
  korean: "ko",
  russian: "ru",
  italian: "it",
  turkish: "tr",
  dutch: "nl",
  swahili: "sw",
  vietnamese: "vi",
};

const RTL_LANGUAGES = new Set<SupportedLanguageCode>(["ar"]);

export function normalizeBrowserLanguage(lang?: string | null): SupportedLanguageCode {
  const value = String(lang || "").toLowerCase();
  if (value.startsWith("fr")) return "fr";
  if (value.startsWith("es")) return "es";
  if (value.startsWith("pt")) return "pt";
  if (value.startsWith("ar")) return "ar";
  if (value.startsWith("hi")) return "hi";
  if (value.startsWith("zh")) return "zh";
  if (value.startsWith("de")) return "de";
  if (value.startsWith("ja")) return "ja";
  if (value.startsWith("ko")) return "ko";
  if (value.startsWith("ru")) return "ru";
  if (value.startsWith("it")) return "it";
  if (value.startsWith("tr")) return "tr";
  if (value.startsWith("nl")) return "nl";
  if (value.startsWith("sw")) return "sw";
  if (value.startsWith("vi")) return "vi";
  return "en";
}

export function resolveSupportedLanguage(input: string): SupportedLanguageCode | null {
  const normalized = String(input || "").trim().toLowerCase();
  if (!normalized) return null;

  if (LANGUAGE_OPTIONS.some((option) => option.value === normalized)) {
    return normalized as SupportedLanguageCode;
  }

  if (LANGUAGE_ALIASES[normalized]) {
    return LANGUAGE_ALIASES[normalized];
  }

  const shortCode = normalized.split("-")[0];
  if (LANGUAGE_OPTIONS.some((option) => option.value === shortCode)) {
    return shortCode as SupportedLanguageCode;
  }

  return null;
}

export function isRightToLeftLanguage(language?: string | null): boolean {
  return RTL_LANGUAGES.has(resolveSupportedLanguage(language || "en") || "en");
}

export function getInitialLanguage(): SupportedLanguageCode {
  return "en";
}
