"use client";

import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

type ImageWidgetProps = {
	src?: string;
	title?: string;
};

export default function ImageWidget({ src, title }: ImageWidgetProps) {
	const [loading, setLoading] = useState(true);

	const fallbackSrc = "/images/demo-img.png";
	const displaySrc = src || fallbackSrc;

	return (
		<div className="w-full h-full flex flex-col bg-black rounded-md overflow-hidden">
			<div className="relative flex-1 w-full h-full flex items-center justify-center">
				{loading && (
					<Skeleton className="w-full h-full rounded bg-gray-800/50" />
				)}

				<Image
					src={displaySrc}
					alt={title ?? "AI Generated Image"}
					className="w-full h-full object-cover rounded-md"
					width={800}
					height={600}
					priority
					onLoad={(e) => {
						if (e.currentTarget.complete) {
							setLoading(false);
						}
					}}
				/>
			</div>
		</div>
	);
}
