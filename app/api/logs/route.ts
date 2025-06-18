import { type NextRequest, NextResponse } from "next/server"
import { executeQuery, executeUpdate } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : 50

    const logs = executeQuery(
      `
      SELECT * FROM activity_logs 
      ORDER BY created_at DESC 
      LIMIT ?
    `,
      [limit],
    )

    return NextResponse.json({ logs })
  } catch (error) {
    console.error("Error fetching logs:", error)
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    executeUpdate("DELETE FROM activity_logs")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting logs:", error)
    return NextResponse.json({ error: "Failed to delete logs" }, { status: 500 })
  }
}
