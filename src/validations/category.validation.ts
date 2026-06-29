import { z } from "zod";

const categoryImageSchema = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) => {
      if (value.startsWith("/")) return true;
      return z.string().url().safeParse(value).success;
    },
    { message: "La imagen debe ser una URL valida o una ruta local" },
  );

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  image: z.preprocess(
    (value) => {
      if (value === null || value === "") return undefined;
      return value;
    },
    categoryImageSchema.optional(),
  ),
  parentId: z.string().uuid().optional(),
  active: z.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();
