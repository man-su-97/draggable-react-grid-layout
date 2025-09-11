'use client'

import Image from "next/image"

export default function ImageWidget() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <Image
        src={"https://picsum.photos/800/600"}
        alt="Demo Image Widget"
        className="w-full h-full object-cover rounded-md"
        width={800}
        height={600}
      />
    </div>
  )
}
