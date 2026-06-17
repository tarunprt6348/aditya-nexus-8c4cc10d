import type { AppRole } from "./roles";

export type Module =
  | "dashboard"
  | "leads"
  | "quotes"
  | "projects"
  | "tickets"
  | "hr"
  | "blog"
  | "team"
  | "testimonials"
  | "messages"
  | "users"
  | "audit"
  | "permissions"
  | "tasks"
  | "leaves"
  | "reports"
  | "finance";

// Default permission matrix — can be overridden by role_permissions table
const DEFAULT_PERMISSIONS: Record<AppRole, Module[]> = {
  owner: [
    "dashboard","leads","quotes","projects","tickets","hr","blog","team",
    "testimonials","messages","users","audit","permissions","tasks","leaves",
    "reports","finance",
  ],
  admin: [
    "dashboard","leads","quotes","projects","tickets","hr","blog","team",
    "testimonials","messages","users","audit","permissions","tasks","leaves",
    "reports","finance",
  ],
  managing_director: [
    "dashboard","projects","quotes","leads","hr","reports","finance","tickets","team",
  ],
  operations_manager: [
    "dashboard","projects","quotes","tickets","tasks","messages","leads","team",
  ],
  hr_manager: ["dashboard","hr","leaves","tasks","team"],
  sales_manager: ["dashboard","leads","quotes","tasks","messages","reports"],
  marketing_manager: ["dashboard","blog","testimonials","leads","messages"],
  accountant: ["dashboard","finance","reports","quotes"],
  sales_executive: ["dashboard","leads","tasks"],
  project_manager: ["dashboard","projects","tasks","quotes"],
  site_engineer: ["dashboard","projects","tasks"],
  customer_support: ["dashboard","tickets","messages","tasks"],
  general_staff: ["dashboard","tasks","leaves"],
  staff: ["dashboard","tasks","leaves"],
  customer: ["dashboard"],
};

export function getDefaultModules(role: AppRole): Module[] {
  return DEFAULT_PERMISSIONS[role] ?? ["dashboard"];
}

export function hasModuleAccess(
  role: AppRole,
  module: Module,
  overrides?: Partial<Record<Module, boolean>>
): boolean {
  if (overrides && module in overrides) return !!overrides[module];
  return DEFAULT_PERMISSIONS[role]?.includes(module) ?? false;
}

// Roles that use the admin (/admin) layout
export const ADMIN_AREA_ROLES: AppRole[] = [
  "owner","admin","managing_director","operations_manager",
  "hr_manager","sales_manager","marketing_manager","accountant",
];

// Roles that use the staff (/staff) layout
export const STAFF_AREA_ROLES: AppRole[] = [
  "staff","sales_executive","project_manager","site_engineer",
  "customer_support","general_staff",
];

export function getAreaForRole(role: AppRole): "admin" | "staff" | "portal" {
  if (ADMIN_AREA_ROLES.includes(role)) return "admin";
  if (STAFF_AREA_ROLES.includes(role)) return "staff";
  return "portal";
}
