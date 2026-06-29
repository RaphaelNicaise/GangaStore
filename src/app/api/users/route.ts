import { handler, ok, created, noContent, badRequest } from "@/lib/api";
import { UserService } from "@/services/user.service";

export const GET = handler(async (req) => {
  const id = new URL(req.url).searchParams.get("id");
  if (id) return ok(await UserService.findById(id));
  return ok(await UserService.findAll());
});

export const POST = handler(async (req) => {
  return created(await UserService.create(await req.json()));
});

export const PUT = handler(async (req) => {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) badRequest("id requerido");
  return ok(await UserService.update(id, await req.json()));
});

export const DELETE = handler(async (req) => {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) badRequest("id requerido");
  await UserService.delete(id);
  return noContent();
});
