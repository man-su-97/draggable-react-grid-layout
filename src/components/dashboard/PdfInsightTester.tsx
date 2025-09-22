"use client";

import { useState } from "react";
import type { UploadResponse } from "@/pages/api/doc-upload";

export default function FileInsightTester() {
	const [summary, setSummary] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [prompt, setPrompt] = useState("Summarize this document");

	const [fields, setFields] = useState<string[] | null>(null);
	const [preview, setPreview] = useState<
		Record<string, string | number | null>[] | null
	>(null);
	const [rowCount, setRowCount] = useState<number | null>(null);

	const [fileMeta, setFileMeta] = useState<{
		base64File: string;
		fileName: string;
		mimeType: string;
	} | null>(null);

	function getDefaultPrompt(mimeType: string): string {
		if (mimeType.startsWith("image/")) return "Describe this image";
		if (mimeType.startsWith("audio/")) return "Transcribe this audio";
		if (mimeType.startsWith("video/")) return "Summarize this video";
		if (mimeType === "application/pdf" || mimeType.startsWith("text/"))
			return "Summarize this document";
		return "Analyze this file";
	}

	// Upload file and auto-run first analysis
	async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		if (prompt === "Summarize this document") {
			setPrompt(getDefaultPrompt(file.type));
		}

		const buff = await file.arrayBuffer();
		const base64File = Buffer.from(buff).toString("base64");

		// Save file meta for follow-up queries
		setFileMeta({ base64File, fileName: file.name, mimeType: file.type });

		// Run first query with default/custom prompt
		runAIQuery(base64File, file.name, file.type, prompt);
	}

	// Reusable function to call backend
	async function runAIQuery(
		base64File: string,
		fileName: string,
		mimeType: string,
		query: string
	) {
		setLoading(true);
		setError(null);
		setSummary(null);
		setFields(null);
		setPreview(null);
		setRowCount(null);

		try {
			const res = await fetch("/api/doc-upload", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ base64File, fileName, mimeType, prompt: query }),
			});

			const data: UploadResponse & {
				fields?: string[];
				rowCount?: number;
				preview?: Record<string, string | number | null>[];
			} = await res.json();

			if ("error" in data) {
				setError(data.error);
			} else {
				setSummary(data.summary);
				setFields(data.fields ?? null);
				setRowCount(data.rowCount ?? null);
				setPreview(data.preview ?? null);
			}
		} catch {
			setError("Something went wrong while uploading.");
		} finally {
			setLoading(false);
		}
	}

	// Follow-up ask AI
	function handleAskAI() {
		if (!fileMeta) return;
		runAIQuery(
			fileMeta.base64File,
			fileMeta.fileName,
			fileMeta.mimeType,
			prompt
		);
	}

	return (
		<div className="p-6 max-w-3xl mx-auto space-y-6 bg-white border rounded-lg shadow-md">
			<h2 className="text-xl font-semibold text-gray-900">
				📂 File Insight Tester
			</h2>

			<input
				type="file"
				onChange={handleUpload}
				className="block w-full text-sm text-gray-700 
                   file:mr-4 file:py-2 file:px-4 
                   file:rounded-md file:border-0 
                   file:text-sm file:font-semibold 
                   file:bg-blue-50 file:text-blue-700 
                   hover:file:bg-blue-100"
			/>

			{fileMeta && (
				<div className="flex gap-2 items-center">
					<input
						type="text"
						value={prompt}
						onChange={(e) => setPrompt(e.target.value)}
						className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Ask AI something about your file..."
					/>
					<button
						onClick={handleAskAI}
						disabled={loading}
						className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
					>
						{loading ? "Thinking..." : "Ask AI"}
					</button>
				</div>
			)}

			{/* Loading State */}
			{loading && (
				<div className="flex items-center gap-2 text-blue-600 mt-2">
					<svg
						className="animate-spin h-5 w-5 text-blue-600"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						></circle>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
						></path>
					</svg>
					<span>Analyzing document…</span>
				</div>
			)}

			{/* Error */}
			{error && <p className="text-red-600">{error}</p>}

			{/* AI Summary */}
			{summary && (
				<div className="p-4 border border-gray-200 rounded bg-gray-50 max-w-full overflow-x-auto">
					<h3 className="font-medium mb-2 text-gray-900">AI Result:</h3>
					<p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap break-words">
						{summary}
					</p>
				</div>
			)}

			{/* Table Preview for Excel/CSV */}

			{/* {fields && preview && (
        <div className="p-4 border border-gray-200 rounded bg-gray-50 overflow-x-auto">
          <h3 className="font-medium mb-2 text-gray-900">
            📊 Data Preview ({rowCount} rows total)
          </h3>
          <table className="min-w-full text-sm border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                {fields.map((f) => (
                  <th key={f} className="px-3 py-2 border border-gray-300 text-left">
                    {f}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i} className="odd:bg-white even:bg-gray-50">
                  {fields.map((f) => (
                    <td key={f} className="px-3 py-2 border border-gray-300">
                      {row[f] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )} */}
			{fields && preview && (
				<div className="p-4 border border-gray-200 rounded bg-white overflow-x-auto">
					<h3 className="font-medium mb-2 text-gray-900">
						Data Preview ({rowCount} rows total)
					</h3>
					<table className="min-w-full text-sm border border-gray-300">
						<thead>
							<tr className="bg-gray-200">
								{" "}
								{fields.map((f) => (
									<th
										key={f}
										className="px-3 py-2 border border-gray-300 text-left text-gray-900 font-semibold"
									>
										{f}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{preview.map((row, i) => (
								<tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
									{fields.map((f) => (
										<td
											key={f}
											className="px-3 py-2 border border-gray-300 text-gray-900"
										>
											{row[f] ?? ""}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
