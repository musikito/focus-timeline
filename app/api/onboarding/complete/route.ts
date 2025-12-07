/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/onboarding/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.error("❌ No userId found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { goals } = await req.json();
    if (!Array.isArray(goals)) {
      return NextResponse.json({ error: "Invalid goals data" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // --- Upsert profile ---
    const { error: profileErr } = await supabase
      .from("profiles")
      .upsert(
        { 
          user_id: userId,
          has_onboarded: true 
        },
        { onConflict: "user_id" }
      );

    if (profileErr) {
      console.error("Profile Upsert Error:", profileErr);
      return NextResponse.json({ error: "Could not save profile" }, { status: 500 });
    }

    // --- Reset goals for this user ---
    await supabase.from("goals").delete().eq("user_id", userId);

    // Insert filtered new goals
    const filteredGoals = goals
      .filter((g: any) => g?.title?.trim())
      .map((g: any, index: number) => ({
        user_id: userId,
        title: g.title.trim(),
        goal_type: g.type === "minor" ? "minor" : "major",
        sort_order: index,
      }));

    if (filteredGoals.length > 0) {
      const { error: goalsErr } = await supabase
        .from("goals")
        .insert(filteredGoals);

      if (goalsErr) {
        console.error("Goals Insert Error:", goalsErr);
        return NextResponse.json({ error: "Could not save goals" }, { status: 500 });
      }
    }

    console.log("🎯 Onboarding saved successfully:", { userId });

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("🔥 Onboarding API Error:", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
