import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

let db = null
let dbInitialized = false

function createFreshDatabase(dbPath) {
  try {
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath)
    }
    const walPath = dbPath + '-wal'
    const shmPath = dbPath + '-shm'
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath)
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath)
  } catch (error) {
    console.warn('Could not clean old database files:', error)
  }

  const newDb = new Database(dbPath)
  return newDb
}

function testDatabaseIntegrity(database) {
  try {
    const result = database.prepare('PRAGMA integrity_check').get()
    return result && result.integrity_check === 'ok'
  } catch (error) {
    return false
  }
}

function setupDatabase(database) {
  try {
    database.pragma('foreign_keys = ON')
    database.pragma('journal_mode = DELETE')
    database.pragma('synchronous = NORMAL')
    database.pragma('cache_size = 1000')
    database.pragma('temp_store = memory')
    database.pragma('page_size = 4096')
  } catch (error) {
    throw new Error('Failed to configure database')
  }
}

function initializeTables(database) {
  // Create tables if they don't exist
  database.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#3b82f6',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      project_id INTEGER,
      assigned_to TEXT,
      due_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS time_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      duration INTEGER,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

export function getDatabase() {
  if (db && dbInitialized) {
    try {
      db.prepare('SELECT 1').get()
      return db
    } catch (error) {
      console.warn('Database connection lost, reconnecting...')
      db = null
      dbInitialized = false
    }
  }

  // In Electron, use the app's user data directory
  const userDataPath = app.getPath('userData')
  const dataDir = path.join(userDataPath, 'TaskTrackerPro')

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  const dbPath = path.join(dataDir, 'tasktracker.db')
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
            console.warn(
              `Database integrity check failed (attempt ${attempts}), creating fresh database`
            )
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
      initializeTables(db)

      if (!testDatabaseIntegrity(db)) {
        throw new Error('Database integrity check failed after initialization')
      }

      dbInitialized = true
      console.log(`Database initialized successfully at: ${dbPath}`)
    } catch (error) {
      console.error(`Database initialization attempt ${attempts} failed:`, error)
      if (attempts >= maxAttempts) {
        throw new Error(`Failed to initialize database after ${maxAttempts} attempts`)
      }
      // Wait a bit before retrying
      require('timers').setTimeout(() => {}, 1000)
    }
  }

  if (!db) {
    throw new Error('Database initialization failed')
  }

  return db
}
