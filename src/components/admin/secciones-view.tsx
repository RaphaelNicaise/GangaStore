"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowDown, ArrowUp, Edit, ImagePlus, LayoutTemplate, Loader2, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { ImageUploader } from "@/components/admin/image-uploader"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { dbProductToFrontend } from "@/lib/api-client"
import type { HomeBanner, HomeSection, HomeSectionSource, Product, SiteContent } from "@/lib/types"

type AdminCategory = {
  id: string
  name: string
  slug: string
  children: { id: string; name: string; slug: string }[]
}

const emptyBanner: HomeBanner = {
  id: "",
  eyebrow: "",
  title: "",
  description: "",
  href: "/catalogo",
  buttonLabel: "Ver más",
  imageUrl: "",
  mobileImageUrl: "",
  active: true,
  order: 1,
}

const emptySection: HomeSection = {
  id: "",
  title: "",
  description: "",
  source: "manual",
  productIds: [],
  carousel: false,
  active: true,
  order: 1,
  limit: 8,
}

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

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

function arraysEqual(left: string[], right: string[]) {
  if (left.length !== right.length) return false
  return left.every((value, index) => value === right[index])
}

function shuffleProducts(list: Product[]) {
  const cloned = list.slice()
  for (let index = cloned.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[cloned[index], cloned[randomIndex]] = [cloned[randomIndex], cloned[index]]
  }
  return cloned
}

