'use client'

import type { CSSProperties } from 'react'
import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CheckCircle,
  Target,
  Clock,
  AlertTriangle,
  FolderOpen,
  Zap,
  Activity,
  LineChartIcon,
  TrendingUp,
  PieChartIcon,
  Calendar,
  BarChart3
} from 'lucide-react'
import Sidebar from '@/components/sidebar'
import type { DashboardStats, ActivityLog, Task } from '@/lib/types'
import { formatDateTimeShort } from '@/components/datetime-picker'
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
  AreaChart
} from 'recharts'
import { DashboardSkeleton } from '@/components/dashboard-skeleton'

const COLORS = ['var(--color-primary)', 'var(--color-secondary)', 'var(--color-accent)']

// Loading skeleton component for individual charts
const ChartSkeleton = () => (
  <div className="bg-[var(--color-surface)] p-8 rounded-2xl border-2 border-[var(--color-border)] shadow-lg animate-pulse relative overflow-hidden">
    {/* Shimmer effect */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--color-border)]/10 to-transparent animate-shimmer"></div>
    <div className="flex items-center mb-6 relative z-10">
      <div className="w-6 h-6 bg-[var(--color-border)] rounded mr-3 opacity-50"></div>
      <div className="h-8 bg-[var(--color-border)] rounded w-48 opacity-50"></div>
    </div>
    <div className="h-[300px] bg-[var(--color-border)] rounded-lg opacity-20 relative z-10"></div>
  </div>
)

// Chart and activity components moved to module scope to avoid creating them during render
interface ChartProps {
  charts?: any
}
interface ActivityProps {
  recentActivity?: ActivityLog[]
}
interface UpcomingProps {
  upcomingTasks?: Task[]
}

function CompletionTrendChartImpl({ charts }: ChartProps) {
  return (
    <div className="xl:col-span-2 bg-[var(--color-surface)] p-8 rounded-2xl border-2 border-[var(--color-border)] shadow-lg relative overflow-hidden">
      <LineChartIcon
        className="absolute top-4 right-4 w-12 h-12 opacity-5"
        style={{ color: 'var(--color-accent)' } as CSSProperties}
      />
      <div className="flex items-center mb-6 relative z-10">
        <TrendingUp
          className="w-6 h-6 mr-3"
          style={{ color: 'var(--color-accent)' } as CSSProperties}
        />
        <h3 className="text-2xl font-bold" style={{ color: 'var(--color-text)' } as CSSProperties}>
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
            contentStyle={
              {
                backgroundColor: 'var(--color-surface)',
                border: '2px solid var(--color-border)',
                borderRadius: '12px',
                color: 'var(--color-text)'
              } as CSSProperties
            }
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
  )
}
const CompletionTrendChart = React.memo(CompletionTrendChartImpl)
CompletionTrendChart.displayName = 'CompletionTrendChart'

