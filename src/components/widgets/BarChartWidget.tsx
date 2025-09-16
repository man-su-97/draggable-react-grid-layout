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
  Cell,
} from 'recharts'
import { AnimatedTooltip } from '../ui/AnimatedToolTip';

type BarChartWidgetProps = {
  data?: Array<{ label: string; value: number }>
  title?: string
}

export default function BarChartWidget({ data, title }: BarChartWidgetProps) {
  const demoData = [
    { label: 'Jan', value: 400 },
    { label: 'Feb', value: 300 },
    { label: 'Mar', value: 500 },
    { label: 'Apr', value: 200 },
  ]

  const chartData = data ?? demoData
  const colors = [
    'var(--color-chart-1)',
    'var(--color-chart-2)',
    'var(--color-chart-3)',
    'var(--color-chart-4)',
    'var(--color-chart-5)',
  ]

  return (
    <div className="w-full h-full flex flex-col bg-card border border-border rounded-md p-2">
      {title && <h3 className="text-lg font-semibold mb-2 text-card-foreground">{title}</h3>}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-muted)" />
          <XAxis dataKey="label" stroke="var(--color-muted-foreground)" />
          <YAxis stroke="var(--color-muted-foreground)" />
          <Tooltip content={<AnimatedTooltip />} />
          <Legend />
          <Bar dataKey="value">
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
                className="transition-all duration-300 hover:opacity-80 hover:stroke-[var(--color-primary)] hover:stroke-2"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
