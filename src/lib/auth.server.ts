/**
 * Server-side auth utilities: bcrypt password hashing + JWT sign/verify.
 * Also exports getVerifiedUser — the canonical way to read the caller's identity inside server handlers.
 * Never import this file in client/browser code.
 */
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getRequest } from "@tanstack/react-start/server";
import { queryOne } from "./db.server";
import type { AuthUser } from "./app-types";

const _rawSecret = process.env.SESSION_SECRET;
if (!_rawSecret && process.env.NODE_ENV === "production") {
  throw new Error("SESSION_SECRET must be set in production. Add it as a Replit Secret.");
}
const JWT_SECRET = _rawSecret ?? "aditya-constructions-dev-only-secret";
const JWT_EXPIRES = "7d";

export interface JWTPayload {
  sub: string;  // user id
  email: string;
  iat?: number;
  exp?: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/** Extract bearer token from Authorization header. */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

function getToken(): string | null {
  const req = getRequest();
  const authHeader = req?.headers?.get("authorization") ?? null;
  return extractBearerToken(authHeader);
}

/** Verify the JWT from the current request and return the caller's identity, or null. */
export async function getVerifiedUser(): Promise<AuthUser | null> {
  const token = getToken();
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload?.sub) return null;
  const row = await queryOne<{ id: string; email: string; full_name: string | null; status: string }>(
    `SELECT p.id, u.email, p.full_name, p.status
     FROM public.profiles p
     JOIN public.users u ON u.id = p.id
     WHERE p.id = $1`,
    [payload.sub],
  );
  if (!row || row.status === "suspended") return null;
  return { id: row.id, email: row.email, full_name: row.full_name };
}
