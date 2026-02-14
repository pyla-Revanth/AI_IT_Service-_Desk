'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSupabase } from '../../../components/SupabaseProvider'
import ChatInterface from '../../../components/ChatInterface'
import TicketDetails from '../../../components/TicketDetails'
import { ArrowLeft } from 'lucide-react'

export default function ChatPage() {
  const { user } = useSupabase()
  const params = useParams()
  const router = useRouter()
  const ticketId = params.ticketId as string
  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (ticketId) {
      fetchTicket()
    }
  }, [ticketId])

  const fetchTicket = async () => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTicket(data.ticket)
      }
    } catch (error) {
      console.error('Error fetching ticket:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAuthToken = async () => {
    // This would get the auth token from Supabase
    // Implementation depends on your auth setup
    return localStorage.getItem('supabase_token') || ''
  }

  if (!user) {
    return <div>Loading...</div>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {ticket?.title || 'Loading...'}
                </h1>
                <p className="text-sm text-gray-600">Ticket ID: {ticketId}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Logged in as {user.email}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ticket Details */}
          <div className="lg:col-span-1">
            {ticket && <TicketDetails ticket={ticket} />}
          </div>
          
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <ChatInterface ticketId={ticketId} />
          </div>
        </div>
      </main>
    </div>
  )
}
