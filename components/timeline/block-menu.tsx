/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";

export function BlockMenu({ block }: { block: any }) {
  const [open, setOpen] = useState(false);

  async function deleteBlock() {
    await fetch(`/api/blocks/${block.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    window.location.reload();
  }

  return (
    <div className="absolute top-1 right-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="text-white/80 hover:text-white"
      >
        ⋮
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-32 rounded bg-[#0f172a] border border-white/10 shadow-lg z-50">
          <button className="menu-item">Edit</button>
          <button className="menu-item" onClick={deleteBlock}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
