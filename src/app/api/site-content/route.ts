export const dynamic = "force-dynamic"
import { handler, ok } from "@/lib/api"
import { SiteContentService } from "@/services/site-content.service"

export const GET = handler(async () => {
  return ok(await SiteContentService.get())
})

export const PUT = handler(async (req) => {
  return ok(await SiteContentService.save(await req.json()))
})