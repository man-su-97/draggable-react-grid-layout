"use client";

import { Widget } from "@/types/types";
import LineChartWidget from "../widgets/LineChartWidget";
import BarChartWidget from "../widgets/BarChartWidget";
import PieChartWidget from "../widgets/PieChartWidget";
import ImageWidget from "../widgets/ImageWidget";
import VideoWidget from "../widgets/VideoWidget";
import MapWidget from "../widgets/MapWidget";
import WeatherWidget from "../widgets/WeatherWidget";
import DocumentWidget from "../widgets/DocumentWidget";

export default function WidgetRenderer({ widget }: { widget: Widget }) {
  // 🔹 Compare mode: only valid for charts
  if (
    (widget.type === "line" ||
      widget.type === "bar" ||
      widget.type === "pie") &&
    widget.payload?.compare &&
    widget.payload?.compareData
  ) {
    return (
      <div className="w-full h-full grid grid-cols-2 gap-4">
        {widget.payload.compareData.map((entry, i) => (
          <div
            key={i}
            className="border rounded-lg p-2 shadow bg-background flex flex-col"
          >
            <h3 className="text-sm font-semibold mb-2 text-center text-muted-foreground">
              {entry.source === "document" ? "📂 Document Data" : "🌐 Gemini Data"}
            </h3>
            {renderSingleWidget(widget.type, {
              ...widget.payload,
              data: entry.data,
            })}
          </div>
        ))}
      </div>
    );
  }

  // 🔹 Normal single widget
  return (
    <div className="w-full h-full">
      {renderSingleWidget(widget.type, widget.payload)}
    </div>
  );
}

// 🔹 Helper: render one widget based on its type + payload
function renderSingleWidget(type: Widget["type"], payload: any) {
  switch (type) {
    case "line":
      return (
        <LineChartWidget
          data={payload?.data ?? []}
          title={payload?.title ?? "Line Chart"}
        />
      );
    case "bar":
      return (
        <BarChartWidget
          data={payload?.data ?? []}
          title={payload?.title ?? "Bar Chart"}
        />
      );
    case "pie":
      return (
        <PieChartWidget
          data={payload?.data ?? []}
          title={payload?.title ?? "Pie Chart"}
        />
      );
    case "map":
      return (
        <MapWidget
          data={payload?.data ?? []}
          title={payload?.title ?? "Map Widget"}
        />
      );
    case "image":
      return (
        <ImageWidget
          src={payload?.src ?? "https://picsum.photos/800/600"}
          title={payload?.title ?? "Image Widget"}
        />
      );
    case "video":
      return (
        <VideoWidget
          src={
            payload?.src ??
            "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
          }
          title={payload?.title ?? "Video Widget"}
        />
      );
    case "weather":
      return (
        <WeatherWidget
          location={payload?.location}
          coordinates={payload?.coordinates}
          description={payload?.description}
          icon={payload?.icon}
          temp={payload?.temp}
        />
      );
    case "document":
      return (
        <DocumentWidget
          filename={payload?.filename ?? "Unknown"}
          fields={payload?.fields}
          rowCount={payload?.rowCount}
          preview={payload?.preview}
          summary={payload?.summary}
        />
      );
    default:
      return <div className="p-4 text-red-400">Unknown Widget</div>;
  }
}
