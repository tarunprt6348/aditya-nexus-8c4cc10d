/**
 * Replit PostgreSQL connection — uses the `postgres` package (native ESM).
 * Server-only — never import this in client/browser code.
 */
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Replit PostgreSQL must be provisioned.");
}

// Main SQL instance
export const sql = postgres(process.env.DATABASE_URL, {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10,
});

/** Run a parameterized query using $1/$2/… placeholders. Returns all rows. */
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const result = params?.length
    ? await sql.unsafe<T[]>(text, params as postgres.ParameterOrJSON<never>[])
    : await sql.unsafe<T[]>(text);
  return result as unknown as T[];
}

/** Run a query and return the first row, or null. */
export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/** Run a query and return an integer count from the first row. */
export async function queryCount(text: string, params?: unknown[]): Promise<number> {
  const row = await queryOne<{ count: string }>(text, params);
  return parseInt(row?.count ?? "0", 10);
}

/** Run multiple statements in a transaction. Callback receives a sql scoped to the tx. */
export async function transaction<T>(
  fn: (tx: postgres.TransactionSql) => Promise<T>,
): Promise<T> {
  return sql.begin(fn) as Promise<T>;
}
