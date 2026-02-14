'use client'

import { useState } from 'react'
import { useSupabase } from './SupabaseProvider'
import { X, Plus } from 'lucide-react'

interface CreateTicketModalProps {
  isOpen: boolean
  onClose: () => void
  onTicketCreated: () => void
}

export default function CreateTicketModal({ isOpen, onClose, onTicketCreated }: CreateTicketModalProps) {
  const { supabase, user } = useSupabase()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          user_id: user.id,
          user_email: user.email,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setTitle('')
        setDescription('')
        onClose()
        onTicketCreated()
      } else {
        setError(data.error || 'Failed to create ticket')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Create New Ticket</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="Brief description of your issue"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              placeholder="Provide detailed information about your issue"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !description.trim()}
              className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Floating action button to open the modal
interface CreateTicketButtonProps {
  onClick: () => void
}

export function CreateTicketButton({ onClick }: CreateTicketButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 z-40"
      title="Create New Ticket"
    >
      <Plus className="w-6 h-6" />
    </button>
  )
}
