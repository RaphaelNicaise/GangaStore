import type { Category, HomeSection, Product, SiteContent } from "@/lib/types"

export const defaultSiteContent: SiteContent = {
  banners: [
    {
      id: "banner-hero-1",
      eyebrow: "Especial cocina",
      title: "Llevate cocina y refrigeración con precio mayorista real",
      description: "Armá pedidos mixtos y resolvé una categoría completa en una sola compra.",
      href: "/catalogo?categoria=cocina",
      buttonLabel: "Ver cocina",
      imageUrl: "/placeholder.svg",
      mobileImageUrl: "/placeholder.svg",
      active: true,
      order: 1,
    },
    {
      id: "banner-hero-2",
      eyebrow: "Promociones",
      title: "Ofertas activas para empujar conversión y rotación",
      description: "Mostrá productos con descuento y llevá tráfico directo a filtros útiles.",
      href: "/catalogo?promo=1",
      buttonLabel: "Ver promos",
      imageUrl: "/placeholder.svg",
      mobileImageUrl: "/placeholder.svg",
      active: true,
      order: 2,
    },
    {
      id: "banner-hero-3",
      eyebrow: "Termos & mate",
      title: "Accesorios de ticket rápido para sumar más unidades por pedido",
      description: "Una línea liviana para complementar carritos y levantar el promedio.",
      href: "/catalogo?categoria=termos",
      buttonLabel: "Explorar termos",
      imageUrl: "/placeholder.svg",
      mobileImageUrl: "/placeholder.svg",
      active: true,
      order: 3,
    },
  ],
  sections: [
    {
      id: "section-destacados",
      title: "Productos destacados",
      description: "Una selección editable desde el panel para abrir la home con foco comercial.",
      source: "manual",
      productIds: [],
      carousel: false,
      active: true,
      order: 1,
      limit: 8,
    },
    {
      id: "section-promos",
      title: "Ofertas del momento",
      description: "Productos con promociones activas para reforzar urgencia de compra.",
      source: "promotion",
      productIds: [],
      carousel: true,
      active: true,
      order: 2,
      limit: 8,
    },
    {
      id: "section-philco",
      title: "Selección Philco",
      description: "Una marca fuerte para crear una vidriera temática y dirigir a su filtrado.",
      source: "brand",
      productIds: [],
      brand: "Philco",
      carousel: false,
      active: true,
      order: 3,
      limit: 8,
    },
  ],
}

export function buildSectionHref(section: HomeSection) {
  const params = new URLSearchParams()

  if (section.source === "category" && section.categorySlug) params.set("categoria", section.categorySlug)
  if (section.source === "subcategory" && section.categorySlug && section.subcategorySlug) {
    params.set("categoria", section.categorySlug)
    params.set("subcategoria", section.subcategorySlug)
  }
  if (section.source === "brand" && section.brand) params.set("marca", section.brand)
  if (section.source === "promotion") params.set("promo", "1")

  const query = params.toString()
  return query ? `/catalogo?${query}` : "/catalogo"
}

export function resolveHomeSectionProducts(
  section: HomeSection,
  productsList: Product[],
  categories: Category[],
) {
  let filtered = productsList.slice()

  switch (section.source) {
    case "manual":
      filtered = section.productIds
        .map((id) => productsList.find((product) => product.id === id))
        .filter((product): product is Product => Boolean(product))
      break
    case "category": {
      const category = categories.find((item) => item.slug === section.categorySlug)
      if (!category) return []
      filtered = filtered.filter((product) => product.categoryId === category.id)
      break
    }
    case "subcategory": {
      const category = categories.find((item) => item.slug === section.categorySlug)
      if (!category || !section.subcategorySlug) return []
      filtered = filtered.filter(
        (product) => product.categoryId === category.id && product.subcategoryId === section.subcategorySlug,
      )
      break
    }
    case "brand":
      filtered = filtered.filter(
        (product) => product.brand?.toLowerCase() === section.brand?.toLowerCase(),
      )
      break
    case "promotion":
      filtered = filtered.filter((product) => product.promotion?.activa)
      break
  }

  const limit = Math.max(1, section.limit)
  const selectedSet = new Set(section.productIds)

  if (section.source !== "manual" && selectedSet.size > 0) {
    filtered = filtered
      .filter((product) => selectedSet.has(product.id))
      .sort((left, right) => section.productIds.indexOf(left.id) - section.productIds.indexOf(right.id))
  }

  return filtered.slice(0, limit)
}