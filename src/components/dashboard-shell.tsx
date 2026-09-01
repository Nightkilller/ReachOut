"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  PenLine,
  Users,
  Send,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect, type ReactNode } from "react";
import { useClerk } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { UserNav } from "@/components/user-nav";
import { CalendarActivityDialog } from "@/components/calendar-activity-dialog";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/compose", label: "Compose", icon: PenLine },
  { href: "/dashboard/recipients", label: "Recipients", icon: Users },
  { href: "/dashboard/history", label: "Campaigns", icon: Send },
  { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
] as const;

/** Broad, prominent dark icon rail (desktop) */
function Rail() {
  const pathname = usePathname();
  const { signOut } = useClerk();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-full w-[84px] flex-col items-center gap-3 rounded-[2rem] bg-sidebar/95 py-6 text-sidebar-foreground shadow-[0_20px_50px_-20px_oklch(0.2_0.02_265/45%)] backdrop-blur-xl">
      {/* ReachOut Logo icon — links to front home page */}
      <div className="relative group mb-5">
        <Link
          href="/"
          className="grid h-12 w-12 place-items-center transition-transform hover:scale-105"
          aria-label="ReachOut Home"
        >
          <img src="/logo.svg" alt="ReachOut" className="h-10 w-10 object-contain" />
        </Link>
        <span className="pointer-events-none absolute left-[calc(100%+16px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-slate-900/95 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-white shadow-2xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 z-50 border border-slate-700/60 backdrop-blur-md">
          Home Page
        </span>
      </div>

      <nav className="flex flex-1 flex-col items-center gap-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <div key={href} className="relative group">
              <Link
                href={href}
                aria-label={label}
                className={cn(
                  "relative grid h-12 w-12 place-items-center rounded-2xl transition-all duration-200",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_0_1px_0_0_oklch(1_0_0/12%),0_0_24px_-4px_oklch(0.62_0.176_254/45%)]"
                    : "text-sidebar-foreground/55 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                {active && (
                  <span className="absolute -left-[18px] h-7 w-[4px] rounded-full bg-sidebar-primary" />
                )}
                <Icon className="h-5 w-5" />
              </Link>
              <span className="pointer-events-none absolute left-[calc(100%+16px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-slate-900/95 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-white shadow-2xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 z-50 border border-slate-700/60 backdrop-blur-md">
                {label}
              </span>
            </div>
          );
        })}
      </nav>

      <div className="relative group">
        <button
          aria-label="Sign out"
          onClick={() => signOut({ redirectUrl: "/" })}
          className="grid h-12 w-12 place-items-center rounded-2xl text-sidebar-foreground/55 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        >
          <LogOut className="h-5 w-5" />
        </button>
        <span className="pointer-events-none absolute left-[calc(100%+16px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-slate-900/95 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-white shadow-2xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 z-50 border border-slate-700/60 backdrop-blur-md">
          Sign Out
        </span>
      </div>
    </div>
  );
}

/** Full labelled sidebar for the mobile drawer */
function MobileNav({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const { signOut } = useClerk();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-full flex-col gap-6 bg-sidebar p-6 text-sidebar-foreground">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
      >
        <img src="/logo.svg" alt="ReachOut" className="h-10 w-10 rounded-xl" />
        <span className="text-xl font-bold tracking-tight">
          Reach<span className="gradient-text">Out</span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1.5">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3.5 rounded-2xl px-4 py-3 text-base font-medium transition-colors",
              isActive(href)
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-sidebar-border pt-4">
        <button
          onClick={() => signOut({ redirectUrl: "/" })}
          className="flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-base font-medium text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="relative min-h-screen bg-background p-4 sm:p-5">
      <div className="flex gap-4">
        {/* Left Desktop Rail Sidebar (Visible on lg+) */}
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] shrink-0 lg:block">
          <Rail />
        </aside>

        {/* Full-width Canvas Container */}
        <div className="canvas min-w-0 flex-1 rounded-2xl sm:rounded-[2rem] flex flex-col min-h-[calc(100vh-2rem)]">
          <header className="flex items-center gap-3 px-6 pt-3.5 sm:px-8 sm:pt-4">
            <button
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-border lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link
              href="/"
              className="flex items-center gap-2.5 text-lg font-bold lg:hidden hover:opacity-80 transition-opacity"
            >
              <img src="/logo.svg" alt="ReachOut" className="h-7 w-7 rounded-lg" />
              Reach<span className="gradient-text">Out</span>
            </Link>

            <div className="ml-auto flex items-center gap-2.5">
              {/* Theme Toggle (Light / Dark) */}
              <ThemeToggle />

              {/* Outreach Activity Calendar Dialog */}
              <CalendarActivityDialog />

              {/* User Profile Pill */}
              <UserNav />
            </div>
          </header>

          <main key={pathname} className="animate-fade-up flex-1 px-6 pb-8 pt-2 sm:px-8 sm:pt-2">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 animate-fade-up">
            <button
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 z-10 grid h-9 w-9 place-items-center rounded-lg text-sidebar-foreground/70"
            >
              <X className="h-5 w-5" />
            </button>
            <MobileNav onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="gradient-text text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl lg:text-[34px]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    sent: "bg-success/15 text-success border-success/25",
    completed: "bg-success/15 text-success border-success/25",
    delivered: "bg-success/15 text-success border-success/25",
    opened: "bg-[var(--tint-sky)] text-foreground border-transparent",
    draft: "bg-secondary text-muted-foreground border-border",
    sending: "bg-[var(--tint-sky)] text-violet border-violet/30",
    failed: "bg-destructive/10 text-destructive border-destructive/25",
    bounced: "bg-destructive/10 text-destructive border-destructive/25",
    pending: "bg-secondary text-muted-foreground border-border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize",
        map[status.toLowerCase()] ?? map["draft"],
      )}
    >
      {status}
    </span>
  );
}
