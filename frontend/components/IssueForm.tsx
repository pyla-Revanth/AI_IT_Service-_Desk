'use client'

import { useState } from 'react'
import { Send, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react'

interface IssueFormProps {
  onSubmit: (issue: string, category?: string, priority?: string) => void
  isLoading?: boolean
}

const commonIssues = [
  { text: "I forgot my password and can't login", category: "Password Reset", priority: "high" },
  { text: "VPN is not working from home office", category: "VPN Issue", priority: "high" },
  { text: "My computer is running very slow", category: "Device Slow", priority: "medium" },
  { text: "I need Microsoft Office installed", category: "Software Install", priority: "medium" },
  { text: "Can't access shared network drive", category: "Account Access", priority: "high" }
]

export default function IssueForm({ onSubmit, isLoading = false }: IssueFormProps) {
  const [issue, setIssue] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (issue.trim()) {
      onSubmit(issue.trim())
    }
  }

  const useTemplate = (template: typeof commonIssues[0]) => {
    setIssue(template.text)
    setSelectedTemplate(template.text)
    onSubmit(template.text, template.category, template.priority)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Describe Your Issue</h2>
      
      {/* Quick Issue Templates */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">Common Issues (Click to use):</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {commonIssues.map((template, index) => (
            <button
              key={index}
              onClick={() => useTemplate(template)}
              className={`text-left p-3 rounded-lg border transition-all ${
                selectedTemplate === template.text
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0">
                  {template.priority === 'high' && <div className="w-full h-full bg-red-500 rounded-full"></div>}
                  {template.priority === 'medium' && <div className="w-full h-full bg-yellow-500 rounded-full"></div>}
                  {template.priority === 'low' && <div className="w-full h-full bg-green-500 rounded-full"></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{template.text}</p>
                  <p className="text-xs text-gray-600">{template.category}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Issue Input */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="issue" className="block text-sm font-medium text-gray-700 mb-2">
            Or describe your issue in detail:
          </label>
          <textarea
            id="issue"
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            placeholder="Please describe your IT issue in detail. Include any error messages, when it started, and what you've tried..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500">
            {issue.length}/500 characters
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <AlertCircle className="w-4 h-4" />
            <span>AI will classify and suggest solutions automatically</span>
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !issue.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Issue</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Tips */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips for Better Results:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Include specific error messages</li>
          <li>• Mention when the issue started</li>
          <li>• Describe what you've already tried</li>
          <li>• Include your device type and OS</li>
        </ul>
      </div>
    </div>
  )
}
