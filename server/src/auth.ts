import type { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { config } from "./config.js";

export type Role = "customer" | "retailer" | "admin" | "delivery_partner";

export interface Principal {
  userId: string;
  role: Role;
  claims: JWTPayload;
}

const jwks = createRemoteJWKSet(new URL(config.jwksUrl));

function roleFromClaims(claims: JWTPayload): Role {
  const role = claims.role || (claims["https://subhone/role"] as string | undefined);
  if (role === "admin" || role === "retailer" || role === "delivery_partner") return role;
  return "customer";
}

export async function verifyAccessToken(token: string): Promise<Principal> {
  const { payload } = await jwtVerify(token, jwks, {
    issuer: config.issuer,
    audience: config.audience,
  });
  const userId = String(payload.sub || "");
  if (!userId) throw new Error("Invalid identity");
  return { userId, role: roleFromClaims(payload), claims: payload };
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Authentication required" });
    (req as Request & { principal: Principal }).principal =
      await verifyAccessToken(header.slice("Bearer ".length));
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired access token" });
  }
}

export function principal(req: Request): Principal {
  return (req as Request & { principal: Principal }).principal;
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const p = principal(req);
    if (!roles.includes(p.role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}
