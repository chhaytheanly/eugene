import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "green" | "amber" | "blue" | "purple";
export type Mode = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  mode: Mode;
  setTheme: (theme: Theme) => void;
  toggleMode: () => void;
  setMode: (mode: Mode) => void;
  themeLabels: Record<Theme, string>;
  themeIcons: Record<Theme, string>;
}

const themeLabels: Record<Theme, string> = {
  green: "Emerald",
  amber: "Amber",
  blue: "Sapphire",
  purple: "Amethyst",
};

const themeIcons: Record<Theme, string> = {
  green: "▢",
  amber: "◆",
  blue: "▣",
  purple: "◇",
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "green",
  mode: "dark",
  setTheme: () => {},
  toggleMode: () => {},
  setMode: () => {},
  themeLabels,
  themeIcons,
});

const THEME_KEY = "eugene:theme";
const MODE_KEY = "eugene:mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return (saved as Theme) || "green";
  });
  const [mode, setModeState] = useState<Mode>(() => {
    const saved = localStorage.getItem(MODE_KEY);
    return (saved as Mode) || "dark";
  });

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    const el = document.documentElement;
    el.className = `theme-${theme}${mode === "light" ? " light" : ""}`;
    el.setAttribute("data-theme", theme);
    el.setAttribute("data-mode", mode);
  }, [theme, mode]);

  const setTheme = (t: Theme) => setThemeState(t);
  const setMode = (m: Mode) => {
    localStorage.setItem(MODE_KEY, m);
    setModeState(m);
  };
  const toggleMode = () => setMode(mode === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, mode, setTheme, toggleMode, setMode, themeLabels, themeIcons }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export { themeLabels, themeIcons };