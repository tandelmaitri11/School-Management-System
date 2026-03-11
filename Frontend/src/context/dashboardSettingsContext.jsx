import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "dashboard_ui_settings";

const DEFAULT_SETTINGS = {
  theme: "light",
  fontSize: "medium",
};

const DashboardSettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  setTheme: () => {},
  setFontSize: () => {},
  resetSettings: () => {},
});

const getFontSizePx = (size) => {
  if (size === "small") return "14px";
  if (size === "large") return "18px";
  return "16px";
};

const applyThemeVars = (theme, fontSize) => {
  const root = document.documentElement;
  const isDark = theme === "dark";

  root.style.setProperty("--dash-font-size", getFontSizePx(fontSize));
  root.style.setProperty("--dash-bg", isDark ? "#0f0f10" : "#f6f7fb");
  root.style.setProperty("--dash-soft-bg", isDark ? "#17181a" : "#f8f9fa");
  root.style.setProperty("--dash-card-bg", isDark ? "#1c1d20" : "#ffffff");
  root.style.setProperty("--dash-border", isDark ? "#2b2d31" : "#e9ecef");
  root.style.setProperty("--dash-text", isDark ? "#f1f3f5" : "#212529");
  root.style.setProperty("--dash-muted", isDark ? "#adb5bd" : "#6c757d");
  root.style.setProperty("--dash-link", isDark ? "#8ec5ff" : "#0d6efd");
  root.style.setProperty("--dash-table-head", isDark ? "#202226" : "#f1f3f5");
};

export function DashboardSettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(raw);
      return {
        theme: parsed?.theme === "dark" ? "dark" : "light",
        fontSize: ["small", "medium", "large"].includes(parsed?.fontSize)
          ? parsed.fontSize
          : "medium",
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    applyThemeVars(settings.theme, settings.fontSize);
  }, [settings]);

  const value = useMemo(
    () => ({
      settings,
      setTheme: (theme) =>
        setSettings((prev) => ({ ...prev, theme: theme === "dark" ? "dark" : "light" })),
      setFontSize: (fontSize) =>
        setSettings((prev) => ({
          ...prev,
          fontSize: ["small", "medium", "large"].includes(fontSize) ? fontSize : "medium",
        })),
      resetSettings: () => setSettings(DEFAULT_SETTINGS),
    }),
    [settings]
  );

  return (
    <DashboardSettingsContext.Provider value={value}>{children}</DashboardSettingsContext.Provider>
  );
}

export const useDashboardSettings = () => useContext(DashboardSettingsContext);
