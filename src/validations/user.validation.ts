import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(6).max(100),
  role: z.enum(["ADMIN", "CUSTOMER"]).optional(),
});

export const updateUserSchema = createUserSchema.partial();
