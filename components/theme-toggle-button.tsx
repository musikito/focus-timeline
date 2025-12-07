"use client";

import { useTheme } from "@/components/theme-provider";
import { useEffect, useState } from "react";

export default function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  const isClient = typeof window !== "undefined";

  if (!isClient) {
    // Render placeholder button shape but no dynamic text yet
    return (
      <button
        className="text-xs py-2 px-3 rounded bg-gray-700 text-gray-100 dark:bg-gray-300 dark:text-gray-900 w-full opacity-0"
        aria-hidden="true"
      />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="text-xs py-2 px-3 rounded bg-gray-700 text-gray-100 dark:bg-gray-300 dark:text-gray-900 w-full"
    >
      Switch to {theme === "light" ? "Dark" : "Light"} Mode
    </button>
  );
}
