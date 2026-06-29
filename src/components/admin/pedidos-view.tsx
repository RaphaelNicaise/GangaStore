"use client"

import { useEffect, useState } from "react"
import { Loader2, RefreshCw, FileText, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface OrderRow {
  id: string
  code: string
  customerFirstName: string
  customerLastName: string
  customerPhone: string
  totalProducts: number
  status: string
  createdAt: string
  _count: { items: number }
}

interface OrderDetailItem {
  id: string
  productName: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

interface OrderDetail {
  id: string
  code: string
  customerFirstName: string
  customerLastName: string
  customerPhone: string
  totalProducts: number
  status: string
  whatsappMessage: string
  createdAt: string
  items: OrderDetailItem[]
}

function formatARS(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value)
}

export function PedidosView() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [phoneFilter, setPhoneFilter] = useState("")

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const loadOrders = async (phone?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("limit", "100")
      if (phone) params.set("phone", phone)

      const res = await fetch(`/api/orders?${params.toString()}`)
      const json = await res.json()
      setOrders(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOrders()
  }, [])

  const openOrder = async (id: string) => {
    setSelectedOrderId(id)
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/orders/${id}`)
      const json = await res.json()
      setSelectedOrder(json)
    } finally {
      setLoadingDetail(false)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Panel
        </p>
        <h1 className="mt-1 font-display text-4xl text-ink">PEDIDOS</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pedidos registrados al enviar WhatsApp, agrupables por teléfono.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={phoneFilter}
            onChange={(e) => setPhoneFilter(e.target.value)}
            placeholder="Filtrar por teléfono..."
            className="pl-9"
          />
        </div>
        <Button onClick={() => void loadOrders(phoneFilter)}>Filtrar</Button>
        <Button variant="outline" onClick={() => void loadOrders(phoneFilter)}>
          <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-ink/80">ID Pedido</th>
                <th className="px-4 py-3 text-left font-semibold text-ink/80">Cliente</th>
                <th className="px-4 py-3 text-left font-semibold text-ink/80">Teléfono</th>
                <th className="px-4 py-3 text-left font-semibold text-ink/80">Items</th>
                <th className="px-4 py-3 text-left font-semibold text-ink/80">Total</th>
                <th className="px-4 py-3 text-left font-semibold text-ink/80">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    No hay pedidos
                  </td>
                </tr>
              )}
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => void openOrder(order.id)}
                >
                  <td className="px-4 py-3 font-medium text-ink">{order.code}</td>
                  <td className="px-4 py-3 text-ink/80">
                    {order.customerFirstName} {order.customerLastName}
                  </td>
                  <td className="px-4 py-3 text-ink/80">{order.customerPhone}</td>
                  <td className="px-4 py-3 text-ink/80">{order._count.items}</td>
                  <td className="px-4 py-3 text-ink/80">{formatARS(Number(order.totalProducts))}</td>
                  <td className="px-4 py-3 text-ink/70">
                    {new Date(order.createdAt).toLocaleString("es-AR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!selectedOrderId} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedOrder
                ? `Pedido ${selectedOrder.code} · ${selectedOrder.customerFirstName} ${selectedOrder.customerLastName}`
                : "Detalle de pedido"}
            </DialogTitle>
          </DialogHeader>

          {loadingDetail || !selectedOrder ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="space-y-2 text-sm">
                <p><span className="font-semibold">Teléfono:</span> {selectedOrder.customerPhone}</p>
                <p><span className="font-semibold">Fecha:</span> {new Date(selectedOrder.createdAt).toLocaleString("es-AR")}</p>
              </div>

              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-3 py-2 text-left">Producto</th>
                      <th className="px-3 py-2 text-left">Cantidad</th>
                      <th className="px-3 py-2 text-left">Unitario</th>
                      <th className="px-3 py-2 text-left">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2">{item.productName}</td>
                        <td className="px-3 py-2">{item.quantity}</td>
                        <td className="px-3 py-2">{formatARS(Number(item.unitPrice))}</td>
                        <td className="px-3 py-2">{formatARS(Number(item.lineTotal))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-lg font-semibold text-ink">
                  Total productos: {formatARS(Number(selectedOrder.totalProducts))}
                </p>
                <Button asChild variant="outline">
                  <a
                    href={`/api/orders/${selectedOrder.id}/invoice`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText className="mr-2 h-4 w-4" /> Ver factura PDF
                  </a>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
