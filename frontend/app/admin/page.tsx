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
  Trash2,
  Shield,
  Cpu,
  Wifi,
  HardDrive,
  Sparkles
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
  title?: string
  issue: string
  category: string
  priority: string
  status: string
  resolution_time?: number
  user_email: string
  created_at?: string
  submittedAt?: string
}

export default function AdvancedAdminDashboard() {
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
      const categoryStats: Record<string, number> = {}
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
      case 'resolved': return '#22c55e'
      case 'escalated': return '#ef4444'
      case 'in_progress': return '#f59e0b'
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'hardware': return <HardDrive className="w-5 h-5" />
      case 'network': return <Wifi className="w-5 h-5" />
      case 'software': return <Cpu className="w-5 h-5" />
      case 'account': return <Shield className="w-5 h-5" />
      default: return <Zap className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 opacity-90"></div>
        <div className="fixed inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-20 h-20 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-xl">Loading Advanced Analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 opacity-90"></div>
      <div className="fixed inset-0">
        <div className="absolute top-0 left-0 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="glass-dark border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center floating">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Advanced Admin Dashboard</h1>
                  <div className="flex items-center space-x-3">
                    <p className="text-white/80 text-sm">IT Service Desk Analytics</p>
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
                      connectionStatus === 'connected' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                      connectionStatus === 'loading' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                      'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        connectionStatus === 'connected' ? 'bg-green-400' :
                        connectionStatus === 'loading' ? 'bg-yellow-400 animate-pulse' :
                        'bg-red-400'
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
                  className="glass px-4 py-2 rounded-xl text-white border border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
                >
                  <option value="7d" className="bg-gray-800">Last 7 days</option>
                  <option value="30d" className="bg-gray-800">Last 30 days</option>
                  <option value="90d" className="bg-gray-800">Last 90 days</option>
                </select>

                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="glass px-4 py-2 rounded-xl text-white border border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
                >
                  <option value="all" className="bg-gray-800">All Categories</option>
                  <option value="software" className="bg-gray-800">Software</option>
                  <option value="hardware" className="bg-gray-800">Hardware</option>
                  <option value="network" className="bg-gray-800">Network</option>
                  <option value="account" className="bg-gray-800">Account</option>
                </select>

                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  className="glass px-4 py-2 rounded-xl text-white hover:scale-105 transition-all duration-300 hover:shadow-xl flex items-center space-x-2"
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>

                <Link 
                  href="/"
                  className="glass px-6 py-2 rounded-xl text-white hover:scale-105 transition-all duration-300 hover:shadow-xl"
                >
                  ← Back to Support
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="glass-dark p-6 rounded-2xl card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl font-bold text-white">{stats?.totalTickets || 0}</span>
              </div>
              <h3 className="text-white font-semibold mb-1">Total Tickets</h3>
              <p className="text-white/60 text-sm">All submitted tickets</p>
            </div>

            <div className="glass-dark p-6 rounded-2xl card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl font-bold text-white">{stats?.autoResolvedTickets || 0}</span>
              </div>
              <h3 className="text-white font-semibold mb-1">Auto Resolved</h3>
              <p className="text-white/60 text-sm">AI automation success</p>
            </div>

            <div className="glass-dark p-6 rounded-2xl card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl font-bold text-white">{stats?.escalatedTickets || 0}</span>
              </div>
              <h3 className="text-white font-semibold mb-1">Escalated</h3>
              <p className="text-white/60 text-sm">Human intervention required</p>
            </div>

            <div className="glass-dark p-6 rounded-2xl card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl font-bold text-white">{stats?.successRate || 0}%</span>
              </div>
              <h3 className="text-white font-semibold mb-1">Success Rate</h3>
              <p className="text-white/60 text-sm">AI automation efficiency</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Category Distribution */}
            <div className="glass-dark p-6 rounded-2xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <Sparkles className="w-6 h-6 mr-2 text-yellow-300" />
                Tickets by Category
              </h3>
              <div className="space-y-4">
                {stats?.ticketsByCategory?.map((category) => (
                  <div key={category.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        {getCategoryIcon(category.name.toLowerCase())}
                      </div>
                      <span className="text-white font-medium">{category.name}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-1000"
                          style={{ width: `${(category.value / (stats?.totalTickets || 1)) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-white font-bold">{category.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Distribution */}
            <div className="glass-dark p-6 rounded-2xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <Zap className="w-6 h-6 mr-2 text-yellow-300" />
                Tickets by Priority
              </h3>
              <div className="space-y-4">
                {stats?.ticketsByPriority?.map((priority) => (
                  <div key={priority.priority} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: getPriorityColor(priority.priority.toLowerCase()) }}
                      >
                        <span className="text-white font-bold text-sm">
                          {priority.priority.charAt(0)}
                        </span>
                      </div>
                      <span className="text-white font-medium">{priority.priority}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ 
                            backgroundColor: getPriorityColor(priority.priority.toLowerCase()),
                            width: `${(priority.count / (stats?.totalTickets || 1)) * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-white font-bold">{priority.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="glass-dark p-6 rounded-2xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <Activity className="w-6 h-6 mr-2 text-yellow-300" />
              Recent Activity
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Ticket ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Issue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Resolution Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {tickets?.slice(0, 10).map((ticket, index) => (
                    <tr key={ticket.id || `ticket-${index}`} className="hover:bg-white/5 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {ticket.id ? (ticket.id.substring(0, 8) + '...') : 'No ID'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {ticket.title ? (ticket.title.substring(0, 50) + (ticket.title.length > 50 ? '...' : '')) : (ticket.issue ? (ticket.issue.substring(0, 50) + (ticket.issue.length > 50 ? '...' : '')) : 'No title')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-xs font-medium rounded-full" 
                              style={{ backgroundColor: getPriorityColor(ticket.priority || 'medium'), color: 'white' }}>
                          {(ticket.priority || 'medium').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-xs font-medium rounded-full" 
                              style={{ backgroundColor: getStatusColor(ticket.status || 'open'), color: 'white' }}>
                          {(ticket.status || 'open').replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {ticket.resolution_time ? formatTime(ticket.resolution_time) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                        {formatDate(ticket.created_at || ticket.submittedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 flex justify-center space-x-6">
            <button 
              onClick={handleRefresh}
              className="btn-gradient px-8 py-4 rounded-2xl font-semibold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Refresh Data</span>
            </button>
            <button 
              onClick={handleClearData}
              className="glass px-8 py-4 rounded-2xl font-semibold text-red-300 border border-red-500/30 hover:bg-red-500/20 transition-all duration-300 flex items-center space-x-2"
            >
              <Trash2 className="w-5 h-5" />
              <span>Clear All Data</span>
            </button>
            <button className="btn-gradient px-8 py-4 rounded-2xl font-semibold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>View Analytics</span>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .floating {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
