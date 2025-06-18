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
import {
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  FolderOpen,
  Activity,
  Calendar,
  Target,
  Zap,
  BarChart3,
  PieChartIcon,
  LineChartIcon,
} from "lucide-react"

const COLORS = ["var(--color-primary)", "var(--color-secondary)", "var(--color-accent)"]

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [charts, setCharts] = useState<any>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, chartsRes, activityRes, tasksRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/dashboard/charts"),
        fetch("/api/logs?limit=5"),
        fetch("/api/tasks?limit=5"),
      ])

      const statsData = await statsRes.json()
      const chartsData = await chartsRes.json()
      const activityData = await activityRes.json()
      const tasksData = await tasksRes.json()

      setStats(statsData)
      setCharts(chartsData)
      setRecentActivity(Array.isArray(activityData.logs) ? activityData.logs : [])
      setUpcomingTasks(
        Array.isArray(tasksData)
          ? tasksData.filter((task: any) => task.due_date && task.status !== "completed").slice(0, 5)
          : [],
      )
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setRecentActivity([])
      setUpcomingTasks([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full mx-auto mb-4"></div>
            <div className="text-lg font-medium" style={{ color: "var(--color-text)" }}>
              Loading dashboard...
            </div>
          </div>
        </div>
      </Sidebar>
    )
  }

  const statCards = [
    {
      title: "Total Tasks",
      value: stats?.totalTasks || 0,
      icon: CheckCircle,
      colorVar: "--color-primary",
      bgIcon: Target,
    },
    {
      title: "Completed",
      value: stats?.completedTasks || 0,
      icon: Target,
      colorVar: "--color-accent",
      bgIcon: CheckCircle,
    },
    {
      title: "In Progress",
      value: stats?.inProgressTasks || 0,
      icon: Clock,
      colorVar: "--color-secondary",
      bgIcon: Activity,
    },
    {
      title: "Overdue",
      value: stats?.overdueTasks || 0,
      icon: AlertTriangle,
      colorVar: "--color-primary",
      bgIcon: Clock,
    },
    {
      title: "Active Projects",
      value: stats?.activeProjects || 0,
      icon: FolderOpen,
      colorVar: "--color-secondary",
      bgIcon: FolderOpen,
    },
    {
      title: "Hours Logged",
      value: `${stats?.totalTimeLogged ? Math.round(stats.totalTimeLogged / 60) : 0}h`,
      icon: Zap,
      colorVar: "--color-accent",
      bgIcon: Zap,
    },
  ]

  return (
    <Sidebar>
      <div className="p-8 space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4" style={{ color: "var(--color-text)" }}>
            Dashboard
          </h1>
          <p className="text-xl opacity-70" style={{ color: "var(--color-text)" }}>
            Welcome back! Here's your productivity overview
          </p>
          <div className="mt-4 text-sm opacity-60" style={{ color: "var(--color-text)" }}>
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {statCards.map((card, index) => (
            <div
              key={card.title}
              className="relative overflow-hidden bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg hover:shadow-xl hover:transform hover:scale-105 transition-all duration-300"
            >
              <div
                className="absolute top-0 right-0 w-20 h-20 opacity-5"
                style={{
                  background: `radial-gradient(circle, var(${card.colorVar}) 0%, transparent 70%)`,
                }}
              />
              <card.bgIcon
                className="absolute top-2 right-2 w-8 h-8 opacity-10"
                style={{ color: `var(${card.colorVar})` }}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="p-3 rounded-xl shadow-lg"
                    style={{
                      backgroundColor: `var(${card.colorVar})`,
                      opacity: 0.1,
                    }}
                  >
                    <card.icon className="w-6 h-6" style={{ color: `var(${card.colorVar})` }} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium opacity-70 mb-2" style={{ color: "var(--color-text)" }}>
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                    {card.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 bg-[var(--color-surface)] p-8 rounded-2xl border-2 border-[var(--color-border)] shadow-lg relative overflow-hidden">
            <LineChartIcon
              className="absolute top-4 right-4 w-12 h-12 opacity-5"
              style={{ color: "var(--color-accent)" }}
            />
            <div className="flex items-center mb-6 relative z-10">
              <TrendingUp className="w-6 h-6 mr-3" style={{ color: "var(--color-accent)" }} />
              <h3 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                Task Completion Trend
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={charts?.completionTrend || []}>
                <defs>
                  <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                <XAxis dataKey="date" stroke="var(--color-text)" opacity={0.7} />
                <YAxis stroke="var(--color-text)" opacity={0.7} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-surface)",
                    border: "2px solid var(--color-border)",
                    borderRadius: "12px",
                    color: "var(--color-text)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="var(--color-accent)"
                  strokeWidth={3}
                  fill="url(#completionGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[var(--color-surface)] p-8 rounded-2xl border-2 border-[var(--color-border)] shadow-lg relative overflow-hidden">
            <PieChartIcon
              className="absolute top-4 right-4 w-12 h-12 opacity-5"
              style={{ color: "var(--color-primary)" }}
            />
            <h3 className="text-2xl font-bold mb-6 relative z-10" style={{ color: "var(--color-text)" }}>
              Tasks by Status
            </h3>
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
                  stroke="var(--color-border)"
                  strokeWidth={2}
                >
                  {(charts?.tasksByStatus || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-surface)",
                    border: "2px solid var(--color-border)",
                    borderRadius: "12px",
                    color: "var(--color-text)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[var(--color-surface)] p-8 rounded-2xl border-2 border-[var(--color-border)] shadow-lg relative overflow-hidden">
            <Activity
              className="absolute top-4 right-4 w-12 h-12 opacity-5"
              style={{ color: "var(--color-primary)" }}
            />
            <div className="flex items-center mb-6 relative z-10">
              <Activity className="w-6 h-6 mr-3" style={{ color: "var(--color-primary)" }} />
              <h3 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                Recent Activity
              </h3>
            </div>
            <div className="space-y-4 relative z-10">
              {recentActivity.length === 0 ? (
                <p className="text-center py-8 opacity-60" style={{ color: "var(--color-text)" }}>
                  No recent activity
                </p>
              ) : (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-3 p-3 rounded-xl bg-opacity-50 hover:bg-opacity-70 transition-colors cursor-pointer hover:scale-105"
                    style={{ backgroundColor: "var(--color-background)" }}
                    onClick={() => {
                      if (activity.entity_type === "task") {
                        window.location.href = "/tasks"
                      } else if (activity.entity_type === "project") {
                        window.location.href = "/projects"
                      }
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full mt-2"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    ></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                        {activity.details}
                      </p>
                      <p className="text-xs opacity-60" style={{ color: "var(--color-text)" }}>
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-[var(--color-surface)] p-8 rounded-2xl border-2 border-[var(--color-border)] shadow-lg relative overflow-hidden">
            <Calendar
              className="absolute top-4 right-4 w-12 h-12 opacity-5"
              style={{ color: "var(--color-secondary)" }}
            />
            <div className="flex items-center mb-6 relative z-10">
              <Calendar className="w-6 h-6 mr-3" style={{ color: "var(--color-secondary)" }} />
              <h3 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                Upcoming Tasks
              </h3>
            </div>
            <div className="space-y-4 relative z-10">
              {upcomingTasks.length === 0 ? (
                <p className="text-center py-8 opacity-60" style={{ color: "var(--color-text)" }}>
                  No upcoming tasks
                </p>
              ) : (
                upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl bg-opacity-50 hover:bg-opacity-70 transition-colors cursor-pointer hover:scale-105"
                    style={{ backgroundColor: "var(--color-background)" }}
                    onClick={() => (window.location.href = "/tasks")}
                  >
                    <h4 className="font-semibold text-sm mb-1" style={{ color: "var(--color-text)" }}>
                      {task.title}
                    </h4>
                    <div
                      className="flex items-center justify-between text-xs opacity-60"
                      style={{ color: "var(--color-text)" }}
                    >
                      <span>{task.project_name || "No project"}</span>
                      <span>{new Date(task.due_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-[var(--color-surface)] p-8 rounded-2xl border-2 border-[var(--color-border)] shadow-lg relative overflow-hidden">
            <BarChart3
              className="absolute top-4 right-4 w-12 h-12 opacity-5"
              style={{ color: "var(--color-accent)" }}
            />
            <h3 className="text-2xl font-bold mb-6 relative z-10" style={{ color: "var(--color-text)" }}>
              Project Progress
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts?.projectProgress || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                <XAxis dataKey="name" stroke="var(--color-text)" opacity={0.7} />
                <YAxis stroke="var(--color-text)" opacity={0.7} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-surface)",
                    border: "2px solid var(--color-border)",
                    borderRadius: "12px",
                    color: "var(--color-text)",
                  }}
                />
                <Bar
                  dataKey="total_tasks"
                  fill="var(--color-border)"
                  name="Total Tasks"
                  stroke="var(--color-border)"
                  strokeWidth={1}
                  radius={[4, 4, 0, 0]}
                  opacity={0.3}
                />
                <Bar
                  dataKey="completed_tasks"
                  fill="var(--color-accent)"
                  name="Completed Tasks"
                  stroke="var(--color-border)"
                  strokeWidth={1}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] p-8 rounded-2xl border-2 border-[var(--color-border)] shadow-lg relative overflow-hidden">
          <LineChartIcon
            className="absolute top-4 right-4 w-16 h-16 opacity-5"
            style={{ color: "var(--color-primary)" }}
          />
          <h3 className="text-2xl font-bold mb-6 relative z-10" style={{ color: "var(--color-text)" }}>
            Activity Trend (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={charts?.activityTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
              <XAxis dataKey="date" stroke="var(--color-text)" opacity={0.7} />
              <YAxis stroke="var(--color-text)" opacity={0.7} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-surface)",
                  border: "2px solid var(--color-border)",
                  borderRadius: "12px",
                  color: "var(--color-text)",
                }}
              />
              <Line
                type="monotone"
                dataKey="activities"
                stroke="var(--color-primary)"
                strokeWidth={4}
                dot={{ fill: "var(--color-primary)", strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: "var(--color-border)", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Sidebar>
  )
}
