import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import dayjs from "dayjs";

type GoalRow = {
  id: string;
  title: string;
  priority: string | null;
};

type BlockRow = {
  id: string;
  goal_id: string;
  start_time: string;
  end_time: string;
};

type EventRow = {
  id: string;
  start_time: string;
  end_time: string;
};

function overlapMinutes(
  aStart: dayjs.Dayjs,
  aEnd: dayjs.Dayjs,
  bStart: dayjs.Dayjs,
  bEnd: dayjs.Dayjs
): number {
  const start = aStart.isAfter(bStart) ? aStart : bStart;
  const end = aEnd.isBefore(bEnd) ? aEnd : bEnd;
  const diff = end.diff(start, "minute");
  return diff > 0 ? diff : 0;
}

function priorityWeight(priority: string | null): number {
  switch (priority) {
    case "M": // Major
      return 2;
    case "O": // Optional
      return 0.5;
    case "m": // Minor
    default:
      return 1;
  }
}

export async function GET(_req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Week window: Monday 00:00 -> next Monday 00:00
  const weekStart = dayjs().startOf("week").add(1, "day").startOf("day");
  const weekEnd = weekStart.add(7, "day");

  // 1) Load goals for this user
  const { data: goalsData, error: goalsError } = await supabase
    .from("goals")
    .select("id, title, priority")
    .eq("user_id", userId);

  if (goalsError) {
    console.error("goalsError", goalsError);
    return NextResponse.json(
      { error: "Failed to load goals" },
      { status: 500 }
    );
  }

  const goals = (goalsData ?? []) as GoalRow[];

  // 2) Load planned blocks this week
  const { data: blocksData, error: blocksError } = await supabase
    .from("planned_blocks")
    .select("id, goal_id, start_time, end_time")
    .eq("user_id", userId)
    .gte("start_time", weekStart.toISOString())
    .lt("start_time", weekEnd.toISOString());

  if (blocksError) {
    console.error("blocksError", blocksError);
    return NextResponse.json(
      { error: "Failed to load planned blocks" },
      { status: 500 }
    );
  }

  const blocks = (blocksData ?? []) as BlockRow[];

  // 3) Load actual calendar events
  const { data: eventsData, error: eventsError } = await supabase
    .from("calendar_events")
    .select("id, start_time, end_time")
    .eq("user_id", userId)
    .eq("provider", "google")
    .gte("start_time", weekStart.toISOString())
    .lt("start_time", weekEnd.toISOString());

  if (eventsError) {
    console.error("eventsError", eventsError);
    return NextResponse.json(
      { error: "Failed to load calendar events" },
      { status: 500 }
    );
  }

  const events = (eventsData ?? []) as EventRow[];

  const totalSlotsMinutes = 60; // not used, but here if needed

  // If nothing is planned, we still return a friendly result
  if (!goals.length || !blocks.length) {
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

  // Build per-goal accumulator
  const perGoalMap: Record<
    string,
    {
      goalId: string;
      title: string;
      priority: string;
      plannedMinutes: number;
      matchedMinutes: number;
    }
  > = {};

  for (const g of goals) {
    perGoalMap[g.id] = {
      goalId: g.id,
      title: g.title,
      priority: g.priority ?? "m",
      plannedMinutes: 0,
      matchedMinutes: 0,
    };
  }

  const eventsAsDayjs = events.map((ev) => ({
    ...ev,
    start: dayjs(ev.start_time),
    end: dayjs(ev.end_time),
  }));

  // For each planned block, measure alignment with any actual event
  for (const block of blocks) {
    const g = perGoalMap[block.goal_id];
    if (!g) continue;

    const s = dayjs(block.start_time);
    const e = dayjs(block.end_time);
    const plannedMins = e.diff(s, "minute");
    if (plannedMins <= 0) continue;

    g.plannedMinutes += plannedMins;

    let matchedMins = 0;
    for (const ev of eventsAsDayjs) {
      matchedMins += overlapMinutes(s, e, ev.start, ev.end);
    }

    if (matchedMins > plannedMins) {
      matchedMins = plannedMins; // clamp
    }

    g.matchedMinutes += matchedMins;
  }

  // Compute weighted focus score
  let weightedSum = 0;
  let weightedMax = 0;
  let totalPlannedMinutes = 0;
  let totalMatchedMinutes = 0;

  c

  const perGoal = Object.values(perGoalMap).map((g) => {
    totalPlannedMinutes += g.plannedMinutes;
    totalMatchedMinutes += g.matchedMinutes;

    if (g.plannedMinutes <= 0) {
      return {
        goalId: g.goalId,
        title: g.title,
        priority: g.priority,
        plannedHours: 0,
        actualHours: 0,
        matchPercent: 0,
      };
    }

    const matchPercent = Math.round(
      (g.matchedMinutes / g.plannedMinutes) * 100
    );

    const weight = priorityWeight(g.priority);
    weightedSum += weight * matchPercent;
    weightedMax += weight * 100;

    return {
      goalId: g.goalId,
      title: g.title,
      priority: g.priority,
      plannedHours: +(g.plannedMinutes / 60).toFixed(1),
      actualHours: +(g.matchedMinutes / 60).toFixed(1),
      matchPercent,
    };
  });

  let focusScore = 0;
  if (weightedMax > 0) {
    focusScore = Math.round((weightedSum / weightedMax) * 100);
  }

  // XP model: base multiplier + bonuses
  let xpEarned = Math.round(focusScore * 1.2);
  if (focusScore >= 80) xpEarned += 20;
  if (focusScore >= 90) xpEarned += 30;

  // Streak logic: requires >= 70 to count as a "focused week"
  const thresholdForStreak = 70;
  const currentWeekDate = weekStart.format("YYYY-MM-DD");

  const { data: lastSummaryData, error: lastSummaryError } = await supabase
    .from("weekly_summaries")
    .select("week_start_date, focus_score, streak")
    .eq("user_id", userId)
    .lt("week_start_date", currentWeekDate)
    .order("week_start_date", { ascending: false })
    .limit(1);

  if (lastSummaryError) {
    console.error("lastSummaryError", lastSummaryError);
  }

  let currentStreak = 0;
  if (focusScore >= thresholdForStreak) {
    if (lastSummaryData && lastSummaryData.length > 0) {
      const last = lastSummaryData[0];
      const lastWeekStart = dayjs(last.week_start_date);
      const diffDays = weekStart.diff(lastWeekStart, "day");

      if (
        diffDays === 7 &&
        last.focus_score >= thresholdForStreak &&
        last.streak > 0
      ) {
        currentStreak = last.streak + 1;
      } else {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }
  } else {
    currentStreak = 0;
  }

  // Upsert weekly summary
  const details = {
    perGoal,
  };

  const { error: upsertError } = await supabase.from("weekly_summaries").upsert(
    {
      user_id: userId,
      week_start_date: currentWeekDate,
      focus_score: focusScore,
      xp_earned: xpEarned,
      total_planned_minutes: totalPlannedMinutes,
      total_matched_minutes: totalMatchedMinutes,
      streak: currentStreak,
      details,
    },
    {
      onConflict: "user_id,week_start_date",
    }
  );

  if (upsertError) {
    console.error("upsertError weekly_summaries", upsertError);
  }

  // Compute total XP & longest streak from summaries
  const { data: xpData, error: xpError } = await supabase
    .from("weekly_summaries")
    .select("xp_earned, streak");

  let xpTotal = 0;
  let longestStreak = 0;

  type XpRow = {
    xp_earned: number | null;
    streak: number | null;
  };

  if (!xpError && xpData) {
    (xpData as XpRow[]).forEach((row) => {
      xpTotal += row.xp_earned || 0;
      if (row.streak && row.streak > longestStreak) {
        longestStreak = row.streak;
      }
    });
  }

  // Update profile xp & level based on XP total
  const level = Math.max(1, Math.floor(xpTotal / 100) + 1);

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ xp: xpTotal, level })
    .eq("user_id", userId);

  if (profileError) {
    console.error("profileError updating xp/level", profileError);
  }

  const weekLabel = `${weekStart.format("MMM D")} – ${weekEnd
    .subtract(1, "day")
    .format("MMM D")}`;

  return NextResponse.json({
    focusScore,
    xpEarned,
    totalPlannedHours: +(totalPlannedMinutes / 60).toFixed(1),
    totalMatchedHours: +(totalMatchedMinutes / 60).toFixed(1),
    currentStreak,
    longestStreak,
    xpTotal,
    weekStart: currentWeekDate,
    weekLabel,
    perGoal,
  });
}
