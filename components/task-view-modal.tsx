"use client"

import type { CSSProperties } from "react"
import { useState, useEffect } from "react"
import { useNotification } from "@/components/notification"
import Modal from "@/components/modal"
import MarkdownRenderer from "@/components/markdown-renderer"
import type { Task, Project } from "@/lib/types"
import { Calendar, FolderOpen, User, Star, Clock, AlertCircle, Edit, Archive, RotateCcw } from "lucide-react"
import { formatDateTime } from "@/components/datetime-picker"

interface TaskViewModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  task: Task | null
  onRestore?: (taskId: number, taskTitle: string) => void
  onEdit?: (task: Task) => void
  onArchive?: (task: Task) => void
}

export default function TaskViewModal({ isOpen, onClose, onSuccess, task, onRestore, onEdit, onArchive }: TaskViewModalProps) {
  const [projects, setProjects] = useState<Project[]>([])
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
    if (!task || !onEdit) return
    onEdit(task)
    onClose()
  }

  const handleArchive = () => {
    if (!task || !onArchive) return
    onArchive(task)
    onClose()
  }

  const handleRestore = async () => {
    if (!task || !onRestore) return
    onRestore(task.id, task.title)
    onClose()
  }

  if (!task) return null

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

  const project = projects.find((p) => p.id === task.project_id)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Task Details" size="2xl">
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

          {task.status === "archived" && onRestore ? (
            <button
              onClick={handleRestore}
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
              <RotateCcw className="w-4 h-4" />
              <span>Restore</span>
            </button>
          ) : (
            <>
              {onEdit && (
                <button
                  onClick={handleEdit}
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
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              )}

              {onArchive && (
                <button
                  onClick={handleArchive}
                  className="px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2"
                  style={{
                    backgroundColor: "var(--color-secondary)",
                    color: "var(--color-secondary-foreground)",
                  } as CSSProperties}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--color-secondary)";
                    e.currentTarget.style.opacity = "0.8";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--color-secondary)";
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  <Archive className="w-4 h-4" />
                  <span>Archive</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}
