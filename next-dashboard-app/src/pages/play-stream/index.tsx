"use client";

import { useState } from "react";
import StreamPlayer from "@/lib/StreamPlayer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function PlayStreamPage() {
	const [path, setPath] = useState("live/stream1"); 
	const [activePath, setActivePath] = useState<string | null>(null);

	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-6 space-y-4">
			<h1 className="text-xl font-bold">Test StreamPlayer</h1>

			<div className="flex space-x-2 w-full max-w-md">
				<Input
					placeholder="Enter stream path (e.g. live/stream1)"
					value={path}
					onChange={(e) => setPath(e.target.value)}
				/>
				<Button onClick={() => setActivePath(path)}>Play</Button>
			</div>

			<div className="w-full max-w-3xl aspect-video bg-black rounded-md">
				{activePath ? (
					<StreamPlayer streamPath={activePath} />
				) : (
					<div className="flex items-center justify-center h-full text-gray-400 text-sm">
						Enter a path above and click Play
					</div>
				)}
			</div>
		</div>
	);
}
