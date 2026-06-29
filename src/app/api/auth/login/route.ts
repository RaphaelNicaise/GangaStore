import { NextResponse } from "next/server"
import { signAdminToken } from "@/lib/jwt"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(req: Request) {
  // Rate limiting: 10 intentos por minuto por IP
  const ip =
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown"
  const rl = rateLimit(`login:${ip}`, 10, 60_000)
  if (!rl.success) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intentá en unos segundos." },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfter) },
      },
    )
  }

  let body: { email?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const { email, password } = body
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (
    !email ||
    !password ||
    email.trim().toLowerCase() !== adminEmail?.toLowerCase() ||
    password !== adminPassword
  ) {
    return NextResponse.json(
      { error: "Credenciales incorrectas" },
      { status: 401 },
    )
  }

  const token = await signAdminToken(email.trim().toLowerCase())

  const response = NextResponse.json({ ok: true })
  response.cookies.set("ts_admin_token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas
  })
  return response
}
