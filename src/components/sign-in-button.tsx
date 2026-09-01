"use client";

import { useClerk } from "@clerk/nextjs";
import { useState } from "react";
import { ArrowRight, Loader2, Mail } from "lucide-react";

interface SignInButtonProps {
  variant?: "primary" | "nav";
}

export function SignInButton({ variant = "primary" }: SignInButtonProps) {
  const { redirectToSignIn } = useClerk();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await redirectToSignIn();
    } catch {
      setIsLoading(false);
    }
  };

  if (variant === "nav") {
    return (
      <button
        onClick={handleSignIn}
        disabled={isLoading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors disabled:opacity-60"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Sign In
            <ArrowRight className="h-3.5 w-3.5" />
          </>
        )}
      </button>
    );
  }

  // Primary CTA button
  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-bold text-white shadow-lg transition-all duration-200 hover:scale-[1.03] hover:shadow-xl active:scale-[0.98] disabled:opacity-70"
      style={{
        background: "linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #0ea5e9 100%)",
      }}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Mail className="h-5 w-5" />
          Get Started Free
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </>
      )}
    </button>
  );
}
