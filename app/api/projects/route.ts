import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, logActivity } from "@/lib/database"

export async function GET() {
  try {
    const db = getDatabase()
    const projects = db
      .prepare(`
      SELECT p.*, 
             COUNT(t.id) as task_count,
             COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id AND t.status != 'archived'
      WHERE p.status != 'archived'
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `)
      .all()

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

    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO projects (name, description, color)
      VALUES (?, ?, ?)
    `)

    const result = stmt.run(name, description, color || "#6366f1")
    const projectId = result.lastInsertRowid as number

    logActivity("created", "project", projectId, `Created project: ${name}`)

    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId)
    return NextResponse.json(project)
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}
