"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  Tags,
  Percent,
  ClipboardList,
  PanelsTopLeft,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from "lucide-react"
import { useState } from "react"
import { Logo } from "./logo"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/categorias", label: "Categorías", icon: Tags },
  { href: "/admin/promociones", label: "Promociones", icon: Percent },
  { href: "/admin/secciones", label: "Secciones", icon: PanelsTopLeft },
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      // Si falla el fetch igualmente redirigimos
    }
    toast.success("Sesión cerrada")
    router.push("/admin/login")
  }

  // No mostrar el shell en la pantalla de login
  if (pathname?.startsWith("/admin/login")) return <>{children}</>

  return (
    <div className="min-h-screen bg-[color:var(--color-pink-soft)]/40">
      {/* Mobile topbar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-white px-4 lg:hidden">
        <Link href="/admin" aria-label="Admin home">
          <Logo />
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border"
          aria-label="Menú admin"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </header>

      <div className="mx-auto flex max-w-[1400px]">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-16 items-center border-b border-border px-5">
            <Link href="/admin" aria-label="Admin home" onClick={() => setOpen(false)}>
              <Logo />
            </Link>
          </div>

          <nav className="flex-1 space-y-1 p-3" aria-label="Admin">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(item.href + "/")
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-ink text-white"
                      : "text-ink/80 hover:bg-[color:var(--color-pink)]/40",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-border p-3">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink/80 hover:bg-muted"
            >
              <ExternalLink className="h-4 w-4" />
              Ver sitio público
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink/80 hover:bg-muted"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </aside>

        {open && (
          <div
            aria-hidden
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}

        {/* Content */}
        <main className="min-h-screen flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  )
}
