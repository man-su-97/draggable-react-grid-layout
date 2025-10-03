"use client";

import React from "react";

interface ChatWidgetProps {
  reply?: string;
}

export default function ChatWidget({ reply }: ChatWidgetProps) {
  return (
    <div className="w-full h-full p-4 bg-muted rounded-lg shadow flex items-start">
      <div className="flex flex-col space-y-2">
        <div className="font-semibold text-muted-foreground">AI Assistant</div>
        <div className="text-sm text-foreground whitespace-pre-line">
          {reply || "No reply available."}
        </div>
      </div>
    </div>
  );
}
