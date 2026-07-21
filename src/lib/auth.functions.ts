/**
 * Authentication server functions — login / logout / register / getMe / changePassword.
 * Re-exports getVerifiedUser from auth.server for convenience.
 *
 * IMPORTANT: This file must NOT statically import any *.server.* local modules because
 * it is imported by client-side route files. Server-only imports are done dynamically
 * inside handler() callbacks where TanStack Start guarantees server-only execution.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AuthUser } from "./app-types";

export type { AuthUser };

// ─── server functions ────────────────────────────────────────────────────────

const LoginSchema = z.object({
  email: z.string().trim().email().max(255).transform(s => s.toLowerCase()),
  password: z.string().min(1).max(128),
});

export const login = createServerFn({ method: "POST" })
  .validator((d: unknown) => LoginSchema.parse(d))
  .handler(async ({ data }) => {
    const { verifyPassword, signToken } = await import("./auth.server");
    const { queryOne } = await import("./db.server");

    const row = await queryOne<{ id: string; email: string; password_hash: string }>(
      `SELECT id, email, password_hash FROM public.users WHERE email = $1`,
      [data.email],
    );
    if (!row) throw new Error("Invalid email or password.");

    const ok = await verifyPassword(data.password, row.password_hash);
    if (!ok) throw new Error("Invalid email or password.");

    const profile = await queryOne<{ status: string; full_name: string | null }>(
      `SELECT status, full_name FROM public.profiles WHERE id = $1`,
      [row.id],
    );
    if (profile?.status === "suspended") throw new Error("Account is suspended. Contact support.");

    const token = signToken({ sub: row.id, email: row.email });
    return { token, userId: row.id, email: row.email, fullName: profile?.full_name ?? null };
  });

const RegisterSchema = z.object({
  email: z.string().trim().email().max(255).transform(s => s.toLowerCase()),
  password: z.string().min(6).max(128),
  full_name: z.string().trim().min(2).max(100),
});

export const register = createServerFn({ method: "POST" })
  .validator((d: unknown) => RegisterSchema.parse(d))
  .handler(async ({ data }) => {
    const { hashPassword, signToken } = await import("./auth.server");
    const { queryOne, transaction } = await import("./db.server");

    const existing = await queryOne(`SELECT id FROM public.users WHERE email = $1`, [data.email]);
    if (existing) throw new Error("An account with this email already exists.");

    const passwordHash = await hashPassword(data.password);
    let uid!: string;

    await transaction(async tx => {
      const [user] = await tx.unsafe(
        `INSERT INTO public.users (email, password_hash) VALUES ($1, $2) RETURNING id`,
        [data.email, passwordHash],
      );
      uid = user.id;
      await tx.unsafe(
        `INSERT INTO public.profiles (id, full_name, status) VALUES ($1, $2, 'active')`,
        [uid, data.full_name],
      );
      await tx.unsafe(
        `INSERT INTO public.user_roles (user_id, role) VALUES ($1, 'customer')`,
        [uid],
      );
    });

    const token = signToken({ sub: uid, email: data.email });
    return { token, userId: uid, email: data.email, fullName: data.full_name };
  });

export const getMe = createServerFn({ method: "GET" })
  .handler(async () => {
    const { getVerifiedUser } = await import("./auth.server");
    const { query } = await import("./db.server");

    const user = await getVerifiedUser();
    if (!user) return null;

    const roles = await query<{ role: string }>(
      `SELECT role FROM public.user_roles WHERE user_id = $1`,
      [user.id],
    );
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      roles: roles.map(r => r.role),
    };
  });

export const logout = createServerFn({ method: "POST" })
  .handler(async () => {
    return { ok: true };
  });

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(128),
});

export const changePassword = createServerFn({ method: "POST" })
  .validator((d: unknown) => ChangePasswordSchema.parse(d))
  .handler(async ({ data }) => {
    const { hashPassword, verifyPassword } = await import("./auth.server");
    const { getVerifiedUser } = await import("./auth.server");
    const { queryOne, query } = await import("./db.server");

    const user = await getVerifiedUser();
    if (!user) throw new Error("Not authenticated.");

    const row = await queryOne<{ password_hash: string }>(
      `SELECT password_hash FROM public.users WHERE id = $1`,
      [user.id],
    );
    if (!row) throw new Error("User not found.");

    const ok = await verifyPassword(data.currentPassword, row.password_hash);
    if (!ok) throw new Error("Current password is incorrect.");

    const newHash = await hashPassword(data.newPassword);
    await query(`UPDATE public.users SET password_hash = $1, updated_at = now() WHERE id = $2`, [newHash, user.id]);
    return { ok: true };
  });
