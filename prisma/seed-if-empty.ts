import { PrismaClient } from "@prisma/client"
import { seedDatabase } from "./seed"

async function main() {
  if (process.env.NODE_ENV !== "development") return

  const prisma = new PrismaClient()
  const count = await prisma.product.count()

  if (count === 0) {
    console.log("[seed] Base de datos vacía, insertando datos...")
    await seedDatabase()
    console.log("[seed] Listo.")
  } else {
    console.log("[seed] La base de datos ya tiene datos, saltando seed.")
  }

  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
