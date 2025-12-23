import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { Topbar } from "@/components/topbar";
import { Sidebar } from "@/components/sidebar";
import { GoalsProvider } from "@/components/goals/goals-context";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen bg-gray-50 dark:bg-[#0d1117]">
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <GoalsProvider>
              <Topbar />

              <div className="flex min-h-[calc(100vh-4rem)]">
                <div className="hidden md:block">
                  <Sidebar />
                </div>

                <main className="flex-1 px-4 py-6">{children}</main>
              </div>
            </GoalsProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
