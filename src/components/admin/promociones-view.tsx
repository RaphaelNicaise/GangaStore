"use client"

import { useMemo, useState, useEffect } from "react"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Tag,
  Percent,
  DollarSign,
  Package,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import { formatARS, getPromoLabel } from "@/lib/pricing"
import { dbProductToFrontend } from "@/lib/api-client"
import type { Product, ProductPromotion, PromoType } from "@/lib/types"
import { cn } from "@/lib/utils"

const ROWS_PER_PAGE = 8

interface FormState {
  tipo: PromoType
  valor: string
  valor_secundario: string
  activa: boolean
}

const defaultForm: FormState = { tipo: "porcentaje", valor: "", valor_secundario: "", activa: true }

function normalizeProductsResponse(payload: unknown) {
  const raw = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown[] } | null)?.data)
      ? (payload as { data: unknown[] }).data
      : []

  return raw.flatMap((item) => {
    try {
      return [dbProductToFrontend(item as Parameters<typeof dbProductToFrontend>[0])]
    } catch {
      return []
    }
  })
}

function normalizeProductResponse(payload: unknown) {
  const raw =
    payload && typeof payload === "object" && "data" in payload
      ? (payload as { data?: unknown }).data
      : payload

  return dbProductToFrontend(raw as Parameters<typeof dbProductToFrontend>[0])
}

function tipoStyles(tipo: PromoType) {
  switch (tipo) {
    case "porcentaje":
      return "bg-[color:var(--color-pink)] text-ink border-ink/10"
    case "fijo":
      return "bg-ink text-white border-ink"
    case "nxm":
      return "bg-white text-ink border-ink"
  }
}

