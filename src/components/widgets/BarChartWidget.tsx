'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

type BarChartWidgetProps = {
  data?: Array<{ label: string; value: number }>
  title?: string
}

export default function BarChartWidget({ data, title }: BarChartWidgetProps) {
  // Demo fallback dataset
  const demoData = [
    { label: 'Jan', value: 400 },
    { label: 'Feb', value: 300 },
    { label: 'Mar', value: 500 },
    { label: 'Apr', value: 200 },
  ]

  const chartData = data ?? demoData

  return (
    <div className="w-full h-full flex flex-col">
      {title && <h3 className="text-sm font-medium mb-2 px-2">{title}</h3>}

      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#38bdf8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
