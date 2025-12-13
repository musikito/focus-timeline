"use client";

import { useState } from "react";

export function Notifications() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800"
      >
        🔔
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#0d1117] border shadow-lg rounded p-3 text-sm">
          <p className="text-gray-600 dark:text-gray-300">No new notifications.</p>
        </div>
      )}
    </div>
  );
}
