/**
 * Role utilities — no Supabase dependency.
 * DB operations are now done via data.functions.ts server functions.
 */
import { insertAuditLog } from "./data.functions";

export type AppRole =
  | "owner"
  | "admin"
  | "managing_director"
  | "operations_manager"
  | "hr_manager"
  | "sales_manager"
  | "sales_executive"
  | "marketing_manager"
  | "accountant"
  | "project_manager"
  | "site_engineer"
  | "customer_support"
  | "general_staff"
  | "staff"
  | "customer";

// Keep backward-compatible alias
export type Role = AppRole;

export const ROLE_LABELS: Record<AppRole, string> = {
  owner: "Owner",
  admin: "Admin",
  managing_director: "Managing Director",
  operations_manager: "Operations Manager",
  hr_manager: "HR Manager",
  sales_manager: "Sales Manager",
  sales_executive: "Sales Executive",
  marketing_manager: "Marketing Manager",
  accountant: "Accountant",
  project_manager: "Project Manager",
  site_engineer: "Site Engineer",
  customer_support: "Customer Support",
  general_staff: "General Staff",
  staff: "Staff",
  customer: "Client",
};

// Priority order for determining primary role
export const ROLE_PRIORITY: AppRole[] = [
  "owner", "admin", "managing_director", "operations_manager",
  "hr_manager", "sales_manager", "marketing_manager", "accountant",
  "sales_executive", "project_manager", "site_engineer", "customer_support",
  "general_staff", "staff", "customer",
];

export function getPrimaryRole(roles: AppRole[]): AppRole {
  for (const r of ROLE_PRIORITY) {
    if (roles.includes(r)) return r;
  }
  return "customer";
}

export function homeForRole(role: AppRole): "/admin" | "/staff" | "/portal" {
  if ([
    "owner", "admin", "managing_director", "operations_manager",
    "hr_manager", "sales_manager", "marketing_manager", "accountant",
  ].includes(role)) return "/admin";
  if ([
    "staff", "sales_executive", "project_manager", "site_engineer",
    "customer_support", "general_staff",
  ].includes(role)) return "/staff";
  return "/portal";
}

export async function logAudit(params: {
  actorId: string;
  actorEmail: string;
  action: string;
  targetType?: string;
  targetId?: string;
  targetEmail?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await insertAuditLog({
      data: {
        actor_id: params.actorId,
        actor_email: params.actorEmail,
        action: params.action,
        target_type: params.targetType,
        target_id: params.targetId,
        target_email: params.targetEmail,
        metadata: params.metadata ?? {},
      },
    });
  } catch (e) {
    // Non-blocking — audit failures should not break main flow
    console.error("[logAudit] failed:", e);
  }
}
