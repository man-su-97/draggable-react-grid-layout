// import { Layout } from "react-grid-layout";
// import type { ConversationId } from "@/lib/chatHistory";

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

// export interface WidgetLayout extends Layout {
// 	i: string;
// 	x: number;
// 	y: number;
// 	w: number;
// 	h: number;
// 	minW?: number;
// 	minH?: number;
// }

// export interface ChartData {
// 	label: string;
// 	value: number;
// }

// export interface MapData {
// 	name: string;
// 	coordinates: [lat: number, lon: number];
// 	color?: string;
// }

// export interface WeatherTemp {
// 	current: number;
// 	min: number;
// 	max: number;
// }

// export type CellValue = string | number | boolean | null;
// export type DocumentPreviewRow = Record<string, CellValue>;

// export interface StructuredDoc {
// 	fields: string[];
// 	rowCount: number;
// 	preview: DocumentPreviewRow[];
// 	fullData: DocumentPreviewRow[];
// }

// export type SessionStore = Record<
// 	ConversationId,
// 	Record<string, StructuredDoc>
// >;

// export interface CompareEntry {
// 	source: "document" | "gemini";
// 	data: ChartData[];
// }

// export interface ChartPayload {
// 	title: string;
// 	data: ChartData[];
// 	source?: "document" | "gemini";
// 	loading?: boolean;
// 	compareData?: CompareEntry[];
// }

// export interface ChartWidget {
// 	id: string;
// 	type: "line" | "bar" | "pie";
// 	layout: WidgetLayout;
// 	payload: ChartPayload;
// }

// export interface ImageWidget {
// 	id: string;
// 	type: "image";
// 	layout: WidgetLayout;
// 	payload: {
// 		src: string;
// 		title: string;
// 		loading?: boolean;
// 	};
// }

// export interface VideoWidget {
// 	id: string;
// 	type: "video";
// 	layout: WidgetLayout;
// 	payload: {
// 		src: string;
// 		title: string;
// 		loading?: boolean;
// 	};
// }

// export interface CameraWidget {
// 	id: string;
// 	type: "camera";
// 	layout: WidgetLayout;
// 	payload: {
// 		streamUrl: string;
// 		title: string;
// 	};
// }

// export interface MapWidget {
// 	id: string;
// 	type: "map";
// 	layout: WidgetLayout;
// 	payload: {
// 		title: string;
// 		data: MapData[];
// 		loading?: boolean;
// 	};
// }

// export interface WeatherWidget {
// 	id: string;
// 	type: "weather";
// 	layout: WidgetLayout;
// 	payload: {
// 		location?: string;
// 		coordinates: [lat: number, lon: number] | "current";
// 		description?: string;
// 		icon?: string;
// 		temp?: WeatherTemp;
// 		loading?: boolean;
// 	};
// }

// export interface DocumentWidget {
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
// }

// export interface ErrorWidget {
// 	id: string;
// 	type: "error";
// 	layout: WidgetLayout;
// 	payload: {
// 		message: string;
// 		code?: string;
// 	};
// }

// export interface ChatWidget {
// 	id: string;
// 	type: "chat";
// 	layout: WidgetLayout;
// 	payload: {
// 		reply: string;
// 	};
// }

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

// export type WidgetResponse = Widget | (Widget & { update: true });
