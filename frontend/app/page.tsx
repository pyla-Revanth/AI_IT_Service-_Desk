'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '../components/SupabaseProvider'
import TicketDashboard from '../components/TicketDashboard'
import ChatInterface from '../components/ChatInterface'
import AuthGuard from '../components/AuthGuard'
import CreateTicketModal, { CreateTicketButton } from '../components/CreateTicketModal'

export default function Home() {
  const { user, loading, supabase } = useSupabase()
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return <AuthGuard />
  }

  const handleTicketCreated = () => {
    // Refresh the ticket dashboard
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">AI IT Service Desk</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Logged in as {user.email}</span>
              <button 
                onClick={() => supabase.auth.signOut()}
                className="btn btn-secondary"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <TicketDashboard onTicketSelect={setSelectedTicket} />
          </div>
          <div className="space-y-6">
            <ChatInterface ticketId={selectedTicket} />
          </div>
        </div>
      </main>

      <CreateTicketButton onClick={() => setIsCreateModalOpen(true)} />
      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTicketCreated={handleTicketCreated}
      />
    </div>
  )
}
