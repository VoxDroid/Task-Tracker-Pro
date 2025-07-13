"use client"

import type React from "react"

import { useState } from "react"
import Sidebar from "@/components/sidebar"
import { useNotification } from "@/components/notification"
import { useTheme } from "@/components/theme-provider"
import { Settings, Palette, Database, Download, Upload, Trash2, Monitor, Moon, Sun } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const { addNotification } = useNotification()
  const { currentTheme, setTheme, themes, customTheme, setCustomTheme } = useTheme()
  const [customColors, setCustomColors] = useState({
    primary: "#3b82f6",
    secondary: "#8b5cf6",
    accent: "#10b981",
    background: "#f9fafb",
    surface: "#ffffff",
    text: "#000000",
    border: "#000000",
  })

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
        return <Moon className="w-5 h-5" />
      case "default":
        return <Sun className="w-5 h-5" />
      default:
        return <Monitor className="w-5 h-5" />
    }
  }

  return (
    <Sidebar>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-2 flex items-center" style={{ color: "var(--color-text)" }}>
            <Settings className="mr-4" />
            Settings
          </h1>
          <p className="text-xl opacity-70" style={{ color: "var(--color-text)" }}>
            Customize your Task Tracker Pro experience
          </p>
        </div>

        <div className="space-y-8">
          {/* Theme Settings */}
          <div className="bg-[var(--color-surface)] p-8 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
            <div className="flex items-center mb-6">
              <Palette className="w-6 h-6 text-purple-600 mr-3" />
              <h2 className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                Theme Settings
              </h2>
            </div>

            {/* Preset Themes */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-6" style={{ color: "var(--color-text)" }}>
                Preset Themes
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(themes).map(([key, theme]) => (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
                      currentTheme === key
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)] bg-opacity-10 shadow-lg"
                        : "border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-md hover:transform hover:scale-[1.02]"
                    }`}
                    style={{
                      transform: currentTheme === key ? "scale(1)" : undefined,
                      zIndex: currentTheme === key ? 10 : 1,
                    }}
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      {getThemeIcon(key)}
                      <span className="font-semibold text-lg" style={{ color: "var(--color-text)" }}>
                        {theme.name}
                      </span>
                    </div>
                    <div className="flex space-x-2 mb-3">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-[var(--color-border)]"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <div
                        className="w-6 h-6 rounded-full border-2 border-[var(--color-border)]"
                        style={{ backgroundColor: theme.colors.secondary }}
                      />
                      <div
                        className="w-6 h-6 rounded-full border-2 border-[var(--color-border)]"
                        style={{ backgroundColor: theme.colors.accent }}
                      />
                    </div>
                    <div className="text-sm opacity-70" style={{ color: "var(--color-text)" }}>
                      {key === "default" && "Clean and professional"}
                      {key === "dark" && "Easy on the eyes"}
                      {key === "softDark" && "Gentle dark theme"}
                      {key === "ocean" && "Cool and refreshing"}
                      {key === "forest" && "Natural and calming"}
                      {key === "sunset" && "Warm and energetic"}
                    </div>
                    {currentTheme === key && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-[var(--color-primary)] rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Theme */}
            <div>
              <h3 className="text-xl font-semibold mb-6" style={{ color: "var(--color-text)" }}>
                Custom Theme
              </h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Object.entries(customColors).map(([key, value]) => (
                    <div key={key} className="space-y-3">
                      <label className="block text-sm font-medium capitalize" style={{ color: "var(--color-text)" }}>
                        {key.replace(/([A-Z])/g, " $1")}
                      </label>
                      <div className="space-y-2">
                        <input
                          type="color"
                          value={value}
                          onChange={(e) => setCustomColors({ ...customColors, [key]: e.target.value })}
                          className="w-full h-12 rounded-xl border-2 border-[var(--color-border)] cursor-pointer"
                        />
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => setCustomColors({ ...customColors, [key]: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border-2 border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-colors bg-[var(--color-background)]"
                          style={{ color: "var(--color-text)" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={saveCustomTheme}
                  className="px-6 py-3 bg-[var(--color-secondary)] bg-opacity-20 rounded-xl border-2 border-[var(--color-border)] hover:bg-opacity-30 hover:shadow-lg hover:transform hover:scale-105 transition-all duration-200 font-medium"
                  style={{ color: "var(--color-text)" }}
                >
                  Apply Custom Theme
                </button>
              </div>
            </div>
          </div>

          {/* Database Settings */}
          <div className="bg-[var(--color-surface)] p-8 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
            <div className="flex items-center mb-6">
              <Database className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                Database Management
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Export Data */}
              <div className="text-center">
                <div className="w-20 h-20 bg-green-500 bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[var(--color-border)]">
                  <Download className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2" style={{ color: "var(--color-text)" }}>
                  Export Data
                </h3>
                <p className="text-sm opacity-70 mb-4" style={{ color: "var(--color-text)" }}>
                  Download a backup of all your data
                </p>
                <button
                  onClick={exportData}
                  className="px-6 py-3 bg-green-500 bg-opacity-20 rounded-xl border-2 border-[var(--color-border)] hover:bg-opacity-30 hover:shadow-md hover:transform hover:scale-105 transition-all duration-200 font-medium"
                  style={{ color: "var(--color-text)" }}
                >
                  Export
                </button>
              </div>

              {/* Import Data */}
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-500 bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[var(--color-border)]">
                  <Upload className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2" style={{ color: "var(--color-text)" }}>
                  Import Data
                </h3>
                <p className="text-sm opacity-70 mb-4" style={{ color: "var(--color-text)" }}>
                  Restore data from a backup file
                </p>
                <label
                  className="inline-block px-6 py-3 bg-blue-500 bg-opacity-20 rounded-xl border-2 border-[var(--color-border)] hover:bg-opacity-30 hover:shadow-md hover:transform hover:scale-105 transition-all duration-200 font-medium cursor-pointer"
                  style={{ color: "var(--color-text)" }}
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
                <h3 className="font-semibold text-lg mb-2" style={{ color: "var(--color-text)" }}>
                  Reset Database
                </h3>
                <p className="text-sm opacity-70 mb-4" style={{ color: "var(--color-text)" }}>
                  Delete all data and start fresh
                </p>
                <button
                  onClick={() => setShowResetModal(true)}
                  className="px-6 py-3 bg-red-500 bg-opacity-20 rounded-xl border-2 border-[var(--color-border)] hover:bg-opacity-30 hover:shadow-md hover:transform hover:scale-105 transition-all duration-200 font-medium"
                  style={{ color: "var(--color-text)" }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reset Database Confirmation Modal */}
        <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
          <DialogContent
            className="bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-2xl shadow-2xl max-w-md"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
            }}
          >
            <DialogHeader className="space-y-4">
              <DialogTitle className="text-2xl font-bold flex items-center" style={{ color: "var(--color-text)" }}>
                <div
                  className="w-12 h-12 bg-red-500 bg-opacity-10 rounded-xl flex items-center justify-center mr-4 border-2"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                Reset Database
              </DialogTitle>
              <DialogDescription
                className="text-base leading-relaxed"
                style={{ color: "var(--color-text)", opacity: 0.8 }}
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
                }}
              >
                <ul className="space-y-3 text-sm" style={{ color: "var(--color-text)", opacity: 0.9 }}>
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
                }}
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
