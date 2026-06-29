"use client"

import { useMemo, useState } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { ProductCard } from "./product-card"
import { cn } from "@/lib/utils"
import type { Category, Product } from "@/lib/types"

type SortKey = "destacados" | "precio-asc" | "precio-desc" | "nombre"

export function CatalogView({
  products,
  categories,
}: {
  products: Product[]
  categories: Category[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const initialCategory = searchParams.get("categoria") ?? ""
  const initialSubcategory = searchParams.get("subcategoria") ?? ""
  const initialSearch = searchParams.get("q") ?? ""
  const initialBrand = searchParams.get("marca") ?? ""
  const initialOnlyPromo = searchParams.get("promo") === "1"

  const availableBrands = useMemo(
    () => Array.from(new Set(products.map((product) => product.brand).filter(Boolean))).sort(),
    [products],
  )
  const priceBounds = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 0 }
    const prices = products.map((product) => product.wholesalePrice)
    return { min: Math.min(...prices), max: Math.max(...prices) }
  }, [products])

  const [categoryId, setCategoryId] = useState(
    categories.find((c) => c.slug === initialCategory)?.id ?? "",
  )
  const [subcategoryId, setSubcategoryId] = useState(initialSubcategory)
  const [search, setSearch] = useState(initialSearch)
  const [sort, setSort] = useState<SortKey>("destacados")
  const [onlyPromo, setOnlyPromo] = useState(initialOnlyPromo)
  const [brand, setBrand] = useState(initialBrand)
  const [minPrice, setMinPrice] = useState(Number(searchParams.get("precioMin")) || priceBounds.min)
  const [maxPrice, setMaxPrice] = useState(Number(searchParams.get("precioMax")) || priceBounds.max)
  const [drawer, setDrawer] = useState(false)

  const activeCategory = categories.find((c) => c.id === categoryId)

  const updateUrl = (next: {
    categoria?: string
    subcategoria?: string
    q?: string
    marca?: string
    promo?: string
    precioMin?: string
    precioMax?: string
  }) => {
    const params = new URLSearchParams(searchParams.toString())
    if (next.categoria !== undefined) {
      if (next.categoria) params.set("categoria", next.categoria)
      else params.delete("categoria")
    }
    if (next.subcategoria !== undefined) {
      if (next.subcategoria) params.set("subcategoria", next.subcategoria)
      else params.delete("subcategoria")
    }
    if (next.q !== undefined) {
      if (next.q) params.set("q", next.q)
      else params.delete("q")
    }
    if (next.marca !== undefined) {
      if (next.marca) params.set("marca", next.marca)
      else params.delete("marca")
    }
    if (next.promo !== undefined) {
      if (next.promo) params.set("promo", next.promo)
      else params.delete("promo")
    }
    if (next.precioMin !== undefined) {
      if (next.precioMin) params.set("precioMin", next.precioMin)
      else params.delete("precioMin")
    }
    if (next.precioMax !== undefined) {
      if (next.precioMax) params.set("precioMax", next.precioMax)
      else params.delete("precioMax")
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const filtered = useMemo(() => {
    let list = products.slice()
    if (categoryId) list = list.filter((p) => p.categoryId === categoryId)
    if (subcategoryId) list = list.filter((p) => p.subcategoryId === subcategoryId)
    if (onlyPromo) list = list.filter((p) => p.promotion?.activa)
    if (brand) list = list.filter((p) => p.brand?.toLowerCase() === brand.toLowerCase())
    list = list.filter((p) => p.wholesalePrice >= minPrice && p.wholesalePrice <= maxPrice)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q),
      )
    }
    switch (sort) {
      case "precio-asc":
        list.sort((a, b) => a.wholesalePrice - b.wholesalePrice)
        break
      case "precio-desc":
        list.sort((a, b) => b.wholesalePrice - a.wholesalePrice)
        break
      case "nombre":
        list.sort((a, b) => a.name.localeCompare(b.name))
        break
    }
    return list
  }, [categoryId, subcategoryId, search, sort, onlyPromo, brand, minPrice, maxPrice])

  const pricePercentMin = priceBounds.max === priceBounds.min
    ? 0
    : ((minPrice - priceBounds.min) / (priceBounds.max - priceBounds.min)) * 100
  const pricePercentMax = priceBounds.max === priceBounds.min
    ? 100
    : ((maxPrice - priceBounds.min) / (priceBounds.max - priceBounds.min)) * 100

  const Sidebar = (
    <aside className="space-y-6">
      <div>
        <h3 className="font-display text-lg tracking-wide text-ink">Categorías</h3>
        <ul className="mt-3 space-y-1">
          <li>
            <button
              type="button"
              onClick={() => {
                setCategoryId("")
                setSubcategoryId("")
                updateUrl({ categoria: "", subcategoria: "" })
              }}
              className={cn(
                "block w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                !categoryId
                  ? "bg-[color:var(--color-pink)] font-semibold text-ink"
                  : "text-ink/80 hover:bg-muted",
              )}
            >
              Todas
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => {
                  setCategoryId(c.id)
                  setSubcategoryId("")
                  updateUrl({ categoria: c.slug, subcategoria: "" })
                }}
                className={cn(
                  "block w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  categoryId === c.id
                    ? "bg-[color:var(--color-pink)] font-semibold text-ink"
                    : "text-ink/80 hover:bg-muted",
                )}
              >
                {c.name}
              </button>
              {categoryId === c.id && (
                <ul className="ml-3 mt-1 space-y-0.5 border-l border-border pl-3">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setSubcategoryId("")
                        updateUrl({ subcategoria: "" })
                      }}
                      className={cn(
                        "block w-full rounded px-2 py-1 text-left text-xs transition-colors",
                        !subcategoryId ? "font-semibold text-ink" : "text-muted-foreground hover:text-ink",
                      )}
                    >
                      Todas
                    </button>
                  </li>
                  {c.subcategories.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSubcategoryId(s.id)
                          updateUrl({ subcategoria: s.id })
                        }}
                        className={cn(
                          "block w-full rounded px-2 py-1 text-left text-xs transition-colors",
                          subcategoryId === s.id
                            ? "font-semibold text-ink"
                            : "text-muted-foreground hover:text-ink",
                        )}
                      >
                        {s.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-display text-lg tracking-wide text-ink">Filtros</h3>
        <label className="mt-3 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm">
          <input
            type="checkbox"
            checked={onlyPromo}
            onChange={(e) => {
              setOnlyPromo(e.target.checked)
              updateUrl({ promo: e.target.checked ? "1" : "" })
            }}
            className="h-4 w-4 rounded border-border text-ink accent-[color:var(--color-ink)]"
          />
          Solo con promoción
        </label>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-lg tracking-wide text-ink">Rango de precio</h3>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Mayorista
          </span>
        </div>
        <div className="mt-4 space-y-4 rounded-2xl border border-border bg-white p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-ink">
            <span>${minPrice.toLocaleString("es-AR")}</span>
            <span>${maxPrice.toLocaleString("es-AR")}</span>
          </div>
          <div className="relative h-10">
            <div className="absolute top-1/2 h-2 w-full -translate-y-1/2 rounded-full bg-muted" />
            <div
              className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-ink"
              style={{ left: `${pricePercentMin}%`, right: `${100 - pricePercentMax}%` }}
            />
            <input
              type="range"
              min={priceBounds.min}
              max={priceBounds.max}
              value={minPrice}
              onChange={(e) => {
                const nextValue = Math.min(Number(e.target.value), maxPrice)
                setMinPrice(nextValue)
                updateUrl({ precioMin: String(nextValue) })
              }}
              className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ink"
            />
            <input
              type="range"
              min={priceBounds.min}
              max={priceBounds.max}
              value={maxPrice}
              onChange={(e) => {
                const nextValue = Math.max(Number(e.target.value), minPrice)
                setMaxPrice(nextValue)
                updateUrl({ precioMax: String(nextValue) })
              }}
              className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[color:var(--color-pink)]"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-display text-lg tracking-wide text-ink">Marcas</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setBrand("")
              updateUrl({ marca: "" })
            }}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase transition-colors",
              !brand ? "border-ink bg-ink text-white" : "border-border text-ink/70 hover:border-ink/40",
            )}
          >
            Todas
          </button>
          {availableBrands.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setBrand(item || "")
                updateUrl({ marca: item || "" })
              }}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase transition-colors",
                brand === item
                  ? "border-ink bg-ink text-white"
                  : "border-border text-ink/70 hover:border-ink/40",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 sm:gap-8 sm:py-10 lg:grid-cols-[240px_1fr]">
      <div className="hidden lg:block">{Sidebar}</div>

      <div className="space-y-4 sm:space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                updateUrl({ q: e.target.value })
              }}
              placeholder="Buscar productos, marcas..."
              className="h-10 sm:h-11 w-full rounded-full border border-border bg-white pl-10 pr-4 text-xs sm:text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-[color:var(--color-pink)]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawer(true)}
              className="inline-flex h-10 sm:h-11 items-center gap-2 rounded-full border border-border bg-white px-3 sm:px-4 text-xs sm:text-sm font-medium lg:hidden"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Filtros
            </button>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-10 sm:h-11 rounded-full border border-border bg-white px-3 sm:px-4 text-xs sm:text-sm focus:border-ink focus:outline-none"
              aria-label="Ordenar"
            >
              <option value="destacados">Destacados</option>
              <option value="precio-asc">Precio: menor a mayor</option>
              <option value="precio-desc">Precio: mayor a menor</option>
              <option value="nombre">Nombre A-Z</option>
            </select>
          </div>
        </div>

        {/* Active filters */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-muted-foreground">
          <span>{filtered.length} resultados</span>
          {activeCategory && (
            <span className="rounded-full bg-[color:var(--color-pink)] px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold text-ink">
              {activeCategory.name}
            </span>
          )}
          {subcategoryId && activeCategory && (
            <span className="rounded-full border border-border px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold text-ink">
              {activeCategory.subcategories.find((s) => s.id === subcategoryId)?.name}
            </span>
          )}
          {brand && (
            <span className="rounded-full border border-border px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold text-ink">
              {brand}
            </span>
          )}
          {(minPrice !== priceBounds.min || maxPrice !== priceBounds.max) && (
            <span className="rounded-full border border-border px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold text-ink">
              ${minPrice.toLocaleString("es-AR")} - ${maxPrice.toLocaleString("es-AR")}
            </span>
          )}
          {(categoryId || subcategoryId || search || onlyPromo || brand || minPrice !== priceBounds.min || maxPrice !== priceBounds.max) && (
            <button
              type="button"
              onClick={() => {
                setCategoryId("")
                setSubcategoryId("")
                setSearch("")
                setOnlyPromo(false)
                setBrand("")
                setMinPrice(priceBounds.min)
                setMaxPrice(priceBounds.max)
                updateUrl({ categoria: "", subcategoria: "", q: "", promo: "", marca: "", precioMin: "", precioMax: "" })
              }}
              className="ml-1 inline-flex items-center gap-0.5 rounded-full border border-border px-2.5 sm:px-3 py-1 hover:bg-muted"
            >
              Limpiar <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white py-20 text-center">
            <p className="font-display text-2xl text-ink">Sin resultados</p>
            <p className="mt-2 text-sm text-muted-foreground">Probá ajustar los filtros o la búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-xl text-ink">Filtros</p>
              <button
                type="button"
                onClick={() => setDrawer(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {Sidebar}
          </div>
        </div>
      )}
    </div>
  )
}
