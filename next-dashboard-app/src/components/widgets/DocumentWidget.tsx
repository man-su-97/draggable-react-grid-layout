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
