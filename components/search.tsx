"use client";

import { useState } from "react";

export function SearchBar() {
  const [query, setQuery] = useState("");

  return (
    <input
      className="hidden md:block border px-3 py-2 rounded bg-gray-100 dark:bg-gray-800 text-sm w-64"
      placeholder="Search..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}
