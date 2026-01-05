import { type NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const db = getDatabase()
    const searchTerm = `%${query}%`
    const results = []

    // Search tasks
    const tasks = db
      .prepare(
        `
        SELECT t.id, t.title, t.description, t.status, t.priority, t.created_at,
               p.name as project_name, 'task' as type
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE (t.title LIKE ? OR t.description LIKE ?) AND t.status != 'archived'
        ORDER BY t.created_at DESC
        LIMIT 10
      `
      )
      .all(searchTerm, searchTerm)

    results.push(...tasks)

    // Search projects
    const projects = db
      .prepare(
        `
        SELECT id, name as title, description, status, created_at, 'project' as type
        FROM projects
        WHERE (name LIKE ? OR description LIKE ?) AND status != 'archived'
        ORDER BY created_at DESC
        LIMIT 10
      `
      )
      .all(searchTerm, searchTerm)

    results.push(...projects)

    // Search archived tasks
    const archivedTasks = db
      .prepare(
        `
        SELECT t.id, t.title, t.description, t.status, t.priority, t.created_at,
               p.name as project_name, 'archived_task' as type
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE (t.title LIKE ? OR t.description LIKE ?) AND t.status = 'archived'
        ORDER BY t.created_at DESC
        LIMIT 5
      `
      )
      .all(searchTerm, searchTerm)

    results.push(...archivedTasks)

    // Search time entries
    const timeEntries = db
      .prepare(
        `
        SELECT te.id, t.title, te.description, te.created_at,
               p.name as project_name, 'time_entry' as type
        FROM time_entries te
        JOIN tasks t ON te.task_id = t.id
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE (t.title LIKE ? OR te.description LIKE ?)
        ORDER BY te.created_at DESC
        LIMIT 5
      `
      )
      .all(searchTerm, searchTerm)

    results.push(...timeEntries)

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
