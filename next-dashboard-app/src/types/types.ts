// import { Layout } from "react-grid-layout";

// export type WidgetType =
// 	| "line"
// 	| "bar"
// 	| "pie"
// 	| "image"
// 	| "video"
// 	| "map"
// 	| "weather"
// 	| "document"
// 	| "camera"
// 	| "chat"
// 	| "error";

// export type WidgetLayout = Layout & {
// 	i: string;
// 	x: number;
// 	y: number;
// 	w: number;
// 	h: number;
// 	minW?: number;
// 	minH?: number;
// };

// export type ChartData = { label: string; value: number };

// export type MapData = {
// 	name: string;
// 	coordinates: [lat: number,lon: number];
// 	color?: string;
// };

// export type WeatherTemp = { current: number; min: number; max: number };

// export type CellValue = string | number | boolean | null;
// export type DocumentPreviewRow = Record<string, CellValue>;

// export type CompareEntry = {
// 	source: "document" | "gemini";
// 	data: ChartData[];
// };

// export type ChartPayload = {
// 	title: string;
// 	data: ChartData[];
// 	source?: "document" | "gemini";
// 	loading?: boolean;
// 	compare?: boolean;
// 	compareData?: CompareEntry[];
// };

// export type ChartWidget = {
// 	id: string;
// 	type: "line" | "bar" | "pie";
// 	layout: WidgetLayout;
// 	payload: ChartPayload;
// };

// export type ImageWidget = {
// 	id: string;
// 	type: "image";
// 	layout: WidgetLayout;
// 	payload: {
// 		src: string;
// 		title?: string;
// 		loading?: boolean;
// 	};
// };

// export type VideoWidget = {
// 	id: string;
// 	type: "video";
// 	layout: WidgetLayout;
// 	payload: {
// 		src: string;
// 		title?: string;
// 		loading?: boolean;
// 	};
// };

// export type CameraWidget = {
// 	id: string;
// 	type: "camera";
// 	layout: WidgetLayout;
// 	payload: {
// 		streamUrl: string;
// 		title: string;
// 	};
// };

// export type MapWidget = {
// 	id: string;
// 	type: "map";
// 	layout: WidgetLayout;
// 	payload: {
// 		title?: string;
// 		data: MapData[];
// 		loading?: boolean;
// 	};
// };

// export type WeatherWidget = {
// 	id: string;
// 	type: "weather";
// 	layout: WidgetLayout;
// 	payload: {
// 		location?: string;
// 		coordinates: [number, number] | "current";
// 		description?: string;
// 		icon?: string;
// 		temp?: WeatherTemp;
// 		loading?: boolean;
// 	};
// };

// export type DocumentWidget = {
// 	id: string;
// 	type: "document";
// 	layout: WidgetLayout;
// 	payload: {
// 		filename: string;
// 		fields?: string[];
// 		rowCount?: number;
// 		preview?: DocumentPreviewRow[];
// 		summary?: string;
// 		loading?: boolean;
// 	};
// };

// export type ErrorWidget = {
// 	id: string;
// 	type: "error";
// 	layout: WidgetLayout;
// 	payload: {
// 		message: string;
// 	};
// };

// export type ChatWidget = {
// 	id: string;
// 	type: "chat";
// 	layout: WidgetLayout;
// 	payload: {
// 		reply: string;
// 	};
// };

// export type Widget =
// 	| ChartWidget
// 	| ImageWidget
// 	| VideoWidget
// 	| MapWidget
// 	| WeatherWidget
// 	| DocumentWidget
// 	| CameraWidget
// 	| ErrorWidget
// 	| ChatWidget;

// export type WidgetResponse = Widget;

// src/types/widgets.ts
import { Layout } from "react-grid-layout";

export type WidgetType =
  | "line"
  | "bar"
  | "pie"
  | "image"
  | "video"
  | "map"
  | "weather"
  | "document"
  | "camera"
  | "chat"
  | "error";

export type WidgetLayout = Layout & {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
};

export type ChartData = { label: string; value: number };

export type MapData = {
  name: string;
  coordinates: [lat: number, lon: number];
  color?: string;
};

export type WeatherTemp = { current: number; min: number; max: number };

export type CellValue = string | number | boolean | null;
export type DocumentPreviewRow = Record<string, CellValue>;

export type CompareEntry = {
  source: "document" | "gemini";
  data: ChartData[];
};

export type ChartPayload = {
  title: string;
  data: ChartData[];
  source?: "document" | "gemini";
  loading?: boolean;
  compareData?: CompareEntry[]; // presence means compare chart
};

export type ChartWidget = {
  id: string;
  type: "line" | "bar" | "pie";
  layout: WidgetLayout;
  payload: ChartPayload;
};

export type ImageWidget = {
  id: string;
  type: "image";
  layout: WidgetLayout;
  payload: {
    src: string;
    title: string; // required for UI consistency
    loading?: boolean;
  };
};

export type VideoWidget = {
  id: string;
  type: "video";
  layout: WidgetLayout;
  payload: {
    src: string;
    title: string; // required for UI consistency
    loading?: boolean;
  };
};

export type CameraWidget = {
  id: string;
  type: "camera";
  layout: WidgetLayout;
  payload: {
    streamUrl: string;
    title: string; // required
  };
};

export type MapWidget = {
  id: string;
  type: "map";
  layout: WidgetLayout;
  payload: {
    title: string; // required for consistency
    data: MapData[];
    loading?: boolean;
  };
};

export type WeatherWidget = {
  id: string;
  type: "weather";
  layout: WidgetLayout;
  payload: {
    location?: string;
    coordinates: [lat: number, lon: number] | "current";
    description?: string;
    icon?: string;
    temp?: WeatherTemp;
    loading?: boolean;
  };
};

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

export type ErrorWidget = {
  id: string;
  type: "error";
  layout: WidgetLayout;
  payload: {
    message: string;
    code?: string; // e.g. NETWORK_ERROR, PARSE_ERROR
  };
};

export type ChatWidget = {
  id: string;
  type: "chat";
  layout: WidgetLayout;
  payload: {
    reply: string;
  };
};

export type Widget =
  | ChartWidget
  | ImageWidget
  | VideoWidget
  | MapWidget
  | WeatherWidget
  | DocumentWidget
  | CameraWidget
  | ErrorWidget
  | ChatWidget;

export type WidgetResponse = Widget & {
  update?: boolean; // marks update to existing widget
};
