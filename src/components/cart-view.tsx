"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, ShoppingBag, Trash2, MessageCircle } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useCart } from "./cart-provider"
import { formatARS, getPriceBreakdown, tierLabel } from "@/lib/pricing"
import { dbProductToFrontend } from "@/lib/api-client"
import { showCartAddedToast } from "./cart-toast"
import { toast } from "sonner"
import type { Product } from "@/lib/types"

function normalizeProductsResponse(payload: unknown): Product[] {
  const raw = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown[] } | null)?.data)
      ? (payload as { data: unknown[] }).data
      : []

  return raw.flatMap((item) => {
    try {
      return [dbProductToFrontend(item as Parameters<typeof dbProductToFrontend>[0])]
    } catch {
      return []
    }
  })
}

export function CartView() {
  const { items, setQuantity, removeItem, clear, getProduct, addItem, syncProducts } = useCart()
  const [customerFirstName, setCustomerFirstName] = useState("")
  const [customerLastName, setCustomerLastName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [sendingOrder, setSendingOrder] = useState(false)
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([])

  useEffect(() => {
    fetch("/api/products?limit=200&active=true")
      .then((response) => response.json())
      .then((json) => {
        setCatalogProducts(normalizeProductsResponse(json))
      })
      .catch(() => undefined)
  }, [])

  // Use a ref so the sync loop always reads the latest items/callbacks
  // without re-registering the effect (and restarting the interval) on every change.
  const itemsRef = useRef(items)
  const getProductRef = useRef(getProduct)
  const removeItemRef = useRef(removeItem)
  const setQuantityRef = useRef(setQuantity)
  const syncProductsRef = useRef(syncProducts)
  useEffect(() => { itemsRef.current = items }, [items])
  useEffect(() => { getProductRef.current = getProduct }, [getProduct])
  useEffect(() => { removeItemRef.current = removeItem }, [removeItem])
  useEffect(() => { setQuantityRef.current = setQuantity }, [setQuantity])
  useEffect(() => { syncProductsRef.current = syncProducts }, [syncProducts])

  useEffect(() => {
    let cancelled = false

    const syncCartState = async () => {
      const currentItems = itemsRef.current
      if (currentItems.length === 0) return

      try {
        const ids = currentItems.map((item) => item.productId)
        const response = await fetch(`/api/products?ids=${ids.join(",")}`)
        const json = await response.json().catch(() => ({}))
        const latestProducts = normalizeProductsResponse(json)

        if (cancelled) return

        if (latestProducts.length > 0) {
          syncProductsRef.current(latestProducts)
        }

        const latestById = new Map(latestProducts.map((product) => [product.id, product]))
        let pricesUpdated = false

        for (const item of currentItems) {
          const previous = getProductRef.current(item.productId)
          const latest = latestById.get(item.productId)

          if (!latest || latest.active === false || latest.stock <= 0) {
            removeItemRef.current(item.productId)
            toast.error(previous ? `${previous.name} dejó de estar disponible y se removió del carrito.` : "Un producto dejó de estar disponible y se removió del carrito.")
            continue
          }

          if (item.quantity > latest.stock) {
            setQuantityRef.current(item.productId, latest.stock)
            toast.error(`${latest.name} ahora tiene ${latest.stock} unidad${latest.stock === 1 ? "" : "es"} disponible${latest.stock === 1 ? "" : "s"}. Ajustamos tu carrito.`)
          }

          if (
            previous &&
            (previous.retailPrice !== latest.retailPrice ||
              previous.wholesalePrice !== latest.wholesalePrice ||
              previous.promotion?.tipo !== latest.promotion?.tipo ||
              previous.promotion?.valor !== latest.promotion?.valor ||
              previous.promotion?.valor_secundario !== latest.promotion?.valor_secundario ||
              previous.promotion?.activa !== latest.promotion?.activa)
          ) {
            pricesUpdated = true
          }
        }

        if (pricesUpdated) {
          toast.info("Actualizamos precios y promociones del carrito con la disponibilidad más reciente.")
        }
      } catch {
        // silent retry on next interval
      }
    }

    // Initial check after a short delay to let the cart hydrate first
    const initialTimer = window.setTimeout(() => { void syncCartState() }, 500)
    const interval = window.setInterval(() => {
      void syncCartState()
    }, 10_000)

    return () => {
      cancelled = true
      window.clearTimeout(initialTimer)
      window.clearInterval(interval)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const lines = useMemo(
    () =>
      items
        .map((it) => {
          const product = getProduct(it.productId)
          if (!product) return null
          const breakdown = getPriceBreakdown(product, it.quantity)
          return { product, quantity: it.quantity, breakdown }
        })
        .filter(<T,>(v: T): v is NonNullable<T> => v !== null),
    [items, getProduct],
  )

  const totalUnits = lines.reduce((acc, l) => acc + l.quantity, 0)
  const subtotalRaw = lines.reduce((acc, l) => acc + l.breakdown.subtotal, 0)
  const tierDiscount = lines.reduce((acc, l) => acc + l.breakdown.tierDiscount, 0)
  const promoDiscount = lines.reduce((acc, l) => acc + l.breakdown.promoDiscount, 0)
  const total = lines.reduce((acc, l) => acc + l.breakdown.total, 0)

  const recommendedProducts = useMemo(() => {
    if (catalogProducts.length === 0 || lines.length === 0) return []
    const cartIds = new Set(lines.map((line) => line.product.id))
    const brands = new Set(lines.map((line) => line.product.brand?.toLowerCase()).filter(Boolean))
    const categories = new Set(lines.map((line) => line.product.categoryId))
    const subcategories = new Set(lines.map((line) => line.product.subcategoryId).filter(Boolean))

    return catalogProducts
      .filter((product) => !cartIds.has(product.id))
      .map((product) => {
        let score = 0
        const reasons: string[] = []
        if (product.brand && brands.has(product.brand.toLowerCase())) {
          score += 4
          reasons.push("Misma marca")
        }
        if (categories.has(product.categoryId)) {
          score += 3
          reasons.push("Misma categoría")
        }
        if (product.subcategoryId && subcategories.has(product.subcategoryId)) {
          score += 2
          reasons.push("Parecido al que elegiste")
        }
        if (product.promotion?.activa) {
          score += 1
          reasons.push("Con promo activa")
        }
        return { product, score, reasons }
      })
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score || left.product.name.localeCompare(right.product.name))
      .slice(0, 4)
      .map((item) => ({ product: item.product, reasons: item.reasons.slice(0, 2) }))
  }, [catalogProducts, lines])

  const handleSendWhatsApp = async () => {
    if (!customerFirstName.trim() || !customerLastName.trim()) {
      toast.error("Completá nombre y apellido")
      return
    }
    if (!customerPhone.trim()) {
      toast.error("Completá tu teléfono")
      return
    }
    if (items.length === 0) {
      toast.error("El carrito está vacío")
      return
    }

    setSendingOrder(true)
    try {
      const res = await fetch("/api/checkout-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerFirstName: customerFirstName.trim(),
          customerLastName: customerLastName.trim(),
          customerPhone: customerPhone.trim(),
          items: items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
          })),
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json.error ?? "No se pudo generar el pedido")
        return
      }

      const whatsappUrl = json.whatsappUrl as string | undefined
      if (!whatsappUrl) {
        toast.error("No se pudo generar el enlace de WhatsApp")
        return
      }

      window.location.href = whatsappUrl
      toast.success(`Pedido ${json.code} generado. Redirigiendo a WhatsApp.`)
      clear()
    } catch {
      toast.error("Error de conexión. Intentá nuevamente.")
    } finally {
      setSendingOrder(false)
    }
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--color-pink)]">
          <ShoppingBag className="h-8 w-8 text-ink" />
        </div>
        <h2 className="mt-6 font-display text-3xl text-ink">Tu carrito está vacío</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sumá productos desde el catálogo para armar tu pedido mayorista.
        </p>
        <Link
          href="/catalogo"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white"
        >
          Ir al catálogo
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 sm:gap-8 sm:py-10 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {lines.map(({ product, quantity, breakdown }) => (
          <article
            key={product.id}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-3 sm:gap-4 sm:p-4 sm:flex-row sm:items-center"
          >
            <Link
              href={`/producto/${product.slug}`}
              className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-xl bg-[color:var(--color-pink-soft)]"
            >
              <Image
                src={product.imageUrl || "/placeholder.svg"}
                alt={product.name}
                fill
                sizes="112px"
                className="object-contain p-2 sm:p-3"
              />
            </Link>
            <div className="flex-1">
              <Link
                href={`/producto/${product.slug}`}
                className="text-sm sm:text-base font-semibold text-ink hover:underline line-clamp-2"
              >
                {product.name}
              </Link>
              <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground">{tierLabel(breakdown.tier)}</p>
              <p className="mt-1 text-xs sm:text-sm">
                <span className="font-semibold text-ink">{formatARS(breakdown.unitPrice)}</span>
                <span className="text-muted-foreground"> c/u</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <div className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full border border-border bg-white p-0.5 sm:p-1">
                <button
                  type="button"
                  onClick={() => setQuantity(product.id, quantity - 1)}
                  className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full hover:bg-muted"
                  aria-label="Restar"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-6 sm:w-8 text-center text-xs sm:text-sm font-semibold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(product.id, quantity + 1)}
                  className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full hover:bg-muted"
                  aria-label="Sumar"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <div className="text-right">
                <p className="font-display text-lg sm:text-xl text-ink">{formatARS(breakdown.total)}</p>
                {breakdown.tierDiscount + breakdown.promoDiscount > 0 && (
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                    -{formatARS(breakdown.tierDiscount + breakdown.promoDiscount)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeItem(product.id)}
                className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-ink"
                aria-label={`Eliminar ${product.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </article>
        ))}

        <button
          type="button"
          onClick={clear}
          className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
        >
          Vaciar carrito
        </button>

        {recommendedProducts.length > 0 && (
          <section className="rounded-[1.75rem] border border-border bg-[color:var(--color-pink-soft)] p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/60">
                  Gancho comercial
                </p>
                <h3 className="mt-1 font-display text-3xl text-ink">También te puede servir</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sugerencias relacionadas con lo que ya agregaste para empujar una compra más completa.
                </p>
              </div>
              <Link href="/catalogo" className="text-sm font-semibold text-ink hover:underline">
                Ver catálogo
              </Link>
            </div>

            <div className="mt-5 flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-2 xl:grid-cols-4 lg:overflow-visible lg:pb-0">
              {recommendedProducts.map(({ product, reasons }) => (
                <article key={product.id} className="min-w-[78%] rounded-2xl border border-white/70 bg-white p-3 shadow-sm sm:min-w-[46%] lg:min-w-0">
                  <Link href={`/producto/${product.slug}`} className="relative block aspect-square overflow-hidden rounded-xl bg-[color:var(--color-pink-soft)]">
                    <Image src={product.imageUrl || "/placeholder.svg"} alt={product.name} fill className="object-contain p-3" sizes="220px" />
                  </Link>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {reasons.map((reason) => (
                      <span key={`${product.id}-${reason}`} className="rounded-full border border-ink/10 bg-[color:var(--color-pink-soft)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-ink/70">
                        {reason}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm font-semibold text-ink">{product.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatARS(product.wholesalePrice)}</p>
                  <button
                    type="button"
                    onClick={() => {
                      addItem(product.id, 1, product)
                      showCartAddedToast(product, 1)
                    }}
                    className="mt-3 inline-flex w-full cursor-pointer items-center justify-center rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white transition-transform hover:-translate-y-0.5"
                  >
                    Agregar sugerido
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Resumen */}
      <aside className="h-fit rounded-2xl border-2 border-ink bg-white p-4 sm:p-5 lg:sticky lg:top-24">
        <h2 className="font-display text-xl sm:text-2xl text-ink">RESUMEN</h2>
        <p className="mt-2 text-[11px] sm:text-xs text-muted-foreground">
          Revisamos disponibilidad y precios cada 10 segundos mientras tenés el carrito abierto.
        </p>
        <div className="mt-4 space-y-2 text-xs sm:text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Unidades</span>
            <span className="font-semibold text-ink">{totalUnits}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-ink">{formatARS(subtotalRaw)}</span>
          </div>
          {tierDiscount > 0 && (
            <div className="flex items-center justify-between text-[color:var(--color-ink)]/80">
              <span>Descuento mayorista (5%)</span>
              <span>-{formatARS(tierDiscount)}</span>
            </div>
          )}
          {promoDiscount > 0 && (
            <div className="flex items-center justify-between text-[color:var(--color-ink)]/80">
              <span>Promociones</span>
              <span>-{formatARS(promoDiscount)}</span>
            </div>
          )}
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-end justify-between">
            <span className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">Total</span>
            <span className="font-display text-2xl sm:text-3xl text-ink">{formatARS(total)}</span>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div>
            <label htmlFor="cart-first-name" className="text-xs font-semibold text-ink">
              Nombre
            </label>
            <input
              id="cart-first-name"
              value={customerFirstName}
              onChange={(e) => setCustomerFirstName(e.target.value)}
              placeholder="Ej: Juan"
              className="mt-1 h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <div>
            <label htmlFor="cart-last-name" className="text-xs font-semibold text-ink">
              Apellido
            </label>
            <input
              id="cart-last-name"
              value={customerLastName}
              onChange={(e) => setCustomerLastName(e.target.value)}
              placeholder="Ej: Pérez"
              className="mt-1 h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <div>
            <label htmlFor="cart-phone" className="text-xs font-semibold text-ink">
              Teléfono
            </label>
            <input
              id="cart-phone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Ej: 11 1234 5678"
              className="mt-1 h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>

          <button
            type="button"
            onClick={handleSendWhatsApp}
            disabled={sendingOrder}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {sendingOrder ? "Generando pedido..." : "Enviar pedido por WhatsApp"}
          </button>
        </div>

        <p className="mt-3 text-center text-[10px] sm:text-[11px] text-muted-foreground">
          Te confirmamos disponibilidad y coordinamos el envío.
        </p>
      </aside>
    </div>
  )
}
