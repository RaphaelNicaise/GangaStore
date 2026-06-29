"use client"

import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface ProductImageGalleryProps {
  name: string
  images?: string[]
  promoLabel?: string
}

export function ProductImageGallery({ name, images = [], promoLabel }: ProductImageGalleryProps) {
  const galleryImages = useMemo(() => {
    const valid = images.filter(Boolean)
    return valid.length > 0 ? valid : ["/placeholder.svg"]
  }, [images])

  const [selectedIndex, setSelectedIndex] = useState(0)
  const thumbsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSelectedIndex(0)
  }, [galleryImages])

  useEffect(() => {
    const container = thumbsRef.current
    if (!container) return
    const active = container.querySelector<HTMLButtonElement>(`[data-thumb-index="${selectedIndex}"]`)
    active?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
  }, [selectedIndex])

  const move = (direction: -1 | 1) => {
    setSelectedIndex((current) => {
      const next = current + direction
      if (next < 0) return galleryImages.length - 1
      if (next >= galleryImages.length) return 0
      return next
    })
  }

  const currentImage = galleryImages[selectedIndex] ?? "/placeholder.svg"

  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[1.75rem] border border-border/70 bg-white p-2 sm:p-3 md:p-4 shadow-[0_20px_60px_rgba(22,22,22,0.08)]">
        <div className="relative aspect-square overflow-hidden rounded-[1.1rem] sm:rounded-[1.35rem] bg-[color:var(--color-pink-soft)]">
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-1/2 bg-[color:var(--color-pink)]"
            style={{ clipPath: "polygon(0 0, 100% 0, 100% 60%, 0 100%)" }}
          />
          <div className="dots-ink absolute right-6 top-6 h-16 w-16 opacity-50" aria-hidden />
          <div className="dots-ink absolute bottom-6 left-6 h-12 w-12 opacity-40" aria-hidden />

          <Image
            src={currentImage}
            alt={`${name} · imagen ${selectedIndex + 1}`}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
            className="relative object-contain p-8 sm:p-10"
            unoptimized={currentImage.startsWith("/uploads/")}
          />

          {promoLabel && (
            <div className="absolute left-4 top-4 rounded-full bg-ink px-4 py-2 text-xs font-bold uppercase tracking-wider text-white">
              {promoLabel}
            </div>
          )}

          {galleryImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => move(-1)}
                className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/85 text-ink shadow-sm backdrop-blur transition hover:bg-white"
                aria-label="Imagen anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/85 text-ink shadow-sm backdrop-blur transition hover:bg-white"
                aria-label="Imagen siguiente"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {galleryImages.length > 1 && (
        <div className="mt-4 rounded-[1.4rem] border border-border bg-muted/30 p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Más imágenes
            </p>
            <p className="text-xs text-muted-foreground">
              {selectedIndex + 1} / {galleryImages.length}
            </p>
          </div>

          <div
            ref={thumbsRef}
            className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {galleryImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                data-thumb-index={index}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  "group relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border bg-white transition-all sm:h-24 sm:w-24",
                  selectedIndex === index
                    ? "border-ink shadow-md"
                    : "border-border grayscale hover:border-ink/40 hover:grayscale-0",
                )}
                aria-label={`Ver imagen ${index + 1}`}
              >
                <Image
                  src={image}
                  alt={`${name} miniatura ${index + 1}`}
                  fill
                  sizes="96px"
                  className={cn(
                    "object-cover transition duration-300",
                    selectedIndex === index ? "grayscale-0" : "grayscale",
                  )}
                  unoptimized={image.startsWith("/uploads/")}
                />
                <span
                  className={cn(
                    "absolute inset-0 border-2 border-transparent transition",
                    selectedIndex === index && "border-ink",
                  )}
                  aria-hidden
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}