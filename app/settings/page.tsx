"use client";

import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-3xl font-bold mb-4">Settings</h1>

      <section className="p-4 rounded border border-[var(--border)] bg-[var(--bg-alt)]">
        <h2 className="text-xl font-semibold mb-2">Appearance</h2>

        <p className="text-[var(--text-muted)] mb-4">
          Choose how FocusMirror looks.
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => setTheme("light")}
            className={`
              px-4 py-2 rounded border 
              ${theme === "light" ? "bg-[var(--primary)] text-white" : "bg-[var(--bg)]"}
            `}
          >
            Light
          </button>

          <button
            onClick={() => setTheme("dark")}
            className={`
              px-4 py-2 rounded border 
              ${theme === "dark" ? "bg-[var(--primary)] text-white" : "bg-[var(--bg)]"}
            `}
          >
            Dark
          </button>

          <button
            onClick={() => setTheme("system")}
            className={`
              px-4 py-2 rounded border 
              ${theme === "system" ? "bg-[var(--primary)] text-white" : "bg-[var(--bg)]"}
            `}
          >
            System
          </button>
        </div>
      </section>
    </div>
  );
}
