"use client";

import { Sidebar } from "./sidebar";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function MobileDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger Button */}
      <button
        className="md:hidden p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800"
        onClick={() => setOpen(true)}
      >
        ☰
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Drawer */}
            <motion.div
              className="fixed left-0 top-0 bottom-0 z-50"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
            >
              <Sidebar mobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
