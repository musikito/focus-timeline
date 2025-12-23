"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export function Walkthrough({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const d = driver({
      showProgress: true,
      allowClose: false,
      doneBtnText: "Finish",
      steps: [
        {
          element: "#plan-header",
          popover: {
            title: "Welcome 👋",
            description: "Let’s plan your week in under 2 minutes.",
          },
        },
        {
          element: "#add-goal-button",
          popover: {
            title: "Add a Goal",
            description: "Start by defining what matters most this week.",
          },
        },
        {
          element: "#goal-category",
          popover: {
            title: "Categories",
            description: "We track balance across work, health, learning, and more.",
          },
        },
        {
          element: "#goal-hours",
          popover: {
            title: "Planned Time",
            description: "This is your intention — we’ll compare it to reality later.",
          },
        },
        {
          element: "#review-tab",
          popover: {
            title: "Weekly Review",
            description: "At the end of the week, we’ll reflect here together.",
          },
        },
      ],
      onDestroyed: onComplete,
    });

    d.drive();

    return () => d.destroy();
  }, [onComplete]);

  return null;
}
