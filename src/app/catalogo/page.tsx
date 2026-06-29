export const dynamic = "force-dynamic"
import { Suspense } from "react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { CatalogView } from "@/components/catalog-view"
import { ProductService } from "@/services/product.service"
import { CategoryService } from "@/services/category.service"
import { dbProductToFrontend, dbCategoryToFrontend } from "@/lib/api-client"
import type { Product, Category } from "@/lib/types"

export const metadata = {
  title: "Catálogo — TermoStore",
  description: "Explorá nuestro catálogo mayorista de electrodomésticos y artículos para el hogar.",
}

async function getData(): Promise<{ products: Product[]; categories: Category[] }> {
  const [productsResult, categoriesRaw] = await Promise.all([
    ProductService.findAll(new URLSearchParams({ limit: "500", active: "true" })),
    CategoryService.findAll(),
  ])

  return {
    products: productsResult.data.map(dbProductToFrontend),
    categories: categoriesRaw.map(dbCategoryToFrontend),
  }
}

export default async function CatalogPage() {
  const { products, categories } = await getData()

  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-[color:var(--color-pink)] pb-12 sm:pb-16 pt-8 sm:pt-12">
          <div className="dots-ink absolute right-3 sm:right-6 top-3 sm:top-6 h-20 sm:h-24 w-20 sm:w-24 opacity-50" aria-hidden />
          <div className="dots-ink absolute left-3 sm:left-6 bottom-2 sm:bottom-4 h-16 sm:h-20 w-16 sm:w-20 opacity-40" aria-hidden />
          <div
            aria-hidden
            className="absolute inset-y-0 right-0 w-2/5 bg-white"
            style={{ clipPath: "polygon(35% 0, 100% 0, 100% 100%, 65% 100%)" }}
          />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/70">
              TermoStore · Hogar &amp; Electro
            </p>
            <h1 className="mt-2 font-display text-3xl sm:text-5xl lg:text-6xl text-ink">CATÁLOGO</h1>
            <p className="mt-2 sm:mt-3 max-w-xl text-xs sm:text-sm text-ink/80">
              Filtrá por categoría, subcategoría o buscá lo que necesites. Los precios mostrados
              son <strong>mayoristas</strong> (3 unidades o más).
            </p>
          </div>
        </section>

        <div
          className="relative h-12 overflow-hidden bg-white"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 0)" }}
          aria-hidden
        />

        <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">Cargando catálogo...</div>}>
          <CatalogView products={products} categories={categories} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  )
}
