"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Loader2, ChevronDown, ChevronRight } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ImageUploader } from "./image-uploader"

// ── Tipos ──────────────────────────────────────────────────────────────────

interface SubCategory {
  id: string
  name: string
  slug: string
  active: boolean
  parentId: string
}

interface RootCategory {
  id: string
  name: string
  slug: string
  image: string | null
  active: boolean
  children: SubCategory[]
}

const EMPTY_FORM = {
  name: "",
  slug: "",
  parentId: "",      // vacío = categoría raíz
  active: true,
}
type FormData = typeof EMPTY_FORM

// ── Componente ─────────────────────────────────────────────────────────────

export function CategoriasView() {
  const [categories, setCategories] = useState<RootCategory[]>([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM)
  const [formImage, setFormImage] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteName, setDeleteName] = useState("")
  const [deleting, setDeleting] = useState(false)

  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // ── Data fetch ──────────────────────────────────────────────────────────

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/categories")
      const json = await res.json()
      const list = Array.isArray(json) ? json : (json.data ?? [])
      setCategories(list)
    } catch {
      toast.error("Error al cargar categorías")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  // ── Modal helpers ───────────────────────────────────────────────────────

  const openCreate = (parentId?: string) => {
    setEditingId(null)
    setFormData({ ...EMPTY_FORM, parentId: parentId ?? "" })
    setFormImage([])
    setModalOpen(true)
  }

  const openEdit = (cat: RootCategory | SubCategory, parentId?: string) => {
    setEditingId(cat.id)
    setFormData({
      name: cat.name,
      slug: cat.slug,
      parentId: parentId ?? ("parentId" in cat ? (cat as SubCategory).parentId : ""),
      active: cat.active,
    })
    const img = "image" in cat && cat.image ? [cat.image] : []
    setFormImage(img)
    setModalOpen(true)
  }

  const handleField = (key: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleNameChange = (val: string) => {
    handleField("name", val)
    if (!editingId) {
      handleField(
        "slug",
        val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      )
    }
  }

  // ── Save ────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("El nombre es obligatorio")
      return
    }
    setSaving(true)
    const body: Record<string, unknown> = {
      name: formData.name.trim(),
      slug: formData.slug.trim() || undefined,
      active: formData.active,
    }
    if (formData.parentId) body.parentId = formData.parentId
    // Solo aplicar imagen a categorías raíz
    if (!formData.parentId) {
      body.image = formImage[0] || undefined
    }

    try {
      const url = editingId ? `/api/categories?id=${editingId}` : "/api/categories"
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as Record<string, unknown>))
        const details = (err as { details?: Record<string, string[] | undefined> }).details
        const firstDetail = details
          ? Object.values(details).flat().find(Boolean)
          : undefined
        toast.error((firstDetail as string) || (err as { error?: string }).error || "Error al guardar")
        return
      }
      toast.success(editingId ? "Categoría actualizada" : "Categoría creada")
      setModalOpen(false)
      await loadData()
    } catch {
      toast.error("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────

  const confirmDelete = (id: string, name: string) => {
    setDeleteId(id)
    setDeleteName(name)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/categories?id=${deleteId}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error ?? "Error al eliminar")
        return
      }
      toast.success("Categoría eliminada")
      setDeleteId(null)
      await loadData()
    } catch {
      toast.error("Error de conexión")
    } finally {
      setDeleting(false)
    }
  }

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-ink">Categorías</h1>
        <Button onClick={() => openCreate()} className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" /> Nueva categoría
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {categories.length === 0 && (
            <p className="text-center py-12 text-muted-foreground">No hay categorías</p>
          )}
          {categories.map((cat) => {
            const isExpanded = expanded.has(cat.id)
            return (
              <div key={cat.id} className="rounded-xl border border-border bg-white overflow-hidden">
                {/* Categoría raíz */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(cat.id)}
                    className="shrink-0 rounded p-0.5 hover:bg-muted"
                    aria-label={isExpanded ? "Colapsar" : "Expandir"}
                  >
                    {isExpanded
                      ? <ChevronDown className="h-4 w-4" />
                      : <ChevronRight className="h-4 w-4" />
                    }
                  </button>
                  {cat.image ? (
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        fill
                        className="object-cover"
                        unoptimized={cat.image.startsWith("/uploads/")}
                        sizes="36px"
                      />
                    </div>
                  ) : (
                    <div className="h-9 w-9 shrink-0 rounded-md border border-dashed border-border bg-muted/50" />
                  )}
                  <div className="flex-1">
                    <span className="font-semibold text-ink">{cat.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">/{cat.slug}</span>
                    <span className="ml-3">
                      <Badge variant={cat.active ? "default" : "secondary"} className="text-xs">
                        {cat.active ? "Activa" : "Inactiva"}
                      </Badge>
                    </span>
                    {cat.children.length > 0 && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({cat.children.length} subcategorías)
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openCreate(cat.id)}
                      title="Agregar subcategoría"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(cat)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => confirmDelete(cat.id, cat.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Subcategorías */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/30">
                    {cat.children.length === 0 && (
                      <p className="px-8 py-3 text-sm text-muted-foreground">
                        Sin subcategorías —{" "}
                        <button
                          type="button"
                          className="underline hover:text-ink"
                          onClick={() => openCreate(cat.id)}
                        >
                          agregar una
                        </button>
                      </p>
                    )}
                    {cat.children.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center gap-3 border-b border-border/50 px-8 py-2.5 last:border-b-0"
                      >
                        <div className="flex-1">
                          <span className="text-sm text-ink">{sub.name}</span>
                          <span className="ml-2 text-xs text-muted-foreground">/{sub.slug}</span>
                          <span className="ml-2">
                            <Badge variant={sub.active ? "default" : "secondary"} className="text-xs">
                              {sub.active ? "Activa" : "Inactiva"}
                            </Badge>
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(sub, cat.id)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => confirmDelete(sub.id, sub.name)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal crear/editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? "Editar categoría"
                : formData.parentId
                  ? "Nueva subcategoría"
                  : "Nueva categoría"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div>
              <Label htmlFor="c-name">Nombre *</Label>
              <Input
                id="c-name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Termos"
              />
            </div>

            <div>
              <Label htmlFor="c-slug">Slug</Label>
              <Input
                id="c-slug"
                value={formData.slug}
                onChange={(e) => handleField("slug", e.target.value)}
                placeholder="termos"
              />
            </div>

            {!formData.parentId && (
              <div>
                <Label>Imagen de portada</Label>
                <div className="mt-1">
                  <ImageUploader
                    images={formImage}
                    onChange={setFormImage}
                    single
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="c-parent">Categoría padre</Label>
              <select
                id="c-parent"
                value={formData.parentId}
                onChange={(e) => handleField("parentId", e.target.value)}
                className="mt-1 block h-10 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Ninguna (categoría raíz)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="c-active"
                type="checkbox"
                checked={formData.active}
                onChange={(e) => handleField("active", e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="c-active">Activa</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Guardar cambios" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmación de borrado */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar "{deleteName}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Si tiene subcategorías o productos asociados,
              puede que falle.
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
