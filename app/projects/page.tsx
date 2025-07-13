"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Sidebar from "@/components/sidebar"
import ProjectFormModal from "@/components/project-form-modal"
import ProjectEditModal from "@/components/project-edit-modal"
import { useNotification } from "@/components/notification"
import {
  Plus,
  FolderOpen,
  CheckCircle,
  Circle,
  Search,
  Target,
  TrendingUp,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react"

const ITEMS_PER_PAGE = 6

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [filteredProjects, setFilteredProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<any>(null)
  const { addNotification } = useNotification()

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    const handleOpenProjectModal = () => setShowProjectModal(true)
    window.addEventListener("openProjectModal", handleOpenProjectModal)
    return () => window.removeEventListener("openProjectModal", handleOpenProjectModal)
  }, [])

  useEffect(() => {
    let filtered = Array.isArray(projects) ? [...projects] : []

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredProjects(filtered)
    setCurrentPage(1)
  }, [projects, searchQuery])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      const data = await response.json()
      setProjects(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching projects:", error)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const deleteProject = async () => {
    if (!projectToDelete) return

    try {
      const response = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        addNotification({
          type: "success",
          title: "Project Deleted",
          message: `Project "${projectToDelete.name}" has been permanently deleted.`,
        })
        fetchProjects()
        setShowDeleteModal(false)
        setProjectToDelete(null)
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to delete project. Please try again.",
      })
    }
  }

  const getProjectStats = () => {
    const safeFilteredProjects = Array.isArray(filteredProjects) ? filteredProjects : []
    const total = safeFilteredProjects.length
    const active = safeFilteredProjects.filter((project) => project.status === "active").length
    const completed = safeFilteredProjects.filter((project) => project.status === "completed").length
    const totalTasks = safeFilteredProjects.reduce((sum, project) => sum + (project.task_count || 0), 0)

    return { total, active, completed, totalTasks }
  }

  const getCurrentPageProjects = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredProjects.slice(startIndex, endIndex)
  }

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE)

  const stats = getProjectStats()

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { bg: "bg-green-500", text: "text-white", label: "Active" },
      completed: { bg: "bg-blue-500", text: "text-white", label: "Completed" },
      pending: { bg: "bg-yellow-500", text: "text-white", label: "Pending" },
      archived: { bg: "bg-gray-500", text: "text-white", label: "Archived" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>{config.label}</span>
    )
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  if (loading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full mx-auto mb-4"></div>
            <div className="text-lg font-medium" style={{ color: "var(--color-text)" }}>
              Loading projects...
            </div>
          </div>
        </div>
      </Sidebar>
    )
  }

  return (
    <Sidebar>
      <div className="p-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-5xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
              Projects
            </h1>
            <p className="text-xl opacity-70" style={{ color: "var(--color-text)" }}>
              Organize your tasks into projects
            </p>
          </div>
          <button
            onClick={() => setShowProjectModal(true)}
            className="flex items-center px-6 py-3 bg-[var(--color-secondary)] bg-opacity-20 rounded-2xl border-2 border-[var(--color-border)] hover:bg-opacity-30 hover:shadow-lg hover:transform hover:scale-105 transition-all duration-200 font-medium"
            style={{ color: "var(--color-text)" }}
          >
            <Plus size={20} />
            <span className="ml-2">New Project</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70 mb-1" style={{ color: "var(--color-text)" }}>
                  Total Projects
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                  {stats.total}
                </p>
              </div>
              <FolderOpen className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70 mb-1" style={{ color: "var(--color-text)" }}>
                  Active
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                  {stats.active}
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70 mb-1" style={{ color: "var(--color-text)" }}>
                  Completed
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                  {stats.completed}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70 mb-1" style={{ color: "var(--color-text)" }}>
                  Total Tasks
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                  {stats.totalTasks}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-cyan-500" />
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg mb-8">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 opacity-50"
              style={{ color: "var(--color-text)" }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-colors bg-[var(--color-background)]"
              style={{ color: "var(--color-text)" }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {filteredProjects.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="w-24 h-24 bg-[var(--color-secondary)] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[var(--color-border)]">
                <FolderOpen className="w-12 h-12 opacity-50" style={{ color: "var(--color-text)" }} />
              </div>
              <p className="text-xl mb-4 opacity-70" style={{ color: "var(--color-text)" }}>
                {searchQuery ? `No projects found for "${searchQuery}"` : "No projects found"}
              </p>
              <button
                onClick={() => setShowProjectModal(true)}
                className="inline-flex items-center px-6 py-3 bg-[var(--color-secondary)] bg-opacity-20 rounded-2xl border-2 border-[var(--color-border)] hover:bg-opacity-30 hover:shadow-lg hover:transform hover:scale-105 transition-all duration-200 font-medium"
                style={{ color: "var(--color-text)" }}
              >
                <Plus size={16} />
                <span className="ml-2">Create your first project</span>
              </button>
            </div>
          ) : (
            getCurrentPageProjects().map((project) => (
              <div
                key={project.id}
                className="relative p-6 rounded-2xl border-2 shadow-lg hover:shadow-xl hover:transform hover:scale-105 transition-all duration-300 overflow-hidden min-h-[320px]"
                style={{
                  backgroundColor: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                  borderLeftColor: project.color,
                  borderLeftWidth: "4px",
                }}
              >
                <div className="absolute inset-0 opacity-5">
                  <div
                    className="absolute top-0 right-0 w-32 h-32 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                </div>

                <div className="relative z-10 mb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                      <h3
                        className="text-lg font-bold truncate"
                        title={project.name}
                        style={{ color: "var(--color-text)" }}
                      >
                        {truncateText(project.name, 25)}
                      </h3>
                    </div>
                    <div className="flex-shrink-0 ml-2">{getStatusBadge(project.status)}</div>
                  </div>

                  <p
                    className="text-sm mb-4 line-clamp-2 min-h-[2.5rem] opacity-70"
                    title={project.description}
                    style={{ color: "var(--color-text)" }}
                  >
                    {project.description || "No description provided"}
                  </p>
                </div>

                <div className="relative z-10 grid grid-cols-2 gap-4 mb-6">
                  <div
                    className="p-3 rounded-xl border-2"
                    style={{
                      backgroundColor: "var(--color-background)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <Circle size={14} style={{ color: project.color }} />
                      <span className="text-xs font-medium opacity-70" style={{ color: "var(--color-text)" }}>
                        Total Tasks
                      </span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                      {project.task_count || 0}
                    </p>
                  </div>

                  <div
                    className="p-3 rounded-xl border-2"
                    style={{
                      backgroundColor: "var(--color-background)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <CheckCircle size={14} style={{ color: project.color }} />
                      <span className="text-xs font-medium opacity-70" style={{ color: "var(--color-text)" }}>
                        Completed
                      </span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: project.color }}>
                      {project.completed_tasks || 0}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium opacity-70" style={{ color: "var(--color-text)" }}>
                      Progress
                    </span>
                    <span className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
                      {project.task_count > 0 ? Math.round((project.completed_tasks / project.task_count) * 100) : 0}%
                    </span>
                  </div>
                  <div
                    className="w-full rounded-full h-2 border"
                    style={{
                      backgroundColor: "var(--color-background)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        backgroundColor: project.color,
                        width:
                          project.task_count > 0 ? `${(project.completed_tasks / project.task_count) * 100}%` : "0%",
                      }}
                    />
                  </div>
                </div>

                <div
                  className="relative z-10 flex items-center justify-between text-xs opacity-60 mb-4"
                  style={{ color: "var(--color-text)" }}
                >
                  <div className="flex items-center space-x-1">
                    <Calendar size={12} />
                    <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock size={12} />
                    <span>Updated {new Date(project.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="relative z-10 flex space-x-2">
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex-1 text-center px-4 py-2 rounded-xl border-2 border-[var(--color-border)] hover:shadow-md transition-all duration-200 font-medium"
                    style={{
                      backgroundColor: `${project.color}20`,
                      color: "var(--color-text)",
                    }}
                  >
                    View
                  </Link>
                  <button
                    onClick={() => {
                      setSelectedProject(project)
                      setShowEditModal(true)
                    }}
                    className="px-4 py-2 rounded-xl border-2 border-[var(--color-border)] hover:shadow-md transition-all duration-200 font-medium"
                    style={{
                      backgroundColor: `${project.color}10`,
                      color: "var(--color-text)",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setProjectToDelete(project)
                      setShowDeleteModal(true)
                    }}
                    className="px-4 py-2 rounded-xl border-2 border-[var(--color-border)] hover:bg-red-500 hover:bg-opacity-10 transition-all duration-200 font-medium"
                    style={{ color: "var(--color-text)" }}
                    title="Delete Project"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border-2 border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:bg-opacity-10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style={{ color: "var(--color-text)" }}
            >
              <ChevronLeft size={20} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 rounded-xl border-2 border-[var(--color-border)] font-medium transition-all duration-200 ${
                  currentPage === page
                    ? "bg-[var(--color-primary)] bg-opacity-20 shadow-lg"
                    : "hover:bg-[var(--color-primary)] hover:bg-opacity-10"
                }`}
                style={{ color: "var(--color-text)" }}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border-2 border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:bg-opacity-10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style={{ color: "var(--color-text)" }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && projectToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div
              className="p-8 rounded-3xl border-2 shadow-2xl max-w-md w-full mx-4 animate-in slide-in-from-bottom-4 duration-300"
              style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
                  Delete Project
                </h3>
                <p className="opacity-70 mb-6" style={{ color: "var(--color-text)" }}>
                  Are you sure you want to delete "{projectToDelete.name}"? This action cannot be undone.
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false)
                      setProjectToDelete(null)
                    }}
                    className="flex-1 px-4 py-3 hover:bg-red-600 hover:text-white rounded-2xl border-2 border-[var(--color-border)] transition-all duration-200 font-medium"
                    style={{ color: "var(--color-text)" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deleteProject}
                    className="flex-1 px-4 py-3 hover:bg-gray-600 hover:text-white rounded-2xl border-2 border-[var(--color-border)] transition-all duration-200 font-medium"
                    style={{ color: "var(--color-text)" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <ProjectFormModal
          isOpen={showProjectModal}
          onClose={() => setShowProjectModal(false)}
          onSuccess={fetchProjects}
        />
        <ProjectEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={fetchProjects}
          project={selectedProject}
        />
      </div>
    </Sidebar>
  )
}
