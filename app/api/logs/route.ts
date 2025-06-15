import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const db = getDatabase()
    const logs = db
      .prepare(`
      SELECT * FROM activity_logs
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `)
      .all(limit, offset)

    const total = db.prepare("SELECT COUNT(*) as count FROM activity_logs").get() as any

    return NextResponse.json({
      logs,
      total: total.count,
      hasMore: offset + limit < total.count,
    })
  } catch (error) {
    console.error("Error fetching activity logs:", error)
    return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 })
  }
}
