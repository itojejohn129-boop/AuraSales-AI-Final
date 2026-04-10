import { NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";
import { createClient as createSupabaseServerClient } from "@/utils/supabase/server";
import createAdminClient from "@/utils/supabase/admin";
import { consumeAiCredit } from "@/lib/server/credits";
import { getLanguageDisplayName } from "@/lib/i18n/dashboardCopy";

// Get Hugging Face API key from environment
function getHuggingFaceKey() {
  return process.env.HUGGINGFACE_API_KEY || null;
}

type DashboardRecord = {
  region?: string;
  product_name?: string;
  amount?: number | string;
  sale_date?: string;
  [key: string]: unknown;
};

type DashboardSummary = {
  totalRevenue?: number;
  averageRevenue?: number;
  recordCount?: number;
};

type DashboardData = {
  summary?: DashboardSummary;
  records?: DashboardRecord[];
};

type ChatHistoryRow = {
  role: string;
  content: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getDashboardData(value: unknown): DashboardData {
  if (isRecord(value)) {
    return {
      summary: isRecord(value.summary) ? (value.summary as DashboardSummary) : undefined,
      records: Array.isArray(value.records) ? (value.records as DashboardRecord[]) : undefined,
    };
  }

  return {};
}

// Helper function to check if a question is data-related
function isDataRelatedQuestion(message: string): boolean {
  if (!message) return false;

  // Allow very short messages (e.g., greetings) to pass so AI can greet the user
  if (message.trim().length < 10) return true;

  const lowerMessage = message.toLowerCase();

  // Keywords related to business data
  const businessKeywords = [
    // include casual greetings so short greetings are treated as data requests (for greeting flow)
    "hello",
    "hi",
    "hey",
    "sales",
    "revenue",
    "region",
    "product",
    "amount",
    "quantity",
    "trend",
    "performance",
    "data",
    "record",
    "metric",
    "analysis",
    "csv",
    "report",
    "total",
    "average",
    "highest",
    "lowest",
    "growth",
    "compare",
    "breakdown",
    "summary",
    "how much",
    "how many",
    "which",
    "what is",
    "tell me",
    "show me",
    "analyze",
    "calculate",
  ];

  const hasBusinessKeyword = businessKeywords.some((keyword) => lowerMessage.includes(keyword));

  // Check for potential off-topic patterns
  const offTopicPatterns = [
    /tell me a joke/i,
    /what is (your|your\s+favorite|the\s+meaning)/i,
    /how do i/i,
    /recipe/i,
    /philosophy/i,
    /politics/i,
    /sports/i,
    /entertainment/i,
    /weather/i,
    /current events/i,
    /general knowledge/i,
  ];

  const isOffTopic = offTopicPatterns.some((pattern) => pattern.test(message));

  if (isOffTopic) return false;

  return hasBusinessKeyword || message.includes("?");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      message?: unknown;
      dashboardData?: unknown;
      businessName?: unknown;
      context?: unknown;
      targetLanguage?: unknown;
    };
    const message = typeof body.message === "string" ? body.message : "";
    const dashboardData = body.dashboardData;
    const businessName = typeof body.businessName === "string" ? body.businessName : "your business";
    const context = body.context;
    const targetLanguage = typeof body.targetLanguage === "string" ? body.targetLanguage : "en";
    const responseLanguage = getLanguageDisplayName(targetLanguage);
    console.log("AI Context Received:", context);
    if (!context || Object.keys(context).length === 0) {
      console.error("Frontend failed to provide context");
      return NextResponse.json({ error: "Frontend failed to provide context" }, { status: 400 });
    }

    // Authentication is best-effort so voice replies still work if auth is temporarily unavailable.
    let userId: string | null = null;
    let companyId: string | null = null;
    let userEmail: string | null = null;
    let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> | null = null;
    let parsedDashboardData: DashboardData = {};
    try {
      supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        userEmail = user.email || null;
        // attempt to read company_id from user metadata or from jwt claims
        const userMetadata = user.user_metadata as Record<string, unknown> | undefined;
        const appMetadata = user.app_metadata as Record<string, unknown> | undefined;
        const metadataCompanyId = userMetadata && typeof userMetadata.company_id === "string" ? userMetadata.company_id : null;
        const appCompanyId = appMetadata && typeof appMetadata.company_id === "string" ? appMetadata.company_id : null;
        companyId = metadataCompanyId || appCompanyId || null;
      } else {
        console.warn("No authenticated user found for voice request; continuing without persisted history.");
      }
    } catch (e) {
      console.warn("Auth check failed, continuing without persisted history:", e instanceof Error ? e.message : e);
    }

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (userId) {
      try {
        const creditCheck = await consumeAiCredit(userId as string, userEmail);
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
        console.warn("Credit check failed, continuing with fallback voice response:", creditError);
      }
    }

    // Check if question is data-related
    try {
      if (typeof dashboardData === "string") {
        const parsed = JSON.parse(dashboardData) as unknown;
        parsedDashboardData = getDashboardData(parsed);
      } else if (isRecord(dashboardData)) {
        parsedDashboardData = getDashboardData(dashboardData);
      }
    } catch (e) {
      console.error("Failed to parse dashboard data:", e);
      parsedDashboardData = {};
    }

    const isDataQuestion = isDataRelatedQuestion(message);

    // If not a data question, return privacy wall response
    if (!isDataQuestion) {
      return NextResponse.json({
        response: "I am restricted to analyzing your business data only. How can I help with your sales or CSV records?",
        source: "privacy-wall",
      });
    }

    // Integrate with Hugging Face (server-side). Retrieve Hugging Face key from environment.
    try {
      const huggingfaceKey = getHuggingFaceKey();
      if (!huggingfaceKey) {
        throw new Error("Hugging Face API key not configured. Please set HUGGINGFACE_API_KEY.");
      }

      // Condense CSV if necessary
      // Fetch recent conversation for memory (last 6 messages, filtered by company_id)
      let historyMessages: ChatHistoryRow[] = [];
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
            historyMessages = history
              .slice()
              .reverse()
              .map((h) => ({
                role: h.role === "assistant" ? "assistant" : "user",
                content: typeof h.content === "string" ? h.content : "",
              }))
              .filter((entry): entry is ChatHistoryRow => Boolean(entry.content));
          }
        }
      } catch (e) {
        console.error("Failed to fetch chat history:", e);
      }

      // Build the system prompt for Hugging Face
      const systemPrompt = `You are AURA AI for ${businessName}. Here is the LIVE data from the user's dashboard: ${JSON.stringify(
        context || dashboardData
      )}. Use these exact numbers to answer questions. Do not guess. Respond entirely in ${responseLanguage}.`;

      // Hugging Face Inference
      const hfKey = getHuggingFaceKey();
      if (!hfKey) {
        throw new Error("Hugging Face API key not configured. Please set HUGGINGFACE_API_KEY.");
      }
      const hf = new HfInference(hfKey);
      const response = await hf.chatCompletion({
        model: "mistralai/Mistral-7B-Instruct-v0.2",
        messages: [{ role: "system", content: systemPrompt }, ...historyMessages, { role: "user", content: message }],
        max_tokens: 500,
        temperature: 0.7,
      });
      const aiText = response?.choices?.[0]?.message?.content || response?.content || response?.response || "";

      // Store user message for memory prior to response
      try {
        if (supabase && userId) {
          await supabase.from('chat_messages').insert([
            { user_id: userId, role: 'user', content: message, company_id: companyId }
          ]);
        }
      } catch (e) {
        console.error('Failed to store user chat message:', e);
      }

      // Persist assistant response
      try {
        const admin = await createAdminClient();
        if (admin && userId) {
          await admin.from('chat_messages').insert([
            { user_id: userId, role: 'assistant', content: aiText, company_id: companyId }
          ]);
        }
      } catch (err) {
        console.error('Failed to persist assistant message (voice):', err);
      }

      return NextResponse.json({ response: aiText, source: "huggingface" });
    } catch (e) {
      // Fallback: data-only local responder (keeps privacy guard)
      if (typeof message === "string" && typeof parsedDashboardData === "object") {
        const lowerMessage = message.toLowerCase();
        let responseMessage = "";
        try {
          const summary: DashboardSummary = parsedDashboardData.summary ?? {};
          const records: DashboardRecord[] = parsedDashboardData.records ?? [];
          const getAmount = (record: DashboardRecord) => Number(record.amount ?? 0);
          const totalRevenue = summary.totalRevenue || 0;
          const avgRevenue = summary.averageRevenue || 0;
          const recordCount = summary.recordCount || 0;

          if (lowerMessage.includes("total") || lowerMessage.includes("overall") || lowerMessage.includes("sum")) {
            responseMessage = `Your total revenue across ${recordCount} records is $${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}. The average transaction value is $${avgRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}.`;
          } else if (lowerMessage.includes("region")) {
            const regions = records.reduce((acc, record) => {
              const regionKey = record.region || "Unknown";
              if (!acc[regionKey]) acc[regionKey] = 0;
              acc[regionKey] += getAmount(record);
              return acc;
            }, {} as Record<string, number>);

            const sortedRegions = Object.entries(regions)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .slice(0, 3);

            responseMessage = `Regional performance breakdown: ${sortedRegions
              .map(([region, amount]) => `${region} - $${(amount as number).toLocaleString("en-US", { minimumFractionDigits: 2 })}`)
              .join(", ")}. The top performing region is ${sortedRegions[0]?.[0] || "N/A"}.`;
          } else if (lowerMessage.includes("product")) {
            const products = records.reduce((acc, record) => {
              const productKey = record.product_name || "Unknown";
              if (!acc[productKey]) acc[productKey] = 0;
              acc[productKey] += getAmount(record);
              return acc;
            }, {} as Record<string, number>);

            const sortedProducts = Object.entries(products)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .slice(0, 3);

            responseMessage = `Top products: ${sortedProducts
              .map(([product, amount]) => `${product} - $${(amount as number).toLocaleString("en-US", { minimumFractionDigits: 2 })}`)
              .join(", ")}.`;
          } else if (lowerMessage.includes("trend") || lowerMessage.includes("growth")) {
            if (records.length >= 2) {
              const recent = records.slice(-3);
              const older = records.slice(0, 3);
              const recentAvg = recent.reduce((sum, r) => sum + getAmount(r), 0) / recent.length;
              const olderAvg = older.reduce((sum, r) => sum + getAmount(r), 0) / older.length;
              const trendPercent = olderAvg === 0 ? 0 : ((recentAvg - olderAvg) / olderAvg) * 100;

              const trendDirection = trendPercent > 0 ? "increasing" : "decreasing";
              responseMessage = `Your sales trend is ${trendDirection} by approximately ${Math.abs(trendPercent).toFixed(1)}%. Recent average revenue: $${recentAvg.toLocaleString("en-US", { minimumFractionDigits: 2 })}.`;
            } else {
              responseMessage = `I need more data to analyze trends. Currently, you have ${recordCount} records.`;
            }
          } else if (lowerMessage.includes("highest") || lowerMessage.includes("maximum")) {
            const highest = records.reduce((max, record) => (getAmount(record) > getAmount(max) ? record : max), records[0] ?? {});
            responseMessage = `Your highest sale is $${Number(highest.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} for ${highest.product_name || "N/A"} in the ${highest.region || "N/A"} region on ${highest.sale_date || "N/A"}.`;
          } else if (lowerMessage.includes("lowest") || lowerMessage.includes("minimum")) {
            const lowest = records.reduce((min, record) => (getAmount(record) < getAmount(min) ? record : min), records[0] ?? {});
            responseMessage = `Your lowest sale is $${Number(lowest.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} for ${lowest.product_name || "N/A"} in the ${lowest.region || "N/A"} region on ${lowest.sale_date || "N/A"}.`;
          } else {
            responseMessage = `I can see you have ${recordCount} sales records with a total revenue of $${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}. What specific aspect of your sales data would you like to analyze?`;
          }
        } catch (e) {
          console.error("Error processing dashboard data:", e);
          responseMessage = "I encountered an issue analyzing your data. Please try again with a more specific question.";
        }
        if (!responseMessage) responseMessage = "I can help you analyze your sales data. Please ask me about your revenue, regions, products, or trends.";
        return NextResponse.json({ 
          response: responseMessage,
          source: "fallback-local-responder",
        });
      }
      // If fallback not possible, throw error
      throw e;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorCause = error instanceof Error ? error.cause : undefined;
    console.error("Voice assistant error:", {
      message: errorMessage,
      stack: errorStack,
      cause: errorCause,
      error,
    });
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
