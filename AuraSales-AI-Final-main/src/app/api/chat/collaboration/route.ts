import { NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  ChatCollaborationRequest,
  AuraAnalystResponse,
} from "@/types/comments";
import { createClient as createSupabaseServerClient } from "@/utils/supabase/server";
import { consumeAiCredit } from "@/lib/server/credits";

/**
 * POST /api/chat/collaboration
 * Aura AI as a collaborative analyst in war room discussions
 */

export async function POST(req: Request) {
  try {
    const body: ChatCollaborationRequest = await req.json();
    const {
      comment_text,
      chart_context,
      chart_data,
      user_name,
      previous_messages = [],
    } = body;

    if (!comment_text) {
      return NextResponse.json(
        { error: "comment_text is required" },
        { status: 400 }
      );
    }

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

    // Build context string from chart data
    const dataContext = chart_data
      ? Object.entries(chart_data)
          .slice(0, 10) // Limit to top 10 entries
          .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
          .join("\n")
      : "No chart data provided";

    // Build the system prompt
    const systemPrompt = `You are Aura, a collaborative business analyst sitting in a team war room. 

A team member has tagged you in a discussion regarding: ${chart_context}

TEAM MEMBER: ${user_name}

Their Question/Comment: "${comment_text}"

AVAILABLE DATA:
${dataContext}

Your Response Guidelines:
1. Be concise and professional (2-4 sentences max)
2. Reference specific data points from the context above
3. Provide actionable insights or clarifications
4. Avoid speculation; use only provided data
5. If data is insufficient, clearly state that
6. Maintain a collaborative, helpful tone
7. Format your response as clear, direct advice

Remember: This is a real-time war room discussion. Be direct and data-backed.`;

    // Try Gemini first, fallback to HuggingFace
    let analysisResponse = null;

    try {
      const geminiApiKey = process.env.GOOGLE_API_KEY;
      if (geminiApiKey) {
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent(systemPrompt);
        analysisResponse = result.response.text();
      }
    } catch (geminiError) {
      console.warn("Gemini API failed, trying HuggingFace:", geminiError);
    }

    // Fallback to HuggingFace
    if (!analysisResponse) {
      const hfApiKey = process.env.HUGGINGFACE_API_KEY;
      if (hfApiKey) {
        const hfClient = new HfInference(hfApiKey);

        try {
          const messages: Array<{
            role: "user" | "assistant";
            content: string;
          }> = [
            ...previous_messages,
            { role: "user", content: systemPrompt },
          ];

          const response = await hfClient.chatCompletion({
            model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
            messages,
            max_tokens: 200,
            temperature: 0.7,
          });

          analysisResponse = response.choices[0]?.message?.content || "";
        } catch (hfError) {
          console.warn("HuggingFace API failed:", hfError);
          analysisResponse =
            "I encountered a technical issue while analyzing your question. Please try again in a moment.";
        }
      }
    }

    if (!analysisResponse) {
      return NextResponse.json(
        {
          error: "No AI service available",
          message:
            "Both Gemini and HuggingFace APIs are unavailable. Check environment variables.",
        },
        { status: 503 }
      );
    }

    // Calculate confidence based on data quality
    const hasData = chart_data && Object.keys(chart_data).length > 0;
    const confidence = hasData ? 0.85 : 0.6;

    const response: AuraAnalystResponse = {
      response: analysisResponse.trim(),
      context_used: [chart_context, ...(chart_data ? Object.keys(chart_data) : [])],
      confidence_score: confidence,
      data_summary: hasData
        ? `Analysis based on ${Object.keys(chart_data).length} data points`
        : "Limited data available",
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Collaboration API error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate analysis",
        details: error.message,
        response:
          "I apologize, but I encountered an error analyzing this discussion. Please try again.",
        confidence_score: 0,
      },
      { status: 500 }
    );
  }
}
