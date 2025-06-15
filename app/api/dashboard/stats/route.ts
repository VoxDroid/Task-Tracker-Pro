import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/database"

export async function GET() {
  try {
    const db = getDatabase()

    // Get task statistics
    const taskStats = db
      .prepare(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN due_date < datetime('now') AND status != 'completed' THEN 1 END) as overdue_tasks
      FROM tasks 
      WHERE status != 'archived'
    `)
      .get() as any

    // Get project statistics
    const projectStats = db
      .prepare(`
      SELECT 
        COUNT(*) as total_projects,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_projects
      FROM projects 
      WHERE status != 'archived'
    `)
      .get() as any

    // Get time tracking statistics
    const timeStats = db
      .prepare(`
      SELECT COALESCE(SUM(duration), 0) as total_time_logged
      FROM time_entries
    `)
      .get() as any

    const stats = {
      totalTasks: taskStats.total_tasks || 0,
      completedTasks: taskStats.completed_tasks || 0,
      inProgressTasks: taskStats.in_progress_tasks || 0,
      overdueTasks: taskStats.overdue_tasks || 0,
      totalProjects: projectStats.total_projects || 0,
      activeProjects: projectStats.active_projects || 0,
      totalTimeLogged: timeStats.total_time_logged || 0,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}
