import { useEffect } from "react";
import { useThemeStore } from "@/stores";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const isDark =
        theme === "dark" || (theme === "system" && prefersDark.matches);
      root.classList.toggle("dark", isDark);
    };

    applyTheme();

    if (theme === "system") {
      prefersDark.addEventListener("change", applyTheme);
      return () => prefersDark.removeEventListener("change", applyTheme);
    }
  }, [theme]);

  useEffect(() => {
    const saved = localStorage.getItem("theme-storage");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const storedTheme = parsed?.state?.theme;
        if (
          storedTheme === "light" ||
          storedTheme === "dark" ||
          storedTheme === "system"
        ) {
          setTheme(storedTheme);
        }
      } catch {
        // ignore invalid theme storage
      }
    }
  }, [setTheme]);

  return <>{children}</>;
}
