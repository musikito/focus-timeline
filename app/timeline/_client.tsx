"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Priority = "M" | "m" | "O";

export type Goal = {
  id: string;
  title: string;
  priority: Priority;
};

export type PlannedBlock = {
  id: string;
  goal_id: string;
  start_time: string; // ISO
  end_time: string; // ISO
};

export type CalendarEvent = {
  id: string;
  summary?: string | null;
  start_time: string; // ISO
  end_time: string; // ISO
};

type Props = {
  goals: Goal[];
  plannedBlocks: PlannedBlock[];
  calendarEvents?: CalendarEvent[];
  /**
   * Optional callback if you want to persist moves server-side.
   * If not provided, blocks will move only in local UI state.
   */
  onMoveBlock?: (blockId: string, nextStartISO: string, nextEndISO: string) => Promise<void> | void;
};

/**
 * Weekly Timeline Grid
 * - Columns = days (Mon..Sun)
 * - Rows = 30-min slots from START_HOUR..END_HOUR
 * - Planned blocks are draggable and snap to the grid.
 */
export default function TimelineClient({
  goals,
  plannedBlocks,
  calendarEvents = [],
  onMoveBlock,
}: Props) {
  // ---- Grid settings (tweak safely) ----
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const START_HOUR = 6;
  const END_HOUR = 22; // exclusive
  const SLOT_MIN = 30;

  const ROW_H = 22; // px per 30-min slot
  const COL_W = 170; // px per day column
  const HEADER_H = 44; // px

  const SLOTS_PER_DAY = ((END_HOUR - START_HOUR) * 60) / SLOT_MIN;

  const gridRef = useRef<HTMLDivElement | null>(null);

  // ---- Build goal lookup ----
  const goalById = useMemo(() => {
    const m = new Map<string, Goal>();
    for (const g of goals) m.set(g.id, g);
    return m;
  }, [goals]);

  // ---- Keep local editable state for planned blocks ----
  const [blocks, setBlocks] = useState<PlannedBlock[]>(plannedBlocks);

  useEffect(() => {
    setBlocks(plannedBlocks);
  }, [plannedBlocks]);

  // ---- Drag state ----
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffset = useRef<{ dx: number; dy: number } | null>(null);
  const dragStartSnapshot = useRef<PlannedBlock | null>(null);

  // Convert ISO time to (dayIndex, slotIndex, durationSlots)
  const blockToGrid = (b: PlannedBlock) => {
    const start = new Date(b.start_time);
    const end = new Date(b.end_time);

    // We treat the week based on the start_time’s local weekday.
    // JS: 0=Sun..6=Sat. We want Mon=0..Sun=6
    const jsDay = start.getDay(); // 0..6
    const dayIndex = (jsDay + 6) % 7; // Mon=0 ... Sun=6

    const startMins = start.getHours() * 60 + start.getMinutes();
    const endMins = end.getHours() * 60 + end.getMinutes();

    const startClamped = Math.max(START_HOUR * 60, Math.min(endMins, startMins));
    const endClamped = Math.max(startClamped + SLOT_MIN, Math.min(END_HOUR * 60, endMins));

    const slotIndex = Math.round((startClamped - START_HOUR * 60) / SLOT_MIN);
    const durationSlots = Math.max(
      1,
      Math.round((endClamped - startClamped) / SLOT_MIN)
    );

    return {
      dayIndex: clamp(dayIndex, 0, 6),
      slotIndex: clamp(slotIndex, 0, SLOTS_PER_DAY - 1),
      durationSlots: clamp(durationSlots, 1, SLOTS_PER_DAY),
    };
  };

  // Convert (dayIndex, slotIndex, durationSlots) back to ISO
  const gridToISO = (b: PlannedBlock, dayIndex: number, slotIndex: number) => {
    const origStart = new Date(b.start_time);
    const origEnd = new Date(b.end_time);
    const durationMinutes = Math.max(30, (origEnd.getTime() - origStart.getTime()) / 60000);

    // Compute Monday of the block’s week (local)
    const d = new Date(origStart);
    const jsDay = d.getDay(); // 0..6
    const mondayOffset = (jsDay + 6) % 7; // days since Monday
    const monday = new Date(d);
    monday.setDate(d.getDate() - mondayOffset);
    monday.setHours(0, 0, 0, 0);

    // Target day
    const nextStart = new Date(monday);
    nextStart.setDate(monday.getDate() + dayIndex);

    const minutesFromStart = START_HOUR * 60 + slotIndex * SLOT_MIN;
    nextStart.setHours(Math.floor(minutesFromStart / 60), minutesFromStart % 60, 0, 0);

    const nextEnd = new Date(nextStart.getTime() + durationMinutes * 60000);

    return {
      nextStartISO: nextStart.toISOString(),
      nextEndISO: nextEnd.toISOString(),
    };
  };

  const startDrag = (e: React.PointerEvent, blockId: string) => {
    const el = e.currentTarget as HTMLDivElement;
    el.setPointerCapture(e.pointerId);

    const gridEl = gridRef.current;
    if (!gridEl) return;

    const rect = gridEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find block in state
    const b = blocks.find((bb) => bb.id === blockId);
    if (!b) return;

    const g = blockToGrid(b);

    // Current block top-left in grid coords
    const blockLeft = g.dayIndex * COL_W;
    const blockTop = HEADER_H + g.slotIndex * ROW_H;

    dragOffset.current = { dx: x - blockLeft, dy: y - blockTop };
    dragStartSnapshot.current = b;

    setDraggingId(blockId);
  };

  // Keep dragging movement global (smooth even if pointer leaves block)
  useEffect(() => {
    if (!draggingId) return;

    const gridEl = gridRef.current;
    if (!gridEl) return;

    const handleMove = (ev: PointerEvent) => {
      const rect = gridEl.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;

      const off = dragOffset.current;
      const snap = dragStartSnapshot.current;
      if (!off || !snap) return;

      // Snap to grid: determine intended top-left
      const rawLeft = x - off.dx;
      const rawTop = y - off.dy;

      // Convert to day/slot
      const dayIndex = clamp(Math.round(rawLeft / COL_W), 0, 6);

      // Important: clamp inside the slot region (below header)
      const topInside = clamp(rawTop, HEADER_H, HEADER_H + (SLOTS_PER_DAY - 1) * ROW_H);
      const slotIndex = clamp(
        Math.round((topInside - HEADER_H) / ROW_H),
        0,
        SLOTS_PER_DAY - 1
      );

      const { nextStartISO, nextEndISO } = gridToISO(snap, dayIndex, slotIndex);

      setBlocks((prev) =>
        prev.map((b) =>
          b.id === draggingId ? { ...b, start_time: nextStartISO, end_time: nextEndISO } : b
        )
      );
    };

    const handleUp = async () => {
      const moved = blocks.find((b) => b.id === draggingId);
      const original = dragStartSnapshot.current;

      setDraggingId(null);
      dragOffset.current = null;
      dragStartSnapshot.current = null;

      // Persist if callback exists and something changed
      if (onMoveBlock && moved && original) {
        if (moved.start_time !== original.start_time || moved.end_time !== original.end_time) {
          try {
            await onMoveBlock(moved.id, moved.start_time, moved.end_time);
          } catch (err) {
            console.error("Failed to persist move", err);
            // Optional: revert on error
            setBlocks((prev) =>
              prev.map((b) => (b.id === original.id ? original : b))
            );
          }
        }
      }
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingId, onMoveBlock, blocks]);

  // ----- Render helpers -----
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const hh = d.getHours();
    const mm = d.getMinutes().toString().padStart(2, "0");
    const ampm = hh >= 12 ? "PM" : "AM";
    const hr = hh % 12 === 0 ? 12 : hh % 12;
    return `${hr}:${mm} ${ampm}`;
  };

  const priorityBadge = (p: Priority) => {
    if (p === "M") return "Major";
    if (p === "O") return "Optional";
    return "Minor";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Timeline</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Drag blocks to reschedule. Blocks snap to 30-minute grid.
          </p>
        </div>
      </div>

      <div
        ref={gridRef}
        className="relative overflow-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-alt)]"
        style={{
          // Ensure the grid has real height so blocks can be dragged
          height: HEADER_H + SLOTS_PER_DAY * ROW_H + 24,
        }}
      >
        {/* Header row */}
        <div
          className="sticky top-0 z-20 flex border-b border-[var(--border)] bg-[var(--bg-alt)]"
          style={{ height: HEADER_H }}
        >
          {DAYS.map((d) => (
            <div
              key={d}
              className="flex items-center justify-center text-sm font-semibold text-[var(--text)]"
              style={{ width: COL_W }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grid body */}
        <div
          className="relative"
          style={{
            width: DAYS.length * COL_W,
            height: SLOTS_PER_DAY * ROW_H + 24,
          }}
        >
          {/* Background grid lines */}
          {Array.from({ length: DAYS.length }).map((_, day) => (
            <div
              key={day}
              className="absolute top-0 bottom-0 border-r border-[var(--border)]"
              style={{ left: day * COL_W, width: 1 }}
            />
          ))}

          {Array.from({ length: SLOTS_PER_DAY + 1 }).map((_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 border-t border-[var(--border)] opacity-60"
              style={{ top: i * ROW_H + 0 }}
            />
          ))}

          {/* Calendar events (non-draggable, faint red) */}
          {calendarEvents.map((ev) => {
            const fake: PlannedBlock = {
              id: ev.id,
              goal_id: "calendar",
              start_time: ev.start_time,
              end_time: ev.end_time,
            };
            const g = blockToGrid(fake);
            return (
              <div
                key={`cal-${ev.id}`}
                className="absolute z-5 rounded-lg border border-red-400/30 bg-red-500/10 text-red-200"
                style={{
                  left: g.dayIndex * COL_W + 6,
                  top: HEADER_H + g.slotIndex * ROW_H + 2,
                  width: COL_W - 12,
                  height: g.durationSlots * ROW_H - 4,
                  pointerEvents: "none",
                }}
                title={ev.summary ?? "Calendar event"}
              >
                <div className="px-2 py-1 text-[11px] font-medium truncate">
                  {ev.summary ?? "Calendar"}
                </div>
              </div>
            );
          })}

          {/* Planned blocks (draggable, blue) */}
          {blocks.map((b) => {
            const goal = goalById.get(b.goal_id);
            const g = blockToGrid(b);

            const title = goal?.title ?? "Untitled";
            const p = goal?.priority ?? "m";

            const isDragging = draggingId === b.id;

            return (
              <div
                key={b.id}
                onPointerDown={(e) => startDrag(e, b.id)}
                className={[
                  "absolute z-10 rounded-xl border shadow-sm",
                  "bg-blue-600 text-white border-blue-300/30",
                  "select-none touch-none",
                  "cursor-grab active:cursor-grabbing",
                  isDragging ? "opacity-90 ring-2 ring-blue-300" : "opacity-100",
                ].join(" ")}
                style={{
                  left: g.dayIndex * COL_W + 6,
                  top: HEADER_H + g.slotIndex * ROW_H + 2,
                  width: COL_W - 12,
                  height: g.durationSlots * ROW_H - 4,
                }}
                title={`${title} • ${formatTime(b.start_time)} – ${formatTime(b.end_time)}`}
              >
                {/* Label */}
                <div className="flex items-center justify-between gap-2 px-2 pt-2">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{title}</div>
                    <div className="text-[10px] opacity-90">
                      {formatTime(b.start_time)} – {formatTime(b.end_time)}
                    </div>
                  </div>
                  <div className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-white/15 border border-white/20">
                    {priorityBadge(p as Priority)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-xs text-[var(--text-muted)]">
        Tip: If blocks don’t move, it’s usually an overlay blocking pointer events. This file avoids that by keeping drag handlers on the block itself and using window-level pointermove.
      </div>
    </div>
  );
}

/* ------------------ Utils ------------------ */

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
