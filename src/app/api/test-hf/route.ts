import { NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";

// You can switch between models as needed
const MODEL_ID = "mistralai/Mistral-7B-Instruct-v0.2";

/**
 * Test route to validate Hugging Face API connectivity
 * GET /api/test-hf
 * 
 * Returns:
 * - { status: "success", message: "HF API success", data: {...} }
 * - { status: "cold_start", message: "HF API cold start (model loading)" }
 * - { status: "error", message: "HF API error: ..." }
 */
export async function GET(req: Request) {
  try {
    const hfApiKey = process.env.HUGGINGFACE_API_KEY;
    
    if (!hfApiKey) {
      return NextResponse.json(
        { status: "error", message: "HF API key not configured" },
        { status: 500 }
      );
    }

    // Initialize client with just the API key (no custom base URL)
    const hfClient = new HfInference(hfApiKey);

    const startTime = Date.now();
    let response: any;

    try {
      // Always use chatCompletion for mistralai/Mistral-7B-Instruct-v0.2
      response = await Promise.race([
        hfClient.chatCompletion({
          model: MODEL_ID,
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: "Hello!" }
          ],
          max_tokens: 100,
          temperature: 0.7,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout (30s)")), 30000))
      ]);
    } catch (hfError: any) {
      // Check for 503 Service Unavailable (model loading)
      if (hfError?.response?.status === 503 || hfError?.message?.includes("503")) {
        return NextResponse.json(
          { 
            status: "cold_start", 
            message: "HF API cold start (model loading)",
            details: "Model is loading. This is normal on first request or after extended idle period."
          },
          { status: 503 }
        );
      }
      throw hfError;
    }

    const elapsed = Date.now() - startTime;

    // Validate response structure (supports reasoning_content fallback for DeepSeek)
    let aiContent = "";
    const messageObject = response?.choices?.[0]?.message;
    if (messageObject) {
      // Priority 1: Use actual content
      // Priority 2: Use reasoning_content if content is null/empty
      aiContent = messageObject.content || messageObject.reasoning_content || "";
    } else if (Array.isArray(response) && response[0]?.generated_text) {
      aiContent = response[0].generated_text;
    } else if (response?.generated_text) {
      aiContent = response.generated_text;
    }

    // Clean up reasoning tags
    if (aiContent && typeof aiContent === 'string') {
      aiContent = aiContent.replace(/[\s\S]*?<\/think>/g, '').trim();
    }

    // Validate content exists
    if (!aiContent) {
      throw new Error("Could not extract text from model response.");
    }

    return NextResponse.json(
      {
        status: "success",
        message: "HF API success",
        data: {
          elapsed,
          contentLength: aiContent.length,
          preview: aiContent.substring(0, 100),
          fullResponse: aiContent
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    const errorDetails = error?.message || JSON.stringify(error);

    return NextResponse.json(
      {
        status: "error",
        message: `HF API error: ${errorDetails}`,
        details: {
          code: error?.code,
          statusCode: error?.response?.status,
          errorMessage: error?.message
        }
      },
      { status: error?.response?.status || 500 }
    );
  }
}

/**
 * POST endpoint for manual testing with custom messages
 * Body: { message: string }
 */
export async function POST(req: Request) {
  try {
    const { message = "Hello" } = await req.json();
    const testReq = new Request(new URL(req.url).toString(), { method: "GET" });
    return GET(testReq);
  } catch {
    return NextResponse.json(
      { status: "error", message: "Invalid request body" },
      { status: 400 }
    );
  }
}
