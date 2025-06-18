"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface Theme {
  name: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: string
    border: string
  }
}

const themes: Record<string, Theme> = {
  default: {
    name: "Default",
    colors: {
      primary: "#3b82f6",
      secondary: "#8b5cf6",
      accent: "#10b981",
      background: "#f9fafb",
      surface: "#ffffff",
      text: "#000000",
      border: "#000000",
    },
  },
  dark: {
    name: "Dark Mode",
    colors: {
      primary: "#60a5fa",
      secondary: "#a78bfa",
      accent: "#34d399",
      background: "#111827",
      surface: "#1f2937",
      text: "#ffffff",
      border: "#374151",
    },
  },
  ocean: {
    name: "Ocean Blue",
    colors: {
      primary: "#0ea5e9",
      secondary: "#06b6d4",
      accent: "#0891b2",
      background: "#f0f9ff",
      surface: "#ffffff",
      text: "#0c4a6e",
      border: "#0c4a6e",
    },
  },
  forest: {
    name: "Forest Green",
    colors: {
      primary: "#059669",
      secondary: "#10b981",
      accent: "#34d399",
      background: "#f0fdf4",
      surface: "#ffffff",
      text: "#064e3b",
      border: "#064e3b",
    },
  },
  sunset: {
    name: "Sunset Orange",
    colors: {
      primary: "#ea580c",
      secondary: "#f97316",
      accent: "#fb923c",
      background: "#fff7ed",
      surface: "#ffffff",
      text: "#9a3412",
      border: "#9a3412",
    },
  },
  softDark: {
    name: "Soft Dark",
    colors: {
      primary: "#818cf8",
      secondary: "#c084fc",
      accent: "#34d399",
      background: "#1e293b",
      surface: "#334155",
      text: "#f1f5f9",
      border: "#475569",
    },
  },
}

interface ThemeContextType {
  currentTheme: string
  theme: Theme
  setTheme: (themeName: string) => void
  themes: Record<string, Theme>
  customTheme: Theme | null
  setCustomTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState("default")
  const [customTheme, setCustomTheme] = useState<Theme | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem("theme")
    const savedCustom = localStorage.getItem("customTheme")

    if (saved) {
      setCurrentTheme(saved)
    }
    if (savedCustom) {
      setCustomTheme(JSON.parse(savedCustom))
    }
  }, [])

  useEffect(() => {
    const theme = currentTheme === "custom" && customTheme ? customTheme : themes[currentTheme]
    if (theme) {
      const root = document.documentElement
      Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value)
      })

      // Apply theme class to body for better CSS targeting
      document.body.className = `theme-${currentTheme}`
    }
  }, [currentTheme, customTheme])

  const setTheme = (themeName: string) => {
    setCurrentTheme(themeName)
    localStorage.setItem("theme", themeName)
  }

  const handleSetCustomTheme = (theme: Theme) => {
    setCustomTheme(theme)
    localStorage.setItem("customTheme", JSON.stringify(theme))
  }

  const theme = currentTheme === "custom" && customTheme ? customTheme : themes[currentTheme]

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        theme,
        setTheme,
        themes,
        customTheme,
        setCustomTheme: handleSetCustomTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}
