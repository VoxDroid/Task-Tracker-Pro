import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function GET() {
  try {
    const db = getDatabase()

    const data = {
      projects: db.prepare('SELECT * FROM projects').all(),
      tasks: db.prepare('SELECT * FROM tasks').all(),
      time_entries: db.prepare('SELECT * FROM time_entries').all(),
      activity_logs: db.prepare('SELECT * FROM activity_logs').all(),
      tags: db.prepare('SELECT * FROM tags').all(),
      task_tags: db.prepare('SELECT * FROM task_tags').all(),
      exported_at: new Date().toISOString()
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
