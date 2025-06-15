"use client"

import { useEffect, useState } from "react"
import Sidebar from "@/components/sidebar"
import type { ActivityLog } from "@/lib/types"
import { Activity, Clock } from "lucide-react"

export default function LogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const response = await fetch("/api/logs?limit=100")
      const data = await response.json()
      setLogs(data.logs)
    } catch (error) {
      console.error("Error fetching logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "created":
        return "bg-green-100 text-green-800 border-green-300"
      case "updated":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "deleted":
        return "bg-red-100 text-red-800 border-red-300"
      case "started":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "stopped":
        return "bg-purple-100 text-purple-800 border-purple-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  if (loading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-full">
          <div className="text-lg font-medium text-gray-600">Loading activity logs...</div>
        </div>
      </Sidebar>
    )
  }

  return (
    <Sidebar>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2 flex items-center">
            <Activity className="mr-4" />
            Activity Logs
          </h1>
          <p className="text-lg text-gray-600">Track all activities in your workspace</p>
        </div>

        {/* Activity Timeline */}
        <div className="space-y-4">
          {logs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Activity className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-gray-500 text-xl mb-2">No activity logs</p>
              <p className="text-gray-400 text-lg">Your activities will appear here</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="bg-white p-6 rounded-2xl border-2 border-black shadow-lg hover:shadow-xl hover:transform hover:scale-[1.01] transition-all duration-200"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    <Clock size={20} className="text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className={`px-3 py-1 rounded-xl text-xs font-bold border-2 ${getActionColor(log.action)}`}>
                        {log.action.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1 rounded-xl border border-gray-200">
                        {log.entity_type} #{log.entity_id}
                      </span>
                      <span className="text-sm text-gray-400 bg-gray-50 px-3 py-1 rounded-xl border border-gray-200">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    {log.details && <p className="text-gray-700 text-lg">{log.details}</p>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Sidebar>
  )
}
