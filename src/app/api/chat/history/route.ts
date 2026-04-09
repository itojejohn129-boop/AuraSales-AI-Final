import { NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const companyId = (user.user_metadata && user.user_metadata.company_id) || (user?.app_metadata?.company_id as string) || null;
    if (!companyId) return NextResponse.json({ messages: [] });

    const { data: history, error } = await supabase
      .from("chat_messages")
      .select("role,content,created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(6 as any);

    if (error) {
      console.error("Failed to fetch chat history:", error);
      return NextResponse.json({ messages: [] });
    }

    const messages = (history || []).reverse().map((h: any) => ({ role: h.role, content: h.content, created_at: h.created_at }));
    return NextResponse.json({ messages });
  } catch (e) {
    console.error("chat history error:", e);
    return NextResponse.json({ messages: [] });
  }
}
