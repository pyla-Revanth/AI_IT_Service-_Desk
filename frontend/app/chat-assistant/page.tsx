'use client'

import { useState, useEffect } from 'react'
import { Bot, Send, AlertCircle, CheckCircle, Clock, User, Sparkles } from 'lucide-react'

interface Message {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  classification?: {
    category: string
    priority: string
    automation_possible: boolean
    confidence: number
    reasoning: string
  }
}

interface Resolution {
  id: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  action: string
  timestamp: string
  duration?: number
}

export default function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [classification, setClassification] = useState<any>(null)
  const [resolution, setResolution] = useState<Resolution | null>(null)
  const [isTyping, setIsTyping] = useState(false)

  // API base URLs
  const TICKET_API = 'http://localhost:3001/api'
  const CLASSIFICATION_API = 'http://localhost:3002/api'

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      type: 'system',
      content: '👋 Hello! I\'m your AI IT Assistant. Describe your issue and I\'ll help classify it and find the best solution.',
      timestamp: new Date().toISOString()
    }
    setMessages([welcomeMessage])
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const chatContainer = document.getElementById('chat-container')
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }, [messages])

  const classifyIssue = async (issueText: string) => {
    try {
      setIsLoading(true)
      
      // Call classification API
      const response = await fetch(`${CLASSIFICATION_API}/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticket_text: issueText,
          user_id: 'demo-user-id'
        })
      })

      if (!response.ok) {
        throw new Error('Classification failed')
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      console.error('Classification error:', error)
      return null
    }
  }

  const createTicket = async (issueText: string, classification: any) => {
    try {
      const response = await fetch(`${TICKET_API}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'demo-user-id',
          issue_text: issueText,
          category: classification?.category?.toLowerCase().replace(' ', '_') || 'other',
          priority: classification?.priority || 'medium'
        })
      })

      if (!response.ok) {
        throw new Error('Ticket creation failed')
      }

      return await response.json()
    } catch (error) {
      console.error('Ticket creation error:', error)
      return null
    }
  }

  const resolveTicket = async (ticketId: string) => {
    try {
      const response = await fetch(`${TICKET_API}/tickets/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          action_taken: 'AI Assistant resolved issue automatically',
          resolved_by_agent: 'ai_assistant',
          resolution_time: 5
        })
      })

      if (!response.ok) {
        throw new Error('Resolution failed')
      }

      return await response.json()
    } catch (error) {
      console.error('Resolution error:', error)
      return null
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    try {
      // Classify the issue
      const classificationResult = await classifyIssue(userMessage.content)
      
      if (classificationResult) {
        setClassification(classificationResult)

        // Add classification message
        const classificationMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `I've classified your issue as **${classificationResult.category}** with **${classificationResult.priority}** priority.\n\n**Confidence:** ${(classificationResult.confidence * 100).toFixed(1)}%\n**Automation Possible:** ${classificationResult.automation_possible ? '✅ Yes' : '❌ No'}\n\n**Reasoning:** ${classificationResult.reasoning}`,
          timestamp: new Date().toISOString(),
          classification: classificationResult
        }

        setMessages(prev => [...prev, classificationMessage])

        // Create ticket
        const ticketResult = await createTicket(userMessage.content, classificationResult)
        
        if (ticketResult) {
          const ticketMessage: Message = {
            id: (Date.now() + 2).toString(),
            type: 'assistant',
            content: `🎫 **Ticket Created Successfully**\n\n**Ticket ID:** ${ticketResult.data.id}\n**Status:** ${ticketResult.data.status}\n**Category:** ${ticketResult.data.category}\n**Priority:** ${ticketResult.data.priority}`,
            timestamp: new Date().toISOString()
          }

          setMessages(prev => [...prev, ticketMessage])

          // If automation is possible, attempt resolution
          if (classificationResult.automation_possible) {
            setResolution({
              id: Date.now().toString(),
              status: 'in_progress',
              action: 'Attempting automated resolution...',
              timestamp: new Date().toISOString()
            })

            const resolutionResult = await resolveTicket(ticketResult.data.id)
            
            if (resolutionResult) {
              setResolution({
                id: Date.now().toString(),
                status: 'completed',
                action: 'Issue resolved automatically',
                timestamp: new Date().toISOString(),
                duration: 5
              })

              const resolutionMessage: Message = {
                id: (Date.now() + 3).toString(),
                type: 'assistant',
                content: `✅ **Issue Resolved Successfully**\n\nYour ${classificationResult.category} issue has been resolved automatically.\n\n**Action Taken:** ${resolutionResult.data.resolution.action_taken}\n**Resolution Time:** ${resolutionResult.data.resolution.resolution_time} minutes`,
                timestamp: new Date().toISOString()
              }

              setMessages(prev => [...prev, resolutionMessage])
            } else {
              setResolution({
                id: Date.now().toString(),
                status: 'failed',
                action: 'Automated resolution failed',
                timestamp: new Date().toISOString()
              })

              const failedMessage: Message = {
                id: (Date.now() + 3).toString(),
                type: 'assistant',
                content: `❌ **Automated Resolution Failed**\n\nI couldn't resolve your ${classificationResult.category} issue automatically. A human agent will be assigned to help you.\n\n**Ticket ID:** ${ticketResult.data.id}`,
                timestamp: new Date().toISOString()
              }

              setMessages(prev => [...prev, failedMessage])
            }
          } else {
            const manualMessage: Message = {
              id: (Date.now() + 3).toString(),
              type: 'assistant',
              content: `👨‍💼 **Manual Assistance Required**\n\nYour ${classificationResult.category} issue requires human assistance.\n\n**Ticket ID:** ${ticketResult.data.id}\nA support agent will contact you shortly.`,
              timestamp: new Date().toISOString()
            }

            setMessages(prev => [...prev, manualMessage])
          }
        }
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: '❌ **Classification Failed**\n\nI had trouble classifying your issue. Please try rephrasing it or contact support directly.',
          timestamp: new Date().toISOString()
        }

        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '❌ **Something went wrong**\n\nI encountered an error while processing your request. Please try again.',
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-gray-500" />
      case 'in_progress': return <Sparkles className="w-4 h-4 text-blue-500" />
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">AI IT Assistant</h1>
              <p className="text-sm text-gray-600">Get instant help with IT issues</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              {/* Chat Messages */}
              <div 
                id="chat-container"
                className="h-96 overflow-y-auto p-4 space-y-4"
              >
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : message.type === 'system'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-start space-x-2 mb-2">
                        {message.type === 'user' ? (
                          <User className="w-4 h-4 mt-0.5" />
                        ) : (
                          <Bot className="w-4 h-4 mt-0.5" />
                        )}
                        <span className="text-xs opacity-75">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-4 h-4" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t p-4">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Describe your IT issue..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !input.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Classification Result */}
            {classification && (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Classification Result</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-medium">{classification.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Priority</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(classification.priority)}`}>
                      {classification.priority.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Confidence</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${classification.confidence * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {(classification.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Automation</p>
                    <p className="text-sm">
                      {classification.automation_possible ? (
                        <span className="text-green-600">✅ Available</span>
                      ) : (
                        <span className="text-red-600">❌ Not Available</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Resolution Status */}
            {resolution && (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Resolution Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(resolution.status)}
                    <div>
                      <p className="font-medium capitalize">
                        {resolution.status.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-gray-600">{resolution.action}</p>
                      {resolution.duration && (
                        <p className="text-xs text-gray-500">
                          Completed in {resolution.duration} minutes
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  🔄 Reset Password
                </button>
                <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  🌐 VPN Issues
                </button>
                <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  💻 Software Install
                </button>
                <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  ⚡ Performance Issues
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
