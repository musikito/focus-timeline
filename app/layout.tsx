// import "./globals.css";
// import { ClerkProvider, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
// import Link from "next/link";

// export const metadata = {
//   title: "Focus Timeline",
//   description: "Plan vs actual time tracking",
// };

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <ClerkProvider>
//       <html lang="en">
//         <body className="min-h-screen bg-gray-50 text-gray-900">
//           <div className="flex min-h-screen">

//             {/* SIDEBAR: visible when signed in */}
//             <SignedIn>
//               <aside className="hidden md:flex w-64 flex-col bg-white border-r">
//                 <div className="p-6 font-bold text-xl border-b">
//                   Focus Timeline
//                 </div>
//                 <nav className="flex-1 p-4 space-y-2">
//                   <Link href="/dashboard" className="block hover:text-blue-600">
//                     Dashboard
//                   </Link>
//                   <Link href="/onboarding" className="block hover:text-blue-600">
//                     Onboarding
//                   </Link>
//                 </nav>

//                 <div className="p-4 border-t flex justify-center">
//                   <UserButton afterSignOutUrl="/" />
//                 </div>
//               </aside>
//             </SignedIn>

//             {/* MAIN CONTENT AREA */}
//             <div className="flex-1 flex flex-col min-h-screen">
//               {/* TOP BAR ON MOBILE */}
//               <SignedIn>
//                 <header className="md:hidden flex justify-between items-center border-b p-4 bg-white">
//                   <span className="font-bold">Focus Timeline</span>
//                   <UserButton afterSignOutUrl="/" />
//                 </header>
//               </SignedIn>

//               {/* RENDER PAGE CONTENT */}
//               <main className="flex-1">{children}</main>
//             </div>

//           </div>
//         </body>
//       </html>
//     </ClerkProvider>
//   );
// }
import "./globals.css";
import { ClerkProvider, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import ThemeToggleButton from "@/components/theme-toggle-button";

// function ThemeToggleButton() {
//   const { theme, toggleTheme } = useTheme();
//   return (
//     <button
//       onClick={toggleTheme}
//       className="w-full text-xs mt-4 py-2 rounded bg-gray-700 text-gray-100 dark:bg-gray-300 dark:text-gray-900"
//     >
//       Switch to {theme === "light" ? "Dark" : "Light"} Mode
//     </button>
//   );
// }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ThemeProvider>
        <html lang="en" className="h-full">
          <body className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
            <div className="flex min-h-screen">

              {/* SIDEBAR */}
              <SignedIn>
                <aside className="hidden md:flex w-64 flex-col bg-gray-200 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700">
                  <div className="p-4 text-lg font-bold border-b border-gray-300 dark:border-gray-700">
                    Focus Timeline
                  </div>
                  <nav className="flex-1 p-4 space-y-2">
                    <Link href="/dashboard" className="block hover:text-blue-600 dark:hover:text-blue-400">
                      Dashboard
                    </Link>
                    <Link href="/onboarding" className="block hover:text-blue-600 dark:hover:text-blue-400">
                      Onboarding
                    </Link>
                    <Link href="/profile" className="block hover:text-blue-600 dark:hover:text-blue-400">
                      Profile
                    </Link>
                    <Link href="/timeline" className="block hover:text-blue-600 dark:hover:text-blue-400">
                      Timeline
                    </Link>

                  </nav>

                  {/* <nav className="flex-1 p-4 space-y-2">
                    <Link href="/dashboard" className="block hover:text-blue-600 dark:hover:text-blue-400">
                      Dashboard
                    </Link>
                    <Link href="/onboarding" className="block hover:text-blue-600 dark:hover:text-blue-400">
                      Onboarding
                    </Link>
                  </nav> */}

                  <div className="p-4 border-t border-gray-300 dark:border-gray-700 flex flex-col gap-2 items-center">
                    <UserButton afterSignOutUrl="/" />
                    <ThemeToggleButton />
                  </div>
                </aside>
              </SignedIn>

              <div className="flex-1 flex flex-col min-h-screen">
                {/* TOP BAR FOR MOBILE */}
                <SignedIn>
                  <header className="md:hidden flex justify-between items-center border-b p-4 bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                    <span className="font-bold">Focus Timeline</span>
                    <div className="flex gap-2">
                      <ThemeToggleButton />
                      <UserButton afterSignOutUrl="/" />
                    </div>
                  </header>
                </SignedIn>

                <main className="flex-1">{children}</main>
              </div>

            </div>
          </body>
        </html>
      </ThemeProvider>
    </ClerkProvider>
  );
}
