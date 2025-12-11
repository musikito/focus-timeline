/* eslint-disable react-hooks/immutability */
"use client";

import dayjs, { Dayjs } from "dayjs";
import { useEffect, useRef, useState } from "react";

type Goal = {
  id: string;
  title: string;
  goal_type: string;
};

type Block = {
  id: string;
  goal_id: string;
  start_time: string;
  end_time: string;
};

type ActualEvent = {
  id: string;
  summary: string;
  start_time: string;
  end_time: string;
};

const START_HOUR = 0;
const END_HOUR = 24;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 24;
const MIN_DURATION_SLOTS = 2;
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const hours = Array.from({ length: END_HOUR - START_HOUR }).map(
  (_, i) => START_HOUR + i
);

type DragKind = "move" | "resize-top" | "resize-bottom";

type DragState =
  | null
  | {
      blockId: string;
      kind: DragKind;
      startGridX: number;
      startGridY: number;
      startCol: number;
      startSlot: number;
      durationSlots: number;
    };

export default function TimelineClient({
  goals,
  plannedBlocks,
  actualEvents,
}: {
  goals: Goal[];
  plannedBlocks: Block[];
  actualEvents: ActualEvent[];
}) {
  const [blocks, setBlocks] = useState(plannedBlocks);
  const [drag, setDrag] = useState<DragState>(null);
  const [ghost, setGhost] = useState<{
    col: number;
    startSlot: number;
    durationSlots: number;
  } | null>(null);

  const totalSlots = (END_HOUR - START_HOUR) * (60 / SLOT_MINUTES);
  const [weekStart] = useState<Dayjs>(() =>
    dayjs().startOf("week").add(1, "day")
  );

  const gridRef = useRef<HTMLDivElement | null>(null);
  const [gridWidth, setGridWidth] = useState<number | null>(null);

  // Resize listener
  useEffect(() => {
    function measure() {
      if (gridRef.current) setGridWidth(gridRef.current.clientWidth);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Drag handling
  useEffect(() => {
    if (!drag) return;

    function updateBlockFromGhost(b: Block, g: { col: number; startSlot: number; durationSlots: number }): Block {
      const s = weekStart
        .add(g.col, "day")
        .hour(START_HOUR)
        .minute(0)
        .add(g.startSlot * SLOT_MINUTES, "minute");

      const e = s.add(g.durationSlots * SLOT_MINUTES, "minute");

      return {
        ...b,
        start_time: s.toISOString(),
        end_time: e.toISOString(),
      };
    }

    function onMove(e: MouseEvent) {
      if (!gridRef.current || !gridWidth || !drag) return;

      const rect = gridRef.current.getBoundingClientRect();
      const gx = e.clientX - rect.left;
      const gy = e.clientY - rect.top;

      const dx = gx - drag.startGridX;
      const dy = gy - drag.startGridY;

      const totalGridWidth = gridWidth - 60;
      const dayWidth = totalGridWidth / 7;
      const deltaDays = Math.round(dx / dayWidth);
      const deltaSlots = Math.round(dy / SLOT_HEIGHT);

      let col = drag.startCol;
      let startSlot = drag.startSlot;
      let durationSlots = drag.durationSlots;

      if (drag.kind === "move") {
        col += deltaDays;
        startSlot += deltaSlots;
      } else if (drag.kind === "resize-top") {
        startSlot += deltaSlots;
        const maxStart =
          drag.startSlot + drag.durationSlots - MIN_DURATION_SLOTS;
        if (startSlot > maxStart) startSlot = maxStart;
      } else if (drag.kind === "resize-bottom") {
        durationSlots += deltaSlots;
        if (durationSlots < MIN_DURATION_SLOTS)
          durationSlots = MIN_DURATION_SLOTS;
      }

      if (col < 0) col = 0;
      if (col > 6) col = 6;

      if (startSlot < 0) startSlot = 0;
      if (startSlot > totalSlots - MIN_DURATION_SLOTS)
        startSlot = totalSlots - MIN_DURATION_SLOTS;

      if (startSlot + durationSlots > totalSlots)
        durationSlots = totalSlots - startSlot;

      setGhost({ col, startSlot, durationSlots });
    }

    function onUp() {
      if (!drag || !ghost) {
        setGhost(null);
        setDrag(null);
        return;
      }

      const updated = blocks.map((b) =>
        b.id === drag.blockId
          ? updateBlockFromGhost(b, ghost)
          : b
      );

      setBlocks(updated);
      setGhost(null);
      setDrag(null);

      updated.forEach(saveBlockPosition);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [drag, ghost, blocks, weekStart, gridWidth, totalSlots]);

  function saveBlockPosition(b: Block) {
    fetch("/api/blocks/update", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: b.id,
        start_time: b.start_time,
        end_time: b.end_time,
      }),
    }).catch(console.error);
  }

  function blockToGrid(b: Block) {
    const s = dayjs(b.start_time);
    const e = dayjs(b.end_time);
    let col = s.diff(weekStart, "day");
    if (col < 0) col = 0;
    if (col > 6) col = 6;
    const mins = (s.hour() - START_HOUR) * 60 + s.minute();
    let start = mins / SLOT_MINUTES;
    let dur = e.diff(s, "minute") / SLOT_MINUTES;
    if (dur < MIN_DURATION_SLOTS) dur = MIN_DURATION_SLOTS;
    if (start < 0) start = 0;
    if (start > totalSlots - MIN_DURATION_SLOTS)
      start = totalSlots - MIN_DURATION_SLOTS;
    if (start + dur > totalSlots) dur = totalSlots - start;
    return { col, startSlot: start, durationSlots: dur };
  }

  function eventToGrid(ev: ActualEvent) {
    const s = dayjs(ev.start_time);
    const startStr = ev.start_time;
    const isAllDay = startStr.length <= 10;
    const e = isAllDay
      ? s.add(1, "day")
      : dayjs(ev.end_time);

    let col = s.diff(weekStart, "day");
    if (col < 0) col = 0;
    if (col > 6) col = 6;

    const sMin =
      (s.hour() - START_HOUR) * 60 + s.minute();
    let startSlot = isAllDay
      ? 0
      : Math.floor(sMin / SLOT_MINUTES);

    let durationSlots = isAllDay
      ? totalSlots
      : Math.ceil(e.diff(s, "minute") / SLOT_MINUTES);

    if (startSlot < 0) startSlot = 0;
    if (startSlot > totalSlots - MIN_DURATION_SLOTS)
      startSlot = totalSlots - MIN_DURATION_SLOTS;

    if (startSlot + durationSlots > totalSlots)
      durationSlots = totalSlots - startSlot;

    return { col, startSlot, durationSlots, isAllDay };
  }

  function startDrag(
    e: React.MouseEvent,
    id: string,
    kind: DragKind
  ) {
    e.preventDefault();
    if (!gridRef.current || !gridWidth) return;
    const rect = gridRef.current.getBoundingClientRect();
    const gx = e.clientX - rect.left;
    const gy = e.clientY - rect.top;
    const b = blocks.find((x) => x.id === id);
    if (!b) return;
    const pos = blockToGrid(b);
    setDrag({
      blockId: id,
      kind,
      startGridX: gx,
      startGridY: gy,
      startCol: pos.col,
      startSlot: pos.startSlot,
      durationSlots: pos.durationSlots,
    });
    setGhost({
      col: pos.col,
      startSlot: pos.startSlot,
      durationSlots: pos.durationSlots,
    });
  }

  function addBlock(goalId: string) {
    const s = dayjs().hour(9).minute(0);
    const e = s.add(1, "hour");

    const b: Block = {
      id: crypto.randomUUID(),
      goal_id: goalId,
      start_time: s.toISOString(),
      end_time: e.toISOString(),
    };

    setBlocks((prev) => [...prev, b]);

    fetch("/api/blocks/create", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(b),
    });
  }

  return (
    <div className="relative">
      <div className="flex gap-2 mb-4 flex-wrap">
        {goals.map((g) => (
          <button
            key={g.id}
            onClick={() => addBlock(g.id)}
            className="bg-green-600 text-white text-xs px-3 py-1 rounded"
          >
            + {g.title}
          </button>
        ))}
      </div>

      <div
        ref={gridRef}
        className="relative border border-gray-800 bg-gray-950 rounded overflow-x-auto"
        style={{ minHeight: 600 }}
      >
        <div
          className="grid text-gray-200"
          style={{ gridTemplateColumns: "60px repeat(7,1fr)" }}
        >
          <div></div>
          {days.map((d) => (
            <div
              key={d}
              className="border-b border-gray-900 h-10 flex items-center justify-center font-semibold"
            >
              {d}
            </div>
          ))}

          {hours.map((hr) => (
            <div key={`hr-${hr}`} className="contents">
              <div className="text-xs text-gray-500 text-right pr-2 border-r border-gray-800">
                {dayjs().hour(hr).format("h A")}
              </div>
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={`cell-${hr}-${i}`}
                  className="border border-gray-900 h-[48px]"
                />
              ))}
            </div>
          ))}
        </div>

        <div className="absolute inset-0">
          {/* ACTUAL EVENTS (behind) */}
          {actualEvents.map((ev) => {
            const { col, startSlot, durationSlots, isAllDay } =
              eventToGrid(ev);

            const left = `calc(60px + ${col} * (100% - 60px) / 7)`;
            const top = startSlot * SLOT_HEIGHT;
            const height = durationSlots * SLOT_HEIGHT;

            return (
              <div
                key={ev.id}
                className={`absolute ${
                  isAllDay
                    ? "bg-red-700/40 border border-red-500/40"
                    : "bg-red-600/60"
                } text-white text-[10px] px-1 py-1 pointer-events-none rounded`}
                style={{
                  left,
                  top,
                  width: `calc((100% - 60px) / 7 - 6px)`,
                  height,
                  zIndex: 0,
                }}
              >
                {ev.summary ?? "Event"}
              </div>
            );
          })}

          {/* PLANNED BLOCKS */}
          {blocks.map((b) => {
            const pos = blockToGrid(b);
            const goal = goals.find((g) => g.id === b.goal_id);
            const isDragging =
              drag && drag.blockId === b.id && ghost;

            const left = `calc(60px + ${pos.col} * (100% - 60px) / 7)`;
            const top = pos.startSlot * SLOT_HEIGHT;
            const height = pos.durationSlots * SLOT_HEIGHT;

            return (
              <div
                key={b.id}
                className="absolute bg-blue-600 text-white text-[10px] rounded shadow"
                style={{
                  left,
                  top,
                  width: `calc((100% - 60px) / 7 - 6px)`,
                  height,
                  opacity: isDragging ? 0.35 : 1,
                  zIndex: 1,
                }}
              >
                <div
                  className="h-1 w-full cursor-n-resize"
                  onMouseDown={(e) =>
                    startDrag(e, b.id, "resize-top")
                  }
                />
                <div
                  className="flex-1 px-1 py-1 cursor-move"
                  onMouseDown={(e) => startDrag(e, b.id, "move")}
                >
                  {goal?.title}
                </div>
                <div
                  className="h-1 w-full cursor-s-resize"
                  onMouseDown={(e) =>
                    startDrag(e, b.id, "resize-bottom")
                  }
                />
              </div>
            );
          })}

          {/* GHOST BLOCK */}
          {drag && ghost && (() => {
            const { col, startSlot, durationSlots } = ghost;
            const left = `calc(60px + ${col} * (100% - 60px) / 7)`;
            const top = startSlot * SLOT_HEIGHT;
            const height = durationSlots * SLOT_HEIGHT;

            const block = blocks.find(
              (b) => b.id === drag.blockId
            );
            const goal = block
              ? goals.find((g) => g.id === block.goal_id)
              : null;

            return (
              <div
                className="absolute bg-blue-400/70 text-white text-[10px] rounded shadow pointer-events-none"
                style={{
                  left,
                  top,
                  width: `calc((100% - 60px) / 7 - 6px)`,
                  height,
                  zIndex: 2,
                }}
              >
                <div className="p-1 truncate">
                  {goal?.title ?? "Goal"}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
