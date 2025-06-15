import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, logActivity } from "@/lib/database"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const taskId = Number.parseInt(params.id)
    const body = await request.json()

    const db = getDatabase()

    // Get current task for logging
    const currentTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId) as any
    if (!currentTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Build update query dynamically
    const updateFields = []
    const values = []

    for (const [key, value] of Object.entries(body)) {
      if (key !== "id") {
        updateFields.push(`${key} = ?`)
        values.push(value)
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    // Add updated_at and task ID
    updateFields.push("updated_at = CURRENT_TIMESTAMP")
    values.push(taskId)

    const query = `UPDATE tasks SET ${updateFields.join(", ")} WHERE id = ?`
    db.prepare(query).run(...values)

    // Log the activity
    const changes = Object.entries(body)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ")
    logActivity("updated", "task", taskId, `Updated task: ${changes}`)

    // Return updated task
    const updatedTask = db
      .prepare(`
      SELECT t.*, p.name as project_name, p.color as project_color
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = ?
    `)
      .get(taskId)

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error("Error updating task:", error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const taskId = Number.parseInt(params.id)

    const db = getDatabase()

    // Get task for logging
    const task = db.prepare("SELECT title FROM tasks WHERE id = ?").get(taskId) as any
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Delete task
    db.prepare("DELETE FROM tasks WHERE id = ?").run(taskId)

    logActivity("deleted", "task", taskId, `Deleted task: ${task.title}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 })
  }
}
