import { handler, created } from "@/lib/api"
import { checkoutOrderSchema } from "@/validations/order.validation"
import { OrderService } from "@/services/order.service"
import { rateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"

export const POST = handler(async (req) => {
  const ip =
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown"
  const rl = rateLimit(`checkout-order:${ip}`, 20, 60_000)
  if (!rl.success) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intentá nuevamente en unos segundos." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    ) as never
  }

  const body = checkoutOrderSchema.parse(await req.json())
  const { order, whatsappUrl } = await OrderService.createFromWhatsAppCheckout(body)

  return created({
    id: order.id,
    code: order.code,
    totalProducts: Number(order.totalProducts),
    whatsappUrl,
  })
})
