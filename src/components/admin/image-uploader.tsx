"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import { Upload, X, ImageIcon, Loader2 } from "lucide-react"
import Image from "next/image"

interface Props {
  /** URLs actuales */
  images: string[]
  /** Callback cuando cambia la lista */
  onChange: (images: string[]) => void
  /** Máximo de imágenes permitidas */
  max?: number
  /** Si es true, solo permite 1 imagen */
  single?: boolean
}

/**
 * Componente reutilizable para subir, previsualizar y eliminar imágenes.
 * Soporta arrastrar y soltar, selección por click, o pegar una URL.
 */
export function ImageUploader({ images, onChange, max = 10, single = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [urlInput, setUrlInput] = useState("")
  const [uploading, setUploading] = useState(false)

  const limit = single ? 1 : max
  const canAddMore = images.length < limit

  // ── Subir archivo ────────────────────────────────────────────────────────

  const uploadFile = async (file: File): Promise<string | null> => {
    const form = new FormData()
    form.append("file", file)
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? "Error al subir imagen")
        return null
      }
      const { url } = await res.json()
      return url as string
    } catch {
      toast.error("Error de conexión al subir imagen")
      return null
    }
  }

  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files)
    const toUpload = single ? arr.slice(0, 1) : arr.slice(0, limit - images.length)
    if (toUpload.length === 0) return

    setUploading(true)
    const urls: string[] = []
    for (const file of toUpload) {
      const url = await uploadFile(file)
      if (url) urls.push(url)
    }
    setUploading(false)
    if (urls.length > 0) {
      onChange(single ? urls : [...images, ...urls])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files)
    e.target.value = ""
  }

  // ── Drag & Drop ──────────────────────────────────────────────────────────

  const [dragging, setDragging] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (!canAddMore && !single) return
    handleFiles(e.dataTransfer.files)
  }

  // ── Agregar por URL ──────────────────────────────────────────────────────

  const addUrl = () => {
    const url = urlInput.trim()
    if (!url) return
    try { new URL(url) } catch {
      toast.error("URL inválida")
      return
    }
    if (single) {
      onChange([url])
    } else {
      if (images.length >= limit) {
        toast.error(`Máximo ${limit} imágenes`)
        return
      }
      onChange([...images, url])
    }
    setUrlInput("")
  }

  // ── Eliminar ─────────────────────────────────────────────────────────────

  const removeImage = async (index: number) => {
    const url = images[index]
    // Si es una imagen subida localmente, borrarla del servidor
    if (url.startsWith("/uploads/")) {
      const filename = url.split("/").pop()
      if (filename) {
        fetch(`/api/upload?file=${encodeURIComponent(filename)}`, { method: "DELETE" }).catch(() => {})
      }
    }
    onChange(images.filter((_, i) => i !== index))
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Grid de previews */}
      {images.length > 0 && (
        <div className={`grid gap-2 ${single ? "grid-cols-1" : "grid-cols-3 sm:grid-cols-4"}`}>
          {images.map((src, i) => (
            <div
              key={src + i}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
            >
              <Image
                src={src}
                alt={`Imagen ${i + 1}`}
                fill
                className="object-cover"
                unoptimized={src.startsWith("/uploads/")}
                sizes="120px"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Eliminar imagen"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {i === 0 && !single && (
                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                  Principal
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Zona de carga */}
      {canAddMore && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 transition-colors ${
            dragging
              ? "border-ink bg-ink/5"
              : "border-border bg-muted/30 hover:border-ink/40 hover:bg-muted/60"
          }`}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-6 w-6 text-muted-foreground" />
          )}
          <p className="text-xs text-muted-foreground">
            {uploading
              ? "Subiendo…"
              : single
                ? "Hacé click o arrastrá una imagen"
                : `Hacé click o arrastrá imágenes (${images.length}/${limit})`}
          </p>
          <p className="text-[10px] text-muted-foreground/70">JPG, PNG, WebP, GIF — máx. 5 MB</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple={!single}
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
      )}

      {/* O pegar URL */}
      {canAddMore && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <ImageIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
              placeholder="O pegá una URL de imagen…"
              className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="button"
            onClick={addUrl}
            disabled={!urlInput.trim()}
            className="rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Agregar
          </button>
        </div>
      )}
    </div>
  )
}
