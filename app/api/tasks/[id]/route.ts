import { type NextRequest, NextResponse } from "next/server"
import { executeQuery, executeUpdate, logActivity } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const taskId = Number.parseInt(id)

    const task = executeQuery(
      `
      SELECT t.*, p.name as project_name, p.color as project_color
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = ?
    `,
      [taskId],
    )[0]

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error("Error fetching task:", error)
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const taskId = Number.parseInt(id)
    const body = await request.json()
    const { title, description, project_id, status, priority, assigned_to, due_date, is_favorite } = body

    // Get current task data before updating for comparison
    const currentTask = executeQuery("SELECT * FROM tasks WHERE id = ?", [taskId])[0] as any
    if (!currentTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const updates: string[] = []
    const values: any[] = []
    const changes: string[] = []

    if (title !== undefined && title !== currentTask.title) {
      updates.push("title = ?")
      values.push(title)
      changes.push(`title: "${currentTask.title}" → "${title}"`)
    }
    if (description !== undefined && description !== currentTask.description) {
      updates.push("description = ?")
      values.push(description)
      const oldDesc = currentTask.description ? `"${currentTask.description.substring(0, 50)}${currentTask.description.length > 50 ? '...' : ''}"` : "none"
      const newDesc = description ? `"${description.substring(0, 50)}${description.length > 50 ? '...' : ''}"` : "none"
      changes.push(`description: ${oldDesc} → ${newDesc}`)
    }
    if (project_id !== undefined && project_id !== currentTask.project_id) {
      updates.push("project_id = ?")
      values.push(project_id)
      changes.push(`project: ${currentTask.project_id || "none"} → ${project_id || "none"}`)
    }
    if (status !== undefined && status !== currentTask.status) {
      updates.push("status = ?")
      values.push(status)
      changes.push(`status: ${currentTask.status} → ${status}`)
      if (status === "completed") {
        updates.push("completed_at = ?")
        values.push(new Date().toISOString())
      } else {
        // Reset completed_at when status changes to non-completed
        updates.push("completed_at = ?")
        values.push(null)
      }
    }
    if (priority !== undefined && priority !== currentTask.priority) {
      updates.push("priority = ?")
      values.push(priority)
      changes.push(`priority: ${currentTask.priority} → ${priority}`)
    }
    if (assigned_to !== undefined && assigned_to !== currentTask.assigned_to) {
      updates.push("assigned_to = ?")
      values.push(assigned_to)
      changes.push(`assigned to: ${currentTask.assigned_to || "unassigned"} → ${assigned_to || "unassigned"}`)
    }
    if (due_date !== undefined && due_date !== currentTask.due_date) {
      updates.push("due_date = ?")
      values.push(due_date)
      changes.push(`due date: ${currentTask.due_date || "none"} → ${due_date || "none"}`)
    }
    if (is_favorite !== undefined && (is_favorite ? 1 : 0) !== currentTask.is_favorite) {
      updates.push("is_favorite = ?")
      values.push(is_favorite ? 1 : 0)
      changes.push(`favorite: ${currentTask.is_favorite ? "yes" : "no"} → ${is_favorite ? "yes" : "no"}`)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 })
    }

    updates.push("updated_at = ?")
    values.push(new Date().toISOString())
    values.push(taskId)

    const result = executeUpdate(
      `
      UPDATE tasks SET ${updates.join(", ")}
      WHERE id = ?
    `,
      values,
    )

    if (result.changes === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Log the specific changes
    const changeSummary = changes.length > 0 ? `Updated task "${currentTask.title}": ${changes.join(", ")}` : `Updated task "${currentTask.title}" (no field changes detected)`
    logActivity("updated", "task", taskId, changeSummary)

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
    console.error("Error updating task:", error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const taskId = Number.parseInt(id)
    const body = await request.json()
    const { title, description, project_id, status, priority, assigned_to, due_date, is_favorite } = body

    const updates: string[] = []
    const values: any[] = []

    if (title !== undefined) {
      updates.push("title = ?")
      values.push(title)
    }
    if (description !== undefined) {
      updates.push("description = ?")
      values.push(description)
    }
    if (project_id !== undefined) {
      updates.push("project_id = ?")
      values.push(project_id)
    }
    if (status !== undefined) {
      updates.push("status = ?")
      values.push(status)
      if (status === "completed") {
        updates.push("completed_at = ?")
        values.push(new Date().toISOString())
      } else {
        // Reset completed_at when status changes to non-completed
        updates.push("completed_at = ?")
        values.push(null)
      }
    }
    if (priority !== undefined) {
      updates.push("priority = ?")
      values.push(priority)
    }
    if (assigned_to !== undefined) {
      updates.push("assigned_to = ?")
      values.push(assigned_to)
    }
    if (due_date !== undefined) {
      updates.push("due_date = ?")
      values.push(due_date)
    }
    if (is_favorite !== undefined) {
      updates.push("is_favorite = ?")
      values.push(is_favorite ? 1 : 0)
    }

    updates.push("updated_at = ?")
    values.push(new Date().toISOString())
    values.push(taskId)

    const result = executeUpdate(
      `
      UPDATE tasks SET ${updates.join(", ")}
      WHERE id = ?
    `,
      values,
    )

    if (result.changes === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Get current task name for logging
    const currentTask = executeQuery("SELECT title FROM tasks WHERE id = ?", [taskId])[0] as any
    logActivity("updated", "task", taskId, `Updated task: ${currentTask?.title || "Unknown"}`)

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
    console.error("Error updating task:", error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const taskId = Number.parseInt(id)

    // Get task info before deletion for logging
    const taskInfo = executeQuery(
      `
      SELECT t.*, p.name as project_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = ?
    `,
      [taskId],
    )[0] as any

    if (!taskInfo) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const result = executeUpdate("DELETE FROM tasks WHERE id = ?", [taskId])

    if (result.changes === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Create detailed deletion log
    const details = [
      `Title: "${taskInfo.title}"`,
      taskInfo.description && `Description: "${taskInfo.description.substring(0, 50)}${taskInfo.description.length > 50 ? '...' : ''}"`,
      taskInfo.project_name && `Project: "${taskInfo.project_name}"`,
      `Status: ${taskInfo.status}`,
      `Priority: ${taskInfo.priority}`
    ].filter(Boolean).join(", ")
    
    logActivity("deleted", "task", taskId, `Deleted task: ${details}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 })
  }
}
