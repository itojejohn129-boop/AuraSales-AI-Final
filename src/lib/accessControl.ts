export type UserRole = "admin" | "user";
export type UserPlan = "free" | "pro";

export interface AppUser {
  email: string;
  role: UserRole;
  plan: UserPlan;
}

export const ADMIN_OVERRIDE_EMAILS = [
  "itojeogheneyunme@gmail.com",
  "abdulhammedmuhammedawwal@gmail.com",
  "animashaunjafar01@gmail.com",
] as const;
export const ADMIN_OVERRIDE_EMAIL = ADMIN_OVERRIDE_EMAILS[0];

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase();
  return ADMIN_OVERRIDE_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === normalized);
}

export function hasProAccess(user: AppUser): boolean {
  if (!user) return false;
  // Admin must be explicitly elevated to Pro (via password verification flow).
  if (isAdminEmail(user.email)) return user.plan === "pro";
  if (user.plan === "pro") return true;
  return false;
}
