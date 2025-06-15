import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, logActivity } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const db = getDatabase()

    // Start transaction
    db.exec("BEGIN TRANSACTION")

    try {
      // Clear existing data
      db.exec(`
        DELETE FROM task_tags;
        DELETE FROM tags;
        DELETE FROM time_entries;
        DELETE FROM activity_logs;
        DELETE FROM tasks;
        DELETE FROM projects;
      `)

      // Import projects
      if (data.projects?.length > 0) {
        const projectStmt = db.prepare(`
          INSERT INTO projects (id, name, description, color, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        for (const project of data.projects) {
          projectStmt.run(
            project.id,
            project.name,
            project.description,
            project.color,
            project.status,
            project.created_at,
            project.updated_at,
          )
        }
      }

      // Import tasks
      if (data.tasks?.length > 0) {
        const taskStmt = db.prepare(`
          INSERT INTO tasks (id, title, description, project_id, status, priority, assigned_to, due_date, completed_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        for (const task of data.tasks) {
          taskStmt.run(
            task.id,
            task.title,
            task.description,
            task.project_id,
            task.status,
            task.priority,
            task.assigned_to,
            task.due_date,
            task.completed_at,
            task.created_at,
            task.updated_at,
          )
        }
      }

      // Import time entries
      if (data.time_entries?.length > 0) {
        const timeStmt = db.prepare(`
          INSERT INTO time_entries (id, task_id, start_time, end_time, duration, description, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        for (const entry of data.time_entries) {
          timeStmt.run(
            entry.id,
            entry.task_id,
            entry.start_time,
            entry.end_time,
            entry.duration,
            entry.description,
            entry.created_at,
          )
        }
      }

      // Import tags
      if (data.tags?.length > 0) {
        const tagStmt = db.prepare(`
          INSERT INTO tags (id, name, color, created_at)
          VALUES (?, ?, ?, ?)
        `)
        for (const tag of data.tags) {
          tagStmt.run(tag.id, tag.name, tag.color, tag.created_at)
        }
      }

      // Import task_tags
      if (data.task_tags?.length > 0) {
        const taskTagStmt = db.prepare(`
          INSERT INTO task_tags (task_id, tag_id)
          VALUES (?, ?)
        `)
        for (const taskTag of data.task_tags) {
          taskTagStmt.run(taskTag.task_id, taskTag.tag_id)
        }
      }

      // Import activity logs (optional, as they might be regenerated)
      if (data.activity_logs?.length > 0) {
        const logStmt = db.prepare(`
          INSERT INTO activity_logs (id, action, entity_type, entity_id, details, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `)
        for (const log of data.activity_logs) {
          logStmt.run(log.id, log.action, log.entity_type, log.entity_id, log.details, log.created_at)
        }
      }

      // Commit transaction
      db.exec("COMMIT")

      logActivity("imported", "database", 0, "Database imported successfully")

      return NextResponse.json({ success: true })
    } catch (error) {
      // Rollback on error
      db.exec("ROLLBACK")
      throw error
    }
  } catch (error) {
    console.error("Error importing data:", error)
    return NextResponse.json({ error: "Failed to import data" }, { status: 500 })
  }
}
