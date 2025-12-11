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

function priorityWeight(p: string | null): number {
  switch (p) {
    case "M":
      return 2; // Major
    case "O":
      return 0.5; // Optional
    case "m":
    default:
      return 1; // Minor / default
  }
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Current week: Monday → next Monday
  const weekStart = dayjs().startOf("week").add(1, "day").startOf("day");
  const weekEnd = weekStart.add(7, "day");

  // Load goals (with priority)
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

  // Load planned blocks for this week
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

  // Load actual calendar events for this week
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

  // If no planned blocks, score is 0 with friendly message
  if (blocks.length === 0 || goals.length === 0) {
    return NextResponse.json({
      focusScore: 0,
      xp: 0,
      summary:
        "No planned blocks for this week yet. Create some sessions to start tracking your focus.",
      perGoal: [],
    });
  }

  // Map per-goal planned & matched minutes
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

  // For each planned block, measure overlap with all events
  for (const b of blocks) {
    if (!perGoalMap[b.goal_id]) continue;

    const blockStart = dayjs(b.start_time);
    const blockEnd = dayjs(b.end_time);
    const plannedMinutes = blockEnd.diff(blockStart, "minute");
    if (plannedMinutes <= 0) continue;

    perGoalMap[b.goal_id].plannedMinutes += plannedMinutes;

    let matchedMinutes = 0;
    for (const ev of eventsAsDayjs) {
      matchedMinutes += overlapMinutes(
        blockStart,
        blockEnd,
        ev.start,
        ev.end
      );
    }

    if (matchedMinutes > plannedMinutes) {
      matchedMinutes = plannedMinutes; // clamp
    }

    perGoalMap[b.goal_id].matchedMinutes += matchedMinutes;
  }

  // Compute weighted score
  let weightedSum = 0;
  let weightedMax = 0;

  const perGoal = Object.values(perGoalMap).map((g) => {
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

  if (weightedMax === 0) {
    return NextResponse.json({
      focusScore: 0,
      xp: 0,
      summary:
        "You have goals set, but no planned time blocks for them this week.",
      perGoal,
    });
  }

  const focusScore = Math.round((weightedSum / weightedMax) * 100);

  // Simple XP model: 1.2x score, bonus if >= 80
  let xp = Math.round(focusScore * 1.2);
  if (focusScore >= 80) xp += 20;
  if (focusScore >= 90) xp += 30;

  // Summary messaging
  let summary = "";
  if (focusScore >= 90) {
    summary =
      "Elite focus! You’re nailing your major goals and staying consistent.";
  } else if (focusScore >= 80) {
    summary =
      "Strong week. Major goals are well aligned—keep this streak going.";
  } else if (focusScore >= 60) {
    summary =
      "Decent focus. You’re getting things done, but there’s room to tighten your schedule.";
  } else if (focusScore > 0) {
    summary =
      "This week was a bit scattered. Try protecting time for your major goals.";
  } else {
    summary =
      "No matching between planned and actual yet. Use the planner and sync your calendar to get scored.";
  }

  return NextResponse.json({
    focusScore,
    xp,
    summary,
    perGoal,
  });
}
