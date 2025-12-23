"use client";

import { useEffect, useMemo, useState } from "react";

type Insight = {
  weekStart: string;
  summary: string;
  suggestions: string[];
  infographicSvg: string;
  cached: boolean;
};

function speak(text: string) {
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1;
  u.pitch = 1;
  u.lang = "en-US";
  synth.speak(u);
}

export function WeeklyInsightDialog() {
  const [open, setOpen] = useState(false);
  const [insight, setInsight] = useState<Insight | null>(null);

  const plainText = useMemo(() => {
    if (!insight?.summary) return "";
    return insight.summary
      .replace(/[#*`]/g, "")
      .replace(/\n+/g, " ")
      .trim();
  }, [insight]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/weekly-insight", { credentials: "include" });
      const json = (await res.json()) as Insight;
      setInsight(json);

      // Auto-open if new (not cached) OR once per session
      const key = `insight_seen_${json.weekStart}`;
      const seen = sessionStorage.getItem(key);
      if (!seen) {
        sessionStorage.setItem(key, "1");
        setOpen(true);
      }
    })().catch(console.error);
  }, []);

  if (!insight) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--bg-alt)] hover:opacity-90"
      >
        Weekly Insight
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Weekly Insight</h2>
                <p className="text-sm text-[var(--text-muted)]">{insight.weekStart}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => speak(plainText)}
                  className="px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--bg-alt)]"
                >
                  🔊 Voice Summary
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--bg-alt)]"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-alt)] p-4">
                <pre className="whitespace-pre-wrap text-sm leading-6">{insight.summary}</pre>
                <div className="mt-3">
                  <div className="text-sm font-semibold mb-2">Suggestions</div>
                  <ul className="list-disc pl-5 text-sm text-[var(--text-muted)] space-y-1">
                    {insight.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-alt)] p-4 overflow-auto">
                <div
                  className="w-full"
                  dangerouslySetInnerHTML={{ __html: insight.infographicSvg }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
