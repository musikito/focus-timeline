"use client";

import { ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children, ...props }: { children: ReactNode; [key: string]: unknown }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
