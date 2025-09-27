"use client";

import React, { useEffect, useRef, useState } from "react";
import GridLayout, { Layout } from "react-grid-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import WidgetCard from "./WidgetCard";
import { Widget } from "@/types/types";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Loader2, Paperclip } from "lucide-react";
import SmartVoiceInput from "../VoiceInput/VoiceInput";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { IoIosAttach } from "react-icons/io";
import { buildDemoWidget } from "@/components/dashboard/DemoWidget";

const STORAGE_KEY = "dashboard-widgets";

const DEFAULT_WIDGETS: Widget[] = [
  buildDemoWidget("line", []),
  buildDemoWidget("bar", []),
];

export default function Dashboard() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load widgets from localStorage
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
      } catch {
        console.log("Resetting to defaults");
      }
    }
    setWidgets(DEFAULT_WIDGETS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_WIDGETS));
  }, []);

  // Persist widgets
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (widgets.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
    }
  }, [widgets]);

  const resetDashboard = () => {
    setWidgets(DEFAULT_WIDGETS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_WIDGETS));
  };

  async function runAICommand() {
    if (!command.trim() && !attachedFile) return;
    setLoading(true);

    try {
      let base64File: string | undefined;
      let mimeType: string | undefined;
      let fileName: string | undefined;

      if (attachedFile) {
        const buff = await attachedFile.arrayBuffer();
        base64File = Buffer.from(buff).toString("base64");
        mimeType = attachedFile.type;
        fileName = attachedFile.name;
      }

      const serverResponse = await fetch("/api/generate-widget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: command, base64File, mimeType, fileName }),
      });

      const responseJson = await serverResponse.json();

      if (Array.isArray(responseJson)) {
        responseJson.forEach((widget: Widget) => addWidget(widget));
      } else if (responseJson?.type) {
        addWidget(responseJson as Widget);
      } else {
        alert("AI could not understand your prompt!");
      }

      setCommand("");
      setAttachedFile(null);
    } catch (err) {
      console.error("AI command error", err);
      alert("Something went wrong with AI command.");
    } finally {
      setLoading(false);
    }
  }

  function addWidget(widget: Widget) {
    setWidgets((prev) => [...prev, widget]);
  }

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
    <div className="flex flex-col min-h-[calc(100vh-80px)] bg-background text-foreground">
      <div className="flex flex-wrap items-center gap-3 px-4 my-8">
        <h2 className="text-2xl font-bold tracking-tight">AI Dashboard</h2>

        <div className="flex gap-2 ml-auto items-center">
          {/* Input with file attach */}
          <div className="flex items-center border rounded-md overflow-hidden">
            <Input
              type="text"
              placeholder={
                attachedFile
                  ? `Ask about ${attachedFile.name}...`
                  : "Ask AI to add a widget..."
              }
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              className="w-72 border-none focus:ring-0"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="no-drag"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setAttachedFile(file);
              }}
            />
          </div>

          {attachedFile && (
            <span className="text-xs text-muted-foreground truncate max-w-[150px] flex items-center">
              <IoIosAttach className="w-4 h-4 text-white" />
              {attachedFile.name}
            </span>
          )}

          <SmartVoiceInput
            asButton
            value={command}
            onChange={(val) => setCommand(val)}
            onResult={(text) => {
              setCommand(text);
              runAICommand();
            }}
          />

          <Button
            onClick={runAICommand}
            disabled={loading}
            className="bg-primary text-primary-foreground hover:bg-blue-600 flex items-center gap-2"
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

          {/* Dropdown to add demo widgets */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-muted text-muted-foreground hover:bg-muted/80">
                Add Widget +
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {["line", "bar", "pie", "map", "image", "video", "weather", "document", "camera"].map(
                (type) => (
                  <DropdownMenuItem
                    key={type}
                    onClick={() => addWidget(buildDemoWidget(type as Widget["type"], widgets))}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)} Widget
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1">
        <GridLayout
          className="layout"
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
          className="bg-destructive text-white hover:bg-rose-700"
        >
          Reset
        </Button>
      </div>
    </div>
  );
}



// "use client";