export function PromocionesView() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"con-promo" | "sin-promo">("con-promo")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const [modalOpen, setModalOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<Product | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/products?limit=500&active=true")
      .then((r) => r.json())
      .then((json) => {
        setProducts(normalizeProductsResponse(json))
      })
      .catch(() => toast.error("Error al cargar productos"))
      .finally(() => setLoading(false))
  }, [])

  const withPromo = useMemo(() => products.filter((p) => p.promotion?.activa), [products])
  const withoutPromo = useMemo(
    () => products.filter((p) => !p.promotion || !p.promotion.activa),
    [products],
  )

  const filtered = useMemo(() => {
    const list = tab === "con-promo" ? withPromo : withoutPromo
    if (!search.trim()) return list
    const q = search.trim().toLowerCase()
    return list.filter((p) => p.name.toLowerCase().includes(q))
  }, [tab, search, withPromo, withoutPromo])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE))
  const paginated = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE)

  const openModal = (product: Product) => {
    setSelected(product)
    if (product.promotion) {
      setForm({
        tipo: product.promotion.tipo,
        valor: product.promotion.valor.toString(),
        valor_secundario: product.promotion.valor_secundario?.toString() ?? "",
        activa: product.promotion.activa,
      })
    } else {
      setForm(defaultForm)
    }
    setModalOpen(true)
  }

  const isFormValid = () => {
    if (!form.valor || parseFloat(form.valor) <= 0) return false
    if (form.tipo === "nxm" && (!form.valor_secundario || parseInt(form.valor_secundario) < 1))
      return false
    if (form.tipo === "porcentaje" && parseFloat(form.valor) > 100) return false
    return true
  }

  const handleSave = async () => {
    if (!selected || !isFormValid()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/products?id=${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promotion_tipo: form.tipo,
          promotion_valor: parseFloat(form.valor),
          promotion_valor_sec: form.tipo === "nxm" ? parseInt(form.valor_secundario) : null,
          promotion_activa: form.activa,
        }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      const fp = normalizeProductResponse(updated)
      setProducts((prev) => prev.map((p) => (p.id === fp.id ? fp : p)))
      setModalOpen(false)
      setSelected(null)
      toast.success("Promoción guardada")
    } catch {
      toast.error("Error al guardar la promoción")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(`/api/products?id=${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promotion_tipo: null,
          promotion_valor: null,
          promotion_valor_sec: null,
          promotion_activa: false,
        }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      const fp = normalizeProductResponse(updated)
      setProducts((prev) => prev.map((p) => (p.id === fp.id ? fp : p)))
      setDeleteOpen(false)
      setSelected(null)
      toast.success("Promoción eliminada")
    } catch {
      toast.error("Error al eliminar la promoción")
    } finally {
      setSaving(false)
    }
  }

  const onNumChange = (field: "valor" | "valor_secundario") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    if (v === "" || /^\d*\.?\d*$/.test(v)) setForm({ ...form, [field]: v })
  }

  if (loading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Cargando productos...</div>
  }

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard icon={Tag} label="Promociones activas" value={withPromo.length} accent />
        <StatCard icon={Package} label="Sin promoción" value={withoutPromo.length} />
        <StatCard icon={Percent} label="Productos totales" value={products.length} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-4 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-[color:var(--color-pink)]"
          />
        </div>
        <div className="inline-flex rounded-full bg-muted p-1">
          <button
            type="button"
            onClick={() => {
              setTab("con-promo")
              setPage(1)
            }}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              tab === "con-promo" ? "bg-white text-ink shadow-sm" : "text-muted-foreground",
            )}
          >
            Con promoción ({withPromo.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("sin-promo")
              setPage(1)
            }}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              tab === "sin-promo" ? "bg-white text-ink shadow-sm" : "text-muted-foreground",
            )}
          >
            Sin promoción ({withoutPromo.length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Producto</th>
                <th className="px-4 py-3 text-right font-semibold">Precio mayorista</th>
                {tab === "con-promo" && <th className="px-4 py-3 font-semibold">Promoción</th>}
                <th className="px-4 py-3 text-center font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={tab === "con-promo" ? 4 : 3} className="px-4 py-16 text-center">
                    <Tag className="mx-auto h-10 w-10 text-muted-foreground/40" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {tab === "con-promo"
                        ? "No hay productos con promociones activas"
                        : "Todos los productos tienen promoción"}
                    </p>
                  </td>
                </tr>
              ) : (
                paginated.map((product) => {
                  const promo = product.promotion
                  return (
                    <tr key={product.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{product.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-ink">
                        {formatARS(product.wholesalePrice)}
                      </td>
                      {tab === "con-promo" && promo && (
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase",
                              tipoStyles(promo.tipo),
                            )}
                          >
                            {getPromoLabel(promo)}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex gap-1">
                          <button
                            type="button"
                            onClick={() => openModal(product)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink hover:bg-[color:var(--color-pink)]"
                            aria-label={promo ? "Editar promoción" : "Agregar promoción"}
                          >
                            {promo ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                          </button>
                          {promo && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelected(product)
                                setDeleteOpen(true)
                              }}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-ink"
                              aria-label="Eliminar promoción"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > ROWS_PER_PAGE && (
          <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-3 text-xs">
            <span className="text-muted-foreground">
              {(page - 1) * ROWS_PER_PAGE + 1}–{Math.min(page * ROWS_PER_PAGE, filtered.length)} de{" "}
              {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={cn(
                    "h-7 w-7 rounded-md text-xs font-semibold",
                    n === page ? "bg-ink text-white" : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear/Editar */}
      {modalOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--color-pink)]">
                <Tag className="h-4 w-4 text-ink" />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl text-ink">
                  {selected.promotion ? "Editar promoción" : "Nueva promoción"}
                </h2>
                <p className="text-xs text-muted-foreground line-clamp-1">{selected.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 px-5 py-5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-ink">
                  Tipo de promoción
                </label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(
                    [
                      ["porcentaje", Percent, "Porcentaje"],
                      ["fijo", DollarSign, "Fijo"],
                      ["nxm", Tag, "NxM"],
                    ] as const
                  ).map(([tipo, Icon, label]) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => setForm({ ...form, tipo, valor: "", valor_secundario: "" })}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-xs font-semibold uppercase transition-colors",
                        form.tipo === tipo
                          ? "border-ink bg-[color:var(--color-pink)] text-ink"
                          : "border-border text-muted-foreground hover:border-ink/40",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={form.tipo === "nxm" ? "grid grid-cols-2 gap-3" : ""}>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-ink">
                    {form.tipo === "porcentaje"
                      ? "Porcentaje (%)"
                      : form.tipo === "fijo"
                      ? "Monto a descontar"
                      : "N (lleva)"}
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.valor}
                    onChange={onNumChange("valor")}
                    placeholder={form.tipo === "porcentaje" ? "10" : form.tipo === "fijo" ? "5000" : "3"}
                    className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm focus:border-ink focus:outline-none"
                  />
                </div>
                {form.tipo === "nxm" && (
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-ink">
                      M (paga)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.valor_secundario}
                      onChange={onNumChange("valor_secundario")}
                      placeholder="2"
                      className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm focus:border-ink focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <label className="flex items-center justify-between rounded-xl border border-border px-3 py-3 text-sm">
                <span className="text-ink">Promoción activa</span>
                <input
                  type="checkbox"
                  checked={form.activa}
                  onChange={(e) => setForm({ ...form, activa: e.target.checked })}
                  className="h-5 w-5 rounded border-border accent-[color:var(--color-ink)]"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!isFormValid() || saving}
                className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar promoción"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {deleteOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDeleteOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-display text-2xl text-ink">¿Eliminar promoción?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              La promoción de <strong>{selected.name}</strong> dejará de aplicarse.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
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
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-3 font-display text-3xl text-ink">{value}</p>
    </div>
  )
}
