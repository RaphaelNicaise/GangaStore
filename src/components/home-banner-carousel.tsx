"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { HomeBanner } from "@/lib/types"

export function HomeBannerCarousel({ banners }: { banners: HomeBanner[] }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (banners.length <= 1) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % banners.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [banners.length])

  if (banners.length === 0) return null

  const current = banners[index] ?? banners[0]

  const move = (direction: -1 | 1) => {
    setIndex((currentIndex) => {
      if (direction === 1) return (currentIndex + 1) % banners.length
      return (currentIndex - 1 + banners.length) % banners.length
    })
  }

  return (
    <section className="relative overflow-hidden bg-white pb-6 sm:pb-8 pt-4 sm:pt-6">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6">
        <div className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] border border-ink/10 bg-ink text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(216,135,163,0.12),transparent_60%)]" />
          <div className="absolute left-6 top-6 h-20 w-20 rounded-full bg-white/[0.03] blur-2xl" aria-hidden />

          {banners.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => move(-1)}
                className="absolute left-1 sm:left-2 md:left-3 top-1/2 z-10 inline-flex h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-ink/45 text-white backdrop-blur transition-colors hover:bg-white/18"
                aria-label="Banner anterior"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                className="absolute right-1 sm:right-2 md:right-3 top-1/2 z-10 inline-flex h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-ink/45 text-white backdrop-blur transition-colors hover:bg-white/18"
                aria-label="Banner siguiente"
              >
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
              </button>
            </>
          )}

          <div className="relative grid gap-6 px-6 py-8 sm:px-12 sm:py-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:px-20 lg:py-14">
            <div className="flex flex-col justify-center">
              {current.eyebrow && (
                <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80 backdrop-blur">
                  {current.eyebrow}
                </span>
              )}
              <h1 className="mt-3 max-w-2xl font-display text-2xl leading-[0.95] sm:text-4xl lg:text-6xl">
                {current.title}
              </h1>
              <p className="mt-3 max-w-xl text-xs leading-relaxed text-white/72 sm:text-sm lg:text-base">
                {current.description}
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
                <Link
                  href={current.href}
                  className="w-full sm:w-auto inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink transition-transform duration-300 hover:-translate-y-0.5"
                >
                  {current.buttonLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/catalogo"
                  className="w-full sm:w-auto inline-flex cursor-pointer items-center justify-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10"
                >
                  Ver catálogo completo
                </Link>
              </div>
            </div>

            <Link href={current.href} className="group relative hidden lg:block aspect-[4/3] w-full overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/6 lg:aspect-[5/4]">
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),transparent_60%)]" />
              <Image
                src={current.mobileImageUrl || current.imageUrl || "/placeholder.svg"}
                alt={current.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 45vw"
                priority
              />
            </Link>
          </div>

          {banners.length > 1 && (
            <div className="relative flex items-center justify-center border-t border-white/10 px-6 py-4 sm:px-8 lg:px-12">
              <div className="flex items-center gap-2">
                {banners.map((banner, bannerIndex) => (
                  <button
                    key={banner.id}
                    type="button"
                    onClick={() => setIndex(bannerIndex)}
                    className={cn(
                      "h-2.5 rounded-full transition-all",
                      bannerIndex === index ? "w-10 bg-white" : "w-2.5 bg-white/35 hover:bg-white/60",
                    )}
                    aria-label={`Ir al banner ${bannerIndex + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}