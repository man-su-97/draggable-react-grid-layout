import type { ConversationId } from "@/lib/chatHistory";
import type { DocumentPreviewRow, ChartData, MapData } from "@/types/types";


export type StructuredDoc = {
  fields: string[];
  rowCount: number;
  preview: DocumentPreviewRow[];
  fullData: DocumentPreviewRow[];
};


export const sessionStore: Record<ConversationId, Record<string, StructuredDoc>> = {};

export function makeId(type: string) {
  return `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}


export function aggregateDocData(
  doc: StructuredDoc,
  groupBy?: string,
  metric?: string,
  aggregation: "count" | "sum" | "avg" = "count"
): ChartData[] {
  const groupField =
    groupBy && doc.fields.includes(groupBy) ? groupBy : doc.fields[0];
  const metricField = metric && doc.fields.includes(metric) ? metric : null;

  const groups: Record<string, number[]> = {};

  doc.fullData.forEach((row) => {
    const key = String(row[groupField] ?? "Unknown");
    const raw = metricField ? Number(row[metricField]) : 1;
    const val = Number.isFinite(raw) ? raw : 0;
    if (!groups[key]) groups[key] = [];
    groups[key].push(val);
  });

  return Object.entries(groups).map(([label, values]) => {
    if (aggregation === "sum") {
      return { label, value: values.reduce((a, b) => a + b, 0) };
    }
    if (aggregation === "avg") {
      return { label, value: values.reduce((a, b) => a + b, 0) / (values.length || 1) };
    }
    return { label, value: values.length };
  });
}


const DISTINCT_COLORS = ["red", "blue", "green", "orange", "purple"] as const;

export function assignDistinctColors(
  locs: Array<{ name: string; lat: number; lon: number; color?: string }>
): MapData[] {
  return (locs || [])
    .filter(
      (l) =>
        Number.isFinite(l.lat) &&
        Number.isFinite(l.lon) &&
        l.lat >= -90 &&
        l.lat <= 90 &&
        l.lon >= -180 &&
        l.lon <= 180
    )
    .map((l, i) => ({
      name: l.name,
      coordinates: [l.lat, l.lon] as [number, number],
      color: l.color || DISTINCT_COLORS[i % DISTINCT_COLORS.length],
    }));
}
