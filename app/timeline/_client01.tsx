
"use client";

import dayjs, { Dayjs } from "dayjs";
import { useEffect, useRef, useState } from "react";

const START_HOUR = 6;
const END_HOUR = 22; // exclusive
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 24; // px per 30 minutes
const MIN_DURATION_SLOTS = 2; // 2 * 30min = 1 hour

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

type DragState =
  | null
  | {
      type: "move" | "resize-top" | "resize-bottom";
      blockId: string;
      startClientX: number;
      startClientY: number;
      originalStart: string;
      originalEnd: string;
    };

const hours = Array.from({ length: END_HOUR - START_HOUR }).map(
  (_, i) => START_HOUR + i
);
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function TimelineClient({
  goals,
  plannedBlocks,
}: {
  goals: Goal[];
  plannedBlocks: Block[];
}) {
  const [blocks, setBlocks] = useState<Block[]>(plannedBlocks);
  const [drag, setDrag] = useState<DragState>(null);
  const [weekStart] = useState<Dayjs>(() =>
    dayjs().startOf("week").add(1, "day") // Monday
  );
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [gridWidth, setGridWidth] = useState<number | null>(null);

  // measure grid width for horizontal drag → day change
  useEffect(() => {
    function measure() {
      if (gridRef.current) {
        setGridWidth(gridRef.current.clientWidth);
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Global drag listeners
  useEffect(() => {
    if (!drag) return;
    function onMove(e: MouseEvent) {
      if (!gridWidth || !drag) return;
      const deltaX = e.clientX - drag.startClientX;
      const deltaY = e.clientY - drag.startClientY;

      setBlocks((prev) =>
        prev.map((b) => {
          if (b.id !== drag.blockId) return b;

          const origStart = dayjs(drag.originalStart);
          const origEnd = dayjs(drag.originalEnd);

          const totalGridWidth = gridWidth - 60; // minus time labels
          const dayWidth = totalGridWidth / 7;

          if (drag.type === "move") {
            const dayDiff = Math.round(deltaX / dayWidth);
            const slotDiff = Math.round(deltaY / SLOT_HEIGHT);

            let newStart = origStart
              .add(dayDiff, "day")
              .add(slotDiff * SLOT_MINUTES, "minute");
            let newEnd = newStart.add(
              Math.max(
                MIN_DURATION_SLOTS,
                origEnd.diff(origStart, "minute") / SLOT_MINUTES
              ) * SLOT_MINUTES,
              "minute"
            );

            [newStart, newEnd] = clampToWeek(newStart, newEnd, weekStart);

            return {
              ...b,
              start_time: newStart.toISOString(),
              end_time: newEnd.toISOString(),
            };
          }

          if (drag.type === "resize-top") {
            const slotDiff = Math.round(deltaY / SLOT_HEIGHT);
            let newStart = origStart.add(
              slotDiff * SLOT_MINUTES,
              "minute"
            );
            let newEnd = origEnd;

            if (
              newEnd.diff(newStart, "minute") / SLOT_MINUTES <
              MIN_DURATION_SLOTS
            ) {
              newStart = newEnd
                .subtract(MIN_DURATION_SLOTS * SLOT_MINUTES, "minute");
            }

            [newStart, newEnd] = clampToWeek(newStart, newEnd, weekStart);

            return {
              ...b,
              start_time: newStart.toISOString(),
              end_time: newEnd.toISOString(),
            };
          }

          if (drag.type === "resize-bottom") {
            const slotDiff = Math.round(deltaY / SLOT_HEIGHT);
            let newEnd = origEnd.add(
              slotDiff * SLOT_MINUTES,
              "minute"
            );
            let newStart = origStart;

            if (
              newEnd.diff(newStart, "minute") / SLOT_MINUTES <
              MIN_DURATION_SLOTS
            ) {
              newEnd = newStart.add(
                MIN_DURATION_SLOTS * SLOT_MINUTES,
                "minute"
              );
            }

            [newStart, newEnd] = clampToWeek(newStart, newEnd, weekStart);

            return {
              ...b,
              start_time: newStart.toISOString(),
              end_time: newEnd.toISOString(),
            };
          }

          return b;
        })
      );
    }
    
    async function onUp() {
      if (!drag) return;
      const block = blocks.find((b) => b.id === drag.blockId);
      setDrag(null);
      if (!block) return;

      // save this block
      try {
        await fetch("/api/blocks/update", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: block.id,
            start_time: block.start_time,
            end_time: block.end_time,
          }),
        });
      } catch (e) {
        console.error("Failed to save block:", e);
      }
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [drag, gridWidth, weekStart, blocks]);

  function getBlockPosition(block: Block) {
    const start = dayjs(block.start_time);
    const end = dayjs(block.end_time);

    const dayOffset = start.diff(weekStart, "day");
    const safeDay = Math.min(Math.max(dayOffset, 0), 6);

    const totalMinutes =
      (start.hour() - START_HOUR) * 60 + start.minute();
    const startSlots = totalMinutes / SLOT_MINUTES;
    const durationSlots = Math.max(
      MIN_DURATION_SLOTS,
      end.diff(start, "minute") / SLOT_MINUTES
    );

    return {
      column: safeDay,
      top: startSlots * SLOT_HEIGHT,
      height: durationSlots * SLOT_HEIGHT,
    };
  }

  function handleMouseDown(
    e: React.MouseEvent,
    blockId: string,
    type: Exclude<DragState, null>["type"]
  ) {
    e.preventDefault();
    e.stopPropagation();
    const b = blocks.find((blk) => blk.id === blockId);
    if (!b) return;
    setDrag({
      type,
      blockId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      originalStart: b.start_time,
      originalEnd: b.end_time,
    });
  }

  function createBlock(goalId: string) {
    const start = dayjs().hour(9).minute(0);
    const end = start.add(1, "hour");

    const newBlock: Block = {
      id: crypto.randomUUID(),
      goal_id: goalId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    };

    setBlocks((prev) => [...prev, newBlock]);

    fetch("/api/blocks/create", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBlock),
    }).catch((err) => console.error("Failed to create block:", err));
  }

  return (
    <div className="relative">
      {/* Add Session UI */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {goals.map((g) => (
          <button
            key={g.id}
            onClick={() => createBlock(g.id)}
            className="border px-3 py-1 rounded bg-green-600 text-white text-xs"
          >
            + {g.title}
          </button>
        ))}
      </div>

      <div
        ref={gridRef}
        className="relative overflow-x-auto border border-gray-300 dark:border-gray-700 rounded bg-gray-900"
        style={{ minHeight: 600 }}
      >
        {/* Grid */}
        <div
          className="grid relative"
          style={{
            gridTemplateColumns: "60px repeat(7, 1fr)",
          }}
        >
          {/* Header */}
          <div></div>
          {days.map((d) => (
            <div
              key={d}
              className="text-center font-bold py-2 border-b border-gray-700"
            >
              {d}
            </div>
          ))}

          {/* Time grid */}
          {hours.map((hr) => (
            <div key={`row-${hr}`} className="contents">
              <div className="text-xs text-right pr-2 text-gray-400">
                {dayjs().hour(hr).format("h A")}
              </div>
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={`cell-${hr}-${i}`}
                  className="border border-gray-800 h-[48px]"
                />
              ))}
            </div>
          ))}
        </div>

        {/* Blocks overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {blocks.map((block) => {
            const p = getBlockPosition(block);
            const goal = goals.find((g) => g.id === block.goal_id);

            return (
              <div
                key={block.id}
                className="absolute pointer-events-auto rounded bg-blue-600 text-white text-xs shadow-md flex flex-col"
                style={{
                  left: `calc(60px + ${p.column} * (100% - 60px) / 7)`,
                  top: p.top,
                  width: `calc((100% - 60px) / 7 - 4px)`,
                  height: p.height,
                  minHeight: MIN_DURATION_SLOTS * SLOT_HEIGHT,
                }}
              >
                {/* Resize top */}
                <div
                  className="h-2 w-full cursor-n-resize flex items-center justify-center text-[8px] opacity-60 hover:opacity-100"
                  onMouseDown={(e) =>
                    handleMouseDown(e, block.id, "resize-top")
                  }
                >
                  ⋮
                </div>

                {/* Body (drag) */}
                <div
                  className="flex-1 px-2 py-1 cursor-move"
                  onMouseDown={(e) => handleMouseDown(e, block.id, "move")}
                >
                  <div className="font-semibold truncate">
                    {goal?.title ?? "Untitled"}
                  </div>
                  <div className="text-[10px] opacity-80">
                    {dayjs(block.start_time).format("h:mm A")} –{" "}
                    {dayjs(block.end_time).format("h:mm A")}
                  </div>
                </div>

                {/* Resize bottom */}
                <div
                  className="h-2 w-full cursor-s-resize flex items-center justify-center text-[8px] opacity-60 hover:opacity-100"
                  onMouseDown={(e) =>
                    handleMouseDown(e, block.id, "resize-bottom")
                  }
                >
                  ⋮
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Clamp start/end to Mon–Sun, START_HOUR–END_HOUR window */
function clampToWeek(start: Dayjs, end: Dayjs, weekStart: Dayjs): [Dayjs, Dayjs] {
  const minStart = weekStart.hour(START_HOUR).minute(0).second(0);
  const maxEnd = weekStart
    .add(6, "day")
    .hour(END_HOUR)
    .minute(0)
    .second(0);

  if (start.isBefore(minStart)) {
    const diff = end.diff(start, "minute");
    start = minStart;
    end = start.add(diff, "minute");
  }
  if (end.isAfter(maxEnd)) {
    const diff = end.diff(start, "minute");
    end = maxEnd;
    start = end.subtract(diff, "minute");
  }

  return [start, end];
}

// "use client";

// import {
//   DndContext,
//   useSensor,
//   useSensors,
//   PointerSensor,
// } from "@dnd-kit/core";
// import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
// import { createPortal } from "react-dom";
// import dayjs from "dayjs";
// import { useState } from "react";

// const hours = Array.from({ length: 16 }).map((_, i) => 6 + i);
// const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// const SLOT_HEIGHT = 25; // 30 min slot = 25px
// const BLOCK_MIN_SLOTS = 2; // 1 hour minimum

// export default function TimelineClient({ goals, plannedBlocks }: { goals: any[]; plannedBlocks: any[] }) {
//   const [blocks, setBlocks] = useState(plannedBlocks);

//   const weekStart = dayjs().startOf("week").add(1, "day"); // Monday

//   const sensors = useSensors(
//     useSensor(PointerSensor, {
//       activationConstraint: { distance: 4 },
//     })
//   );

//   function getBlockPosition(block: any) {
//     const start = dayjs(block.start_time);
//     const end = dayjs(block.end_time);

//     const dayOffset = start.diff(weekStart, "day");

//     const startSlots = (start.hour() - 6) * 2 + start.minute() / 30;
//     const durationSlots = end.diff(start, "minute") / 30;

//     return {
//       column: dayOffset,
//       top: startSlots * SLOT_HEIGHT,
//       height: durationSlots * SLOT_HEIGHT,
//     };
//   }

//   async function saveBlock(updatedBlock: any) {
//     await fetch("/api/blocks/update", {
//       method: "POST",
//       credentials: "include",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(updatedBlock),
//     });
//   }

//   function moveBlock(blockId: string, x: number, y: number) {
//     setBlocks((prev) =>
//       prev.map((b) => {
//         if (b.id !== blockId) return b;

//         const p = getBlockPosition(b);

//         // Convert pixels to slots
//         const deltaDay = Math.round(x / p.height);
//         const deltaSlots = Math.round(y / SLOT_HEIGHT);

//         const oldStart = dayjs(b.start_time);
//         const newStart = oldStart.add(deltaDay, "day").add(deltaSlots * 30, "minute");

//         const newEnd = newStart.add(1, "hour");

//         return {
//           ...b,
//           start_time: newStart.toISOString(),
//           end_time: newEnd.toISOString(),
//         };
//       })
//     );
//   }

//   return (
//     <div className="relative overflow-x-auto">
//       {/* Grid */}
//       <div className="grid relative" style={{
//         gridTemplateColumns: "60px repeat(7, 1fr)",
//       }}>
//         {/* Header */}
//         <div></div>
//         {days.map((d) => (
//           <div
//             key={d}
//             className="text-center font-bold py-2 border-b border-gray-300 dark:border-gray-700"
//           >
//             {d}
//           </div>
//         ))}

//         {/* Time grid */}
//         {hours.map((hr) => (
//           <div key={`row-${hr}`} className="contents">
//             {/* Hour label */}
//             <div className="text-sm text-right pr-2 text-gray-500">
//               {dayjs().hour(hr).format("h A")}
//             </div>

//             {Array.from({ length: 7 }).map((_, i) => (
//               <div
//                 key={`cell-${hr}-${i}`}
//                 className="border border-gray-200 dark:border-gray-700 h-[50px]"
//               />
//             ))}
//           </div>
//         ))}
//       </div>

//       {/* Blocks overlay */}
//       <DndContext
//         sensors={sensors}
//         modifiers={[restrictToFirstScrollableAncestor]}
//         onDragEnd={() => { }}
//         onDragMove={(event) => {
//           const { active, delta } = event;
//           moveBlock(String(active.id), delta.x, delta.y);
//         }}
//       >
//         {blocks.map((block) => {
//           const p = getBlockPosition(block);
//           const goal = goals.find((g) => g.id === block.goal_id);

//           return (
//             <div
//               id={block.id}
//               key={block.id}
//               className="absolute bg-blue-600 cursor-move text-white text-xs rounded p-1 shadow-md"
//               style={{
//                 left: `calc(60px + ${p.column} * (100% - 60px) / 7)`,
//                 top: p.top,
//                 width: `calc((100% - 60px) / 7 - 4px)`,
//                 height: p.height,
//               }}
//             >
//               {goal?.title ?? "Untitled"}
//             </div>
//           );

//         })}
//       </DndContext>
//     </div>
//   );
// }

// "use client";

// import dayjs from "dayjs";
// import { useState } from "react";

// const hours = Array.from({ length: 16 }).map((_, i) => 6 + i); // 6am → 10pm
// const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// type Goal = {
//   id: string;
//   title: string;
//   // add other properties as needed
// };

// type PlannedBlock = {
//   id: string;
//   goal_id: string;
//   start_time: string;
//   end_time: string;
//   // add other properties as needed
// };

// interface TimelineClientProps {
//   goals: Goal[];
//   plannedBlocks: PlannedBlock[];
// }

// export default function TimelineClient({ goals, plannedBlocks }: TimelineClientProps) {
//   // Local temp state
//   const [blocks, setBlocks] = useState(plannedBlocks);

//   const weekStart = dayjs().startOf("week").add(1, "day"); // Monday

//   interface BlockPosition {
//     column: number;
//     top: number;
//     height: number;
//   }

//   function getBlockPosition(block: PlannedBlock): BlockPosition {
//     const start = dayjs(block.start_time);
//     const end = dayjs(block.end_time);

//     const dayOffset = start.diff(weekStart, "day");
//     const startHourOffset = start.hour() + start.minute() / 60 - 6;
//     const durationHours = end.diff(start, "minute") / 60;

//     return {
//       column: dayOffset,
//       top: startHourOffset * 50, // 50px per hour row height
//       height: durationHours * 50,
//     };
//   }

//   return (
//     <div className="overflow-x-auto">
//       <div className="grid" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
//         {/* Header */}
//         <div></div>
//         {days.map((d) => (
//           <div key={d} className="text-center font-bold py-2">
//             {d}
//           </div>
//         ))}

//         {/* Hour Labels + Grid */}
//         {hours.map((hr) => (
//           <div key={`row-${hr}`} className="contents">
//             {/* Time label */}
//             <div className="text-sm text-right pr-2 text-gray-500">
//               {dayjs().hour(hr).format("h A")}
//             </div>

//             {days.map((_, i) => (
//               <div
//                 key={`cell-${hr}-${i}`}
//                 className="border border-gray-200 dark:border-gray-700 h-[50px]"
//               />
//             ))}
//           </div>
//         ))}


//         {/* Planned Blocks */}
//         {blocks.map((block) => {
//           const p = getBlockPosition(block);
//           const goal = goals.find((g) => g.id === block.goal_id);

//           return (
//             <div
//               key={block.id}
//               className="absolute rounded bg-blue-600 text-white text-xs p-1"
//               style={{
//                 left: `calc(60px + ${p.column} * 1fr)`,
//                 top: p.top,
//                 width: `calc((100% - 60px) / 7 - 4px)`,
//                 height: p.height,
//               }}
//             >
//               {goal?.title}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }


// "use client";

// import { useState } from "react";

// const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// export default function TimelineClient({ goals }: any) {
//   const [blocks, setBlocks] = useState<any[]>([]);

//   function addBlock(goal: any) {
//     setBlocks((prev) => [
//       ...prev,
//       {
//         id: crypto.randomUUID(),
//         goalId: goal.id,
//         title: goal.title,
//         day: 0,
//         duration: 2, // hours
//       },
//     ]);
//   }

//   function moveBlock(id: string, direction: number) {
//     setBlocks((prev) =>
//       prev.map((b) =>
//         b.id === id ? { ...b, day: (b.day + direction + 7) % 7 } : b
//       )
//     );
//   }

//   function stretchBlock(id: string, delta: number) {
//     setBlocks((prev) =>
//       prev.map((b) =>
//         b.id === id
//           ? { ...b, duration: Math.max(1, b.duration + delta) }
//           : b
//       )
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Goals list to create blocks */}
//       <div className="flex gap-2 flex-wrap">
//         {goals.map((g: any) => (
//           <button
//             key={g.id}
//             className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
//             onClick={() => addBlock(g)}
//           >
//             + {g.title}
//           </button>
//         ))}
//       </div>

//       {/* Weekly grid */}
//       <div className="grid grid-cols-7 gap-2">
//         {days.map((d, i) => (
//           <div
//             key={d}
//             className="border border-gray-300 dark:border-gray-700 p-2 min-h-[300px]"
//           >
//             <p className="text-sm font-semibold mb-2 text-center">{d}</p>

//             {blocks
//               .filter((b) => b.day === i)
//               .map((b) => (
//                 <div
//                   key={b.id}
//                   className="bg-purple-600 text-white text-xs p-2 rounded mb-2 cursor-pointer"
//                 >
//                   {b.title} ({b.duration}h)
//                   <div className="flex justify-between mt-1 text-[10px]">
//                     <button onClick={() => moveBlock(b.id, -1)}>←</button>
//                     <button onClick={() => stretchBlock(b.id, +1)}>＋</button>
//                     <button onClick={() => stretchBlock(b.id, -1)}>−</button>
//                     <button onClick={() => moveBlock(b.id, +1)}>→</button>
//                   </div>
//                 </div>
//               ))}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
