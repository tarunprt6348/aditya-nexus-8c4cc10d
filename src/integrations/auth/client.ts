/**
 * Client-side auth helpers.
 * Stores the JWT token in localStorage and provides session management.
 */

const TOKEN_KEY = "ac_token";

export interface StoredSession {
  token: string;
  userId: string;
  email: string;
  fullName: string | null;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function storeSession(session: StoredSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, session.token);
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("ac_impersonating");
  localStorage.removeItem("ac_impersonation_session");
}

export function isAuthenticated(): boolean {
  return !!getStoredToken();
}
