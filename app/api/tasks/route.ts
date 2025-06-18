import { type NextRequest, NextResponse } from "next/server"
import { executeQuery, executeUpdate, logActivity } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const projectId = searchParams.get("project_id")
    const archived = searchParams.get("archived") === "true"
    const favorites = searchParams.get("favorites") === "true"

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

    if (favorites) {
      query += " AND t.is_favorite = 1"
    }

    query += " ORDER BY t.created_at DESC"

    const tasks = executeQuery(query, params)
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

    const result = executeUpdate(
      `
      INSERT INTO tasks (title, description, project_id, priority, assigned_to, due_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [title, description, project_id, priority || "medium", assigned_to, due_date],
    )

    if (result.changes === 0) {
      return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
    }

    const taskId = result.lastInsertRowid
    logActivity("created", "task", taskId, `Created task: ${title}`)

    const task = executeQuery(
      `
      SELECT t.*, p.name as project_name, p.color as project_color
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = ?
    `,
      [taskId],
    )[0]

    return NextResponse.json(task)
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}
