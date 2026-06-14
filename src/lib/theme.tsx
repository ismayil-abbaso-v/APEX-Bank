import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
const Ctx = createContext<{ theme: Theme; setTheme: (t: Theme) => void; toggle: () => void }>({
  theme: "light", setTheme: () => {}, toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Default is ALWAYS light. We only honor an explicitly chosen dark theme.
  const [theme, setThemeState] = useState<Theme>("light");
  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("atu_theme")) as Theme | null;
    const initial: Theme = saved === "dark" ? "dark" : "light";
    setThemeState(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);
  const setTheme = (t: Theme) => {
    setThemeState(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    if (typeof window !== "undefined") localStorage.setItem("atu_theme", t);
  };
  return <Ctx.Provider value={{ theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") }}>{children}</Ctx.Provider>;
}
export const useTheme = () => useContext(Ctx);
