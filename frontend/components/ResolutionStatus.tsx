'use client'

import { CheckCircle, Clock, AlertCircle, Loader, Zap, User, Calendar } from 'lucide-react'

interface ResolutionStatusProps {
  resolution: {
    id: string
    status: 'pending' | 'in_progress' | 'completed' | 'failed'
    action: string
    timestamp: string
    duration?: number
    ticketId?: string
    agent?: string
  }
  isLoading?: boolean
}

export default function ResolutionStatus({ resolution, isLoading = false }: ResolutionStatusProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-gray-500" />
      case 'in_progress': return <Loader className="w-5 h-5 text-blue-500 animate-spin" />
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed': return <AlertCircle className="w-5 h-5 text-red-500" />
      default: return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-gray-600 bg-gray-50 border-gray-200'
      case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'completed': return 'text-green-600 bg-green-50 border-green-200'
      case 'failed': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Waiting to Start'
      case 'in_progress': return 'In Progress'
      case 'completed': return 'Completed Successfully'
      case 'failed': return 'Resolution Failed'
      default: return 'Unknown Status'
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-3">
          <Loader className="w-6 h-6 text-blue-600 animate-spin" />
          <span className="text-gray-600">Initializing resolution...</span>
        </div>
      </div>
    )
  }

  if (!resolution) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center text-gray-500">
          <Clock className="w-8 h-8 mx-auto mb-2" />
          <p>No resolution in progress</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Resolution Status</h3>
      
      <div className="space-y-4">
        {/* Status Header */}
        <div className={`flex items-center space-x-3 p-4 rounded-lg border ${getStatusColor(resolution.status)}`}>
          {getStatusIcon(resolution.status)}
          <div>
            <p className="font-medium">{getStatusText(resolution.status)}</p>
            <p className="text-sm opacity-75">{resolution.action}</p>
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Issue Submitted</p>
              <p className="text-xs text-gray-600">
                {new Date(resolution.timestamp).toLocaleString()}
              </p>
            </div>
          </div>

          {resolution.status !== 'pending' && (
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                resolution.status === 'in_progress' ? 'bg-blue-100' :
                resolution.status === 'completed' ? 'bg-green-100' :
                'bg-red-100'
              }`}>
                {resolution.status === 'in_progress' && <Loader className="w-4 h-4 text-blue-600 animate-spin" />}
                {resolution.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                {resolution.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-600" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {resolution.status === 'in_progress' ? 'Processing Resolution' :
                   resolution.status === 'completed' ? 'Resolution Completed' :
                   'Resolution Failed'}
                </p>
                <p className="text-xs text-gray-600">
                  {resolution.agent && `Agent: ${resolution.agent}`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Resolution Details */}
        {resolution.status === 'completed' && (
          <div className="pt-4 border-t">
            <h4 className="font-medium text-gray-900 mb-3">Resolution Details</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">
                  {resolution.duration ? `Completed in ${resolution.duration} minutes` : 'Completed successfully'}
                </span>
              </div>
              
              {resolution.ticketId && (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Ticket ID: {resolution.ticketId}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Details */}
        {resolution.status === 'failed' && (
          <div className="pt-4 border-t">
            <h4 className="font-medium text-red-900 mb-3">Resolution Failed</h4>
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-red-800">
                Automated resolution failed. A human IT specialist will be assigned to your case shortly.
              </p>
            </div>
            <button className="mt-3 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              Contact Human Support
            </button>
          </div>
        )}

        {/* Next Steps */}
        {resolution.status === 'pending' && (
          <div className="pt-4 border-t">
            <h4 className="font-medium text-gray-900 mb-3">Next Steps</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>AI will analyze your issue</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full"></div>
                <span>Best solution will be determined</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full"></div>
                <span>Automated or manual resolution</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
