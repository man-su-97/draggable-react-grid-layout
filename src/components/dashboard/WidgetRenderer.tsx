// "use client";

// import { WidgetType } from "@/types/types";
// import LineChartWidget from "../widgets/LineChartWidget";
// import BarChartWidget from "../widgets/BarChartWidget";
// import PieChartWidget from "../widgets/PieChartWidget";
// import ImageWidget from "../widgets/ImageWidget";
// import VideoWidget from "../widgets/VideoWidget";
// import MapWidget from "../widgets/MapWidget";

// export default function WidgetRenderer({
// 	type,
// 	payload,
// }: {
// 	type: WidgetType;
// 	payload?: {
// 		title?: string;
// 		data?: Array<{ label: string; value: number }>;
// 		src?: string;
// 	};
// }) {
// 	switch (type) {
// 		case "line":
// 			return <LineChartWidget data={payload?.data} title={payload?.title} />;
// 		case "bar":
// 			return <BarChartWidget data={payload?.data} title={payload?.title} />;
// 		case "pie":
// 			return <PieChartWidget data={payload?.data} title={payload?.title} />;
// 			case "map":
// 			return <MapWidget data={payload?.data} title={payload?.title} />;
// 		case "image":
// 			return (
// 				<ImageWidget
// 					src={payload?.src ?? "/images/demo-img.png"}
// 					title={payload?.title}
// 				/>
// 			);
// 		case "video":
// 			return (
// 				<VideoWidget
// 					src={payload?.src ?? "/videos/demo.mp4"}
// 					title={payload?.title}
// 				/>
// 			);

// 		default:
// 			return <div className="p-4 text-red-400">Unknown Widget</div>;
// 	}
// }

"use client";

import { WidgetType } from "@/types/types";
import LineChartWidget from "../widgets/LineChartWidget";
import BarChartWidget from "../widgets/BarChartWidget";
import PieChartWidget from "../widgets/PieChartWidget";
import ImageWidget from "../widgets/ImageWidget";
import VideoWidget from "../widgets/VideoWidget";
import MapWidget from "../widgets/MapWidget";

type ChartData = { label: string; value: number };
type MapData = { name: string; coordinates: [number, number]; color?: string };

export default function WidgetRenderer({
  type,
  payload,
}: {
  type: WidgetType;
  payload?: {
    title?: string;
    data?: ChartData[] | MapData[]; // ✅ supports both
    src?: string;
  };
}) {
  switch (type) {
    case "line":
      return (
        <LineChartWidget
          data={payload?.data as ChartData[]}
          title={payload?.title}
        />
      );
    case "bar":
      return (
        <BarChartWidget
          data={payload?.data as ChartData[]}
          title={payload?.title}
        />
      );
    case "pie":
      return (
        <PieChartWidget
          data={payload?.data as ChartData[]}
          title={payload?.title}
        />
      );
    case "map":
      return (
        <MapWidget
          data={payload?.data as MapData[]}
          title={payload?.title ?? "World Map"}
        />
      );
    case "image":
      return (
        <ImageWidget
          src={payload?.src ?? "https://picsum.photos/800/600"}
          title={payload?.title}
        />
      );
    case "video":
      return (
        <VideoWidget
          src={
            payload?.src ??
            "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
          }
          title={payload?.title}
        />
      );
    default:
      return <div className="p-4 text-red-400">Unknown Widget</div>;
  }
}
