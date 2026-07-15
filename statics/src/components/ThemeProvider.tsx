import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "green" | "amber" | "blue" | "purple";
type Mode = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  mode: Mode;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("eugene:theme");
    return (saved as Theme) || "green";
  });
  const [mode, setMode] = useState<Mode>(() => {
    const saved = localStorage.getItem("eugene:mode");
    return (saved as Mode) || "dark";
  });

  useEffect(() => {
    localStorage.setItem("eugene:theme", theme);
    localStorage.setItem("eugene:mode", mode);
    document.documentElement.className = `theme-${theme} ${mode}`;
  }, [theme, mode]);

  const toggleMode = () => setMode((m) => (m === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, mode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
