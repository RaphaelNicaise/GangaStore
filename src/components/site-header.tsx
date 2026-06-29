"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ChevronDown, ChevronRight, Percent, ShoppingBag } from "lucide-react"
import { Logo } from "./logo"
import { useCart } from "./cart-provider"
import { fetchCategories } from "@/lib/api-client"
import type { Category } from "@/lib/types"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/catalogo?promo=1", label: "% Ofertas" },
  { href: "/#como-comprar", label: "Como Comprar" },
  { href: "/#contacto", label: "Contacto" },
]

export function SiteHeader() {
  const { totalUnits, cartPulseKey } = useCart()
  const [categories, setCategories] = useState<Category[]>([])
  const [megaOpen, setMegaOpen] = useState(false)
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false)
  const [bumpCart, setBumpCart] = useState(false)
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id ?? "")
  const megaCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelMegaClose = useCallback(() => {
    if (megaCloseTimer.current) { clearTimeout(megaCloseTimer.current); megaCloseTimer.current = null }
  }, [])
  const scheduleMegaClose = useCallback(() => {
    cancelMegaClose()
    megaCloseTimer.current = setTimeout(() => setMegaOpen(false), 150)
  }, [cancelMegaClose])

  const activeCategory = useMemo(
    () => categories.find((category) => category.id === activeCategoryId) ?? categories[0],
    [activeCategoryId],
  )

  useEffect(() => {
    fetchCategories()
      .then((items) => {
        setCategories(items)
        setActiveCategoryId((current) => current || items[0]?.id || "")
      })
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (!cartPulseKey) return
    setBumpCart(true)
    const timeout = window.setTimeout(() => setBumpCart(false), 280)
    return () => window.clearTimeout(timeout)
  }, [cartPulseKey])

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[color:var(--color-ink)]/95 backdrop-blur text-white">
      <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between gap-3 px-3 sm:gap-4 sm:px-4 md:px-6">
        <Link href="/" className="shrink-0" aria-label="TermoStore - Inicio">
          <Logo variant="light" />
        </Link>

        <nav className="hidden items-center gap-5 lg:gap-7 lg:flex h-full" aria-label="Principal">
          <div className="relative h-full">
            <button
              type="button"
              onMouseEnter={() => { setMegaOpen(true); cancelMegaClose(); }}
              onMouseLeave={scheduleMegaClose}
              onClick={() => setMegaOpen((current) => !current)}
              className="group inline-flex h-full cursor-pointer items-center text-xs sm:text-sm font-semibold text-white/75 transition-colors hover:text-white"
            >
              <span className="relative flex items-center gap-1.5">
                Explorar categorias
                <ChevronDown className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform", megaOpen && "rotate-180")} />
                <span
                  className={cn(
                    "absolute inset-x-0 -bottom-1 h-0.5 origin-left bg-white transition-transform duration-300",
                    megaOpen ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                  )}
                />
              </span>
            </button>
          </div>

            {megaOpen && activeCategory && (
              <div
                className="fixed left-1/2 top-[calc(5rem+0.25rem)] z-50 grid w-[min(980px,calc(100vw-2rem))] -translate-x-1/2 grid-cols-[260px_1fr] overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-[0_30px_90px_rgba(22,22,22,0.18)]"
                onMouseEnter={cancelMegaClose}
                onMouseLeave={() => setMegaOpen(false)}
              >
                <div className="border-r border-border bg-[linear-gradient(180deg,#fff2f7_0%,#ffffff_100%)] p-3">
                  <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Principales
                  </p>
                  <div className="space-y-1">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onMouseEnter={() => setActiveCategoryId(category.id)}
                        className={cn(
                          "flex w-full cursor-pointer items-center justify-between rounded-2xl px-3 py-3 text-left text-sm font-semibold transition-colors",
                          activeCategoryId === category.id
                            ? "bg-ink text-white"
                            : "text-ink/78 hover:bg-white hover:text-ink",
                        )}
                      >
                        {category.name}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-pink)]">
                        Navegacion rapida
                      </p>
                      <h3 className="mt-2 font-display text-4xl text-ink">{activeCategory.name}</h3>
                      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                        Elegi una subcategoria y aterriza directo en el catalogo filtrado.
                      </p>
                    </div>
                    <Link
                      href={`/catalogo?categoria=${activeCategory.slug}`}
                      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-[color:var(--color-pink)]/25"
                    >
                      Ver categoria
                    </Link>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {activeCategory.subcategories.map((subcategory) => (
                      <Link
                        key={subcategory.id}
                        href={`/catalogo?categoria=${activeCategory.slug}&subcategoria=${subcategory.id}`}
                        className="group rounded-2xl border border-border bg-white px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-md"
                      >
                        <p className="text-sm font-semibold text-ink">{subcategory.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground group-hover:text-ink/70">
                          Ir al listado filtrado
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group inline-flex h-full items-center text-sm font-semibold text-white/75 transition-colors hover:text-white"
            >
              <span className="relative">
                {link.label}
                <span className="absolute inset-x-0 -bottom-1 h-0.5 origin-left scale-x-0 bg-white transition-transform duration-300 group-hover:scale-x-100" />
              </span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/carrito"
            className={cn(
              "relative inline-flex h-10 items-center gap-2 rounded-full bg-[color:var(--color-pink)] px-4 text-sm font-semibold text-ink-deep transition-transform duration-300 hover:-translate-y-0.5",
              bumpCart && "scale-110",
            )}
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Carrito</span>
            <span
              className={cn(
                "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-ink px-1.5 text-[11px] font-bold text-white transition-transform duration-300",
                bumpCart && "scale-110",
                totalUnits === 0 && "opacity-60",
              )}
              aria-label={`${totalUnits} productos en el carrito`}
            >
              {totalUnits}
            </span>
          </Link>
        </div>
      </div>

      {/* Mobile secondary bar — always visible on mobile */}
      <div className="border-t border-white/10 bg-[color:var(--color-ink-deep)] lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2.5 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileCategoriesOpen((current) => !current)}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/20 px-3 py-2 text-sm font-semibold text-white"
          >
            Explorar categorias
            <ChevronDown className={cn("h-4 w-4 transition-transform", mobileCategoriesOpen && "rotate-180")} />
          </button>
          <Link
            href="/catalogo?promo=1"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-[color:var(--color-pink)] px-3 py-2 text-sm font-semibold text-ink"
          >
            <Percent className="h-4 w-4" />
            Ofertas
          </Link>
        </div>
      </div>

      {/* Mobile categories dropdown */}
      {mobileCategoriesOpen && (
        <div className="border-t border-white/10 bg-[color:var(--color-ink-deep)] lg:hidden">
          <div className="mx-auto max-w-7xl space-y-3 px-4 py-3 sm:px-6">
            {categories.map((c) => (
              <div key={c.id} className="rounded-2xl border border-white/10 p-3">
                <Link
                  href={`/catalogo?categoria=${c.slug}`}
                  onClick={() => setMobileCategoriesOpen(false)}
                  className="text-sm font-semibold text-white"
                >
                  {c.name}
                </Link>
                <div className="mt-2 flex flex-wrap gap-2">
                  {c.subcategories.slice(0, 6).map((subcategory) => (
                    <Link
                      key={subcategory.id}
                      href={`/catalogo?categoria=${c.slug}&subcategoria=${subcategory.id}`}
                      onClick={() => setMobileCategoriesOpen(false)}
                      className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold uppercase text-white/70"
                    >
                      {subcategory.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
