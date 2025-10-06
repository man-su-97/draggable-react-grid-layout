"use client";

import React, { useEffect, useRef, useState } from "react";
import GridLayout, { Layout } from "react-grid-layout";
import { Button } from "@/components/ui/button";
import WidgetCard from "./WidgetCard";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Paperclip, X, Loader2 } from "lucide-react";
import SmartVoiceInput from "../VoiceInput/VoiceInput";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { buildDemoWidget } from "@/components/dashboard/DemoWidget";
import { nextLayout } from "@/lib/layoutUtils";
import { Widget, WidgetResponse, WidgetType } from "@/types/widgetTypes";
import { WidgetResponseSchema } from "@/schemas/widgetSchemas";


type ChatMessage = {
  role: "user" | "model";
  text: string;
  timestamp: number;
};


const STORAGE_KEY = "dashboard-widgets";

function useContainerWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width)
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}


export default function Dashboard() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chat, setChat] = useState<ChatMessage[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [conversationId] = useState<string>(() => crypto.randomUUID());
  const [model, setModel] = useState<"gemini" | "claude" | "openai">("gemini");
  const { ref: gridRef, width: gridWidth } = useContainerWidth();


  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setWidgets(raw ? (JSON.parse(raw) as Widget[]) : []);
    } catch {
      console.warn("Resetting invalid dashboard data");
      setWidgets([]);
    }
  }, []);


  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
    }
  }, [widgets]);

  const resetDashboard = () => {
    setWidgets([]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  };

  useEffect(() => {
    if (!chatOpen) return;
    (async () => {
      try {
        const res = await fetch(`/api/chat?conversationId=${conversationId}`);
        if (!res.ok) return;
        const data = await res.json();

        if (Array.isArray(data.history)) {
          const msgs: ChatMessage[] = data.history.map((m: any) => ({
            role: m.role as "user" | "model",
            text: m.parts?.[0]?.text ?? "",
            timestamp: m.timestamp ?? Date.now(),
          }));

          setChat((prev) => {
            const merged = [...prev, ...msgs];
            const seen = new Set<string>();
            return merged.filter((m) => {
              const key = `${m.role}-${m.text}-${m.timestamp}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
          });
        }
      } catch (err) {
        console.error("Failed to sync chat:", err);
      }
    })();
  }, [chatOpen, conversationId]);


  async function runAICommand() {
    if (!command.trim() && !attachedFile) return;
    setLoading(true);

    const now = Date.now();
    setChat((prev) => [...prev, { role: "user", text: command, timestamp: now }]);

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

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: command,
          base64File,
          mimeType,
          fileName,
          conversationId,
          model,
        }),
      });

      const data: unknown = await res.json();

      if (Array.isArray(data)) {
        data.forEach((resp) => {
          const parsed = WidgetResponseSchema.safeParse(resp);
          if (parsed.success) handleResponse(parsed.data);
          else console.warn("Invalid widget response:", resp);
        });
      } else {
        const parsed = WidgetResponseSchema.safeParse(data);
        if (parsed.success) handleResponse(parsed.data);
        else console.warn("Invalid widget response:", data);
      }
    } catch (err) {
      console.error("AI command error", err);
      alert("AI request failed. Check your API keys or network.");
    } finally {
      setCommand("");
      setAttachedFile(null);
      setLoading(false);
    }
  }

  function handleResponse(resp: WidgetResponse) {
    if (!resp) return;
    if (resp.type === "chat") {
      const reply = resp.payload.reply ?? "I didn’t quite get that.";
      setChat((prev) => [
        ...prev,
        { role: "model", text: reply, timestamp: Date.now() },
      ]);
    } else {
      addWidget(resp as Widget);
    }
  }

  function addWidget(widget: Widget) {
    if (widget.type === "chat") return;
    setWidgets((prev) => {
      const layout = nextLayout(prev);
      return [...prev, { ...widget, layout: { ...layout, i: widget.id } }];
    });
  }

  const removeWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  const updateLayout = (nextLayout: Layout[]) => {
    setWidgets((prev) =>
      prev.map((widget) => {
        const updated = nextLayout.find((l) => l.i === widget.id);
        return updated ? { ...widget, layout: { ...widget.layout, ...updated } } : widget;
      })
    );
  };

  const handleVoiceResult = (text: string) => {
    setCommand(text);
  };


  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] bg-background text-foreground relative">
      <div className="flex flex-wrap items-center gap-3 px-4 my-8">
        <h2 className="text-2xl font-bold tracking-tight">AI Dashboard</h2>

        <div className="flex gap-2 ml-auto items-center">
          <Button
            onClick={() => setChatOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-blue-600"
          >
            Ask AI
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-muted text-muted-foreground hover:bg-muted/80">
                Add Widget +
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {[
                "line",
                "bar",
                "pie",
                "map",
                "image",
                "video",
                "weather",
                "document",
                "camera",
              ].map((type) => (
                <DropdownMenuItem
                  key={type}
                  onClick={() => addWidget(buildDemoWidget(type as WidgetType, widgets))}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)} Widget
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-40 backdrop-blur-sm">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-2" />
          <p className="text-sm text-muted-foreground">Generating insight...</p>
        </div>
      )}

      {chatOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-background text-foreground w-full max-w-2xl h-[70vh] rounded-lg shadow-lg flex flex-col">
            <div className="flex justify-between items-center border-b px-4 py-2">
              <h3 className="font-semibold">
                AI Assistant{" "}
                <span className="text-muted-foreground">
                  ({model.charAt(0).toUpperCase() + model.slice(1)})
                </span>
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setChatOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 p-4">
              {chat.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-md max-w-[75%] ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-muted text-foreground mr-auto"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            <div className="flex gap-2 p-3 border-t items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="no-drag min-w-[100px] justify-between">
                    {model.charAt(0).toUpperCase() + model.slice(1)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {["gemini", "claude", "openai"].map((m) => (
                    <DropdownMenuItem key={m} onClick={() => setModel(m as typeof model)}>
                      Use {m}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <input
                type="text"
                placeholder="Ask AI something..."
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runAICommand()}
                className="flex-1 border rounded px-3 py-2 text-sm bg-background text-foreground"
              />

              <SmartVoiceInput
                asButton
                value={command}
                onChange={(val) => setCommand(val)}
                onResult={handleVoiceResult}
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

              <Button
                onClick={runAICommand}
                disabled={loading}
                className="bg-primary text-primary-foreground hover:bg-blue-600 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1" ref={gridRef}>
        <GridLayout
          className="layout"
          cols={24}
          rowHeight={100}
          width={gridWidth || 1200}
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
