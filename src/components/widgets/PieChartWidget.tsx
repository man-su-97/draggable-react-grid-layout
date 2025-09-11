'use client'

import { PieChart, Pie, Tooltip } from 'recharts'

const data = [
  { name: 'Group A', value: 400 },
  { name: 'Group B', value: 300 },
  { name: 'Group C', value: 300 },
]

export default function PieChartWidget() {
  return (
    <PieChart width={300} height={200}>
      <Pie data={data} dataKey="value" nameKey="name" outerRadius={80} fill="#8884d8" />
      <Tooltip />
    </PieChart>
  )
}
