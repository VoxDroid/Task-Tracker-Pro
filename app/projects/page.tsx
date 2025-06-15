"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Sidebar from "@/components/sidebar"
import ProjectFormModal from "@/components/project-form-modal"
import ProjectEditModal from "@/components/project-edit-modal"
import { Plus, FolderOpen, CheckCircle, Circle } from "lucide-react"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    const handleOpenProjectModal = () => setShowProjectModal(true)
    window.addEventListener("openProjectModal", handleOpenProjectModal)
    return () => window.removeEventListener("openProjectModal", handleOpenProjectModal)
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error("Error fetching projects:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-full">
          <div className="text-lg font-medium text-gray-600">Loading projects...</div>
        </div>
      </Sidebar>
    )
  }

  return (
    <Sidebar>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-black mb-2">Projects</h1>
            <p className="text-lg text-gray-600">Organize your tasks into projects</p>
          </div>
          <button
            onClick={() => setShowProjectModal(true)}
            className="flex items-center px-6 py-3 bg-purple-100 text-purple-800 rounded-2xl border-2 border-black hover:bg-purple-200 hover:shadow-lg hover:transform hover:scale-105 transition-all duration-200 font-medium"
          >
            <Plus size={20} />
            <span className="ml-2">New Project</span>
          </button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <FolderOpen className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-gray-500 text-xl mb-4">No projects found</p>
              <button
                onClick={() => setShowProjectModal(true)}
                className="inline-flex items-center px-6 py-3 bg-purple-100 text-purple-800 rounded-2xl border-2 border-black hover:bg-purple-200 hover:shadow-lg hover:transform hover:scale-105 transition-all duration-200 font-medium"
              >
                <Plus size={16} />
                <span className="ml-2">Create your first project</span>
              </button>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className="bg-white p-8 rounded-2xl border-2 border-black shadow-lg hover:shadow-xl hover:transform hover:scale-105 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-black mr-4 shadow-md"
                      style={{ backgroundColor: project.color }}
                    />
                    <h3 className="text-xl font-bold text-black">{project.name}</h3>
                  </div>
                  <FolderOpen size={24} className="text-gray-400" />
                </div>

                {project.description && <p className="text-gray-600 mb-6 text-lg">{project.description}</p>}

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                      <Circle size={16} />
                      <span className="ml-2 font-medium">{project.task_count || 0} tasks</span>
                    </div>
                    <div className="flex items-center bg-green-50 px-3 py-2 rounded-xl border border-green-200">
                      <CheckCircle size={16} className="text-green-600" />
                      <span className="ml-2 font-medium text-green-700">{project.completed_tasks || 0} completed</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span className="font-medium">Progress</span>
                    <span className="font-bold">
                      {project.task_count > 0 ? Math.round((project.completed_tasks / project.task_count) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 border-2 border-black">
                    <div
                      className="bg-green-400 h-full rounded-full transition-all duration-500 border-r-2 border-black"
                      style={{
                        width:
                          project.task_count > 0 ? `${(project.completed_tasks / project.task_count) * 100}%` : "0%",
                      }}
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex-1 text-center px-4 py-3 bg-blue-100 text-blue-800 rounded-xl border-2 border-black hover:bg-blue-200 hover:shadow-md hover:transform hover:scale-105 transition-all duration-200 font-bold"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => {
                      setSelectedProject(project)
                      setShowEditModal(true)
                    }}
                    className="px-4 py-3 bg-yellow-100 text-yellow-800 rounded-xl border-2 border-black hover:bg-yellow-200 hover:shadow-md hover:transform hover:scale-105 transition-all duration-200 font-bold"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

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
