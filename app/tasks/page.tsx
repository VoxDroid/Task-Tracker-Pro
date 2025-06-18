"use client"

import { useEffect, useState } from "react"
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
} from "lucide-react"
import TaskEditModal from "@/components/task-edit-modal"

const priorityConfig = {
  low: {
    bg: "bg-[var(--color-primary)] bg-opacity-20",
    text: "text-[var(--color-text)]",
    border: "border-[var(--color-primary)] border-opacity-30",
    label: "Low",
  },
  medium: {
    bg: "bg-[var(--color-primary)] bg-opacity-40",
    text: "text-[var(--color-text)]",
    border: "border-[var(--color-primary)] border-opacity-50",
    label: "Medium",
  },
  high: {
    bg: "bg-[var(--color-primary)] bg-opacity-60",
    text: "text-[var(--color-text)]",
    border: "border-[var(--color-primary)] border-opacity-70",
    label: "High",
  },
  urgent: {
    bg: "bg-[var(--color-primary)] bg-opacity-80",
    text: "text-[var(--color-text)]",
    border: "border-[var(--color-primary)]",
    label: "Urgent",
  },
}

const statusConfig = {
  todo: {
    bg: "bg-[var(--color-secondary)] bg-opacity-20",
    text: "text-[var(--color-text)]",
    border: "border-[var(--color-secondary)] border-opacity-30",
    label: "To Do",
  },
  in_progress: {
    bg: "bg-[var(--color-secondary)] bg-opacity-40",
    text: "text-[var(--color-text)]",
    border: "border-[var(--color-secondary)] border-opacity-50",
    label: "In Progress",
  },
  completed: {
    bg: "bg-[var(--color-accent)] bg-opacity-40",
    text: "text-[var(--color-text)]",
    border: "border-[var(--color-accent)] border-opacity-50",
    label: "Completed",
  },
  archived: {
    bg: "bg-[var(--color-text)] bg-opacity-20",
    text: "text-[var(--color-text)]",
    border: "border-[var(--color-text)] border-opacity-30",
    label: "Archived",
  },
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [taskToArchive, setTaskToArchive] = useState<Task | null>(null)
  const { addNotification } = useNotification()

  const [selectedTasks, setSelectedTasks] = useState<number[]>([])
  const [favoriteTaskIds, setFavoriteTaskIds] = useState<number[]>([])
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [filter])

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
  }, [tasks, searchQuery, favoriteTaskIds, showFavoritesOnly])

  const fetchTasks = async () => {
    try {
      const url = filter === "all" ? "/api/tasks" : `/api/tasks?status=${filter}`
      const response = await fetch(url)
      const data = await response.json()
      setTasks(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching tasks:", error)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

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
        fetchTasks()
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
        fetchTasks()
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
        fetchTasks()
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
    setSelectedTasks((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]))
  }

  const toggleFavorite = (taskId: number) => {
    setFavoriteTaskIds((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]))
  }

  const selectAllTasks = () => {
    setSelectedTasks(filteredTasks.map((task) => task.id))
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
      fetchTasks()
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
        fetchTasks()
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

  const stats = getTaskStats()

  if (loading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full mx-auto mb-4"></div>
            <div className="text-lg font-medium" style={{ color: "var(--color-text)" }}>
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
            <h1 className="text-5xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
              Tasks
            </h1>
            <p className="text-xl opacity-70" style={{ color: "var(--color-text)" }}>
              Manage your tasks and track progress
            </p>
          </div>
          <button
            onClick={() => setShowTaskModal(true)}
            className="group flex items-center px-6 py-3 bg-[var(--color-primary)] bg-opacity-10 hover:bg-opacity-20 rounded-2xl border-2 border-[var(--color-border)] hover:shadow-lg hover:transform hover:scale-105 transition-all duration-200 font-medium"
            style={{ color: "var(--color-text)" }}
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-200" />
            <span className="ml-2">New Task</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70 mb-1" style={{ color: "var(--color-text)" }}>
                  Total Tasks
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--color-primary)] bg-opacity-10 rounded-xl flex items-center justify-center">
                <CheckSquare className="w-6 h-6" style={{ color: "var(--color-primary)" }} />
              </div>
            </div>
          </div>
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70 mb-1" style={{ color: "var(--color-text)" }}>
                  Completed
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                  {stats.completed}
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--color-accent)] bg-opacity-10 rounded-xl flex items-center justify-center">
                <CheckSquare className="w-6 h-6" style={{ color: "var(--color-accent)" }} />
              </div>
            </div>
          </div>
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70 mb-1" style={{ color: "var(--color-text)" }}>
                  In Progress
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                  {stats.inProgress}
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--color-secondary)] bg-opacity-10 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6" style={{ color: "var(--color-secondary)" }} />
              </div>
            </div>
          </div>
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70 mb-1" style={{ color: "var(--color-text)" }}>
                  Overdue
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                  {stats.overdue}
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--color-primary)] bg-opacity-20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" style={{ color: "var(--color-primary)" }} />
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
                placeholder="Search tasks..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-colors"
                style={{
                  backgroundColor: "var(--color-background)",
                  color: "var(--color-text)",
                }}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 opacity-50" style={{ color: "var(--color-text)" }} />
              {["all", "todo", "in_progress", "completed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-xl border-2 border-[var(--color-border)] font-medium transition-all duration-200 ${
                    filter === status
                      ? "bg-[var(--color-primary)] bg-opacity-20 shadow-lg transform scale-105"
                      : "hover:bg-[var(--color-primary)] hover:bg-opacity-10 hover:shadow-md hover:transform hover:scale-105"
                  }`}
                  style={{ color: "var(--color-text)" }}
                >
                  {status === "all" ? "All" : status.replace("_", " ").toUpperCase()}
                </button>
              ))}

              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`px-4 py-2 rounded-xl border-2 border-[var(--color-border)] font-medium transition-all duration-200 ${
                  showFavoritesOnly
                    ? "bg-[var(--color-primary)] bg-opacity-20 shadow-lg transform scale-105"
                    : "hover:bg-[var(--color-primary)] hover:bg-opacity-10 hover:shadow-md hover:transform hover:scale-105"
                }`}
                style={{ color: "var(--color-text)" }}
              >
                <Heart size={16} className={favoriteTaskIds.length > 0 ? "fill-current" : ""} />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={selectedTasks.length === filteredTasks.length ? clearSelection : selectAllTasks}
                className="px-4 py-2 rounded-xl border-2 border-[var(--color-border)] font-medium transition-all duration-200 bg-[var(--color-secondary)] bg-opacity-10 hover:bg-opacity-20 hover:shadow-md hover:transform hover:scale-105"
                style={{ color: "var(--color-text)" }}
              >
                {selectedTasks.length === filteredTasks.length ? "Deselect All" : "Select All"}
              </button>
            </div>
          </div>
        </div>

        {selectedTasks.length > 0 && (
          <div className="bg-[var(--color-primary)] bg-opacity-10 p-4 rounded-xl border-2 border-[var(--color-border)] mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="font-medium" style={{ color: "var(--color-text)" }}>
                  {selectedTasks.length} task{selectedTasks.length !== 1 ? "s" : ""} selected
                </span>
                <button
                  onClick={clearSelection}
                  className="text-sm opacity-70 hover:opacity-100 font-medium transition-opacity"
                  style={{ color: "var(--color-text)" }}
                >
                  Clear selection
                </button>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => bulkUpdateStatus("completed")}
                  className="px-4 py-2 hover:bg-green-600 hover:text-white rounded-xl border-2 border-[var(--color-border)] transition-colors font-medium"
                  style={{ color: "var(--color-text)" }}
                >
                  Mark Completed
                </button>
                <button
                  onClick={() => bulkUpdateStatus("archived")}
                  className="px-4 py-2 hover:bg-yellow-600 hover:text-white rounded-xl border-2 border-[var(--color-border)] transition-colors font-medium"
                  style={{ color: "var(--color-text)" }}
                >
                  Archive
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-[var(--color-primary)] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[var(--color-border)]">
                <Plus className="w-12 h-12" style={{ color: "var(--color-primary)" }} />
              </div>
              <p className="text-xl mb-4 opacity-70" style={{ color: "var(--color-text)" }}>
                {searchQuery ? `No tasks found for "${searchQuery}"` : "No tasks found"}
              </p>
              <button
                onClick={() => setShowTaskModal(true)}
                className="inline-flex items-center px-6 py-3 bg-[var(--color-primary)] bg-opacity-10 hover:bg-opacity-20 rounded-2xl border-2 border-[var(--color-border)] hover:shadow-lg hover:transform hover:scale-105 transition-all duration-200 font-medium"
                style={{ color: "var(--color-text)" }}
              >
                <Plus size={16} />
                <span className="ml-2">Create your first task</span>
              </button>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className="bg-[var(--color-surface)] p-8 rounded-2xl border-2 border-[var(--color-border)] shadow-lg hover:shadow-xl hover:transform hover:scale-[1.02] transition-all duration-200"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex items-center space-x-3 mt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleTaskSelection(task.id)
                      }}
                      className={`relative w-6 h-6 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${
                        selectedTasks.includes(task.id)
                          ? "bg-[var(--color-primary)] border-[var(--color-primary)]"
                          : "border-[var(--color-border)] hover:border-[var(--color-primary)]"
                      }`}
                    >
                      {selectedTasks.includes(task.id) && <Check className="w-4 h-4 text-white" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(task.id)
                      }}
                      className={`p-1 rounded-full transition-all duration-200 ${
                        favoriteTaskIds.includes(task.id) ? "scale-110" : "opacity-30 hover:opacity-70 hover:scale-110"
                      }`}
                      style={{ color: "var(--color-primary)" }}
                    >
                      <Star size={16} fill={favoriteTaskIds.includes(task.id) ? "currentColor" : "none"} />
                    </button>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
                            {task.title}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${priorityConfig[task.priority].bg} ${priorityConfig[task.priority].text} ${priorityConfig[task.priority].border}`}
                          >
                            {priorityConfig[task.priority].label}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig[task.status].bg} ${statusConfig[task.status].text} ${statusConfig[task.status].border}`}
                          >
                            {statusConfig[task.status].label}
                          </span>
                        </div>

                        {task.description && (
                          <p className="mb-4 text-lg opacity-80" style={{ color: "var(--color-text)" }}>
                            {task.description}
                          </p>
                        )}

                        <div
                          className="flex items-center space-x-4 text-sm opacity-70"
                          style={{ color: "var(--color-text)" }}
                        >
                          {task.project_name && (
                            <div className="flex items-center bg-[var(--color-background)] px-3 py-2 rounded-xl border border-[var(--color-border)]">
                              <FolderOpen size={14} />
                              <span className="ml-2 font-medium">{task.project_name}</span>
                            </div>
                          )}
                          {task.assigned_to && (
                            <div className="flex items-center bg-[var(--color-background)] px-3 py-2 rounded-xl border border-[var(--color-border)]">
                              <User size={14} />
                              <span className="ml-2 font-medium">{task.assigned_to}</span>
                            </div>
                          )}
                          {task.due_date && (
                            <div className="flex items-center bg-[var(--color-background)] px-3 py-2 rounded-xl border border-[var(--color-border)]">
                              <Calendar size={14} />
                              <span className="ml-2 font-medium">{new Date(task.due_date).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedTask(task)
                            setShowEditModal(true)
                          }}
                          className="p-3 hover:bg-blue-600 hover:text-white rounded-xl transition-all duration-200"
                          style={{ color: "var(--color-text)" }}
                          title="Edit Task"
                        >
                          <Edit size={18} />
                        </button>

                        {task.status !== "completed" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              updateTaskStatus(task.id, "completed", task.title)
                            }}
                            className="p-3 hover:bg-green-600 hover:text-white rounded-xl transition-all duration-200"
                            style={{ color: "var(--color-text)" }}
                            title="Mark Complete"
                          >
                            <Check size={18} />
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            duplicateTask(task)
                          }}
                          className="p-3 hover:bg-[var(--color-secondary)] hover:bg-opacity-10 rounded-xl transition-all duration-200"
                          style={{ color: "var(--color-text)" }}
                          title="Duplicate Task"
                        >
                          <Copy size={18} />
                        </button>

                        {task.status !== "archived" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setTaskToArchive(task)
                              setShowArchiveModal(true)
                            }}
                            className="p-3 hover:bg-yellow-600 hover:text-white rounded-xl transition-all duration-200"
                            style={{ color: "var(--color-text)" }}
                            title="Archive Task"
                          >
                            <Archive size={18} />
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setTaskToDelete(task)
                            setShowDeleteModal(true)
                          }}
                          className="p-3 hover:bg-red-600 hover:text-white rounded-xl transition-all duration-200"
                          style={{ color: "var(--color-text)" }}
                          title="Delete Task"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {showArchiveModal && taskToArchive && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className="p-8 rounded-2xl border-2 shadow-2xl max-w-md w-full mx-4"
              style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Archive className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
                  Archive Task
                </h3>
                <p className="opacity-70 mb-6" style={{ color: "var(--color-text)" }}>
                  Are you sure you want to archive "{taskToArchive.title}"? You can restore it later from the archive.
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      setShowArchiveModal(false)
                      setTaskToArchive(null)
                    }}
                    className="flex-1 px-4 py-3 hover:bg-red-600 hover:text-white rounded-xl border-2 border-[var(--color-border)] transition-all duration-200 font-medium"
                    style={{ color: "var(--color-text)" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={archiveTask}
                    className="flex-1 px-4 py-3 hover:bg-yellow-600 hover:text-white rounded-xl border-2 border-[var(--color-border)] transition-all duration-200 font-medium"
                    style={{ color: "var(--color-text)" }}
                  >
                    Archive
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && taskToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className="p-8 rounded-2xl border-2 shadow-2xl max-w-md w-full mx-4"
              style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
                  Delete Task
                </h3>
                <p className="opacity-70 mb-6" style={{ color: "var(--color-text)" }}>
                  Are you sure you want to delete "{taskToDelete.title}"? This action cannot be undone.
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false)
                      setTaskToDelete(null)
                    }}
                    className="flex-1 px-4 py-3 hover:bg-red-600 hover:text-white rounded-xl border-2 border-[var(--color-border)] transition-all duration-200 font-medium"
                    style={{ color: "var(--color-text)" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deleteTask}
                    className="flex-1 px-4 py-3 hover:bg-gray-600 hover:text-white rounded-xl border-2 border-[var(--color-border)] transition-all duration-200 font-medium"
                    style={{ color: "var(--color-text)" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <TaskFormModal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} onSuccess={fetchTasks} />
        <TaskEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={fetchTasks}
          task={selectedTask}
        />
      </div>
    </Sidebar>
  )
}
