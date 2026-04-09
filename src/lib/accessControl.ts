export type UserRole = "admin" | "user";
export type UserPlan = "free" | "pro";

export interface AppUser {
  email: string;
  role: UserRole;
  plan: UserPlan;
}

export const ADMIN_OVERRIDE_EMAIL = "itojeogheneyunme@gmail.com";

export function hasProAccess(user: AppUser): boolean {
  if (!user) return false;
  // Admin must be explicitly elevated to Pro (via password verification flow).
  if (user.email === ADMIN_OVERRIDE_EMAIL) return user.plan === "pro";
  if (user.plan === "pro") return true;
  return false;
}
