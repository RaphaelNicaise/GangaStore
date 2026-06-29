"use client"

import Image from "next/image"
import Link from "next/link"
import { Plus, ShoppingBag } from "lucide-react"
import { useState } from "react"
import { useCart } from "./cart-provider"
import { showCartAddedToast } from "./cart-toast"
import { formatARS, getPromoLabel } from "@/lib/pricing"
import { cn } from "@/lib/utils"
import type { Product } from "@/lib/types"

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart()
  const [isAdding, setIsAdding] = useState(false)
  const promo = product.promotion?.activa ? product.promotion : undefined

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <Link
        href={`/producto/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-[color:var(--color-pink-soft)]"
      >
        <span
          aria-hidden
          className="absolute -left-10 top-10 h-40 w-40 rotate-[-25deg] bg-white/60"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 35%, 0 100%)" }}
        />
        <div aria-hidden className="dots-ink pointer-events-none absolute right-3 top-3 h-10 w-10 opacity-50" />

        <Image
          src={product.imageUrl || "/placeholder.svg"}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
          className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
        />

        {promo && (
          <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-ink px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
            {getPromoLabel(promo)}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3 sm:gap-3 sm:p-4">
        <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>{product.subcategoryName || product.categoryName || "Sin categoría"}</span>
          {product.brand && <span className="font-semibold text-ink/70">{product.brand}</span>}
        </div>

        <Link href={`/producto/${product.slug}`} className="line-clamp-2 text-sm font-semibold text-ink hover:underline">
          {product.name}
        </Link>

        <p className="hidden text-xs text-muted-foreground sm:line-clamp-2 sm:block">{product.description}</p>

        <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="leading-tight">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground">Mayorista 3+</p>
            <p className="font-display text-xl sm:text-2xl text-ink">{formatARS(product.wholesalePrice)}</p>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground line-through">{formatARS(product.retailPrice)}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsAdding(true)
              addItem(product.id, 1, product)
              showCartAddedToast(product, 1)
              window.setTimeout(() => setIsAdding(false), 280)
            }}
            className={cn(
              "inline-flex h-10 sm:h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-ink px-3 sm:px-4 text-xs sm:text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink-deep focus:outline-none focus:ring-2 focus:ring-[color:var(--color-pink)] sm:w-auto",
              isAdding && "scale-105 bg-[color:var(--color-pink)] text-ink",
            )}
            aria-label={`Agregar ${product.name} al carrito`}
          >
            {isAdding ? <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            <span>Agregar</span>
          </button>
        </div>
      </div>
    </article>
  )
}
