/**
 * Owner-only admin user management server functions.
 * Replaces Supabase admin.auth.* — all operations go directly to the local DB.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getVerifiedUser } from "./auth.functions";
import { query, queryOne, transaction } from "./db.server";
import { hashPassword } from "./auth.server";

const TEMP_PASSWORD = "Demo_Lost.experts.reassigned";

async function requireOwner() {
  const user = await getVerifiedUser();
  if (!user) throw new Error("Unauthorized: not authenticated.");
  const isOwner = await queryOne(
    `SELECT 1 FROM public.user_roles WHERE user_id = $1 AND role = 'owner'`,
    [user.id],
  );
  if (!isOwner) throw new Error("Forbidden: owner role required.");
  return user;
}

const InviteSchema = z.object({
  email: z.string().email().max(255).transform(s => s.toLowerCase()),
  name: z.string().min(1).max(100),
  role: z.string().min(1),
});

export const inviteUser = createServerFn({ method: "POST" })
  .validator((d: unknown) => InviteSchema.parse(d))
  .handler(async ({ data }) => {
    const actor = await requireOwner();

    const existing = await queryOne(`SELECT id FROM public.users WHERE email = $1`, [data.email]);
    if (existing) throw new Error("A user with this email already exists.");

    const passwordHash = await hashPassword(TEMP_PASSWORD);
    let uid!: string;

    await transaction(async tx => {
      const [user] = await tx.unsafe(
        `INSERT INTO public.users (email, password_hash) VALUES ($1, $2) RETURNING id`,
        [data.email, passwordHash],
      );
      uid = user.id;
      await tx.unsafe(
        `INSERT INTO public.profiles (id, full_name, status) VALUES ($1, $2, 'active')`,
        [uid, data.name],
      );
      await tx.unsafe(
        `INSERT INTO public.user_roles (user_id, role) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role`,
        [uid, data.role],
      );
      await tx.unsafe(
        `INSERT INTO public.audit_logs (actor_id, actor_email, action, target_type, target_id, target_email, metadata)
         VALUES ($1, $2, 'user_created', 'user', $3, $4, $5)`,
        [actor.id, actor.email, uid, data.email, JSON.stringify({ role: data.role, name: data.name })],
      );
    });

    return {
      userId: uid!,
      temporaryPassword: TEMP_PASSWORD,
      inviteLink: null,
    };
  });

const ResetSchema = z.object({
  targetEmail: z.string().email(),
  targetId: z.string().uuid(),
  newPassword: z.string().min(6).max(128).optional(),
});

export const sendPasswordReset = createServerFn({ method: "POST" })
  .validator((d: unknown) => ResetSchema.parse(d))
  .handler(async ({ data }) => {
    const actor = await requireOwner();
    const newPw = data.newPassword ?? TEMP_PASSWORD;
    const hash = await hashPassword(newPw);

    await query(
      `UPDATE public.users SET password_hash = $1, updated_at = now() WHERE email = $2`,
      [hash, data.targetEmail],
    );
    await query(
      `INSERT INTO public.audit_logs (actor_id, actor_email, action, target_type, target_id, target_email, metadata)
       VALUES ($1, $2, 'password_reset_sent', 'user', $3, $4, '{}')`,
      [actor.id, actor.email, data.targetId, data.targetEmail],
    );

    return { resetLink: null, temporaryPassword: newPw };
  });
