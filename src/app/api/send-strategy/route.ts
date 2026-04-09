import { NextResponse } from "next/server";
import { render } from "@react-email/render";
import { StrategyMemo } from "@/components/email/StrategyMemo";
import { sendSalesAnalysisEmail, SENDGRID_VERIFIED_SENDER } from "@/lib/sendgrid";
import { getDashboardLocaleCopy } from "@/lib/i18n/dashboardCopy";

type StrategyAction = {
  title?: string;
  description?: string;
  priority?: string;
  estimatedROI?: string;
};

async function translateTexts(req: Request, locale: string, texts: string[]): Promise<string[]> {
  const normalizedLocale = String(locale || "en").trim().toLowerCase();
  if (!texts.length || normalizedLocale.startsWith("en")) return texts;

  try {
    const response = await fetch(new URL("/api/translate", req.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetLanguage: locale, texts }),
    });
    const data = await response.json().catch(() => ({}));
    const translations = Array.isArray(data?.translations) ? data.translations.map((value: unknown) => String(value || "")) : [];
    if (!response.ok || translations.length !== texts.length) return texts;
    return translations.map((value: string, index: number) => value || texts[index] || "");
  } catch {
    return texts;
  }
}

export async function POST(req: Request) {
  try {
    const { toEmail, actions, executiveSummary, businessName, subject, locale } = await req.json();
    const resolvedLocale = typeof locale === "string" && locale.trim() ? locale.trim() : "en";
    const localeCopy = getDashboardLocaleCopy(resolvedLocale);

    if (!toEmail) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    if (!actions || actions.length === 0) {
      return NextResponse.json({ error: "Actions are required" }, { status: 400 });
    }

    if (!executiveSummary) {
      return NextResponse.json({ error: "Executive summary is required" }, { status: 400 });
    }

    if (!process.env.SENDGRID_API_KEY) {
      return NextResponse.json({ error: "SENDGRID_API_KEY not configured" }, { status: 500 });
    }

    const formattedActions = (actions as StrategyAction[]).map((action) => ({
      title: action.title || "Untitled Action",
      description: action.description || "",
      priority: action.priority || "medium",
      estimatedROI: action.estimatedROI || "TBD",
    }));

    let cleanSummary = String(executiveSummary);
    cleanSummary = cleanSummary.replace(/â‚¦/g, "NGN");

    const translatedTexts = await translateTexts(
      req,
      resolvedLocale,
      [cleanSummary, ...formattedActions.flatMap((action) => [action.title, action.description])]
    );

    const localizedSummary = translatedTexts[0] || cleanSummary;
    const localizedActions = formattedActions.map((action, index) => ({
      ...action,
      title: translatedTexts[1 + index * 2] || action.title,
      description: translatedTexts[1 + index * 2 + 1] || action.description,
    }));

    const emailHtml = await render(
      StrategyMemo({
        executiveSummary: localizedSummary,
        actions: localizedActions,
        businessName: businessName || "AuraSales",
        generatedAt: new Intl.DateTimeFormat(resolvedLocale, {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(new Date()),
        locale: resolvedLocale,
      })
    );

    await sendSalesAnalysisEmail({
      toEmail,
      analysisResult: localizedSummary,
      subject: subject || localeCopy.pdf.executiveSalesAnalysis,
      htmlBody: emailHtml,
      textBody: localizedSummary,
    });

    return NextResponse.json({
      success: true,
      message: "Strategy memo sent successfully",
      sender: SENDGRID_VERIFIED_SENDER,
      htmlPreviewLength: emailHtml.length,
    });
  } catch (error: unknown) {
    console.error("Send strategy error:", error);
    return NextResponse.json(
      {
        error: "Failed to send email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
