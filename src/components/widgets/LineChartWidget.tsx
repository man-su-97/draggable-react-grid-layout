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
  data?: Array<Record<string, number | string>>
  title?: string
}

export default function LineChartWidget({ data, title }: LineChartWidgetProps) {
  // Example multi-series demo data
  const demoData = [
    { label: 'Jan', sales: 400, revenue: 240 },
    { label: 'Feb', sales: 300, revenue: 139 },
    { label: 'Mar', sales: 200, revenue: 980 },
    { label: 'Apr', sales: 278, revenue: 390 },
    { label: 'May', sales: 189, revenue: 480 },
    { label: 'Jun', sales: 239, revenue: 650 },
    { label: 'Jul', sales: 349, revenue: 700 },
  ]

  const chartData = data ?? demoData

  // 🎨 Assign a palette of colors
  const colors = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa']

  // Dynamically pick all numeric keys except "label"
  const dataKeys = Object.keys(chartData[0] || {}).filter((k) => k !== 'label')

  return (
    <div className="w-full h-full flex flex-col">
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}

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
          {dataKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
