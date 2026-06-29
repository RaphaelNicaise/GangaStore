import { handler, ok } from "@/lib/api"
import { OrderService } from "@/services/order.service"

export const GET = handler(async (_req, context) => {
  const { id } = await context.params
  const data = await OrderService.findById(id)
  return ok(data)
})
