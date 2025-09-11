'use client'

import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'

const data = [
  { name: 'A', uv: 400, pv: 2400 },
  { name: 'B', uv: 300, pv: 1398 },
  { name: 'C', uv: 200, pv: 9800 },
  { name: 'D', uv: 278, pv: 3908 },
]

export default function LineChartWidget() {
  return (
    <LineChart width={300} height={200} data={data}>
      <Line type="monotone" dataKey="uv" stroke="#8884d8" />
      <CartesianGrid stroke="#ccc" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
    </LineChart>
  )
}
