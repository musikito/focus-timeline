"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { MobileDrawer } from "./mobile-drawer";
import { Notifications } from "./notifications";
import { Breadcrumbs } from "./breadcrumbs";
import { SearchBar } from "./search";

export function Topbar() {
  return (
    <header
      className="
        sticky top-0 z-50 
        h-16 
        flex items-center justify-between 
        px-4 
        border-b border-[var(--border)] 
        bg-[var(--bg-alt)]
        backdrop-blur supports-[backdrop-filter]:bg-[var(--bg-alt)/80]
      "
    >
      {/* Left side */}
      <div className="flex items-center gap-4">
        <MobileDrawer />

        <Link
          href="/dashboard"
          className="text-2xl font-bold text-[var(--primary)]"
        >
          FocusMirror
        </Link>

        <div className="hidden md:block text-[var(--text-muted)] ml-4">
          <Breadcrumbs />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <SearchBar />
        <Notifications />

        {/* User menu */}
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
