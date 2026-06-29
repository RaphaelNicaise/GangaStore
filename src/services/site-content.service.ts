import { PrismaClient } from "@prisma/client"
import { defaultSiteContent } from "@/lib/site-content"
import type { SiteContent } from "@/lib/types"
import { cacheDeleteByPrefix, cacheGetJSON, cacheSetJSON } from "@/lib/cache"

const prisma = new PrismaClient()
const SITE_CONTENT_CACHE_KEY = "site-content:get"

function normalizeContent(content: Partial<SiteContent> | null | undefined): SiteContent {
  const normalizedSections = (content?.sections ?? defaultSiteContent.sections)
    .map((section) => ({
      ...section,
      carousel: section.carousel ?? false,
    }))
    .sort((left, right) => left.order - right.order)

  return {
    banners: (content?.banners ?? defaultSiteContent.banners)
      .slice()
      .sort((left, right) => left.order - right.order),
    sections: normalizedSections,
  }
}

export class SiteContentService {
  static async get() {
    const cached = await cacheGetJSON<SiteContent>(SITE_CONTENT_CACHE_KEY)
    if (cached) return normalizeContent(cached)

    try {
      const record = await prisma.siteContent.findUnique({ where: { id: "global" } })
      
      if (!record) {
        await this.save(defaultSiteContent)
        return defaultSiteContent
      }

      // Convert from JSON fields
      const content: SiteContent = {
        banners: record.banners as any,
        sections: record.sections as any,
      }

      const normalized = normalizeContent(content)
      await cacheSetJSON(SITE_CONTENT_CACHE_KEY, normalized, 180)
      return normalized
    } catch (e) {
      console.error("Error reading SiteContent from DB", e)
      return defaultSiteContent
    }
  }

  static async save(content: SiteContent) {
    const normalized = normalizeContent(content)
    
    await prisma.siteContent.upsert({
      where: { id: "global" },
      update: {
        banners: normalized.banners as any,
        sections: normalized.sections as any,
      },
      create: {
        id: "global",
        banners: normalized.banners as any,
        sections: normalized.sections as any,
      },
    })

    await cacheDeleteByPrefix(SITE_CONTENT_CACHE_KEY)
    return normalized
  }
}