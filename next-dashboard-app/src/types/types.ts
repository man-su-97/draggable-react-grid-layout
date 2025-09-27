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
	coordinates: [number, number];
	color?: string;
};
export type WeatherTemp = { current: number; min: number; max: number };
export type DocumentPreviewRow = Record<string, string | number | null>;

export type CompareEntry = {
	source: "document" | "gemini";
	data: ChartData[];
};



export type ChartPayload = {
	title: string;
	data: ChartData[];
	source?: "document" | "gemini";
	loading?: boolean;
	compare?: boolean;
	compareData?: CompareEntry[];
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
		title?: string;
		loading?: boolean;
	};
};

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

export type CameraWidget = {
	id: string;
	type: "camera";
	layout: WidgetLayout;
	payload: {
		streamUrl: string;
		title: string;
	};
};

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
	| ErrorWidget;

export type WidgetResponse = Widget;
