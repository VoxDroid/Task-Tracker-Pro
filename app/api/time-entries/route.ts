import { type NextRequest, NextResponse } from 'next/server'
import { executeQuery, executeUpdate, logActivity } from '@/lib/database'

export async function GET() {
  try {
    const entries = executeQuery(`
      SELECT te.*, t.title as task_title, p.name as project_name
      FROM time_entries te
      JOIN tasks t ON te.task_id = t.id
      LEFT JOIN projects p ON t.project_id = p.id
      ORDER BY te.created_at DESC
      LIMIT 50
    `)

    return NextResponse.json(entries)
  } catch (error) {
    console.error('Error fetching time entries:', error)
    return NextResponse.json({ error: 'Failed to fetch time entries' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { task_id, description } = body

    if (!task_id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    const result = executeUpdate(
      `
      INSERT INTO time_entries (task_id, start_time, description)
      VALUES (?, ?, ?)
    `,
      [task_id, new Date().toISOString(), description]
    )

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Failed to create time entry' }, { status: 500 })
    }

    const entryId = result.lastInsertRowid

    // Get task info for better logging
    const taskInfo = executeQuery('SELECT title FROM tasks WHERE id = ?', [task_id])[0] as any
    const details = [
      `Task: "${taskInfo?.title || 'Unknown'}"`,
      description && `Description: "${description}"`
    ]
      .filter(Boolean)
      .join(', ')

    logActivity('started', 'time_entry', entryId, `Started time tracking: ${details}`)

    const entry = executeQuery(
      `
      SELECT te.*, t.title as task_title, p.name as project_name
      FROM time_entries te
      JOIN tasks t ON te.task_id = t.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE te.id = ?
    `,
      [entryId]
    )[0]

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Error creating time entry:', error)
    return NextResponse.json({ error: 'Failed to create time entry' }, { status: 500 })
  }
}
