// 'use client'

// import { Card } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { X } from "lucide-react"
// import WidgetRenderer from "./WidgetRenderer"
// import { Widget } from "@/types/types"

// export default function WidgetCard({
//   widget,
//   onRemove,
// }: {
//   widget: Widget
//   onRemove: (id: string) => void
// }) {
//   return (
//     <Card className="h-full flex flex-col items-center">
//       <div className="w-full flex items-center justify-between px-4 py-2 border-b border-white/5 drag-handle">
//         <div className="text-sm font-medium capitalize">
//           {widget.payload?.title || `${widget.type} widget`}
//         </div>
//         <Button
//           variant="ghost"
//           size="icon"
//           onClick={() => onRemove(widget.id)}
//           className="h-6 w-6 no-drag"
//         >
//           <X className="w-4 h-4" />
//         </Button>
//       </div>

//       <div className="flex-1 w-full min-h-0">
//         <WidgetRenderer type={widget.type} payload={widget.payload} />
//       </div>
//     </Card>
//   )
// }


'use client'

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import WidgetRenderer from "./WidgetRenderer"
import { Widget } from "@/types/types"

export default function WidgetCard({
  widget,
  onRemove,
}: {
  widget: Widget
  onRemove: (id: string) => void
}) {
  return (
    <Card className="h-full w-full flex flex-col overflow-hidden shadow-md rounded-lg">
      {/* ✅ Drag handle */}
      <div className="w-full flex items-center justify-between px-3 py-2 border-b border-white/10 drag-handle cursor-move">
        <div className="text-xs sm:text-sm font-medium capitalize truncate">
          {widget.payload?.title || `${widget.type} widget`}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(widget.id)}
          className="h-6 w-6 no-drag"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* ✅ Content area adapts when resized */}
      <div className="flex-1 w-full min-h-0 p-2">
        <WidgetRenderer type={widget.type} payload={widget.payload} />
      </div>
    </Card>
  )
}
