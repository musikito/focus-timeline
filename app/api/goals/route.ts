import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("goals")
    .select("id,title,priority,goal_type,sort_order,created_at")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ goals: data ?? [] });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const title = (body?.title ?? "").trim();
  const goal_type = (body?.goal_type ?? "Work").trim(); // keep required for your schema
  const priority = (body?.priority ?? "m").trim(); // M/m/O

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const { data: existing } = await supabase
    .from("goals")
    .select("sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSort = (existing?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: userId,
      title,
      goal_type,
      priority,
      sort_order: nextSort,
    })
    .select("id,title,priority,goal_type,sort_order,created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ goal: data });
}

// import { NextResponse } from "next/server";
// import { auth } from "@clerk/nextjs/server";
// import { z } from "zod";
// import { supabase } from "@/lib/supabase";

// const GoalCreateSchema = z.object({
//   title: z.string().min(1),
//   goal_type: z.string().min(1), // Work/Health/Learning...
//   priority: z.enum(["M", "m", "O"]).default("m"),
//   target_hours: z.number().min(0).max(168).optional(),
// });

// export async function GET() {
//   const { userId } = await auth();
//   if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   const { data, error } = await supabase
//     .from("goals")
//     .select("id, title, goal_type, priority, sort_order, created_at, target_hours")
//     .eq("user_id", userId)
//     .order("sort_order", { ascending: true })
//     .order("created_at", { ascending: true });

//   if (error) return NextResponse.json({ error: error.message }, { status: 500 });
//   return NextResponse.json({ goals: data ?? [] });
// }

// export async function POST(req: Request) {
//   const { userId } = await auth();
//   if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   const raw = await req.json().catch(() => null);
//   const parsed = GoalCreateSchema.safeParse(raw);
//   if (!parsed.success) {
//     return NextResponse.json(
//       { error: "Invalid payload", issues: parsed.error.issues },
//       { status: 400 }
//     );
//   }

//   const payload = parsed.data;

//   // Ensure sort_order appends to end
//   const { data: last } = await supabase
//     .from("goals")
//     .select("sort_order")
//     .eq("user_id", userId)
//     .order("sort_order", { ascending: false })
//     .limit(1)
//     .maybeSingle();

//   const sort_order = (last?.sort_order ?? 0) + 1;

//   const { data, error } = await supabase
//     .from("goals")
//     .insert({
//       user_id: userId,
//       title: payload.title,
//       goal_type: payload.goal_type,
//       priority: payload.priority,
//       target_hours: payload.target_hours ?? 0,
//       sort_order,
//     })
//     .select("id, title, goal_type, priority, sort_order, created_at, target_hours")
//     .single();

//   if (error) {
//     return NextResponse.json(
//       { error: error.message, details: error.details, hint: error.hint },
//       { status: 500 }
//     );
//   }

//   return NextResponse.json({ goal: data }, { status: 201 });
// }
