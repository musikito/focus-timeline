"use client";

import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export function AddGoalModal({ open, onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"M" | "m" | "O">("m");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function save() {
    if (!title.trim()) return;

    setSaving(true);
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, priority }),
    });
    setSaving(false);
    setTitle("");
    onCreated?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-[var(--bg)] rounded-xl border border-[var(--border)] w-full max-w-md p-5">
        <h2 className="text-lg font-semibold mb-4">Add Goal</h2>

        <input
          id="goal-title"
          className="w-full mb-3 px-3 py-2 border rounded bg-[var(--bg-alt)]"
          placeholder="Goal name (e.g. Exercise)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div id="goal-priority" className="flex gap-2 mb-4">
          {(["M", "m", "O"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className={`px-3 py-2 rounded border ${
                priority === p
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--bg-alt)]"
              }`}
            >
              {p === "M" ? "Major" : p === "m" ? "Minor" : "Optional"}
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm">
            Cancel
          </button>
          <button
            disabled={saving}
            onClick={save}
            className="px-4 py-2 rounded bg-[var(--primary)] text-white"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
