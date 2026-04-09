import { NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

if (!HF_API_KEY) {
  throw new Error("HUGGINGFACE_API_KEY must be set in environment");
}

const client = new HfInference(HF_API_KEY);

export interface SentimentScore {
  text: string;
  score: number; // 0-100
  label: "Positive" | "Negative" | "Neutral";
}

export interface SentimentBatchResponse {
  scores: SentimentScore[];
  averageScore: number;
  totalProcessed: number;
  error?: string;
}

/**
 * Analyzes sentiment of feedback text using Llama 3-8B
 * Supports batch processing (up to 50 entries per request)
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json(
        { error: "Missing Authorization token" },
        { status: 401 }
      );
    }

    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const feedbackBatch: string[] = body.feedback || [];

    if (!Array.isArray(feedbackBatch) || feedbackBatch.length === 0) {
      return NextResponse.json(
        { error: "No feedback to analyze" },
        { status: 400 }
      );
    }

    // Limit to 50 entries per batch for performance
    if (feedbackBatch.length > 50) {
      return NextResponse.json(
        {
          error: "Maximum 50 feedback entries per request. Received: " + feedbackBatch.length,
        },
        { status: 400 }
      );
    }

    // Filter empty feedback
    const validFeedback = feedbackBatch.filter(
      (f) => typeof f === "string" && f.trim().length > 0
    );

    if (validFeedback.length === 0) {
      return NextResponse.json(
        { error: "No valid feedback to analyze" },
        { status: 400 }
      );
    }

    const scores: SentimentScore[] = [];

    // Process feedback through Llama 3-8B via HuggingFace
    for (const feedback of validFeedback) {
      try {
        const systemPrompt = `Analyze this customer feedback. Return ONLY a valid JSON object (no markdown, no extra text): { "score": 0-100, "label": "Positive|Negative|Neutral" }. 0 is furious, 50 is neutral, 100 is ecstatic.`;

        const response = await client.textGeneration({
          model: "meta-llama/Llama-3-8b-chat-hf",
          inputs: `${systemPrompt}\n\nFeedback: "${feedback}"`,
          parameters: {
            max_new_tokens: 50,
            temperature: 0.3,
            top_p: 0.9,
          },
        });

        // Extract JSON from response
        let jsonStr = response.generated_text || "";

        // Remove any markdown code blocks
        jsonStr = jsonStr
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();

        // Try to find JSON object
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON found in response");
        }

        const result = JSON.parse(jsonMatch[0]);
        const score = Math.max(0, Math.min(100, parseInt(result.score) || 50));
        const label = ["Positive", "Negative", "Neutral"].includes(result.label)
          ? result.label
          : score >= 61
            ? "Positive"
            : score <= 40
              ? "Negative"
              : "Neutral";

        scores.push({
          text: feedback,
          score,
          label: label as "Positive" | "Negative" | "Neutral",
        });
      } catch (err) {
        console.error("Error analyzing feedback:", err, feedback);
        // Assign neutral sentiment on error
        scores.push({
          text: feedback,
          score: 50,
          label: "Neutral",
        });
      }
    }

    const averageScore =
      scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
        : 0;

    const response: SentimentBatchResponse = {
      scores,
      averageScore,
      totalProcessed: scores.length,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err: any) {
    console.error("Sentiment analysis error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to analyze sentiment" },
      { status: 500 }
    );
  }
}
