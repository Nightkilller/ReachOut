"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#0F172A",
          colorBackground: "#18181b",
          colorNeutral: "#e4e4e7",
        },
        elements: {
          card: "bg-card border border-border shadow-2xl rounded-2xl",
          headerTitle: "text-foreground font-bold",
          headerSubtitle: "text-muted-foreground",
          socialButtonsBlockButton: "bg-secondary border-border text-foreground hover:bg-secondary/80 rounded-xl",
          formButtonPrimary: "bg-primary text-primary-foreground hover:opacity-90 rounded-xl font-bold",
          formFieldInput: "bg-secondary/40 border-border text-foreground rounded-xl",
          formFieldLabel: "text-foreground font-semibold",
        },
      }}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={false}
      >
        {children}
      </ThemeProvider>
    </ClerkProvider>
  );
}
