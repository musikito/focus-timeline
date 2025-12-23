"use client";

import { useMemo, useState } from "react";
import { useGoals } from "@/components/goals/goals-context";
import { EmptyPlannerState } from "@/components/empty-planner-state";
import { PlanWalkthrough } from "@/components/walkthrough/plan-walkthrough";

export default function DashboardClient({
  hasCompletedWalkthrough,
}: {
  hasCompletedWalkthrough: boolean;
}) {
  const { goals } = useGoals();
  const [walkthroughDone, setWalkthroughDone] = useState(hasCompletedWalkthrough);

  const hasGoals = useMemo(() => (goals?.length ?? 0) > 0, [goals]);

  async function finishWalkthrough() {
    await fetch("/api/profile/complete-walkthrough", { method: "POST" });
    setWalkthroughDone(true);
  }

  return (
    <div>
      <div id="plan-header" className="mb-6">
        <h1 className="text-3xl font-bold">Weekly Intention</h1>
        <p className="mt-1 text-white/60">
          Set your compass. Where do you want to spend your energy?
        </p>
      </div>

      {!walkthroughDone && <PlanWalkthrough onFinish={finishWalkthrough} />}

      {!hasGoals ? (
        <EmptyPlannerState onAddGoal={() => document.getElementById("add-goal-button")?.click()} />
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Your Goals</h2>
          <p className="text-sm text-white/60">Use + Goal to add more.</p>

          <ul className="mt-4 space-y-2">
            {goals.map((g) => (
              <li key={g.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{g.title}</div>
                  <div className="text-xs text-white/60">
                    {g.goal_type} • {g.priority} • {Number(g.target_hours ?? 0)}h
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// "use client";

// import { useEffect, useState } from "react";
// import { useGoals } from "@/components/goals/goals-context";
// import { PlanWalkthrough } from "@/components/walkthrough/plan-walkthrough";
// import Link from "next/link";

// export default function DashboardClient({
//   hasCompletedWalkthrough,
// }: {
//   hasCompletedWalkthrough: boolean;
// }) {
//   const { goals, loading } = useGoals();
//   const [walkthroughDone, setWalkthroughDone] = useState(hasCompletedWalkthrough);

//   async function finishWalkthrough() {
//     await fetch("/api/profile/complete-walkthrough", { method: "POST" });
//     setWalkthroughDone(true);
//   }

//   const hasGoals = goals.length > 0;

//   useEffect(() => {
//     setWalkthroughDone(hasCompletedWalkthrough);
//   }, [hasCompletedWalkthrough]);

//   return (
//     <div className="space-y-8">
//       <div id="plan-header">
//         <h1 className="text-3xl font-bold text-white">Weekly Intention</h1>
//         <p className="text-white/60">
//           Set your compass. Where do you want to spend your energy?
//         </p>
//       </div>

//       {!walkthroughDone && <PlanWalkthrough onDone={finishWalkthrough} />}

//       <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 text-white shadow-lg">
//         <div className="text-xl font-semibold">Plan Your Week</div>
//         <div className="text-white/60">
//           Define your major outcomes. Use <span className="text-white">+ Goal</span> to add items.
//         </div>
//       </div>

//       {loading ? (
//         <div className="text-white/60">Loading goals…</div>
//       ) : !hasGoals ? (
//         <div className="rounded-2xl border border-dashed border-white/15 bg-[#0b1220] p-12 text-center text-white">
//           <div className="mx-auto mb-4 h-12 w-12 rounded-xl border border-white/10 bg-white/5 grid place-items-center">
//             📅
//           </div>
//           <h3 className="text-lg font-semibold">Your week is a blank canvas</h3>
//           <p className="text-white/60 mt-2">
//             Click <span className="text-white">+ Goal</span> in the top bar to get started.
//           </p>
//           <div className="mt-6">
//             <Link
//               href="/timeline"
//               id="review-tab"
//               className="inline-flex items-center justify-center rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
//             >
//               Go to Timeline →
//             </Link>
//           </div>
//         </div>
//       ) : (
//         <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 text-white">
//           <div className="flex items-center justify-between">
//             <div className="text-lg font-semibold">Goals</div>
//             <div className="text-white/60 text-sm">{goals.length} total</div>
//           </div>

//           <div className="mt-4 grid gap-2">
//             {goals.map((g) => (
//               <div
//                 key={g.id}
//                 className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
//               >
//                 <div>
//                   <div className="font-medium">{g.title}</div>
//                   <div className="text-xs text-white/60">
//                     {g.goal_type} • {g.priority === "M" ? "Major" : g.priority === "m" ? "Minor" : "Optional"}
//                   </div>
//                 </div>
//                 <Link href="/timeline" className="text-sm text-blue-300 hover:text-blue-200">
//                   Plan →
//                 </Link>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
