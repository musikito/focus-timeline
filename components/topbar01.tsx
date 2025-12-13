"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import ThemeToggleButton from "@/components/theme-toggle-button";

export function Topbar() {
  return (
    <header className="w-full h-16 flex items-center justify-between px-4 border-b bg-white dark:bg-[#0d1117]">
      {/* Logo / Name */}
      <Link href="/dashboard" className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
        FocusMirror
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <ThemeToggleButton />
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
