'use client'

import React, { useEffect, useState } from 'react'
import GridLayout, { Layout } from 'react-grid-layout'
import { Button } from '@/components/ui/button'
import WidgetCard from './WidgetCard'
import { Widget, WidgetType } from '@/types/types'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const STORAGE_KEY = 'dashboard-widgets'

export default function Dashboard() {
  const [widgets, setWidgets] = useState<Widget[]>([])

  // Load from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        setWidgets(JSON.parse(raw))
      } catch {
        setWidgets([])
      }
    } else {
      setWidgets([
        { id: '1', type: 'line', layout: { i: '1', x: 0, y: 0, w: 4, h: 4, minW: 2, minH: 2 } },
        { id: '2', type: 'bar', layout: { i: '2', x: 4, y: 0, w: 4, h: 4, minW: 2, minH: 2 } },
      ])
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets))
    }
  }, [widgets])

  const addWidget = (type: WidgetType) => {
    const id = Date.now().toString()
    const newWidget: Widget = {
      id,
      type,
      layout: {
        i: id,
        x: (widgets.length),
        y: Infinity,
        w: 4,
        h: 4,
        minW: 2,
        minH: 2,
      },
    }
    setWidgets((prev) => [...prev, newWidget])
  }

  const removeWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id))
  }

  const updateLayout = (layout: Layout[]) => {
    setWidgets((prev) =>
      prev.map((w) => {
        const updated = layout.find((l) => l.i === w.id)
        return updated ? { ...w, layout: { ...w.layout, ...updated } } : w
      })
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold">My Dashboard</h2>
        <div className="ml-auto flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-white/5">+ Add Widget</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => addWidget('line')}>Line Chart</DropdownMenuItem>
              <DropdownMenuItem onClick={() => addWidget('bar')}>Bar Chart</DropdownMenuItem>
              <DropdownMenuItem onClick={() => addWidget('pie')}>Pie Chart</DropdownMenuItem>
              <DropdownMenuItem onClick={() => addWidget('image')}>Image</DropdownMenuItem>
              <DropdownMenuItem onClick={() => addWidget('video')}>Video</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Grid */}
      <GridLayout
        className="layout"
        layout={widgets.map((w) => w.layout)}
        cols={12}
        rowHeight={100}
        width={1200}
        onLayoutChange={updateLayout}
        draggableHandle=".drag-handle"
      >
        {widgets.map((w) => (
          <div key={w.id} data-grid={w.layout}>
            <WidgetCard widget={w} onRemove={removeWidget} />
          </div>
        ))}
      </GridLayout>
    </div>
  )
}
