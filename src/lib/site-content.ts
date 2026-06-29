import type { Category, HomeSection, Product, SiteContent } from "@/lib/types"

export const defaultSiteContent: SiteContent = {
  banners: [],
  sections: [],
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