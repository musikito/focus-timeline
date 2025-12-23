/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";

export function AddGoalPopover({
  onCreated,
}: {
  onCreated?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [hours, setHours] = useState(1);
  const [priority, setPriority] = useState<"M" | "m" | "O">("m");

  async function handleSave() {
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        planned_hours: hours,
        priority,
      }),
    });

    setTitle("");
    setHours(1);
    setPriority("m");
    setOpen(false);
    onCreated?.();
  }

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        id="add-goal-button"
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
      >
        + Goal
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border border-white/10 bg-[#0d1117] shadow-xl z-50">
          <div className="p-4 space-y-4">
            <h3 className="text-sm font-semibold">Add Goal</h3>

            <input
              placeholder="Goal name (e.g. Exercise)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded bg-black/30 border border-white/10 text-sm"
            />

            <div className="flex gap-2">
              {[
                { label: "Major", value: "M" },
                { label: "Minor", value: "m" },
                { label: "Optional", value: "O" },
              ].map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value as any)}
                  className={`flex-1 py-2 rounded border text-sm ${
                    priority === p.value
                      ? "bg-blue-600 text-white border-blue-500"
                      : "border-white/10 text-white/70 hover:bg-white/5"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm text-white/70">Hours</label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-20 px-2 py-1 rounded bg-black/30 border border-white/10 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setOpen(false)}
                className="text-sm text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
