"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import WidgetRenderer from "./WidgetRenderer";
import { Widget } from "@/types/types";

export default function WidgetCard({
  widget,
  onRemove,
}: {
  widget: Widget;
  onRemove: (id: string) => void;
}) {
  // ✅ Optional min width enforcement for specific widget types
  const minWidthClass =
    widget.type === "weather"
      ? "min-w-[368px]" // enforce min width for WeatherCard
      : "min-w-[250px]";

  return (
    <Card
      className={`h-full w-full flex flex-col overflow-hidden rounded-lg shadow-md bg-card border border-border text-card-foreground ${minWidthClass}`}
    >
      {/* Header */}
      <div className="w-full flex items-center justify-between px-3 py-2 border-b border-border drag-handle cursor-move bg-muted/40">
        <div className="text-xs sm:text-sm font-medium capitalize truncate text-muted-foreground">
          {widget.payload?.title || `${widget.type} widget`}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(widget.id)}
          className="h-6 w-6 no-drag text-muted-foreground hover:text-destructive"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 w-full min-h-0 p-2">
        <WidgetRenderer type={widget.type} payload={widget.payload} />
      </div>
    </Card>
  );
}
