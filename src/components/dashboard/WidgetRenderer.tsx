'use client'

import { WidgetType } from '@/types/types'
import LineChartWidget from '../widgets/LineChartWidget'
import BarChartWidget from '../widgets/BarChartWidget'
import PieChartWidget from '../widgets/PieChartWidget'
import ImageWidget from '../widgets/ImageWidget'
import VideoWidget from '../widgets/VideoWidget'

export default function WidgetRenderer({
  type,
  payload,
}: {
  type: WidgetType
  payload?: {
    title?: string
    data?: Array<{ label: string; value: number }>
    src?: string
  }
}) {
  switch (type) {
    case 'line':
      return <LineChartWidget data={payload?.data} title={payload?.title} />
    case 'bar':
      return <BarChartWidget data={payload?.data} title={payload?.title} />
    case 'pie':
      return <PieChartWidget data={payload?.data} title={payload?.title} />
    case 'image':
      return <ImageWidget src={payload?.src ?? '/images/demo.jpg'} />
    case 'video':
      return <VideoWidget src={payload?.src ?? '/videos/demo.mp4'} />
    default:
      return <div className="p-4 text-red-400">Unknown Widget</div>
  }
}
