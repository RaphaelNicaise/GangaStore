import Link from "next/link"
import { Logo } from "@/components/logo"
import { AdminLoginForm } from "@/components/admin-login-form"

export const metadata = {
  title: "Admin · Ingresar — TermoStore",
}

export default function AdminLoginPage() {
  return (
    <main className="relative grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[color:var(--color-pink)] p-10 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 w-2/5 bg-ink"
          style={{ clipPath: "polygon(40% 0, 100% 0, 100% 100%, 60% 100%)" }}
        />
        <div className="dots-ink absolute left-12 top-12 h-32 w-32 opacity-40" aria-hidden />
        <div className="dots-paper absolute right-16 bottom-16 h-32 w-32 opacity-40" aria-hidden />

        <div className="relative">
          <Link href="/" aria-label="Volver al inicio">
            <Logo />
          </Link>
        </div>

        <div className="relative max-w-md">
          <h2 className="font-display text-5xl leading-none text-ink">
            PANEL DE
            <br />
            <span className="italic">administración</span>
          </h2>
          <p className="mt-4 text-sm text-ink/80">
            Gestioná productos, categorías y promociones de TermoStore.
          </p>
        </div>

        <p className="relative text-xs text-ink/60">
          &copy; {new Date().getFullYear()} TermoStore — Hogar &amp; Electro
        </p>
      </div>

      <div className="flex items-center justify-center bg-white p-6">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden" aria-label="Volver al inicio">
            <Logo />
          </Link>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground lg:mt-0">
            Acceso interno
          </p>
          <h1 className="mt-2 font-display text-4xl text-ink">INGRESÁ</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Usá tus credenciales para acceder al panel.
          </p>

          <AdminLoginForm />

          <p className="mt-8 text-center text-xs text-muted-foreground">
            <Link href="/" className="hover:text-ink">
              Volver al sitio
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
