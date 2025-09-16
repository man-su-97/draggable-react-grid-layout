"use client";

type VideoWidgetProps = {
  src?: string;
  title?: string;
};

export default function VideoWidget({ src, title }: VideoWidgetProps) {
  console.log("video src -", src);
  return (
    <div className="w-full h-full flex flex-col bg-card rounded-md overflow-hidden border border-border">
      {title && (
        <h3 className="text-sm font-medium mb-2 px-2 text-card-foreground">
          {title}
        </h3>
      )}
      <video
        className="w-full h-full object-cover rounded-md"
        src={src ?? "/videos/ai_vdo.mp4"}
        autoPlay
        muted
        loop
        playsInline
        controls={false}
      />
    </div>
  );
}
