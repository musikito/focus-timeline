/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useGoals, type GoalPriority } from "./goals-context";

const CATEGORIES = ["Work", "Health", "Learning", "Family", "Creative"] as const;

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

export function AddGoalPopover({
  open,
  onOpenChange,
  anchorRef,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}) {
  const { addGoal } = useGoals();
  const isMobile = useIsMobile();

  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState("");
  const [goalType, setGoalType] = useState<(typeof CATEGORIES)[number]>("Work");
  const [hours, setHours] = useState<number>(1);
  const [priority, setPriority] = useState<GoalPriority>("m");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSave = useMemo(() => title.trim().length > 0 && !saving, [title, saving]);

  // Autofocus when opened
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => titleRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  // Outside click to close
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const panel = panelRef.current;
      const anchor = anchorRef.current;

      if (panel && panel.contains(target)) return;
      if (anchor && anchor.contains(target)) return;

      onOpenChange(false);
    };

    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open, onOpenChange, anchorRef]);

  async function save() {
    setErr(null);
    if (!canSave) return;

    try {
      setSaving(true);

      await addGoal({
        title: title.trim(),
        goal_type: goalType,
        priority,
        target_hours: hours,
      });

      // Reset + close
      setTitle("");
      setGoalType("Work");
      setHours(1);
      setPriority("m");
      onOpenChange(false);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save goal");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  // ---- Mobile sheet variant (slide down) ----
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/60" />
        <div
          ref={panelRef}
          className="absolute top-0 left-0 right-0 rounded-b-2xl border-b border-white/10 bg-[#0d1117] p-4
                     animate-[slideDown_.18s_ease-out]"
        >
          <style>{`
            @keyframes slideDown {
              from { transform: translateY(-10px); opacity: .6; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>

          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-white">Add Goal</div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-sm text-white/70 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            <input
              id="goal-title-input"
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Goal name (e.g., Exercise)"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 outline-none focus:border-blue-500"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/60">Category</label>
                <select
                  id="goal-category"
                  value={goalType}
                  onChange={(e) => setGoalType(e.target.value as any)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-blue-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-[#0d1117]">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-white/60">Hours</label>
                <input
                  id="goal-hours"
                  type="number"
                  min={0}
                  step={0.5}
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-white/60">Priority</label>
              <div className="mt-1 flex gap-2">
                <button
                  onClick={() => setPriority("M")}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    priority === "M"
                      ? "border-blue-400 bg-blue-600 text-white"
                      : "border-white/10 bg-white/5 text-white/80"
                  }`}
                >
                  Major
                </button>
                <button
                  onClick={() => setPriority("m")}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    priority === "m"
                      ? "border-blue-400 bg-blue-600 text-white"
                      : "border-white/10 bg-white/5 text-white/80"
                  }`}
                >
                  Minor
                </button>
                <button
                  onClick={() => setPriority("O")}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    priority === "O"
                      ? "border-blue-400 bg-blue-600 text-white"
                      : "border-white/10 bg-white/5 text-white/80"
                  }`}
                >
                  Optional
                </button>
              </div>
            </div>

            {err && <div className="text-sm text-red-300">{err}</div>}

            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={() => onOpenChange(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={!canSave}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 hover:bg-blue-500"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Desktop popover variant (subtle pop animation) ----
  const anchor = anchorRef.current?.getBoundingClientRect();
  const top = (anchor?.bottom ?? 56) + 8;
  const left = Math.min((anchor?.left ?? 20), window.innerWidth - 420);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" />

      <div
        ref={panelRef}
        style={{ top, left, width: 400 }}
        className="absolute rounded-2xl border border-white/10 bg-[#0d1117] p-4 shadow-xl
                   animate-[pop_.14s_ease-out]"
      >
        <style>{`
          @keyframes pop {
            from { transform: translateY(-6px) scale(.98); opacity: .6; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
        `}</style>

        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white">Add Goal</div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-sm text-white/70 hover:text-white"
          >
            ESC
          </button>
        </div>

        <div className="mt-3 grid gap-3">
          <input
            id="goal-title-input"
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Goal name (e.g., Exercise)"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 outline-none focus:border-blue-500"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/60">Category</label>
              <select
                id="goal-category"
                value={goalType}
                onChange={(e) => setGoalType(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-blue-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-[#0d1117]">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-white/60">Hours</label>
              <input
                id="goal-hours"
                type="number"
                min={0}
                step={0.5}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/60">Priority</label>
            <div className="mt-1 flex gap-2">
              {([
                ["M", "Major"],
                ["m", "Minor"],
                ["O", "Optional"],
              ] as const).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setPriority(v)}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    priority === v
                      ? "border-blue-400 bg-blue-600 text-white"
                      : "border-white/10 bg-white/5 text-white/80"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {err && <div className="text-sm text-red-300">{err}</div>}

          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={!canSave}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 hover:bg-blue-500"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// "use client";

// import { useEffect, useRef, useState } from "react";
// import { useGoals } from "./goals-context";
// import { motion, AnimatePresence } from "framer-motion";

// export function AddGoalPopover({
//   open,
//   onClose,
// }: {
//   open: boolean;
//   onClose: () => void;
// }) {
//   const { setGoals } = useGoals();
//   const ref = useRef<HTMLDivElement>(null);
//   const inputRef = useRef<HTMLInputElement>(null);

//   const [title, setTitle] = useState("");
//   const [priority, setPriority] = useState<"M" | "m" | "O">("m");
//   const [saving, setSaving] = useState(false);

//   // Auto-focus
//   useEffect(() => {
//     if (open) {
//       setTimeout(() => inputRef.current?.focus(), 50);
//     }
//   }, [open]);

//   // Close on ESC
//   useEffect(() => {
//     function onKey(e: KeyboardEvent) {
//       if (e.key === "Escape") onClose();
//     }
//     document.addEventListener("keydown", onKey);
//     return () => document.removeEventListener("keydown", onKey);
//   }, [onClose]);

//   // Close on outside click
//   useEffect(() => {
//     function onClick(e: MouseEvent) {
//       if (ref.current && !ref.current.contains(e.target as Node)) {
//         onClose();
//       }
//     }
//     if (open) document.addEventListener("mousedown", onClick);
//     return () => document.removeEventListener("mousedown", onClick);
//   }, [open, onClose]);

//   async function save() {
//     if (!title.trim()) return;

//     setSaving(true);

//     const res = await fetch("/api/goals", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ title, priority }),
//     });

//     const json = await res.json();

//     if (res.ok) {
//       // 🔥 THIS IS THE FIX
//       setGoals((g) => [...g, json.goal]);

//       setTitle("");
//       setPriority("m");
//       onClose(); // ✅ CLOSE MODAL ON SUCCESS
//     }

//     setSaving(false);
//   }

//   return (
//     <AnimatePresence>
//       {open && (
//         <motion.div
//           initial={{ opacity: 0, y: -8 }}
//           animate={{ opacity: 1, y: 0 }}
//           exit={{ opacity: 0, y: -8 }}
//           className="fixed inset-0 z-50 flex justify-center pt-16"
//         >
//           <div
//             ref={ref}
//             className="
//               w-full max-w-md
//               rounded-xl
//               bg-[#161b22]
//               border border-[#30363d]
//               shadow-xl
//               p-4
//             "
//           >
//             <h3 className="text-lg font-semibold mb-3">Add Goal</h3>

//             <input
//               ref={inputRef}
//               value={title}
//               onChange={(e) => setTitle(e.target.value)}
//               placeholder="What do you want to focus on?"
//               className="w-full mb-3 px-3 py-2 rounded bg-[#0d1117] border border-[#30363d]"
//             />

//             <div className="flex gap-2 mb-4">
//               {(["M", "m", "O"] as const).map((p) => (
//                 <button
//                   key={p}
//                   onClick={() => setPriority(p)}
//                   className={`px-3 py-1 rounded border ${
//                     priority === p
//                       ? "bg-blue-600 text-white"
//                       : "bg-[#0d1117] border-[#30363d]"
//                   }`}
//                 >
//                   {p === "M" ? "Major" : p === "m" ? "Minor" : "Optional"}
//                 </button>
//               ))}
//             </div>

//             <button
//               onClick={save}
//               disabled={saving}
//               className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-60"
//             >
//               {saving ? "Saving…" : "Save Goal"}
//             </button>
//           </div>
//         </motion.div>
//       )}
//     </AnimatePresence>
//   );
// }
// "use client";

// import { useEffect, useMemo, useRef, useState } from "react";
// import { useGoals } from "@/components/goals/goals-context";

// type Props = {
//   triggerClassName?: string;
// };

// function useIsMobile() {
//   const [isMobile, setIsMobile] = useState(false);
//   useEffect(() => {
//     const mql = window.matchMedia("(max-width: 768px)");
//     const onChange = () => setIsMobile(mql.matches);
//     onChange();
//     mql.addEventListener("change", onChange);
//     return () => mql.removeEventListener("change", onChange);
//   }, []);
//   return isMobile;
// }

// export function AddGoalPopover({ triggerClassName }: Props) {
//   const { addGoal } = useGoals();
//   const isMobile = useIsMobile();

//   const [open, setOpen] = useState(false);
//   const [title, setTitle] = useState("");
//   const [goalType, setGoalType] = useState("Work");
//   const [priority, setPriority] = useState<"M" | "m" | "O">("m");
//   const [saving, setSaving] = useState(false);
//   const [err, setErr] = useState<string | null>(null);

//   const wrapRef = useRef<HTMLDivElement | null>(null);
//   const inputRef = useRef<HTMLInputElement | null>(null);

//   const canSave = useMemo(() => title.trim().length > 0 && goalType.trim().length > 0, [title, goalType]);

//   // Autofocus when opened
//   useEffect(() => {
//     if (!open) return;
//     setErr(null);
//     const t = window.setTimeout(() => inputRef.current?.focus(), 50);
//     return () => window.clearTimeout(t);
//   }, [open]);

//   // ESC close
//   useEffect(() => {
//     if (!open) return;
//     const onKey = (e: KeyboardEvent) => {
//       if (e.key === "Escape") setOpen(false);
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [open]);

//   // Outside click close
//   useEffect(() => {
//     if (!open) return;
//     const onDown = (e: MouseEvent) => {
//       const el = wrapRef.current;
//       if (!el) return;
//       if (!el.contains(e.target as Node)) setOpen(false);
//     };
//     document.addEventListener("mousedown", onDown);
//     return () => document.removeEventListener("mousedown", onDown);
//   }, [open]);

//   async function save() {
//     if (!canSave || saving) return;
//     setSaving(true);
//     setErr(null);
//     try {
//       await addGoal({ title: title.trim(), goal_type: goalType, priority });
//       setTitle("");
//       setGoalType("Work");
//       setPriority("m");
//       setOpen(false); // ✅ close after successful save
//     } catch (e: any) {
//       setErr(e?.message ?? "Failed to create goal");
//     } finally {
//       setSaving(false);
//     }
//   }

//   const panel = (
//     <div
//       className={[
//         "w-[360px] max-w-[92vw] rounded-xl border border-white/10 bg-[#0b1220] text-white shadow-2xl",
//         "backdrop-blur supports-[backdrop-filter]:bg-[#0b1220]/95",
//       ].join(" ")}
//     >
//       <div className="px-4 py-3 border-b border-white/10">
//         <div className="text-sm font-semibold">Add Goal</div>
//         <div className="text-xs text-white/60">Create a goal for this week.</div>
//       </div>

//       <div className="p-4 space-y-3">
//         <div>
//           <label className="text-xs text-white/60" htmlFor="goal-title">
//             Goal Title
//           </label>
//           <input
//             id="goal-title"
//             ref={inputRef}
//             value={title}
//             onChange={(e) => setTitle(e.target.value)}
//             placeholder="e.g., Exercise"
//             className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div>
//           <label className="text-xs text-white/60" htmlFor="goal-category">
//             Category
//           </label>
//           <select
//             id="goal-category"
//             value={goalType}
//             onChange={(e) => setGoalType(e.target.value)}
//             className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
//           >
//             {["Work", "Health", "Learning", "Family", "Creative"].map((v) => (
//               <option key={v} value={v}>
//                 {v}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div>
//           <label className="text-xs text-white/60 block mb-1" id="goal-priority">
//             Priority
//           </label>
//           <div className="grid grid-cols-3 gap-2">
//             {[
//               { k: "M", label: "Major" },
//               { k: "m", label: "Minor" },
//               { k: "O", label: "Optional" },
//             ].map((p) => (
//               <button
//                 key={p.k}
//                 onClick={() => setPriority(p.k as any)}
//                 className={[
//                   "rounded-lg border px-3 py-2 text-sm",
//                   priority === p.k
//                     ? "bg-blue-600 border-blue-400"
//                     : "bg-black/20 border-white/10 hover:bg-white/5",
//                 ].join(" ")}
//               >
//                 {p.label}
//               </button>
//             ))}
//           </div>
//         </div>

//         {err && <div className="text-xs text-red-300">{err}</div>}

//         <div className="flex items-center justify-end gap-2 pt-2">
//           <button
//             onClick={() => setOpen(false)}
//             className="px-3 py-2 text-sm rounded-lg border border-white/10 hover:bg-white/5"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={save}
//             disabled={!canSave || saving}
//             className="px-3 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60"
//           >
//             {saving ? "Saving..." : "Save"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div ref={wrapRef} className="relative">
//       <button
//         id="add-goal-button"
//         onClick={() => setOpen((v) => !v)}
//         className={triggerClassName ?? "px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500"}
//       >
//         + Goal
//       </button>

//       {/* Desktop popover */}
//       {!isMobile && open && (
//         <div
//           className={[
//             "absolute right-0 mt-3 origin-top-right",
//             "transition-all duration-150 ease-out",
//             "animate-in fade-in slide-in-from-top-2",
//             "z-50",
//           ].join(" ")}
//         >
//           {panel}
//         </div>
//       )}

//       {/* Mobile slide-down sheet */}
//       {isMobile && (
//         <div
//           className={[
//             "fixed left-0 right-0 top-16 z-50 px-3",
//             "transition-all duration-200 ease-out",
//             open ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none",
//           ].join(" ")}
//         >
//           {panel}
//         </div>
//       )}
//     </div>
//   );
// }
