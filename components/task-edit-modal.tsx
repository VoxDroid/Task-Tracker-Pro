"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Modal from "./modal"
import { useNotification } from "./notification"
import type { Task } from "@/lib/types"

interface TaskEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  task: Task | null
}

export default function TaskEditModal({ isOpen, onClose, onSuccess, task }: TaskEditModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project_id: "",
    priority: "medium",
    assigned_to: "",
    due_date: "",
    status: "todo",
  })
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { addNotification } = useNotification()

  useEffect(() => {
    if (isOpen && task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        project_id: task.project_id?.toString() || "",
        priority: task.priority,
        assigned_to: task.assigned_to || "",
        due_date: task.due_date ? task.due_date.split("T")[0] : "",
        status: task.status,
      })
      fetchProjects()
    }
  }, [isOpen, task])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error("Error fetching projects:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!task) return

    setLoading(true)

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          project_id: formData.project_id ? Number.parseInt(formData.project_id) : null,
        }),
      })

      if (response.ok) {
        addNotification({
          type: "success",
          title: "Task Updated",
          message: `Task "${formData.title}" has been updated successfully.`,
        })
        onSuccess()
        onClose()
      } else {
        throw new Error("Failed to update task")
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to update task. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!task) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Task" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>Title *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-colors"
            style={{
              borderColor: "var(--color-border)",
              "--tw-ring-color": "var(--color-primary)",
            } as React.CSSProperties}
            placeholder="Enter task title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-colors resize-none"
            style={{
              borderColor: "var(--color-border)",
              "--tw-ring-color": "var(--color-primary)",
            } as React.CSSProperties}
            placeholder="Enter task description"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-colors"
              style={{
                borderColor: "var(--color-border)",
                "--tw-ring-color": "var(--color-primary)",
                color: "var(--color-text)",
                backgroundColor: "var(--color-background)",
              } as React.CSSProperties}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>Project</label>
            <select
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-colors"
              style={{
                borderColor: "var(--color-border)",
                "--tw-ring-color": "var(--color-primary)",
                color: "var(--color-text)",
                backgroundColor: "var(--color-background)",
              } as React.CSSProperties}
            >
              <option value="">No Project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-colors"
              style={{
                borderColor: "var(--color-border)",
                "--tw-ring-color": "var(--color-primary)",
                color: "var(--color-text)",
                backgroundColor: "var(--color-background)",
              } as React.CSSProperties}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>Assigned To</label>
            <input
              type="text"
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-colors"
              style={{
                borderColor: "var(--color-border)",
                "--tw-ring-color": "var(--color-primary)",
                color: "var(--color-text)",
                backgroundColor: "var(--color-background)",
              } as React.CSSProperties}
              placeholder="Enter assignee name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>Due Date</label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-colors"
              style={{
                borderColor: "var(--color-border)",
                "--tw-ring-color": "var(--color-primary)",
                color: "var(--color-text)",
                backgroundColor: "var(--color-background)",
              } as React.CSSProperties}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t-2" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl border-2 hover:bg-[var(--color-background)] transition-colors font-medium"
              style={{
                color: "var(--color-text)",
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl border-2 hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--color-primary-foreground)",
                borderColor: "var(--color-border)",
              }}
            >
              {loading ? "Updating..." : "Update Task"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
