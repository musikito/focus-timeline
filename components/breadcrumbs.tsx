"use client";

import { usePathname } from "next/navigation";

export function Breadcrumbs() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);

  return (
    <div className="text-sm text-gray-500 dark:text-gray-400">
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && " / "}
          {part.charAt(0).toUpperCase() + part.slice(1)}
        </span>
      ))}
    </div>
  );
}
