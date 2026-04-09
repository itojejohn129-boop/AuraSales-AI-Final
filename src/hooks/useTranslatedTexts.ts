"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export function useTranslatedTexts(targetLanguage: string, texts: string[]) {
  const { t, i18n } = useTranslation();

  const normalizedTexts = useMemo(
    () => texts.map((text) => String(text ?? "")),
    [texts]
  );

  return useMemo(
    () =>
      normalizedTexts.map((text) =>
        t(text, {
          lng: targetLanguage || i18n.resolvedLanguage || i18n.language || "en",
          defaultValue: text,
        })
      ),
    [i18n.language, i18n.resolvedLanguage, normalizedTexts, targetLanguage, t]
  );
}
