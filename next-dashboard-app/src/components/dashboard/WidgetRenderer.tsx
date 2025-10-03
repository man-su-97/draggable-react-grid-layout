// "use client";

// import { Widget } from "@/types/types";
// import LineChartWidget from "../widgets/LineChartWidget";
// import BarChartWidget from "../widgets/BarChartWidget";
// import PieChartWidget from "../widgets/PieChartWidget";
// import ImageWidget from "../widgets/ImageWidget";
// import VideoWidget from "../widgets/VideoWidget";
// import MapWidget from "../widgets/MapWidget";
// import WeatherWidget from "../widgets/WeatherWidget";
// import DocumentWidget from "../widgets/DocumentWidget";
// import StreamWidget from "../widgets/StreamWidget";

// export default function WidgetRenderer({ widget }: { widget: Widget }) {
// 	if (
// 		(widget.type === "line" ||
// 			widget.type === "bar" ||
// 			widget.type === "pie") &&
// 		"compare" in widget.payload &&
// 		widget.payload.compare &&
// 		widget.payload.compareData
// 	) {
// 		return (
// 			<div className="w-full h-full grid grid-cols-2 gap-4">
// 				{widget.payload.compareData.map((entry, i) => (
// 					<div
// 						key={i}
// 						className="border rounded-lg p-2 shadow bg-background flex flex-col"
// 					>
// 						<h3 className="text-sm font-semibold mb-2 text-center text-muted-foreground">
// 							{entry.source === "document"
// 								? "📂 Document Data"
// 								: "🌐 Gemini Data"}
// 						</h3>
// 						{renderSingleWidget({
// 							...widget,
// 							payload: {
// 								...widget.payload,
// 								data: entry.data,
// 							},
// 						})}
// 					</div>
// 				))}
// 			</div>
// 		);
// 	}

// 	return <div className="w-full h-full">{renderSingleWidget(widget)}</div>;
// }

// function renderSingleWidget(widget: Widget) {
// 	switch (widget.type) {
// 		case "line":
// 			return (
// 				<LineChartWidget
// 					data={widget.payload.data}
// 					title={widget.payload.title}
// 				/>
// 			);

// 		case "bar":
// 			return (
// 				<BarChartWidget
// 					data={widget.payload.data}
// 					title={widget.payload.title}
// 				/>
// 			);

// 		case "pie":
// 			return (
// 				<PieChartWidget
// 					data={widget.payload.data}
// 					title={widget.payload.title}
// 				/>
// 			);

// 		case "map":
// 			return (
// 				<MapWidget data={widget.payload.data} title={widget.payload.title} />
// 			);

// 		case "image":
// 			return (
// 				<ImageWidget src={widget.payload.src} title={widget.payload.title} />
// 			);

// 		case "video":
// 			return (
// 				<VideoWidget src={widget.payload.src} title={widget.payload.title} />
// 			);

// 		case "weather":
// 			return (
// 				<WeatherWidget
// 					location={widget.payload.location}
// 					coordinates={widget.payload.coordinates}
// 					description={widget.payload.description}
// 					icon={widget.payload.icon}
// 					temp={widget.payload.temp}
// 				/>
// 			);

// 		case "document":
// 			return (
// 				<DocumentWidget
// 					filename={widget.payload.filename}
// 					fields={widget.payload.fields}
// 					rowCount={widget.payload.rowCount}
// 					preview={widget.payload.preview}
// 					summary={widget.payload.summary}
// 				/>
// 			);

// 		case "camera":
// 			return (
// 				<StreamWidget initialPath={widget.payload.streamUrl} />
// 			);

// 		case "chat":
// 			return (
// 				<ChatWidget  />
// 			);

// 		case "error":
// 			return (
// 				<div className="p-4 text-red-500 bg-red-100 rounded">
// 					{widget.payload.message}
// 				</div>
// 			);


// 		default:
// 			const _exhaustive: never = widget;
// 			void _exhaustive;
// 			return <div className="p-4 text-red-400">Unknown Widget</div>;
// 	}
// }


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
import StreamWidget from "../widgets/StreamWidget";
import ChatWidget from "./ChatWidget";

export default function WidgetRenderer({ widget }: { widget: Widget }) {
  // Handle compare charts (line, bar, pie)
  if (
    (widget.type === "line" ||
      widget.type === "bar" ||
      widget.type === "pie") &&
    widget.payload.compareData &&
    widget.payload.compareData.length > 0
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
            {renderSingleWidget({
              ...widget,
              payload: {
                ...widget.payload,
                data: entry.data,
              },
            })}
          </div>
        ))}
      </div>
    );
  }

  return <div className="w-full h-full">{renderSingleWidget(widget)}</div>;
}

function renderSingleWidget(widget: Widget) {
  switch (widget.type) {
    case "line":
      return (
        <LineChartWidget
          data={widget.payload.data}
          title={widget.payload.title}
        />
      );

    case "bar":
      return (
        <BarChartWidget
          data={widget.payload.data}
          title={widget.payload.title}
        />
      );

    case "pie":
      return (
        <PieChartWidget
          data={widget.payload.data}
          title={widget.payload.title}
        />
      );

    case "map":
      return (
        <MapWidget data={widget.payload.data} title={widget.payload.title} />
      );

    case "image":
      return (
        <ImageWidget src={widget.payload.src} title={widget.payload.title} />
      );

    case "video":
      return (
        <VideoWidget src={widget.payload.src} title={widget.payload.title} />
      );

    case "weather":
      return (
        <WeatherWidget
          location={widget.payload.location}
          coordinates={widget.payload.coordinates}
          description={widget.payload.description}
          icon={widget.payload.icon}
          temp={widget.payload.temp}
        />
      );

    case "document":
      return (
        <DocumentWidget
          filename={widget.payload.filename}
          fields={widget.payload.fields}
          rowCount={widget.payload.rowCount}
          preview={widget.payload.preview}
          summary={widget.payload.summary}
        />
      );

    case "camera":
      return <StreamWidget initialPath={widget.payload.streamUrl} />;

    case "chat":
      return <ChatWidget reply={widget.payload.reply} />;

    case "error":
      return (
        <div className="p-4 text-red-500 bg-red-100 rounded">
          {widget.payload.message}
        </div>
      );

    default: {
      const _exhaustive: never = widget;
      void _exhaustive;
      return <div className="p-4 text-red-400">Unknown Widget</div>;
    }
  }
}
