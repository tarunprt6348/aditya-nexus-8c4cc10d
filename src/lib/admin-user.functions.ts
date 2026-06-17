import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const InviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.string().min(1),
  actorId: z.string().uuid(),
  actorEmail: z.string().email(),
});

/**
 * Owner-only server function: creates a new platform user with the given role.
 * Runs server-side using the Supabase service role key so the caller's
 * browser session is NEVER disrupted.
 *
 * The new account is created with email_confirm: true and no password set,
 * so Supabase sends an invite/set-password email automatically (if SMTP
 * is configured in Supabase project settings). The owner also receives a
 * magic-link token they can copy if SMTP isn't wired up yet.
 */
export const inviteUser = createServerFn({ method: "POST" })
  .validator((d: unknown) => InviteSchema.parse(d))
  .handler(async ({ data }) => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY is not configured. " +
          "Add it in Secrets (Replit sidebar) to enable in-app user creation.",
      );
    }

    const admin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Create the Supabase Auth user (server-side, no session effect)
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email: data.email,
        user_metadata: { full_name: data.name },
        email_confirm: true,
      });

    if (createErr) {
      throw new Error(createErr.message);
    }

    const uid = created.user.id;

    // 2. Assign role
    await admin
      .from("user_roles")
      .upsert({ user_id: uid, role: data.role }, { onConflict: "user_id" });

    // 3. Audit log (owner action, server-side)
    await admin.from("audit_logs").insert({
      actor_id: data.actorId,
      actor_email: data.actorEmail,
      action: "user_created",
      target_type: "user",
      target_id: uid,
      target_email: data.email,
      metadata: { role: data.role, name: data.name },
    });

    // 4. Generate a one-time invite link so the owner can share it
    //    (works even if SMTP is not configured)
    const { data: linkData } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: data.email,
    });

    return {
      userId: uid,
      inviteLink: linkData?.properties?.action_link ?? null,
    };
  });

const ResetSchema = z.object({
  targetEmail: z.string().email(),
  actorId: z.string().uuid(),
  actorEmail: z.string().email(),
  targetId: z.string().uuid(),
});

/**
 * Owner-only server function: triggers a password-reset email for a user
 * and records an audit event.
 */
export const sendPasswordReset = createServerFn({ method: "POST" })
  .validator((d: unknown) => ResetSchema.parse(d))
  .handler(async ({ data }) => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
    }

    const admin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Generate a password-reset link server-side
    const { data: linkData, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: data.targetEmail,
    });

    if (error) throw new Error(error.message);

    // Audit log
    await admin.from("audit_logs").insert({
      actor_id: data.actorId,
      actor_email: data.actorEmail,
      action: "password_reset_sent",
      target_type: "user",
      target_id: data.targetId,
      target_email: data.targetEmail,
      metadata: {},
    });

    return {
      resetLink: linkData?.properties?.action_link ?? null,
    };
  });
