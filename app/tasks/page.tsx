"use client"

import { useEffect, useState } from "react"
import Sidebar from "@/components/sidebar"
import TaskFormModal from "@/components/task-form-modal"
import { useNotification } from "@/components/notification"
import type { Task } from "@/lib/types"
import { Plus, Calendar, User, FolderOpen, Filter } from "lucide-react"
import TaskEditModal from "@/components/task-edit-modal"

const priorityColors = {
  low: "bg-green-100 text-green-800 border-green-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  high: "bg-orange-100 text-orange-800 border-orange-300",
  urgent: "bg-red-100 text-red-800 border-red-300",
}

const statusColors = {
  todo: "bg-gray-100 text-gray-800 border-gray-300",
  in_progress: "bg-blue-100 text-blue-800 border-blue-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  archived: "bg-purple-100 text-purple-800 border-purple-300",
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const { addNotification } = useNotification()

  // Add these state variables after the existing ones
  const [selectedTasks, setSelectedTasks] = useState<number[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [filter])

  useEffect(() => {
    const handleOpenTaskModal = () => setShowTaskModal(true)
    window.addEventListener("openTaskModal", handleOpenTaskModal)
    return () => window.removeEventListener("openTaskModal", handleOpenTaskModal)
  }, [])

  const fetchTasks = async () => {
    try {
      const url = filter === "all" ? "/api/tasks" : `/api/tasks?status=${filter}`
      const response = await fetch(url)
      const data = await response.json()
      setTasks(data)
    } catch (error) {
      console.error("Error fetching tasks:", error)
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
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to update task. Please try again.",
      })
    }
  }

  // Add bulk action functions
  const toggleTaskSelection = (taskId: number) => {
    setSelectedTasks((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]))
  }

  const selectAllTasks = () => {
    setSelectedTasks(tasks.map((task) => task.id))
  }

  const clearSelection = () => {
    setSelectedTasks([])
  }

  const bulkUpdateStatus = async (newStatus: string) => {
    try {
      await Promise.all(
        selectedTasks.map((taskId) =>
          fetch(`/api/tasks/${taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          }),
        ),
      )

      addNotification({
        type: "success",
        title: "Tasks Updated",
        message: `${selectedTasks.length} tasks have been ${newStatus === "completed" ? "completed" : "archived"}.`,
      })

      clearSelection()
      fetchTasks()
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to update tasks. Please try again.",
      })
    }
  }

  if (loading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-full">
          <div className="text-lg font-medium text-gray-600">Loading tasks...</div>
        </div>
      </Sidebar>
    )
  }

  return (
    <Sidebar>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-black mb-2">Tasks</h1>
            <p className="text-lg text-gray-600">Manage your tasks and track progress</p>
          </div>
          <button
            onClick={() => setShowTaskModal(true)}
            className="flex items-center px-6 py-3 bg-blue-100 text-blue-800 rounded-2xl border-2 border-black hover:bg-blue-200 hover:shadow-lg hover:transform hover:scale-105 transition-all duration-200 font-medium"
          >
            <Plus size={20} />
            <span className="ml-2">New Task</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 mb-8">
          <Filter className="w-5 h-5 text-gray-600" />
          <div className="flex space-x-2">
            {["all", "todo", "in_progress", "completed"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-xl border-2 border-black font-medium transition-all duration-200 ${
                  filter === status
                    ? "bg-black text-white shadow-lg transform scale-105"
                    : "bg-white text-black hover:bg-gray-100 hover:shadow-md hover:transform hover:scale-105"
                }`}
              >
                {status === "all" ? "All" : status.replace("_", " ").toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={selectedTasks.length === tasks.length ? clearSelection : selectAllTasks}
            className="px-4 py-2 rounded-xl border-2 border-black font-medium transition-all duration-200 bg-purple-100 text-purple-800 hover:bg-purple-200 hover:shadow-md hover:transform hover:scale-105"
          >
            {selectedTasks.length === tasks.length ? "Deselect All" : "Select All"}
          </button>
        </div>

        {/* Add bulk actions bar after the filters section */}
        {selectedTasks.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="font-medium text-blue-800">
                  {selectedTasks.length} task{selectedTasks.length !== 1 ? "s" : ""} selected
                </span>
                <button onClick={clearSelection} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Clear selection
                </button>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => bulkUpdateStatus("completed")}
                  className="px-4 py-2 bg-green-100 text-green-800 rounded-xl border-2 border-black hover:bg-green-200 transition-colors font-medium"
                >
                  Mark Completed
                </button>
                <button
                  onClick={() => bulkUpdateStatus("archived")}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl border-2 border-black hover:bg-gray-200 transition-colors font-medium"
                >
                  Archive
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tasks List */}
        <div className="space-y-6">
          {tasks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Plus className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-gray-500 text-xl mb-4">No tasks found</p>
              <button
                onClick={() => setShowTaskModal(true)}
                className="inline-flex items-center px-6 py-3 bg-blue-100 text-blue-800 rounded-2xl border-2 border-black hover:bg-blue-200 hover:shadow-lg hover:transform hover:scale-105 transition-all duration-200 font-medium"
              >
                <Plus size={16} />
                <span className="ml-2">Create your first task</span>
              </button>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white p-8 rounded-2xl border-2 border-black shadow-lg hover:shadow-xl hover:transform hover:scale-[1.02] transition-all duration-200"
              >
                {/* Add checkbox to each task card */}
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedTasks.includes(task.id)}
                    onChange={() => toggleTaskSelection(task.id)}
                    className="mt-2 w-5 h-5 rounded border-2 border-black focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-xl font-bold text-black">{task.title}</h3>
                          <span
                            className={`px-3 py-1 rounded-xl text-xs font-bold border-2 ${priorityColors[task.priority]}`}
                          >
                            {task.priority.toUpperCase()}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-xl text-xs font-bold border-2 ${statusColors[task.status]}`}
                          >
                            {task.status.replace("_", " ").toUpperCase()}
                          </span>
                        </div>

                        {task.description && <p className="text-gray-600 mb-4 text-lg">{task.description}</p>}

                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          {task.project_name && (
                            <div className="flex items-center bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                              <FolderOpen size={16} />
                              <span className="ml-2 font-medium">{task.project_name}</span>
                            </div>
                          )}
                          {task.assigned_to && (
                            <div className="flex items-center bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                              <User size={16} />
                              <span className="ml-2 font-medium">{task.assigned_to}</span>
                            </div>
                          )}
                          {task.due_date && (
                            <div className="flex items-center bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                              <Calendar size={16} />
                              <span className="ml-2 font-medium">{new Date(task.due_date).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        {task.status !== "completed" && (
                          <button
                            onClick={() => updateTaskStatus(task.id, "completed", task.title)}
                            className="px-4 py-2 bg-green-100 text-green-800 rounded-xl border-2 border-black hover:bg-green-200 hover:shadow-md hover:transform hover:scale-105 transition-all duration-200 text-sm font-bold"
                          >
                            Complete
                          </button>
                        )}
                        {task.status !== "archived" && (
                          <button
                            onClick={() => updateTaskStatus(task.id, "archived", task.title)}
                            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl border-2 border-black hover:bg-gray-200 hover:shadow-md hover:transform hover:scale-105 transition-all duration-200 text-sm font-bold"
                          >
                            Archive
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedTask(task)
                            setShowEditModal(true)
                          }}
                          className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-xl border-2 border-black hover:bg-yellow-200 hover:shadow-md hover:transform hover:scale-105 transition-all duration-200 text-sm font-bold"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <TaskFormModal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} onSuccess={fetchTasks} />
        <TaskEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={fetchTasks}
          task={selectedTask}
        />
      </div>
    </Sidebar>
  )
}
