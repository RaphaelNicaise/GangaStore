import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function seedDatabase() {
  console.log("Seeding TermoStore database...")

  // Categories - create parent categories first, then children
  const categoriesData = [
    {
      slug: "cocina",
      name: "Cocina",
      children: [
        { slug: "heladeras", name: "Heladeras" },
        { slug: "cocinas", name: "Cocinas" },
        { slug: "microondas", name: "Microondas" },
        { slug: "hornos-electricos", name: "Hornos eléctricos" },
        { slug: "pavas-electricas", name: "Pavas eléctricas" },
      ],
    },
    {
      slug: "lavado",
      name: "Lavado",
      children: [
        { slug: "lavarropas", name: "Lavarropas" },
        { slug: "planchas", name: "Planchas" },
      ],
    },
    {
      slug: "hogar",
      name: "Hogar",
      children: [
        { slug: "iluminacion", name: "Iluminación" },
        { slug: "muebles", name: "Muebles" },
        { slug: "escurridores", name: "Escurridores" },
      ],
    },
    {
      slug: "climatizacion",
      name: "Climatización",
      children: [
        { slug: "ventiladores", name: "Ventiladores" },
      ],
    },
    {
      slug: "entretenimiento",
      name: "Entretenimiento",
      children: [
        { slug: "televisores", name: "Televisores" },
      ],
    },
    {
      slug: "cuidado-personal",
      name: "Cuidado personal",
      children: [
        { slug: "secadores", name: "Secadores de pelo" },
        { slug: "alisadores", name: "Alisadores de pelo" },
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
      slug: "heladera-premium-inox-420l",
      name: "Heladera Premium Inox 420L",
      description: "Heladera no frost con freezer superior, terminación inox y gran capacidad para uso familiar.",
      precio_minorista: 1199000,
      precio_mayorista: 1015000,
      images: ["/uploads/pngtree-refrigerator-illustration-3d-png-image_11588865 (1).png"],
      categoryId: catIds["heladeras"],
      brand: "TermoCool",
      stock: 12,
      highlights: ["420L de capacidad", "No frost", "Bajo consumo"],
    },
    {
      slug: "lavarropas-automatico-smart-8kg",
      name: "Lavarropas Automático Smart 8KG",
      description: "Lavarropas de carga frontal con múltiples programas y centrifugado eficiente.",
      precio_minorista: 849000,
      precio_mayorista: 729000,
      images: ["/uploads/washing-machine-isolated-on-transparent-background-png.webp"],
      categoryId: catIds["lavarropas"],
      brand: "AquaHome",
      stock: 9,
      highlights: ["Capacidad 8KG", "1200 RPM", "Programa rápido"],
    },
    {
      slug: "plancha-a-vapor-plus-2200w",
      name: "Plancha a Vapor Plus 2200W",
      description: "Plancha de vapor con base antiadherente y golpe de vapor para arrugas difíciles.",
      precio_minorista: 89900,
      precio_mayorista: 73900,
      images: ["/uploads/KJH-PL1603.png"],
      categoryId: catIds["planchas"],
      brand: "Kanji",
      stock: 34,
      highlights: ["2200W", "Base antiadherente", "Golpe de vapor"],
    },
    {
      slug: "heladera-compacta-inverter-360l",
      name: "Heladera Compacta Inverter 360L",
      description: "Heladera de diseño moderno con freezer superior y tecnología inverter para menor consumo.",
      precio_minorista: 999000,
      precio_mayorista: 855000,
      images: ["/uploads/pngtree-refrigerator-illustration-3d-png-image_11588865 (1).png"],
      categoryId: catIds["heladeras"],
      brand: "TermoCool",
      stock: 10,
      highlights: ["360L", "Inverter", "Freezer superior"],
    },
    {
      slug: "heladera-whirlpool-inox-386l",
      name: "Heladera Whirlpool WRM42HK 386L",
      description: "Heladera no frost inverter de 386 litros con excelente distribución interior y terminación inox.",
      precio_minorista: 1329000,
      precio_mayorista: 1129000,
      images: ["/uploads/pngtree-refrigerator-illustration-3d-png-image_11588865 (1).png"],
      categoryId: catIds["heladeras"],
      brand: "Whirlpool",
      stock: 6,
      highlights: ["386L", "No frost", "Tecnología inverter"],
    },
    {
      slug: "lamparita-led-a60-12w",
      name: "Lámpara de Pie LED",
      description: "Lámpara de pie moderna de bajo consumo, ideal para iluminación general del hogar.",
      precio_minorista: 6900,
      precio_mayorista: 4900,
      images: ["/uploads/luxury-floor-lamp-front-elevation-isolated-on-transparent-background-png.webp"],
      categoryId: catIds["iluminacion"],
      brand: "Lumen",
      stock: 180,
      highlights: ["Diseño moderno", "Luz cálida", "Ahorro energético"],
    },
    {
      slug: "estanteria-madera-organizadora",
      name: "Estantería de Madera Organizadora",
      description: "Mueble de madera para organización y guardado en living, cocina o dormitorio.",
      precio_minorista: 179000,
      precio_mayorista: 149000,
      images: ["/uploads/luxury-floor-lamp-front-elevation-isolated-on-transparent-background-png.webp"],
      categoryId: catIds["muebles"],
      brand: "WoodLine",
      stock: 18,
      highlights: ["Madera reforzada", "Diseño moderno", "Fácil armado"],
    },
    {
      slug: "pava-electrica-corte-mate-kanji",
      name: "Pava Eléctrica Corte Mate Kanji",
      description: "Pava eléctrica con selector de temperatura y corte ideal para mate.",
      precio_minorista: 64900,
      precio_mayorista: 51900,
      images: ["/uploads/Pava-Electrica-Acero-BF-EK4OR.jpg"],
      categoryId: catIds["pavas-electricas"],
      brand: "Kanji",
      stock: 42,
      highlights: ["Corte para mate", "Acero inoxidable", "Apagado automático"],
    },
    {
      slug: "pava-electrica-steel-17l",
      name: "Pava Eléctrica Steel 1.7L",
      description: "Pava eléctrica de acero con gran capacidad y base giratoria 360°.",
      precio_minorista: 59900,
      precio_mayorista: 46900,
      images: ["/uploads/Pava-Electrica-Acero-BF-EK4OR.jpg"],
      categoryId: catIds["pavas-electricas"],
      brand: "BKF",
      stock: 30,
      highlights: ["1.7L", "Base 360°", "Filtro desmontable"],
    },
    {
      slug: "microondas-digital-25l",
      name: "Microondas Digital 25L",
      description: "Microondas con panel digital, múltiples niveles de potencia y función descongelar.",
      precio_minorista: 239000,
      precio_mayorista: 199000,
      images: ["/uploads/ai-generated-black-modern-microwave-isolated-free-png.webp"],
      categoryId: catIds["microondas"],
      brand: "TermoHome",
      stock: 16,
      highlights: ["25L", "Display digital", "Descongelado rápido"],
    },
    {
      slug: "microondas-compacto-20l",
      name: "Microondas Compacto 20L",
      description: "Microondas compacto ideal para cocinas pequeñas, práctico y fácil de usar.",
      precio_minorista: 199000,
      precio_mayorista: 165000,
      images: ["/uploads/pngtree-white-microwave-and-oven-household-appliances-png-image_16861774.webp"],
      categoryId: catIds["microondas"],
      brand: "CookEasy",
      stock: 21,
      highlights: ["20L", "Compacto", "6 niveles de potencia"],
    },
    {
      slug: "horno-electrico-45l-conveccion",
      name: "Horno Eléctrico 45L con Convección",
      description: "Horno eléctrico de gran capacidad con convección y selector de temperatura.",
      precio_minorista: 329000,
      precio_mayorista: 279000,
      images: ["/uploads/pngtree-a-small-electric-oven-silver-picture-image_13083839.png"],
      categoryId: catIds["hornos-electricos"],
      brand: "BakePro",
      stock: 11,
      highlights: ["45L", "Convección", "Timer programable"],
    },
    {
      slug: "ventilador-box-16-3v",
      name: "Ventilador Box 16'' 3 Velocidades",
      description: "Ventilador compacto para escritorio o mesa con excelente flujo de aire.",
      precio_minorista: 74900,
      precio_mayorista: 61900,
      images: ["/uploads/standing-fan-isolated-on-background-3d-rendering-illustration-png.webp"],
      categoryId: catIds["ventiladores"],
      brand: "Brisa",
      stock: 28,
      highlights: ["16 pulgadas", "3 velocidades", "Bajo ruido"],
    },
    {
      slug: "ventilador-de-pie-20-premium",
      name: "Ventilador de Pie 20'' Premium",
      description: "Ventilador de pie con altura regulable, oscilación y 3 velocidades.",
      precio_minorista: 99900,
      precio_mayorista: 82900,
      images: ["/uploads/sleek-and-stylish-electric-tower-fan-for-home-or-office-use-png.webp"],
      categoryId: catIds["ventiladores"],
      brand: "FreshAir",
      stock: 19,
      highlights: ["20 pulgadas", "Oscilante", "Altura regulable"],
    },
    {
      slug: "smart-tv-led-43-4k",
      name: "Smart TV LED 43'' 4K",
      description: "Televisor Smart 4K con apps de streaming y conectividad WiFi.",
      precio_minorista: 699000,
      precio_mayorista: 599000,
      images: ["/uploads/modern-smart-tv-technology-display-on-transparent-background-png.webp"],
      categoryId: catIds["televisores"],
      brand: "Vision",
      stock: 14,
      highlights: ["43 pulgadas", "Resolución 4K", "Smart TV"],
    },
    {
      slug: "smart-tv-led-50-uhd",
      name: "Smart TV LED 50'' UHD",
      description: "TV de gran formato con excelente calidad de imagen para entretenimiento en casa.",
      precio_minorista: 899000,
      precio_mayorista: 779000,
      images: ["/uploads/ai-generated-modern-tv-isolated-on-transparent-background-free-png.webp"],
      categoryId: catIds["televisores"],
      brand: "Vision",
      stock: 10,
      highlights: ["50 pulgadas", "UHD", "HDR"],
    },
    {
      slug: "escurridor-de-platos-doble",
      name: "Escurridor de Platos Doble Nivel",
      description: "Escurridor metálico con bandeja recolectora y gran capacidad para vajilla.",
      precio_minorista: 45900,
      precio_mayorista: 34900,
      images: ["/uploads/pngtree-dish-rack-png-image_15329213.png"],
      categoryId: catIds["escurridores"],
      brand: "KitchenPro",
      stock: 55,
      highlights: ["Doble nivel", "Bandeja recolectora", "Estructura resistente"],
    },
    {
      slug: "secador-de-pelo-profesional-2200w",
      name: "Secador de Pelo Profesional 2200W",
      description: "Secador potente con control de temperatura y velocidad para uso diario.",
      precio_minorista: 69900,
      precio_mayorista: 54900,
      images: ["/uploads/KJHHD1800-00.png"],
      categoryId: catIds["secadores"],
      brand: "BeautyLine",
      stock: 38,
      highlights: ["2200W", "2 velocidades", "Aire frío"],
    },
    {
      slug: "alisador-de-pelo-ceramica",
      name: "Alisador de Pelo Cerámica",
      description: "Plancha alisadora con placas cerámicas para un alisado uniforme y rápido.",
      precio_minorista: 57900,
      precio_mayorista: 43900,
      images: ["/uploads/pngtree-trendy-hair-straightener-png-image_11979749.png"],
      categoryId: catIds["alisadores"],
      brand: "BeautyLine",
      stock: 44,
      highlights: ["Placas cerámicas", "Calentamiento rápido", "Cable giratorio"],
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
  console.log("Done! TermoStore database seeded successfully.")
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
