"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import WidgetRenderer from "./WidgetRenderer";
import { Widget } from "@/types/types";

type WidgetCardProps = {
	widget: Widget;
	onRemove: (id: string) => void;
};

export default function WidgetCard({ widget, onRemove }: WidgetCardProps) {
	const minWidthClass =
		widget.type === "weather" ? "min-w-[368px]" : "min-w-[250px]";

	let baseTitle: string = "widget";

	switch (widget.type) {
		case "line":
		case "bar":
		case "pie":
			baseTitle = widget.payload.title ?? `${widget.type} widget`;
			break;
		case "map":
			baseTitle = widget.payload.title ?? "Map Widget";
			break;
		case "image":
		case "video":
			baseTitle = widget.payload.title ?? `${widget.type} widget`;
			break;
		case "weather":
			baseTitle = widget.payload.location ?? "Weather Widget";
			break;
		case "document":
			baseTitle = widget.payload.filename ?? "Document";
			break;
		case "camera":
			baseTitle =widget.payload.title ?? "Camera";
			break;
		case "error":
			baseTitle = "Error Widget";
			break;
	}

	

	const title =
		(widget.type === "line" ||
			widget.type === "bar" ||
			widget.type === "pie") &&
		widget.payload?.compareData && widget.payload.compareData.length > 0 
			? `${baseTitle} — 📊 Comparison`
			: baseTitle;

	return (
		<Card
			className={`h-full w-full flex flex-col overflow-hidden rounded-lg shadow-md bg-card border border-border text-card-foreground ${minWidthClass}`}
		>
			<div className="w-full flex items-center justify-between px-3 py-2 border-b border-border drag-handle cursor-move bg-muted/40">
				<div className="text-xs sm:text-sm font-medium capitalize truncate text-muted-foreground">
					{title}
				</div>
				<Button
					variant="ghost"
					size="icon"
					onClick={() => onRemove(widget.id)}
					className="h-6 w-6 no-drag text-muted-foreground hover:text-destructive"
				>
					<X className="w-4 h-4" />
				</Button>
			</div>

			<div className="flex-1 w-full min-h-0 p-2">
				<WidgetRenderer widget={widget}/>
			</div>
		</Card>
	);
}
