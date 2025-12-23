"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, CheckSquare, FolderOpen, Archive, Activity, Clock, Menu, X, Settings } from "lucide-react"
import SearchBar from "./search-bar"

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
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Save and restore scroll position
  useEffect(() => {
    const savedScrollPosition = localStorage.getItem("sidebar-scroll-position")
    if (savedScrollPosition && scrollRef.current) {
      scrollRef.current.scrollTop = Number.parseInt(savedScrollPosition, 10)
    }
  }, [])

  const handleScroll = () => {
    if (scrollRef.current) {
      localStorage.setItem("sidebar-scroll-position", scrollRef.current.scrollTop.toString())
    }
  }

  const handleSearchResult = (result: any) => {
    switch (result.type) {
      case "task":
        router.push("/tasks")
        break
      case "project":
        router.push(`/projects/${result.id}`)
        break
      case "time_entry":
        router.push("/time-tracking")
        break
      case "archived_task":
        router.push("/archive")
        break
    }
  }

  return (
    <div className="flex h-screen bg-[var(--color-background)]">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-4 z-50 p-3 bg-[var(--color-surface)] rounded-xl border-2 border-[var(--color-border)] shadow-lg hover:shadow-xl transition-all duration-300 ${
          isOpen ? "left-[340px]" : "left-4"
        }`}
        style={{ color: "var(--color-text)" }}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } fixed left-0 top-0 h-full w-80 bg-[var(--color-surface)] border-r-2 border-[var(--color-border)] transition-transform duration-300 ease-in-out shadow-2xl z-40 flex flex-col`}
      >
        {/* Header */}
        <div className="p-6 border-b-2 border-[var(--color-border)] flex-shrink-0">
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
            Task Tracker Pro
          </h1>
          <p className="text-sm opacity-70 mt-1" style={{ color: "var(--color-text)" }}>
            Manage your productivity
          </p>
        </div>

        {/* Search */}
        <div className="p-4 border-b-2 border-[var(--color-border)] flex-shrink-0">
          <SearchBar onResultClick={handleSearchResult} placeholder="Search tasks, projects..." className="w-full" />
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 p-4 overflow-y-auto" ref={scrollRef} onScroll={handleScroll}>
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-4 py-3 rounded-xl border-2 border-[var(--color-border)] transition-all duration-200 hover:scale-105 hover-primary ${
                      isActive
                        ? "bg-[var(--color-primary)] bg-opacity-20 shadow-md transform scale-105"
                        : "hover:bg-[var(--color-primary)] hover:bg-opacity-10 hover:shadow-md"
                    }`}
                    style={{ color: isActive ? "var(--color-primary-foreground)" : undefined }}
                  >
                    <item.icon size={20} />
                    <span className="ml-3 font-medium">{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${isOpen ? "ml-80" : "ml-0"}`}>
        <div className="pt-16 min-h-screen" style={{ backgroundColor: "var(--color-background)" }}>
          {children}
        </div>
      </div>
    </div>
  )
}
