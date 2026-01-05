'use client'

import type React from 'react'
import { createContext, useContext, useState, useEffect } from 'react'

interface Theme {
  name: string
  colors: {
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    accent: string
    background: string
    surface: string
    text: string
    border: string
  }
}

const themes: Record<string, Theme> = {
  default: {
    name: 'Default',
    colors: {
      primary: '#3b82f6',
      primaryForeground: '#ffffff',
      secondary: '#8b5cf6',
      secondaryForeground: '#ffffff',
      accent: '#10b981',
      background: '#f9fafb',
      surface: '#ffffff',
      text: '#000000',
      border: '#000000'
    }
  },
  dark: {
    name: 'Dark Mode',
    colors: {
      primary: '#60a5fa',
      primaryForeground: '#ffffff',
      secondary: '#a78bfa',
      secondaryForeground: '#ffffff',
      accent: '#34d399',
      background: '#111827',
      surface: '#1f2937',
      text: '#ffffff',
      border: '#ffffff'
    }
  },
  ocean: {
    name: 'Ocean Blue',
    colors: {
      primary: '#0ea5e9',
      primaryForeground: '#ffffff',
      secondary: '#06b6d4',
      secondaryForeground: '#ffffff',
      accent: '#0891b2',
      background: '#f0f9ff',
      surface: '#ffffff',
      text: '#0c4a6e',
      border: '#0c4a6e'
    }
  },
  forest: {
    name: 'Forest Green',
    colors: {
      primary: '#059669',
      primaryForeground: '#ffffff',
      secondary: '#10b981',
      secondaryForeground: '#ffffff',
      accent: '#34d399',
      background: '#f0fdf4',
      surface: '#ffffff',
      text: '#064e3b',
      border: '#064e3b'
    }
  },
  sunset: {
    name: 'Sunset Orange',
    colors: {
      primary: '#ea580c',
      primaryForeground: '#ffffff',
      secondary: '#f97316',
      secondaryForeground: '#ffffff',
      accent: '#fb923c',
      background: '#fff7ed',
      surface: '#ffffff',
      text: '#9a3412',
      border: '#9a3412'
    }
  },
  lavender: {
    name: 'Lavender Dream',
    colors: {
      primary: '#8b5cf6',
      primaryForeground: '#ffffff',
      secondary: '#a78bfa',
      secondaryForeground: '#ffffff',
      accent: '#c084fc',
      background: '#faf5ff',
      surface: '#ffffff',
      text: '#6b21a8',
      border: '#6b21a8'
    }
  },
  rose: {
    name: 'Rose Garden',
    colors: {
      primary: '#ec4899',
      primaryForeground: '#ffffff',
      secondary: '#f472b6',
      secondaryForeground: '#ffffff',
      accent: '#fb7185',
      background: '#fdf2f8',
      surface: '#ffffff',
      text: '#be185d',
      border: '#be185d'
    }
  },
  midnight: {
    name: 'Midnight Blue',
    colors: {
      primary: '#1e40af',
      primaryForeground: '#ffffff',
      secondary: '#3b82f6',
      secondaryForeground: '#ffffff',
      accent: '#60a5fa',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      border: '#ffffff'
    }
  },
  cherry: {
    name: 'Cherry Blossom',
    colors: {
      primary: '#db2777',
      primaryForeground: '#ffffff',
      secondary: '#ec4899',
      secondaryForeground: '#ffffff',
      accent: '#f472b6',
      background: '#fdf2f8',
      surface: '#ffffff',
      text: '#9d174d',
      border: '#9d174d'
    }
  },
  desert: {
    name: 'Desert Sand',
    colors: {
      primary: '#d97706',
      primaryForeground: '#ffffff',
      secondary: '#f59e0b',
      secondaryForeground: '#ffffff',
      accent: '#fbbf24',
      background: '#fffbeb',
      surface: '#ffffff',
      text: '#92400e',
      border: '#92400e'
    }
  },
  arctic: {
    name: 'Arctic Frost',
    colors: {
      primary: '#0ea5e9',
      primaryForeground: '#ffffff',
      secondary: '#06b6d4',
      secondaryForeground: '#ffffff',
      accent: '#67e8f9',
      background: '#f0f9ff',
      surface: '#ffffff',
      text: '#0c4a6e',
      border: '#0c4a6e'
    }
  },
  volcano: {
    name: 'Volcano Red',
    colors: {
      primary: '#dc2626',
      primaryForeground: '#ffffff',
      secondary: '#ef4444',
      secondaryForeground: '#ffffff',
      accent: '#f87171',
      background: '#0f0f0f',
      surface: '#1f1f1f',
      text: '#fecaca',
      border: '#dc2626'
    }
  },
  meadow: {
    name: 'Meadow Green',
    colors: {
      primary: '#16a34a',
      primaryForeground: '#ffffff',
      secondary: '#22c55e',
      secondaryForeground: '#ffffff',
      accent: '#4ade80',
      background: '#f0fdf4',
      surface: '#ffffff',
      text: '#166534',
      border: '#166534'
    }
  },
  twilight: {
    name: 'Twilight Purple',
    colors: {
      primary: '#7c3aed',
      primaryForeground: '#ffffff',
      secondary: '#8b5cf6',
      secondaryForeground: '#ffffff',
      accent: '#a78bfa',
      background: '#1e1b4b',
      surface: '#312e81',
      text: '#ddd6fe',
      border: '#7c3aed'
    }
  },
  sunrise: {
    name: 'Sunrise Glow',
    colors: {
      primary: '#ea580c',
      primaryForeground: '#ffffff',
      secondary: '#f97316',
      secondaryForeground: '#ffffff',
      accent: '#fb923c',
      background: '#fff7ed',
      surface: '#ffffff',
      text: '#9a3412',
      border: '#9a3412'
    }
  },
  storm: {
    name: 'Storm Cloud',
    colors: {
      primary: '#374151',
      primaryForeground: '#ffffff',
      secondary: '#4b5563',
      secondaryForeground: '#ffffff',
      accent: '#6b7280',
      background: '#111827',
      surface: '#1f2937',
      text: '#f9fafb',
      border: '#6b7280'
    }
  },
  minimal: {
    name: 'Minimal Gray',
    colors: {
      primary: '#6b7280',
      primaryForeground: '#ffffff',
      secondary: '#9ca3af',
      secondaryForeground: '#000000',
      accent: '#d1d5db',
      background: '#f9fafb',
      surface: '#ffffff',
      text: '#374151',
      border: '#d1d5db'
    }
  },
  autumn: {
    name: 'Autumn Warm',
    colors: {
      primary: '#dc2626',
      primaryForeground: '#ffffff',
      secondary: '#ea580c',
      secondaryForeground: '#ffffff',
      accent: '#f97316',
      background: '#fef7f7',
      surface: '#ffffff',
      text: '#991b1b',
      border: '#991b1b'
    }
  },
  emerald: {
    name: 'Emerald Bliss',
    colors: {
      primary: '#059669',
      primaryForeground: '#ffffff',
      secondary: '#10b981',
      secondaryForeground: '#ffffff',
      accent: '#34d399',
      background: '#f0fdf4',
      surface: '#ffffff',
      text: '#064e3b',
      border: '#064e3b'
    }
  },
  sapphire: {
    name: 'Sapphire Sky',
    colors: {
      primary: '#0369a1',
      primaryForeground: '#ffffff',
      secondary: '#0284c7',
      secondaryForeground: '#ffffff',
      accent: '#0ea5e9',
      background: '#f0f9ff',
      surface: '#ffffff',
      text: '#0c4a6e',
      border: '#0c4a6e'
    }
  },
  ruby: {
    name: 'Ruby Passion',
    colors: {
      primary: '#dc2626',
      primaryForeground: '#ffffff',
      secondary: '#ef4444',
      secondaryForeground: '#ffffff',
      accent: '#f87171',
      background: '#fef2f2',
      surface: '#ffffff',
      text: '#991b1b',
      border: '#991b1b'
    }
  },
  amethyst: {
    name: 'Amethyst Mystique',
    colors: {
      primary: '#7c3aed',
      primaryForeground: '#ffffff',
      secondary: '#8b5cf6',
      secondaryForeground: '#ffffff',
      accent: '#a78bfa',
      background: '#faf5ff',
      surface: '#ffffff',
      text: '#581c87',
      border: '#581c87'
    }
  },
  coral: {
    name: 'Coral Sunset',
    colors: {
      primary: '#ea580c',
      primaryForeground: '#ffffff',
      secondary: '#f97316',
      secondaryForeground: '#ffffff',
      accent: '#fb923c',
      background: '#fff7ed',
      surface: '#ffffff',
      text: '#9a3412',
      border: '#9a3412'
    }
  },
  mint: {
    name: 'Mint Fresh',
    colors: {
      primary: '#059669',
      primaryForeground: '#ffffff',
      secondary: '#10b981',
      secondaryForeground: '#ffffff',
      accent: '#6ee7b7',
      background: '#f0fdf4',
      surface: '#ffffff',
      text: '#064e3b',
      border: '#064e3b'
    }
  },
  slate: {
    name: 'Slate Modern',
    colors: {
      primary: '#475569',
      primaryForeground: '#ffffff',
      secondary: '#64748b',
      secondaryForeground: '#ffffff',
      accent: '#94a3b8',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#334155',
      border: '#cbd5e1'
    }
  },
  gold: {
    name: 'Golden Hour',
    colors: {
      primary: '#d97706',
      primaryForeground: '#ffffff',
      secondary: '#f59e0b',
      secondaryForeground: '#ffffff',
      accent: '#fbbf24',
      background: '#fffbeb',
      surface: '#ffffff',
      text: '#92400e',
      border: '#92400e'
    }
  },
  indigo: {
    name: 'Indigo Night',
    colors: {
      primary: '#3730a3',
      primaryForeground: '#ffffff',
      secondary: '#4338ca',
      secondaryForeground: '#ffffff',
      accent: '#6366f1',
      background: '#eef2ff',
      surface: '#ffffff',
      text: '#312e81',
      border: '#312e81'
    }
  },
  softDark: {
    name: 'Soft Dark',
    colors: {
      primary: '#818cf8',
      primaryForeground: '#ffffff',
      secondary: '#c084fc',
      secondaryForeground: '#ffffff',
      accent: '#34d399',
      background: '#1e293b',
      surface: '#334155',
      text: '#f1f5f9',
      border: '#ffffff'
    }
  }
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

function getChartColors(themeName: string): string[] {
  // Return chart colors based on theme
  const theme = themes[themeName] || themes.default
  return [theme.colors.primary, theme.colors.secondary, theme.colors.accent]
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState('default')
  const [customTheme, setCustomTheme] = useState<Theme | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const savedCustom = localStorage.getItem('customTheme')

    // Schedule state updates asynchronously to avoid cascading renders
    if (saved) {
      const t = setTimeout(() => setCurrentTheme(saved), 0)
      return () => clearTimeout(t)
    }
    if (savedCustom) {
      const t2 = setTimeout(() => setCustomTheme(JSON.parse(savedCustom)), 0)
      return () => clearTimeout(t2)
    }
  }, [])

  useEffect(() => {
    const theme = currentTheme === 'custom' && customTheme ? customTheme : themes[currentTheme]
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
    localStorage.setItem('theme', themeName)
  }

  const handleSetCustomTheme = (theme: Theme) => {
    setCustomTheme(theme)
    localStorage.setItem('customTheme', JSON.stringify(theme))
    // Apply custom theme immediately
    const root = document.documentElement
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })
    const chartColors = getChartColors('custom')
    chartColors.forEach((color, index) => {
      root.style.setProperty(`--chart-${index + 1}`, color)
    })
    document.body.className = `theme-custom`
  }

  const theme = currentTheme === 'custom' && customTheme ? customTheme : themes[currentTheme]

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        theme,
        setTheme,
        themes,
        customTheme,
        setCustomTheme: handleSetCustomTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
