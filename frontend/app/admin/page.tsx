'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Zap,
  Calendar,
  Filter,
  RefreshCw,
  Trash2
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalTickets: number
  autoResolvedTickets: number
  escalatedTickets: number
  avgResolutionTime: number
  successRate: number
  ticketsByCategory: any[]
  ticketsByPriority: any[]
  recentActivity: any[]
}

interface Ticket {
  id: string
  title: string
  category: string
  priority: string
  status: string
  created_at: string
  resolved_at?: string
  resolution_time?: number
  user_email: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7d') // 7d, 30d, 90d
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading')

  useEffect(() => {
    fetchDashboardData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    
    // Listen for ticket updates from main page
    const handleTicketUpdate = () => {
      fetchDashboardData()
    }
    
    window.addEventListener('tickets-updated', handleTicketUpdate)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('tickets-updated', handleTicketUpdate)
    }
  }, [dateRange, selectedCategory])

  const handleRefresh = () => {
    fetchDashboardData()
  }

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all ticket data? This cannot be undone.')) {
      localStorage.removeItem('submittedTickets')
      fetchDashboardData()
      alert('All ticket data has been cleared.')
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setConnectionStatus('loading')
      
      // Read tickets from localStorage
      let localTickets = []
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('submittedTickets')
        localTickets = saved ? JSON.parse(saved) : []
      }
      
      // Calculate real statistics from localStorage tickets
      const totalTickets = localTickets.length
      const autoResolvedTickets = localTickets.filter(t => t.status === 'resolved').length
      const escalatedTickets = localTickets.filter(t => t.status === 'escalated').length
      const resolvedTickets = localTickets.filter(t => t.resolution_time)
      const avgResolutionTime = resolvedTickets.length > 0 
        ? resolvedTickets.reduce((sum, t) => sum + (t.resolution_time || 0), 0) / resolvedTickets.length 
        : 0
      const successRate = totalTickets > 0 ? (autoResolvedTickets / totalTickets) * 100 : 0
      
      // Calculate category distribution
      const categoryStats = {}
      localTickets.forEach(ticket => {
        categoryStats[ticket.category] = (categoryStats[ticket.category] || 0) + 1
      })
      
      const ticketsByCategory = Object.entries(categoryStats).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }))
      
      // Calculate priority distribution
      const priorityStats: Record<string, number> = {}
      localTickets.forEach(ticket => {
        priorityStats[ticket.priority] = (priorityStats[ticket.priority] || 0) + 1
      })
      
      const ticketsByPriority = [
        { priority: 'Critical', count: priorityStats.critical || 0 },
        { priority: 'High', count: priorityStats.high || 0 },
        { priority: 'Medium', count: priorityStats.medium || 0 },
        { priority: 'Low', count: priorityStats.low || 0 }
      ]
      
      const realStats = {
        totalTickets,
        autoResolvedTickets,
        escalatedTickets,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        successRate: Math.round(successRate * 100) / 100,
        ticketsByCategory,
        ticketsByPriority,
        recentActivity: localTickets.slice(0, 10)
      }
      
      setStats(realStats)
      setTickets(localTickets)
      setConnectionStatus('connected')
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setConnectionStatus('disconnected')
      // Set empty state on error
      setStats({
        totalTickets: 0,
        autoResolvedTickets: 0,
        escalatedTickets: 0,
        avgResolutionTime: 0,
        successRate: 0,
        ticketsByCategory: [],
        ticketsByPriority: [],
        recentActivity: []
      })
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#ef4444'
      case 'high': return '#f97316'
      case 'medium': return '#eab308'
      case 'low': return '#22c55e'
      default: return '#6b7280'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return '#10b981'
      case 'in_progress': return '#3b82f6'
      case 'escalated': return '#f59e0b'
      case 'open': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-600">IT Service Desk Analytics</p>
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                    connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
                    connectionStatus === 'loading' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      connectionStatus === 'connected' ? 'bg-green-600' :
                      connectionStatus === 'loading' ? 'bg-yellow-600 animate-pulse' :
                      'bg-red-600'
                    }`}></div>
                    <span>{connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'loading' ? 'Loading' : 'Disconnected'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Date Range Filter */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="all">All Categories</option>
                <option value="software">Software</option>
                <option value="hardware">Hardware</option>
                <option value="network">Network</option>
                <option value="account">Account</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-1"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <Link 
                href="/"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Back to Support
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalTickets || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Auto-Resolved</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.autoResolvedTickets || 0}</p>
                <p className="text-xs text-green-600">
                  {stats?.totalTickets ? 
                    `${((stats.autoResolvedTickets / stats.totalTickets) * 100).toFixed(1)}% of total`
                    : '0%'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Escalated</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.escalatedTickets || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Resolution Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.avgResolutionTime ? formatTime(stats.avgResolutionTime) : '0m'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Tickets by Category - Simple Bar Chart */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tickets by Category</h3>
            <div className="space-y-3">
              {stats?.ticketsByCategory?.map((category: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 capitalize">{category.name}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-4 relative">
                      <div 
                        className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                        style={{ width: `${(category.value / Math.max(...stats.ticketsByCategory.map((c: any) => c.value))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{category.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Activity className="w-4 h-4" />
                  <span>Latest {tickets.length} tickets</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resolution Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tickets?.slice(0, 10).map((ticket, index) => (
                    <tr key={ticket.id || `ticket-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {ticket.id ? (ticket.id.substring(0, 8) + '...') : 'No ID'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {ticket.title ? (ticket.title.substring(0, 50) + (ticket.title.length > 50 ? '...' : '')) : (ticket.issue ? (ticket.issue.substring(0, 50) + (ticket.issue.length > 50 ? '...' : '')) : 'No title')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full" 
                              style={{ backgroundColor: getPriorityColor(ticket.priority || 'medium'), color: 'white' }}>
                          {(ticket.priority || 'medium').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full" 
                              style={{ backgroundColor: getStatusColor(ticket.status || 'open'), color: 'white' }}>
                          {(ticket.status || 'open').replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ticket.resolution_time ? formatTime(ticket.resolution_time) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(ticket.created_at || ticket.submittedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tickets by Priority</h3>
          <div className="space-y-3">
            {stats?.ticketsByPriority?.map((priority: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">{priority.priority}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-4 relative">
                    <div 
                      className="bg-orange-500 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${(priority.count / Math.max(...stats.ticketsByPriority.map((p: any) => p.count))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{priority.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex justify-center space-x-4">
          <button 
            onClick={handleRefresh}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Data</span>
          </button>
          <button 
            onClick={handleClearData}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Data</span>
          </button>
          <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>View Analytics</span>
          </button>
        </div>
      </div>
    </div>
  )
}
