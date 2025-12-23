"use client";

import dayjs from "dayjs";
import { useState } from "react";

export function EmailInsightNowButton() {
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function sendNow() {
    setSending(true);
    setStatus(null);

    // Same week logic as the backend (Monday start)
    const weekStart = dayjs()
      .startOf("week")
      .add(1, "day")
      .format("YYYY-MM-DD");

    try {
      const res = await fetch("/api/email/send-weekly-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || "Failed to send email");
      }

      setStatus("Email sent ✅");
    } catch (err) {
      console.error(err);
      setStatus("Failed to send ❌");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={sendNow}
        disabled={sending}
        className="px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--bg-alt)] disabled:opacity-60"
      >
        {sending ? "Sending…" : "Email this now"}
      </button>

      {status && (
        <span className="text-sm text-[var(--text-muted)]">{status}</span>
      )}
    </div>
  );
}
