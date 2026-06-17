-- Migration: Revoke legacy role-mutation RPCs from authenticated users
-- These functions (set_user_role, revoke_user_role) pre-date the owner-only
-- RBAC system and allowed any admin to escalate roles, including to owner.
-- Owner-only mutations now go through owner_set_user_role (SECURITY DEFINER,
-- checks has_role(caller, 'owner')). The legacy functions are revoked here.

-- Revoke execute from authenticated (blocks all non-superuser callers)
REVOKE EXECUTE ON FUNCTION public.set_user_role(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.revoke_user_role(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.set_user_role(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.revoke_user_role(uuid, text) FROM anon;

-- Also revoke from public to close any residual grant paths
REVOKE EXECUTE ON FUNCTION public.set_user_role(uuid, text) FROM public;
REVOKE EXECUTE ON FUNCTION public.revoke_user_role(uuid, text) FROM public;
