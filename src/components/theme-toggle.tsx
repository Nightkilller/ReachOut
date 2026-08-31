"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="glass grid h-10 w-10 place-items-center rounded-full text-muted-foreground">
        <Sun className="h-4 w-4 opacity-0" />
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={`Switch to ${isDark ? "Light" : "Dark"} theme`}
      aria-label="Toggle theme"
      className="glass grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition-all hover:text-foreground hover:scale-105 active:scale-95 focus:outline-none"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 animate-in spin-in-180 duration-200" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700 animate-in spin-in-180 duration-200" />
      )}
    </button>
  );
}
