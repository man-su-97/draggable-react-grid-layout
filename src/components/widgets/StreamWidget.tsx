"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import StreamPlayer from "@/lib/StreamPlayer";

type StreamWidgetProps = {
	id: string;
	initialPath?: string; // OBS path or RTSP URL
	title?: string;
	onRemove: (id: string) => void;
};

export default function StreamWidget({
	id,
	initialPath = "",
	title = "Live Stream",
	onRemove,
}: StreamWidgetProps) {
	const [inputPath, setInputPath] = useState(initialPath);

	let effectivePath = "";
	if (inputPath) {
		if (inputPath.startsWith("rtsp://")) {
			
			const last = inputPath.split("/").pop();
			effectivePath = last ? last : "";
		} else {
			effectivePath = inputPath.startsWith("live/")
				? inputPath
				: `live/${inputPath}`;
		}
	}

	return (
		<Card className="h-full flex flex-col overflow-hidden">
			<div className="flex items-center justify-between p-2 border-b">
				<h3 className="text-sm font-medium">{title}</h3>
				<Button
					size="icon"
					variant="ghost"
					onClick={() => onRemove(id)}
					className="no-drag"
				>
					<X className="w-4 h-4" />
				</Button>
			</div>

			<div className="p-2 border-b">
				<Input
					placeholder="Enter OBS path (e.g. live/stream1) or RTSP URL"
					value={inputPath}
					onChange={(e) => setInputPath(e.target.value)}
					className="no-drag"
				/>
			</div>

			<div className="flex-1 bg-black">
				{effectivePath ? (
					<StreamPlayer streamPath={effectivePath} />
				) : (
					<div className="flex items-center justify-center h-full text-gray-400 text-sm">
						Enter OBS path or RTSP URL above
					</div>
				)}
			</div>
		</Card>
	);
}
