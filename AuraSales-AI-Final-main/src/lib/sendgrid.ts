interface SendSalesAnalysisEmailParams {
  toEmail: string;
  analysisResult: string;
  subject?: string;
  htmlBody?: string;
  textBody?: string;
}

const SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send";
const VERIFIED_SENDER = "itojeogheneyunme@gmail.com";

export async function sendSalesAnalysisEmail({
  toEmail,
  analysisResult,
  subject = "Your Sales Analysis Results",
  htmlBody,
  textBody,
}: SendSalesAnalysisEmailParams): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;

  if (!apiKey) {
    throw new Error("SENDGRID_API_KEY not configured");
  }

  if (!toEmail) {
    throw new Error("Recipient email is required");
  }

  const resolvedTextBody = String(textBody ?? analysisResult ?? "");
  const resolvedHtmlBody =
    htmlBody ||
    `<div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;">
      <h2>Your Sales Analysis Results</h2>
      <p>${resolvedTextBody.replace(/\n/g, "<br/>")}</p>
    </div>`;

  const response = await fetch(SENDGRID_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: toEmail }] }],
      from: { email: VERIFIED_SENDER },
      subject,
      content: [
        { type: "text/plain", value: resolvedTextBody },
        { type: "text/html", value: resolvedHtmlBody },
      ],
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`SendGrid send failed (${response.status}): ${details}`);
  }
}

export const SENDGRID_VERIFIED_SENDER = VERIFIED_SENDER;