function TasksByStatusChartImpl({ charts }: ChartProps) {
  return (
    <div className="bg-[var(--color-surface)] p-8 rounded-2xl border-2 border-[var(--color-border)] shadow-lg relative overflow-hidden">
      <PieChartIcon
        className="absolute top-4 right-4 w-12 h-12 opacity-5"
        style={{ color: 'var(--color-primary)' } as CSSProperties}
      />
      <h3
        className="text-2xl font-bold mb-6 relative z-10"
        style={{ color: 'var(--color-text)' } as CSSProperties}
      >
        Tasks by Status
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={charts?.tasksByStatus || []}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
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
            contentStyle={
              {
                backgroundColor: 'var(--color-surface)',
                border: '2px solid var(--color-border)',
                borderRadius: '12px',
                color: 'var(--color-text)'
              } as CSSProperties
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
const TasksByStatusChart = React.memo(TasksByStatusChartImpl)
TasksByStatusChart.displayName = 'TasksByStatusChart'

function RecentActivityImpl({ recentActivity = [] }: ActivityProps) {
  return (
    <div className="bg-[var(--color-surface)] p-8 rounded-2xl border-2 border-[var(--color-border)] shadow-lg relative overflow-hidden">
      <Activity
        className="absolute top-4 right-4 w-12 h-12 opacity-5"
        style={{ color: 'var(--color-primary)' } as CSSProperties}
      />
      <div className="flex items-center mb-6 relative z-10">
        <Activity
          className="w-6 h-6 mr-3"
          style={{ color: 'var(--color-primary)' } as CSSProperties}
        />
        <h3 className="text-2xl font-bold" style={{ color: 'var(--color-text)' } as CSSProperties}>
          Recent Activity
        </h3>
      </div>
      <div className="space-y-4 relative z-10">
        {recentActivity.length === 0 ? (
          <p
            className="text-center py-8 opacity-60"
            style={{ color: 'var(--color-text)' } as CSSProperties}
          >
            No recent activity
          </p>
        ) : (
          recentActivity.map((activity: ActivityLog) => (
            <div
              key={activity.id}
              className="flex items-start space-x-3 p-3 rounded-xl bg-opacity-50 hover:bg-opacity-70 transition-colors cursor-pointer hover:scale-105"
              style={{ backgroundColor: 'var(--color-background)' } as CSSProperties}
              onClick={() => {
                if (activity.entity_type === 'task') {
                  window.location.href = '/tasks'
                } else if (activity.entity_type === 'project') {
                  window.location.href = '/projects'
                }
              }}
            >
              <div
                className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                style={{ backgroundColor: 'var(--color-primary)' } as CSSProperties}
              ></div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: 'var(--color-text)' } as CSSProperties}
                  title={activity.details}
                >
                  {activity.details}
                </p>
                <p
                  className="text-xs opacity-60"
                  style={{ color: 'var(--color-text)' } as CSSProperties}
                >
                  {new Date(activity.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
const RecentActivity = React.memo(RecentActivityImpl)
RecentActivity.displayName = 'RecentActivity'

function UpcomingTasksImpl({ upcomingTasks = [] }: UpcomingProps) {
  return (
    <div className="bg-[var(--color-surface)] p-8 rounded-2xl border-2 border-[var(--color-border)] shadow-lg relative overflow-hidden">
      <Calendar
        className="absolute top-4 right-4 w-12 h-12 opacity-5"
        style={{ color: 'var(--color-secondary)' } as CSSProperties}
      />
      <div className="flex items-center mb-6 relative z-10">
        <Calendar
          className="w-6 h-6 mr-3"
          style={{ color: 'var(--color-secondary)' } as CSSProperties}
        />
        <h3 className="text-2xl font-bold" style={{ color: 'var(--color-text)' } as CSSProperties}>
          Upcoming Tasks
        </h3>
      </div>
      <div className="space-y-4 relative z-10">
        {upcomingTasks.length === 0 ? (
          <p
            className="text-center py-8 opacity-60"
            style={{ color: 'var(--color-text)' } as CSSProperties}
          >
            No upcoming tasks
          </p>
        ) : (
          upcomingTasks.map((task: Task) => (
            <div
              key={task.id}
              className="p-3 rounded-xl bg-opacity-50 hover:bg-opacity-70 transition-colors cursor-pointer hover:scale-105"
              style={{ backgroundColor: 'var(--color-background)' } as CSSProperties}
              onClick={() => (window.location.href = '/tasks')}
            >
              <h4
                className="font-semibold text-sm mb-1 truncate"
                style={{ color: 'var(--color-text)' } as CSSProperties}
                title={task.title}
              >
                {task.title}
              </h4>
              <div
                className="flex items-center justify-between text-xs opacity-60 gap-2"
                style={{ color: 'var(--color-text)' } as CSSProperties}
              >
                <span
                  className="truncate min-w-0 flex-1"
                  title={task.project?.name || 'No project'}
                >
                  {task.project?.name || 'No project'}
                </span>
                <span className="flex-shrink-0 whitespace-nowrap">
                  {task.due_date ? formatDateTimeShort(task.due_date) : 'No due date'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
const UpcomingTasks = React.memo(UpcomingTasksImpl)
UpcomingTasks.displayName = 'UpcomingTasks'

function ProjectProgressChartImpl({ charts }: ChartProps) {
  return (
    <div className="bg-[var(--color-surface)] p-8 rounded-2xl border-2 border-[var(--color-border)] shadow-lg relative overflow-hidden">
      <BarChart3
        className="absolute top-4 right-4 w-12 h-12 opacity-5"
        style={{ color: 'var(--color-accent)' } as CSSProperties}
      />
      <h3
        className="text-2xl font-bold mb-6 relative z-10"
        style={{ color: 'var(--color-text)' } as CSSProperties}
      >
        Project Progress
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={charts?.projectProgress || []}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
          <XAxis dataKey="name" stroke="var(--color-text)" opacity={0.7} />
          <YAxis stroke="var(--color-text)" opacity={0.7} />
          <Tooltip
            contentStyle={
              {
                backgroundColor: 'var(--color-surface)',
                border: '2px solid var(--color-border)',
                borderRadius: '12px',
                color: 'var(--color-text)'
              } as CSSProperties
            }
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
  )
}
const ProjectProgressChart = React.memo(ProjectProgressChartImpl)
ProjectProgressChart.displayName = 'ProjectProgressChart'

function ActivityTrendChartImpl({ charts }: ChartProps) {
  return (
    <div className="bg-[var(--color-surface)] p-8 rounded-2xl border-2 border-[var(--color-border)] shadow-lg relative overflow-hidden">
      <LineChartIcon
        className="absolute top-4 right-4 w-16 h-16 opacity-5"
        style={{ color: 'var(--color-primary)' } as CSSProperties}
      />
      <h3
        className="text-2xl font-bold mb-6 relative z-10"
        style={{ color: 'var(--color-text)' } as CSSProperties}
      >
        Activity Trend (Last 7 Days)
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={charts?.activityTrend || []}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
          <XAxis dataKey="date" stroke="var(--color-text)" opacity={0.7} />
          <YAxis stroke="var(--color-text)" opacity={0.7} />
          <Tooltip
            contentStyle={
              {
                backgroundColor: 'var(--color-surface)',
                border: '2px solid var(--color-border)',
                borderRadius: '12px',
                color: 'var(--color-text)'
              } as CSSProperties
            }
          />
          <Line
            type="monotone"
            dataKey="activities"
            stroke="var(--color-primary)"
            strokeWidth={4}
            dot={{ fill: 'var(--color-primary)', strokeWidth: 2, r: 6 }}
            activeDot={{ r: 8, stroke: 'var(--color-border)', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
const ActivityTrendChart = React.memo(ActivityTrendChartImpl)
ActivityTrendChart.displayName = 'ActivityTrendChart'

export default function Dashboard() {
  const [isSidebarAnimating, setIsSidebarAnimating] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const {
    data: dashboardData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/combined')
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      return response.json()
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000 // Refetch every minute
  })

  const stats = dashboardData?.stats
  const charts = dashboardData?.charts
  const recentActivity = dashboardData?.recentActivity || []
  const upcomingTasks = dashboardData?.upcomingTasks || []

  // Memoize the loading state to prevent unnecessary re-renders
  const isLoadingCharts = useMemo(
    () => isSidebarAnimating || isResizing,
    [isSidebarAnimating, isResizing]
  )

  // Listen for sidebar animation events and window resize events
  useEffect(() => {
    const handleSidebarToggleStart = () => setIsSidebarAnimating(true)
    const handleSidebarToggleEnd = () => {
      // Small delay to ensure animation is complete
      setTimeout(() => setIsSidebarAnimating(false), 50)
    }

    const handleResizeStart = () => {
      setIsResizing(true)
      // Clear existing timeout
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
    }

    const handleResizeEnd = () => {
      // Debounce resize end event
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
      resizeTimeoutRef.current = setTimeout(() => {
        setIsResizing(false)
      }, 100) // Wait 100ms after resize stops for better responsiveness
    }

    // Listen for custom events from sidebar component
    window.addEventListener('sidebar-toggle-start', handleSidebarToggleStart)
    window.addEventListener('sidebar-toggle-end', handleSidebarToggleEnd)

    // Listen for window resize events
    window.addEventListener('resize', handleResizeStart)
    window.addEventListener('resize', handleResizeEnd)

    return () => {
      window.removeEventListener('sidebar-toggle-start', handleSidebarToggleStart)
      window.removeEventListener('sidebar-toggle-end', handleSidebarToggleEnd)
      window.removeEventListener('resize', handleResizeStart)
      window.removeEventListener('resize', handleResizeEnd)
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
    }
  }, [])

  const statCards = useMemo(
    () => [
      {
        title: 'Total Tasks',
        value: stats?.totalTasks || 0,
        icon: CheckCircle,
        colorVar: '--color-primary',
        bgIcon: Target
      },
      {
        title: 'Completed',
        value: stats?.completedTasks || 0,
        icon: Target,
        colorVar: '--color-accent',
        bgIcon: CheckCircle
      },
      {
        title: 'In Progress',
        value: stats?.inProgressTasks || 0,
        icon: Clock,
        colorVar: '--color-secondary',
        bgIcon: Activity
      },
      {
        title: 'Overdue',
        value: stats?.overdueTasks || 0,
        icon: AlertTriangle,
        colorVar: '--color-primary',
        bgIcon: Clock
      },
      {
        title: 'Active Projects',
        value: stats?.activeProjects || 0,
        icon: FolderOpen,
        colorVar: '--color-secondary',
        bgIcon: FolderOpen
      },
      {
        title: 'Hours Logged',
        value: `${stats?.totalTimeLogged ? Math.round(stats.totalTimeLogged / 60) : 0}h`,
        icon: Zap,
        colorVar: '--color-accent',
        bgIcon: Zap
      }
    ],
    [stats]
  )

  if (isLoading) {
    return (
      <Sidebar>
        <div className="p-8">
          <div className="mb-8">
            <h1
              className="text-4xl font-bold mb-2"
              style={{ color: 'var(--color-text)' } as CSSProperties}
            >
              Dashboard
            </h1>
            <p
              className="text-lg opacity-70"
              style={{ color: 'var(--color-text)' } as CSSProperties}
            >
              Overview of your tasks and productivity
            </p>
          </div>
          <DashboardSkeleton />
        </div>
      </Sidebar>
    )
  }

  if (error) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-red-500">Error loading dashboard data. Please try again.</div>
          </div>
        </div>
      </Sidebar>
    )
  }

  // Chart components moved to module scope (see top of file)

  return (
    <Sidebar>
      <div className="p-8 space-y-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 space-y-4 lg:space-y-0">
          <div>
            <h1
              className="text-5xl font-bold mb-2"
              style={{ color: 'var(--color-text)' } as CSSProperties}
            >
              Dashboard
            </h1>
            <p
              className="text-xl opacity-70"
              style={{ color: 'var(--color-text)' } as CSSProperties}
            >
              Welcome back! Here's your productivity overview
            </p>
            <div
              className="mt-2 text-sm opacity-60"
              style={{ color: 'var(--color-text)' } as CSSProperties}
            >
              Last updated: {new Date().toLocaleString()}
            </div>
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
                style={
                  {
                    background: `radial-gradient(circle, var(${card.colorVar}) 0%, transparent 70%)`
                  } as CSSProperties
                }
              />
              <card.bgIcon
                className="absolute top-2 right-2 w-8 h-8 opacity-10"
                style={{ color: `var(${card.colorVar})` } as CSSProperties}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="p-3 rounded-xl shadow-lg"
                    style={
                      {
                        backgroundColor: `var(${card.colorVar})`,
                        opacity: 0.1
                      } as CSSProperties
                    }
                  >
                    <card.icon
                      className="w-6 h-6"
                      style={{ color: `var(${card.colorVar})` } as CSSProperties}
                    />
                  </div>
                </div>
                <div>
                  <p
                    className="text-sm font-medium opacity-70 mb-2"
                    style={{ color: 'var(--color-text)' } as CSSProperties}
                  >
                    {card.title}
                  </p>
                  <p
                    className="text-3xl font-bold"
                    style={{ color: 'var(--color-text)' } as CSSProperties}
                  >
                    {card.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {isLoadingCharts ? (
            <>
              <ChartSkeleton />
              <ChartSkeleton />
              <RecentActivity recentActivity={recentActivity} />
              <UpcomingTasks upcomingTasks={upcomingTasks} />
              <ChartSkeleton />
            </>
          ) : (
            <>
              <CompletionTrendChart charts={charts} />
              <TasksByStatusChart charts={charts} />
              <RecentActivity recentActivity={recentActivity} />
              <UpcomingTasks upcomingTasks={upcomingTasks} />
              <ProjectProgressChart charts={charts} />
            </>
          )}
        </div>

        {isLoadingCharts ? <ChartSkeleton /> : <ActivityTrendChart charts={charts} />}
      </div>
    </Sidebar>
  )
}
