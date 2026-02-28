"use client";
import { useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "elementpay-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  // respect OS preference
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // Hydrate on mount
  useEffect(() => {
    const initial = getInitialTheme();
    setThemeState(initial);
    document.documentElement.setAttribute("data-theme", initial);
    setMounted(true);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem(STORAGE_KEY, t);
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, toggle, mounted } as const;
}
