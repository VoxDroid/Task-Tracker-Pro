"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  CheckSquare,
  FolderOpen,
  Archive,
  Activity,
  Clock,
  Menu,
  X,
  Plus,
  Settings,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Projects", href: "/projects", icon: FolderOpen },
  { name: "Time Tracking", href: "/time-tracking", icon: Clock },
  { name: "Archive", href: "/archive", icon: Archive },
  { name: "Activity Logs", href: "/logs", icon: Activity },
  { name: "Settings", href: "/settings", icon: Settings },
]

interface SidebarProps {
  children: React.ReactNode
}

export default function Sidebar({ children }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true)
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-4 z-50 p-3 bg-white rounded-xl border-2 border-black shadow-lg hover:bg-gray-50 transition-all duration-300 ${
          isOpen ? "left-60" : "left-4"
        }`}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } fixed left-0 top-0 h-full w-64 bg-white border-r-2 border-black transition-transform duration-300 ease-in-out shadow-xl z-40`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b-2 border-black">
            <h1 className="text-2xl font-bold text-black">Task Tracker Pro</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your productivity</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-4 py-3 rounded-xl border-2 border-black transition-all duration-200 ${
                        isActive
                          ? "bg-blue-100 text-blue-800 shadow-md transform scale-105"
                          : "text-gray-700 hover:bg-gray-100 hover:shadow-md hover:transform hover:scale-105"
                      }`}
                    >
                      <item.icon size={20} />
                      <span className="ml-3 font-medium">{item.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Quick Actions */}
          {!collapsed && (
            <div className="p-4 border-t-2 border-black bg-gray-50">
              <div className="space-y-3">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent("openTaskModal"))}
                  className="flex items-center w-full px-4 py-3 bg-green-100 text-green-800 rounded-xl border-2 border-black hover:bg-green-200 hover:shadow-md hover:transform hover:scale-105 transition-all duration-200"
                >
                  <Plus size={16} />
                  <span className="ml-2 text-sm font-medium">New Task</span>
                </button>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent("openProjectModal"))}
                  className="flex items-center w-full px-4 py-3 bg-purple-100 text-purple-800 rounded-xl border-2 border-black hover:bg-purple-200 hover:shadow-md hover:transform hover:scale-105 transition-all duration-200"
                >
                  <Plus size={16} />
                  <span className="ml-2 text-sm font-medium">New Project</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>
        <div className="pt-16">{children}</div>
      </div>
    </div>
  )
}
