'use client'

import { TooltipProps } from 'recharts'

export function AnimatedTooltip({ active, payload, label }: TooltipProps<number, string>) {
  return (
    <div
      className={`transition-opacity duration-300 ${
        active ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {active && payload && (
        <div
          className="p-2 rounded-md border border-border bg-card text-card-foreground shadow-md"
          style={{ minWidth: '120px' }}
        >
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {payload.map((entry, i) => (
            <p key={`item-${i}`} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
