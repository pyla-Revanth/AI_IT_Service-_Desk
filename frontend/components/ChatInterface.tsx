'use client'

import { useState, useEffect, useRef } from 'react'
import { useSupabase } from './SupabaseProvider'
import { ChatMessage } from '../types/ticket'
import { Send, Bot, User } from 'lucide-react'

interface ChatInterfaceProps {
  ticketId: string | null
}

export default function ChatInterface({ ticketId }: ChatInterfaceProps) {
  const { supabase, user } = useSupabase()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ticketId) {
      fetchMessages()
    }
  }, [ticketId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    if (!ticketId) return

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('timestamp', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || !ticketId || !user) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      ticket_id: ticketId,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Send message to backend for AI processing
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          ticketId,
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const aiMessage: ChatMessage = {
          id: Date.now().toString(),
          ticket_id: ticketId,
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
          metadata: data.metadata,
        }

        setMessages(prev => [...prev, aiMessage])

        // Save messages to database
        await supabase.from('chat_messages').insert([userMessage, aiMessage])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        ticket_id: ticketId,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!ticketId) {
    return (
      <div className="card h-96 flex items-center justify-center">
        <div className="text-center">
          <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Select a ticket to start chatting</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card h-96 flex flex-col">
      <div className="border-b pb-4 mb-4">
        <h2 className="text-xl font-semibold text-gray-900">AI Assistant</h2>
        <p className="text-sm text-gray-600">Get help with your IT issues</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Start a conversation with the AI assistant</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-2 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary-600" />
                </div>
              )}
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                {message.metadata?.automation_triggered && (
                  <p className="text-xs mt-1 opacity-75">🤖 Automation triggered</p>
                )}
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          className="input"
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
