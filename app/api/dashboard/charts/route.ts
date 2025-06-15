import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/database"

export async function GET() {
  try {
    const db = getDatabase()

    // Task completion over time (last 30 days)
    const completionTrend = db
      .prepare(`
      SELECT 
        DATE(completed_at) as date,
        COUNT(*) as completed
      FROM tasks 
      WHERE completed_at >= date('now', '-30 days')
        AND status = 'completed'
      GROUP BY DATE(completed_at)
      ORDER BY date
    `)
      .all()

    // Tasks by status
    const tasksByStatus = db
      .prepare(`
      SELECT 
        status,
        COUNT(*) as count
      FROM tasks 
      WHERE status != 'archived'
      GROUP BY status
    `)
      .all()

    // Tasks by priority
    const tasksByPriority = db
      .prepare(`
      SELECT 
        priority,
        COUNT(*) as count
      FROM tasks 
      WHERE status != 'archived'
      GROUP BY priority
    `)
      .all()

    // Project progress
    const projectProgress = db
      .prepare(`
      SELECT 
        p.name,
        COUNT(t.id) as total_tasks,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id AND t.status != 'archived'
      WHERE p.status = 'active'
      GROUP BY p.id, p.name
      HAVING total_tasks > 0
      ORDER BY p.name
    `)
      .all()

    // Activity over time (last 7 days)
    const activityTrend = db
      .prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as activities
      FROM activity_logs 
      WHERE created_at >= date('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date
    `)
      .all()

    return NextResponse.json({
      completionTrend,
      tasksByStatus,
      tasksByPriority,
      projectProgress,
      activityTrend,
    })
  } catch (error) {
    console.error("Error fetching dashboard charts:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard charts" }, { status: 500 })
  }
}
