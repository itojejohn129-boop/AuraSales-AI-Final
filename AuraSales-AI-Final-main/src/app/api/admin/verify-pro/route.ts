import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isAdminEmail } from "@/lib/accessControl";
import { cookies } from "next/headers";
import { grantManualProUnlimited } from "@/lib/server/credits";

const COOKIE_NAME = "admin_pro_verified";
const ENTERPRISE_COOKIE_NAME = "admin_enterprise_verified";
type VerificationVariant = "pro" | "enterprise";

function normalizeVariant(input: unknown): VerificationVariant {
  return String(input || "pro").toLowerCase() === "enterprise" ? "enterprise" : "pro";
}

function getPasswordForVariant(variant: VerificationVariant): string | undefined {
  return variant === "enterprise" ? process.env.ADMIN_ENTERPRISE_PASSWORD : process.env.ADMIN_PRO_PASSWORD;
}

function getCookieNameForVariant(variant: VerificationVariant): string {
  return variant === "enterprise" ? ENTERPRISE_COOKIE_NAME : COOKIE_NAME;
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email || !isAdminEmail(user.email)) {
      return NextResponse.json({ verified: false }, { status: 200 });
    }

    const { searchParams } = new URL(req.url);
    const variant = normalizeVariant(searchParams.get("variant"));
    const cookieStore = await cookies();
    const verified = cookieStore.get(getCookieNameForVariant(variant))?.value === "1";
    return NextResponse.json({ verified, variant }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json(
      { verified: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const variant = normalizeVariant(body?.variant);
    const adminPassword = getPasswordForVariant(variant);
    if (!adminPassword) {
      return NextResponse.json(
        { error: variant === "enterprise" ? "ADMIN_ENTERPRISE_PASSWORD not configured" : "ADMIN_PRO_PASSWORD not configured" },
        { status: 500 }
      );
    }

    const password = String(body?.password || "");

    if (!password || password !== adminPassword) {
      const fail = NextResponse.json({ error: "Invalid password" }, { status: 401 });
      fail.cookies.set(getCookieNameForVariant(variant), "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 0,
        path: "/",
      });
      return fail;
    }

    // Ensure admin unlock also upgrades backend credits to unlimited Pro.
    await grantManualProUnlimited({
      userId: user.id,
      email: user.email,
    });

    const success = NextResponse.json({ verified: true, variant }, { status: 200 });
    success.cookies.set(getCookieNameForVariant(variant), "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });
    if (variant === "enterprise") {
      success.cookies.set(COOKIE_NAME, "1", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 8,
        path: "/",
      });
    }
    return success;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
