'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bot, MessageSquare, ArrowRight, CheckCircle, Clock, TrendingUp, Users } from 'lucide-react'

export default function SimpleHomePage() {
  const [activeView, setActiveView] = useState<'form' | 'chat'>('form')
  const [formData, setFormData] = useState({
    issue: '',
    category: '',
    priority: 'medium'
  })
  const [chatMessage, setChatMessage] = useState('')
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      message: 'Hello! I\'m here to help you with your IT issues. Please describe the problem you\'re experiencing, and I\'ll do my best to assist you.'
    }
  ])
  const [submittedTickets, setSubmittedTickets] = useState([])
  const [isClient, setIsClient] = useState(false)

  // Set isClient to true after component mounts
  useEffect(() => {
    setIsClient(true)
    
    // Load tickets from localStorage only on client
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('submittedTickets')
      if (saved) {
        try {
          setSubmittedTickets(JSON.parse(saved))
        } catch (error) {
          console.error('Failed to load tickets from localStorage:', error)
          setSubmittedTickets([])
        }
      }
    }
  }, [])

  // Save tickets to localStorage whenever they change (only on client)
  useEffect(() => {
    if (isClient && submittedTickets.length > 0) {
      try {
        localStorage.setItem('submittedTickets', JSON.stringify(submittedTickets))
        
        // Trigger admin dashboard refresh
        window.dispatchEvent(new Event('tickets-updated'))
      } catch (error) {
        console.error('Failed to save tickets to localStorage:', error)
      }
    }
  }, [submittedTickets, isClient])

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.issue.trim()) {
      alert('Please describe your issue')
      return
    }

    try {
      // Create new ticket with simulated workflow
      const ticketData = {
        issue_text: formData.issue,
        category: formData.category || 'general',
        priority: formData.priority,
        user_email: 'user@example.com',
        title: formData.issue.substring(0, 100) + (formData.issue.length > 100 ? '...' : '')
      }

      // Simulate AI classification
      const classification = {
        category: formData.category || 'general',
        priority: formData.priority,
        confidence: 0.85,
        automation_possible: formData.category === 'hardware' || formData.category === 'network',
        reasoning: `Based on your description: "${formData.issue}", this appears to be a ${formData.category} issue with ${formData.priority} priority.`
      }

      const ticketId = `ticket-${Date.now()}`
      const newTicket = {
        id: ticketId,
        issue: formData.issue,
        category: formData.category || 'general',
        priority: formData.priority,
        status: classification.automation_possible ? 'in_progress' : 'open',
        submittedAt: new Date(),
        aiResponse: classification.reasoning,
        classification: classification,
        automation_possible: classification.automation_possible
      }

      setSubmittedTickets([newTicket, ...submittedTickets])

      // If automation is possible, simulate automation
      if (classification.automation_possible) {
        setTimeout(() => {
          const success = Math.random() > 0.2 // 80% success rate
          
          setSubmittedTickets(prev => prev.map(ticket => 
            ticket.id === newTicket.id 
              ? { 
                  ...ticket, 
                  status: success ? 'resolved' : 'escalated',
                  aiResponse: success 
                    ? `✅ Issue resolved automatically! ${formData.category === 'hardware' ? 'Disk cleanup completed successfully.' : 'VPN service restarted successfully.'}`
                    : '⚠️ Automation failed. Ticket has been escalated to human support.',
                  resolution_time: Math.floor(Math.random() * 10) + 5 // 5-15 seconds
                }
              : ticket
          ))

          alert(success 
            ? `✅ Ticket #${ticketId} resolved automatically!` 
            : `⚠️ Automation failed. Ticket #${ticketId} escalated to human support.`
          )
        }, 2000)
      } else {
        // No automation possible, escalate
        setTimeout(() => {
          setSubmittedTickets(prev => prev.map(ticket => 
            ticket.id === newTicket.id 
              ? { 
                  ...ticket, 
                  status: 'escalated',
                  aiResponse: '🔄 This issue requires human assistance. A support agent will contact you soon.'
                }
              : ticket
          ))
          alert(`🔄 Ticket #${ticketId} requires human assistance and has been escalated.`)
        }, 1500)
      }

      // Reset form
      setFormData({ issue: '', category: '', priority: 'medium' })
      
    } catch (error) {
      console.error('Submission error:', error)
      alert('Failed to submit ticket. Please try again.')
    }
  }

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!chatMessage.trim()) return

    // Add user message
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      message: chatMessage
    }
    
    setChatMessages(prev => [...prev, userMessage])
    const currentMessage = chatMessage
    setChatMessage('')

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        sender: 'ai',
        message: `I understand you're having an issue with: "${currentMessage}". Let me help you resolve this. Based on your description, I recommend checking the following steps...`
      }
      setChatMessages(prev => [...prev, aiResponse])
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">AI IT Service Desk</h1>
                <p className="text-sm text-gray-600">Intelligent IT Support Assistant</p>
              </div>
            </div>
            
            <nav className="flex items-center space-x-4">
              <Link 
                href="/admin"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Admin Dashboard
              </Link>
              <Link 
                href="/chat-assistant"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat Assistant</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Get Instant IT Support with AI
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Our AI-powered assistant helps you resolve IT issues quickly and efficiently. 
              From password resets to software installations, we've got you covered.
            </p>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setActiveView('form')}
                className={`px-6 py-3 rounded-lg transition-colors ${
                  activeView === 'form' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Quick Help Form
              </button>
              <button
                onClick={() => setActiveView('chat')}
                className={`px-6 py-3 rounded-lg transition-colors ${
                  activeView === 'chat' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Chat with AI
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Submitted Tickets Section */}
      {isClient && submittedTickets.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Submitted Tickets</h3>
            <div className="space-y-4">
              {submittedTickets.map((ticket) => (
                <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-sm font-medium text-gray-900">Ticket #{ticket.id}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {ticket.submittedAt ? new Date(ticket.submittedAt).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                  <p className="text-gray-900 mb-2">{ticket.issue}</p>
                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-sm text-gray-900">{ticket.aiResponse}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* View Switcher */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'form' ? (
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Help Form</h3>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What issue are you experiencing?
                </label>
                <textarea
                  value={formData.issue}
                  onChange={(e) => setFormData({...formData, issue: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-900 text-gray-900"
                  rows={4}
                  placeholder="Please describe your IT issue in detail..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="">Select category</option>
                    <option value="password">Password Reset</option>
                    <option value="vpn">VPN Issue</option>
                    <option value="software">Software Install</option>
                    <option value="hardware">Hardware Issue</option>
                    <option value="account">Account Access</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select 
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Submit Request
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Chat with AI Assistant</h3>
            <div className="space-y-4">
              <div className="h-96 overflow-y-auto space-y-4 border border-gray-200 rounded-lg p-4">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.sender === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <div className="flex items-center space-x-2 mb-1">
                        {msg.sender === 'ai' && <Bot className="w-4 h-4 text-blue-600" />}
                        <span className="text-xs font-medium">
                          {msg.sender === 'user' ? 'You' : 'AI Assistant'}
                        </span>
                      </div>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <form onSubmit={handleChatSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-900 text-gray-900"
                  placeholder="Type your message..."
                />
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Why Choose AI IT Service Desk?</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">24/7 Availability</h4>
              <p className="text-gray-900">Get help anytime, anywhere. Our AI assistant is always ready to assist you.</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Quick Resolution</h4>
              <p className="text-gray-900">Most issues are resolved automatically without human intervention.</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Smart Learning</h4>
              <p className="text-gray-900">Our system learns from each interaction to provide better support over time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-900">
            <p>&copy; 2024 AI IT Service Desk. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
