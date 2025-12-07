// app/dashboard/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import GoalsDndClient from "./_goals-dnd-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("has_onboarded")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile?.has_onboarded) {
    redirect("/onboarding");
  }

  const { data: goals } = await supabase
    .from("goals")
    .select("id, title, goal_type, sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Weekly Goals</h1>
      <GoalsDndClient initialGoals={goals || []} />
    </div>
  );
}

// import { auth } from "@clerk/nextjs/server";
// import { redirect } from "next/navigation";

// export default async function Page() {
//   const { userId } = await auth();
  
//   if (!userId) {
//     redirect("/sign-in");
//   }

//   return (
//     <div className="p-8">
//       <h1 className="text-3xl font-bold">Dashboard</h1>
//       <p>You are signed in! 🎉</p>
//     </div>
//   );
// }

// import { auth } from "@clerk/nextjs/server";
// import { redirect } from "next/navigation";
// import { createClient } from "@supabase/supabase-js";

// export const dynamic = "force-dynamic";

// export default async function DashboardPage() {
//   const { userId } = await auth();
//   if (!userId) redirect("/sign-in");

//   const supabase = createClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.SUPABASE_SERVICE_ROLE_KEY!
//   );

//   // Fetch profile
//   const { data: profile } = await supabase
//     .from("profiles")
//     .select("has_onboarded")
//     .eq("user_id", userId)
//     .maybeSingle();

//   if (!profile?.has_onboarded) {
//     redirect("/onboarding");
//   }

//   // Fetch goals
//   const { data: goals } = await supabase
//     .from("goals")
//     .select("id, title, goal_type, sort_order")
//     .eq("user_id", userId)
//     .order("sort_order", { ascending: true });

//   return (
//     <div className="max-w-3xl mx-auto p-6 space-y-6">
//       <h1 className="text-3xl font-bold">Dashboard</h1>

//       <p className="text-gray-600">
//         Here are your goals for this week:
//       </p>

//       {(!goals || goals.length === 0) && (
//         <p className="text-sm text-gray-500">
//           No goals found — head to onboarding!
//         </p>
//       )}

//       <ul className="space-y-2">
//         {goals?.map((g) => (
//           <li
//             key={g.id}
//             className="border border-gray-300 rounded px-3 py-2 flex justify-between"
//           >
//             <span>{g.title}</span>
//             <span className="text-xs uppercase px-2 py-0.5 bg-gray-200 rounded">
//               {g.goal_type}
//             </span>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }
