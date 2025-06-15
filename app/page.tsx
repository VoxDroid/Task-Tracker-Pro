"use client"

import { useEffect, useState } from "react"
import Sidebar from "@/components/sidebar"
import type { DashboardStats } from "@/lib/types"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts"
import { TrendingUp, CheckCircle, Clock, AlertTriangle, FolderOpen, Activity } from "lucide-react"

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"]

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [charts, setCharts] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, chartsRes] = await Promise.all([fetch("/api/dashboard/stats"), fetch("/api/dashboard/charts")])

      const statsData = await statsRes.json()
      const chartsData = await chartsRes.json()

      setStats(statsData)
      setCharts(chartsData)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-full">
          <div className="text-lg font-medium text-gray-600">Loading dashboard...</div>
        </div>
      </Sidebar>
    )
  }

  const statCards = [
    {
      title: "Total Tasks",
      value: stats?.totalTasks || 0,
      icon: CheckCircle,
      color: "bg-blue-100 text-blue-800",
      iconColor: "text-blue-600",
    },
    {
      title: "Completed",
      value: stats?.completedTasks || 0,
      icon: CheckCircle,
      color: "bg-green-100 text-green-800",
      iconColor: "text-green-600",
    },
    {
      title: "In Progress",
      value: stats?.inProgressTasks || 0,
      icon: Clock,
      color: "bg-yellow-100 text-yellow-800",
      iconColor: "text-yellow-600",
    },
    {
      title: "Overdue",
      value: stats?.overdueTasks || 0,
      icon: AlertTriangle,
      color: "bg-red-100 text-red-800",
      iconColor: "text-red-600",
    },
    {
      title: "Active Projects",
      value: stats?.activeProjects || 0,
      icon: FolderOpen,
      color: "bg-purple-100 text-purple-800",
      iconColor: "text-purple-600",
    },
    {
      title: "Time Logged",
      value: `${Math.round((stats?.totalTimeLogged || 0) / 60)}h`,
      icon: Activity,
      color: "bg-cyan-100 text-cyan-800",
      iconColor: "text-cyan-600",
    },
  ]

  return (
    <Sidebar>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-black mb-3">Dashboard</h1>
          <p className="text-lg text-gray-600">Welcome back! Here's your productivity overview</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {statCards.map((card, index) => (
            <div
              key={card.title}
              className={`${card.color} p-6 rounded-2xl border-2 border-black shadow-lg hover:shadow-xl hover:transform hover:scale-105 transition-all duration-200`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-80 mb-1">{card.title}</p>
                  <p className="text-3xl font-bold">{card.value}</p>
                </div>
                <card.icon className={`w-8 h-8 ${card.iconColor}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Task Completion Trend */}
          <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-lg">
            <div className="flex items-center mb-6">
              <TrendingUp className="w-6 h-6 text-green-600 mr-3" />
              <h3 className="text-xl font-bold text-black">Task Completion Trend</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={charts?.completionTrend || []}>
                <defs>
                  <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "2px solid black",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#completionGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Tasks by Status */}
          <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-lg">
            <h3 className="text-xl font-bold text-black mb-6">Tasks by Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={charts?.tasksByStatus || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  stroke="#000"
                  strokeWidth={2}
                >
                  {(charts?.tasksByStatus || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "2px solid black",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Tasks by Priority */}
          <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-lg">
            <h3 className="text-xl font-bold text-black mb-6">Tasks by Priority</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts?.tasksByPriority || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="priority" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "2px solid black",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Bar dataKey="count" fill="#8b5cf6" stroke="#000" strokeWidth={1} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Project Progress */}
          <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-lg">
            <h3 className="text-xl font-bold text-black mb-6">Project Progress</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts?.projectProgress || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "2px solid black",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Bar
                  dataKey="total_tasks"
                  fill="#e5e7eb"
                  name="Total Tasks"
                  stroke="#000"
                  strokeWidth={1}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="completed_tasks"
                  fill="#10b981"
                  name="Completed Tasks"
                  stroke="#000"
                  strokeWidth={1}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Trend */}
        <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-lg">
          <h3 className="text-xl font-bold text-black mb-6">Activity Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={charts?.activityTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "2px solid black",
                  borderRadius: "12px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Line
                type="monotone"
                dataKey="activities"
                stroke="#06b6d4"
                strokeWidth={4}
                dot={{ fill: "#06b6d4", strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: "#000", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Sidebar>
  )
}
