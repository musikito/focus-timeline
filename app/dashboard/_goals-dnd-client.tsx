/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

type Goal = {
  id: string;
  title: string;
  goal_type: string;
  sort_order: number;
};

function SortableGoal({ goal }: { goal: Goal }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: goal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="border border-gray-300 dark:border-gray-700 rounded px-4 py-3 bg-white dark:bg-gray-800 cursor-move select-none flex justify-between"
    >
      <span className="font-medium">{goal.title}</span>
      <span className="text-xs uppercase bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
        {goal.goal_type}
      </span>
    </li>
  );
}

export default function GoalsDndClient({ initialGoals }: { initialGoals: Goal[] }) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  async function handleDragEnd(event: any) {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    const oldIndex = goals.findIndex((g) => g.id === active.id);
    const newIndex = goals.findIndex((g) => g.id === over.id);

    const updated = arrayMove(goals, oldIndex, newIndex).map((g, i) => ({
      ...g,
      sort_order: i,
    }));

    setGoals(updated);

    await fetch("/api/goals/update-order", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goals: updated }),
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={goals.map((g) => g.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="space-y-3">
          {goals.map((goal) => (
            <SortableGoal key={goal.id} goal={goal} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
