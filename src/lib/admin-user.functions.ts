import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { getWebRequest } from "@tanstack/react-start/server";

/**
 * Returns a Supabase admin client (service role) for server-side use.
 * Throws if the service role key is not configured.
 */
function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured. Add it in Replit Secrets.",
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Extracts the caller's JWT from the Authorization header and verifies it
 * server-side. Returns the verified user object.
 * Throws with HTTP-401 semantics if the token is missing or invalid.
 */
async function getVerifiedCaller() {
  const req = getWebRequest();
  const authHeader = req?.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new Error("Unauthorized: no session token.");

  const admin = getAdminClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new Error("Unauthorized: invalid token.");
  return data.user;
}

/**
 * Verifies the caller is an owner. Returns { id, email } of the verified owner.
 * Throws if the caller is not authenticated or not an owner.
 */
async function requireOwner() {
  const admin = getAdminClient();
  const caller = await getVerifiedCaller();

  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", caller.id);

  const isOwner = (roles ?? []).some((r) => r.role === "owner");
  if (!isOwner) throw new Error("Forbidden: owner role required.");

  return { id: caller.id, email: caller.email ?? "" };
}

// ---------------------------------------------------------------------------
// Invite schema — actorId/actorEmail removed; derived server-side from token
// ---------------------------------------------------------------------------
const InviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.string().min(1),
});

/**
 * Owner-only server function: creates a new platform user with the given role.
 * Runs server-side using the Supabase service role key so the caller's
 * browser session is NEVER disrupted. Caller is verified as owner from JWT.
 */
export const inviteUser = createServerFn({ method: "POST" })
  .validator((d: unknown) => InviteSchema.parse(d))
  .handler(async ({ data }) => {
    const actor = await requireOwner();
    const admin = getAdminClient();

    // 1. Create the Supabase Auth user (server-side, no session effect)
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email: data.email,
        user_metadata: { full_name: data.name },
        email_confirm: true,
      });
    if (createErr) throw new Error(createErr.message);

    const uid = created.user.id;

    // 2. Assign role
    await admin
      .from("user_roles")
      .upsert({ user_id: uid, role: data.role }, { onConflict: "user_id" });

    // 3. Audit log — actor derived from verified JWT, not client input
    await admin.from("audit_logs").insert({
      actor_id: actor.id,
      actor_email: actor.email,
      action: "user_created",
      target_type: "user",
      target_id: uid,
      target_email: data.email,
      metadata: { role: data.role, name: data.name },
    });

    // 4. Generate a one-time invite link so the owner can share it
    const { data: linkData } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: data.email,
    });

    return {
      userId: uid,
      inviteLink: linkData?.properties?.action_link ?? null,
    };
  });

// ---------------------------------------------------------------------------
const ResetSchema = z.object({
  targetEmail: z.string().email(),
  targetId: z.string().uuid(),
});

/**
 * Owner-only server function: generates a password-reset link and records
 * an audit event. Caller is verified as owner from JWT (not trusted input).
 */
export const sendPasswordReset = createServerFn({ method: "POST" })
  .validator((d: unknown) => ResetSchema.parse(d))
  .handler(async ({ data }) => {
    const actor = await requireOwner();
    const admin = getAdminClient();

    const { data: linkData, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: data.targetEmail,
    });
    if (error) throw new Error(error.message);

    await admin.from("audit_logs").insert({
      actor_id: actor.id,
      actor_email: actor.email,
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
