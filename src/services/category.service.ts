import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { notFound, conflict } from "@/lib/api";
import { createCategorySchema, updateCategorySchema } from "@/validations/category.validation";
import { mockStore } from "@/lib/mock-store";
import { cacheDeleteByPrefix, cacheGetJSON, cacheSetJSON } from "@/lib/cache";

const CATEGORY_LIST_CACHE_KEY = "categories:list";
const CATEGORY_ID_CACHE_PREFIX = "categories:id:";

async function invalidateCategoryCache() {
  await Promise.all([
    cacheDeleteByPrefix(CATEGORY_LIST_CACHE_KEY),
    cacheDeleteByPrefix(CATEGORY_ID_CACHE_PREFIX),
  ]);
}

export class CategoryService {
  static async findAll(): Promise<any[]> {
    const cached = await cacheGetJSON<any[]>(CATEGORY_LIST_CACHE_KEY);
    if (cached) return cached;

    try {
      const categories = await prisma.category.findMany({
        include: { children: true },
        where: { parentId: null },
        orderBy: { name: "asc" },
      });

      await cacheSetJSON(CATEGORY_LIST_CACHE_KEY, categories, 300);
      return categories;
    } catch {
      return mockStore.listRootCategories();
    }
  }

  static async findById(id: string): Promise<any> {
    const cacheKey = `${CATEGORY_ID_CACHE_PREFIX}${id}`;
    const cached = await cacheGetJSON<any>(cacheKey);
    if (cached) return cached;

    try {
      const category = await prisma.category.findUnique({
        where: { id },
        include: { children: true, products: true },
      });
      if (!category) notFound("Categoria");
      await cacheSetJSON(cacheKey, category, 300);
      return category;
    } catch {
      return mockStore.findCategoryById(id);
    }
  }

  static async create(data: unknown) {
    const parsed = createCategorySchema.parse(data);
    const slug = slugify(parsed.name);

    try {
      const existing = await prisma.category.findUnique({ where: { slug } });
      if (existing) conflict("Ya existe una categoria con ese nombre");

      const created = await prisma.category.create({
        data: { ...parsed, slug },
      });
      await invalidateCategoryCache();
      return created;
    } catch {
      return mockStore.createCategory(parsed);
    }
  }

  static async update(id: string, data: unknown) {
    const parsed = updateCategorySchema.parse(data);

    try {
      await this.findById(id);

      const updateData: Record<string, unknown> = { ...parsed };
      if (parsed.name) {
        updateData.slug = slugify(parsed.name);
        const existing = await prisma.category.findFirst({
          where: { slug: updateData.slug as string, NOT: { id } },
        });
        if (existing) conflict("Ya existe una categoria con ese nombre");
      }

      const updated = await prisma.category.update({
        where: { id },
        data: updateData,
      });
      await invalidateCategoryCache();
      return updated;
    } catch {
      return mockStore.updateCategory(id, parsed);
    }
  }

  static async delete(id: string) {
    try {
      await this.findById(id);
      const deleted = await prisma.category.delete({ where: { id } });
      await invalidateCategoryCache();
      return deleted;
    } catch {
      return mockStore.deleteCategory(id);
    }
  }
}
