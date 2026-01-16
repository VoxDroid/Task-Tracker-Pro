// Mock database for Vercel deployment (in-memory storage)
// This provides the same interface as the SQLite database but stores data in memory

interface Project {
  id: number
  name: string
  description: string | null
  color: string
  status: string
  is_favorite: number
  created_at: string
  updated_at: string
}

interface Task {
  id: number
  title: string
  description: string | null
  project_id: number | null
  status: string
  priority: string
  assigned_to: string | null
  due_date: string | null
  completed_at: string | null
  is_favorite: number
  created_at: string
  updated_at: string
  project_name?: string
  project_color?: string
}

interface ActivityLog {
  id: number
  action: string
  entity_type: string
  entity_id: number
  details: string | null
  created_at: string
}

interface TimeEntry {
  id: number
  task_id: number
  start_time: string
  end_time: string | null
  duration: number | null
  description: string | null
  created_at: string
}

interface Tag {
  id: number
  name: string
  color: string
  created_at: string
}

interface TaskTag {
  task_id: number
  tag_id: number
}

// In-memory storage
const store = {
  projects: [] as Project[],
  tasks: [] as Task[],
  activity_logs: [] as ActivityLog[],
  time_entries: [] as TimeEntry[],
  tags: [] as Tag[],
  task_tags: [] as TaskTag[],
  counters: {
    projects: 0,
    tasks: 0,
    activity_logs: 0,
    time_entries: 0,
    tags: 0
  }
}

// Initialize with sample data
function initializeSampleData() {
  if (store.projects.length > 0) return

  const now = new Date().toISOString()

  // Sample projects
  store.projects = [
    {
      id: 1,
      name: 'Website Redesign',
      description: 'Redesign the company website with modern UI/UX',
      color: '#6366f1',
      status: 'active',
      is_favorite: 1,
      created_at: now,
      updated_at: now
    },
    {
      id: 2,
      name: 'Mobile App Development',
      description: 'Build a cross-platform mobile application',
      color: '#10b981',
      status: 'active',
      is_favorite: 0,
      created_at: now,
      updated_at: now
    },
    {
      id: 3,
      name: 'API Integration',
      description: 'Integrate third-party APIs into the platform',
      color: '#f59e0b',
      status: 'active',
      is_favorite: 0,
      created_at: now,
      updated_at: now
    }
  ]

  // Sample tasks
  store.tasks = [
    {
      id: 1,
      title: 'Design homepage mockup',
      description: 'Create wireframes and high-fidelity mockups for the new homepage',
      project_id: 1,
      status: 'in_progress',
      priority: 'high',
      assigned_to: 'John Doe',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: null,
      is_favorite: 1,
      created_at: now,
      updated_at: now
    },
    {
      id: 2,
      title: 'Implement responsive navigation',
      description: 'Build a mobile-friendly navigation component',
      project_id: 1,
      status: 'todo',
      priority: 'medium',
      assigned_to: null,
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: null,
      is_favorite: 0,
      created_at: now,
      updated_at: now
    },
    {
      id: 3,
      title: 'Set up React Native project',
      description: 'Initialize the mobile app project with React Native',
      project_id: 2,
      status: 'completed',
      priority: 'high',
      assigned_to: 'Jane Smith',
      due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      is_favorite: 0,
      created_at: now,
      updated_at: now
    },
    {
      id: 4,
      title: 'Research payment gateway APIs',
      description: 'Evaluate Stripe, PayPal, and other payment providers',
      project_id: 3,
      status: 'todo',
      priority: 'urgent',
      assigned_to: null,
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: null,
      is_favorite: 1,
      created_at: now,
      updated_at: now
    },
    {
      id: 5,
      title: 'Write unit tests for auth module',
      description: 'Add comprehensive test coverage for authentication',
      project_id: null,
      status: 'todo',
      priority: 'low',
      assigned_to: null,
      due_date: null,
      completed_at: null,
      is_favorite: 0,
      created_at: now,
      updated_at: now
    }
  ]

  // Sample activity logs
  store.activity_logs = [
    {
      id: 1,
      action: 'created',
      entity_type: 'project',
      entity_id: 1,
      details: 'Created project "Website Redesign"',
      created_at: now
    },
    {
      id: 2,
      action: 'created',
      entity_type: 'task',
      entity_id: 1,
      details: 'Created task "Design homepage mockup"',
      created_at: now
    },
    {
      id: 3,
      action: 'status_changed',
      entity_type: 'task',
      entity_id: 3,
      details: 'Task status changed to completed',
      created_at: now
    }
  ]

  // Sample tags
  store.tags = [
    { id: 1, name: 'frontend', color: '#3b82f6', created_at: now },
    { id: 2, name: 'backend', color: '#10b981', created_at: now },
    { id: 3, name: 'urgent', color: '#ef4444', created_at: now },
    { id: 4, name: 'design', color: '#8b5cf6', created_at: now }
  ]

  store.counters = {
    projects: 3,
    tasks: 5,
    activity_logs: 3,
    time_entries: 0,
    tags: 4
  }
}

// Initialize sample data on module load
initializeSampleData()

