'use client'

import Image from 'next/image'
import { useState } from 'react'

interface ImageGalleryProps {
  images: string[]
  name: string
}

export default function ImageGallery({ images, name }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <div className="relative w-full aspect-square rounded-xl overflow-hidden">
        <Image
          src={images[activeIndex] || 'https://placehold.co/600x600/e2e8f0/64748b'}
          alt={name}
          width={600}
          height={600}
          unoptimized
          className="w-full h-full object-cover rounded-xl"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 flex-wrap">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative overflow-hidden rounded-lg cursor-pointer border-2 transition-all ${
                i === activeIndex
                  ? 'ring-2 ring-[#3762cc] border-transparent'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Image
                src={src}
                alt={`${name} - ảnh ${i + 1}`}
                width={80}
                height={80}
                unoptimized
                className="w-20 h-20 object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
