import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { defaultSiteContent } from "@/lib/site-content"
import type { SiteContent } from "@/lib/types"
import { cacheDeleteByPrefix, cacheGetJSON, cacheSetJSON } from "@/lib/cache"

const siteContentFile = path.join(process.cwd(), "data", "site-content.json")
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
      const raw = await readFile(siteContentFile, "utf8")
      const normalized = normalizeContent(JSON.parse(raw) as SiteContent)
      await cacheSetJSON(SITE_CONTENT_CACHE_KEY, normalized, 180)
      return normalized
    } catch {
      await this.save(defaultSiteContent)
      return defaultSiteContent
    }
  }

  static async save(content: SiteContent) {
    const normalized = normalizeContent(content)
    await mkdir(path.dirname(siteContentFile), { recursive: true })
    await writeFile(siteContentFile, JSON.stringify(normalized, null, 2), "utf8")
    await cacheDeleteByPrefix(SITE_CONTENT_CACHE_KEY)
    return normalized
  }
}