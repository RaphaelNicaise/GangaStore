import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join, extname } from "path"
import { randomUUID } from "crypto"

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const UPLOAD_DIR = join(process.cwd(), "public", "uploads")

export async function POST(req: Request) {
  // Auth es chequeada por el middleware (solo admins pueden subir)
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const file = formData.get("file")
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Archivo requerido" }, { status: 400 })
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Tipo de archivo no permitido. Usá JPG, PNG, WebP o GIF." },
      { status: 415 },
    )
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "El archivo supera el límite de 5 MB." },
      { status: 413 },
    )
  }

  const ext = extname(file.name).toLowerCase() || ".jpg"
  const filename = `${randomUUID()}${ext}`

  try {
    await mkdir(UPLOAD_DIR, { recursive: true })
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(join(UPLOAD_DIR, filename), buffer)
  } catch {
    return NextResponse.json({ error: "Error al guardar el archivo" }, { status: 500 })
  }

  return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const filename = searchParams.get("file")

  // Validar que no haya path traversal
  if (!filename || filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    return NextResponse.json({ error: "Nombre de archivo inválido" }, { status: 400 })
  }

  try {
    const { unlink } = await import("fs/promises")
    await unlink(join(UPLOAD_DIR, filename))
  } catch {
    // Si no existe el archivo, igual OK
  }

  return NextResponse.json({ ok: true })
}
