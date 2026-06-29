import Link from "next/link"
import { Package, Tags, Percent, ArrowUpRight, PanelsTopLeft } from "lucide-react"
import { SiteContentService } from "@/services/site-content.service"
import { ProductService } from "@/services/product.service"
import { CategoryService } from "@/services/category.service"
import { dbProductToFrontend } from "@/lib/api-client"
import { formatARS } from "@/lib/pricing"

async function getDashboardData() {
  const [productsResult, categoriesRaw, siteContent] = await Promise.all([
    ProductService.findAll(new URLSearchParams({ limit: "500", active: "true" })),
    CategoryService.findAll(),
    SiteContentService.get(),
  ])
  const products = (
    productsResult.data as Parameters<typeof dbProductToFrontend>[0][]
  ).map(dbProductToFrontend)
  const rootCats = categoriesRaw
  const totalSubcategories = categoriesRaw.reduce(
    (acc: number, category: any) => acc + (category.children?.length ?? 0),
    0,
  )
  return { products, rootCats, totalSubcategories, siteContent }
}

export default async function AdminDashboardPage() {
  const { products, rootCats, totalSubcategories, siteContent } = await getDashboardData()

  const totalProducts = products.length
  const totalCategories = rootCats.length
  const activePromos = products.filter((p) => p.promotion?.activa).length
  const totalStockValue = products.reduce((acc, p) => acc + (p.stock ?? 0) * p.wholesalePrice, 0)

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Panel
          </p>
          <h1 className="mt-1 font-display text-4xl text-ink">DASHBOARD</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Resumen general del catálogo y promociones de TermoStore.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Package} label="Productos" value={totalProducts.toString()} />
        <Stat icon={Tags} label="Categorías" value={`${totalCategories} · ${totalSubcategories} subcat.`} />
        <Stat icon={Percent} label="Promos activas" value={activePromos.toString()} accent />
        <Stat icon={ArrowUpRight} label="Stock valorizado" value={formatARS(totalStockValue)} />
        <Stat icon={PanelsTopLeft} label="Bloques home" value={`${siteContent.banners.length} banners · ${siteContent.sections.length} secciones`} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card title="Productos" description="Listá, creá y editá productos del catálogo." href="/admin/productos" />
        <Card title="Categorías" description="Gestioná categorías y subcategorías." href="/admin/categorias" />
        <Card title="Promociones" description="Configurá promos por porcentaje, monto fijo o NxM." href="/admin/promociones" />
        <Card title="Secciones" description="Armá banners y rieles configurables para la home." href="/admin/secciones" />
        <Card title="Pedidos" description="Revisá pedidos enviados por WhatsApp y su detalle." href="/admin/pedidos" />
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink">PRODUCTOS RECIENTES</h2>
          <Link href="/admin/productos" className="text-xs font-semibold uppercase tracking-wider text-ink hover:underline">
            Ver todos
          </Link>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Producto</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 text-right font-semibold">Mayorista</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.slice(0, 8).map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-ink">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.stock ?? 0}</td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">
                    {formatARS(p.wholesalePrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div
      className={
        accent
          ? "rounded-2xl border-2 border-ink bg-[color:var(--color-pink)] p-5"
          : "rounded-2xl border border-border bg-white p-5"
      }
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-3 font-display text-3xl text-ink">{value}</p>
    </div>
  )
}

function Card({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div>
        <p className="font-display text-xl text-ink">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--color-pink)] text-ink transition-transform group-hover:rotate-45">
        <ArrowUpRight className="h-4 w-4" />
      </span>
    </Link>
  )
}
