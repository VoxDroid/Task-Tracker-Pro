import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'

export async function GET() {
  try {
    // Get task statistics
    const taskStats =
      executeQuery(`
      SELECT
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN due_date < datetime('now') AND status != 'completed' THEN 1 END) as overdue_tasks
      FROM tasks
      WHERE status != 'archived'
    `)[0] || {}

    // Get project statistics
    const projectStats =
      executeQuery(`
      SELECT
        COUNT(*) as total_projects,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_projects
      FROM projects
      WHERE status != 'archived'
    `)[0] || {}

    // Get time tracking statistics
    const timeStats =
      executeQuery(`
      SELECT COALESCE(SUM(duration), 0) as total_time_logged
      FROM time_entries
    `)[0] || {}

    // Task completion over time (last 30 days)
    const completionTrend = executeQuery(`
      SELECT
        DATE(completed_at) as date,
        COUNT(*) as completed
      FROM tasks
      WHERE completed_at >= date('now', '-30 days')
        AND status = 'completed'
      GROUP BY DATE(completed_at)
      ORDER BY date
    `)

    // Tasks by status
    const tasksByStatus = executeQuery(`
      SELECT
        status,
        COUNT(*) as count
      FROM tasks
      WHERE status != 'archived'
      GROUP BY status
    `)

    // Tasks by priority
    const tasksByPriority = executeQuery(`
      SELECT
        priority,
        COUNT(*) as count
      FROM tasks
      WHERE status != 'archived'
      GROUP BY priority
    `)

    // Project progress
    const projectProgress = executeQuery(`
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

    // Activity over time (last 7 days)
    const activityTrend = executeQuery(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as activities
      FROM activity_logs
      WHERE created_at >= date('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date
    `)

    // Recent activity
    const recentActivity = executeQuery(`
      SELECT * FROM activity_logs
      ORDER BY created_at DESC
      LIMIT 5
    `)

    // Upcoming tasks
    const upcomingTasks = executeQuery(`
      SELECT t.*, p.name as project_name, p.color as project_color
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.due_date IS NOT NULL
        AND t.status != 'completed'
        AND t.status != 'archived'
      ORDER BY t.due_date ASC
      LIMIT 5
    `)

    const result = {
      stats: {
        totalTasks: taskStats.total_tasks || 0,
        completedTasks: taskStats.completed_tasks || 0,
        inProgressTasks: taskStats.in_progress_tasks || 0,
        overdueTasks: taskStats.overdue_tasks || 0,
        totalProjects: projectStats.total_projects || 0,
        activeProjects: projectStats.active_projects || 0,
        totalTimeLogged: timeStats.total_time_logged || 0
      },
      charts: {
        completionTrend,
        tasksByStatus,
        tasksByPriority,
        projectProgress,
        activityTrend
      },
      recentActivity,
      upcomingTasks
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
