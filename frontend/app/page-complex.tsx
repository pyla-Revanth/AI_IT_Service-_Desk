'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bot, MessageSquare, ArrowRight, CheckCircle, Clock, TrendingUp, Users } from 'lucide-react'
import ChatLayout from '../components/ChatLayout'
import IssueForm from '../components/IssueForm'
import ClassificationResult from '../components/ClassificationResult'
import ResolutionStatus from '../components/ResolutionStatus'

export default function HomePage() {
  const [activeView, setActiveView] = useState<'form' | 'chat'>('form')
  const [classification, setClassification] = useState(null)
  const [resolution, setResolution] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleIssueSubmit = async (issue: string, category?: string, priority?: string) => {
    setIsLoading(true)
    setResolution({ id: '1', status: 'pending', action: 'Analyzing issue...', timestamp: new Date().toISOString() })

    try {
      // Simulate API call to classification service
      const response = await fetch('http://localhost:3002/api/classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticket_text: issue,
          user_id: 'demo-user-id'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setClassification(data.data)
        
        // Create ticket
        const ticketResponse = await fetch('http://localhost:3001/api/tickets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: 'demo-user-id',
            issue_text: issue,
            category: data.data.category.toLowerCase().replace(' ', '_'),
            priority: data.data.priority
          })
        })

        if (ticketResponse.ok) {
          const ticketData = await ticketResponse.json()
          
          if (data.data.automation_possible) {
            setResolution({
              id: '1',
              status: 'in_progress',
              action: 'Attempting automated resolution...',
              timestamp: new Date().toISOString(),
              ticketId: ticketData.data.id
            })

            // Simulate resolution
            setTimeout(() => {
              setResolution({
                id: '1',
                status: 'completed',
                action: 'Issue resolved automatically',
                timestamp: new Date().toISOString(),
                duration: 5,
                ticketId: ticketData.data.id,
                agent: 'AI Assistant'
              })
            }, 3000)
          } else {
            setResolution({
              id: '1',
              status: 'pending',
              action: 'Waiting for human agent assignment...',
              timestamp: new Date().toISOString(),
              ticketId: ticketData.data.id
            })
          }
        }
      }
    } catch (error) {
      console.error('Error:', error)
      setResolution({
        id: '1',
        status: 'failed',
        action: 'Failed to process issue',
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsLoading(false)
    }
  }

  const stats = [
    { label: 'Issues Resolved', value: '1,247', change: '+12%', icon: CheckCircle, color: 'text-green-600' },
    { label: 'Avg Response Time', value: '2.3 min', change: '-18%', icon: Clock, color: 'text-blue-600' },
    { label: 'Success Rate', value: '94.5%', change: '+3%', icon: TrendingUp, color: 'text-purple-600' },
    { label: 'Active Users', value: '847', change: '+25%', icon: Users, color: 'text-orange-600' }
  ]

  return (
    <ChatLayout title="AI IT Service Desk">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 text-white">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">
              AI-Powered IT Support
            </h1>
            <p className="text-xl mb-6 opacity-90">
              Get instant help with password resets, VPN issues, software installation, and more
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setActiveView('form')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  activeView === 'form'
                    ? 'bg-white text-blue-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                Quick Help
              </button>
              <button
                onClick={() => setActiveView('chat')}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                  activeView === 'chat'
                    ? 'bg-white text-blue-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat Assistant</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <span className={`text-sm font-medium ${
                  stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Issue Input */}
          <div className="lg:col-span-2">
            {activeView === 'form' ? (
              <IssueForm onSubmit={handleIssueSubmit} isLoading={isLoading} />
            ) : (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Chat with AI Assistant</h2>
                  <div className="text-center py-8">
                    <Link 
                      href="/chat-assistant"
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <span>Start Chat</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Classification Result */}
            <div className="mt-6">
              <ClassificationResult 
                classification={classification} 
                isLoading={isLoading && !classification} 
              />
            </div>
          </div>

          {/* Right Column - Resolution Status */}
          <div>
            <ResolutionStatus resolution={resolution} isLoading={isLoading && !resolution} />
            
            {/* Quick Links */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-3">
                <Link 
                  href="/dashboard"
                  className="flex items-center space-x-3 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="text-sm">View All Tickets</span>
                </Link>
                <Link 
                  href="/chat-assistant"
                  className="flex items-center space-x-3 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="text-sm">Chat History</span>
                </Link>
                <a 
                  href="mailto:support@company.com"
                  className="flex items-center space-x-3 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="text-sm">Contact Support</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ChatLayout>
  )
}
