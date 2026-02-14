'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface AdminChartsProps {
  data: any[]
  title: string
  dataKey: string
  fill?: string
  height?: number
}

export default function AdminCharts({ data, title, dataKey, fill = '#3b82f6', height = 300 }: AdminChartsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey={dataKey} fill={fill} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
