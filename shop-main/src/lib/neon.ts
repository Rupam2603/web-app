import { neon, neonConfig } from "@neondatabase/serverless";

// Neon credentials provided by user
export const NEON_CONNECTION_STRING =
  import.meta.env.VITE_NEON_DATABASE_URL || "";

export const NEON_DATA_API =
  import.meta.env.VITE_NEON_DATA_API || "";

export const NEON_AUTH_API =
  import.meta.env.VITE_NEON_AUTH_API || "";

export const NEON_JWKS_URL =
  import.meta.env.VITE_NEON_JWKS_URL || "";

// Configure neon HTTP driver
export const sql = neon(NEON_CONNECTION_STRING);

// Test query
export async function testNeonConnection(): Promise<boolean> {
  try {
    const result = await sql`SELECT 1 as connected`;
    console.log("Neon Postgres connected:", result);
    return true;
  } catch (err) {
    console.error("Neon Postgres connection error:", err);
    return false;
  }
}
