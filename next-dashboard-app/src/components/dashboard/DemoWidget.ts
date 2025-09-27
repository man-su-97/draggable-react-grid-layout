import { Widget } from "@/types/types";
import { nextLayout } from "@/lib/layoutUtils";

export function buildDemoWidget(type: Widget["type"], widgets: Widget[]): Widget {
  const id = crypto.randomUUID();
  const layout = nextLayout(widgets);

  switch (type) {
    case "line":
      return {
        id,
        type,
        layout,
        payload: {
          title: "Line Chart",
          data: [
            { label: "Jan", value: 100 },
            { label: "Feb", value: 200 },
            { label: "Mar", value: 300 },
          ],
          source: "gemini",
        },
      };

    case "bar":
      return {
        id,
        type,
        layout,
        payload: {
          title: "Bar Chart",
          data: [
            { label: "Q1", value: 500 },
            { label: "Q2", value: 300 },
            { label: "Q3", value: 400 },
          ],
          source: "gemini",
        },
      };

    case "pie":
      return {
        id,
        type,
        layout,
        payload: {
          title: "Pie Chart",
          data: [
            { label: "X", value: 40 },
            { label: "Y", value: 30 },
            { label: "Z", value: 30 },
          ],
          source: "gemini",
        },
      };

    case "map":
      return {
        id,
        type,
        layout,
        payload: {
          title: "Map Widget",
          data: [
            { name: "New York", coordinates: [40.7128, -74.006], color: "red" },
            { name: "London", coordinates: [51.5074, -0.1278], color: "blue" },
          ],
        },
      };

    case "image":
      return {
        id,
        type,
        layout,
        payload: {
          src: "https://picsum.photos/800/600",
          title: "Sample Image",
        },
      };

    case "video":
      return {
        id,
        type,
        layout,
        payload: {
          src: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
          title: "Sample Video",
        },
      };

    case "weather":
      return {
        id,
        type,
        layout,
        payload: {
          location: "New Delhi",
          coordinates: "current",
        },
      };

    case "document":
      return {
        id,
        type,
        layout,
        payload: {
          filename: "Unknown",
        },
      };

    case "camera":
      return {
        id,
        type,
        layout,
        payload: {
          streamUrl: "mystream",
          title: "Camera Feed",
        },
      };

    default:
      throw new Error(`Unsupported widget type: ${type}`);
  }
}
