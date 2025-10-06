import type { ConversationId } from "@/lib/chatHistory";
import { z } from "zod";
import {
	LayoutSchema,
	ChartDataSchema,
	MapDataSchema,
	WeatherTempSchema,
	DocumentPreviewRowSchema,
	StructuredDocSchema,
	CompareEntrySchema,
	ChartPayloadSchema,
	ChartWidgetSchema,
	ImageWidgetSchema,
	VideoWidgetSchema,
	CameraWidgetSchema,
	MapWidgetSchema,
	WeatherWidgetSchema,
	DocumentWidgetSchema,
	ErrorWidgetSchema,
	ChatWidgetSchema,
	WidgetResponseSchema,
} from "@/schemas/widgetSchemas";

export type WidgetLayout = z.infer<typeof LayoutSchema>;
export type ChartData = z.infer<typeof ChartDataSchema>;
export type MapData = z.infer<typeof MapDataSchema>;
export type WeatherTemp = z.infer<typeof WeatherTempSchema>;
export type DocumentPreviewRow = z.infer<typeof DocumentPreviewRowSchema>;
export type StructuredDoc = z.infer<typeof StructuredDocSchema>;

export type CompareEntry = z.infer<typeof CompareEntrySchema>;
export type ChartPayload = z.infer<typeof ChartPayloadSchema>;

export type ChartWidget = z.infer<typeof ChartWidgetSchema>;
export type ImageWidget = z.infer<typeof ImageWidgetSchema>;
export type VideoWidget = z.infer<typeof VideoWidgetSchema>;
export type CameraWidget = z.infer<typeof CameraWidgetSchema>;
export type MapWidget = z.infer<typeof MapWidgetSchema>;
export type WeatherWidget = z.infer<typeof WeatherWidgetSchema>;
export type DocumentWidget = z.infer<typeof DocumentWidgetSchema>;
export type ErrorWidget = z.infer<typeof ErrorWidgetSchema>;
export type ChatWidget = z.infer<typeof ChatWidgetSchema>;

export type WidgetResponse = z.infer<typeof WidgetResponseSchema>;

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

export type CellValue = string | number | boolean | null;
export type WidgetType = Widget["type"];

export type SessionStore = Record<
	ConversationId,
	Record<string, StructuredDoc>
>;
