"use client"

import type React from "react"

import { useState } from "react"
import Sidebar from "@/components/sidebar"
import { useNotification } from "@/components/notification"
import { useTheme } from "@/components/theme-provider"
import { Settings, Palette, Database, Download, Upload, Trash2 } from "lucide-react"

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
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
    if (!confirm("Are you sure you want to reset the database? This will delete ALL data and cannot be undone!")) {
      return
    }

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
      title: "Theme Saved",
      message: "Your custom theme has been applied successfully.",
    })
  }

  return (
    <Sidebar>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2 flex items-center">
            <Settings className="mr-4" />
            Settings
          </h1>
          <p className="text-lg text-gray-600">Customize your Task Tracker Pro experience</p>
        </div>

        <div className="space-y-8">
          {/* Theme Settings */}
          <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-lg">
            <div className="flex items-center mb-6">
              <Palette className="w-6 h-6 text-purple-600 mr-3" />
              <h2 className="text-2xl font-bold text-black">Theme Settings</h2>
            </div>

            {/* Preset Themes */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-black mb-4">Preset Themes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(themes).map(([key, theme]) => (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      currentTheme === key
                        ? "border-black bg-blue-50 shadow-lg transform scale-105"
                        : "border-gray-300 hover:border-black hover:shadow-md hover:transform hover:scale-105"
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex space-x-1">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.secondary }} />
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.accent }} />
                      </div>
                      <span className="font-semibold text-black">{theme.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Theme */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-4">Custom Theme</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {Object.entries(customColors).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                      {key.replace(/([A-Z])/g, " $1")}
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => setCustomColors({ ...customColors, [key]: e.target.value })}
                        className="w-12 h-12 rounded-xl border-2 border-black cursor-pointer"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setCustomColors({ ...customColors, [key]: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={saveCustomTheme}
                className="px-6 py-3 bg-purple-100 text-purple-800 rounded-xl border-2 border-black hover:bg-purple-200 hover:shadow-lg hover:transform hover:scale-105 transition-all duration-200 font-medium"
              >
                Apply Custom Theme
              </button>
            </div>
          </div>

          {/* Database Settings */}
          <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-lg">
            <div className="flex items-center mb-6">
              <Database className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-2xl font-bold text-black">Database Management</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Export Data */}
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-black">
                  <Download className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-black mb-2">Export Data</h3>
                <p className="text-sm text-gray-600 mb-4">Download a backup of all your data</p>
                <button
                  onClick={exportData}
                  className="px-4 py-2 bg-green-100 text-green-800 rounded-xl border-2 border-black hover:bg-green-200 hover:shadow-md hover:transform hover:scale-105 transition-all duration-200 font-medium"
                >
                  Export
                </button>
              </div>

              {/* Import Data */}
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-black">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-black mb-2">Import Data</h3>
                <p className="text-sm text-gray-600 mb-4">Restore data from a backup file</p>
                <label className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-xl border-2 border-black hover:bg-blue-200 hover:shadow-md hover:transform hover:scale-105 transition-all duration-200 font-medium cursor-pointer">
                  Import
                  <input type="file" accept=".json" onChange={importData} className="hidden" />
                </label>
              </div>

              {/* Reset Database */}
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-black">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="font-semibold text-black mb-2">Reset Database</h3>
                <p className="text-sm text-gray-600 mb-4">Delete all data and start fresh</p>
                <button
                  onClick={resetDatabase}
                  disabled={loading}
                  className="px-4 py-2 bg-red-100 text-red-800 rounded-xl border-2 border-black hover:bg-red-200 hover:shadow-md hover:transform hover:scale-105 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Resetting..." : "Reset"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  )
}
