"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export function PlanWalkthrough({ onFinish }: { onFinish: () => Promise<void> }) {
  useEffect(() => {
    const d = driver({
      showProgress: true,
      allowClose: false,
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: "Finish",
      steps: [
        {
          element: "#plan-header",
          popover: {
            title: "Weekly Intention",
            description: "Set your compass. Let’s plan your week in under 2 minutes.",
          },
        },
        {
          element: "#add-goal-button",
          popover: {
            title: "Add a Goal",
            description: "Click + Goal to add what matters most this week.",
          },
        },
        {
          element: "#goal-title-input",
          popover: {
            title: "Goal title",
            description: "Give it a short name (e.g., Exercise, Build Timeline).",
          },
        },
        {
          element: "#goal-category",
          popover: {
            title: "Category",
            description: "Categorize goals so we can track balance across your life.",
          },
        },
        {
          element: "#goal-hours",
          popover: {
            title: "Hours",
            description: "Set an intention for time. We’ll compare this to your actuals later.",
          },
        },
      ],
      onDestroyed: () => {
        void onFinish();
      },
    });

    d.drive();
    return () => d.destroy();
  }, [onFinish]);

  return null;
}


// "use client";

// import { useEffect } from "react";
// import { driver } from "driver.js";
// import "driver.js/dist/driver.css";

// export function PlanWalkthrough({ onDone }: { onDone: () => void }) {
//   useEffect(() => {
//     const d = driver({
//       showProgress: true,
//       allowClose: false,
//       nextBtnText: "Next",
//       prevBtnText: "Back",
//       doneBtnText: "Finish",
//       steps: [
//         {
//           element: "#plan-header",
//           popover: {
//             title: "Weekly Intention",
//             description: "Set your compass. Where do you want to spend your energy?",
//           },
//         },
//         {
//           element: "#add-goal-button",
//           popover: {
//             title: "Add your first goal",
//             description: "This is where you define what matters this week.",
//           },
//         },
//         {
//           element: "#goal-title",
//           popover: {
//             title: "Goal title",
//             description: "Keep it outcome-based (e.g., “Exercise”, “Build Timeline”).",
//           },
//         },
//         {
//           element: "#goal-category",
//           popover: {
//             title: "Category",
//             description: "Categories help us measure balance across your life.",
//           },
//         },
//         {
//           element: "#goal-priority",
//           popover: {
//             title: "Priority",
//             description: "Major goals get more weight in your weekly Focus Score.",
//           },
//         },
//       ],
//       onDestroyed: onDone,
//     });

//     d.drive();
//     return () => d.destroy();
//   }, [onDone]);

//   return null;
// }
