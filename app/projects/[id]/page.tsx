"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Sidebar from "@/components/sidebar"
import TaskFormModal from "@/components/task-form-modal"
import TaskEditModal from "@/components/task-edit-modal"
import { useNotification } from "@/components/notification"
import { ArrowLeft, Plus, Calendar, User, CheckCircle, Clock, AlertTriangle } from "lucide-react"

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string
  const [project, setProject] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const { addNotification } = useNotification()

  useEffect(() => {
    fetchProject()
    fetchTasks()
  }, [projectId])

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
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to update task. Please try again.",
      })
    }
  }

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
              style={{ color: "var(--color-text)" }}
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
                style={{ backgroundColor: project.color }}
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
          <button
            onClick={() => setShowTaskModal(true)}
            className="flex items-center px-6 py-3 rounded-2xl border-2 border-[var(--color-border)] hover:shadow-lg hover:transform hover:scale-105 transition-all duration-200 font-medium"
            style={{
              backgroundColor: `${project.color}20`,
              color: "var(--color-text)",
            }}
          >
            <Plus size={20} />
            <span className="ml-2">Add Task</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div
            className="p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg"
            style={{ backgroundColor: `${project.color}20` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80 mb-1" style={{ color: "var(--color-text)" }}>
                  To Do
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                  {todoTasks}
                </p>
              </div>
              <Clock className="w-8 h-8" style={{ color: project.color }} />
            </div>
          </div>
          <div
            className="p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg"
            style={{ backgroundColor: `${project.color}30` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80 mb-1" style={{ color: "var(--color-text)" }}>
                  In Progress
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                  {inProgressTasks}
                </p>
              </div>
              <Clock className="w-8 h-8" style={{ color: project.color }} />
            </div>
          </div>
          <div
            className="p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg"
            style={{ backgroundColor: `${project.color}40` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80 mb-1" style={{ color: "var(--color-text)" }}>
                  Completed
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                  {completedTasks}
                </p>
              </div>
              <CheckCircle className="w-8 h-8" style={{ color: project.color }} />
            </div>
          </div>
          <div
            className="p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg"
            style={{ backgroundColor: `${project.color}10` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80 mb-1" style={{ color: "var(--color-text)" }}>
                  Overdue
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                  {overdueTasks}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8" style={{ color: project.color }} />
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-[var(--color-surface)] p-8 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
          <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--color-text)" }}>
            Project Tasks
          </h2>
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[var(--color-border)]"
                  style={{ backgroundColor: `${project.color}10` }}
                >
                  <Plus className="w-12 h-12 opacity-50" style={{ color: project.color }} />
                </div>
                <p className="text-xl mb-4 opacity-70" style={{ color: "var(--color-text)" }}>
                  No tasks in this project
                </p>
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="inline-flex items-center px-6 py-3 rounded-2xl border-2 border-[var(--color-border)] hover:shadow-lg hover:transform hover:scale-105 transition-all duration-200 font-medium"
                  style={{
                    backgroundColor: `${project.color}20`,
                    color: "var(--color-text)",
                  }}
                >
                  <Plus size={16} />
                  <span className="ml-2">Add first task</span>
                </button>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-6 bg-[var(--color-background)] rounded-xl border-2 border-[var(--color-border)] hover:shadow-md hover:transform hover:scale-[1.01] transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
                          {task.title}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-bold border ${
                            task.priority === "urgent"
                              ? "bg-red-100 text-red-800 border-red-300"
                              : task.priority === "high"
                                ? "bg-orange-100 text-orange-800 border-orange-300"
                                : task.priority === "medium"
                                  ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                  : "bg-green-100 text-green-800 border-green-300"
                          }`}
                        >
                          {task.priority.toUpperCase()}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-bold border ${
                            task.status === "completed"
                              ? "bg-green-100 text-green-800 border-green-300"
                              : task.status === "in_progress"
                                ? "bg-blue-100 text-blue-800 border-blue-300"
                                : task.status === "archived"
                                  ? "bg-purple-100 text-purple-800 border-purple-300"
                                  : "bg-gray-100 text-gray-800 border-gray-300"
                          }`}
                        >
                          {task.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                      {task.description && (
                        <p className="opacity-70 mb-3" style={{ color: "var(--color-text)" }}>
                          {task.description}
                        </p>
                      )}
                      <div
                        className="flex items-center space-x-4 text-sm opacity-70"
                        style={{ color: "var(--color-text)" }}
                      >
                        {task.assigned_to && (
                          <div className="flex items-center bg-[var(--color-surface)] px-3 py-1 rounded-lg border border-[var(--color-border)]">
                            <User size={14} />
                            <span className="ml-1 font-medium">{task.assigned_to}</span>
                          </div>
                        )}
                        {task.due_date && (
                          <div className="flex items-center bg-[var(--color-surface)] px-3 py-1 rounded-lg border border-[var(--color-border)]">
                            <Calendar size={14} />
                            <span className="ml-1 font-medium">{new Date(task.due_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTask(task)
                          setShowEditModal(true)
                        }}
                        className="px-3 py-1 rounded-lg border-2 border-[var(--color-border)] hover:shadow-md transition-colors text-sm font-bold"
                        style={{
                          backgroundColor: `${project.color}20`,
                          color: "var(--color-text)",
                        }}
                      >
                        Edit
                      </button>
                      {task.status !== "completed" && (
                        <button
                          onClick={() => updateTaskStatus(task.id, "completed", task.title)}
                          className="px-3 py-1 rounded-lg border-2 border-[var(--color-border)] hover:shadow-md transition-colors text-sm font-bold"
                          style={{
                            backgroundColor: `${project.color}30`,
                            color: "var(--color-text)",
                          }}
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <TaskFormModal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          onSuccess={() => {
            fetchTasks()
            fetchProject()
          }}
        />
        <TaskEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            fetchTasks()
            fetchProject()
          }}
          task={selectedTask}
        />
      </div>
    </Sidebar>
  )
}