export function SeccionesView() {
  const [content, setContent] = useState<SiteContent>({ banners: [], sections: [] })
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [bannerModalOpen, setBannerModalOpen] = useState(false)
  const [sectionModalOpen, setSectionModalOpen] = useState(false)
  const [bannerDraft, setBannerDraft] = useState<HomeBanner>(emptyBanner)
  const [sectionDraft, setSectionDraft] = useState<HomeSection>(emptySection)
  const [productSearch, setProductSearch] = useState("")

  useEffect(() => {
    Promise.all([
      fetch("/api/site-content").then((response) => response.json()),
      fetch("/api/categories").then((response) => response.json()),
      fetch("/api/products?limit=500").then((response) => response.json()),
    ])
      .then(([siteContent, categoriesJson, productsJson]) => {
        setContent(siteContent)
        setCategories(categoriesJson.data ?? categoriesJson ?? [])
        setProducts(normalizeProductsResponse(productsJson))
      })
      .catch(() => toast.error("No se pudo cargar la configuración del home"))
      .finally(() => setLoading(false))
  }, [])

  const brands = useMemo(
    () => Array.from(new Set(products.map((product) => product.brand).filter(Boolean))).sort(),
    [products],
  )

  const manualProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase()
    const list = term
      ? products.filter((product) => {
          const brand = product.brand?.toLowerCase() ?? ""
          return product.name.toLowerCase().includes(term) || brand.includes(term)
        })
      : products

    return list
      .slice()
      .sort((left, right) => {
        const leftSelected = sectionDraft.productIds.includes(left.id)
        const rightSelected = sectionDraft.productIds.includes(right.id)
        if (leftSelected !== rightSelected) return leftSelected ? -1 : 1
        return left.name.localeCompare(right.name)
      })
      .slice(0, term ? 40 : 18)
  }, [productSearch, products, sectionDraft.productIds])

  const selectedManualProducts = useMemo(
    () => products.filter((product) => sectionDraft.productIds.includes(product.id)),
    [products, sectionDraft.productIds],
  )

  const sourceScopedProducts = useMemo(() => {
    if (sectionDraft.source === "manual") return products

    if (sectionDraft.source === "category") {
      const category = categories.find((item) => item.slug === sectionDraft.categorySlug)
      if (!category) return []
      return products.filter((product) => product.categoryId === category.slug)
    }

    if (sectionDraft.source === "subcategory") {
      const category = categories.find((item) => item.slug === sectionDraft.categorySlug)
      const subcategory = category?.children.find((item) => item.slug === sectionDraft.subcategorySlug)
      if (!category || !subcategory) return []
      return products.filter((product) => product.categoryId === category.slug && product.subcategoryId === subcategory.slug)
    }

    if (sectionDraft.source === "brand") {
      if (!sectionDraft.brand) return []
      return products.filter((product) => product.brand?.toLowerCase() === sectionDraft.brand?.toLowerCase())
    }

    return products.filter((product) => product.promotion?.activa)
  }, [categories, products, sectionDraft.brand, sectionDraft.categorySlug, sectionDraft.source, sectionDraft.subcategorySlug])

  const sourcePickerProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase()
    const list = term
      ? sourceScopedProducts.filter((product) => {
          const brand = product.brand?.toLowerCase() ?? ""
          return product.name.toLowerCase().includes(term) || brand.includes(term)
        })
      : sourceScopedProducts

    return list
      .slice()
      .sort((left, right) => {
        const leftSelected = sectionDraft.productIds.includes(left.id)
        const rightSelected = sectionDraft.productIds.includes(right.id)
        if (leftSelected !== rightSelected) return leftSelected ? -1 : 1
        return left.name.localeCompare(right.name)
      })
      .slice(0, term ? 80 : 40)
  }, [productSearch, sectionDraft.productIds, sourceScopedProducts])

  useEffect(() => {
    if (sectionDraft.source === "manual") {
      if (sectionDraft.productIds.length <= sectionDraft.limit) return
      setSectionDraft((current) => ({ ...current, productIds: current.productIds.slice(0, current.limit) }))
      return
    }

    const validIds = sectionDraft.productIds.filter((id) => sourceScopedProducts.some((product) => product.id === id))
    const limitedIds = validIds.slice(0, sectionDraft.limit)

    if (limitedIds.length > 0) {
      if (!arraysEqual(limitedIds, sectionDraft.productIds)) {
        setSectionDraft((current) => ({ ...current, productIds: limitedIds }))
      }
      return
    }

    if (sourceScopedProducts.length === 0) {
      if (sectionDraft.productIds.length > 0) {
        setSectionDraft((current) => ({ ...current, productIds: [] }))
      }
      return
    }

    const seeded = shuffleProducts(sourceScopedProducts)
      .slice(0, Math.max(1, sectionDraft.limit))
      .map((product) => product.id)

    if (!arraysEqual(seeded, sectionDraft.productIds)) {
      setSectionDraft((current) => ({ ...current, productIds: seeded }))
    }
  }, [sectionDraft.limit, sectionDraft.productIds, sectionDraft.source, sourceScopedProducts])

  const toggleDraftProduct = (productId: string, checked: boolean) => {
    setSectionDraft((current) => ({
      ...current,
      productIds: checked
        ? Array.from(new Set([...current.productIds, productId])).slice(0, Math.max(1, current.limit))
        : current.productIds.filter((id) => id !== productId),
    }))
  }

  const persist = async (next: SiteContent) => {
    setSaving(true)
    try {
      const response = await fetch("/api/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      })
      if (!response.ok) throw new Error()
      const saved = await response.json()
      setContent(saved)
      toast.success("Configuración actualizada")
    } catch {
      toast.error("No se pudo guardar la configuración")
    } finally {
      setSaving(false)
    }
  }

  const moveItem = <T extends { id: string; order: number }>(items: T[], id: string, direction: -1 | 1) => {
    const ordered = items.slice().sort((left, right) => left.order - right.order)
    const index = ordered.findIndex((item) => item.id === id)
    const nextIndex = index + direction
    if (index < 0 || nextIndex < 0 || nextIndex >= ordered.length) return ordered
    ;[ordered[index], ordered[nextIndex]] = [ordered[nextIndex], ordered[index]]
    return ordered.map((item, itemIndex) => ({ ...item, order: itemIndex + 1 }))
  }

  const openNewBanner = () => {
    setBannerDraft({ ...emptyBanner, id: makeId("banner"), order: content.banners.length + 1 })
    setBannerModalOpen(true)
  }

  const openEditBanner = (banner: HomeBanner) => {
    setBannerDraft(banner)
    setBannerModalOpen(true)
  }

  const saveBanner = async () => {
    const exists = content.banners.some((banner) => banner.id === bannerDraft.id)
    const banners = exists
      ? content.banners.map((banner) => (banner.id === bannerDraft.id ? bannerDraft : banner))
      : [...content.banners, bannerDraft]
    await persist({ ...content, banners: banners.sort((left, right) => left.order - right.order) })
    setBannerModalOpen(false)
  }

  const openNewSection = () => {
    setSectionDraft({ ...emptySection, id: makeId("section"), order: content.sections.length + 1 })
    setProductSearch("")
    setSectionModalOpen(true)
  }

  const openEditSection = (section: HomeSection) => {
    setSectionDraft(section)
    setProductSearch("")
    setSectionModalOpen(true)
  }

  const saveSection = async () => {
    const exists = content.sections.some((section) => section.id === sectionDraft.id)
    const sections = exists
      ? content.sections.map((section) => (section.id === sectionDraft.id ? sectionDraft : section))
      : [...content.sections, sectionDraft]
    await persist({ ...content, sections: sections.sort((left, right) => left.order - right.order) })
    setSectionModalOpen(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Home administrable
          </p>
          <h1 className="mt-1 font-display text-4xl text-ink">SECCIONES</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configurá banners clickeables y rieles de productos ordenables para la home.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={openNewBanner} className="gap-2">
            <ImagePlus className="h-4 w-4" /> Nuevo banner
          </Button>
          <Button onClick={openNewSection} variant="outline" className="gap-2">
            <LayoutTemplate className="h-4 w-4" /> Nueva sección
          </Button>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink">Banners del home</h2>
          {saving && <span className="text-xs text-muted-foreground">Guardando cambios...</span>}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {content.banners.map((banner, index) => (
            <article key={banner.id} className="rounded-2xl border border-border bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {banner.eyebrow || "Sin eyebrow"}
                  </p>
                  <h3 className="mt-1 font-display text-2xl text-ink">{banner.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{banner.description}</p>
                  <p className="mt-3 text-xs text-ink/70">Destino: {banner.href}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEditBanner(banner)}>
                    <Edit className="h-4 w-4" /> Editar
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    disabled={index === 0}
                    onClick={() => persist({ ...content, banners: moveItem(content.banners, banner.id, -1) })}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    disabled={index === content.banners.length - 1}
                    onClick={() => persist({ ...content, banners: moveItem(content.banners, banner.id, 1) })}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => persist({ ...content, banners: content.banners.filter((item) => item.id !== banner.id).map((item, itemIndex) => ({ ...item, order: itemIndex + 1 })) })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Secciones de productos</h2>
        <div className="space-y-4">
          {content.sections.map((section, index) => (
            <article key={section.id} className="rounded-2xl border border-border bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Fuente: {section.source}
                  </p>
                  <h3 className="mt-1 font-display text-2xl text-ink">{section.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{section.description}</p>
                  <p className="mt-3 text-xs text-ink/70">Límite visible: {section.limit} productos</p>
                  <p className="mt-1 text-xs text-ink/70">Desktop: {section.carousel ? "Carousel" : "Lista"}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEditSection(section)}>
                    Editar
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    disabled={index === 0}
                    onClick={() => persist({ ...content, sections: moveItem(content.sections, section.id, -1) })}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    disabled={index === content.sections.length - 1}
                    onClick={() => persist({ ...content, sections: moveItem(content.sections, section.id, 1) })}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => persist({ ...content, sections: content.sections.filter((item) => item.id !== section.id).map((item, itemIndex) => ({ ...item, order: itemIndex + 1 })) })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Dialog open={bannerModalOpen} onOpenChange={setBannerModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{content.banners.some((banner) => banner.id === bannerDraft.id) ? "Editar banner" : "Nuevo banner"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div>
              <Label htmlFor="banner-eyebrow">Eyebrow</Label>
              <Input id="banner-eyebrow" value={bannerDraft.eyebrow || ""} onChange={(event) => setBannerDraft((current) => ({ ...current, eyebrow: event.target.value }))} />
            </div>
            <div>
              <Label htmlFor="banner-button">Texto del botón</Label>
              <Input id="banner-button" value={bannerDraft.buttonLabel} onChange={(event) => setBannerDraft((current) => ({ ...current, buttonLabel: event.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="banner-title">Título</Label>
              <Input id="banner-title" value={bannerDraft.title} onChange={(event) => setBannerDraft((current) => ({ ...current, title: event.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="banner-description">Descripción</Label>
              <textarea id="banner-description" value={bannerDraft.description} onChange={(event) => setBannerDraft((current) => ({ ...current, description: event.target.value }))} className="mt-1 min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="banner-href">Link destino</Label>
              <Input id="banner-href" value={bannerDraft.href} onChange={(event) => setBannerDraft((current) => ({ ...current, href: event.target.value }))} />
            </div>
            <div>
              <Label htmlFor="banner-image">Imagen desktop</Label>
              <div id="banner-image" className="mt-1">
                <ImageUploader
                  images={bannerDraft.imageUrl ? [bannerDraft.imageUrl] : []}
                  single
                  onChange={(images) =>
                    setBannerDraft((current) => ({ ...current, imageUrl: images[0] ?? "" }))
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="banner-mobile-image">Imagen mobile</Label>
              <div id="banner-mobile-image" className="mt-1">
                <ImageUploader
                  images={bannerDraft.mobileImageUrl ? [bannerDraft.mobileImageUrl] : []}
                  single
                  onChange={(images) =>
                    setBannerDraft((current) => ({ ...current, mobileImageUrl: images[0] ?? "" }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBannerModalOpen(false)}>Cancelar</Button>
            <Button onClick={saveBanner}>Guardar banner</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sectionModalOpen} onOpenChange={setSectionModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{content.sections.some((section) => section.id === sectionDraft.id) ? "Editar sección" : "Nueva sección"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div>
              <Label htmlFor="section-title">Título</Label>
              <Input id="section-title" value={sectionDraft.title} onChange={(event) => setSectionDraft((current) => ({ ...current, title: event.target.value }))} />
            </div>
            <div>
              <Label htmlFor="section-limit">Cantidad máxima</Label>
              <Input id="section-limit" type="number" min="1" max="20" value={sectionDraft.limit} onChange={(event) => setSectionDraft((current) => ({ ...current, limit: Number(event.target.value) || 8 }))} />
            </div>
            <div className="flex items-end">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-ink">
                <input
                  type="checkbox"
                  checked={sectionDraft.carousel ?? false}
                  onChange={(event) => setSectionDraft((current) => ({ ...current, carousel: event.target.checked }))}
                />
                Carousel (desktop)
              </label>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="section-description">Descripción</Label>
              <textarea id="section-description" value={sectionDraft.description} onChange={(event) => setSectionDraft((current) => ({ ...current, description: event.target.value }))} className="mt-1 min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <Label htmlFor="section-source">Fuente</Label>
              <select id="section-source" value={sectionDraft.source} onChange={(event) => setSectionDraft((current) => ({ ...current, source: event.target.value as HomeSectionSource, productIds: [] }))} className="mt-1 block h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="manual">Manual</option>
                <option value="category">Categoría</option>
                <option value="subcategory">Subcategoría</option>
                <option value="brand">Marca</option>
                <option value="promotion">Promoción activa</option>
              </select>
            </div>

            {sectionDraft.source === "category" && (
              <div>
                <Label htmlFor="section-category">Categoría</Label>
                <select id="section-category" value={sectionDraft.categorySlug || ""} onChange={(event) => setSectionDraft((current) => ({ ...current, categorySlug: event.target.value }))} className="mt-1 block h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Seleccioná</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>{category.name}</option>
                  ))}
                </select>
              </div>
            )}

            {sectionDraft.source === "subcategory" && (
              <>
                <div>
                  <Label htmlFor="section-subcategory-parent">Categoría</Label>
                  <select id="section-subcategory-parent" value={sectionDraft.categorySlug || ""} onChange={(event) => setSectionDraft((current) => ({ ...current, categorySlug: event.target.value, subcategorySlug: "" }))} className="mt-1 block h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Seleccioná</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.slug}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="section-subcategory">Subcategoría</Label>
                  <select id="section-subcategory" value={sectionDraft.subcategorySlug || ""} onChange={(event) => setSectionDraft((current) => ({ ...current, subcategorySlug: event.target.value }))} className="mt-1 block h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Seleccioná</option>
                    {(categories.find((category) => category.slug === sectionDraft.categorySlug)?.children ?? []).map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.slug}>{subcategory.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {sectionDraft.source === "brand" && (
              <div>
                <Label htmlFor="section-brand">Marca</Label>
                <select id="section-brand" value={sectionDraft.brand || ""} onChange={(event) => setSectionDraft((current) => ({ ...current, brand: event.target.value }))} className="mt-1 block h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Seleccioná</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand || ""}>{brand}</option>
                  ))}
                </select>
              </div>
            )}

            {sectionDraft.source === "manual" && (
              <div className="sm:col-span-2">
                <Label>Productos manuales</Label>
                <div className="mt-2 space-y-3 rounded-xl border border-border p-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={productSearch}
                      onChange={(event) => setProductSearch(event.target.value)}
                      placeholder="Buscá por nombre o marca"
                      className="pl-9"
                    />
                  </div>

                  {selectedManualProducts.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedManualProducts.map((product) => (
                        <button
                          key={`selected-${product.id}`}
                          type="button"
                          onClick={() => toggleDraftProduct(product.id, false)}
                          className="rounded-full border border-ink/10 bg-[color:var(--color-pink-soft)] px-3 py-1 text-xs font-semibold text-ink transition-colors hover:border-ink/30"
                        >
                          {product.name}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="max-h-72 space-y-2 overflow-y-auto">
                    {manualProducts.map((product) => (
                    <label key={product.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/40">
                      <input
                        type="checkbox"
                        checked={sectionDraft.productIds.includes(product.id)}
                        onChange={(event) => toggleDraftProduct(product.id, event.target.checked)}
                      />
                      <span className="text-sm text-ink">{product.name}</span>
                      {product.brand && <span className="text-xs text-muted-foreground">{product.brand}</span>}
                    </label>
                    ))}

                    {manualProducts.length === 0 && (
                      <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                        No hay productos que coincidan con la búsqueda.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {sectionDraft.source !== "manual" && (
              <div className="sm:col-span-2">
                <Label>Productos visibles de esta fuente (max {sectionDraft.limit})</Label>
                <div className="mt-2 space-y-3 rounded-xl border border-border p-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={productSearch}
                      onChange={(event) => setProductSearch(event.target.value)}
                      placeholder="Filtra productos de la fuente elegida"
                      className="pl-9"
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Se autoseleccionan {sectionDraft.limit} productos al cambiar la fuente. Puedes ajustar manualmente esta lista.
                  </p>

                  <div className="max-h-72 space-y-2 overflow-y-auto">
                    {sourcePickerProducts.map((product) => (
                      <label key={product.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/40">
                        <input
                          type="checkbox"
                          checked={sectionDraft.productIds.includes(product.id)}
                          onChange={(event) => toggleDraftProduct(product.id, event.target.checked)}
                        />
                        <span className="text-sm text-ink">{product.name}</span>
                        {product.brand && <span className="text-xs text-muted-foreground">{product.brand}</span>}
                      </label>
                    ))}

                    {sourcePickerProducts.length === 0 && (
                      <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                        No hay productos para la fuente seleccionada.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSectionModalOpen(false)}>Cancelar</Button>
            <Button onClick={saveSection}>Guardar sección</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}