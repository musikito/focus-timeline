import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { Topbar } from "@/components/topbar";

export const metadata = {
  title: "FocusMirror",
  description: "Align your time. Improve your life.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen bg-gray-50 dark:bg-[#0d1117]">
          <ThemeProvider>
            
            {/* Top Navigation Bar */}
            <Topbar />

            {/* Page Content */}
            <main className="max-w-screen-2xl mx-auto px-4 py-6">
              {children}
            </main>

          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
