/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type GoalPriority = "M" | "m" | "O";

export type Goal = {
  id: string;
  title: string;
  goal_type: string;
  priority: GoalPriority;
  sort_order: number | null;
  target_hours?: number | null;
  created_at?: string;
};

type GoalsContextValue = {
  goals: Goal[];
  loading: boolean;
  refreshGoals: () => Promise<void>;
  addGoal: (input: {
    title: string;
    goal_type: string;
    priority: GoalPriority;
    target_hours?: number;
  }) => Promise<Goal>;
};

const GoalsContext = createContext<GoalsContextValue | null>(null);

export function GoalsProvider({ children }: { children: React.ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  async function refreshGoals() {
    const res = await fetch("/api/goals", { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("GET /api/goals failed:", json);
      return;
    }
    setGoals(json.goals ?? []);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function addGoal(input: {
    title: string;
    goal_type: string;
    priority: GoalPriority;
    target_hours?: number;
  }) {
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("POST /api/goals failed:", json);
      throw new Error(json?.error || "Failed to create goal");
    }

    // optimistic update + refresh to keep ordering correct
    if (json.goal) setGoals((prev) => [...prev, json.goal]);

    await refreshGoals();

    // Let other pages/components listen if needed
    window.dispatchEvent(new Event("goals:changed"));

    return json.goal as Goal;
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refreshGoals();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({ goals, loading, refreshGoals, addGoal }),
    [addGoal, goals, loading]
  );

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
}

export function useGoals() {
  const ctx = useContext(GoalsContext);
  if (!ctx) throw new Error("useGoals must be used within GoalsProvider");
  return ctx;
}

// "use client";

// import { createContext, useContext, useEffect, useState } from "react";

// export type Goal = {
//   id: string;
//   title: string;
//   priority: "M" | "m" | "O";
// };

// type GoalsContextType = {
//   goals: Goal[];
//   refreshGoals: () => Promise<void>;
//   addGoal: (goal: Omit<Goal, "id">) => Promise<void>;
// };

// const GoalsContext = createContext<GoalsContextType | null>(null);

// export function GoalsProvider({ children }: { children: React.ReactNode }) {
//   const [goals, setGoals] = useState<Goal[]>([]);

//   async function refreshGoals() {
//     const res = await fetch("/api/goals");
//     const data = await res.json();
//     setGoals(data.goals ?? []);
//   }

//   async function addGoal(goal: Omit<Goal, "id">) {
//     const res = await fetch("/api/goals", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(goal),
//     });

//     if (!res.ok) {
//       throw new Error("Failed to create goal");
//     }

//     await refreshGoals();
//   }

//   useEffect(() => {
//     refreshGoals();
//   }, []);

//   return (
//     <GoalsContext.Provider value={{ goals, refreshGoals, addGoal }}>
//       {children}
//     </GoalsContext.Provider>
//   );
// }

// export function useGoals() {
//   const ctx = useContext(GoalsContext);
//   if (!ctx) {
//     throw new Error("useGoals must be used within GoalsProvider");
//   }
//   return ctx;
// }

// "use client";

// import { createContext, useContext, useState } from "react";

// export type Goal = {
//   id: string;
//   title: string;
//   priority: "M" | "m" | "O";
// };

// type GoalsContextType = {
//   goals: Goal[];
//   setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
// };

// const GoalsContext = createContext<GoalsContextType | null>(null);

// export function GoalsProvider({
//   initialGoals,
//   children,
// }: {
//   initialGoals: Goal[];
//   children: React.ReactNode;
// }) {
//   const [goals, setGoals] = useState(initialGoals);

//   return (
//     <GoalsContext.Provider value={{ goals, setGoals }}>
//       {children}
//     </GoalsContext.Provider>
//   );
// }

// export function useGoals() {
//   const ctx = useContext(GoalsContext);
//   if (!ctx) throw new Error("useGoals must be used within GoalsProvider");
//   return ctx;
// }
