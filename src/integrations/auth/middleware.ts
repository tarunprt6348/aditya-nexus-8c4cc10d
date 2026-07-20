/**
 * TanStack Start middleware for the new local auth.
 *
 * attachAuth  — client middleware: reads JWT from localStorage, adds Authorization header
 * requireAuth — server middleware: reads Authorization header, verifies JWT, attaches userId
 */
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { verifyToken, extractBearerToken } from "@/lib/auth.server";
import { queryOne } from "@/lib/db.server";

// ─── client middleware ───────────────────────────────────────────────────────

export const attachAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const { getStoredToken } = await import("./client");
    const token = getStoredToken();
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);

// ─── server middleware ───────────────────────────────────────────────────────

export const requireAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const req = getRequest();
    const authHeader = req?.headers?.get("authorization") ?? null;
    const token = extractBearerToken(authHeader);

    if (!token) throw new Error("Unauthorized: no session token.");

    const payload = verifyToken(token);
    if (!payload?.sub) throw new Error("Unauthorized: invalid token.");

    // Confirm user still active
    const row = await queryOne<{ status: string }>(
      `SELECT status FROM public.profiles WHERE id = $1`,
      [payload.sub],
    );
    if (!row || row.status === "suspended") throw new Error("Unauthorized: account inactive.");

    return next({
      context: {
        userId: payload.sub,
        email: payload.email,
      },
    });
  },
);
