"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useQueryClient, useMutation } from "@tanstack/react-query"
import Link from "next/link"
import Sidebar from "@/components/sidebar"
import TaskFormModal from "@/components/task-form-modal"
import TaskEditModal from "@/components/task-edit-modal"
import { useNotification } from "@/components/notification"
import { truncateText } from "@/lib/utils"
import { ArrowLeft, Plus, Calendar, User, CheckCircle, Clock, AlertTriangle, Edit, Check, Copy, Archive, Trash2, FolderOpen, Filter, Heart, CheckSquare, Star, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { formatDateTimeShort } from "@/components/datetime-picker"

const ITEMS_PER_PAGE = 6

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string
  const [project, setProject] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<any>(null)
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [taskToArchive, setTaskToArchive] = useState<any>(null)
  const [showSelectTaskModal, setShowSelectTaskModal] = useState(false)
  const [availableTasks, setAvailableTasks] = useState<any[]>([])
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([])
  const [loadingAvailableTasks, setLoadingAvailableTasks] = useState(false)
  const [filter, setFilter] = useState<string>("all")
  const [filteredTasks, setFilteredTasks] = useState<any[]>([])
  const [selectedTasks, setSelectedTasks] = useState<number[]>([])
  const [showSelectionBar, setShowSelectionBar] = useState(false)
  const [favoriteTaskIds, setFavoriteTaskIds] = useState<number[]>([])
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const { addNotification } = useNotification()
  const queryClient = useQueryClient()

  useEffect(() => {
    fetchProject()
    fetchTasks()
  }, [projectId])

  // Filtering logic
  useEffect(() => {
    let filtered = Array.isArray(tasks) ? [...tasks] : []

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.assigned_to?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filter by status
    if (filter !== "all") {
      filtered = filtered.filter(task => task.status === filter)
    }

    // Filter by favorites
    if (showFavoritesOnly) {
      filtered = filtered.filter(task => favoriteTaskIds.includes(task.id))
    }

    setFilteredTasks(filtered)
    setCurrentPage(1)
  }, [tasks, searchQuery, filter, favoriteTaskIds, showFavoritesOnly])

  // Selection bar management
  useEffect(() => {
    if (selectedTasks.length > 0 && !showSelectionBar) {
      setShowSelectionBar(true)
    } else if (selectedTasks.length === 0 && showSelectionBar) {
      setTimeout(() => setShowSelectionBar(false), 150)
    }
  }, [selectedTasks.length, showSelectionBar])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      const data = await response.json()
      setProject(data)
    } catch (error) {
      console.error("Error fetching project:", error)
    }
  }

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?project_id=${projectId}`)
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
        fetchProject()
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

  const duplicateTask = async (task: any) => {
    try {
      const { id, created_at, updated_at, ...taskData } = task
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...taskData,
          title: `${task.title} (Copy)`,
        }),
      })

      if (response.ok) {
        addNotification({
          type: "success",
          title: "Task Duplicated",
          message: `Task "${task.title}" has been duplicated successfully.`,
        })
        fetchTasks()
        fetchProject()
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
          message: `Task "${taskToArchive.title}" has been archived successfully.`,
        })
        fetchTasks()
        fetchProject()
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
        fetchProject()
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

  const fetchAvailableTasks = async () => {
    setLoadingAvailableTasks(true)
    try {
      // Fetch all non-archived tasks
      const response = await fetch("/api/tasks")
      const data = await response.json()
      // Filter out tasks that are already in this project
      const availableTasks = Array.isArray(data)
        ? data.filter((task: any) => task.project_id !== parseInt(projectId))
        : []
      setAvailableTasks(availableTasks)
    } catch (error) {
      console.error("Error fetching available tasks:", error)
      setAvailableTasks([])
    } finally {
      setLoadingAvailableTasks(false)
    }
  }

  const assignTasksToProject = async () => {
    if (selectedTaskIds.length === 0) return

    try {
      const promises = selectedTaskIds.map(taskId =>
        fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project_id: parseInt(projectId) }),
        })
      )

      const results = await Promise.all(promises)
      const successCount = results.filter(response => response.ok).length

      if (successCount > 0) {
        addNotification({
          type: "success",
          title: "Tasks Assigned",
          message: `${successCount} task${successCount > 1 ? 's' : ''} ${successCount > 1 ? 'have' : 'has'} been assigned to this project.`,
        })
        fetchTasks()
        fetchProject()
        queryClient.invalidateQueries({ queryKey: ["tasks"] })
        setShowSelectTaskModal(false)
        setSelectedTaskIds([])
        setAvailableTasks([])
      } else {
        addNotification({
          type: "error",
          title: "Error",
          message: "Failed to assign tasks to project.",
        })
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to assign tasks to project. Please try again.",
      })
    }
  }

  const handleSelectTask = (taskId: number) => {
    setSelectedTaskIds(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  // Filtering and batch operations functions
  const selectAllTasks = () => {
    const currentPageTaskIds = getCurrentPageTasks().map(task => task.id)
    setSelectedTasks(currentPageTaskIds)
  }

  const clearSelection = () => {
    setSelectedTasks([])
  }

  const bulkUpdateStatus = async (newStatus: string) => {
    if (selectedTasks.length === 0) return

    try {
      const promises = selectedTasks.map(taskId =>
        fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        })
      )

      const results = await Promise.all(promises)
      const successCount = results.filter(response => response.ok).length

      if (successCount > 0) {
        addNotification({
          type: "success",
          title: "Tasks Updated",
          message: `${successCount} task${successCount > 1 ? 's' : ''} ${successCount > 1 ? 'have' : 'has'} been ${newStatus === "completed" ? "completed" : "archived"}.`,
        })
        fetchTasks()
        fetchProject()
        queryClient.invalidateQueries({ queryKey: ["tasks"] })
        clearSelection()
      } else {
        addNotification({
          type: "error",
          title: "Error",
          message: "Failed to update tasks.",
        })
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to update tasks. Please try again.",
      })
    }
  }

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

  const toggleFavorite = (taskId: number) => {
    const isCurrentlyFavorite = favoriteTaskIds.includes(taskId)
    toggleFavoriteMutation.mutate({ taskId, isFavorite: !isCurrentlyFavorite })
  }

  const getCurrentPageTasks = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredTasks.slice(startIndex, endIndex)
  }

  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE)

  if (loading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full mx-auto mb-4"></div>
            <div className="text-lg font-medium" style={{ color: "var(--color-text)" }}>
              Loading project...
            </div>
          </div>
        </div>
      </Sidebar>
    )
  }

  if (!project) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
              Project Not Found
            </h2>
            <Link
              href="/projects"
              className="inline-flex items-center px-4 py-2 bg-[var(--color-primary)] bg-opacity-20 rounded-xl border-2 border-[var(--color-border)] hover:bg-opacity-30 transition-colors font-medium"
              style={{ color: "var(--color-primary-foreground)" }}
            >
              <ArrowLeft size={16} />
              <span className="ml-2">Back to Projects</span>
            </Link>
          </div>
        </div>
      </Sidebar>
    )
  }

  const completedTasks = tasks.filter((task) => task.status === "completed").length
  const inProgressTasks = tasks.filter((task) => task.status === "in_progress").length
  const todoTasks = tasks.filter((task) => task.status === "todo").length
  const overdueTasks = tasks.filter(
    (task) => task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed",
  ).length

  return (
    <Sidebar>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link
              href="/projects"
              className="mr-4 p-2 bg-[var(--color-surface)] rounded-xl border-2 border-[var(--color-border)] hover:shadow-md hover:transform hover:scale-105 transition-all duration-200"
              style={{ color: "var(--color-text)" }}
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center">
              <div
                className="w-8 h-8 rounded-full border-2 border-[var(--color-border)] mr-4 shadow-md"
                style={{ backgroundColor: "var(--color-primary)" }}
              />
              <div>
                <h1 className="text-4xl font-bold" style={{ color: "var(--color-text)" }}>
                  {project.name}
                </h1>
                {project.description && (
                  <p className="text-lg opacity-70 mt-1" style={{ color: "var(--color-text)" }}>
                    {project.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowTaskModal(true)}
            className="flex items-center px-6 py-3 rounded-2xl border-2 border-[var(--color-border)] hover:shadow-lg hover:transform hover:scale-105 transition-all duration-200 font-medium"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-primary-foreground)",
            }}
          >
            <Plus size={20} />
            <span className="ml-2">Add Task</span>
          </button>

          <button
            onClick={() => {
              setShowSelectTaskModal(true)
              fetchAvailableTasks()
            }}
            className="flex items-center px-6 py-3 rounded-2xl border-2 border-[var(--color-border)] hover:shadow-lg hover:transform hover:scale-105 transition-all duration-200 font-medium"
            style={{
              backgroundColor: "var(--color-secondary)",
              color: "var(--color-secondary-foreground)",
            }}
          >
            <FolderOpen size={20} />
            <span className="ml-2">Select Existing Task</span>
          </button>
        </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div
            className="p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80 mb-1" style={{ color: "var(--color-primary-foreground)" }}>
                  To Do
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-primary-foreground)" }}>
                  {todoTasks}
                </p>
              </div>
              <Clock className="w-8 h-8" style={{ color: "var(--color-primary-foreground)" }} />
            </div>
          </div>
          <div
            className="p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80 mb-1" style={{ color: "var(--color-primary-foreground)" }}>
                  In Progress
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-primary-foreground)" }}>
                  {inProgressTasks}
                </p>
              </div>
              <Clock className="w-8 h-8" style={{ color: "var(--color-primary-foreground)" }} />
            </div>
          </div>
          <div
            className="p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80 mb-1" style={{ color: "var(--color-primary-foreground)" }}>
                  Completed
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-primary-foreground)" }}>
                  {completedTasks}
                </p>
              </div>
              <CheckCircle className="w-8 h-8" style={{ color: "var(--color-primary-foreground)" }} />
            </div>
          </div>
          <div
            className="p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80 mb-1" style={{ color: "var(--color-primary-foreground)" }}>
                  Overdue
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-primary-foreground)" }}>
                  {overdueTasks}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8" style={{ color: "var(--color-primary-foreground)" }} />
            </div>
          </div>
        </div>

        {/* Search and Filter */}  
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
                className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-colors"
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
                  className={`px-4 py-2 rounded-2xl border-2 border-[var(--color-border)] font-medium transition-all duration-200 hover-primary ${
                    filter === status
                      ? "bg-[var(--color-primary)] bg-opacity-20 shadow-lg transform scale-105"
                      : "hover:bg-[var(--color-primary)] hover:bg-opacity-10 hover:shadow-md hover:transform hover:scale-105"
                  }`}
                  style={{ color: filter === status ? "var(--color-primary-foreground)" : undefined }}
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
                style={{ color: showFavoritesOnly ? "var(--color-primary-foreground)" : undefined }}
              >
                <Heart size={16} className={favoriteTaskIds.length > 0 ? "fill-current" : ""} />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={selectedTasks.length === getCurrentPageTasks().length ? clearSelection : selectAllTasks}
                className="px-4 py-2 rounded-2xl border-2 border-[var(--color-border)] font-medium transition-all duration-200 bg-[var(--color-secondary)] bg-opacity-10 hover:bg-opacity-20 hover:shadow-md hover:transform hover:scale-105"
                style={{ color: "var(--color-secondary-foreground)" }}
              >
                {selectedTasks.length === getCurrentPageTasks().length ? "Deselect All" : "Select All"}
              </button>
            </div>
          </div>
        </div>

        {/* Filter and Batch Operations - REMOVED */}

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
                <span className="font-medium" style={{ color: "var(--color-text)" }}>
                  {selectedTasks.length} task{selectedTasks.length !== 1 ? "s" : ""} selected
                </span>
                <button
                  onClick={clearSelection}
                  className="text-sm opacity-70 hover:opacity-100 font-medium transition-opacity duration-200"
                  style={{ color: "var(--color-text)" }}
                >
                  Clear selection
                </button>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => bulkUpdateStatus("completed")}
                  className="px-4 py-2 bg-[var(--color-accent)] bg-opacity-20 hover:bg-opacity-30 rounded-2xl border-2 border-[var(--color-border)] transition-all duration-200 font-medium"
                  style={{ color: "var(--color-text)" }}
                >
                  Mark Completed
                </button>
                <button
                  onClick={() => bulkUpdateStatus("archived")}
                  className="px-4 py-2 bg-[var(--color-secondary)] bg-opacity-20 hover:bg-opacity-30 rounded-2xl border-2 border-[var(--color-border)] transition-all duration-200 font-medium"
                  style={{ color: "var(--color-secondary-foreground)" }}
                >
                  Archive
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {filteredTasks.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="w-24 h-24 bg-[var(--color-primary)] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[var(--color-border)]">
                <Plus className="w-12 h-12" style={{ color: "var(--color-primary)" }} />
              </div>
              <p className="text-xl mb-4 opacity-70" style={{ color: "var(--color-text)" }}>
                {searchQuery 
                  ? `No tasks found for "${searchQuery}"`
                  : filter !== "all" 
                    ? `No ${filter.replace("_", " ")} tasks found` 
                    : "No tasks in this project"
                }
              </p>
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-[var(--color-primary)] bg-opacity-10 hover:bg-opacity-20 rounded-2xl border-2 border-[var(--color-border)] hover:shadow-lg hover:transform hover:scale-105 transition-all duration-200 font-medium"
                  style={{ color: "var(--color-primary-foreground)" }}
                >
                  <Plus size={16} />
                  <span className="ml-2">Add first task</span>
                </button>

                <button
                  onClick={() => {
                    setShowSelectTaskModal(true)
                    fetchAvailableTasks()
                  }}
                  className="inline-flex items-center px-6 py-3 bg-[var(--color-secondary)] bg-opacity-10 hover:bg-opacity-20 rounded-2xl border-2 border-[var(--color-border)] hover:shadow-lg hover:transform hover:scale-105 transition-all duration-200 font-medium"
                  style={{ color: "var(--color-secondary-foreground)" }}
                >
                  <FolderOpen size={16} />
                  <span className="ml-2">Select Existing Task</span>
                </button>
              </div>
            </div>
          ) : (
            getCurrentPageTasks().map((task) => {
              const isSelected = selectedTasks.includes(task.id)
              return (
              <div
                key={task.id}
                className={`group relative overflow-hidden rounded-3xl border-2 shadow-lg hover:shadow-2xl transition-all duration-300 ${
                  selectedTasks.includes(task.id)
                    ? "ring-2 ring-[var(--color-primary)] ring-opacity-50 transform scale-[1.02]"
                    : ""
                }`}
                style={{
                  backgroundColor: "var(--color-surface)",
                  borderColor: selectedTasks.includes(task.id) ? "var(--color-primary)" : "var(--color-border)",
                }}
              >
                {/* Remove gradient background completely */}
                <div className="relative z-10 p-6 h-full flex flex-col">
                  {/* Header - Title and Tags on same line */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedTasks(prev =>
                            prev.includes(task.id)
                              ? prev.filter(id => id !== task.id)
                              : [...prev, task.id]
                          )
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
                        style={{ color: favoriteTaskIds.includes(task.id) ? "#eab308" : "var(--color-text)" }}
                      >
                        <Star size={16} fill={favoriteTaskIds.includes(task.id) ? "currentColor" : "none"} />
                      </button>
                      <h3
                        className="text-lg font-bold leading-tight min-w-0 flex-1"
                        style={{ color: "var(--color-text)" }}
                        title={task.title}
                      >
                        {truncateText(task.title, 20)}
                      </h3>
                    </div>
                    <div className="flex flex-col space-y-2 flex-shrink-0 ml-3">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold shadow-sm border-2"
                        style={{
                          backgroundColor: task.priority === "urgent" ? "var(--color-primary)" :
                                         task.priority === "high" ? "var(--color-secondary)" :
                                         task.priority === "medium" ? "var(--color-accent)" :
                                         "var(--color-surface)",
                          color: task.priority === "urgent" ? "var(--color-primary-foreground)" :
                                task.priority === "high" ? "var(--color-secondary-foreground)" :
                                task.priority === "medium" ? "var(--color-text)" :
                                "var(--color-text)",
                          borderColor: "var(--color-border)",
                        }}
                      >
                        {task.priority}
                      </span>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold shadow-sm"
                        style={{
                          backgroundColor: task.status === "completed" ? "var(--color-accent)" :
                                         task.status === "in_progress" ? "var(--color-primary)" :
                                         task.status === "archived" ? "var(--color-secondary)" :
                                         "var(--color-surface)",
                          color: task.status === "completed" ? "var(--color-text)" :
                                task.status === "in_progress" ? "var(--color-primary-foreground)" :
                                task.status === "archived" ? "var(--color-secondary-foreground)" :
                                "var(--color-text)",
                        }}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="flex-1">
                    {task.description && (
                      <p
                        className="text-sm opacity-70 leading-relaxed mb-4"
                        style={{ color: "var(--color-text)" }}
                        title={task.description}
                      >
                        {truncateText(task.description, 80)}
                      </p>
                    )}
                  </div>

                  {/* Assignee and Due Date - Always at bottom */}
                  <div className="mt-auto mb-4">
                    {task.assigned_to && (
                      <div
                        className="flex items-center p-3 rounded-2xl border backdrop-blur-sm mb-2"
                        style={{
                          backgroundColor: "var(--color-background)",
                          borderColor: "var(--color-border)",
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center mr-3"
                          style={{ backgroundColor: "var(--color-primary)", opacity: 0.1 }}
                        >
                          <User size={16} style={{ color: "var(--color-primary)" }} />
                        </div>
                        <span
                          className="text-sm font-medium truncate"
                          style={{ color: "var(--color-text)" }}
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
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center mr-3"
                          style={{ backgroundColor: "var(--color-secondary)", opacity: 0.1 }}
                        >
                          <Calendar size={16} style={{ color: "var(--color-secondary)" }} />
                        </div>
                        <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                          {formatDateTimeShort(task.due_date)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div
                    className="flex items-center justify-between text-xs opacity-60 mb-4"
                    style={{ color: "var(--color-text)" }}
                  >
                    <span>Created {formatDateTimeShort(task.created_at)}</span>
                    {task.updated_at !== task.created_at && <span>Updated {formatDateTimeShort(task.updated_at)}</span>}
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
                        style={{ color: "var(--color-text)" }}
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
                          style={{ color: "var(--color-text)" }}
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
                        className="p-2 rounded-2xl border-2 border-[var(--color-border)] hover:bg-[var(--color-secondary)] hover:bg-opacity-10 transition-all duration-200"
                        style={{ color: "var(--color-text)" }}
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
                          style={{ color: "var(--color-text)" }}
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
                        style={{ color: "var(--color-text)" }}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-8">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-2xl border-2 border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:bg-opacity-10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style={{ color: "var(--color-text)" }}
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
                style={{ color: currentPage === page ? "var(--color-primary-foreground)" : undefined }}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-2xl border-2 border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:bg-opacity-10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style={{ color: "var(--color-text)" }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        <TaskFormModal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          onSuccess={() => {
            fetchTasks()
            fetchProject()
            queryClient.invalidateQueries({ queryKey: ["tasks"] })
          }}
          projectId={parseInt(projectId)}
        />
        <TaskEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            fetchTasks()
            fetchProject()
            queryClient.invalidateQueries({ queryKey: ["tasks"] })
          }}
          task={selectedTask}
        />

        {/* Archive Confirmation Modal */}
        {showArchiveModal && taskToArchive && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              className="bg-[var(--color-surface)] rounded-3xl border-2 border-[var(--color-border)] p-8 max-w-md w-full shadow-2xl"
              style={{ backgroundColor: "var(--color-surface)" }}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Archive size={32} className="text-yellow-500" />
                </div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
                  Archive Task
                </h3>
                <p className="text-lg opacity-70" style={{ color: "var(--color-text)" }}>
                  Are you sure you want to archive "{taskToArchive.title}"? You can restore it later from the archive.
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowArchiveModal(false)
                    setTaskToArchive(null)
                  }}
                  className="flex-1 px-6 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-2xl font-medium hover:bg-opacity-80 transition-all duration-200"
                  style={{ color: "var(--color-text)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={archiveTask}
                  className="flex-1 px-6 py-3 bg-yellow-500 text-white rounded-2xl font-medium hover:bg-yellow-600 transition-all duration-200"
                >
                  Archive
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && taskToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              className="bg-[var(--color-surface)] rounded-3xl border-2 border-[var(--color-border)] p-8 max-w-md w-full shadow-2xl"
              style={{ backgroundColor: "var(--color-surface)" }}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={32} className="text-red-500" />
                </div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
                  Delete Task
                </h3>
                <p className="text-lg opacity-70" style={{ color: "var(--color-text)" }}>
                  Are you sure you want to delete "{taskToDelete.title}"? This action cannot be undone.
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setTaskToDelete(null)
                  }}
                  className="flex-1 px-6 py-3 hover:bg-green-500 hover:bg-opacity-10 rounded-2xl border-2 border-[var(--color-border)] transition-all duration-200 font-medium"
                  style={{ color: "var(--color-text)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={deleteTask}
                  className="flex-1 px-6 py-3 hover:bg-red-500 hover:bg-opacity-10 rounded-2xl border-2 border-[var(--color-border)] transition-all duration-200 font-medium"
                  style={{ color: "var(--color-text)" }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Select Existing Task Modal */}
        {showSelectTaskModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              className="bg-[var(--color-surface)] rounded-3xl border-2 border-[var(--color-border)] max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
              style={{ backgroundColor: "var(--color-surface)" }}
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                      Select Existing Tasks
                    </h3>
                    <p className="text-lg opacity-70 mt-1" style={{ color: "var(--color-text)" }}>
                      Choose tasks to assign to "{project?.name}"
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowSelectTaskModal(false)
                      setSelectedTaskIds([])
                      setAvailableTasks([])
                    }}
                    className="p-2 rounded-2xl border-2 border-[var(--color-border)] hover:bg-[var(--color-background)] transition-all duration-200"
                    style={{ color: "var(--color-text)" }}
                  >
                    ✕
                  </button>
                </div>

                {loadingAvailableTasks ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <div className="animate-spin w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full mx-auto mb-4"></div>
                      <div className="text-lg font-medium" style={{ color: "var(--color-text)" }}>
                        Loading available tasks...
                      </div>
                    </div>
                  </div>
                ) : availableTasks.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-[var(--color-primary)] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[var(--color-border)]">
                      <FolderOpen className="w-12 h-12" style={{ color: "var(--color-primary)" }} />
                    </div>
                    <p className="text-xl mb-4 opacity-70" style={{ color: "var(--color-text)" }}>
                      No available tasks found
                    </p>
                    <p className="text-sm opacity-50" style={{ color: "var(--color-text)" }}>
                      All tasks are already assigned to projects or archived.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {availableTasks.map((task) => {
                        const isSelected = selectedTaskIds.includes(task.id)
                        return (
                        <div
                          key={task.id}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:text-white flex flex-col h-full ${
                            isSelected
                              ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                              : 'border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:bg-opacity-10'
                          }`}
                          onClick={() => handleSelectTask(task.id)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-lg min-w-0 flex-1">
                              {truncateText(task.title, 30)}
                            </h4>
                            <div className="relative ml-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleSelectTask(task.id)}
                                className="sr-only"
                              />
                              <div
                                className={`w-5 h-5 rounded-full border-2 cursor-pointer transition-all duration-200 flex items-center justify-center ${
                                  isSelected
                                    ? 'bg-white border-white'
                                    : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
                                }`}
                                onClick={() => handleSelectTask(task.id)}
                              >
                                {isSelected && (
                                  <div className="w-3 h-3 rounded-full bg-[var(--color-primary)]"></div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex-1">
                            {task.description && (
                              <p className="text-sm mb-3 opacity-70 hover:text-opacity-90">
                                {truncateText(task.description, 60)}
                              </p>
                            )}
                          </div>
                          <div className="mt-auto">
                            <div className="flex items-center justify-between text-xs opacity-60 hover:text-opacity-80">
                              <span>
                                Status: {task.status.replace("_", " ")}
                              </span>
                              <span>
                                Priority: {task.priority}
                              </span>
                            </div>
                            <div className="flex items-center text-xs opacity-60 hover:text-opacity-80 mt-1">
                              <span>Project: </span>
                              {task.project_name ? (
                                <div className="flex items-center ml-1">
                                  <div
                                    className="w-2 h-2 rounded-full mr-1"
                                    style={{ backgroundColor: task.project_color || "#6b7280" }}
                                  ></div>
                                  <span>{task.project_name}</span>
                                </div>
                              ) : (
                                <span className="ml-1 italic">Unassigned</span>
                              )}
                            </div>
                          </div>
                        </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-6 border-t-2 border-[var(--color-border)]">
                  <div className="text-sm opacity-70" style={{ color: "var(--color-text)" }}>
                    {selectedTaskIds.length} task{selectedTaskIds.length !== 1 ? 's' : ''} selected
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        setShowSelectTaskModal(false)
                        setSelectedTaskIds([])
                        setAvailableTasks([])
                      }}
                      className="px-6 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-2xl font-medium hover:bg-opacity-80 transition-all duration-200"
                      style={{ color: "var(--color-text)" }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={assignTasksToProject}
                      disabled={selectedTaskIds.length === 0}
                      className="px-6 py-3 bg-[var(--color-secondary)] text-white rounded-2xl font-medium hover:bg-[var(--color-secondary)] hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      style={{ backgroundColor: selectedTaskIds.length > 0 ? "var(--color-secondary)" : undefined }}
                    >
                      Assign to Project
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  )
}