// import React, { useEffect, useRef, useState } from "react";
// import GridLayout, { Layout } from "react-grid-layout";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import WidgetCard from "./WidgetCard";
// import { Widget, WidgetType } from "@/types/types";
// import "react-grid-layout/css/styles.css";
// import "react-resizable/css/styles.css";
// import { Loader2, Paperclip } from "lucide-react";
// import SmartVoiceInput from "../VoiceInput/VoiceInput";
// import {
// 	DropdownMenu,
// 	DropdownMenuTrigger,
// 	DropdownMenuContent,
// 	DropdownMenuItem,
// } from "@/components/ui/dropdown-menu";
// import { IoIosAttach } from "react-icons/io";
// import { nextLayout } from "@/lib/layoutUtils";

// const STORAGE_KEY = "dashboard-widgets";

// const DEFAULT_WIDGETS: Widget[] = [
// 	{
// 		id: "1",
// 		type: "line",
// 		layout: { i: "1", x: 0, y: 0, w: 6, h: 4 },
// 		payload: {
// 			title: "Revenue vs Sales",
// 			data: [
// 				{ label: "Jan", value: 100 },
// 				{ label: "Feb", value: 200 },
// 				{ label: "Mar", value: 300 },
// 			],
// 			source: "gemini",
// 			loading: false,
// 		},
// 	},
// 	{
// 		id: "2",
// 		type: "bar",
// 		layout: { i: "2", x: 6, y: 0, w: 6, h: 4 },
// 		payload: {
// 			title: "Expenses",
// 			data: [
// 				{ label: "Q1", value: 500 },
// 				{ label: "Q2", value: 300 },
// 				{ label: "Q3", value: 400 },
// 			],
// 			source: "gemini",
// 			loading: false,
// 		},
// 	},
// ];

// export default function Dashboard() {
// 	const [widgets, setWidgets] = useState<Widget[]>([]); //holding the entire collection of widgets on your dashboard
// 	const [command, setCommand] = useState(""); //This state stores the text a user types into the input field.
// 	const [loading, setLoading] = useState(false);
// 	const [attachedFile, setAttachedFile] = useState<File | null>(null); //This state holds the file object that the user has attached, or null if no file is attached.

// 	const fileInputRef = useRef<HTMLInputElement | null>(null);

// 	// Load widgets from localStorage
// 	useEffect(() => {
// 		if (typeof window === "undefined") return;
// 		const raw = localStorage.getItem(STORAGE_KEY);
// 		if (raw) {
// 			try {
// 				const parsedWidgets: Widget[] = JSON.parse(raw);
// 				if (Array.isArray(parsedWidgets) && parsedWidgets.length > 0) {
// 					setWidgets(parsedWidgets);
// 					return;
// 				}
// 			} catch {
// 				console.log("Resetting to defaults");
// 			}
// 		}
// 		setWidgets(DEFAULT_WIDGETS);
// 		localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_WIDGETS));
// 	}, []);

// 	// Persist widgets
// 	useEffect(() => {
// 		if (typeof window === "undefined") return;
// 		if (widgets.length > 0) {
// 			localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
// 		}
// 	}, [widgets]);

// 	const resetDashboard = () => {
// 		setWidgets(DEFAULT_WIDGETS);
// 		localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_WIDGETS));
// 	};

// 	async function runAICommand() {
// 		if (!command.trim() && !attachedFile) return;
// 		setLoading(true);

// 		try {
// 			let base64File: string | undefined;
// 			let mimeType: string | undefined;
// 			let fileName: string | undefined;

// 			if (attachedFile) {
// 				const buff = await attachedFile.arrayBuffer();
// 				base64File = Buffer.from(buff).toString("base64");
// 				mimeType = attachedFile.type;
// 				fileName = attachedFile.name;
// 			}

// 			const serverResponse = await fetch("/api/generate-widget", {
// 				method: "POST",
// 				headers: { "Content-Type": "application/json" },
// 				body: JSON.stringify({
// 					text: command,
// 					base64File,
// 					mimeType,
// 					fileName,
// 				}),
// 			});

// 			const responseJson = await serverResponse.json();

// 			if (Array.isArray(responseJson)) {
// 				responseJson.forEach((widgetResp) => {
// 					addWidget(widgetResp.type as WidgetType, widgetResp.payload);
// 				});
// 			} else if (responseJson?.type) {
// 				addWidget(responseJson.type as WidgetType, responseJson.payload);
// 			} else {
// 				alert("AI could not understand your prompt!");
// 			}

