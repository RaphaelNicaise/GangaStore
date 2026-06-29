import { handler, ok, created, noContent, badRequest } from "@/lib/api";
import { ProductService } from "@/services/product.service";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export const GET = handler(async (req) => {
  const ip =
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const rl = rateLimit(`get-products:${ip}`, 120, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    ) as never;
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const ids = searchParams.get("ids");
  const brandsOnly = searchParams.get("brandsOnly");
  if (id) return ok(await ProductService.findById(id));
  if (ids) {
    const idList = ids.split(",").filter(Boolean);
    const items = await Promise.all(idList.map((i) => ProductService.findById(i).catch(() => null)));
    return ok({ data: items.filter(Boolean) });
  }
  if (brandsOnly === "true") return ok({ data: await ProductService.listBrands() });
  return ok(await ProductService.findAll(searchParams));
});

export const POST = handler(async (req) => {
  return created(await ProductService.create(await req.json()));
});

export const PUT = handler(async (req) => {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) badRequest("id requerido");
  return ok(await ProductService.update(id, await req.json()));
});

export const DELETE = handler(async (req) => {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) badRequest("id requerido");
  await ProductService.delete(id);
  return noContent();
});
