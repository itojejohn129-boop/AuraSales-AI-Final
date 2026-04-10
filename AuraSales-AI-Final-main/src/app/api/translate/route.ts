import { NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";

const MODEL_ID = "facebook/nllb-200-distilled-600M";
const MAX_ITEMS = 120;
const MAX_TEXT_LENGTH = 800;
const TRANSLATION_BATCH_SIZE = 6;
type TranslateBody = {
  targetLanguage?: string;
  texts?: unknown;
};

const TARGET_LANGUAGE_CODES: Record<string, string> = {
  en: "eng_Latn",
  english: "eng_Latn",
  fr: "fra_Latn",
  french: "fra_Latn",
  es: "spa_Latn",
  spanish: "spa_Latn",
  pt: "por_Latn",
  portuguese: "por_Latn",
  ar: "arb_Arab",
  arabic: "arb_Arab",
  hi: "hin_Deva",
  hindi: "hin_Deva",
  zh: "zho_Hans",
  chinese: "zho_Hans",
  "chinese (simplified)": "zho_Hans",
  de: "deu_Latn",
  german: "deu_Latn",
  ja: "jpn_Jpan",
  japanese: "jpn_Jpan",
  ko: "kor_Hang",
  korean: "kor_Hang",
  ru: "rus_Cyrl",
  russian: "rus_Cyrl",
  it: "ita_Latn",
  italian: "ita_Latn",
  tr: "tur_Latn",
  turkish: "tur_Latn",
  nl: "nld_Latn",
  dutch: "nld_Latn",
  sw: "swh_Latn",
  swahili: "swh_Latn",
  vi: "vie_Latn",
  vietnamese: "vie_Latn",
};

function clampTexts(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((v) => String(v ?? "").trim())
    .filter((v) => v.length > 0)
    .slice(0, MAX_ITEMS)
    .map((v) => (v.length > MAX_TEXT_LENGTH ? v.slice(0, MAX_TEXT_LENGTH) : v));
}

function resolveTargetCode(language: string): string {
  const normalized = String(language || "").trim().toLowerCase();
  return TARGET_LANGUAGE_CODES[normalized] || TARGET_LANGUAGE_CODES[normalized.split("-")[0]] || "eng_Latn";
}

function splitIntoBatches<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += batchSize) {
    batches.push(items.slice(index, index + batchSize));
  }
  return batches;
}

async function translateOne(
  hfApiKey: string,
  text: string,
  targetCode: string,
  signal: AbortSignal
): Promise<string> {
  const client = new HfInference(hfApiKey);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const result = await client.translation(
        {
          model: MODEL_ID,
          provider: "hf-inference",
          inputs: text,
          parameters: {
            src_lang: "eng_Latn",
            tgt_lang: targetCode,
            clean_up_tokenization_spaces: true,
            truncation: "only_first",
          },
        },
        { retry_on_error: true, signal }
      );

      const translated = String(result?.translation_text || "").trim();
      if (translated) {
        return translated;
      }
    } catch (error: any) {
      if (error?.name === "AbortError" || String(error?.message || "").toLowerCase().includes("aborted")) {
        return text;
      }
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  return text;
}

export async function POST(req: Request) {
  try {
    const { targetLanguage = "English", texts = [] } = (await req.json()) as TranslateBody;
    const sourceTexts = clampTexts(texts);

    if (!sourceTexts.length) {
      return NextResponse.json({ translations: [] });
    }

    const hfApiKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfApiKey) {
      return NextResponse.json({ translations: sourceTexts });
    }

    const targetCode = resolveTargetCode(targetLanguage);
    if (targetCode === "eng_Latn") {
      return NextResponse.json({ translations: sourceTexts });
    }

    const translated: string[] = [];
    const batches = splitIntoBatches(sourceTexts, TRANSLATION_BATCH_SIZE);

    for (const batch of batches) {
      const results = await Promise.all(
        batch.map((text) => translateOne(hfApiKey, text, targetCode, req.signal))
      );
      translated.push(...results);
    }

    return NextResponse.json({ translations: translated });
  } catch (error: any) {
    if (error?.name === "AbortError" || String(error?.message || "").toLowerCase().includes("aborted")) {
      return NextResponse.json({ translations: [] }, { status: 200 });
    }
    return NextResponse.json(
      { error: error?.message || "Translation failed" },
      { status: 500 }
    );
  }
}
