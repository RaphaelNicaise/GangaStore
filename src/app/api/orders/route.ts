import { handler, ok } from "@/lib/api"
import { OrderService } from "@/services/order.service"

export const GET = handler(async (req) => {
  const params = new URL(req.url).searchParams
  const data = await OrderService.findAll(params)
  return ok({ data })
})
