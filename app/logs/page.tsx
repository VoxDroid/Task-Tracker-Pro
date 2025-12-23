"use client"

import { useEffect, useState } from "react"
import Sidebar from "@/components/sidebar"
import type { ActivityLog } from "@/lib/types"
import {
  Activity,
  Clock,
  Search,
  Filter,
  TrendingUp,
  Target,
  Zap,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

const ITEMS_PER_PAGE = 10

export default function LogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [showResetModal, setShowResetModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchLogs()
  }, [])

  useEffect(() => {
    let filtered = Array.isArray(logs) ? [...logs] : []

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (log) =>
          log.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.entity_type.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (actionFilter !== "all") {
      filtered = filtered.filter((log) => log.action === actionFilter)
    }

    setFilteredLogs(filtered)
    setCurrentPage(1)
  }, [logs, searchQuery, actionFilter])

  const fetchLogs = async () => {
    try {
      const response = await fetch("/api/logs?limit=1000")
      const data = await response.json()
      setLogs(Array.isArray(data.logs) ? data.logs : [])
    } catch (error) {
      console.error("Error fetching logs:", error)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "created":
        return "bg-[var(--color-accent)] bg-opacity-20 border-[var(--color-accent)] border-opacity-30"
      case "updated":
        return "bg-[var(--color-primary)] bg-opacity-20 border-[var(--color-primary)] border-opacity-30"
      case "deleted":
        return "bg-[var(--color-primary)] bg-opacity-30 border-[var(--color-primary)] border-opacity-50"
      case "started":
        return "bg-[var(--color-secondary)] bg-opacity-20 border-[var(--color-secondary)] border-opacity-30"
      case "stopped":
        return "bg-[var(--color-secondary)] bg-opacity-30 border-[var(--color-secondary)] border-opacity-50"
      default:
        return "bg-[var(--color-text)] bg-opacity-10 border-[var(--color-text)] border-opacity-20"
    }
  }

  const getActionTextColor = (action: string) => {
    switch (action) {
      case "created":
        return "#ffffff" // accent background, use white text
      case "updated":
        return "var(--color-primary-foreground)" // primary background, use foreground
      case "deleted":
        return "var(--color-primary-foreground)" // primary background, use foreground
      case "started":
        return "var(--color-secondary-foreground)" // secondary background, use foreground
      case "stopped":
        return "var(--color-secondary-foreground)" // secondary background, use foreground
      default:
        return "var(--color-text)" // text background, use text color
    }
  }

  const getLogStats = () => {
    const safeFilteredLogs = Array.isArray(filteredLogs) ? filteredLogs : []
    const total = safeFilteredLogs.length
    const today = new Date().toDateString()
    const todayLogs = safeFilteredLogs.filter((log) => new Date(log.created_at).toDateString() === today).length
    const actions = [...new Set(safeFilteredLogs.map((log) => log.action))].length

    return { total, todayLogs, actions }
  }

  const getCurrentPageLogs = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredLogs.slice(startIndex, endIndex)
  }

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE)

  const stats = getLogStats()
  const uniqueActions = [...new Set(logs.map((log) => log.action))]

  const exportLogs = async () => {
    try {
      const response = await fetch("/api/logs?limit=1000")
      const data = await response.json()

      const blob = new Blob([JSON.stringify(data.logs, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `activity-logs-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting logs:", error)
    }
  }

  const resetLogs = async () => {
    try {
      const response = await fetch("/api/logs", {
        method: "DELETE",
      })

      if (response.ok) {
        setLogs([])
        setFilteredLogs([])
        setShowResetModal(false)
      }
    } catch (error) {
      console.error("Error resetting logs:", error)
    }
  }

  if (loading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full mx-auto mb-4"></div>
            <div className="text-lg font-medium" style={{ color: "var(--color-text)" }}>
              Loading activity logs...
            </div>
          </div>
        </div>
      </Sidebar>
    )
  }

  return (
    <Sidebar>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-2 flex items-center" style={{ color: "var(--color-text)" }}>
            <Activity className="mr-4" />
            Activity Logs
          </h1>
          <p className="text-xl opacity-70" style={{ color: "var(--color-text)" }}>
            Track all activities in your workspace
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70 mb-1" style={{ color: "var(--color-text)" }}>
                  Total Activities
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--color-primary)] bg-opacity-10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6" style={{ color: "var(--color-primary)" }} />
              </div>
            </div>
          </div>
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70 mb-1" style={{ color: "var(--color-text)" }}>
                  Today's Activities
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                  {stats.todayLogs}
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--color-accent)] bg-opacity-10 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6" style={{ color: "var(--color-accent)" }} />
              </div>
            </div>
          </div>
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70 mb-1" style={{ color: "var(--color-text)" }}>
                  Action Types
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                  {stats.actions}
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--color-secondary)] bg-opacity-10 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6" style={{ color: "var(--color-secondary)" }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 opacity-50"
                style={{ color: "var(--color-text)" }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search activity logs..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-colors"
                style={{
                  backgroundColor: "var(--color-background)",
                  color: "var(--color-text)",
                }}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 opacity-50" style={{ color: "var(--color-text)" }} />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-4 py-3 rounded-xl border-2 border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-colors"
                style={{
                  backgroundColor: "var(--color-background)",
                  color: "var(--color-text)",
                }}
              >
                <option value="all">All Actions</option>
                {uniqueActions.map((action) => (
                  <option key={action} value={action}>
                    {action.charAt(0).toUpperCase() + action.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              Log Management
            </h3>
            <div className="flex space-x-4">
              <button
                onClick={exportLogs}
                className="flex items-center px-4 py-2 bg-[var(--color-accent)] bg-opacity-20 rounded-xl border-2 border-[var(--color-border)] hover:bg-opacity-30 hover:shadow-md hover:transform hover:scale-105 transition-all duration-200 font-medium"
                style={{ color: "#ffffff" }}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Logs
              </button>
              <button
                onClick={() => setShowResetModal(true)}
                className="flex items-center px-4 py-2 bg-[var(--color-primary)] bg-opacity-20 rounded-xl border-2 border-[var(--color-border)] hover:bg-opacity-30 hover:shadow-md hover:transform hover:scale-105 transition-all duration-200 font-medium"
                style={{ color: "var(--color-primary-foreground)" }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Reset Logs
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-[var(--color-primary)] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[var(--color-border)]">
                <Activity className="w-12 h-12 opacity-40" style={{ color: "var(--color-text)" }} />
              </div>
              <p className="text-xl mb-2 opacity-70" style={{ color: "var(--color-text)" }}>
                {searchQuery || actionFilter !== "all" ? "No matching activity logs" : "No activity logs"}
              </p>
              <p className="text-lg opacity-50" style={{ color: "var(--color-text)" }}>
                Your activities will appear here
              </p>
            </div>
          ) : (
            getCurrentPageLogs().map((log) => (
              <div
                key={log.id}
                className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg hover:shadow-xl hover:transform hover:scale-[1.01] transition-all duration-200 cursor-pointer"
                onClick={() => {
                  if (log.entity_type === "task") {
                    window.location.href = "/tasks"
                  } else if (log.entity_type === "project") {
                    window.location.href = "/projects"
                  } else if (log.entity_type === "time_entry") {
                    window.location.href = "/time-tracking"
                  }
                }}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    <Clock size={20} className="opacity-40" style={{ color: "var(--color-text)" }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span
                        className={`px-3 py-1 rounded-xl text-sm font-medium border-2 ${getActionColor(log.action)}`}
                        style={{ color: getActionTextColor(log.action) }}
                      >
                        {log.action.toUpperCase()}
                      </span>
                      <span
                        className="text-sm font-medium bg-[var(--color-background)] px-3 py-1 rounded-xl border border-[var(--color-border)]"
                        style={{ color: "var(--color-text)" }}
                      >
                        {log.entity_type.charAt(0).toUpperCase() + log.entity_type.slice(1)} #{log.entity_id}
                      </span>
                      <span
                        className="text-sm opacity-60 bg-[var(--color-background)] px-3 py-1 rounded-xl border border-[var(--color-border)]"
                        style={{ color: "var(--color-text)" }}
                      >
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-lg" style={{ color: "var(--color-text)" }}>
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border-2 border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:bg-opacity-10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style={{ color: "var(--color-text)" }}
            >
              <ChevronLeft size={20} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 rounded-xl border-2 border-[var(--color-border)] font-medium transition-all duration-200 hover-primary ${
                  currentPage === page
                    ? "bg-[var(--color-primary)] bg-opacity-20 shadow-lg"
                    : "hover:bg-[var(--color-primary)] hover:bg-opacity-10"
                }`}
                style={{ color: currentPage === page ? "var(--color-primary-foreground)" : undefined }}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border-2 border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:bg-opacity-10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style={{ color: "var(--color-text)" }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {showResetModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className="p-8 rounded-2xl border-2 shadow-2xl max-w-md w-full mx-4"
              style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-[var(--color-primary)] bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8" style={{ color: "var(--color-primary)" }} />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
                  Reset Activity Logs
                </h3>
                <p className="opacity-70 mb-6" style={{ color: "var(--color-text)" }}>
                  Are you sure you want to delete all activity logs? This action cannot be undone.
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowResetModal(false)}
                    className="flex-1 px-4 py-3 hover:bg-red-600 hover:text-white rounded-xl border-2 border-[var(--color-border)] transition-all duration-200 font-medium"
                    style={{ color: "var(--color-text)" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={resetLogs}
                    className="flex-1 px-4 py-3 hover:bg-gray-600 hover:text-white rounded-xl border-2 border-[var(--color-border)] transition-all duration-200 font-medium"
                    style={{ color: "var(--color-text)" }}
                  >
                    Reset Logs
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  )
}
