// app/api/goals/update-order/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { goals } = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  for (const goal of goals) {
    await supabase
      .from("goals")
      .update({ sort_order: goal.sort_order })
      .eq("id", goal.id)
      .eq("user_id", userId);
  }

  return NextResponse.json({ success: true });
}
