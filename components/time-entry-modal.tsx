'use client'
import type { CSSProperties } from 'react'
import { useState } from 'react'
import Modal from './modal'
import { useNotification } from './notification'
import { Clock, Edit, Trash2, Play, Square, Timer, AlertTriangle } from 'lucide-react'

interface TimeEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  entry: any
  onStop?: () => void
  currentTime?: number
}

export default function TimeEntryModal({
  isOpen,
  onClose,
  onSuccess,
  entry,
  onStop,
  currentTime
}: TimeEntryModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { addNotification } = useNotification()

  const formatDurationFromSeconds = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleUpdateDescription = async () => {
    if (!entry) return

    setLoading(true)
    try {
      const response = await fetch(`/api/time-entries/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      })

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Time Entry Updated',
          message: 'Description has been updated successfully.'
        })
        setIsEditing(false)
        onSuccess()
        onClose()
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update time entry. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!entry) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/time-entries/${entry.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Time Entry Deleted',
          message: 'Time entry has been deleted successfully.'
        })
        onSuccess()
        onClose()
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete time entry. Please try again.'
      })
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleStop = () => {
    if (onStop) {
      onStop()
      onClose()
    }
  }

  if (!entry) return null

  const isActive = entry.isActive || (!entry.end_time && currentTime !== undefined)

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isActive ? 'Active Time Entry' : 'Time Entry Details'}
      >
        <div className="space-y-6">
          {/* Task Info */}
          <div
            className="p-4 rounded-2xl border-2"
            style={
              {
                backgroundColor: 'var(--color-background)',
                borderColor: 'var(--color-border)'
              } as CSSProperties
            }
          >
            <h3 className="font-bold mb-2" style={{ color: 'var(--color-text)' } as CSSProperties}>
              {entry.task_title}
            </h3>
            {entry.project_name && (
              <p
                className="text-sm opacity-70"
                style={{ color: 'var(--color-text)' } as CSSProperties}
              >
                {entry.project_name}
              </p>
            )}
          </div>

          {/* Active Timer Display */}
          {isActive && (
            <div
              className="p-6 rounded-2xl border-2 text-center"
              style={
                {
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)'
                } as CSSProperties
              }
            >
              <div className="flex items-center justify-center mb-4">
                <div
                  className="w-4 h-4 rounded-full animate-pulse mr-3"
                  style={{ backgroundColor: 'var(--color-accent)' } as CSSProperties}
                ></div>
                <Timer
                  className="w-6 h-6"
                  style={{ color: 'var(--color-text)' } as CSSProperties}
                />
              </div>
              <div
                className="text-4xl font-bold mb-4"
                style={{ color: 'var(--color-text)' } as CSSProperties}
              >
                {currentTime !== undefined ? formatTime(currentTime) : 'Running...'}
              </div>
              <button
                onClick={handleStop}
                className="flex items-center px-6 py-3 bg-[var(--color-surface)] rounded-2xl border-2 hover:bg-[var(--color-background)] transition-all duration-200 font-medium mx-auto"
                style={
                  {
                    color: 'var(--color-text)',
                    borderColor: 'var(--color-border)'
                  } as CSSProperties
                }
              >
                <Square size={16} />
                <span className="ml-2">Stop Timer</span>
              </button>
            </div>
          )}

          {/* Time Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className="p-4 rounded-2xl border-2"
              style={
                {
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)'
                } as CSSProperties
              }
            >
              <div className="flex items-center mb-2">
                <Clock
                  className="w-4 h-4 mr-2"
                  style={{ color: 'var(--color-text)' } as CSSProperties}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text)' } as CSSProperties}
                >
                  Duration
                </span>
              </div>
              <p
                className="text-2xl font-bold"
                style={{ color: 'var(--color-text)' } as CSSProperties}
              >
                {!isActive && entry.duration
                  ? formatDurationFromSeconds(entry.duration)
                  : isActive && currentTime !== undefined
                    ? formatTime(currentTime)
                    : '0s'}
              </p>
            </div>

            <div
              className="p-4 rounded-2xl border-2"
              style={
                {
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)'
                } as CSSProperties
              }
            >
              <div className="flex items-center mb-2">
                <Play
                  className="w-4 h-4 mr-2"
                  style={{ color: 'var(--color-text)' } as CSSProperties}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text)' } as CSSProperties}
                >
                  Started
                </span>
              </div>
              <p
                className="text-sm font-bold"
                style={{ color: 'var(--color-text)' } as CSSProperties}
              >
                {new Date(entry.start_time).toLocaleString()}
              </p>
              {entry.end_time && (
                <p
                  className="text-sm opacity-60 mt-1"
                  style={{ color: 'var(--color-text)' } as CSSProperties}
                >
                  Ended: {new Date(entry.end_time).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          {!isActive && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  className="block text-sm font-medium"
                  style={{ color: 'var(--color-text)' } as CSSProperties}
                >
                  Description
                </label>
                <button
                  onClick={() => {
                    setIsEditing(!isEditing)
                    setDescription(entry.description || '')
                  }}
                  className="flex items-center px-3 py-1 bg-[var(--color-surface)] rounded-2xl border-2 hover:bg-[var(--color-background)] transition-colors text-sm font-medium"
                  style={
                    {
                      color: 'var(--color-text)',
                      borderColor: 'var(--color-border)'
                    } as CSSProperties
                  }
                >
                  <Edit size={14} />
                  <span className="ml-1">{isEditing ? 'Cancel' : 'Edit'}</span>
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-2xl border-2 focus:outline-none focus:ring-2 transition-colors resize-none"
                    style={
                      {
                        backgroundColor: 'var(--color-background)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text)'
                      } as CSSProperties
                    }
                    placeholder="Add a description for this time entry..."
                  />
                  <button
                    onClick={handleUpdateDescription}
                    disabled={loading}
                    className="px-4 py-2 bg-[var(--color-surface)] rounded-2xl border-2 hover:bg-[var(--color-background)] disabled:opacity-50 transition-colors font-medium"
                    style={
                      {
                        color: 'var(--color-text)',
                        borderColor: 'var(--color-border)'
                      } as CSSProperties
                    }
                  >
                    {loading ? 'Saving...' : 'Save Description'}
                  </button>
                </div>
              ) : (
                <div
                  className="p-4 rounded-2xl border-2 min-h-[80px]"
                  style={
                    {
                      backgroundColor: 'var(--color-background)',
                      borderColor: 'var(--color-border)'
                    } as CSSProperties
                  }
                >
                  <p style={{ color: 'var(--color-text)' } as CSSProperties}>
                    {entry.description || 'No description added'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div
            className="flex justify-between pt-4 border-t-2"
            style={{ borderColor: 'var(--color-border)' } as CSSProperties}
          >
            {!isActive && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center px-4 py-2 bg-[var(--color-surface)] rounded-2xl border-2 hover:bg-[var(--color-background)] transition-colors font-medium"
                style={
                  {
                    color: 'var(--color-text)',
                    borderColor: 'var(--color-border)'
                  } as CSSProperties
                }
              >
                <Trash2 size={16} />
                <span className="ml-2">Delete Entry</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-3 bg-[var(--color-surface)] rounded-2xl border-2 hover:shadow-md transition-colors font-medium ml-auto"
              style={
                {
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-border)'
                } as CSSProperties
              }
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Time Entry"
      >
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <AlertTriangle
                className="w-8 h-8"
                style={{ color: 'var(--color-destructive)' } as CSSProperties}
              />
            </div>
            <div>
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: 'var(--color-text)' } as CSSProperties}
              >
                Are you sure you want to delete this time entry?
              </h3>
              <p
                className="text-sm opacity-70"
                style={{ color: 'var(--color-text)' } as CSSProperties}
              >
                This action cannot be undone. The time entry for "{entry.task_title}" will be
                permanently deleted.
              </p>
            </div>
          </div>

          <div
            className="flex justify-end space-x-3 pt-4 border-t-2"
            style={{ borderColor: 'var(--color-border)' } as CSSProperties}
          >
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
              className="px-4 py-2 bg-[var(--color-surface)] rounded-2xl border-2 hover:bg-[var(--color-background)] transition-colors font-medium"
              style={
                {
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-border)'
                } as CSSProperties
              }
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 rounded-2xl border-2 border-opacity-30 bg-[var(--color-destructive)] hover:bg-red-50 disabled:opacity-50 transition-colors font-medium"
              style={
                {
                  borderColor: 'var(--color-destructive)',
                  color: 'var(--color-destructive)'
                } as CSSProperties
              }
            >
              {deleting ? 'Deleting...' : 'Delete Entry'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
