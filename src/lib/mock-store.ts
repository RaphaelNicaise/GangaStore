import { categories as seedCategories, products as seedProducts } from "@/lib/data";
import { conflict, notFound } from "@/lib/api";
import { slugify } from "@/lib/utils";

type MockCategory = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  parentId: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type MockProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  precio_minorista: number;
  precio_mayorista: number;
  wholesale_min_qty: number;
  bulk_discount_min_qty: number;
  bulk_discount_pct: number;
  images: string[];
  brand: string | null;
  stock: number;
  highlights: string[];
  promotion_tipo: string | null;
  promotion_valor: number | null;
  promotion_valor_sec: number | null;
  promotion_activa: boolean;
  active: boolean;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
};

type MockStoreState = {
  categories: MockCategory[];
  products: MockProduct[];
  nextCategorySeq: number;
  nextProductSeq: number;
};

type ProductFilters = {
  page: number;
  limit: number;
  skip: number;
  categoryId?: string;
  rootCategoryId?: string;
  active?: string | null;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
};

const globalForMockStore = globalThis as typeof globalThis & {
  __termostoreMockStore?: MockStoreState;
};

function makeUuid(sequence: number) {
  return `00000000-0000-4000-8000-${sequence.toString().padStart(12, "0")}`;
}

function cloneDate(date: Date) {
  return new Date(date);
}

function buildInitialState(): MockStoreState {
  const now = new Date();
  let sequence = 1;

  const rootCategoryIds = new Map<string, string>();
  const subcategoryIds = new Map<string, string>();

  const categories: MockCategory[] = [];

  seedCategories.forEach((category) => {
    const rootId = makeUuid(sequence++);
    rootCategoryIds.set(category.id, rootId);

    categories.push({
      id: rootId,
      name: category.name,
      slug: category.slug,
      image: null,
      parentId: null,
      active: true,
      createdAt: cloneDate(now),
      updatedAt: cloneDate(now),
    });

    category.subcategories.forEach((subcategory) => {
      const subId = makeUuid(sequence++);
      subcategoryIds.set(`${category.id}:${subcategory.id}`, subId);
      categories.push({
        id: subId,
        name: subcategory.name,
        slug: subcategory.id,
        image: null,
        parentId: rootId,
        active: true,
        createdAt: cloneDate(now),
        updatedAt: cloneDate(now),
      });
    });
  });

  const products: MockProduct[] = seedProducts.map((product) => {
    const categoryId = product.subcategoryId
      ? subcategoryIds.get(`${product.categoryId}:${product.subcategoryId}`)
      : rootCategoryIds.get(product.categoryId);

    if (!categoryId) {
      throw new Error(`Mock product category not found for ${product.slug}`);
    }

    return {
      id: makeUuid(sequence++),
      name: product.name,
      slug: product.slug,
      description: product.description,
      precio_minorista: product.retailPrice,
      precio_mayorista: product.wholesalePrice,
      wholesale_min_qty: 3,
      bulk_discount_min_qty: 10,
      bulk_discount_pct: 5,
      images: product.imageUrl ? [product.imageUrl] : [],
      brand: product.brand ?? null,
      stock: product.stock,
      highlights: product.highlights ?? [],
      promotion_tipo: product.promotion?.tipo ?? null,
      promotion_valor: product.promotion?.valor ?? null,
      promotion_valor_sec: product.promotion?.valor_secundario ?? null,
      promotion_activa: product.promotion?.activa ?? false,
      active: true,
      categoryId,
      createdAt: cloneDate(now),
      updatedAt: cloneDate(now),
    };
  });

  return {
    categories,
    products,
    nextCategorySeq: sequence,
    nextProductSeq: sequence + 1000,
  };
}

function getState() {
  if (!globalForMockStore.__termostoreMockStore) {
    globalForMockStore.__termostoreMockStore = buildInitialState();
  }
  return globalForMockStore.__termostoreMockStore;
}

function toCategoryWithChildren(category: MockCategory) {
  const state = getState();
  const children = state.categories
    .filter((item) => item.parentId === category.id)
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((item) => ({ ...item }));

  return {
    ...category,
    children,
  };
}

function toCategoryWithRelations(category: MockCategory) {
  const state = getState();
  const children = state.categories
    .filter((item) => item.parentId === category.id)
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((item) => ({ ...item }));
  const products = state.products
    .filter((item) => item.categoryId === category.id)
    .map((item) => ({ ...item }));

  return {
    ...category,
    children,
    products,
  };
}

function toProductWithCategory(product: MockProduct) {
  const state = getState();
  const category = state.categories.find((item) => item.id === product.categoryId);
  if (!category) notFound("Categoria");
  const parent = category.parentId
    ? state.categories.find((item) => item.id === category.parentId) ?? null
    : null;

  return {
    ...product,
    category: {
      ...category,
      parent,
    },
  };
}

