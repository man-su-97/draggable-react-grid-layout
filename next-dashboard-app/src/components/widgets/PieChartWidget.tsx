'use client'

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Sector,
  SectorProps,
} from 'recharts'
import { PieSectorDataItem } from 'recharts/types/polar/Pie';

type PieChartWidgetProps = {
  data?: Array<{ label: string; value: number }>
  title?: string
}

type ActiveShapeProps = PieSectorDataItem & SectorProps

const COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
]

const HIGHLIGHT_COLOR = 'var(--color-card-foreground)' 

export default function PieChartWidget({ data, title }: PieChartWidgetProps) {
  const demoData = [
    { label: 'Apples', value: 400 },
    { label: 'Bananas', value: 300 },
    { label: 'Cherries', value: 200 },
    { label: 'Dates', value: 100 },
  ]

  const chartData = data ?? demoData

  return (
    <div className="w-full h-full flex flex-col bg-card border border-border rounded-md p-2">
      {title && <h3 className="text-lg font-semibold mb-2 text-card-foreground">{title}</h3>}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius="40%"
            outerRadius="70%"
            paddingAngle={3}
            label
            activeShape={(props:ActiveShapeProps) => (
              <g>
                <text
                  x={props.cx}
                  y={props.cy}
                  dy={-10}
                  textAnchor="middle"
                  fill="var(--color-primary)"
                >
                  {props.name}
                </text>
                <Sector
                  {...props}
                  outerRadius={props.outerRadius + 8}
                  fill={HIGHLIGHT_COLOR} 
                />
              </g>
            )}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
