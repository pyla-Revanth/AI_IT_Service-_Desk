'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '../../components/SupabaseProvider'
import TicketDashboard from '../../components/TicketDashboard'
import CreateTicketModal, { CreateTicketButton } from '../../components/CreateTicketModal'
import { TicketStats } from '../../components/TicketStats'

export default function DashboardPage() {
  const { user } = useSupabase()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleTicketCreated = () => {
    setIsCreateModalOpen(false)
    setRefreshTrigger(prev => prev + 1)
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">IT Service Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.email}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Statistics Overview */}
          <TicketStats refreshTrigger={refreshTrigger} />
          
          {/* Tickets Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="lg:col-span-2">
              <TicketDashboard 
                refreshTrigger={refreshTrigger}
                onTicketSelect={() => {}} // Navigation handled separately
              />
            </div>
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
