"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, LayoutDashboard, Mail } from "lucide-react";

interface SignInButtonProps {
  variant?: "primary" | "nav";
  label?: string;
}

export function SignInButton({ variant = "primary", label }: SignInButtonProps) {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div
        className={
          variant === "nav"
            ? "h-9 w-24 rounded-xl bg-slate-100 animate-pulse"
            : "h-14 w-48 rounded-2xl bg-slate-100 animate-pulse"
        }
      />
    );
  }

  // When signed in:
  if (isSignedIn) {
    if (variant === "nav") {
      return (
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all shadow-sm"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <UserButton />
        </div>
      );
    }

    return (
      <Link
        href="/dashboard"
        className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-bold text-white shadow-lg transition-all duration-200 hover:scale-[1.03] hover:shadow-xl active:scale-[0.98]"
        style={{
          background:
            "linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #0ea5e9 100%)",
        }}
      >
        <LayoutDashboard className="h-5 w-5" />
        {label || "Go to Dashboard"}
        <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    );
  }

  // When signed out:
  if (variant === "nav") {
    return (
      <Link
        href="/sign-in"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all shadow-sm"
      >
        Sign In
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    );
  }

  // Primary CTA button for signed out user
  return (
    <Link
      href="/sign-in"
      className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-bold text-white shadow-lg transition-all duration-200 hover:scale-[1.03] hover:shadow-xl active:scale-[0.98]"
      style={{
        background:
          "linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #0ea5e9 100%)",
      }}
    >
      <Mail className="h-5 w-5" />
      {label || "Get Started Free"}
      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}
