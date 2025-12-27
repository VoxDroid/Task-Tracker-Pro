"use client"

import type React from "react"
import type { CSSProperties } from "react"

import { useState, useEffect } from "react"
import { Settings, Palette, Moon, Sun, Database, Download, Upload, Trash2 } from "lucide-react"
import Sidebar from "@/components/sidebar"
import { useNotification } from "@/components/notification"
import { useTheme } from "@/components/theme-provider"
import { HexColorPicker } from "react-colorful"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [showCustomThemeModal, setShowCustomThemeModal] = useState(false)
  const { addNotification } = useNotification()
  const { currentTheme, setTheme, themes, customTheme, setCustomTheme } = useTheme()
  const [customColors, setCustomColors] = useState({
    primary: customTheme?.colors.primary || "#3b82f6",
    primaryForeground: customTheme?.colors.primaryForeground || "#ffffff",
    secondary: customTheme?.colors.secondary || "#8b5cf6",
    secondaryForeground: customTheme?.colors.secondaryForeground || "#ffffff",
    accent: customTheme?.colors.accent || "#10b981",
    background: customTheme?.colors.background || "#f9fafb",
    surface: customTheme?.colors.surface || "#ffffff",
    text: customTheme?.colors.text || "#000000",
    border: customTheme?.colors.border || "#000000",
  })

  // Update customColors when customTheme changes
  useEffect(() => {
    if (customTheme) {
      setCustomColors(customTheme.colors)
    }
  }, [customTheme])

  const resetDatabase = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/database/reset", {
        method: "POST",
      })

      if (response.ok) {
        addNotification({
          type: "success",
          title: "Database Reset",
          message: "Database has been reset successfully. The page will reload.",
        })
        setTimeout(() => window.location.reload(), 2000)
      } else {
        throw new Error("Failed to reset database")
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to reset database. Please try again.",
      })
    } finally {
      setLoading(false)
      setShowResetModal(false)
    }
  }

  const exportData = async () => {
    try {
      const response = await fetch("/api/database/export")
      const data = await response.json()

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `tasktracker-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      addNotification({
        type: "success",
        title: "Data Exported",
        message: "Your data has been exported successfully.",
      })
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to export data. Please try again.",
      })
    }
  }

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      const response = await fetch("/api/database/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        addNotification({
          type: "success",
          title: "Data Imported",
          message: "Your data has been imported successfully. The page will reload.",
        })
        setTimeout(() => window.location.reload(), 2000)
      } else {
        throw new Error("Failed to import data")
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to import data. Please check the file format.",
      })
    }
  }

  const saveCustomTheme = () => {
    const theme = {
      name: "Custom",
      colors: customColors,
    }
    setCustomTheme(theme)
    setTheme("custom")
    setShowCustomThemeModal(false)
    addNotification({
      type: "success",
      title: "Theme Applied",
      message: "Your custom theme has been applied successfully.",
    })
  }

  const getThemeIcon = (themeKey: string) => {
    switch (themeKey) {
      case "dark":
      case "softDark":
      case "midnight":
      case "volcano":
      case "twilight":
      case "storm":
        return <Moon className="w-5 h-5" />
      case "default":
      case "ocean":
      case "forest":
      case "sunset":
      case "lavender":
      case "rose":
      case "minimal":
      case "autumn":
      case "emerald":
      case "sapphire":
      case "ruby":
      case "amethyst":
      case "coral":
      case "mint":
      case "slate":
      case "gold":
      case "indigo":
      case "cherry":
      case "desert":
      case "arctic":
      case "meadow":
      case "sunrise":
        return <Sun className="w-5 h-5" />
    }
  }

  return (
    <Sidebar>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-2 flex items-center" style={{ color: "var(--color-text)" } as CSSProperties}>
            <Settings className="mr-4" />
            Settings
          </h1>
          <p className="text-xl opacity-70" style={{ color: "var(--color-text)" } as CSSProperties}>
            Customize your Task Tracker Pro experience
          </p>
        </div>

        <div className="space-y-8">
          {/* Theme Settings */}
          <div className="bg-[var(--color-surface)] p-8 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
            <div className="flex items-center mb-6">
              <Palette className="w-6 h-6 text-purple-600 mr-3" />
              <h2 className="text-3xl font-bold" style={{ color: "var(--color-text)" } as CSSProperties}>
                Theme Settings
              </h2>
            </div>

            {/* Preset Themes */}
            <div className="space-y-8">
              {/* All Themes */}
              <div>
                <h3 className="text-xl font-semibold mb-6 flex items-center" style={{ color: "var(--color-text)" } as CSSProperties}>
                  <Palette className="w-5 h-5 mr-2" />
                  Themes
                </h3>
                <div className="max-w-md">
                  <Select value={currentTheme} onValueChange={setTheme}>
                    <SelectTrigger className="w-full" style={{ backgroundColor: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" } as CSSProperties}>
                      <SelectValue placeholder="Select a theme">
                        {currentTheme && themes[currentTheme] && (
                          <div className="flex items-center space-x-3">
                            {getThemeIcon(currentTheme)}
                            <span>{themes[currentTheme].name}</span>
                          </div>
                        )}
                        {currentTheme === "custom" && customTheme && (
                          <div className="flex items-center space-x-3">
                            <Palette className="w-5 h-5" />
                            <span>{customTheme.name}</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" } as CSSProperties} className="max-w-md">
                      {/* Light Themes */}
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Light Themes
                      </div>
                      {Object.entries(themes)
                        .filter(([key]) => !['dark', 'softDark', 'midnight', 'volcano', 'twilight', 'storm'].includes(key))
                        .map(([key, theme]) => (
                          <SelectItem key={key} value={key} className="p-4 cursor-pointer rounded-xl">
                            <div className="space-y-3">
                              <div className="flex items-center space-x-3">
                                {getThemeIcon(key)}
                                <span className="font-semibold text-lg" style={{ color: "var(--color-text)" } as CSSProperties}>
                                  {theme.name}
                                </span>
                              </div>
                              <div className="flex space-x-2">
                                <div
                                  className="w-6 h-6 rounded-3xl border-2 border-[var(--color-border)]"
                                  style={{ backgroundColor: theme.colors.primary } as CSSProperties}
                                />
                                <div
                                  className="w-6 h-6 rounded-3xl border-2 border-[var(--color-border)]"
                                  style={{ backgroundColor: theme.colors.secondary } as CSSProperties}
                                />
                                <div
                                  className="w-6 h-6 rounded-3xl border-2 border-[var(--color-border)]"
                                  style={{ backgroundColor: theme.colors.accent } as CSSProperties}
                                />
                              </div>
                              <div className="text-sm opacity-70" style={{ color: "var(--color-text)" } as CSSProperties}>
                                {key === "default" && "Clean and professional"}
                                {key === "ocean" && "Cool and refreshing"}
                                {key === "forest" && "Natural and calming"}
                                {key === "sunset" && "Warm and energetic"}
                                {key === "lavender" && "Dreamy and elegant"}
                                {key === "rose" && "Soft and romantic"}
                                {key === "minimal" && "Simple and clean"}
                                {key === "autumn" && "Cozy and warm"}
                                {key === "emerald" && "Fresh and vibrant"}
                                {key === "sapphire" && "Deep and serene"}
                                {key === "ruby" && "Bold and passionate"}
                                {key === "amethyst" && "Mystical and elegant"}
                                {key === "coral" && "Warm and tropical"}
                                {key === "mint" && "Clean and fresh"}
                                {key === "slate" && "Modern and sleek"}
                                {key === "gold" && "Luxurious and warm"}
                                {key === "indigo" && "Deep and mysterious"}
                                {key === "cherry" && "Delicate and feminine"}
                                {key === "desert" && "Warm and sandy"}
                                {key === "arctic" && "Cool and crisp"}
                                {key === "meadow" && "Fresh and natural"}
                                {key === "sunrise" && "Bright and hopeful"}
                              </div>
                            </div>
                          </SelectItem>
                        ))}

                      {/* Dark Themes */}
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-t border-[var(--color-border)] mt-2 pt-2">
                        Dark Themes
                      </div>
                      {Object.entries(themes)
                        .filter(([key]) => ['dark', 'softDark', 'midnight', 'volcano', 'twilight', 'storm'].includes(key))
                        .map(([key, theme]) => (
                          <SelectItem key={key} value={key} className="p-4 cursor-pointer rounded-xl">
                            <div className="space-y-3">
                              <div className="flex items-center space-x-3">
                                {getThemeIcon(key)}
                                <span className="font-semibold text-lg" style={{ color: "var(--color-text)" } as CSSProperties}>
                                  {theme.name}
                                </span>
                              </div>
                              <div className="flex space-x-2">
                                <div
                                  className="w-6 h-6 rounded-3xl border-2 border-[var(--color-border)]"
                                  style={{ backgroundColor: theme.colors.primary } as CSSProperties}
                                />
                                <div
                                  className="w-6 h-6 rounded-3xl border-2 border-[var(--color-border)]"
                                  style={{ backgroundColor: theme.colors.secondary } as CSSProperties}
                                />
                                <div
                                  className="w-6 h-6 rounded-3xl border-2 border-[var(--color-border)]"
                                  style={{ backgroundColor: theme.colors.accent } as CSSProperties}
                                />
                              </div>
                              <div className="text-sm opacity-70" style={{ color: "var(--color-text)" } as CSSProperties}>
                                {key === "dark" && "Easy on the eyes"}
                                {key === "softDark" && "Gentle dark theme"}
                                {key === "midnight" && "Deep and immersive"}
                                {key === "volcano" && "Bold and intense"}
                                {key === "twilight" && "Mysterious and calm"}
                                {key === "storm" && "Dramatic and moody"}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Custom Theme */}
              <div>
                <h3 className="text-xl font-semibold mb-6" style={{ color: "var(--color-text)" } as CSSProperties}>
                  Custom Theme
                </h3>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowCustomThemeModal(true)}
                    className="px-6 py-3 bg-[var(--color-secondary)] bg-opacity-20 rounded-xl border-2 border-[var(--color-border)] hover:bg-opacity-30 hover:shadow-lg hover:transform hover:scale-105 transition-all duration-200 font-medium flex items-center space-x-3"
                    style={{ color: "var(--color-secondary-foreground)" } as CSSProperties}
                  >
                    <Palette className="w-5 h-5" />
                    <span>Customize Theme</span>
                  </button>
                  {customTheme && (
                    <div className="flex space-x-2">
                      <div
                        className="w-6 h-6 rounded-3xl border-2 border-[var(--color-border)]"
                        style={{ backgroundColor: customTheme.colors.primary } as CSSProperties}
                      />
                      <div
                        className="w-6 h-6 rounded-3xl border-2 border-[var(--color-border)]"
                        style={{ backgroundColor: customTheme.colors.secondary } as CSSProperties}
                      />
                      <div
                        className="w-6 h-6 rounded-3xl border-2 border-[var(--color-border)]"
                        style={{ backgroundColor: customTheme.colors.accent } as CSSProperties}
                      />
                    </div>
                  )}
                </div>
                <p className="text-sm opacity-70 mt-3" style={{ color: "var(--color-text)" } as CSSProperties}>
                  Create and customize your own color scheme
                </p>
              </div>
            </div>
          </div>

          {/* Database Settings */}
          <div className="bg-[var(--color-surface)] p-8 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
            <div className="flex items-center mb-6">
              <Database className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-3xl font-bold" style={{ color: "var(--color-text)" } as CSSProperties}>
                Database Management
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Export Data */}
              <div className="text-center">
                <div className="w-20 h-20 bg-green-500 bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[var(--color-border)]">
                  <Download className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2" style={{ color: "var(--color-text)" } as CSSProperties}>
                  Export Data
                </h3>
                <p className="text-sm opacity-70 mb-4" style={{ color: "var(--color-text)" } as CSSProperties}>
                  Download a backup of all your data
                </p>
                <button
                  onClick={exportData}
                  className="px-6 py-3 bg-green-500 bg-opacity-20 rounded-xl border-2 border-[var(--color-border)] hover:bg-opacity-30 hover:shadow-md hover:transform hover:scale-105 transition-all duration-200 font-medium"
                  style={{ color: "var(--color-text)" } as CSSProperties}
                >
                  Export
                </button>
              </div>

              {/* Import Data */}
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-500 bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[var(--color-border)]">
                  <Upload className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2" style={{ color: "var(--color-text)" } as CSSProperties}>
                  Import Data
                </h3>
                <p className="text-sm opacity-70 mb-4" style={{ color: "var(--color-text)" } as CSSProperties}>
                  Restore data from a backup file
                </p>
                <label
                  className="inline-block px-6 py-3 bg-blue-500 bg-opacity-20 rounded-xl border-2 border-[var(--color-border)] hover:bg-opacity-30 hover:shadow-md hover:transform hover:scale-105 transition-all duration-200 font-medium cursor-pointer"
                  style={{ color: "var(--color-text)" } as CSSProperties}
                >
                  Import
                  <input type="file" accept=".json" onChange={importData} className="hidden" />
                </label>
              </div>

              {/* Reset Database */}
              <div className="text-center">
                <div className="w-20 h-20 bg-red-500 bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[var(--color-border)]">
                  <Trash2 className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2" style={{ color: "var(--color-text)" } as CSSProperties}>
                  Reset Database
                </h3>
                <p className="text-sm opacity-70 mb-4" style={{ color: "var(--color-text)" } as CSSProperties}>
                  Delete all data and start fresh
                </p>
                <button
                  onClick={() => setShowResetModal(true)}
                  className="px-6 py-3 bg-red-500 bg-opacity-20 rounded-xl border-2 border-[var(--color-border)] hover:bg-opacity-30 hover:shadow-md hover:transform hover:scale-105 transition-all duration-200 font-medium"
                  style={{ color: "var(--color-text)" } as CSSProperties}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Theme Modal */}
        <Dialog open={showCustomThemeModal} onOpenChange={setShowCustomThemeModal}>
          <DialogContent
            className="bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-2xl shadow-2xl max-w-7xl max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
            } as CSSProperties}
          >
            <DialogHeader className="space-y-4">
              <DialogTitle className="text-2xl font-bold flex items-center" style={{ color: "var(--color-text)" } as CSSProperties}>
                <div
                  className="w-12 h-12 bg-purple-500 bg-opacity-10 rounded-xl flex items-center justify-center mr-4 border-2"
                  style={{ borderColor: "var(--color-border)" } as CSSProperties}
                >
                  <Palette className="w-6 h-6 text-purple-600" />
                </div>
                Custom Theme
              </DialogTitle>
              <DialogDescription
                className="text-base leading-relaxed"
                style={{ color: "var(--color-text)", opacity: 0.8 } as CSSProperties}
              >
                Customize your theme colors. Changes will be applied immediately when you save.
              </DialogDescription>
            </DialogHeader>

            <div className="py-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {Object.entries(customColors).map(([key, value]) => (
                  <div key={key} className="space-y-4">
                    <label className="block text-sm font-medium capitalize" style={{ color: "var(--color-text)" } as CSSProperties}>
                      {key.replace(/([A-Z])/g, " $1")}
                    </label>
                    <div className="space-y-3">
                      <div className="relative">
                        <HexColorPicker
                          color={value}
                          onChange={(newColor) => setCustomColors({ ...customColors, [key]: newColor })}
                          className="!w-full !h-32 rounded-xl border-2 border-[var(--color-border)]"
                        />
                        <div
                          className="absolute top-2 right-2 w-6 h-6 rounded-full border-2 border-white shadow-md"
                          style={{ backgroundColor: value } as CSSProperties}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => setCustomColors({ ...customColors, [key]: e.target.value })}
                          className="flex-1 px-3 py-2 border-2 border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                          placeholder="#000000"
                        />
                        <div
                          className="w-10 h-10 rounded-lg border-2 border-[var(--color-border)]"
                          style={{ backgroundColor: value } as CSSProperties}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="gap-4 pt-2">
              <button
                onClick={() => setShowCustomThemeModal(false)}
                className="flex-1 px-6 py-3 rounded-xl border-2 hover:shadow-md hover:transform hover:scale-[1.02] transition-all duration-200 font-medium"
                style={{
                  backgroundColor: "var(--color-background)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                } as CSSProperties}
              >
                Cancel
              </button>
              <button
                onClick={saveCustomTheme}
                className="flex-1 px-6 py-3 bg-[var(--color-secondary)] bg-opacity-20 rounded-xl border-2 border-[var(--color-border)] hover:bg-opacity-30 hover:shadow-md hover:transform hover:scale-[1.02] transition-all duration-200 font-medium"
                style={{ color: "var(--color-secondary-foreground)" } as CSSProperties}
              >
                Apply Custom Theme
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Database Confirmation Modal */}
        <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
          <DialogContent
            className="bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-2xl shadow-2xl max-w-md"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
            } as CSSProperties}
          >
            <DialogHeader className="space-y-4">
              <DialogTitle className="text-2xl font-bold flex items-center" style={{ color: "var(--color-text)" } as CSSProperties}>
                <div
                  className="w-12 h-12 bg-red-500 bg-opacity-10 rounded-xl flex items-center justify-center mr-4 border-2"
                  style={{ borderColor: "var(--color-border)" } as CSSProperties}
                >
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                Reset Database
              </DialogTitle>
              <DialogDescription
                className="text-base leading-relaxed"
                style={{ color: "var(--color-text)", opacity: 0.8 } as CSSProperties}
              >
                Are you sure you want to reset the database? This will permanently delete ALL your data including:
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-6">
              <div
                className="p-6 rounded-xl border-2"
                style={{
                  backgroundColor: "var(--color-background)",
                  borderColor: "var(--color-border)",
                } as CSSProperties}
              >
                <ul className="space-y-3 text-sm" style={{ color: "var(--color-text)", opacity: 0.9 } as CSSProperties}>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                    All projects and tasks
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                    Time tracking entries
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                    Activity logs
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                    Tags and custom settings
                  </li>
                </ul>
              </div>

              <div className="bg-red-500 bg-opacity-10 p-6 rounded-xl border-2 border-red-500 border-opacity-30">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-500 bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-sm font-bold">!</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-600 mb-1">This action cannot be undone</p>
                    <p className="text-sm text-red-600 opacity-90">Consider exporting your data first as a backup.</p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-4 pt-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 px-6 py-3 rounded-xl border-2 hover:shadow-md hover:transform hover:scale-[1.02] transition-all duration-200 font-medium"
                style={{
                  backgroundColor: "var(--color-background)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                } as CSSProperties}
              >
                Cancel
              </button>
              <button
                onClick={resetDatabase}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-red-500 bg-opacity-20 rounded-xl border-2 border-red-500 border-opacity-40 hover:bg-opacity-30 hover:shadow-md hover:transform hover:scale-[1.02] transition-all duration-200 font-medium text-red-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? "Resetting..." : "Reset Database"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Sidebar>
  )
}
