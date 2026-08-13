import type { Metadata } from "next";

import { ThemeProvider } from "@/features/theme";

import { SessionProvider } from "./session-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Harness Dashboard",
  description: "프로젝트별 AI Harness 동기화 설정 관리",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
