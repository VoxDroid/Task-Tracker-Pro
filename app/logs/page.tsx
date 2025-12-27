"use client"

import type { CSSProperties } from "react"
import { useEffect, useState } from "react"
import Sidebar from "@/components/sidebar"
import type { ActivityLog, Task, Project, TimeEntry } from "@/lib/types"
import Modal from "@/components/modal"
import EntityPreviewModal from "@/components/entity-preview-modal"
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
  Plus,
  Edit,
  Trash,
  Play,
  Square,
  FolderOpen,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  MapPin,
  ExternalLink,
} from "lucide-react"

const ITEMS_PER_PAGE = 12

// Helper function to get action icon and color
const getActionIcon = (action: string) => {
  switch (action) {
    case "created":
      return { icon: Plus, color: "var(--color-accent)" }
    case "updated":
      return { icon: Edit, color: "var(--color-primary)" }
    case "deleted":
      return { icon: Trash, color: "var(--color-destructive)" }
    case "started":
      return { icon: Play, color: "var(--color-secondary)" }
    case "stopped":
      return { icon: Square, color: "var(--color-muted)" }
    default:
      return { icon: Info, color: "var(--color-text)" }
  }
}

// Helper function to get entity icon
const getEntityIcon = (entityType: string) => {
  switch (entityType) {
    case "task":
      return CheckCircle
    case "project":
      return FolderOpen
    case "time_entry":
      return Clock
    default:
      return Activity
  }
}

// Helper function to parse log details into structured data
const parseLogDetails = (details: string | undefined) => {
  if (!details) return null

  const parsed: { [key: string]: string } = {}

  // Parse different log formats
  if (details.includes(" with details: ")) {
    // Creation logs: "Created task "Title" with details: field1: value1, field2: value2"
    const parts = details.split(" with details: ")
    parsed.summary = parts[0]
    if (parts[1]) {
      const fields = parts[1].split(", ")
      fields.forEach(field => {
        const [key, ...valueParts] = field.split(": ")
        if (key && valueParts.length > 0) {
          parsed[key.toLowerCase().replace(/\s+/g, "_")] = valueParts.join(": ")
        }
      })
    }
  } else if (details.includes(": ")) {
    // Update logs: "Updated task "Title": field1: old → new, field2: old → new"
    const colonIndex = details.indexOf(": ")
    parsed.summary = details.substring(0, colonIndex)
    const changesText = details.substring(colonIndex + 2)

    if (changesText.includes(" → ")) {
      // Parse field changes
      const changes = changesText.split(", ")
      changes.forEach(change => {
        const [field, values] = change.split(": ")
        if (field && values && values.includes(" → ")) {
          const [oldVal, newVal] = values.split(" → ")
          parsed[field.toLowerCase().replace(/\s+/g, "_")] = `${oldVal} → ${newVal}`
        }
      })
    } else {
      parsed.description = changesText
    }
  } else {
    // Simple logs
    parsed.summary = details
  }

  return parsed
}

// Helper function to get action color classes
const getActionColor = (action: string) => {
  switch (action) {
    case "created":
      return "bg-green-100 border-green-300 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300"
    case "updated":
      return "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300"
    case "deleted":
      return "bg-red-100 border-red-300 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300"
    case "started":
      return "bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-300"
    case "stopped":
      return "bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-900/20 dark:border-gray-700 dark:text-gray-300"
    default:
      return "bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text)]"
  }
}

const getActionTextColor = (action: string) => {
  switch (action) {
    case "created":
      return "#166534"
    case "updated":
      return "#1e40af"
    case "deleted":
      return "#dc2626"
    case "started":
      return "#7c3aed"
    case "stopped":
      return "#374151"
    default:
      return "var(--color-text)"
  }
}

