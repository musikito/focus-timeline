"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { AddGoalPopover } from "@/components/goals/add-goal-popover";

export function Topbar() {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0f14]/80 backdrop-blur">
      <div className="mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-lg font-bold text-blue-400">
            FocusMirror
          </Link>
          <span className="text-sm text-white/50">Dashboard</span>
        </div>

        <div className="flex items-center gap-3">
          <SignedIn>
            <button
              id="add-goal-button"
              ref={btnRef}
              onClick={() => setOpen((v) => !v)}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              + Goal
            </button>

            <AddGoalPopover open={open} onOpenChange={setOpen} anchorRef={btnRef} />

            <div className="ml-2">
              <UserButton />
            </div>
          </SignedIn>

          <SignedOut>
            <Link className="text-sm text-white/80 hover:text-white" href="/sign-in">
              Sign-in
            </Link>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}


// "use client";

// import Link from "next/link";
// import { UserButton } from "@clerk/nextjs";
// import { MobileDrawer } from "./mobile-drawer";
// import { Notifications } from "./notifications";
// import { Breadcrumbs } from "./breadcrumbs";
// import { SearchBar } from "./search";
// import { useState } from "react";
// import { AddGoalPopover } from "@/components/goals/add-goal-popover";

// export function Topbar() {
//   const [open, setOpen] = useState(false);
//   return (
//     <header
//       className="
//         sticky top-0 z-50 
//         h-16 
//         flex items-center justify-between 
//         px-4 
//         border-b border-[var(--border)] 
//         bg-[var(--bg-alt)]
//         backdrop-blur supports-[backdrop-filter]:bg-[var(--bg-alt)/80]
//       "
//     >
//       {/* Left side */}
//       <div className="flex items-center gap-4">
//         <MobileDrawer />

//         <Link
//           href="/dashboard"
//           className="text-2xl font-bold text-[var(--primary)]"
//         >
//           FocusMirror
//         </Link>

//         <div className="hidden md:block text-[var(--text-muted)] ml-4">
//           <Breadcrumbs />
//         </div>
//       </div>

//    <>
//       <header className="h-16 flex items-center justify-between px-4 border-b border-[var(--border)] bg-[var(--bg)] sticky top-0 z-40">
//         <h1 className="font-bold cursor-pointer">FocusMirror</h1>

//         {/* <button
//           id="add-goal-button"
//           onClick={() => setOpen(true)}
//           className="px-3 py-2 rounded bg-[var(--primary)] text-white text-sm"
//         >
//           + Goal
//         </button> */}
//         <button
//           id="add-goal-button"
//           onClick={() => setOpen(true)}
//           className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
//         >
//           + Goal
//         </button>
//       </header>

//      <AddGoalPopover open={open} onClose={() => setOpen(false)} />
//       {/* <AddGoalPopover /> */}
//     </>


//       {/* Right side */}
//       <div className="flex items-center gap-4">
//         <SearchBar />
//         <Notifications />

//         {/* User menu */}
//         <UserButton afterSignOutUrl="/" />
//       </div>
//     </header>
//   );
// }
// "use client";

// import Link from "next/link";
// import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
// import { AddGoalPopover } from "@/components/goals/add-goal-popover";

// export function Topbar() {
//   return (
//     <header className="sticky top-0 z-40 h-16 border-b border-white/10 bg-[#0b1220] text-white">
//       <div className="h-full px-4 flex items-center justify-between gap-3">
//         <div className="flex items-center gap-3">
//           <Link href="/dashboard" className="text-lg font-bold text-blue-400">
//             FocusMirror
//           </Link>
//           <span className="text-white/40 hidden sm:inline">Dashboard</span>
//         </div>

//         <div className="flex items-center gap-3">
//           <SignedIn>
//             <AddGoalPopover />
//             <div className="hidden md:flex items-center gap-2">
//               <input
//                 placeholder="Search..."
//                 className="w-[260px] rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//             <UserButton />
//           </SignedIn>

//           <SignedOut>
//             <Link href="/sign-in" className="text-sm text-white/70 hover:text-white">
//               Sign-in
//             </Link>
//           </SignedOut>
//         </div>
//       </div>
//     </header>
//   );
// }

