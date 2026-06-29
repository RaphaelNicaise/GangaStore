import { SignJWT, jwtVerify } from "jose"

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "termostore-jwt-secret-change-in-production",
)

const ALG = "HS256"
const EXPIRES_IN = "8h"

export interface AdminJWTPayload {
  sub: string
  role: "admin"
  email: string
}

export async function signAdminToken(email: string): Promise<string> {
  return new SignJWT({ role: "admin", email } as Omit<AdminJWTPayload, "sub">)
    .setProtectedHeader({ alg: ALG })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(secret)
}

export async function verifyAdminToken(token: string): Promise<AdminJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    if (payload.role !== "admin") return null
    return payload as unknown as AdminJWTPayload
  } catch {
    return null
  }
}
