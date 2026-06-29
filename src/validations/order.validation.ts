import { z } from "zod"

export const checkoutOrderSchema = z.object({
  customerFirstName: z.string().min(1).max(80),
  customerLastName: z.string().min(1).max(80),
  customerPhone: z.string().min(6).max(30),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
})
