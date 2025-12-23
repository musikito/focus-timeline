"use client";

import { useLayoutEffect, useState } from "react";
import { useTheme } from "next-themes";
import { WeeklyEmailToggle } from "@/components/weekly-email-toggle";
import { EmailInsightNowButton } from "@/components/email-insight-now-button";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="max-w-xl space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>

      {/* ---------------- Appearance ---------------- */}
      <section className="p-4 rounded border border-[var(--border)] bg-[var(--bg-alt)]">
        <h2 className="text-xl font-semibold mb-2">Appearance</h2>

        <p className="text-[var(--text-muted)] mb-4">
          Choose how FocusMirror looks.
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => setTheme("light")}
            className={`px-4 py-2 rounded border ${
              theme === "light"
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--bg)]"
            }`}
          >
            Light
          </button>

          <button
            onClick={() => setTheme("dark")}
            className={`px-4 py-2 rounded border ${
              theme === "dark"
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--bg)]"
            }`}
          >
            Dark
          </button>

          <button
            onClick={() => setTheme("system")}
            className={`px-4 py-2 rounded border ${
              theme === "system"
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--bg)]"
            }`}
          >
            System
          </button>
        </div>
      </section>

      {/* ---------------- Notifications ---------------- */}
      <section className="p-4 rounded border border-[var(--border)] bg-[var(--bg-alt)]">
        <h2 className="text-xl font-semibold mb-2">Notifications</h2>

        <p className="text-[var(--text-muted)] mb-4">
          Control how and when FocusMirror contacts you.
        </p>

        <div className="space-y-4">
          {/* Weekly email toggle */}
          <WeeklyEmailToggle initial={true} />

          {/* Manual send */}
          <EmailInsightNowButton />
        </div>
      </section>
    </div>
  );
}
