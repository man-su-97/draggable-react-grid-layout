'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'

type LineChartWidgetProps = {
  data?: Array<{ label: string; value: number }>
  title?: string
}

export default function LineChartWidget({ data, title }: LineChartWidgetProps) {
  // Fallback demo dataset
  const demoData = [
    { label: 'Jan', value: 400 },
    { label: 'Feb', value: 300 },
    { label: 'Mar', value: 200 },
    { label: 'Apr', value: 278 },
    { label: 'May', value: 189 },
    { label: 'Jun', value: 239 },
    { label: 'Jul', value: 349 },
  ]

  const chartData = data ?? demoData

  return (
    <div className="w-full h-full flex flex-col">
      {/* Title if available */}
      {title && <h3 className="text-sm font-medium mb-2 px-2">{title}</h3>}

      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#7dd3b6"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
