'use client'

import { WidgetType } from '@/types/types'
import LineChartWidget from '../widgets/LineChartWidget'
import BarChartWidget from '../widgets/BarChartWidget'
import PieChartWidget from '../widgets/PieChartWidget'
import ImageWidget from '../widgets/ImageWidget'
import VideoWidget from '../widgets/VideoWidget'

export default function WidgetRenderer({ type }: { type: WidgetType }) {
  switch (type) {
    case 'line': return <LineChartWidget />
    case 'bar': return <BarChartWidget />
    case 'pie': return <PieChartWidget />
    case 'image': return <ImageWidget />
    case 'video': return <VideoWidget />
    default: return <div className="p-4 text-red-400">Unknown Widget</div>
  }
}
