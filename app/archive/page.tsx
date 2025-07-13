"use client"

import { useEffect, useState } from "react"
import Sidebar from "@/components/sidebar"
import { useNotification } from "@/components/notification"
import type { Task } from "@/lib/types"
import { Archive, RotateCcw, Trash2, Search, Calendar, FolderOpen, User, ChevronLeft, ChevronRight } from "lucide-react"
import TaskViewModal from "@/components/task-view-modal"

const ITEMS_PER_PAGE = 6

export default function ArchivePage() {
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const { addNotification } = useNotification()

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
          task.project_name?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredTasks(filtered)
    setCurrentPage(1)
  }, [archivedTasks, searchQuery])

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

  const priorityConfig = {
    low: { bg: "bg-green-500", text: "text-white", label: "Low" },
    medium: { bg: "bg-yellow-500", text: "text-white", label: "Medium" },
    high: { bg: "bg-orange-500", text: "text-white", label: "High" },
    urgent: { bg: "bg-red-500", text: "text-white", label: "Urgent" },
  }

  if (loading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full mx-auto mb-4"></div>
            <div className="text-lg font-medium" style={{ color: "var(--color-text)" }}>
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
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-2 flex items-center" style={{ color: "var(--color-text)" }}>
            <Archive className="mr-4" />
            Archive
          </h1>
          <p className="text-xl opacity-70" style={{ color: "var(--color-text)" }}>
            Manage your archived tasks
          </p>
        </div>

        <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-70 mb-1" style={{ color: "var(--color-text)" }}>
                Archived Tasks
              </p>
              <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                {filteredTasks.length}
              </p>
            </div>
            <Archive className="w-8 h-8 text-gray-500" />
          </div>
        </div>

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
              placeholder="Search archived tasks..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-colors bg-[var(--color-background)]"
              style={{ color: "var(--color-text)" }}
            />
          </div>
        </div>

        <div className="space-y-6 mb-8">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-500 bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[var(--color-border)]">
                <Archive className="w-12 h-12 opacity-40" style={{ color: "var(--color-text)" }} />
              </div>
              <p className="text-xl mb-2 opacity-70" style={{ color: "var(--color-text)" }}>
                {searchQuery ? `No archived tasks found for "${searchQuery}"` : "No archived tasks"}
              </p>
              <p className="text-lg opacity-50" style={{ color: "var(--color-text)" }}>
                Tasks you archive will appear here
              </p>
            </div>
          ) : (
            getCurrentPageTasks().map((task) => (
              <div
                key={task.id}
                className="p-8 rounded-2xl border-2 border-[var(--color-border)] shadow-lg opacity-75 hover:opacity-100 hover:shadow-xl hover:transform hover:scale-[1.02] transition-all duration-200 cursor-pointer"
                style={{ backgroundColor: "var(--color-surface)" }}
                onClick={() => {
                  setSelectedTask(task)
                  setShowViewModal(true)
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
                        {task.title}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${priorityConfig[task.priority].bg} ${priorityConfig[task.priority].text}`}
                      >
                        {priorityConfig[task.priority].label}
                      </span>
                    </div>
                    {task.description && (
                      <p className="mb-4 text-lg opacity-80" style={{ color: "var(--color-text)" }}>
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 mb-4">
                      {task.project_name && (
                        <div className="flex items-center bg-[var(--color-background)] px-3 py-2 rounded-xl border border-[var(--color-border)]">
                          <FolderOpen size={16} style={{ color: "var(--color-text)" }} />
                          <span className="ml-2 font-medium text-sm" style={{ color: "var(--color-text)" }}>
                            {task.project_name}
                          </span>
                        </div>
                      )}
                      {task.assigned_to && (
                        <div className="flex items-center bg-[var(--color-background)] px-3 py-2 rounded-xl border border-[var(--color-border)]">
                          <User size={16} style={{ color: "var(--color-text)" }} />
                          <span className="ml-2 font-medium text-sm" style={{ color: "var(--color-text)" }}>
                            {task.assigned_to}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center bg-[var(--color-background)] px-3 py-2 rounded-xl border border-[var(--color-border)]">
                        <Calendar size={16} style={{ color: "var(--color-text)" }} />
                        <span className="ml-2 font-medium text-sm" style={{ color: "var(--color-text)" }}>
                          Archived on {new Date(task.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        restoreTask(task.id, task.title)
                      }}
                      className="p-3 hover:bg-blue-500 hover:bg-opacity-10 rounded-xl transition-all duration-200"
                      style={{ color: "var(--color-text)" }}
                      title="Restore Task"
                    >
                      <RotateCcw size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setTaskToDelete(task)
                        setShowDeleteModal(true)
                      }}
                      className="p-3 hover:bg-red-500 hover:bg-opacity-10 rounded-xl transition-all duration-200"
                      style={{ color: "var(--color-text)" }}
                      title="Delete Task"
                    >
                      <Trash2 size={18} />
                    </button>
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
                className={`px-4 py-2 rounded-xl border-2 border-[var(--color-border)] font-medium transition-all duration-200 ${
                  currentPage === page
                    ? "bg-[var(--color-primary)] bg-opacity-20 shadow-lg"
                    : "hover:bg-[var(--color-primary)] hover:bg-opacity-10"
                }`}
                style={{ color: "var(--color-text)" }}
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

        {/* Delete Confirmation Modal */}
        {showDeleteModal && taskToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div
              className="p-8 rounded-3xl border-2 shadow-2xl max-w-md w-full mx-4 animate-in slide-in-from-bottom-4 duration-300"
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
                    className="flex-1 px-4 py-3 hover:bg-red-600 hover:text-white rounded-2xl border-2 border-[var(--color-border)] transition-all duration-200 font-medium"
                    style={{ color: "var(--color-text)" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deleteTask}
                    className="flex-1 px-4 py-3 hover:bg-gray-600 hover:text-white rounded-2xl border-2 border-[var(--color-border)] transition-all duration-200 font-medium"
                    style={{ color: "var(--color-text)" }}
                  >
                    Delete
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
          onRestore={restoreTask}
        />
      </div>
    </Sidebar>
  )
}
