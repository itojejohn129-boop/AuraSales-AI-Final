import { NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/utils/supabase/server";
import { grantInitialFreeCredits } from "@/lib/server/credits";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const summary = await grantInitialFreeCredits(user.id, user.email);
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to initialize free credits", details: error?.message || "unknown error" },
      { status: 500 }
    );
  }
}
