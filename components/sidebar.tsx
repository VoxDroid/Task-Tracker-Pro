"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, CheckSquare, FolderOpen, Archive, Activity, Clock, Menu, X, Settings, Info } from "lucide-react"
import SearchBar from "./search-bar"

// Extend window interface for page content visibility
declare global {
  interface Window {
    pageContentVisible?: boolean
  }
}

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
  // Load initial state from localStorage synchronously
  const getInitialSidebarState = () => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem("sidebar-open")
      return savedState !== null ? JSON.parse(savedState) : true
    }
    return true
  }

  const [isOpen, setIsOpen] = useState(getInitialSidebarState)
  const pathname = usePathname()
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [contentVisible, setContentVisible] = useState(false)
  const [focusSearchBar, setFocusSearchBar] = useState(0)

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("sidebar-open", JSON.stringify(isOpen))
  }, [isOpen])

  // Save and restore scroll position
  useEffect(() => {
    const savedScrollPosition = localStorage.getItem("sidebar-scroll-position")
    if (savedScrollPosition && scrollRef.current) {
      scrollRef.current.scrollTop = Number.parseInt(savedScrollPosition, 10)
    }
  }, [])

  // Listen for page content visibility changes
  useEffect(() => {
    const checkVisibility = () => {
      if (typeof window !== 'undefined' && window.pageContentVisible !== undefined) {
        setContentVisible(window.pageContentVisible)
      }
    }

    // Check immediately
    checkVisibility()

    // Set up interval to check for changes (since we can't listen to window property changes)
    const interval = setInterval(checkVisibility, 50)

    return () => clearInterval(interval)
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
    <div className="flex h-full bg-[var(--color-background)]">
      {/* Sidebar */}
      <div
        className={`${
          isOpen ? "translate-x-0 w-80" : "translate-x-0 w-16"
        } fixed left-0 top-14 h-[calc(100vh-3.5rem)] bg-[var(--color-surface)] border-r-2 border-[var(--color-border)] transition-all duration-300 ease-in-out shadow-2xl z-40 flex flex-col overflow-hidden`}
      >
        {/* Header */}
        <div className={`border-b-2 border-[var(--color-border)] flex-shrink-0 transition-all duration-300 ${isOpen ? 'p-4 flex items-center justify-between' : 'p-2 flex justify-center'}`}>
          {isOpen ? (
            <>
              <div className="min-w-0 flex-1 transition-opacity duration-200 delay-100">
                <h1 className="text-xl font-bold truncate" style={{ color: "var(--color-text)" }}>
                  Task Tracker Pro
                </h1>
                <p className="text-xs opacity-70 mt-1 truncate" style={{ color: "var(--color-text)" }}>
                  Manage your productivity
                </p>
              </div>
              <button
                onClick={() => {
                  // Emit event before state change
                  window.dispatchEvent(new CustomEvent('sidebar-toggle-start'))
                  setIsOpen(!isOpen)
                  // Emit event after animation completes (slightly longer than transition duration for safety)
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('sidebar-toggle-end'))
                  }, 350) // 300ms transition + 50ms buffer
                }}
                className={`flex items-center justify-center px-4 py-3 rounded-xl border-2 border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:bg-opacity-10 transition-colors duration-200 ml-2 flex-shrink-0`}
                style={{ color: "var(--color-text)" }}
                title="Collapse sidebar"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                // Emit event before state change
                window.dispatchEvent(new CustomEvent('sidebar-toggle-start'))
                setIsOpen(!isOpen)
                // Emit event after animation completes (slightly longer than transition duration for safety)
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('sidebar-toggle-end'))
                }, 350) // 300ms transition + 50ms buffer
              }}
              className="flex items-center justify-center px-3 py-3 rounded-xl border-2 border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:bg-opacity-10 transition-colors duration-200"
              style={{ color: "var(--color-text)" }}
              title="Expand sidebar"
            >
              <Menu size={16} />
            </button>
          )}
        </div>

        {/* Search */}
        <div className={`border-b-2 border-[var(--color-border)] flex-shrink-0 transition-all duration-300 ${isOpen ? 'p-4 block' : 'p-2 hidden'}`}>
          <SearchBar onResultClick={handleSearchResult} placeholder="Search tasks, projects..." className="w-full" focusTrigger={focusSearchBar} />
        </div>

        {/* Search Button (when collapsed) */}
        {!isOpen && (
          <div className="p-2 border-b-2 border-[var(--color-border)] flex-shrink-0 flex justify-center transition-all duration-300">
            <button
              onClick={() => {
                // Emit event before state change
                window.dispatchEvent(new CustomEvent('sidebar-toggle-start'))
                setIsOpen(true)
                // Emit event after animation completes (slightly longer than transition duration for safety)
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('sidebar-toggle-end'))
                  // Focus the search bar after sidebar opens
                  setFocusSearchBar(prev => prev + 1)
                }, 350) // 300ms transition + 50ms buffer
              }}
              className="flex items-center justify-center px-3 py-3 rounded-xl border-2 border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:bg-opacity-10 transition-colors duration-200"
              style={{ color: "var(--color-text)" }}
              title="Search (opens sidebar)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </button>
          </div>
        )}

        {/* Navigation - Scrollable */}
        <nav className={`flex-1 overflow-y-auto transition-all duration-300 ${isOpen ? 'p-4' : 'p-2'}`} ref={scrollRef} onScroll={handleScroll}>
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.name} className="transition-all duration-200">
                  <Link
                    href={item.href}
                    className={`flex items-center ${isOpen ? 'px-4 py-3' : 'px-3 py-3 justify-center'} rounded-xl border-2 border-[var(--color-border)] transition-all duration-200 hover:scale-105 hover-primary ${
                      isActive
                        ? "bg-[var(--color-primary)] bg-opacity-20 shadow-md transform scale-105"
                        : "hover:bg-[var(--color-primary)] hover:bg-opacity-10 hover:shadow-md"
                    }`}
                    style={{ color: isActive ? "var(--color-primary-foreground)" : undefined }}
                    title={!isOpen ? item.name : undefined}
                  >
                    <item.icon size={20} className="flex-shrink-0" />
                    {isOpen && <span className="ml-3 font-medium truncate transition-opacity duration-200 delay-75">{item.name}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Info Icon - Bottom */}
        <div className={`border-t-2 border-[var(--color-border)] flex-shrink-0 ${isOpen ? 'p-4' : 'p-2 flex justify-center'}`}>
          <Link
            href="/about"
            className={`flex items-center justify-center rounded-xl border-2 border-[var(--color-border)] transition-all duration-200 hover:scale-105 hover:bg-[var(--color-primary)] hover:bg-opacity-10 hover:shadow-md ${
              isOpen ? 'w-12 h-12' : 'w-10 h-10'
            }`}
            title="About Task Tracker Pro"
          >
            <Info size={isOpen ? 20 : 16} />
          </Link>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden top-14" onClick={() => setIsOpen(false)} />
      )}

      {/* Main Content */}
      <div
        id="main-content"
        className={`flex-1 ${isOpen ? "ml-80" : "ml-16"}`}
        style={{
          opacity: contentVisible ? 1 : 0,
          transition: 'margin-left 300ms ease-in-out, opacity 300ms ease-in-out'
        }}
      >
        <div className="h-full overflow-y-auto" style={{ backgroundColor: "var(--color-background)"}}>
          {children}
        </div>
      </div>
    </div>
  )
}
