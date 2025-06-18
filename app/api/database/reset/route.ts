import { NextResponse } from "next/server"
import { executeUpdate } from "@/lib/database"
import fs from "fs"
import path from "path"

export async function POST() {
  try {
    // Drop all tables
    const dropTables = [
      "DROP TABLE IF EXISTS task_tags",
      "DROP TABLE IF EXISTS tags",
      "DROP TABLE IF EXISTS time_entries",
      "DROP TABLE IF EXISTS activity_logs",
      "DROP TABLE IF EXISTS tasks",
      "DROP TABLE IF EXISTS projects",
    ]

    for (const query of dropTables) {
      executeUpdate(query)
    }

    // Remove database file and let it recreate
    const dataDir = path.join(process.cwd(), "data")
    const dbPath = path.join(dataDir, "tasktracker.db")

    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath)
    }

    return NextResponse.json({ success: true, message: "Database reset successfully" })
  } catch (error) {
    console.error("Error resetting database:", error)
    return NextResponse.json({ error: "Failed to reset database" }, { status: 500 })
  }
}
