'use client'

import { ReactNode } from 'react'
import { Bot, ArrowLeft, Home, MessageSquare } from 'lucide-react'
import Link from 'next/link'

interface ChatLayoutProps {
  children: ReactNode
  title?: string
  showBackButton?: boolean
}

export default function ChatLayout({ children, title = "AI IT Assistant", showBackButton = true }: ChatLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {showBackButton && (
                <Link 
                  href="/"
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
              )}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                  <p className="text-xs text-gray-600">AI-Powered IT Support</p>
                </div>
              </div>
            </div>
            
            <nav className="flex items-center space-x-1">
              <Link 
                href="/"
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Dashboard"
              >
                <Home className="w-5 h-5 text-gray-600" />
              </Link>
              <Link 
                href="/chat-assistant"
                className="p-2 rounded-lg bg-blue-50 transition-colors"
                title="Chat Assistant"
              >
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <p>© 2024 AI IT Service Desk. All rights reserved.</p>
            <div className="flex items-center space-x-4">
              <span>Status: Online</span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
