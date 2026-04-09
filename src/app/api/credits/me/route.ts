import { NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/utils/supabase/server";
import { getUserCreditSummary } from "@/lib/server/credits";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const summary = await getUserCreditSummary(user.id, user.email);
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch credits", details: error?.message || "unknown error" },
      { status: 500 }
    );
  }
}
