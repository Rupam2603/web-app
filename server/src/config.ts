import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export const config = {
  port: Number(process.env.PORT || 8080),
  databaseUrl: required("DATABASE_URL"),
  jwksUrl: required("AUTH_JWKS_URL"),
  issuer: process.env.AUTH_ISSUER || undefined,
  audience: process.env.AUTH_AUDIENCE || undefined,
  corsOrigins: (process.env.CORS_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean),
};
