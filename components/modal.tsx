"use client"

import type React from "react"

import { useEffect } from "react"
import { X } from "lucide-react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl"
}

export default function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div
          className={`relative w-full ${sizeClasses[size]} transform rounded-2xl shadow-2xl transition-all`}
          style={{
            backgroundColor: "var(--color-surface)",
            border: "2px solid var(--color-border)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-6 border-b-2"
            style={{ borderColor: "var(--color-border)" }}
          >
            <h3 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
              {title}
            </h3>
            <button
              onClick={onClose}
              className="rounded-xl p-2 hover:bg-opacity-10 hover:bg-gray-500 transition-colors"
              style={{ color: "var(--color-text)" }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  )
}
