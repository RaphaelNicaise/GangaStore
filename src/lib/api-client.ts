import type { Category, Product, PromoType } from "./types"

function toNumber(value: { toNumber(): number } | number | string | null | undefined): number {
  if (typeof value === "number") return value
  if (typeof value === "string") return Number.parseFloat(value)
  if (value && typeof value === "object" && "toNumber" in value) return value.toNumber()
  return 0
}

/**
 * Transforma un producto de la DB al formato del frontend.
 * Se usa en server components que llaman directamente a los servicios.
 */
export function dbProductToFrontend(p: {
  id: string
  slug: string
  name: string
  description: string | null
  precio_minorista: { toNumber(): number } | number | string
  precio_mayorista: { toNumber(): number } | number | string
  images: string[]
  brand: string | null
  stock: number
  active: boolean
  highlights: string[]
  promotion_tipo: string | null
  promotion_valor: { toNumber(): number } | number | string | null
  promotion_valor_sec: number | null
  promotion_activa: boolean
  category: {
    id: string
    slug: string
    name: string
    parentId: string | null
    parent?: { id: string; slug: string; name: string } | null
  }
}): Product {
  const retailPrice = toNumber(p.precio_minorista)
  const wholesalePrice = toNumber(p.precio_mayorista)

  // Si la categoría tiene padre, el padre es la "categoría" del frontend
  // y esta categoría es la "subcategoría"
  const categoryId = p.category.parent?.slug ?? p.category.slug
  const subcategoryId = p.category.parentId ? p.category.slug : ""

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description ?? "",
    retailPrice,
    wholesalePrice,
    imageUrl: p.images[0] ?? "/placeholder.svg",
    imageUrls: p.images.length > 0 ? p.images : ["/placeholder.svg"],
    categoryId,
    subcategoryId,
    categoryName: p.category.parent?.name ?? p.category.name,
    subcategoryName: p.category.parentId ? p.category.name : undefined,
    brand: p.brand ?? undefined,
    stock: p.stock,
    active: p.active,
    highlights: p.highlights,
    promotion:
      p.promotion_tipo && p.promotion_valor != null
        ? {
            tipo: p.promotion_tipo as PromoType,
            valor: toNumber(p.promotion_valor),
            valor_secundario: p.promotion_valor_sec ?? undefined,
            activa: p.promotion_activa,
          }
        : undefined,
  }
}

/**
 * Transforma una categoría raíz de la DB (con children) al formato del frontend.
 */
export function dbCategoryToFrontend(c: {
  id: string
  slug: string
  name: string
  children: { id: string; slug: string; name: string }[]
}): Category {
  return {
    id: c.slug, // Usamos slug como id para compatibilidad con el frontend
    name: c.name,
    slug: c.slug,
    subcategories: c.children.map((ch) => ({
      id: ch.slug,
      name: ch.name,
    })),
  }
}

/**
 * Fetch products from the internal API (for client components).
 */
export async function fetchProducts(params?: {
  categorySlug?: string
  search?: string
  active?: boolean
}): Promise<Product[]> {
  const url = new URL("/api/products", window.location.origin)
  url.searchParams.set("limit", "200")
  if (params?.search) url.searchParams.set("search", params.search)
  if (params?.active !== undefined) url.searchParams.set("active", String(params.active))

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error("Error al cargar productos")
  const json = await res.json()

  const raw = json.data ?? []
  return raw.map(dbProductToFrontend)
}

/**
 * Fetch categories from the internal API (for client components).
 */
export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch("/api/categories")
  if (!res.ok) throw new Error("Error al cargar categorías")
  const json = await res.json()
  const raw = Array.isArray(json) ? json : json.data ?? []
  return raw.map(dbCategoryToFrontend)
}
