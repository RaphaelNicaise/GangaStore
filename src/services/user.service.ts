import { prisma } from "@/lib/prisma";
import { notFound, conflict } from "@/lib/api";
import { createUserSchema, updateUserSchema } from "@/validations/user.validation";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  active: true,
  createdAt: true,
  updatedAt: true,
};

export class UserService {
  static async findAll() {
    return prisma.user.findMany({
      select: userSelect,
      orderBy: { createdAt: "desc" },
    });
  }

  static async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    if (!user) notFound("Usuario");
    return user;
  }

  static async create(data: unknown) {
    const parsed = createUserSchema.parse(data);

    const existing = await prisma.user.findUnique({
      where: { email: parsed.email },
    });
    if (existing) conflict("Ya existe un usuario con ese email");

    const hashedPassword = await bcrypt.hash(parsed.password, SALT_ROUNDS);

    return prisma.user.create({
      data: { ...parsed, password: hashedPassword },
      select: userSelect,
    });
  }

  static async update(id: string, data: unknown) {
    await this.findById(id);
    const parsed = updateUserSchema.parse(data);

    const updateData: Record<string, unknown> = { ...parsed };

    if (parsed.email) {
      const existing = await prisma.user.findFirst({
        where: { email: parsed.email, NOT: { id } },
      });
      if (existing) conflict("Ya existe un usuario con ese email");
    }

    if (parsed.password) {
      updateData.password = await bcrypt.hash(parsed.password, SALT_ROUNDS);
    }

    return prisma.user.update({
      where: { id },
      data: updateData,
      select: userSelect,
    });
  }

  static async delete(id: string) {
    await this.findById(id);
    return prisma.user.delete({ where: { id } });
  }
}
