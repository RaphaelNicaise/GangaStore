import type { PriceBreakdown, Product, ProductPromotion } from "./types"

/**
 * Reglas de negocio:
 *  - 1 a 2 unidades  -> precio minorista
 *  - 3 a 9 unidades  -> precio mayorista
 *  - 10+ unidades    -> precio mayorista con 5% extra de descuento
 */
export function getUnitPrice(product: Product, quantity: number): { unitPrice: number; tier: PriceBreakdown["tier"] } {
  if (quantity >= 10) return { unitPrice: product.wholesalePrice, tier: "mayorista-10" }
  if (quantity >= 3) return { unitPrice: product.wholesalePrice, tier: "mayorista" }
  return { unitPrice: product.retailPrice, tier: "minorista" }
}

export function applyPromotion(
  unitPrice: number,
  quantity: number,
  promo?: ProductPromotion,
): { promoDiscount: number; effectivePaidUnits: number } {
  if (!promo || !promo.activa) return { promoDiscount: 0, effectivePaidUnits: quantity }

  switch (promo.tipo) {
    case "porcentaje": {
      const discount = unitPrice * quantity * (promo.valor / 100)
      return { promoDiscount: discount, effectivePaidUnits: quantity }
    }
    case "fijo": {
      const discount = Math.min(unitPrice, promo.valor) * quantity
      return { promoDiscount: discount, effectivePaidUnits: quantity }
    }
    case "nxm": {
      if (!promo.valor_secundario || promo.valor <= 0 || promo.valor_secundario <= 0) {
        return { promoDiscount: 0, effectivePaidUnits: quantity }
      }
      const groups = Math.floor(quantity / promo.valor)
      const remainder = quantity % promo.valor
      const paid = groups * promo.valor_secundario + remainder
      const discount = (quantity - paid) * unitPrice
      return { promoDiscount: discount, effectivePaidUnits: paid }
    }
  }
}

export function getPriceBreakdown(product: Product, quantity: number): PriceBreakdown {
  const { unitPrice, tier } = getUnitPrice(product, quantity)
  const subtotal = unitPrice * quantity

  const tierDiscount = tier === "mayorista-10" ? subtotal * 0.05 : 0
  const subtotalAfterTier = subtotal - tierDiscount

  const { promoDiscount } = applyPromotion(unitPrice, quantity, product.promotion)

  const proportionalPromo = subtotal === 0 ? 0 : (promoDiscount * subtotalAfterTier) / subtotal
  const total = Math.max(0, subtotalAfterTier - proportionalPromo)

  return {
    unitPrice,
    tier,
    subtotal,
    tierDiscount,
    promoDiscount: proportionalPromo,
    total,
  }
}

export function getPromoLabel(promo: ProductPromotion): string {
  switch (promo.tipo) {
    case "porcentaje":
      return `${promo.valor}% OFF`
    case "fijo":
      return `$${promo.valor.toLocaleString("es-AR")} OFF`
    case "nxm":
      return `${promo.valor}x${promo.valor_secundario}`
  }
}

export function tierLabel(tier: PriceBreakdown["tier"]): string {
  switch (tier) {
    case "minorista":
      return "Precio minorista"
    case "mayorista":
      return "Precio mayorista (3+)"
    case "mayorista-10":
      return "Mayorista + 5% (10+)"
  }
}

export function formatARS(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value)
}
