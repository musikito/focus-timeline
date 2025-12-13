"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Settings } from "lucide-react";


const navItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Timeline", href: "/timeline" },
  { name: "Goals", href: "/goals" },
  { name: "Calendar Sync", href: "/calendar" },
  { name: "Reports", href: "/reports" },
     { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "h-full w-64 border-r bg-white dark:bg-[#0d1117] p-4 flex flex-col gap-2",
        mobile && "w-full"
      )}
    >
      
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          
          <Link
          
            key={item.href}
            href={item.href}
            className={cn(
              "px-3 py-2 rounded-md font-medium transition",
              pathname.startsWith(item.href)
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            )}
          >
            {item.name}
         

          </Link>
          
        ))}
      </nav>
    </aside>
  );
}
