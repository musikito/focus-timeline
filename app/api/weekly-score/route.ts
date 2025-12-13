import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import dayjs from "dayjs";

/* ------------------ Types ------------------ */

type GoalRow = {
  id: string;
  title: string;
  priority: "M" | "m" | "O";
};

type PlannedBlock = {
  goal_id: string;
  start_time: string;
  end_time: string;
};

type CalendarEvent = {
  start_time: string;
  end_time: string;
};

/* ------------------ Helpers ------------------ */

// Overlap in minutes between two time ranges
function overlapMinutes(
  aStart: dayjs.Dayjs,
  aEnd: dayjs.Dayjs,
  bStart: dayjs.Dayjs,
  bEnd: dayjs.Dayjs
): number {
  const start = aStart.isAfter(bStart) ? aStart : bStart;
  const end = aEnd.isBefore(bEnd) ? aEnd : bEnd;
  return Math.max(end.diff(start, "minute"), 0);
}

// Priority weight
function priorityWeight(priority: "M" | "m" | "O"): number {
  switch (priority) {
    case "M":
      return 2;
    case "O":
      return 0.5;
    case "m":
    default:
      return 1;
  }
}

// Attempt-based scoring curve (humane)
function scoreFromAttemptRatio(ratio: number): number {
  if (ratio >= 0.6) return 100;
  if (ratio >= 0.4) return 75;
  if (ratio >= 0.2) return 50;
  if (ratio > 0) return 30;
  return 0;
}

/* ------------------ Route ------------------ */

