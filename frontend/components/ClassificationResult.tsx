'use client'

import { Clock, CheckCircle, AlertTriangle, Zap, Settings } from 'lucide-react'

interface ClassificationResultProps {
  classification: {
    category: string
    priority: string
    automation_possible: boolean
    confidence: number
    reasoning: string
  }
  isLoading?: boolean
}

export default function ClassificationResult({ classification, isLoading = false }: ClassificationResultProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />
      case 'high': return <AlertTriangle className="w-4 h-4" />
      case 'medium': return <Clock className="w-4 h-4" />
      case 'low': return <CheckCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Password Reset': return '🔑'
      case 'VPN Issue': return '🌐'
      case 'Software Install': return '💻'
      case 'Device Slow': return '⚡'
      case 'Account Access': return '👤'
      default: return '📋'
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Analyzing your issue...</span>
        </div>
      </div>
    )
  }

  if (!classification) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center text-gray-500">
          <Settings className="w-8 h-8 mx-auto mb-2" />
          <p>Submit an issue to see classification results</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
        <span className="text-2xl">{getCategoryIcon(classification.category)}</span>
        <span>Classification Result</span>
      </h3>
      
      <div className="space-y-4">
        {/* Category */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Category</span>
          <span className="font-medium text-gray-900">{classification.category}</span>
        </div>

        {/* Priority */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Priority</span>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getPriorityColor(classification.priority)}`}>
            {getPriorityIcon(classification.priority)}
            <span className="text-sm font-medium uppercase">{classification.priority}</span>
          </div>
        </div>

        {/* Confidence */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Confidence</span>
            <span className="font-medium text-gray-900">
              {(classification.confidence * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                classification.confidence >= 0.8 ? 'bg-green-500' :
                classification.confidence >= 0.6 ? 'bg-yellow-500' :
                classification.confidence >= 0.4 ? 'bg-orange-500' : 'bg-red-500'
              }`}
              style={{ width: `${classification.confidence * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Automation */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Automation</span>
          <div className="flex items-center space-x-2">
            {classification.automation_possible ? (
              <>
                <Zap className="w-4 h-4 text-green-500" />
                <span className="text-green-600 font-medium">Available</span>
              </>
            ) : (
              <>
                <Settings className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 font-medium">Manual Required</span>
              </>
            )}
          </div>
        </div>

        {/* Reasoning */}
        <div className="pt-3 border-t">
          <span className="text-sm text-gray-600">AI Reasoning</span>
          <p className="text-sm text-gray-900 mt-1 bg-gray-50 p-3 rounded-lg">
            {classification.reasoning}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-3">
            {classification.automation_possible ? (
              <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Zap className="w-4 h-4" />
                <span>Auto-Fix Now</span>
              </button>
            ) : (
              <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Settings className="w-4 h-4" />
                <span>Get Manual Help</span>
              </button>
            )}
            
            <button className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <Clock className="w-4 h-4" />
              <span>Monitor Status</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
