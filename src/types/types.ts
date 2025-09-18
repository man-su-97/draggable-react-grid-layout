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

export type MapData = {
  name: string;
  coordinates: [number, number];
  color?: string;
};

export type WeatherTemp = { current: number; min: number; max: number };

export type DocumentPreviewRow = Record<string, string | number | null>;

export type Widget = {
  id: string;
  type: WidgetType;
  layout: {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
  };
  payload?: {
    // common
    title?: string;
    data?: ChartData[] | MapData[];
    src?: string;

    // weather-specific
    location?: string;
    coordinates?: [number, number] | "current";
    description?: string;
    icon?: string;
    temp?: WeatherTemp;

    // document-specific
    filename?: string;
    fields?: string[];
    rowCount?: number;
    preview?: DocumentPreviewRow[];
  };
};
