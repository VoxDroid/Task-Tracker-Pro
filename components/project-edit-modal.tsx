"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Modal from "./modal"
import { useNotification } from "./notification"

interface ProjectEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  project: any
}

export default function ProjectEditModal({ isOpen, onClose, onSuccess, project }: ProjectEditModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active",
  })
  const [loading, setLoading] = useState(false)
  const { addNotification } = useNotification()

  useEffect(() => {
    if (isOpen && project) {
      setFormData({
        name: project.name,
        description: project.description || "",
        status: project.status,
      })
    }
  }, [isOpen, project])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project) return

    setLoading(true)

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          color: "var(--color-primary)"
        }),
      })

      if (response.ok) {
        addNotification({
          type: "success",
          title: "Project Updated",
          message: `Project "${formData.name}" has been updated successfully.`,
        })
        onSuccess()
        onClose()
      } else {
        throw new Error("Failed to update project")
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to update project. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!project) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Project">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>Project Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-colors"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
              backgroundColor: "var(--color-background)",
              "--tw-ring-color": "var(--color-primary)"
            } as React.CSSProperties}
            placeholder="Enter project name"
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
              color: "var(--color-text)",
              backgroundColor: "var(--color-background)",
              "--tw-ring-color": "var(--color-primary)"
            } as React.CSSProperties}
            placeholder="Enter project description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-colors"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
              backgroundColor: "var(--color-background)"
            }}
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="flex justify-end pt-4" style={{ borderTop: "2px solid var(--color-border)" }}>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl border-2 transition-colors font-medium"
              style={{
                color: "var(--color-text)",
                backgroundColor: "var(--color-background)",
                borderColor: "var(--color-border)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-primary)"
                e.currentTarget.style.color = "var(--color-primary-foreground)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-background)"
                e.currentTarget.style.color = "var(--color-text)"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl border-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                color: "var(--color-secondary-foreground)",
                backgroundColor: "var(--color-secondary)",
                borderColor: "var(--color-border)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.8"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1"
              }}
            >
              {loading ? "Updating..." : "Update Project"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
