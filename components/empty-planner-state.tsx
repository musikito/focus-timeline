"use client";

export function EmptyPlannerState({ onAddGoal }: { onAddGoal: () => void }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
      <div className="mx-auto mb-4 h-12 w-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
        <span className="text-xl">🗓️</span>
      </div>

      <h3 className="text-lg font-semibold text-white">Your week is a blank canvas</h3>
      <p className="mt-2 text-sm text-white/60">
        Add a goal to start planning your week.
      </p>

      <button
        onClick={onAddGoal}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
      >
        + Add your first goal
      </button>
    </div>
  );
}
