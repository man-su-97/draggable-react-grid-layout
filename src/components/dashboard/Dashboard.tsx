"use client";

import React, { useEffect, useState } from "react";
import GridLayout, { Layout } from "react-grid-layout";
import { Button } from "@/components/ui/button";
import { Input } from "../ui/input";
import WidgetCard from "./WidgetCard";
import { Widget, WidgetType } from "@/types/types";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Loader2 } from "lucide-react";
import VoiceInput from "../VoiceInput/VoiceInput";

const STORAGE_KEY = "dashboard-widgets";

const DEFAULT_WIDGETS: Widget[] = [
	{
		id: "1",
		type: "line",
		layout: { i: "1", x: 0, y: 0, w: 6, h: 4, minW: 2, minH: 2 },
	},
	{
		id: "2",
		type: "bar",
		layout: { i: "2", x: 6, y: 0, w: 6, h: 4, minW: 2, minH: 2 },
	},
];

export default function Dashboard() {
	const [widgets, setWidgets] = useState<Widget[]>([]);
	const [command, setCommand] = useState("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const raw = localStorage.getItem(STORAGE_KEY);

		if (raw) {
			try {
				const parsedWidgets: Widget[] = JSON.parse(raw);
				if (Array.isArray(parsedWidgets) && parsedWidgets.length > 0) {
					setWidgets(parsedWidgets);
					return;
				}
				setWidgets(parsedWidgets);
			} catch {
				console.log("Resetting to defaults");
			}
		}
		setWidgets(DEFAULT_WIDGETS);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_WIDGETS));
	}, []);

	// Persist widgets on change

	useEffect(() => {
		if (typeof window === "undefined") return;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
	}, [widgets]);

	// Reset dashboard → restore defaults

	const resetDashboard = () => {
		setWidgets(DEFAULT_WIDGETS);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_WIDGETS));
	};

	async function runAICommand(text: string) {
		if (!text.trim()) return;
		setLoading(true);
		try {
			const serverResponse = await fetch("/api/generate-widget", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text }),
			});

			const responseJson = await serverResponse.json();

			if (responseJson?.type) {
				addWidget(responseJson.type as WidgetType, {
					title: responseJson.title,
					data: responseJson.data,
					src: responseJson.src,
				});
			} else {
				alert("AI could not understand your prompt !");
			}
		} catch (err) {
			console.error("AI command error", err);
			alert("Something went wrong with AI command.");
		} finally {
			setLoading(false);
		}
	}

	const addWidget = (type: WidgetType, payload?: any) => {
		const id = crypto.randomUUID();
		const cols = 12;
		const w = 4;
		const h = 4;
		const itemsPerRow = Math.floor(cols / w);
		const index = widgets.length;

		const row = Math.floor(index / itemsPerRow);
		const col = index % itemsPerRow;

		const newLayoutEntry: Layout = {
			i: id,
			x: col * w,
			y: row * h,
			w,
			h,
			minW: 2,
			minH: 2,
		};

		const newWidget: Widget = {
			id,
			type,
			layout: newLayoutEntry,
			payload,
		};

		setWidgets((prevWidgets) => [...prevWidgets, newWidget]);
	};

	const removeWidget = (id: string) => {
		setWidgets((prevWidgets) =>
			prevWidgets.filter((widget) => widget.id !== id)
		);
	};

	const updateLayout = (nextLayout: Layout[]) => {
		setWidgets((prevWidgets) =>
			prevWidgets.map((widget) => {
				const updated = nextLayout.find((l) => l.i === widget.id);
				return updated
					? { ...widget, layout: { ...widget.layout, ...updated } }
					: widget;
			})
		);
	};

	return (
		<div className="flex flex-col min-h-[calc(100vh-80px)]">
			<div className="flex flex-wrap items-center gap-3 px-4 my-10">
				<h2 className="text-xl font-semibold ">Ai Dashboard</h2>

				<div className="flex gap-2 ml-auto">
					<Input
						type="text"
						placeholder="Ask AI to add a widget..."
						value={command}
						onChange={(e) => setCommand(e.target.value)}
						className="border border-gray-600 bg-black text-white rounded px-2 py-1 text-sm w-64"
					/>
					<VoiceInput
						onResult={(text) => {
							setCommand(text);
							runAICommand(text); // auto-run AI after speaking
						}}
					/>
					{/* <Button
						onClick={() => {
							runAICommand(command);
							setCommand("");
						}}
						className="bg-green-600 hover:bg-green-700"
					>
						Run AI
					</Button> */}
					<Button
						onClick={() => {
							runAICommand(command);
							setCommand("");
						}}
						disabled={loading}
						className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
					>
						{loading ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Generating...
							</>
						) : (
							"Run AI"
						)}
					</Button>

					{/* Reset button */}

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button className="bg-white/5">Add Widget +</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem onClick={() => addWidget("line")}>
								Line Chart
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => addWidget("bar")}>
								Bar Chart
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => addWidget("pie")}>
								Pie Chart
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => addWidget("map")}>
								Map Widget
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => addWidget("image")}>
								Image Card
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => addWidget("video")}>
								Video Card
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
			<div className="flex-1">
				<GridLayout
					className="layout"
					layout={widgets.map((widget) => widget.layout)}
					cols={24}
					rowHeight={100}
					width={1900}
					onLayoutChange={updateLayout}
					draggableCancel=".no-drag"
					compactType="vertical"
					isResizable
				>
					{widgets.map((widget) => (
						<div key={widget.id} data-grid={widget.layout}>
							<WidgetCard widget={widget} onRemove={removeWidget} />
						</div>
					))}
				</GridLayout>
			</div>

			<div className="flex justify-center mt-6 px-6">
				<Button
					onClick={resetDashboard}
					className="bg-red-600 hover:bg-red-700 "
				>
					Reset
				</Button>
			</div>
		</div>
	);
}
