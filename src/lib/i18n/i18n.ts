import i18n from "i18next";
import type { InitOptions } from "i18next";
import { initReactI18next } from "react-i18next";
import { getInitialLanguage, LANGUAGE_OPTIONS } from "./languages";
import { translationResources } from "./resources";

const supportedLngs = LANGUAGE_OPTIONS.map((option) => option.value);

if (!i18n.isInitialized) {
  const initOptions = {
    resources: translationResources,
    fallbackLng: "en",
    supportedLngs,
    load: "currentOnly",
    interpolation: {
      escapeValue: false,
    },
    lng: getInitialLanguage(),
    react: {
      useSuspense: false,
    },
  } satisfies InitOptions;

  i18n.use(initReactI18next).init(initOptions);
}

export { i18n };
export default i18n;
