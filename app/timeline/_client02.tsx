"use client";

import dayjs, { Dayjs } from "dayjs";
import { useEffect, useRef, useState } from "react";

const START_HOUR = 6;
const END_HOUR = 22; // exclusive
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 24; // px per 30 minutes
const MIN_DURATION_SLOTS = 2; // 1 hour

const hours = Array.from({ length: END_HOUR - START_HOUR }).map(
  (_, i) => START_HOUR + i
);
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

type DragKind = "move" | "resize-top" | "resize-bottom";

type DragState =
  | null
  | {
      blockId: string;
      kind: DragKind;
      // pointer position inside grid (at drag start)
      startGridX: number;
      startGridY: number;
      // block position in slots at drag start
      startCol: number;
      startSlot: number;
      durationSlots: number;
    };

const DEBUG = false;

export default function TimelineClient({
  goals,
  plannedBlocks,
}: {
  goals: Goal[];
  plannedBlocks: Block[];
}) {
  const [blocks, setBlocks] = useState<Block[]>(plannedBlocks);
  const [drag, setDrag] = useState<DragState>(null);
  const [ghost, setGhost] = useState<{
    col: number;
    startSlot: number;
    durationSlots: number;
  } | null>(null);

  const [weekStart] = useState<Dayjs>(() =>
    dayjs().startOf("week").add(1, "day") // Monday
  );

  const gridRef = useRef<HTMLDivElement | null>(null);
  const [gridWidth, setGridWidth] = useState<number | null>(null);

  // measure grid width
  useEffect(() => {
    function measure() {
      if (!gridRef.current) return;
      setGridWidth(gridRef.current.clientWidth);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // drag listeners
  useEffect(() => {
    if (!drag) return;

    function onMove(e: MouseEvent) {
      if (!gridRef.current || !gridWidth || !drag) return;

      const rect = gridRef.current.getBoundingClientRect();
      const gridX = e.clientX - rect.left;
      const gridY = e.clientY - rect.top;

      const deltaX = gridX - drag.startGridX;
      const deltaY = gridY - drag.startGridY;

      const totalGridWidth = gridWidth - 60; // minus time label col
      const dayWidth = totalGridWidth / 7;

      const deltaDays = Math.round(deltaX / dayWidth);
      const deltaSlots = Math.round(deltaY / SLOT_HEIGHT);

      let col = drag.startCol;
      let startSlot = drag.startSlot;
      let durationSlots = drag.durationSlots;

      if (drag.kind === "move") {
        col = drag.startCol + deltaDays;
        startSlot = drag.startSlot + deltaSlots;
      } else if (drag.kind === "resize-top") {
        startSlot = drag.startSlot + deltaSlots;
        // clamp so duration >= MIN_DURATION_SLOTS
        const maxStartSlot =
          drag.startSlot + drag.durationSlots - MIN_DURATION_SLOTS;
        if (startSlot > maxStartSlot) startSlot = maxStartSlot;
      } else if (drag.kind === "resize-bottom") {
        durationSlots = drag.durationSlots + deltaSlots;
        if (durationSlots < MIN_DURATION_SLOTS) {
          durationSlots = MIN_DURATION_SLOTS;
        }
      }

      // clamp column
      if (col < 0) col = 0;
      if (col > 6) col = 6;

      // total slots in a day
      const totalSlots = (END_HOUR - START_HOUR) * 2;

      if (startSlot < 0) startSlot = 0;
      if (startSlot > totalSlots - MIN_DURATION_SLOTS) {
        startSlot = totalSlots - MIN_DURATION_SLOTS;
      }
      if (startSlot + durationSlots > totalSlots) {
        durationSlots = totalSlots - startSlot;
      }

      setGhost({ col, startSlot, durationSlots });

      if (DEBUG) {
        console.log("drag", {
          deltaDays,
          deltaSlots,
          col,
          startSlot,
          durationSlots,
        });
      }
    }

    async function onUp() {
      if (!drag || !ghost) {
        setDrag(null);
        setGhost(null);
        return;
      }

      const { blockId } = drag;
      setDrag(null);

      // apply ghost to actual block
      setBlocks((prev) => {
        const next = prev.map((b) => {
          if (b.id !== blockId) return b;

          const { col, startSlot, durationSlots } = ghost;

          const start = weekStart
            .add(col, "day")
            .hour(START_HOUR)
            .minute(0)
            .add(startSlot * SLOT_MINUTES, "minute");

          const end = start.add(
            durationSlots * SLOT_MINUTES,
            "minute"
          );

          return {
            ...b,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
          };
        });

        // fire-and-forget save for that one block
        const updated = next.find((b) => b.id === blockId);
        if (updated) {
          fetch("/api/blocks/update", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: updated.id,
              start_time: updated.start_time,
              end_time: updated.end_time,
            }),
          }).catch((err) => console.error("Save error", err));
        }

        return next;
      });

      setGhost(null);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [drag, ghost, gridWidth, weekStart]);

  // Helpers: convert block to grid col/slot
  function blockToGrid(b: Block) {
    const start = dayjs(b.start_time);
    const end = dayjs(b.end_time);

    let col = start.diff(weekStart, "day");
    if (col < 0) col = 0;
    if (col > 6) col = 6;

    const totalMinutes =
      (start.hour() - START_HOUR) * 60 + start.minute();
    let startSlot = totalMinutes / SLOT_MINUTES;
    if (startSlot < 0) startSlot = 0;

    let durationSlots = end.diff(start, "minute") / SLOT_MINUTES;
    if (durationSlots < MIN_DURATION_SLOTS) {
      durationSlots = MIN_DURATION_SLOTS;
    }

    const totalSlots = (END_HOUR - START_HOUR) * 2;
    if (startSlot > totalSlots - MIN_DURATION_SLOTS) {
      startSlot = totalSlots - MIN_DURATION_SLOTS;
    }
    if (startSlot + durationSlots > totalSlots) {
      durationSlots = totalSlots - startSlot;
    }

    return { col, startSlot, durationSlots };
  }

  function startDrag(
    e: React.MouseEvent,
    blockId: string,
    kind: DragKind
  ) {
    e.preventDefault();
    e.stopPropagation();
    if (!gridRef.current || !gridWidth) return;

    const rect = gridRef.current.getBoundingClientRect();
    const gridX = e.clientX - rect.left;
    const gridY = e.clientY - rect.top;

    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;

    const { col, startSlot, durationSlots } = blockToGrid(block);

    setDrag({
      blockId,
      kind,
      startGridX: gridX,
      startGridY: gridY,
      startCol: col,
      startSlot,
      durationSlots,
    });

    setGhost({ col, startSlot, durationSlots });
  }

  function addBlock(goalId: string) {
    const start = dayjs().hour(9).minute(0);
    const end = start.add(1, "hour");

    const block: Block = {
      id: crypto.randomUUID(),
      goal_id: goalId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    };

    setBlocks((prev) => [...prev, block]);

    fetch("/api/blocks/create", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(block),
    }).catch((err) => console.error("Create error", err));
  }

  return (
    <div className="relative">
      {/* Add session per goal */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {goals.map((g, idx) => (
          <button
            key={g.id}
            onClick={() => addBlock(g.id)}
            className="px-3 py-1 rounded bg-green-600 text-white text-xs"
          >
            + {g.title || `Goal #${idx + 1}`}
          </button>
        ))}
      </div>

      <div
        ref={gridRef}
        className="relative border border-gray-800 bg-gray-950 overflow-x-auto rounded"
        style={{ minHeight: 600 }}
      >
        {/* Grid */}
        <div
          className="grid relative"
          style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}
        >
          <div />
          {days.map((d) => (
            <div
              key={d}
              className="text-center font-semibold py-2 border-b border-gray-800 text-gray-200"
            >
              {d}
            </div>
          ))}

          {hours.map((hr) => (
            <div key={`hr-${hr}`} className="contents">
              <div className="text-[10px] text-right pr-2 text-gray-500">
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

        {/* Blocks layer */}
        <div className="absolute inset-0">
          {blocks.map((b) => {
            const gridPos = blockToGrid(b);
            const goal = goals.find((g) => g.id === b.goal_id);

            // If this block is being dragged, show base at original
            const isDragging =
              drag && drag.blockId === b.id && ghost;

            const pos = isDragging ? gridPos : gridPos;
            // We still use real state here; ghost is rendered separately

            const left = `calc(60px + ${pos.col} * (100% - 60px) / 7)`;
            const top = pos.startSlot * SLOT_HEIGHT;
            const height = pos.durationSlots * SLOT_HEIGHT;

            return (
              <div
                key={b.id}
                className="absolute bg-blue-600 text-white text-[10px] rounded shadow cursor-default"
                style={{
                  left,
                  top,
                  width: `calc((100% - 60px) / 7 - 4px)`,
                  height,
                  opacity: isDragging ? 0.35 : 1,
                }}
              >
                {/* Resize top */}
                <div
                  className="h-1 w-full bg-blue-400 cursor-n-resize"
                  onMouseDown={(e) =>
                    startDrag(e, b.id, "resize-top")
                  }
                />
                {/* Body */}
                <div
                  className="flex-1 px-1 py-1 cursor-move"
                  onMouseDown={(e) => startDrag(e, b.id, "move")}
                >
                  <div className="font-semibold truncate">
                    {goal?.title ?? "Goal"}
                  </div>
                  <div className="opacity-80">
                    {dayjs(b.start_time).format("h:mm A")} –{" "}
                    {dayjs(b.end_time).format("h:mm A")}
                  </div>
                </div>
                {/* Resize bottom */}
                <div
                  className="h-1 w-full bg-blue-400 cursor-s-resize"
                  onMouseDown={(e) =>
                    startDrag(e, b.id, "resize-bottom")
                  }
                />
              </div>
            );
          })}

          {/* Ghost block (preview while dragging) */}
          {drag && ghost && (() => {
            const { col, startSlot, durationSlots } = ghost;
            const left = `calc(60px + ${col} * (100% - 60px) / 7)`;
            const top = startSlot * SLOT_HEIGHT;
            const height = durationSlots * SLOT_HEIGHT;

            const block = blocks.find((b) => b.id === drag.blockId);
            const goal = block
              ? goals.find((g) => g.id === block.goal_id)
              : null;

            return (
              <div
                className="absolute bg-blue-400/70 text-white text-[10px] rounded shadow pointer-events-none"
                style={{
                  left,
                  top,
                  width: `calc((100% - 60px) / 7 - 4px)`,
                  height,
                }}
              >
                <div className="px-1 py-1">
                  <div className="font-semibold truncate">
                    {goal?.title ?? "Goal"}
                  </div>
                  {block && (
                    <div className="opacity-80">
                      {dayjs(block.start_time).format("h:mm A")} → drag…
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
