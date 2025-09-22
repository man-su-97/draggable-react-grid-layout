export type WidgetType =
  | "line"
  | "bar"
  | "pie"
  | "image"
  | "video"
  | "map"
  | "weather"
  | "document";

export type ChartData = { label: string; value: number };
export type MapData = { name: string; coordinates: [number, number]; color?: string };
export type WeatherTemp = { current: number; min: number; max: number };
export type DocumentPreviewRow = Record<string, string | number | null>;

export type CompareEntry = {
  source: "document" | "gemini";
  data: ChartData[];
};

export type WidgetLayout = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
};

/** 🔹 Shared chart payload with compare support */
export type ChartPayload = {
  title: string;
  data: ChartData[];
  source?: "document" | "gemini";
  loading?: boolean;
  compare?: boolean;
  compareData?: CompareEntry[];
};

/** 🔹 Chart widgets (line, bar, pie) */
export type ChartWidget = {
  id: string;
  type: "line" | "bar" | "pie";
  layout: WidgetLayout;
  payload: ChartPayload;
};

/** 🔹 Image widget */
export type ImageWidget = {
  id: string;
  type: "image";
  layout: WidgetLayout;
  payload: {
    src: string;
    title?: string;
    loading?: boolean;
  };
};

/** 🔹 Video widget */
export type VideoWidget = {
  id: string;
  type: "video";
  layout: WidgetLayout;
  payload: {
    src: string;
    title?: string;
    loading?: boolean;
  };
};

/** 🔹 Map widget */
export type MapWidget = {
  id: string;
  type: "map";
  layout: WidgetLayout;
  payload: {
    title?: string;
    data: MapData[];
    loading?: boolean;
  };
};

/** 🔹 Weather widget */
export type WeatherWidget = {
  id: string;
  type: "weather";
  layout: WidgetLayout;
  payload: {
    location?: string;
    coordinates: [number, number] | "current";
    description?: string;
    icon?: string;
    temp?: WeatherTemp;
    loading?: boolean;
  };
};

/** 🔹 Document widget */
export type DocumentWidget = {
  id: string;
  type: "document";
  layout: WidgetLayout;
  payload: {
    filename: string;
    fields?: string[];
    rowCount?: number;
    preview?: DocumentPreviewRow[];
    summary?: string;
    loading?: boolean;
  };
};

/** 🔹 Single union type for all widgets */
export type Widget =
  | ChartWidget
  | ImageWidget
  | VideoWidget
  | MapWidget
  | WeatherWidget
  | DocumentWidget;
