"use client"

import { CheckCircle2, ShoppingBag } from "lucide-react"
import { toast } from "sonner"
import { formatARS } from "@/lib/pricing"
import type { Product } from "@/lib/types"

export function showCartAddedToast(product: Product, quantity = 1) {
  toast.custom((id) => (
    <div className="flex min-w-[320px] items-center gap-3 rounded-[1.5rem] border border-ink/10 bg-white p-3 shadow-[0_20px_50px_rgba(22,22,22,0.16)]">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--color-pink)] text-ink">
        <CheckCircle2 className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Producto agregado
        </p>
        <p className="truncate text-sm font-semibold text-ink">
          {quantity} x {product.name}
        </p>
        <p className="text-xs text-muted-foreground">
          Mayorista desde {formatARS(product.wholesalePrice)}
        </p>
      </div>
      <a
        href="/carrito"
        onClick={() => toast.dismiss(id)}
        className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-ink px-3 py-2 text-xs font-semibold text-white transition-transform hover:-translate-y-0.5"
      >
        <ShoppingBag className="h-3.5 w-3.5" />
        Ver carrito
      </a>
    </div>
  ))
}