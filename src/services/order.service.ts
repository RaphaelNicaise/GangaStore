import { prisma } from "@/lib/prisma"
import { badRequest, notFound } from "@/lib/api"
import { dbProductToFrontend } from "@/lib/api-client"
import { formatARS, getPriceBreakdown } from "@/lib/pricing"

type CheckoutItemInput = {
  productId: string
  quantity: number
}

type CheckoutInput = {
  customerFirstName: string
  customerLastName: string
  customerPhone: string
  items: CheckoutItemInput[]
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "")
}

function buildOrderCode(): string {
  const now = new Date()
  const y = now.getFullYear().toString().slice(-2)
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  const random = Math.floor(1000 + Math.random() * 9000)
  return `TS-${y}${m}${d}-${random}`
}

export class OrderService {
  static async createFromWhatsAppCheckout(input: CheckoutInput) {
    const customerFirstName = input.customerFirstName.trim()
    const customerLastName = input.customerLastName.trim()
    const customerPhone = normalizePhone(input.customerPhone)

    if (!customerFirstName || !customerLastName) {
      badRequest("Nombre y apellido son obligatorios")
    }
    if (customerPhone.length < 8) {
      badRequest("Número de teléfono inválido")
    }
    if (!Array.isArray(input.items) || input.items.length === 0) {
      badRequest("El carrito está vacío")
    }

    const merged = new Map<string, number>()
    for (const item of input.items) {
      if (!item.productId || item.quantity <= 0) continue
      merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity)
    }
    if (merged.size === 0) badRequest("No hay items válidos en el pedido")

    const ids = Array.from(merged.keys())
    const products = await prisma.product.findMany({
      where: { id: { in: ids }, active: true },
      include: { category: { include: { parent: true } } },
    })

    if (products.length !== ids.length) {
      badRequest("Uno o más productos ya no están disponibles")
    }

    const productMap = new Map(products.map((p: any) => [p.id, p]))

    const lines = ids.map((productId) => {
      const raw = productMap.get(productId)
      if (!raw) badRequest("Producto no encontrado")
      const product = dbProductToFrontend(raw)
      const quantity = merged.get(productId) ?? 1
      const breakdown = getPriceBreakdown(product, quantity)
      return {
        raw,
        product,
        quantity,
        unitPrice: breakdown.unitPrice,
        lineTotal: breakdown.total,
      }
    })

    const subtotalProducts = lines.reduce((acc, l) => acc + l.unitPrice * l.quantity, 0)
    const totalProducts = lines.reduce((acc, l) => acc + l.lineTotal, 0)

    let code = buildOrderCode()
    let retries = 0
    while (retries < 4) {
      const exists = await prisma.order.findUnique({ where: { code } })
      if (!exists) break
      code = buildOrderCode()
      retries++
    }

    const messageLines = lines
      .map(
        (l, idx) =>
          `${idx + 1}. ${l.product.name}\n` +
          `   Cantidad: ${l.quantity}\n` +
          `   Precio unitario: ${formatARS(l.unitPrice)}\n` +
          `   Subtotal: ${formatARS(l.lineTotal)}`,
      )
      .join("\n\n")

    const whatsappMessage =
      `Hola TermoStore! Quiero confirmar este pedido.\n\n` +
      `ID Pedido: ${code}\n` +
      `Cliente: ${customerFirstName} ${customerLastName}\n` +
      `Teléfono: ${customerPhone}\n\n` +
      `${messageLines}\n\n` +
      `Total productos (sin envío): ${formatARS(totalProducts)}\n\n` +
      `Gracias!`

    const order = await prisma.order.create({
      data: {
        code,
        customerFirstName,
        customerLastName,
        customerPhone,
        subtotalProducts,
        totalProducts,
        whatsappMessage,
        items: {
          create: lines.map((l) => ({
            productId: l.raw.id,
            productName: l.product.name,
            productSlug: l.product.slug,
            unitPrice: l.unitPrice,
            quantity: l.quantity,
            lineTotal: l.lineTotal,
          })),
        },
      },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
    })

    const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5491100000000").replace(/\D/g, "")
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`

    return {
      order,
      whatsappUrl,
    }
  }

  static async findAll(params: URLSearchParams) {
    const phone = (params.get("phone") ?? "").trim()
    const limit = Math.min(100, Math.max(1, Number(params.get("limit") ?? 50)))

    const data = await prisma.order.findMany({
      where: {
        ...(phone
          ? {
              customerPhone: {
                contains: phone.replace(/\D/g, ""),
              },
            }
          : {}),
      },
      include: {
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return data
  }

  static async findById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
    })

    if (!order) notFound("Pedido")
    return order
  }
}