// 			setCommand("");
// 			setAttachedFile(null);
// 		}
// 		catch (err) {
// 			console.error("AI command error", err);
// 			alert("Something went wrong with AI command.");
// 		} finally {
// 			setLoading(false);
// 		}
// 	}
// 	function addWidget<T extends Widget["type"]>(
// 		type: T,
// 		payload?: Partial<Extract<Widget, { type: T }>["payload"]>
// 	): string {
// 		const id =  crypto.randomUUID();

// 		let newWidget: Extract<Widget, { type: T }>;


// 		const baseLayout = nextLayout(widgets);

// 		switch (type) {
// 			case "line":
// 			case "bar":
// 			case "pie":
// 				newWidget = {
// 					id,
// 					type,
// 					layout: baseLayout,
// 					payload: {
// 						title: `${type.toUpperCase()} Chart`,
// 						data: [
// 							{ label: "A", value: 10 },
// 							{ label: "B", value: 20 },
// 							{ label: "C", value: 15 },
// 						],
// 						source: "gemini",
// 						...payload,
// 					},
// 				} as Extract<Widget, { type: T }>;
// 				break;

// 			case "map":
// 				newWidget = {
// 					id,
// 					type,
// 					layout: baseLayout,
// 					payload: {
// 						title: "Map Widget",
// 						data: [
// 							{
// 								name: "New York",
// 								coordinates: [40.7128, -74.006],
// 								color: "red",
// 							},
// 							{
// 								name: "London",
// 								coordinates: [51.5074, -0.1278],
// 								color: "blue",
// 							},
// 						],
// 						...payload,
// 					},
// 				} as Extract<Widget, { type: T }>;
// 				break;

// 			case "image":
// 				newWidget = {
// 					id,
// 					type,
// 					layout: baseLayout,
// 					payload: {
// 						src: "https://picsum.photos/800/600",
// 						title: "Sample Image",
// 						...payload,
// 					},
// 				} as Extract<Widget, { type: T }>;
// 				break;

// 			case "video":
// 				newWidget = {
// 					id,
// 					type,
// 					layout: baseLayout,
// 					payload: {
// 						src: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
// 						title: "Sample Video",
// 						...payload,
// 					},
// 				} as Extract<Widget, { type: T }>;
// 				break;

// 			case "weather":
// 				newWidget = {
// 					id,
// 					type,
// 					layout: baseLayout,
// 					payload: {
// 						location: "New Delhi",
// 						coordinates: "current",
// 						...payload,
// 					},
// 				} as Extract<Widget, { type: T }>;
// 				break;

// 			case "document":
// 				newWidget = {
// 					id,
// 					type,
// 					layout: baseLayout,
// 					payload: {
// 						filename: "Unknown",
// 						...payload,
// 					},
// 				} as Extract<Widget, { type: T }>;
// 				break;

// 			case "camera":
// 				newWidget = {
// 					id,
// 					type,
// 					layout: baseLayout,
// 					payload: {
// 						streamUrl: "mystream",
// 						title: "Camera Feed",
// 						...payload,
// 					}

// 				} as Extract<Widget, { type: T }>;
// 				break;
// 		}

// 		setWidgets((prev) => [...prev, newWidget]);
// 		return id;
// 	}



// 	const removeWidget = (id: string) => {
// 		setWidgets((prevWidgets) =>
// 			prevWidgets.filter((widget) => widget.id !== id)
// 		);
// 	};

// 	const updateLayout = (nextLayout: Layout[]) => {
// 		setWidgets((prevWidgets) =>
// 			prevWidgets.map((widget) => {
// 				const updated = nextLayout.find((l) => l.i === widget.id);
// 				return updated
// 					? { ...widget, layout: { ...widget.layout, ...updated } }
// 					: widget;
// 			})
// 		);
// 	};

// 	return (
// 		<div className="flex flex-col min-h-[calc(100vh-80px)] bg-background text-foreground">
// 			<div className="flex flex-wrap items-center gap-3 px-4 my-8">
// 				<h2 className="text-2xl font-bold tracking-tight">AI Dashboard</h2>

