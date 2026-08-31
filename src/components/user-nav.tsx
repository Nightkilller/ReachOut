"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Mail, User, ChevronDown } from "lucide-react";

export function UserNav() {
  const { user } = useUser();
  const { signOut } = useClerk();

  if (!user) return null;

  const displayName = user.fullName || user.firstName || "User";
  const email = user.primaryEmailAddress?.emailAddress || "";
  const initials =
    displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "RO";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="glass flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-foreground transition-all hover:shadow-[0_8px_20px_-8px_oklch(0.55_0.14_285/45%)] focus:outline-none"
        >
          {user.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={displayName}
              className="h-8 w-8 rounded-full object-cover ring-1 ring-border"
            />
          ) : (
            <span className="gradient-accent grid h-8 w-8 place-items-center rounded-full text-xs font-semibold text-primary-foreground">
              {initials}
            </span>
          )}
          <span className="hidden text-sm font-medium sm:block">
            {displayName.split(" ")[0]}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="glass-strong w-64 rounded-2xl p-2 shadow-2xl">
        <DropdownMenuLabel className="px-3 py-2">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-foreground">{displayName}</p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
              <Mail className="h-3 w-3 shrink-0" />
              {email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem
          asChild
          className="gap-2 rounded-xl px-3 py-2.5 text-sm text-foreground/80 hover:text-foreground focus:bg-secondary cursor-pointer"
        >
          <a href="/dashboard/settings">
            <User className="h-4 w-4" />
            <span>Profile &amp; Settings</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem
          onClick={() => signOut({ redirectUrl: "/" })}
          className="gap-2 rounded-xl px-3 py-2.5 text-sm text-destructive hover:text-destructive focus:bg-destructive/10 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
