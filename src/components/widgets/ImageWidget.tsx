"use client";

import Image from "next/image";

type ImageWidgetProps = {
	src?: string;
	title?: string;
};

export default function ImageWidget({ src, title }: ImageWidgetProps) {
	console.log("Image src-", src);
	return (
		<div className="w-full h-full flex flex-col bg-black rounded-md overflow-hidden">
			{title && (
				<h3 className="text-sm font-medium mb-2 px-2 text-white">{title}</h3>
			)}
			<Image
				src={"/images/demo-img.png"}
				alt={title ?? "Demo Image Widget"}
				className="w-full h-full object-cover rounded-md"
				width={800}
				height={600}
			/>
		</div>
	);
}
