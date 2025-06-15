"use client"

import { useEffect, useState } from "react"
import Sidebar from "@/components/sidebar"
import { useNotification } from "@/components/notification"
import type { Task } from "@/lib/types"
import { Archive, RotateCcw, Trash2 } from "lucide-react"

export default function ArchivePage() {
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const { addNotification } = useNotification()

  useEffect(() => {
    fetchArchivedTasks()
  }, [])

  const fetchArchivedTasks = async () => {
    try {
      const response = await fetch("/api/tasks?archived=true")
      const data = await response.json()
      setArchivedTasks(data)
    } catch (error) {
      console.error("Error fetching archived tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const restoreTask = async (taskId: number, taskTitle: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "todo" }),
      })

      if (response.ok) {
        addNotification({
          type: "success",
          title: "Task Restored",
          message: `Task "${taskTitle}" has been restored successfully.`,
        })
        fetchArchivedTasks()
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to restore task. Please try again.",
      })
    }
  }

  const deleteTask = async (taskId: number, taskTitle: string) => {
    if (!confirm("Are you sure you want to permanently delete this task?")) {
      return
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        addNotification({
          type: "success",
          title: "Task Deleted",
          message: `Task "${taskTitle}" has been permanently deleted.`,
        })
        fetchArchivedTasks()
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to delete task. Please try again.",
      })
    }
  }

  if (loading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-full">
          <div className="text-lg font-medium text-gray-600">Loading archived tasks...</div>
        </div>
      </Sidebar>
    )
  }

  return (
    <Sidebar>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2 flex items-center">
            <Archive className="mr-4" />
            Archive
          </h1>
          <p className="text-lg text-gray-600">Manage your archived tasks</p>
        </div>

        {/* Archived Tasks */}
        <div className="space-y-6">
          {archivedTasks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Archive className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-gray-500 text-xl mb-2">No archived tasks</p>
              <p className="text-gray-400 text-lg">Tasks you archive will appear here</p>
            </div>
          ) : (
            archivedTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white p-8 rounded-2xl border-2 border-black shadow-lg opacity-75 hover:opacity-100 hover:shadow-xl hover:transform hover:scale-[1.02] transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-black mb-3">{task.title}</h3>
                    {task.description && <p className="text-gray-600 mb-4 text-lg">{task.description}</p>}
                    <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 inline-block">
                      Archived on {new Date(task.updated_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => restoreTask(task.id, task.title)}
                      className="flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-xl border-2 border-black hover:bg-blue-200 hover:shadow-md hover:transform hover:scale-105 transition-all duration-200 font-bold"
                    >
                      <RotateCcw size={16} />
                      <span className="ml-2">Restore</span>
                    </button>
                    <button
                      onClick={() => deleteTask(task.id, task.title)}
                      className="flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-xl border-2 border-black hover:bg-red-200 hover:shadow-md hover:transform hover:scale-105 transition-all duration-200 font-bold"
                    >
                      <Trash2 size={16} />
                      <span className="ml-2">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Sidebar>
  )
}
