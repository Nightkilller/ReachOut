import Link from "next/link";
import { SignInButton } from "@/components/sign-in-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sparkles, Shield, Zap, Send, Users, Calendar } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-200">

      {/* ── Navbar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <img src="/logo-icon.svg" alt="ReachOut" className="h-7 w-7" />
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">ReachOut</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <SignInButton variant="nav" />
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-100 dark:opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(226,232,240,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(226,232,240,0.55) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Glow blobs */}
        <div className="pointer-events-none absolute top-[-6rem] left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-blue-50 dark:bg-blue-950/40 blur-3xl opacity-60" />

        <div className="relative mx-auto max-w-4xl text-center animate-fade-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-blue-100 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-sm font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Cold Email Platform
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-slate-900 dark:text-white mb-6">
            Land internships with{" "}
            <span
              className="inline-block"
              style={{
                background: "linear-gradient(135deg, #2563eb 0%, #0ea5e9 50%, #6366f1 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              AI cold emails
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto max-w-2xl text-lg sm:text-xl text-slate-500 dark:text-slate-400 leading-relaxed mb-10">
            Send hyper-personalized outreach emails — individually tailored per company domain — straight from your Gmail with your resume attached.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <SignInButton variant="primary" />
          </div>
        </div>
      </section>

      {/* ── Stats Row ── */}
      <section className="py-12 border-y border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { value: "450+", label: "Emails / Day Limit" },
              { value: "2 AI", label: "Models (Groq + Gemini)" },
              { value: "15s–60s", label: "Smart Throttle Delay" },
              { value: "AES-256", label: "Credential Encryption" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">{stat.value}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Everything you need to get hired
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
              Built specifically for students and developers doing high-volume outreach.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Sparkles,
                color: "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400",
                title: "AI Per Company",
                desc: "Auto-detects target company from the recipient's email domain and generates a bespoke, authentic email using Groq LLaMA 3.3 70B or Google Gemini.",
              },
              {
                icon: Zap,
                color: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400",
                title: "Anti-Penalty Engine",
                desc: "Smart throttling with Fast (2s), Safe (5s), Stealth (15s) modes keeps your Gmail reputation clean and prevents spam filters from flagging you.",
              },
              {
                icon: Shield,
                color: "bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400",
                title: "AES-256 Encrypted",
                desc: "Your Gmail App Password is encrypted at rest using AES-256-GCM before being stored. Your credentials are never exposed in plain text.",
              },
              {
                icon: Users,
                color: "bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400",
                title: "Address Book & CSV",
                desc: "Bulk-upload recipients via CSV. Company names are auto-detected from email domains. Search, filter, and manage your entire contact list.",
              },
              {
                icon: Calendar,
                color: "bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400",
                title: "Activity Calendar",
                desc: "A visual interactive calendar shows daily send volume. Inspect individual emails, track sent/failed status, and monitor your outreach history.",
              },
              {
                icon: Send,
                color: "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400",
                title: "Resume Attached",
                desc: "Drag-and-drop your resume PDF once — it's automatically attached to every email in the campaign, so you never have to do it manually.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 hover:border-blue-200 dark:hover:border-blue-700/60 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              >
                <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${f.color}`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 px-6 bg-slate-50 dark:bg-slate-900/40 border-y border-slate-100 dark:border-slate-800">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-14">Get started in 3 steps</h2>
          <div className="grid sm:grid-cols-3 gap-10">
            {[
              { step: "1", title: "Connect Gmail", desc: "Add your Gmail address and a 16-character App Password. Tested and encrypted instantly." },
              { step: "2", title: "Upload Recipients", desc: "Import a CSV of company emails or add them manually. Companies are auto-detected." },
              { step: "3", title: "Launch Campaign", desc: "Pick your AI tone, attach your resume, and let ReachOut send tailored emails per company." },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center">
                <div className="mb-4 h-12 w-12 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
                  {s.step}
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-28 px-6 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white mb-5 tracking-tight">
            Start reaching out today
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 leading-relaxed">
            Free to use. No credit card. Sign in with your Google account and send your first campaign in minutes.
          </p>
          <SignInButton variant="primary" />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 dark:border-slate-800 py-8 px-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
            <img src="/logo-icon.svg" alt="" className="h-5 w-5 opacity-60" />
            <span>© 2025 ReachOut — Built for personal outreach</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
            <Shield className="h-3 w-3" />
            AES-256 Encrypted · MIT License
          </div>
        </div>
      </footer>

    </main>
  );
}
