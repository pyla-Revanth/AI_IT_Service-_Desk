'use client'

import { useState, useEffect } from 'react'
import { Ticket } from '../types/ticket'
import { format } from 'date-fns'
import { 
  Calendar, 
  User, 
  Tag, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  MessageCircle
} from 'lucide-react'

interface TicketDetailsProps {
  ticket: Ticket
}

export default function TicketDetails({ ticket }: TicketDetailsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <MessageCircle className="w-4 h-4" />
      case 'in_progress':
        return <Clock className="w-4 h-4" />
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />
      case 'closed':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  return (
    <div className="card">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Ticket Details</h2>
          <div className="flex items-center space-x-2">
            {getStatusIcon(ticket.status)}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
              {ticket.status.replace('_', ' ')}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
              {ticket.priority}
            </span>
          </div>
        </div>

        {/* Information */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Title</h3>
            <p className="text-gray-900">{ticket.title}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
            <p className="text-gray-900 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Category</h3>
              <p className="text-gray-900 capitalize">{ticket.category}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Impact Level</h3>
              <p className="text-gray-900 capitalize">{ticket.impact_level || 'individual'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Created</h3>
              <div className="flex items-center space-x-1 text-gray-900">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Submitted by</h3>
              <div className="flex items-center space-x-1 text-gray-900">
                <User className="w-4 h-4" />
                <span>{ticket.user_email}</span>
              </div>
            </div>
          </div>

          {/* AI Classification */}
          {ticket.ai_classification && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">AI Classification</h3>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Confidence:</span>
                  <span className="font-medium">
                    {Math.round((ticket.ai_classification as any).confidence * 100)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Urgency Score:</span>
                  <span className="font-medium">
                    {(ticket.ai_classification as any).urgency_score || 3}/5
                  </span>
                </div>
                {(ticket.ai_classification as any).classification_reasoning && (
                  <div className="text-sm">
                    <span className="text-gray-600">Reasoning:</span>
                    <p className="text-gray-900 mt-1">
                      {(ticket.ai_classification as any).classification_reasoning}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {ticket.tags && ticket.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {ticket.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    <Tag className="w-3 h-3" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Resolution Information */}
          {ticket.resolution && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Resolution</h3>
              <div className="bg-green-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Method:</span>
                  <span className="font-medium capitalize">
                    {(ticket.resolution as any).method}
                  </span>
                </div>
                {(ticket.resolution as any).resolution_time && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Resolution Time:</span>
                    <span className="font-medium">
                      {(ticket.resolution as any).resolution_time} minutes
                    </span>
                  </div>
                )}
                {(ticket.resolution as any).notes && (
                  <div className="text-sm">
                    <span className="text-gray-600">Notes:</span>
                    <p className="text-gray-900 mt-1">
                      {(ticket.resolution as any).notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Additional component for ticket statistics
export function TicketStats({ refreshTrigger }: { refreshTrigger: number }) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [refreshTrigger])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/tickets/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="card">
        <div className="flex items-center">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">Total Tickets</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
          </div>
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">Open</p>
            <p className="text-2xl font-bold text-yellow-600">{stats?.open || 0}</p>
          </div>
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <Clock className="w-4 h-4 text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">In Progress</p>
            <p className="text-2xl font-bold text-orange-600">{stats?.in_progress || 0}</p>
          </div>
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">Resolved</p>
            <p className="text-2xl font-bold text-green-600">{stats?.resolved || 0}</p>
          </div>
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
        </div>
      </div>
    </div>
  )
}
