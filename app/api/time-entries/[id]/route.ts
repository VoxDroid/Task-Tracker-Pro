import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, logActivity } from "@/lib/database"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const entryId = Number.parseInt(resolvedParams.id)
    const body = await request.json()
    const { end_time, description } = body

    const db = getDatabase()

    // Get current entry
    const currentEntry = db.prepare("SELECT * FROM time_entries WHERE id = ?").get(entryId) as any
    if (!currentEntry) {
      return NextResponse.json({ error: "Time entry not found" }, { status: 404 })
    }

    // If updating description only
    if (description !== undefined && !end_time) {
      const stmt = db.prepare(`
        UPDATE time_entries 
        SET description = ?
        WHERE id = ?
      `)
      stmt.run(description, entryId)

    if (description !== undefined && !end_time) {
      const stmt = db.prepare(`
        UPDATE time_entries 
        SET description = ?
        WHERE id = ?
      `)
      stmt.run(description, entryId)

      // Get task info for better logging
      const entryInfo = db.prepare(`
        SELECT te.description as old_description, t.title as task_title
        FROM time_entries te
        JOIN tasks t ON te.task_id = t.id
        WHERE te.id = ?
      `).get(entryId) as any
      
      const oldDesc = entryInfo?.old_description ? `"${entryInfo.old_description}"` : "none"
      const newDesc = description ? `"${description}"` : "none"
      
      logActivity("updated", "time_entry", entryId, `Updated time entry description for "${entryInfo?.task_title || "Unknown task"}": ${oldDesc} → ${newDesc}`)

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
    }

    // If stopping timer (updating end_time)
    if (end_time) {
      // Calculate duration in seconds
      const startTime = new Date(currentEntry.start_time)
      const endTime = new Date(end_time)
      const durationSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000)

      // Update entry with end_time and duration in seconds
      const stmt = db.prepare(`
        UPDATE time_entries 
        SET end_time = ?, duration = ?
        WHERE id = ?
      `)

      stmt.run(end_time, durationSeconds, entryId)

      logActivity(
        "stopped",
        "time_entry",
        entryId,
        `Stopped time tracking (${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s)`,
      )

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
    }

    return NextResponse.json({ error: "No valid update data provided" }, { status: 400 })
  } catch (error) {
    console.error("Error updating time entry:", error)
    return NextResponse.json({ error: "Failed to update time entry" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const entryId = Number.parseInt(resolvedParams.id)

    const db = getDatabase()

    // Check if entry exists
    const entry = db.prepare("SELECT * FROM time_entries WHERE id = ?").get(entryId) as any
    if (!entry) {
      return NextResponse.json({ error: "Time entry not found" }, { status: 404 })
    }

    // Delete the time entry
    const stmt = db.prepare("DELETE FROM time_entries WHERE id = ?")
    stmt.run(entryId)

    // Get task info for better logging
    const entryInfo = db.prepare(`
      SELECT te.*, t.title as task_title, p.name as project_name
      FROM time_entries te
      JOIN tasks t ON te.task_id = t.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE te.id = ?
    `).get(entryId) as any
    
    // Delete the time entry
    const stmt = db.prepare("DELETE FROM time_entries WHERE id = ?")
    stmt.run(entryId)

    const duration = entryInfo?.duration ? `${Math.floor(entryInfo.duration / 60)}m ${entryInfo.duration % 60}s` : "incomplete"
    const details = [
      `Task: "${entryInfo?.task_title || "Unknown"}"`,
      `Duration: ${duration}`,
      entryInfo?.description && `Description: "${entryInfo.description}"`,
      entryInfo?.project_name && `Project: "${entryInfo.project_name}"`
    ].filter(Boolean).join(", ")
    
    logActivity("deleted", "time_entry", entryId, `Deleted time entry: ${details}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting time entry:", error)
    return NextResponse.json({ error: "Failed to delete time entry" }, { status: 500 })
  }
}
