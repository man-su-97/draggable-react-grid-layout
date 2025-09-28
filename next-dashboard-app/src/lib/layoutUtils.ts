import { Widget, WidgetLayout } from "@/types/types";

const COLS = 24;
const DEFAULT_W = 6;
const DEFAULT_H = 4;


export function nextLayout(
  widgets: Widget[],
  opts?: Partial<WidgetLayout>
): WidgetLayout {
  const id = crypto.randomUUID();

  let nextX = 0;
  let nextY = 0;

  const lastWidget = widgets[widgets.length - 1];
  if (lastWidget) {
    const { x, w, y, h } = lastWidget.layout;
    const candidateX = x + w;

    if (candidateX + DEFAULT_W <= COLS) {
      nextX = candidateX;
      nextY = y;
    } else {
      nextX = 0;
      nextY = y + h;
    }
  }

  return {
    i: id,
    x: nextX,
    y: nextY,
    w: DEFAULT_W,
    h: DEFAULT_H,
    ...opts,
  };
}
