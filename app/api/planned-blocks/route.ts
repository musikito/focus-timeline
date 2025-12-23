import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

const SaveSchema = z.array(
  z.object({
    id: z.string().optional(),
    goalId: z.string(),
    startTime: z.string(),
    endTime: z.string(),
  })
);

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("planned_blocks")
    .select("id, goal_id, start_time, end_time")
    .eq("user_id", userId);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load blocks" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = SaveSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Delete existing blocks for clean overwrite (MVP-safe)
  await supabase.from("planned_blocks").delete().eq("user_id", userId);

  const inserts = parsed.data.map((b) => ({
    user_id: userId,
    goal_id: b.goalId,
    start_time: b.startTime,
    end_time: b.endTime,
  }));

  const { error } = await supabase.from("planned_blocks").insert(inserts);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save blocks" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
