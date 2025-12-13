import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import dayjs from "dayjs";

type WeeklyScore = {
  focusScore: number;
  xpEarned: number;
  totalPlannedHours: number;
  totalMatchedHours: number;
  currentStreak: number;
  longestStreak: number;
  xpTotal: number;
  weekStart: string;
  weekLabel: string;
  perGoal: Array<{
    goalId: string;
    title: string;
    priority: "M" | "m" | "O";
    plannedHours: number;
    actualHours: number;
    matchPercent: number; // in your scoring v2 this is “score bucket” (0/30/50/75/100)
  }>;
};

function buildHeuristicSummary(score: WeeklyScore) {
  const { focusScore, totalPlannedHours, totalMatchedHours, perGoal } = score;

  const top = [...perGoal]
    .sort((a, b) => b.matchPercent - a.matchPercent)
    .slice(0, 2);

  const bottom = [...perGoal]
    .sort((a, b) => a.matchPercent - b.matchPercent)
    .slice(0, 2);

  const tone =
    focusScore >= 85
      ? "Excellent week — your time matched your intentions unusually well."
      : focusScore >= 70
      ? "Strong alignment week — you’re building real consistency."
      : focusScore >= 50
      ? "Decent week — you showed up, but there’s room to tighten the plan-to-reality loop."
      : focusScore > 0
      ? "Rough alignment week — not a failure, just a signal to simplify and protect focus blocks."
      : "No score yet — add planned blocks and sync actual time to generate insights.";

  const alignment =
    totalPlannedHours > 0
      ? `You planned **${totalPlannedHours.toFixed(
          1
        )}h** and matched about **${totalMatchedHours.toFixed(1)}h**.`
      : "You haven’t planned any blocks yet this week.";

  const best =
    top.length > 0
      ? `Best-aligned: **${top
          .map((g) => `${g.title} (${g.matchPercent}%)`)
          .join(", ")}**.`
      : "";

  const weakest =
    bottom.length > 0
      ? `Least-aligned: **${bottom
          .map((g) => `${g.title} (${g.matchPercent}%)`)
          .join(", ")}**.`
      : "";

  const suggestions: string[] = [];

  // Suggestion 1: protect one major block
  suggestions.push(
    "Protect one **Major** goal block by scheduling it earlier in the day (before meetings), even if it’s only 30–45 minutes."
  );

  // Suggestion 2: reduce over-planning if low match
  if (totalPlannedHours > 0 && totalMatchedHours / totalPlannedHours < 0.4) {
    suggestions.push(
      "You may be **over-planning**. Reduce planned hours by ~20% next week and focus on fewer, higher-quality blocks."
    );
  } else {
    suggestions.push(
      "Add a 10-minute “**buffer block**” before/after focus sessions to reduce schedule collisions."
    );
  }

  // Suggestion 3: goal mapping
  suggestions.push(
    "Rename 1–2 recurring calendar events to match your goal titles (e.g., “Timeline App – Focus”) so the system can map them more reliably."
  );

  const summary = [
    `### Weekly Insight (${score.weekLabel})`,
    ``,
    `**Focus Score:** ${focusScore}/100`,
    ``,
    tone,
    ``,
    alignment,
    best && `\n${best}`,
    weakest && `\n${weakest}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { summary, suggestions: suggestions.slice(0, 3) };
}

function makeInfographicSVG(score: WeeklyScore) {
  // Lightweight SVG “card” you can render directly in-app or email.
  const width = 900;
  const height = 420;

  const barW = 620;
  const barH = 16;
  const barX = 240;
  const barY = 190;

  const pct = Math.max(0, Math.min(100, score.focusScore));
  const filled = Math.round((barW * pct) / 100);

  const topGoals = [...score.perGoal]
    .sort((a, b) => b.matchPercent - a.matchPercent)
    .slice(0, 3);

  const lines = topGoals.map(
    (g, idx) =>
      `<text x="60" y="${270 + idx * 28}" font-size="16" fill="var(--textMuted)">${g.title} — ${g.matchPercent}%</text>`
  );

  // Use CSS variables-like colors but bake real colors in SVG for portability
  const bg = "#0d1117";
  const card = "#161b22";
  const text = "#e6edf3";
  const muted = "#94a3b8";
  const border = "#273244";
  const primary = "#3b82f6";

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" rx="22" fill="${bg}" />
  <rect x="24" y="24" width="${width - 48}" height="${height - 48}" rx="18" fill="${card}" stroke="${border}" />
  <text x="60" y="92" font-size="28" font-weight="700" fill="${text}">Weekly Focus Summary</text>
  <text x="60" y="124" font-size="16" fill="${muted}">${score.weekLabel}</text>

  <text x="60" y="196" font-size="16" fill="${muted}">Focus Score</text>
  <text x="60" y="232" font-size="44" font-weight="800" fill="${text}">${score.focusScore}</text>
  <text x="152" y="232" font-size="18" fill="${muted}">/ 100</text>

  <rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="8" fill="#0b1220" stroke="${border}" />
  <rect x="${barX}" y="${barY}" width="${filled}" height="${barH}" rx="8" fill="${primary}" />

  <text x="${barX}" y="${barY - 14}" font-size="14" fill="${muted}">Planned: ${score.totalPlannedHours.toFixed(
    1
  )}h   •   Matched: ${score.totalMatchedHours.toFixed(1)}h</text>

  <text x="60" y="252" font-size="14" fill="${muted}">XP Earned: +${score.xpEarned}   •   Streak: ${
    score.currentStreak
  } week(s)</text>

  <text x="60" y="300" font-size="18" font-weight="700" fill="${text}">Top Goals</text>
  ${lines.join("\n")}

  <text x="60" y="388" font-size="12" fill="${muted}">FocusMirror • Align Your Time. Improve Your Life.</text>
</svg>`.trim();
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const url = new URL(req.url);
  const weekStartParam = url.searchParams.get("weekStart"); // YYYY-MM-DD
  const weekStart = weekStartParam
    ? dayjs(weekStartParam).format("YYYY-MM-DD")
    : dayjs().startOf("week").add(1, "day").format("YYYY-MM-DD");

  // 1) If exists, return it
  const { data: existing } = await supabase
    .from("weekly_insights")
    .select("summary, suggestions, infographic_svg, week_start_date, created_at")
    .eq("user_id", userId)
    .eq("week_start_date", weekStart)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      weekStart,
      summary: existing.summary,
      suggestions: existing.suggestions,
      infographicSvg: existing.infographic_svg,
      createdAt: existing.created_at,
      cached: true,
    });
  }

  // 2) Ensure weekly score exists (call your weekly-score endpoint internally via DB)
  const { data: weekSummary } = await supabase
    .from("weekly_summaries")
    .select("week_start_date, focus_score, xp_earned, total_planned_minutes, total_matched_minutes, streak, details")
    .eq("user_id", userId)
    .eq("week_start_date", weekStart)
    .maybeSingle();

  if (!weekSummary) {
    return NextResponse.json({
      weekStart,
      summary: `### Weekly Insight\n\nNo weekly summary found yet. Visit your dashboard to generate a Focus Score first.`,
      suggestions: [
        "Create planned blocks on the timeline.",
        "Sync your calendar.",
        "Return to Dashboard for your weekly score.",
      ],
      infographicSvg: makeInfographicSVG({
        focusScore: 0,
        xpEarned: 0,
        totalPlannedHours: 0,
        totalMatchedHours: 0,
        currentStreak: 0,
        longestStreak: 0,
        xpTotal: 0,
        weekStart,
        weekLabel: weekStart,
        perGoal: [],
      }),
      cached: false,
    });
  }

  const perGoal = (weekSummary.details?.perGoal ?? []) as WeeklyScore["perGoal"];

  const score: WeeklyScore = {
    focusScore: weekSummary.focus_score,
    xpEarned: weekSummary.xp_earned,
    totalPlannedHours: +(weekSummary.total_planned_minutes / 60).toFixed(1),
    totalMatchedHours: +(weekSummary.total_matched_minutes / 60).toFixed(1),
    currentStreak: weekSummary.streak,
    longestStreak: weekSummary.streak, // you compute global longest elsewhere; ok for insight card
    xpTotal: 0, // not needed here
    weekStart,
    weekLabel: `${dayjs(weekStart).format("MMM D")} – ${dayjs(weekStart).add(6, "day").format("MMM D")}`,
    perGoal,
  };

  // 3) Generate heuristic insight (LLM-ready later)
  const { summary, suggestions } = buildHeuristicSummary(score);
  const infographicSvg = makeInfographicSVG(score);

  // 4) Store in DB
  await supabase.from("weekly_insights").upsert(
    {
      user_id: userId,
      week_start_date: weekStart,
      summary,
      suggestions,
      infographic_svg: infographicSvg,
    },
    { onConflict: "user_id,week_start_date" } 
  );

  return NextResponse.json({
    weekStart,
    summary,
    suggestions,
    infographicSvg,
    cached: false,
  });
}
