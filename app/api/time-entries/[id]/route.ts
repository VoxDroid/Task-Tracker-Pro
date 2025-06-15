import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, logActivity } from "@/lib/database"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const entryId = Number.parseInt(params.id)
    const body = await request.json()
    const { end_time } = body

    const db = getDatabase()

    // Get current entry
    const currentEntry = db.prepare("SELECT * FROM time_entries WHERE id = ?").get(entryId) as any
    if (!currentEntry) {
      return NextResponse.json({ error: "Time entry not found" }, { status: 404 })
    }

    // Calculate duration
    const startTime = new Date(currentEntry.start_time)
    const endTime = new Date(end_time)
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)) // in minutes

    // Update entry
    const stmt = db.prepare(`
      UPDATE time_entries 
      SET end_time = ?, duration = ?
      WHERE id = ?
    `)

    stmt.run(end_time, duration, entryId)

    logActivity("stopped", "time_entry", entryId, `Stopped time tracking (${duration} minutes)`)

    // Return updated entry
    const updatedEntry = db
      .prepare(`
      SELECT te.*, t.title as task_title, p.name as project_name
      FROM time_entries te
      JOIN tasks t ON te.task_id = t.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE te.id = ?
    `)
      .get(entryId)

    return NextResponse.json(updatedEntry)
  } catch (error) {
    console.error("Error updating time entry:", error)
    return NextResponse.json({ error: "Failed to update time entry" }, { status: 500 })
  }
}
