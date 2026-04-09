// cspell:disable
import { NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";
import { createClient as createSupabaseServerClient } from "@/utils/supabase/server";
import { summarizeCSVData } from "@/lib/csvSummarizer";
import createAdminClient from "@/utils/supabase/admin";
import { consumeAiCredit } from "@/lib/server/credits";
import { getLanguageDisplayName } from "@/lib/i18n/dashboardCopy";
import { buildDashboardSalesRefocusMessage, isDashboardSalesIntent } from "@/lib/chatIntent";

// Model configuration for free tier stability
const MODEL_ID = "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B"; // Optimized for free tier
const MAX_PROMPT_CHARS = 5000; // Safety limit for API

type DashboardRecord = Record<string, unknown>;

type ChatCompletionMessage = {
  content?: string | null;
  reasoning_content?: string | null;
};

type ChatCompletionChoice = {
  message?: ChatCompletionMessage;
};

type ChatCompletionResponse =
  | {
      choices?: ChatCompletionChoice[];
      generated_text?: string;
    }
  | Array<{
      generated_text?: string;
    }>;

type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

type TranslationResponseBody = {
  translations?: unknown;
};

const CJK_LANGUAGE_ALIASES = new Set([
  "zh",
  "chinese",
  "chinese (simplified)",
  "chinese (traditional)",
  "ja",
  "japanese",
  "ko",
  "korean",
]);

function formatCurrency(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function isCjkLanguage(language: string): boolean {
  const normalized = String(language || "").trim().toLowerCase();
  const primary = normalized.split("-")[0] || "";
  return CJK_LANGUAGE_ALIASES.has(normalized) || CJK_LANGUAGE_ALIASES.has(primary);
}

function stripMixedCjkContent(text: string): string {
  return text
    .replace(/[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\u3040-\u30FF\uAC00-\uD7AF]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function localizeChatResponse(req: Request, text: string, targetLanguage: string): Promise<string> {
  const trimmed = String(text || "").trim();
  const normalizedLanguage = String(targetLanguage || "en").trim();

  if (!trimmed) return trimmed;
  if (!normalizedLanguage || /^en(|[-_].+)?$/i.test(normalizedLanguage) || normalizedLanguage.toLowerCase() === "english") {
    return trimmed;
  }

  try {
    const response = await fetch(new URL("/api/translate", req.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetLanguage: normalizedLanguage, texts: [trimmed] }),
      signal: req.signal,
    });

    if (!response.ok) {
      return isCjkLanguage(normalizedLanguage) ? trimmed : stripMixedCjkContent(trimmed);
    }

    const data = (await response.json()) as TranslationResponseBody;
    const translated = Array.isArray(data.translations) ? String(data.translations[0] || "").trim() : "";
    const localized = translated || trimmed;
    return isCjkLanguage(normalizedLanguage) ? localized : stripMixedCjkContent(localized);
  } catch {
    return isCjkLanguage(normalizedLanguage) ? trimmed : stripMixedCjkContent(trimmed);
  }
}

function buildFallbackChatResponse({
  message,
  dashboardData,
  systemContext,
  businessName,
}: {
  message: string;
  dashboardData: unknown;
  systemContext: unknown;
  businessName: string;
}): string {
  const dashboardRecord =
    dashboardData && typeof dashboardData === "object" && !Array.isArray(dashboardData)
      ? (dashboardData as DashboardRecord)
      : {};
  const summary =
    dashboardRecord.summary && typeof dashboardRecord.summary === "object" && !Array.isArray(dashboardRecord.summary)
      ? (dashboardRecord.summary as DashboardRecord)
      : {};
  const contextRecord =
    systemContext && typeof systemContext === "object" && !Array.isArray(systemContext)
      ? (systemContext as DashboardRecord)
      : {};
  const records = Array.isArray(dashboardRecord.records) ? dashboardRecord.records : [];

  const totalRevenue = Number(summary.totalRevenue ?? contextRecord.totalRevenue ?? 0) || 0;
  const averageDaily =
    Number(summary.averageDaily ?? summary.dailyAverage ?? contextRecord.dailyAverage ?? 0) || 0;
  const rawVolatility =
    Number(summary.volatilityPercentage ?? summary.volatility ?? contextRecord.volatilityPercentage ?? 0) || 0;
  const volatility = rawVolatility <= 1 ? rawVolatility * 100 : rawVolatility;
  const trend = String(summary.trend ?? "").toLowerCase();

  const regionTotals = new Map<string, number>();
  for (const record of records) {
    const region = String(record?.region || "Unknown").trim();
    const amount = Number(record?.amount || 0);
    regionTotals.set(region, (regionTotals.get(region) || 0) + (Number.isFinite(amount) ? amount : 0));
  }
  const topRegion = Array.from(regionTotals.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  const productTotals = new Map<string, number>();
  for (const record of records) {
    const product = String(record?.product_name || "Unknown").trim();
    const amount = Number(record?.amount || 0);
    productTotals.set(product, (productTotals.get(product) || 0) + (Number.isFinite(amount) ? amount : 0));
  }
  const topProduct = Array.from(productTotals.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  const hasUpwardTrend =
    trend.includes("up") || trend.includes("increase") || trend.includes("growth") || trend.includes("positive");
  const hasDownwardTrend =
    trend.includes("down") || trend.includes("decrease") || trend.includes("decline") || trend.includes("negative");

  const trendSentence = hasUpwardTrend
    ? "Sales momentum looks positive right now."
    : hasDownwardTrend
      ? "Sales momentum is soft right now, so it is worth reviewing what changed."
      : "Sales looks steady overall.";

  const question = message.toLowerCase();
  const summaryLine = [
    `Total revenue: ${formatCurrency(totalRevenue)}`,
    `Daily average: ${formatCurrency(averageDaily)}`,
    `Top region: ${topRegion}`,
    `Top product: ${topProduct}`,
    `Volatility: ${Number.isFinite(volatility) && volatility > 0 ? `${volatility.toFixed(1)}%` : "N/A"}`,
  ].join(". ");

  if (question.includes("how is my business") || question.includes("how's my business") || question.includes("performance")) {
    return `${businessName} is showing this snapshot: ${summaryLine}. ${trendSentence} If you want, I can break it down by region, product, or forecast next.`;
  }

  if (question.includes("revenue") || question.includes("total")) {
    return `Your total revenue is ${formatCurrency(totalRevenue)} and the daily average is ${formatCurrency(averageDaily)}. The top region is ${topRegion}.`;
  }

  if (question.includes("region")) {
    return `Regional performance is led by ${topRegion}. ${trendSentence} ${summaryLine}.`;
  }

  if (question.includes("product")) {
    return `Your strongest product right now is ${topProduct}. ${summaryLine}.`;
  }

  if (question.includes("trend") || question.includes("growth")) {
    return `${trendSentence} ${summaryLine}. To grow sales, focus on the strongest region and product while fixing any declining segment in the dashboard.`;
  }

  if (
    question.includes("hello") ||
    question.includes("hi") ||
    question.includes("hey") ||
    question.includes("good morning") ||
    question.includes("good afternoon") ||
    question.includes("good evening")
  ) {
    return `Hello! I'm Aura, your business dashboard assistant. ${businessName} is showing this snapshot: ${summaryLine}. What would you like to explore next?`;
  }

  return `Here is the latest business snapshot for ${businessName}: ${summaryLine}. ${trendSentence} If you want to improve sales, I can help you analyze revenue, regions, products, or trends from the dashboard.`;
}

// Warm-up endpoint to activate the model
export async function GET() {
  try {
    const hfApiKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfApiKey) {
      return NextResponse.json({ status: "error", message: "API key not configured" }, { status: 500 });
    }

    const hfClient = new HfInference(hfApiKey);

    // Send a minimal ping to warm up the model
    // This ensures the model is loaded and ready when the user needs it
    await hfClient.chatCompletion({
      model: MODEL_ID,
      messages: [
        { role: "user", content: "ping" }
      ],
      max_tokens: 50,
      temperature: 0.7,
    });

    return NextResponse.json({ status: "ready", message: "Model warmed up successfully" });
  } catch {
    // Don't throw error - warm-up is non-critical
    return NextResponse.json({ status: "warming", message: "Model is initializing" }, { status: 202 });
  }
}

export async function POST(req: Request) {
  let fallbackContent = "";
  let body: Record<string, unknown> = {};
  let targetLanguage = "en";
  let responseLanguage = "English";
  try {
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("Chat API request body parse failed:", parseError);
      const safeMessage = buildFallbackChatResponse({
        message: "Explain my dashboard",
        dashboardData: {},
        systemContext: {},
        businessName: "your business",
      });
      return NextResponse.json({
        content: safeMessage,
        message: safeMessage,
        response: safeMessage,
        source: "fallback-local-responder",
      });
    }

    const message = typeof body.message === "string" ? body.message.trim() : "";
    const businessName = typeof body?.businessName === "string" && body.businessName.trim() ? body.businessName.trim() : "AuraSales";
    const systemContext = body?.systemContext;
    targetLanguage = typeof body?.targetLanguage === "string" ? body.targetLanguage : "en";
    responseLanguage = getLanguageDisplayName(targetLanguage);
    if (!message) {
      const safeMessage = buildFallbackChatResponse({
        message: "Explain my dashboard",
        dashboardData: body?.dashboardData,
        systemContext,
        businessName,
      });
      return NextResponse.json({
        content: safeMessage,
        message: safeMessage,
        response: safeMessage,
        source: "fallback-local-responder",
      });
    }
    console.info("Chat API request:", { message, businessName, targetLanguage });

    if (!isDashboardSalesIntent(message, targetLanguage)) {
      const refocusMessage = buildDashboardSalesRefocusMessage(targetLanguage);
      return NextResponse.json({
        content: refocusMessage,
        message: refocusMessage,
        response: refocusMessage,
        source: "privacy-wall",
      });
    }

    // Build an early fallback so any later failure still returns a sales-only answer.
    const safeDashboardData = body?.dashboardData;
    const safeCsvContent = body?.csvContent;
    const safeBusinessName =
      typeof body?.businessName === "string" && body.businessName.trim() ? body.businessName.trim() : "AuraSales";
    const safeForecast = body?.forecast;
    const safeSystemContext = body?.systemContext;
    const safeMessage = typeof body?.message === "string" ? body.message.trim() : "";

    fallbackContent = buildFallbackChatResponse({
      message: safeMessage || "Explain my dashboard",
      dashboardData: safeDashboardData,
      systemContext: safeSystemContext,
      businessName: safeBusinessName,
    });
    if (!fallbackContent || !fallbackContent.trim()) {
      fallbackContent = `Here is a quick sales summary for ${safeBusinessName}. Ask me about revenue, regions, products, forecasts, trends, or performance.`;
    }

    const earlySummary = (() => {
      try {
        const dashboardRecord =
          safeDashboardData && typeof safeDashboardData === "object" && !Array.isArray(safeDashboardData)
            ? (safeDashboardData as DashboardRecord)
            : {};
        const summary =
          dashboardRecord.summary && typeof dashboardRecord.summary === "object" && !Array.isArray(dashboardRecord.summary)
            ? (dashboardRecord.summary as DashboardRecord)
            : {};
        const contextRecord =
          safeSystemContext && typeof safeSystemContext === "object" && !Array.isArray(safeSystemContext)
            ? (safeSystemContext as DashboardRecord)
            : {};
        const records = Array.isArray(dashboardRecord.records) ? dashboardRecord.records : [];

        const totalRevenue = Number(summary.totalRevenue ?? contextRecord.totalRevenue ?? 0) || 0;
        const averageDaily = Number(summary.averageDaily ?? summary.dailyAverage ?? contextRecord.dailyAverage ?? 0) || 0;
        const topRegion =
          records
            .reduce((acc: Record<string, number>, record: DashboardRecord) => {
              const region = String(record?.region || "Unknown").trim();
              const amount = Number(record?.amount || 0);
              acc[region] = (acc[region] || 0) + (Number.isFinite(amount) ? amount : 0);
              return acc;
            }, {})
        ;
        const topRegionName = Object.entries(topRegion as Record<string, number>).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
        return `Total revenue: ${formatCurrency(totalRevenue)}. Daily average: ${formatCurrency(averageDaily)}. Top region: ${topRegionName}.`;
      } catch {
        return "I can help you review your sales dashboard, revenue, regions, products, and trends.";
      }
    })();

    fallbackContent = buildFallbackChatResponse({
      message: safeMessage || "Explain my dashboard",
      dashboardData: safeDashboardData,
      systemContext: safeSystemContext,
      businessName: safeBusinessName,
    });
    if (!fallbackContent || !fallbackContent.trim()) {
      fallbackContent = `Here is a quick sales summary for ${safeBusinessName}: ${earlySummary} If you want, I can break it down by revenue, regions, products, or trends.`;
    }

    // Authentication is best-effort so AI replies still work if auth is temporarily unavailable.
    let userId: string | null = null;
    let companyId: string | null = null;
    let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> | null = null;
    try {
      supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const authUser = user as {
          id: string;
          email?: string | null;
          user_metadata?: Record<string, unknown>;
          app_metadata?: Record<string, unknown>;
        };
        userId = authUser.id;
        const userMetadata = authUser.user_metadata || {};
        const appMetadata = authUser.app_metadata || {};
        companyId =
          (typeof userMetadata.company_id === "string" && userMetadata.company_id) ||
          (typeof appMetadata.company_id === "string" && appMetadata.company_id) ||
          null;

        try {
          const creditCheck = await consumeAiCredit(authUser.id, authUser.email);
          if (!creditCheck.allowed) {
            return NextResponse.json(
              {
                error: "QUOTA_EXCEEDED",
                message: "You have reached your 1,000 free credit limit.",
                redirectTo: "/pricing?payment=required",
              },
              { status: 402 }
            );
          }
        } catch (creditError) {
          console.warn("Credit check failed, continuing with fallback AI response:", creditError);
        }
      } else {
        console.warn("No authenticated user found for chat request; continuing with fallback AI response.");
      }
    } catch (e) {
      console.error("Auth check failed, continuing without persisted history:", e);
    }

    const hfApiKey = process.env.HUGGINGFACE_API_KEY;
    // Condense CSV if necessary - use new unified summarizer
    let csvSummary = null;
    if (safeCsvContent) {
      try {
        const csvArray = typeof safeCsvContent === "string" ? JSON.parse(safeCsvContent) : safeCsvContent;
        if (Array.isArray(csvArray)) {
          csvSummary = summarizeCSVData(csvArray);
        }
      } catch (e) {
        console.error("Failed to summarize CSV:", e);
      }
    }

    // Fetch recent conversation for memory (last 6 messages) filtered by company_id
    let historyMessages: ChatHistoryMessage[] = [];
    try {
      if (supabase && companyId) {
        const { data: history } = await supabase
          .from("chat_messages")
          .select("role,content")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(6);
        if (history && Array.isArray(history)) {
          // reverse to chronological order
          historyMessages = history.reverse().map((h: { role: string; content: string }) => ({
            role: h.role === "assistant" ? "assistant" : "user",
            content: h.content,
          }));
        }
      }
    } catch (e) {
      console.error("Failed to fetch chat history:", e);
    }

    // Build normalized system context, preferring the frontend-provided payload
    const dashboardRecord =
      safeDashboardData && typeof safeDashboardData === "object" && !Array.isArray(safeDashboardData)
        ? (safeDashboardData as DashboardRecord)
        : {};
    const summary =
      dashboardRecord.summary && typeof dashboardRecord.summary === "object" && !Array.isArray(dashboardRecord.summary)
        ? (dashboardRecord.summary as DashboardRecord)
        : {};
    const rawVolatility = typeof summary?.volatility === "number" ? summary.volatility : summary?.volatilityPercentage;
    const normalizedVolatility =
      typeof rawVolatility === "number" ? (rawVolatility <= 1 ? Number((rawVolatility * 100).toFixed(2)) : Number(rawVolatility.toFixed(2))) : null;

    const fallbackSystemContext = {
      totalRevenue: typeof summary?.totalRevenue === "number" ? summary.totalRevenue : null,
      dailyAverage:
        typeof summary?.averageDaily === "number"
          ? summary.averageDaily
          : typeof summary?.dailyAverage === "number"
            ? summary.dailyAverage
            : null,
      volatilityPercentage: normalizedVolatility,
      csvSummary: csvSummary || null,
    };

    const resolvedSystemContext =
      systemContext && typeof systemContext === "object" && !Array.isArray(systemContext) ? systemContext : fallbackSystemContext;
    const serializedSystemContext = JSON.stringify(resolvedSystemContext);
    if (!hfApiKey) {
      console.error("HUGGING FACE API key missing; returning fallback chat response.");
      return NextResponse.json({
        content: fallbackContent,
        message: fallbackContent,
        response: fallbackContent,
        source: "fallback-local-responder",
      });
    }

    // Build the system prompt with business summary and live metrics
    let contextData = `System Context: ${serializedSystemContext}\nDashboard: ${JSON.stringify(safeDashboardData) || "No dashboard data provided"}`;
    if (csvSummary) {
      contextData += `\n\nBusiness Summary:\n${JSON.stringify(csvSummary, null, 2)}`;
    }

    // Truncate context if it exceeds safety limit (keep 30% for response)
    const safeContextLength = Math.floor(MAX_PROMPT_CHARS * 0.6);
    if (contextData.length > safeContextLength) {
      contextData = contextData.slice(0, safeContextLength) + "\n[...data truncated for brevity]";
    }

    // Build the grounding system prompt from the user-provided assistant behavior.
    const systemPrompt = `You are Aura, a highly intelligent business dashboard assistant.

CRITICAL RULES (must always follow):
- Always respond directly to the user's latest message.
- Never repeat the same response twice.
- Never fall back to generic phrases like "I can help you explore your business...".
- If a similar question is asked again, provide a more detailed or slightly different answer.
- Always vary your wording to sound natural and human.
- Only answer questions about dashboard data, sales, revenue, orders, metrics, reports, forecasts, trends, and business performance.
- If the user asks for jokes or anything unrelated, do not answer it; gently redirect back to dashboard and sales topics.
- Support businesses from any country or industry, using universal business language when needed.
- Understand the user's latest message even if they type or speak in ${responseLanguage} or mix it with English.
- Do not ask the user to translate their message; interpret it directly in the language they used.

Behavior:
- Greet the user naturally if it's the first message.
- Be conversational, smart, and helpful.
- Interpret every question in a business or dashboard context.

Response Logic:
- If the user asks about growth/customers -> give actionable strategies.
- If the user asks about revenue -> explain trends or suggest improvements.
- If the user asks something vague -> interpret it and provide meaningful insight.

Anti-Loop Protection:
- If you detect repeated conversation or limited context, DO NOT repeat yourself.
- Instead, expand the answer, add insights, or ask a new follow-up question.
- Always move the conversation forward.

Style:
- Keep responses short, clear, and natural.
- Always end with a relevant follow-up question.

Goal:
Act like a real business advisor, not a scripted bot.
Every response must feel fresh, relevant, and based on the user's latest input.

Respond entirely in ${responseLanguage}.
If the user writes in ${responseLanguage}, answer naturally in ${responseLanguage}. If they write in English, still answer in ${responseLanguage}.

Use only the provided context and never invent numbers.
If the user asks about future performance, use forecast data when available: ${JSON.stringify(safeForecast || {})}.

CONTEXT DATA:
${contextData}`;

    const conversationHistory: ChatHistoryMessage[] = historyMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Build conversation history in HF format and log exactly what is sent.
    console.info("Chat API payload assembled:", {
      latestUserMessage: safeMessage,
      historyCount: historyMessages.length,
      messagesSent: [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: safeMessage },
      ].map((m) => ({ role: m.role, content: m.content })),
    });

    // Initialize Hugging Face client
    try {
      const hfClient = new HfInference(hfApiKey);

      // Create messages array with system prompt
      const messages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: safeMessage },
      ];

      // Safety check: Truncate combined message length to MAX_PROMPT_CHARS
      const combinedLength = systemPrompt.length + conversationHistory.reduce((sum, m) => sum + m.content.length, 0) + safeMessage.length;
      if (combinedLength > MAX_PROMPT_CHARS) {
        console.warn(`Combined prompt length ${combinedLength} exceeds MAX_PROMPT_CHARS ${MAX_PROMPT_CHARS}. Truncating user content.`);
        const truncatedUserMessage = safeMessage.slice(0, Math.max(100, MAX_PROMPT_CHARS - (systemPrompt.length + conversationHistory.reduce((sum, m) => sum + m.content.length, 0))));
        messages[messages.length - 1].content = truncatedUserMessage;
      }

      // Call DeepSeek-R1 7B model using chatCompletion (optimized for free tier)
      // Wrap call with a timeout to avoid long-running invocations
      const chatPromise = hfClient.chatCompletion({
        model: MODEL_ID,
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      const response = await Promise.race([
        chatPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Model timeout after 30s')), 30000)),
      ]);

      // 1. Robust extraction (supports multiple HF provider formats + reasoning_content fallback)
      let aiContent = "";
      const responseData = response as ChatCompletionResponse;
      const messageObject = !Array.isArray(responseData) ? responseData.choices?.[0]?.message : undefined;
      if (messageObject) {
        // Priority 1: Use actual content
        // Priority 2: Use reasoning_content if content is null/empty (DeepSeek partial responses)
        aiContent = messageObject.content || messageObject.reasoning_content || "";
      } else if (Array.isArray(responseData) && responseData[0]?.generated_text) {
        // Legacy array-based inference responses
        aiContent = responseData[0].generated_text || "";
      } else if (!Array.isArray(responseData) && responseData.generated_text) {
        // Direct generated_text on object
        aiContent = responseData.generated_text || "";
      }

      // 2. Clean up the response (remove DeepSeek internal reasoning tags like <think>...</think>)
      try {
        if (aiContent && typeof aiContent === 'string') {
          aiContent = aiContent.replace(/[\s\S]*?<\/think>/g, '').trim();
        }
      } catch {
        // ignore sanitize errors
      }

      // 3. Final validation
      if (!aiContent) {
        console.error('Extraction failed. Structure received:', typeof response, response);
        throw new Error('Could not extract text from model response.');
      }
      if (/^I can only assist with dashboard and sales-related questions\./i.test(aiContent.trim())) {
        aiContent = buildFallbackChatResponse({
          message: safeMessage || "Explain my dashboard",
          dashboardData: safeDashboardData,
          systemContext: safeSystemContext,
          businessName: safeBusinessName,
        });
      }
      aiContent = await localizeChatResponse(req, aiContent, targetLanguage);
      console.info("Chat API model response extracted successfully.");

      // Persist both user and assistant messages using admin client
      const admin = await createAdminClient();
      try {
        if (admin && userId) {
          const rows = [
            { user_id: userId, role: "user", content: safeMessage, company_id: companyId },
            { user_id: userId, role: "assistant", content: aiContent, company_id: companyId },
          ];
          await admin.from("chat_messages").insert(rows);
        }
      } catch (err) {
        console.error("Failed to persist messages:", err);
      }

      return NextResponse.json({ content: aiContent, message: aiContent, response: aiContent, source: "huggingface" });
    } catch (e) {
      console.error("HUGGING FACE ERROR: using local fallback", e);
      const localizedFallback = await localizeChatResponse(req, fallbackContent, targetLanguage);
      return NextResponse.json({
        content: localizedFallback,
        message: localizedFallback,
        response: localizedFallback,
        source: "fallback-local-responder",
      });
    }
    } catch (error: unknown) {
      const errorInfo =
        error instanceof Error
          ? { message: error.message, stack: error.stack, cause: (error as Error & { cause?: unknown }).cause }
          : { message: String(error) };
    console.error("Chat API Error:", {
      ...errorInfo,
      error,
    });
    if (fallbackContent) {
      const localizedFallback = await localizeChatResponse(req, fallbackContent, targetLanguage);
      return NextResponse.json({
        content: localizedFallback,
        message: localizedFallback,
        response: localizedFallback,
        source: "fallback-local-responder",
      });
    }
    const safeFallback = buildFallbackChatResponse({
      message: "Explain my dashboard",
      dashboardData: {},
      systemContext: {},
      businessName: "your business",
    });
    return NextResponse.json({
      content: safeFallback,
      message: safeFallback,
      response: safeFallback,
      source: "fallback-local-responder",
    });
  }
}
// cspell:enable
