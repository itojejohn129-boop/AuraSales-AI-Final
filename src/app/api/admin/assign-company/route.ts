import { NextResponse } from "next/server";
import createAdminClient from "@/utils/supabase/admin";

export async function POST(req: Request) {
  try {
    const { userId, companyName, monthlySalesVolume } = await req.json();

    if (!userId || !companyName) {
      return NextResponse.json({ error: "userId and companyName are required" }, { status: 400 });
    }

    const admin = await createAdminClient();

    // Create company row
    try {
      const { data: company, error: compErr } = await admin
        .from("companies")
        .insert([{ name: companyName }])
        .select("id")
        .single();

      if (compErr) {
        console.error("Failed to create company:", compErr);
        return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
      }

      const companyId = company.id;

      // Update the user via admin auth API to set app_metadata.company_id
      try {
        const { data, error } = await (admin.auth as any).admin.updateUserById(userId, {
          app_metadata: { company_id: companyId },
        });

        if (error) {
          console.error("Failed to update user app_metadata:", error);
          return NextResponse.json({ error: "Failed to update user metadata" }, { status: 500 });
        }

        // Optionally, write the monthlySalesVolume to a company metadata table or csv_uploads; omitted here

        return NextResponse.json({ success: true, companyId });
      } catch (err) {
        console.error("Admin updateUserById error:", err);
        return NextResponse.json({ error: "Failed to update user via admin client" }, { status: 500 });
      }
    } catch (err) {
      console.error("Company creation error:", err);
      return NextResponse.json({ error: "Company creation failed" }, { status: 500 });
    }
  } catch (e: any) {
    console.error("assign-company route error:", e);
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}
