// Legacy helper retained for compatibility in older imports.
export function checkCreditLimit(
  userId: string,
  userPlan: "free" | "pro" | "enterprise" = "free",
  creditsUsed: number = 0
): boolean {
  void userId;
  if (userPlan === "free" && creditsUsed >= 1000) {
    return false;
  }
  return true;
}
