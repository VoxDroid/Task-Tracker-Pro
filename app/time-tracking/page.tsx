"use client"

import { useEffect, useState } from "react"
import Sidebar from "@/components/sidebar"
import { useNotification } from "@/components/notification"
import { Clock, Play, Square, Timer, Search, TrendingUp, Zap, Target } from "lucide-react"
import TimeEntryModal from "@/components/time-entry-modal"

interface TimeEntry {
  id: number
  task_id: number
  start_time: string
  end_time?: string
  duration?: number
  description?: string
  task_title?: string
  project_name?: string
}

export default function TimeTrackingPage() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<TimeEntry[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [filteredTasks, setFilteredTasks] = useState<any[]>([])
  const [activeTimer, setActiveTimer] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [taskSearchQuery, setTaskSearchQuery] = useState("")
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>("all")
  const { addNotification } = useNotification()

  const [showEntryModal, setShowEntryModal] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<any>(null)

  // Task modal state
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)

  // Pagination for tasks
  const [currentTaskPage, setCurrentTaskPage] = useState(1)
  const tasksPerPage = 8

  // Pagination for time entries
  const [currentEntryPage, setCurrentEntryPage] = useState(1)
  const entriesPerPage = 10

  useEffect(() => {
    fetchTimeEntries()
    fetchTasks()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (activeTimer) {
      interval = setInterval(() => {
        setCurrentTime((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [activeTimer])

  useEffect(() => {
    let filtered = Array.isArray(timeEntries) ? [...timeEntries] : []

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (entry) =>
          entry.task_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredEntries(filtered)
    setCurrentEntryPage(1) // Reset to first page when filtering changes
  }, [timeEntries, searchQuery])

  useEffect(() => {
    let filtered = Array.isArray(tasks) ? [...tasks] : []

    if (taskSearchQuery.trim()) {
      filtered = filtered.filter(
        (task) =>
          task.title?.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
          task.project_name?.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(taskSearchQuery.toLowerCase()),
      )
    }

    if (taskStatusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === taskStatusFilter)
    }

    setFilteredTasks(filtered)
    setCurrentTaskPage(1) // Reset to first page when filtering changes
  }, [tasks, taskSearchQuery, taskStatusFilter])

  const fetchTimeEntries = async () => {
    try {
      const response = await fetch("/api/time-entries")
      const data = await response.json()
      setTimeEntries(Array.isArray(data) ? data : [])

      // Check for active timer
      const activeEntry = data.find((entry: TimeEntry) => !entry.end_time)
      if (activeEntry) {
        setActiveTimer(activeEntry.id)
        const startTime = new Date(activeEntry.start_time).getTime()
        const now = new Date().getTime()
        setCurrentTime(Math.floor((now - startTime) / 1000))
      } else {
        setActiveTimer(null)
        setCurrentTime(0)
      }
    } catch (error) {
      console.error("Error fetching time entries:", error)
      setTimeEntries([])
    } finally {
      setLoading(false)
    }
  }

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks")
      const data = await response.json()
      setTasks(
        Array.isArray(data)
          ? data.filter((task: any) => task.status !== "completed" && task.status !== "archived")
          : [],
      )
    } catch (error) {
      console.error("Error fetching tasks:", error)
      setTasks([])
    }
  }

  const startTimer = async (taskId: number) => {
    try {
      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId }),
      })

      if (response.ok) {
        const entry = await response.json()
        setActiveTimer(entry.id)
        setCurrentTime(0)
        addNotification({
          type: "success",
          title: "Timer Started",
          message: "Time tracking has begun for this task.",
        })
        fetchTimeEntries()
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to start timer. Please try again.",
      })
    }
  }

  const stopTimer = async () => {
    if (!activeTimer) return

    try {
      const response = await fetch(`/api/time-entries/${activeTimer}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ end_time: new Date().toISOString() }),
      })

      if (response.ok) {
        const updatedEntry = await response.json()
        setActiveTimer(null)
        setCurrentTime(0)
        addNotification({
          type: "success",
          title: "Timer Stopped",
          message: `Time entry saved: ${formatDurationFromSeconds(updatedEntry.duration || 0)}`,
        })
        fetchTimeEntries()
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to stop timer. Please try again.",
      })
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatDurationFromSeconds = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getEntryDisplayTime = (entry: TimeEntry) => {
    // If this is the active timer entry, show current running time
    if (entry.id === activeTimer && !entry.end_time) {
      return formatTime(currentTime)
    }
    // If entry has duration (completed), show formatted duration from seconds
    if (entry.duration) {
      return formatDurationFromSeconds(entry.duration)
    }
    // Fallback for entries without duration
    return "0s"
  }

  const getTimeStats = () => {
    const safeFilteredEntries = Array.isArray(filteredEntries) ? filteredEntries : []
    // Convert seconds to minutes for stats (backward compatibility)
    const totalMinutes = safeFilteredEntries.reduce((sum, entry) => sum + Math.floor((entry.duration || 0) / 60), 0)
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10
    const entriesCount = safeFilteredEntries.length
    const avgSession = entriesCount > 0 ? Math.round(totalMinutes / entriesCount) : 0

    return { totalHours, entriesCount, avgSession, totalMinutes }
  }

  const stats = getTimeStats()

  const handleEntryClick = (entry: TimeEntry) => {
    if (!entry.end_time && entry.id === activeTimer) {
      // If it's the active timer, show options to stop or monitor
      setSelectedEntry({ ...entry, isActive: true })
    } else {
      setSelectedEntry(entry)
    }
    setShowEntryModal(true)
  }

  const handleTaskClick = (task: any) => {
    setSelectedTask(task)
    setShowTaskModal(true)
  }

  const truncateTaskName = (name: string, maxLength = 12) => {
    if (name.length <= maxLength) return name
    return name.substring(0, maxLength) + "..."
  }

  const truncateProjectName = (name: string, maxLength = 10) => {
    if (name.length <= maxLength) return name
    return name.substring(0, maxLength) + "..."
  }

  const truncateDescription = (description: string, maxLength = 30) => {
    if (description.length <= maxLength) return description
    return description.substring(0, maxLength) + "..."
  }

  // Pagination functions for tasks
  const getCurrentPageTasks = () => {
    const startIndex = (currentTaskPage - 1) * tasksPerPage
    const endIndex = startIndex + tasksPerPage
    return filteredTasks.slice(startIndex, endIndex)
  }

  const totalTaskPages = Math.ceil(filteredTasks.length / tasksPerPage)

  // Pagination functions for time entries
  const getCurrentPageEntries = () => {
    const startIndex = (currentEntryPage - 1) * entriesPerPage
    const endIndex = startIndex + entriesPerPage
    return filteredEntries.slice(startIndex, endIndex)
  }

  const totalEntryPages = Math.ceil(filteredEntries.length / entriesPerPage)

  if (loading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full mx-auto mb-4"></div>
            <div className="text-lg font-medium" style={{ color: "var(--color-text)" }}>
              Loading time tracking...
            </div>
          </div>
        </div>
      </Sidebar>
    )
  }

  return (
    <Sidebar>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-2 flex items-center" style={{ color: "var(--color-text)" }}>
            <Clock className="mr-4" />
            Time Tracking
          </h1>
          <p className="text-xl opacity-70" style={{ color: "var(--color-text)" }}>
            Track time spent on your tasks
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70 mb-1" style={{ color: "var(--color-text)" }}>
                  Total Hours
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                  {stats.totalHours}h
                </p>
              </div>
              <Clock className="w-8 h-8" style={{ color: "var(--color-primary)" }} />
            </div>
          </div>
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70 mb-1" style={{ color: "var(--color-text)" }}>
                  Time Entries
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                  {stats.entriesCount}
                </p>
              </div>
              <Target className="w-8 h-8" style={{ color: "var(--color-accent)" }} />
            </div>
          </div>
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70 mb-1" style={{ color: "var(--color-text)" }}>
                  Avg Session
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                  {stats.avgSession}m
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70 mb-1" style={{ color: "var(--color-text)" }}>
                  Productivity
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                  {activeTimer ? "Active" : "Idle"}
                </p>
              </div>
              <Zap className={`w-8 h-8 ${activeTimer ? "text-green-500" : "text-gray-400"}`} />
            </div>
          </div>
        </div>

        {/* Active Timer */}
        {activeTimer && (
          <div className="bg-[var(--color-surface)] p-8 rounded-2xl border-2 border-[var(--color-border)] shadow-lg mb-8 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse mr-4"></div>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
                    Timer Running
                  </h3>
                  <p className="opacity-70" style={{ color: "var(--color-text)" }}>
                    Currently tracking time
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-4xl font-bold font-mono" style={{ color: "var(--color-text)" }}>
                  {formatTime(currentTime)}
                </div>
                <button
                  onClick={stopTimer}
                  className="flex items-center px-6 py-3 bg-[var(--color-surface)] rounded-2xl border-2 border-[var(--color-border)] hover:bg-[var(--color-background)] hover:shadow-lg hover:transform hover:scale-105 transition-all duration-200 font-medium"
                  style={{ color: "var(--color-text)" }}
                >
                  <Square size={20} />
                  <span className="ml-2">Stop</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Start Timer Section */}
        <div className="bg-[var(--color-surface)] p-8 rounded-2xl border-2 border-[var(--color-border)] shadow-lg mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
              Start Timer for Task
            </h3>
            {totalTaskPages > 1 && (
              <div className="text-sm opacity-70" style={{ color: "var(--color-text)" }}>
                Page {currentTaskPage} of {totalTaskPages}
              </div>
            )}
          </div>

          {/* Task Search and Filter */}
          <div className="bg-[var(--color-background)] p-4 rounded-2xl border-2 border-[var(--color-border)] shadow-sm mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 opacity-50"
                  style={{ color: "var(--color-text)" }}
                />
                <input
                  type="text"
                  value={taskSearchQuery}
                  onChange={(e) => setTaskSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-colors bg-[var(--color-surface)]"
                  style={{ color: "var(--color-text)" }}
                />
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <select
                    value={taskStatusFilter}
                    onChange={(e) => setTaskStatusFilter(e.target.value)}
                    className="px-4 py-3 pr-8 rounded-2xl border-2 border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-colors bg-[var(--color-surface)] appearance-none cursor-pointer"
                    style={{ color: "var(--color-text)" }}
                  >
                    <option value="all">All Status</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {(taskSearchQuery || taskStatusFilter !== "all") && (
                  <button
                    onClick={() => {
                      setTaskSearchQuery("")
                      setTaskStatusFilter("all")
                    }}
                    className="px-4 py-3 rounded-2xl border-2 border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:bg-opacity-10 transition-all duration-200 font-medium"
                    style={{ color: "var(--color-text)" }}
                    title="Clear filters"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {getCurrentPageTasks().map((task) => (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task)}
                className="p-4 bg-[var(--color-background)] rounded-2xl border-2 border-[var(--color-border)] hover:shadow-lg hover:transform hover:scale-105 transition-all duration-200 flex flex-col h-32 cursor-pointer"
              >
                <div className="flex flex-col h-full">
                  <div className="flex-1 mb-3">
                    <h4
                      className="font-semibold text-sm leading-tight mb-1"
                      style={{ color: "var(--color-text)" }}
                      title={task.title}
                    >
                      {truncateTaskName(task.title)}
                    </h4>
                    {task.project_name && (
                      <p
                        className="text-xs opacity-70 leading-tight"
                        style={{ color: "var(--color-text)" }}
                        title={task.project_name}
                      >
                        {truncateProjectName(task.project_name)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      startTimer(task.id)
                    }}
                    disabled={!!activeTimer}
                    className="flex items-center px-3 py-2 bg-[var(--color-accent)] bg-opacity-20 rounded-2xl border-2 border-[var(--color-border)] hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium w-full justify-center text-sm mt-auto"
                    style={{ color: "#ffffff" }}
                  >
                    <Play size={14} />
                    <span className="ml-1">Start</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Task Pagination */}
          {totalTaskPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => setCurrentTaskPage(Math.max(1, currentTaskPage - 1))}
                disabled={currentTaskPage === 1}
                className="p-2 rounded-2xl border-2 border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:bg-opacity-10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                style={{ color: "var(--color-text)" }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {Array.from({ length: totalTaskPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentTaskPage(page)}
                  className={`px-4 py-2 rounded-2xl border-2 transition-all duration-200 font-medium ${
                    currentTaskPage === page
                      ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                      : "border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:bg-opacity-10"
                  }`}
                  style={{
                    color: currentTaskPage === page ? "#ffffff" : "var(--color-text)"
                  }}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentTaskPage(Math.min(totalTaskPages, currentTaskPage + 1))}
                disabled={currentTaskPage === totalTaskPages}
                className="p-2 rounded-2xl border-2 border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:bg-opacity-10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                style={{ color: "var(--color-text)" }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg mb-8">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 opacity-50"
              style={{ color: "var(--color-text)" }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search time entries..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-colors bg-[var(--color-background)]"
              style={{ color: "var(--color-text)" }}
            />
          </div>
        </div>

        {/* Time Entries History */}
        <div className="bg-[var(--color-surface)] p-8 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
              Time Entries
            </h3>
            {totalEntryPages > 1 && (
              <div className="text-sm opacity-70" style={{ color: "var(--color-text)" }}>
                Page {currentEntryPage} of {totalEntryPages}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {filteredEntries.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Timer size={48} className="mx-auto mb-4 opacity-40" style={{ color: "var(--color-text)" }} />
                <p className="text-lg opacity-70" style={{ color: "var(--color-text)" }}>
                  {searchQuery ? `No time entries found for "${searchQuery}"` : "No time entries yet"}
                </p>
                <p className="text-sm opacity-50" style={{ color: "var(--color-text)" }}>
                  Start tracking time on your tasks
                </p>
              </div>
            ) : (
              getCurrentPageEntries().map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => handleEntryClick(entry)}
                  className="w-full text-left flex items-center justify-between p-6 bg-[var(--color-background)] rounded-2xl border-2 border-[var(--color-border)] hover:shadow-md hover:transform hover:scale-[1.02] transition-all duration-200"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4
                        className="font-semibold text-sm leading-tight"
                        style={{ color: "var(--color-text)" }}
                        title={entry.task_title}
                      >
                        {entry.task_title && entry.task_title.length > 25
                          ? entry.task_title.substring(0, 25) + "..."
                          : entry.task_title}
                      </h4>
                      {!entry.end_time && entry.id === activeTimer && (
                        <span className="px-2 py-1 bg-[var(--color-accent)] text-white text-xs font-medium rounded-full flex-shrink-0 animate-pulse">
                          RUNNING
                        </span>
                      )}
                    </div>
                    {entry.description && (
                      <p
                        className="text-xs opacity-60 mb-1 leading-tight italic"
                        style={{ color: "var(--color-text)" }}
                        title={entry.description}
                      >
                        {truncateDescription(entry.description)}
                      </p>
                    )}
                    {entry.project_name && (
                      <p
                        className="text-xs opacity-70 mb-1 leading-tight"
                        style={{ color: "var(--color-text)" }}
                        title={entry.project_name}
                      >
                        {entry.project_name.length > 20
                          ? entry.project_name.substring(0, 20) + "..."
                          : entry.project_name}
                      </p>
                    )}
                    <p className="text-xs opacity-60" style={{ color: "var(--color-text)" }}>
                      {new Date(entry.start_time).toLocaleString()}
                      {entry.end_time && ` - ${new Date(entry.end_time).toLocaleString()}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
                      {getEntryDisplayTime(entry)}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Time Entries Pagination */}
          {totalEntryPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => setCurrentEntryPage(Math.max(1, currentEntryPage - 1))}
                disabled={currentEntryPage === 1}
                className="p-2 rounded-2xl border-2 border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:bg-opacity-10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                style={{ color: "var(--color-text)" }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {Array.from({ length: totalEntryPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentEntryPage(page)}
                  className={`px-4 py-2 rounded-2xl border-2 transition-all duration-200 font-medium ${
                    currentEntryPage === page
                      ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                      : "border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:bg-opacity-10"
                  }`}
                  style={{
                    color: currentEntryPage === page ? "#ffffff" : "var(--color-text)"
                  }}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentEntryPage(Math.min(totalEntryPages, currentEntryPage + 1))}
                disabled={currentEntryPage === totalEntryPages}
                className="p-2 rounded-2xl border-2 border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:bg-opacity-10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                style={{ color: "var(--color-text)" }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Task Description Modal */}
        {showTaskModal && selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--color-surface)] rounded-2xl border-2 border-[var(--color-border)] shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
                    Task Details
                  </h3>
                  <button
                    onClick={() => setShowTaskModal(false)}
                    className="p-2 rounded-2xl border-2 border-[var(--color-border)] hover:bg-[var(--color-background)] transition-all duration-200"
                    style={{ color: "var(--color-text)" }}
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-2" style={{ color: "var(--color-text)" }}>
                      {selectedTask.title}
                    </h4>
                    {selectedTask.project_name && (
                      <p className="text-sm opacity-70 mb-3" style={{ color: "var(--color-text)" }}>
                        Project: {selectedTask.project_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <h5 className="font-medium mb-2" style={{ color: "var(--color-text)" }}>
                      Description
                    </h5>
                    <div className="bg-[var(--color-background)] rounded-2xl p-4 border-2 border-[var(--color-border)]">
                      {selectedTask.description ? (
                        <p className="text-sm leading-relaxed" style={{ color: "var(--color-text)" }}>
                          {selectedTask.description}
                        </p>
                      ) : (
                        <p className="text-sm opacity-60 italic" style={{ color: "var(--color-text)" }}>
                          No description provided
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t-2 border-[var(--color-border)]">
                    <div className="text-xs opacity-60" style={{ color: "var(--color-text)" }}>
                      Status: {selectedTask.status?.replace("_", " ") || "Unknown"}
                    </div>
                    <button
                      onClick={() => {
                        setShowTaskModal(false)
                        startTimer(selectedTask.id)
                      }}
                      disabled={!!activeTimer}
                      className="flex items-center px-4 py-2 bg-[var(--color-accent)] bg-opacity-20 rounded-2xl border-2 border-[var(--color-border)] hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                      style={{ color: "#ffffff" }}
                    >
                      <Play size={16} />
                      <span className="ml-2">Start Timer</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <TimeEntryModal
          isOpen={showEntryModal}
          onClose={() => setShowEntryModal(false)}
          onSuccess={fetchTimeEntries}
          entry={selectedEntry}
          onStop={stopTimer}
          currentTime={currentTime}
        />
      </div>
    </Sidebar>
  )
}
