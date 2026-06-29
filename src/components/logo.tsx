import Image from "next/image"
import { cn } from "@/lib/utils"

export function Logo({
  className,
  variant = "dark",
}: {
  className?: string
  variant?: "dark" | "light"
}) {
  const imageClass = variant === "light" ? "" : ""

  return (
    <div className={cn("relative h-12 w-28 sm:h-16 sm:w-44 md:h-20 md:w-[280px]", className)}>
      <Image
        src="/TERMOSTORE%20PLACAS.png"
        alt="TermoStore"
        fill
        sizes="240px"
        className={cn("object-contain object-left", imageClass)}
        priority
      />
    </div>
  )
}
