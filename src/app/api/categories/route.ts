import { handler, ok, created, noContent, badRequest } from "@/lib/api";
import { CategoryService } from "@/services/category.service";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export const GET = handler(async (req) => {
  const ip =
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const rl = rateLimit(`get-categories:${ip}`, 120, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    ) as never;
  }

  const id = new URL(req.url).searchParams.get("id");
  if (id) return ok(await CategoryService.findById(id));
  return ok(await CategoryService.findAll());
});

export const POST = handler(async (req) => {
  return created(await CategoryService.create(await req.json()));
});

export const PUT = handler(async (req) => {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) badRequest("id requerido");
  return ok(await CategoryService.update(id, await req.json()));
});

export const DELETE = handler(async (req) => {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) badRequest("id requerido");
  await CategoryService.delete(id);
  return noContent();
});
