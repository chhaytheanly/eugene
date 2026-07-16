import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "green" | "amber" | "blue" | "purple";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "green",
  setTheme: () => {},
});

const THEME_KEY = "eugene:theme";

const themeLabels: Record<Theme, string> = {
  green: "Emerald",
  amber: "Amber",
  blue: "Sapphire",
  purple: "Amethyst",
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return (saved as Theme) || "green";
  });

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.className = `theme-${theme}`;
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export { themeLabels };
