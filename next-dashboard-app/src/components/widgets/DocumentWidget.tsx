// "use client";
// import { useState } from "react";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// interface DocumentWidgetProps {
// 	filename: string;
// 	fields?: string[];
// 	rowCount?: number;
// 	preview?: Record<string, string | number | null>[];
// 	summary?: string;
// }

// export default function DocumentWidget({
// 	filename,
// 	fields,
// 	rowCount,
// 	preview,
// 	summary: initialSummary,
// }: DocumentWidgetProps) {
// 	const [prompt, setPrompt] = useState("Summarize this document");
// 	const [summary, setSummary] = useState(initialSummary ?? "");
// 	const [loading, setLoading] = useState(false);
// 	const [error, setError] = useState<string | null>(null);

// 	async function runQuery() {
// 		setLoading(true);
// 		setError(null);
// 		try {
// 			const res = await fetch("/api/doc-upload", {
// 				method: "POST",
// 				headers: { "Content-Type": "application/json" },
// 				body: JSON.stringify({
// 					fileName: filename,
// 					mimeType: "text/csv",
// 					prompt,
// 				}),
// 			});
// 			const data = await res.json();
// 			if ("error" in data) setError(data.error);
// 			else setSummary(data.summary ?? "");
// 		} catch (err) {
// 			setError("Failed to query document.");
// 		} finally {
// 			setLoading(false);
// 		}
// 	}

// 	return (
// 		<Card className="w-full h-full flex flex-col">
// 			<CardHeader>
// 				<CardTitle>📄 {filename}</CardTitle>
// 			</CardHeader>
// 			<CardContent className="flex-1 overflow-auto space-y-4">
// 				<div className="flex gap-2">
// 					<Input
// 						value={prompt}
// 						onChange={(e) => setPrompt(e.target.value)}
// 						placeholder="Ask something..."
// 					/>
// 					<Button onClick={runQuery} disabled={loading}>
// 						{loading ? "..." : "Ask"}
// 					</Button>
// 				</div>

// 				{error && <p className="text-red-600 text-sm">{error}</p>}
// 				{summary && (
// 					<div className="p-2 border rounded bg-muted text-sm whitespace-pre-wrap">
// 						{summary}
// 					</div>
// 				)}

// 				{fields && preview && (
// 					<div className="overflow-x-auto">
// 						<h3 className="font-semibold text-sm">Preview ({rowCount} rows)</h3>
// 						<table className="text-xs border">
// 							<thead>
// 								<tr>
// 									{fields.map((f) => (
// 										<th key={f} className="border px-1">
// 											{f}
// 										</th>
// 									))}
// 								</tr>
// 							</thead>
// 							<tbody>
// 								{preview.map((row, i) => (
// 									<tr key={i}>
// 										{fields.map((f) => (
// 											<td key={f} className="border px-1">
// 												{row[f] ?? ""}
// 											</td>
// 										))}
// 									</tr>
// 								))}
// 							</tbody>
// 						</table>
// 					</div>
// 				)}
// 			</CardContent>
// 		</Card>
// 	);
// }

"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentPreviewRow } from "@/types/types";

interface DocumentWidgetProps {
	filename?: string;
	fields?: string[];
	rowCount?: number;
	preview?: DocumentPreviewRow[];
	summary?: string;
	loading?: boolean;
}

export default function DocumentWidget({
	filename,
	fields,
	rowCount,
	preview,
	summary,
	loading,
}: DocumentWidgetProps) {
	if (loading) {
		return (
			<Card className="w-full h-full flex items-center justify-center">
				<p className="text-sm text-muted-foreground">
					⏳ Analyzing {filename ?? "document"}…
				</p>
			</Card>
		);
	}

	return (
		<Card className="w-full h-full flex flex-col">
			<CardHeader>
				<CardTitle>📄 {filename ?? "Document"}</CardTitle>
			</CardHeader>
			<CardContent className="flex-1 overflow-auto space-y-4">
				{summary && (
					<div className="p-2 border rounded bg-muted text-sm whitespace-pre-wrap">
						{summary}
					</div>
				)}

				{fields && preview && (
					<div className="overflow-x-auto">
						<h3 className="font-semibold text-sm">Preview ({rowCount} rows)</h3>
						<table className="text-xs border">
							<thead>
								<tr>
									{fields.map((f) => (
										<th key={f} className="border px-1">
											{f}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{preview.map((row, i) => (
									<tr key={i}>
										{fields.map((f) => (
											<td key={f} className="border px-1">
												{row[f] ?? ""}
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
