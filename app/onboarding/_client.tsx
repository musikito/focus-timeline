/* eslint-disable @typescript-eslint/no-explicit-any */
    
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Goal = {
  title: string;
  type: "major" | "minor";
};

export default function OnboardingClient() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([
    { title: "", type: "major" },
    { title: "", type: "minor" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateGoal = (i: number, key: keyof Goal, value: string) => {
    setGoals((prev) =>
      prev.map((g, index) =>
        index === i ? { ...g, [key]: value as any } : g 
      )
    );
  };

  const addGoal = () => {
    setGoals((prev) => [...prev, { title: "", type: "minor" }]);
  };
  

  async function handleSave() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Something went wrong");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Set your goals</h1>

      {goals.map((g, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <input
            className="flex-1 border border-gray-400 rounded p-2 bg-white text-black"
            placeholder={`Goal #${i + 1}`}
            value={g.title}
            onChange={(e) => updateGoal(i, "title", e.target.value)}
          />
          <select
            className="border border-gray-400 rounded p-2 bg-white text-black"
            value={g.type}
            onChange={(e) =>
              updateGoal(i, "type", e.target.value as Goal["type"])
            }
          >
            <option value="major">Major</option>
            <option value="minor">Minor</option>
          </select>
        </div>
      ))}

      <button
        type="button"
        className="border px-3 py-1 rounded mb-3"
        onClick={addGoal}
      >
        + Add Goal
      </button>

      {error && <p className="text-red-600 mb-2">{error}</p>}

      <button
        className="block w-full bg-emerald-500 text-white py-2 rounded"
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? "Saving..." : "Save Goals"}
      </button>
    </div>
  );
}
