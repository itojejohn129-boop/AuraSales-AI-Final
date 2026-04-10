import { NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";
import { summarizeCSVData, DataSummary } from "@/lib/csvSummarizer";
import { createClient as createSupabaseServerClient } from "@/utils/supabase/server";
import { consumeAiCredit } from "@/lib/server/credits";

const MODEL_ID = "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B";
const MAX_PROMPT_CHARS = 5000; // Safety limit for AI context window
export const maxDuration = 60;


export async function POST(req: Request) {
  try {
    let requestBody: Record<string, unknown>;
    try {
      requestBody = (await req.json()) as Record<string, unknown>;
    } catch (parseError) {
      if (parseError instanceof SyntaxError) {
        return NextResponse.json(
          { error: "Data payload too large or corrupted." },
          { status: 400 }
        );
      }
      throw parseError;
    }

    const { dashboardData, csvContent, businessName, summarizedData, summaryDataForAI } = requestBody;

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const creditCheck = await consumeAiCredit(user.id, user.email);
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

    if (!dashboardData) {
      return NextResponse.json({ error: "Dashboard data is required" }, { status: 400 });
    }

    const hfApiKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfApiKey) {
      return NextResponse.json(
        { error: "Hugging Face API key not configured" },
        { status: 500 }
      );
    }

    // Parse CSV content if provided (default to empty array)
    let csvData: unknown[] = [];
    if (csvContent) {
      try {
        // If it's a string, try to parse it as JSON array
        csvData = typeof csvContent === "string" ? JSON.parse(csvContent) : (csvContent as unknown[]);
        if (!Array.isArray(csvData)) {
          csvData = [];
        }
      } catch (err) {
        if (err instanceof SyntaxError) {
          return NextResponse.json(
            { error: "Data payload too large or corrupted." },
            { status: 400 }
          );
        }
        csvData = [];
      }
    }

    // Prefer frontend-provided compact summary to avoid oversized payloads.
    let dataSummary: DataSummary;
    const compactSummarySource =
      summaryDataForAI && typeof summaryDataForAI === "object" && !Array.isArray(summaryDataForAI)
        ? (summaryDataForAI as Record<string, unknown>)
        : summarizedData && typeof summarizedData === "object" && !Array.isArray(summarizedData)
          ? (summarizedData as Record<string, unknown>)
          : null;

    if (compactSummarySource) {
      const summary = compactSummarySource;
      const topProductsInput = Array.isArray(summary.top10Products)
        ? summary.top10Products
        : Array.isArray(summary.topProducts)
          ? summary.topProducts
          : [];

      const topProducts = topProductsInput
        .filter((entry) => entry && typeof entry === "object")
        .map((entry) => {
          const product = entry as Record<string, unknown>;
          return {
            name: String(product.name || "Unknown"),
            revenue: Number(product.revenue || 0),
          };
        });

      const volatility =
        typeof summary.volatilityPercentage === "number"
          ? summary.volatilityPercentage
          : typeof summary.volatility === "number"
            ? Number(summary.volatility) * 100
            : 0;

      dataSummary = {
        recordCount: Number(summary.recordCount || 0),
        totalRevenue: Number(summary.totalRevenue || 0),
        averageTransaction:
          Number(summary.totalRevenue || 0) > 0 && Number(summary.recordCount || 0) > 0
            ? Number(summary.totalRevenue || 0) / Number(summary.recordCount || 1)
            : 0,
        transactionRange: {
          min: 0,
          max: Number(summary.totalRevenue || 0),
        },
        topProducts,
        worstProducts: [],
        topRegions: [],
        averageSentimentScore: null,
        trend: {
          description: `Observed volatility: ${Number(volatility).toFixed(1)}%`,
          percentChange: 0,
        },
      };
    } else {
      // Summarize CSV data instead of sending raw content
      dataSummary = summarizeCSVData(csvData);
    }

    const systemPrompt = `You are an expert financial analyst. Based on this summary of 30,000 sales records: ${JSON.stringify(dataSummary)}, provide 3 strategic recommendations.

Output ONLY a raw JSON array. Do not include introductory text, markdown code blocks (like \`\`\`json), or explanations. Start with [ and end with ].

JSON structure:
[
  {
    "title": "Action title",
    "description": "Specific, actionable description",
    "priority": "high|medium|low",
    "estimatedROI": "5-10% increase" or "$500-1000 revenue"
  },
  {
    "title": "Second action title",
    "description": "More details here",
    "priority": "high|medium|low",
    "estimatedROI": "Value"
  },
  {
    "title": "Third action title",
    "description": "Final action details",
    "priority": "high|medium|low",
    "estimatedROI": "Value"
  }
]

Rules:
- Focus on low-cost, quick-win actions only
- Each action should be implementable within 30 days
- Prioritize based on effort:reward ratio
- Be specific with metrics and timelines
- CRITICAL: Return ONLY valid JSON. No markdown blocks, no explanations.`;

    const userPrompt = `Business Summary for ${businessName || "the business"}:

Key Metrics:
- Total Revenue: $${(dataSummary as any).totalRevenue}
- Records Analyzed: ${(dataSummary as any).recordCount}
- Average Transaction: $${(dataSummary as any).averageTransaction}
- Trend: ${(dataSummary as any).trend?.description}

Top 5 Products:
${(dataSummary as any).topProducts?.map((p: any) => `- ${p.name}: $${p.revenue}`).join("\n")}

Bottom 5 Products:
${(dataSummary as any).worstProducts?.map((p: any) => `- ${p.name}: $${p.revenue}`).join("\n")}

Top Regions:
${(dataSummary as any).topRegions?.map((r: any) => `- ${r.name}: $${r.revenue}`).join("\n")}

${(dataSummary as any).averageSentimentScore ? `Customer Sentiment Score: ${(dataSummary as any).averageSentimentScore}/100` : ""}

Based on this business summary, provide 3 prioritized actions to increase revenue by 5% next month. Focus on low-cost, high-impact strategies targeting the underperforming products or regions.`;

    // Safety check: Ensure prompt doesn't exceed context window limit
    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;
    let finalPrompt = combinedPrompt;
    if (combinedPrompt.length > MAX_PROMPT_CHARS) {
      finalPrompt = combinedPrompt.slice(0, MAX_PROMPT_CHARS);
      console.warn(
        `Prompt exceeded ${MAX_PROMPT_CHARS} characters (${combinedPrompt.length}). Truncating to safety limit.`
      );
    }

    const hfClient = new HfInference(hfApiKey);

    // Use chatCompletion instead of textGeneration for better compatibility
    const response = await hfClient.chatCompletion({
      model: MODEL_ID,
      messages: [
        {
          role: "user",
          content: finalPrompt,
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    // Extract content from response, handling DeepSeek reasoning_content
    const message = response.choices[0]?.message;
    const aiResponse = message?.content || (message as any)?.reasoning_content || "";

    if (!aiResponse) {
      throw new Error("No content received from AI model");
    }

    // Parse JSON from response
    const parsedRecommendations = await parseRecommendations(aiResponse);

    return NextResponse.json({ recommendations: parsedRecommendations });
  } catch (error: any) {
    console.error("Recommendations API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate recommendations",
        details: (error as any).message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function parseRecommendations(aiResponse: string): Promise<Array<any>> {
  try {
    // 1. Extract JSON using robust regex: find first [ and last ]
    let jsonMatch;
    
    // Try array format first: [ ... ]
    const arrayMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      jsonMatch = arrayMatch[0];
    } else {
      // Try object format: { ... } (for single item)
      const objectMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonMatch = `[${objectMatch[0]}]`; // Wrap in array
      }
    }

    if (!jsonMatch) {
      console.warn("No JSON structure found in response");
      return getFallbackRecommendations();
    }

    // 2. Use robust parse to handle truncated JSON
    const parsed = robustParse(jsonMatch);
    
    if (!parsed) {
      console.warn("Failed to parse even after repair attempt");
      return getFallbackRecommendations();
    }

    const items = Array.isArray(parsed) ? parsed : [parsed];

    // Validate and enrich recommendations
    return items.map((rec: any, idx: number) => ({
      id: `action-${idx + 1}`,
      title: rec.title || `Action ${idx + 1}`,
      description: rec.description || "",
      priority: rec.priority || "medium",
      estimatedROI: rec.estimatedROI || "TBD",
      completed: false,
    }));
  } catch (parseErr) {
    console.error("Critical error in parseRecommendations:", parseErr);
    return getFallbackRecommendations();
  }
}

/**
 * Robust JSON parser that attempts to repair truncated or malformed JSON
 */
function robustParse(text: string): any {
  try {
    // 1. Try a clean parse first
    return JSON.parse(text);
  } catch (e) {
    console.warn("Initial JSON parse failed, attempting repair:", e);
    
    // 2. If it fails, try to close open brackets/braces manually
    let repaired = text.trim();

    // Count open and close braces/brackets
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;

    // Add missing closing braces
    while (repaired.match(/\{/) && (repaired.match(/\{/g) || []).length > (repaired.match(/\}/g) || []).length) {
      repaired += "}";
    }

    // Add missing closing brackets
    while (repaired.match(/\[/) && (repaired.match(/\[/g) || []).length > (repaired.match(/\]/g) || []).length) {
      repaired += "]";
    }

    try {
      console.warn("Attempting repair with auto-closed braces/brackets");
      return JSON.parse(repaired);
    } catch (repairErr) {
      console.error("Repair attempt failed:", repairErr);
      return null;
    }
  }
}

/**
 * Return fallback recommendations when parsing completely fails
 */
function getFallbackRecommendations(): Array<any> {
  return [
    {
      id: "action-1",
      title: "Optimize Pricing Strategy",
      description: "Review current pricing and implement value-based pricing for high-margin products",
      priority: "high",
      estimatedROI: "3-5% increase",
      completed: false,
    },
    {
      id: "action-2",
      title: "Improve Customer Retention",
      description: "Launch loyalty program to reduce churn and increase repeat purchases",
      priority: "high",
      estimatedROI: "4-6% increase",
      completed: false,
    },
    {
      id: "action-3",
      title: "Cross-sell High-margin Items",
      description: "Train sales team to identify and promote complementary products to existing customers",
      priority: "medium",
      estimatedROI: "2-3% increase",
      completed: false,
    },
  ];
}
