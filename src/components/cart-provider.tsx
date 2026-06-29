"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { getPriceBreakdown } from "@/lib/pricing"
import { dbProductToFrontend } from "@/lib/api-client"
import type { CartItem, Product } from "@/lib/types"

type CartContextValue = {
  items: CartItem[]
  totalUnits: number
  totalAmount: number
  cartPulseKey: number
  addItem: (productId: string, quantity?: number, product?: Product) => void
  removeItem: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
  clear: () => void
  getProduct: (productId: string) => Product | undefined
  syncProducts: (products: Product[]) => void
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = "termostore.cart.v1"

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [productsCache, setProductsCache] = useState<Record<string, Product>>({})
  const [cartPulseKey, setCartPulseKey] = useState(0)

  // Cargar carrito de localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch {
      // ignore
    }
    setHydrated(true)
  }, [])

  // Persistir carrito en localStorage
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // ignore
    }
  }, [items, hydrated])

  // Cargar productos de la API para los items del carrito
  useEffect(() => {
    if (!hydrated || items.length === 0) return
    const missingIds = items
      .map((i) => i.productId)
      .filter((id) => !productsCache[id])
    if (missingIds.length === 0) return

    fetch(`/api/products?ids=${missingIds.join(",")}`)
      .then((r) => r.json())
      .then((json) => {
        const list = json.data ?? (Array.isArray(json) ? json : [])
        const newCache: Record<string, Product> = {}
        for (const p of list) {
          const fp = dbProductToFrontend(p)
          newCache[fp.id] = fp
        }
        setProductsCache((prev) => ({ ...prev, ...newCache }))
      })
      .catch(() => { /* silent */ })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, items])

  const addItem = useCallback((productId: string, quantity = 1, product?: Product) => {
    if (product) {
      setProductsCache((prev) => ({ ...prev, [productId]: product }))
    }
    setCartPulseKey((current) => current + 1)
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId)
      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i,
        )
      }
      return [...prev, { productId, quantity }]
    })
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }, [])

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.productId !== productId)
      return prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    })
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const syncProducts = useCallback((products: Product[]) => {
    if (products.length === 0) return
    const nextEntries = Object.fromEntries(products.map((product) => [product.id, product]))
    setProductsCache((prev) => ({ ...prev, ...nextEntries }))
  }, [])

  const getProductById = useCallback(
    (id: string): Product | undefined => productsCache[id],
    [productsCache],
  )

  const { totalUnits, totalAmount } = useMemo(() => {
    let units = 0
    let amount = 0
    for (const item of items) {
      const product = getProductById(item.productId)
      if (!product) continue
      units += item.quantity
      amount += getPriceBreakdown(product, item.quantity).total
    }
    return { totalUnits: units, totalAmount: amount }
  }, [items, getProductById])

  const value: CartContextValue = {
    items,
    totalUnits,
    totalAmount,
    cartPulseKey,
    addItem,
    removeItem,
    setQuantity,
    clear,
    getProduct: getProductById,
    syncProducts,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
