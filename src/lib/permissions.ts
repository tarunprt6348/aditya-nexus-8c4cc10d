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
  | "finance"
  | "clients"
  | "employees"
  | "vendors"
  | "materials"
  | "equipment"
  | "procurement"
  | "documents"
  | "site_monitoring"
  | "quality"
  | "safety"
  | "scheduling"
  | "system";

const DEFAULT_PERMISSIONS: Record<AppRole, Module[]> = {
  owner: [
    "dashboard","leads","quotes","projects","tickets","hr","blog","team",
    "testimonials","messages","users","audit","permissions","tasks","leaves",
    "reports","finance","clients","employees","vendors","materials","equipment",
    "procurement","documents","site_monitoring","quality","safety","scheduling","system",
  ],
  admin: [
    "dashboard","leads","quotes","projects","tickets","hr","blog","team",
    "testimonials","messages","users","audit","permissions","tasks","leaves",
    "reports","finance","clients","employees","vendors","materials","equipment",
    "procurement","documents","site_monitoring","quality","safety","scheduling","system",
  ],
  managing_director: [
    "dashboard","projects","quotes","leads","hr","reports","finance","tickets","team",
    "clients","employees","vendors","procurement","documents","scheduling",
  ],
  operations_manager: [
    "dashboard","projects","quotes","tickets","tasks","messages","leads","team",
    "clients","materials","equipment","site_monitoring","scheduling","documents","vendors",
  ],
  hr_manager: ["dashboard","hr","leaves","tasks","team","employees","scheduling"],
  sales_manager: ["dashboard","leads","quotes","tasks","messages","reports","clients"],
  marketing_manager: ["dashboard","blog","testimonials","leads","messages","clients"],
  accountant: ["dashboard","finance","reports","quotes","procurement"],
  sales_executive: ["dashboard","leads","tasks","clients"],
  project_manager: ["dashboard","projects","tasks","quotes","site_monitoring","scheduling","documents","materials","equipment","quality","safety"],
  site_engineer: ["dashboard","projects","tasks","site_monitoring","quality","safety","materials"],
  customer_support: ["dashboard","tickets","messages","tasks","clients"],
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

export const ADMIN_AREA_ROLES: AppRole[] = [
  "owner","admin","managing_director","operations_manager",
  "hr_manager","sales_manager","marketing_manager","accountant",
];

export const STAFF_AREA_ROLES: AppRole[] = [
  "staff","sales_executive","project_manager","site_engineer",
  "customer_support","general_staff",
];

export function getAreaForRole(role: AppRole): "admin" | "staff" | "portal" {
  if (ADMIN_AREA_ROLES.includes(role)) return "admin";
  if (STAFF_AREA_ROLES.includes(role)) return "staff";
  return "portal";
}

export const ALL_MODULES: Module[] = [
  "dashboard", "leads", "quotes", "projects", "tickets", "hr", "blog", "team",
  "testimonials", "messages", "users", "audit", "permissions", "tasks", "leaves",
  "reports", "finance", "clients", "employees", "vendors", "materials", "equipment",
  "procurement", "documents", "site_monitoring", "quality", "safety", "scheduling", "system",
];
