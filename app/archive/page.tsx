"use client"

import type { CSSProperties } from "react"
import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import Sidebar from "@/components/sidebar"
import { useNotification } from "@/components/notification"
import type { Task } from "@/lib/types"
import { Archive, RotateCcw, Trash2, Search, Calendar, FolderOpen, User, ChevronLeft, ChevronRight, Star, Check, Plus } from "lucide-react"
import TaskViewModal from "@/components/task-view-modal"
import { formatDateTimeShort } from "@/components/datetime-picker"
import MarkdownRenderer from "@/components/markdown-renderer"

const ITEMS_PER_PAGE = 6

export default function ArchivePage() {
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [selectedTasks, setSelectedTasks] = useState<number[]>([])
  const [showSelectionBar, setShowSelectionBar] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [taskToRestore, setTaskToRestore] = useState<Task | null>(null)
  const [showBatchRestoreModal, setShowBatchRestoreModal] = useState(false)
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false)
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("")
  const { addNotification } = useNotification()
  const queryClient = useQueryClient()

  useEffect(() => {
    fetchArchivedTasks()
  }, [])

  useEffect(() => {
    let filtered = Array.isArray(archivedTasks) ? [...archivedTasks] : []

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.project?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.assigned_to?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((task) => task.priority === priorityFilter)
    }

    setFilteredTasks(filtered)
    setCurrentPage(1)
    setSelectedTasks([]) // Clear selection when filters change
  }, [archivedTasks, searchQuery, priorityFilter])

  useEffect(() => {
    if (selectedTasks.length > 0 && !showSelectionBar) {
      setShowSelectionBar(true)
    } else if (selectedTasks.length === 0 && showSelectionBar) {
      setShowSelectionBar(false)
    }
  }, [selectedTasks.length, showSelectionBar])

  const fetchArchivedTasks = async () => {
    try {
      const response = await fetch("/api/tasks?archived=true")
      const data = await response.json()
      setArchivedTasks(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching archived tasks:", error)
      setArchivedTasks([])
    } finally {
      setLoading(false)
    }
  }

  const restoreTask = async (taskId: number, taskTitle: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "todo" }),
      })

      if (response.ok) {
        addNotification({
          type: "success",
          title: "Task Restored",
          message: `Task "${taskTitle}" has been restored successfully.`,
        })
        fetchArchivedTasks()
        // Invalidate the tasks query cache to update the main tasks page immediately
        queryClient.invalidateQueries({ queryKey: ["tasks"] })
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to restore task. Please try again.",
      })
    }
  }

  const deleteTask = async () => {
    if (!taskToDelete) return

    try {
      const response = await fetch(`/api/tasks/${taskToDelete.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        addNotification({
          type: "success",
          title: "Task Deleted",
          message: `Task "${taskToDelete.title}" has been permanently deleted.`,
        })
        fetchArchivedTasks()
        setShowDeleteModal(false)
        setTaskToDelete(null)
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to delete task. Please try again.",
      })
    }
  }

  const getCurrentPageTasks = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredTasks.slice(startIndex, endIndex)
  }

  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE)

  const toggleTaskSelection = (taskId: number) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    )
  }

  const selectAllTasks = () => {
    const currentTasks = getCurrentPageTasks()
    setSelectedTasks(currentTasks.map((task) => task.id))
  }

  const clearSelection = () => {
    setSelectedTasks([])
  }

  const bulkRestoreTasks = async () => {
    try {
      await Promise.all(
        selectedTasks.map((taskId) =>
          fetch(`/api/tasks/${taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "todo" }),
          }),
        ),
      )

      addNotification({
        type: "success",
        title: "Tasks Restored",
        message: `${selectedTasks.length} tasks have been restored.`,
      })

      clearSelection()
      fetchArchivedTasks()
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to restore tasks. Please try again.",
      })
    }
  }

  const bulkDeleteTasks = async () => {
    try {
      await Promise.all(
        selectedTasks.map((taskId) =>
          fetch(`/api/tasks/${taskId}`, {
            method: "DELETE",
          }),
        ),
      )

      addNotification({
        type: "success",
        title: "Tasks Deleted",
        message: `${selectedTasks.length} tasks have been permanently deleted.`,
      })

      clearSelection()
      fetchArchivedTasks()
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to delete tasks. Please try again.",
      })
    }
  }

  const priorityConfig = {
    low: { bg: "var(--color-secondary)", text: "#ffffff", label: "Low" },
    medium: { bg: "var(--color-accent)", text: "#ffffff", label: "Medium" },
    high: { bg: "var(--color-primary)", text: "#ffffff", label: "High" },
    urgent: { bg: "#dc2626", text: "#ffffff", label: "Urgent" },
  }

  const statusConfig = {
    todo: { bg: "var(--color-surface)", text: "var(--color-text)", label: "To Do" },
    in_progress: { bg: "var(--color-primary)", text: "var(--color-primary-foreground)", label: "In Progress" },
    completed: { bg: "var(--color-accent)", text: "var(--color-text)", label: "Completed" },
    archived: { bg: "var(--color-secondary)", text: "var(--color-secondary-foreground)", label: "Archived" },
  }

  const getArchiveStats = () => {
    const safeFilteredTasks = Array.isArray(filteredTasks) ? filteredTasks : []
    const total = safeFilteredTasks.length
    const urgent = safeFilteredTasks.filter((task) => task.priority === "urgent").length
    const high = safeFilteredTasks.filter((task) => task.priority === "high").length
    const recent = safeFilteredTasks.filter(
      (task) => {
        const archivedDate = new Date(task.updated_at)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return archivedDate >= weekAgo
      }
    ).length

    return { total, urgent, high, recent }
  }

  const stats = getArchiveStats()

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const getTimeSince = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  if (loading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full mx-auto mb-4"></div>
            <div className="text-lg font-medium" style={{ color: "var(--color-text)" } as CSSProperties}>
              Loading archived tasks...
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
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-5xl font-bold mb-2 flex items-center" style={{ color: "var(--color-text)" } as CSSProperties}>
              <Archive className="mr-4" />
              Archive
            </h1>
            <p className="text-xl opacity-70" style={{ color: "var(--color-text)" } as CSSProperties}>
              Manage your archived tasks
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70 mb-1" style={{ color: "var(--color-text)" } as CSSProperties}>
                  Total Archived
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" } as CSSProperties}>
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--color-secondary)] bg-opacity-10 rounded-2xl flex items-center justify-center">
                <Archive className="w-6 h-6" style={{ color: "var(--color-secondary)" } as CSSProperties} />
              </div>
            </div>
          </div>
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70 mb-1" style={{ color: "var(--color-text)" } as CSSProperties}>
                  Urgent Priority
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" } as CSSProperties}>
                  {stats.urgent}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500 bg-opacity-10 rounded-2xl flex items-center justify-center">
                <Star className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </div>
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70 mb-1" style={{ color: "var(--color-text)" } as CSSProperties}>
                  High Priority
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" } as CSSProperties}>
                  {stats.high}
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--color-primary)] bg-opacity-10 rounded-2xl flex items-center justify-center">
                <Star className="w-6 h-6" style={{ color: "var(--color-primary)" } as CSSProperties} />
              </div>
            </div>
          </div>
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70 mb-1" style={{ color: "var(--color-text)" } as CSSProperties}>
                  Recent (7 days)
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" } as CSSProperties}>
                  {stats.recent}
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--color-accent)] bg-opacity-10 rounded-2xl flex items-center justify-center">
                <Calendar className="w-6 h-6" style={{ color: "var(--color-accent)" } as CSSProperties} />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
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
                placeholder="Search archived tasks..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-colors"
                style={{
                  backgroundColor: "var(--color-background)",
                  color: "var(--color-text)",
                } as CSSProperties}
              />
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-3 pr-8 rounded-2xl border-2 border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-colors bg-[var(--color-background)] appearance-none cursor-pointer"
                style={{ color: "var(--color-text)" } as CSSProperties}
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <div className="pointer-events-none">
                <svg className="w-4 h-4 opacity-50 absolute right-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <button
                onClick={selectedTasks.length === getCurrentPageTasks().length ? clearSelection : selectAllTasks}
                className="px-4 py-3 rounded-2xl border-2 border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:bg-opacity-10 transition-all duration-200 font-medium"
                style={{ color: "var(--color-text)" } as CSSProperties}
              >
                {selectedTasks.length === getCurrentPageTasks().length ? "Deselect All" : "Select All"}
              </button>
              {(searchQuery || priorityFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("")
                    setPriorityFilter("all")
                  }}
                  className="px-4 py-3 rounded-2xl border-2 border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:bg-opacity-10 transition-all duration-200 font-medium"
                  style={{ color: "var(--color-text)" } as CSSProperties}
                  title="Clear filters"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Animated Selection Bar */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out mb-6 ${
            showSelectionBar && selectedTasks.length > 0
              ? "max-h-20 opacity-100 transform translate-y-0"
              : "max-h-0 opacity-0 transform -translate-y-4"
          }`}
        >
          <div className="bg-[var(--color-surface)] p-4 rounded-2xl border-2 border-[var(--color-border)] backdrop-blur-sm shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="font-medium" style={{ color: "var(--color-text)" } as CSSProperties}>
                  {selectedTasks.length} task{selectedTasks.length !== 1 ? "s" : ""} selected
                </span>
                <button
                  onClick={clearSelection}
                  className="text-sm opacity-70 hover:opacity-100 font-medium transition-opacity duration-200"
                  style={{ color: "var(--color-text)" } as CSSProperties}
                >
                  Clear selection
                </button>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowBatchRestoreModal(true)}
                  className="px-4 py-2 bg-blue-500 bg-opacity-20 hover:bg-opacity-30 rounded-2xl border-2 border-[var(--color-border)] transition-all duration-200 font-medium"
                  style={{ color: "#3b82f6" } as CSSProperties}
                >
                  Restore Tasks
                </button>
                <button
                  onClick={() => setShowBatchDeleteModal(true)}
                  className="px-4 py-2 bg-red-500 bg-opacity-20 hover:bg-opacity-30 rounded-2xl border-2 border-[var(--color-border)] transition-all duration-200 font-medium"
                  style={{ color: "#ef4444" } as CSSProperties}
                >
                  Delete Tasks
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {filteredTasks.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="w-24 h-24 bg-[var(--color-secondary)] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[var(--color-border)]">
                <Archive className="w-12 h-12 opacity-40" style={{ color: "var(--color-secondary)" } as CSSProperties} />
              </div>
              <p className="text-xl mb-4 opacity-70" style={{ color: "var(--color-text)" } as CSSProperties}>
                {searchQuery || priorityFilter !== "all"
                  ? `No archived tasks found for the selected filters`
                  : "No archived tasks"
                }
              </p>
              <p className="text-sm opacity-50" style={{ color: "var(--color-text)" } as CSSProperties}>
                Tasks you archive will appear here
              </p>
            </div>
          ) : (
            getCurrentPageTasks().map((task) => (
              <div
                key={task.id}
                onClick={() => {
                  setSelectedTask(task)
                  setShowViewModal(true)
                }}
                className={`group relative overflow-hidden rounded-3xl border-2 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer ${
                  selectedTasks.includes(task.id)
                    ? "ring-2 ring-[var(--color-primary)] ring-opacity-50 transform scale-[1.02]"
                    : ""
                }`}
                style={{
                  backgroundColor: "var(--color-surface)",
                  borderColor: selectedTasks.includes(task.id) ? "var(--color-primary)" : "var(--color-border)",
                } as CSSProperties}
              >
                {/* Remove gradient background completely */}
                <div className="relative z-10 p-6 h-full flex flex-col">
                  {/* Header - Title and Tags on same line */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleTaskSelection(task.id)
                        }}
                        className={`flex-shrink-0 relative w-6 h-6 rounded-xl border-2 transition-all duration-300 flex items-center justify-center ${
                          selectedTasks.includes(task.id)
                            ? "bg-[var(--color-primary)] border-[var(--color-primary)] scale-110 shadow-lg"
                            : "border-[var(--color-border)] hover:border-[var(--color-primary)] hover:scale-110"
                        }`}
                      >
                        {selectedTasks.includes(task.id) && (
                          <Check className="w-4 h-4 text-white animate-in fade-in duration-200" />
                        )}
                      </button>
                      <h3
                        className="text-lg font-bold leading-tight min-w-0 flex-1 truncate"
                        style={{ color: "var(--color-text)" } as CSSProperties}
                        title={task.title}
                      >
                        {truncateText(task.title, 18)}
                      </h3>
                    </div>
                    <div className="flex flex-col space-y-2 flex-shrink-0 ml-3">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold shadow-sm border-2 whitespace-nowrap"
                        style={{
                          backgroundColor: priorityConfig[task.priority].bg,
                          color: priorityConfig[task.priority].text,
                          borderColor: "var(--color-border)",
                        } as CSSProperties}
                      >
                        {priorityConfig[task.priority].label}
                      </span>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold shadow-sm whitespace-nowrap"
                        style={{
                          backgroundColor: statusConfig[task.status].bg,
                          color: statusConfig[task.status].text,
                        } as CSSProperties}
                      >
                        {statusConfig[task.status].label}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="flex-1 overflow-hidden">
                    {task.description && (
                      <div
                        className="text-sm opacity-70 leading-relaxed mb-4 line-clamp-1"
                        style={{ color: "var(--color-text)" } as CSSProperties}
                      >
                        <MarkdownRenderer content={task.description} firstLineOnly maxFirstLineLength={45} />
                      </div>
                    )}
                  </div>

                  {/* Project and Assignee Tags - Always at bottom */}
                  <div className="mt-auto mb-4">
                    {task.project?.name && (
                      <div
                        className="flex items-center p-3 rounded-2xl border backdrop-blur-sm mb-2"
                        style={{
                          backgroundColor: "var(--color-background)",
                          borderColor: "var(--color-border)",
                        } as CSSProperties}
                      >
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center mr-3"
                          style={{ backgroundColor: "var(--color-primary)", opacity: 0.1 } as CSSProperties}
                        >
                          <FolderOpen size={16} style={{ color: "var(--color-primary)" } as CSSProperties} />
                        </div>
                        <span
                          className="text-sm font-medium truncate"
                          style={{ color: "var(--color-text)" } as CSSProperties}
                          title={task.project?.name}
                        >
                          {truncateText(task.project?.name, 18)}
                        </span>
                      </div>
                    )}
                    {task.assigned_to && (
                      <div
                        className="flex items-center p-3 rounded-2xl border backdrop-blur-sm mb-2"
                        style={{
                          backgroundColor: "var(--color-background)",
                          borderColor: "var(--color-border)",
                        } as CSSProperties}
                      >
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center mr-3"
                          style={{ backgroundColor: "var(--color-secondary)", opacity: 0.1 } as CSSProperties}
                        >
                          <User size={16} style={{ color: "var(--color-secondary)" } as CSSProperties} />
                        </div>
                        <span
                          className="text-sm font-medium truncate"
                          style={{ color: "var(--color-text)" } as CSSProperties}
                          title={task.assigned_to}
                        >
                          {truncateText(task.assigned_to, 15)}
                        </span>
                      </div>
                    )}
                    {task.due_date && (
                      <div
                        className="flex items-center p-3 rounded-2xl border backdrop-blur-sm"
                        style={{
                          backgroundColor: "var(--color-background)",
                          borderColor: "var(--color-border)",
                        } as CSSProperties}
                      >
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center mr-3"
                          style={{ backgroundColor: "var(--color-accent)", opacity: 0.1 } as CSSProperties}
                        >
                          <Calendar size={16} style={{ color: "var(--color-accent)" } as CSSProperties} />
                        </div>
                        <span className="text-sm font-medium" style={{ color: "var(--color-text)" } as CSSProperties}>
                          {formatDateTimeShort(task.due_date)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div
                    className="flex items-center justify-between text-xs opacity-60 mb-4"
                    style={{ color: "var(--color-text)" } as CSSProperties}
                  >
                    <span>Archived {getTimeSince(task.updated_at)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setTaskToRestore(task)
                          setShowRestoreModal(true)
                        }}
                        className="p-2 rounded-2xl border-2 border-[var(--color-border)] hover:bg-blue-500 hover:bg-opacity-10 transition-all duration-200"
                        style={{ color: "var(--color-text)" } as CSSProperties}
                        title="Restore Task"
                      >
                        <RotateCcw size={16} />
                      </button>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setTaskToDelete(task)
                          setShowDeleteModal(true)
                        }}
                        className="p-2 rounded-2xl border-2 border-[var(--color-border)] hover:bg-red-500 hover:bg-opacity-10 transition-all duration-200"
                        style={{ color: "var(--color-text)" } as CSSProperties}
                        title="Delete Task"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-2xl border-2 border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:bg-opacity-10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style={{ color: "var(--color-text)" } as CSSProperties}
            >
              <ChevronLeft size={20} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 rounded-2xl border-2 transition-all duration-200 font-medium ${
                  currentPage === page
                    ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                    : "border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:bg-opacity-10"
                }`}
                style={{
                  color: currentPage === page ? "#ffffff" : "var(--color-text)"
                } as CSSProperties}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-2xl border-2 border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:bg-opacity-10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style={{ color: "var(--color-text)" } as CSSProperties}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && taskToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div
              className="p-8 rounded-3xl border-2 shadow-2xl max-w-md w-full mx-4 animate-in slide-in-from-bottom-4 duration-300"
              style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
              } as CSSProperties}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: "var(--color-text)" } as CSSProperties}>
                  Delete Task
                </h3>
                <p className="opacity-70 mb-6" style={{ color: "var(--color-text)" } as CSSProperties}>
                  Are you sure you want to delete "{taskToDelete.title}"? This action cannot be undone.
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false)
                      setTaskToDelete(null)
                    }}
                    className="flex-1 px-4 py-3 hover:bg-green-500 hover:bg-opacity-10 rounded-2xl border-2 border-[var(--color-border)] transition-all duration-200 font-medium"
                    style={{ color: "var(--color-text)" } as CSSProperties}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deleteTask}
                    className="flex-1 px-4 py-3 hover:bg-red-500 hover:bg-opacity-10 rounded-2xl border-2 border-[var(--color-border)] transition-all duration-200 font-medium"
                    style={{ color: "var(--color-text)" } as CSSProperties}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Restore Confirmation Modal */}
        {showRestoreModal && taskToRestore && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div
              className="p-8 rounded-3xl border-2 shadow-2xl max-w-md w-full mx-4 animate-in slide-in-from-bottom-4 duration-300"
              style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
              } as CSSProperties}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RotateCcw className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: "var(--color-text)" } as CSSProperties}>
                  Restore Task
                </h3>
                <p className="opacity-70 mb-6" style={{ color: "var(--color-text)" } as CSSProperties}>
                  Are you sure you want to restore "{taskToRestore.title}"? This will move the task back to your active tasks.
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      setShowRestoreModal(false)
                      setTaskToRestore(null)
                    }}
                    className="flex-1 px-4 py-3 hover:bg-green-500 hover:bg-opacity-10 rounded-2xl border-2 border-[var(--color-border)] transition-all duration-200 font-medium"
                    style={{ color: "var(--color-text)" } as CSSProperties}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      restoreTask(taskToRestore.id, taskToRestore.title)
                      setShowRestoreModal(false)
                      setTaskToRestore(null)
                    }}
                    className="flex-1 px-4 py-3 hover:bg-blue-500 hover:bg-opacity-10 rounded-2xl border-2 border-[var(--color-border)] transition-all duration-200 font-medium"
                    style={{ color: "var(--color-text)" } as CSSProperties}
                  >
                    Restore
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Batch Restore Confirmation Modal */}
        {showBatchRestoreModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div
              className="p-8 rounded-3xl border-2 shadow-2xl max-w-md w-full mx-4 animate-in slide-in-from-bottom-4 duration-300"
              style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
              } as CSSProperties}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RotateCcw className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: "var(--color-text)" } as CSSProperties}>
                  Restore Tasks
                </h3>
                <p className="opacity-70 mb-6" style={{ color: "var(--color-text)" } as CSSProperties}>
                  Are you sure you want to restore {selectedTasks.length} selected task{selectedTasks.length !== 1 ? "s" : ""}? This will move them back to your active tasks.
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowBatchRestoreModal(false)}
                    className="flex-1 px-4 py-3 hover:bg-green-500 hover:bg-opacity-10 rounded-2xl border-2 border-[var(--color-border)] transition-all duration-200 font-medium"
                    style={{ color: "var(--color-text)" } as CSSProperties}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      bulkRestoreTasks()
                      setShowBatchRestoreModal(false)
                    }}
                    className="flex-1 px-4 py-3 hover:bg-blue-500 hover:bg-opacity-10 rounded-2xl border-2 border-[var(--color-border)] transition-all duration-200 font-medium"
                    style={{ color: "var(--color-text)" } as CSSProperties}
                  >
                    Restore All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Batch Delete Confirmation Modal */}
        {showBatchDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div
              className="p-8 rounded-3xl border-2 shadow-2xl max-w-md w-full mx-4 animate-in slide-in-from-bottom-4 duration-300"
              style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
              } as CSSProperties}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: "var(--color-text)" } as CSSProperties}>
                  Delete Tasks
                </h3>
                <p className="opacity-70 mb-4" style={{ color: "var(--color-text)" } as CSSProperties}>
                  Are you sure you want to permanently delete {selectedTasks.length} selected task{selectedTasks.length !== 1 ? "s" : ""}? This action cannot be undone.
                </p>
                <div className="mb-6">
                  <p className="text-sm opacity-70 mb-2" style={{ color: "var(--color-text)" } as CSSProperties}>
                    Type <strong>DELETE</strong> to confirm:
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="w-full px-4 py-3 rounded-2xl border-2 border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors text-center font-mono"
                    style={{
                      backgroundColor: "var(--color-background)",
                      color: "var(--color-text)",
                    } as CSSProperties}
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      setShowBatchDeleteModal(false)
                      setDeleteConfirmationText("")
                    }}
                    className="flex-1 px-4 py-3 hover:bg-green-500 hover:bg-opacity-10 rounded-2xl border-2 border-[var(--color-border)] transition-all duration-200 font-medium"
                    style={{ color: "var(--color-text)" } as CSSProperties}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (deleteConfirmationText === "DELETE") {
                        bulkDeleteTasks()
                        setShowBatchDeleteModal(false)
                        setDeleteConfirmationText("")
                      }
                    }}
                    disabled={deleteConfirmationText !== "DELETE"}
                    className="flex-1 px-4 py-3 hover:bg-red-500 hover:bg-opacity-10 rounded-2xl border-2 border-[var(--color-border)] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ color: "var(--color-text)" } as CSSProperties}
                  >
                    Delete All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <TaskViewModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          onSuccess={fetchArchivedTasks}
          task={selectedTask}
          onRestore={(taskId, taskTitle) => {
            const task = archivedTasks.find(t => t.id === taskId)
            if (task) {
              setTaskToRestore(task)
              setShowRestoreModal(true)
            }
          }}
        />
      </div>
    </Sidebar>
  )
}
