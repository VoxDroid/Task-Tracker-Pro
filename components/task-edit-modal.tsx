"use client"

import type React from "react"
import type { CSSProperties } from "react"
import { useState, useEffect } from "react"
import Modal from "./modal"
import { useNotification } from "./notification"
import DateTimePicker from "@/components/datetime-picker"
import RichTextEditor from "@/components/rich-text-editor"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
        project_id: task.project_id?.toString() || "none",
        priority: task.priority,
        assigned_to: task.assigned_to || "",
        due_date: task.due_date ? task.due_date.slice(0, 16) : "",
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
          project_id: formData.project_id && formData.project_id !== "none" ? Number.parseInt(formData.project_id) : null,
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
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Task" size="2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" } as CSSProperties}>Title *</label>
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
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" } as CSSProperties}>Description</label>
          <RichTextEditor
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
            placeholder="Enter task description... (supports Markdown)"
            minHeight={150}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" } as CSSProperties}>Status</label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger 
                className="w-full h-12 rounded-xl border-2"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                  backgroundColor: "var(--color-background)",
                } as CSSProperties}
              >
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent 
                className="rounded-xl"
                style={{ 
                  backgroundColor: "var(--color-surface)", 
                  borderColor: "var(--color-border)" 
                } as CSSProperties}
              >
                <SelectItem value="todo" className="rounded-lg cursor-pointer">To Do</SelectItem>
                <SelectItem value="in_progress" className="rounded-lg cursor-pointer">In Progress</SelectItem>
                <SelectItem value="completed" className="rounded-lg cursor-pointer">Completed</SelectItem>
                <SelectItem value="archived" className="rounded-lg cursor-pointer">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" } as CSSProperties}>Project</label>
            <Select value={formData.project_id} onValueChange={(value) => setFormData({ ...formData, project_id: value })}>
              <SelectTrigger 
                className="w-full h-12 rounded-xl border-2"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                  backgroundColor: "var(--color-background)",
                } as CSSProperties}
              >
                <SelectValue placeholder="No Project" />
              </SelectTrigger>
              <SelectContent 
                className="rounded-xl"
                style={{ 
                  backgroundColor: "var(--color-surface)", 
                  borderColor: "var(--color-border)" 
                } as CSSProperties}
              >
                <SelectItem value="none" className="rounded-lg cursor-pointer">No Project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()} className="rounded-lg cursor-pointer">
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" } as CSSProperties}>Priority</label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
              <SelectTrigger 
                className="w-full h-12 rounded-xl border-2"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                  backgroundColor: "var(--color-background)",
                } as CSSProperties}
              >
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent 
                className="rounded-xl"
                style={{ 
                  backgroundColor: "var(--color-surface)", 
                  borderColor: "var(--color-border)" 
                } as CSSProperties}
              >
                <SelectItem value="low" className="rounded-lg cursor-pointer">Low</SelectItem>
                <SelectItem value="medium" className="rounded-lg cursor-pointer">Medium</SelectItem>
                <SelectItem value="high" className="rounded-lg cursor-pointer">High</SelectItem>
                <SelectItem value="urgent" className="rounded-lg cursor-pointer">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" } as CSSProperties}>Assigned To</label>
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
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" } as CSSProperties}>Due Date & Time</label>
            <DateTimePicker
              value={formData.due_date}
              onChange={(value) => setFormData({ ...formData, due_date: value })}
              placeholder="Select due date and time"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t-2" style={{ borderColor: "var(--color-border)" } as CSSProperties}>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl border-2 hover:bg-[var(--color-background)] transition-colors font-medium"
              style={{
                color: "var(--color-text)",
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
              } as CSSProperties}
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
              } as CSSProperties}
            >
              {loading ? "Updating..." : "Update Task"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
