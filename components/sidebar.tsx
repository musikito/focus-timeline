"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Icons
import {
  LayoutDashboard,
  CalendarRange,
  ListChecks,
  CalendarSync,
  BarChart2,
  Settings,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Timeline", href: "/timeline", icon: CalendarRange },
  { name: "Goals", href: "/goals", icon: ListChecks },
  { name: "Calendar Sync", href: "/calendar", icon: CalendarSync },
  { name: "Reports", href: "/reports", icon: BarChart2 },
  { name: "Settings", href: "/settings", icon: Settings }, // ✅ Correct place
];

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "h-full w-64 border-r bg-white dark:bg-[#0d1117] p-4 flex flex-col gap-2",
        mobile && "w-full"
      )}
      // className="h-full w-64 border-r border-[var(--border)] bg-[var(--bg-alt)] p-4"

    >
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-2 rounded-md flex items-center gap-3 font-medium transition",
                active
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              )}
            >
              <Icon
                size={20}
                className={
                  active ? "text-white" : "text-gray-500 dark:text-gray-400"
                }
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