// 				<div className="flex gap-2 ml-auto items-center">
// 					{/* Input with file attach */}
// 					<div className="flex items-center border rounded-md overflow-hidden">
// 						<Input
// 							type="text"
// 							placeholder={
// 								attachedFile
// 									? `Ask about ${attachedFile.name}...`
// 									: "Ask AI to add a widget..."
// 							}
// 							value={command}
// 							onChange={(e) => setCommand(e.target.value)}
// 							className="w-72 border-none focus:ring-0"
// 						/>
// 						<Button
// 							variant="ghost"
// 							size="icon"
// 							onClick={() => fileInputRef.current?.click()}
// 							className="no-drag"
// 						>
// 							<Paperclip className="w-4 h-4" />
// 						</Button>
// 						<input
// 							type="file"
// 							ref={fileInputRef}
// 							className="hidden"
// 							onChange={(e) => {
// 								const file = e.target.files?.[0];
// 								if (file) setAttachedFile(file);
// 							}}
// 						/>
// 					</div>

// 					{attachedFile && (
// 						<span className="text-xs text-muted-foreground truncate max-w-[150px] flex items-center">
// 							<IoIosAttach className="w-4 h-4 text-white" />
// 							{attachedFile.name}
// 						</span>
// 					)}

// 					<SmartVoiceInput
// 						asButton
// 						value={command}
// 						onChange={(val) => setCommand(val)}
// 						onResult={(text) => {
// 							setCommand(text);
// 							runAICommand();
// 						}}
// 					/>

// 					<Button
// 						onClick={runAICommand}
// 						disabled={loading}
// 						className="bg-primary text-primary-foreground hover:bg-blue-600 flex items-center gap-2"
// 					>
// 						{loading ? (
// 							<>
// 								<Loader2 className="h-4 w-4 animate-spin" />
// 								Generating...
// 							</>
// 						) : (
// 							"Run AI"
// 						)}
// 					</Button>

// 					{/* Dropdown to add demo widgets */}
// 					<DropdownMenu>
// 						<DropdownMenuTrigger asChild>
// 							<Button className="bg-muted text-muted-foreground hover:bg-muted/80">
// 								Add Widget +
// 							</Button>
// 						</DropdownMenuTrigger>
// 						<DropdownMenuContent>
// 							<DropdownMenuItem onClick={() => addWidget("line")}>
// 								Line Chart
// 							</DropdownMenuItem>
// 							<DropdownMenuItem onClick={() => addWidget("bar")}>
// 								Bar Chart
// 							</DropdownMenuItem>
// 							<DropdownMenuItem onClick={() => addWidget("pie")}>
// 								Pie Chart
// 							</DropdownMenuItem>
// 							<DropdownMenuItem onClick={() => addWidget("map")}>
// 								Map Widget
// 							</DropdownMenuItem>
// 							<DropdownMenuItem onClick={() => addWidget("image")}>
// 								Image Widget
// 							</DropdownMenuItem>
// 							<DropdownMenuItem onClick={() => addWidget("video")}>
// 								Video Widget
// 							</DropdownMenuItem>
// 							<DropdownMenuItem onClick={() => addWidget("weather")}>
// 								Weather Widget
// 							</DropdownMenuItem>
// 							<DropdownMenuItem onClick={() => addWidget("document")}>
// 								Document Widget
// 							</DropdownMenuItem>
// 							<DropdownMenuItem onClick={() => addWidget("camera")}>
// 								Camera Widget
// 							</DropdownMenuItem>
// 						</DropdownMenuContent>
// 					</DropdownMenu>
// 				</div>
// 			</div>

// 			<div className="flex-1">
// 				<GridLayout
// 					className="layout"
// 					cols={24}
// 					rowHeight={100}
// 					width={1900}
// 					onLayoutChange={updateLayout}
// 					draggableCancel=".no-drag"
// 					compactType="vertical"
// 					isResizable
// 				>
// 					{widgets.map((widget) => (
// 						<div key={widget.id} data-grid={widget.layout}>
// 							<WidgetCard widget={widget} onRemove={removeWidget} />
// 						</div>
// 					))}
// 				</GridLayout>
// 			</div>

// 			<div className="flex justify-center mt-6 px-6">
// 				<Button
// 					onClick={resetDashboard}
// 					className="bg-destructive text-white hover:bg-rose-700"
// 				>
// 					Reset
// 				</Button>
// 			</div>
// 		</div>
// 	);
// }
