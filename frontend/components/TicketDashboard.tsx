'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from './SupabaseProvider'
import { Ticket } from '../types/ticket'
import { format } from 'date-fns'
import { MessageCircle, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react'

interface TicketDashboardProps {
  onTicketSelect: (ticketId: string) => void
}

export default function TicketDashboard({ onTicketSelect }: TicketDashboardProps) {
  const { supabase } = useSupabase()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all')

  useEffect(() => {
    fetchTickets()
  }, [filter])

  const fetchTickets = async () => {
    try {
      let query = supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setTickets(data || [])
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <MessageCircle className="w-4 h-4 text-blue-500" />
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'closed':
        return <XCircle className="w-4 h-4 text-gray-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
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

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Support Tickets</h2>
        <div className="flex space-x-2">
          {(['all', 'open', 'in_progress', 'resolved'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {tickets.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No tickets found</p>
        ) : (
          tickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => onTicketSelect(ticket.id)}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getStatusIcon(ticket.status)}
                    <h3 className="font-medium text-gray-900">{ticket.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>{ticket.category}</span>
                    <span>•</span>
                    <span>{format(new Date(ticket.created_at), 'MMM d, h:mm a')}</span>
                    {ticket.ai_classification && (
                      <>
                        <span>•</span>
                        <span className="text-green-600">AI Classified</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
