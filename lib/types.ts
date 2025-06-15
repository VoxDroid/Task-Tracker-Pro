export interface Project {
  id: number
  name: string
  description?: string
  color: string
  status: "active" | "completed" | "archived"
  created_at: string
  updated_at: string
}

export interface Task {
  id: number
  title: string
  description?: string
  project_id?: number
  status: "todo" | "in_progress" | "completed" | "archived"
  priority: "low" | "medium" | "high" | "urgent"
  assigned_to?: string
  due_date?: string
  completed_at?: string
  created_at: string
  updated_at: string
  project?: Project
  tags?: Tag[]
}

export interface ActivityLog {
  id: number
  action: string
  entity_type: string
  entity_id: number
  details?: string
  created_at: string
}

export interface TimeEntry {
  id: number
  task_id: number
  start_time: string
  end_time?: string
  duration?: number
  description?: string
  created_at: string
  task?: Task
}

export interface Tag {
  id: number
  name: string
  color: string
  created_at: string
}

export interface DashboardStats {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  overdueTasks: number
  totalProjects: number
  activeProjects: number
  totalTimeLogged: number
}
