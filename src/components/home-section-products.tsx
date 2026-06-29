"use client"

import { ArrowLeft, ArrowRight } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { ProductCard } from "@/components/product-card"
import { cn } from "@/lib/utils"
import type { Product } from "@/lib/types"

interface HomeSectionProductsProps {
  products: Product[]
  enableDesktopCarousel?: boolean
  edgeFadeTone?: "white" | "pink"
  /** @deprecated Pink tone now maps to pink-soft automatically */
}

export function HomeSectionProducts({ products, enableDesktopCarousel = false, edgeFadeTone = "white" }: HomeSectionProductsProps) {
  const mobileRailRef = useRef<HTMLDivElement>(null)
  const desktopRailRef = useRef<HTMLDivElement>(null)
  const [mobilePage, setMobilePage] = useState(0)
  const [desktopPage, setDesktopPage] = useState(0)
  const mobileTotalPages = useMemo(() => Math.max(1, Math.ceil(products.length / 2)), [products.length])
  const desktopTotalPages = useMemo(() => Math.max(1, Math.ceil(products.length / 4)), [products.length])
  const desktopCarouselEnabled = enableDesktopCarousel && products.length > 4
  const edgeFadeFrom = edgeFadeTone === "pink" ? "var(--color-pink-soft)" : "#ffffff"

  useEffect(() => {
    setMobilePage(0)
    setDesktopPage(0)
    mobileRailRef.current?.scrollTo({ left: 0, behavior: "auto" })
    desktopRailRef.current?.scrollTo({ left: 0, behavior: "auto" })
  }, [products, desktopCarouselEnabled])

  const syncMobilePageFromScroll = () => {
    const rail = mobileRailRef.current
    if (!rail) return
    const nextPage = Math.round(rail.scrollLeft / Math.max(rail.clientWidth, 1))
    setMobilePage(Math.max(0, Math.min(mobileTotalPages - 1, nextPage)))
  }

  const syncDesktopPageFromScroll = () => {
    const rail = desktopRailRef.current
    if (!rail) return
    const nextPage = Math.round(rail.scrollLeft / Math.max(rail.clientWidth, 1))
    setDesktopPage(Math.max(0, Math.min(desktopTotalPages - 1, nextPage)))
  }

  const moveMobile = (direction: -1 | 1) => {
    const rail = mobileRailRef.current
    if (!rail) return
    rail.scrollBy({ left: direction * rail.clientWidth, behavior: "smooth" })
  }

  const moveDesktop = (direction: -1 | 1) => {
    const rail = desktopRailRef.current
    if (!rail) return
    rail.scrollBy({ left: direction * rail.clientWidth, behavior: "smooth" })
  }

  return (
    <>
      <div className="sm:hidden">
        <div className="relative">
          {products.length > 2 && (
            <>
              <button
                type="button"
                onClick={() => moveMobile(-1)}
                disabled={mobilePage === 0}
                className="absolute left-1 top-1/2 z-20 inline-flex h-9 w-9 sm:h-10 sm:w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-white/95 text-ink shadow-sm transition disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Productos anteriores"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => moveMobile(1)}
                disabled={mobilePage >= mobileTotalPages - 1}
                className="absolute right-1 top-1/2 z-20 inline-flex h-9 w-9 sm:h-10 sm:w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-white/95 text-ink shadow-sm transition disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Productos siguientes"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          <div
            ref={mobileRailRef}
            onScroll={syncMobilePageFromScroll}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {products.map((product) => (
              <div key={product.id} className="w-[calc(50%-0.5rem)] min-w-[calc(50%-0.5rem)] snap-start">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>

        {products.length > 2 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            {Array.from({ length: mobileTotalPages }).map((_, dotIndex) => (
              <button
                key={dotIndex}
                type="button"
                onClick={() => {
                  const rail = mobileRailRef.current
                  if (!rail) return
                  rail.scrollTo({ left: dotIndex * rail.clientWidth, behavior: "smooth" })
                }}
                className={cn(
                  "h-2.5 rounded-full transition-all",
                  dotIndex === mobilePage ? "w-8 bg-ink" : "w-2.5 bg-ink/25",
                )}
                aria-label={`Ir a la página ${dotIndex + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {desktopCarouselEnabled ? (
        <div className="relative hidden sm:block">
          <button
            type="button"
            onClick={() => moveDesktop(-1)}
            disabled={desktopPage === 0}
            className="absolute left-2 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-white text-ink shadow-sm transition disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Fila anterior"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => moveDesktop(1)}
            disabled={desktopPage >= desktopTotalPages - 1}
            className="absolute right-2 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-white text-ink shadow-sm transition disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Fila siguiente"
          >
            <ArrowRight className="h-4 w-4" />
          </button>

          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10"
            style={{ background: edgeFadeTone === "pink" ? "linear-gradient(to right, #e6a4bb, transparent)" : "linear-gradient(to right, #ffffff, transparent)" }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10"
            style={{ background: edgeFadeTone === "pink" ? "linear-gradient(to left, #e6a4bb, transparent)" : "linear-gradient(to left, #ffffff, transparent)" }}
          />

          <div
            ref={desktopRailRef}
            onScroll={syncDesktopPageFromScroll}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-14 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {products.map((product) => (
              <div key={product.id} className="flex-none basis-[calc((100%-1rem)/2)] snap-start lg:basis-[calc((100%-3rem)/4)]">
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          {products.length > 4 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              {Array.from({ length: desktopTotalPages }).map((_, dotIndex) => (
                <button
                  key={dotIndex}
                  type="button"
                  onClick={() => {
                    const rail = desktopRailRef.current
                    if (!rail) return
                    rail.scrollTo({ left: dotIndex * rail.clientWidth, behavior: "smooth" })
                  }}
                  className={cn(
                    "h-2.5 rounded-full transition-all",
                    dotIndex === desktopPage ? "w-8 bg-ink" : "w-2.5 bg-ink/25",
                  )}
                  aria-label={`Ir al slide ${dotIndex + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="hidden sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {products.map((product) => (
            <div key={product.id}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </>
  )
}