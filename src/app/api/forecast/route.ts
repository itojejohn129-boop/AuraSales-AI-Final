import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { calculateForecast, SalesRecord } from "@/lib/ml-engine";

interface ForecastRequest {
  historicalData: SalesRecord[];
}

interface ForecastInsight {
  risk: string;
  opportunity: string;
  confidenceScore: number;
}

function buildFallbackInsight(forecastData: {
  historicalAverage: number;
  forecastAverage: number;
  slope: number;
  confidence: number;
}): ForecastInsight {
  const confidenceScore = Math.round(forecastData.confidence * 100);

  if (forecastData.slope > 0) {
    return {
      risk:
        "Revenue is trending upward, so the main risk is operational strain if inventory, staffing, or fulfillment cannot keep pace with demand.",
      opportunity:
        "This growth trend is a strong opportunity to expand high-performing offers, increase upsells, and scale marketing into the best-converting segments.",
      confidenceScore,
    };
  }

  if (forecastData.slope < 0) {
    return {
      risk:
        "Revenue is trending downward, so the key risk is losing momentum in your strongest segments unless pricing, retention, or campaign strategy is adjusted quickly.",
      opportunity:
        "Use this period to identify the best products, regions, or customer segments, then tighten promotions and re-engagement efforts around them.",
      confidenceScore,
    };
  }

  return {
    risk:
      "Revenue is stable, which reduces immediate volatility but can also signal stalled growth if no new demand drivers are introduced.",
    opportunity:
      "Stable performance is a good base for testing bundles, upsells, and new campaigns to unlock the next growth phase.",
    confidenceScore,
  };
}

/**
 * POST /api/forecast
 * Calculates 90-day revenue forecast using linear regression
 * and generates AI-powered insights using Gemini
 */
export async function POST(req: Request) {
  try {
    const { historicalData } = (await req.json()) as ForecastRequest;

    if (!historicalData || !Array.isArray(historicalData) || historicalData.length === 0) {
      return NextResponse.json(
        { error: "Historical data is required and must be a non-empty array" },
        { status: 400 }
      );
    }

    // Sort data by date
    const sortedData = [...historicalData].sort(
      (a, b) => new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime()
    );

    // Calculate forecast
    const forecastData = calculateForecast(sortedData, 6, 90);

    // Generate AI insights using Gemini
    let aiInsight: ForecastInsight | null = null;

    const geminiApiKey = process.env.GOOGLE_API_KEY;
    if (geminiApiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are a Financial Analyst. Based on the following 3-month revenue forecast data:

Historical Average Revenue: $${forecastData.historicalAverage.toLocaleString(undefined, { maximumFractionDigits: 0 })}
3-Month Forecast Average: $${forecastData.forecastAverage.toLocaleString(undefined, { maximumFractionDigits: 0 })}
Forecast Trend: ${forecastData.slope > 0 ? "Upward" : forecastData.slope < 0 ? "Downward" : "Stable"}
Slope: ${forecastData.slope.toFixed(2)}
R² Confidence: ${(forecastData.confidence * 100).toFixed(0)}%

Identify:
1. ONE major risk (e.g., inventory stockout, market saturation, competition)
2. ONE major opportunity (e.g., scale marketing, expand to new regions, premium tier)

Respond in this exact format:
RISK: [Your risk analysis in 1-2 sentences]
OPPORTUNITY: [Your opportunity analysis in 1-2 sentences]

Be specific and data-driven. Make it actionable for a sales leader.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse response
        const riskStart = responseText.indexOf("RISK:");
        const opportunityStart = responseText.indexOf("OPPORTUNITY:");
        
        let risk = "Unable to parse risk analysis";
        let opportunity = "Unable to parse opportunity analysis";

        if (riskStart !== -1 && opportunityStart !== -1) {
          risk = responseText.substring(riskStart + 5, opportunityStart).trim();
          opportunity = responseText.substring(opportunityStart + 12).trim();
        }

        if (risk && opportunity) {
          aiInsight = {
            risk: risk.substring(0, 500), // Limit to 500 chars
            opportunity: opportunity.substring(0, 500), // Limit to 500 chars
            confidenceScore: Math.round(forecastData.confidence * 100),
          };
        }
      } catch (error) {
        console.warn("AI insight generation failed:", error);
        aiInsight = buildFallbackInsight(forecastData);
      }
    }

    if (!aiInsight) {
      aiInsight = buildFallbackInsight(forecastData);
    }

    return NextResponse.json({
      historicalPoints: forecastData.historicalPoints,
      forecastPoints: forecastData.forecastPoints,
      slope: forecastData.slope,
      intercept: forecastData.intercept,
      confidence: forecastData.confidence,
      historicalAverage: Math.round(forecastData.historicalAverage),
      forecastAverage: Math.round(forecastData.forecastAverage),
      aiInsight,
    });
  } catch (error: unknown) {
    console.error("Forecast calculation error:", error);
    const message = error instanceof Error ? error.message : "Unknown forecast error";
    return NextResponse.json(
      { error: "Failed to calculate forecast", details: message },
      { status: 500 }
    );
  }
}
