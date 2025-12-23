/* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";

// import { useEffect, useState } from "react";
// import dayjs from "dayjs";

// type Goal = {
//   id: string;
//   title: string;
//   color: string;
// };

// type Block = {
//   id?: string;
//   goalId: string;
//   startTime: string;
//   endTime: string;
// };

// export default function TimelineClient({ goals }: { goals: Goal[] }) {
//   const [blocks, setBlocks] = useState<Block[]>([]);
//   const [saving, setSaving] = useState(false);

//   // Load blocks from DB
//   useEffect(() => {
//     fetch("/api/planned-blocks", { credentials: "include" })
//       .then((r) => r.json())
//       .then((data) => {
//         setBlocks(
//           data.map((b: any) => ({
//             id: b.id,
//             goalId: b.goal_id,
//             startTime: b.start_time,
//             endTime: b.end_time,
//           }))
//         );
//       });
//   }, []);

//   async function saveBlocks(next: Block[]) {
//     setSaving(true);
//     try {
//       const res = await fetch("/api/planned-blocks", {
//         method: "POST",
//         credentials: "include",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(next),
//       });

//       if (!res.ok) {
//         const j = await res.json();
//         console.error("Save blocks failed:", j.error);
//       }
//     } finally {
//       setSaving(false);
//     }
//   }

//   function onDrag(block: Block, minutesDelta: number) {
//     const next = blocks.map((b) =>
//       b === block
//         ? {
//             ...b,
//             startTime: dayjs(b.startTime).add(minutesDelta, "minute").toISOString(),
//             endTime: dayjs(b.endTime).add(minutesDelta, "minute").toISOString(),
//           }
//         : b
//     );
//     setBlocks(next);
//     saveBlocks(next);
//   }

//   function onResize(block: Block, minutesDelta: number) {
//     const next = blocks.map((b) =>
//       b === block
//         ? {
//             ...b,
//             endTime: dayjs(b.endTime).add(minutesDelta, "minute").toISOString(),
//           }
//         : b
//     );
//     setBlocks(next);
//     saveBlocks(next);
//   }

//   return (
//     <div className="relative h-[600px] border rounded-xl bg-[var(--bg)]">
//       {blocks.map((b) => {
//         const goal = goals.find((g) => g.id === b.goalId);
//         if (!goal) return null;

//         return (
//           <div
//             key={b.id}
//             className="absolute rounded-md text-xs text-white px-2 py-1 cursor-move"
//             style={{
//               background: goal.color,
//               top: "80px",
//               left: "120px",
//               width: "160px",
//             }}
//             onMouseUp={() => onDrag(b, 30)} // MVP: 30min snap
//           >
//             {goal.title}
//           </div>
//         );
//       })}

//       {saving && (
//         <div className="absolute bottom-2 right-2 text-xs text-muted">
//           Saving…
//         </div>
//       )}
//     </div>
//   );
// }

"use client";

import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGoals } from "@/components/goals/goals-context";

const START_HOUR = 6;
const END_HOUR = 22;
const SLOT_MIN = 30;       // 30-minute grid
const SLOT_PX = 22;        // snap size
const MIN_BLOCK_MIN = 60;  // minimum duration 1 hour

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Block = {
  id: string;
  goalId: string;
  title: string;
  dayIndex: number;   // 0..6
  startMin: number;   // minutes from midnight
  durationMin: number;
};

function mondayWeekStart(d = dayjs()) {
  // dayjs startOf('week') is locale-based; enforce Monday:
  const dow = d.day(); // 0 Sun ... 6 Sat
  const diff = (dow + 6) % 7; // Mon=0
  return d.subtract(diff, "day").startOf("day");
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function snapMinutes(mins: number) {
  const snapped = Math.round(mins / SLOT_MIN) * SLOT_MIN;
  return snapped;
}

export default function TimelineClient() {
  const { goals, loading: goalsLoading } = useGoals();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [saving, setSaving] = useState(false);

  const weekStart = useMemo(() => mondayWeekStart().format("YYYY-MM-DD"), []);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const saveTimer = useRef<number | null>(null);

  const totalSlots = (END_HOUR - START_HOUR) * (60 / SLOT_MIN);
  const gridHeight = totalSlots * SLOT_PX;

  async function loadBlocks() {
    const res = await fetch(`/api/time-blocks?weekStart=${weekStart}`);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Failed to load blocks:", json?.error);
      return;
    }

    const rows = Array.isArray(json?.blocks) ? json.blocks : [];
    const mapped: Block[] = rows.map((r: any) => ({
      id: r.id ?? crypto.randomUUID(),
      goalId: r.goal_id,
      title: r.title ?? "",
      dayIndex: r.day_index,
      startMin: r.start_min,
      durationMin: r.duration_min,
    }));
    setBlocks(mapped);
  }

  function scheduleSave(nextBlocks: Block[]) {
    setBlocks(nextBlocks);

    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      setSaving(true);
      try {
        const res = await fetch("/api/time-blocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ weekStart, blocks: nextBlocks }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) console.error("Save blocks failed:", json?.error);
      } finally {
        setSaving(false);
      }
    }, 450);
  }

  useEffect(() => {
    loadBlocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Create new block from goal (click) ----
  function addBlockForGoal(goalId: string, title: string) {
    const newBlock: Block = {
      id: crypto.randomUUID(),
      goalId,
      title,
      dayIndex: 0,
      startMin: START_HOUR * 60,
      durationMin: MIN_BLOCK_MIN,
    };

    // Try place it below existing blocks on Monday
    const mondayBlocks = blocks.filter((b) => b.dayIndex === 0).sort((a, b) => a.startMin - b.startMin);
    if (mondayBlocks.length) {
      const last = mondayBlocks[mondayBlocks.length - 1];
      const candidate = snapMinutes(last.startMin + last.durationMin);
      const maxStart = END_HOUR * 60 - MIN_BLOCK_MIN;
      newBlock.startMin = clamp(candidate, START_HOUR * 60, maxStart);
    }

    scheduleSave([...blocks, newBlock]);
  }

  // ---- Drag/resize logic ----
  const dragRef = useRef<{
    id: string;
    mode: "move" | "resizeTop" | "resizeBottom";
    startX: number;
    startY: number;
    origDay: number;
    origStart: number;
    origDur: number;
    colWidth: number;
    gridLeft: number;
    gridTop: number;
  } | null>(null);

  function startDrag(e: React.PointerEvent, b: Block, mode: "move" | "resizeTop" | "resizeBottom") {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const grid = gridRef.current;
    if (!grid) return;

    const rect = grid.getBoundingClientRect();
    const colWidth = rect.width / 7;

    dragRef.current = {
      id: b.id,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origDay: b.dayIndex,
      origStart: b.startMin,
      origDur: b.durationMin,
      colWidth,
      gridLeft: rect.left,
      gridTop: rect.top,
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;

    const deltaX = e.clientX - d.startX;
    const deltaY = e.clientY - d.startY;

    const dayDelta = Math.round(deltaX / d.colWidth);
    const nextDay = clamp(d.origDay + dayDelta, 0, 6);

    const slotDelta = Math.round(deltaY / SLOT_PX);
    const minuteDelta = slotDelta * SLOT_MIN;

    setBlocks((prev) => {
      const idx = prev.findIndex((x) => x.id === d.id);
      if (idx === -1) return prev;
      const cur = prev[idx];
      const next = { ...cur };

      const minStart = START_HOUR * 60;
      const maxStart = END_HOUR * 60 - MIN_BLOCK_MIN;

      if (d.mode === "move") {
        next.dayIndex = nextDay;
        next.startMin = clamp(snapMinutes(d.origStart + minuteDelta), minStart, maxStart);
        next.durationMin = d.origDur;
      }

      if (d.mode === "resizeTop") {
        const newStart = clamp(snapMinutes(d.origStart + minuteDelta), minStart, d.origStart + d.origDur - MIN_BLOCK_MIN);
        const newDur = d.origStart + d.origDur - newStart;
        next.startMin = newStart;
        next.durationMin = newDur;
      }

      if (d.mode === "resizeBottom") {
        const newDur = clamp(snapMinutes(d.origDur + minuteDelta), MIN_BLOCK_MIN, (END_HOUR * 60) - d.origStart);
        next.startMin = d.origStart;
        next.durationMin = newDur;
      }

      const copy = [...prev];
      copy[idx] = next;
      return copy;
    });
  }

  async function onPointerUp() {
    if (!dragRef.current) return;
    dragRef.current = null;
    // persist current blocks
    scheduleSave(blocks);
  }

  function blockStyle(b: Block) {
    const topSlots = (b.startMin - START_HOUR * 60) / SLOT_MIN;
    const hSlots = b.durationMin / SLOT_MIN;
    return {
      top: topSlots * SLOT_PX,
      height: hSlots * SLOT_PX,
    } as React.CSSProperties;
  }

  // ---- UI ----
  return (
    <div className="mx-auto max-w-[1100px] space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Weekly Timeline</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Week starting <span className="font-medium">{weekStart}</span> • Drag to move, resize from top/bottom. Minimum 1 hour.
          </p>
        </div>

        <div className="text-xs text-[var(--text-muted)]">
          {saving ? "Saving…" : "Saved"}
        </div>
      </div>

      {/* Goal palette (DB-backed) */}
      <div className="flex flex-wrap gap-2">
        {goalsLoading ? (
          <span className="text-sm text-[var(--text-muted)]">Loading goals…</span>
        ) : goals.length === 0 ? (
          <span className="text-sm text-[var(--text-muted)]">
            No goals yet. Add one from the <span className="font-medium">+ Goal</span> button in the top bar.
          </span>
        ) : (
          goals.map((g) => (
            <button
              key={g.id}
              onClick={() => addBlockForGoal(g.id, g.title)}
              className="px-3 py-1.5 rounded-md text-sm border border-[var(--border)] bg-[var(--bg-alt)] hover:bg-[var(--bg)]"
              title="Click to add a 1-hour block on Monday (you can drag it anywhere)"
            >
              + {g.title}
            </button>
          ))
        )}
      </div>

      {/* Grid */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-alt)] overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-[var(--border)] bg-[var(--bg)]">
          <div className="p-3 text-xs text-[var(--text-muted)]" />
          {DAYS.map((d) => (
            <div key={d} className="p-3 text-center font-medium">
              {d}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="grid grid-cols-[64px_repeat(7,1fr)]">
          {/* Time column */}
          <div className="relative border-r border-[var(--border)]" style={{ height: gridHeight }}>
            {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => {
              const h = START_HOUR + i;
              const label = dayjs().hour(h).minute(0).format("h A");
              return (
                <div
                  key={h}
                  className="absolute left-0 w-full text-[11px] text-[var(--text-muted)] px-2"
                  style={{ top: i * (60 / SLOT_MIN) * SLOT_PX - 7 }}
                >
                  {label}
                </div>
              );
            })}
          </div>

          {/* Week columns */}
          <div
            ref={gridRef}
            className="relative col-span-7"
            style={{ height: gridHeight }}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            {/* Horizontal lines */}
            {Array.from({ length: totalSlots + 1 }).map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 border-t border-[var(--border)] opacity-40"
                style={{ top: i * SLOT_PX }}
              />
            ))}

            {/* Vertical lines */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 border-l border-[var(--border)] opacity-40"
                style={{ left: `${(i / 7) * 100}%` }}
              />
            ))}

            {/* Blocks */}
            {blocks.map((b) => {
              const goal = goals.find((g) => g.id === b.goalId);
              const leftPct = (b.dayIndex / 7) * 100;
              const widthPct = 100 / 7;

              return (
                <div
                  key={b.id}
                  className="absolute rounded-md border border-blue-400/40 bg-blue-500/80 text-white shadow-sm select-none"
                  style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    ...blockStyle(b),
                    padding: "6px",
                  }}
                >
                  {/* resize top */}
                  <div
                    className="absolute left-0 right-0 top-0 h-2 cursor-ns-resize"
                    onPointerDown={(e) => startDrag(e, b, "resizeTop")}
                  />
                  {/* content (move) */}
                  <div
                    className="cursor-move"
                    onPointerDown={(e) => startDrag(e, b, "move")}
                  >
                    <div className="text-xs font-semibold truncate">
                      {goal?.title ?? b.title ?? "Goal"}
                    </div>
                    <div className="text-[11px] opacity-90">
                      {dayjs().startOf("day").add(b.startMin, "minute").format("h:mm A")} –{" "}
                      {dayjs().startOf("day").add(b.startMin + b.durationMin, "minute").format("h:mm A")}
                    </div>
                  </div>
                  {/* resize bottom */}
                  <div
                    className="absolute left-0 right-0 bottom-0 h-2 cursor-ns-resize"
                    onPointerDown={(e) => startDrag(e, b, "resizeBottom")}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        MVP note: blocks persist in Supabase. If you refresh, your timeline stays.
      </p>
    </div>
  );
}
