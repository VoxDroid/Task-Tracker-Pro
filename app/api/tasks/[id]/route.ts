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

    const result = executeUpdate("DELETE FROM tasks WHERE id = ?", [taskId])

    if (result.changes === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    logActivity("deleted", "task", taskId, `Deleted task`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 })
  }
}
