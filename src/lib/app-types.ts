/**
 * Application-wide TypeScript types.
 * Replaces Database["public"]["Tables"] / Database["public"]["Enums"] from Supabase.
 */

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

export type UserStatus = "active" | "inactive" | "suspended" | "pending_verification";
export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";
export type QuoteStatus = "pending" | "reviewing" | "quoted" | "accepted" | "rejected";
export type ProjectStatus = "planning" | "in_progress" | "on_hold" | "completed" | "cancelled";
export type MilestoneStatus = "pending" | "in_progress" | "completed" | "delayed";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type ServiceType = "construction" | "interiors" | "real_estate" | "hvac" | "solar";
export type TaskStatus = "todo" | "in_progress" | "done" | "blocked";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  department: string | null;
  bio: string | null;
  employee_id: string | null;
  status: UserStatus;
  last_seen: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileWithEmail extends Profile {
  email: string | null;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service: ServiceType | null;
  message: string | null;
  status: LeadStatus;
  source: string | null;
  budget_range: string | null;
  location: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuoteRequest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service_type: ServiceType | null;
  requirements: string | null;
  budget_range: string | null;
  timeline: string | null;
  location: string | null;
  status: QuoteStatus;
  ai_estimate: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  service_type: ServiceType;
  status: ProjectStatus;
  progress: number;
  location: string | null;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  subject: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  customer_id: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  category: string | null;
  published: boolean;
  published_at: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  client_name: string;
  client_role: string | null;
  company: string | null;
  content: string;
  rating: number;
  published: boolean;
  project_id: string | null;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  handled: boolean;
  created_at: string;
}

export interface StaffTask {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  assigned_by: string | null;
  status: TaskStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffSalary {
  id: string;
  staff_user_id: string;
  period_month: string;
  amount: number;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface StaffLeave {
  id: string;
  staff_user_id: string;
  from_date: string;
  to_date: string;
  leave_type: string;
  reason: string | null;
  status: string;
  created_at: string;
}

export interface Attendance {
  id: string;
  user_id: string;
  date: string;
  check_in: string;
  check_out: string | null;
  notes: string | null;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  target_email: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  user_agent: string | null;
  device_type: string | null;
  created_at: string;
  last_seen: string;
  is_active: boolean;
}

export interface ImpersonationLog {
  id: string;
  impersonator_id: string;
  target_user_id: string;
  started_at: string;
  ended_at: string | null;
}

export interface RolePermission {
  id: string;
  role: AppRole;
  module: string;
  allowed: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
}
