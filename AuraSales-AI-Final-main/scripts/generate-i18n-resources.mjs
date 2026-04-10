import fs from "fs";
import path from "path";
import ts from "typescript";
import { GoogleGenerativeAI } from "@google/generative-ai";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");
const OUTPUT_FILE = path.join(SRC_DIR, "lib", "i18n", "resources.ts");

const LANGUAGE_ORDER = ["en", "fr", "es", "pt", "ar", "hi", "zh", "de", "ja", "ko", "ru", "it", "tr", "nl", "sw", "vi"];
const LANGUAGE_NAMES = {
  fr: "French",
  es: "Spanish",
  pt: "Portuguese",
  ar: "Arabic",
  hi: "Hindi",
  zh: "Simplified Chinese",
  de: "German",
  ja: "Japanese",
  ko: "Korean",
  ru: "Russian",
  it: "Italian",
  tr: "Turkish",
  nl: "Dutch",
  sw: "Swahili",
  vi: "Vietnamese",
};
const EXTRA_STRINGS = [
  "More languages...",
  "Type supported language...",
  "Apply",
  "Language",
  "Site language",
  "Language set to",
  "Type a supported language below.",
  "That language is not supported yet. Showing",
  "instead.",
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function extractStringsFromFiles(files) {
  const texts = new Set(EXTRA_STRINGS);
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    const sf = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    function visit(node) {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "useTranslatedTexts"
      ) {
        const [, textsArg] = node.arguments;
        if (textsArg && ts.isArrayLiteralExpression(textsArg)) {
          for (const element of textsArg.elements) {
            if (ts.isStringLiteral(element) || ts.isNoSubstitutionTemplateLiteral(element)) {
              const text = element.text.trim();
              if (text) texts.add(text);
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    }

    visit(sf);
  }

  return Array.from(texts);
}

function escapeString(value) {
  return JSON.stringify(String(value ?? ""));
}

function generateTypeScript(resources) {
  const entries = LANGUAGE_ORDER.map((language) => {
    const translations = resources[language] || {};
    const translationLines = Object.entries(translations)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([source, target]) => `    ${escapeString(source)}: ${escapeString(target)},`)
      .join("\n");
    return `  ${language}: { translation: {\n${translationLines}\n  } },`;
  }).join("\n");

  return `import type { SupportedLanguageCode } from "./languages";\n\n` +
    `type TranslationMap = Record<string, string>;\n\n` +
    `export const translationResources: Record<SupportedLanguageCode, { translation: TranslationMap }> = {\n${entries}\n};\n`;
}

function parseJsonArray(text) {
  const cleaned = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`Expected JSON array, got: ${cleaned.slice(0, 200)}`);
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function translateWithGemini(model, languageName, texts) {
  const prompt = [
    `Translate the following English UI strings into ${languageName}.`,
    "Return only a valid JSON array of translated strings in the same order as the input.",
    "Keep the array length exactly the same.",
    "Preserve placeholders, URLs, email addresses, punctuation, and line breaks as much as possible.",
    "Do not add any explanation or markdown.",
    "",
    "Strings:",
    JSON.stringify(texts, null, 2),
  ].join("\n");

  const result = await model.generateContent(prompt);
  const output = result.response.text();
  const parsed = parseJsonArray(output);
  if (!Array.isArray(parsed) || parsed.length !== texts.length) {
    throw new Error(`Expected ${texts.length} translations, got ${Array.isArray(parsed) ? parsed.length : "invalid"}`);
  }
  return parsed.map((value, index) => String(value ?? "").trim() || texts[index]);
}

async function translateLanguage(model, language, texts) {
  if (language === "en") {
    return new Map(texts.map((text) => [text, text]));
  }

  try {
    const translated = await translateWithGemini(model, LANGUAGE_NAMES[language], texts);
    return new Map(texts.map((text, index) => [text, translated[index] || text]));
  } catch (error) {
    if (texts.length <= 16) {
      throw error;
    }

    const midpoint = Math.ceil(texts.length / 2);
    const left = await translateLanguage(model, language, texts.slice(0, midpoint));
    const right = await translateLanguage(model, language, texts.slice(midpoint));
    return new Map([...left.entries(), ...right.entries()]);
  }
}

async function main() {
  const envFile = path.join(ROOT, ".env.local");
  const envText = fs.readFileSync(envFile, "utf8");
  const keyLine = envText.split(/\r?\n/).find((entry) => entry.startsWith("GOOGLE_GENERATIVE_AI_API_KEY="));
  const apiKey = keyLine?.split("=")[1]?.trim();
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not found in .env.local");
  }

  const files = walk(SRC_DIR);
  const texts = extractStringsFromFiles(files);
  console.log(`[i18n] collected ${texts.length} strings`);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
    },
  });

  const translationsByLanguage = {};
  for (const language of LANGUAGE_ORDER) {
    const translated = await translateLanguage(model, language, texts);
    translationsByLanguage[language] = Object.fromEntries(translated.entries());
    console.log(`[i18n] generated ${language}`);
    fs.writeFileSync(OUTPUT_FILE, generateTypeScript(translationsByLanguage), "utf8");
    await sleep(750);
  }

  fs.writeFileSync(OUTPUT_FILE, generateTypeScript(translationsByLanguage), "utf8");
  console.log(`[i18n] wrote ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error("[i18n] generation failed:", error);
  process.exit(1);
});
