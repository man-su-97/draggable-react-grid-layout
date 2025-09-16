// "use client";

// import { WidgetType, ChartData, MapData, WeatherTemp } from "@/types/types";
// import LineChartWidget from "../widgets/LineChartWidget";
// import BarChartWidget from "../widgets/BarChartWidget";
// import PieChartWidget from "../widgets/PieChartWidget";
// import ImageWidget from "../widgets/ImageWidget";
// import VideoWidget from "../widgets/VideoWidget";
// import MapWidget from "../widgets/MapWidget";
// import WeatherCard from "../widgets/WeatherCard";

// export default function WidgetRenderer({
//   type,
//   payload,
// }: {
//   type: WidgetType;
//   payload?: {
//     title?: string;
//     data?: ChartData[] | MapData[];
//     src?: string;
//     location?: string;
//     coordinates?: [number, number] | "current";
//     description?: string;
//     icon?: string;
//     temp?: WeatherTemp;
//   };
// }) {
//   switch (type) {
//     case "line":
//       return <LineChartWidget data={payload?.data as ChartData[]} title={payload?.title} />;
//     case "bar":
//       return <BarChartWidget data={payload?.data as ChartData[]} title={payload?.title} />;
//     case "pie":
//       return <PieChartWidget data={payload?.data as ChartData[]} title={payload?.title} />;
//     case "map":
//       return <MapWidget data={payload?.data as MapData[]} title={payload?.title ?? "World Map"} />;
//     case "image":
//       return <ImageWidget src={payload?.src ?? "https://picsum.photos/800/600"} title={payload?.title} />;
//     case "video":
//       return (
//         <VideoWidget
//           src={payload?.src ?? "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"}
//           title={payload?.title}
//         />
//       );
//     case "weather":
//       return (
//         <WeatherCard
//           location={payload?.location}
//           coordinates={payload?.coordinates}
//           description={payload?.description}
//           icon={payload?.icon}
//           temp={payload?.temp}
//         />
//       );
//     default:
//       return <div className="p-4 text-red-400">Unknown Widget</div>;
//   }
// }



"use client";

import { WidgetType, ChartData, MapData, WeatherTemp } from "@/types/types";
import LineChartWidget from "../widgets/LineChartWidget";
import BarChartWidget from "../widgets/BarChartWidget";
import PieChartWidget from "../widgets/PieChartWidget";
import ImageWidget from "../widgets/ImageWidget";
import VideoWidget from "../widgets/VideoWidget";
import MapWidget from "../widgets/MapWidget";
import WeatherCard from "../widgets/WeatherCard";

export default function WidgetRenderer({
  type,
  payload,
}: {
  type: WidgetType;
  payload?: {
    title?: string;
    data?: ChartData[] | MapData[];
    src?: string;
    location?: string;
    coordinates?: [number, number] | "current";
    description?: string;
    icon?: string;
    temp?: WeatherTemp;
  };
}) {
  switch (type) {
    case "line":
      return (
        <div className="w-full h-full">
          <LineChartWidget data={payload?.data as ChartData[]} title={payload?.title} />
        </div>
      );
    case "bar":
      return (
        <div className="w-full h-full">
          <BarChartWidget data={payload?.data as ChartData[]} title={payload?.title} />
        </div>
      );
    case "pie":
      return (
        <div className="w-full h-full">
          <PieChartWidget data={payload?.data as ChartData[]} title={payload?.title} />
        </div>
      );
    case "map":
      return (
        <div className="w-full h-full">
          <MapWidget data={payload?.data as MapData[]} title={payload?.title ?? "World Map"} />
        </div>
      );
    case "image":
      return (
        <div className="w-full h-full">
          <ImageWidget
            src={payload?.src ?? "https://picsum.photos/800/600"}
            title={payload?.title}
          />
        </div>
      );
    case "video":
      return (
        <div className="w-full h-full">
          <VideoWidget
            src={
              payload?.src ??
              "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
            }
            title={payload?.title}
          />
        </div>
      );
    case "weather":
      return (
        <div className="w-full h-full flex items-center justify-center">
          <WeatherCard
            location={payload?.location}
            coordinates={payload?.coordinates}
            description={payload?.description}
            icon={payload?.icon}
            temp={payload?.temp}
          />
        </div>
      );
    default:
      return <div className="p-4 text-red-400">Unknown Widget</div>;
  }
}
