export interface Project {
  id: number
  name: string
  description?: string
  color: string
  status: 'active' | 'completed' | 'archived'
  created_at: string
  updated_at: string
}

export interface Task {
  id: number
  title: string
  description?: string
  project_id?: number
  status: 'todo' | 'in_progress' | 'completed' | 'archived'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to?: string
  due_date?: string
  completed_at?: string
  created_at: string
  updated_at: string
  is_favorite?: number
  project?: Project
  // optional flattened fields returned by some API queries
  project_name?: string
  project_color?: string
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

// Electron API types
declare global {
  interface Window {
    electronAPI: {
      openFile: () => Promise<{ canceled: boolean; filePaths: string[] }>
      saveFile: (defaultName: string) => Promise<{ canceled: boolean; filePath?: string }>
      getVersion: () => Promise<string>
      platform: string
      minimizeWindow: () => void
      maximizeWindow: () => void
      closeWindow: () => void
      toggleFullscreen: () => void
      isFullscreen: () => Promise<boolean>
      onWindowMaximized: (callback: () => void) => void
      onWindowUnmaximized: (callback: () => void) => void
      onWindowEnteredFullscreen: (callback: () => void) => void
      onWindowLeftFullscreen: (callback: () => void) => void
      onUpdateAvailable: (callback: (event: any, info: any) => void) => void
      onUpdateDownloaded: (callback: (event: any, info: any) => void) => void
    }
  }
}
