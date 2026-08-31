import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { SignInButton } from "@/components/sign-in-button";
import { Sparkles, Shield, Zap, Users, Send } from "lucide-react";

export default async function HomePage() {
  const user = await currentUser();

  // If already signed in, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
      <div className="surface animate-fade-up relative z-10 flex max-w-2xl flex-col items-center p-8 sm:p-12 text-center shadow-xl">
        {/* Logo */}
        <div className="mb-6 flex items-center gap-3">
          <img src="/logo.svg" alt="ReachOut" className="h-14 w-14 rounded-2xl shadow-[0_8px_20px_-6px_oklch(0.62_0.176_254/55%)]" />
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-foreground">Reach</span>
            <span className="gradient-text">Out</span>
          </h1>
        </div>

        {/* Tagline */}
        <p className="mb-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Smart outreach, simplified.
        </p>
        <p className="mb-8 max-w-md text-sm text-muted-foreground leading-relaxed sm:text-base">
          Send AI-personalized outreach emails with your resume attached — tailored individually per company domain — straight from your Gmail.
        </p>

        {/* Sign in button */}
        <div className="w-full max-w-xs">
          <SignInButton />
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Sign in with email or Google. Fast &amp; encrypted.
        </p>

        {/* Feature cards */}
        <div className="mt-10 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="tint-sky gradient-ring rounded-2xl p-4 text-left shadow-sm">
            <div className="mb-2 grid h-8 w-8 place-items-center rounded-xl bg-card text-foreground shadow-sm">
              <Sparkles className="h-4 w-4 text-violet" />
            </div>
            <h2 className="text-xs font-bold text-foreground">AI Per Company</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Auto-detects company domain and crafts unique emails
            </p>
          </div>

          <div className="tint-mint gradient-ring rounded-2xl p-4 text-left shadow-sm">
            <div className="mb-2 grid h-8 w-8 place-items-center rounded-xl bg-card text-foreground shadow-sm">
              <Zap className="h-4 w-4 text-success" />
            </div>
            <h2 className="text-xs font-bold text-foreground">Anti-Penalty Sending</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Configurable send throttling &amp; daily safety quotas
            </p>
          </div>

          <div className="tint-lilac gradient-ring rounded-2xl p-4 text-left shadow-sm">
            <div className="mb-2 grid h-8 w-8 place-items-center rounded-xl bg-card text-foreground shadow-sm">
              <Shield className="h-4 w-4 text-violet" />
            </div>
            <h2 className="text-xs font-bold text-foreground">AES Encrypted</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Gmail App Passwords encrypted at rest
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