function getTaskWithProject(task: Task): Task & { project_name?: string; project_color?: string } {
  const project = store.projects.find((p) => p.id === task.project_id)
  return {
    ...task,
    project_name: project?.name,
    project_color: project?.color
  }
}

export function logActivity(
  action: string,
  entityType: string,
  entityId: number,
  details?: string
): void {
  const now = new Date().toISOString()
  store.counters.activity_logs++
  store.activity_logs.push({
    id: store.counters.activity_logs,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details: details || null,
    created_at: now
  })
}

export function executeQuery<T = any>(query: string, params: any[] = []): T[] {
  const queryLower = query.toLowerCase()

  // Tasks queries
  if (queryLower.includes('from tasks')) {
    let results = [...store.tasks]

    // Filter by status
    if (queryLower.includes("t.status = 'archived'") || params.includes('archived')) {
      results = results.filter((t) => t.status === 'archived')
    } else if (queryLower.includes('t.status != ?') || queryLower.includes("t.status != 'archived'")) {
      results = results.filter((t) => t.status !== 'archived')
    }

    // Filter by specific status
    const statusMatch = queryLower.match(/t\.status = \?/)
    if (statusMatch && params.length > 0) {
      const statusIndex = params.findIndex((p) => ['todo', 'in_progress', 'completed'].includes(p))
      if (statusIndex !== -1) {
        results = results.filter((t) => t.status === params[statusIndex])
      }
    }

    // Filter by project_id
    if (queryLower.includes('t.project_id = ?')) {
      const projectId = params.find((p) => typeof p === 'number' && p > 0)
      if (projectId) {
        results = results.filter((t) => t.project_id === projectId)
      }
    }

    // Filter by favorites
    if (queryLower.includes('t.is_favorite = 1')) {
      results = results.filter((t) => t.is_favorite === 1)
    }

    // Filter by id
    if (queryLower.includes('t.id = ?')) {
      const taskId = params[params.length - 1]
      results = results.filter((t) => t.id === taskId)
    }

    // Sort by created_at desc
    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Apply limit/offset
    const limitMatch = params.find((p, i) => queryLower.includes('limit') && typeof p === 'number')
    const offsetMatch = params.find(
      (p, i) => queryLower.includes('offset') && typeof p === 'number' && i > 0
    )

    if (offsetMatch) {
      results = results.slice(offsetMatch)
    }
    if (limitMatch) {
      results = results.slice(0, limitMatch)
    }

    return results.map(getTaskWithProject) as T[]
  }

  // Projects queries
  if (queryLower.includes('from projects')) {
    let results = [...store.projects]

    // Filter by status
    if (queryLower.includes("status != 'archived'")) {
      results = results.filter((p) => p.status !== 'archived')
    } else if (queryLower.includes("status = 'archived'")) {
      results = results.filter((p) => p.status === 'archived')
    }

    // Filter by favorites
    if (queryLower.includes('is_favorite = 1')) {
      results = results.filter((p) => p.is_favorite === 1)
    }

    // Filter by id
    if (queryLower.includes('id = ?')) {
      const projectId = params[0]
      results = results.filter((p) => p.id === projectId)
    }

    // Add task counts
    return results.map((p) => ({
      ...p,
      task_count: store.tasks.filter((t) => t.project_id === p.id && t.status !== 'archived').length,
      completed_task_count: store.tasks.filter((t) => t.project_id === p.id && t.status === 'completed')
        .length
    })) as T[]
  }

  // Activity logs queries
  if (queryLower.includes('from activity_logs')) {
    let results = [...store.activity_logs]
    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Apply limit
    if (queryLower.includes('limit')) {
      const limitMatch = query.match(/limit\s+(\d+)/i)
      if (limitMatch) {
        results = results.slice(0, parseInt(limitMatch[1]))
      }
    }

    return results as T[]
  }

  // Time entries queries
  if (queryLower.includes('from time_entries')) {
    let results = [...store.time_entries]

    if (queryLower.includes('task_id = ?')) {
      const taskId = params[0]
      results = results.filter((t) => t.task_id === taskId)
    }

    return results as T[]
  }

  // Tags queries
  if (queryLower.includes('from tags')) {
    return [...store.tags] as T[]
  }

  // Task tags queries
  if (queryLower.includes('from task_tags')) {
    return [...store.task_tags] as T[]
  }

  // Dashboard stats
  if (queryLower.includes('count(*)')) {
    if (queryLower.includes('tasks')) {
      const count = store.tasks.filter((t) => t.status !== 'archived').length
      return [{ count }] as T[]
    }
    if (queryLower.includes('projects')) {
      const count = store.projects.filter((p) => p.status !== 'archived').length
      return [{ count }] as T[]
    }
  }

  return [] as T[]
}

export function executeQuerySingle<T = any>(query: string, params: any[] = []): T | null {
  const results = executeQuery<T>(query, params)
  return results[0] || null
}

