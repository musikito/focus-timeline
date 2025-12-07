// app/api/blocks/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, start_time, end_time } = body;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from("planned_blocks")
    .update({
      start_time,
      end_time,
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("planned_blocks update error:", error);
    return NextResponse.json(
      { error: "Failed to update block" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
