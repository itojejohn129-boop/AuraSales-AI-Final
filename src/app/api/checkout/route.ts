import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createSupabaseServerClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

function getBaseUrl(request: NextRequest) {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL;

  if (!configured) {
    return request.nextUrl.origin;
  }

  if (configured.startsWith("http://") || configured.startsWith("https://")) {
    return configured;
  }

  return `https://${configured}`;
}

export async function POST(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "STRIPE_SECRET_KEY is missing" },
        { status: 500 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const priceId = String(body?.priceId || "").trim();

    if (!priceId) {
      return NextResponse.json({ error: "priceId is required" }, { status: 400 });
    }

    const stripe = new Stripe(stripeSecretKey);

    const price = await stripe.prices.retrieve(priceId);
    const mode: Stripe.Checkout.SessionCreateParams.Mode =
      price.type === "recurring" ? "subscription" : "payment";

    const baseUrl = getBaseUrl(request);

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?payment=success`,
      cancel_url: `${baseUrl}/pricing?payment=cancelled`,
      client_reference_id: user.id,
      customer_email: user.email || undefined,
      metadata: {
        user_id: user.id,
      },
      subscription_data:
        mode === "subscription"
          ? {
              metadata: {
                user_id: user.id,
              },
            }
          : undefined,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Checkout initialization failed", details: error?.message || "unknown error" },
      { status: 500 }
    );
  }
}