export async function GET(_req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  /* ---------- Week window (Mon → Sun) ---------- */
  const weekStart = dayjs().startOf("week").add(1, "day").startOf("day");
  const weekEnd = weekStart.add(7, "day");

  /* ---------- Load goals ---------- */
  const { data: goalsData } = await supabase
    .from("goals")
    .select("id, title, priority")
    .eq("user_id", userId);

  const goals: GoalRow[] = goalsData ?? [];

  /* ---------- Load planned blocks ---------- */
  const { data: blocksData } = await supabase
    .from("planned_blocks")
    .select("goal_id, start_time, end_time")
    .eq("user_id", userId)
    .gte("start_time", weekStart.toISOString())
    .lt("start_time", weekEnd.toISOString());

  const blocks: PlannedBlock[] = blocksData ?? [];

  /* ---------- Load calendar events ---------- */
  const { data: eventsData } = await supabase
    .from("calendar_events")
    .select("start_time, end_time")
    .eq("user_id", userId)
    .eq("provider", "google")
    .gte("start_time", weekStart.toISOString())
    .lt("start_time", weekEnd.toISOString());

  const events: CalendarEvent[] = eventsData ?? [];

  /* ---------- Early exit ---------- */
  if (blocks.length === 0) {
    return NextResponse.json({
      focusScore: 0,
      xpEarned: 0,
      totalPlannedHours: 0,
      totalMatchedHours: 0,
      currentStreak: 0,
      longestStreak: 0,
      xpTotal: 0,
      weekStart: weekStart.format("YYYY-MM-DD"),
      weekLabel: `${weekStart.format("MMM D")} – ${weekEnd
        .subtract(1, "day")
        .format("MMM D")}`,
      perGoal: [],
      message:
        "No planned blocks found for this week. Create sessions on the timeline to start tracking your focus.",
    });
  }

  /* ---------- Aggregate per goal ---------- */
  const goalMap: Record<
    string,
    {
      title: string;
      priority: "M" | "m" | "O";
      plannedMinutes: number;
      matchedMinutes: number;
    }
  > = {};

  goals.forEach((g) => {
    goalMap[g.id] = {
      title: g.title,
      priority: g.priority ?? "m",
      plannedMinutes: 0,
      matchedMinutes: 0,
    };
  });

  const eventTimes = events.map((e) => ({
    start: dayjs(e.start_time),
    end: dayjs(e.end_time),
  }));

  blocks.forEach((block) => {
    const goal = goalMap[block.goal_id];
    if (!goal) return;

    const bStart = dayjs(block.start_time);
    const bEnd = dayjs(block.end_time);
    const planned = bEnd.diff(bStart, "minute");
    if (planned <= 0) return;

    goal.plannedMinutes += planned;

    let matched = 0;
    eventTimes.forEach((ev) => {
      matched += overlapMinutes(bStart, bEnd, ev.start, ev.end);
    });

    goal.matchedMinutes += Math.min(matched, planned);
  });

  /* ---------- Compute score ---------- */
  let weightedSum = 0;
  let weightedMax = 0;
  let totalPlannedMinutes = 0;
  let totalMatchedMinutes = 0;

  const perGoal = Object.entries(goalMap)
    .filter(([, g]) => g.plannedMinutes > 0) // ✅ remove empty goals
    .map(([goalId, g]) => {
      totalPlannedMinutes += g.plannedMinutes;
      totalMatchedMinutes += g.matchedMinutes;

      const ratio = g.matchedMinutes / g.plannedMinutes;
      const score = scoreFromAttemptRatio(ratio);
      const weight = priorityWeight(g.priority);

      weightedSum += score * weight;
      weightedMax += 100 * weight;

      return {
        goalId,
        title: g.title,
        priority: g.priority,
        plannedHours: +(g.plannedMinutes / 60).toFixed(1),
        actualHours: +(g.matchedMinutes / 60).toFixed(1),
        matchPercent: score,
      };
    });

  const focusScore =
    weightedMax > 0 ? Math.round((weightedSum / weightedMax) * 100) : 0;

  /* ---------- XP ---------- */
  let xpEarned = Math.round(focusScore * 1.2);
  if (focusScore >= 80) xpEarned += 20;
  if (focusScore >= 90) xpEarned += 30;

  /* ---------- Streak ---------- */
  const threshold = 70;
  const weekKey = weekStart.format("YYYY-MM-DD");

  const { data: lastSummary } = await supabase
    .from("weekly_summaries")
    .select("week_start_date, focus_score, streak")
    .eq("user_id", userId)
    .lt("week_start_date", weekKey)
    .order("week_start_date", { ascending: false })
    .limit(1);

  let currentStreak = 0;
  if (focusScore >= threshold) {
    if (
      lastSummary &&
      lastSummary[0] &&
      dayjs(weekStart).diff(dayjs(lastSummary[0].week_start_date), "day") === 7 &&
      lastSummary[0].focus_score >= threshold
    ) {
      currentStreak = lastSummary[0].streak + 1;
    } else {
      currentStreak = 1;
    }
  }

  /* ---------- Store summary ---------- */
  await supabase.from("weekly_summaries").upsert(
    {
      user_id: userId,
      week_start_date: weekKey,
      focus_score: focusScore,
      xp_earned: xpEarned,
      total_planned_minutes: totalPlannedMinutes,
      total_matched_minutes: totalMatchedMinutes,
      streak: currentStreak,
      details: { perGoal },
    },
    { onConflict: "user_id,week_start_date" } 
  );

  /* ---------- XP total + level ---------- */
  const { data: xpRows } = await supabase
    .from("weekly_summaries")
    .select("xp_earned, streak");

  let xpTotal = 0;
  let longestStreak = 0;

  xpRows?.forEach((r) => {
    xpTotal += r.xp_earned ?? 0;
    longestStreak = Math.max(longestStreak, r.streak ?? 0);
  });

  const level = Math.max(1, Math.floor(xpTotal / 100) + 1);

  await supabase
    .from("profiles")
    .update({ xp: xpTotal, level })
    .eq("user_id", userId);

  /* ---------- Response ---------- */
  return NextResponse.json({
    focusScore,
    xpEarned,
    totalPlannedHours: +(totalPlannedMinutes / 60).toFixed(1),
    totalMatchedHours: +(totalMatchedMinutes / 60).toFixed(1),
    currentStreak,
    longestStreak,
    xpTotal,
    weekStart: weekKey,
    weekLabel: `${weekStart.format("MMM D")} – ${weekEnd
      .subtract(1, "day")
      .format("MMM D")}`,
    perGoal,
  });
}
