import { NextResponse } from "next/server";
import { consumeUploadCredit } from "@/lib/server/credits";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Missing Authorization token" }, { status: 401 });
    }

    const userRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "")}/auth/v1/user`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
      } as HeadersInit,
    });

    if (!userRes.ok) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    const user = await userRes.json();
    if (!user?.id) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    const creditCheck = await consumeUploadCredit(user.id, user.email);
    if (!creditCheck.allowed) {
      return NextResponse.json(
        { error: "You have reached your free upload credit limit." },
        { status: 402 }
      );
    }

    return NextResponse.json({ success: true, summary: creditCheck.summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: "Failed to consume upload credit", details: message }, { status: 500 });
  }
}
