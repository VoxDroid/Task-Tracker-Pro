import { type NextRequest, NextResponse } from "next/server"
import { executeQuery, executeUpdate, logActivity } from "@/lib/database"

export async function GET() {
  try {
    const projects = executeQuery(`
      SELECT p.*, 
             COUNT(t.id) as task_count,
             COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id AND t.status != 'archived'
      WHERE p.status != 'archived'
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `)

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, color } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const result = executeUpdate(
      `
      INSERT INTO projects (name, description, color)
      VALUES (?, ?, ?)
    `,
      [name, description, color || "#6366f1"],
    )

    if (result.changes === 0) {
      return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
    }

    const projectId = result.lastInsertRowid
    logActivity("created", "project", projectId, `Created project: ${name}`)

    const project = executeQuery("SELECT * FROM projects WHERE id = ?", [projectId])[0]
    return NextResponse.json(project)
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}
