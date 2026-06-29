import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function seedDatabase() {
  console.log("Seeding GangaStore database...")

  // Limpiar datos anteriores para no acumular basura (opcional pero recomendado en desarrollo)
  await prisma.orderItem.deleteMany({})
  await prisma.order.deleteMany({})
  await prisma.product.deleteMany({})
  await prisma.category.deleteMany({})

  // Categories - create parent categories first, then children
  const categoriesData = [
    {
      slug: "tecnologia",
      name: "Tecnología",
      children: [
        { slug: "smartphones", name: "Smartphones" },
        { slug: "notebooks", name: "Notebooks" },
        { slug: "accesorios", name: "Accesorios" },
      ],
    },
    {
      slug: "perfumes",
      name: "Perfumes",
      children: [
        { slug: "hombre", name: "Hombre" },
        { slug: "mujer", name: "Mujer" },
        { slug: "unisex", name: "Unisex" },
      ],
    },
    {
      slug: "cocina",
      name: "Artículos de Cocina",
      children: [
        { slug: "ollas", name: "Ollas y Sartenes" },
        { slug: "cubiertos", name: "Cubiertos" },
        { slug: "pequenos-electros", name: "Pequeños Electros" },
      ],
    },
  ]

  // Map slug -> DB id for linking
  const catIds: Record<string, string> = {}

  for (const cat of categoriesData) {
    const parent = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { slug: cat.slug, name: cat.name },
    })
    catIds[cat.slug] = parent.id

    for (const child of cat.children) {
      const c = await prisma.category.upsert({
        where: { slug: child.slug },
        update: { name: child.name, parentId: parent.id },
        create: { slug: child.slug, name: child.name, parentId: parent.id },
      })
      catIds[child.slug] = c.id
    }
  }

  console.log("Categories seeded.")

  // Products
  const productsData = [
    {
      slug: "smartphone-gama-alta-x",
      name: "Smartphone X Pro 128GB",
      description: "Teléfono inteligente de última generación con cámara de 108MP.",
      precio_minorista: 599000,
      precio_mayorista: 499000,
      images: ["https://images.unsplash.com/photo-1598327105666-5b89351cb315?w=500&q=80"],
      categoryId: catIds["smartphones"],
      brand: "GangaTech",
      stock: 50,
      highlights: ["128GB", "108MP", "Batería 5000mAh"],
    },
    {
      slug: "notebook-ultra-15",
      name: "Notebook Ultra 15''",
      description: "Notebook ultraliviana ideal para trabajo y estudio.",
      precio_minorista: 899000,
      precio_mayorista: 799000,
      images: ["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&q=80"],
      categoryId: catIds["notebooks"],
      brand: "GangaTech",
      stock: 25,
      highlights: ["15 pulgadas", "SSD 512GB", "8GB RAM"],
    },
    {
      slug: "auriculares-in-ear-bt",
      name: "Auriculares In-Ear Bluetooth",
      description: "Auriculares inalámbricos con cancelación de ruido.",
      precio_minorista: 45000,
      precio_mayorista: 35000,
      images: ["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=80"],
      categoryId: catIds["accesorios"],
      brand: "SoundMakers",
      stock: 120,
      highlights: ["Bluetooth 5.0", "Batería 24hs", "TWS"],
    },
    {
      slug: "perfume-classic-man",
      name: "Perfume Classic Man 100ml",
      description: "Fragancia amaderada intensa para hombre.",
      precio_minorista: 85000,
      precio_mayorista: 65000,
      images: ["https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=500&q=80"],
      categoryId: catIds["hombre"],
      brand: "Essence",
      stock: 40,
      highlights: ["100ml", "Eau de Parfum", "Duración 12hs"],
    },
    {
      slug: "perfume-floral-woman",
      name: "Perfume Floral Woman 50ml",
      description: "Fragancia suave y floral para mujer.",
      precio_minorista: 75000,
      precio_mayorista: 58000,
      images: ["https://images.unsplash.com/photo-1594035910387-fea47794261f?w=500&q=80"],
      categoryId: catIds["mujer"],
      brand: "Essence",
      stock: 60,
      highlights: ["50ml", "Eau de Toilette", "Aroma Floral"],
    },
    {
      slug: "perfume-citrus-unisex",
      name: "Perfume Citrus Unisex 100ml",
      description: "Fragancia cítrica y fresca para uso diario.",
      precio_minorista: 60000,
      precio_mayorista: 45000,
      images: ["https://images.unsplash.com/photo-1595532587532-6807802871bb?w=500&q=80"],
      categoryId: catIds["unisex"],
      brand: "Essence",
      stock: 35,
      highlights: ["100ml", "Unisex", "Toques de limón"],
    },
    {
      slug: "set-ollas-teflon",
      name: "Set 3 Ollas Teflón",
      description: "Set completo de ollas antiadherentes con tapa de vidrio.",
      precio_minorista: 120000,
      precio_mayorista: 95000,
      images: ["https://images.unsplash.com/photo-1584990347449-a6efa1a200d9?w=500&q=80"],
      categoryId: catIds["ollas"],
      brand: "ChefLine",
      stock: 15,
      highlights: ["Antiadherente", "Tapa de vidrio", "Acero inoxidable"],
    },
    {
      slug: "set-cubiertos-24",
      name: "Set Cubiertos 24 Piezas",
      description: "Set de cubiertos de acero inoxidable para 6 personas.",
      precio_minorista: 35000,
      precio_mayorista: 25000,
      images: ["https://images.unsplash.com/photo-1591871932607-42512cc7f035?w=500&q=80"],
      categoryId: catIds["cubiertos"],
      brand: "ChefLine",
      stock: 100,
      highlights: ["24 piezas", "Acero Inoxidable", "Para 6 personas"],
    },
    {
      slug: "licuadora-glass-1000w",
      name: "Licuadora Glass 1000W",
      description: "Licuadora potente con jarra de vidrio de 1.5L.",
      precio_minorista: 65000,
      precio_mayorista: 52000,
      images: ["https://images.unsplash.com/photo-1585237432882-7f7ec0f3e580?w=500&q=80"],
      categoryId: catIds["pequenos-electros"],
      brand: "GangaMix",
      stock: 22,
      highlights: ["1000W", "Jarra de Vidrio", "Pica Hielo"],
    },
  ]

  for (const p of productsData) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    })
  }

  console.log("Products seeded.")
  console.log("Done! GangaStore database seeded successfully.")
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
