"use client";

import React, { useEffect, useState } from "react";
import GridLayout, { Layout } from "react-grid-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import SmartVoiceInput from "../VoiceInput/VoiceInput";

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
  }, [widgets]);

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
          location: responseJson.location,
          coordinates: responseJson.coordinates,
          description: responseJson.description,
          icon: responseJson.icon,
          temp: responseJson.temp,

          filename: responseJson.filename,
          fields: responseJson.fields,
          rowCount: responseJson.rowCount,
          preview: responseJson.preview,
        });

        setCommand("");
      } else {
        alert("AI could not understand your prompt!");
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
      minW: type === "weather" ? 6 : 3,
      minH: 3,
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
    <div className="flex flex-col min-h-[calc(100vh-80px)] bg-background text-foreground">
      <div className="flex flex-wrap items-center gap-3 px-4 my-8">
        <h2 className="text-2xl font-bold tracking-tight">AI Dashboard</h2>

        <div className="flex gap-2 ml-auto items-center">
          <Input
            type="text"
            placeholder="Ask AI to add a widget..."
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            className="w-64"
          />

          <SmartVoiceInput
            asButton
            value={command}
            onChange={(val) => setCommand(val)}
            onResult={(text) => {
              setCommand(text);
              runAICommand(text);
            }}
          />

          <Button
            onClick={() => runAICommand(command)}
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
              <DropdownMenuItem
                onClick={() => addWidget("weather", { coordinates: "current" })}
              >
                Weather Widget
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addWidget("image")}>
                Image Widget
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addWidget("video")}>
                Video Widget
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addWidget("document")}>
                Document Widget
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
          className="bg-destructive text-white hover:bg-rose-700"
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
