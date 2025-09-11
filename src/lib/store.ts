'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Layout } from 'react-grid-layout'
import type { Widget, WidgetType } from '@/types/types'

type DashboardStore = {
  widgets: Widget[]
  addWidget: (type: WidgetType) => void
  removeWidget: (id: string) => void
  updateLayout: (layout: Layout[]) => void
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      widgets: [
        {
          id: '1',
          type: 'line',
          layout: { i: '1', x: 0, y: 0, w: 4, h: 4 },
        },
        {
          id: '2',
          type: 'bar',
          layout: { i: '2', x: 4, y: 0, w: 4, h: 4 },
        },
      ],

      addWidget: (type) => {
        const id = Date.now().toString()
        const widgets = get().widgets
        set({
          widgets: [
            ...widgets,
            {
              id,
              type,
              layout: {
                i: id,
                x: (widgets.length * 2) % 12,
                y: Infinity,
                w: 4,
                h: 4,
              },
            },
          ],
        })
      },

      removeWidget: (id) => {
        set({ widgets: get().widgets.filter((w) => w.id !== id) })
      },

      updateLayout: (layout: Layout[]) => {
        set({
          widgets: get().widgets.map((w) => {
            const updated = layout.find((l) => l.i === w.id)
            return updated
              ? { ...w, layout: { ...w.layout, ...updated } }
              : w
          }),
        })
      },
    }),
    {
      name: 'dashboard-storage',
      // ✅ only enable persistence in browser
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
)
