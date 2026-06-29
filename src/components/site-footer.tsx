import Link from "next/link"
import { Instagram, MessageCircle, Facebook } from "lucide-react"
import { Logo } from "./logo"
import { dbCategoryToFrontend } from "@/lib/api-client"
import { CategoryService } from "@/services/category.service"

async function getFooterCategories() {
  const categories = await CategoryService.findAll()
  return categories.map(dbCategoryToFrontend)
}

export async function SiteFooter() {
  const categories = await getFooterCategories()

  return (
    <footer
      id="contacto"
      className="relative isolate mt-16 bg-[color:var(--color-ink)] text-white"
      style={{ clipPath: "polygon(0 6%, 100% 0, 100% 100%, 0 100%)" }}
    >
      <div aria-hidden className="dots-paper pointer-events-none absolute right-6 top-16 h-32 w-32 opacity-30" />
      <div aria-hidden className="dots-paper pointer-events-none absolute left-6 bottom-12 h-24 w-24 opacity-30" />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-12 pt-20 sm:px-6 sm:grid-cols-2 lg:gap-12 lg:pt-28 lg:grid-cols-4">
        <div className="space-y-4 sm:col-span-2 lg:col-span-1">
          <Link href="/" aria-label="TermoStore - Inicio">
            <Logo variant="light" />
          </Link>
          <p className="max-w-xs text-xs sm:text-sm leading-relaxed text-white/70">
            Importadora mayorista de electrodomésticos y artículos para el hogar.
            Pedidos por WhatsApp, envíos a todo el país.
          </p>
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="https://wa.me/5491100000000"
              className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-[color:var(--color-pink)] hover:text-ink"
              aria-label="WhatsApp"
            >
              <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </a>
            <a
              href="#"
              className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-[color:var(--color-pink)] hover:text-ink"
              aria-label="Instagram"
            >
              <Instagram className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </a>
            <a
              href="#"
              className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-[color:var(--color-pink)] hover:text-ink"
              aria-label="Facebook"
            >
              <Facebook className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-display text-lg sm:text-xl tracking-wide text-[color:var(--color-pink)]">Catálogo</h3>
          <ul className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
            {categories.map((c: any) => (
              <li key={c.id}>
                <Link
                  href={`/catalogo?categoria=${c.slug}`}
                  className="text-white/75 transition-colors hover:text-white"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-lg sm:text-xl tracking-wide text-[color:var(--color-pink)]">Mayorista</h3>
          <ul className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-white/75">
            <li>1 unidad - Precio minorista</li>
            <li>3 o más - Precio mayorista</li>
            <li>10 o más - 5% de descuento extra</li>
            <li>Pedidos por WhatsApp</li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-xl tracking-wide text-[color:var(--color-pink)]">Contacto</h3>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li>WhatsApp: +54 9 11 0000-0000</li>
            <li>info@termostore.com.ar</li>
            <li>Lun a Vie · 9 a 18hs</li>
            <li>CABA, Argentina</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-white/50 sm:flex-row sm:px-6">
          <p>&copy; {new Date().getFullYear()} TermoStore — Hogar &amp; Electro. Todos los derechos reservados.</p>
          <Link href="/admin/login" className="hover:text-white">
            Acceso administrador
          </Link>
        </div>
      </div>
    </footer>
  )
}
