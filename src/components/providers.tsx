"use client";

import { ClerkProvider } from "@clerk/nextjs";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#8b5cf6",
          colorBackground: "#18181b",
          colorNeutral: "#e4e4e7",
        },
        elements: {
          card: "bg-zinc-900 border border-white/[0.06] shadow-2xl",
          headerTitle: "text-white",
          headerSubtitle: "text-zinc-400",
          socialButtonsBlockButton: "bg-zinc-800 border-white/10 text-white hover:bg-zinc-700",
          formButtonPrimary: "bg-violet-600 hover:bg-violet-500",
          footerActionLink: "text-violet-400 hover:text-violet-300",
          formFieldInput: "bg-zinc-800 border-white/10 text-white",
          formFieldLabel: "text-zinc-300",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
