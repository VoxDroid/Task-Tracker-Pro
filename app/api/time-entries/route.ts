import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, logActivity } from "@/lib/database"

export async function GET() {
  try {
    const db = getDatabase()
    const entries = db
      .prepare(`
      SELECT te.*, t.title as task_title, p.name as project_name
      FROM time_entries te
      JOIN tasks t ON te.task_id = t.id
      LEFT JOIN projects p ON t.project_id = p.id
      ORDER BY te.created_at DESC
      LIMIT 50
    `)
      .all()

    return NextResponse.json(entries)
  } catch (error) {
    console.error("Error fetching time entries:", error)
    return NextResponse.json({ error: "Failed to fetch time entries" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { task_id, description } = body

    if (!task_id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
    }

    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO time_entries (task_id, start_time, description)
      VALUES (?, ?, ?)
    `)

    const result = stmt.run(task_id, new Date().toISOString(), description)
    const entryId = result.lastInsertRowid as number

    logActivity("started", "time_entry", entryId, `Started time tracking for task`)

    const entry = db
      .prepare(`
      SELECT te.*, t.title as task_title, p.name as project_name
      FROM time_entries te
      JOIN tasks t ON te.task_id = t.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE te.id = ?
    `)
      .get(entryId)

    return NextResponse.json(entry)
  } catch (error) {
    console.error("Error creating time entry:", error)
    return NextResponse.json({ error: "Failed to create time entry" }, { status: 500 })
  }
}
