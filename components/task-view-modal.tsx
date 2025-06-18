"use client"

import { useState, useEffect } from "react"
import { useNotification } from "@/components/notification"
import Modal from "@/components/modal"
import type { Task, Project } from "@/lib/types"
import { Calendar, FolderOpen, User, Star, Clock, AlertCircle, Edit, Archive, RotateCcw } from "lucide-react"

interface TaskViewModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  task: Task | null
  onRestore?: (taskId: number, taskTitle: string) => void
}

export default function TaskViewModal({ isOpen, onClose, onSuccess, task, onRestore }: TaskViewModalProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [showEditModal, setShowEditModal] = useState(false)
  const { addNotification } = useNotification()

  useEffect(() => {
    if (isOpen) {
      fetchProjects()
    }
  }, [isOpen])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      const data = await response.json()
      setProjects(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching projects:", error)
      setProjects([])
    }
  }

  const handleEdit = () => {
    setShowEditModal(true)
    onClose()
  }

  const handleArchive = async () => {
    if (!task) return

    if (!confirm(`Are you sure you want to archive "${task.title}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      })

      if (response.ok) {
        addNotification({
          type: "success",
          title: "Task Archived",
          message: `"${task.title}" has been archived successfully.`,
        })
        onSuccess()
        onClose()
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to archive task. Please try again.",
      })
    }
  }

  const handleRestore = async () => {
    if (!task || !onRestore) return
    onRestore(task.id, task.title)
    onClose()
  }

  if (!task) return null

  const priorityConfig = {
    low: { bg: "bg-green-500", text: "text-white", label: "Low Priority" },
    medium: { bg: "bg-yellow-500", text: "text-white", label: "Medium Priority" },
    high: { bg: "bg-orange-500", text: "text-white", label: "High Priority" },
    urgent: { bg: "bg-red-500", text: "text-white", label: "Urgent Priority" },
  }

  const statusConfig = {
    todo: { bg: "bg-gray-500", text: "text-white", label: "To Do" },
    in_progress: { bg: "bg-blue-500", text: "text-white", label: "In Progress" },
    completed: { bg: "bg-green-500", text: "text-white", label: "Completed" },
    archived: { bg: "bg-gray-400", text: "text-white", label: "Archived" },
  }

  const project = projects.find((p) => p.id === task.project_id)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Task Details" size="lg">
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                {task.title}
              </h2>
              {task.is_favorite === 1 && <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />}
            </div>

            {task.description && (
              <p className="text-lg mb-6 opacity-80" style={{ color: "var(--color-text)" }}>
                {task.description}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig[task.status].bg} ${statusConfig[task.status].text}`}
            >
              {statusConfig[task.status].label}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${priorityConfig[task.priority].bg} ${priorityConfig[task.priority].text}`}
            >
              {priorityConfig[task.priority].label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {project && (
            <div className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: project.color }}
              />
              <FolderOpen className="w-5 h-5 opacity-60" style={{ color: "var(--color-text)" }} />
              <span className="font-medium" style={{ color: "var(--color-text)" }}>
                {project.name}
              </span>
            </div>
          )}

          {task.assigned_to && (
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 opacity-60" style={{ color: "var(--color-text)" }} />
              <span className="font-medium" style={{ color: "var(--color-text)" }}>
                {task.assigned_to}
              </span>
            </div>
          )}

          {task.due_date && (
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 opacity-60" style={{ color: "var(--color-text)" }} />
              <span className="font-medium" style={{ color: "var(--color-text)" }}>
                Due: {new Date(task.due_date).toLocaleDateString()}
              </span>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 opacity-60" style={{ color: "var(--color-text)" }} />
            <span className="font-medium" style={{ color: "var(--color-text)" }}>
              Created: {new Date(task.created_at).toLocaleDateString()}
            </span>
          </div>

          {task.completed_at && (
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 opacity-60" style={{ color: "var(--color-text)" }} />
              <span className="font-medium" style={{ color: "var(--color-text)" }}>
                Completed: {new Date(task.completed_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t" style={{ borderColor: "var(--color-border)" }}>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-medium transition-all duration-200 border-2"
            style={{
              backgroundColor: "var(--color-background)",
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
            }}
          >
            Close
          </button>

          {task.status === "archived" && onRestore ? (
            <button
              onClick={handleRestore}
              className="px-6 py-3 rounded-xl font-medium transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restore</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleEdit}
                className="px-6 py-3 rounded-xl font-medium transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>

              <button
                onClick={handleArchive}
                className="px-6 py-3 rounded-xl font-medium transition-all duration-200 bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
              >
                <Archive className="w-4 h-4" />
                <span>Archive</span>
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}
