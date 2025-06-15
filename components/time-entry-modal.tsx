"use client"
import { useState } from "react"
import Modal from "./modal"
import { useNotification } from "./notification"
import { Clock, Edit, Trash2 } from "lucide-react"

interface TimeEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  entry: any
}

export default function TimeEntryModal({ isOpen, onClose, onSuccess, entry }: TimeEntryModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const { addNotification } = useNotification()

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const handleUpdateDescription = async () => {
    if (!entry) return

    setLoading(true)
    try {
      const response = await fetch(`/api/time-entries/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      })

      if (response.ok) {
        addNotification({
          type: "success",
          title: "Time Entry Updated",
          message: "Description has been updated successfully.",
        })
        setIsEditing(false)
        onSuccess()
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to update time entry. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!entry || !confirm("Are you sure you want to delete this time entry?")) return

    try {
      const response = await fetch(`/api/time-entries/${entry.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        addNotification({
          type: "success",
          title: "Time Entry Deleted",
          message: "Time entry has been deleted successfully.",
        })
        onSuccess()
        onClose()
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to delete time entry. Please try again.",
      })
    }
  }

  if (!entry) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Time Entry Details">
      <div className="space-y-6">
        {/* Task Info */}
        <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
          <h3 className="font-bold text-black mb-2">{entry.task_title}</h3>
          {entry.project_name && <p className="text-sm text-gray-600">{entry.project_name}</p>}
        </div>

        {/* Time Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
            <div className="flex items-center mb-2">
              <Clock className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">Duration</span>
            </div>
            <p className="text-2xl font-bold text-blue-800">
              {entry.duration ? formatDuration(entry.duration) : "Running..."}
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
            <div className="flex items-center mb-2">
              <Clock className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800">Started</span>
            </div>
            <p className="text-sm font-bold text-green-800">{new Date(entry.start_time).toLocaleString()}</p>
            {entry.end_time && (
              <p className="text-sm text-green-600 mt-1">Ended: {new Date(entry.end_time).toLocaleString()}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <button
              onClick={() => {
                setIsEditing(!isEditing)
                setDescription(entry.description || "")
              }}
              className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-lg border-2 border-black hover:bg-blue-200 transition-colors text-sm font-medium"
            >
              <Edit size={14} />
              <span className="ml-1">{isEditing ? "Cancel" : "Edit"}</span>
            </button>
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                placeholder="Add a description for this time entry..."
              />
              <button
                onClick={handleUpdateDescription}
                disabled={loading}
                className="px-4 py-2 bg-green-100 text-green-800 rounded-xl border-2 border-black hover:bg-green-200 disabled:opacity-50 transition-colors font-medium"
              >
                {loading ? "Saving..." : "Save Description"}
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200 min-h-[80px]">
              <p className="text-gray-700">{entry.description || "No description added"}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t-2 border-gray-100">
          <button
            onClick={handleDelete}
            className="flex items-center px-4 py-2 text-red-700 bg-red-100 rounded-xl border-2 border-black hover:bg-red-200 transition-colors font-medium"
          >
            <Trash2 size={16} />
            <span className="ml-2">Delete Entry</span>
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl border-2 border-black hover:bg-gray-200 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
