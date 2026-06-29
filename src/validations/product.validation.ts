import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  precio_minorista: z.number().positive(),
  precio_mayorista: z.number().positive(),
  wholesale_min_qty: z.number().int().min(1).optional(),
  bulk_discount_min_qty: z.number().int().min(1).optional(),
  bulk_discount_pct: z.number().min(0).max(100).optional(),
  images: z.array(z.string()).optional().default([]),
  brand: z.string().max(100).optional(),
  stock: z.number().int().min(0).optional().default(0),
  highlights: z.array(z.string()).optional().default([]),
  promotion_tipo: z.enum(["porcentaje", "fijo", "nxm"]).nullable().optional(),
  promotion_valor: z.number().positive().nullable().optional(),
  promotion_valor_sec: z.number().int().positive().nullable().optional(),
  promotion_activa: z.boolean().optional().default(false),
  active: z.boolean().optional(),
  categoryId: z.string().uuid(),
});

export const updateProductSchema = createProductSchema.partial();
