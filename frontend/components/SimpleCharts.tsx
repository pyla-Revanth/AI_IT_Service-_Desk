'use client'

interface SimpleChartsProps {
  data: any[]
  title: string
  type: 'bar' | 'line' | 'pie'
  height?: number
}

export default function SimpleCharts({ data, title, type = 'bar', height = 300 }: SimpleChartsProps) {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#6b7280', '#8b5cf6']

  if (type === 'bar') {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <span className="w-24 text-sm text-gray-600">{item.name}:</span>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                <div 
                  className="bg-blue-500 h-6 rounded-full transition-all duration-500"
                  style={{ width: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%` }}
                ></div>
              </div>
              <span className="w-12 text-sm font-medium text-gray-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (type === 'line') {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-64 relative">
          <div className="absolute inset-0 flex items-end justify-between px-2">
            {data.map((item, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-8 text-xs text-gray-600 text-center">{item.label}</div>
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
              </div>
            ))}
          </div>
          {/* Simple line visualization */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              points={data.map((item, index) => `${(index * 100 / (data.length - 1))},${100 - (item.value / Math.max(...data.map(d => d.value))) * 80}`).join(' ')}
            />
          </svg>
        </div>
      </div>
    )
  }

  if (type === 'pie') {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="grid grid-cols-2 gap-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              ></div>
              <div>
                <div className="text-sm font-medium text-gray-900">{item.name}</div>
                <div className="text-xs text-gray-600">{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return null
}
