import { PromocionesView } from "@/components/admin/promociones-view"

export const metadata = {
  title: "Admin · Promociones — TermoStore",
}

export default function AdminPromocionesPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Panel
        </p>
        <h1 className="mt-1 font-display text-4xl text-ink">PROMOCIONES</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configurá promos por porcentaje, monto fijo o NxM en tus productos.
        </p>
      </header>
      <PromocionesView />
    </div>
  )
}
