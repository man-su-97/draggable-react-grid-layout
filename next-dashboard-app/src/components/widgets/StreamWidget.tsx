"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StreamPlayer from "@/lib/StreamPlayer";

type StreamWidgetProps = {
  initialPath?: string;
};

export default function StreamWidget({ initialPath = "" }: StreamWidgetProps) {
  const [path, setPath] = useState<string>(initialPath);
  const [activePath, setActivePath] = useState<string | null>(null);

  return (
    <Card
      className="h-full flex flex-col overflow-hidden p-4 space-y-4"
    >
      <div className="flex space-x-2">
        <Input
          className="no-drag"
          placeholder="Enter OBS path or RTSP URL"
          value={path}
          onChange={(e) => setPath(e.target.value)}
        />
        <Button className="no-drag" onClick={() => setActivePath(path)}>
          Play
        </Button>
      </div>

      <div className="flex-1 bg-black rounded-md overflow-hidden">
        {activePath ? (
          <StreamPlayer streamPath={activePath} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Enter a path above and click Play
          </div>
        )}
      </div>
    </Card>
  );
}
