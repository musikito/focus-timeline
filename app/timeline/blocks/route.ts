// app/api/timeline/blocks/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json([], { status: 401 });

  const { data, error } = await supabase
    .from("timeline_blocks")
    .select(`
      id,
      day_of_week,
      start_min,
      duration_min,
      goals (
        id,
        title,
        priority
      )
    `)
    .eq("user_id", userId);

  if (error) {
    console.error(error);
    return NextResponse.json([], { status: 500 });
  }

  return NextResponse.json(data);
}
