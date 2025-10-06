import { z } from "zod";

export const LayoutSchema = z.object({
	i: z.string(),
	x: z.number(),
	y: z.number(),
	w: z.number(),
	h: z.number(),
	minW: z.number().optional(),
	minH: z.number().optional(),
});

export const ChartDataSchema = z.object({
	label: z.string(),
	value: z.number(),
});

export const CompareEntrySchema = z.object({
  source: z.enum(["document", "gemini"]),
  data: z.array(ChartDataSchema),
});

export const MapDataSchema = z.object({
	name: z.string(),
	coordinates: z.tuple([z.number(), z.number()]),
	color: z.string().optional(),
});

export const WeatherTempSchema = z.object({
	current: z.number(),
	min: z.number(),
	max: z.number(),
});

export const CellValueSchema = z.union([
	z.string(),
	z.number(),
	z.boolean(),
	z.null(),
]);

export const DocumentPreviewRowSchema = z.record(CellValueSchema);

export const ChartPayloadSchema = z.object({
  title: z.string(),
  data: z.array(ChartDataSchema),
  source: z.enum(["document", "gemini"]).optional(),
  loading: z.boolean().optional(),
  compareData: z.array(CompareEntrySchema).optional(),
});

export const ChartWidgetSchema = z.object({
  id: z.string(),
  type: z.enum(["line", "bar", "pie"]),
  layout: LayoutSchema,
  payload: ChartPayloadSchema, // ✅ reuse instead of inline
});



export const ImageWidgetSchema = z.object({
	id: z.string(),
	type: z.literal("image"),
	layout: LayoutSchema,
	payload: z.object({
		src: z.string(),
		title: z.string(),
		loading: z.boolean().optional(),
	}),
});

export const VideoWidgetSchema = z.object({
	id: z.string(),
	type: z.literal("video"),
	layout: LayoutSchema,
	payload: z.object({
		src: z.string(),
		title: z.string(),
		loading: z.boolean().optional(),
	}),
});

export const CameraWidgetSchema = z.object({
	id: z.string(),
	type: z.literal("camera"),
	layout: LayoutSchema,
	payload: z.object({
		streamUrl: z.string(),
		title: z.string(),
	}),
});

export const MapWidgetSchema = z.object({
	id: z.string(),
	type: z.literal("map"),
	layout: LayoutSchema,
	payload: z.object({
		title: z.string(),
		data: z.array(MapDataSchema),
		loading: z.boolean().optional(),
	}),
});

export const WeatherWidgetSchema = z.object({
	id: z.string(),
	type: z.literal("weather"),
	layout: LayoutSchema,
	payload: z.object({
		location: z.string().optional(),
		coordinates: z.union([
			z.tuple([z.number(), z.number()]),
			z.literal("current"),
		]),
		description: z.string().optional(),
		icon: z.string().optional(),
		temp: WeatherTempSchema.optional(),
		loading: z.boolean().optional(),
	}),
});

export const DocumentWidgetSchema = z.object({
	id: z.string(),
	type: z.literal("document"),
	layout: LayoutSchema,
	payload: z.object({
		filename: z.string(),
		fields: z.array(z.string()).optional(),
		rowCount: z.number().optional(),
		preview: z.array(DocumentPreviewRowSchema).optional(),
		summary: z.string().optional(),
		loading: z.boolean().optional(),
	}),
});

export const ErrorWidgetSchema = z.object({
	id: z.string(),
	type: z.literal("error"),
	layout: LayoutSchema,
	payload: z.object({
		message: z.string(),
		code: z.string().optional(),
	}),
});


export const ChatWidgetSchema = z.object({
  id: z.string(),
  type: z.literal("chat"),
  layout: LayoutSchema,
  payload: z.object({
    reply: z.string(),
  }),
});



export const StructuredDocSchema = z.object({
	fields: z.array(z.string()),
	rowCount: z.number(),
	preview: z.array(DocumentPreviewRowSchema),
	fullData: z.array(DocumentPreviewRowSchema),
});



export const WidgetResponseSchema = z.union([
	ChartWidgetSchema,
	ImageWidgetSchema,
	VideoWidgetSchema,
	MapWidgetSchema,
	WeatherWidgetSchema,
	DocumentWidgetSchema,
	CameraWidgetSchema,
	ErrorWidgetSchema,
	ChatWidgetSchema,
]);
