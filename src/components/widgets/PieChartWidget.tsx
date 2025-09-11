'use client'

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts'

type PieChartWidgetProps = {
  data?: Array<{ label: string; value: number }>
  title?: string
}

const COLORS = ['#7dd3b6', '#38bdf8', '#fbbf24', '#f87171']

export default function PieChartWidget({ data, title }: PieChartWidgetProps) {
  // Demo fallback dataset
  const demoData = [
    { label: 'Apples', value: 400 },
    { label: 'Bananas', value: 300 },
    { label: 'Cherries', value: 200 },
  ]

  const chartData = data ?? demoData

  return (
    <div className="w-full h-full flex flex-col">
      {title && <h3 className="text-sm font-medium mb-2 px-2">{title}</h3>}

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            outerRadius="70%"
            label
          >
            {chartData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
