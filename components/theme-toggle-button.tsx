/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button className="px-3 py-2 text-xs rounded bg-gray-200 dark:bg-gray-700">
        …
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="px-3 py-2 text-xs rounded bg-gray-200 dark:bg-gray-700"
    >
      {isDark ? "Light" : "Dark"}
    </button>
  );
}
