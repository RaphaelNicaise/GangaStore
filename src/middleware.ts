import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyAdminToken } from "@/lib/jwt"

// Rutas API que requieren autenticación para escritura
const PROTECTED_API_PREFIXES = [
  "/api/products",
  "/api/categories",
  "/api/users",
  "/api/price-profiles",
  "/api/special-prices",
  "/api/upload",
]

// Métodos que requieren autenticación
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

// Límite por IP para endpoints públicos (GET): 120 req/min
// Nota: el rate limiting real lo hace src/lib/rate-limit.ts dentro del handler
// El middleware solo hace el check de auth para ser compatible con Edge runtime

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const method = req.method

  const isOrdersAdminPath = pathname.startsWith("/api/orders")
  const isPublicCheckoutPath = pathname.startsWith("/api/checkout-order")

  // ── Protección de páginas admin ────────────────────────────────────────────
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = req.cookies.get("ts_admin_token")?.value
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", req.url))
    }
    const payload = await verifyAdminToken(token)
    if (!payload) {
      const res = NextResponse.redirect(new URL("/admin/login", req.url))
      res.cookies.delete("ts_admin_token")
      return res
    }
  }

  // ── Protección de API de escritura ─────────────────────────────────────────
  if (WRITE_METHODS.has(method)) {
    const isProtected = PROTECTED_API_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix),
    )
    if (isProtected) {
      const token = req.cookies.get("ts_admin_token")?.value
      if (!token) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 })
      }
      const payload = await verifyAdminToken(token)
      if (!payload) {
        return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 })
      }
    }
  }

  // ── API de pedidos: solo admin (excepto checkout público) ────────────────
  if (isOrdersAdminPath && !isPublicCheckoutPath) {
    const token = req.cookies.get("ts_admin_token")?.value
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    const payload = await verifyAdminToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
}
