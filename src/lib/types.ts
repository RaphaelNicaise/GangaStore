export type PromoType = "porcentaje" | "fijo" | "nxm"

export interface ProductPromotion {
  tipo: PromoType
  /** Para 'porcentaje' es %. Para 'fijo' es monto. Para 'nxm' es la N (ej. 3 en 3x2). */
  valor: number
  /** Solo para 'nxm', representa la M (ej. 2 en 3x2). */
  valor_secundario?: number
  activa: boolean
}

export interface Subcategory {
  id: string
  name: string
}

export interface Category {
  id: string
  name: string
  slug: string
  subcategories: Subcategory[]
}

export interface Product {
  id: string
  slug: string
  name: string
  description: string
  /** Precio minorista (1 unidad) */
  retailPrice: number
  /** Precio mayorista (3+ unidades) */
  wholesalePrice: number
  imageUrl: string
  imageUrls?: string[]
  categoryId: string
  subcategoryId: string
  categoryName?: string
  subcategoryName?: string
  brand?: string
  stock: number
  active?: boolean
  highlights?: string[]
  promotion?: ProductPromotion
}

export interface CartItem {
  productId: string
  quantity: number
}

export type HomeSectionSource = "manual" | "category" | "subcategory" | "brand" | "promotion"

export interface HomeBanner {
  id: string
  eyebrow?: string
  title: string
  description: string
  href: string
  buttonLabel: string
  imageUrl: string
  mobileImageUrl?: string
  active: boolean
  order: number
}

export interface HomeSection {
  id: string
  title: string
  description: string
  source: HomeSectionSource
  productIds: string[]
  categorySlug?: string
  subcategorySlug?: string
  brand?: string
  carousel?: boolean
  active: boolean
  order: number
  limit: number
}

export interface SiteContent {
  banners: HomeBanner[]
  sections: HomeSection[]
}

export interface PriceBreakdown {
  unitPrice: number
  tier: "minorista" | "mayorista" | "mayorista-10"
  subtotal: number
  tierDiscount: number
  promoDiscount: number
  total: number
}
