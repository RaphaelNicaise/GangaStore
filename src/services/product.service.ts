import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify, parsePagination } from "@/lib/utils";
import { notFound, conflict } from "@/lib/api";
import { createProductSchema, updateProductSchema } from "@/validations/product.validation";
import { mockStore } from "@/lib/mock-store";
import {
  cacheDeleteByPrefix,
  cacheGetJSON,
  cacheSetJSON,
  toCacheQueryKey,
} from "@/lib/cache";

type ProductListResult = {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const PRODUCT_LIST_CACHE_PREFIX = "products:list:";
const PRODUCT_ID_CACHE_PREFIX = "products:id:";
const PRODUCT_SLUG_CACHE_PREFIX = "products:slug:";
const PRODUCT_BRANDS_CACHE_KEY = "products:brands";

async function invalidateProductCache() {
  await Promise.all([
    cacheDeleteByPrefix(PRODUCT_LIST_CACHE_PREFIX),
    cacheDeleteByPrefix(PRODUCT_ID_CACHE_PREFIX),
    cacheDeleteByPrefix(PRODUCT_SLUG_CACHE_PREFIX),
    cacheDeleteByPrefix(PRODUCT_BRANDS_CACHE_KEY),
  ]);
}

export class ProductService {
  static async listBrands() {
    const cached = await cacheGetJSON<string[]>(PRODUCT_BRANDS_CACHE_KEY);
    if (cached) return cached;

    try {
      const brands = await prisma.product.findMany({
        where: { brand: { not: null } },
        select: { brand: true },
        distinct: ["brand"],
        orderBy: { brand: "asc" },
      });

      const result = brands
        .map((entry) => entry.brand?.trim())
        .filter((brand): brand is string => Boolean(brand));

      await cacheSetJSON(PRODUCT_BRANDS_CACHE_KEY, result, 600);
      return result;
    } catch {
      return mockStore.listBrands();
    }
  }

  static async findAll(searchParams: URLSearchParams): Promise<ProductListResult> {
    const cacheKey = `${PRODUCT_LIST_CACHE_PREFIX}${toCacheQueryKey(searchParams)}`;
    const cached = await cacheGetJSON<ProductListResult>(cacheKey);
    if (cached) return cached;

    const { page, limit, skip } = parsePagination(searchParams);
    const categoryId = searchParams.get("categoryId") || undefined;
    const rootCategoryId = searchParams.get("rootCategoryId") || undefined;
    const active = searchParams.get("active");
    const search = searchParams.get("search") || undefined;
    const sortByParam = searchParams.get("sortBy") || "createdAt";
    const sortDir: Prisma.SortOrder = searchParams.get("sortDir") === "asc" ? "asc" : "desc";

    const allowedSortFields = new Set(["createdAt", "name", "stock", "precio_minorista", "precio_mayorista"]);
    const sortBy = allowedSortFields.has(sortByParam) ? sortByParam : "createdAt";

    const where: any = {
      ...(categoryId && { categoryId }),
      ...(active !== null && active !== undefined && { active: active === "true" }),
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
      ];
    }

    if (rootCategoryId) {
      where.AND = [
        ...(where.AND ?? []),
        {
          OR: [
            { categoryId: rootCategoryId },
            { category: { parentId: rootCategoryId } },
          ],
        },
      ];
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = sortBy === "createdAt"
      ? { createdAt: sortDir }
      : { [sortBy]: sortDir } as Prisma.ProductOrderByWithRelationInput;

    try {
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: { category: { include: { parent: true } } },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.product.count({ where }),
      ]);

      const result = {
        data: products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      await cacheSetJSON(cacheKey, result, 120);
      return result;
    } catch {
      return mockStore.listProducts({
        page,
        limit,
        skip,
        categoryId,
        rootCategoryId,
        active,
        search,
        sortBy,
        sortDir,
      });
    }
  }

  static async findById(id: string): Promise<any> {
    const cacheKey = `${PRODUCT_ID_CACHE_PREFIX}${id}`;
    const cached = await cacheGetJSON<any>(cacheKey);
    if (cached) return cached;

    try {
      const product = await prisma.product.findUnique({
        where: { id },
        include: { category: { include: { parent: true } } },
      });
      if (!product) notFound("Producto");
      await cacheSetJSON(cacheKey, product, 300);
      return product;
    } catch {
      return mockStore.findProductById(id);
    }
  }

  static async findBySlug(slug: string): Promise<any> {
    const cacheKey = `${PRODUCT_SLUG_CACHE_PREFIX}${slug}`;
    const cached = await cacheGetJSON<any>(cacheKey);
    if (cached) return cached;

    try {
      const product = await prisma.product.findUnique({
        where: { slug },
        include: { category: { include: { parent: true } } },
      });
      if (!product) notFound("Producto");
      await cacheSetJSON(cacheKey, product, 300);
      return product;
    } catch {
      return mockStore.findProductBySlug(slug);
    }
  }

  static async create(data: unknown) {
    const parsed = createProductSchema.parse(data);
    const slug = slugify(parsed.name);

    try {
      const existing = await prisma.product.findUnique({ where: { slug } });
      if (existing) conflict("Ya existe un producto con ese nombre");

      const created = await prisma.product.create({
        data: { ...parsed, slug },
        include: { category: { include: { parent: true } } },
      });
      await invalidateProductCache();
      return created;
    } catch {
      return mockStore.createProduct(parsed);
    }
  }

  static async update(id: string, data: unknown) {
    const parsed = updateProductSchema.parse(data);

    try {
      await this.findById(id);

      const updateData: Record<string, unknown> = { ...parsed };
      if (parsed.name) {
        updateData.slug = slugify(parsed.name);
        const existing = await prisma.product.findFirst({
          where: { slug: updateData.slug as string, NOT: { id } },
        });
        if (existing) conflict("Ya existe un producto con ese nombre");
      }

      const updated = await prisma.product.update({
        where: { id },
        data: updateData,
        include: { category: { include: { parent: true } } },
      });
      await invalidateProductCache();
      return updated;
    } catch {
      return mockStore.updateProduct(id, parsed);
    }
  }

  static async delete(id: string) {
    try {
      await this.findById(id);
      const deleted = await prisma.product.delete({ where: { id } });
      await invalidateProductCache();
      return deleted;
    } catch {
      return mockStore.deleteProduct(id);
    }
  }
}