export default function LogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [showResetModal, setShowResetModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null)
  const [previewData, setPreviewData] = useState<Task | Project | TimeEntry | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

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

    // Date filtering
    if (dateFilter !== "all") {
      const now = new Date()
      let startDateFilter: Date | null = null
      let endDateFilter: Date | null = null

      switch (dateFilter) {
        case "today":
          startDateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          endDateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
          break
        case "yesterday":
          const yesterday = new Date(now)
          yesterday.setDate(yesterday.getDate() - 1)
          startDateFilter = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
          endDateFilter = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59)
          break
        case "last7days":
          startDateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          endDateFilter = now
          break
        case "last30days":
          startDateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          endDateFilter = now
          break
        case "custom":
          if (startDate) {
            startDateFilter = new Date(startDate)
            startDateFilter.setHours(0, 0, 0, 0)
          }
          if (endDate) {
            endDateFilter = new Date(endDate)
            endDateFilter.setHours(23, 59, 59, 999)
          }
          break
      }

      if (startDateFilter || endDateFilter) {
        filtered = filtered.filter((log) => {
          const logDate = new Date(log.created_at)
          if (startDateFilter && logDate < startDateFilter) return false
          if (endDateFilter && logDate > endDateFilter) return false
          return true
        })
      }
    }

    setFilteredLogs(filtered)
    setCurrentPage(1)
  }, [logs, searchQuery, actionFilter, dateFilter, startDate, endDate])

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

  const openPreviewModal = async (log: ActivityLog) => {
    setSelectedLog(log)
    setPreviewLoading(true)
    setShowPreviewModal(true)

    try {
      let endpoint = ""
      switch (log.entity_type) {
        case "task":
          endpoint = `/api/tasks/${log.entity_id}`
          break
        case "project":
          endpoint = `/api/projects/${log.entity_id}`
          break
        case "time_entry":
          endpoint = `/api/time-entries/${log.entity_id}`
          break
        default:
          setPreviewData(null)
          return
      }

      const response = await fetch(endpoint)
      if (response.ok) {
        const data = await response.json()
        setPreviewData(data)
      } else {
        // Item might be deleted
        setPreviewData(null)
      }
    } catch (error) {
      console.error("Error fetching preview data:", error)
      setPreviewData(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  const closePreviewModal = () => {
    setShowPreviewModal(false)
    setSelectedLog(null)
    setPreviewData(null)
    setPreviewLoading(false)
  }

  const navigateToItem = () => {
    if (!selectedLog) return

    switch (selectedLog.entity_type) {
      case "task":
        window.location.href = "/tasks"
        break
      case "project":
        window.location.href = "/projects"
        break
      case "time_entry":
        window.location.href = "/time-tracking"
        break
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
            <div className="text-lg font-medium" style={{ color: "var(--color-text)" } as CSSProperties}>
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
          <h1 className="text-5xl font-bold mb-2 flex items-center" style={{ color: "var(--color-text)" } as CSSProperties}>
            <Activity className="mr-4" />
            Activity Logs
          </h1>
          <p className="text-xl opacity-70" style={{ color: "var(--color-text)" } as CSSProperties}>
            Track all activities in your workspace
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70 mb-1" style={{ color: "var(--color-text)" } as CSSProperties}>
                  Total Activities
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" } as CSSProperties}>
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--color-primary)] bg-opacity-10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6" style={{ color: "var(--color-primary)" } as CSSProperties} />
              </div>
            </div>
          </div>
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70 mb-1" style={{ color: "var(--color-text)" } as CSSProperties}>
                  Today's Activities
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" } as CSSProperties}>
                  {stats.todayLogs}
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--color-accent)] bg-opacity-10 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6" style={{ color: "var(--color-accent)" } as CSSProperties} />
              </div>
            </div>
          </div>
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70 mb-1" style={{ color: "var(--color-text)" } as CSSProperties}>
                  Action Types
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" } as CSSProperties}>
                  {stats.actions}
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--color-secondary)] bg-opacity-10 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6" style={{ color: "var(--color-secondary)" } as CSSProperties} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 opacity-50"
                style={{ color: "var(--color-text)" } as CSSProperties}
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
                } as CSSProperties}
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 opacity-50" style={{ color: "var(--color-text)" } as CSSProperties} />
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="px-4 py-3 rounded-xl border-2 border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-colors"
                  style={{
                    backgroundColor: "var(--color-background)",
                    color: "var(--color-text)",
                  } as CSSProperties}
                >
                  <option value="all">All Actions</option>
                  {uniqueActions.map((action) => (
                    <option key={action} value={action}>
                      {action.charAt(0).toUpperCase() + action.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 opacity-50" style={{ color: "var(--color-text)" } as CSSProperties} />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-4 py-3 rounded-xl border-2 border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-colors"
                  style={{
                    backgroundColor: "var(--color-background)",
                    color: "var(--color-text)",
                  } as CSSProperties}
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="last7days">Last 7 Days</option>
                  <option value="last30days">Last 30 Days</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {dateFilter === "custom" && (
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-3 rounded-xl border-2 border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-colors"
                    style={{
                      backgroundColor: "var(--color-background)",
                      color: "var(--color-text)",
                    } as CSSProperties}
                  />
                  <span className="text-sm opacity-70" style={{ color: "var(--color-text)" } as CSSProperties}>to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-3 rounded-xl border-2 border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-colors"
                    style={{
                      backgroundColor: "var(--color-background)",
                      color: "var(--color-text)",
                    } as CSSProperties}
                  />
                </div>
              )}

              {(searchQuery || actionFilter !== "all" || (dateFilter !== "all" && (dateFilter !== "custom" || (startDate || endDate)))) && (
                <button
                  onClick={() => {
                    setSearchQuery("")
                    setActionFilter("all")
                    setDateFilter("all")
                    setStartDate("")
                    setEndDate("")
                  }}
                  className="px-4 py-3 rounded-xl border-2 border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:bg-opacity-10 transition-all duration-200 font-medium"
                  style={{ color: "var(--color-text)" } as CSSProperties}
                  title="Clear filters"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" } as CSSProperties}>
              Log Management
            </h3>
            <div className="flex space-x-4">
              <button
                onClick={exportLogs}
                className="flex items-center px-4 py-2 bg-[var(--color-accent)] bg-opacity-20 rounded-xl border-2 border-[var(--color-border)] hover:bg-opacity-30 hover:shadow-md hover:transform hover:scale-105 transition-all duration-200 font-medium"
                style={{ color: "#ffffff" } as CSSProperties}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Logs
              </button>
              <button
                onClick={() => setShowResetModal(true)}
                className="flex items-center px-4 py-2 bg-[var(--color-primary)] bg-opacity-20 rounded-xl border-2 border-[var(--color-border)] hover:bg-opacity-30 hover:shadow-md hover:transform hover:scale-105 transition-all duration-200 font-medium"
                style={{ color: "var(--color-primary-foreground)" } as CSSProperties}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Reset Logs
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          {filteredLogs.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="w-24 h-24 bg-[var(--color-primary)] bg-opacity-10 rounded-2xl flex items-center justify-center mx-auto mb-6 border-2 border-[var(--color-border)]">
                <Activity className="w-12 h-12 opacity-40" style={{ color: "var(--color-text)" } as CSSProperties} />
              </div>
              <p className="text-xl mb-4 opacity-70" style={{ color: "var(--color-text)" } as CSSProperties}>
                {searchQuery || actionFilter !== "all" || dateFilter !== "all"
                  ? "No matching activity logs found"
                  : "No activity logs yet"
                }
              </p>
              <p className="text-sm opacity-50" style={{ color: "var(--color-text)" } as CSSProperties}>
                Your activities will appear here as you use the application
              </p>
            </div>
          ) : (
            getCurrentPageLogs().map((log) => {
              const { icon: ActionIcon, color: actionColor } = getActionIcon(log.action)
              const EntityIcon = getEntityIcon(log.entity_type)
              const parsedDetails = parseLogDetails(log.details)

              return (
                <div
                  key={log.id}
                  className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg hover:shadow-xl hover:transform hover:scale-[1.02] transition-all duration-300 cursor-pointer group relative overflow-hidden pb-12"
                  onClick={() => openPreviewModal(log)}
                >
                  {/* Background decoration */}
                  <div
                    className="absolute top-0 right-0 w-20 h-20 opacity-5 transform rotate-12 translate-x-4 -translate-y-4"
                    style={{ color: actionColor }}
                  >
                    <ActionIcon size={32} />
                  </div>

                  {/* Header */}
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className="flex items-center space-x-3">
                      <div
                        className="p-2 rounded-xl border-2"
                        style={{
                          backgroundColor: `${actionColor}15`,
                          borderColor: actionColor,
                          color: actionColor
                        }}
                      >
                        <ActionIcon size={18} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg capitalize" style={{ color: "var(--color-text)" }}>
                          {log.action} {log.entity_type.replace("_", " ")}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm opacity-70">
                          <EntityIcon size={14} />
                          <span style={{ color: "var(--color-text)" }}>
                            {log.entity_type.charAt(0).toUpperCase() + log.entity_type.slice(1)} #{log.entity_id}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm opacity-60" style={{ color: "var(--color-text)" }}>
                        {new Date(log.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs opacity-50" style={{ color: "var(--color-text)" }}>
                        {new Date(log.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-3 relative z-10">
                    {parsedDetails?.summary && (
                      <p className="text-base font-medium leading-relaxed" style={{ color: "var(--color-text)" }}>
                        {parsedDetails.summary}
                      </p>
                    )}

                    {/* Details Grid */}
                    {parsedDetails && Object.keys(parsedDetails).length > 1 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                        {Object.entries(parsedDetails)
                          .filter(([key]) => key !== "summary")
                          .map(([key, value]) => (
                            <div
                              key={key}
                              className="bg-[var(--color-background)] bg-opacity-50 p-3 rounded-xl border border-[var(--color-border)]"
                            >
                              <div className="text-xs font-medium uppercase tracking-wide opacity-70 mb-1" style={{ color: "var(--color-text)" }}>
                                {key.replace(/_/g, " ")}
                              </div>
                              <div className="text-sm font-medium truncate" style={{ color: "var(--color-text)" }} title={value}>
                                {value}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Fallback for unparsed details */}
                    {log.details && !parsedDetails && (
                      <p className="text-base leading-relaxed opacity-80" style={{ color: "var(--color-text)" }}>
                        {log.details}
                      </p>
                    )}
                  </div>

                  {/* Hover indicator */}
                  <div className="absolute bottom-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    <div className="bg-[var(--color-surface)] bg-opacity-90 backdrop-blur-sm px-3 py-1 rounded-full border border-[var(--color-border)] shadow-lg">
                      <div className="text-xs font-medium" style={{ color: "var(--color-text)" }}>
                        Click to view →
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border-2 border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:bg-opacity-10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style={{ color: "var(--color-text)" } as CSSProperties}
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
                style={{ color: currentPage === page ? "var(--color-primary-foreground)" : undefined } as CSSProperties}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border-2 border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:bg-opacity-10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style={{ color: "var(--color-text)" } as CSSProperties}
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
              } as CSSProperties}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-[var(--color-primary)] bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8" style={{ color: "var(--color-primary)" } as CSSProperties} />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: "var(--color-text)" } as CSSProperties}>
                  Reset Activity Logs
                </h3>
                <p className="opacity-70 mb-6" style={{ color: "var(--color-text)" } as CSSProperties}>
                  Are you sure you want to delete all activity logs? This action cannot be undone.
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowResetModal(false)}
                    className="flex-1 px-4 py-3 hover:bg-green-500 hover:bg-opacity-10 rounded-xl border-2 border-[var(--color-border)] transition-all duration-200 font-medium"
                    style={{ color: "var(--color-text)" } as CSSProperties}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={resetLogs}
                    className="flex-1 px-4 py-3 hover:bg-red-500 hover:bg-opacity-10 rounded-xl border-2 border-[var(--color-border)] transition-all duration-200 font-medium"
                    style={{ color: "var(--color-text)" } as CSSProperties}
                  >
                    Reset Logs
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <EntityPreviewModal
        isOpen={showPreviewModal}
        onClose={closePreviewModal}
        entityType={selectedLog?.entity_type as "task" | "project" | "time_entry"}
        entityData={previewData}
        loading={previewLoading}
        onLocate={previewData ? navigateToItem : undefined}
      />
    </Sidebar>
  )
}
