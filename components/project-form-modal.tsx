'use client'

import type React from 'react'
import type { CSSProperties } from 'react'

import { useState } from 'react'
import Modal from './modal'
import { useNotification } from './notification'

interface ProjectFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ProjectFormModal({ isOpen, onClose, onSuccess }: ProjectFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const { addNotification } = useNotification()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          color: 'var(--color-primary)'
        })
      })

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Project Created',
          message: `Project "${formData.name}" has been created successfully.`
        })
        setFormData({
          name: '',
          description: ''
        })
        onSuccess()
        onClose()
      } else {
        throw new Error('Failed to create project')
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to create project. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--color-text)' } as CSSProperties}
          >
            Project Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-colors"
            style={
              {
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
                backgroundColor: 'var(--color-background)',
                '--tw-ring-color': 'var(--color-primary)'
              } as React.CSSProperties
            }
            placeholder="Enter project name"
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--color-text)' } as CSSProperties}
          >
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-colors resize-none"
            style={
              {
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
                backgroundColor: 'var(--color-background)',
                '--tw-ring-color': 'var(--color-primary)'
              } as React.CSSProperties
            }
            placeholder="Enter project description"
          />
        </div>

        <div
          className="flex justify-end space-x-3 pt-4"
          style={{ borderTop: '2px solid var(--color-border)' } as CSSProperties}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl border-2 transition-colors font-medium"
            style={
              {
                color: 'var(--color-text)',
                backgroundColor: 'var(--color-background)',
                borderColor: 'var(--color-border)'
              } as CSSProperties
            }
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary)'
              e.currentTarget.style.color = 'var(--color-primary-foreground)'
              e.currentTarget.style.opacity = '0.1'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-background)'
              e.currentTarget.style.color = 'var(--color-text)'
              e.currentTarget.style.opacity = '1'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl border-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={
              {
                color: 'var(--color-secondary-foreground)',
                backgroundColor: 'var(--color-secondary)',
                borderColor: 'var(--color-border)'
              } as CSSProperties
            }
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
