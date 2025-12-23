/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const weekStart = url.searchParams.get("weekStart");
  if (!weekStart) return NextResponse.json({ error: "weekStart is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("time_blocks")
    .select("id,goal_id,title,day_index,start_min,duration_min")
    .eq("user_id", userId)
    .eq("week_start", weekStart);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ blocks: data ?? [] });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const weekStart = body?.weekStart;
  const blocks = body?.blocks;

  if (!weekStart) return NextResponse.json({ error: "weekStart is required" }, { status: 400 });
  if (!Array.isArray(blocks)) return NextResponse.json({ error: "blocks must be an array" }, { status: 400 });

  // Simple MVP approach: replace all blocks for that week.
  const { error: delErr } = await supabase
    .from("time_blocks")
    .delete()
    .eq("user_id", userId)
    .eq("week_start", weekStart);

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  if (blocks.length === 0) return NextResponse.json({ ok: true });

  const rows = blocks.map((b: any) => ({
    user_id: userId,
    week_start: weekStart,
    goal_id: b.goalId,
    title: b.title ?? null,
    day_index: b.dayIndex,
    start_min: b.startMin,
    duration_min: b.durationMin,
  }));

  const { error: insErr } = await supabase.from("time_blocks").insert(rows);
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
