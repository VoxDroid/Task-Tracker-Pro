import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, logActivity } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const projectId = Number.parseInt(id)
    const db = getDatabase()

    const project = db
      .prepare(`
        SELECT p.*, 
               COUNT(t.id) as task_count,
               COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
        FROM projects p
        LEFT JOIN tasks t ON p.id = t.project_id AND t.status != 'archived'
        WHERE p.id = ?
        GROUP BY p.id
      `)
      .get(projectId)

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error("Error fetching project:", error)
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const projectId = Number.parseInt(id)
    const body = await request.json()

    const db = getDatabase()

    // Get current project for logging
    const currentProject = db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId) as any
    if (!currentProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Build update query dynamically and track changes
    const updateFields = []
    const values = []
    const changes: string[] = []

    for (const [key, value] of Object.entries(body)) {
      if (key !== "id" && currentProject[key] !== value) {
        updateFields.push(`${key} = ?`)
        values.push(value)
        
        // Create readable change descriptions
        if (key === "name") {
          changes.push(`name: "${currentProject.name}" → "${value}"`)
        } else if (key === "description") {
          const oldDesc = currentProject.description ? `"${currentProject.description.substring(0, 50)}${currentProject.description.length > 50 ? '...' : ''}"` : "none"
          const newDesc = value ? `"${(value as string).substring(0, 50)}${(value as string).length > 50 ? '...' : ''}"` : "none"
          changes.push(`description: ${oldDesc} → ${newDesc}`)
        } else if (key === "color") {
          changes.push(`color: ${currentProject.color} → ${value}`)
        } else if (key === "status") {
          changes.push(`status: ${currentProject.status} → ${value}`)
        }
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    // Add updated_at and project ID
    updateFields.push("updated_at = CURRENT_TIMESTAMP")
    values.push(projectId)

    const query = `UPDATE projects SET ${updateFields.join(", ")} WHERE id = ?`
    db.prepare(query).run(...values)

    // Log the specific changes
    const changeSummary = changes.length > 0 ? `Updated project "${currentProject.name}": ${changes.join(", ")}` : `Updated project "${currentProject.name}" (no field changes detected)`
    logActivity("updated", "project", projectId, changeSummary)

    // Return updated project
    const updatedProject = db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId)
    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error("Error updating project:", error)
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const projectId = Number.parseInt(id)

    const db = getDatabase()

    // Get project info for detailed logging
    const project = db.prepare(`
      SELECT p.*, COUNT(t.id) as task_count
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE p.id = ?
      GROUP BY p.id
    `).get(projectId) as any
    
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Update tasks to remove project association
    db.prepare("UPDATE tasks SET project_id = NULL WHERE project_id = ?").run(projectId)

    // Delete project
    db.prepare("DELETE FROM projects WHERE id = ?").run(projectId)

    // Create detailed deletion log
    const details = [
      `Name: "${project.name}"`,
      project.description && `Description: "${project.description.substring(0, 50)}${project.description.length > 50 ? '...' : ''}"`,
      `Tasks: ${project.task_count}`,
      `Color: ${project.color}`
    ].filter(Boolean).join(", ")
    
    logActivity("deleted", "project", projectId, `Deleted project: ${details}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
  }
}
