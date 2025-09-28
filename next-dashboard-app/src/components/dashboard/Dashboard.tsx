"use client";

import React, { useEffect, useRef, useState } from "react";
import GridLayout, { Layout } from "react-grid-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import WidgetCard from "./WidgetCard";
import { Widget, WidgetResponse } from "@/types/types";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Loader2, Paperclip, X } from "lucide-react";
import SmartVoiceInput from "../VoiceInput/VoiceInput";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { buildDemoWidget } from "@/components/dashboard/DemoWidget";
import { nextLayout } from "@/lib/layoutUtils";

// -----------------------------
// Types
// -----------------------------
interface ChatMessage {
  role: "user" | "model";
  text: string;
  timestamp?: number;
}

const STORAGE_KEY = "dashboard-widgets";

// -----------------------------
// Responsive container width
// -----------------------------
function useContainerWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

// -----------------------------
// Component
// -----------------------------
export default function Dashboard() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const [chatOpen, setChatOpen] = useState(false);
  const [chat, setChat] = useState<ChatMessage[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [conversationId] = useState<string>(() => crypto.randomUUID());

  const { ref: gridRef, width: gridWidth } = useContainerWidth();

  // -----------------------------
  // Widget persistence
  // -----------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed: Widget[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWidgets(parsed);
          return;
        }
      } catch {
        console.warn("Resetting dashboard to empty");
      }
    }
    setWidgets([]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
  }, [widgets]);

  const resetDashboard = () => {
    setWidgets([]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  };

  // -----------------------------
  // Chat history sync
  // -----------------------------
  useEffect(() => {
    if (!chatOpen) return;
    (async () => {
      try {
        const res = await fetch(`/api/generate-widget?conversationId=${conversationId}`);
        if (!res.ok) return;
        const data = await res.json();

        if (Array.isArray(data.history)) {
          const serverMsgs: ChatMessage[] = data.history.map((msg: any) => ({
            role: msg.role,
            text: msg.parts?.[0]?.text ?? "",
            timestamp: msg.timestamp,
          }));

          // merge + dedupe by role+text+timestamp
          setChat((prev) => {
            const merged = [...prev, ...serverMsgs];
            const seen = new Set<string>();
            return merged.filter((m) => {
              const key = `${m.role}-${m.text}-${m.timestamp ?? ""}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
          });
        }
      } catch (err) {
        console.error("Failed to load chat history", err);
      }
    })();
  }, [chatOpen, conversationId]);

  // -----------------------------
  // AI Command Handler
  // -----------------------------
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

      const res = await fetch("/api/generate-widget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: command,
          base64File,
          mimeType,
          fileName,
          conversationId,
        }),
      });

      const data: WidgetResponse | WidgetResponse[] = await res.json();

      if (Array.isArray(data)) {
        data.forEach(handleResponse);
      } else {
        handleResponse(data);
      }
    } catch (err) {
      console.error("AI command error", err);
      alert("Something went wrong while talking to AI.");
    } finally {
      setCommand("");
      setAttachedFile(null);
      setLoading(false);
    }
  }

  function handleResponse(resp: WidgetResponse) {
    if (!resp) return;

    // if Gemini sends plain text as chat
    if (resp.type === "chat") {
      const now = Date.now();
      const reply = resp.payload.reply ?? "I didn’t quite get that.";
      setChat((prev) => [...prev, { role: "model", text: reply, timestamp: now }]);
    }
    // any actual widget → add to grid
    else if ("type" in resp) {
      addWidget(resp as Widget);
    }
    // fallback: show text
    else {
      setChat((prev) => [
        ...prev,
        { role: "model", text: "I didn’t quite get that.", timestamp: Date.now() },
      ]);
    }
  }

  // -----------------------------
  // Widget helpers
  // -----------------------------
  function addWidget(widget: Widget) {
    if (widget.type === "chat") return;
    setWidgets((prev) => {
      const layout = nextLayout(prev);
      widget.layout = { ...layout, i: widget.id };
      return [...prev, widget];
    });
  }

  const removeWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  const updateLayout = (nextLayout: Layout[]) => {
    setWidgets((prev) =>
      prev.map((widget) => {
        const updated = nextLayout.find((l) => l.i === widget.id);
        return updated
          ? { ...widget, layout: { ...widget.layout, ...updated } }
          : widget;
      })
    );
  };

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] bg-background text-foreground">
      {/* Top Bar */}
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
                  onClick={() =>
                    addWidget(buildDemoWidget(type as Widget["type"], widgets))
                  }
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)} Widget
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Chat Modal */}
      {chatOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-background text-foreground w-full max-w-2xl h-[70vh] rounded-lg shadow-lg flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center border-b px-4 py-2">
              <h3 className="font-semibold">AI Assistant</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setChatOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages */}
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

            {/* Input */}
            <div className="flex gap-2 p-3 border-t items-center">
              <Input
                type="text"
                placeholder="Ask AI something..."
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runAICommand()}
                className="flex-1"
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

      {/* Grid */}
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
