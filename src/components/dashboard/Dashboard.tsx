"use client";

import React, { useEffect, useRef, useState } from "react";
import GridLayout, { Layout } from "react-grid-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import WidgetCard from "./WidgetCard";
import { Widget, WidgetType, ChartData } from "@/types/types";
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

const STORAGE_KEY = "dashboard-widgets";

const DEFAULT_WIDGETS: Widget[] = [
  {
    id: "1",
    type: "line",
    layout: { i: "1", x: 0, y: 0, w: 6, h: 4 },
    payload: {
      title: "Revenue vs Sales",
      data: [
        { label: "Jan", value: 100 },
        { label: "Feb", value: 200 },
        { label: "Mar", value: 300 },
      ],
      source: "gemini",
      loading: false,
    },
  },
  {
    id: "2",
    type: "bar",
    layout: { i: "2", x: 6, y: 0, w: 6, h: 4 },
    payload: {
      title: "Expenses",
      data: [
        { label: "Q1", value: 500 },
        { label: "Q2", value: 300 },
        { label: "Q3", value: 400 },
      ],
      source: "gemini",
      loading: false,
    },
  },
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
        body: JSON.stringify({
          text: command,
          base64File,
          mimeType,
          fileName,
        }),
      });

      const responseJson = await serverResponse.json();

      if (Array.isArray(responseJson)) {
        const id = crypto.randomUUID();
        const type = responseJson[0].type as WidgetType;
        addWidget(type, {
          ...responseJson[0],
          compare: true,
          compareData: [
            { source: "document", data: responseJson[0].data as ChartData[] },
            { source: "gemini", data: responseJson[1].data as ChartData[] },
          ],
        });
      } else if (responseJson?.type) {
        addWidget(responseJson.type as WidgetType, responseJson);
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

  const addWidget = (
    type: WidgetType,
    payload?: Partial<Widget["payload"]>
  ): string => {
    const id = crypto.randomUUID();

    const safePayload: any = (() => {
      switch (type) {
        case "line":
        case "bar":
        case "pie":
          return {
            title: `${type.toUpperCase()} Chart`,
            data: [],
            source: "gemini",
            ...payload,
          };
        case "map":
          return { title: "Map Widget", data: [], ...payload };
        case "image":
        case "video":
          return { src: "", title: `${type} widget`, ...payload };
        case "weather":
          return { coordinates: "current", ...payload };
        case "document":
          return { filename: "Unknown", ...payload };
        default:
          return { ...payload };
      }
    })();

    const newWidget: Widget = {
      id,
      type,
      layout: { i: id, x: 0, y: Infinity, w: 6, h: 4 },
      payload: safePayload,
    };

    setWidgets((prev) => [...prev, newWidget]);
    return id;
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
            <span className="text-xs text-muted-foreground truncate max-w-[150px]">
              📎 {attachedFile.name}
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
                Image Widget
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addWidget("video")}>
                Video Widget
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addWidget("weather")}>
                Weather Widget
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addWidget("document")}>
                Document Widget
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Widgets area */}
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
