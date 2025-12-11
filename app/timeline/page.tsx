// app/timeline/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import TimelineClient from "./_client";
import dayjs from "dayjs";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const weekStart = dayjs().startOf("week").add(1, "day").startOf("day");
  const weekEnd = weekStart.add(7, "day");

  const { data: goals } = await supabase
    .from("goals")
    .select("id, title, goal_type")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  const { data: plannedBlocks } = await supabase
    .from("planned_blocks")
    .select("id, goal_id, start_time, end_time")
    .eq("user_id", userId);

  const { data: connection } = await supabase
    .from("calendar_connections")
    .select("id")
    .eq("user_id", userId)
    .eq("provider", "google")
    .maybeSingle();

  const { data: actualEvents } = await supabase
    .from("calendar_events")
    .select("id, summary, start_time, end_time")
    .eq("user_id", userId)
    .eq("provider", "google")
    .gte("start_time", weekStart.toISOString())
    .lt("start_time", weekEnd.toISOString())
    .order("start_time", { ascending: true });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold mb-1">Weekly Timeline</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Drag to move sessions, resize from top/bottom. Minimum duration is 1 hour.
        Google Calendar events show as red blocks behind your planned time.
      </p>
      <TimelineClient
        goals={goals ?? []}
        plannedBlocks={plannedBlocks ?? []}
        actualEvents={actualEvents ?? []}
      />
    </div>
  );
}