export const mockStore = {
  listRootCategories() {
    const state = getState();
    return state.categories
      .filter((item) => item.parentId === null)
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(toCategoryWithChildren);
  },

  findCategoryById(id: string) {
    const category = getState().categories.find((item) => item.id === id);
    if (!category) notFound("Categoria");
    return toCategoryWithRelations(category);
  },

  createCategory(data: { name: string; image?: string; parentId?: string; active?: boolean }) {
    const state = getState();
    const slug = slugify(data.name);
    const existing = state.categories.find((item) => item.slug === slug);
    if (existing) conflict("Ya existe una categoria con ese nombre");
    if (data.parentId && !state.categories.some((item) => item.id === data.parentId)) {
      notFound("Categoria");
    }

    const now = new Date();
    const category: MockCategory = {
      id: makeUuid(state.nextCategorySeq++),
      name: data.name,
      slug,
      image: data.parentId ? null : data.image ?? null,
      parentId: data.parentId ?? null,
      active: data.active ?? true,
      createdAt: now,
      updatedAt: now,
    };

    state.categories.push(category);
    return { ...category };
  },

  updateCategory(id: string, data: { name?: string; image?: string; parentId?: string; active?: boolean }) {
    const state = getState();
    const category = state.categories.find((item) => item.id === id);
    if (!category) notFound("Categoria");

    if (data.name) {
      const nextSlug = slugify(data.name);
      const existing = state.categories.find((item) => item.slug === nextSlug && item.id !== id);
      if (existing) conflict("Ya existe una categoria con ese nombre");
      category.name = data.name;
      category.slug = nextSlug;
    }

    if (data.parentId !== undefined) {
      if (data.parentId && !state.categories.some((item) => item.id === data.parentId)) {
        notFound("Categoria");
      }
      category.parentId = data.parentId || null;
      if (category.parentId) category.image = null;
    }

    if (data.image !== undefined && !category.parentId) {
      category.image = data.image ?? null;
    }

    if (data.active !== undefined) category.active = data.active;
    category.updatedAt = new Date();

    return { ...category };
  },

  deleteCategory(id: string) {
    const state = getState();
    const category = state.categories.find((item) => item.id === id);
    if (!category) notFound("Categoria");

    if (state.categories.some((item) => item.parentId === id)) {
      conflict("No se puede eliminar una categoria con subcategorias");
    }
    if (state.products.some((item) => item.categoryId === id)) {
      conflict("No se puede eliminar una categoria con productos asociados");
    }

    state.categories = state.categories.filter((item) => item.id !== id);
    return { ...category };
  },

  listProducts(filters: ProductFilters) {
    const state = getState();
    let data = state.products.slice();

    if (filters.categoryId) data = data.filter((item) => item.categoryId === filters.categoryId);
    if (filters.rootCategoryId) {
      data = data.filter((item) => {
        const category = state.categories.find((candidate) => candidate.id === item.categoryId);
        return item.categoryId === filters.rootCategoryId || category?.parentId === filters.rootCategoryId;
      });
    }
    if (filters.active !== null && filters.active !== undefined) {
      data = data.filter((item) => item.active === (filters.active === "true"));
    }
    if (filters.search) {
      const query = filters.search.toLowerCase();
      data = data.filter((item) =>
        item.name.toLowerCase().includes(query) ||
        (item.description ?? "").toLowerCase().includes(query) ||
        (item.brand ?? "").toLowerCase().includes(query),
      );
    }

    const sortDir = filters.sortDir === "asc" ? 1 : -1;
    switch (filters.sortBy) {
      case "name":
        data.sort((left, right) => left.name.localeCompare(right.name) * sortDir);
        break;
      case "stock":
        data.sort((left, right) => (left.stock - right.stock) * sortDir);
        break;
      case "precio_minorista":
        data.sort((left, right) => (left.precio_minorista - right.precio_minorista) * sortDir);
        break;
      case "precio_mayorista":
        data.sort((left, right) => (left.precio_mayorista - right.precio_mayorista) * sortDir);
        break;
      default:
        data.sort((left, right) => (right.createdAt.getTime() - left.createdAt.getTime()) * sortDir);
        break;
    }

    const total = data.length;
    const paginated = data.slice(filters.skip, filters.skip + filters.limit).map(toProductWithCategory);

    return {
      data: paginated,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  },

  listBrands() {
    const state = getState();
    return Array.from(
      new Set(
        state.products
          .map((item) => item.brand?.trim())
          .filter((brand): brand is string => Boolean(brand)),
      ),
    ).sort((left, right) => left.localeCompare(right));
  },

  findProductById(id: string) {
    const product = getState().products.find((item) => item.id === id);
    if (!product) notFound("Producto");
    return toProductWithCategory(product);
  },

  findProductBySlug(slug: string) {
    const product = getState().products.find((item) => item.slug === slug);
    if (!product) notFound("Producto");
    return toProductWithCategory(product);
  },

  createProduct(data: {
    name: string;
    description?: string;
    precio_minorista: number;
    precio_mayorista: number;
    wholesale_min_qty?: number;
    bulk_discount_min_qty?: number;
    bulk_discount_pct?: number;
    images?: string[];
    brand?: string;
    stock?: number;
    highlights?: string[];
    promotion_tipo?: string | null;
    promotion_valor?: number | null;
    promotion_valor_sec?: number | null;
    promotion_activa?: boolean;
    active?: boolean;
    categoryId: string;
  }) {
    const state = getState();
    const slug = slugify(data.name);
    const existing = state.products.find((item) => item.slug === slug);
    if (existing) conflict("Ya existe un producto con ese nombre");
    if (!state.categories.some((item) => item.id === data.categoryId)) {
      notFound("Categoria");
    }

    const now = new Date();
    const product: MockProduct = {
      id: makeUuid(state.nextProductSeq++),
      name: data.name,
      slug,
      description: data.description ?? null,
      precio_minorista: data.precio_minorista,
      precio_mayorista: data.precio_mayorista,
      wholesale_min_qty: data.wholesale_min_qty ?? 3,
      bulk_discount_min_qty: data.bulk_discount_min_qty ?? 10,
      bulk_discount_pct: data.bulk_discount_pct ?? 5,
      images: data.images ?? [],
      brand: data.brand ?? null,
      stock: data.stock ?? 0,
      highlights: data.highlights ?? [],
      promotion_tipo: data.promotion_tipo ?? null,
      promotion_valor: data.promotion_valor ?? null,
      promotion_valor_sec: data.promotion_valor_sec ?? null,
      promotion_activa: data.promotion_activa ?? false,
      active: data.active ?? true,
      categoryId: data.categoryId,
      createdAt: now,
      updatedAt: now,
    };

    state.products.push(product);
    return toProductWithCategory(product);
  },

  updateProduct(
    id: string,
    data: {
      name?: string;
      description?: string;
      precio_minorista?: number;
      precio_mayorista?: number;
      wholesale_min_qty?: number;
      bulk_discount_min_qty?: number;
      bulk_discount_pct?: number;
      images?: string[];
      brand?: string | null;
      stock?: number;
      highlights?: string[];
      promotion_tipo?: string | null;
      promotion_valor?: number | null;
      promotion_valor_sec?: number | null;
      promotion_activa?: boolean;
      active?: boolean;
      categoryId?: string;
    },
  ) {
    const state = getState();
    const product = state.products.find((item) => item.id === id);
    if (!product) notFound("Producto");

    if (data.name) {
      const nextSlug = slugify(data.name);
      const existing = state.products.find((item) => item.slug === nextSlug && item.id !== id);
      if (existing) conflict("Ya existe un producto con ese nombre");
      product.name = data.name;
      product.slug = nextSlug;
    }

    if (data.categoryId) {
      if (!state.categories.some((item) => item.id === data.categoryId)) {
        notFound("Categoria");
      }
      product.categoryId = data.categoryId;
    }

    if (data.description !== undefined) product.description = data.description ?? null;
    if (data.precio_minorista !== undefined) product.precio_minorista = data.precio_minorista;
    if (data.precio_mayorista !== undefined) product.precio_mayorista = data.precio_mayorista;
    if (data.wholesale_min_qty !== undefined) product.wholesale_min_qty = data.wholesale_min_qty;
    if (data.bulk_discount_min_qty !== undefined) product.bulk_discount_min_qty = data.bulk_discount_min_qty;
    if (data.bulk_discount_pct !== undefined) product.bulk_discount_pct = data.bulk_discount_pct;
    if (data.images !== undefined) product.images = data.images;
    if (data.brand !== undefined) product.brand = data.brand ?? null;
    if (data.stock !== undefined) product.stock = data.stock;
    if (data.highlights !== undefined) product.highlights = data.highlights;
    if (data.promotion_tipo !== undefined) product.promotion_tipo = data.promotion_tipo;
    if (data.promotion_valor !== undefined) product.promotion_valor = data.promotion_valor;
    if (data.promotion_valor_sec !== undefined) product.promotion_valor_sec = data.promotion_valor_sec;
    if (data.promotion_activa !== undefined) product.promotion_activa = data.promotion_activa;
    if (data.active !== undefined) product.active = data.active;
    product.updatedAt = new Date();

    return toProductWithCategory(product);
  },

  deleteProduct(id: string) {
    const state = getState();
    const product = state.products.find((item) => item.id === id);
    if (!product) notFound("Producto");
    state.products = state.products.filter((item) => item.id !== id);
    return { ...product };
  },
};