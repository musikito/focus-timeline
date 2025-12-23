"use client";

import { useState } from "react";

export function WeeklyEmailToggle({ initial }: { initial: boolean }) {
  const [enabled, setEnabled] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function save(nextValue: boolean) {
    setSaving(true);
    setEnabled(nextValue);

    const res = await fetch("/api/settings/weekly-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: nextValue }), // ✅ no "v"
    });

    setSaving(false);

    if (!res.ok) {
      // rollback if API fails
      setEnabled((prev) => !prev);
      console.error("Failed to update weekly email setting");
    }
  }

  return (
    <label className="flex items-center gap-3">
      <input
        type="checkbox"
        checked={enabled}
        disabled={saving}
        onChange={(e) => save(e.target.checked)} // ✅ defines the value
      />
      <span className="text-sm">
        Email me my weekly insight {saving ? "(saving…)" : ""}
      </span>
    </label>
  );
}
