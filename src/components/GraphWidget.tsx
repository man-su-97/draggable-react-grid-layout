import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const sample = Array.from({ length: 12 }).map((_, i) => ({ name: `T${i+1}`, value: Math.round(Math.random() * 5000) }))

export default function GraphWidget(){
  return (
    <div className="w-full h-full p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sample} margin={{ top: 10, right: 10, left: 6, bottom: 6 }}>
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#7dd3b6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}