import { cn } from "@/lib/utils"

/**
 * Sección con cortes diagonales (no horizontales) inspirada en las piezas
 * de promo de la marca. Usa clip-path para el corte superior/inferior.
 */
export function DiagonalSection({
  children,
  className,
  variant = "pink",
  topCut = "tr",
  bottomCut = "br",
  showDots = true,
}: {
  children: React.ReactNode
  className?: string
  variant?: "pink" | "ink" | "paper" | "pink-soft"
  topCut?: "tr" | "tl" | "none"
  bottomCut?: "br" | "bl" | "none"
  showDots?: boolean
}) {
  const bg =
    variant === "pink"
      ? "bg-[color:var(--color-pink)]"
      : variant === "pink-soft"
      ? "bg-[color:var(--color-pink-soft)]"
      : variant === "ink"
      ? "bg-[color:var(--color-ink)] text-white"
      : "bg-white"

  const dotsClass =
    variant === "ink" ? "dots-paper" : variant === "paper" ? "dots-ink" : "dots-ink"

  // Compute clip path
  let clip = ""
  if (topCut === "tr" && bottomCut === "br") clip = "polygon(0 0, 100% 6%, 100% 94%, 0 100%)"
  else if (topCut === "tl" && bottomCut === "bl") clip = "polygon(0 6%, 100% 0, 100% 100%, 0 94%)"
  else if (topCut === "tr" && bottomCut === "none") clip = "polygon(0 0, 100% 6%, 100% 100%, 0 100%)"
  else if (topCut === "tl" && bottomCut === "none") clip = "polygon(0 6%, 100% 0, 100% 100%, 0 100%)"
  else if (topCut === "none" && bottomCut === "br") clip = "polygon(0 0, 100% 0, 100% 94%, 0 100%)"
  else if (topCut === "none" && bottomCut === "bl") clip = "polygon(0 0, 100% 0, 100% 100%, 0 94%)"

  return (
    <section
      className={cn("relative isolate", bg, className)}
      style={clip ? { clipPath: clip } : undefined}
    >
      {showDots && (
        <>
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute left-3 top-8 h-20 w-20 opacity-50 sm:left-6",
              dotsClass,
            )}
          />
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute right-3 bottom-10 h-24 w-24 opacity-50 sm:right-6",
              dotsClass,
            )}
          />
        </>
      )}
      {children}
    </section>
  )
}
