import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function notFound(resource: string): never {
  throw new ApiError(404, `${resource} no encontrado`);
}

export function badRequest(message: string): never {
  throw new ApiError(400, message);
}

export function conflict(message: string): never {
  throw new ApiError(409, message);
}

type RouteHandler = (
  req: Request,
  context: { params: Promise<Record<string, string>> },
) => Promise<Response>;

export function handler(fn: RouteHandler): RouteHandler {
  return async (req, context) => {
    try {
      return await fn(req, context);
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode },
        );
      }
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: "Datos invalidos", details: error.flatten().fieldErrors },
          { status: 400 },
        );
      }
      console.error(error);
      return NextResponse.json(
        { error: "Error interno del servidor" },
        { status: 500 },
      );
    }
  };
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}
