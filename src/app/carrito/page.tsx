import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { CartView } from "@/components/cart-view"

export default function CartPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[60vh] bg-[color:var(--color-paper)] py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h1 className="font-display text-3xl sm:text-4xl text-ink mb-8">CARRITO</h1>
          <CartView />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
