"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, Clock, FolderOpen, CheckSquare, Archive } from "lucide-react"

interface SearchResult {
  id: number
  type: "task" | "project" | "time_entry" | "archived_task"
  title: string
  description?: string
  project_name?: string
  status?: string
  priority?: string
  created_at: string
}

interface SearchBarProps {
  onResultClick?: (result: SearchResult) => void
  placeholder?: string
  className?: string
}

export default function SearchBar({ onResultClick, placeholder = "Search...", className = "" }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.trim().length > 2) {
        performSearch(query.trim())
      } else {
        setResults([])
        setIsOpen(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query])

  const performSearch = async (searchQuery: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      setResults(data.results || [])
      setIsOpen(true)
    } catch (error) {
      console.error("Search error:", error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "task":
        return <CheckSquare className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
      case "project":
        return <FolderOpen className="w-4 h-4" style={{ color: "var(--color-secondary)" }} />
      case "time_entry":
        return <Clock className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
      case "archived_task":
        return <Archive className="w-4 h-4" style={{ color: "var(--color-muted)" }} />
      default:
        return <Search className="w-4 h-4" style={{ color: "var(--color-muted)" }} />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "task":
        return "Task"
      case "project":
        return "Project"
      case "time_entry":
        return "Time Entry"
      case "archived_task":
        return "Archived Task"
      default:
        return "Item"
    }
  }

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false)
    setQuery("")
    onResultClick?.(result)
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 rounded-xl border-2 border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none transition-colors bg-[var(--color-surface)]"
          style={{ color: "var(--color-text)" }}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("")
              setResults([])
              setIsOpen(false)
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Search Results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center" style={{ color: "var(--color-text)" }}>
              <div className="animate-spin w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full mx-auto mb-2"></div>
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 text-left hover:bg-[var(--color-background)] transition-colors border-b border-[var(--color-border)] last:border-b-0"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">{getIcon(result.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold truncate" style={{ color: "var(--color-text)" }}>
                          {result.title}
                        </span>
                        <span
                          className="text-xs px-2 py-1 bg-[var(--color-background)] rounded-full border border-[var(--color-border)]"
                          style={{ color: "var(--color-text)" }}
                        >
                          {getTypeLabel(result.type)}
                        </span>
                      </div>
                      {result.description && (
                        <p className="text-sm truncate mb-1 opacity-70" style={{ color: "var(--color-text)" }}>
                          {result.description}
                        </p>
                      )}
                      <div
                        className="flex items-center space-x-3 text-xs opacity-60"
                        style={{ color: "var(--color-text)" }}
                      >
                        {result.project_name && <span>Project: {result.project_name}</span>}
                        {result.status && <span>Status: {result.status}</span>}
                        {result.priority && <span>Priority: {result.priority}</span>}
                        <span>{new Date(result.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center opacity-60" style={{ color: "var(--color-text)" }}>
              No results found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}
