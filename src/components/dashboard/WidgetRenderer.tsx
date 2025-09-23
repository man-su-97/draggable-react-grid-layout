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
	// 🔹 Compare mode: only valid for chart widgets
	if (
		(widget.type === "line" ||
			widget.type === "bar" ||
			widget.type === "pie") &&
		widget.payload.compare &&
		widget.payload.compareData
	) {
		return (
			<div className="w-full h-full grid grid-cols-2 gap-4">
				{widget.payload.compareData.map((entry, i) => (
					<div
						key={i}
						className="border rounded-lg p-2 shadow bg-background flex flex-col"
					>
						<h3 className="text-sm font-semibold mb-2 text-center text-muted-foreground">
							{entry.source === "document"
								? "📂 Document Data"
								: "🌐 Gemini Data"}
						</h3>
						{renderSingleWidget({
							...widget,
							payload: {
								...widget.payload,
								data: entry.data, // override data for this view
							},
						})}
					</div>
				))}
			</div>
		);
	}

	// 🔹 Normal single widget
	return <div className="w-full h-full">{renderSingleWidget(widget)}</div>;
}

// 🔹 Helper: render one widget by type
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

		default:
			// Exhaustive check: will error if a new widget type is added and not handled
			const _exhaustive: never = widget;
			return <div className="p-4 text-red-400">Unknown Widget</div>;
	}
}

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

// export default function WidgetRenderer({ widget }: { widget: Widget }) {
// 	// Compare mode: only valid for charts

//   if (
//     (widget.type === "line" || widget.type === "bar" || widget.type === "pie") &&
//     widget.payload.compare &&
//     widget.payload.compareData
//   ) {
//     return (
//       <div className="w-full h-full grid grid-cols-2 gap-4">
//         {widget.payload.compareData.map((entry, i) => (
//           <div
//             key={i}
//             className="border rounded-lg p-2 shadow bg-background flex flex-col"
//           >
//             <h3 className="text-sm font-semibold mb-2 text-center text-muted-foreground">
//               {entry.source === "document" ? "📂 Document Data" : "🌐 Gemini Data"}
//             </h3>
//             {renderSingleWidget({
//               ...widget,
//               payload: {
//                 ...widget.payload,
//                 data: entry.data, // swap data
//               },
//             })}
//           </div>
//         ))}
//       </div>
//     );
//   }

//   // Normal single widget
//   return <div className="w-full h-full">{renderSingleWidget(widget)}</div>;
// }

// 	// // 🔹 Helper: render one widget based on its type + payload
// 	// function renderSingleWidget(widget: Widget) {
// 	// 	switch (widget.type) {
// 	// 		case "line":
// 	// 			return (
// 	// 				<LineChartWidget
// 	// 					data={widget.payload?.data ?? []}
// 	// 					title={widget.payload?.title ?? "Line Chart"}
// 	// 				/>
// 	// 			);
// 	// 		case "bar":
// 	// 			return (
// 	// 				<BarChartWidget
// 	// 					data={widget.payload?.data ?? []}
// 	// 					title={widget.payload?.title ?? "Bar Chart"}
// 	// 				/>
// 	// 			);
// 	// 		case "pie":
// 	// 			return (
// 	// 				<PieChartWidget
// 	// 					data={widget.payload?.data ?? []}
// 	// 					title={widget.payload?.title ?? "Pie Chart"}
// 	// 				/>
// 	// 			);
// 	// 		case "map":
// 	// 			return (
// 	// 				<MapWidget
// 	// 					data={widget.payload?.data ?? []}
// 	// 					title={widget.payload?.title ?? "Map Widget"}
// 	// 				/>
// 	// 			);
// 	// 		case "image":
// 	// 			return (
// 	// 				<ImageWidget
// 	// 					src={widget.payload?.src ?? "https://picsum.photos/800/600"}
// 	// 					title={widget.payload?.title ?? "Image Widget"}
// 	// 				/>
// 	// 			);
// 	// 		case "video":
// 	// 			return (
// 	// 				<VideoWidget
// 	// 					src={
// 	// 						widget.payload?.src ??
// 	// 						"https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
// 	// 					}
// 	// 					title={widget.payload?.title ?? "Video Widget"}
// 	// 				/>
// 	// 			);
// 	// 		case "weather":
// 	// 			return (
// 	// 				<WeatherWidget
// 	// 					location={widget.payload?.location}
// 	// 					coordinates={widget.payload?.coordinates}
// 	// 					description={widget.payload?.description}
// 	// 					icon={widget.payload?.icon}
// 	// 					temp={widget.payload?.temp}
// 	// 				/>
// 	// 			);
// 	// 		case "document":
// 	// 			return (
// 	// 				<DocumentWidget
// 	// 					filename={widget.payload?.filename ?? "Unknown"}
// 	// 					fields={widget.payload?.fields}
// 	// 					rowCount={widget.payload?.rowCount}
// 	// 					preview={widget.payload?.preview}
// 	// 					summary={widget.payload?.summary}
// 	// 				/>
// 	// 			);
// 	// 		default:
// 	// 			return <div className="p-4 text-red-400">Unknown Widget</div>;
// 	// 	}
// 	// }

// 	function renderSingleWidget(widget: Widget) {
// 		switch (widget.type) {
// 			case "line":
// 				return (
// 					<LineChartWidget
// 						data={widget.payload.data}
// 						title={widget.payload.title}
// 					/>
// 				);

// 			case "bar":
// 				return (
// 					<BarChartWidget
// 						data={widget.payload.data}
// 						title={widget.payload.title}
// 					/>
// 				);

// 			case "pie":
// 				return (
// 					<PieChartWidget
// 						data={widget.payload.data}
// 						title={widget.payload.title}
// 					/>
// 				);

// 			case "map":
// 				return (
// 					<MapWidget
// 						data={widget.payload.data}
// 						title={widget.payload.title ?? "Map Widget"}
// 					/>
// 				);

// 			case "image":
// 				return (
// 					<ImageWidget src={widget.payload.src} title={widget.payload.title} />
// 				);

// 			case "video":
// 				return (
// 					<VideoWidget src={widget.payload.src} title={widget.payload.title} />
// 				);

// 			case "weather":
// 				return (
// 					<WeatherWidget
// 						location={widget.payload.location}
// 						coordinates={widget.payload.coordinates}
// 						description={widget.payload.description}
// 						icon={widget.payload.icon}
// 						temp={widget.payload.temp}
// 					/>
// 				);

// 			case "document":
// 				return (
// 					<DocumentWidget
// 						filename={widget.payload.filename}
// 						fields={widget.payload.fields}
// 						rowCount={widget.payload.rowCount}
// 						preview={widget.payload.preview}
// 						summary={widget.payload.summary}
// 					/>
// 				);

// 			default:
// 				// This should be unreachable if Widget union is exhaustive
// 				return <div className="p-4 text-red-400">Unknown Widget</div>;
// 		}
// 	}
