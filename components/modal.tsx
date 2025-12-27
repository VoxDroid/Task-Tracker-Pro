"use client"

import type React from "react"
import type { CSSProperties } from "react"

import { useEffect } from "react"
import { X } from "lucide-react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl" | "2xl"
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
    "2xl": "max-w-5xl",
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 backdrop-blur-sm transition-opacity" 
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" } as CSSProperties}
          onClick={onClose} 
        />

        {/* Modal */}
        <div
          className={`relative w-full ${sizeClasses[size]} transform rounded-2xl transition-all`}
          style={{
            backgroundColor: "var(--color-surface)",
            border: "2px solid var(--color-border)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          } as CSSProperties}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-6 border-b-2"
            style={{ borderColor: "var(--color-border)" } as CSSProperties}
          >
            <h3 className="text-xl font-bold" style={{ color: "var(--color-text)" } as CSSProperties}>
              {title}
            </h3>
            <button
              onClick={onClose}
              className="rounded-xl p-2 transition-colors"
              style={{ 
                color: "var(--color-text)",
                "--hover-bg": "var(--color-primary)"
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-primary)"
                e.currentTarget.style.opacity = "0.1"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent"
                e.currentTarget.style.opacity = "1"
              }}
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
