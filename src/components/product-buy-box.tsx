"use client"

import { useState } from "react"
import { Minus, Plus, ShoppingBag } from "lucide-react"
import { useCart } from "./cart-provider"
import { showCartAddedToast } from "./cart-toast"
import { formatARS, getPriceBreakdown, tierLabel } from "@/lib/pricing"
import { cn } from "@/lib/utils"
import type { Product } from "@/lib/types"

export function ProductBuyBox({ product }: { product: Product }) {
  const { addItem } = useCart()
  const [qty, setQty] = useState(3)
  const [isAdding, setIsAdding] = useState(false)

  const breakdown = getPriceBreakdown(product, qty)

  const dec = () => setQty((q) => Math.max(1, q - 1))
  const inc = () => setQty((q) => Math.min(product.stock || 999, q + 1))

  return (
    <div className="mt-8 rounded-2xl border-2 border-ink bg-white p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {tierLabel(breakdown.tier)}
          </p>
          <p className="font-display text-3xl sm:text-4xl leading-none text-ink">{formatARS(breakdown.total)}</p>
          {breakdown.tierDiscount + breakdown.promoDiscount > 0 && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Ahorrás {formatARS(breakdown.tierDiscount + breakdown.promoDiscount)} en este pedido
            </p>
          )}
        </div>

        <div className="inline-flex w-full sm:w-auto items-center gap-1 rounded-full border border-border bg-white p-1">
          <button
            type="button"
            onClick={dec}
            className="inline-flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-full hover:bg-muted"
            aria-label="Restar"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
            className="flex-1 sm:w-12 border-0 bg-transparent text-center text-base font-semibold focus:outline-none"
            aria-label="Cantidad"
          />
          <button
            type="button"
            onClick={inc}
            className="inline-flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-full hover:bg-muted"
            aria-label="Sumar"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          setIsAdding(true)
          addItem(product.id, qty, product)
          showCartAddedToast(product, qty)
          window.setTimeout(() => setIsAdding(false), 320)
        }}
        className={cn(
          "mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-ink py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5",
          isAdding && "scale-[1.02] bg-[color:var(--color-pink)] text-ink",
        )}
      >
        <ShoppingBag className="h-4 w-4" /> Agregar {qty} al carrito
      </button>

      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        Stock disponible: {product.stock} unidades
      </p>
    </div>
  )
}
