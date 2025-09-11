'use client'

export default function VideoWidget() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <video
        className="w-full h-full rounded-md"
        src="/video/ai_vdo.mp4"
        autoPlay
        muted
        loop
        controls={false}
      />
    </div>
  )
}
