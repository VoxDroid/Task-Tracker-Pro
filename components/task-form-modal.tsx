"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNotification } from "@/components/notification"
import Modal from "@/components/modal"
import type { Task, Project } from "@/lib/types"
import { Calendar, FolderOpen, User, Star, AlertCircle, Check } from "lucide-react"

interface TaskFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  task?: Task | null
  projectId?: number
}

export default function TaskFormModal({ isOpen, onClose, onSuccess, task, projectId }: TaskFormModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project_id: projectId || 0,
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    assigned_to: "",
    due_date: "",
    is_favorite: false,
  })
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const { addNotification } = useNotification()

  useEffect(() => {
    if (isOpen) {
      fetchProjects()
      if (task) {
        setFormData({
          title: task.title,
          description: task.description || "",
          project_id: task.project_id || 0,
          priority: task.priority,
          assigned_to: task.assigned_to || "",
          due_date: task.due_date ? task.due_date.split("T")[0] : "",
          is_favorite: task.is_favorite === 1,
        })
      } else {
        setFormData({
          title: "",
          description: "",
          project_id: projectId || 0,
          priority: "medium",
          assigned_to: "",
          due_date: "",
          is_favorite: false,
        })
      }
    }
  }, [isOpen, task, projectId])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      addNotification({
        type: "error",
        title: "Validation Error",
        message: "Task title is required.",
      })
      return
    }

    setLoading(true)
    try {
      const submitData = {
        ...formData,
        project_id: formData.project_id || null,
        due_date: formData.due_date || null,
        assigned_to: formData.assigned_to || null,
        description: formData.description || null,
        is_favorite: formData.is_favorite ? 1 : 0,
      }

      const url = task ? `/api/tasks/${task.id}` : "/api/tasks"
      const method = task ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        addNotification({
          type: "success",
          title: task ? "Task Updated" : "Task Created",
          message: task
            ? `"${formData.title}" has been updated successfully.`
            : `"${formData.title}" has been created successfully.`,
        })
        onSuccess()
        onClose()
      } else {
        throw new Error("Failed to save task")
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: task ? "Failed to update task. Please try again." : "Failed to create task. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const priorityOptions = [
    { value: "low", label: "Low Priority", color: "text-green-600" },
    { value: "medium", label: "Medium Priority", color: "text-yellow-600" },
    { value: "high", label: "High Priority", color: "text-orange-600" },
    { value: "urgent", label: "Urgent Priority", color: "text-red-600" },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task ? "Edit Task" : "Create New Task"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>
            Task Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border-2 border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-background)]"
            style={{ color: "var(--color-text)" }}
            placeholder="Enter task title..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border-2 border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-background)] min-h-[100px]"
            style={{ color: "var(--color-text)" }}
            placeholder="Enter task description..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>
              <FolderOpen className="inline w-4 h-4 mr-1" />
              Project
            </label>
            <select
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: Number.parseInt(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl border-2 border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-background)]"
              style={{ color: "var(--color-text)" }}
            >
              <option value={0}>No Project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>
              <AlertCircle className="inline w-4 h-4 mr-1" />
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              className="w-full px-4 py-3 rounded-xl border-2 border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-background)]"
              style={{ color: "var(--color-text)" }}
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>
              <User className="inline w-4 h-4 mr-1" />
              Assigned To
            </label>
            <input
              type="text"
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-background)]"
              style={{ color: "var(--color-text)" }}
              placeholder="Enter assignee name..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>
              <Calendar className="inline w-4 h-4 mr-1" />
              Due Date
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-background)]"
              style={{ color: "var(--color-text)" }}
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, is_favorite: !formData.is_favorite })}
            className={`flex-shrink-0 relative w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
              formData.is_favorite
                ? "bg-[var(--color-primary)] border-[var(--color-primary)] scale-110 shadow-lg"
                : "border-[var(--color-border)] hover:border-[var(--color-primary)] hover:scale-110"
            }`}
          >
            {formData.is_favorite && (
              <Check className="w-4 h-4 text-white animate-in fade-in duration-200" />
            )}
          </button>
          <label className="flex items-center space-x-2 cursor-pointer" style={{ color: "var(--color-text)" }} onClick={() => setFormData({ ...formData, is_favorite: !formData.is_favorite })}>
            <Star className="w-4 h-4" />
            <span>Mark as favorite</span>
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t" style={{ borderColor: "var(--color-border)" }}>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-medium transition-all duration-200 border-2"
            style={{
              backgroundColor: "var(--color-background)",
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl font-medium transition-all duration-200 bg-[var(--color-primary)] hover:opacity-90 text-white disabled:opacity-50"
          >
            {loading ? "Saving..." : task ? "Update Task" : "Create Task"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
