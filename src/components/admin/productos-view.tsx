"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  Check,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Filter,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"
import { ImageUploader } from "./image-uploader"

interface Subcategory {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
  children: Subcategory[]
}

interface Product {
  id: string
  name: string
  slug: string
  brand: string | null
  precio_minorista: number
  precio_mayorista: number
  stock: number
  active: boolean
  images: string[]
  description: string | null
  highlights: string[]
  wholesale_min_qty: number
  categoryId: string
}

interface ProductsPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const PAGE_SIZE = 20

const EMPTY_FORM = {
  name: "",
  slug: "",
  description: "",
  brand: "",
  precio_minorista: "",
  precio_mayorista: "",
  wholesale_min_qty: "3",
  stock: "0",
  highlights: "",
  rootCategoryId: "",
  subcategoryId: "",
  active: true,
}

type ProductFormState = typeof EMPTY_FORM
type SortField = "name" | "stock" | "precio_minorista" | "precio_mayorista"

function buildPageItems(currentPage: number, totalPages: number) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1)
  if (currentPage <= 3) return [1, 2, 3, 4, "ellipsis", totalPages] as const
  if (currentPage >= totalPages - 2) {
    return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as const
  }
  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages] as const
}

export function ProductosView() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brandOptions, setBrandOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<ProductFormState>(EMPTY_FORM)
  const [formImages, setFormImages] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [creatingSubcategory, setCreatingSubcategory] = useState(false)
  const [newSubcategoryName, setNewSubcategoryName] = useState("")

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [sortField, setSortField] = useState<SortField>("name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [categoryFilterId, setCategoryFilterId] = useState("")
  const [subcategoryFilterId, setSubcategoryFilterId] = useState("")
  const [categoryFilterOpen, setCategoryFilterOpen] = useState(false)
  const [brandPopoverOpen, setBrandPopoverOpen] = useState(false)
  const [brandQuery, setBrandQuery] = useState("")

  const selectedFormRootCategory = useMemo(
    () => categories.find((category) => category.id === formData.rootCategoryId) ?? null,
    [categories, formData.rootCategoryId],
  )

  const selectedFilterRootCategory = useMemo(
    () => categories.find((category) => category.id === categoryFilterId) ?? null,
    [categories, categoryFilterId],
  )

  const categoryLabelById = useMemo(() => {
    const entries = new Map<string, string>()
    categories.forEach((category) => {
      entries.set(category.id, category.name)
      category.children.forEach((subcategory) => {
        entries.set(subcategory.id, `${category.name} › ${subcategory.name}`)
      })
    })
    return entries
  }, [categories])

  const activeFilterLabel = subcategoryFilterId
    ? (categoryLabelById.get(subcategoryFilterId) ?? "Subcategoría")
    : categoryFilterId
      ? (categoryLabelById.get(categoryFilterId) ?? "Categoría")
      : "Todas"

  const filteredBrandOptions = useMemo(() => {
    const normalizedQuery = brandQuery.trim().toLowerCase()
    if (!normalizedQuery) return brandOptions
    return brandOptions.filter((brand) => brand.toLowerCase().includes(normalizedQuery))
  }, [brandOptions, brandQuery])

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    let list = products.filter((product) => {
      if (subcategoryFilterId && product.categoryId !== subcategoryFilterId) return false

      if (categoryFilterId) {
        const selectedCategory = categories.find((category) => category.id === categoryFilterId)
        if (!selectedCategory) return false
        const categoryMatches = product.categoryId === selectedCategory.id
          || selectedCategory.children.some((subcategory) => subcategory.id === product.categoryId)
        if (!categoryMatches) return false
      }

      if (!normalizedSearch) return true
      return (
        product.name.toLowerCase().includes(normalizedSearch)
        || (product.brand ?? "").toLowerCase().includes(normalizedSearch)
        || (product.description ?? "").toLowerCase().includes(normalizedSearch)
      )
    })

    list = [...list].sort((left, right) => {
      const dir = sortDir === "asc" ? 1 : -1
      if (sortField === "name") return left.name.localeCompare(right.name) * dir
      if (sortField === "stock") return (left.stock - right.stock) * dir
      if (sortField === "precio_minorista") return (left.precio_minorista - right.precio_minorista) * dir
      if (sortField === "precio_mayorista") return (left.precio_mayorista - right.precio_mayorista) * dir
      return 0
    })

    return list
  }, [products, search, categoryFilterId, subcategoryFilterId, categories, sortField, sortDir])

  const pagination = useMemo<ProductsPagination>(() => {
    const total = filteredProducts.length
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
    const safePage = Math.min(page, totalPages)
    return {
      page: safePage,
      limit: PAGE_SIZE,
      total,
      totalPages,
    }
  }, [filteredProducts.length, page])

  const visibleProducts = useMemo(() => {
    const start = (pagination.page - 1) * PAGE_SIZE
    return filteredProducts.slice(start, start + PAGE_SIZE)
  }, [filteredProducts, pagination.page])

  useEffect(() => {
    if (page !== pagination.page) setPage(pagination.page)
  }, [page, pagination.page])

  useEffect(() => {
    let cancelled = false

    const loadMeta = async () => {
      try {
        const [categoriesResponse, brandsResponse] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/products?brandsOnly=true"),
        ])
        const categoriesJson = await categoriesResponse.json().catch(() => ({}))
        const brandsJson = await brandsResponse.json().catch(() => ({}))

        if (cancelled) return

        const categoriesList = Array.isArray(categoriesJson) ? categoriesJson : (categoriesJson.data ?? [])
        const brandsList = Array.isArray(brandsJson) ? brandsJson : (brandsJson.data ?? [])

        setCategories(Array.isArray(categoriesList) ? categoriesList : [])
        setBrandOptions(Array.isArray(brandsList) ? brandsList.filter(Boolean) : [])

        if (!categoriesResponse.ok || !brandsResponse.ok) {
          toast.error("No se pudieron cargar las opciones del formulario")
        }
      } catch {
        if (!cancelled) toast.error("No se pudieron cargar las opciones del formulario")
      }
    }

    void loadMeta()
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  useEffect(() => {
    let cancelled = false

    const loadProducts = async () => {
      setLoading(true)
      try {
        const allProducts: Product[] = []
        let apiPage = 1
        let totalPages = 1

        while (apiPage <= totalPages) {
          const params = new URLSearchParams({
            page: String(apiPage),
            limit: "100",
          })

          const response = await fetch(`/api/products?${params.toString()}`)
          const json = await response.json().catch(() => ({}))

          if (cancelled) return
          if (!response.ok) {
            toast.error((json as { error?: string }).error ?? "Error al cargar productos")
            break
          }

          const chunk = Array.isArray(json) ? json : (json.data ?? [])
          if (!Array.isArray(chunk) || chunk.length === 0) break
          allProducts.push(...chunk)

          totalPages = Array.isArray(json)
            ? 1
            : Number((json as { pagination?: { totalPages?: number } }).pagination?.totalPages ?? 1)
          apiPage += 1
        }

        setProducts(allProducts)
      } catch {
        if (!cancelled) {
          setProducts([])
          toast.error("Error al cargar productos")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadProducts()
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  const openCreate = () => {
    setEditingId(null)
    setFormData(EMPTY_FORM)
    setFormImages([])
    setNewSubcategoryName("")
    setBrandQuery("")
    setModalOpen(true)
  }

  const openEdit = (product: Product) => {
    const rootCategory = categories.find((category) => category.id === product.categoryId)
      ?? categories.find((category) => category.children.some((subcategory) => subcategory.id === product.categoryId))
      ?? null
    const subcategory = rootCategory?.children.find((item) => item.id === product.categoryId) ?? null

    setEditingId(product.id)
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description ?? "",
      brand: product.brand ?? "",
      precio_minorista: String(product.precio_minorista),
      precio_mayorista: String(product.precio_mayorista),
      wholesale_min_qty: String(product.wholesale_min_qty),
      stock: String(product.stock),
      highlights: product.highlights.join(", "),
      rootCategoryId: rootCategory?.id ?? "",
      subcategoryId: subcategory?.id ?? "",
      active: product.active,
    })
    setFormImages(product.images ?? [])
    setNewSubcategoryName("")
    setBrandQuery(product.brand ?? "")
    setModalOpen(true)
  }

  const handleField = (key: keyof ProductFormState, value: string | boolean) => {
    setFormData((previous) => ({ ...previous, [key]: value }))
  }

  const handleNameChange = (value: string) => {
    handleField("name", value)
    if (!editingId) {
      handleField(
        "slug",
        value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      )
    }
  }

  const handleRootCategoryChange = (value: string) => {
    setFormData((previous) => ({
      ...previous,
      rootCategoryId: value,
      subcategoryId: "",
    }))
    setNewSubcategoryName("")
  }

  const handleCreateSubcategory = async () => {
    if (!formData.rootCategoryId) {
      toast.error("Primero elegí una categoría")
      return
    }
    if (!newSubcategoryName.trim()) {
      toast.error("Escribí el nombre de la subcategoría")
      return
    }

    setCreatingSubcategory(true)
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSubcategoryName.trim(),
          parentId: formData.rootCategoryId,
          active: true,
        }),
      })
      const json = await response.json().catch(() => ({}))

      if (!response.ok) {
        toast.error((json as { error?: string }).error ?? "No se pudo crear la subcategoría")
        return
      }

      const created = json as { id: string; name: string }
      setCategories((previous) => previous.map((category) => {
        if (category.id !== formData.rootCategoryId) return category
        const nextChildren = [...category.children, { id: created.id, name: created.name }]
          .sort((left, right) => left.name.localeCompare(right.name))
        return { ...category, children: nextChildren }
      }))
      setFormData((previous) => ({ ...previous, subcategoryId: created.id }))
      setNewSubcategoryName("")
      toast.success("Subcategoría creada y seleccionada")
      setRefreshKey((current) => current + 1)
    } catch {
      toast.error("No se pudo crear la subcategoría")
    } finally {
      setCreatingSubcategory(false)
    }
  }

  const handleSave = async () => {
    const effectiveCategoryId = formData.subcategoryId || formData.rootCategoryId

    if (!formData.name || !formData.precio_minorista || !formData.precio_mayorista || !effectiveCategoryId) {
      toast.error("Completá nombre, precios y categoría antes de guardar")
      return
    }

    setSaving(true)
    const body = {
      name: formData.name.trim(),
      slug: formData.slug.trim() || undefined,
      description: formData.description.trim() || null,
      brand: formData.brand.trim() || null,
      precio_minorista: parseFloat(formData.precio_minorista),
      precio_mayorista: parseFloat(formData.precio_mayorista),
      wholesale_min_qty: parseInt(formData.wholesale_min_qty, 10) || 3,
      stock: parseInt(formData.stock, 10) || 0,
      images: formImages,
      highlights: formData.highlights.split(",").map((item) => item.trim()).filter(Boolean),
      categoryId: effectiveCategoryId,
      active: formData.active,
    }

    try {
      const url = editingId ? `/api/products?id=${editingId}` : "/api/products"
      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        toast.error((error as { error?: string }).error ?? "Error al guardar")
        return
      }

      const nextBrand = body.brand ?? undefined
      if (nextBrand && !brandOptions.some((brand) => brand.toLowerCase() === nextBrand.toLowerCase())) {
        setBrandOptions((previous) => [...previous, nextBrand].sort((left, right) => left.localeCompare(right)))
      }

      toast.success(editingId ? "Producto actualizado" : "Producto creado")
      setModalOpen(false)
      setPage(1)
      setRefreshKey((current) => current + 1)
    } catch {
      toast.error("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/products?id=${deleteId}`, { method: "DELETE" })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        toast.error((error as { error?: string }).error ?? "Error al eliminar")
        return
      }

      toast.success("Producto eliminado")
      setDeleteId(null)
      if (visibleProducts.length === 1 && page > 1) setPage((current) => current - 1)
      setRefreshKey((current) => current + 1)
    } catch {
      toast.error("Error de conexión")
    } finally {
      setDeleting(false)
    }
  }

  const toggleSort = (field: SortField) => {
    setPage(1)
    if (sortField === field) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"))
      return
    }
    setSortField(field)
    setSortDir("asc")
  }

  const clearFilters = () => {
    setSearch("")
    setCategoryFilterId("")
    setSubcategoryFilterId("")
    setPage(1)
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDir === "asc"
      ? <ChevronUp className="ml-0.5 inline h-3 w-3" />
      : <ChevronDown className="ml-0.5 inline h-3 w-3" />
  }

  const pageItems = buildPageItems(pagination.page, pagination.totalPages)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Productos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Filtrá por categoría y subcategoría, ordená por precio mayorista y manejá el alta sin salir del modal.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 self-start lg:self-auto">
          <Plus className="h-4 w-4" /> Nuevo producto
        </Button>
      </div>

      <div className="grid gap-3 rounded-2xl border border-border bg-white p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="space-y-3">
          <Input
            placeholder="Buscar por nombre, marca o descripción..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {pagination.total} producto{pagination.total === 1 ? "" : "s"}
            </Badge>
            {(categoryFilterId || subcategoryFilterId) && (
              <Badge variant="outline" className="rounded-full px-3 py-1">
                {activeFilterLabel}
              </Badge>
            )}
            {(categoryFilterId || subcategoryFilterId || search) && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 font-medium text-muted-foreground transition-colors hover:text-ink"
              >
                <X className="h-3.5 w-3.5" /> Limpiar filtros
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-[color:var(--color-pink-soft)] px-4 py-3 text-sm text-ink">
          <p className="font-semibold">Página {pagination.page} de {pagination.totalPages}</p>
          <p className="text-xs text-ink/70">Mostrando hasta {pagination.limit} productos por vista.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-ink/80">
                    <button onClick={() => toggleSort("name")} className="hover:text-ink">
                      Nombre <SortIcon field="name" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-ink/80">
                    <Popover open={categoryFilterOpen} onOpenChange={setCategoryFilterOpen}>
                      <PopoverTrigger asChild>
                        <button className="inline-flex items-center gap-2 hover:text-ink">
                          <span>Categoría</span>
                          <Filter className="h-3.5 w-3.5" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-80 space-y-4">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-ink">Filtrar por categoría</p>
                          <p className="text-xs text-muted-foreground">
                            Elegí una categoría raíz y, si querés, una subcategoría puntual.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="products-filter-category">Categoría</Label>
                          <Select
                            value={categoryFilterId || "all"}
                            onValueChange={(value) => {
                              setCategoryFilterId(value === "all" ? "" : value)
                              setSubcategoryFilterId("")
                              setPage(1)
                            }}
                          >
                            <SelectTrigger id="products-filter-category" className="w-full">
                              <SelectValue placeholder="Todas las categorías" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas las categorías</SelectItem>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="products-filter-subcategory">Subcategoría</Label>
                          <Select
                            value={subcategoryFilterId || "all"}
                            onValueChange={(value) => {
                              setSubcategoryFilterId(value === "all" ? "" : value)
                              setPage(1)
                            }}
                            disabled={!selectedFilterRootCategory}
                          >
                            <SelectTrigger id="products-filter-subcategory" className="w-full">
                              <SelectValue placeholder="Todas las subcategorías" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas las subcategorías</SelectItem>
                              {selectedFilterRootCategory?.children.map((subcategory) => (
                                <SelectItem key={subcategory.id} value={subcategory.id}>{subcategory.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <Button variant="outline" size="sm" onClick={clearFilters}>
                            Limpiar
                          </Button>
                          <Button size="sm" onClick={() => setCategoryFilterOpen(false)}>
                            Aplicar
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-ink/80">
                    <button onClick={() => toggleSort("precio_minorista")} className="hover:text-ink">
                      P. Minorista <SortIcon field="precio_minorista" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-ink/80">
                    <button onClick={() => toggleSort("precio_mayorista")} className="hover:text-ink">
                      P. Mayorista <SortIcon field="precio_mayorista" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-ink/80">
                    <button onClick={() => toggleSort("stock")} className="hover:text-ink">
                      Stock <SortIcon field="stock" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-ink/80">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {visibleProducts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No encontramos productos con esos filtros.
                    </td>
                  </tr>
                )}

                {visibleProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-ink">
                      <div className="flex items-center gap-2.5">
                        {product.images[0] ? (
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                              unoptimized={product.images[0].startsWith("/uploads/")}
                              sizes="40px"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 shrink-0 rounded-md border border-border bg-muted" />
                        )}

                        <div>
                          <span>{product.name}</span>
                          {product.brand && <p className="text-xs text-muted-foreground">{product.brand}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink/70">{categoryLabelById.get(product.categoryId) ?? "—"}</td>
                    <td className="px-4 py-3 text-ink/70">${Number(product.precio_minorista).toLocaleString("es-AR")}</td>
                    <td className="px-4 py-3 text-ink/70">${Number(product.precio_mayorista).toLocaleString("es-AR")}</td>
                    <td className="px-4 py-3 text-ink/70">{product.stock}</td>
                    <td className="px-4 py-3">
                      <Badge variant={product.active ? "default" : "secondary"}>
                        {product.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(product)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(product.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="border-t border-border px-4 py-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(event) => {
                        event.preventDefault()
                        if (pagination.page > 1) setPage((current) => current - 1)
                      }}
                      className={cn(pagination.page <= 1 && "pointer-events-none opacity-50")}
                    />
                  </PaginationItem>

                  {pageItems.map((item, index) => (
                    item === "ellipsis" ? (
                      <PaginationItem key={`ellipsis-${index}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={item}>
                        <PaginationLink
                          href="#"
                          isActive={item === pagination.page}
                          onClick={(event) => {
                            event.preventDefault()
                            setPage(item)
                          }}
                        >
                          {item}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(event) => {
                        event.preventDefault()
                        if (pagination.page < pagination.totalPages) setPage((current) => current + 1)
                      }}
                      className={cn(pagination.page >= pagination.totalPages && "pointer-events-none opacity-50")}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="p-name">Nombre *</Label>
              <Input
                id="p-name"
                value={formData.name}
                onChange={(event) => handleNameChange(event.target.value)}
                placeholder="Termo Stanley 1L"
              />
            </div>

            <div>
              <Label htmlFor="p-slug">Slug</Label>
              <Input
                id="p-slug"
                value={formData.slug}
                onChange={(event) => handleField("slug", event.target.value)}
                placeholder="termo-stanley-1l"
              />
            </div>

            <div>
              <Label htmlFor="p-brand">Marca</Label>
              <Popover open={brandPopoverOpen} onOpenChange={setBrandPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    id="p-brand"
                    type="button"
                    className="mt-1 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-left text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <span className={cn(!formData.brand && "text-muted-foreground")}>
                      {formData.brand || "Seleccioná una marca existente o creá una nueva"}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </PopoverTrigger>

                <PopoverContent align="start" className="w-[360px] p-0">
                  <Command>
                    <CommandInput
                      value={brandQuery}
                      onValueChange={setBrandQuery}
                      placeholder="Buscar marca o escribir una nueva..."
                    />
                    <CommandList
                      className="max-h-56 overscroll-contain"
                      onWheelCapture={(event) => event.stopPropagation()}
                    >
                      <CommandEmpty>
                        {brandQuery.trim()
                          ? (
                            <button
                              type="button"
                              onClick={() => {
                                handleField("brand", brandQuery.trim())
                                setBrandPopoverOpen(false)
                              }}
                              className="w-full px-3 py-3 text-left text-sm"
                            >
                              Usar “{brandQuery.trim()}”
                            </button>
                          )
                          : "No hay marcas cargadas todavía."}
                      </CommandEmpty>

                      {brandQuery.trim() && !brandOptions.some((brand) => brand.toLowerCase() === brandQuery.trim().toLowerCase()) && (
                        <CommandGroup heading="Crear nueva">
                          <CommandItem
                            value={`create-${brandQuery}`}
                            onSelect={() => {
                              handleField("brand", brandQuery.trim())
                              setBrandPopoverOpen(false)
                            }}
                          >
                            <Plus className="h-4 w-4" />
                            Crear y usar “{brandQuery.trim()}”
                          </CommandItem>
                        </CommandGroup>
                      )}

                      <CommandGroup heading="Existentes">
                        {filteredBrandOptions.map((brand) => (
                          <CommandItem
                            key={brand}
                            value={brand}
                            onSelect={() => {
                              handleField("brand", brand)
                              setBrandQuery(brand)
                              setBrandPopoverOpen(false)
                            }}
                          >
                            <Check className={cn("h-4 w-4", formData.brand === brand ? "opacity-100" : "opacity-0")} />
                            {brand}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {formData.brand && (
                <button
                  type="button"
                  onClick={() => {
                    handleField("brand", "")
                    setBrandQuery("")
                  }}
                  className="mt-2 text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
                >
                  Quitar marca seleccionada
                </button>
              )}
            </div>

            <div>
              <Label htmlFor="p-minorista">Precio minorista * (ARS)</Label>
              <Input
                id="p-minorista"
                type="number"
                min="0"
                step="0.01"
                value={formData.precio_minorista}
                onChange={(event) => handleField("precio_minorista", event.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="p-mayorista">Precio mayorista * (ARS)</Label>
              <Input
                id="p-mayorista"
                type="number"
                min="0"
                step="0.01"
                value={formData.precio_mayorista}
                onChange={(event) => handleField("precio_mayorista", event.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="p-wholesale-qty">Cant. mínima mayorista</Label>
              <Input
                id="p-wholesale-qty"
                type="number"
                min="1"
                value={formData.wholesale_min_qty}
                onChange={(event) => handleField("wholesale_min_qty", event.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="p-stock">Stock</Label>
              <Input
                id="p-stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(event) => handleField("stock", event.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="p-category-root">Categoría *</Label>
              <Select value={formData.rootCategoryId || undefined} onValueChange={handleRootCategoryChange}>
                <SelectTrigger id="p-category-root" className="mt-1 w-full">
                  <SelectValue placeholder="Primero elegí una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="p-subcategory">Subcategoría</Label>
              <Select
                value={formData.subcategoryId || "root"}
                onValueChange={(value) => handleField("subcategoryId", value === "root" ? "" : value)}
                disabled={!selectedFormRootCategory}
              >
                <SelectTrigger id="p-subcategory" className="mt-1 w-full">
                  <SelectValue placeholder="Después elegí una subcategoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Sin subcategoría específica</SelectItem>
                  {selectedFormRootCategory?.children.map((subcategory) => (
                    <SelectItem key={subcategory.id} value={subcategory.id}>{subcategory.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2 rounded-2xl border border-border bg-[color:var(--color-pink-soft)] p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">Alta rápida de subcategoría</p>
                  <p className="text-xs text-muted-foreground">
                    Si no existe, la creás acá mismo y queda seleccionada para este producto.
                  </p>
                </div>
                {selectedFormRootCategory && (
                  <Badge variant="outline" className="self-start rounded-full bg-white px-3 py-1 text-xs">
                    {selectedFormRootCategory.children.length} cargada{selectedFormRootCategory.children.length === 1 ? "" : "s"}
                  </Badge>
                )}
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <Input
                  value={newSubcategoryName}
                  onChange={(event) => setNewSubcategoryName(event.target.value)}
                  disabled={!formData.rootCategoryId || creatingSubcategory}
                  placeholder={formData.rootCategoryId ? "Ej: Termos de acero, Pavas eléctricas..." : "Elegí una categoría para habilitar esta opción"}
                />
                <Button
                  type="button"
                  onClick={handleCreateSubcategory}
                  disabled={!formData.rootCategoryId || !newSubcategoryName.trim() || creatingSubcategory}
                  className="gap-2"
                >
                  {creatingSubcategory && <Loader2 className="h-4 w-4 animate-spin" />}
                  Crear y usar
                </Button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="p-desc">Descripción</Label>
              <textarea
                id="p-desc"
                rows={4}
                value={formData.description}
                onChange={(event) => handleField("description", event.target.value)}
                placeholder="Descripción del producto..."
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>

            <div className="sm:col-span-2">
              <Label>Imágenes</Label>
              <div className="mt-1">
                <ImageUploader images={formImages} onChange={setFormImages} max={8} />
              </div>
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="p-highlights">Características (separadas por coma)</Label>
              <Input
                id="p-highlights"
                value={formData.highlights}
                onChange={(event) => handleField("highlights", event.target.value)}
                placeholder="Acero inoxidable, Tapa hermética, 24h frío"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="p-active"
                type="checkbox"
                checked={formData.active}
                onChange={(event) => handleField("active", event.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="p-active">Activo (visible en la tienda)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Guardar cambios" : "Crear producto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El producto se eliminará permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

