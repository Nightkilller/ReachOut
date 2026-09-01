"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#2563eb",
          colorBackground: "#ffffff",
          colorNeutral: "#1e293b",
        },
        elements: {
          card: "bg-white border border-slate-200 shadow-2xl rounded-2xl",
          headerTitle: "text-slate-900 font-bold",
          headerSubtitle: "text-slate-500",
          socialButtonsBlockButton: "bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100 rounded-xl",
          formButtonPrimary: "bg-blue-600 hover:bg-blue-700 rounded-xl font-bold",
          formFieldInput: "bg-white border-slate-200 text-slate-900 rounded-xl",
          formFieldLabel: "text-slate-700 font-semibold",
        },
      }}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange={false}
      >
        {children}
      </ThemeProvider>
    </ClerkProvider>
  );
}
