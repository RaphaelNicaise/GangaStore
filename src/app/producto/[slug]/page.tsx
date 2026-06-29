import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ChevronRight } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ProductCard } from "@/components/product-card"
import { ProductImageGallery } from "@/components/product-image-gallery"
import { ProductBuyBox } from "@/components/product-buy-box"
import { ProductService } from "@/services/product.service"
import { dbProductToFrontend } from "@/lib/api-client"
import { formatARS, getPromoLabel } from "@/lib/pricing"
import type { Product } from "@/lib/types"

async function getProductBySlugFromDB(slug: string): Promise<Product | null> {
  const raw = await ProductService.findBySlug(slug)
  if (!raw) return null
  return dbProductToFrontend(raw)
}

async function getRelatedProducts(product: Product): Promise<Product[]> {
  try {
    const params = new URLSearchParams({ limit: "8", active: "true" })
    const result = await ProductService.findAll(params)
    return result.data
      .map(dbProductToFrontend)
      .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
      .slice(0, 4)
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlugFromDB(slug)
  if (!product) return { title: "Producto no encontrado" }
  return {
    title: `${product.name} — TermoStore`,
    description: product.description,
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlugFromDB(slug)
  if (!product) notFound()

  const related = await getRelatedProducts(product)
  const promo = product.promotion?.activa ? product.promotion : undefined
  const categoryName = product.categoryName ?? ""
  const subcategoryName = product.subcategoryName ?? ""

  return (
    <>
      <SiteHeader />
      <main className="bg-white">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mx-auto max-w-7xl px-4 pt-4 sm:pt-6 text-[11px] sm:text-xs text-muted-foreground sm:px-6"
        >
          <ol className="flex flex-wrap items-center gap-1 sm:gap-2">
            <li>
              <Link href="/" className="hover:text-ink">Inicio</Link>
            </li>
            <ChevronRight className="h-3 w-3" />
            <li>
              <Link href="/catalogo" className="hover:text-ink">Catálogo</Link>
            </li>
            {categoryName && (
              <>
                <ChevronRight className="h-3 w-3" />
                <li>
                  <Link href={`/catalogo?categoria=${product.categoryId}`} className="hover:text-ink">
                    {categoryName}
                  </Link>
                </li>
              </>
            )}
            <ChevronRight className="h-3 w-3" />
            <li className="line-clamp-1 font-medium text-ink">{product.name}</li>
          </ol>
        </nav>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:gap-10 sm:py-10 lg:grid-cols-2">
          {/* Imagen */}
          <div className="relative">
            <ProductImageGallery
              name={product.name}
              images={product.imageUrls}
              promoLabel={promo ? getPromoLabel(promo) : undefined}
            />
          </div>

          {/* Info + Buy box */}
          <div>
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {categoryName}{subcategoryName ? ` · ${subcategoryName}` : ""}
            </p>
            <h1 className="mt-1 sm:mt-2 font-display text-2xl sm:text-4xl lg:text-5xl leading-tight text-ink">
              {product.name}
            </h1>
            {product.brand && (
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
                Marca: <span className="font-semibold text-ink">{product.brand}</span>
              </p>
            )}
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm leading-relaxed text-ink/80">{product.description}</p>

            {product.highlights && product.highlights.length > 0 && (
              <ul className="mt-4 sm:mt-6 grid grid-cols-2 gap-2 sm:gap-3">
                {product.highlights.map((h) => (
                  <li
                    key={h}
                    className="rounded-lg sm:rounded-xl border border-border bg-white p-2 sm:p-3 text-[11px] sm:text-xs font-medium text-ink"
                  >
                    {h}
                  </li>
                ))}
              </ul>
            )}

            {/* Pricing tiers */}
            <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-0 overflow-hidden rounded-lg sm:rounded-2xl border border-border">
              <div className="sm:border-r border-border bg-white p-3 sm:p-4">
                <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">1-2 unid.</p>
                <p className="mt-1 font-display text-lg sm:text-xl text-ink">{formatARS(product.retailPrice)}</p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground">Minorista</p>
              </div>
              <div className="sm:border-r border-b sm:border-b-0 border-border bg-[color:var(--color-pink-soft)] p-3 sm:p-4">
                <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-ink/70">3+ unid.</p>
                <p className="mt-1 font-display text-lg sm:text-xl text-ink">{formatARS(product.wholesalePrice)}</p>
                <p className="text-[9px] sm:text-[10px] text-ink/70">Mayorista</p>
              </div>
              <div className="bg-[color:var(--color-pink)] p-3 sm:p-4">
                <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-ink/80">10+ unid.</p>
                <p className="mt-1 font-display text-lg sm:text-xl text-ink">{formatARS(product.wholesalePrice * 0.95)}</p>
                <p className="text-[9px] sm:text-[10px] text-ink/80">Mayorista -5%</p>
              </div>
            </div>

            <ProductBuyBox product={product} />
          </div>
        </section>

        {related.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 pb-12 sm:pb-16 sm:px-6">
            <h2 className="font-display text-2xl sm:text-3xl text-ink">PRODUCTOS RELACIONADOS</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  )
}
