'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bot, MessageSquare, ArrowRight, CheckCircle, Clock, TrendingUp, Users, Sparkles, Zap, Shield, Cpu, Wifi, HardDrive, AlertTriangle } from 'lucide-react'

export default function AdvancedHomePage() {
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
      message: '🤖 Hello! I\'m your advanced AI assistant. I\'m here to help you with your IT issues using cutting-edge automation and intelligence!'
    }
  ])
  const [submittedTickets, setSubmittedTickets] = useState([])
  const [isClient, setIsClient] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

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

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme)
    }
  }

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
        reasoning: `🧠 AI Analysis: Based on your description, this appears to be a ${formData.category} issue with ${formData.priority} priority. Confidence: 85%`
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
                    ? `✅ Issue resolved automatically! ${formData.category === 'hardware' ? '🧹 Disk cleanup completed successfully. Performance improved by 35%.' : '🌐 VPN service restarted successfully. Connection restored.'}`
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
        message: `🤖 I understand you're having an issue with: "${currentMessage}". Let me analyze this using my advanced AI capabilities and provide you with the best solution...`
      }
      setChatMessages(prev => [...prev, aiResponse])
    }, 1000)
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

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 opacity-90"></div>
      <div className="fixed inset-0">
        <div className="absolute top-0 left-0 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-6 right-6 z-50 glass-dark p-3 rounded-full hover:scale-110 transition-all duration-300 glow"
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      {/* Floating Particles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`
            }}
          ></div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="glass-dark border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center floating">
                  <Bot className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">AI IT Service Desk</h1>
                  <p className="text-white/80">Advanced Intelligent Support System</p>
                </div>
              </div>
              
              <nav className="flex items-center space-x-4">
                <Link 
                  href="/admin"
                  className="glass px-6 py-3 rounded-xl text-white hover:scale-105 transition-all duration-300 hover:shadow-xl"
                >
                  📊 Admin Dashboard
                </Link>
                <Link 
                  href="/chat-assistant"
                  className="btn-gradient px-6 py-3 rounded-xl flex items-center space-x-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>AI Chat</span>
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-lg rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="text-white font-medium">Powered by Advanced AI</span>
            </div>
            
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Next-Generation
              <span className="gradient-text"> IT Support</span>
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
              Experience the future of IT support with our advanced AI-powered assistant. 
              Instant resolutions, intelligent automation, and 24/7 availability.
            </p>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setActiveView('form')}
                className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  activeView === 'form' 
                    ? 'btn-gradient shadow-2xl' 
                    : 'glass text-white hover:shadow-xl'
                }`}
              >
                🚀 Quick Help Form
              </button>
              <button
                onClick={() => setActiveView('chat')}
                className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  activeView === 'chat' 
                    ? 'btn-gradient shadow-2xl' 
                    : 'glass text-white hover:shadow-xl'
                }`}
              >
                💬 Chat with AI
              </button>
            </div>
          </div>
        </section>

        {/* Submitted Tickets Section */}
        {isClient && submittedTickets.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="relative">
              {/* Border Wrapper */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-xl"></div>
              <div className="relative glass-dark p-8 rounded-3xl border-2 border-white/20 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-bold text-white flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mr-3 floating">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    Your Active Tickets
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-white/80 text-sm">Live Updates</span>
                  </div>
                </div>
                
                {/* Tickets Container */}
                <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                  {submittedTickets.map((ticket) => (
                    <div key={ticket.id} className="relative group">
                      {/* Ticket Border */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-2xl blur group-hover:blur-none transition-all duration-300"></div>
                      <div className="relative glass p-6 rounded-2xl border border-white/10 hover:border-white/30 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl">
                        {/* Ticket Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                              {getCategoryIcon(ticket.category)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-3">
                                <span className="text-lg font-bold text-white">Ticket #{ticket.id}</span>
                                <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                  ticket.status === 'resolved' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                                  ticket.status === 'escalated' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                                  'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                                }`}>
                                  {ticket.status.replace('_', ' ').toUpperCase()}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 mt-2">
                                <Clock className="w-4 h-4 text-white/60" />
                                <span className="text-white/60 text-sm">
                                  {ticket.submittedAt ? new Date(ticket.submittedAt).toLocaleTimeString() : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Ticket Content */}
                        <div className="space-y-4">
                          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10">
                            <p className="text-white/90 font-medium">{ticket.issue}</p>
                          </div>
                          
                          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                            <div className="flex items-start space-x-3">
                              <Bot className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                              <div>
                                <p className="text-white/90 text-sm leading-relaxed">{ticket.aiResponse}</p>
                                {ticket.resolution_time && (
                                  <div className="flex items-center space-x-2 mt-2">
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                    <span className="text-green-400 text-xs font-medium">
                                      Resolved in {ticket.resolution_time}s
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* View Switcher */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeView === 'form' ? (
            <div className="relative">
              {/* Form Border Wrapper */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-purple-500/20 rounded-3xl blur-xl"></div>
              <div className="relative glass-dark p-8 rounded-3xl border-2 border-white/20 shadow-2xl">
                <h3 className="text-3xl font-bold text-white mb-8 flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl flex items-center justify-center mr-3 floating">
                    <Cpu className="w-6 h-6 text-white" />
                  </div>
                  Advanced Help Form
                </h3>
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl"></div>
                    <div className="relative">
                      <label className="block text-white font-semibold mb-3 flex items-center">
                        <Sparkles className="w-4 h-4 mr-2 text-yellow-300" />
                        Describe your IT issue
                      </label>
                      <textarea
                        value={formData.issue}
                        onChange={(e) => setFormData({...formData, issue: e.target.value})}
                        className="w-full px-4 py-4 bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-xl text-white placeholder-white/60 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
                        rows={4}
                        placeholder="Please describe your IT issue in detail..."
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl"></div>
                      <div className="relative">
                        <label className="block text-white font-semibold mb-3 flex items-center">
                          <Shield className="w-4 h-4 mr-2 text-purple-300" />
                          Category
                        </label>
                        <select 
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          className="w-full px-4 py-4 bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-xl text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
                        >
                          <option value="" className="bg-gray-800">Select category</option>
                          <option value="password" className="bg-gray-800">🔐 Password Reset</option>
                          <option value="vpn" className="bg-gray-800">🌐 VPN Issue</option>
                          <option value="software" className="bg-gray-800">💻 Software Install</option>
                          <option value="hardware" className="bg-gray-800">🔧 Hardware Issue</option>
                          <option value="account" className="bg-gray-800">👤 Account Access</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-2xl"></div>
                      <div className="relative">
                        <label className="block text-white font-semibold mb-3 flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-2 text-orange-300" />
                          Priority
                        </label>
                        <select 
                          value={formData.priority}
                          onChange={(e) => setFormData({...formData, priority: e.target.value})}
                          className="w-full px-4 py-4 bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-xl text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
                        >
                          <option value="low" className="bg-gray-800">🟢 Low</option>
                          <option value="medium" className="bg-gray-800">🟡 Medium</option>
                          <option value="high" className="bg-gray-800">🟠 High</option>
                          <option value="critical" className="bg-gray-800">🔴 Critical</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-2xl"></div>
                    <button
                      type="submit"
                      className="relative w-full btn-gradient py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <Zap className="w-6 h-6" />
                      <span>Submit Request</span>
                      <ArrowRight className="w-6 h-6" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Chat Box Border Wrapper */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 rounded-3xl blur-xl"></div>
              <div className="relative glass-dark p-8 rounded-3xl border-2 border-white/20 shadow-2xl">
                <h3 className="text-3xl font-bold text-white mb-8 flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mr-3 floating">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  AI Chat Assistant
                </h3>
                <div className="space-y-6">
                  {/* Chat Messages Container */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl"></div>
                    <div className="relative h-96 overflow-y-auto space-y-4 glass rounded-2xl p-6 border border-white/10 custom-scrollbar">
                      {chatMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} group`}>
                          {/* Message Border */}
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur group-hover:blur-none transition-all duration-300"></div>
                            <div className={`relative px-6 py-4 rounded-2xl border transition-all duration-300 transform hover:scale-105 ${
                              msg.sender === 'user' 
                                ? 'btn-gradient shadow-xl border-white/20' 
                                : 'glass shadow-xl border-white/10 hover:border-white/30'
                            }`}>
                              {/* Message Header */}
                              <div className="flex items-center space-x-2 mb-3">
                                {msg.sender === 'ai' && (
                                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-white" />
                                  </div>
                                )}
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-bold text-white">
                                    {msg.sender === 'user' ? '👤 You' : '🤖 AI Assistant'}
                                  </span>
                                  {msg.sender === 'ai' && (
                                    <div className="flex items-center space-x-1">
                                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                      <span className="text-green-400 text-xs">Online</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Message Content */}
                              <p className="text-white leading-relaxed">{msg.message}</p>
                              
                              {/* Message Footer */}
                              <div className="flex items-center justify-between mt-3">
                                <span className="text-white/60 text-xs">
                                  {new Date().toLocaleTimeString()}
                                </span>
                                {msg.sender === 'ai' && (
                                  <div className="flex items-center space-x-1">
                                    <CheckCircle className="w-3 h-3 text-green-400" />
                                    <span className="text-green-400 text-xs">Delivered</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Chat Input Container */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl"></div>
                    <div className="relative glass p-4 rounded-2xl border border-white/20">
                      <form onSubmit={handleChatSubmit} className="flex space-x-4">
                        <div className="relative flex-1">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl"></div>
                          <input
                            type="text"
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            className="relative w-full px-6 py-4 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-white/60 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
                            placeholder="Type your message..."
                          />
                        </div>
                        <button 
                          type="submit"
                          className="btn-gradient px-8 py-4 rounded-xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
                        >
                          <span>Send</span>
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h3 className="text-4xl font-bold text-white text-center mb-12">
            Why Choose Our Advanced AI System?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-dark p-8 rounded-2xl card-hover text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 floating">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-white mb-4">24/7 Availability</h4>
              <p className="text-white/80">Get help anytime, anywhere. Our AI assistant is always ready to assist you with instant responses.</p>
            </div>
            
            <div className="glass-dark p-8 rounded-2xl card-hover text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 floating" style={{animationDelay: '1s'}}>
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-white mb-4">Instant Resolution</h4>
              <p className="text-white/80">Most issues are resolved automatically within seconds using advanced AI automation.</p>
            </div>
            
            <div className="glass-dark p-8 rounded-2xl card-hover text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 floating" style={{animationDelay: '2s'}}>
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-white mb-4">Smart Learning</h4>
              <p className="text-white/80">Our system learns from each interaction to provide better and more accurate support over time.</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="glass-dark border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-white/80">
              <p>&copy; 2024 AI IT Service Desk. Advanced Intelligent Support System.</p>
            </div>
          </div>
        </footer>
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
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
