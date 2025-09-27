'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
} from 'recharts'

type LineChartWidgetProps = {
  data?: Array<Record<string, number | string>>
  title?: string
}

export default function LineChartWidget({ data, title }: LineChartWidgetProps) {
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
  const colors = [
    'var(--color-chart-1)',
    'var(--color-chart-2)',
    'var(--color-chart-3)',
    'var(--color-chart-4)',
    'var(--color-chart-5)',
  ]

  const dataKeys = Object.keys(chartData[0] || {}).filter((k) => k !== 'label')

  return (
    <div className="w-full h-full flex flex-col bg-card border border-border rounded-md p-2">
      {title && <h3 className="text-lg font-semibold mb-2 text-card-foreground">{title}</h3>}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-muted)" />
          <XAxis dataKey="label" stroke="var(--color-muted-foreground)" />
          <YAxis stroke="var(--color-muted-foreground)" />
          <Legend />
          {dataKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{
                r: 3,
                stroke: 'var(--color-background)',
                strokeWidth: 1,
                fill: colors[index % colors.length],
              }}
              activeDot={{
                r: 7,
                fill: 'var(--color-primary)',
                stroke: 'white',
                strokeWidth: 2,
                style: { filter: 'drop-shadow(0 0 6px var(--color-primary))' },
              }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