export function executeUpdate(
  query: string,
  params: any[] = []
): { changes: number; lastInsertRowid: number } {
  const queryLower = query.toLowerCase()
  const now = new Date().toISOString()

  // INSERT operations
  if (queryLower.includes('insert into tasks')) {
    store.counters.tasks++
    const newTask: Task = {
      id: store.counters.tasks,
      title: params[0],
      description: params[1] || null,
      project_id: params[2] || null,
      priority: params[3] || 'medium',
      assigned_to: params[4] || null,
      due_date: params[5] || null,
      status: 'todo',
      completed_at: null,
      is_favorite: 0,
      created_at: now,
      updated_at: now
    }
    store.tasks.push(newTask)
    return { changes: 1, lastInsertRowid: newTask.id }
  }

  if (queryLower.includes('insert into projects')) {
    store.counters.projects++
    const newProject: Project = {
      id: store.counters.projects,
      name: params[0],
      description: params[1] || null,
      color: params[2] || '#6366f1',
      status: 'active',
      is_favorite: 0,
      created_at: now,
      updated_at: now
    }
    store.projects.push(newProject)
    return { changes: 1, lastInsertRowid: newProject.id }
  }

  if (queryLower.includes('insert into time_entries')) {
    store.counters.time_entries++
    const newEntry: TimeEntry = {
      id: store.counters.time_entries,
      task_id: params[0],
      start_time: params[1],
      end_time: params[2] || null,
      duration: params[3] || null,
      description: params[4] || null,
      created_at: now
    }
    store.time_entries.push(newEntry)
    return { changes: 1, lastInsertRowid: newEntry.id }
  }

  if (queryLower.includes('insert into tags')) {
    store.counters.tags++
    const newTag: Tag = {
      id: store.counters.tags,
      name: params[0],
      color: params[1] || '#6b7280',
      created_at: now
    }
    store.tags.push(newTag)
    return { changes: 1, lastInsertRowid: newTag.id }
  }

  // UPDATE operations
  if (queryLower.includes('update tasks')) {
    const idMatch = params[params.length - 1]
    const taskIndex = store.tasks.findIndex((t) => t.id === idMatch)
    if (taskIndex !== -1) {
      const task = store.tasks[taskIndex]

      if (queryLower.includes('status =')) {
        task.status = params[0]
        if (params[0] === 'completed') {
          task.completed_at = now
        }
      }
      if (queryLower.includes('is_favorite =')) {
        task.is_favorite = params[0]
      }
      if (queryLower.includes('title =')) {
        task.title = params[0]
        if (params[1] !== undefined) task.description = params[1]
        if (params[2] !== undefined) task.project_id = params[2]
        if (params[3] !== undefined) task.priority = params[3]
        if (params[4] !== undefined) task.assigned_to = params[4]
        if (params[5] !== undefined) task.due_date = params[5]
      }

      task.updated_at = now
      return { changes: 1, lastInsertRowid: task.id }
    }
  }

  if (queryLower.includes('update projects')) {
    const idMatch = params[params.length - 1]
    const projectIndex = store.projects.findIndex((p) => p.id === idMatch)
    if (projectIndex !== -1) {
      const project = store.projects[projectIndex]

      if (queryLower.includes('status =') && !queryLower.includes('name =')) {
        project.status = params[0]
      }
      if (queryLower.includes('is_favorite =')) {
        project.is_favorite = params[0]
      }
      if (queryLower.includes('name =')) {
        project.name = params[0]
        if (params[1] !== undefined) project.description = params[1]
        if (params[2] !== undefined) project.color = params[2]
      }

      project.updated_at = now
      return { changes: 1, lastInsertRowid: project.id }
    }
  }

  if (queryLower.includes('update time_entries')) {
    const idMatch = params[params.length - 1]
    const entryIndex = store.time_entries.findIndex((e) => e.id === idMatch)
    if (entryIndex !== -1) {
      const entry = store.time_entries[entryIndex]
      if (queryLower.includes('end_time =')) {
        entry.end_time = params[0]
        entry.duration = params[1]
      }
      return { changes: 1, lastInsertRowid: entry.id }
    }
  }

  // DELETE operations
  if (queryLower.includes('delete from tasks')) {
    const idMatch = params[0]
    const initialLength = store.tasks.length
    store.tasks = store.tasks.filter((t) => t.id !== idMatch)
    return { changes: initialLength - store.tasks.length, lastInsertRowid: 0 }
  }

  if (queryLower.includes('delete from projects')) {
    const idMatch = params[0]
    const initialLength = store.projects.length
    store.projects = store.projects.filter((p) => p.id !== idMatch)
    // Also remove associated tasks
    store.tasks = store.tasks.filter((t) => t.project_id !== idMatch)
    return { changes: initialLength - store.projects.length, lastInsertRowid: 0 }
  }

  if (queryLower.includes('delete from time_entries')) {
    const idMatch = params[0]
    const initialLength = store.time_entries.length
    store.time_entries = store.time_entries.filter((e) => e.id !== idMatch)
    return { changes: initialLength - store.time_entries.length, lastInsertRowid: 0 }
  }

  return { changes: 0, lastInsertRowid: 0 }
}

// Compatibility functions
export function getDatabase() {
  return null // Mock database doesn't need a real connection
}

export function closeDatabaseConnection(): void {
  // No-op for mock database
}
