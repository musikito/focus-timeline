"use client";

import { useEffect, useState } from "react";

type PerGoal = {
  goalId: string;
  title: string;
  priority: string;
  plannedHours: number;
  actualHours: number;
  matchPercent: number;
};

type WeeklyScoreResponse = {
  focusScore: number;
  xpEarned: number;
  totalPlannedHours: number;
  totalMatchedHours: number;
  currentStreak: number;
  longestStreak: number;
  xpTotal: number;
  weekStart: string;
  weekLabel: string;
  perGoal: PerGoal[];
  message?: string;
};

export default function DashboardClient() {
  const [data, setData] = useState<WeeklyScoreResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/weekly-score", {
          credentials: "include",
        });
          const json = await res.json();
          setData(json);
      } catch (err) {
        console.error("Failed to load weekly score", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-alt)] p-6">
        <p className="text-sm text-[var(--text-muted)]">Calculating your weekly Focus Score…</p>
      </div>
    );
  }

  // if (!data) {
  //   return (
  //     <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-alt)] p-6">
  //       <p className="text-sm text-[var(--text-muted)]">
  //         No data available yet. Create planned blocks and sync your calendar to see your Focus Score.
  //       </p>
  //     </div>
  //   );
  // }

  if (!data || data.perGoal.length === 0) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-alt)] p-6">
      <h2 className="text-lg font-semibold mb-2">No Weekly Score Yet</h2>
      <p className="text-sm text-[var(--text-muted)] mb-2">
        {data?.message ?? "You don't have any planned blocks or synced calendar events for this week."}
      </p>

      <ul className="list-disc pl-5 text-sm text-[var(--text-muted)]">
        <li>Create 1 or more goals</li>
        <li>Add planned blocks in your Weekly Timeline</li>
        <li>Connect your calendar & add events</li>
        <li>Come back here for your Focus Score summary</li>
      </ul>
    </div>
  );
}


  const badgeColor =
    data.focusScore >= 90
      ? "bg-emerald-600"
      : data.focusScore >= 80
      ? "bg-green-600"
      : data.focusScore >= 60
      ? "bg-yellow-500"
      : data.focusScore > 0
      ? "bg-orange-500"
      : "bg-gray-500";

  const label =
    data.focusScore >= 90
      ? "Elite Focus"
      : data.focusScore >= 80
      ? "Strong Week"
      : data.focusScore >= 60
      ? "Decent Week"
      : data.focusScore > 0
      ? "Scattered"
      : "Not Scored Yet";

  return (
    <div className="space-y-6">
      {/* Top cards: score + XP + streak */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Focus Score */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-alt)] p-5 flex items-center gap-4">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white ${badgeColor}`}
          >
            {data.focusScore}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
              Weekly Focus Score
            </div>
            <div className="text-lg font-semibold">{label}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">
              Week: {data.weekLabel}
            </div>
            {data.message && (
              <div className="text-xs text-[var(--text-muted)] mt-1">
                {data.message}
              </div>
            )}
          </div>
        </div>

        {/* XP card */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-alt)] p-5 flex flex-col justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
              XP This Week
            </div>
            <div className="text-2xl font-bold text-emerald-500">
              +{data.xpEarned}
            </div>
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-2">
            Total XP:{" "}
            <span className="font-semibold text-[var(--text)]">
              {data.xpTotal}
            </span>
          </div>
        </div>

        {/* Streak card */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-alt)] p-5 flex flex-col justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
              Focus Streak
            </div>
            <div className="text-2xl font-bold">
              {data.currentStreak} week
              {data.currentStreak === 1 ? "" : "s"}
            </div>
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-2">
            Longest streak:{" "}
            <span className="font-semibold text-[var(--text)]">
              {data.longestStreak} week
              {data.longestStreak === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>

      {/* Planned vs Actual summary */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-alt)] p-5 flex flex-col gap-2">
        <div className="text-sm font-semibold mb-1">
          Planned vs Actual Time
        </div>
        <div className="text-xs text-[var(--text-muted)] mb-2">
          Planned:{" "}
          <span className="font-semibold text-[var(--text)]">
            {data.totalPlannedHours.toFixed(1)}h
          </span>{" "}
          · Actual:{" "}
          <span className="font-semibold text-[var(--text)]">
            {data.totalMatchedHours.toFixed(1)}h
          </span>
        </div>
      </div>

      {/* Per-goal breakdown */}
      {data.perGoal.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-alt)] p-5">
          <div className="text-sm font-semibold mb-3">
            Goal Breakdown
          </div>
          <div className="space-y-3">
            {data.perGoal.map((g) => (
              <div key={g.goalId} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{g.title}</span>
                    <span className="px-2 py-0.5 rounded-full border border-[var(--border)] text-[10px] text-[var(--text-muted)]">
                      {g.priority === "M"
                        ? "Major"
                        : g.priority === "m"
                        ? "Minor"
                        : "Optional"}
                    </span>
                  </div>
                  <div className="text-[var(--text-muted)]">
                    {g.matchPercent}% match · {g.actualHours.toFixed(1)}h /{" "}
                    {g.plannedHours.toFixed(1)}h
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${g.matchPercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
