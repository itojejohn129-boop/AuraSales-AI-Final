import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { applyPaidPlanFromCheckout, findUserIdByEmail } from "@/lib/server/credits";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured" },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeSecretKey);
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  try {
    const body = await request.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      let userId =
        session.client_reference_id ||
        session.metadata?.user_id ||
        null;

      const email =
        session.customer_details?.email ||
        session.customer_email ||
        null;

      if (!userId && email) {
        userId = await findUserIdByEmail(email);
      }

      if (userId) {
        await applyPaidPlanFromCheckout({
          userId,
          email,
          customerId: typeof session.customer === "string" ? session.customer : null,
          subscriptionId:
            typeof session.subscription === "string" ? session.subscription : null,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Invalid Stripe webhook", details: error?.message || "unknown error" },
      { status: 400 }
    );
  }
}
