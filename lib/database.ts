import Database from "better-sqlite3"
import path from "path"
import fs from "fs"

let db: Database.Database | null = null
let dbInitialized = false

function createFreshDatabase(dbPath: string): Database.Database {
  try {
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath)
    }
    const walPath = dbPath + "-wal"
    const shmPath = dbPath + "-shm"
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath)
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath)
  } catch (error) {
    console.warn("Could not clean old database files:", error)
  }

  const newDb = new Database(dbPath)
  return newDb
}

function testDatabaseIntegrity(database: Database.Database): boolean {
  try {
    const result = database.prepare("PRAGMA integrity_check").get() as any
    return result && result.integrity_check === "ok"
  } catch (error) {
    return false
  }
}

function setupDatabase(database: Database.Database): void {
  try {
    database.pragma("foreign_keys = ON")
    database.pragma("journal_mode = DELETE")
    database.pragma("synchronous = FULL")
    database.pragma("cache_size = 1000")
    database.pragma("temp_store = memory")
    database.pragma("page_size = 4096")
  } catch (error) {
    throw new Error("Failed to configure database")
  }
}

export function getDatabase(): Database.Database {
  if (db && dbInitialized) {
    try {
      db.prepare("SELECT 1").get()
      return db
    } catch (error) {
      console.warn("Database connection lost, reconnecting...")
      db = null
      dbInitialized = false
    }
  }

  const dataDir = path.join(process.cwd(), "data")
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  const dbPath = path.join(dataDir, "tasktracker.db")
  let attempts = 0
  const maxAttempts = 3

  while (attempts < maxAttempts && !dbInitialized) {
    try {
      attempts++

      if (fs.existsSync(dbPath)) {
        try {
          const tempDb = new Database(dbPath, { readonly: true })
          const isValid = testDatabaseIntegrity(tempDb)
          tempDb.close()

          if (!isValid) {
            console.warn(`Database integrity check failed (attempt ${attempts}), creating fresh database`)
            db = createFreshDatabase(dbPath)
          } else {
            db = new Database(dbPath)
          }
        } catch (error) {
          console.warn(`Database file corrupted (attempt ${attempts}), creating fresh database`)
          db = createFreshDatabase(dbPath)
        }
      } else {
        db = new Database(dbPath)
      }

      setupDatabase(db)

      // Always initialize tables to ensure they exist
      initializeTables(db)

      if (!testDatabaseIntegrity(db)) {
        throw new Error("Database integrity check failed after initialization")
      }

      db.prepare("SELECT 1").get()
      dbInitialized = true

      console.log("Database initialized successfully")
      return db
    } catch (error) {
      console.error(`Database initialization failed (attempt ${attempts}):`, error)

      if (db) {
        try {
          db.close()
        } catch (closeError) {
          console.warn("Error closing failed database:", closeError)
        }
        db = null
      }

      if (attempts === maxAttempts) {
        console.error("All database initialization attempts failed, using in-memory database")
        db = new Database(":memory:")
        setupDatabase(db)
        initializeTables(db)
        dbInitialized = true
        return db
      }
    }
  }

  throw new Error("Failed to initialize database")
}

function initializeTables(database: Database.Database): void {
  if (!database) return

  const tables = [
    `CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#6366f1',
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
      is_favorite INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      project_id INTEGER,
      status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'archived')),
      priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
      assigned_to TEXT,
      due_date DATETIME,
      completed_at DATETIME,
      is_favorite INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS time_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      duration INTEGER,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      color TEXT DEFAULT '#6b7280',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS task_tags (
      task_id INTEGER,
      tag_id INTEGER,
      PRIMARY KEY (task_id, tag_id),
      FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
    )`,
  ]

  const indexes = [
    "CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status)",
    "CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks (priority)",
    "CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks (project_id)",
    "CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks (due_date)",
    "CREATE INDEX IF NOT EXISTS idx_tasks_favorite ON tasks (is_favorite)",
    "CREATE INDEX IF NOT EXISTS idx_projects_favorite ON projects (is_favorite)",
    "CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs (entity_type, entity_id)",
    "CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON time_entries (task_id)",
  ]

  try {
    database.exec("BEGIN TRANSACTION")

    for (const tableSQL of tables) {
      database.exec(tableSQL)
    }

    for (const indexSQL of indexes) {
      database.exec(indexSQL)
    }

    database.exec("COMMIT")
  } catch (error) {
    try {
      database.exec("ROLLBACK")
    } catch (rollbackError) {
      console.warn("Rollback failed:", rollbackError)
    }
    throw error
  }
}

export function logActivity(action: string, entityType: string, entityId: number, details?: string): void {
  try {
    const database = getDatabase()
    const stmt = database.prepare(`
      INSERT INTO activity_logs (action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?)
    `)
    stmt.run(action, entityType, entityId, details)
  } catch (error) {
    console.error("Error logging activity:", error)
  }
}

export function executeQuery<T = any>(query: string, params: any[] = []): T[] {
  try {
    const database = getDatabase()
    return database.prepare(query).all(...params) as T[]
  } catch (error) {
    console.error("Error executing query:", error)
    return []
  }
}

export function executeQuerySingle<T = any>(query: string, params: any[] = []): T | null {
  try {
    const database = getDatabase()
    return (database.prepare(query).get(...params) as T) || null
  } catch (error) {
    console.error("Error executing single query:", error)
    return null
  }
}

export function executeUpdate(query: string, params: any[] = []): { changes: number; lastInsertRowid: number } {
  try {
    const database = getDatabase()
    const result = database.prepare(query).run(...params)
    return {
      changes: result.changes,
      lastInsertRowid: result.lastInsertRowid as number,
    }
  } catch (error) {
    console.error("Error executing update:", error)
    return { changes: 0, lastInsertRowid: 0 }
  }
}

function closeDatabase(): void {
  if (db) {
    try {
      db.close()
    } catch (error) {
      console.warn("Error closing database:", error)
    }
    db = null
    dbInitialized = false
  }
}

process.on("exit", closeDatabase)
process.on("SIGINT", () => {
  closeDatabase()
  process.exit(0)
})
process.on("SIGTERM", closeDatabase)
