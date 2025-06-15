import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, logActivity } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const projectId = searchParams.get("project_id")
    const archived = searchParams.get("archived") === "true"

    const db = getDatabase()
    let query = `
      SELECT t.*, p.name as project_name, p.color as project_color
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE 1=1
    `
    const params: any[] = []

    if (archived) {
      query += " AND t.status = ?"
      params.push("archived")
    } else {
      query += " AND t.status != ?"
      params.push("archived")
    }

    if (status) {
      query += " AND t.status = ?"
      params.push(status)
    }

    if (projectId) {
      query += " AND t.project_id = ?"
      params.push(Number.parseInt(projectId))
    }

    query += " ORDER BY t.created_at DESC"

    const tasks = db.prepare(query).all(...params)
    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, project_id, priority, assigned_to, due_date } = body

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO tasks (title, description, project_id, priority, assigned_to, due_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    const result = stmt.run(title, description, project_id, priority || "medium", assigned_to, due_date)
    const taskId = result.lastInsertRowid as number

    logActivity("created", "task", taskId, `Created task: ${title}`)

    const task = db
      .prepare(`
      SELECT t.*, p.name as project_name, p.color as project_color
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = ?
    `)
      .get(taskId)

    return NextResponse.json(task)
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}
