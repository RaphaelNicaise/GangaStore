import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { createClient } from "@supabase/supabase-js"
import { extname } from "path"

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Faltan las variables de entorno de Supabase Storage" }, { status: 500 })
  }

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
    const buffer = Buffer.from(await file.arrayBuffer())
    
    const { data, error } = await supabase.storage
      .from("images")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (error) throw error

    const { data: publicUrlData } = supabase.storage
      .from("images")
      .getPublicUrl(filename)

    return NextResponse.json({ url: publicUrlData.publicUrl }, { status: 201 })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Error al subir imagen a Supabase: " + error?.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get("file")

  if (!url || !supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 })
  }

  try {
    const filename = url.split("/").pop()
    if (filename) {
      await supabase.storage.from("images").remove([filename])
    }
  } catch {
    // Ignore deletion errors
  }

  return NextResponse.json({ ok: true })
}
