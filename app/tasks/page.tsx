"use client"

import type { CSSProperties } from "react"
import { useEffect, useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Sidebar from "@/components/sidebar"
import TaskFormModal from "@/components/task-form-modal"
import { useNotification } from "@/components/notification"
import type { Task } from "@/lib/types"
import {
  Plus,
  Calendar,
  User,
  FolderOpen,
  Filter,
  Search,
  CheckSquare,
  Clock,
  AlertTriangle,
  Star,
  Copy,
  Archive,
  Check,
  Trash2,
  Edit,
  Heart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import TaskEditModal from "@/components/task-edit-modal"
import TaskViewModal from "@/components/task-view-modal"
import { formatDateTimeShort } from "@/components/datetime-picker"

const priorityConfig = {
  low: {
    bg: "transparent",
    bgLight: "var(--color-accent)",
    text: "var(--color-accent)",
    textDark: "var(--color-accent-foreground)",
    label: "Low",
    color: "var(--color-accent)",
    border: "var(--color-primary)",
    gradient: "from-green-400 to-green-600",
  },
  medium: {
    bg: "transparent",
    bgLight: "var(--color-warning)",
    text: "var(--color-warning)",
    textDark: "var(--color-warning-foreground)",
    label: "Medium",
    color: "var(--color-warning)",
    border: "var(--color-primary)",
    gradient: "from-yellow-400 to-yellow-600",
  },
  high: {
    bg: "transparent",
    bgLight: "var(--color-secondary)",
    text: "var(--color-secondary)",
    textDark: "var(--color-secondary-foreground)",
    label: "High",
    color: "var(--color-secondary)",
    border: "var(--color-primary)",
    gradient: "from-orange-400 to-orange-600",
  },
  urgent: {
    bg: "transparent",
    bgLight: "var(--color-destructive)",
    text: "var(--color-destructive)",
    textDark: "var(--color-destructive-foreground)",
    label: "Urgent",
    color: "var(--color-destructive)",
    border: "var(--color-primary)",
    gradient: "from-red-400 to-red-600",
  },
}

const statusConfig = {
  todo: {
    bg: "var(--color-primary)",
    text: "var(--color-primary-foreground)",
    label: "To Do",
    color: "var(--color-primary)",
  },
  in_progress: {
    bg: "var(--color-secondary)",
    text: "var(--color-secondary-foreground)",
    label: "In Progress",
    color: "var(--color-secondary)",
  },
  completed: {
    bg: "var(--color-accent)",
    text: "var(--color-accent-foreground)",
    label: "Completed",
    color: "var(--color-accent)",
  },
  archived: {
    bg: "var(--color-muted)",
    text: "var(--color-muted-foreground)",
    label: "Archived",
    color: "var(--color-muted)",
  },
}

const ITEMS_PER_PAGE = 6

export default function TasksPage() {
  const [filter, setFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [taskToArchive, setTaskToArchive] = useState<Task | null>(null)
  const { addNotification } = useNotification()

  const [selectedTasks, setSelectedTasks] = useState<number[]>([])
  const [favoriteTaskIds, setFavoriteTaskIds] = useState<number[]>([])
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [showSelectionBar, setShowSelectionBar] = useState(false)
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)

  const queryClient = useQueryClient()

  // Fetch tasks with React Query
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", filter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filter !== "all") params.append("status", filter)
      if (filter === "archived") params.append("archived", "true")

      const response = await fetch(`/api/tasks?${params}`)
      if (!response.ok) throw new Error("Failed to fetch tasks")
      return response.json()
    },
    staleTime: 30 * 1000, // 30 seconds
  })

  // Delete task mutation with optimistic updates
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete task")
      return taskId
    },
    onMutate: async (taskId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["tasks", filter] })

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData(["tasks", filter])

      // Optimistically remove task
      queryClient.setQueryData(["tasks", filter], (old: Task[] = []) =>
        old.filter(task => task.id !== taskId)
      )

      return { previousTasks }
    },
    onError: (err, taskId, context) => {
      // Revert on error
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks", filter], context.previousTasks)
      }
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to delete task. Please try again.",
      })
    },
    onSuccess: () => {
      addNotification({
        type: "success",
        title: "Task Deleted",
        message: "Task has been deleted successfully.",
      })
    },
  })

  // Archive task mutation
  const archiveTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      })
      if (!response.ok) throw new Error("Failed to archive task")
      return taskId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      addNotification({
        type: "success",
        title: "Task Archived",
        message: "Task has been archived successfully.",
      })
    },
    onError: () => {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to archive task. Please try again.",
      })
    },
  })

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ taskId, isFavorite }: { taskId: number; isFavorite: boolean }) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_favorite: isFavorite }),
      })
      if (!response.ok) throw new Error("Failed to update favorite status")
      return { taskId, isFavorite }
    },
    onSuccess: ({ taskId, isFavorite }) => {
      // Update local state
      setFavoriteTaskIds(prev =>
        isFavorite ? [...prev, taskId] : prev.filter(id => id !== taskId)
      )
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })

  useEffect(() => {
    const handleOpenTaskModal = () => setShowTaskModal(true)
    window.addEventListener("openTaskModal", handleOpenTaskModal)
    return () => window.removeEventListener("openTaskModal", handleOpenTaskModal)
  }, [])

  useEffect(() => {
    let filtered = Array.isArray(tasks) ? [...tasks] : []

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.assigned_to?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter((task) => favoriteTaskIds.includes(task.id))
    }

    setFilteredTasks(filtered)
    setCurrentPage(1)
  }, [tasks, searchQuery, favoriteTaskIds, showFavoritesOnly])

  useEffect(() => {
    if (selectedTasks.length > 0 && !showSelectionBar) {
      setShowSelectionBar(true)
    } else if (selectedTasks.length === 0 && showSelectionBar) {
      setTimeout(() => setShowSelectionBar(false), 150)
    }
  }, [selectedTasks.length, showSelectionBar])

  const updateTaskStatus = async (taskId: number, newStatus: string, taskTitle: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        addNotification({
          type: "success",
          title: "Task Updated",
          message: `Task "${taskTitle}" has been ${newStatus === "completed" ? "completed" : "archived"}.`,
        })
        queryClient.invalidateQueries({ queryKey: ["tasks"] })
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to update task. Please try again.",
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
        queryClient.invalidateQueries({ queryKey: ["tasks"] })
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

  const archiveTask = async () => {
    if (!taskToArchive) return

    try {
      const response = await fetch(`/api/tasks/${taskToArchive.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      })

      if (response.ok) {
        addNotification({
          type: "success",
          title: "Task Archived",
          message: `Task "${taskToArchive.title}" has been archived.`,
        })
        queryClient.invalidateQueries({ queryKey: ["tasks"] })
        setShowArchiveModal(false)
        setTaskToArchive(null)
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to archive task. Please try again.",
      })
    }
  }

  const toggleTaskSelection = (taskId: number) => {
    setSelectedTasks((prev) => {
      const newSelection = prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
      return newSelection
    })
  }

  const toggleFavorite = (taskId: number) => {
    setFavoriteTaskIds((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]))
  }

  const selectAllTasks = () => {
    const currentTasks = getCurrentPageTasks()
    setSelectedTasks(currentTasks.map((task) => task.id))
  }

  const clearSelection = () => {
    setSelectedTasks([])
  }

  const bulkUpdateStatus = async (newStatus: string) => {
    try {
      await Promise.all(
        selectedTasks.map((taskId) =>
          fetch(`/api/tasks/${taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          }),
        ),
      )

      addNotification({
        type: "success",
        title: "Tasks Updated",
        message: `${selectedTasks.length} tasks have been ${newStatus === "completed" ? "completed" : "archived"}.`,
      })

      clearSelection()
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to update tasks. Please try again.",
      })
    }
  }

  const duplicateTask = async (task: Task) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${task.title} (Copy)`,
          description: task.description,
          project_id: task.project_id,
          priority: task.priority,
          assigned_to: task.assigned_to,
        }),
      })

      if (response.ok) {
        addNotification({
          type: "success",
          title: "Task Duplicated",
          message: `Task "${task.title}" has been duplicated.`,
        })
        queryClient.invalidateQueries({ queryKey: ["tasks"] })
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to duplicate task. Please try again.",
      })
    }
  }

  const getTaskStats = () => {
    const safeFilteredTasks = Array.isArray(filteredTasks) ? filteredTasks : []
    const total = safeFilteredTasks.length
    const completed = safeFilteredTasks.filter((task) => task.status === "completed").length
    const inProgress = safeFilteredTasks.filter((task) => task.status === "in_progress").length
    const overdue = safeFilteredTasks.filter(
      (task) => task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed",
    ).length

    return { total, completed, inProgress, overdue }
  }

  const getCurrentPageTasks = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredTasks.slice(startIndex, endIndex)
  }

  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE)

  const stats = getTaskStats()

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

  useEffect(() => {
    if (selectedTasks.length > 0) {
      addNotification({
        type: "info",
        title: "Task Selected",
        message: "Task has been added to selection.",
        duration: 2000,
      })
    }
  }, [selectedTasks])

  if (loading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full mx-auto mb-4"></div>
            <div className="text-lg font-medium" style={{ color: "var(--color-text)" } as CSSProperties}>
              Loading tasks...
            </div>
          </div>
        </div>
      </Sidebar>
    )
  }

  return (
    <Sidebar>
      <div className="p-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-5xl font-bold mb-2" style={{ color: "var(--color-text)" } as CSSProperties}>
              Tasks
            </h1>
            <p className="text-xl opacity-70" style={{ color: "var(--color-text)" } as CSSProperties}>
              Manage your tasks and track progress
            </p>
          </div>
          <button
            onClick={() => setShowTaskModal(true)}
            className="group flex items-center px-6 py-3 bg-[var(--color-secondary)] bg-opacity-20 rounded-2xl border-2 border-[var(--color-border)] hover:bg-opacity-30 hover:shadow-lg hover:transform hover:scale-105 transition-all duration-200 font-medium"
            style={{ color: "var(--color-secondary-foreground)" } as CSSProperties}
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-200" />
            <span className="ml-2">New Task</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70 mb-1" style={{ color: "var(--color-text)" } as CSSProperties}>
                  Total Tasks
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" } as CSSProperties}>
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--color-primary)] bg-opacity-10 rounded-2xl flex items-center justify-center">
                <CheckSquare className="w-6 h-6" style={{ color: "var(--color-primary)" } as CSSProperties} />
              </div>
            </div>
          </div>
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70 mb-1" style={{ color: "var(--color-text)" } as CSSProperties}>
                  Completed
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" } as CSSProperties}>
                  {stats.completed}
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--color-accent)] bg-opacity-10 rounded-2xl flex items-center justify-center">
                <CheckSquare className="w-6 h-6" style={{ color: "var(--color-accent)" } as CSSProperties} />
              </div>
            </div>
          </div>
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70 mb-1" style={{ color: "var(--color-text)" } as CSSProperties}>
                  In Progress
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" } as CSSProperties}>
                  {stats.inProgress}
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--color-secondary)] bg-opacity-10 rounded-2xl flex items-center justify-center">
                <Clock className="w-6 h-6" style={{ color: "var(--color-secondary)" } as CSSProperties} />
              </div>
            </div>
          </div>
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70 mb-1" style={{ color: "var(--color-text)" } as CSSProperties}>
                  Overdue
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" } as CSSProperties}>
                  {stats.overdue}
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--color-primary)] bg-opacity-20 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" style={{ color: "var(--color-primary)" } as CSSProperties} />
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
                placeholder="Search tasks..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-colors"
                style={{
                  backgroundColor: "var(--color-background)",
                  color: "var(--color-text)",
                } as CSSProperties}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 opacity-50" style={{ color: "var(--color-text)" } as CSSProperties} />
              {["all", "todo", "in_progress", "completed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-2xl border-2 border-[var(--color-border)] font-medium transition-all duration-200 hover-primary ${
                    filter === status
                      ? "bg-[var(--color-primary)] bg-opacity-20 shadow-lg transform scale-105"
                      : "hover:bg-[var(--color-primary)] hover:bg-opacity-10 hover:shadow-md hover:transform hover:scale-105"
                  }`}
                  style={{ color: filter === status ? "var(--color-primary-foreground)" : undefined } as CSSProperties}
                >
                  {status === "all" ? "All" : status.replace("_", " ").toUpperCase()}
                </button>
              ))}

              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`px-4 py-2 rounded-2xl border-2 border-[var(--color-border)] font-medium transition-all duration-200 hover-primary ${
                  showFavoritesOnly
                    ? "bg-[var(--color-primary)] bg-opacity-20 shadow-lg transform scale-105"
                    : "hover:bg-[var(--color-primary)] hover:bg-opacity-10 hover:shadow-md hover:transform hover:scale-105"
                }`}
                style={{ color: showFavoritesOnly ? "var(--color-primary-foreground)" : undefined } as CSSProperties}
              >
                <Heart size={16} className={favoriteTaskIds.length > 0 ? "fill-current" : ""} />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={selectedTasks.length === getCurrentPageTasks().length ? clearSelection : selectAllTasks}
                className="px-4 py-2 rounded-2xl border-2 border-[var(--color-border)] font-medium transition-all duration-200 bg-[var(--color-secondary)] bg-opacity-10 hover:bg-opacity-20 hover:shadow-md hover:transform hover:scale-105"
                style={{ color: "var(--color-secondary-foreground)" } as CSSProperties}
              >
                {selectedTasks.length === getCurrentPageTasks().length ? "Deselect All" : "Select All"}
              </button>
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
                  onClick={() => bulkUpdateStatus("completed")}
                  className="px-4 py-2 bg-[var(--color-accent)] bg-opacity-20 hover:bg-opacity-30 rounded-2xl border-2 border-[var(--color-border)] transition-all duration-200 font-medium"
                  style={{ color: "var(--color-text)" } as CSSProperties}
                >
                  Mark Completed
                </button>
                <button
                  onClick={() => bulkUpdateStatus("archived")}
                  className="px-4 py-2 bg-[var(--color-secondary)] bg-opacity-20 hover:bg-opacity-30 rounded-2xl border-2 border-[var(--color-border)] transition-all duration-200 font-medium"
                  style={{ color: "var(--color-secondary-foreground)" } as CSSProperties}
                >
                  Archive
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {filteredTasks.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="w-24 h-24 bg-[var(--color-primary)] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[var(--color-border)]">
                <Plus className="w-12 h-12" style={{ color: "var(--color-primary)" } as CSSProperties} />
              </div>
              <p className="text-xl mb-4 opacity-70" style={{ color: "var(--color-text)" } as CSSProperties}>
                {searchQuery ? `No tasks found for "${searchQuery}"` : "No tasks found"}
              </p>
              <button
                onClick={() => setShowTaskModal(true)}
                className="inline-flex items-center px-6 py-3 bg-[var(--color-primary)] bg-opacity-10 hover:bg-opacity-20 rounded-2xl border-2 border-[var(--color-border)] hover:shadow-lg hover:transform hover:scale-105 transition-all duration-200 font-medium"
                style={{ color: "var(--color-primary-foreground)" } as CSSProperties}
              >
                <Plus size={16} />
                <span className="ml-2">Create your first task</span>
              </button>
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(task.id)
                        }}
                        className={`flex-shrink-0 p-1 rounded-full transition-all duration-200 ${
                          favoriteTaskIds.includes(task.id)
                            ? "scale-110 text-yellow-500"
                            : "opacity-40 hover:opacity-80 hover:scale-110"
                        }`}
                        style={{ color: favoriteTaskIds.includes(task.id) ? "#eab308" : "var(--color-text)" } as CSSProperties}
                      >
                        <Star size={16} fill={favoriteTaskIds.includes(task.id) ? "currentColor" : "none"} />
                      </button>
                      <h3
                        className="text-lg font-bold leading-tight min-w-0 flex-1"
                        style={{ color: "var(--color-text)" } as CSSProperties}
                        title={task.title}
                      >
                        {truncateText(task.title, 20)}
                      </h3>
                    </div>
                    <div className="flex flex-col space-y-2 flex-shrink-0 ml-3">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold shadow-sm border-2"
                        style={{
                          backgroundColor: priorityConfig[task.priority].bg,
                          color: priorityConfig[task.priority].text,
                          borderColor: priorityConfig[task.priority].border,
                        } as CSSProperties}
                      >
                        {priorityConfig[task.priority].label}
                      </span>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold shadow-sm"
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
                  <div className="flex-1">
                    {task.description && (
                      <p
                        className="text-sm opacity-70 leading-relaxed mb-4"
                        style={{ color: "var(--color-text)" } as CSSProperties}
                        title={task.description}
                      >
                        {truncateText(task.description, 80)}
                      </p>
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
                          style={{ backgroundColor: priorityConfig[task.priority].color + "20" } as CSSProperties}
                        >
                          <FolderOpen size={16} style={{ color: priorityConfig[task.priority].color } as CSSProperties} />
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
                          style={{ backgroundColor: priorityConfig[task.priority].color + "20" } as CSSProperties}
                        >
                          <User size={16} style={{ color: priorityConfig[task.priority].color } as CSSProperties} />
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
                          style={{ backgroundColor: priorityConfig[task.priority].color + "20" } as CSSProperties}
                        >
                          <Calendar size={16} style={{ color: priorityConfig[task.priority].color } as CSSProperties} />
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
                    <span>Created {formatDate(task.created_at)}</span>
                    {task.updated_at !== task.created_at && <span>Updated {getTimeSince(task.updated_at)}</span>}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedTask(task)
                          setShowEditModal(true)
                        }}
                        className="p-2 rounded-2xl border-2 border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:bg-opacity-10 transition-all duration-200"
                        style={{ color: "var(--color-text)" } as CSSProperties}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>

                      {task.status !== "completed" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateTaskStatus(task.id, "completed", task.title)
                          }}
                          className="p-2 rounded-2xl border-2 border-[var(--color-border)] hover:bg-green-500 hover:bg-opacity-10 transition-all duration-200"
                          style={{ color: "var(--color-text)" } as CSSProperties}
                          title="Complete"
                        >
                          <Check size={16} />
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          duplicateTask(task)
                        }}
                        className="p-2 rounded-2xl border-2 border-[var(--color-border)] hover:bg-[var(--color-secondary)] hover:bg-opacity-10 transition-all duration-200 hover-secondary"
                        style={{ color: "var(--color-text)" } as CSSProperties}
                        title="Duplicate"
                      >
                        <Copy size={16} />
                      </button>
                    </div>

                    <div className="flex space-x-2">
                      {task.status !== "archived" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setTaskToArchive(task)
                            setShowArchiveModal(true)
                          }}
                          className="p-2 rounded-2xl border-2 border-[var(--color-border)] hover:bg-yellow-500 hover:bg-opacity-10 transition-all duration-200"
                          style={{ color: "var(--color-text)" } as CSSProperties}
                          title="Archive"
                        >
                          <Archive size={16} />
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setTaskToDelete(task)
                          setShowDeleteModal(true)
                        }}
                        className="p-2 rounded-2xl border-2 border-[var(--color-border)] hover:bg-red-500 hover:bg-opacity-10 transition-all duration-200"
                        style={{ color: "var(--color-text)" } as CSSProperties}
                        title="Delete"
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
                className={`px-4 py-2 rounded-2xl border-2 border-[var(--color-border)] font-medium transition-all duration-200 hover-primary ${
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
              className="p-2 rounded-2xl border-2 border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:bg-opacity-10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style={{ color: "var(--color-text)" } as CSSProperties}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Animated Modals */}
        {showArchiveModal && taskToArchive && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div
              className="p-8 rounded-3xl border-2 shadow-2xl max-w-md w-full mx-4 animate-in slide-in-from-bottom-4 duration-300"
              style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
              } as CSSProperties}
            >
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ 
                    backgroundColor: "var(--color-secondary)",
                    opacity: 0.1
                  } as CSSProperties}
                >
                  <Archive 
                    className="w-8 h-8" 
                    style={{ color: "var(--color-secondary)" } as CSSProperties} 
                  />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: "var(--color-text)" } as CSSProperties}>
                  Archive Task
                </h3>
                <p className="opacity-70 mb-6" style={{ color: "var(--color-text)" } as CSSProperties}>
                  Are you sure you want to archive "{taskToArchive.title}"? You can restore it later from the archive.
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      setShowArchiveModal(false)
                      setTaskToArchive(null)
                    }}
                    className="flex-1 px-4 py-3 rounded-2xl border-2 border-[var(--color-border)] transition-all duration-200 font-medium hover:bg-opacity-10"
                    style={{ 
                      color: "var(--color-text)",
                      backgroundColor: "transparent"
                    } as CSSProperties}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={archiveTask}
                    className="flex-1 px-4 py-3 rounded-2xl border-2 border-[var(--color-border)] transition-all duration-200 font-medium hover:bg-opacity-10"
                    style={{ 
                      color: "var(--color-text)",
                      backgroundColor: "transparent"
                    } as CSSProperties}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(245, 158, 11, 0.1)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent"
                    }}
                  >
                    Archive
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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

        <TaskFormModal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["tasks"] })} />
        <TaskEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["tasks"] })}
          task={selectedTask}
        />
        <TaskViewModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["tasks"] })}
          task={selectedTask}
          onEdit={(task) => {
            setSelectedTask(task)
            setShowViewModal(false)
            setShowEditModal(true)
          }}
          onArchive={(task) => {
            setTaskToArchive(task)
            setShowViewModal(false)
            setShowArchiveModal(true)
          }}
        />
      </div>
    </Sidebar>
  )
}
