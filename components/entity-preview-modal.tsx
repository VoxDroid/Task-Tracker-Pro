"use client"

import type { CSSProperties } from "react"
import { useState, useEffect } from "react"
import Modal from "@/components/modal"
import MarkdownRenderer from "@/components/markdown-renderer"
import type { Task, Project, TimeEntry } from "@/lib/types"
import { Calendar, FolderOpen, User, Star, Clock, AlertCircle, MapPin, XCircle } from "lucide-react"
import { formatDateTime } from "@/components/datetime-picker"

interface EntityPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  entityType: "task" | "project" | "time_entry"
  entityData: Task | Project | TimeEntry | null
  loading?: boolean
  onLocate?: () => void
}

export default function EntityPreviewModal({ isOpen, onClose, entityType, entityData, loading = false, onLocate }: EntityPreviewModalProps) {
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    if (isOpen && entityType === "task") {
      fetchProjects()
    }
  }, [isOpen, entityType])

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

  if (!entityData) return null

  const getTitle = () => {
    switch (entityType) {
      case "task":
        return (entityData as Task).title
      case "project":
        return (entityData as Project).name
      case "time_entry":
        return "Time Entry"
      default:
        return "Entity Preview"
    }
  }

  const renderEntityContent = () => {
    switch (entityType) {
      case "task":
        return renderTaskContent()
      case "project":
        return renderProjectContent()
      case "time_entry":
        return renderTimeEntryContent()
      default:
        return null
    }
  }

  const renderTaskContent = () => {
    const task = entityData as Task
    const project = projects.find((p) => p.id === task.project_id)

    const priorityConfig = {
      low: { bg: "var(--color-accent)", text: "var(--color-accent-foreground)", label: "Low Priority" },
      medium: { bg: "var(--color-warning)", text: "var(--color-warning-foreground)", label: "Medium Priority" },
      high: { bg: "var(--color-secondary)", text: "var(--color-secondary-foreground)", label: "High Priority" },
      urgent: { bg: "var(--color-destructive)", text: "var(--color-destructive-foreground)", label: "Urgent Priority" },
    }

    const statusConfig = {
      todo: { bg: "var(--color-primary)", text: "var(--color-primary-foreground)", label: "To Do" },
      in_progress: { bg: "var(--color-secondary)", text: "var(--color-secondary-foreground)", label: "In Progress" },
      completed: { bg: "var(--color-accent)", text: "var(--color-accent-foreground)", label: "Completed" },
      archived: { bg: "var(--color-muted)", text: "var(--color-muted-foreground)", label: "Archived" },
    }

    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <h2 className="text-2xl font-bold truncate" style={{ color: "var(--color-text)" } as CSSProperties} title={task.title}>
                {task.title}
              </h2>
              {task.is_favorite === 1 && <Star className="w-6 h-6 flex-shrink-0" style={{ fill: "var(--color-accent)", color: "var(--color-accent)" } as CSSProperties} />}
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <span
                className="px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap"
                style={{
                  backgroundColor: statusConfig[task.status].bg,
                  color: statusConfig[task.status].text,
                } as CSSProperties}
              >
                {statusConfig[task.status].label}
              </span>
              <span
                className="px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap"
                style={{
                  backgroundColor: priorityConfig[task.priority].bg,
                  color: priorityConfig[task.priority].text,
                } as CSSProperties}
              >
                {priorityConfig[task.priority].label}
              </span>
            </div>
          </div>

          {task.description && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: "var(--color-background)",
                border: "2px solid var(--color-border)",
                maxHeight: "350px",
                minHeight: "150px"
              } as CSSProperties}
            >
              <div className="p-5 overflow-y-auto h-full" style={{ maxHeight: "346px" } as CSSProperties}>
                <MarkdownRenderer content={task.description} className="text-base opacity-90" />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {project && (
            <div className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: "var(--color-primary)" } as CSSProperties}
              />
              <FolderOpen className="w-5 h-5 opacity-60" style={{ color: "var(--color-text)" } as CSSProperties} />
              <span className="font-medium" style={{ color: "var(--color-text)" } as CSSProperties}>
                {project.name}
              </span>
            </div>
          )}

          {task.assigned_to && (
            <div className="flex items-start space-x-3">
              <User className="w-5 h-5 opacity-60 flex-shrink-0 mt-0.5" style={{ color: "var(--color-text)" } as CSSProperties} />
              <span className="font-medium line-clamp-2" style={{ color: "var(--color-text)" } as CSSProperties}>
                {task.assigned_to}
              </span>
            </div>
          )}

          {task.due_date && (
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 opacity-60" style={{ color: "var(--color-text)" } as CSSProperties} />
              <span className="font-medium" style={{ color: "var(--color-text)" } as CSSProperties}>
                Due: {formatDateTime(task.due_date)}
              </span>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 opacity-60" style={{ color: "var(--color-text)" } as CSSProperties} />
            <span className="font-medium" style={{ color: "var(--color-text)" } as CSSProperties}>
              Created: {formatDateTime(task.created_at)}
            </span>
          </div>

          {task.completed_at && (
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 opacity-60" style={{ color: "var(--color-text)" } as CSSProperties} />
              <span className="font-medium" style={{ color: "var(--color-text)" } as CSSProperties}>
                Completed: {formatDateTime(task.completed_at)}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderProjectContent = () => {
    const project = entityData as Project

    const statusConfig = {
      active: { bg: "var(--color-primary)", text: "var(--color-primary-foreground)", label: "Active" },
      completed: { bg: "var(--color-accent)", text: "var(--color-accent-foreground)", label: "Completed" },
      archived: { bg: "var(--color-muted)", text: "var(--color-muted-foreground)", label: "Archived" },
      on_hold: { bg: "var(--color-secondary)", text: "var(--color-secondary-foreground)", label: "On Hold" },
    }

    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <h2 className="text-2xl font-bold truncate" style={{ color: "var(--color-text)" } as CSSProperties} title={project.name}>
                {project.name}
              </h2>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <span
                className="px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap"
                style={{
                  backgroundColor: statusConfig[project.status].bg,
                  color: statusConfig[project.status].text,
                } as CSSProperties}
              >
                {statusConfig[project.status].label}
              </span>
            </div>
          </div>

          {project.description && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: "var(--color-background)",
                border: "2px solid var(--color-border)",
                maxHeight: "350px",
                minHeight: "150px"
              } as CSSProperties}
            >
              <div className="p-5 overflow-y-auto h-full" style={{ maxHeight: "346px" } as CSSProperties}>
                <MarkdownRenderer content={project.description} className="text-base opacity-90" />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 opacity-60" style={{ color: "var(--color-text)" } as CSSProperties} />
            <span className="font-medium" style={{ color: "var(--color-text)" } as CSSProperties}>
              Created: {formatDateTime(project.created_at)}
            </span>
          </div>

          {project.updated_at && (
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 opacity-60" style={{ color: "var(--color-text)" } as CSSProperties} />
              <span className="font-medium" style={{ color: "var(--color-text)" } as CSSProperties}>
                Updated: {formatDateTime(project.updated_at)}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderTimeEntryContent = () => {
    const timeEntry = entityData as TimeEntry

    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" } as CSSProperties}>
                Time Entry
              </h2>
            </div>
          </div>

          {timeEntry.description && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: "var(--color-background)",
                border: "2px solid var(--color-border)",
                maxHeight: "350px",
                minHeight: "150px"
              } as CSSProperties}
            >
              <div className="p-5 overflow-y-auto h-full" style={{ maxHeight: "346px" } as CSSProperties}>
                <MarkdownRenderer content={timeEntry.description} className="text-base opacity-90" />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {timeEntry.duration && (
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 opacity-60" style={{ color: "var(--color-text)" } as CSSProperties} />
              <span className="font-medium" style={{ color: "var(--color-text)" } as CSSProperties}>
                Duration: {Math.floor(timeEntry.duration / 60)}m {timeEntry.duration % 60}s
              </span>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 opacity-60" style={{ color: "var(--color-text)" } as CSSProperties} />
            <span className="font-medium" style={{ color: "var(--color-text)" } as CSSProperties}>
              Start: {formatDateTime(timeEntry.start_time)}
            </span>
          </div>

          {timeEntry.end_time && (
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 opacity-60" style={{ color: "var(--color-text)" } as CSSProperties} />
              <span className="font-medium" style={{ color: "var(--color-text)" } as CSSProperties}>
                End: {formatDateTime(timeEntry.end_time)}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${entityType.charAt(0).toUpperCase() + entityType.slice(1).replace("_", " ")} Preview`} size="2xl">
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
            <span className="ml-3" style={{ color: "var(--color-text)" }}>Loading...</span>
          </div>
        ) : entityData ? (
          <>
            {renderEntityContent()}

            <div className="flex justify-end space-x-3 pt-6 border-t" style={{ borderColor: "var(--color-border)" } as CSSProperties}>
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-medium transition-all duration-200 border-2"
                style={{
                  backgroundColor: "var(--color-background)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                } as CSSProperties}
              >
                Close
              </button>

              {onLocate && (
                <button
                  onClick={onLocate}
                  className="px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2"
                  style={{
                    backgroundColor: "var(--color-primary)",
                    color: "var(--color-primary-foreground)",
                  } as CSSProperties}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--color-primary)";
                    e.currentTarget.style.opacity = "0.8";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--color-primary)";
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  <MapPin className="w-4 h-4" />
                  <span>Locate</span>
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <XCircle className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: "var(--color-text)" }} />
            <p className="text-lg font-medium mb-2" style={{ color: "var(--color-text)" }}>
              Item Not Found
            </p>
            <p className="text-sm opacity-70" style={{ color: "var(--color-text)" }}>
              This {entityType.replace("_", " ")} may have been deleted.
            </p>
            <div className="flex justify-center mt-6">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-medium transition-all duration-200 border-2"
                style={{
                  backgroundColor: "var(--color-background)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                } as CSSProperties}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}