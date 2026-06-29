import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function seedDatabase() {
  console.log("Limpiando base de datos...")

  await prisma.orderItem.deleteMany({})
  await prisma.order.deleteMany({})
  await prisma.product.deleteMany({})
  await prisma.category.deleteMany({})
  await prisma.siteContent.deleteMany({})

  console.log("Done! Base de datos reiniciada a 0. Lista para cargar productos reales.")
}

async function runSeedCli() {
  try {
    await seedDatabase()
  } catch (e) {
    console.error(e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

const directRunTarget = process.argv[1]?.replace(/\\/g, "/")
if (directRunTarget?.endsWith("prisma/seed.ts")) {
  void runSeedCli()
}
