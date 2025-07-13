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

const projectColors = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#84cc16"]

export default function ProjectEditModal({ isOpen, onClose, onSuccess, project }: ProjectEditModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#6366f1",
    status: "active",
  })
  const [loading, setLoading] = useState(false)
  const { addNotification } = useNotification()

  useEffect(() => {
    if (isOpen && project) {
      setFormData({
        name: project.name,
        description: project.description || "",
        color: project.color,
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
        body: JSON.stringify(formData),
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Project Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Enter project name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
            placeholder="Enter project description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
          <div className="flex flex-wrap gap-3">
            {projectColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`w-10 h-10 rounded-xl border-2 transition-all ${
                  formData.color === color ? "border-black scale-110 shadow-lg" : "border-gray-300 hover:scale-105"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t-2 border-gray-100">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl border-2 border-black hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-purple-100 text-purple-800 rounded-xl border-2 border-black hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? "Updating..." : "Update Project"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
