"use client"

import { useEffect, useState } from "react"
import Sidebar from "@/components/sidebar"
import { useNotification } from "@/components/notification"
import { Clock, Play, Square, Timer } from "lucide-react"
import TimeEntryModal from "@/components/time-entry-modal"

interface TimeEntry {
  id: number
  task_id: number
  start_time: string
  end_time?: string
  duration?: number
  description?: string
  task?: {
    title: string
    project_name?: string
  }
}

export default function TimeTrackingPage() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [activeTimer, setActiveTimer] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [loading, setLoading] = useState(true)
  const { addNotification } = useNotification()

  const [showEntryModal, setShowEntryModal] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<any>(null)

  useEffect(() => {
    fetchTimeEntries()
    fetchTasks()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (activeTimer) {
      interval = setInterval(() => {
        setCurrentTime((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [activeTimer])

  const fetchTimeEntries = async () => {
    try {
      const response = await fetch("/api/time-entries")
      const data = await response.json()
      setTimeEntries(data)
    } catch (error) {
      console.error("Error fetching time entries:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks")
      const data = await response.json()
      setTasks(data.filter((task: any) => task.status !== "completed" && task.status !== "archived"))
    } catch (error) {
      console.error("Error fetching tasks:", error)
    }
  }

  const startTimer = async (taskId: number) => {
    try {
      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId }),
      })

      if (response.ok) {
        const entry = await response.json()
        setActiveTimer(entry.id)
        setCurrentTime(0)
        addNotification({
          type: "success",
          title: "Timer Started",
          message: "Time tracking has begun for this task.",
        })
        fetchTimeEntries()
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to start timer. Please try again.",
      })
    }
  }

  const stopTimer = async () => {
    if (!activeTimer) return

    try {
      const response = await fetch(`/api/time-entries/${activeTimer}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ end_time: new Date().toISOString() }),
      })

      if (response.ok) {
        setActiveTimer(null)
        setCurrentTime(0)
        addNotification({
          type: "success",
          title: "Timer Stopped",
          message: "Time entry has been saved successfully.",
        })
        fetchTimeEntries()
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to stop timer. Please try again.",
      })
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  if (loading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-full">
          <div className="text-lg font-medium text-gray-600">Loading time tracking...</div>
        </div>
      </Sidebar>
    )
  }

  return (
    <Sidebar>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2 flex items-center">
            <Clock className="mr-4" />
            Time Tracking
          </h1>
          <p className="text-lg text-gray-600">Track time spent on your tasks</p>
        </div>

        {/* Active Timer */}
        {activeTimer && (
          <div className="bg-blue-50 p-8 rounded-2xl border-2 border-black shadow-lg mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse mr-4"></div>
                <div>
                  <h3 className="text-xl font-bold text-black">Timer Running</h3>
                  <p className="text-gray-600">Currently tracking time</p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-4xl font-bold text-black font-mono">{formatTime(currentTime)}</div>
                <button
                  onClick={stopTimer}
                  className="flex items-center px-6 py-3 bg-red-100 text-red-800 rounded-2xl border-2 border-black hover:bg-red-200 hover:shadow-lg hover:transform hover:scale-105 transition-all duration-200 font-medium"
                >
                  <Square size={20} />
                  <span className="ml-2">Stop</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Start Timer Section */}
        <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-lg mb-8">
          <h3 className="text-xl font-bold text-black mb-6">Start Timer for Task</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-black hover:shadow-md transition-all duration-200"
              >
                <h4 className="font-semibold text-black mb-2">{task.title}</h4>
                {task.project_name && <p className="text-sm text-gray-600 mb-3">{task.project_name}</p>}
                <button
                  onClick={() => startTimer(task.id)}
                  disabled={!!activeTimer}
                  className="flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-xl border-2 border-black hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium w-full justify-center"
                >
                  <Play size={16} />
                  <span className="ml-2">Start</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Time Entries History */}
        <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-lg">
          <h3 className="text-xl font-bold text-black mb-6">Time Entries</h3>
          <div className="space-y-4">
            {timeEntries.length === 0 ? (
              <div className="text-center py-12">
                <Timer size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg">No time entries yet</p>
                <p className="text-gray-400 text-sm">Start tracking time on your tasks</p>
              </div>
            ) : (
              timeEntries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => {
                    setSelectedEntry(entry)
                    setShowEntryModal(true)
                  }}
                  className="w-full text-left flex items-center justify-between p-6 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-black hover:shadow-md hover:transform hover:scale-[1.02] transition-all duration-200"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-black">{entry.task?.title}</h4>
                    {entry.task?.project_name && <p className="text-sm text-gray-600">{entry.task.project_name}</p>}
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(entry.start_time).toLocaleString()}
                      {entry.end_time && ` - ${new Date(entry.end_time).toLocaleString()}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-black">
                      {entry.duration ? formatDuration(entry.duration) : "Running..."}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
        <TimeEntryModal
          isOpen={showEntryModal}
          onClose={() => setShowEntryModal(false)}
          onSuccess={fetchTimeEntries}
          entry={selectedEntry}
        />
      </div>
    </Sidebar>
  )
}
