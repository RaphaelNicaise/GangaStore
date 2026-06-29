export const dynamic = "force-dynamic"
import Link from "next/link"
import { ArrowRight, Truck, ShieldCheck, Tag, Headphones } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { HomeBannerCarousel } from "@/components/home-banner-carousel"
import { HomeSectionProducts } from "@/components/home-section-products"
import { ProductService } from "@/services/product.service"
import { CategoryService } from "@/services/category.service"
import { SiteContentService } from "@/services/site-content.service"
import { dbCategoryToFrontend, dbProductToFrontend } from "@/lib/api-client"
import type { Category, Product } from "@/lib/types"
import { buildSectionHref, resolveHomeSectionProducts } from "@/lib/site-content"

async function getHomeData(): Promise<{
  featured: Product[]
  categories: Category[]
  siteContent: Awaited<ReturnType<typeof SiteContentService.get>>
}> {
  const [result, categoriesRaw, siteContent] = await Promise.all([
    ProductService.findAll(new URLSearchParams({ limit: "120", active: "true" })),
    CategoryService.findAll(),
    SiteContentService.get(),
  ])

  return {
    featured: result.data.map((item) => dbProductToFrontend(item as Parameters<typeof dbProductToFrontend>[0])),
    categories: categoriesRaw.map(dbCategoryToFrontend),
    siteContent,
  }
}

export default async function HomePage() {
  const { featured, categories, siteContent } = await getHomeData()
  const activeBanners = siteContent.banners.filter((banner) => banner.active).sort((left, right) => left.order - right.order)
  const activeSections = siteContent.sections.filter((section) => section.active).sort((left, right) => left.order - right.order)

  return (
    <>
      <SiteHeader />

      <main className="bg-white">
        <HomeBannerCarousel banners={activeBanners} />




        {activeSections.map((section, sectionIndex) => {
          const sectionProducts = resolveHomeSectionProducts(section, featured, categories)
          if (sectionProducts.length === 0) return null

          return (
            <section
              key={section.id}
              className={sectionIndex % 2 === 0 ? "relative bg-[color:var(--color-pink-soft)] py-10 sm:py-14" : "relative bg-white py-10 sm:py-14"}
            >
              <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
                <div className="flex flex-col items-start justify-between gap-3 sm:gap-4 sm:flex-row sm:items-end">
                  <div>
                    <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl text-ink">{section.title.toUpperCase()}</h2>
                    <p className="mt-1 sm:mt-2 max-w-2xl text-xs sm:text-sm text-muted-foreground">{section.description}</p>
                  </div>
                  <Link href={buildSectionHref(section)} className="text-xs sm:text-sm font-semibold text-ink hover:underline">
                    Ver más <ArrowRight className="inline h-3 w-3 sm:h-4 sm:w-4" />
                  </Link>
                </div>

                <div className="mt-8">
                  <HomeSectionProducts
                    products={sectionProducts}
                    enableDesktopCarousel={section.carousel ?? false}
                    edgeFadeTone={sectionIndex % 2 === 0 ? "pink" : "white"}
                  />
                </div>
              </div>
            </section>
          )
        })}

        {/* Beneficios */}
        <section className="bg-white py-8 sm:py-12">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 sm:px-6 sm:gap-4 lg:grid-cols-4">
            {[
              { Icon: Truck, title: "Envíos a todo el país", desc: "Logística mayorista en 24-72hs." },
              { Icon: Tag, title: "Precios mayoristas", desc: "Desde 3 unidades, 5% extra desde 10." },
              { Icon: ShieldCheck, title: "Garantía oficial", desc: "Productos importados con respaldo." },
              { Icon: Headphones, title: "Atención personal", desc: "Pedidos por WhatsApp con asesor." },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-2 sm:gap-3 rounded-lg sm:rounded-2xl border border-border bg-white p-3 sm:p-5">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-pink)]">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-ink" />
                </div>
                <div>
                  <h3 className="font-display text-sm sm:text-lg text-ink">{title}</h3>
                  <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cómo comprar */}
        <section id="como-comprar" className="relative overflow-hidden bg-ink py-20 text-white">
          <div className="dots-paper absolute left-10 top-12 h-32 w-32 opacity-30" aria-hidden />
          <div className="dots-paper absolute right-10 bottom-12 h-32 w-32 opacity-30" aria-hidden />
          <div
            aria-hidden
            className="absolute inset-y-0 right-0 w-1/3 bg-[color:var(--color-pink)]/10"
            style={{ clipPath: "polygon(40% 0, 100% 0, 100% 100%, 0 100%)" }}
          />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-pink)]">
                Mayorista por WhatsApp
              </p>
              <h2 className="mt-2 font-display text-4xl sm:text-5xl">CÓMO COMPRAR</h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
                Elegí los productos del catálogo, agregalos al carrito y enviános el pedido por
                WhatsApp. Te confirmamos disponibilidad y coordinamos el envío.
              </p>
            </div>
            <ol className="grid gap-4 sm:grid-cols-2">
              {[
                { n: "01", t: "Explorá el catálogo", d: "Filtrá por categoría, marca o búsqueda." },
                { n: "02", t: "Sumá al carrito", d: "Cargá las cantidades que necesites." },
                { n: "03", t: "Aplicamos la lógica", d: "3+ mayorista · 10+ con 5% extra." },
                { n: "04", t: "Pedido por WhatsApp", d: "Te respondemos en minutos." },
              ].map((s) => (
                <li
                  key={s.n}
                  className="rounded-lg sm:rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-5 backdrop-blur"
                >
                  <span className="font-display text-2xl sm:text-3xl text-[color:var(--color-pink)]">{s.n}</span>
                  <h3 className="mt-1 sm:mt-2 font-display text-base sm:text-xl">{s.t}</h3>
                  <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-white/70">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}

