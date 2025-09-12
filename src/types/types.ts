export type WidgetType = "line" | "bar" | "pie" | "image" | "video" | "map";

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
    title?: string;
    data?: Array<{ label: string; value: number }>;
    src?: string;
  };
};
