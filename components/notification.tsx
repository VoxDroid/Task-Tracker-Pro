"use client"

import type React from "react"

import { useState } from "react"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"

export interface NotificationProps {
  id: string
  type: "success" | "error" | "info" | "warning"
  title: string
  message?: string
  duration?: number
}

interface NotificationContextType {
  notifications: NotificationProps[]
  addNotification: (notification: Omit<NotificationProps, "id">) => void
  removeNotification: (id: string) => void
}

import { createContext, useContext } from "react"

const NotificationContext = createContext<NotificationContextType | null>(null)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationProps[]>([])

  const addNotification = (notification: Omit<NotificationProps, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification = { ...notification, id }
    setNotifications((prev) => [...prev, newNotification])

    // Auto remove after duration
    setTimeout(() => {
      removeNotification(id)
    }, notification.duration || 5000)
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider")
  }
  return context
}

function NotificationContainer() {
  const { notifications, removeNotification } = useNotification()

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5" style={{ color: "var(--color-accent)" }} />
      case "error":
        return <AlertCircle className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
      case "warning":
        return <AlertTriangle className="w-5 h-5" style={{ color: "var(--color-secondary)" }} />
      default:
        return <Info className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
    }
  }

  const getColors = (type: string) => {
    switch (type) {
      case "success":
        return {
          backgroundColor: "var(--color-accent)",
          borderColor: "var(--color-accent)",
          color: "var(--color-text)",
          opacity: 0.1
        }
      case "error":
        return {
          backgroundColor: "var(--color-primary)",
          borderColor: "var(--color-primary)",
          color: "var(--color-text)",
          opacity: 0.1
        }
      case "warning":
        return {
          backgroundColor: "var(--color-secondary)",
          borderColor: "var(--color-secondary)",
          color: "var(--color-text)",
          opacity: 0.1
        }
      default:
        return {
          backgroundColor: "var(--color-primary)",
          borderColor: "var(--color-primary)",
          color: "var(--color-text)",
          opacity: 0.1
        }
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => {
        const colors = getColors(notification.type)
        return (
          <div
            key={notification.id}
            className="max-w-sm w-full rounded-xl border-2 p-4 shadow-lg transform transition-all duration-300 ease-in-out"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: colors.borderColor,
              color: "var(--color-text)",
            }}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0" style={{ backgroundColor: colors.backgroundColor, opacity: colors.opacity, padding: '4px', borderRadius: '6px' }}>
                {getIcon(notification.type)}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{notification.title}</p>
                {notification.message && <p className="text-sm mt-1 opacity-90" style={{ color: "var(--color-text)" }}>{notification.message}</p>}
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-4 flex-shrink-0 rounded-lg p-1 hover:bg-black hover:bg-opacity-10 transition-colors"
                style={{ color: "var(--color-text)" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
